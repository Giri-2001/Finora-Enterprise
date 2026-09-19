// ============================================================
// FINORA ENTERPRISE OS™
//
// ELECTRON CONTROL
// CONTROL BUNDLE IMPORT COORDINATOR
//
// RESPONSIBILITY:
//
// - Compose native .finora file selection/read transport
// - Load recipient-authoritative trusted verification keys
//   from the encrypted recipient trust store
// - Serialize trust snapshot + cryptographic/domain apply with
//   recipient trust bootstrap / transition mutation authority
// - Return transport metadata + per-child apply summary
//
// SECURITY:
//
// - MAIN PROCESS ONLY.
// - No IPC.
// - No renderer-provided filepath.
// - No renderer-provided trusted keys.
// - No caller-provided trusted keys.
// - No signing.
// - No private-key access.
// - No Control Center key-vault access.
// - Does not create or bootstrap trust.
// - Missing recipient trust fails closed.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  BrowserWindow,
} from "electron";



import {
  openFinoraControlBundleFile,
} from "./finoraControlBundleImportFileTransport.js";

import {
  observeFinoraAuthoritativeWallClock,
} from "./finoraClockHighWaterAuthorityService.js";

import {
  applyFinoraSignedControlBundleWithAuthoritativeRecipientTrust,
} from "./finoraAuthoritativeControlBundleApplyService.js";

import type {
  FinoraControlBundleApplySummary,
  FinoraControlBundleImportAuthorityContext,
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

  authorityContext:
    FinoraControlBundleImportAuthorityContext,

  now?:
    Date,
): Promise<
  FinoraControlBundleImportResult
> {
  // ----------------------------------------------------------
  // NATIVE FILE TRANSPORT
  //
  // The native dialog/file read does not consume recipient
  // trust authority, so do not hold the trust queue while the
  // operator selects a file.
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
  // AUTHORITATIVE WALL CLOCK
  //
  // Production captures wall time only after native file
  // selection/read completes. Tests may inject one explicit
  // observation through the optional now parameter.
  //
  // Rollback, installation mismatch or clock-state storage
  // failure stops the operation before recipient trust or
  // Control Bundle application begins.
  // ----------------------------------------------------------

  const observedNow =
    now ??
    new Date();

  const clockResult =
    await observeFinoraAuthoritativeWallClock(
      observedNow,
    );

  if (!clockResult.success) {
    return failure(
      clockResult.error,
    );
  }

  const acceptedNow =
    new Date(
      clockResult.data.observedAt,
    );

  // ----------------------------------------------------------
  // AUTHORITATIVE RECIPIENT TRUST + APPLY
  //
  // The selected file is already read before entering the
  // recipient-trust authority queue. The authoritative apply
  // service owns:
  //
  // recipient trust load
  // -> cryptographic/composition verification
  // -> purpose-specific child application
  //
  // inside the shared serialization boundary used by bootstrap
  // and signed recipient trust transitions.
  // ----------------------------------------------------------

  const applyResult =
    await applyFinoraSignedControlBundleWithAuthoritativeRecipientTrust(
      fileResult.signedBundle,
      acceptedNow,
      authorityContext,
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