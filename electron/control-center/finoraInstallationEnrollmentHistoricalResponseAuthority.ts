/* ============================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER

   HISTORICAL INSTALLATION ENROLLMENT RESPONSE AUTHORITY

   RESPONSIBILITY:

   - Authenticate one historical Installation Enrollment Response
     against this Control Center's validated public key history
   - Use a cryptographically verified original Enrollment Request
     as request + recipient-binding authority
   - Support current or retained Control Center signing keys
   - Refuse ambiguous or unauthenticated historical evidence

   SECURITY:

   - MAIN PROCESS ONLY
   - No renderer authority
   - No filesystem authority
   - No registry mutation
   - No private signing material
   - No trust-on-first-use
   - No response-provided signingKeyId used as key-selection authority
   - Missing Control Center key vault fails closed through the
     read-only public verification-history authority
============================================================ */

import {
  createFinoraInstallationBindingFingerprint,
} from "../control/finoraInstallationBindingCrypto.js";

import {
  verifyFinoraInstallationEnrollmentResponseFileForHistoricalEvidence,
} from "../control/finoraInstallationEnrollmentResponseVerifier.js";

import type {
  FinoraVerifiedInstallationEnrollmentResponse,
} from "../control/finoraInstallationEnrollmentResponseVerifier.js";

import {
  loadFinoraControlCenterPublicVerificationHistory,
} from "./finoraControlCenterKeyVault.js";

import type {
  FinoraControlCenterPublicVerificationKey,
} from "./finoraControlCenterKeyVault.js";

import type {
  FinoraVerifiedInstallationEnrollmentRequest,
} from "./finoraInstallationEnrollmentRequestVerifier.js";

// ============================================================
// RESULT
// ============================================================

export interface FinoraHistoricalEnrollmentResponseAuthorityProof {

  response:
    FinoraVerifiedInstallationEnrollmentResponse;

  verificationKey:
    FinoraControlCenterPublicVerificationKey;

  schemaVersion:
    1;
}

export type FinoraHistoricalEnrollmentResponseAuthorityResult =
  | {
      success:
        true;

      data:
        FinoraHistoricalEnrollmentResponseAuthorityProof;
    }
  | {
      success:
        false;

      error:
        string;
    };

// ============================================================
// INTERNAL RESULT HELPERS
// ============================================================

function failure(
  error:
    string,
): FinoraHistoricalEnrollmentResponseAuthorityResult {

  return {
    success:
      false,

    error,
  };
}

// ============================================================
// VERIFY AGAINST LOCAL CONTROL CENTER HISTORY
// ============================================================

export async function verifyFinoraHistoricalInstallationEnrollmentResponseAgainstControlCenterAuthority(
  value:
    unknown,

  verifiedEnrollment:
    FinoraVerifiedInstallationEnrollmentRequest,
): Promise<
  FinoraHistoricalEnrollmentResponseAuthorityResult
> {

  try {

    /*
     * This is deliberately a READ-ONLY authority.
     *
     * Missing vault state throws rather than creating a new
     * Control Center signing identity.
     */
    const history =
      await loadFinoraControlCenterPublicVerificationHistory();

    const matches:
      FinoraHistoricalEnrollmentResponseAuthorityProof[] =
        [];

    /*
     * Do not inspect an untrusted response signingKeyId to select
     * one local key.
     *
     * Every locally validated current / retained public key is
     * independently attempted. The common Enrollment Response
     * verifier then proves:
     *
     * - the embedded trusted key matches this independent
     *   locally-derived fingerprint,
     * - issuer and signingKeyId are consistent with that key,
     * - payload digest is correct,
     * - canonical response signature is valid,
     * - request provenance matches,
     * - exact recipient installation binding matches,
     * - signed validity structure is valid.
     */
    for (
      const verificationKey of
        history.keys
    ) {

      const expectedFingerprint =
        createFinoraInstallationBindingFingerprint(
          verificationKey.publicKeySpkiDerBase64,
        );

      const verification =
        verifyFinoraInstallationEnrollmentResponseFileForHistoricalEvidence({
          value,

          expectedControlCenterPublicKeyFingerprint:
            expectedFingerprint,

          expectedRequestId:
            verifiedEnrollment.requestId,

          verifiedRequestBinding: {
            installationId:
              verifiedEnrollment.target.installationId,

            bindingKeyId:
              verifiedEnrollment.target.bindingKeyId,

            fingerprintAlgorithm:
              verifiedEnrollment.target.fingerprintAlgorithm,

            publicKeyFingerprint:
              verifiedEnrollment.target.publicKeyFingerprint,
          },
        });

      if (!verification.success) {
        continue;
      }

      /*
       * The common verifier already authenticates the embedded
       * trusted public key through the independently supplied
       * fingerprint.
       *
       * These exact comparisons additionally bind the verified
       * result to the same local issuer/key record that supplied
       * that independent authority.
       */
      if (
        verification.data.trustedKey.issuerId !==
          history.issuerId ||
        verification.data.trustedKey.issuerId !==
          verificationKey.issuerId ||
        verification.data.trustedKey.signingKeyId !==
          verificationKey.signingKeyId ||
        verification.data.trustedKey.publicKey !==
          verificationKey.publicKeySpkiDerBase64
      ) {
        continue;
      }

      matches.push({
        response:
          verification.data,

        verificationKey: {
          ...verificationKey,
        },

        schemaVersion:
          1,
      });
    }

    if (
      matches.length ===
        0
    ) {
      return failure(
        "FINORA historical Installation Enrollment Response could not be authenticated against this Control Center's current or retained signing-key history.",
      );
    }

    if (
      matches.length !==
        1
    ) {
      return failure(
        "FINORA historical Installation Enrollment Response matched more than one Control Center verification key and was refused as ambiguous.",
      );
    }

    return {
      success:
        true,

      data:
        matches[0],
    };

  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "FINORA historical Installation Enrollment Response verification failed.",
    );
  }
}