// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH ENROLLMENT MATERIAL SELF TEST
//
// PROVES:
//
// - One enrollment-material call returns envelope + both verifier
//   evidences needed by Portable Auth and Control Store
// - Returned password verifier equals authenticated outer factor
// - Both returned verifiers equal encrypted authoritative payload
// - Plaintext Password / Security Code are absent from envelope
// - Existing createEnvelope compatibility API remains valid
// ============================================================

import {
  generateFinoraBranchCertificationKeyMaterial,
} from "./finoraBranchCertificationCrypto.js";

import {
  createFinoraPortableBranchAuthTestSourceAuthorizationEvidence,
} from "./finoraPortableBranchAuthTestEvidence.js";

import {
  validateFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  createFinoraPortableBranchAuthEnrollmentMaterialV1,
  createFinoraPortableBranchAuthEnvelopeV1,
  decryptFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

// ============================================================
// HELPERS
// ============================================================

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

function assertJsonEqual(
  actual:
    unknown,
  expected:
    unknown,
  message:
    string,
): void {
  assert(
    JSON.stringify(
      actual,
    ) ===
      JSON.stringify(
        expected,
      ),
    message,
  );
}

// ============================================================
// SELF TEST
// ============================================================

async function runSelfTest():
  Promise<void> {
  const password =
    "admin123";

  const securityCode =
    "FINORA-Security@8421";

  const input = {
    authStateId:
      "PORTABLE-ENROLLMENT-MATERIAL-STATE-000001",

    sourceAuthorizationId:
      "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",

    sourceAuthorizationVerificationEvidence:
      createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
        "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",
      ),

    ownerId:
      "OWNER-ENROLLMENT-MATERIAL-000001",

    businessId:
      "BUSINESS-ENROLLMENT-MATERIAL-000001",

    branchId:
      "BRANCH-ENROLLMENT-MATERIAL-000001",

    userId:
      "USER-ENROLLMENT-MATERIAL-000001",

    username:
      "Admin",

    fullName:
      "FINORA Admin",

    role:
      "ADMIN",

    dataContext:
      "REAL" as const,

    storageMode:
      "LOCAL" as const,

    authGeneration:
      1,

    createdAt:
      "2026-09-11T12:00:00.000Z",

    updatedAt:
      "2026-09-11T12:00:00.000Z",

    password,

    securityCode,
  };

  // ==========================================================
  // SINGLE-DERIVATION MATERIAL
  // ==========================================================

  const material =
    await createFinoraPortableBranchAuthEnrollmentMaterialV1(
      input,
    );

  validateFinoraPortableBranchAuthEnvelopeV1(
    material.envelope,
  );

  console.log(
    "PASS: enrollment material returns valid portable envelope",
  );

  assertJsonEqual(
    material.envelope.passwordFactor,
    material.passwordVerifier,
    "Material password verifier does not equal authenticated outer password factor.",
  );

  console.log(
    "PASS: material password verifier equals authenticated outer factor",
  );

  const serializedEnvelope =
    JSON.stringify(
      material.envelope,
    );

  assert(
    !serializedEnvelope.includes(
      password,
    ) &&
      !serializedEnvelope.includes(
        securityCode,
      ),
    "Portable envelope contains plaintext Password or Security Code.",
  );

  console.log(
    "PASS: material envelope contains no plaintext Password or Security Code",
  );

  // ==========================================================
  // AUTHORITATIVE ENCRYPTED PAYLOAD EVIDENCE
  // ==========================================================

  const payload =
    await decryptFinoraPortableBranchAuthEnvelopeV1(
      material.envelope,
      password,
      securityCode,
      {
        expectedScope: {
          ownerId:
            input.ownerId,

          businessId:
            input.businessId,

          branchId:
            input.branchId,
        },
      },
    );

  assertJsonEqual(
    payload.passwordVerifier,
    material.passwordVerifier,
    "Returned password verifier differs from encrypted authoritative payload.",
  );

  console.log(
    "PASS: material password verifier equals encrypted payload verifier",
  );

  assertJsonEqual(
    payload.securityVerifier,
    material.securityVerifier,
    "Returned Security Code verifier differs from encrypted authoritative payload.",
  );

  console.log(
    "PASS: material Security Code verifier equals encrypted payload verifier",
  );

  assert(
    payload.authStateId ===
      input.authStateId &&
      payload.ownerId ===
        input.ownerId &&
      payload.businessId ===
        input.businessId &&
      payload.branchId ===
        input.branchId &&
      payload.userId ===
        input.userId &&
      payload.canonicalUsername ===
        "admin" &&
      payload.storageMode ===
        "LOCAL" &&
      payload.authGeneration ===
        1,
    "Enrollment material payload identity/scope is incorrect.",
  );

  console.log(
    "PASS: enrollment material payload preserves authoritative identity and scope",
  );

  // ==========================================================
  // LEGACY PAYLOAD COMPATIBILITY
  // ==========================================================

  assert(
    payload.branchCertificationKeyMaterial ===
      undefined,
    "Legacy Portable Auth payload unexpectedly acquired Branch Certification authority.",
  );

  console.log(
    "PASS: legacy Portable Auth payload remains valid without Branch Certification authority",
  );

  // ==========================================================
  // ENCRYPTED BRANCH CERTIFICATION AUTHORITY
  // ==========================================================

  const branchCertificationKeyMaterial =
    generateFinoraBranchCertificationKeyMaterial(
      new Date(
        "2026-09-11T12:00:00.000Z",
      ),
    );

  const certifiedMaterial =
    await createFinoraPortableBranchAuthEnrollmentMaterialV1({
      ...input,

      branchCertificationKeyMaterial,
    });

  const serializedCertifiedEnvelope =
    JSON.stringify(
      certifiedMaterial.envelope,
    );

  assert(
    !serializedCertifiedEnvelope.includes(
      '"branchCertificationKeyMaterial"',
    ) &&
      !serializedCertifiedEnvelope.includes(
        '"privateKey"',
      ) &&
      !serializedCertifiedEnvelope.includes(
        branchCertificationKeyMaterial.privateKey,
      ),
    "Branch Certification private authority escaped the encrypted Portable Auth payload.",
  );

  const certifiedPayload =
    await decryptFinoraPortableBranchAuthEnvelopeV1(
      certifiedMaterial.envelope,
      password,
      securityCode,
      {
        expectedScope: {
          ownerId:
            input.ownerId,

          businessId:
            input.businessId,

          branchId:
            input.branchId,
        },
      },
    );

  assertJsonEqual(
    certifiedPayload.branchCertificationKeyMaterial,
    branchCertificationKeyMaterial,
    "Encrypted Portable Auth payload changed Branch Certification key material.",
  );

  console.log(
    "PASS: Branch Certification private authority is carried only inside encrypted Portable Auth payload",
  );

  let malformedCertificationRejected =
    false;

  try {
    await createFinoraPortableBranchAuthEnrollmentMaterialV1({
      ...input,

      branchCertificationKeyMaterial: {
        ...branchCertificationKeyMaterial,

        publicKeyFingerprint:
          "0".repeat(
            64,
          ),
      },
    });
  }
  catch {
    malformedCertificationRejected =
      true;
  }

  assert(
    malformedCertificationRejected,
    "Malformed Branch Certification authority was accepted by Portable Auth payload validation.",
  );

  console.log(
    "PASS: malformed Branch Certification authority fails closed during Portable Auth material creation",
  );

  // ==========================================================
  // PASSWORD / SECURITY FACTORS MUST REMAIN INDEPENDENT
  // ==========================================================

  assert(
    material.passwordVerifier.salt !==
      material.securityVerifier.salt,
    "Password and Security Code unexpectedly share SCRYPT salt.",
  );

  assert(
    material.passwordVerifier.verifier !==
      material.securityVerifier.verifier,
    "Password and Security Code unexpectedly share verifier value.",
  );

  console.log(
    "PASS: password and Security Code verifier evidence remains independent",
  );

  // ==========================================================
  // LEGACY COMPATIBILITY WRAPPER
  //
  // A second call intentionally creates fresh random material,
  // so envelope byte equality is NOT expected. Compatibility
  // means the old API still returns a strict, decryptable V1
  // envelope with the same authoritative input semantics.
  // ==========================================================

  const compatibilityEnvelope =
    await createFinoraPortableBranchAuthEnvelopeV1(
      input,
    );

  validateFinoraPortableBranchAuthEnvelopeV1(
    compatibilityEnvelope,
  );

  const compatibilityPayload =
    await decryptFinoraPortableBranchAuthEnvelopeV1(
      compatibilityEnvelope,
      password,
      securityCode,
      {
        expectedScope: {
          ownerId:
            input.ownerId,

          businessId:
            input.businessId,

          branchId:
            input.branchId,
        },
      },
    );

  assert(
    compatibilityPayload.authStateId ===
      input.authStateId &&
      compatibilityPayload.userId ===
        input.userId &&
      compatibilityPayload.canonicalUsername ===
        "admin" &&
      compatibilityPayload.storageMode ===
        "LOCAL" &&
      compatibilityPayload.authGeneration ===
        1,
    "Compatibility envelope API changed authoritative payload semantics.",
  );

  console.log(
    "PASS: existing createEnvelope compatibility API remains strict and decryptable",
  );

  console.log(
    "",
  );

  console.log(
    "PASS: PHASE 5.6E3D3E1D3 SINGLE-DERIVATION ENROLLMENT MATERIAL EXECUTABLE PROOF",
  );
}

void runSelfTest().catch(
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