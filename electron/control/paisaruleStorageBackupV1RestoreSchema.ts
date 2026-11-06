import { Buffer } from "node:buffer";

// ============================================================
// PAISARULE_R175_C63
// RESTORE STORAGE PACKAGE V2 SCHEMA VALIDATION
//
// Mirrors existing Electron Main normalizeUsbStoragePackage
// contract. Does not modify the decrypted storage bytes.
//
// Structural validation only. Record-level business rules,
// ownership consistency and cross-record referential
// integrity remain separate requirements.
// ============================================================

function fail(code: string): never {
  throw new Error(code);
}

export function validatePaisaruleRestoreStorageV2(
  fileBytes: Buffer,
  fileKind: "PRIMARY" | "SECONDARY",
): void {
  if (
    !Buffer.isBuffer(fileBytes) ||
    fileBytes.length === 0
  ) {
    fail("RESTORE_STORAGE_BYTES_INVALID");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(fileBytes.toString("utf8"));
  } catch {
    fail("RESTORE_STORAGE_JSON_INVALID");
  }

  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    fail("RESTORE_STORAGE_PACKAGE_INVALID");
  }

  const storage = parsed as Record<string, unknown>;

  if (
    storage.version !== "2.0" ||
    !Array.isArray(storage.records)
  ) {
    fail("RESTORE_STORAGE_VERSION_OR_RECORDS_INVALID");
  }

  for (const record of storage.records) {
    if (
      record === null ||
      typeof record !== "object" ||
      Array.isArray(record)
    ) {
      fail("RESTORE_STORAGE_RECORD_INVALID");
    }
  }

  // Existing Windows normalization accepts missing/non-string
  // updatedAt and supplies a current timestamp. Do not alter
  // original backup bytes here.
  void fileKind;
}