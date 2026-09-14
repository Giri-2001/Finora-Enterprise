/* ============================================================
   FINORA ENTERPRISE OS
   CONTROL CENTER ADMIN AUTHORITY RECOVERY SERVICE

   PURPOSE:

   Authoritative fresh-machine recovery path for the
   device-independent Control Center signing authority.

   INPUT:
   - serialized encrypted Admin Authority Recovery Bundle
   - Admin Security Code

   AUTHORITY:
   - strict bundle parsing
   - authenticated decryption
   - exact Key Vault cryptographic validation
   - fresh-machine-only bootstrap restore
   - global Control Center key-authority serialization

   SECURITY:
   - no renderer authority
   - no IPC authority
   - no filesystem path authority
   - no private signing material returned
   - no Admin Security Code persisted
============================================================ */

import {
  decryptFinoraControlCenterAdminAuthorityRecoveryBundleV1,
  parseFinoraControlCenterAdminAuthorityRecoveryBundleV1,
} from "./finoraControlCenterAdminAuthorityRecoveryBundle.js";

import {
  bootstrapRestoreFinoraControlCenterKeyVault,
} from "./finoraControlCenterKeyVault.js";

import {
  runFinoraControlCenterKeyAuthoritySerialized,
} from "./finoraControlCenterKeyAuthorityQueue.js";

// ============================================================
// RESULT
// ============================================================

export interface FinoraControlCenterAdminAuthorityRecoverySuccess {
  success:
    true;

  status:
    "RESTORED";

  issuerId:
    string;

  signingKeyId:
    string;

  createdAt:
    string;

  retainedSigningKeyCount:
    number;
}

export interface FinoraControlCenterAdminAuthorityRecoveryFailure {
  success:
    false;

  errorCode:
    "INVALID_RECOVERY_BUNDLE" |
    "RECOVERY_AUTHENTICATION_FAILED" |
    "RECOVERY_RESTORE_FAILED";

  error:
    string;
}

export type FinoraControlCenterAdminAuthorityRecoveryResult =
  FinoraControlCenterAdminAuthorityRecoverySuccess |
  FinoraControlCenterAdminAuthorityRecoveryFailure;

// ============================================================
// INTERNAL APPLY
// ============================================================

async function recoverFinoraControlCenterAdminAuthorityInternal(
  serializedBundle:
    string,

  securityCode:
    string,
): Promise<
  FinoraControlCenterAdminAuthorityRecoveryResult
> {
  let bundle:
    ReturnType<
      typeof parseFinoraControlCenterAdminAuthorityRecoveryBundleV1
    >;

  try {
    bundle =
      parseFinoraControlCenterAdminAuthorityRecoveryBundleV1(
        serializedBundle,
      );
  }
  catch (
    error
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_RECOVERY_BUNDLE",

      error:
        error instanceof Error
          ? error.message
          : "FINORA Admin Recovery Bundle is invalid.",
    };
  }

  let recoveredVault:
    Awaited<
      ReturnType<
        typeof decryptFinoraControlCenterAdminAuthorityRecoveryBundleV1
      >
    >;

  try {
    recoveredVault =
      await decryptFinoraControlCenterAdminAuthorityRecoveryBundleV1(
        bundle,
        securityCode,
      );
  }
  catch (
    error
  ) {
    return {
      success:
        false,

      errorCode:
        "RECOVERY_AUTHENTICATION_FAILED",

      error:
        error instanceof Error
          ? error.message
          : "FINORA Admin Recovery Bundle authentication failed.",
    };
  }

  try {
    const restored =
      await bootstrapRestoreFinoraControlCenterKeyVault(
        recoveredVault,
      );

    return {
      success:
        true,

      status:
        "RESTORED",

      issuerId:
        restored.issuerId,

      signingKeyId:
        restored.signingKeyId,

      createdAt:
        restored.createdAt,

      retainedSigningKeyCount:
        restored.retainedSigningKeys?.length ??
        0,
    };
  }
  catch (
    error
  ) {
    return {
      success:
        false,

      errorCode:
        "RECOVERY_RESTORE_FAILED",

      error:
        error instanceof Error
          ? error.message
          : "FINORA Control Center signing authority could not be restored.",
    };
  }
}

// ============================================================
// PUBLIC AUTHORITY
// ============================================================

export function recoverFinoraControlCenterAdminAuthority(
  serializedBundle:
    string,

  securityCode:
    string,
): Promise<
  FinoraControlCenterAdminAuthorityRecoveryResult
> {
  return runFinoraControlCenterKeyAuthoritySerialized(
    () =>
      recoverFinoraControlCenterAdminAuthorityInternal(
        serializedBundle,
        securityCode,
      ),
  );
}

// ============================================================
// END
// ============================================================