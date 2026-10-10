import {
  generateFinoraOwnerWalletProofKeyV1,
  signFinoraOwnerWalletProofV1,
  verifyFinoraOwnerWalletProofV1,
} from "./finoraOwnerWalletProofCrypto.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_SCHEMA_VERSION,
} from "./finoraPortableBranchAuthContract.js";

import {
  createFinoraPortableBranchAuthTestSourceAuthorizationEvidence,
} from "./finoraPortableBranchAuthTestEvidence.js";

import {
  createFinoraPortableBranchAuthEnrollmentMaterialV2,
  decryptFinoraPortableBranchAuthEnvelopeV2WithPassword,
  decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode,
  rotateFinoraPortableBranchAuthV2PasswordByRecoveryCode,
  rotateFinoraPortableBranchAuthV2RecoveryCodeByPassword,
} from "./finoraPortableBranchAuthV2Crypto.js";

import type {
  FinoraPortableBranchAuthPayloadV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraOwnerWalletProofKeyMaterialV1,
} from "./finoraOwnerWalletProofCrypto.js";

function assert(
  condition: unknown,
  description: string,
): asserts condition {
  if (!condition) {
    throw new Error(description);
  }
}

function equalJson(
  first: unknown,
  second: unknown,
): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

function assertWalletKey(
  payload: FinoraPortableBranchAuthPayloadV1,
  expected: FinoraOwnerWalletProofKeyMaterialV1,
  label: string,
): void {
  assert(
    equalJson(payload.walletProofKeyMaterial, expected),
    `${label}: wallet private-key material changed or disappeared.`,
  );
}

async function expectRejected(
  attempt: () => Promise<unknown>,
  description: string,
): Promise<void> {
  let rejected = false;

  try {
    await attempt();
  } catch {
    rejected = true;
  }

  assert(rejected, description);
}

async function run(): Promise<void> {
  const sourceAuthorizationId =
    "FINORA-P391-TEST-SOURCE";

  const initialAt =
    "2026-01-01T00:00:00.000Z";

  const oldPassword =
    "P391-Temporary-Password-123";

  const oldSecurityCode =
    "P391-Temporary-Security-456";

  const newPassword =
    "P391-Rotated-Password-789";

  const newSecurityCode =
    "P391-Rotated-Security-987";

  const walletKey =
    generateFinoraOwnerWalletProofKeyV1();

  // Dummy values only. No customer or USB credentials.
  const payloadBase = {
    schemaVersion:
      FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_SCHEMA_VERSION,
    authStateId:
      "FINORA-P391-TEST-AUTH-STATE",
    sourceAuthorizationId,
    sourceAuthorizationVerificationEvidence:
      createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
        sourceAuthorizationId,
      ),
    ownerId: "P391-OWNER",
    businessId: "P391-BUSINESS",
    branchId: "P391-BRANCH",
    userId: "P391-USER",
    username: "p391test",
    canonicalUsername: "p391test",
    fullName: "P391 Test Owner",
    role: "ADMIN",
    dataContext: "REAL" as const,
    storageMode: "LOCAL" as const,
    authGeneration: 1,
    createdAt: initialAt,
    updatedAt: initialAt,
  };

  const created =
    await createFinoraPortableBranchAuthEnrollmentMaterialV2({
      payload: {
        ...payloadBase,
        walletProofKeyMaterial:
          structuredClone(walletKey),
      },
      password: oldPassword,
      securityCode: oldSecurityCode,
    });

  console.log("PASS: V2 encrypted payload created.");

  const passwordPayload =
    await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
      created.envelope,
      oldPassword,
    );

  assertWalletKey(
    passwordPayload,
    walletKey,
    "Initial password decrypt",
  );

  const recoveryPayload =
    await decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode(
      created.envelope,
      oldSecurityCode,
    );

  assertWalletKey(
    recoveryPayload,
    walletKey,
    "Initial recovery decrypt",
  );

  assert(
    equalJson(passwordPayload, recoveryPayload),
    "Password and recovery decrypt different payloads.",
  );

  console.log(
    "PASS: Password and recovery decrypt identical wallet key.",
  );

  await expectRejected(
    () =>
      decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
        created.envelope,
        "Incorrect-Test-Password-123",
      ),
    "Wrong password unexpectedly unlocked credential.",
  );

  console.log("PASS: Wrong password rejected.");

  const challenge = {
    challenge: "a".repeat(64),
    keyId: walletKey.keyId,
    userId: payloadBase.userId,
    ownerId: payloadBase.ownerId,
    businessId: payloadBase.businessId,
    branchId: payloadBase.branchId,
    credentialId: "P391-CREDENTIAL",
    authGeneration: 1,
  };

  const signature =
    signFinoraOwnerWalletProofV1(
      challenge,
      passwordPayload.walletProofKeyMaterial!,
    );

  assert(
    verifyFinoraOwnerWalletProofV1(
      challenge,
      signature,
      walletKey,
    ),
    "Decrypted wallet key cannot sign valid proof.",
  );

  console.log(
    "PASS: Decrypted wallet key signs valid DER proof.",
  );

  const rotatedPassword =
    await rotateFinoraPortableBranchAuthV2PasswordByRecoveryCode(
      created.envelope,
      oldSecurityCode,
      newPassword,
      {
        authGeneration: 2,
        updatedAt:
          "2026-01-01T00:01:00.000Z",
      },
    );

  const afterPassword =
    await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
      rotatedPassword.envelope,
      newPassword,
    );

  assertWalletKey(
    afterPassword,
    walletKey,
    "Password rotation",
  );

  assert(
    afterPassword.authGeneration === 2,
    "Password rotation did not advance generation.",
  );

  await expectRejected(
    () =>
      decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
        rotatedPassword.envelope,
        oldPassword,
      ),
    "Old password still unlocks rotated credential.",
  );

  console.log(
    "PASS: Password rotation preserves key and rejects old password.",
  );

  const rotatedRecovery =
    await rotateFinoraPortableBranchAuthV2RecoveryCodeByPassword(
      rotatedPassword.envelope,
      newPassword,
      newSecurityCode,
    );

  const afterRecovery =
    await decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode(
      rotatedRecovery.envelope,
      newSecurityCode,
    );

  assertWalletKey(
    afterRecovery,
    walletKey,
    "Recovery-code rotation",
  );

  assert(
    afterRecovery.authGeneration === 2,
    "Recovery rotation unexpectedly changed generation.",
  );

  await expectRejected(
    () =>
      decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode(
        rotatedRecovery.envelope,
        oldSecurityCode,
      ),
    "Old recovery code still unlocks rotated credential.",
  );

  console.log(
    "PASS: Recovery rotation preserves key and rejects old code.",
  );

  // Simulate an existing V2 credential with no wallet key.
  const legacy =
    await createFinoraPortableBranchAuthEnrollmentMaterialV2({
      payload: structuredClone(payloadBase),
      password: oldPassword,
      securityCode: oldSecurityCode,
    });

  const legacyPayload =
    await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
      legacy.envelope,
      oldPassword,
    );

  assert(
    legacyPayload.walletProofKeyMaterial === undefined,
    "Old V2 payload unexpectedly requires a wallet key.",
  );

  console.log(
    "PASS: Old V2 payload remains backward compatible.",
  );

  console.log(
    "PASS: P391B wallet key encryption/rotation tests complete.",
  );
}

void run().catch((error: unknown) => {
  console.error(
    "STOP: P391B:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
});