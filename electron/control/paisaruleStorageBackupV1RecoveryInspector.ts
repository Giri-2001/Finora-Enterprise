import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

// PAISARULE_C117_R278_RECOVERY_INSPECTOR
// Read-only. No rename, deletion, write or USB selection.
// A legacy incomplete marker does not contain original hashes.
// Therefore no automatic recovery is authorized here.

const PRIMARY = "finora-storage.json";
const SECONDARY = "finora-storage.backup.json";
const MARKER = "paisarule-restore-incomplete";
const MAX_BYTES = 32 * 1024 * 1024;
const HASH = /^[a-f0-9]{64}$/i;

export interface PaisaruleRecoveryEvidenceV1 {
  // Trusted native evidence only, never renderer input.
  expectedPrimarySha256: string;
  expectedSecondarySha256: string;
}

export type PaisaruleRecoveryInspectionV1 =
  | { status: "NO_INCOMPLETE_MARKER" }
  | { status: "TRUSTED_EVIDENCE_REQUIRED" }
  | { status: "MANUAL_REVIEW_REQUIRED" }
  | {
      status: "VERIFIED_PREDECESSOR";
      currentStoragePresent: boolean;
      // This status is NOT authorization to rename folders.
    };

function sha(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function regularFile(
  filename: string,
): Promise<Buffer> {
  const info = await fs.lstat(filename);

  if (
    !info.isFile() ||
    info.isSymbolicLink() ||
    info.size <= 0 ||
    info.size > MAX_BYTES
  ) {
    throw new Error("RECOVERY_FILE_INVALID");
  }

  const bytes = await fs.readFile(filename);

  if (bytes.length !== info.size) {
    bytes.fill(0);
    throw new Error("RECOVERY_FILE_CHANGED");
  }

  return bytes;
}

async function directory(
  filename: string,
): Promise<void> {
  const info = await fs.lstat(filename);
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error("RECOVERY_DIRECTORY_INVALID");
  }
}

async function verifyOriginals(
  filename: string,
  evidence: PaisaruleRecoveryEvidenceV1,
): Promise<void> {
  await directory(filename);

  const entries = (await fs.readdir(filename)).sort();

  if (
    entries.join("|") !==
    [PRIMARY, SECONDARY].sort().join("|")
  ) {
    throw new Error("RECOVERY_UNKNOWN_STORAGE_FILES");
  }

  const primary = await regularFile(
    path.win32.join(filename, PRIMARY),
  );

  try {
    const secondary = await regularFile(
      path.win32.join(filename, SECONDARY),
    );

    try {
      if (
        sha(primary).toLowerCase() !==
          evidence.expectedPrimarySha256.toLowerCase() ||
        sha(secondary).toLowerCase() !==
          evidence.expectedSecondarySha256.toLowerCase()
      ) {
        throw new Error("RECOVERY_PREDECESSOR_HASH_MISMATCH");
      }
    } finally {
      secondary.fill(0);
    }
  } finally {
    primary.fill(0);
  }
}

export async function inspectPaisaruleCrashRecoveryV1(
  branchRoot: string,
  evidence?: PaisaruleRecoveryEvidenceV1,
): Promise<PaisaruleRecoveryInspectionV1> {
  if (
    process.platform !== "win32" ||
    typeof branchRoot !== "string" ||
    !path.win32.isAbsolute(branchRoot)
  ) {
    return { status: "MANUAL_REVIEW_REQUIRED" };
  }

  const root = path.win32.resolve(branchRoot);
  const driveRoot = path.win32.parse(root).root;

  if (
    !/^[A-Za-z]:\\$/.test(driveRoot) ||
    root.toLowerCase() === driveRoot.toLowerCase()
  ) {
    return { status: "MANUAL_REVIEW_REQUIRED" };
  }

  const finora = path.win32.join(root, "FINORA");
  const marker = path.win32.join(finora, MARKER);

  try {
    await directory(root);
    await directory(finora);

    let markerExists = false;

    try {
      await fs.lstat(marker);
      markerExists = true;
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== "ENOENT"
      ) {
        throw error;
      }
    }

    if (!markerExists) {
      return { status: "NO_INCOMPLETE_MARKER" };
    }

    const markerBytes = await regularFile(marker);

    try {
      if (
        markerBytes.toString("utf8") !==
        "PAISARULE_FOLDER_RESTORE_V1\n"
      ) {
        return { status: "MANUAL_REVIEW_REQUIRED" };
      }
    } finally {
      markerBytes.fill(0);
    }

    if (
      !evidence ||
      !HASH.test(evidence.expectedPrimarySha256) ||
      !HASH.test(evidence.expectedSecondarySha256)
    ) {
      return { status: "TRUSTED_EVIDENCE_REQUIRED" };
    }

    const entries = await fs.readdir(finora);

    const predecessors = entries.filter(
      name => name.startsWith(".paisarule-before-"),
    );

    if (predecessors.length !== 1) {
      return { status: "MANUAL_REVIEW_REQUIRED" };
    }

    const predecessor = path.win32.join(
      finora,
      predecessors[0],
    );

    await verifyOriginals(predecessor, evidence);

    const storage = path.win32.join(finora, "storage");
    let storagePresent = false;

    try {
      await directory(storage);
      storagePresent = true;
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== "ENOENT"
      ) {
        throw error;
      }
    }

    return {
      status: "VERIFIED_PREDECESSOR",
      currentStoragePresent: storagePresent,
    };
  } catch {
    return { status: "MANUAL_REVIEW_REQUIRED" };
  }
}