/* ============================================================
   FINORA ENTERPRISE OS™

   WALLET RECHARGE REQUEST CONTRACT SELF TEST

   PURE NODE SELFTEST:
   - no Electron app lifecycle
   - no Control Store
   - no real Wallet
   - no real pending recharge
============================================================ */

import {
  canonicalizeFinoraControlCenterValue,
} from "../control-center/finoraControlCenterCanonicalization.js";

import {
  generateFinoraWindowsInstallationBindingMaterial,
  signFinoraInstallationBindingCanonicalValue,
  toFinoraWindowsInstallationBindingPublic,
  verifyFinoraInstallationBindingCanonicalValue,
} from "./finoraInstallationBindingCrypto.js";

import {
  FINORA_WALLET_RECHARGE_REQUEST_CANONICALIZATION,
  FINORA_WALLET_RECHARGE_REQUEST_CURRENCY,
  FINORA_WALLET_RECHARGE_REQUEST_PURPOSE,
  FINORA_WALLET_RECHARGE_REQUEST_SCHEMA_VERSION,
  FINORA_WALLET_RECHARGE_REQUEST_SIGNATURE_ALGORITHM,
  FINORA_WALLET_RECHARGE_REQUEST_SIGNATURE_ENCODING,
  type FinoraSignedWalletRechargeRequest,
  type FinoraWalletRechargeRequestPayloadV1,
} from "./finoraWalletRechargeRequest.types.js";

import {
  FINORA_WALLET_RECHARGE_REQUEST_FILE_FORMAT,
  FINORA_WALLET_RECHARGE_REQUEST_MAX_FILE_BYTES,
  createFinoraWalletRechargeRequestFileName,
  serializeFinoraWalletRechargeRequestFile,
} from "./finoraWalletRechargeRequestFileContract.js";

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

async function runSelfTest():
  Promise<void> {

  console.log(
    "===== FINORA WALLET RECHARGE REQUEST CONTRACT SELFTEST =====",
  );

  const material =
    generateFinoraWindowsInstallationBindingMaterial(
      new Date(
        "2026-09-11T06:00:00.000Z",
      ),
      "FINORA-INSTALLATION-WALLET-REQ-SELFTEST",
    );

  const publicBinding =
    toFinoraWindowsInstallationBindingPublic(
      material,
    );

  console.log(
    "PASS: ephemeral P-256 installation binding generated",
  );

  const requestId =
    "FINORA-WAL-REQ-" +
    "A4C91F" +
    "0".repeat(
      58,
    );

  const payload:
    FinoraWalletRechargeRequestPayloadV1 = {

      purpose:
        FINORA_WALLET_RECHARGE_REQUEST_PURPOSE,

      requestId,

      paymentReference:
        "FINORA-PAYMENT-SELFTEST-001",

      scope: {
        ownerId:
          "OWNER-SELFTEST-001",

        businessId:
          "BUSINESS-SELFTEST-001",

        branchId:
          "BRANCH-SELFTEST-001",
      },

      displayIdentity: {
        businessCode:
          "GGB",

        branchCode:
          "GGB-01",
      },

      installation: {
        installationId:
          publicBinding.installationId,

        bindingKeyId:
          publicBinding.bindingKeyId,

        fingerprintAlgorithm:
          publicBinding.fingerprintAlgorithm,

        publicKeyFingerprint:
          publicBinding.publicKeyFingerprint,
      },

      amountMinor:
        10000,

      currency:
        FINORA_WALLET_RECHARGE_REQUEST_CURRENCY,

      paymentMethod:
        "UPI",

      paymentSource:
        "UPI",

      requestedAt:
        "2026-09-11T06:01:00.000Z",

      schemaVersion:
        FINORA_WALLET_RECHARGE_REQUEST_SCHEMA_VERSION,
    };

  const canonicalPayload =
    canonicalizeFinoraControlCenterValue(
      payload,
    );

  const signatureValue =
    signFinoraInstallationBindingCanonicalValue(
      canonicalPayload,
      material,
    );

  assert(
    verifyFinoraInstallationBindingCanonicalValue(
      canonicalPayload,
      signatureValue,
      publicBinding,
    ),
    "Genuine Wallet Recharge Request signature did not verify.",
  );

  console.log(
    "PASS: genuine canonical Wallet Recharge Request signature verified",
  );

  const tamperedPayload:
    FinoraWalletRechargeRequestPayloadV1 = {
      ...payload,

      amountMinor:
        20000,
    };

  assert(
    !verifyFinoraInstallationBindingCanonicalValue(
      canonicalizeFinoraControlCenterValue(
        tamperedPayload,
      ),
      signatureValue,
      publicBinding,
    ),
    "Tampered Wallet Recharge Request amount unexpectedly verified.",
  );

  console.log(
    "PASS: amount tampering invalidated installation signature",
  );

  const request:
    FinoraSignedWalletRechargeRequest = {

      payload,

      signature: {
        algorithm:
          FINORA_WALLET_RECHARGE_REQUEST_SIGNATURE_ALGORITHM,

        encoding:
          FINORA_WALLET_RECHARGE_REQUEST_SIGNATURE_ENCODING,

        canonicalization:
          FINORA_WALLET_RECHARGE_REQUEST_CANONICALIZATION,

        bindingKeyId:
          publicBinding.bindingKeyId,

        value:
          signatureValue,
      },

      schemaVersion:
        FINORA_WALLET_RECHARGE_REQUEST_SCHEMA_VERSION,
    };

  const fileNameA =
    createFinoraWalletRechargeRequestFileName(
      request,
    );

  const fileNameB =
    createFinoraWalletRechargeRequestFileName(
      request,
    );

  assert(
    fileNameA ===
      "FIN-WAL-REQ-GGB-BR001-UPI-100-A4C91F.finora",
    `Unexpected Wallet Recharge Request filename: ${fileNameA}`,
  );

  assert(
    fileNameA ===
      fileNameB,
    "Wallet Recharge Request filename is not deterministic.",
  );

  console.log(
    `PASS: deterministic short filename = ${fileNameA}`,
  );

  const {
    serialized,
    bytes,
  } =
    serializeFinoraWalletRechargeRequestFile(
      request,
    );

  assert(
    bytes >
      0 &&
    bytes <=
      FINORA_WALLET_RECHARGE_REQUEST_MAX_FILE_BYTES,
    "Serialized Wallet Recharge Request size is invalid.",
  );

  const parsed =
    JSON.parse(
      serialized,
    ) as {
      format?:
        unknown;

      schemaVersion?:
        unknown;
    };

  assert(
    parsed.format ===
      FINORA_WALLET_RECHARGE_REQUEST_FILE_FORMAT,
    "Serialized Wallet Recharge Request format is invalid.",
  );

  assert(
    parsed.schemaVersion ===
      1,
    "Serialized Wallet Recharge Request schemaVersion is invalid.",
  );

  console.log(
    `PASS: serialized V1 envelope bounded at ${bytes} bytes`,
  );

  assert(
    !serialized.includes(
      material.privateKey,
    ),
    "Serialized Wallet Recharge Request leaked private-key material.",
  );

  assert(
    !serialized.includes(
      '"privateKey"',
    ),
    "Serialized Wallet Recharge Request contains privateKey field.",
  );

  console.log(
    "PASS: serialized request contains no installation private key",
  );

  const renamedExternalFile:
    string =
      "anything-the-user-renamed.finora";

  assert(
    renamedExternalFile !==
      fileNameA,
    "Rename fixture must differ from canonical filename.",
  );

  assert(
    verifyFinoraInstallationBindingCanonicalValue(
      canonicalizeFinoraControlCenterValue(
        request.payload,
      ),
      request.signature.value,
      publicBinding,
    ),
    "External filename rename affected cryptographic verification.",
  );

  console.log(
    "PASS: external filename rename has zero cryptographic effect",
  );

  console.log(
    "============================================================",
  );

  console.log(
    "PASS: FINORA WALLET RECHARGE REQUEST CONTRACT SELFTEST",
  );

  console.log(
    "============================================================",
  );
}

void runSelfTest().catch(
  (
    error,
  ) => {

    console.error(
      "FAIL: FINORA WALLET RECHARGE REQUEST CONTRACT SELFTEST",
      error,
    );

    process.exitCode =
      1;
  },
);

/* ============================================================
   END
============================================================ */