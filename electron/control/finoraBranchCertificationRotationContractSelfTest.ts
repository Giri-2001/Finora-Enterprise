import assert from "node:assert/strict";

import {
  generateFinoraBranchCertificationKeyMaterial,
  toFinoraBranchCertificationPublicKey,
} from "./finoraBranchCertificationCrypto.js";

import {
  FINORA_BRANCH_CERTIFICATION_ROTATION_PAYLOAD_VERSION,
  FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,
  assertFinoraBranchCertificationRotationPayload,
} from "./finoraBranchCertificationRotationContract.js";

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

function expectReject(
  value:
    unknown,
): void {

  assert.throws(
    () =>
      assertFinoraBranchCertificationRotationPayload(
        value,
      ),
  );
}

const previous =
  toFinoraBranchCertificationPublicKey(
    generateFinoraBranchCertificationKeyMaterial(
      new Date(
        "2026-09-20T12:00:00.000Z",
      ),
    ),
  );

const replacement =
  toFinoraBranchCertificationPublicKey(
    generateFinoraBranchCertificationKeyMaterial(
      new Date(
        "2026-09-20T12:01:00.000Z",
      ),
    ),
  );

const requestingFingerprint =
  "a".repeat(
    64,
  );

const portableAuthFingerprint =
  "b".repeat(
    64,
  );

const valid = {
  payloadVersion:
    FINORA_BRANCH_CERTIFICATION_ROTATION_PAYLOAD_VERSION,

  requestId:
    "FIN-BCR-REQ-00000001",

  ownerId:
    "OWNER-001",

  businessId:
    "BUSINESS-001",

  branchId:
    "BRANCH-001",

  requestingInstallationId:
    "INSTALLATION-001",

  requestingBindingKeyId:
    `FINORA-BINDING-${requestingFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`,

  requestingFingerprintAlgorithm:
    "SHA-256" as const,

  requestingPublicKeyFingerprint:
    requestingFingerprint,

  authStateId:
    "AUTH-STATE-001",

  authGeneration:
    1,

  portableAuthFingerprintAlgorithm:
    "SHA-256" as const,

  portableAuthFingerprint,

  previousCertificationPublicKey:
    previous,

  replacementCertificationPublicKey:
    replacement,

  recoveryReason:
    FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,

  requestedAt:
    "2026-09-20T12:02:00.000Z",

  approvedAt:
    "2026-09-20T12:03:00.000Z",
};

assert.doesNotThrow(
  () =>
    assertFinoraBranchCertificationRotationPayload(
      valid,
    ),
);

console.log(
  "PASS: valid exact-branch certification rotation payload accepted",
);

const wrongVersion =
  clone(
    valid,
  ) as
    Record<string, unknown>;

wrongVersion.payloadVersion =
  99;

expectReject(
  wrongVersion,
);

console.log(
  "PASS: unsupported rotation payload version rejected",
);

const wrongBinding =
  clone(
    valid,
  );

wrongBinding.requestingBindingKeyId =
  "FINORA-BINDING-" +
  "c".repeat(
    64,
  );

expectReject(
  wrongBinding,
);

console.log(
  "PASS: requesting installation binding mismatch rejected",
);

const stalePortableAuthority =
  clone(
    valid,
  );

stalePortableAuthority.authGeneration =
  0;

expectReject(
  stalePortableAuthority,
);

console.log(
  "PASS: invalid Portable Auth generation rejected",
);

const noOpRotation =
  clone(
    valid,
  );

noOpRotation.replacementCertificationPublicKey =
  clone(
    previous,
  );

expectReject(
  noOpRotation,
);

console.log(
  "PASS: no-op certification rotation rejected",
);

const wrongReason =
  clone(
    valid,
  ) as
    Record<string, unknown>;

wrongReason.recoveryReason =
  "OTHER";

expectReject(
  wrongReason,
);

console.log(
  "PASS: unsupported certification recovery reason rejected",
);

const reversedTime =
  clone(
    valid,
  );

reversedTime.approvedAt =
  "2026-09-20T12:01:00.000Z";

expectReject(
  reversedTime,
);

console.log(
  "PASS: approval timestamp rollback rejected",
);

const extraField =
  clone(
    valid,
  ) as
    Record<string, unknown>;

extraField.privateKey =
  "MUST-NOT-BE-ACCEPTED";

expectReject(
  extraField,
);

console.log(
  "PASS: private-key or unknown-field injection rejected",
);

console.log(
  "============================================================",
);

console.log(
  "PASS: A5-M18A BRANCH CERTIFICATION ROTATION CONTRACT EXECUTABLE PROOF",
);

console.log(
  "============================================================",
);