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

const BOOTSTRAP_IMPORT_AUTHORITY_CONTEXT = {
  lane:
    "BOOTSTRAP_NATIVE",
} as const;

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
      BOOTSTRAP_IMPORT_AUTHORITY_CONTEXT,
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
// AUTHORITY-CONTEXT FAILURE PROOF
// ============================================================

async function expectBundleFailureForAuthorityWithoutMutation(
  label:
    string,

  signedBundle:
    unknown,

  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[],

  now:
    Date,

  authorityContext:
    Parameters<
      typeof applyFinoraSignedControlBundlePackage
    >[3],

  expectedErrorFragment:
    string,
): Promise<void> {

  const beforeStore =
    await readFinoraControlStore();

  assert(
    beforeStore.success &&
      beforeStore.data,
    beforeStore.error ??
      `${label}: unable to read pre-failure Control Store.`,
  );

  const before =
    JSON.stringify(
      beforeStore.data,
    );

  const result =
    await applyFinoraSignedControlBundlePackage(
      signedBundle,
      trustedKeys,
      now,
      authorityContext,
    );

  assert(
    !result.success,
    `${label}: expected failure.`,
  );

  assert(
    (
      result.error ??
        ""
    ).includes(
      expectedErrorFragment,
    ),
    `${label}: expected error containing "${expectedErrorFragment}", received "${result.error ?? ""}".`,
  );

  const afterStore =
    await readFinoraControlStore();

  assert(
    afterStore.success &&
      afterStore.data,
    afterStore.error ??
      `${label}: unable to read post-failure Control Store.`,
  );

  const after =
    JSON.stringify(
      afterStore.data,
    );

  assert(
    before ===
      after,
    `${label}: rejected bundle mutated authoritative Control Store.`,
  );

  console.log(
    `PASS: ${label} -> ${expectedErrorFragment}`,
  );

  console.log(
    `PASS: ${label} produced zero full-store child mutation`,
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
        BOOTSTRAP_IMPORT_AUTHORITY_CONTEXT,
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
        BOOTSTRAP_IMPORT_AUTHORITY_CONTEXT,
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
    // TEST 8 — SEVEN-PURPOSE CONTROL_BUNDLE CARDINALITY
    //
    // all seven child envelopes are independently signed and
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
    // plus ordered dispatch of exactly seven supported purposes.
    // ========================================================

    const storageCardinalityPackage =
      createSignedPackage({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-SEVEN-STORAGE",

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
          "FINORA-CONTROL-BUNDLE-SELFTEST-SEVEN-BUSINESS",

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
          "FINORA-CONTROL-BUNDLE-SELFTEST-SEVEN-WALLET",

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

    const walletRechargeDeclineCardinalityPackage =
      createSignedPackage({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-SEVEN-WALLET-DECLINE",

        purpose:
          "WALLET_RECHARGE_DECLINE",

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
    const sevenPurposeBundle =
      createSignedBundle({

        packageId:
          "FINORA-CONTROL-BUNDLE-SELFTEST-SEVEN-PURPOSES",

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
          walletRechargeDeclineCardinalityPackage,
        ],

        issuerId,

        signingMaterial,
      });

    const sevenPurposeResult =
      await applyFinoraSignedControlBundlePackage(
        sevenPurposeBundle,
        trustedKeys,
        now,
        BOOTSTRAP_IMPORT_AUTHORITY_CONTEXT,
      );

    if (!sevenPurposeResult.success) {
      throw new Error(
        sevenPurposeResult.error ??
          "seven-purpose CONTROL_BUNDLE was rejected before child dispatch.",
      );
    }

    assert(
      sevenPurposeResult.data.childResults.length ===
        7,
      "seven-purpose CONTROL_BUNDLE did not dispatch exactly seven child packages.",
    );

    const sevenPurposeResultPurposes =
      sevenPurposeResult.data.childResults.map(
        (result) =>
          result.purpose,
      );

    assert(
      sevenPurposeResultPurposes.join("|") ===
        [
          "BRANCH_ACTIVATION",
          "BRANCH_ACCESS",
          "STORAGE_ENTITLEMENT",
          "BUSINESS_PROFILE",
          "PRICING_POLICY",
          "WALLET_RECHARGE",
          "WALLET_RECHARGE_DECLINE",
        ].join("|"),
      "seven-purpose CONTROL_BUNDLE did not preserve complete signed child-purpose order.",
    );

    assert(
      sevenPurposeResult.data.succeededCount +
        sevenPurposeResult.data.failedCount ===
        7,
      "seven-purpose CONTROL_BUNDLE summary does not account for all seven children.",
    );

    console.log(
      "PASS: seven supported CONTROL_BUNDLE child purposes passed outer preflight",
    );

    console.log(
      "PASS: seven-purpose CONTROL_BUNDLE dispatched exactly seven signed children",
    );

    console.log(
      "PASS: CONTROL_BUNDLE seven-child cardinality aligned across recipient contract",
    );

    // ========================================================
    // G4-3C — AUTHENTICATED PORTABLE OUTER VERIFICATION
    //
    // The outer bundle is signed for a valid historical device
    // target belonging to this permanent branch.
    //
    // Portable authority allows the outer historical target by
    // branch scope. Non-migrated child families remain strict-native;
    // G5A migrates BRANCH_ACCESS lifecycle children only.
    // ========================================================

    const historicalFingerprint =
      "12".repeat(
        32,
      );

    const historicalTarget:
      SelfTestPackageTarget = {

        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,

        installationId:
          "INSTALLATION-CONTROL-BUNDLE-HISTORICAL-SELFTEST",

        bindingKeyId:
          `FINORA-BINDING-${historicalFingerprint
            .slice(
              0,
              32,
            )
            .toUpperCase()}`,

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          historicalFingerprint,
      };

    const historicalPricingPayload =
      createPricingPayload({

        scope,

        target:
          historicalTarget,

        issuedAt,

        validFrom:
          pricingValidFrom,

        validUntil:
          pricingValidUntil,

        amount:
          13,
      });

    const historicalPricingPackage =
      createSignedPackage({

        packageId:
          "FINORA-CONTROL-BUNDLE-G4-HISTORICAL-PRICING",

        purpose:
          "PRICING_POLICY",

        target:
          historicalTarget,

        issuedAt,

        sequence:
          50,

        payload:
          historicalPricingPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const historicalBundle =
      createSignedBundle({

        packageId:
          "FINORA-CONTROL-BUNDLE-G4-HISTORICAL-OUTER",

        sequence:
          50,

        issuedAt,

        target:
          historicalTarget,

        children: [
          historicalPricingPackage,
        ],

        issuerId,

        signingMaterial,
      });

    const portableAuthorityContext = {
      lane:
        "AUTHENTICATED_PORTABLE",

      principal: {
        authGeneration:
          1,

        userId:
          "USER-CONTROL-BUNDLE-PORTABLE-SELFTEST",

        username:
          "owner.portable.selftest",

        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,

        storageMode:
          "LOCAL",

        dataContext:
          "REAL",
      },

      portableAuthFingerprint:
        "PORTABLE-AUTH-FINGERPRINT-CONTROL-BUNDLE-SELFTEST",
    } as const;

    // ========================================================
    // G5A-7E2 — PORTABLE HISTORICAL BRANCH_ACCESS CHILD
    // ========================================================

    const portableBundleSourcePayload =
      accessPackage.payload as {
        accessGrant?:
          Record<string, unknown>;
      };

    assert(
      portableBundleSourcePayload.accessGrant !==
        undefined,
      "Existing BRANCH_ACCESS bundle fixture does not expose an Access Grant.",
    );

    const portableBundleAccessGrant = {
      ...portableBundleSourcePayload.accessGrant,

      grantId:
        "GRANT-CONTROL-BUNDLE-PORTABLE-HISTORICAL-000001",

      userId:
        "USER-CONTROL-BUNDLE-PORTABLE-HISTORICAL-000001",
    };

    const portableBundleBaseline =
      await readFinoraControlStore();

    assert(
      portableBundleBaseline.success &&
        portableBundleBaseline.data,
      portableBundleBaseline.error ??
        "Unable to read pre-portable Control Bundle state.",
    );

    const portableBundleLegacyHighWater =
      (
        portableBundleBaseline.data.controlSequences ??
        []
      )
        .filter(
          (item) =>
            item.issuerId ===
              issuerId &&
            item.purpose ===
              "BRANCH_ACCESS" &&
            item.ownerId ===
              scope.ownerId &&
            item.businessId ===
              scope.businessId &&
            item.branchId ===
              scope.branchId,
        )
        .reduce(
          (
            current,
            item,
          ) =>
            Math.max(
              current,
              item.lastSequence,
            ),
          0,
        );

    const portableBundleExistingHighWater =
      (
        portableBundleBaseline.data.portableBranchAccessSequences ??
        []
      )
        .filter(
          (item) =>
            item.issuerId ===
              issuerId &&
            item.ownerId ===
              scope.ownerId &&
            item.businessId ===
              scope.businessId &&
            item.branchId ===
              scope.branchId,
        )
        .reduce(
          (
            current,
            item,
          ) =>
            Math.max(
              current,
              item.lastSequence,
            ),
          0,
        );

    const portableBundleSequence =
      Math.max(
        portableBundleLegacyHighWater,
        portableBundleExistingHighWater,
      ) +
      1;

    const nativeSequencesBeforePortableBundle =
      JSON.stringify(
        portableBundleBaseline.data.controlSequences ??
          [],
      );

    assert(
      historicalTarget.installationId !==
        target.installationId &&
        historicalTarget.bindingKeyId !==
          target.bindingKeyId &&
        historicalTarget.publicKeyFingerprint !==
          target.publicKeyFingerprint,
      "Historical Control Bundle target unexpectedly matches current native target.",
    );

    const portableHistoricalBranchAccessPackage =
      createSignedPackage({

        packageId:
          "FINORA-CONTROL-BUNDLE-G5A-PORTABLE-BRANCH-ACCESS-CHILD",

        purpose:
          "BRANCH_ACCESS",

        target:
          historicalTarget,

        issuedAt,

        sequence:
          portableBundleSequence,

        payload: {
          action:
            "ISSUE",

          accessGrant:
            portableBundleAccessGrant,

          issuedAt,

          schemaVersion:
            1,
        },

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const portableHistoricalBranchAccessBundle =
      createSignedBundle({

        packageId:
          "FINORA-CONTROL-BUNDLE-G5A-PORTABLE-BRANCH-ACCESS-OUTER",

        sequence:
          portableBundleSequence,

        issuedAt,

        target:
          historicalTarget,

        children: [
          portableHistoricalBranchAccessPackage,
        ],

        issuerId,

        signingMaterial,
      });

    const portableBundleResult =
      await applyFinoraSignedControlBundlePackage(
        portableHistoricalBranchAccessBundle,
        trustedKeys,
        now,
        portableAuthorityContext,
      );

    if (!portableBundleResult.success) {
      throw new Error(
        portableBundleResult.error ??
          "Portable historical BRANCH_ACCESS Control Bundle was rejected.",
      );
    }

    assert(
      portableBundleResult.data.childResults.length ===
        1 &&
        portableBundleResult.data.childResults[0]
          ?.purpose ===
          "BRANCH_ACCESS" &&
        portableBundleResult.data.childResults[0]
          ?.success ===
          true &&
        portableBundleResult.data.succeededCount ===
          1 &&
        portableBundleResult.data.failedCount ===
          0 &&
        portableBundleResult.data.allChildrenApplied ===
          true,
      "Portable historical BRANCH_ACCESS Control Bundle did not report one successful child.",
    );

    const afterPortableBundle =
      await readFinoraControlStore();

    assert(
      afterPortableBundle.success &&
        afterPortableBundle.data,
      afterPortableBundle.error ??
        "Unable to read Control Store after portable BRANCH_ACCESS bundle.",
    );

    const persistedPortableBundleGrant =
      afterPortableBundle.data.branchAccessGrants
        ?.find(
          (item) =>
            item.grantId ===
              portableBundleAccessGrant.grantId &&
            item.userId ===
              portableBundleAccessGrant.userId &&
            item.ownerId ===
              scope.ownerId &&
            item.businessId ===
              scope.businessId &&
            item.branchId ===
              scope.branchId,
        );

    assert(
      persistedPortableBundleGrant !==
        undefined,
      "Portable BRANCH_ACCESS Control Bundle did not persist its Access Grant.",
    );

    const portableBundleReplayRecord =
      afterPortableBundle.data.appliedControlPackages
        ?.find(
          (item) =>
            item.packageId ===
              portableHistoricalBranchAccessPackage.packageId,
        );

    assert(
      portableBundleReplayRecord?.installationId ===
        historicalTarget.installationId &&
        portableBundleReplayRecord.ownerId ===
          scope.ownerId &&
        portableBundleReplayRecord.businessId ===
          scope.businessId &&
        portableBundleReplayRecord.branchId ===
          scope.branchId,
      "Portable Control Bundle replay evidence did not preserve historical installation provenance.",
    );

    const portableBundleSequenceRecord =
      afterPortableBundle.data.portableBranchAccessSequences
        ?.find(
          (item) =>
            item.issuerId ===
              issuerId &&
            item.ownerId ===
              scope.ownerId &&
            item.businessId ===
              scope.businessId &&
            item.branchId ===
              scope.branchId,
        );

    assert(
      portableBundleSequenceRecord?.lastSequence ===
        portableBundleSequence,
      "Portable BRANCH_ACCESS Control Bundle did not advance branch-scoped sequence authority.",
    );

    assert(
      JSON.stringify(
        afterPortableBundle.data.controlSequences ??
          [],
      ) ===
        nativeSequencesBeforePortableBundle,
      "Portable BRANCH_ACCESS Control Bundle mutated native installation-scoped controlSequences.",
    );

    assert(
      afterPortableBundle.data.installation
        ?.installationId ===
          target.installationId,
      "Portable BRANCH_ACCESS Control Bundle rebound current recipient installation identity.",
    );

    console.log(
      "PASS: authenticated portable historical BRANCH_ACCESS child applied through CONTROL_BUNDLE",
    );

    console.log(
      "PASS: portable CONTROL_BUNDLE preserved historical installation replay provenance",
    );

    console.log(
      "PASS: portable CONTROL_BUNDLE advanced branch sequence without mutating native controlSequences",
    );

    console.log(
      "PASS: portable CONTROL_BUNDLE did not rebind recipient installation",
    );

    // ========================================================
    // G5B-2B-4 ? PORTABLE HISTORICAL BUSINESS_PROFILE CHILD
    //
    // AUTHENTICATED_PORTABLE:
    // - historical full installation target is signed provenance
    // - current branch scope authorizes import
    // - BUSINESS_PROFILE uses dedicated portable sequence state
    // - current installation identity must never be rebound
    //
    // BOOTSTRAP_NATIVE proof follows and must reject the same
    // historical target before child mutation.
    // ========================================================

    assert(
      installation.businessCode ===
        "CBT01" &&
        installation.branchCode ===
          "B01",
      "Portable BUSINESS_PROFILE fixture requires authoritative installation numbering codes.",
    );

    const portableBusinessProfileLegacyHighWater =
      (
        afterPortableBundle.data.controlSequences ??
        []
      )
        .filter(
          (item) =>
            item.issuerId ===
              issuerId &&
            item.purpose ===
              "BUSINESS_PROFILE" &&
            item.ownerId ===
              scope.ownerId &&
            item.businessId ===
              scope.businessId &&
            item.branchId ===
              scope.branchId,
        )
        .reduce(
          (
            current,
            item,
          ) =>
            Math.max(
              current,
              item.lastSequence,
            ),
          0,
        );

    const portableBusinessProfileExistingHighWater =
      (
        afterPortableBundle.data.portableBusinessProfileSequences ??
        []
      )
        .filter(
          (item) =>
            item.issuerId ===
              issuerId &&
            item.ownerId ===
              scope.ownerId &&
            item.businessId ===
              scope.businessId &&
            item.branchId ===
              scope.branchId,
        )
        .reduce(
          (
            current,
            item,
          ) =>
            Math.max(
              current,
              item.lastSequence,
            ),
          0,
        );

    const portableBusinessProfileSequence =
      Math.max(
        portableBusinessProfileLegacyHighWater,
        portableBusinessProfileExistingHighWater,
      ) +
      1;

    const nativeSequencesBeforePortableBusinessProfileBundle =
      JSON.stringify(
        afterPortableBundle.data.controlSequences ??
          [],
      );

    const portableBusinessProfileId =
      "PROFILE-CONTROL-BUNDLE-G5B-PORTABLE-HISTORICAL";

    const portableHistoricalBusinessProfilePayload = {
      action:
        "ISSUE" as const,

      profile: {
        profileId:
          portableBusinessProfileId,

        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,

        businessCode:
          installation.businessCode,

        branchCode:
          installation.branchCode,

        businessName:
          "FINORA Portable Bundle Business Profile Self Test",

        branchName:
          "FINORA Portable Bundle Branch",

        createdAt:
          validFrom,

        updatedAt:
          issuedAt,

        schemaVersion:
          1 as const,
      },

      installationBinding: {
        installationId:
          historicalTarget.installationId,

        bindingKeyId:
          historicalTarget.bindingKeyId,

        fingerprintAlgorithm:
          "SHA-256" as const,

        publicKeyFingerprint:
          historicalTarget.publicKeyFingerprint,

        schemaVersion:
          1 as const,
      },

      issuedAt,

      schemaVersion:
        1 as const,
    };

    const portableHistoricalBusinessProfilePackage =
      createSignedPackage({

        packageId:
          "FINORA-CONTROL-BUNDLE-G5B-PORTABLE-BUSINESS-PROFILE-CHILD",

        purpose:
          "BUSINESS_PROFILE",

        target:
          historicalTarget,

        issuedAt,

        sequence:
          portableBusinessProfileSequence,

        payload:
          portableHistoricalBusinessProfilePayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const portableHistoricalBusinessProfileBundle =
      createSignedBundle({

        packageId:
          "FINORA-CONTROL-BUNDLE-G5B-PORTABLE-BUSINESS-PROFILE-OUTER",

        sequence:
          portableBusinessProfileSequence,

        issuedAt,

        target:
          historicalTarget,

        children: [
          portableHistoricalBusinessProfilePackage,
        ],

        issuerId,

        signingMaterial,
      });

    const portableBusinessProfileBundleResult =
      await applyFinoraSignedControlBundlePackage(
        portableHistoricalBusinessProfileBundle,
        trustedKeys,
        now,
        portableAuthorityContext,
      );

    if (!portableBusinessProfileBundleResult.success) {
      throw new Error(
        portableBusinessProfileBundleResult.error ??
          "Portable historical BUSINESS_PROFILE Control Bundle was rejected.",
      );
    }

    assert(
      portableBusinessProfileBundleResult.data.childResults.length ===
        1 &&
        portableBusinessProfileBundleResult.data.childResults[0]
          ?.purpose ===
          "BUSINESS_PROFILE" &&
        portableBusinessProfileBundleResult.data.childResults[0]
          ?.success ===
          true &&
        portableBusinessProfileBundleResult.data.succeededCount ===
          1 &&
        portableBusinessProfileBundleResult.data.failedCount ===
          0 &&
        portableBusinessProfileBundleResult.data.allChildrenApplied ===
          true,
      "Portable historical BUSINESS_PROFILE Control Bundle did not report one successful child.",
    );

    const afterPortableBusinessProfileBundle =
      await readFinoraControlStore();

    assert(
      afterPortableBusinessProfileBundle.success &&
        afterPortableBusinessProfileBundle.data,
      afterPortableBusinessProfileBundle.error ??
        "Unable to read Control Store after portable BUSINESS_PROFILE bundle.",
    );

    const persistedPortableBusinessProfile =
      afterPortableBusinessProfileBundle.data.businessProfiles
        ?.find(
          (item) =>
            item.profileId ===
              portableBusinessProfileId,
        );

    assert(
      persistedPortableBusinessProfile !==
        undefined,
      "Portable BUSINESS_PROFILE Control Bundle did not persist the profile.",
    );

    assert(
      persistedPortableBusinessProfile.installationId ===
        historicalTarget.installationId &&
        persistedPortableBusinessProfile.bindingKeyId ===
          historicalTarget.bindingKeyId &&
        persistedPortableBusinessProfile.fingerprintAlgorithm ===
          historicalTarget.fingerprintAlgorithm &&
        persistedPortableBusinessProfile.publicKeyFingerprint ===
          historicalTarget.publicKeyFingerprint,
      "Portable BUSINESS_PROFILE Control Bundle did not preserve historical installation provenance.",
    );

    const portableBusinessProfileReplayRecord =
      afterPortableBusinessProfileBundle.data.appliedControlPackages
        ?.find(
          (item) =>
            item.packageId ===
              portableHistoricalBusinessProfilePackage.packageId,
        );

    assert(
      portableBusinessProfileReplayRecord?.installationId ===
        historicalTarget.installationId &&
        portableBusinessProfileReplayRecord.ownerId ===
          scope.ownerId &&
        portableBusinessProfileReplayRecord.businessId ===
          scope.businessId &&
        portableBusinessProfileReplayRecord.branchId ===
          scope.branchId,
      "Portable BUSINESS_PROFILE Control Bundle replay evidence did not preserve historical target.",
    );

    const portableBusinessProfileSequenceRecord =
      afterPortableBusinessProfileBundle.data.portableBusinessProfileSequences
        ?.find(
          (item) =>
            item.issuerId ===
              issuerId &&
            item.ownerId ===
              scope.ownerId &&
            item.businessId ===
              scope.businessId &&
            item.branchId ===
              scope.branchId,
        );

    assert(
      portableBusinessProfileSequenceRecord?.lastSequence ===
        portableBusinessProfileSequence,
      "Portable BUSINESS_PROFILE Control Bundle did not advance branch-scoped sequence authority.",
    );

    assert(
      JSON.stringify(
        afterPortableBusinessProfileBundle.data.controlSequences ??
          [],
      ) ===
        nativeSequencesBeforePortableBusinessProfileBundle,
      "Portable BUSINESS_PROFILE Control Bundle mutated native installation-scoped controlSequences.",
    );

    assert(
      afterPortableBusinessProfileBundle.data.installation
        ?.installationId ===
          target.installationId,
      "Portable BUSINESS_PROFILE Control Bundle rebound current recipient installation identity.",
    );

    console.log(
      "PASS: authenticated portable historical BUSINESS_PROFILE child applied through CONTROL_BUNDLE",
    );

    console.log(
      "PASS: portable BUSINESS_PROFILE bundle preserved signed historical installation provenance",
    );

    console.log(
      "PASS: portable BUSINESS_PROFILE bundle advanced dedicated branch sequence without mutating native controlSequences",
    );

    console.log(
      "PASS: portable BUSINESS_PROFILE bundle did not rebind recipient installation",
    );

    await expectBundleFailureForAuthorityWithoutMutation(
      "bootstrap native rejected historical BUSINESS_PROFILE bundle before portable child routing",
      portableHistoricalBusinessProfileBundle,
      trustedKeys,
      now,
      BOOTSTRAP_IMPORT_AUTHORITY_CONTEXT,
      "TARGET_MISMATCH: FINORA Control Package does not belong to this installation.",
    );
    // --------------------------------------------------------
    // SAME HISTORICAL BUNDLE UNDER BOOTSTRAP_NATIVE
    // --------------------------------------------------------

    await expectBundleFailureForAuthorityWithoutMutation(
      "bootstrap native rejected historical BRANCH_ACCESS bundle before portable child routing",
      portableHistoricalBranchAccessBundle,
      trustedKeys,
      now,
      BOOTSTRAP_IMPORT_AUTHORITY_CONTEXT,
      "TARGET_MISMATCH: FINORA Control Package does not belong to this installation.",
    );

    // --------------------------------------------------------
    // PORTABLE AUTHORIZE_CREDENTIAL IS NATIVE-ONLY
    // --------------------------------------------------------

    const portableAuthorizeCredentialPackage =
      createSignedPackage({

        packageId:
          "FINORA-CONTROL-BUNDLE-G5A-PORTABLE-AUTHORIZE-CREDENTIAL-CHILD",

        purpose:
          "BRANCH_ACCESS",

        target:
          historicalTarget,

        issuedAt,

        sequence:
          portableBundleSequence +
          1,

        payload: {
          action:
            "AUTHORIZE_CREDENTIAL",

          credentialEnrollment: {},

          issuedAt,

          schemaVersion:
            1,
        },

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const portableAuthorizeCredentialBundle =
      createSignedBundle({

        packageId:
          "FINORA-CONTROL-BUNDLE-G5A-PORTABLE-AUTHORIZE-CREDENTIAL-OUTER",

        sequence:
          portableBundleSequence +
          1,

        issuedAt,

        target:
          historicalTarget,

        children: [
          portableAuthorizeCredentialPackage,
        ],

        issuerId,

        signingMaterial,
      });

    await expectBundleFailureForAuthorityWithoutMutation(
      "portable CONTROL_BUNDLE rejected native-only AUTHORIZE_CREDENTIAL during complete preflight",
      portableAuthorizeCredentialBundle,
      trustedKeys,
      now,
      portableAuthorityContext,
      "BRANCH_ACCESS AUTHORIZE_CREDENTIAL is native-only.",
    );

    // --------------------------------------------------------
    // PORTABLE ISSUE + credentialEnrollment IS NATIVE-ONLY
    // --------------------------------------------------------

    const portableCredentialBearingPackage =
      createSignedPackage({

        packageId:
          "FINORA-CONTROL-BUNDLE-G5A-PORTABLE-CREDENTIAL-BEARING-CHILD",

        purpose:
          "BRANCH_ACCESS",

        target:
          historicalTarget,

        issuedAt,

        sequence:
          portableBundleSequence +
          1,

        payload: {
          action:
            "ISSUE",

          accessGrant:
            portableBundleAccessGrant,

          credentialEnrollment: {},

          issuedAt,

          schemaVersion:
            1,
        },

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const portableCredentialBearingBundle =
      createSignedBundle({

        packageId:
          "FINORA-CONTROL-BUNDLE-G5A-PORTABLE-CREDENTIAL-BEARING-OUTER",

        sequence:
          portableBundleSequence +
          2,

        issuedAt,

        target:
          historicalTarget,

        children: [
          portableCredentialBearingPackage,
        ],

        issuerId,

        signingMaterial,
      });

    await expectBundleFailureForAuthorityWithoutMutation(
      "portable CONTROL_BUNDLE rejected credential-bearing BRANCH_ACCESS ISSUE during complete preflight",
      portableCredentialBearingBundle,
      trustedKeys,
      now,
      portableAuthorityContext,
      "portable BRANCH_ACCESS cannot carry credential enrollment authority.",
    );

    console.log(
      "PASS: native-only BRANCH_ACCESS credential actions rejected before first bundle child mutation",
    );

    // --------------------------------------------------------
    // PRICING_POLICY is now a migrated portable child family.
    // BOOTSTRAP_NATIVE must still reject this historical target.
    // A fresh isolated recipient below proves portable success
    // without violating the native Pricing provenance already
    // established earlier in this primary regression store.
    // --------------------------------------------------------
    await expectBundleFailureForAuthorityWithoutMutation(
      "bootstrap native rejected historical outer target before child preflight",
      historicalBundle,
      trustedKeys,
      now,
      BOOTSTRAP_IMPORT_AUTHORITY_CONTEXT,
      "TARGET_MISMATCH: FINORA Control Package does not belong to this installation.",
    );

    const wrongBranchPortableAuthorityContext = {
      ...portableAuthorityContext,

      principal: {
        ...portableAuthorityContext.principal,

        branchId:
          "BRANCH-CONTROL-BUNDLE-PORTABLE-WRONG",
      },
    } as const;

    await expectBundleFailureForAuthorityWithoutMutation(
      "authenticated portable wrong principal branch rejected before package authorization",
      historicalBundle,
      trustedKeys,
      now,
      wrongBranchPortableAuthorityContext,
      "FINORA authenticated portable Control Bundle session does not belong to the authoritative Control Store branch.",
    );

    const blankFingerprintPortableAuthorityContext = {
      ...portableAuthorityContext,

      portableAuthFingerprint:
        "",
    } as const;

    await expectBundleFailureForAuthorityWithoutMutation(
      "authenticated portable blank fingerprint rejected before package authorization",
      historicalBundle,
      trustedKeys,
      now,
      blankFingerprintPortableAuthorityContext,
      "FINORA authenticated portable Control Bundle authority context is invalid.",
    );



    // ========================================================
    // G5C ? PORTABLE HISTORICAL PRICING CHILD
    //
    // The primary bundle regression store already owns a
    // native current-installation Pricing Policy. Portable
    // Pricing correctly treats that provenance as immutable.
    // Therefore this proof uses a second isolated recipient
    // Control Store rather than clearing or rebinding state.
    // ========================================================

    const portablePricingBundleUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-control-bundle-portable-pricing-selftest-",
        ),
      );

    try {

      app.setPath(
        "userData",
        portablePricingBundleUserData,
      );

      const portablePricingRecipientBinding =
        await ensureFinoraWindowsInstallationBinding();

      assert(
        portablePricingRecipientBinding.installationId !==
          historicalTarget.installationId &&
        portablePricingRecipientBinding.bindingKeyId !==
          historicalTarget.bindingKeyId &&
        portablePricingRecipientBinding.publicKeyFingerprint !==
          historicalTarget.publicKeyFingerprint,
        "Isolated portable Pricing recipient unexpectedly matches historical signed target.",
      );

      const portablePricingRecipientCreatedAt =
        new Date(
          now.getTime() -
            60 *
              60 *
              1000,
        ).toISOString();

      const portablePricingRecipientInstallation:
        FinoraControlInstallationIdentity = {

          installationId:
            portablePricingRecipientBinding.installationId,

          ownerId:
            scope.ownerId,

          businessId:
            scope.businessId,

          branchId:
            scope.branchId,

          businessCode:
            "CBP01",

          branchCode:
            "CB01",

          createdAt:
            portablePricingRecipientCreatedAt,

          updatedAt:
            portablePricingRecipientCreatedAt,

          schemaVersion:
            1,
        };

      const portablePricingInstallationResult =
        await saveFinoraInstallationIdentity(
          portablePricingRecipientInstallation,
        );

      expectSuccess(
        "isolated portable Pricing bundle recipient installation identity persisted",
        portablePricingInstallationResult,
      );

      const portablePricingBefore =
        await readFinoraControlStore();

      assert(
        portablePricingBefore.success &&
          portablePricingBefore.data,
        portablePricingBefore.error ??
          "Unable to read isolated portable Pricing bundle baseline.",
      );

      assert(
        (
          portablePricingBefore.data.pricingPolicies ??
          []
        ).length ===
          0,
        "Isolated portable Pricing bundle recipient unexpectedly contains prior Pricing state.",
      );

      const portablePricingNativeSequencesBefore =
        JSON.stringify(
          portablePricingBefore.data.controlSequences ??
            [],
        );

      await expectBundleFailureForAuthorityWithoutMutation(
        "isolated BOOTSTRAP_NATIVE still rejected historical Pricing bundle target",
        historicalBundle,
        trustedKeys,
        now,
        BOOTSTRAP_IMPORT_AUTHORITY_CONTEXT,
        "TARGET_MISMATCH: FINORA Control Package does not belong to this installation.",
      );

      const portablePricingBundleResult =
        await applyFinoraSignedControlBundlePackage(
          historicalBundle,
          trustedKeys,
          now,
          portableAuthorityContext,
        );

      if (!portablePricingBundleResult.success) {
        throw new Error(
          portablePricingBundleResult.error ??
            "Authenticated portable historical Pricing bundle failed.",
        );
      }

      assert(
        portablePricingBundleResult.data.childResults.length ===
          1 &&
        portablePricingBundleResult.data.childResults[0]?.packageId ===
          historicalPricingPackage.packageId &&
        portablePricingBundleResult.data.childResults[0]?.purpose ===
          "PRICING_POLICY" &&
        portablePricingBundleResult.data.childResults[0]?.success ===
          true &&
        portablePricingBundleResult.data.succeededCount ===
          1 &&
        portablePricingBundleResult.data.failedCount ===
          0 &&
        portablePricingBundleResult.data.allChildrenApplied,
        "Portable historical Pricing bundle did not report one successful Pricing child.",
      );

      console.log(
        "PASS: authenticated portable CONTROL_BUNDLE accepted historical-target PRICING_POLICY child",
      );

      const afterPortablePricingBundle =
        await readFinoraControlStore();

      assert(
        afterPortablePricingBundle.success &&
          afterPortablePricingBundle.data,
        afterPortablePricingBundle.error ??
          "Unable to read Control Store after portable Pricing bundle apply.",
      );

      const persistedPortablePricingPolicy =
        afterPortablePricingBundle.data.pricingPolicies
          ?.find(
            (item) =>
              item.installationId ===
                historicalTarget.installationId &&
              item.ownerId ===
                scope.ownerId &&
              item.businessId ===
                scope.businessId &&
              item.branchId ===
                scope.branchId,
          );

      assert(
        persistedPortablePricingPolicy !==
          undefined,
        "Portable historical Pricing child was not persisted.",
      );

      assert(
        persistedPortablePricingPolicy.installationId ===
          historicalTarget.installationId &&
        persistedPortablePricingPolicy.bindingKeyId ===
          historicalTarget.bindingKeyId &&
        persistedPortablePricingPolicy.fingerprintAlgorithm ===
          historicalTarget.fingerprintAlgorithm &&
        persistedPortablePricingPolicy.publicKeyFingerprint ===
          historicalTarget.publicKeyFingerprint,
        "Portable Pricing bundle did not preserve signed historical installation provenance.",
      );

      console.log(
        "PASS: portable Pricing bundle preserved historical installation/binding/fingerprint provenance",
      );

      assert(
        persistedPortablePricingPolicy.overrides.length ===
          1 &&
        persistedPortablePricingPolicy.overrides[0]?.amount ===
          13,
        "Portable Pricing bundle did not persist the signed Pricing override.",
      );

      console.log(
        "PASS: portable Pricing bundle persisted signed override amount",
      );

      assert(
        afterPortablePricingBundle.data.installation
          ?.installationId ===
          portablePricingRecipientBinding.installationId,
        "Portable Pricing bundle rebound current recipient installation identity.",
      );

      console.log(
        "PASS: portable Pricing bundle left current recipient installation unchanged",
      );

      const portablePricingReplayRecord =
        afterPortablePricingBundle.data.appliedControlPackages
          ?.find(
            (item) =>
              item.packageId ===
                historicalPricingPackage.packageId,
          );

      assert(
        portablePricingReplayRecord?.installationId ===
          historicalTarget.installationId &&
        portablePricingReplayRecord.ownerId ===
          scope.ownerId &&
        portablePricingReplayRecord.businessId ===
          scope.businessId &&
        portablePricingReplayRecord.branchId ===
          scope.branchId,
        "Portable Pricing bundle replay evidence did not preserve historical signed target.",
      );

      console.log(
        "PASS: portable Pricing bundle replay evidence preserved historical target",
      );

      const portablePricingSequenceRecord =
        afterPortablePricingBundle.data.portablePricingPolicySequences
          ?.find(
            (item) =>
              item.issuerId ===
                issuerId &&
              item.ownerId ===
                scope.ownerId &&
              item.businessId ===
                scope.businessId &&
              item.branchId ===
                scope.branchId,
          );

      assert(
        portablePricingSequenceRecord?.lastSequence ===
          50,
        "Portable Pricing bundle did not advance dedicated branch Pricing sequence high-water.",
      );

      console.log(
        "PASS: portable Pricing bundle advanced dedicated portable Pricing branch sequence",
      );

      assert(
        JSON.stringify(
          afterPortablePricingBundle.data.controlSequences ??
            [],
        ) ===
          portablePricingNativeSequencesBefore,
        "Portable Pricing bundle mutated native installation-scoped controlSequences.",
      );

      console.log(
        "PASS: portable Pricing bundle did not mutate native controlSequences",
      );

    } finally {

      await rm(
        portablePricingBundleUserData,
        {
          recursive:
            true,

          force:
            true,
        },
      );

      console.log(
        "PASS: isolated portable Pricing bundle recipient userData deleted",
      );
    }
    // ========================================================
    // G5D ? PORTABLE HISTORICAL STORAGE_ENTITLEMENT CHILD
    //
    // Use an isolated recipient Control Store. The signed
    // entitlement remains bound to the historical device target,
    // while current-device authorization is branch scoped.
    // ========================================================

    const portableStorageBundleUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-control-bundle-portable-storage-selftest-",
        ),
      );

    try {

      app.setPath(
        "userData",
        portableStorageBundleUserData,
      );

      const portableStorageRecipientBinding =
        await ensureFinoraWindowsInstallationBinding();

      assert(
        portableStorageRecipientBinding.installationId !==
          historicalTarget.installationId &&
        portableStorageRecipientBinding.bindingKeyId !==
          historicalTarget.bindingKeyId &&
        portableStorageRecipientBinding.publicKeyFingerprint !==
          historicalTarget.publicKeyFingerprint,
        "Isolated portable Storage recipient unexpectedly matches historical signed target.",
      );

      const portableStorageRecipientCreatedAt =
        new Date(
          now.getTime() -
            2 *
              60 *
              60 *
              1000,
        ).toISOString();

      const portableStorageRecipientInstallation:
        FinoraControlInstallationIdentity = {

          installationId:
            portableStorageRecipientBinding.installationId,

          ownerId:
            scope.ownerId,

          businessId:
            scope.businessId,

          branchId:
            scope.branchId,

          businessCode:
            "CBS01",

          branchCode:
            "CB01",

          createdAt:
            portableStorageRecipientCreatedAt,

          updatedAt:
            portableStorageRecipientCreatedAt,

          schemaVersion:
            1,
        };

      const portableStorageInstallationResult =
        await saveFinoraInstallationIdentity(
          portableStorageRecipientInstallation,
        );

      expectSuccess(
        "isolated portable Storage bundle recipient installation identity persisted",
        portableStorageInstallationResult,
      );

      const portableStorageBefore =
        await readFinoraControlStore();

      assert(
        portableStorageBefore.success &&
        portableStorageBefore.data,
        portableStorageBefore.error ??
          "Unable to read isolated portable Storage bundle baseline.",
      );

      assert(
        (
          portableStorageBefore.data.storageEntitlements ??
          []
        ).length ===
          0,
        "Isolated portable Storage bundle recipient unexpectedly contains prior Storage Entitlement state.",
      );

      const portableStorageLegacyHighWater =
        (
          portableStorageBefore.data.controlSequences ??
          []
        )
          .filter(
            (item) =>
              item.issuerId ===
                issuerId &&
              item.purpose ===
                "STORAGE_ENTITLEMENT" &&
              item.ownerId ===
                scope.ownerId &&
              item.businessId ===
                scope.businessId &&
              item.branchId ===
                scope.branchId,
          )
          .reduce(
            (
              current,
              item,
            ) =>
              Math.max(
                current,
                item.lastSequence,
              ),
            0,
          );

      const portableStorageExistingHighWater =
        (
          portableStorageBefore.data.portableStorageEntitlementSequences ??
          []
        )
          .filter(
            (item) =>
              item.issuerId ===
                issuerId &&
              item.ownerId ===
                scope.ownerId &&
              item.businessId ===
                scope.businessId &&
              item.branchId ===
                scope.branchId,
          )
          .reduce(
            (
              current,
              item,
            ) =>
              Math.max(
                current,
                item.lastSequence,
              ),
            0,
          );

      const portableStorageSequence =
        Math.max(
          portableStorageLegacyHighWater,
          portableStorageExistingHighWater,
        ) +
        1;

      const portableStorageNativeSequencesBefore =
        JSON.stringify(
          portableStorageBefore.data.controlSequences ??
            [],
        );

      const portableStorageActivatedAt =
        new Date(
          now.getTime() -
            30 *
              60 *
              1000,
        ).toISOString();

      const portableHistoricalStorageEntitlement = {

        entitlementId:
          "ENTITLEMENT-CONTROL-BUNDLE-G5D-PORTABLE-HISTORICAL-000001",

        userId:
          portableAuthorityContext.principal.userId,

        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,

        installationId:
          historicalTarget.installationId,

        bindingKeyId:
          historicalTarget.bindingKeyId,

        fingerprintAlgorithm:
          historicalTarget.fingerprintAlgorithm,

        publicKeyFingerprint:
          historicalTarget.publicKeyFingerprint,

        storageMode:
          "LOCAL",

        status:
          "ACTIVE",

        activatedAt:
          portableStorageActivatedAt,

        createdAt:
          portableStorageRecipientCreatedAt,

        updatedAt:
          issuedAt,

        schemaVersion:
          1,
      } as const;

      const portableHistoricalStoragePackage =
        createSignedPackage({

          packageId:
            "FINORA-CONTROL-BUNDLE-G5D-PORTABLE-STORAGE-CHILD",

          purpose:
            "STORAGE_ENTITLEMENT",

          target:
            historicalTarget,

          issuedAt,

          sequence:
            portableStorageSequence,

          payload: {

            entitlement:
              portableHistoricalStorageEntitlement,

            issuedAt,

            schemaVersion:
              1,
          },

          issuerId,

          signingKeyId:
            signingMaterial.signingKeyId,

          privateKeyPkcs8DerBase64:
            signingMaterial.privateKeyPkcs8DerBase64,
        });

      const portableHistoricalStorageBundle =
        createSignedBundle({

          packageId:
            "FINORA-CONTROL-BUNDLE-G5D-PORTABLE-STORAGE-OUTER",

          sequence:
            portableStorageSequence,

          issuedAt,

          target:
            historicalTarget,

          children: [
            portableHistoricalStoragePackage,
          ],

          issuerId,

          signingMaterial,
        });

      await expectBundleFailureForAuthorityWithoutMutation(
        "isolated BOOTSTRAP_NATIVE still rejected historical Storage bundle target",
        portableHistoricalStorageBundle,
        trustedKeys,
        now,
        BOOTSTRAP_IMPORT_AUTHORITY_CONTEXT,
        "TARGET_MISMATCH: FINORA Control Package does not belong to this installation.",
      );

      const portableStorageBundleResult =
        await applyFinoraSignedControlBundlePackage(
          portableHistoricalStorageBundle,
          trustedKeys,
          now,
          portableAuthorityContext,
        );

      if (!portableStorageBundleResult.success) {
        throw new Error(
          portableStorageBundleResult.error ??
            "Authenticated portable historical Storage bundle failed.",
        );
      }

      assert(
        portableStorageBundleResult.data.childResults.length ===
          1 &&
        portableStorageBundleResult.data.childResults[0]?.packageId ===
          portableHistoricalStoragePackage.packageId &&
        portableStorageBundleResult.data.childResults[0]?.purpose ===
          "STORAGE_ENTITLEMENT" &&
        portableStorageBundleResult.data.childResults[0]?.success ===
          true &&
        portableStorageBundleResult.data.succeededCount ===
          1 &&
        portableStorageBundleResult.data.failedCount ===
          0 &&
        portableStorageBundleResult.data.allChildrenApplied,
        "Portable historical Storage bundle did not report one successful Storage child.",
      );

      console.log(
        "PASS: authenticated portable CONTROL_BUNDLE accepted historical-target STORAGE_ENTITLEMENT child",
      );

      const afterPortableStorageBundle =
        await readFinoraControlStore();

      assert(
        afterPortableStorageBundle.success &&
        afterPortableStorageBundle.data,
        afterPortableStorageBundle.error ??
          "Unable to read Control Store after portable Storage bundle apply.",
      );

      const persistedPortableStorageEntitlement =
        afterPortableStorageBundle.data.storageEntitlements
          ?.find(
            (item) =>
              item.entitlementId ===
                portableHistoricalStorageEntitlement.entitlementId &&
              item.userId ===
                portableHistoricalStorageEntitlement.userId &&
              item.ownerId ===
                scope.ownerId &&
              item.businessId ===
                scope.businessId &&
              item.branchId ===
                scope.branchId &&
              item.storageMode ===
                "LOCAL",
          );

      assert(
        persistedPortableStorageEntitlement !==
          undefined,
        "Portable historical Storage child was not persisted.",
      );

      assert(
        persistedPortableStorageEntitlement.installationId ===
          historicalTarget.installationId &&
        persistedPortableStorageEntitlement.bindingKeyId ===
          historicalTarget.bindingKeyId &&
        persistedPortableStorageEntitlement.fingerprintAlgorithm ===
          historicalTarget.fingerprintAlgorithm &&
        persistedPortableStorageEntitlement.publicKeyFingerprint ===
          historicalTarget.publicKeyFingerprint,
        "Portable Storage bundle did not preserve signed historical installation provenance.",
      );

      console.log(
        "PASS: portable Storage bundle preserved historical installation/binding/fingerprint provenance",
      );

      assert(
        persistedPortableStorageEntitlement.status ===
          "ACTIVE" &&
        persistedPortableStorageEntitlement.storageMode ===
          "LOCAL" &&
        persistedPortableStorageEntitlement.updatedAt ===
          issuedAt,
        "Portable Storage bundle did not persist the signed entitlement state.",
      );

      console.log(
        "PASS: portable Storage bundle persisted signed ACTIVE LOCAL entitlement",
      );

      assert(
        afterPortableStorageBundle.data.installation
          ?.installationId ===
          portableStorageRecipientBinding.installationId,
        "Portable Storage bundle rebound current recipient installation identity.",
      );

      console.log(
        "PASS: portable Storage bundle left current recipient installation unchanged",
      );

      const portableStorageReplayRecord =
        afterPortableStorageBundle.data.appliedControlPackages
          ?.find(
            (item) =>
              item.packageId ===
                portableHistoricalStoragePackage.packageId,
          );

      assert(
        portableStorageReplayRecord?.installationId ===
          historicalTarget.installationId &&
        portableStorageReplayRecord.ownerId ===
          scope.ownerId &&
        portableStorageReplayRecord.businessId ===
          scope.businessId &&
        portableStorageReplayRecord.branchId ===
          scope.branchId,
        "Portable Storage bundle replay evidence did not preserve historical signed target.",
      );

      console.log(
        "PASS: portable Storage bundle replay evidence preserved historical target",
      );

      const portableStorageSequenceRecord =
        afterPortableStorageBundle.data.portableStorageEntitlementSequences
          ?.find(
            (item) =>
              item.issuerId ===
                issuerId &&
              item.ownerId ===
                scope.ownerId &&
              item.businessId ===
                scope.businessId &&
              item.branchId ===
                scope.branchId,
          );

      assert(
        portableStorageSequenceRecord?.lastSequence ===
          portableStorageSequence,
        "Portable Storage bundle did not advance dedicated branch Storage sequence high-water.",
      );

      console.log(
        "PASS: portable Storage bundle advanced dedicated portable Storage branch sequence",
      );

      assert(
        JSON.stringify(
          afterPortableStorageBundle.data.controlSequences ??
            [],
        ) ===
          portableStorageNativeSequencesBefore,
        "Portable Storage bundle mutated native installation-scoped controlSequences.",
      );

      console.log(
        "PASS: portable Storage bundle did not mutate native controlSequences",
      );

    } finally {

      await rm(
        portableStorageBundleUserData,
        {
          recursive:
            true,

          force:
            true,
        },
      );

      console.log(
        "PASS: isolated portable Storage bundle recipient userData deleted",
      );
    }

    console.log(
      "PASS: G4 authenticated portable outer CONTROL_BUNDLE lane policy executable proof",
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