/* ============================================================
   FINORA ENTERPRISE OS
   ENCRYPTED PORTABLE SIGNER-EVIDENCE SELF-TEST
============================================================ */

import {
  validateFinoraPortableBranchAuthPayloadV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  createFinoraPortableBranchAuthEnvelopeV1,
  decryptFinoraPortableBranchAuthEnvelopeV1,
  verifyFinoraPortableBranchAuthPassword,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  createFinoraPortableBranchAuthTestSourceAuthorizationEvidence,
} from "./finoraPortableBranchAuthTestEvidence.js";

function assert(
  condition:
    unknown,
  message:
    string,
): asserts condition {
  if (!condition) {
    throw new Error(
      message,
    );
  }
}

async function main():
  Promise<void> {
  const sourceAuthorizationId =
    "FINORA-CREDENTIAL-AUTHORIZATION-ENCRYPTED-EVIDENCE-000001";

  const evidence =
    createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
      sourceAuthorizationId,
    );

  const password =
    "FINORA-Encrypted-Evidence-Password-01";

  const securityCode =
    "FINORA-Encrypted-Evidence-Security-01";

  const envelope =
    await createFinoraPortableBranchAuthEnvelopeV1({
      authStateId:
        "FINORA-PORTABLE-AUTH-ENCRYPTED-EVIDENCE-000001",

      sourceAuthorizationId,

      sourceAuthorizationVerificationEvidence:
        evidence,

      ownerId:
        "OWNER-ENCRYPTED-EVIDENCE-000001",

      businessId:
        "BUSINESS-ENCRYPTED-EVIDENCE-000001",

      branchId:
        "BRANCH-ENCRYPTED-EVIDENCE-000001",

      userId:
        "USER-ENCRYPTED-EVIDENCE-000001",

      username:
        "admin",

      fullName:
        "FINORA Evidence Admin",

      role:
        "ADMIN",

      dataContext:
        "REAL",

      storageMode:
        "LOCAL",

      authGeneration:
        1,

      createdAt:
        "2026-09-12T00:00:00.000Z",

      updatedAt:
        "2026-09-12T00:00:00.000Z",

      password,

      securityCode,
    });

  if (
    "legacyNativeBoundMigrationEvidence" in
      evidence
  ) {
    throw new Error(
      "Encrypted signer fixture unexpectedly used legacy migration evidence.",
    );
  }

  const serialized =
    JSON.stringify(
      envelope,
    );

  assert(
    !serialized.includes(
      sourceAuthorizationId,
    ) &&
      !serialized.includes(
        evidence.packageId,
      ) &&
      !serialized.includes(
        evidence.verifiedControlSigner.publicKey,
      ),
    "Portable outer envelope exposed signer lineage evidence plaintext.",
  );

  console.log(
    "PASS: source authorization signer evidence remains encrypted",
  );

  const passwordValid =
    await verifyFinoraPortableBranchAuthPassword(
      envelope,
      password,
    );

  assert(
    passwordValid,
    "Password-first verification failed with encrypted signer evidence.",
  );

  console.log(
    "PASS: password-first verification remains independent of Security Code",
  );

  const payload =
    await decryptFinoraPortableBranchAuthEnvelopeV1(
      envelope,
      password,
      securityCode,
      {
        expectedScope: {
          ownerId:
            "OWNER-ENCRYPTED-EVIDENCE-000001",

          businessId:
            "BUSINESS-ENCRYPTED-EVIDENCE-000001",

          branchId:
            "BRANCH-ENCRYPTED-EVIDENCE-000001",
        },
      },
    );

  const decryptedEvidence =
    payload.sourceAuthorizationVerificationEvidence;

  if (
    "legacyNativeBoundMigrationEvidence" in
      decryptedEvidence
  ) {
    throw new Error(
      "Decrypted signer fixture unexpectedly returned legacy migration evidence.",
    );
  }

  assert(
    payload.sourceAuthorizationId ===
      sourceAuthorizationId &&
    decryptedEvidence.authorizationId ===
      sourceAuthorizationId &&
    decryptedEvidence.packageId ===
      evidence.packageId &&
    decryptedEvidence.verifiedControlSigner.signingKeyId ===
      evidence.verifiedControlSigner.signingKeyId,
    "Full-factor decrypt did not preserve exact signer provenance.",
  );

  console.log(
    "PASS: full-factor decrypt returns exact signer provenance",
  );

  const mismatchedPayload:
    Record<string, unknown> = {
      ...payload,

      sourceAuthorizationVerificationEvidence: {
        ...payload.sourceAuthorizationVerificationEvidence,

        authorizationId:
          "FINORA-WRONG-AUTHORIZATION",
      },
    };

  let payloadMismatchRejected =
    false;

  try {
    validateFinoraPortableBranchAuthPayloadV1(
      mismatchedPayload,
    );
  }
  catch {
    payloadMismatchRejected =
      true;
  }

  assert(
    payloadMismatchRejected,
    "Strict payload validation accepted mismatched signer evidence lineage.",
  );

  console.log(
    "PASS: decrypted payload validator rejects evidence/source lineage mismatch",
  );

  let creationMismatchRejected =
    false;

  try {
    await createFinoraPortableBranchAuthEnvelopeV1({
      authStateId:
        "FINORA-PORTABLE-AUTH-ENCRYPTED-EVIDENCE-000002",

      sourceAuthorizationId,

      sourceAuthorizationVerificationEvidence:
        createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
          "FINORA-DIFFERENT-AUTHORIZATION",
        ),

      ownerId:
        "OWNER-ENCRYPTED-EVIDENCE-000001",

      businessId:
        "BUSINESS-ENCRYPTED-EVIDENCE-000001",

      branchId:
        "BRANCH-ENCRYPTED-EVIDENCE-000001",

      userId:
        "USER-ENCRYPTED-EVIDENCE-000001",

      username:
        "admin",

      fullName:
        "FINORA Evidence Admin",

      role:
        "ADMIN",

      dataContext:
        "REAL",

      storageMode:
        "LOCAL",

      authGeneration:
        1,

      createdAt:
        "2026-09-12T00:00:01.000Z",

      updatedAt:
        "2026-09-12T00:00:01.000Z",

      password,

      securityCode,
    });
  }
  catch {
    creationMismatchRejected =
      true;
  }

  assert(
    creationMismatchRejected,
    "Portable material creation accepted mismatched signer evidence lineage.",
  );

  console.log(
    "PASS: pre-encryption creation guard rejects evidence/source lineage mismatch",
  );

  console.log(
    "PASS: D4E4I1B3B2D ENCRYPTED SIGNER-EVIDENCE PAYLOAD PROPAGATION",
  );
}

void main().catch(
  (
    error,
  ) => {
    console.error(
      "FAIL: D4E4I1B3B2D ENCRYPTED SIGNER-EVIDENCE PAYLOAD PROPAGATION",
      error,
    );

    process.exitCode =
      1;
  },
);