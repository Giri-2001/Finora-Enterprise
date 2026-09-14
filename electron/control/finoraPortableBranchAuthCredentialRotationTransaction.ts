// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH CREDENTIAL ROTATION TRANSACTION
//
// RESPONSIBILITY:
//
// - Durable crash-recovery contract for credential rotation
// - Freeze current generation and target generation exactly once
// - Preserve original credential-enrollment provenance
// - Preserve exact expected predecessor credential/envelope
// - Preserve exact replacement credential/envelope
// - No plaintext Password or Security Code
//
// STATE MACHINE:
//
// PREPARED
//   -> PORTABLE_REPLACED
//   -> CONTROL_APPLIED
//   -> COMPLETE
//
// VERSION : 1.0
// STATUS  : Crash-Consistency Contract
// ============================================================

import {
  createHash,
} from "node:crypto";

import {
  FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION,
  serializeFinoraPortableBranchAuthEnvelopeV1,
  validateFinoraPortableBranchAuthEnvelopeV1,
  validateFinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
  FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraControlBranchCredential,
} from "./finoraControlStore.js";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION =
  1 as const;

export const FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX =
  "FINORA-PORTABLE-AUTH-ROTATION-" as const;

// ============================================================
// STATE
// ============================================================

export type FinoraPortableBranchAuthCredentialRotationTransactionStatus =
  | "PREPARED"
  | "PORTABLE_REPLACED"
  | "CONTROL_APPLIED"
  | "COMPLETE";

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraPortableBranchAuthCredentialRotationTransactionV1 {
  schemaVersion:
    typeof FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION;

  transactionId:
    string;

  sourceAuthorizationId:
    string;

  sourceAuthorizationVerificationEvidence:
    FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1;

  credentialId:
    string;

  userId:
    string;

  canonicalUsername:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  storageMode:
    | "LOCAL"
    | "USB";

  dataContext:
    | "REAL"
    | "DEMO";

  demoId?:
    string;

  /**
   * Generation observed from the authoritative current credential
   * when this immutable transaction was prepared.
   *
   * Legacy credentials without an explicit persisted generation
   * normalize to FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION.
   */
  currentGeneration:
    number;

  /**
   * Frozen once at PREPARED time.
   *
   * MUST equal currentGeneration + 1.
   * Retry/recovery MUST replay this target rather than incrementing
   * again.
   */
  targetGeneration:
    number;

  /**
   * Exact current Control Store credential snapshot expected by
   * the eventual credential compare-and-replace mutation.
   */
  expectedCredential:
    FinoraControlBranchCredential;

  /**
   * Exact replacement credential snapshot to commit.
   *
   * Plaintext Password / Security Code never appear here.
   */
  replacementCredential:
    FinoraControlBranchCredential;

  /**
   * Exact current Portable Auth predecessor expected by CAS.
   */
  expectedPortableEnvelope:
    FinoraPortableBranchAuthEnvelopeV1;

  expectedPortableEnvelopeSha256:
    string;

  /**
   * Exact replacement Portable Auth envelope generated before the
   * transaction is persisted.
   */
  replacementPortableEnvelope:
    FinoraPortableBranchAuthEnvelopeV1;

  replacementPortableEnvelopeSha256:
    string;

  status:
    FinoraPortableBranchAuthCredentialRotationTransactionStatus;

  createdAt:
    string;

  updatedAt:
    string;

  portableReplacedAt?:
    string;

  controlAppliedAt?:
    string;

  completedAt?:
    string;
}

// ============================================================
// HELPERS
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
    value.trim() !==
      value
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
    typeof value !==
      "string"
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

function assertPositiveSafeInteger(
  value:
    unknown,
  label:
    string,
): asserts value is number {
  if (
    !Number.isSafeInteger(
      value,
    ) ||
    (
      value as number
    ) <=
      0
  ) {
    throw new Error(
      `${label} must be a positive safe integer.`,
    );
  }
}

function assertSha256(
  value:
    unknown,
  label:
    string,
): asserts value is string {
  if (
    typeof value !==
      "string" ||
    !/^[a-f0-9]{64}$/.test(
      value,
    )
  ) {
    throw new Error(
      `${label} must be a lower-case SHA-256 digest.`,
    );
  }
}

function credentialVerifierEqual(
  left:
    FinoraControlBranchCredential["verifier"] |
    FinoraControlBranchCredential["securityVerifier"],
  right:
    FinoraControlBranchCredential["verifier"] |
    FinoraControlBranchCredential["securityVerifier"],
): boolean {
  return JSON.stringify(
    left ??
      null,
  ) ===
    JSON.stringify(
      right ??
        null,
    );
}

function credentialImmutableIdentityEqual(
  left:
    FinoraControlBranchCredential,
  right:
    FinoraControlBranchCredential,
): boolean {
  return (
    left.schemaVersion ===
      right.schemaVersion &&
    left.credentialId ===
      right.credentialId &&
    left.sourceAuthorizationId ===
      right.sourceAuthorizationId &&
    left.userId ===
      right.userId &&
    left.username ===
      right.username &&
    left.canonicalUsername ===
      right.canonicalUsername &&
    left.fullName ===
      right.fullName &&
    left.role ===
      right.role &&
    left.ownerId ===
      right.ownerId &&
    left.businessId ===
      right.businessId &&
    left.branchId ===
      right.branchId &&
    left.storageMode ===
      right.storageMode &&
    left.dataContext ===
      right.dataContext &&
    (
      left.demoId ??
      undefined
    ) ===
      (
        right.demoId ??
        undefined
      ) &&
    left.status ===
      right.status &&
    left.createdAt ===
      right.createdAt
  );
}

function transactionMatchesCredential(
  transaction:
    FinoraPortableBranchAuthCredentialRotationTransactionV1,
  credential:
    FinoraControlBranchCredential,
): boolean {
  return (
    credential.credentialId ===
      transaction.credentialId &&
    credential.sourceAuthorizationId ===
      transaction.sourceAuthorizationId &&
    credential.userId ===
      transaction.userId &&
    credential.canonicalUsername ===
      transaction.canonicalUsername &&
    credential.ownerId ===
      transaction.ownerId &&
    credential.businessId ===
      transaction.businessId &&
    credential.branchId ===
      transaction.branchId &&
    credential.storageMode ===
      transaction.storageMode &&
    credential.dataContext ===
      transaction.dataContext &&
    (
      credential.demoId ??
      undefined
    ) ===
      (
        transaction.demoId ??
        undefined
      ) &&
    credential.status ===
      "ACTIVE" &&
    credential.schemaVersion ===
      1
  );
}

function transactionMatchesEnvelope(
  transaction:
    FinoraPortableBranchAuthCredentialRotationTransactionV1,
  envelope:
    FinoraPortableBranchAuthEnvelopeV1,
): boolean {
  return (
    envelope.canonicalUsername ===
      transaction.canonicalUsername &&
    envelope.branchScope.ownerId ===
      transaction.ownerId &&
    envelope.branchScope.businessId ===
      transaction.businessId &&
    envelope.branchScope.branchId ===
      transaction.branchId
  );
}

// ============================================================
// ENVELOPE DIGEST
// ============================================================

export function computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256(
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
// VALIDATION
// ============================================================

export function validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
  transaction:
    FinoraPortableBranchAuthCredentialRotationTransactionV1,
): void {
  if (
    transaction.schemaVersion !==
      FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION
  ) {
    throw new Error(
      "Portable Branch Auth credential rotation transaction schemaVersion is unsupported.",
    );
  }

  assertNonEmptyString(
    transaction.transactionId,
    "transactionId",
  );

  if (
    !transaction.transactionId.startsWith(
      FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX,
    )
  ) {
    throw new Error(
      "Portable Branch Auth credential rotation transactionId is invalid.",
    );
  }

  for (
    const [
      label,
      value,
    ] of [
      [
        "sourceAuthorizationId",
        transaction.sourceAuthorizationId,
      ],
      [
        "credentialId",
        transaction.credentialId,
      ],
      [
        "userId",
        transaction.userId,
      ],
      [
        "canonicalUsername",
        transaction.canonicalUsername,
      ],
      [
        "ownerId",
        transaction.ownerId,
      ],
      [
        "businessId",
        transaction.businessId,
      ],
      [
        "branchId",
        transaction.branchId,
      ],
    ] as const
  ) {
    assertNonEmptyString(
      value,
      label,
    );
  }

  if (
    transaction.canonicalUsername !==
      transaction.canonicalUsername.toLowerCase()
  ) {
    throw new Error(
      "canonicalUsername must be lower-case.",
    );
  }

  if (
    transaction.storageMode !==
      "LOCAL" &&
    transaction.storageMode !==
      "USB"
  ) {
    throw new Error(
      "Credential rotation storageMode is invalid.",
    );
  }

  if (
    transaction.dataContext !==
      "REAL" &&
    transaction.dataContext !==
      "DEMO"
  ) {
    throw new Error(
      "Credential rotation dataContext is invalid.",
    );
  }

  if (
    transaction.dataContext ===
      "REAL"
  ) {
    if (
      transaction.demoId !==
        undefined
    ) {
      throw new Error(
        "REAL credential rotation cannot contain demoId.",
      );
    }
  }
  else {
    assertNonEmptyString(
      transaction.demoId,
      "demoId",
    );
  }

  validateFinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1(
    transaction.sourceAuthorizationVerificationEvidence,
  );

  if (
    transaction.sourceAuthorizationVerificationEvidence.authorizationId !==
      transaction.sourceAuthorizationId
  ) {
    throw new Error(
      "Credential rotation source authorization evidence does not match sourceAuthorizationId.",
    );
  }

  assertPositiveSafeInteger(
    transaction.currentGeneration,
    "currentGeneration",
  );

  assertPositiveSafeInteger(
    transaction.targetGeneration,
    "targetGeneration",
  );

  if (
    transaction.currentGeneration >=
      Number.MAX_SAFE_INTEGER ||
    transaction.targetGeneration !==
      transaction.currentGeneration +
        1
  ) {
    throw new Error(
      "Credential rotation targetGeneration must equal currentGeneration + 1 exactly.",
    );
  }

  if (
    !transactionMatchesCredential(
      transaction,
      transaction.expectedCredential,
    ) ||
    !transactionMatchesCredential(
      transaction,
      transaction.replacementCredential,
    )
  ) {
    throw new Error(
      "Credential rotation credential snapshot does not match transaction authority.",
    );
  }

  if (
    !credentialImmutableIdentityEqual(
      transaction.expectedCredential,
      transaction.replacementCredential,
    )
  ) {
    throw new Error(
      "Credential rotation cannot change immutable credential identity.",
    );
  }

  const normalizedExpectedGeneration =
    transaction.expectedCredential.authGeneration ??
    FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION;

  if (
    normalizedExpectedGeneration !==
      transaction.currentGeneration
  ) {
    throw new Error(
      "Expected credential generation does not match currentGeneration.",
    );
  }

  if (
    transaction.replacementCredential.authGeneration !==
      transaction.targetGeneration
  ) {
    throw new Error(
      "Replacement credential generation does not match targetGeneration.",
    );
  }

  if (
    credentialVerifierEqual(
      transaction.expectedCredential.verifier,
      transaction.replacementCredential.verifier,
    ) &&
    credentialVerifierEqual(
      transaction.expectedCredential.securityVerifier,
      transaction.replacementCredential.securityVerifier,
    )
  ) {
    throw new Error(
      "Credential rotation must change at least one credential verifier.",
    );
  }

  assertTimestamp(
    transaction.expectedCredential.createdAt,
    "expectedCredential.createdAt",
  );

  assertTimestamp(
    transaction.expectedCredential.updatedAt,
    "expectedCredential.updatedAt",
  );

  assertTimestamp(
    transaction.replacementCredential.createdAt,
    "replacementCredential.createdAt",
  );

  assertTimestamp(
    transaction.replacementCredential.updatedAt,
    "replacementCredential.updatedAt",
  );

  assertTimestampOrder(
    transaction.expectedCredential.updatedAt,
    transaction.replacementCredential.updatedAt,
    "credential updatedAt",
  );

  validateFinoraPortableBranchAuthEnvelopeV1(
    transaction.expectedPortableEnvelope,
  );

  validateFinoraPortableBranchAuthEnvelopeV1(
    transaction.replacementPortableEnvelope,
  );

  if (
    !transactionMatchesEnvelope(
      transaction,
      transaction.expectedPortableEnvelope,
    ) ||
    !transactionMatchesEnvelope(
      transaction,
      transaction.replacementPortableEnvelope,
    )
  ) {
    throw new Error(
      "Credential rotation Portable Auth envelope scope does not match transaction authority.",
    );
  }

  assertSha256(
    transaction.expectedPortableEnvelopeSha256,
    "expectedPortableEnvelopeSha256",
  );

  assertSha256(
    transaction.replacementPortableEnvelopeSha256,
    "replacementPortableEnvelopeSha256",
  );

  const expectedDigest =
    computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256(
      transaction.expectedPortableEnvelope,
    );

  const replacementDigest =
    computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256(
      transaction.replacementPortableEnvelope,
    );

  if (
    transaction.expectedPortableEnvelopeSha256 !==
      expectedDigest ||
    transaction.replacementPortableEnvelopeSha256 !==
      replacementDigest
  ) {
    throw new Error(
      "Credential rotation Portable Auth envelope digest does not match.",
    );
  }

  if (
    transaction.expectedPortableEnvelopeSha256 ===
      transaction.replacementPortableEnvelopeSha256
  ) {
    throw new Error(
      "Credential rotation replacement Portable Auth must differ from predecessor.",
    );
  }

  if (
    transaction.status !==
      "PREPARED" &&
    transaction.status !==
      "PORTABLE_REPLACED" &&
    transaction.status !==
      "CONTROL_APPLIED" &&
    transaction.status !==
      "COMPLETE"
  ) {
    throw new Error(
      "Credential rotation transaction status is invalid.",
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
      transaction.portableReplacedAt !==
        undefined ||
      transaction.controlAppliedAt !==
        undefined ||
      transaction.completedAt !==
        undefined
    ) {
      throw new Error(
        "PREPARED rotation transaction contains later-state timestamps.",
      );
    }

    return;
  }

  assertTimestamp(
    transaction.portableReplacedAt,
    "portableReplacedAt",
  );

  assertTimestampOrder(
    transaction.createdAt,
    transaction.portableReplacedAt,
    "createdAt/portableReplacedAt",
  );

  if (
    transaction.status ===
      "PORTABLE_REPLACED"
  ) {
    if (
      transaction.controlAppliedAt !==
        undefined ||
      transaction.completedAt !==
        undefined
    ) {
      throw new Error(
        "PORTABLE_REPLACED transaction contains later-state timestamps.",
      );
    }

    assertTimestampOrder(
      transaction.portableReplacedAt,
      transaction.updatedAt,
      "portableReplacedAt/updatedAt",
    );

    return;
  }

  assertTimestamp(
    transaction.controlAppliedAt,
    "controlAppliedAt",
  );

  assertTimestampOrder(
    transaction.portableReplacedAt,
    transaction.controlAppliedAt,
    "portableReplacedAt/controlAppliedAt",
  );

  if (
    transaction.status ===
      "CONTROL_APPLIED"
  ) {
    if (
      transaction.completedAt !==
        undefined
    ) {
      throw new Error(
        "CONTROL_APPLIED rotation transaction contains completedAt.",
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

export function canAdvanceFinoraPortableBranchAuthCredentialRotationTransaction(
  current:
    FinoraPortableBranchAuthCredentialRotationTransactionStatus,
  next:
    FinoraPortableBranchAuthCredentialRotationTransactionStatus,
): boolean {
  return (
    (
      current ===
        "PREPARED" &&
      next ===
        "PORTABLE_REPLACED"
    ) ||
    (
      current ===
        "PORTABLE_REPLACED" &&
      next ===
        "CONTROL_APPLIED"
    ) ||
    (
      current ===
        "CONTROL_APPLIED" &&
      next ===
        "COMPLETE"
    )
  );
}

// ============================================================
// END
// ============================================================