// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL PLANE
// SIGNED WALLET RECHARGE PACKAGE APPLY SELF TEST
//
// ISOLATION:
//
// - Uses a temporary Electron userData directory.
// - Uses a temporary encrypted FINORA Control Store.
// - Uses a temporary native installation-binding vault.
// - Uses an ephemeral Control Center P-256 signing key.
// - Does NOT access the production Control Center key vault.
// - Does NOT access normal FINORA userData.
// - Deletes temporary state before exit.
//
// COVERAGE:
//
// - Valid cryptographically signed WALLET_RECHARGE apply
// - Trusted authorization persistence/readback
// - Replay rejection
// - Stale/equal sequence rejection
// - Wrong package purpose rejection
// - Wrong signed target rejection
// - Wrong payload installation binding rejection
// - Payload/package issuedAt mismatch rejection
// - Invalid recharge amountMinor rejection
// - Wrong recharge currency rejection
// - Signed payload tamper rejection
// - Invalid signature rejection
// - Duplicate paymentReference rejection
//
// IMPORTANT:
//
// - This proves signed Recharge AUTHORIZATION only.
// - No Wallet balance mutation occurs in this self-test.
// - verifiedAt is verification evidence, not Wallet time.
//
// ============================================================

import {
  app,
} from "electron";

import {
  mkdtemp,
  rm,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  canonicalizeFinoraControlCenterValue,
  createFinoraControlCenterPayloadDigest,
} from "../control-center/finoraControlCenterCanonicalization.js";

import {
  generateFinoraControlCenterSigningMaterial,
  signFinoraControlCenterCanonicalValue,
} from "../control-center/finoraControlCenterCrypto.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import type {
  FinoraWindowsInstallationBindingPublic,
} from "./finoraInstallationBindingCrypto.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import type {
  FinoraControlInstallationIdentity,
} from "./finoraControlStore.js";

import {
  findFinoraWalletRechargeAuthorization,
  saveFinoraInstallationIdentity,
} from "./finoraControlStore.js";

import {
  applyFinoraSignedWalletRechargePackage,
} from "./finoraWalletRechargePackageApplyService.js";
import {
  applyFinoraSignedWalletRechargeDeclinePackage,
} from "./finoraWalletRechargeDeclinePackageApplyService.js";

import {
  findFinoraWalletRechargeDecline,
  readFinoraControlStore,
} from "./finoraControlStore.js";

// ============================================================
// TYPES
// ============================================================

interface SelfTestScope {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

interface SelfTestPackageTarget
  extends SelfTestScope {

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;
}

interface SelfTestBindingTarget {

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;

  schemaVersion:
    1;
}

// ============================================================
// ASSERTIONS
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

function expectFailure(
  label:
    string,

  result: {
    success:
      boolean;

    error?:
      string;
  },
): void {

  assert(
    !result.success,
    `${label}: expected failure but operation succeeded.`,
  );

  console.log(
    `PASS: ${label}`,
  );
}

// ============================================================
// PAYLOAD BUILDERS
// ============================================================

function toBindingTarget(
  binding:
    FinoraWindowsInstallationBindingPublic,
): SelfTestBindingTarget {

  return {
    installationId:
      binding.installationId,

    bindingKeyId:
      binding.bindingKeyId,

    fingerprintAlgorithm:
      "SHA-256",

    publicKeyFingerprint:
      binding.publicKeyFingerprint,

    schemaVersion:
      1,
  };
}

function createRechargePayload(
  input: {
    scope:
      SelfTestScope;

    binding:
      SelfTestBindingTarget;

    issuedAt:
      string;

    paymentReference:
      string;

    amountMinor?:
      number;

    currency?:
      string;

    paymentMethod?:
      string;

    paymentSource?:
      string;
  },
): Record<string, unknown> {

  return {
    scope: {
      ownerId:
        input.scope.ownerId,

      businessId:
        input.scope.businessId,

      branchId:
        input.scope.branchId,
    },

    installationBinding: {
      ...input.binding,
    },

    paymentReference:
      input.paymentReference,

    amountMinor:
      input.amountMinor ??
      500,

    currency:
      input.currency ??
      "INR",

    paymentMethod:
      input.paymentMethod ??
      "UPI",

    paymentSource:
      input.paymentSource ??
      "UPI",

    issuedAt:
      input.issuedAt,

    schemaVersion:
      1,
  };
}

// ============================================================
// SIGNED PACKAGE BUILDER
// ============================================================

function createSignedPackage(
  input: {
    packageId:
      string;

    purpose:
      string;

    target:
      SelfTestPackageTarget;

    issuedAt:
      string;

    sequence:
      number;

    payload:
      Record<string, unknown>;

    issuerId:
      string;

    signingKeyId:
      string;

    privateKeyPkcs8DerBase64:
      string;
  },
) {

  const unsignedPackage = {
    packageId:
      input.packageId,

    purpose:
      input.purpose,

    issuer: {
      type:
        "FINORA_CONTROL_CENTER" as const,

      issuerId:
        input.issuerId,

      signingKeyId:
        input.signingKeyId,
    },

    target: {
      ...input.target,
    },

    issuedAt:
      input.issuedAt,

    sequence:
      input.sequence,

    payloadVersion:
      1,

    payload:
      input.payload,

    payloadDigest:
      createFinoraControlCenterPayloadDigest(
        input.payload,
      ),

    schemaVersion:
      1 as const,
  };

  const canonicalPackage =
    canonicalizeFinoraControlCenterValue(
      unsignedPackage,
    );

  const signature =
    signFinoraControlCenterCanonicalValue(
      canonicalPackage,
      input.privateKeyPkcs8DerBase64,
    );

  return {
    ...unsignedPackage,

    signature: {
      algorithm:
        "ECDSA_P256_SHA256" as const,

      encoding:
        "IEEE_P1363" as const,

      canonicalization:
        "FINORA_CANONICAL_JSON_V1" as const,

      signingKeyId:
        input.signingKeyId,

      value:
        signature,
    },
  };
}

// ============================================================
// SELF TEST
// ============================================================

async function runSelfTest():
  Promise<void> {

  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-wallet-recharge-selftest-",
      ),
    );

  let failure:
    unknown;

  try {

    // --------------------------------------------------------
    // ISOLATE ALL ELECTRON PERSISTENCE BEFORE APP READY
    // --------------------------------------------------------

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    console.log(
      "PASS: isolated Electron userData configured",
    );

    // --------------------------------------------------------
    // ISOLATED NATIVE INSTALLATION BINDING
    // --------------------------------------------------------

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    assert(
      nativeBinding.installationId.length >
        0,
      "Native installation binding was not created.",
    );

    console.log(
      "PASS: isolated native installation binding created",
    );

    // --------------------------------------------------------
    // ISOLATED CONTROL STORE INSTALLATION IDENTITY
    // --------------------------------------------------------

    const now =
      new Date();

    const issuedAt =
      now.toISOString();

    const scope:
      SelfTestScope = {

        ownerId:
          "OWNER-WALLET-RECHARGE-SELFTEST",

        businessId:
          "BUSINESS-WALLET-RECHARGE-SELFTEST",

        branchId:
          "BRANCH-WALLET-RECHARGE-SELFTEST",
      };

    const installation:
      FinoraControlInstallationIdentity = {

        installationId:
          nativeBinding.installationId,

        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,

        businessCode:
          "WLT01",

        branchCode:
          "B01",

        createdAt:
          issuedAt,

        updatedAt:
          issuedAt,

        schemaVersion:
          1,
      };

    const installationResult =
      await saveFinoraInstallationIdentity(
        installation,
      );

    assert(
      installationResult.success,
      installationResult.error ??
        "Unable to save isolated installation identity.",
    );

    console.log(
      "PASS: isolated Control Store installation identity persisted",
    );

    // --------------------------------------------------------
    // EPHEMERAL CONTROL CENTER SIGNING IDENTITY
    // --------------------------------------------------------

    const signingMaterial =
      generateFinoraControlCenterSigningMaterial();

    const issuerId =
      "FINORA-WALLET-RECHARGE-SELFTEST-CONTROL-CENTER";

    const trustedKeys:
      FinoraBranchTrustedControlPublicKey[] = [
        {
          issuerId,

          signingKeyId:
            signingMaterial.signingKeyId,

          algorithm:
            "ECDSA_P256_SHA256",

          format:
            "SPKI_DER_BASE64",

          publicKey:
            signingMaterial.publicKeySpkiDerBase64,

          status:
            "ACTIVE",

          validFrom:
            new Date(
              now.getTime() -
                24 * 60 * 60 * 1000,
            ).toISOString(),
        },
      ];

    console.log(
      "PASS: ephemeral Control Center signing identity created",
    );

    // --------------------------------------------------------
    // COMMON TARGET / PAYLOAD
    // --------------------------------------------------------

    const packageTarget:
      SelfTestPackageTarget = {

        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,

        installationId:
          nativeBinding.installationId,

        bindingKeyId:
          nativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          nativeBinding.publicKeyFingerprint,
      };

    const bindingTarget =
      toBindingTarget(
        nativeBinding,
      );

    const paymentReference =
      "FINORA-WALLET-RECHARGE-SELFTEST-PAYMENT-1";

    const validPayload =
      createRechargePayload({
        scope,
        binding:
          bindingTarget,
        issuedAt,
        paymentReference,
      });

    // ========================================================
    // TEST 1 - VALID SIGNED RECHARGE AUTHORIZATION
    // ========================================================

    const validPackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-SELFTEST-PACKAGE-1",

        purpose:
          "WALLET_RECHARGE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          1,

        payload:
          validPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const validApplyResult =
      await applyFinoraSignedWalletRechargePackage(
        validPackage,
        trustedKeys,
        now,
      );

    assert(
      validApplyResult.success,
      validApplyResult.error ??
        "Valid signed Wallet Recharge authorization was rejected.",
    );

    console.log(
      "PASS: valid signed WALLET_RECHARGE authorization applied",
    );

    // ========================================================
    // TEST 2 - TRUSTED AUTHORIZATION READBACK
    // ========================================================

    const authorizationResult =
      await findFinoraWalletRechargeAuthorization(
        scope.ownerId,
        scope.businessId,
        scope.branchId,
        paymentReference,
      );

    assert(
      authorizationResult.success,
      authorizationResult.error ??
        "Unable to read trusted Wallet Recharge authorization.",
    );

    const authorization =
      authorizationResult.data;

    assert(
      authorization !==
        undefined,
      "Trusted Wallet Recharge authorization was not persisted.",
    );

    assert(
      authorization.packageId ===
        validPackage.packageId,
      "Trusted Recharge packageId mismatch.",
    );

    assert(
      authorization.paymentReference ===
        paymentReference,
      "Trusted Recharge paymentReference mismatch.",
    );

    assert(
      authorization.amountMinor ===
        500,
      "Trusted Recharge amountMinor mismatch.",
    );

    assert(
      authorization.currency ===
        "INR",
      "Trusted Recharge currency mismatch.",
    );

    assert(
      authorization.issuedAt ===
        issuedAt,
      "Trusted Recharge issuedAt mismatch.",
    );

    assert(
      authorization.verifiedAt ===
        now.toISOString(),
      "Trusted Recharge verifiedAt evidence mismatch.",
    );

    console.log(
      "PASS: trusted Wallet Recharge authorization persisted and read back",
    );

    // ========================================================
    // TEST 3 - SAME PACKAGE REPLAY
    // ========================================================

    const replayResult =
      await applyFinoraSignedWalletRechargePackage(
        validPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "same signed Wallet Recharge package replay rejected",
      replayResult,
    );

    // ========================================================
    // TEST 4 - STALE / EQUAL SEQUENCE
    // ========================================================

    const stalePackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-SELFTEST-STALE",

        purpose:
          "WALLET_RECHARGE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          1,

        payload:
          createRechargePayload({
            scope,
            binding:
              bindingTarget,
            issuedAt,
            paymentReference:
              "FINORA-WALLET-RECHARGE-SELFTEST-STALE-PAYMENT",
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const staleResult =
      await applyFinoraSignedWalletRechargePackage(
        stalePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "stale/equal Wallet Recharge sequence rejected",
      staleResult,
    );

    // ========================================================
    // TEST 5 - WRONG PURPOSE
    // ========================================================

    const wrongPurposePackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-SELFTEST-WRONG-PURPOSE",

        purpose:
          "PRICING_POLICY",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          createRechargePayload({
            scope,
            binding:
              bindingTarget,
            issuedAt,
            paymentReference:
              "FINORA-WALLET-RECHARGE-SELFTEST-WRONG-PURPOSE-PAYMENT",
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const wrongPurposeResult =
      await applyFinoraSignedWalletRechargePackage(
        wrongPurposePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "wrong signed package purpose rejected",
      wrongPurposeResult,
    );

    // ========================================================
    // TEST 6 - WRONG SIGNED TARGET
    // ========================================================

    const wrongTargetPackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-SELFTEST-WRONG-TARGET",

        purpose:
          "WALLET_RECHARGE",

        target: {
          ...packageTarget,

          branchId:
            "BRANCH-WALLET-RECHARGE-SELFTEST-WRONG",
        },

        issuedAt,

        sequence:
          2,

        payload:
          createRechargePayload({
            scope,
            binding:
              bindingTarget,
            issuedAt,
            paymentReference:
              "FINORA-WALLET-RECHARGE-SELFTEST-WRONG-TARGET-PAYMENT",
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const wrongTargetResult =
      await applyFinoraSignedWalletRechargePackage(
        wrongTargetPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "wrong signed Wallet Recharge target rejected",
      wrongTargetResult,
    );

    // ========================================================
    // TEST 7 - WRONG PAYLOAD INSTALLATION BINDING
    // ========================================================

    const wrongBindingPayload =
      createRechargePayload({
        scope,

        binding: {
          ...bindingTarget,

          installationId:
            "FINORA-INSTALLATION-WRONG",
        },

        issuedAt,

        paymentReference:
          "FINORA-WALLET-RECHARGE-SELFTEST-WRONG-BINDING-PAYMENT",
      });

    const wrongBindingPackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-SELFTEST-WRONG-BINDING",

        purpose:
          "WALLET_RECHARGE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          wrongBindingPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const wrongBindingResult =
      await applyFinoraSignedWalletRechargePackage(
        wrongBindingPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "wrong Recharge payload installation binding rejected",
      wrongBindingResult,
    );

    // ========================================================
    // TEST 8 - PAYLOAD / PACKAGE ISSUEDAT MISMATCH
    // ========================================================

    const mismatchedIssuedAt =
      new Date(
        now.getTime() -
          60 * 1000,
      ).toISOString();

    const issuedAtMismatchPackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-SELFTEST-ISSUEDAT-MISMATCH",

        purpose:
          "WALLET_RECHARGE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          createRechargePayload({
            scope,
            binding:
              bindingTarget,
            issuedAt:
              mismatchedIssuedAt,
            paymentReference:
              "FINORA-WALLET-RECHARGE-SELFTEST-ISSUEDAT-PAYMENT",
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const issuedAtMismatchResult =
      await applyFinoraSignedWalletRechargePackage(
        issuedAtMismatchPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "Recharge payload/package issuedAt mismatch rejected",
      issuedAtMismatchResult,
    );

    // ========================================================
    // TEST 9 - INVALID AMOUNT
    // ========================================================

    const invalidAmountPackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-SELFTEST-INVALID-AMOUNT",

        purpose:
          "WALLET_RECHARGE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          createRechargePayload({
            scope,
            binding:
              bindingTarget,
            issuedAt,
            paymentReference:
              "FINORA-WALLET-RECHARGE-SELFTEST-INVALID-AMOUNT-PAYMENT",
            amountMinor:
              0,
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const invalidAmountResult =
      await applyFinoraSignedWalletRechargePackage(
        invalidAmountPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "zero Wallet Recharge amountMinor rejected",
      invalidAmountResult,
    );

    // ========================================================
    // TEST 10 - WRONG CURRENCY
    // ========================================================

    const wrongCurrencyPackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-SELFTEST-WRONG-CURRENCY",

        purpose:
          "WALLET_RECHARGE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          createRechargePayload({
            scope,
            binding:
              bindingTarget,
            issuedAt,
            paymentReference:
              "FINORA-WALLET-RECHARGE-SELFTEST-WRONG-CURRENCY-PAYMENT",
            currency:
              "USD",
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const wrongCurrencyResult =
      await applyFinoraSignedWalletRechargePackage(
        wrongCurrencyPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "non-INR Wallet Recharge currency rejected",
      wrongCurrencyResult,
    );

    // ========================================================
    // TEST 11 - TAMPERED SIGNED PAYLOAD
    // ========================================================

    const tamperSourcePackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-SELFTEST-TAMPERED-PAYLOAD",

        purpose:
          "WALLET_RECHARGE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          createRechargePayload({
            scope,
            binding:
              bindingTarget,
            issuedAt,
            paymentReference:
              "FINORA-WALLET-RECHARGE-SELFTEST-TAMPERED-PAYMENT",
            amountMinor:
              600,
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const tamperedPayloadPackage = {
      ...tamperSourcePackage,

      payload: {
        ...tamperSourcePackage.payload,

        amountMinor:
          999999,
      },
    };

    const tamperedPayloadResult =
      await applyFinoraSignedWalletRechargePackage(
        tamperedPayloadPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "cryptographically tampered Recharge payload rejected",
      tamperedPayloadResult,
    );

    // ========================================================
    // TEST 12 - INVALID SIGNATURE
    // ========================================================

    const signatureSourcePackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-SELFTEST-BAD-SIGNATURE",

        purpose:
          "WALLET_RECHARGE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          createRechargePayload({
            scope,
            binding:
              bindingTarget,
            issuedAt,
            paymentReference:
              "FINORA-WALLET-RECHARGE-SELFTEST-BAD-SIGNATURE-PAYMENT",
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const originalSignature =
      signatureSourcePackage.signature.value;

    const invalidSignaturePackage = {
      ...signatureSourcePackage,

      signature: {
        ...signatureSourcePackage.signature,

        value:
          `${
            originalSignature.startsWith(
              "A",
            )
              ? "B"
              : "A"
          }${originalSignature.slice(
            1,
          )}`,
      },
    };

    const invalidSignatureResult =
      await applyFinoraSignedWalletRechargePackage(
        invalidSignaturePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "invalid Wallet Recharge package signature rejected",
      invalidSignatureResult,
    );

    // ========================================================
    // TEST 13 - FRESH PACKAGE / DUPLICATE PAYMENT REFERENCE
    // ========================================================

    const duplicatePaymentReferencePackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-SELFTEST-DUPLICATE-REFERENCE",

        purpose:
          "WALLET_RECHARGE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          createRechargePayload({
            scope,
            binding:
              bindingTarget,
            issuedAt,
            paymentReference,
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const duplicatePaymentReferenceResult =
      await applyFinoraSignedWalletRechargePackage(
        duplicatePaymentReferencePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "fresh package with duplicate Wallet Recharge paymentReference rejected",
      duplicatePaymentReferenceResult,
    );

    // ========================================================

    // ========================================================
    // TEST 14 - VALID SIGNED DECLINE
    // ========================================================

    const declinePaymentReference =
      "FINORA-WALLET-RECHARGE-SELFTEST-DECLINE-PAYMENT";

    const declineRequestId =
      "FINORA-WAL-REQ-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

    const createDeclinePayload =
      (input: {
        paymentReference:
          string;

        requestId:
          string;

        amountMinor?:
          number;
      }) => ({
        scope,

        installationBinding: {
          installationId:
            bindingTarget.installationId,

          bindingKeyId:
            bindingTarget.bindingKeyId,

          fingerprintAlgorithm:
            bindingTarget.fingerprintAlgorithm,

          publicKeyFingerprint:
            bindingTarget.publicKeyFingerprint,

          schemaVersion:
            1,
        },

        requestId:
          input.requestId,

        paymentReference:
          input.paymentReference,

        amountMinor:
          input.amountMinor ??
          10000,

        currency:
          "INR",

        paymentMethod:
          "UPI",

        paymentSource:
          "UPI",

        requestedAt:
          issuedAt,

        outcome:
          "DECLINED",

        issuedAt,

        schemaVersion:
          1,
      });

    const validDeclinePackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-DECLINE-SELFTEST-VALID",

        purpose:
          "WALLET_RECHARGE_DECLINE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          1,

        payload:
          createDeclinePayload({
            paymentReference:
              declinePaymentReference,

            requestId:
              declineRequestId,
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const validDeclineResult =
      await applyFinoraSignedWalletRechargeDeclinePackage(
        validDeclinePackage,
        trustedKeys,
        now,
      );

    assert(
      validDeclineResult.success,
      validDeclineResult.error ??
        "Valid signed Wallet Recharge decline was rejected.",
    );

    console.log(
      "PASS: valid signed Wallet Recharge decline accepted",
    );

    const persistedDeclineResult =
      await findFinoraWalletRechargeDecline(
        scope.ownerId,
        scope.businessId,
        scope.branchId,
        declinePaymentReference,
      );

    assert(
      persistedDeclineResult.success &&
        persistedDeclineResult.data?.requestId ===
          declineRequestId,
      persistedDeclineResult.error ??
        "Accepted Wallet Recharge decline was not persisted under the exact payment reference.",
    );

    console.log(
      "PASS: accepted Wallet Recharge decline persisted under exact paymentReference",
    );
    assert(
      persistedDeclineResult.success &&
        persistedDeclineResult.data?.packageId ===
          validDeclinePackage.packageId &&
        persistedDeclineResult.data?.issuerId ===
          issuerId &&
        persistedDeclineResult.data?.signingKeyId ===
          signingMaterial.signingKeyId &&
        persistedDeclineResult.data?.purpose ===
          "WALLET_RECHARGE_DECLINE" &&
        persistedDeclineResult.data?.sequence ===
          1 &&
        persistedDeclineResult.data?.ownerId ===
          scope.ownerId &&
        persistedDeclineResult.data?.businessId ===
          scope.businessId &&
        persistedDeclineResult.data?.branchId ===
          scope.branchId &&
        persistedDeclineResult.data?.installationId ===
          bindingTarget.installationId &&
        persistedDeclineResult.data?.bindingKeyId ===
          bindingTarget.bindingKeyId &&
        persistedDeclineResult.data?.fingerprintAlgorithm ===
          bindingTarget.fingerprintAlgorithm &&
        persistedDeclineResult.data?.publicKeyFingerprint ===
          bindingTarget.publicKeyFingerprint &&
        persistedDeclineResult.data?.requestId ===
          declineRequestId &&
        persistedDeclineResult.data?.paymentReference ===
          declinePaymentReference &&
        persistedDeclineResult.data?.amountMinor ===
          10000 &&
        persistedDeclineResult.data?.currency ===
          "INR" &&
        persistedDeclineResult.data?.paymentMethod ===
          "UPI" &&
        persistedDeclineResult.data?.paymentSource ===
          "UPI" &&
        persistedDeclineResult.data?.requestedAt ===
          issuedAt &&
        persistedDeclineResult.data?.outcome ===
          "DECLINED" &&
        persistedDeclineResult.data?.issuedAt ===
          issuedAt &&
        persistedDeclineResult.data?.verifiedAt ===
          now.toISOString() &&
        persistedDeclineResult.data?.schemaVersion ===
          1,
      persistedDeclineResult.error ??
        "Persisted Wallet Recharge decline evidence did not preserve the exact signed request, scope, binding, finance, and timestamp fields.",
    );

    console.log(
      "PASS: persisted Wallet Recharge decline retained exact signed evidence",
    );

    const unrelatedDeclineLookup =
      await findFinoraWalletRechargeDecline(
        scope.ownerId,
        scope.businessId,
        scope.branchId,
        "FINORA-WALLET-RECHARGE-SELFTEST-NEWER-PAYMENT",
      );

    assert(
      unrelatedDeclineLookup.success &&
        unrelatedDeclineLookup.data ===
          undefined,
      unrelatedDeclineLookup.error ??
        "Old signed decline incorrectly matched a different payment reference.",
    );

    console.log(
      "PASS: old signed decline does not match a newer paymentReference",
    );
    // ========================================================
    // TEST 14A - DECLINE FIRST / APPROVAL LATER
    // ========================================================

    const approvalAfterDeclinePackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-SELFTEST-APPROVAL-AFTER-DECLINE",

        purpose:
          "WALLET_RECHARGE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          createRechargePayload({
            scope,

            binding:
              bindingTarget,

            issuedAt,

            paymentReference:
              declinePaymentReference,

            amountMinor:
              10000,

            paymentMethod:
              "UPI",

            paymentSource:
              "UPI",
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const approvalAfterDeclineResult =
      await applyFinoraSignedWalletRechargePackage(
        approvalAfterDeclinePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "declined Wallet Recharge paymentReference cannot later be authorized",
      approvalAfterDeclineResult,
    );

    // ========================================================
    // TEST 15 - EXACT DECLINE REPLAY
    // ========================================================

    const declineReplayResult =
      await applyFinoraSignedWalletRechargeDeclinePackage(
        validDeclinePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "exact signed Wallet Recharge decline replay rejected",
      declineReplayResult,
    );

    // ========================================================
    // TEST 16 - DECLINE SEQUENCE ROLLBACK
    // ========================================================

    const rollbackDeclinePackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-DECLINE-SELFTEST-ROLLBACK",

        purpose:
          "WALLET_RECHARGE_DECLINE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          1,

        payload:
          createDeclinePayload({
            paymentReference:
              "FINORA-WALLET-RECHARGE-SELFTEST-DECLINE-ROLLBACK",

            requestId:
              "FINORA-WAL-REQ-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const rollbackDeclineResult =
      await applyFinoraSignedWalletRechargeDeclinePackage(
        rollbackDeclinePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "Wallet Recharge decline sequence rollback rejected",
      rollbackDeclineResult,
    );

    // ========================================================
    // TEST 17 - WRONG PURPOSE
    // ========================================================

    const wrongPurposeDeclinePackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-DECLINE-SELFTEST-WRONG-PURPOSE",

        purpose:
          "WALLET_RECHARGE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          createDeclinePayload({
            paymentReference:
              "FINORA-WALLET-RECHARGE-SELFTEST-DECLINE-WRONG-PURPOSE",

            requestId:
              "FINORA-WAL-REQ-CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const wrongPurposeDeclineResult =
      await applyFinoraSignedWalletRechargeDeclinePackage(
        wrongPurposeDeclinePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "wrong-purpose Wallet Recharge decline package rejected",
      wrongPurposeDeclineResult,
    );

    // ========================================================
    // TEST 18 - WRONG INSTALLATION TARGET
    // ========================================================

    const wrongInstallationDeclinePackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-DECLINE-SELFTEST-WRONG-INSTALLATION",

        purpose:
          "WALLET_RECHARGE_DECLINE",

        target: {
          ...packageTarget,

          installationId:
            `${packageTarget.installationId}-WRONG`,
        },

        issuedAt,

        sequence:
          2,

        payload:
          createDeclinePayload({
            paymentReference:
              "FINORA-WALLET-RECHARGE-SELFTEST-DECLINE-WRONG-INSTALLATION",

            requestId:
              "FINORA-WAL-REQ-DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const wrongInstallationDeclineResult =
      await applyFinoraSignedWalletRechargeDeclinePackage(
        wrongInstallationDeclinePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "wrong-installation Wallet Recharge decline rejected",
      wrongInstallationDeclineResult,
    );

    // ========================================================
    // TEST 19 - MALFORMED AMOUNT
    // ========================================================

    const malformedAmountDeclinePackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-DECLINE-SELFTEST-MALFORMED-AMOUNT",

        purpose:
          "WALLET_RECHARGE_DECLINE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          createDeclinePayload({
            paymentReference:
              "FINORA-WALLET-RECHARGE-SELFTEST-DECLINE-BAD-AMOUNT",

            requestId:
              "FINORA-WAL-REQ-EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",

            amountMinor:
              0,
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const malformedAmountDeclineResult =
      await applyFinoraSignedWalletRechargeDeclinePackage(
        malformedAmountDeclinePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "malformed Wallet Recharge decline amount rejected",
      malformedAmountDeclineResult,
    );

    // ========================================================
    // TEST 20 - CRYPTOGRAPHIC PAYLOAD TAMPER
    // ========================================================

    const declineTamperSource =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-DECLINE-SELFTEST-TAMPERED",

        purpose:
          "WALLET_RECHARGE_DECLINE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          createDeclinePayload({
            paymentReference:
              "FINORA-WALLET-RECHARGE-SELFTEST-DECLINE-TAMPERED",

            requestId:
              "FINORA-WAL-REQ-FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const tamperedDeclinePackage = {
      ...declineTamperSource,

      payload: {
        ...declineTamperSource.payload,

        amountMinor:
          999999,
      },
    };

    const tamperedDeclineResult =
      await applyFinoraSignedWalletRechargeDeclinePackage(
        tamperedDeclinePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "cryptographically tampered Wallet Recharge decline rejected",
      tamperedDeclineResult,
    );

    // ========================================================
    // TEST 21 - INVALID SIGNATURE
    // ========================================================

    const declineSignatureSource =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-DECLINE-SELFTEST-BAD-SIGNATURE",

        purpose:
          "WALLET_RECHARGE_DECLINE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          createDeclinePayload({
            paymentReference:
              "FINORA-WALLET-RECHARGE-SELFTEST-DECLINE-BAD-SIGNATURE",

            requestId:
              "FINORA-WAL-REQ-1111111111111111111111111111111111111111111111111111111111111111",
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const declineOriginalSignature =
      declineSignatureSource.signature.value;

    const invalidDeclineSignaturePackage = {
      ...declineSignatureSource,

      signature: {
        ...declineSignatureSource.signature,

        value:
          `${
            declineOriginalSignature.startsWith(
              "A",
            )
              ? "B"
              : "A"
          }${declineOriginalSignature.slice(
            1,
          )}`,
      },
    };

    const invalidDeclineSignatureResult =
      await applyFinoraSignedWalletRechargeDeclinePackage(
        invalidDeclineSignaturePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "invalid Wallet Recharge decline signature rejected",
      invalidDeclineSignatureResult,
    );

    // ========================================================
    // TEST 22 - DUPLICATE DECLINE PAYMENT REFERENCE
    // ========================================================

    const duplicateDeclinePaymentPackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-DECLINE-SELFTEST-DUPLICATE-PAYMENT",

        purpose:
          "WALLET_RECHARGE_DECLINE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          createDeclinePayload({
            paymentReference:
              declinePaymentReference,

            requestId:
              "FINORA-WAL-REQ-2222222222222222222222222222222222222222222222222222222222222222",
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const duplicateDeclinePaymentResult =
      await applyFinoraSignedWalletRechargeDeclinePackage(
        duplicateDeclinePaymentPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "fresh decline package with duplicate paymentReference rejected",
      duplicateDeclinePaymentResult,
    );

    // ========================================================
    // TEST 23 - APPROVED PAYMENT CANNOT BE DECLINED
    // ========================================================

    const authorizedPaymentDeclinePackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-DECLINE-SELFTEST-AUTH-CONFLICT",

        purpose:
          "WALLET_RECHARGE_DECLINE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          createDeclinePayload({
            paymentReference,

            requestId:
              "FINORA-WAL-REQ-3333333333333333333333333333333333333333333333333333333333333333",
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const authorizedPaymentDeclineResult =
      await applyFinoraSignedWalletRechargeDeclinePackage(
        authorizedPaymentDeclinePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "already-authorized Wallet Recharge paymentReference cannot be declined",
      authorizedPaymentDeclineResult,
    );

    // ========================================================
    // TEST 24 - FAILED ATTEMPTS DO NOT BURN NEXT SEQUENCE
    // ========================================================

    const secondValidDeclinePackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-RECHARGE-DECLINE-SELFTEST-SECOND-VALID",

        purpose:
          "WALLET_RECHARGE_DECLINE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          createDeclinePayload({
            paymentReference:
              "FINORA-WALLET-RECHARGE-SELFTEST-DECLINE-SECOND-VALID",

            requestId:
              "FINORA-WAL-REQ-4444444444444444444444444444444444444444444444444444444444444444",
          }),

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const secondValidDeclineResult =
      await applyFinoraSignedWalletRechargeDeclinePackage(
        secondValidDeclinePackage,
        trustedKeys,
        now,
      );

    assert(
      secondValidDeclineResult.success,
      secondValidDeclineResult.error ??
        "Next valid Wallet Recharge decline was rejected after failed attempts.",
    );

    console.log(
      "PASS: next valid Wallet Recharge decline accepted after rejected attempts",
    );

    const finalDeclineStoreResult =
      await readFinoraControlStore();

    assert(
      finalDeclineStoreResult.success &&
        finalDeclineStoreResult.data !==
          undefined &&
        (
          finalDeclineStoreResult.data.walletRechargeDeclines ??
          []
        ).length ===
          2,
      finalDeclineStoreResult.error ??
        "Wallet Recharge decline store did not preserve exactly two accepted declines.",
    );

    console.log(
      "PASS: rejected decline attempts did not mutate durable decline count or burn next sequence",
    );

    console.log(
      "PASS: FINORA SIGNED WALLET RECHARGE DECLINE E2E",
    );
    // COMPLETE
    // ========================================================

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA SIGNED WALLET RECHARGE AUTHORIZATION E2E SELFTEST",
    );

    console.log(
      "============================================================",
    );

  } catch (
    error
  ) {

    failure =
      error;

  } finally {

    try {

      await rm(
        temporaryUserData,
        {
          recursive:
            true,

          force:
            true,
        },
      );

      console.log(
        "PASS: isolated temporary FINORA userData deleted",
      );

    } catch (
      cleanupError
    ) {

      if (!failure) {
        failure =
          cleanupError;
      }
    }
  }

  if (failure) {
    throw failure;
  }
}

// ============================================================
// ENTRY
// ============================================================

void runSelfTest()
  .then(
    () => {
      app.exit(
        0,
      );
    },
    (error) => {

      console.error(
        "FAIL: FINORA SIGNED WALLET RECHARGE AUTHORIZATION E2E SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );

// ============================================================
// END
// ============================================================
