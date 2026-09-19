import {
  generateFinoraWindowsInstallationBindingMaterial,
  signFinoraInstallationBindingCanonicalValue,
} from "../control/finoraInstallationBindingCrypto.js";

import {
  generateFinoraBranchCertificationKeyMaterial,
  toFinoraBranchCertificationPublicKey,
} from "../control/finoraBranchCertificationCrypto.js";

import {
  canonicalizeFinoraControlCenterValue,
} from "./finoraControlCenterCanonicalization.js";

import {
  FINORA_INSTALLATION_ENROLLMENT_REQUEST_FILE_FORMAT_V1,
  FINORA_INSTALLATION_ENROLLMENT_REQUEST_FILE_FORMAT_V2,
  verifyFinoraInstallationEnrollmentRequestFile,
} from "./finoraInstallationEnrollmentRequestVerifier.js";

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

const installation =
  generateFinoraWindowsInstallationBindingMaterial(
    new Date(
      "2026-09-16T02:00:00.000Z",
    ),
    "FINORA-INSTALLATION-ENROLLMENT-V2-SELFTEST",
  );

const deviceBinding = {
  installationId:
    installation.installationId,

  bindingKeyId:
    installation.bindingKeyId,

  platform:
    installation.platform,

  algorithm:
    installation.algorithm,

  publicKeyFormat:
    installation.publicKeyFormat,

  publicKey:
    installation.publicKey,

  fingerprintAlgorithm:
    installation.fingerprintAlgorithm,

  publicKeyFingerprint:
    installation.publicKeyFingerprint,

  createdAt:
    installation.createdAt,

  schemaVersion:
    1 as const,
};

const branchMaterial =
  generateFinoraBranchCertificationKeyMaterial(
    new Date(
      "2026-09-16T02:01:00.000Z",
    ),
  );

const branchPublicKey =
  toFinoraBranchCertificationPublicKey(
    branchMaterial,
  );

function createSignature(
  payload:
    unknown,
) {

  const canonical =
    canonicalizeFinoraControlCenterValue(
      payload,
    );

  return {
    algorithm:
      "ECDSA_P256_SHA256" as const,

    encoding:
      "IEEE_P1363" as const,

    canonicalization:
      "FINORA_CANONICAL_JSON_V1" as const,

    bindingKeyId:
      installation.bindingKeyId,

    value:
      signFinoraInstallationBindingCanonicalValue(
        canonical,
        installation,
      ),
  };
}

// ============================================================
// LEGACY V1 — VERIFY FOR HISTORICAL COMPATIBILITY
// ============================================================

const v1Payload = {
  requestId:
    "FINORA-ENROLLMENT-V1-COMPAT-SELFTEST",

  deviceBinding,

  requestedAt:
    "2026-09-16T02:02:00.000Z",

  schemaVersion:
    1 as const,
};

const v1File = {
  format:
    FINORA_INSTALLATION_ENROLLMENT_REQUEST_FILE_FORMAT_V1,

  request: {
    payload:
      v1Payload,

    signature:
      createSignature(
        v1Payload,
      ),

    schemaVersion:
      1 as const,
  },

  schemaVersion:
    1 as const,
};

const v1Result =
  verifyFinoraInstallationEnrollmentRequestFile(
    v1File,
  );

assert(
  v1Result.success,
  "Authentic legacy Enrollment Request V1 no longer verifies.",
);

assert(
  v1Result.data.requestSchemaVersion ===
    1,
  "Verified V1 request did not preserve source request version.",
);

assert(
  v1Result.data.branchCertificationPublicKey ===
    undefined,
  "Legacy V1 unexpectedly acquired Branch Certification authority.",
);

console.log(
  "PASS: authentic legacy Enrollment Request V1 remains verifiable",
);

// ============================================================
// V2 — BRANCH CERTIFICATION KEY IS POSSESSION-SIGNED
// ============================================================

const v2Payload = {
  requestId:
    "FINORA-ENROLLMENT-V2-SELFTEST",

  deviceBinding,

  branchCertificationPublicKey:
    branchPublicKey,

  requestedAt:
    "2026-09-16T02:03:00.000Z",

  schemaVersion:
    2 as const,
};

const v2File = {
  format:
    FINORA_INSTALLATION_ENROLLMENT_REQUEST_FILE_FORMAT_V2,

  request: {
    payload:
      v2Payload,

    signature:
      createSignature(
        v2Payload,
      ),

    schemaVersion:
      2 as const,
  },

  schemaVersion:
    2 as const,
};

const v2Result =
  verifyFinoraInstallationEnrollmentRequestFile(
    v2File,
  );

assert(
  v2Result.success,
  "Authentic Enrollment Request V2 did not verify.",
);

assert(
  v2Result.data.requestSchemaVersion ===
    2,
  "Verified V2 request did not preserve source request version.",
);

assert(
  v2Result.data.branchCertificationPublicKey?.keyId ===
    branchPublicKey.keyId,
  "Verified V2 request did not preserve Branch Certification authority.",
);

console.log(
  "PASS: authentic V2 request verifies with possession-signed Branch Certification authority",
);

// ============================================================
// V2 MISSING BRANCH AUTHORITY
// ============================================================

const {
  branchCertificationPublicKey:
    _removedBranchCertificationPublicKey,

  ...v2PayloadWithoutBranchCertification
} =
  v2Payload;

const missingBranchFile = {
  ...v2File,

  request: {
    ...v2File.request,

    payload:
      v2PayloadWithoutBranchCertification,

    signature:
      createSignature(
        v2PayloadWithoutBranchCertification,
      ),
  },
};

const missingBranchResult =
  verifyFinoraInstallationEnrollmentRequestFile(
    missingBranchFile,
  );

assert(
  !missingBranchResult.success,
  "V2 request without Branch Certification authority was accepted.",
);

console.log(
  "PASS: V2 request without Branch Certification authority is rejected",
);

// ============================================================
// V2 BRANCH KEY TAMPER AFTER NATIVE SIGNING
// ============================================================

const otherBranchPublicKey =
  toFinoraBranchCertificationPublicKey(
    generateFinoraBranchCertificationKeyMaterial(
      new Date(
        "2026-09-16T02:04:00.000Z",
      ),
    ),
  );

const tamperedBranchFile = {
  ...v2File,

  request: {
    ...v2File.request,

    payload: {
      ...v2Payload,

      branchCertificationPublicKey:
        otherBranchPublicKey,
    },
  },
};

const tamperedBranchResult =
  verifyFinoraInstallationEnrollmentRequestFile(
    tamperedBranchFile,
  );

assert(
  !tamperedBranchResult.success,
  "Branch Certification public key could be changed without invalidating native possession proof.",
);

console.log(
  "PASS: Branch Certification public-key tamper invalidates native possession proof",
);

// ============================================================
// V2 NESTED EXACT-KEY POLICY
// ============================================================

const extraBranchFieldFile = {
  ...v2File,

  request: {
    ...v2File.request,

    payload: {
      ...v2Payload,

      branchCertificationPublicKey: {
        ...branchPublicKey,

        unexpected:
          "NOT_ALLOWED",
      },
    },
  },
};

const extraBranchFieldResult =
  verifyFinoraInstallationEnrollmentRequestFile(
    extraBranchFieldFile,
  );

assert(
  !extraBranchFieldResult.success,
  "V2 Branch Certification public-key object accepted unsupported fields.",
);

console.log(
  "PASS: V2 Branch Certification public-key shape is exact",
);

// ============================================================
// V1 MUST NOT SILENTLY ACCEPT V2 FIELD
// ============================================================

const v1WithBranchAuthority = {
  ...v1File,

  request: {
    ...v1File.request,

    payload: {
      ...v1Payload,

      branchCertificationPublicKey:
        branchPublicKey,
    },
  },
};

const v1WithBranchResult =
  verifyFinoraInstallationEnrollmentRequestFile(
    v1WithBranchAuthority,
  );

assert(
  !v1WithBranchResult.success,
  "Legacy V1 request silently accepted a V2-only Branch Certification field.",
);

console.log(
  "PASS: V1 exact shape remains isolated from V2 authority fields",
);

console.log(
  "============================================================",
);

console.log(
  "PASS: PHASE 5.6L-3D3B2B ENROLLMENT REQUEST V2 EXECUTABLE PROOF",
);

console.log(
  "============================================================",
);