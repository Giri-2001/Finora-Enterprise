// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL PLANE
// SIGNED CONTROL BUNDLE PACKAGE APPLY SELF TEST
//
// ISOLATION:
//
// - Uses a temporary Electron userData directory.
// - Uses a temporary encrypted FINORA Control Store.
// - Uses a temporary native installation-binding vault.
// - Uses an ephemeral P-256 signing key.
// - Does NOT access normal FINORA userData.
// - Deletes temporary state before exit.
//
// COVERAGE:
//
// - Invalid outer signature -> zero child mutation
// - Invalid child signature -> zero child mutation
// - Duplicate child packageId -> zero child mutation
// - Duplicate child purpose -> zero child mutation
// - Valid signed bundle -> child apply succeeds
// - Child replay/domain failure does NOT stop later child
// - Bundle summary reports deliberate NON-ATOMIC outcome
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

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import type {
  FinoraControlInstallationIdentity,
} from "./finoraControlStore.js";

import {
  readFinoraControlStore,
  saveFinoraInstallationIdentity,
} from "./finoraControlStore.js";

import {
  applyFinoraSignedBranchActivationPackage,
} from "./finoraBranchActivationPackageApplyService.js";

import {
  applyFinoraSignedControlBundlePackage,
} from "./finoraControlBundlePackageApplyService.js";

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

interface SigningMaterialView {

  signingKeyId:
    string;

  privateKeyPkcs8DerBase64:
    string;
}

// ============================================================
// ASSERT
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

function expectSuccess(
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
    result.success,
    result.error ??
      `${label}: expected success.`,
  );

  console.log(
    `PASS: ${label}`,
  );
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
    `${label}: expected failure.`,
  );

  console.log(
    `PASS: ${label}`,
  );
}

// ============================================================
// SIGN PACKAGE
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
// BRANCH ACTIVATION PAYLOAD
// ============================================================

function createBranchActivationPayload(
  input: {

    scope:
      SelfTestScope;

    target:
      SelfTestPackageTarget;

    issuedAt:
      string;

    validFrom:
      string;

    validUntil:
      string;
  },
): Record<string, unknown> {

  return {

    action:
      "ISSUE",

    activation: {

      activationId:
        "ACTIVATION-CONTROL-BUNDLE-SELFTEST",

      ownerId:
        input.scope.ownerId,

      businessId:
        input.scope.businessId,

      branchId:
        input.scope.branchId,

      status:
        "ACTIVE",

      activatedAt:
        input.validFrom,

      createdAt:
        input.validFrom,

      updatedAt:
        input.issuedAt,

      schemaVersion:
        1,
    },

    installationBinding: {

      installationId:
        input.target.installationId,

      bindingKeyId:
        input.target.bindingKeyId,

      fingerprintAlgorithm:
        input.target.fingerprintAlgorithm,

      publicKeyFingerprint:
        input.target.publicKeyFingerprint,
    },

    issuedAt:
      input.issuedAt,

    schemaVersion:
      1,
  };
}

// ============================================================
// BRANCH ACCESS PAYLOAD
// ============================================================

function createBranchAccessPayload(
  input: {

    scope:
      SelfTestScope;

    issuedAt:
      string;

    validFrom:
      string;

    validUntil:
      string;
  },
): Record<string, unknown> {

  return {

    action:
      "ISSUE",

    accessGrant: {

      grantId:
        "GRANT-CONTROL-BUNDLE-SELFTEST",

      userId:
        "USER-CONTROL-BUNDLE-SELFTEST",

      ownerId:
        input.scope.ownerId,

      businessId:
        input.scope.businessId,

      branchId:
        input.scope.branchId,

      storageMode:
        "LOCAL",

      accessType:
        "REGISTERED",

      administrativeStatus:
        "ACTIVE",

      validity: {

        validFrom:
          input.validFrom,

        validUntil:
          input.validUntil,
      },

      registrationPayment: {

        amount:
          2000,

        currency:
          "INR",

        paymentMode:
          "CASH",

        paidAt:
          input.validFrom,

        reference:
          "CONTROL-BUNDLE-SELFTEST-CASH",

        remarks:
          "FINORA CONTROL_BUNDLE dedicated Branch Access self-test.",

        refundable:
          false,
      },

      registrationCycle:
        1,

      createdAt:
        input.validFrom,

      updatedAt:
        input.issuedAt,

      schemaVersion:
        1,
    },

    issuedAt:
      input.issuedAt,

    schemaVersion:
      1,
  };
}

// ============================================================
// PRICING POLICY PAYLOAD
// ============================================================

function createPricingPayload(
  input: {

    scope:
      SelfTestScope;

    target:
      SelfTestPackageTarget;

    issuedAt:
      string;

    validFrom:
      string;

    validUntil:
      string;

    amount:
      number;
  },
): Record<string, unknown> {

  return {

    action:
      "REPLACE",

    overrideSet: {

      overrideSetId:
        "FINORA-CONTROL-BUNDLE-SELFTEST-PRICING",

      scope: {

        ownerId:
          input.scope.ownerId,

        businessId:
          input.scope.businessId,

        branchId:
          input.scope.branchId,
      },

      overrides: [
        {

          overrideId:
            "FINORA-CONTROL-BUNDLE-SELFTEST-RULE",

          chargeCode:
            "LOAN_DISBURSEMENT",

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
        },
      ],

      schemaVersion:
        1,
    },

    installationBinding: {

      installationId:
        input.target.installationId,

      bindingKeyId:
        input.target.bindingKeyId,

      fingerprintAlgorithm:
        input.target.fingerprintAlgorithm,

      publicKeyFingerprint:
        input.target.publicKeyFingerprint,

      schemaVersion:
        1,
    },

    issuedAt:
      input.issuedAt,

    schemaVersion:
      1,
  };
}

// ============================================================
// BUNDLE
// ============================================================

function createSignedBundle(
  input: {

    packageId:
      string;

    sequence:
      number;

    issuedAt:
      string;

    target:
      SelfTestPackageTarget;

    children:
      readonly Record<string, unknown>[];

    issuerId:
      string;

    signingMaterial:
      SigningMaterialView;
  },
) {

  return createSignedPackage({

    packageId:
      input.packageId,

    purpose:
      "CONTROL_BUNDLE",

    target:
      input.target,

    issuedAt:
      input.issuedAt,

    sequence:
      input.sequence,

    payload: {

      bundleFormat:
        "FINORA_CONTROL_BUNDLE_V1",

      packages: [
        ...input.children,
      ],

      issuedAt:
        input.issuedAt,

      schemaVersion:
        1,
    },

    issuerId:
      input.issuerId,

    signingKeyId:
      input.signingMaterial.signingKeyId,

    privateKeyPkcs8DerBase64:
      input.signingMaterial.privateKeyPkcs8DerBase64,
  });
}

// ============================================================
// STORE PROOF
// ============================================================

async function readAppliedPackageIds():
  Promise<string[]> {

  const storeResult =
    await readFinoraControlStore();

  assert(
    storeResult.success &&
      storeResult.data,
    storeResult.error ??
      "Unable to read isolated FINORA Control Store.",
  );

  return (
    storeResult.data.appliedControlPackages ??
      []
  )
    .map(
      (record) =>
        record.packageId,
    )
    .sort();
}

async function expectBundleFailureWithoutMutation(
  label:
    string,

  signedBundle:
    unknown,

  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[],

  now:
    Date,
): Promise<void> {

  const before =
    await readAppliedPackageIds();

  const result =
    await applyFinoraSignedControlBundlePackage(
      signedBundle,
      trustedKeys,
      now,
    );

  expectFailure(
    label,
    result,
  );

  const after =
    await readAppliedPackageIds();

  assert(
    JSON.stringify(
      before,
    ) ===
      JSON.stringify(
        after,
      ),
    `${label}: rejected bundle mutated applied package ledger.`,
  );

  console.log(
    `PASS: ${label} produced zero child mutation`,
  );
}

// ============================================================
// SIGNATURE TAMPER
// ============================================================

function tamperSignature<
  T extends {
    signature: {
      value:
        string;
    };
  },
>(
  value:
    T,
): T {

  const signatureValue =
    value.signature.value;

  const firstCharacter =
    signatureValue.charAt(
      0,
    );

  const replacement =
    firstCharacter ===
      "A"
      ? "B"
      : "A";

  return {
    ...value,

    signature: {
      ...value.signature,

      value:
        replacement +
        signatureValue.slice(
          1,
        ),
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
        "finora-control-bundle-selftest-",
      ),
    );

  let failure:
    unknown;

  try {

    // --------------------------------------------------------
    // ISOLATE ELECTRON STATE
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
    // NATIVE INSTALLATION BINDING
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
    // TIME / SCOPE
    // --------------------------------------------------------

    const now =
      new Date();

    const issuedAt =
      new Date(
        now.getTime() -
          2 *
            60 *
            1000,
      ).toISOString();

    const validFrom =
      new Date(
        now.getTime() -
          24 *
            60 *
            60 *
            1000,
      ).toISOString();

    const validUntil =
      new Date(
        Date.parse(
          validFrom,
        ) +
          365 *
            24 *
            60 *
            60 *
            1000,
      ).toISOString();

    const pricingValidFrom =
      new Date(
        now.getTime() -
          60 *
            60 *
            1000,
      ).toISOString();

    const pricingValidUntil =
      new Date(
        now.getTime() +
          60 *
            60 *
            1000,
      ).toISOString();

    const scope:
      SelfTestScope = {

        ownerId:
          "OWNER-CONTROL-BUNDLE-SELFTEST",

        businessId:
          "BUSINESS-CONTROL-BUNDLE-SELFTEST",

        branchId:
          "BRANCH-CONTROL-BUNDLE-SELFTEST",
      };

    // --------------------------------------------------------
    // CONTROL STORE INSTALLATION
    // --------------------------------------------------------

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
          "CBT01",

        branchCode:
          "B01",

        createdAt:
          validFrom,

        updatedAt:
          validFrom,

        schemaVersion:
          1,
      };

    const installationResult =
      await saveFinoraInstallationIdentity(
        installation,
      );

    expectSuccess(
      "isolated Control Store installation identity persisted",
      installationResult,
    );

    // --------------------------------------------------------
    // EPHEMERAL CONTROL CENTER SIGNER
    // --------------------------------------------------------

    const signingMaterial =
      generateFinoraControlCenterSigningMaterial();

    const issuerId =
      "FINORA-CONTROL-BUNDLE-SELFTEST-CONTROL-CENTER";

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
                24 *
                  60 *
                  60 *
                  1000,
            ).toISOString(),
        },
      ];

    console.log(
      "PASS: ephemeral Control Center signing identity created",
    );

    // --------------------------------------------------------
    // COMMON TARGET
    // --------------------------------------------------------

    const target:
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

    // --------------------------------------------------------
    // VALID CHILD FIXTURES
    // --------------------------------------------------------

    const branchPayload =
      createBranchActivationPayload({

        scope,

        target,

        issuedAt,

        validFrom,

        validUntil,
      });

    const branchPackage =
      createSignedPackage({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-BRANCH-1",

        purpose:
          "BRANCH_ACTIVATION",

        target,

        issuedAt,

        sequence:
          1,

        payload:
          branchPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const accessPayload =
      createBranchAccessPayload({

        scope,

        issuedAt,

        validFrom,

        validUntil,
      });

    const accessPackage =
      createSignedPackage({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-ACCESS-1",

        purpose:
          "BRANCH_ACCESS",

        target,

        issuedAt,

        sequence:
          1,

        payload:
          accessPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });
    const pricingPayload =
      createPricingPayload({

        scope,

        target,

        issuedAt,

        validFrom:
          pricingValidFrom,

        validUntil:
          pricingValidUntil,

        amount:
          7,
      });

    const pricingPackage =
      createSignedPackage({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-PRICING-1",

        purpose:
          "PRICING_POLICY",

        target,

        issuedAt,

        sequence:
          1,

        payload:
          pricingPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    // ========================================================
    // TEST 1 — INVALID OUTER SIGNATURE => ZERO MUTATION
    // ========================================================

    const validOuterSource =
      createSignedBundle({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-OUTER-BAD-SIGNATURE",

        sequence:
          1,

        issuedAt,

        target,

        children: [
          branchPackage,
        ],

        issuerId,

        signingMaterial,
      });

    const invalidOuterSignatureBundle =
      tamperSignature(
        validOuterSource,
      );

    await expectBundleFailureWithoutMutation(
      "invalid outer CONTROL_BUNDLE signature rejected",
      invalidOuterSignatureBundle,
      trustedKeys,
      now,
    );

    // ========================================================
    // TEST 2 — INVALID CHILD SIGNATURE => ZERO MUTATION
    // ========================================================

    const invalidChild =
      tamperSignature(
        branchPackage,
      );

    const invalidChildBundle =
      createSignedBundle({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-BAD-CHILD",

        sequence:
          2,

        issuedAt,

        target,

        children: [
          invalidChild,
        ],

        issuerId,

        signingMaterial,
      });

    await expectBundleFailureWithoutMutation(
      "tampered signed child rejected during bundle preflight",
      invalidChildBundle,
      trustedKeys,
      now,
    );

    // ========================================================
    // TEST 3 — DUPLICATE PACKAGE ID => ZERO MUTATION
    // ========================================================

    const pricingDuplicatePackageId =
      createSignedPackage({

        packageId:
          branchPackage.packageId,

        purpose:
          "PRICING_POLICY",

        target,

        issuedAt,

        sequence:
          1,

        payload:
          pricingPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const duplicatePackageIdBundle =
      createSignedBundle({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-DUPLICATE-ID",

        sequence:
          3,

        issuedAt,

        target,

        children: [
          branchPackage,
          pricingDuplicatePackageId,
        ],

        issuerId,

        signingMaterial,
      });

    await expectBundleFailureWithoutMutation(
      "duplicate child package ID rejected",
      duplicatePackageIdBundle,
      trustedKeys,
      now,
    );

    // ========================================================
    // TEST 4 — DUPLICATE PURPOSE => ZERO MUTATION
    // ========================================================

    const secondBranchPackage =
      createSignedPackage({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-BRANCH-2",

        purpose:
          "BRANCH_ACTIVATION",

        target,

        issuedAt,

        sequence:
          2,

        payload:
          branchPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const duplicatePurposeBundle =
      createSignedBundle({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-DUPLICATE-PURPOSE",

        sequence:
          4,

        issuedAt,

        target,

        children: [
          branchPackage,
          secondBranchPackage,
        ],

        issuerId,

        signingMaterial,
      });

    await expectBundleFailureWithoutMutation(
      "duplicate child purpose rejected",
      duplicatePurposeBundle,
      trustedKeys,
      now,
    );

    // ========================================================
    // TEST 5 — VALID ONE-CHILD BUNDLE
    // ========================================================

    const validPricingBundle =
      createSignedBundle({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-VALID",

        sequence:
          5,

        issuedAt,

        target,

        children: [
          pricingPackage,
          accessPackage,
        ],

        issuerId,

        signingMaterial,
      });

    const validBundleResult =
      await applyFinoraSignedControlBundlePackage(
        validPricingBundle,
        trustedKeys,
        now,
      );

    if (!validBundleResult.success) {
      throw new Error(
        validBundleResult.error ??
          "Valid CONTROL_BUNDLE was rejected.",
      );
    }

    assert(
      validBundleResult.data.childResults.length ===
        2 &&
      validBundleResult.data.succeededCount ===
        2 &&
      validBundleResult.data.failedCount ===
        0 &&
      validBundleResult.data.allChildrenApplied,
      "Valid CONTROL_BUNDLE summary is invalid.",
    );

    assert(
      validBundleResult.data.childResults.some(
        (result) =>
          result.packageId ===
            accessPackage.packageId &&
          result.purpose ===
            "BRANCH_ACCESS" &&
          result.success,
      ),
      "Valid CONTROL_BUNDLE did not report successful dedicated BRANCH_ACCESS child apply.",
    );

    console.log(
      "PASS: valid CONTROL_BUNDLE dispatched dedicated BRANCH_ACCESS child",
    );

    const afterValidBundle =
      await readAppliedPackageIds();

    assert(
      afterValidBundle.includes(
        pricingPackage.packageId,
      ),
      "Valid Pricing Policy child was not persisted.",
    );

    assert(
      afterValidBundle.includes(
        accessPackage.packageId,
      ),
      "Valid Branch Access child was not persisted.",
    );

    console.log(
      "PASS: dedicated BRANCH_ACCESS child persisted through CONTROL_BUNDLE",
    );

    console.log(
      "PASS: valid signed CONTROL_BUNDLE applied child packages",
    );

    // ========================================================
    // TEST 6 — PREPARE BRANCH REPLAY
    // ========================================================

    const directBranchResult =
      await applyFinoraSignedBranchActivationPackage(
        branchPackage,
        trustedKeys,
        now,
      );

    expectSuccess(
      "baseline Branch Activation applied before replay continuation test",
      directBranchResult,
    );

    // ========================================================
    // TEST 7 — NON-ATOMIC CONTINUATION
    //
    // First child:
    //   cryptographically valid but replayed -> child failure.
    //
    // Second child:
    //   fresh PRICING_POLICY sequence -> must still be attempted.
    // ========================================================

    const secondPricingPackage =
      createSignedPackage({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-PRICING-2",

        purpose:
          "PRICING_POLICY",

        target,

        issuedAt,

        sequence:
          2,

        payload:
          pricingPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const nonAtomicBundle =
      createSignedBundle({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-NON-ATOMIC",

        sequence:
          6,

        issuedAt,

        target,

        children: [
          branchPackage,
          secondPricingPackage,
        ],

        issuerId,

        signingMaterial,
      });

    const nonAtomicResult =
      await applyFinoraSignedControlBundlePackage(
        nonAtomicBundle,
        trustedKeys,
        now,
      );

    if (!nonAtomicResult.success) {
      throw new Error(
        nonAtomicResult.error ??
          "Non-atomic continuation bundle failed at outer level.",
      );
    }

    assert(
      nonAtomicResult.data.childResults.length ===
        2,
      "Non-atomic bundle did not return two child outcomes.",
    );

    assert(
      nonAtomicResult.data.childResults[0].packageId ===
        branchPackage.packageId &&
      nonAtomicResult.data.childResults[0].purpose ===
        "BRANCH_ACTIVATION" &&
      !nonAtomicResult.data.childResults[0].success,
      "First replayed child did not report failure in signed order.",
    );

    assert(
      nonAtomicResult.data.childResults[1].packageId ===
        secondPricingPackage.packageId &&
      nonAtomicResult.data.childResults[1].purpose ===
        "PRICING_POLICY" &&
      nonAtomicResult.data.childResults[1].success,
      "Second fresh child was not attempted successfully after first-child failure.",
    );

    assert(
      nonAtomicResult.data.succeededCount ===
        1 &&
      nonAtomicResult.data.failedCount ===
        1 &&
      !nonAtomicResult.data.allChildrenApplied,
      "Non-atomic bundle summary counts are invalid.",
    );

    const finalAppliedPackageIds =
      await readAppliedPackageIds();

    assert(
      finalAppliedPackageIds.includes(
        secondPricingPackage.packageId,
      ),
      "Fresh second child was not persisted after replayed first-child failure.",
    );

    console.log(
      "PASS: child replay failure did not prevent later child apply",
    );

    console.log(
      "PASS: CONTROL_BUNDLE deliberate NON-ATOMIC per-child result semantics verified",
    );

    // ========================================================
    // TEST 8 — SIX-PURPOSE CONTROL_BUNDLE CARDINALITY
    //
    // All six child envelopes are independently signed and
    // target-bound.
    //
    // Branch Activation / Branch Access / Pricing children have
    // already participated in earlier tests and may therefore
    // fail their child-level replay checks here.
    //
    // Synthetic Storage / Business Profile / Wallet payloads
    // intentionally reach their purpose-specific validators and
    // may fail there.
    //
    // The proof required here is outer CONTROL_BUNDLE acceptance
    // plus ordered dispatch of exactly six supported purposes.
    // ========================================================

    const storageCardinalityPackage =
      createSignedPackage({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-SIX-STORAGE",

        purpose:
          "STORAGE_ENTITLEMENT",

        target,

        issuedAt,

        sequence:
          1,

        payload:
          {},

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const businessProfileCardinalityPackage =
      createSignedPackage({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-SIX-BUSINESS",

        purpose:
          "BUSINESS_PROFILE",

        target,

        issuedAt,

        sequence:
          1,

        payload:
          {},

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const walletRechargeCardinalityPackage =
      createSignedPackage({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-SIX-WALLET",

        purpose:
          "WALLET_RECHARGE",

        target,

        issuedAt,

        sequence:
          1,

        payload:
          {},

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const sixPurposeBundle =
      createSignedBundle({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-SIX-PURPOSES",

        sequence:
          7,

        issuedAt,

        target,

        children: [
          branchPackage,
          accessPackage,
          storageCardinalityPackage,
          businessProfileCardinalityPackage,
          pricingPackage,
          walletRechargeCardinalityPackage,
        ],

        issuerId,

        signingMaterial,
      });

    const sixPurposeResult =
      await applyFinoraSignedControlBundlePackage(
        sixPurposeBundle,
        trustedKeys,
        now,
      );

    if (!sixPurposeResult.success) {
      throw new Error(
        sixPurposeResult.error ??
          "Six-purpose CONTROL_BUNDLE was rejected before child dispatch.",
      );
    }

    assert(
      sixPurposeResult.data.childResults.length ===
        6,
      "Six-purpose CONTROL_BUNDLE did not dispatch exactly six child packages.",
    );

    const sixPurposeResultPurposes =
      sixPurposeResult.data.childResults.map(
        (result) =>
          result.purpose,
      );

    assert(
      sixPurposeResultPurposes.join("|") ===
        [
          "BRANCH_ACTIVATION",
          "BRANCH_ACCESS",
          "STORAGE_ENTITLEMENT",
          "BUSINESS_PROFILE",
          "PRICING_POLICY",
          "WALLET_RECHARGE",
        ].join("|"),
      "Six-purpose CONTROL_BUNDLE did not preserve complete signed child-purpose order.",
    );

    assert(
      sixPurposeResult.data.succeededCount +
        sixPurposeResult.data.failedCount ===
        6,
      "Six-purpose CONTROL_BUNDLE summary does not account for all six children.",
    );

    console.log(
      "PASS: six supported CONTROL_BUNDLE child purposes passed outer preflight",
    );

    console.log(
      "PASS: six-purpose CONTROL_BUNDLE dispatched exactly six signed children",
    );

    console.log(
      "PASS: CONTROL_BUNDLE six-child cardinality aligned across recipient contract",
    );

    // ========================================================
    // COMPLETE
    // ========================================================

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA SIGNED CONTROL_BUNDLE APPLY E2E SELFTEST",
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
        "FAIL: FINORA SIGNED CONTROL_BUNDLE APPLY E2E SELFTEST",
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