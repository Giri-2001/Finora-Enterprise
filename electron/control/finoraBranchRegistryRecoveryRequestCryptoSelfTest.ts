import type {
  FinoraBranchRegistryRecoveryRequestPayloadV1,
} from "./finoraBranchRegistryRecoveryRequestContract.js";

import {
  generateFinoraBranchCertificationKeyMaterial,
  toFinoraBranchCertificationPublicKey,
} from "./finoraBranchCertificationCrypto.js";

import {
  FINORA_BRANCH_REGISTRY_RECOVERY_REQUEST_FORMAT,
  FINORA_BRANCH_REGISTRY_RECOVERY_REQUEST_SCHEMA_VERSION,
} from "./finoraBranchRegistryRecoveryRequestContract.js";

import {
  signFinoraBranchRegistryRecoveryRequest,
  verifyFinoraBranchRegistryRecoveryRequestSignature,
} from "./finoraBranchRegistryRecoveryRequestCrypto.js";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const now =
  new Date("2026-09-24T12:00:00.000Z");

const material =
  generateFinoraBranchCertificationKeyMaterial(now);

const wrongMaterial =
  generateFinoraBranchCertificationKeyMaterial(
    new Date("2026-09-24T12:01:00.000Z"),
  );

const payload:
  FinoraBranchRegistryRecoveryRequestPayloadV1 = {

    format:
      FINORA_BRANCH_REGISTRY_RECOVERY_REQUEST_FORMAT,

    schemaVersion:
      FINORA_BRANCH_REGISTRY_RECOVERY_REQUEST_SCHEMA_VERSION,

    requestId: "RECOVERY-REQUEST-000001",
    nonce: "NONCE-000001",

    ownerId: "OWNER-000001",
    businessId: "BUSINESS-000001",
    branchId: "BRANCH-000001-001",

    businessCode: "GGB",
    branchCode: "GGB-01",

    branchCertificationPublicKey:
      toFinoraBranchCertificationPublicKey(material),

    portabilityProvenance: {
      sourceAuthorizationId:
        "SOURCE-AUTHORIZATION-000001",

      signedPortabilityAuthorityPackage: {
        test: true,
      },

      verifiedControlSigner: {
        test: true,
      },
    },

    issuedAt: now.toISOString(),
  };

const signed =
  signFinoraBranchRegistryRecoveryRequest(
    payload,
    material,
  );

assert(
  verifyFinoraBranchRegistryRecoveryRequestSignature(
    signed,
    {
      ownerId: payload.ownerId,
      businessId: payload.businessId,
      branchId: payload.branchId,
    },
  ),
  "Valid recovery request failed.",
);

assert(
  !verifyFinoraBranchRegistryRecoveryRequestSignature(
    signed,
    {
      ownerId: "OWNER-WRONG",
      businessId: payload.businessId,
      branchId: payload.branchId,
    },
  ),
  "Wrong scope was accepted.",
);

const tampered = {
  ...signed,
  payload: {
    ...signed.payload,
    businessCode: "TAMPERED",
  },
};

assert(
  !verifyFinoraBranchRegistryRecoveryRequestSignature(
    tampered,
    {
      ownerId: payload.ownerId,
      businessId: payload.businessId,
      branchId: payload.branchId,
    },
  ),
  "Tampered request was accepted.",
);

let wrongKeyRejected = false;

try {
  signFinoraBranchRegistryRecoveryRequest(
    payload,
    wrongMaterial,
  );
} catch {
  wrongKeyRejected = true;
}

assert(
  wrongKeyRejected,
  "Wrong signing key was accepted.",
);

console.log(
  "PASS - FINORA Branch Registry Recovery Request crypto self-test",
);
