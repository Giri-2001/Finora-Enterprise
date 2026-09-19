/* ============================================================
   FINORA ENTERPRISE

   PORTABLE BRANCH AUTH RESTORE CONTRACT

   Phase 5.6O-O1

   SECURITY MODEL

   Restore is intentionally session-less.

   A lost / unreadable Portable Auth source may prevent normal
   login-session creation. Therefore Restore must establish its
   authority independently:

   1. authenticate current Branch Credential with Username +
      Password;
   2. decrypt the backup's exact embedded Portable Auth envelope
      with Password + Security Code;
   3. cross-check authenticated credential authority against the
      authenticated inner Portable Auth payload;
   4. require exact authGeneration equality;
   5. require exact storage-mode equality;
   6. require exact Owner / Business / Branch scope equality.

   Backup wrapper metadata is transport / corruption evidence
   only. It is never Restore authorization.

   Renderer Restore credentials contain no:
   - sessionId
   - ownerId
   - businessId
   - branchId
   - storageMode
   - authGeneration
   - source path
   - destination path
   - serialized backup bytes

   Native privileged transport supplies backup bytes and target
   selection separately.
   ============================================================ */

export type FinoraPortableBranchAuthRestoreStorageMode =
  | "LOCAL"
  | "USB";

export interface FinoraPortableBranchAuthRestoreCredentialRequest {
  username:
    string;

  password:
    string;

  securityCode:
    string;
}

export interface FinoraPortableBranchAuthRestoreScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export type FinoraPortableBranchAuthRestoreGenerationDecision =
  | "MATCH"
  | "STALE_BACKUP"
  | "FUTURE_BACKUP";

export type FinoraPortableBranchAuthRestoreErrorCode =
  | "INVALID_REQUEST"
  | "BACKUP_INVALID"
  | "CREDENTIAL_AUTHENTICATION_FAILED"
  | "BACKUP_AUTHENTICATION_FAILED"
  | "SCOPE_MISMATCH"
  | "STORAGE_MODE_MISMATCH"
  | "STALE_BACKUP"
  | "FUTURE_BACKUP"
  | "CERTIFICATION_AUTHORITY_MISSING"
  | "TARGET_UNAVAILABLE"
  | "TARGET_WRITE_FAILED"
  | "TARGET_READBACK_FAILED"
  | "RESTORE_FAILED";

const RESTORE_CREDENTIAL_KEYS =
  [
    "username",
    "password",
    "securityCode",
  ] as const;

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function hasExactKeys(
  value:
    Record<string, unknown>,
  expected:
    readonly string[],
): boolean {
  const actual =
    Object.keys(
      value,
    ).sort();

  const wanted =
    [...expected].sort();

  if (
    actual.length !==
    wanted.length
  ) {
    return false;
  }

  return actual.every(
    (
      key,
      index,
    ) =>
      key ===
        wanted[index],
  );
}

function isNonEmptyString(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function isPositiveSafeInteger(
  value:
    unknown,
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isSafeInteger(
      value,
    ) &&
    value >
      0
  );
}

/**
 * Strict renderer-facing credential request parser.
 *
 * Password and Security Code are preserved byte-for-byte as JS
 * strings. They are NOT trimmed, normalized or canonicalized.
 *
 * Username is trimmed only to reject accidental surrounding
 * whitespace before existing credential authentication performs
 * its authoritative username canonicalization.
 */
export function sanitizeFinoraPortableBranchAuthRestoreCredentialRequest(
  input:
    unknown,
):
  FinoraPortableBranchAuthRestoreCredentialRequest |
  null {

  if (
    !isRecord(
      input,
    ) ||
    !hasExactKeys(
      input,
      RESTORE_CREDENTIAL_KEYS,
    ) ||
    !isNonEmptyString(
      input.username,
    ) ||
    !isNonEmptyString(
      input.password,
    ) ||
    !isNonEmptyString(
      input.securityCode,
    )
  ) {
    return null;
  }

  return {
    username:
      input.username.trim(),

    password:
      input.password,

    securityCode:
      input.securityCode,
  };
}

/**
 * Restore never silently advances or rolls back credential
 * lineage.
 *
 * Only an exact generation match is eligible.
 */
export function evaluateFinoraPortableBranchAuthRestoreGeneration(
  backupGeneration:
    number,
  currentGeneration:
    number,
):
  FinoraPortableBranchAuthRestoreGenerationDecision {

  if (
    !isPositiveSafeInteger(
      backupGeneration,
    ) ||
    !isPositiveSafeInteger(
      currentGeneration,
    )
  ) {
    throw new Error(
      "Restore authGeneration values must be positive safe integers.",
    );
  }

  if (
    backupGeneration <
    currentGeneration
  ) {
    return "STALE_BACKUP";
  }

  if (
    backupGeneration >
    currentGeneration
  ) {
    return "FUTURE_BACKUP";
  }

  return "MATCH";
}

export function isFinoraPortableBranchAuthRestoreScopeMatch(
  backupScope:
    FinoraPortableBranchAuthRestoreScope,
  currentScope:
    FinoraPortableBranchAuthRestoreScope,
): boolean {
  return (
    backupScope.ownerId ===
      currentScope.ownerId &&
    backupScope.businessId ===
      currentScope.businessId &&
    backupScope.branchId ===
      currentScope.branchId
  );
}

export function isFinoraPortableBranchAuthRestoreStorageModeMatch(
  backupStorageMode:
    FinoraPortableBranchAuthRestoreStorageMode,
  currentStorageMode:
    FinoraPortableBranchAuthRestoreStorageMode,
): boolean {
  return (
    backupStorageMode ===
    currentStorageMode
  );
}