import type {
  PaisaruleStorageBackupV1Scope,
} from "./paisaruleStorageBackupV1Crypto.js";

export interface PaisaruleStorageBackupV1ExportDependencies {
  createPayload: (
    storageBytes: Uint8Array,
    backupBytes: Uint8Array,
    scope: PaisaruleStorageBackupV1Scope,
    createdAt: string,
  ) => Buffer;

  encryptPayload: (
    payload: Uint8Array,
    key: Uint8Array,
    scope: PaisaruleStorageBackupV1Scope,
    createdAt: string,
  ) => string;
}

export interface PaisaruleStorageBackupV1ExportResult {
  fileName: string;
  fileContents: string;
  createdAt: string;
  plaintextBytes: number;
  encryptedBytes: number;
}

function fail(code: string): never {
  throw new Error(code);
}

function sanitizeFileSegment(
  value: string,
  fallback: string,
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const safe = value
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, "_")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .trim()
    .slice(0, 60);

  return safe || fallback;
}

export function createPaisaruleStorageBackupV1FileName(
  businessName: string,
  branchName: string,
  date: Date = new Date(),
): string {
  if (
    !(date instanceof Date) ||
    !Number.isFinite(date.getTime())
  ) {
    return fail("BACKUP_FILENAME_DATE_INVALID");
  }

  const business = sanitizeFileSegment(
    businessName,
    "Business",
  );

  const branch = sanitizeFileSegment(
    branchName,
    "Branch",
  );

  const pad = (value: number): string =>
    String(value).padStart(2, "0");

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = String(date.getFullYear());

  const hour = date.getHours();
  const hour12 = hour % 12 || 12;

  const time =
    `${pad(hour12)}.${pad(date.getMinutes())}` +
    (hour >= 12 ? "PM" : "AM");

  return (
    `Backup_${business}_${branch}_` +
    `${day}-${month}-${year}_${time}.paisarule`
  );
}

export function createPaisaruleStorageBackupV1Export(
  storageBytes: Uint8Array,
  backupBytes: Uint8Array,
  scope: PaisaruleStorageBackupV1Scope,
  key: Uint8Array,
  dependencies: PaisaruleStorageBackupV1ExportDependencies,
  businessName: string,
  branchName: string,
  createdAtInput = new Date().toISOString(),
): PaisaruleStorageBackupV1ExportResult {
  if (
    !(storageBytes instanceof Uint8Array) ||
    !(backupBytes instanceof Uint8Array) ||
    !(key instanceof Uint8Array) ||
    key.byteLength !== 32
  ) {
    if (key instanceof Uint8Array) {
      key.fill(0);
    }

    return fail("BACKUP_EXPORT_INPUT_INVALID");
  }

  const date = new Date(createdAtInput);

  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString() !== createdAtInput
  ) {
    key.fill(0);
    return fail("BACKUP_TIMESTAMP_INVALID");
  }

  let payload: Buffer | null = null;

  try {
    payload = dependencies.createPayload(
      storageBytes,
      backupBytes,
      scope,
      createdAtInput,
    );

    if (
      !Buffer.isBuffer(payload) ||
      payload.length === 0
    ) {
      return fail("BACKUP_PAYLOAD_CREATION_FAILED");
    }

    const plaintextBytes = payload.length;

    const fileContents = dependencies.encryptPayload(
      payload,
      key,
      scope,
      createdAtInput,
    );

    if (
      typeof fileContents !== "string" ||
      fileContents.length === 0 ||
      fileContents.includes("finora-storage.json") ||
      fileContents.includes("finora-storage.backup.json")
    ) {
      return fail("BACKUP_ENCRYPTION_OUTPUT_INVALID");
    }

    return {
      fileName: createPaisaruleStorageBackupV1FileName(
        businessName,
        branchName,
        date,
      ),
      fileContents,
      createdAt: createdAtInput,
      plaintextBytes,
      encryptedBytes: Buffer.byteLength(
        fileContents,
        "utf8",
      ),
    };
  } finally {
    payload?.fill(0);
    key.fill(0);
  }
}