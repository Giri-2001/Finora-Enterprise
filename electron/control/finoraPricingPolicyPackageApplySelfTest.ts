// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL PLANE
// SIGNED PRICING POLICY PACKAGE APPLY SELF TEST
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
// - Valid cryptographically signed PRICING_POLICY apply
// - Trusted Pricing Policy persistence/readback
// - Replay rejection
// - Stale/equal sequence rejection
// - Wrong package purpose rejection
// - Wrong signed target rejection
// - Wrong payload installation binding rejection
// - Payload/package issuedAt mismatch rejection
// - Base-disabled charge rejection
// - Signed payload tamper rejection
// - Empty authoritative REPLACE schedule
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
  findFinoraPricingPolicy,
  saveFinoraInstallationIdentity,
} from "./finoraControlStore.js";

import {
  applyFinoraSignedPricingPolicyPackage,
} from "./finoraPricingPolicyPackageApplyService.js";


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

interface SelfTestPackageTarget {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;
}

interface SelfTestRuleInput {

  overrideId:
    string;

  chargeCode:
    string;

  amount:
    number;

  validFrom:
    string;

  validUntil:
    string;
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

function createRule(
  input:
    SelfTestRuleInput,
): Record<string, unknown> {

  return {
    overrideId:
      input.overrideId,

    chargeCode:
      input.chargeCode,

    model:
      "FIXED_PRICE_OVERRIDE",

    amount:
      input.amount,

    currency:
      "INR",

    validity: {
      validFrom:
        input.validFrom,

      validUntil:
        input.validUntil,
    },

    schemaVersion:
      1,
  };
}

function createPricingPayload(
  scope:
    SelfTestScope,

  binding:
    SelfTestBindingTarget,

  issuedAt:
    string,

  overrideSetId:
    string,

  overrides:
    readonly Record<string, unknown>[],
): Record<string, unknown> {

  return {
    action:
      "REPLACE",

    overrideSet: {
      overrideSetId,

      scope: {
        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,
      },

      overrides: [
        ...overrides,
      ],

      schemaVersion:
        1,
    },

    installationBinding: {
      ...binding,
    },

    issuedAt,

    schemaVersion:
      1,
  };
}


// ============================================================
// EPHEMERAL SIGNER
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
        "finora-pricing-policy-selftest-",
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
          "OWNER-PRICING-SELFTEST",

        businessId:
          "BUSINESS-PRICING-SELFTEST",

        branchId:
          "BRANCH-PRICING-SELFTEST",
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
          "TST01",

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
      "FINORA-PRICING-SELFTEST-CONTROL-CENTER";

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
    // COMMON SIGNED TARGET / POLICY WINDOW
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

    const validFrom =
      new Date(
        now.getTime() -
          60 * 60 * 1000,
      ).toISOString();

    const validUntil =
      new Date(
        now.getTime() +
          60 * 60 * 1000,
      ).toISOString();

    const overrideSetId =
      "FINORA-PRICING-SELFTEST-SET-1";


    // ========================================================
    // TEST 1 - VALID SIGNED REPLACE
    // ========================================================

    const validPayload =
      createPricingPayload(
        scope,
        bindingTarget,
        issuedAt,
        overrideSetId,
        [
          createRule({
            overrideId:
              "FINORA-PRICING-SELFTEST-RULE-1",

            chargeCode:
              "LOAN_DISBURSEMENT",

            amount:
              7,

            validFrom,

            validUntil,
          }),
        ],
      );

    const validPackage =
      createSignedPackage({
        packageId:
          "FINORA-PRICING-SELFTEST-PACKAGE-1",

        purpose:
          "PRICING_POLICY",

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
      await applyFinoraSignedPricingPolicyPackage(
        validPackage,
        trustedKeys,
        now,
      );

    assert(
      validApplyResult.success,
      validApplyResult.error ??
        "Valid signed Pricing Policy was rejected.",
    );

    console.log(
      "PASS: valid signed PRICING_POLICY applied",
    );


    // ========================================================
    // TEST 2 - TRUSTED READBACK
    // ========================================================

    const initialPolicyResult =
      await findFinoraPricingPolicy(
        scope.ownerId,
        scope.businessId,
        scope.branchId,
      );

    assert(
      initialPolicyResult.success,
      initialPolicyResult.error ??
        "Unable to read trusted Pricing Policy.",
    );

    const initialPolicy =
      initialPolicyResult.data;

    assert(
      initialPolicy !==
        undefined,
      "Trusted Pricing Policy was not persisted.",
    );

    assert(
      initialPolicy.overrideSetId ===
        overrideSetId,
      "Trusted Pricing Policy overrideSetId mismatch.",
    );

    assert(
      initialPolicy.overrides.length ===
        1,
      "Trusted Pricing Policy rule count mismatch.",
    );

    assert(
      initialPolicy.overrides[0]?.chargeCode ===
        "LOAN_DISBURSEMENT",
      "Trusted Pricing Policy charge code mismatch.",
    );

    assert(
      initialPolicy.overrides[0]?.amount ===
        7,
      "Trusted Pricing Policy amount mismatch.",
    );

    console.log(
      "PASS: trusted Pricing Policy persisted and read back",
    );


    // ========================================================
    // TEST 3 - SAME PACKAGE REPLAY
    // ========================================================

    const replayResult =
      await applyFinoraSignedPricingPolicyPackage(
        validPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "same signed package replay rejected",
      replayResult,
    );


    // ========================================================
    // TEST 4 - STALE / EQUAL SEQUENCE
    // ========================================================

    const stalePackage =
      createSignedPackage({
        packageId:
          "FINORA-PRICING-SELFTEST-PACKAGE-STALE",

        purpose:
          "PRICING_POLICY",

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

    const staleResult =
      await applyFinoraSignedPricingPolicyPackage(
        stalePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "stale/equal sequence rejected",
      staleResult,
    );


    // ========================================================
    // TEST 5 - WRONG PURPOSE
    // ========================================================

    const wrongPurposePackage =
      createSignedPackage({
        packageId:
          "FINORA-PRICING-SELFTEST-WRONG-PURPOSE",

        purpose:
          "WALLET_RECHARGE",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          validPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const wrongPurposeResult =
      await applyFinoraSignedPricingPolicyPackage(
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
          "FINORA-PRICING-SELFTEST-WRONG-TARGET",

        purpose:
          "PRICING_POLICY",

        target: {
          ...packageTarget,

          ownerId:
            "OWNER-WRONG-TARGET",
        },

        issuedAt,

        sequence:
          2,

        payload:
          validPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const wrongTargetResult =
      await applyFinoraSignedPricingPolicyPackage(
        wrongTargetPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "wrong cryptographic package target rejected",
      wrongTargetResult,
    );


    // ========================================================
    // TEST 7 - WRONG PAYLOAD INSTALLATION BINDING
    // ========================================================

    const fakeFingerprint =
      "a".repeat(
        64,
      );

    const fakeBinding:
      SelfTestBindingTarget = {

        installationId:
          nativeBinding.installationId,

        bindingKeyId:
          `FINORA-BINDING-${fakeFingerprint
            .slice(
              0,
              32,
            )
            .toUpperCase()}`,

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          fakeFingerprint,

        schemaVersion:
          1,
      };

    const wrongBindingPayload =
      createPricingPayload(
        scope,
        fakeBinding,
        issuedAt,
        overrideSetId,
        [
          createRule({
            overrideId:
              "FINORA-PRICING-SELFTEST-WRONG-BINDING",

            chargeCode:
              "LOAN_DISBURSEMENT",

            amount:
              7,

            validFrom,

            validUntil,
          }),
        ],
      );

    const wrongBindingPackage =
      createSignedPackage({
        packageId:
          "FINORA-PRICING-SELFTEST-WRONG-BINDING",

        purpose:
          "PRICING_POLICY",

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
      await applyFinoraSignedPricingPolicyPackage(
        wrongBindingPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "wrong payload installation binding rejected",
      wrongBindingResult,
    );


    // ========================================================
    // TEST 8 - PAYLOAD / PACKAGE ISSUED-AT MISMATCH
    // ========================================================

    const mismatchedPackageIssuedAt =
      new Date(
        now.getTime() -
          1000,
      ).toISOString();

    const mismatchedIssuedAtPackage =
      createSignedPackage({
        packageId:
          "FINORA-PRICING-SELFTEST-ISSUEDAT-MISMATCH",

        purpose:
          "PRICING_POLICY",

        target:
          packageTarget,

        issuedAt:
          mismatchedPackageIssuedAt,

        sequence:
          2,

        payload:
          validPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const mismatchedIssuedAtResult =
      await applyFinoraSignedPricingPolicyPackage(
        mismatchedIssuedAtPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "payload/package issuedAt mismatch rejected",
      mismatchedIssuedAtResult,
    );


    // ========================================================
    // TEST 9 - BASE-DISABLED CHARGE
    // ========================================================

    const disabledChargePayload =
      createPricingPayload(
        scope,
        bindingTarget,
        issuedAt,
        overrideSetId,
        [
          createRule({
            overrideId:
              "FINORA-PRICING-SELFTEST-DISABLED-CHARGE",

            chargeCode:
              "CUSTOMER_NUMBER_GENERATION",

            amount:
              4,

            validFrom,

            validUntil,
          }),
        ],
      );

    const disabledChargePackage =
      createSignedPackage({
        packageId:
          "FINORA-PRICING-SELFTEST-DISABLED-CHARGE",

        purpose:
          "PRICING_POLICY",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          disabledChargePayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const disabledChargeResult =
      await applyFinoraSignedPricingPolicyPackage(
        disabledChargePackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "base-disabled Pricing charge rejected",
      disabledChargeResult,
    );


    // ========================================================
    // TEST 10 - TAMPERED SIGNED PAYLOAD
    // ========================================================

    const tamperSourcePayload =
      createPricingPayload(
        scope,
        bindingTarget,
        issuedAt,
        overrideSetId,
        [
          createRule({
            overrideId:
              "FINORA-PRICING-SELFTEST-TAMPER-SOURCE",

            chargeCode:
              "LOAN_DISBURSEMENT",

            amount:
              8,

            validFrom,

            validUntil,
          }),
        ],
      );

    const tamperSourcePackage =
      createSignedPackage({
        packageId:
          "FINORA-PRICING-SELFTEST-TAMPERED",

        purpose:
          "PRICING_POLICY",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          tamperSourcePayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const tamperedPayload =
      createPricingPayload(
        scope,
        bindingTarget,
        issuedAt,
        overrideSetId,
        [
          createRule({
            overrideId:
              "FINORA-PRICING-SELFTEST-TAMPER-SOURCE",

            chargeCode:
              "LOAN_DISBURSEMENT",

            amount:
              99,

            validFrom,

            validUntil,
          }),
        ],
      );

    const tamperedPackage = {
      ...tamperSourcePackage,

      payload:
        tamperedPayload,
    };

    const tamperedResult =
      await applyFinoraSignedPricingPolicyPackage(
        tamperedPackage,
        trustedKeys,
        now,
      );

    expectFailure(
      "tampered signed Pricing payload rejected",
      tamperedResult,
    );


    // ========================================================
    // TEST 11 - FAILED PACKAGES DID NOT MUTATE TRUSTED STATE
    // ========================================================

    const unchangedPolicyResult =
      await findFinoraPricingPolicy(
        scope.ownerId,
        scope.businessId,
        scope.branchId,
      );

    assert(
      unchangedPolicyResult.success,
      unchangedPolicyResult.error ??
        "Unable to verify unchanged Pricing Policy state.",
    );

    const unchangedPolicy =
      unchangedPolicyResult.data;

    assert(
      unchangedPolicy !==
        undefined &&
      unchangedPolicy.overrides.length ===
        1 &&
      unchangedPolicy.overrides[0]?.amount ===
        7,
      "Rejected Pricing packages mutated trusted state.",
    );

    console.log(
      "PASS: rejected packages produced no Pricing Policy mutation",
    );


    // ========================================================
    // TEST 12 - EMPTY AUTHORITATIVE REPLACE
    // ========================================================

    const emptyPayload =
      createPricingPayload(
        scope,
        bindingTarget,
        issuedAt,
        overrideSetId,
        [],
      );

    const emptyReplacePackage =
      createSignedPackage({
        packageId:
          "FINORA-PRICING-SELFTEST-EMPTY-REPLACE",

        purpose:
          "PRICING_POLICY",

        target:
          packageTarget,

        issuedAt,

        sequence:
          2,

        payload:
          emptyPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const emptyReplaceResult =
      await applyFinoraSignedPricingPolicyPackage(
        emptyReplacePackage,
        trustedKeys,
        now,
      );

    assert(
      emptyReplaceResult.success,
      emptyReplaceResult.error ??
        "Empty authoritative Pricing Policy REPLACE was rejected.",
    );

    const clearedPolicyResult =
      await findFinoraPricingPolicy(
        scope.ownerId,
        scope.businessId,
        scope.branchId,
      );

    assert(
      clearedPolicyResult.success,
      clearedPolicyResult.error ??
        "Unable to read cleared Pricing Policy.",
    );

    const clearedPolicy =
      clearedPolicyResult.data;

    assert(
      clearedPolicy !==
        undefined,
      "Cleared Pricing Policy state is missing.",
    );

    assert(
      clearedPolicy.overrideSetId ===
        overrideSetId,
      "Empty REPLACE changed Pricing Policy lineage.",
    );

    assert(
      clearedPolicy.overrides.length ===
        0,
      "Empty REPLACE did not clear Pricing Override schedule.",
    );

    console.log(
      "PASS: empty signed REPLACE restored Base Pricing schedule",
    );


    // ========================================================
    // COMPLETE
    // ========================================================

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA SIGNED PRICING POLICY E2E SELFTEST",
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
        "FAIL: FINORA SIGNED PRICING POLICY E2E SELFTEST",
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