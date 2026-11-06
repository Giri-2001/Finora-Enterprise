/**
 * PAISARULE C117-R19
 *
 * Lost USB Restore authorization boundary.
 *
 * This module NEVER grants authorization locally.
 * Only a dedicated privileged server verifier may
 * authorize a lost-USB Business Backup recovery.
 *
 * The existing first-login bootstrap is NOT a
 * substitute for this recovery authorization.
 *
 * No filesystem writes. No implicit LOCAL fallback.
 */

export const PAISARULE_LOST_USB_RESTORE_PURPOSE =
  "LOST_USB_BUSINESS_BACKUP_RESTORE" as const;

export interface PaisaruleVerifiedBackupScopeV1 {
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
  canonicalUsername: string;
  storageMode: "USB";
}

export interface PaisaruleLostUsbRecoveryCredentialsV1 {
  username: string;
  password: string;
  securityCode: string;
}

export interface PaisaruleLostUsbServerAuthorityV1 {
  purpose: typeof PAISARULE_LOST_USB_RESTORE_PURPOSE;
  role: "OWNER";
  storageMode: "USB";
  dataContext: "REAL";

  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
  canonicalUsername: string;

  authGeneration: number;

  /**
   * Must be true only after validating server-issued
   * recovery evidence and its trusted signature.
   */
  signedRecoveryVerified: true;

  /**
   * The dedicated server recovery authority must
   * explicitly permit recovery without the old USB.
   */
  sourceAbsentRecoveryAuthorized: true;
}

export type PaisaruleLostUsbServerVerificationV1 =
  | {
      success: true;
      authority: PaisaruleLostUsbServerAuthorityV1;
    }
  | {
      success: false;
      errorCode: string;
    };

export interface PaisaruleLostUsbRecoveryDependenciesV1 {
  /**
   * A future server client MUST implement this.
   * A renderer callback or client-side boolean is
   * never acceptable as an authorization source.
   */
  verifyDedicatedServerRecovery(
    credentials: PaisaruleLostUsbRecoveryCredentialsV1,
    expectedBackup: PaisaruleVerifiedBackupScopeV1,
  ): Promise<PaisaruleLostUsbServerVerificationV1>;
}

function fail(code: string): never {
  throw new Error(code);
}

function validId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value
  );
}

function validUsername(value: unknown): value is string {
  return (
    validId(value) &&
    value.length <= 100 &&
    value === value.normalize("NFKC").toLowerCase()
  );
}

/**
 * This gate must receive the backup scope only from
 * a separately authenticated/decrypted backup.
 *
 * It does not verify the backup cryptography itself.
 *
 * A missing dedicated server verifier always fails.
 */
export async function authorizePaisaruleLostUsbRestoreV1(
  credentials: PaisaruleLostUsbRecoveryCredentialsV1,
  verifiedBackup: PaisaruleVerifiedBackupScopeV1,
  dependencies: PaisaruleLostUsbRecoveryDependenciesV1,
): Promise<PaisaruleLostUsbServerAuthorityV1> {
  if (
    !credentials ||
    !validId(credentials.username) ||
    typeof credentials.password !== "string" ||
    credentials.password.length === 0 ||
    typeof credentials.securityCode !== "string" ||
    credentials.securityCode.length === 0
  ) {
    fail("RESTORE_RECOVERY_CREDENTIALS_INVALID");
  }

  if (
    !verifiedBackup ||
    verifiedBackup.storageMode !== "USB" ||
    !validId(verifiedBackup.userId) ||
    !validId(verifiedBackup.ownerId) ||
    !validId(verifiedBackup.businessId) ||
    !validId(verifiedBackup.branchId) ||
    !validUsername(verifiedBackup.canonicalUsername)
  ) {
    fail("RESTORE_VERIFIED_BACKUP_SCOPE_INVALID");
  }

  if (
    !dependencies ||
    typeof dependencies.verifyDedicatedServerRecovery !==
      "function"
  ) {
    fail("RESTORE_DEDICATED_SERVER_RECOVERY_UNAVAILABLE");
  }

  let response: PaisaruleLostUsbServerVerificationV1;

  try {
    response = await dependencies.verifyDedicatedServerRecovery(
      credentials,
      verifiedBackup,
    );
  } catch {
    fail("RESTORE_SERVER_RECOVERY_VERIFICATION_FAILED");
  }

  if (
    !response ||
    response.success !== true ||
    !response.authority
  ) {
    fail("RESTORE_SERVER_RECOVERY_NOT_AUTHORIZED");
  }

  const authority = response.authority;

  if (
    authority.purpose !==
      PAISARULE_LOST_USB_RESTORE_PURPOSE ||
    authority.signedRecoveryVerified !== true ||
    authority.sourceAbsentRecoveryAuthorized !== true ||
    authority.role !== "OWNER" ||
    authority.storageMode !== "USB" ||
    authority.dataContext !== "REAL" ||
    !Number.isSafeInteger(authority.authGeneration) ||
    authority.authGeneration <= 0
  ) {
    fail("RESTORE_SERVER_RECOVERY_AUTHORITY_INVALID");
  }

  if (
    authority.userId !== verifiedBackup.userId ||
    authority.ownerId !== verifiedBackup.ownerId ||
    authority.businessId !== verifiedBackup.businessId ||
    authority.branchId !== verifiedBackup.branchId ||
    authority.canonicalUsername !==
      verifiedBackup.canonicalUsername
  ) {
    fail("RESTORE_BACKUP_SERVER_SCOPE_MISMATCH");
  }

  return authority;
}