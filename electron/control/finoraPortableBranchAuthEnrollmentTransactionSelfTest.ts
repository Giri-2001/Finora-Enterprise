// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE AUTH ENROLLMENT TRANSACTION SELF-TEST
// VERSION : 1.0
// STATUS  : Executable Proof
// ============================================================

import {
  createFinoraPortableBranchAuthTestSourceAuthorizationEvidence,
} from "./finoraPortableBranchAuthTestEvidence.js";

import {
  createFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_ID_PREFIX,
  FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_SCHEMA_VERSION,
  canAdvanceFinoraPortableBranchAuthEnrollmentTransaction,
  computeFinoraPortableBranchAuthEnvelopeSha256,
  finoraPortableBranchAuthSourceAuthorizationVerificationEvidenceEqual,
  validateFinoraPortableBranchAuthEnrollmentTransactionV1,
} from "./finoraPortableBranchAuthEnrollmentTransaction.js";

import type {
  FinoraPortableBranchAuthEnrollmentTransactionV1,
} from "./finoraPortableBranchAuthEnrollmentTransaction.js";

import type {
  FinoraControlBranchCredential,
} from "./finoraControlStore.js";

// ============================================================
// HELPERS
// ============================================================

function assertTrue(
  condition:
    unknown,
  message:
    string,
): asserts condition {
  if (!condition) {
    throw new Error(
      `FAIL: ${message}`,
    );
  }
}

function expectFailure(
  label:
    string,
  action:
    () => void,
): void {
  try {
    action();
  }
  catch {
    console.log(
      `PASS: ${label}`,
    );

    return;
  }

  throw new Error(
    `FAIL: ${label}: expected rejection.`,
  );
}

function cloneTransaction(
  transaction:
    FinoraPortableBranchAuthEnrollmentTransactionV1,
): FinoraPortableBranchAuthEnrollmentTransactionV1 {
  return JSON.parse(
    JSON.stringify(
      transaction,
    ),
  ) as FinoraPortableBranchAuthEnrollmentTransactionV1;
}

// ============================================================
// EXECUTABLE PROOF
// ============================================================

async function main(): Promise<void> {
  console.log(
    "===== PHASE 5.6E3D3C2 TRANSACTION EXECUTABLE PROOF =====",
  );

  const envelope =
    await createFinoraPortableBranchAuthEnvelopeV1({
      authStateId:
        "PORTABLE-AUTH-TRANSACTION-STATE-000001",

      sourceAuthorizationId:
        "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",

      sourceAuthorizationVerificationEvidence:
        createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
          "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",
        ),

      ownerId:
        "OWNER-TRANSACTION-000001",

      businessId:
        "BUSINESS-TRANSACTION-000001",

      branchId:
        "BRANCH-TRANSACTION-000001",

      userId:
        "USER-TRANSACTION-000001",

      username:
        "Admin",

      fullName:
        "FINORA Transaction Test Owner",

      role:
        "OWNER",

      dataContext:
        "REAL",

      storageMode:
        "USB",

      authGeneration:
        1,

      createdAt:
        "2026-09-11T12:00:00.000Z",

      updatedAt:
        "2026-09-11T12:00:01.000Z",

      password:
        "admin123",

      securityCode:
        "branch-sec-9876",
    });

  const credential =
    {
      schemaVersion:
        1,

      credentialId:
        "FINORA-CREDENTIAL-TRANSACTION-000001",

      sourceAuthorizationId:
        "AUTHORIZATION-TRANSACTION-000001",

      userId:
        "USER-TRANSACTION-000001",

      username:
        "Admin",

      canonicalUsername:
        "admin",

      fullName:
        "FINORA Transaction Test Owner",

      role:
        "ADMIN",

      ownerId:
        "OWNER-TRANSACTION-000001",

      businessId:
        "BUSINESS-TRANSACTION-000001",

      branchId:
        "BRANCH-TRANSACTION-000001",

      storageMode:
        "USB",

      dataContext:
        "REAL",

      status:
        "ACTIVE",

      verifier:
        {
          algorithm:
            "SCRYPT",

          saltEncoding:
            "BASE64",

          salt:
            "AAAAAAAAAAAAAAAAAAAAAA==",

          derivedKeyEncoding:
            "BASE64",

          derivedKey:
            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",

          keyLength:
            32,

          N:
            32768,

          r:
            8,

          p:
            1,
        },

      securityVerifier:
        {
          algorithm:
            "SCRYPT",

          saltEncoding:
            "BASE64",

          salt:
            "AQEBAQEBAQEBAQEBAQEBAQ==",

          derivedKeyEncoding:
            "BASE64",

          derivedKey:
            "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",

          keyLength:
            32,

          N:
            32768,

          r:
            8,

          p:
            1,
        },

      createdAt:
        "2026-09-11T12:00:02.000Z",

      updatedAt:
        "2026-09-11T12:00:02.000Z",
    } as FinoraControlBranchCredential;

  const digest =
    computeFinoraPortableBranchAuthEnvelopeSha256(
      envelope,
    );

  const prepared:
    FinoraPortableBranchAuthEnrollmentTransactionV1 =
    {
      schemaVersion:
        FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_SCHEMA_VERSION,

      transactionId:
        `${FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_ID_PREFIX}000001`,

      sourceAuthorizationId:
        credential.sourceAuthorizationId,

      sourceAuthorizationVerificationEvidence:
        createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
          credential.sourceAuthorizationId,
        ),

      canonicalUsername:
        credential.canonicalUsername,

      ownerId:
        credential.ownerId,

      businessId:
        credential.businessId,

      branchId:
        credential.branchId,

      storageMode:
        credential.storageMode,

      status:
        "PREPARED",

      credential,

      portableEnvelope:
        envelope,

      portableEnvelopeSha256:
        digest,

      createdAt:
        "2026-09-11T12:00:02.000Z",

      updatedAt:
        "2026-09-11T12:00:02.000Z",
    };

  validateFinoraPortableBranchAuthEnrollmentTransactionV1(
    prepared,
  );

  const withoutSignerEvidence =
    cloneTransaction(
      prepared,
    ) as unknown as
      Record<string, unknown>;

  delete withoutSignerEvidence
    .sourceAuthorizationVerificationEvidence;

  expectFailure(
    "missing journal signer evidence fails closed",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        withoutSignerEvidence as unknown as
          FinoraPortableBranchAuthEnrollmentTransactionV1,
      ),
  );

  const wrongAuthorizationEvidence =
    cloneTransaction(
      prepared,
    );

  wrongAuthorizationEvidence
    .sourceAuthorizationVerificationEvidence
    .authorizationId =
      "FINORA-WRONG-AUTHORIZATION";

  expectFailure(
    "journal signer evidence/sourceAuthorizationId mismatch fails closed",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        wrongAuthorizationEvidence,
      ),
  );

  const structurallyTamperedEvidence =
    cloneTransaction(
      prepared,
    );

  structurallyTamperedEvidence
    .sourceAuthorizationVerificationEvidence
    .packageId =
      "FINORA-CONTROL-PACKAGE-STRUCTURAL-TAMPER";

  validateFinoraPortableBranchAuthEnrollmentTransactionV1(
    structurallyTamperedEvidence,
  );

  assertTrue(
    finoraPortableBranchAuthSourceAuthorizationVerificationEvidenceEqual(
      prepared.sourceAuthorizationVerificationEvidence,
      cloneTransaction(
        prepared,
      ).sourceAuthorizationVerificationEvidence,
    ),
    "Exact signer provenance did not compare equal.",
  );

  assertTrue(
    !finoraPortableBranchAuthSourceAuthorizationVerificationEvidenceEqual(
      prepared.sourceAuthorizationVerificationEvidence,
      structurallyTamperedEvidence.sourceAuthorizationVerificationEvidence,
    ),
    "Structurally modified signer provenance unexpectedly compared equal.",
  );

  console.log(
    "PASS: journal signer evidence is required and authorization-bound",
  );

  console.log(
    "PASS: exact signer provenance comparator rejects structural mismatch",
  );

  console.log(
    "PASS: PREPARED transaction validates",
  );

  const portableWritten:
    FinoraPortableBranchAuthEnrollmentTransactionV1 =
    {
      ...cloneTransaction(
        prepared,
      ),

      status:
        "PORTABLE_WRITTEN",

      updatedAt:
        "2026-09-11T12:00:03.000Z",

      portableWrittenAt:
        "2026-09-11T12:00:03.000Z",
    };

  validateFinoraPortableBranchAuthEnrollmentTransactionV1(
    portableWritten,
  );

  console.log(
    "PASS: PORTABLE_WRITTEN transaction validates",
  );

  const controlApplied:
    FinoraPortableBranchAuthEnrollmentTransactionV1 =
    {
      ...cloneTransaction(
        portableWritten,
      ),

      status:
        "CONTROL_APPLIED",

      updatedAt:
        "2026-09-11T12:00:04.000Z",

      controlAppliedAt:
        "2026-09-11T12:00:04.000Z",
    };

  validateFinoraPortableBranchAuthEnrollmentTransactionV1(
    controlApplied,
  );

  console.log(
    "PASS: CONTROL_APPLIED transaction validates",
  );

  const complete:
    FinoraPortableBranchAuthEnrollmentTransactionV1 =
    {
      ...cloneTransaction(
        controlApplied,
      ),

      status:
        "COMPLETE",

      updatedAt:
        "2026-09-11T12:00:05.000Z",

      completedAt:
        "2026-09-11T12:00:05.000Z",
    };

  validateFinoraPortableBranchAuthEnrollmentTransactionV1(
    complete,
  );

  console.log(
    "PASS: COMPLETE transaction validates",
  );

  // ==========================================================
  // CERTIFICATION-AWARE DURABLE MIGRATION CONTRACT
  // ==========================================================

  const branchCertificationProvenance = {
    requestId:
      "FINORA-ENROLLMENT-TRANSACTION-CERT-000001",

    responseId:
      "FINORA-ENROLLMENT-RESPONSE-TRANSACTION-CERT-000001",

    certificationKeyId:
      "FINORA-BRANCH-CERT-0123456789ABCDEF0123456789ABCDEF",
  };

  const certificationPrepared:
    FinoraPortableBranchAuthEnrollmentTransactionV1 =
    {
      ...cloneTransaction(
        prepared,
      ),

      branchCertificationProvenance,
    };

  validateFinoraPortableBranchAuthEnrollmentTransactionV1(
    certificationPrepared,
  );

  console.log(
    "PASS: certification-aware PREPARED transaction validates with non-secret provenance",
  );

  const certificationPortableWritten:
    FinoraPortableBranchAuthEnrollmentTransactionV1 =
    {
      ...cloneTransaction(
        certificationPrepared,
      ),

      status:
        "PORTABLE_WRITTEN",

      updatedAt:
        "2026-09-11T12:00:03.000Z",

      portableWrittenAt:
        "2026-09-11T12:00:03.000Z",
    };

  validateFinoraPortableBranchAuthEnrollmentTransactionV1(
    certificationPortableWritten,
  );

  const certificationControlApplied:
    FinoraPortableBranchAuthEnrollmentTransactionV1 =
    {
      ...cloneTransaction(
        certificationPortableWritten,
      ),

      status:
        "CONTROL_APPLIED",

      updatedAt:
        "2026-09-11T12:00:04.000Z",

      controlAppliedAt:
        "2026-09-11T12:00:04.000Z",
    };

  validateFinoraPortableBranchAuthEnrollmentTransactionV1(
    certificationControlApplied,
  );

  const certificationMigrated:
    FinoraPortableBranchAuthEnrollmentTransactionV1 =
    {
      ...cloneTransaction(
        certificationControlApplied,
      ),

      status:
        "CERTIFICATION_MIGRATED",

      updatedAt:
        "2026-09-11T12:00:04.500Z",

      certificationMigratedAt:
        "2026-09-11T12:00:04.500Z",
    };

  validateFinoraPortableBranchAuthEnrollmentTransactionV1(
    certificationMigrated,
  );

  console.log(
    "PASS: CERTIFICATION_MIGRATED transaction validates with exact durable provenance",
  );

  const certificationComplete:
    FinoraPortableBranchAuthEnrollmentTransactionV1 =
    {
      ...cloneTransaction(
        certificationMigrated,
      ),

      status:
        "COMPLETE",

      updatedAt:
        "2026-09-11T12:00:05.000Z",

      completedAt:
        "2026-09-11T12:00:05.000Z",
    };

  validateFinoraPortableBranchAuthEnrollmentTransactionV1(
    certificationComplete,
  );

  console.log(
    "PASS: certification-aware COMPLETE preserves durable migration evidence",
  );

  const migratedWithoutProvenance =
    {
      ...cloneTransaction(
        controlApplied,
      ),

      status:
        "CERTIFICATION_MIGRATED",

      updatedAt:
        "2026-09-11T12:00:04.500Z",

      certificationMigratedAt:
        "2026-09-11T12:00:04.500Z",
    } as FinoraPortableBranchAuthEnrollmentTransactionV1;

  expectFailure(
    "CERTIFICATION_MIGRATED without provenance rejected",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        migratedWithoutProvenance,
      ),
  );

  const skippedMigrationEvidence =
    {
      ...cloneTransaction(
        certificationControlApplied,
      ),

      status:
        "COMPLETE",

      updatedAt:
        "2026-09-11T12:00:05.000Z",

      completedAt:
        "2026-09-11T12:00:05.000Z",
    } as FinoraPortableBranchAuthEnrollmentTransactionV1;

  expectFailure(
    "certification-aware COMPLETE cannot skip migration evidence",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        skippedMigrationEvidence,
      ),
  );

  const malformedKeyId =
    cloneTransaction(
      certificationPrepared,
    );

  malformedKeyId.branchCertificationProvenance =
    {
      ...branchCertificationProvenance,

      certificationKeyId:
        "FINORA-BRANCH-CERT-invalid",
    };

  expectFailure(
    "non-canonical certificationKeyId rejected",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        malformedKeyId,
      ),
  );

  const malformedResponseId =
    cloneTransaction(
      certificationPrepared,
    );

  malformedResponseId.branchCertificationProvenance =
    {
      ...branchCertificationProvenance,

      responseId:
        "FINORA-ENROLLMENT-NOT-A-RESPONSE",
    };

  expectFailure(
    "malformed certification responseId rejected",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        malformedResponseId,
      ),
  );

  const prematureMigrationTimestamp =
    cloneTransaction(
      certificationControlApplied,
    );

  prematureMigrationTimestamp.certificationMigratedAt =
    "2026-09-11T12:00:04.500Z";

  expectFailure(
    "migration timestamp before migration state rejected",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        prematureMigrationTimestamp,
      ),
  );

  const badMigrationOrder =
    cloneTransaction(
      certificationMigrated,
    );

  badMigrationOrder.certificationMigratedAt =
    "2026-09-11T12:00:03.500Z";

  badMigrationOrder.updatedAt =
    "2026-09-11T12:00:04.500Z";

  expectFailure(
    "migration timestamp before CONTROL_APPLIED rejected",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        badMigrationOrder,
      ),
  );

  const secretBearingProvenance =
    cloneTransaction(
      certificationPrepared,
    );

  (
    secretBearingProvenance.branchCertificationProvenance as
      unknown as Record<string, unknown>
  ).privateKey =
    "FORBIDDEN-PRIVATE-KEY";

  expectFailure(
    "secret-bearing certification provenance rejected",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        secretBearingProvenance,
      ),
  );

  assertTrue(
    certificationPrepared.schemaVersion ===
      FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_SCHEMA_VERSION &&
    certificationPrepared.schemaVersion ===
      1,
    "Certification migration contract changed schemaVersion.",
  );

  console.log(
    "PASS: certification migration remains additive under schemaVersion 1",
  );

  assertTrue(
    canAdvanceFinoraPortableBranchAuthEnrollmentTransaction(
      "PREPARED",
      "PORTABLE_WRITTEN",
    ),
    "PREPARED -> PORTABLE_WRITTEN must be allowed.",
  );

  assertTrue(
    canAdvanceFinoraPortableBranchAuthEnrollmentTransaction(
      "PORTABLE_WRITTEN",
      "CONTROL_APPLIED",
    ),
    "PORTABLE_WRITTEN -> CONTROL_APPLIED must be allowed.",
  );

  assertTrue(
    canAdvanceFinoraPortableBranchAuthEnrollmentTransaction(
      "CONTROL_APPLIED",
      "COMPLETE",
    ),
    "CONTROL_APPLIED -> COMPLETE must be allowed.",
  );

  assertTrue(
    canAdvanceFinoraPortableBranchAuthEnrollmentTransaction(
      "CONTROL_APPLIED",
      "CERTIFICATION_MIGRATED",
    ),
    "CONTROL_APPLIED -> CERTIFICATION_MIGRATED must be allowed.",
  );

  assertTrue(
    canAdvanceFinoraPortableBranchAuthEnrollmentTransaction(
      "CERTIFICATION_MIGRATED",
      "COMPLETE",
    ),
    "CERTIFICATION_MIGRATED -> COMPLETE must be allowed.",
  );

  assertTrue(
    !canAdvanceFinoraPortableBranchAuthEnrollmentTransaction(
      "PREPARED",
      "CERTIFICATION_MIGRATED",
    ),
    "PREPARED -> CERTIFICATION_MIGRATED must be rejected.",
  );

  assertTrue(
    !canAdvanceFinoraPortableBranchAuthEnrollmentTransaction(
      "PORTABLE_WRITTEN",
      "CERTIFICATION_MIGRATED",
    ),
    "PORTABLE_WRITTEN -> CERTIFICATION_MIGRATED must be rejected.",
  );

  assertTrue(
    !canAdvanceFinoraPortableBranchAuthEnrollmentTransaction(
      "CERTIFICATION_MIGRATED",
      "CONTROL_APPLIED",
    ),
    "CERTIFICATION_MIGRATED -> CONTROL_APPLIED must be rejected.",
  );

  assertTrue(
    !canAdvanceFinoraPortableBranchAuthEnrollmentTransaction(
      "COMPLETE",
      "CERTIFICATION_MIGRATED",
    ),
    "COMPLETE -> CERTIFICATION_MIGRATED must be rejected.",
  );

  console.log(
    "PASS: legacy and certification-aware forward transition policies validate",
  );

  const illegalTransitions:
    Array<
      [
        FinoraPortableBranchAuthEnrollmentTransactionV1["status"],
        FinoraPortableBranchAuthEnrollmentTransactionV1["status"],
      ]
    > =
    [
      [
        "PREPARED",
        "CONTROL_APPLIED",
      ],
      [
        "PREPARED",
        "COMPLETE",
      ],
      [
        "PORTABLE_WRITTEN",
        "COMPLETE",
      ],
      [
        "CONTROL_APPLIED",
        "PORTABLE_WRITTEN",
      ],
      [
        "COMPLETE",
        "CONTROL_APPLIED",
      ],
      [
        "COMPLETE",
        "PREPARED",
      ],
    ];

  for (
    const [
      current,
      next,
    ] of illegalTransitions
  ) {
    assertTrue(
      !canAdvanceFinoraPortableBranchAuthEnrollmentTransaction(
        current,
        next,
      ),
      `${current} -> ${next} must be rejected.`,
    );
  }

  console.log(
    "PASS: skips and reverse transitions are rejected",
  );

  const digestTampered =
    cloneTransaction(
      prepared,
    );

  digestTampered.portableEnvelopeSha256 =
    "0".repeat(
      64,
    );

  expectFailure(
    "portable envelope digest tamper rejected",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        digestTampered,
      ),
  );

  const envelopeScopeTampered =
    cloneTransaction(
      prepared,
    );

  envelopeScopeTampered.ownerId =
    "OWNER-OTHER-000001";

  expectFailure(
    "transaction/envelope branch scope mismatch rejected",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        envelopeScopeTampered,
      ),
  );

  const credentialScopeTampered =
    cloneTransaction(
      prepared,
    );

  credentialScopeTampered.credential.branchId =
    "BRANCH-OTHER-000001";

  expectFailure(
    "transaction/credential branch mismatch rejected",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        credentialScopeTampered,
      ),
  );

  const authorizationTampered =
    cloneTransaction(
      prepared,
    );

  authorizationTampered.credential.sourceAuthorizationId =
    "AUTHORIZATION-OTHER-000001";

  expectFailure(
    "source authorization mismatch rejected",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        authorizationTampered,
      ),
  );

  const invalidPreparedTimestamp =
    cloneTransaction(
      prepared,
    );

  invalidPreparedTimestamp.portableWrittenAt =
    "2026-09-11T12:00:03.000Z";

  expectFailure(
    "PREPARED cannot contain portableWrittenAt",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        invalidPreparedTimestamp,
      ),
  );

  const invalidPortableWritten =
    cloneTransaction(
      portableWritten,
    );

  invalidPortableWritten.controlAppliedAt =
    "2026-09-11T12:00:04.000Z";

  expectFailure(
    "PORTABLE_WRITTEN cannot contain controlAppliedAt",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        invalidPortableWritten,
      ),
  );

  const invalidControlApplied =
    cloneTransaction(
      controlApplied,
    );

  invalidControlApplied.completedAt =
    "2026-09-11T12:00:05.000Z";

  expectFailure(
    "CONTROL_APPLIED cannot contain completedAt",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        invalidControlApplied,
      ),
  );

  const invalidOrder =
    cloneTransaction(
      complete,
    );

  invalidOrder.completedAt =
    "2026-09-11T11:59:59.000Z";

  expectFailure(
    "backward completion timestamp rejected",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        invalidOrder,
      ),
  );

  const invalidSchema =
    cloneTransaction(
      prepared,
    ) as unknown as {
      schemaVersion:
        number;
    };

  invalidSchema.schemaVersion =
    2;

  expectFailure(
    "unsupported transaction schemaVersion rejected",
    () =>
      validateFinoraPortableBranchAuthEnrollmentTransactionV1(
        invalidSchema as unknown as
          FinoraPortableBranchAuthEnrollmentTransactionV1,
      ),
  );

  console.log(
    "",
  );

  console.log(
    "PASS: PHASE 5.6E3D3C2 PORTABLE AUTH ENROLLMENT TRANSACTION EXECUTABLE PROOF",
  );
}

void main().catch(
  (
    error,
  ) => {
    console.error(
      "",
    );

    console.error(
      "SELF-TEST FAILED",
    );

    console.error(
      error,
    );

    process.exitCode =
      1;
  },
);

// ============================================================
// END
// ============================================================