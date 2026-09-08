/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST TRANSITION IMPORT COORDINATOR

   MODULE  : Native Control
   LAYER   : Main-Process Composition
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Open one signed Recipient Trust Transition through the
     dedicated native file transport
   - Preserve user cancellation as a non-error outcome
   - Delegate signed transition application to the existing
     authoritative apply service
   - Return file metadata plus the applied-transition summary

   IMPORTANT:

   File selection completes before signed transition apply.
   Transition validation, target authorization, cryptographic
   verification, replay protection and persistence remain owned
   by the existing apply service.
=========================================================== */

import type {
  BrowserWindow,
} from "electron";

import {
  openFinoraRecipientTrustTransitionFile,
} from "./finoraRecipientTrustTransitionImportFileTransport.js";

import {
  observeFinoraAuthoritativeWallClock,
} from "./finoraClockHighWaterAuthorityService.js";

import {
  applyFinoraSignedRecipientTrustTransition,
} from "./finoraRecipientTrustTransitionApplyService.js";

import type {
  FinoraRecipientTrustTransitionApplyResult,
} from "./finoraRecipientTrustTransitionApplyService.js";

// ============================================================
// SUCCESS DATA
// ============================================================

type FinoraRecipientTrustTransitionAppliedSummary =
  Extract<
    FinoraRecipientTrustTransitionApplyResult,
    {
      success:
        true;
    }
  >["data"];

// ============================================================
// RESULT
// ============================================================

export type FinoraRecipientTrustTransitionImportResult =
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
        FinoraRecipientTrustTransitionAppliedSummary;
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
): FinoraRecipientTrustTransitionImportResult {
  return {
    success:
      false,

    error,
  };
}

// ============================================================
// IMPORT
// ============================================================

export async function importFinoraRecipientTrustTransitionFromNativeDialog(
  parentWindow:
    BrowserWindow,

  now?:
    Date,
): Promise<
  FinoraRecipientTrustTransitionImportResult
> {
  // ----------------------------------------------------------
  // NATIVE FILE TRANSPORT
  // ----------------------------------------------------------

  const fileResult =
    await openFinoraRecipientTrustTransitionFile(
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
  // Rollback, installation mismatch or high-water storage
  // failure stops the operation before Recipient Trust mutation
  // or transition replay-ledger mutation begins.
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
  // AUTHORITATIVE SIGNED TRANSITION APPLY
  // ----------------------------------------------------------

  const applyResult =
    await applyFinoraSignedRecipientTrustTransition(
      fileResult.signedTransition,
      acceptedNow,
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