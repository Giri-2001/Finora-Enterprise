/* ============================================================
   FINORA ENTERPRISE OS
   PORTABLE BRANCH AUTH SOURCE-AUTHORIZATION LINEAGE SELF-TEST
============================================================ */

import {
  createFinoraPortableBranchAuthTestSourceAuthorizationEvidence,
} from "./finoraPortableBranchAuthTestEvidence.js";

import {
  validateFinoraPortableBranchAuthPayloadV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  createFinoraPortableBranchAuthEnvelopeV1,
  decryptFinoraPortableBranchAuthEnvelopeV1,
  verifyFinoraPortableBranchAuthPassword,
} from "./finoraPortableBranchAuthCrypto.js";

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
  const password =
    "FINORA-Lineage-Password-01";

  const securityCode =
    "FINORA-Lineage-Security-01";

  const sourceAuthorizationId =
    "FINORA-CREDENTIAL-AUTHORIZATION-LINEAGE-000001";

  const envelope =
    await createFinoraPortableBranchAuthEnvelopeV1({
      authStateId:
        "FINORA-PORTABLE-AUTH-LINEAGE-STATE-000001",

      sourceAuthorizationId,
      sourceAuthorizationVerificationEvidence:
        createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
          sourceAuthorizationId,
        ),

      ownerId:
        "OWNER-LINEAGE-000001",

      businessId:
        "BUSINESS-LINEAGE-000001",

      branchId:
        "BRANCH-LINEAGE-000001",

      userId:
        "USER-LINEAGE-000001",

      username:
        "admin",

      fullName:
        "FINORA Lineage Admin",

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

  assert(
    !JSON.stringify(
      envelope,
    ).includes(
      sourceAuthorizationId,
    ),
    "Outer Portable Auth envelope exposed sourceAuthorizationId plaintext.",
  );

  console.log(
    "PASS: sourceAuthorizationId remains inside encrypted Portable Auth payload",
  );

  const passwordValid =
    await verifyFinoraPortableBranchAuthPassword(
      envelope,
      password,
    );

  assert(
    passwordValid,
    "Password-first Portable Auth proof failed after lineage binding.",
  );

  console.log(
    "PASS: password-first verification remains available before Security Code",
  );

  const payload =
    await decryptFinoraPortableBranchAuthEnvelopeV1(
      envelope,
      password,
      securityCode,
      {
        expectedScope: {
          ownerId:
            "OWNER-LINEAGE-000001",

          businessId:
            "BUSINESS-LINEAGE-000001",

          branchId:
            "BRANCH-LINEAGE-000001",
        },
      },
    );

  assert(
    payload.sourceAuthorizationId ===
      sourceAuthorizationId,
    "Decrypted Portable Auth payload lost source authorization lineage.",
  );

  console.log(
    "PASS: full-factor decryption returns exact sourceAuthorizationId",
  );

  const withoutLineage:
    Record<string, unknown> =
    {
      ...payload,
    };

  delete withoutLineage
    .sourceAuthorizationId;

  let rejected =
    false;

  try {
    validateFinoraPortableBranchAuthPayloadV1(
      withoutLineage,
    );
  }
  catch {
    rejected =
      true;
  }

  assert(
    rejected,
    "Portable Auth validator accepted missing sourceAuthorizationId.",
  );

  console.log(
    "PASS: strict payload validation rejects missing sourceAuthorizationId",
  );

  console.log(
    "PASS: D4E4G1 PORTABLE AUTH SOURCE-AUTHORIZATION LINEAGE PROOF",
  );
}

void main()
  .catch(
    (
      error,
    ) => {
      console.error(
        "FAIL: D4E4G1 PORTABLE AUTH SOURCE-AUTHORIZATION LINEAGE PROOF",
        error,
      );

      process.exitCode =
        1;
    },
  );