import { createHash, timingSafeEqual } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import * as path from "node:path";

const MAX_FILE_SIZE = 32 * 1024 * 1024;

const FILE_NAMES = [
  "finora-storage.json",
  "finora-storage.backup.json",
] as const;

export interface PaisaruleV1SourceFingerprint {
  readonly digest: string;
}

export interface PaisaruleV1SourceFingerprintDeps {
  realpath(value: string): Promise<string>;
  lstat(value: string): Promise<{
    isDirectory(): boolean;
    isFile(): boolean;
    isSymbolicLink(): boolean;
    size: number;
  }>;
  readFile(value: string): Promise<Uint8Array>;
}

const defaultDeps: PaisaruleV1SourceFingerprintDeps = {
  realpath,
  lstat,
  readFile,
};

function fail(code: string): never {
  throw new Error(code);
}

function inside(
  parent: string,
  candidate: string,
): boolean {
  const relative = path.relative(parent, candidate);

  return relative.length > 0 &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative);
}

/**
 * Read-only source snapshot fingerprint.
 *
 * Binds the canonical USB root path and the SHA256
 * digests of both storage files.
 *
 * This is NOT a physical USB hardware identifier.
 * The caller must independently enforce authenticated
 * USB/device authority when required.
 *
 * Never return storage record contents to renderer.
 */
export async function capturePaisaruleV1SourceFingerprint(
  trustedUsbRoot: string,
  deps: PaisaruleV1SourceFingerprintDeps = defaultDeps,
): Promise<PaisaruleV1SourceFingerprint> {
  if (
    typeof trustedUsbRoot !== "string" ||
    !path.isAbsolute(trustedUsbRoot)
  ) {
    return fail("BACKUP_SOURCE_ROOT_INVALID");
  }

  const rootInfo = await deps.lstat(trustedUsbRoot);

  if (
    rootInfo.isSymbolicLink() ||
    !rootInfo.isDirectory()
  ) {
    return fail("BACKUP_SOURCE_ROOT_INVALID");
  }

  const canonicalRoot = await deps.realpath(
    trustedUsbRoot,
  );

  if (!path.isAbsolute(canonicalRoot)) {
    return fail("BACKUP_SOURCE_ROOT_INVALID");
  }

  const storageDir = path.join(
    canonicalRoot,
    "FINORA",
    "storage",
  );

  const canonicalDir = await deps.realpath(storageDir);

  if (!inside(canonicalRoot, canonicalDir)) {
    return fail("BACKUP_SOURCE_PATH_INVALID");
  }

  const dirStat = await deps.lstat(storageDir);

  if (
    dirStat.isSymbolicLink() ||
    !dirStat.isDirectory()
  ) {
    return fail("BACKUP_SOURCE_PATH_INVALID");
  }

  const parts: string[] = [
    "PAISARULE_V1_SOURCE_FINGERPRINT",
    canonicalRoot,
  ];

  for (const name of FILE_NAMES) {
    const filePath = path.join(storageDir, name);
    const canonicalFile = await deps.realpath(filePath);

    if (
      !inside(canonicalDir, canonicalFile) ||
      path.basename(canonicalFile) !== name
    ) {
      return fail("BACKUP_SOURCE_FILE_PATH_INVALID");
    }

    const stat = await deps.lstat(filePath);

    if (
      stat.isSymbolicLink() ||
      !stat.isFile() ||
      !Number.isSafeInteger(stat.size) ||
      stat.size <= 0 ||
      stat.size > MAX_FILE_SIZE
    ) {
      return fail("BACKUP_SOURCE_FILE_INVALID");
    }

    const bytes = await deps.readFile(canonicalFile);

    try {
      if (bytes.byteLength !== stat.size) {
        return fail("BACKUP_SOURCE_FILE_CHANGED");
      }

      const hash = createHash("sha256")
        .update(bytes)
        .digest("hex");

      parts.push(name, String(stat.size), hash);
    } finally {
      // readFile creates owned bytes for this operation.
      bytes.fill(0);
    }
  }

  const digest = createHash("sha256")
    .update(JSON.stringify(parts))
    .digest("hex");

  return Object.freeze({ digest });
}

export function matchPaisaruleV1SourceFingerprint(
  expected: PaisaruleV1SourceFingerprint,
  actual: PaisaruleV1SourceFingerprint,
): boolean {
  if (
    !expected ||
    !actual ||
    typeof expected.digest !== "string" ||
    typeof actual.digest !== "string" ||
    !/^[a-f0-9]{64}$/.test(expected.digest) ||
    !/^[a-f0-9]{64}$/.test(actual.digest)
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(expected.digest, "hex"),
    Buffer.from(actual.digest, "hex"),
  );
}