import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export interface PaisaruleFolderRestoreScopeV1 {
  ownerId: string;
  businessId: string;
  branchId: string;
}

export interface PaisaruleFolderSafetyRequestV1 {
  // Must come from privileged Electron Main, never renderer input.
  branchRoot: string;
  scope: PaisaruleFolderRestoreScopeV1;
  isCurrent(): boolean;
}

export interface PaisaruleFolderSafetyResultV1 {
  readonly branchRoot: string;
  readonly primarySha256: string;
  readonly secondarySha256: string;
  readonly preservedWalletRecords: number;
  readonly businessRecords: 0;
}

function reject(code: string): never {
  throw new Error(code);
}

function equalPath(a: string, b: string): boolean {
  return path.resolve(a).toLowerCase() ===
    path.resolve(b).toLowerCase();
}

function assertCurrent(
  request: PaisaruleFolderSafetyRequestV1,
): void {
  if (!request.isCurrent()) {
    reject("RESTORE_SESSION_CHANGED");
  }
}

async function realDirectory(
  directory: string,
): Promise<void> {
  const stat = await fs.lstat(directory);

  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    reject("RESTORE_FOLDER_INVALID");
  }

  const real = await fs.realpath(directory);

  if (!equalPath(directory, real)) {
    reject("RESTORE_FOLDER_ALIAS_REJECTED");
  }
}

async function readStorage(
  filename: string,
): Promise<{
  sha256: string;
  records: unknown[];
}> {
  const stat = await fs.lstat(filename);

  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.size <= 0 ||
    stat.size > 32 * 1024 * 1024
  ) {
    reject("RESTORE_STORAGE_FILE_INVALID");
  }

  const bytes = await fs.readFile(filename);

  if (bytes.length !== stat.size) {
    reject("RESTORE_STORAGE_READ_CHANGED");
  }

  const sha256 = createHash("sha256")
    .update(bytes)
    .digest("hex");

  let parsed: unknown;

  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch {
    reject("RESTORE_STORAGE_JSON_INVALID");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    reject("RESTORE_STORAGE_SCHEMA_INVALID");
  }

  const packageObject = parsed as Record<string, unknown>;

  if (
    packageObject.version !== "2.0" ||
    !Array.isArray(packageObject.records)
  ) {
    reject("RESTORE_STORAGE_SCHEMA_INVALID");
  }

  return {
    sha256,
    records: packageObject.records,
  };
}

function checkRecords(
  records: unknown[],
  scope: PaisaruleFolderRestoreScopeV1,
): number {
  let walletCount = 0;

  for (const item of records) {
    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      reject("RESTORE_EXISTING_RECORD_INVALID");
    }

    const record = item as Record<string, unknown>;

    if (
      record.ownerId !== scope.ownerId ||
      record.businessId !== scope.businessId ||
      record.branchId !== scope.branchId
    ) {
      reject("RESTORE_EXISTING_RECORD_SCOPE_MISMATCH");
    }

    if (record.entity !== "WALLET") {
      reject("RESTORE_EXISTING_BUSINESS_DATA_PRESENT");
    }

    walletCount += 1;

    if (walletCount > 1) {
      reject("RESTORE_DUPLICATE_WALLET_RECORD");
    }
  }

  return walletCount;
}

/**
 * Restore-only, strictly read-only preliminary safety check.
 *
 * This does NOT establish physical USB identity, authorize
 * a write, lock the storage, or commit a Restore.
 *
 * Electron Main must independently bind the active session,
 * selected folder, physical USB and transaction identity.
 */
export async function inspectPaisaruleFolderRestoreSafetyV1(
  request: PaisaruleFolderSafetyRequestV1,
): Promise<PaisaruleFolderSafetyResultV1> {
  if (
    !request ||
    typeof request.branchRoot !== "string" ||
    !path.isAbsolute(request.branchRoot) ||
    typeof request.isCurrent !== "function" ||
    !request.scope
  ) {
    reject("RESTORE_FOLDER_AUTHORITY_INVALID");
  }

  const scope = request.scope;

  if (
    !scope.ownerId ||
    !scope.businessId ||
    !scope.branchId
  ) {
    reject("RESTORE_FOLDER_SCOPE_INVALID");
  }

  assertCurrent(request);

  const root = path.resolve(request.branchRoot);
  const driveRoot = path.parse(root).root;

  // A drive root cannot be used as a branch destination.
  if (equalPath(root, driveRoot)) {
    reject("RESTORE_DRIVE_ROOT_REJECTED");
  }

  await realDirectory(driveRoot);
  await realDirectory(root);

  const finora = path.join(root, "FINORA");
  const storage = path.join(finora, "storage");

  await realDirectory(finora);
  await realDirectory(storage);

  // C117-R312: An existing journal or incomplete marker
  // requires recovery review, never another restore.
  for (const name of [
    "paisarule-restore-journal-v2.json",
    "paisarule-restore-incomplete",
  ]) {
    const artifact = path.join(finora, name);

    try {
      await fs.lstat(artifact);
      reject("RESTORE_PENDING_RECOVERY_REVIEW");
    } catch (error) {
      if (
        !error ||
        typeof error !== "object" ||
        !("code" in error) ||
        error.code !== "ENOENT"
      ) {
        throw error;
      }
    }
  }

  assertCurrent(request);

  const primary = await readStorage(
    path.join(storage, "finora-storage.json"),
  );

  const secondary = await readStorage(
    path.join(storage, "finora-storage.backup.json"),
  );

  assertCurrent(request);

  const walletCount = checkRecords(
    primary.records,
    scope,
  );

  // For this first version, only an empty secondary
  // snapshot is eligible for migration.
  if (secondary.records.length !== 0) {
    reject("RESTORE_EXISTING_SECONDARY_DATA_PRESENT");
  }

  assertCurrent(request);

  return {
    branchRoot: root,
    primarySha256: primary.sha256,
    secondarySha256: secondary.sha256,
    preservedWalletRecords: walletCount,
    businessRecords: 0,
  };
}