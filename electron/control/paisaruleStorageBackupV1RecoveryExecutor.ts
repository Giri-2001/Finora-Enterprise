import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import {
  inspectPaisaruleCrashRecoveryV1,
  type PaisaruleRecoveryEvidenceV1,
} from "./paisaruleStorageBackupV1RecoveryInspector.js";

import type {
  PaisaruleFolderTransactionAuthorityV1,
} from "./paisaruleStorageBackupV1FolderTransaction.js";

// PAISARULE_C117_R280_RECOVERY_EXECUTOR
//
// Deliberately NOT wired to Electron Main or renderer.
// Native trusted evidence and current branch authority required.
// Only recovers when the active storage directory is absent.
// Never overwrites published storage or changes a WALLET record.

const PRIMARY = "finora-storage.json";
const SECONDARY = "finora-storage.backup.json";
const MARKER = "paisarule-restore-incomplete";
const LIMIT = 32 * 1024 * 1024;
const HASH = /^[a-f0-9]{64}$/i;

export interface PaisaruleMissingStorageRecoveryResultV1 {
  recovered: true;
  originalPrimarySha256: string;
  originalSecondarySha256: string;
}

function reject(code: string): never {
  throw new Error(code);
}

async function exactFileHash(
  file: string,
): Promise<string> {
  const info = await fs.lstat(file);

  if (
    !info.isFile() ||
    info.isSymbolicLink() ||
    info.size <= 0 ||
    info.size > LIMIT
  ) {
    reject("RECOVERY_SNAPSHOT_INVALID");
  }

  const bytes = await fs.readFile(file);

  try {
    if (bytes.length !== info.size) {
      reject("RECOVERY_SNAPSHOT_CHANGED");
    }

    return createHash("sha256")
      .update(bytes)
      .digest("hex");
  } finally {
    bytes.fill(0);
  }
}

async function assertOriginalSnapshots(
  storage: string,
  evidence: PaisaruleRecoveryEvidenceV1,
): Promise<void> {
  const info = await fs.lstat(storage);

  if (!info.isDirectory() || info.isSymbolicLink()) {
    reject("RECOVERY_STORAGE_DIRECTORY_INVALID");
  }

  const files = (await fs.readdir(storage)).sort();

  if (
    files.join("|") !==
    [PRIMARY, SECONDARY].sort().join("|")
  ) {
    reject("RECOVERY_UNEXPECTED_STORAGE_FILES");
  }

  const primary = await exactFileHash(
    path.win32.join(storage, PRIMARY),
  );
  const secondary = await exactFileHash(
    path.win32.join(storage, SECONDARY),
  );

  if (
    primary.toLowerCase() !==
      evidence.expectedPrimarySha256.toLowerCase() ||
    secondary.toLowerCase() !==
      evidence.expectedSecondarySha256.toLowerCase()
  ) {
    reject("RECOVERY_STORAGE_HASH_MISMATCH");
  }
}

export async function recoverPaisaruleMissingStorageV1(
  branchRoot: string,
  evidence: PaisaruleRecoveryEvidenceV1,
  authority: PaisaruleFolderTransactionAuthorityV1,
): Promise<PaisaruleMissingStorageRecoveryResultV1> {
  if (
    process.platform !== "win32" ||
    typeof branchRoot !== "string" ||
    !path.win32.isAbsolute(branchRoot) ||
    !evidence ||
    !HASH.test(evidence.expectedPrimarySha256) ||
    !HASH.test(evidence.expectedSecondarySha256) ||
    !authority ||
    typeof authority.withExclusiveStorageAccess !== "function" ||
    typeof authority.assertCurrentAuthority !== "function"
  ) {
    reject("RECOVERY_AUTHORITY_INVALID");
  }

  const root = path.win32.resolve(branchRoot);
  const driveRoot = path.win32.parse(root).root;

  if (
    !/^[A-Za-z]:\\$/.test(driveRoot) ||
    root.toLowerCase() === driveRoot.toLowerCase()
  ) {
    reject("RECOVERY_BRANCH_FOLDER_REQUIRED");
  }

  return authority.withExclusiveStorageAccess(async () => {
    await authority.assertCurrentAuthority();

    const inspection = await inspectPaisaruleCrashRecoveryV1(
      root,
      evidence,
    );

    if (inspection.status !== "VERIFIED_PREDECESSOR") {
      reject("RECOVERY_PREDECESSOR_NOT_VERIFIED");
    }

    // Published storage may contain a completed transaction.
    // Such cases require a separate manual review.
    if (inspection.currentStoragePresent) {
      reject("RECOVERY_PUBLISHED_STORAGE_PRESENT");
    }

    const finora = path.win32.join(root, "FINORA");
    const storage = path.win32.join(finora, "storage");
    const marker = path.win32.join(finora, MARKER);

    const entries = await fs.readdir(finora);
    const predecessors = entries.filter(
      name =>
        /^\.paisarule-before-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          name,
        ),
    );

    if (predecessors.length !== 1) {
      reject("RECOVERY_PREDECESSOR_AMBIGUOUS");
    }

    // Reject additional predecessor-like entries, including
    // unexpected names, rather than guessing which is valid.
    if (
      entries.filter(
        name => name.startsWith(".paisarule-before-"),
      ).length !== 1
    ) {
      reject("RECOVERY_UNEXPECTED_PREDECESSOR");
    }

    const predecessor = path.win32.join(
      finora,
      predecessors[0],
    );

    await assertOriginalSnapshots(predecessor, evidence);
    await authority.assertCurrentAuthority();

    // The destination must still be absent immediately before
    // rename. Rename itself must fail if it unexpectedly exists.
    try {
      await fs.lstat(storage);
      reject("RECOVERY_DESTINATION_ALREADY_EXISTS");
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== "ENOENT"
      ) {
        throw error;
      }
    }

    // No overwrite or deletion. Original files are moved back.
    await fs.rename(predecessor, storage);

    // Failure here leaves the marker intact (fail closed).
    await assertOriginalSnapshots(storage, evidence);
    await authority.assertCurrentAuthority();

    await fs.unlink(marker);

    return {
      recovered: true as const,
      originalPrimarySha256:
        evidence.expectedPrimarySha256.toLowerCase(),
      originalSecondarySha256:
        evidence.expectedSecondarySha256.toLowerCase(),
    };
  });
}