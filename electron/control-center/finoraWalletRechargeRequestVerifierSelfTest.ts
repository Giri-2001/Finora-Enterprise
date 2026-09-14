import {
  createHash,
  generateKeyPairSync,
  sign as nodeSign,
} from "node:crypto";

import {
  canonicalizeFinoraControlCenterValue,
} from "./finoraControlCenterCanonicalization.js";

import {
  verifyFinoraWalletRechargeRequestAgainstRegistryRecord,
} from "./finoraWalletRechargeRequestVerifier.js";

import type {
  FinoraControlCenterBranchRegistryRecord,
} from "./finoraControlCenterBranchRegistry.types.js";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function clone<T>(
  value: T,
): T {
  return JSON.parse(
    JSON.stringify(value),
  ) as T;
}

console.log(
  "===== FINORA WALLET RECHARGE REQUEST VERIFIER SELFTEST =====",
);

const {
  publicKey,
  privateKey,
} =
  generateKeyPairSync(
    "ec",
    {
      namedCurve:
        "prime256v1",
    },
  );

const publicKeyDer =
  publicKey.export({
    format:
      "der",
    type:
      "spki",
  }) as Buffer;

const publicKeyBase64 =
  publicKeyDer.toString(
    "base64",
  );

const publicKeyFingerprint =
  createHash(
    "sha256",
  )
    .update(
      publicKeyDer,
    )
    .digest(
      "hex",
    );

const bindingKeyId =
  `FINORA-BINDING-${publicKeyFingerprint
    .slice(
      0,
      32,
    )
    .toUpperCase()}`;

console.log(
  "PASS: ephemeral P-256 installation binding generated",
);

const ownerId =
  "OWNER-TEST-001";

const businessId =
  "BUSINESS-TEST-001";

const branchId =
  "BRANCH-TEST-001";

const paymentReference =
  "FINORA-WALLET-PAY-TEST-UPI-001";

const requestDigest =
  createHash(
    "sha256",
  )
    .update(
      [
        "WALLET_RECHARGE_REQUEST",
        ownerId,
        businessId,
        branchId,
        paymentReference,
      ].join(
        "\u0000",
      ),
      "utf8",
    )
    .digest(
      "hex",
    )
    .toUpperCase();

const payload = {
  purpose:
    "WALLET_RECHARGE_REQUEST",

  requestId:
    `FINORA-WAL-REQ-${requestDigest}`,

  paymentReference,

  scope: {
    ownerId,
    businessId,
    branchId,
  },

  displayIdentity: {
    businessCode:
      "TST",

    branchCode:
      "TST-01",
  },

  installation: {
    installationId:
      "FINORA-INSTALLATION-TEST-001",

    bindingKeyId,

    fingerprintAlgorithm:
      "SHA-256",

    publicKeyFingerprint,
  },

  amountMinor:
    10000,

  currency:
    "INR",

  paymentMethod:
    "UPI",

  paymentSource:
    "UPI",

  requestedAt:
    "2026-09-11T06:50:52.697Z",

  schemaVersion:
    1,
};

const canonicalPayload =
  canonicalizeFinoraControlCenterValue(
    payload,
  );

const signature =
  nodeSign(
    "sha256",
    Buffer.from(
      canonicalPayload,
      "utf8",
    ),
    {
      key:
        privateKey,

      dsaEncoding:
        "ieee-p1363",
    },
  );

assert(
  signature.byteLength ===
    64,
  "Expected canonical 64-byte IEEE-P1363 signature.",
);

const requestFile = {
  format:
    "FINORA_WALLET_RECHARGE_REQUEST_V1",

  request: {
    payload,

    signature: {
      algorithm:
        "ECDSA_P256_SHA256",

      encoding:
        "IEEE_P1363",

      canonicalization:
        "FINORA_CANONICAL_JSON_V1",

      bindingKeyId,

      value:
        signature.toString(
          "base64",
        ),
    },

    schemaVersion:
      1,
  },

  schemaVersion:
    1,
};

const registryRecord = {
  identity: {
    ownerId,
    businessId,
    branchId,

    businessCode:
      "TST",

    branchCode:
      "TST-01",

    installation: {
      installationId:
        "FINORA-INSTALLATION-TEST-001",

      bindingKeyId,

      platform:
        "WINDOWS",

      algorithm:
        "ECDSA_P256_SHA256",

      publicKeyFormat:
        "SPKI_DER_BASE64",

      publicKey:
        publicKeyBase64,

      fingerprintAlgorithm:
        "SHA-256",

      publicKeyFingerprint,

      bindingCreatedAt:
        "2026-09-01T00:00:00.000Z",
    },
  },

  createdAt:
    "2026-09-01T00:00:00.000Z",

  updatedAt:
    "2026-09-01T00:00:00.000Z",

  schemaVersion:
    1,
} as unknown as
  FinoraControlCenterBranchRegistryRecord;

const validResult =
  verifyFinoraWalletRechargeRequestAgainstRegistryRecord(
    requestFile,
    registryRecord,
  );

assert(
  validResult.success,
  "Valid signed Wallet Recharge Request was rejected.",
);

assert(
  validResult.data.amountMinor ===
    10000,
  "Verified amountMinor was not preserved.",
);

assert(
  validResult.data.paymentReference ===
    paymentReference,
  "Verified paymentReference changed unexpectedly.",
);

console.log(
  "PASS: genuine branch-signed request accepted",
);

console.log(
  "PASS: amountMinor 10000 and paymentReference preserved",
);

const tamperedAmount =
  clone(
    requestFile,
  );

tamperedAmount.request.payload.amountMinor =
  20000;

const tamperedAmountResult =
  verifyFinoraWalletRechargeRequestAgainstRegistryRecord(
    tamperedAmount,
    registryRecord,
  );

assert(
  !tamperedAmountResult.success &&
    tamperedAmountResult.errorCode ===
      "INVALID_SIGNATURE",
  "Tampered recharge amount was not rejected.",
);

console.log(
  "PASS: amount tampering rejected by installation signature",
);

const wrongBranchRegistry =
  clone(
    registryRecord,
  );

wrongBranchRegistry.identity.branchCode =
  "WRONG-01";

const wrongBranchResult =
  verifyFinoraWalletRechargeRequestAgainstRegistryRecord(
    requestFile,
    wrongBranchRegistry,
  );

assert(
  !wrongBranchResult.success &&
    wrongBranchResult.errorCode ===
      "SCOPE_MISMATCH",
  "Wrong Branch Registry identity was not rejected.",
);

console.log(
  "PASS: Branch Registry identity mismatch rejected",
);

const wrongInstallationRegistry =
  clone(
    registryRecord,
  );

wrongInstallationRegistry.identity.installation.installationId =
  "FINORA-INSTALLATION-WRONG";

const wrongInstallationResult =
  verifyFinoraWalletRechargeRequestAgainstRegistryRecord(
    requestFile,
    wrongInstallationRegistry,
  );

assert(
  !wrongInstallationResult.success &&
    wrongInstallationResult.errorCode ===
      "INSTALLATION_MISMATCH",
  "Wrong installation binding was not rejected.",
);

console.log(
  "PASS: installation mismatch rejected",
);

const invalidMethod =
  clone(
    requestFile,
  );

invalidMethod.request.payload.paymentMethod =
  "CASH";

const invalidMethodResult =
  verifyFinoraWalletRechargeRequestAgainstRegistryRecord(
    invalidMethod,
    registryRecord,
  );

assert(
  !invalidMethodResult.success &&
    invalidMethodResult.errorCode ===
      "INVALID_STRUCTURE",
  "Unsupported payment method was not rejected.",
);

console.log(
  "PASS: unsupported payment method rejected",
);

const invalidRequestId =
  clone(
    requestFile,
  );

invalidRequestId.request.payload.requestId =
  "FINORA-WAL-REQ-INVALID";

const invalidRequestIdResult =
  verifyFinoraWalletRechargeRequestAgainstRegistryRecord(
    invalidRequestId,
    registryRecord,
  );

assert(
  !invalidRequestIdResult.success &&
    invalidRequestIdResult.errorCode ===
      "INVALID_REQUEST_ID",
  "Non-canonical requestId was not rejected.",
);

console.log(
  "PASS: non-canonical requestId rejected",
);

console.log(
  "============================================================",
);

console.log(
  "PASS: FINORA WALLET RECHARGE REQUEST VERIFIER SELFTEST",
);

console.log(
  "============================================================",
);