import assert from "node:assert/strict";

import {
  generateFinoraBranchCertificationKeyMaterial,
  toFinoraBranchCertificationPublicKey,
} from "./finoraBranchCertificationCrypto.js";

import {
  FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,
} from "./finoraBranchCertificationRotationContract.js";

import {
  FINORA_BRANCH_CERTIFICATION_ROTATION_PENDING_SCHEMA_VERSION,
  FINORA_BRANCH_CERTIFICATION_ROTATION_PENDING_STATE,
} from "./finoraBranchCertificationRotationPendingStore.js";

import type {
  FinoraBranchCertificationRotationPendingRecordV1,
} from "./finoraBranchCertificationRotationPendingStore.js";

import {
  assertFinoraBranchCertificationRotationRequestFile,
  createFinoraBranchCertificationRotationRequestFile,
} from "./finoraBranchCertificationRotationRequest.js";

function clone<T>(
  value:
    T,
): T {

  return JSON.parse(
    JSON.stringify(
      value,
    ),
  ) as T;
}

const previousMaterial =
  generateFinoraBranchCertificationKeyMaterial(
    new Date(
      "2026-09-20T13:00:00.000Z",
    ),
  );

const replacementMaterial =
  generateFinoraBranchCertificationKeyMaterial(
    new Date(
      "2026-09-20T13:01:00.000Z",
    ),
  );

const installationFingerprint =
  "c".repeat(
    64,
  );

const pending:
  FinoraBranchCertificationRotationPendingRecordV1 = {

    state:
      FINORA_BRANCH_CERTIFICATION_ROTATION_PENDING_STATE,

    requestId:
      "FIN-BCR-REQ-PUBLIC-001",

    ownerId:
      "OWNER-001",

    businessId:
      "BUSINESS-001",

    branchId:
      "BRANCH-001",

    installationId:
      "INSTALLATION-001",

    bindingKeyId:
      `FINORA-BINDING-${installationFingerprint
        .slice(
          0,
          32,
        )
        .toUpperCase()}`,

    fingerprintAlgorithm:
      "SHA-256",

    publicKeyFingerprint:
      installationFingerprint,

    authStateId:
      "AUTH-STATE-001",

    authGeneration:
      1,

    portableAuthFingerprintAlgorithm:
      "SHA-256",

    portableAuthFingerprint:
      "d".repeat(
        64,
      ),

    previousCertificationKeyId:
      toFinoraBranchCertificationPublicKey(
        previousMaterial,
      ).keyId,

    replacementCertificationKeyMaterial:
      replacementMaterial,

    recoveryReason:
      FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,

    requestedAt:
      "2026-09-20T13:02:00.000Z",

    schemaVersion:
      FINORA_BRANCH_CERTIFICATION_ROTATION_PENDING_SCHEMA_VERSION,
  };

const requestFile =
  createFinoraBranchCertificationRotationRequestFile(
    pending,
  );

assert.doesNotThrow(
  () =>
    assertFinoraBranchCertificationRotationRequestFile(
      requestFile,
    ),
);

console.log(
  "PASS: exact public rotation request accepted",
);

const serialized =
  JSON.stringify(
    requestFile,
  );

assert.equal(
  serialized.includes(
    replacementMaterial.privateKey,
  ),
  false,
);

assert.equal(
  serialized.includes(
    "privateKey",
  ),
  false,
);

assert.equal(
  serialized.includes(
    "replacementCertificationKeyMaterial",
  ),
  false,
);

console.log(
  "PASS: replacement private key excluded from request",
);

const injected =
  clone(
    requestFile,
  ) as unknown as {
    request:
      Record<string, unknown>;
  };

injected.request.privateKey =
  "FORBIDDEN";

assert.throws(
  () =>
    assertFinoraBranchCertificationRotationRequestFile(
      injected,
    ),
);

console.log(
  "PASS: private-key field injection rejected",
);

const wrongPortableFingerprint =
  clone(
    requestFile,
  );

wrongPortableFingerprint.request.portableAuthFingerprint =
  "INVALID";

assert.throws(
  () =>
    assertFinoraBranchCertificationRotationRequestFile(
      wrongPortableFingerprint,
    ),
);

console.log(
  "PASS: invalid Portable Auth fingerprint rejected",
);

const noOp =
  clone(
    requestFile,
  );

noOp.request.replacementCertificationPublicKey =
  toFinoraBranchCertificationPublicKey(
    previousMaterial,
  );

assert.throws(
  () =>
    assertFinoraBranchCertificationRotationRequestFile(
      noOp,
    ),
);

console.log(
  "PASS: no-op public certification rotation rejected",
);

console.log(
  "============================================================",
);

console.log(
  "PASS: A5-M18B-B1 PUBLIC ROTATION REQUEST EXECUTABLE PROOF",
);

console.log(
  "============================================================",
);