/* ============================================================
   FINORA ENTERPRISE OS
   CONTROL CENTER ADMIN AUTHORITY RECOVERY COORDINATOR

   PURPOSE:

   Privileged orchestration boundary for Control Center
   authority portability.

   EXPORT:
   - serialize against global Key Authority queue,
   - load current Control Center signing authority,
   - encrypt exact authority with Admin Security Code,
   - delegate native Save transport,
   - return only safe file metadata.

   IMPORT / RESTORE:
   - delegate native Open transport first,
   - preserve user cancellation as non-error,
   - pass canonical encrypted bundle + Admin Security Code
     to authoritative recovery service,
   - return only public restored-authority summary.

   SECURITY:
   - no renderer API,
   - no IPC API,
   - no caller-provided filesystem path,
   - no caller-provided file bytes,
   - no private key returned,
   - no Admin Security Code persisted or returned.

   NOTE:
   Export intentionally holds the Control Center Key Authority
   queue through encryption and native file persistence so a
   signing-key rotation cannot interleave with the exported
   authority snapshot.
============================================================ */

import {
  createFinoraControlCenterAdminAuthorityRecoveryBundleV1,
} from "./finoraControlCenterAdminAuthorityRecoveryBundle.js";

import {
  exportFinoraControlCenterAdminAuthorityRecoveryFile,
  importFinoraControlCenterAdminAuthorityRecoveryFile,
} from "./finoraControlCenterAdminAuthorityRecoveryFileTransport.js";

import {
  recoverFinoraControlCenterAdminAuthority,
} from "./finoraControlCenterAdminAuthorityRecoveryService.js";

import {
  runFinoraControlCenterKeyAuthoritySerialized,
} from "./finoraControlCenterKeyAuthorityQueue.js";

import {
  loadOrCreateFinoraControlCenterKeyVault,
} from "./finoraControlCenterKeyVault.js";

// ============================================================
// EXPORT RESULT
// ============================================================

export interface FinoraControlCenterAdminAuthorityExportSuccess {
  success:
    true;

  cancelled:
    false;

  status:
    "EXPORTED";

  issuerId:
    string;

  signingKeyId:
    string;

  fileName:
    string;

  bytes:
    number;
}

export interface FinoraControlCenterAdminAuthorityExportCancelled {
  success:
    false;

  cancelled:
    true;
}

export interface FinoraControlCenterAdminAuthorityExportFailure {
  success:
    false;

  cancelled:
    false;

  error:
    string;
}

export type FinoraControlCenterAdminAuthorityExportResult =
  FinoraControlCenterAdminAuthorityExportSuccess |
  FinoraControlCenterAdminAuthorityExportCancelled |
  FinoraControlCenterAdminAuthorityExportFailure;

// ============================================================
// IMPORT / RESTORE RESULT
// ============================================================

export interface FinoraControlCenterAdminAuthorityImportSuccess {
  success:
    true;

  cancelled:
    false;

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

  fileName:
    string;

  bytes:
    number;
}

export interface FinoraControlCenterAdminAuthorityImportCancelled {
  success:
    false;

  cancelled:
    true;
}

export interface FinoraControlCenterAdminAuthorityImportFailure {
  success:
    false;

  cancelled:
    false;

  errorCode?:
    string;

  error:
    string;
}

export type FinoraControlCenterAdminAuthorityImportResult =
  FinoraControlCenterAdminAuthorityImportSuccess |
  FinoraControlCenterAdminAuthorityImportCancelled |
  FinoraControlCenterAdminAuthorityImportFailure;

// ============================================================
// EXPORT INTERNAL
// ============================================================

async function exportFinoraControlCenterAdminAuthorityInternal(
  securityCode:
    string,
): Promise<
  FinoraControlCenterAdminAuthorityExportResult
> {
  try {
    const vault =
      await loadOrCreateFinoraControlCenterKeyVault();

    const bundle =
      await createFinoraControlCenterAdminAuthorityRecoveryBundleV1(
        vault,
        securityCode,
      );

    const exported =
      await exportFinoraControlCenterAdminAuthorityRecoveryFile(
        bundle,
      );

    if (
      !exported.success
    ) {
      if (
        exported.cancelled
      ) {
        return {
          success:
            false,

          cancelled:
            true,
        };
      }

      return {
        success:
          false,

        cancelled:
          false,

        error:
          exported.error,
      };
    }

    return {
      success:
        true,

      cancelled:
        false,

      status:
        "EXPORTED",

      issuerId:
        vault.issuerId,

      signingKeyId:
        vault.signingKeyId,

      fileName:
        exported.fileName,

      bytes:
        exported.bytes,
    };
  }
  catch (
    error
  ) {
    return {
      success:
        false,

      cancelled:
        false,

      error:
        error instanceof Error
          ? error.message
          : "FINORA Control Center Admin Authority export failed.",
    };
  }
}

// ============================================================
// EXPORT PUBLIC PRIVILEGED BOUNDARY
// ============================================================

export function exportFinoraControlCenterAdminAuthorityRecovery(
  securityCode:
    string,
): Promise<
  FinoraControlCenterAdminAuthorityExportResult
> {
  return runFinoraControlCenterKeyAuthoritySerialized(
    () =>
      exportFinoraControlCenterAdminAuthorityInternal(
        securityCode,
      ),
  );
}

// ============================================================
// IMPORT / RESTORE
// ============================================================

export async function importAndRecoverFinoraControlCenterAdminAuthority(
  securityCode:
    string,
): Promise<
  FinoraControlCenterAdminAuthorityImportResult
> {
  const imported =
    await importFinoraControlCenterAdminAuthorityRecoveryFile();

  if (
    !imported.success
  ) {
    if (
      imported.cancelled
    ) {
      return {
        success:
          false,

        cancelled:
          true,
      };
    }

    return {
      success:
        false,

      cancelled:
        false,

      error:
        imported.error,
    };
  }

  const recovered =
    await recoverFinoraControlCenterAdminAuthority(
      imported.serializedBundle,
      securityCode,
    );

  if (
    !recovered.success
  ) {
    return {
      success:
        false,

      cancelled:
        false,

      errorCode:
        recovered.errorCode,

      error:
        recovered.error,
    };
  }

  return {
    success:
      true,

    cancelled:
      false,

    status:
      "RESTORED",

    issuerId:
      recovered.issuerId,

    signingKeyId:
      recovered.signingKeyId,

    createdAt:
      recovered.createdAt,

    retainedSigningKeyCount:
      recovered.retainedSigningKeyCount,

    fileName:
      imported.fileName,

    bytes:
      imported.bytes,
  };
}

// ============================================================
// END
// ============================================================