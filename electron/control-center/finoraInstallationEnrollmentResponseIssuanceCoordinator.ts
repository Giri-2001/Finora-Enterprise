/* ===========================================================
   FINORA ENTERPRISE OS™

   INSTALLATION ENROLLMENT RESPONSE ISSUANCE COORDINATOR

   MODULE  : Control Center
   LAYER   : Privileged Main-Process Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Accept one already cryptographically verified native
     Installation Enrollment Request
   - Accept only operator-owned business identity assignment
   - Derive installation binding exclusively from verified data
   - Reserve authoritative responseId / sequence / issuedAt
   - Derive fixed short bootstrap expiry
   - Delegate cryptographic signing to the dedicated issuer

   SECURITY:

   - MAIN PROCESS ONLY.
   - No renderer import.
   - No IPC registration.
   - Operator cannot supply installationId.
   - Operator cannot supply bindingKeyId.
   - Operator cannot supply device public-key fingerprint.
   - Operator cannot supply responseId.
   - Operator cannot supply sequence.
   - Operator cannot supply issuedAt / expiresAt.
   - No REGISTERED / DEMO authority.
   - No LOCAL / USB entitlement authority.
=========================================================== */

import {
  FINORA_INSTALLATION_ENROLLMENT_RESPONSE_MAX_VALIDITY_MS,
  signFinoraInstallationEnrollmentResponse,
} from "./finoraInstallationEnrollmentResponseIssuer.js";

import {
  reserveFinoraControlCenterIssuance,
} from "./finoraControlCenterIssuanceLedger.js";

import type {
  FinoraVerifiedInstallationEnrollmentRequest,
} from "./finoraInstallationEnrollmentRequestVerifier.js";

import {
  assertFinoraBranchCertificationPublicKey,
} from "../control/finoraBranchCertificationCrypto.js";

import type {
  FinoraInstallationEnrollmentResponseTarget,
  FinoraSignedInstallationEnrollmentResponse,
} from "../control/finoraInstallationEnrollmentResponse.types.js";

// ============================================================
// OPERATOR ASSIGNMENT
// ============================================================

export interface FinoraInstallationEnrollmentOperatorAssignment {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  businessCode:
    string;

  branchCode:
    string;
}

// ============================================================
// INPUT
// ============================================================

export interface IssueFinoraInstallationEnrollmentResponseInput {

  verifiedEnrollment:
    FinoraVerifiedInstallationEnrollmentRequest;

  assignment:
    FinoraInstallationEnrollmentOperatorAssignment;
}

// ============================================================
// HELPERS
// ============================================================

function hasText(
  value:
    string,
  maxLength:
    number,
): boolean {

  return (
    value.trim().length >
      0 &&
    value.length <=
      maxLength
  );
}

function validateAssignment(
  assignment:
    FinoraInstallationEnrollmentOperatorAssignment,
): void {

  if (
    !hasText(
      assignment.ownerId,
      256,
    ) ||
    !hasText(
      assignment.businessId,
      256,
    ) ||
    !hasText(
      assignment.branchId,
      256,
    ) ||
    !hasText(
      assignment.businessCode,
      64,
    ) ||
    !hasText(
      assignment.branchCode,
      64,
    )
  ) {
    throw new Error(
      "FINORA Installation Enrollment operator assignment is incomplete.",
    );
  }
}

function validateLiveEnrollmentRequest(
  verifiedEnrollment:
    FinoraVerifiedInstallationEnrollmentRequest,
): void {

  /*
   * V1 remains verifiable for historical evidence/backfill only.
   *
   * A new live provisioning operation must carry the branch-held
   * certification public authority introduced by Request V2.
   *
   * This validation intentionally runs before issuance-ledger
   * reservation so a legacy/malformed request consumes no sequence.
   */
  if (
    verifiedEnrollment.requestSchemaVersion !==
      2 ||
    verifiedEnrollment.branchCertificationPublicKey ===
      undefined
  ) {
    throw new Error(
      "FINORA live Installation Enrollment Response issuance requires a verified V2 Enrollment Request with Branch Certification authority.",
    );
  }

  try {
    assertFinoraBranchCertificationPublicKey(
      verifiedEnrollment.branchCertificationPublicKey,
    );
  } catch {
    throw new Error(
      "FINORA live Installation Enrollment Request contains invalid Branch Certification authority.",
    );
  }
}

function deriveVerifiedTarget(
  verifiedEnrollment:
    FinoraVerifiedInstallationEnrollmentRequest,

  assignment:
    FinoraInstallationEnrollmentOperatorAssignment,
): FinoraInstallationEnrollmentResponseTarget {

  /*
   * Installation binding is derived only from the output of the
   * cryptographic Enrollment Request verifier.
   *
   * None of these device-binding fields exist in the operator
   * assignment contract.
   */

  return {
    ownerId:
      assignment.ownerId,

    businessId:
      assignment.businessId,

    branchId:
      assignment.branchId,

    installationId:
      verifiedEnrollment.target.installationId,

    bindingKeyId:
      verifiedEnrollment.target.bindingKeyId,

    fingerprintAlgorithm:
      verifiedEnrollment.target.fingerprintAlgorithm,

    publicKeyFingerprint:
      verifiedEnrollment.target.publicKeyFingerprint,
  };
}

function createExpiry(
  issuedAt:
    string,
): string {

  const issuedAtMs =
    Date.parse(
      issuedAt,
    );

  if (
    !Number.isFinite(
      issuedAtMs,
    ) ||
    new Date(
      issuedAtMs,
    ).toISOString() !==
      issuedAt
  ) {
    throw new Error(
      "FINORA authoritative Enrollment Response issuedAt is invalid.",
    );
  }

  const expiresAtMs =
    issuedAtMs +
      FINORA_INSTALLATION_ENROLLMENT_RESPONSE_MAX_VALIDITY_MS;

  if (
    !Number.isSafeInteger(
      expiresAtMs,
    )
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response expiry is outside the supported timestamp range.",
    );
  }

  return new Date(
    expiresAtMs,
  ).toISOString();
}

// ============================================================
// END-TO-END SERIALIZATION
// ============================================================

let enrollmentResponseIssuanceQueue:
  Promise<void> =
    Promise.resolve();

function runSerializedEnrollmentResponseIssuance<T>(
  operation:
    () => Promise<T>,
): Promise<T> {

  const result =
    enrollmentResponseIssuanceQueue.then(
      operation,
      operation,
    );

  enrollmentResponseIssuanceQueue =
    result.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return result;
}

// ============================================================
// ISSUE
// ============================================================

export function issueFinoraInstallationEnrollmentResponse(
  input:
    IssueFinoraInstallationEnrollmentResponseInput,
): Promise<
  FinoraSignedInstallationEnrollmentResponse
> {

  return runSerializedEnrollmentResponseIssuance(
    async () => {

      validateAssignment(
        input.assignment,
      );

      validateLiveEnrollmentRequest(
        input.verifiedEnrollment,
      );

      const target =
        deriveVerifiedTarget(
          input.verifiedEnrollment,
          input.assignment,
        );

      /*
       * The ledger owns:
       *
       * - monotonic sequence
       * - authoritative wall-clock issuedAt
       * - FINORA-ENROLLMENT-RESPONSE-* response identifier
       *
       * Reservation is persisted before signing. A crash may
       * consume a sequence, but cannot reuse a stale sequence.
       */

      const reservation =
        await reserveFinoraControlCenterIssuance({
          purpose:
            "INSTALLATION_ENROLLMENT_RESPONSE",

          scope: {
            ownerId:
              target.ownerId,

            businessId:
              target.businessId,

            branchId:
              target.branchId,

            installationId:
              target.installationId,
          },
        });

      const expiresAt =
        createExpiry(
          reservation.issuedAt,
        );

      return signFinoraInstallationEnrollmentResponse({
        responseId:
          reservation.packageId,

        requestId:
          input.verifiedEnrollment.requestId,

        sequence:
          reservation.sequence,

        issuedAt:
          reservation.issuedAt,

        expiresAt,

        target,

        businessCode:
          input.assignment.businessCode,

        branchCode:
          input.assignment.branchCode,
      });
    },
  );
}

// ============================================================
// END
// ============================================================