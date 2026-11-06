import { Buffer } from "node:buffer";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const PRIMARY = "finora-storage.json";
const SECONDARY = "finora-storage.backup.json";
const MARKER = "paisarule-restore-incomplete";
const LIMIT = 32 * 1024 * 1024;

export interface PaisaruleFolderTransactionInputV1 {
  // Trusted authenticated native folder. Never renderer-supplied.
  branchRoot: string;
  expectedPrimarySha256: string;
  expectedSecondarySha256: string;
  mergedPrimary: Uint8Array;
  mergedSecondary: Uint8Array;
}

export interface PaisaruleFolderTransactionAuthorityV1 {
  // Must own a lock shared by ALL regular storage writers.
  withExclusiveStorageAccess<T>(
    operation: () => Promise<T>,
  ): Promise<T>;

  // Session, branch folder, removable volume identity.
  // Must not call the marker-blocked storage read API.
  assertCurrentAuthority(): Promise<void>;
}

export interface PaisaruleFolderTransactionResultV1 {
  installed: true;
  primarySha256: string;
  secondarySha256: string;
  predecessorDirectory: string;
}

function fail(code: string): never {
  throw new Error(code);
}

function digest(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function isMissing(error: unknown): boolean {
  return !!error && typeof error === "object" &&
    "code" in error && error.code === "ENOENT";
}

function samePath(a: string, b: string): boolean {
  return path.resolve(a).toLowerCase() ===
    path.resolve(b).toLowerCase();
}

async function directory(realPath: string): Promise<void> {
  const stat = await fs.lstat(realPath);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    fail("RESTORE_TRANSACTION_DIRECTORY_INVALID");
  }
  if (!samePath(realPath, await fs.realpath(realPath))) {
    fail("RESTORE_TRANSACTION_DIRECTORY_ALIAS");
  }
}

async function readExactFile(filename: string): Promise<Buffer> {
  const stat = await fs.lstat(filename);
  if (!stat.isFile() || stat.isSymbolicLink() ||
      stat.size === 0 || stat.size > LIMIT) {
    fail("RESTORE_TRANSACTION_FILE_INVALID");
  }

  const bytes = await fs.readFile(filename);
  if (bytes.length !== stat.size) {
    fail("RESTORE_TRANSACTION_READ_CHANGED");
  }
  return bytes;
}

async function assertOriginal(
  storage: string,
  input: PaisaruleFolderTransactionInputV1,
): Promise<void> {
  const [primary, secondary] = await Promise.all([
    readExactFile(path.join(storage, PRIMARY)),
    readExactFile(path.join(storage, SECONDARY)),
  ]);
  try {
    if (digest(primary) !== input.expectedPrimarySha256 ||
        digest(secondary) !== input.expectedSecondarySha256) {
      fail("RESTORE_TRANSACTION_DESTINATION_CHANGED");
    }
  } finally {
    primary.fill(0);
    secondary.fill(0);
  }
}

async function writeExact(
  filename: string,
  content: Buffer,
): Promise<void> {
  const handle = await fs.open(filename, "wx", 0o600);
  try {
    await handle.writeFile(content);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function assertPublished(
  directoryPath: string,
  primary: Buffer,
  secondary: Buffer,
): Promise<void> {
  const [readPrimary, readSecondary] = await Promise.all([
    readExactFile(path.join(directoryPath, PRIMARY)),
    readExactFile(path.join(directoryPath, SECONDARY)),
  ]);
  try {
    if (!readPrimary.equals(primary) ||
        !readSecondary.equals(secondary)) {
      fail("RESTORE_TRANSACTION_READBACK_FAILED");
    }
  } finally {
    readPrimary.fill(0);
    readSecondary.fill(0);
  }
}

/**
 * Branch-folder transaction primitive.
 *
 * Caller must first validate encrypted backup, exact scope,
 * merge semantics, physical USB identity and write exclusion.
 *
 * No caller is currently connected to this function.
 *
 * On successful install, predecessor storage is retained for
 * recovery. On interrupted/error paths, the marker is retained
 * unless predecessor rollback is fully verified.
 */
export async function commitPaisaruleFolderStorageV1(
  input: PaisaruleFolderTransactionInputV1,
  authority: PaisaruleFolderTransactionAuthorityV1,
): Promise<PaisaruleFolderTransactionResultV1> {
  if (
    process.platform !== "win32" ||
    !input ||
    typeof input.branchRoot !== "string" ||
    !path.win32.isAbsolute(input.branchRoot) ||
    !authority ||
    typeof authority.withExclusiveStorageAccess !== "function" ||
    typeof authority.assertCurrentAuthority !== "function" ||
    !/^[a-f0-9]{64}$/i.test(input.expectedPrimarySha256) ||
    !/^[a-f0-9]{64}$/i.test(input.expectedSecondarySha256)
  ) {
    fail("RESTORE_TRANSACTION_AUTHORITY_INVALID");
  }

  if (!(input.mergedPrimary instanceof Uint8Array) ||
      !(input.mergedSecondary instanceof Uint8Array) ||
      input.mergedPrimary.length === 0 ||
      input.mergedPrimary.length > LIMIT ||
      input.mergedSecondary.length === 0 ||
      input.mergedSecondary.length > LIMIT) {
    fail("RESTORE_TRANSACTION_DATA_INVALID");
  }

  const primary = Buffer.from(input.mergedPrimary);
  const secondary = Buffer.from(input.mergedSecondary);

  // Both snapshots must contain complete, consistent data.
  // In particular, never publish an old empty secondary.
  if (!primary.equals(secondary)) {
    primary.fill(0);
    secondary.fill(0);
    fail("RESTORE_TRANSACTION_SNAPSHOT_MISMATCH");
  }

  try {
    return await authority.withExclusiveStorageAccess(async () => {
      const root = path.win32.resolve(input.branchRoot);
      const drive = path.win32.parse(root).root;

      if (!/^[A-Za-z]:\\$/.test(drive) ||
          samePath(root, drive)) {
        fail("RESTORE_TRANSACTION_BRANCH_ROOT_REQUIRED");
      }

      const finora = path.win32.join(root, "FINORA");
      const storage = path.win32.join(finora, "storage");
      const marker = path.win32.join(finora, MARKER);
      const suffix = randomUUID();
      const staging = path.win32.join(
        finora, ".paisarule-stage-" + suffix,
      );
      const predecessor = path.win32.join(
        finora, ".paisarule-before-" + suffix,
      );
      const failed = path.win32.join(
        finora, ".paisarule-failed-" + suffix,
      );

      await authority.assertCurrentAuthority();
      await directory(root);
      await directory(finora);
      await directory(storage);

      // Do not silently discard unknown storage files.
      const entries = (await fs.readdir(storage)).sort();
      if (entries.join("|") !== [SECONDARY, PRIMARY].sort().join("|")) {
        fail("RESTORE_TRANSACTION_UNEXPECTED_STORAGE_FILES");
      }

      await assertOriginal(storage, input);
      await authority.assertCurrentAuthority();

      let markerOwned = false;
      let predecessorMoved = false;
      let published = false;

      try {
        // Exclusive marker blocks new guarded storage operations.
        await writeExact(
          marker,
          Buffer.from("PAISARULE_FOLDER_RESTORE_V1\n", "utf8"),
        );
        markerOwned = true;

        await fs.mkdir(staging);
        await writeExact(path.win32.join(staging, PRIMARY), primary);
        await writeExact(path.win32.join(staging, SECONDARY), secondary);
        await assertPublished(staging, primary, secondary);

        await authority.assertCurrentAuthority();
        await assertOriginal(storage, input);

        await fs.rename(storage, predecessor);
        predecessorMoved = true;

        await authority.assertCurrentAuthority();
        await fs.rename(staging, storage);
        published = true;

        await assertPublished(storage, primary, secondary);
        await authority.assertCurrentAuthority();

        // Successful commit: predecessor remains untouched.
        await fs.unlink(marker);
        markerOwned = false;

        return {
          installed: true as const,
          primarySha256: digest(primary),
          secondarySha256: digest(secondary),
          predecessorDirectory: predecessor,
        };
      } catch (error) {
        // No automatic deletion of predecessor or business data.
        // Only restore an exact, verified predecessor.
        if (markerOwned && predecessorMoved) {
          try {
            if (published) {
              await fs.rename(storage, failed);
            }
            await fs.rename(predecessor, storage);
            await assertOriginal(storage, input);

            // Only a verified rollback may clear the marker.
            await fs.unlink(marker);
            markerOwned = false;
          } catch {
            // Keep marker: manual recovery audit is required.
          }
        }

        // A marker can remain even when publication never
        // started. This intentionally fails closed.
        throw error;
      }
    });
  } finally {
    primary.fill(0);
    secondary.fill(0);
  }
}