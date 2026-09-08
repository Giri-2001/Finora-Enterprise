/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST EMERGENCY RECOVERY IMPORT COORDINATOR

   MODULE  : Electron Control Plane
   LAYER   : Main-Process Import Authority Coordination
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Invoke the dedicated main-process native Recovery picker
   - Accept only the parsed candidate returned by native file
     transport
   - Observe authoritative recipient wall-clock high-water only
     after native file selection/read completes
   - Convert the accepted clock observation into the apply-time
     snapshot
   - Invoke the authoritative signed Recipient Trust Recovery
     apply boundary
   - Return only bounded import/apply summary information

   AUTHORITY CHAIN:

     native dialog / bounded read
       ->
     authoritative wall-clock high-water
       ->
     signed RECIPIENT_TRUST_RECOVERY apply
       ->
     shared recipient-trust authority queue
       ->
     one recipient-trust-store replacement

   SECURITY:

   - Electron main process only.
   - No renderer-provided filepath.
   - No renderer-provided package bytes.
   - No renderer-provided trusted operational keys.
   - No renderer-provided recovery authority.
   - No renderer-provided installation target.
   - No direct recipient trust-store mutation here.
   - No direct recovery-root mutation here.
   - No private signing key.
   - Recovery apply service remains the trust mutation authority.

   TIME:

   Production captures wall time only after native picker/read
   completes.

   Tests may inject one explicit Date through the optional now
   parameter. Explicit Date input is snapshotted before the
   asynchronous clock-authority call.
=========================================================== */

import type {
  BrowserWindow,
} from "electron";

import {
  openFinoraRecipientTrustRecoveryFile,
} from "./finoraRecipientTrustRecoveryImportFileTransport.js";

import {
  observeFinoraAuthoritativeWallClock,
} from "./finoraClockHighWaterAuthorityService.js";

import {
  applyFinoraSignedRecipientTrustRecovery,
} from "./finoraRecipientTrustRecoveryApplyService.js";

import type {
  FinoraRecipientTrustRecoveryApplyResult,
} from "./finoraRecipientTrustRecoveryApplyService.js";

// ============================================================
// APPLIED SUMMARY
// ============================================================

export type FinoraRecipientTrustRecoveryAppliedSummary =
  Extract<
    FinoraRecipientTrustRecoveryApplyResult,
    {
      success:
        true;
    }
  >["data"];

// ============================================================
// IMPORT RESULT
// ============================================================

export type FinoraRecipientTrustRecoveryImportResult =
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
        FinoraRecipientTrustRecoveryAppliedSummary;
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
): FinoraRecipientTrustRecoveryImportResult {
  return {
    success:
      false,

    error,
  };
}

// ============================================================
// IMPORT
// ============================================================

export async function importFinoraRecipientTrustRecoveryFromNativeDialog(
  parentWindow:
    BrowserWindow,

  now?:
    Date,
): Promise<
  FinoraRecipientTrustRecoveryImportResult
> {
  // ----------------------------------------------------------
  // NATIVE FILE TRANSPORT
  //
  // No filepath or package bytes originate from a renderer.
  // ----------------------------------------------------------

  const fileResult =
    await openFinoraRecipientTrustRecoveryFile(
      parentWindow,
    );

  if (
    !fileResult.success
  ) {
    return failure(
      fileResult.error,
    );
  }

  if (
    fileResult.cancelled
  ) {
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
  // Production captures the wall clock only after native file
  // selection/read completes.
  //
  // The optional explicit Date exists only as a test seam.
  // Snapshot it before the asynchronous clock-authority call so
  // later caller mutation cannot alter the submitted observation.
  //
  // Clock rollback, installation mismatch or high-water storage
  // failure stops recovery before recipient trust mutation or
  // recovery replay-ledger mutation begins.
  // ----------------------------------------------------------

  const observedNow =
    now ===
      undefined
      ? new Date()
      : new Date(
          now.getTime(),
        );

  const clockResult =
    await observeFinoraAuthoritativeWallClock(
      observedNow,
    );

  if (
    !clockResult.success
  ) {
    return failure(
      clockResult.error,
    );
  }

  /*
   * observedAt is the canonical timestamp accepted by the
   * authoritative high-water service.
   */
  const acceptedNow =
    new Date(
      clockResult.data.observedAt,
    );

  // ----------------------------------------------------------
  // AUTHORITATIVE SIGNED RECOVERY APPLY
  //
  // The apply service independently resolves:
  //
  // - native installation binding,
  // - provisioned recovery authority,
  // - operational recipient trust,
  // - cryptographic authorization,
  // - replay / sequence state,
  // - exact current ACTIVE key,
  // - whole recipient trust mutation.
  // ----------------------------------------------------------

  const applyResult =
    await applyFinoraSignedRecipientTrustRecovery(
      fileResult.signedRecovery,
      acceptedNow,
    );

  if (
    !applyResult.success
  ) {
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