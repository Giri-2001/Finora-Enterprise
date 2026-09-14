// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH ENROLLMENT TRANSACTION
// VERSION : 1.0
// STATUS  : Crash-Consistency Contract
// ============================================================

import type {
  FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  validateFinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1,
} from "./finoraPortableBranchAuthContract.js";
import {
  createHash,
} from "node:crypto";

import {
  serializeFinoraPortableBranchAuthEnvelopeV1,
  validateFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraControlBranchCredential,
} from "./finoraControlStore.js";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_SCHEMA_VERSION =
  1 as const;

export const FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_ID_PREFIX =
  "FINORA-PORTABLE-AUTH-ENROLLMENT-" as const;

// ============================================================
// STATES
// ============================================================

export type FinoraPortableBranchAuthEnrollmentTransactionStatus =
  | "PREPARED"
  | "PORTABLE_WRITTEN"
  | "CONTROL_APPLIED"
  | "COMPLETE";

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraPortableBranchAuthEnrollmentTransactionV1 {
  schemaVersion:
    typeof FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_SCHEMA_VERSION;

  transactionId:
    string;

  sourceAuthorizationId:
    string;

  sourceAuthorizationVerificationEvidence:
    FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1;

  canonicalUsername:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  storageMode:
    "LOCAL" | "USB";

  status:
    FinoraPortableBranchAuthEnrollmentTransactionStatus;

  credential:
    FinoraControlBranchCredential;

  portableEnvelope:
    FinoraPortableBranchAuthEnvelopeV1;

  portableEnvelopeSha256:
    string;

  createdAt:
    string;

  updatedAt:
    string;

  portableWrittenAt?:
    string;

  controlAppliedAt?:
    string;

  completedAt?:
    string;
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

function assertNonEmptyString(
  value:
    unknown,
  label:
    string,
): asserts value is string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value
  ) {
    throw new Error(
      `${label} must be a non-empty canonical string.`,
    );
  }
}

function assertTimestamp(
  value:
    unknown,
  label:
    string,
): asserts value is string {
  if (
    typeof value !== "string"
  ) {
    throw new Error(
      `${label} must be a canonical ISO timestamp.`,
    );
  }

  const parsed =
    Date.parse(
      value,
    );

  if (
    !Number.isFinite(
      parsed,
    ) ||
    new Date(
      parsed,
    ).toISOString() !==
      value
  ) {
    throw new Error(
      `${label} must be a canonical ISO timestamp.`,
    );
  }
}

function assertTimestampOrder(
  earlier:
    string,
  later:
    string,
  label:
    string,
): void {
  if (
    Date.parse(
      later,
    ) <
    Date.parse(
      earlier,
    )
  ) {
    throw new Error(
      `${label} timestamp order is invalid.`,
    );
  }
}

function assertSha256(
  value:
    unknown,
): asserts value is string {
  if (
    typeof value !== "string" ||
    !/^[a-f0-9]{64}$/.test(
      value,
    )
  ) {
    throw new Error(
      "portableEnvelopeSha256 must be a lower-case SHA-256 digest.",
    );
  }
}

// ============================================================
// ENVELOPE DIGEST
// ============================================================

export function computeFinoraPortableBranchAuthEnvelopeSha256(
  envelope:
    FinoraPortableBranchAuthEnvelopeV1,
): string {
  validateFinoraPortableBranchAuthEnvelopeV1(
    envelope,
  );

  return createHash(
    "sha256",
  )
    .update(
      serializeFinoraPortableBranchAuthEnvelopeV1(
        envelope,
      ),
      "utf8",
    )
    .digest(
      "hex",
    );
}

// ============================================================
// TRANSACTION VALIDATION
// ============================================================

export function finoraPortableBranchAuthSourceAuthorizationVerificationEvidenceEqual(
  left:
    FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1,

  right:
    FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1,
): boolean {

  const leftSigner =
    left.verifiedControlSigner;

  const rightSigner =
    right.verifiedControlSigner;

  const leftPortabilityProof =
    left.portabilityAuthorityProof;

  const rightPortabilityProof =
    right.portabilityAuthorityProof;

  const portabilityProofEqual =
    leftPortabilityProof ===
      undefined
      ? rightPortabilityProof ===
          undefined
      : (
          rightPortabilityProof !==
            undefined &&
          JSON.stringify(
            leftPortabilityProof,
          ) ===
            JSON.stringify(
              rightPortabilityProof,
            )
        );

  return (
    left.authorizationId ===
      right.authorizationId &&
    left.packageId ===
      right.packageId &&
    left.issuerId ===
      right.issuerId &&
    left.sequence ===
      right.sequence &&
    left.verifiedAt ===
      right.verifiedAt &&
    left.schemaVersion ===
      right.schemaVersion &&
    leftSigner.issuerId ===
      rightSigner.issuerId &&
    leftSigner.signingKeyId ===
      rightSigner.signingKeyId &&
    leftSigner.algorithm ===
      rightSigner.algorithm &&
    leftSigner.format ===
      rightSigner.format &&
    leftSigner.publicKey ===
      rightSigner.publicKey &&
    leftSigner.status ===
      rightSigner.status &&
    leftSigner.validFrom ===
      rightSigner.validFrom &&
    (
      leftSigner.validUntil ??
      undefined
    ) ===
      (
        rightSigner.validUntil ??
        undefined
      ) &&
    portabilityProofEqual
  );
}
export function validateFinoraPortableBranchAuthEnrollmentTransactionV1(
  transaction:
    FinoraPortableBranchAuthEnrollmentTransactionV1,
): void {
  if (
    transaction.schemaVersion !==
      FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_SCHEMA_VERSION
  ) {
    throw new Error(
      "Portable Branch Auth enrollment transaction schemaVersion is unsupported.",
    );
  }

  assertNonEmptyString(
    transaction.transactionId,
    "transactionId",
  );

  if (
    !transaction.transactionId.startsWith(
      FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_ID_PREFIX,
    )
  ) {
    throw new Error(
      "Portable Branch Auth enrollment transactionId is invalid.",
    );
  }

  assertNonEmptyString(
    transaction.sourceAuthorizationId,
    "sourceAuthorizationId",
  );

  validateFinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1(
    transaction.sourceAuthorizationVerificationEvidence,
  );

  if (
    transaction.sourceAuthorizationVerificationEvidence.authorizationId !==
      transaction.sourceAuthorizationId
  ) {
    throw new Error(
      "Portable Branch Auth enrollment transaction signer evidence does not match sourceAuthorizationId.",
    );
  }

  assertNonEmptyString(
    transaction.canonicalUsername,
    "canonicalUsername",
  );

  if (
    transaction.canonicalUsername !==
      transaction.canonicalUsername.toLowerCase()
  ) {
    throw new Error(
      "canonicalUsername must be lower-case.",
    );
  }

  assertNonEmptyString(
    transaction.ownerId,
    "ownerId",
  );

  assertNonEmptyString(
    transaction.businessId,
    "businessId",
  );

  assertNonEmptyString(
    transaction.branchId,
    "branchId",
  );

  if (
    transaction.storageMode !== "LOCAL" &&
    transaction.storageMode !== "USB"
  ) {
    throw new Error(
      "Portable Branch Auth transaction storageMode is invalid.",
    );
  }

  if (
    transaction.status !== "PREPARED" &&
    transaction.status !== "PORTABLE_WRITTEN" &&
    transaction.status !== "CONTROL_APPLIED" &&
    transaction.status !== "COMPLETE"
  ) {
    throw new Error(
      "Portable Branch Auth enrollment transaction status is invalid.",
    );
  }

  validateFinoraPortableBranchAuthEnvelopeV1(
    transaction.portableEnvelope,
  );

  assertSha256(
    transaction.portableEnvelopeSha256,
  );

  const expectedDigest =
    computeFinoraPortableBranchAuthEnvelopeSha256(
      transaction.portableEnvelope,
    );

  if (
    transaction.portableEnvelopeSha256 !==
      expectedDigest
  ) {
    throw new Error(
      "Portable Branch Auth enrollment transaction envelope digest does not match.",
    );
  }

  if (
    transaction.portableEnvelope.canonicalUsername !==
      transaction.canonicalUsername ||
    transaction.portableEnvelope.branchScope.ownerId !==
      transaction.ownerId ||
    transaction.portableEnvelope.branchScope.businessId !==
      transaction.businessId ||
    transaction.portableEnvelope.branchScope.branchId !==
      transaction.branchId
  ) {
    throw new Error(
      "Portable Branch Auth enrollment transaction envelope scope does not match.",
    );
  }

  const credential =
    transaction.credential;

  if (
    credential.sourceAuthorizationId !==
      transaction.sourceAuthorizationId ||
    credential.canonicalUsername !==
      transaction.canonicalUsername ||
    credential.ownerId !==
      transaction.ownerId ||
    credential.businessId !==
      transaction.businessId ||
    credential.branchId !==
      transaction.branchId ||
    credential.storageMode !==
      transaction.storageMode
  ) {
    throw new Error(
      "Portable Branch Auth enrollment transaction credential does not match.",
    );
  }

  assertTimestamp(
    transaction.createdAt,
    "createdAt",
  );

  assertTimestamp(
    transaction.updatedAt,
    "updatedAt",
  );

  assertTimestampOrder(
    transaction.createdAt,
    transaction.updatedAt,
    "createdAt/updatedAt",
  );

  if (
    transaction.status ===
      "PREPARED"
  ) {
    if (
      transaction.portableWrittenAt !== undefined ||
      transaction.controlAppliedAt !== undefined ||
      transaction.completedAt !== undefined
    ) {
      throw new Error(
        "PREPARED transaction contains later-state timestamps.",
      );
    }

    return;
  }

  assertTimestamp(
    transaction.portableWrittenAt,
    "portableWrittenAt",
  );

  assertTimestampOrder(
    transaction.createdAt,
    transaction.portableWrittenAt,
    "createdAt/portableWrittenAt",
  );

  if (
    transaction.status ===
      "PORTABLE_WRITTEN"
  ) {
    if (
      transaction.controlAppliedAt !== undefined ||
      transaction.completedAt !== undefined
    ) {
      throw new Error(
        "PORTABLE_WRITTEN transaction contains later-state timestamps.",
      );
    }

    assertTimestampOrder(
      transaction.portableWrittenAt,
      transaction.updatedAt,
      "portableWrittenAt/updatedAt",
    );

    return;
  }

  assertTimestamp(
    transaction.controlAppliedAt,
    "controlAppliedAt",
  );

  assertTimestampOrder(
    transaction.portableWrittenAt,
    transaction.controlAppliedAt,
    "portableWrittenAt/controlAppliedAt",
  );

  if (
    transaction.status ===
      "CONTROL_APPLIED"
  ) {
    if (
      transaction.completedAt !== undefined
    ) {
      throw new Error(
        "CONTROL_APPLIED transaction contains completedAt.",
      );
    }

    assertTimestampOrder(
      transaction.controlAppliedAt,
      transaction.updatedAt,
      "controlAppliedAt/updatedAt",
    );

    return;
  }

  assertTimestamp(
    transaction.completedAt,
    "completedAt",
  );

  assertTimestampOrder(
    transaction.controlAppliedAt,
    transaction.completedAt,
    "controlAppliedAt/completedAt",
  );

  assertTimestampOrder(
    transaction.completedAt,
    transaction.updatedAt,
    "completedAt/updatedAt",
  );
}

// ============================================================
// TRANSITION POLICY
// ============================================================

export function canAdvanceFinoraPortableBranchAuthEnrollmentTransaction(
  current:
    FinoraPortableBranchAuthEnrollmentTransactionStatus,
  next:
    FinoraPortableBranchAuthEnrollmentTransactionStatus,
): boolean {
  return (
    (
      current === "PREPARED" &&
      next === "PORTABLE_WRITTEN"
    ) ||
    (
      current === "PORTABLE_WRITTEN" &&
      next === "CONTROL_APPLIED"
    ) ||
    (
      current === "CONTROL_APPLIED" &&
      next === "COMPLETE"
    )
  );
}

// ============================================================
// END
// ============================================================