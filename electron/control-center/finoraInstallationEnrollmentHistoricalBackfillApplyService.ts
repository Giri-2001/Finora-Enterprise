/* ============================================================
   FINORA ENTERPRISE OS

   CONTROL CENTER

   HISTORICAL INSTALLATION ENROLLMENT BACKFILL APPLY SERVICE

   RESPONSIBILITY:

   - Accept one cryptographically verified original Enrollment Request
   - Accept one untrusted historical Enrollment Response value
   - Authenticate the Response against this Control Center's
     current / retained signing-key history
   - Derive immutable Branch Registry identity from authentic evidence
   - Persist through the existing authoritative Branch Registry store
   - Preserve exact-registration idempotency

   SECURITY:

   - CONTROL CENTER MAIN PROCESS ONLY
   - No native file selection
   - No renderer-provided filepath or bytes
   - No operator-entered identity
   - No trust-on-first-use
   - No current recipient native-binding dependency
   - No Enrollment session authority
   - No new signing
   - No private signing-key exposure
   - No inferred REGISTERED / DEMO access
   - No inferred LOCAL / USB storage entitlement
============================================================ */

import {
  verifyFinoraHistoricalInstallationEnrollmentResponseAgainstControlCenterAuthority,
} from "./finoraInstallationEnrollmentHistoricalResponseAuthority.js";

import {
  registerFinoraControlCenterBranch,
} from "./finoraControlCenterBranchRegistryStore.js";

import type {
  FinoraControlCenterBranchRegistryRecord,
} from "./finoraControlCenterBranchRegistry.types.js";

import type {
  FinoraVerifiedInstallationEnrollmentRequest,
} from "./finoraInstallationEnrollmentRequestVerifier.js";

// ============================================================
// PROOF
// ============================================================

export interface FinoraHistoricalBranchBackfillApplyProof {

  created:
    boolean;

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

  schemaVersion:
    1;
}

// ============================================================
// RESULT
// ============================================================

export type FinoraHistoricalBranchBackfillApplyResult =
  | {
      success:
        true;

      data:
        FinoraHistoricalBranchBackfillApplyProof;
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
): FinoraHistoricalBranchBackfillApplyResult {

  return {
    success:
      false,

    error,
  };
}

// ============================================================
// APPLY AUTHENTIC HISTORICAL EVIDENCE
// ============================================================

export async function applyFinoraHistoricalEnrollmentEvidenceToBranchRegistry(
  responseValue:
    unknown,

  verifiedEnrollment:
    FinoraVerifiedInstallationEnrollmentRequest,
): Promise<
  FinoraHistoricalBranchBackfillApplyResult
> {

  try {

    // --------------------------------------------------------
    // 1. HISTORICAL CONTROL CENTER AUTHORITY
    //
    // Response remains untrusted until this verification passes.
    //
    // The authority requires exact Request ID and recipient
    // installation/binding provenance from verifiedEnrollment.
    // --------------------------------------------------------

    const authority =
      await verifyFinoraHistoricalInstallationEnrollmentResponseAgainstControlCenterAuthority(
        responseValue,
        verifiedEnrollment,
      );

    if (!authority.success) {
      return failure(
        authority.error,
      );
    }

    const verifiedResponse =
      authority.data.response;

    const branchCertificationPublicKey =
      verifiedEnrollment.requestSchemaVersion ===
        2
        ? verifiedEnrollment.branchCertificationPublicKey
        : undefined;

    if (
      verifiedEnrollment.requestSchemaVersion ===
        2 &&
      branchCertificationPublicKey ===
        undefined
    ) {
      return failure(
        "FINORA historical Enrollment Request V2 is missing its verified Branch Certification authority.",
      );
    }

    // --------------------------------------------------------
    // 2. IMMUTABLE IDENTITY DERIVATION
    //
    // Signed historical Response owns:
    // - ownerId
    // - businessId
    // - branchId
    // - businessCode
    // - branchCode
    //
    // Verified original Request owns:
    // - full public installation binding identity
    //
    // Enrollment evidence does NOT establish current access or
    // storage entitlement.
    // --------------------------------------------------------

    const registration =
      await registerFinoraControlCenterBranch({
        identity: {
          ownerId:
            verifiedResponse.target.ownerId,

          businessId:
            verifiedResponse.target.businessId,

          branchId:
            verifiedResponse.target.branchId,

          businessCode:
            verifiedResponse.businessCode,

          branchCode:
            verifiedResponse.branchCode,

          installation: {
            installationId:
              verifiedEnrollment.deviceBinding.installationId,

            bindingKeyId:
              verifiedEnrollment.deviceBinding.bindingKeyId,

            platform:
              verifiedEnrollment.deviceBinding.platform,

            algorithm:
              verifiedEnrollment.deviceBinding.algorithm,

            publicKeyFormat:
              verifiedEnrollment.deviceBinding.publicKeyFormat,

            publicKey:
              verifiedEnrollment.deviceBinding.publicKey,

            fingerprintAlgorithm:
              verifiedEnrollment.deviceBinding.fingerprintAlgorithm,

            publicKeyFingerprint:
              verifiedEnrollment.deviceBinding.publicKeyFingerprint,

            bindingCreatedAt:
              verifiedEnrollment.deviceBinding.createdAt,
          },
        },

        ...(
          branchCertificationPublicKey ===
            undefined
            ? {}
            : {
                branchCertificationPublicKey: {
                  ...branchCertificationPublicKey,
                },
              }
        ),
      });

    // --------------------------------------------------------
    // 3. SAFE APPLY PROOF
    // --------------------------------------------------------

    return {
      success:
        true,

      data: {
        created:
          registration.created,

        requestId:
          verifiedEnrollment.requestId,

        responseId:
          verifiedResponse.responseId,

        verificationSigningKeyId:
          authority.data.verificationKey.signingKeyId,

        verificationKeyWasCurrent:
          authority.data.verificationKey.current,

        ...(
          authority.data.verificationKey.retiredAt ===
            undefined
            ? {}
            : {
                verificationKeyRetiredAt:
                  authority.data.verificationKey.retiredAt,
              }
        ),

        record:
          registration.record,

        schemaVersion:
          1,
      },
    };

  } catch (
    error
  ) {

    return failure(
      error instanceof Error
        ? error.message
        : "FINORA historical Enrollment evidence Branch Registry apply failed.",
    );
  }
}

// ============================================================
// END
// ============================================================