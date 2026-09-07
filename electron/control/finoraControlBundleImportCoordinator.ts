// ============================================================
// FINORA ENTERPRISE OS™
//
// ELECTRON CONTROL
// CONTROL BUNDLE IMPORT COORDINATOR
//
// RESPONSIBILITY:
//
// - Compose native .finora file selection/read transport
// - Accept trusted verification keys only from a main-process
//   authority supplied by the caller
// - Delegate cryptographic/preflight/domain application to the
//   signed CONTROL_BUNDLE apply service
// - Return transport metadata + per-child apply summary
//
// SECURITY:
//
// - MAIN PROCESS ONLY.
// - No IPC.
// - No renderer-provided filepath.
// - No renderer-provided trusted keys.
// - No signing.
// - No private-key access.
// - No Control Center key-vault access.
// - Does not create or bootstrap trust.
// - Production trusted-key persistence/bootstrap is a separate
//   authority boundary.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  BrowserWindow,
} from "electron";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import {
  openFinoraControlBundleFile,
} from "./finoraControlBundleImportFileTransport.js";

import {
  applyFinoraSignedControlBundlePackage,
} from "./finoraControlBundlePackageApplyService.js";

import type {
  FinoraControlBundleApplySummary,
} from "./finoraControlBundlePackageApplyService.js";

// ============================================================
// RESULT
// ============================================================

export type FinoraControlBundleImportResult =
  | {
      success:
        true;

      cancelled:
        true;
    }
  | {
      success:
        true;

      cancelled:
        false;

      fileName:
        string;

      bytesRead:
        number;

      applySummary:
        FinoraControlBundleApplySummary;
    }
  | {
      success:
        false;

      error:
        string;
    };

// ============================================================
// FAILURE
// ============================================================

function failure(
  error:
    string,
): FinoraControlBundleImportResult {

  return {
    success:
      false,

    error,
  };
}

// ============================================================
// IMPORT
// ============================================================

export async function importFinoraControlBundleFromNativeDialog(
  parentWindow:
    BrowserWindow,

  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[],

  now:
    Date = new Date(),
): Promise<
  FinoraControlBundleImportResult
> {

  /*
   * Trust must already exist before import.
   *
   * This coordinator never creates, discovers, imports or
   * renderer-resolves a Control Center public key.
   */
  if (
    trustedKeys.length ===
      0
  ) {
    return failure(
      "FINORA trusted Control Center verification key is required before importing a Control Bundle.",
    );
  }

  // ----------------------------------------------------------
  // NATIVE FILE TRANSPORT
  // ----------------------------------------------------------

  const fileResult =
    await openFinoraControlBundleFile(
      parentWindow,
    );

  if (!fileResult.success) {
    return failure(
      fileResult.error,
    );
  }

  if (fileResult.cancelled) {
    return {
      success:
        true,

      cancelled:
        true,
    };
  }

  // ----------------------------------------------------------
  // CRYPTOGRAPHIC + DOMAIN APPLY
  //
  // Outer/child cryptographic preflight occurs before child
  // mutation inside the apply service.
  //
  // Bundle application remains deliberately NON-ATOMIC after
  // successful cryptographic/composition preflight.
  // ----------------------------------------------------------

  const applyResult =
    await applyFinoraSignedControlBundlePackage(
      fileResult.signedBundle,
      trustedKeys,
      now,
    );

  if (!applyResult.success) {
    return failure(
      applyResult.error,
    );
  }

  return {
    success:
      true,

    cancelled:
      false,

    fileName:
      fileResult.fileName,

    bytesRead:
      fileResult.bytesRead,

    applySummary:
      applyResult.data,
  };
}

// ============================================================
// END
// ============================================================