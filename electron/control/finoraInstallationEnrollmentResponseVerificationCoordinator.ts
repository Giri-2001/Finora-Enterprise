/* ===========================================================
   FINORA ENTERPRISE OS™

   INSTALLATION ENROLLMENT RESPONSE VERIFICATION COORDINATOR

   MODULE  : Native Control
   LAYER   : Electron Main / Verification Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Load the protected pending Enrollment Request provenance
   - Load the current native Windows installation binding
   - Require pending provenance to match the current binding
   - Forward only those authoritative values to the pure
     Enrollment Response verifier
   - Preserve the independently supplied Control Center
     public-key fingerprint as separate verification authority
   - Return only cryptographically verified bootstrap material

   SECURITY:

   - ELECTRON MAIN PROCESS ONLY.
   - No IPC registration.
   - No filesystem path input.
   - No recipient trust bootstrap.
   - No Control Store installation mutation.
   - No pending-request clear.
   - No branch activation authority.
   - No storage entitlement authority.
=========================================================== */

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  loadFinoraPendingInstallationEnrollment,
} from "./finoraInstallationEnrollmentPendingStore.js";

import {
  isExactFinoraVerifiedInstallationEnrollmentAcceptedResponse,
  verifyFinoraInstallationEnrollmentResponseFile,
  verifyFinoraInstallationEnrollmentResponseFileForLatchedRecovery,
} from "./finoraInstallationEnrollmentResponseVerifier.js";

import type {
  FinoraVerifiedInstallationEnrollmentResponse,
} from "./finoraInstallationEnrollmentResponseVerifier.js";

// ============================================================
// RESULT
// ============================================================

export type FinoraEnrollmentResponseCoordinatorResult =
  | {
      success:
        true;

      data:
        FinoraVerifiedInstallationEnrollmentResponse;
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
): FinoraEnrollmentResponseCoordinatorResult {

  return {
    success:
      false,

    error,
  };
}

// ============================================================
// VERIFY
// ============================================================

export async function verifyFinoraInstallationEnrollmentResponseAgainstLocalAuthority(
  value:
    unknown,

  expectedControlCenterPublicKeyFingerprint:
    string,
): Promise<
  FinoraEnrollmentResponseCoordinatorResult
> {

  try {

    // --------------------------------------------------------
    // PROTECTED REQUEST PROVENANCE
    // --------------------------------------------------------

    const pending =
      await loadFinoraPendingInstallationEnrollment();

    if (!pending) {
      return failure(
        "FINORA has no protected pending Installation Enrollment Request for this response.",
      );
    }

    // --------------------------------------------------------
    // CURRENT NATIVE INSTALLATION BINDING
    // --------------------------------------------------------

    const nativeBinding =
      await getFinoraWindowsInstallationBinding();

    if (!nativeBinding) {
      return failure(
        "FINORA native installation binding is unavailable for Enrollment Response verification.",
      );
    }

    // --------------------------------------------------------
    // PENDING <-> NATIVE EXACT MATCH
    //
    // The protected pending request must still belong to the
    // exact native possession identity currently on this device.
    // --------------------------------------------------------

    if (
      pending.installationId !==
        nativeBinding.installationId ||
      pending.bindingKeyId !==
        nativeBinding.bindingKeyId ||
      pending.fingerprintAlgorithm !==
        nativeBinding.fingerprintAlgorithm ||
      pending.publicKeyFingerprint !==
        nativeBinding.publicKeyFingerprint
    ) {
      return failure(
        "FINORA protected pending Enrollment Request does not match the current native installation binding.",
      );
    }

    // --------------------------------------------------------
    // PURE CRYPTOGRAPHIC RESPONSE VERIFICATION
    // --------------------------------------------------------

    const verificationInput = {
      value,

      expectedControlCenterPublicKeyFingerprint,

      expectedRequestId:
        pending.requestId,

      nativeBinding: {
        installationId:
          nativeBinding.installationId,

        bindingKeyId:
          nativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          nativeBinding.fingerprintAlgorithm,

        publicKeyFingerprint:
          nativeBinding.publicKeyFingerprint,
      },
    };

    const acceptedResponse =
      pending.acceptedResponse;

    /*
     * Without a protected latch, first import must pass
     * strict current-time notBefore / expiry validation.
     *
     * With a protected latch, recovery re-runs signature,
     * independent fingerprint, request provenance and native
     * binding verification without re-enforcing current expiry.
     *
     * Exact protected responseId + verified-response digest
     * equality remains mandatory below.
     */

    const verification =
      acceptedResponse ===
        undefined
        ? verifyFinoraInstallationEnrollmentResponseFile(
            verificationInput,
          )
        : verifyFinoraInstallationEnrollmentResponseFileForLatchedRecovery(
            verificationInput,
          );

    if (!verification.success) {
      return failure(
        verification.error,
      );
    }

    if (
      acceptedResponse !==
        undefined &&
      !isExactFinoraVerifiedInstallationEnrollmentAcceptedResponse(
        verification.data,
        acceptedResponse,
      )
    ) {
      return failure(
        "FINORA Enrollment Response does not match the protected accepted-response recovery latch.",
      );
    }

    return {
      success:
        true,

      data:
        verification.data,
    };

  } catch (
    error
  ) {

    return failure(
      error instanceof Error
        ? error.message
        : "FINORA Installation Enrollment Response local-authority verification failed.",
    );
  }
}

// ============================================================
// END
// ============================================================