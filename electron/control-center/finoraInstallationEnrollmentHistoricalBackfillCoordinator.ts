/* ============================================================
   FINORA ENTERPRISE OS

   CONTROL CENTER

   HISTORICAL INSTALLATION ENROLLMENT BRANCH BACKFILL COORDINATOR

   RESPONSIBILITY:

   - Open and cryptographically verify one original Enrollment Request
   - Open one historical Enrollment Response as untrusted JSON
   - Authenticate that Response against this Control Center's
     current / retained signing-key history
   - Require exact Request / Response provenance and binding match
     through the historical verification authority
   - Derive immutable Branch Registry identity from authentic evidence
   - Register the branch through the existing authoritative Registry store
   - Preserve exact-registration idempotency

   SECURITY:

   - CONTROL CENTER MAIN PROCESS ONLY
   - No renderer-provided filepath
   - No renderer-provided file bytes
   - No operator-entered owner / business / branch identity
   - No trust-on-first-use
   - No current recipient native-binding dependency
   - No new signing
   - No private signing-key exposure
   - No Enrollment session authority
   - No inferred REGISTERED / DEMO access
   - No inferred LOCAL / USB storage entitlement
   - Historical Enrollment evidence backfills immutable identity only
============================================================ */

import type {
  BrowserWindow,
} from "electron";

import {
  openVerifiedFinoraInstallationEnrollmentRequest,
} from "./finoraInstallationEnrollmentRequestFileTransport.js";

import {
  openFinoraHistoricalInstallationEnrollmentResponseFile,
} from "./finoraInstallationEnrollmentHistoricalResponseFileTransport.js";

import {
  applyFinoraHistoricalEnrollmentEvidenceToBranchRegistry,
} from "./finoraInstallationEnrollmentHistoricalBackfillApplyService.js";
import type {
  FinoraControlCenterBranchRegistryRecord,
} from "./finoraControlCenterBranchRegistry.types.js";

// ============================================================
// RESULT
// ============================================================

export type FinoraHistoricalBranchBackfillResult =
  | {
      success:
        true;

      cancelled:
        true;

      cancelledAt:
        "REQUEST" | "RESPONSE";
    }
  | {
      success:
        true;

      cancelled:
        false;

      created:
        boolean;

      requestFileName:
        string;

      requestBytesRead:
        number;

      responseFileName:
        string;

      responseBytesRead:
        number;

      requestId:
        string;

      responseId:
        string;

      verificationSigningKeyId:
        string;

      verificationKeyWasCurrent:
        boolean;

      verificationKeyRetiredAt?:
        string;

      record:
        FinoraControlCenterBranchRegistryRecord;
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
): FinoraHistoricalBranchBackfillResult {

  return {
    success:
      false,

    error,
  };
}

// ============================================================
// BACKFILL
// ============================================================

export async function backfillFinoraControlCenterBranchFromHistoricalEnrollmentEvidence(
  parentWindow:
    BrowserWindow,
): Promise<
  FinoraHistoricalBranchBackfillResult
> {

  try {

    // --------------------------------------------------------
    // 1. ORIGINAL ENROLLMENT REQUEST
    //
    // The existing Request transport owns:
    // - native file selection
    // - bounded strict parsing
    // - public binding validation
    // - fingerprint / bindingKeyId validation
    // - P-256 possession-signature verification
    // --------------------------------------------------------

    const requestOpen =
      await openVerifiedFinoraInstallationEnrollmentRequest(
        parentWindow,
      );

    if (!requestOpen.success) {
      return failure(
        requestOpen.error,
      );
    }

    if (requestOpen.cancelled) {
      return {
        success:
          true,

        cancelled:
          true,

        cancelledAt:
          "REQUEST",
      };
    }

    const verifiedEnrollment =
      requestOpen.enrollment;

    // --------------------------------------------------------
    // 2. HISTORICAL ENROLLMENT RESPONSE FILE
    //
    // Parse-only transport.
    // Its value remains untrusted at this point.
    // --------------------------------------------------------

    const responseOpen =
      await openFinoraHistoricalInstallationEnrollmentResponseFile(
        parentWindow,
      );

    if (!responseOpen.success) {
      return failure(
        responseOpen.error,
      );
    }

    if (responseOpen.cancelled) {
      return {
        success:
          true,

        cancelled:
          true,

        cancelledAt:
          "RESPONSE",
      };
    }

    // --------------------------------------------------------
    // 3. HISTORICAL CONTROL CENTER AUTHORITY
    //
    // This authority proves:
    // - valid signed Enrollment Response structure
    // - exact purpose / schema / payload
    // - exact Request ID
    // - exact installation / binding target
    // - valid payload digest + canonical signature
    // - local current or retained Control Center signer
    // - no current-time expiry requirement for archival evidence
    // --------------------------------------------------------

    const applyResult =
      await applyFinoraHistoricalEnrollmentEvidenceToBranchRegistry(
        responseOpen.value,
        verifiedEnrollment,
      );

    if (!applyResult.success) {
      return failure(
        applyResult.error,
      );
    }

    const proof =
      applyResult.data;
// --------------------------------------------------------
    // 5. SAFE RESULT
    //
    // Existing Registry registration semantics distinguish:
    // - created === true  -> new historical backfill
    // - created === false -> exact idempotent existing identity
    //
    // Any identity collision remains fail-closed in the Registry.
    // --------------------------------------------------------

    return {
      success:
        true,

      cancelled:
        false,

      created:
        proof.created,

      requestFileName:
        requestOpen.fileName,

      requestBytesRead:
        requestOpen.bytesRead,

      responseFileName:
        responseOpen.fileName,

      responseBytesRead:
        responseOpen.bytesRead,

      requestId:
        proof.requestId,

      responseId:
        proof.responseId,

      verificationSigningKeyId:
        proof.verificationSigningKeyId,

      verificationKeyWasCurrent:
        proof.verificationKeyWasCurrent,

      ...(
        proof.verificationKeyRetiredAt ===
          undefined
          ? {}
          : {
              verificationKeyRetiredAt:
                proof.verificationKeyRetiredAt,
            }
      ),

      record:
        proof.record,
    };

  } catch (
    error
  ) {

    return failure(
      error instanceof Error
        ? error.message
        : "FINORA historical Branch Registry backfill failed.",
    );
  }
}

// ============================================================
// END
// ============================================================