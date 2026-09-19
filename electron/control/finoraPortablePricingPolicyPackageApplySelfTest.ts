// ============================================================
// FINORA ENTERPRISE
// PORTABLE HISTORICAL-TARGET PRICING POLICY APPLY SELF TEST
//
// PHASE 5.6J-G5C-1F3B
//
// Proves:
// - historical signed installation target rejected by native lane
// - same package accepted by portable branch-scoped lane
// - signed historical installation provenance preserved exactly
// - current recipient installation identity remains unchanged
// - global package replay evidence preserves historical target
// - dedicated portable Pricing branch sequence advances
// - portable apply does not mutate native controlSequences
// - replay / equal / stale / wrong-branch / binding mismatch /
//   tampered-signature failures are zero-mutation
// - empty authoritative REPLACE restores Base Pricing schedule
//
// This is an executable Electron main-process self-test.
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
import {
  getFinoraControlCenterPublicIdentity,
} from "../control-center/finoraControlCenterKeyVault.js";

import {
  issueFinoraPricingPolicyPackage,
} from "../control-center/finoraControlCenterIssuanceCoordinator.js";

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
  applyFinoraSignedPortablePricingPolicyPackage,
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
    `${label}: ${result.error ?? "operation failed"}`,
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

  expectedErrorFragment?:
    string,
): void {

  assert(
    !result.success,
    `${label}: expected failure but operation succeeded.`,
  );

  if (
    expectedErrorFragment !==
      undefined
  ) {

    assert(
      typeof result.error ===
        "string" &&
      result.error.includes(
        expectedErrorFragment,
      ),
      `${label}: expected error containing "${expectedErrorFragment}", received "${result.error ?? "<missing>"}".`,
    );
  }

  console.log(
    `PASS: ${label}`,
  );
}


// ============================================================
// PRICING PAYLOAD BUILDERS
// ============================================================

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
        "finora-portable-pricing-policy-selftest-",
      ),
    );

  let failure:
    unknown;

  try {

    // ========================================================
    // ISOLATED ELECTRON PERSISTENCE
    // ========================================================

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    console.log(
      "PASS: isolated Electron userData configured",
    );


    // ========================================================
    // CURRENT RECIPIENT DEVICE IDENTITY
    // ========================================================

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    assert(
      nativeBinding.installationId.length >
        0,
      "Native installation binding was not created.",
    );

    console.log(
      "PASS: isolated current native installation binding created",
    );


    const now =
      new Date();

    const installationCreatedAt =
      new Date(
        now.getTime() -
          60 *
            60 *
            1000,
      ).toISOString();

    const scope:
      SelfTestScope = {

        ownerId:
          "OWNER-PRICING-PORTABLE-SELFTEST",

        businessId:
          "BUSINESS-PRICING-PORTABLE-SELFTEST",

        branchId:
          "BRANCH-PRICING-PORTABLE-SELFTEST",
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
          "PPR01",

        branchCode:
          "PP01",

        createdAt:
          installationCreatedAt,

        updatedAt:
          installationCreatedAt,

        schemaVersion:
          1,
      };

    const installationResult =
      await saveFinoraInstallationIdentity(
        installation,
      );

    expectSuccess(
      "isolated current recipient installation identity persisted",
      installationResult,
    );


    // ========================================================
    // EPHEMERAL TRUSTED CONTROL CENTER SIGNER
    // ========================================================

    const signingMaterial =
      generateFinoraControlCenterSigningMaterial();

    const issuerId =
      "FINORA-PRICING-PORTABLE-SELFTEST-CONTROL-CENTER";

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
      "PASS: ephemeral Control Center signing identity trusted by isolated recipient",
    );


    // ========================================================
    // HISTORICAL SIGNED INSTALLATION PROVENANCE
    // ========================================================

    const historicalFingerprint =
      "ab".repeat(
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
          "INSTALLATION-PRICING-HISTORICAL-000001",

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

    assert(
      historicalTarget.installationId !==
        nativeBinding.installationId &&
      historicalTarget.bindingKeyId !==
        nativeBinding.bindingKeyId &&
      historicalTarget.publicKeyFingerprint !==
        nativeBinding.publicKeyFingerprint,
      "Historical PRICING_POLICY target unexpectedly matches current device.",
    );

    const historicalBinding:
      SelfTestBindingTarget = {

        installationId:
          historicalTarget.installationId,

        bindingKeyId:
          historicalTarget.bindingKeyId,

        fingerprintAlgorithm:
          historicalTarget.fingerprintAlgorithm,

        publicKeyFingerprint:
          historicalTarget.publicKeyFingerprint,

        schemaVersion:
          1,
      };

    const issuedAt =
      new Date(
        now.getTime() +
          5 *
            60 *
            1000,
      ).toISOString();

    const validFrom =
      new Date(
        now.getTime() -
          60 *
            60 *
            1000,
      ).toISOString();

    const validUntil =
      new Date(
        now.getTime() +
          24 *
            60 *
            60 *
            1000,
      ).toISOString();

    const overrideSetId =
      "PRICING-SET-PORTABLE-HISTORICAL-000001";

    const portablePayload =
      createPricingPayload(
        scope,
        historicalBinding,
        issuedAt,
        overrideSetId,
        [
          createRule({
            overrideId:
              "PRICING-OVERRIDE-PORTABLE-LOAN-DISBURSEMENT",

            chargeCode:
              "LOAN_DISBURSEMENT",

            amount:
              7,

            validFrom,

            validUntil,
          }),
        ],
      );


    // ========================================================
    // REAL CONTROL CENTER COORDINATOR -> PORTABLE RECIPIENT
    // ========================================================

    const publicIdentity =
      await getFinoraControlCenterPublicIdentity();

    assert(
      publicIdentity.issuerId.length >
        0 &&
      publicIdentity.signingKeyId.length >
        0 &&
      publicIdentity.publicKeySpkiDerBase64.length >
        0,
      "Control Center public identity is incomplete.",
    );

    const coordinatorTrustedKeys:
      FinoraBranchTrustedControlPublicKey[] = [
        {
          issuerId:
            publicIdentity.issuerId,

          signingKeyId:
            publicIdentity.signingKeyId,

          algorithm:
            "ECDSA_P256_SHA256",

          format:
            "SPKI_DER_BASE64",

          publicKey:
            publicIdentity.publicKeySpkiDerBase64,

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

    const beforeCoordinatorApply =
      await readFinoraControlStore();

    assert(
      beforeCoordinatorApply.success &&
        beforeCoordinatorApply.data,
      beforeCoordinatorApply.error ??
        "Unable to read Control Store before coordinator Pricing apply.",
    );

    const coordinatorNativeSequencesBefore =
      JSON.stringify(
        beforeCoordinatorApply.data.controlSequences ??
          [],
      );

    const coordinatorPackage =
      await issueFinoraPricingPolicyPackage({
        target:
          historicalTarget,

        payload:
          portablePayload,
      });

    assert(
      coordinatorPackage.sequence ===
        1,
      "Initial real coordinator PRICING_POLICY REPLACE did not reserve portable branch sequence 1.",
    );

    assert(
      coordinatorPackage.target.installationId ===
        historicalTarget.installationId &&
      coordinatorPackage.target.bindingKeyId ===
        historicalTarget.bindingKeyId &&
      coordinatorPackage.target.fingerprintAlgorithm ===
        historicalTarget.fingerprintAlgorithm &&
      coordinatorPackage.target.publicKeyFingerprint ===
        historicalTarget.publicKeyFingerprint,
      "Real coordinator PRICING_POLICY REPLACE rebound or altered historical target provenance.",
    );

    console.log(
      "PASS: real Control Center coordinator issued historical-target PRICING_POLICY REPLACE",
    );

    const coordinatorApplyResult =
      await applyFinoraSignedPortablePricingPolicyPackage(
        coordinatorPackage,
        coordinatorTrustedKeys,
        new Date(
          coordinatorPackage.issuedAt,
        ),
      );

    expectSuccess(
      "real coordinator PRICING_POLICY REPLACE accepted by portable recipient lane",
      coordinatorApplyResult,
    );

    const afterCoordinatorApply =
      await readFinoraControlStore();

    assert(
      afterCoordinatorApply.success &&
        afterCoordinatorApply.data,
      afterCoordinatorApply.error ??
        "Unable to read Control Store after coordinator Pricing apply.",
    );

    const coordinatorPersistedPolicy =
      (
        afterCoordinatorApply.data.pricingPolicies ??
          []
      ).find(
        (
          item,
        ) =>
          item.ownerId ===
            scope.ownerId &&
          item.businessId ===
            scope.businessId &&
          item.branchId ===
            scope.branchId,
      );

    assert(
      coordinatorPersistedPolicy !==
        undefined,
      "Coordinator-issued portable Pricing policy was not persisted.",
    );

    assert(
      coordinatorPersistedPolicy.installationId ===
        historicalTarget.installationId &&
      coordinatorPersistedPolicy.bindingKeyId ===
        historicalTarget.bindingKeyId &&
      coordinatorPersistedPolicy.fingerprintAlgorithm ===
        historicalTarget.fingerprintAlgorithm &&
      coordinatorPersistedPolicy.publicKeyFingerprint ===
        historicalTarget.publicKeyFingerprint,
      "Coordinator-issued portable Pricing policy did not preserve historical provenance.",
    );

    assert(
      coordinatorPersistedPolicy.overrides.length ===
        1,
      "Coordinator-issued portable Pricing override was not persisted.",
    );

    const coordinatorPortableSequence =
      afterCoordinatorApply.data.portablePricingPolicySequences
        ?.find(
          (
            item,
          ) =>
            item.issuerId ===
              publicIdentity.issuerId &&
            item.ownerId ===
              scope.ownerId &&
            item.businessId ===
              scope.businessId &&
            item.branchId ===
              scope.branchId,
        );

    assert(
      coordinatorPortableSequence?.lastSequence ===
        coordinatorPackage.sequence,
      "Coordinator-issued Pricing package did not advance dedicated portable recipient sequence.",
    );

    assert(
      JSON.stringify(
        afterCoordinatorApply.data.controlSequences ??
          [],
      ) ===
        coordinatorNativeSequencesBefore,
      "Coordinator-issued portable Pricing package mutated native recipient controlSequences.",
    );

    assert(
      afterCoordinatorApply.data.installation
        ?.installationId ===
        nativeBinding.installationId,
      "Coordinator-issued portable Pricing package rebound current recipient installation.",
    );

    console.log(
      "PASS: real coordinator Pricing REPLACE used portable branch sequence authority",
    );

    console.log(
      "PASS: coordinator-issued Pricing preserved historical provenance and current recipient identity",
    );

    console.log(
      "PASS: coordinator-issued Pricing advanced dedicated portable recipient sequence without native sequence mutation",
    );

    const portableHistoricalPackage =
      createSignedPackage({
        packageId:
          "PACKAGE-PRICING-PORTABLE-HISTORICAL-000001",

        purpose:
          "PRICING_POLICY",

        target:
          historicalTarget,

        issuedAt,

        sequence:
          2,

        payload:
          portablePayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    console.log(
      "PASS: signed historical-target PRICING_POLICY package created",
    );


    // ========================================================
    // PRE-STATE
    // ========================================================

    const before =
      await readFinoraControlStore();

    assert(
      before.success &&
        before.data,
      before.error ??
        "Unable to read initial Pricing Control Store.",
    );

    const beforeJson =
      JSON.stringify(
        before.data,
      );

    const nativeSequencesBefore =
      JSON.stringify(
        before.data.controlSequences ??
          [],
      );


    // ========================================================
    // NATIVE LANE MUST REJECT HISTORICAL TARGET
    // ========================================================

    const nativeHistoricalResult =
      await applyFinoraSignedPricingPolicyPackage(
        portableHistoricalPackage,
        trustedKeys,
        new Date(
          issuedAt,
        ),
      );

    expectFailure(
      "historical-target PRICING_POLICY rejected by native lane",
      nativeHistoricalResult,
      "TARGET_MISMATCH",
    );

    const afterNativeReject =
      await readFinoraControlStore();

    assert(
      afterNativeReject.success &&
        afterNativeReject.data,
      afterNativeReject.error ??
        "Unable to read Control Store after native Pricing rejection.",
    );

    assert(
      JSON.stringify(
        afterNativeReject.data,
      ) ===
        beforeJson,
      "Native historical-target Pricing rejection mutated Control Store.",
    );

    console.log(
      "PASS: native PRICING_POLICY lane remains exact-current-device only",
    );


    // ========================================================
    // PORTABLE LANE ACCEPTS SAME HISTORICAL TARGET
    // ========================================================

    const portableApplyResult =
      await applyFinoraSignedPortablePricingPolicyPackage(
        portableHistoricalPackage,
        trustedKeys,
        new Date(
          issuedAt,
        ),
      );

    expectSuccess(
      "historical-target PRICING_POLICY accepted by portable lane",
      portableApplyResult,
    );

    const afterPortableApply =
      await readFinoraControlStore();

    assert(
      afterPortableApply.success &&
        afterPortableApply.data,
      afterPortableApply.error ??
        "Unable to read Control Store after portable Pricing apply.",
    );

    const persistedPolicy =
      afterPortableApply.data.pricingPolicies
        ?.find(
          (
            item,
          ) =>
            item.overrideSetId ===
              overrideSetId,
        );

    assert(
      persistedPolicy !==
        undefined,
      "Portable PRICING_POLICY was not persisted.",
    );

    assert(
      persistedPolicy.ownerId ===
        scope.ownerId &&
      persistedPolicy.businessId ===
        scope.businessId &&
      persistedPolicy.branchId ===
        scope.branchId &&
      persistedPolicy.installationId ===
        historicalTarget.installationId &&
      persistedPolicy.bindingKeyId ===
        historicalTarget.bindingKeyId &&
      persistedPolicy.fingerprintAlgorithm ===
        historicalTarget.fingerprintAlgorithm &&
      persistedPolicy.publicKeyFingerprint ===
        historicalTarget.publicKeyFingerprint,
      "Portable PRICING_POLICY did not preserve signed historical installation provenance.",
    );

    console.log(
      "PASS: signed historical PRICING_POLICY installation provenance persisted exactly",
    );

    assert(
      persistedPolicy.overrides.length ===
        1 &&
      persistedPolicy.overrides[0]?.amount ===
        7,
      "Portable PRICING_POLICY trusted override was not persisted.",
    );

    console.log(
      "PASS: portable PRICING_POLICY override persisted",
    );

    assert(
      afterPortableApply.data.installation
        ?.installationId ===
        nativeBinding.installationId,
      "Portable PRICING_POLICY apply rebound current recipient installation identity.",
    );

    console.log(
      "PASS: current recipient installation identity remained unchanged",
    );

    const replayRecord =
      afterPortableApply.data.appliedControlPackages
        ?.find(
          (
            item,
          ) =>
            item.packageId ===
              portableHistoricalPackage.packageId,
        );

    assert(
      replayRecord?.installationId ===
        historicalTarget.installationId &&
      replayRecord.ownerId ===
        scope.ownerId &&
      replayRecord.businessId ===
        scope.businessId &&
      replayRecord.branchId ===
        scope.branchId,
      "Portable PRICING_POLICY replay evidence did not preserve signed historical target.",
    );

    console.log(
      "PASS: global replay evidence preserves historical PRICING_POLICY installation target",
    );

    const portableSequenceRecord =
      afterPortableApply.data.portablePricingPolicySequences
        ?.find(
          (
            item,
          ) =>
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
      portableSequenceRecord?.lastSequence ===
        2,
      "Portable PRICING_POLICY branch sequence high-water was not advanced.",
    );

    console.log(
      "PASS: dedicated portable PRICING_POLICY branch sequence advanced",
    );

    assert(
      JSON.stringify(
        afterPortableApply.data.controlSequences ??
          [],
      ) ===
        nativeSequencesBefore,
      "Portable PRICING_POLICY apply mutated native installation-scoped controlSequences.",
    );

    console.log(
      "PASS: portable PRICING_POLICY did not mutate native controlSequences",
    );


    // ========================================================
    // NEGATIVE MATRIX BASELINE
    // ========================================================

    const portableNegativeBaseline =
      await readFinoraControlStore();

    assert(
      portableNegativeBaseline.success &&
        portableNegativeBaseline.data,
      portableNegativeBaseline.error ??
        "Unable to read portable Pricing negative baseline.",
    );

    const portableNegativeBaselineJson =
      JSON.stringify(
        portableNegativeBaseline.data,
      );


    // ========================================================
    // PACKAGE-ID REPLAY
    // ========================================================

    const replayResult =
      await applyFinoraSignedPortablePricingPolicyPackage(
        portableHistoricalPackage,
        trustedKeys,
        new Date(
          issuedAt,
        ),
      );

    expectFailure(
      "portable PRICING_POLICY packageId replay rejected",
      replayResult,
    );


    // ========================================================
    // EQUAL SEQUENCE
    // ========================================================

    const equalIssuedAt =
      new Date(
        now.getTime() +
          6 *
            60 *
            1000,
      ).toISOString();

    const equalPayload =
      createPricingPayload(
        scope,
        historicalBinding,
        equalIssuedAt,
        overrideSetId,
        [
          createRule({
            overrideId:
              "PRICING-OVERRIDE-PORTABLE-EQUAL",

            chargeCode:
              "LOAN_DISBURSEMENT",

            amount:
              8,

            validFrom,

            validUntil,
          }),
        ],
      );

    const equalPackage =
      createSignedPackage({
        packageId:
          "PACKAGE-PRICING-PORTABLE-EQUAL-SEQUENCE",

        purpose:
          "PRICING_POLICY",

        target:
          historicalTarget,

        issuedAt:
          equalIssuedAt,

        sequence:
          2,

        payload:
          equalPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const equalResult =
      await applyFinoraSignedPortablePricingPolicyPackage(
        equalPackage,
        trustedKeys,
        new Date(
          equalIssuedAt,
        ),
      );

    expectFailure(
      "equal portable PRICING_POLICY sequence rejected",
      equalResult,
    );


    // ========================================================
    // STALE SEQUENCE
    // ========================================================

    const staleIssuedAt =
      new Date(
        now.getTime() +
          7 *
            60 *
            1000,
      ).toISOString();

    const stalePayload =
      createPricingPayload(
        scope,
        historicalBinding,
        staleIssuedAt,
        overrideSetId,
        [
          createRule({
            overrideId:
              "PRICING-OVERRIDE-PORTABLE-STALE",

            chargeCode:
              "LOAN_DISBURSEMENT",

            amount:
              9,

            validFrom,

            validUntil,
          }),
        ],
      );

    const stalePackage =
      createSignedPackage({
        packageId:
          "PACKAGE-PRICING-PORTABLE-STALE-SEQUENCE",

        purpose:
          "PRICING_POLICY",

        target:
          historicalTarget,

        issuedAt:
          staleIssuedAt,

        sequence:
          1,

        payload:
          stalePayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const staleResult =
      await applyFinoraSignedPortablePricingPolicyPackage(
        stalePackage,
        trustedKeys,
        new Date(
          staleIssuedAt,
        ),
      );

    expectFailure(
      "stale portable PRICING_POLICY sequence rejected",
      staleResult,
    );


    // ========================================================
    // WRONG BRANCH
    // ========================================================

    const wrongBranchIssuedAt =
      new Date(
        now.getTime() +
          8 *
            60 *
            1000,
      ).toISOString();

    const wrongBranchScope:
      SelfTestScope = {
        ...scope,

        branchId:
          "BRANCH-PRICING-PORTABLE-WRONG",
      };

    const wrongBranchTarget:
      SelfTestPackageTarget = {
        ...historicalTarget,

        branchId:
          wrongBranchScope.branchId,
      };

    const wrongBranchPayload =
      createPricingPayload(
        wrongBranchScope,
        historicalBinding,
        wrongBranchIssuedAt,
        overrideSetId,
        [
          createRule({
            overrideId:
              "PRICING-OVERRIDE-PORTABLE-WRONG-BRANCH",

            chargeCode:
              "LOAN_DISBURSEMENT",

            amount:
              10,

            validFrom,

            validUntil,
          }),
        ],
      );

    const wrongBranchPackage =
      createSignedPackage({
        packageId:
          "PACKAGE-PRICING-PORTABLE-WRONG-BRANCH",

        purpose:
          "PRICING_POLICY",

        target:
          wrongBranchTarget,

        issuedAt:
          wrongBranchIssuedAt,

        sequence:
          3,

        payload:
          wrongBranchPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const wrongBranchResult =
      await applyFinoraSignedPortablePricingPolicyPackage(
        wrongBranchPackage,
        trustedKeys,
        new Date(
          wrongBranchIssuedAt,
        ),
      );

    expectFailure(
      "portable PRICING_POLICY wrong branch rejected",
      wrongBranchResult,
      "TARGET_MISMATCH",
    );


    // ========================================================
    // VALID SIGNATURE, PAYLOAD / HISTORICAL TARGET MISMATCH
    // ========================================================

    const mismatchIssuedAt =
      new Date(
        now.getTime() +
          9 *
            60 *
            1000,
      ).toISOString();

    const mismatchFingerprint =
      "cd".repeat(
        32,
      );

    const mismatchBinding:
      SelfTestBindingTarget = {

        installationId:
          "INSTALLATION-PRICING-MISMATCH-000001",

        bindingKeyId:
          `FINORA-BINDING-${mismatchFingerprint
            .slice(
              0,
              32,
            )
            .toUpperCase()}`,

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          mismatchFingerprint,

        schemaVersion:
          1,
      };

    const mismatchPayload =
      createPricingPayload(
        scope,
        mismatchBinding,
        mismatchIssuedAt,
        overrideSetId,
        [
          createRule({
            overrideId:
              "PRICING-OVERRIDE-PORTABLE-BINDING-MISMATCH",

            chargeCode:
              "LOAN_DISBURSEMENT",

            amount:
              11,

            validFrom,

            validUntil,
          }),
        ],
      );

    const mismatchPackage =
      createSignedPackage({
        packageId:
          "PACKAGE-PRICING-PORTABLE-BINDING-MISMATCH",

        purpose:
          "PRICING_POLICY",

        target:
          historicalTarget,

        issuedAt:
          mismatchIssuedAt,

        sequence:
          3,

        payload:
          mismatchPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const mismatchResult =
      await applyFinoraSignedPortablePricingPolicyPackage(
        mismatchPackage,
        trustedKeys,
        new Date(
          mismatchIssuedAt,
        ),
      );

    expectFailure(
      "valid-signature PRICING_POLICY payload historical-binding mismatch rejected",
      mismatchResult,
      "signed installation binding does not match the verified package target",
    );


    // ========================================================
    // TAMPERED SIGNATURE
    // ========================================================

    const tamperedPackage = {
      ...equalPackage,

      packageId:
        "PACKAGE-PRICING-PORTABLE-TAMPERED",

      signature: {
        ...equalPackage.signature,

        value:
          Buffer.alloc(
            64,
          ).toString(
            "base64",
          ),
      },
    };

    const tamperedResult =
      await applyFinoraSignedPortablePricingPolicyPackage(
        tamperedPackage,
        trustedKeys,
        new Date(
          equalIssuedAt,
        ),
      );

    expectFailure(
      "tampered portable PRICING_POLICY signature rejected",
      tamperedResult,
      "INVALID_SIGNATURE",
    );


    // ========================================================
    // EVERY REJECTED PORTABLE CASE MUST BE ZERO-MUTATION
    // ========================================================

    const portableNegativeFinal =
      await readFinoraControlStore();

    assert(
      portableNegativeFinal.success &&
        portableNegativeFinal.data,
      portableNegativeFinal.error ??
        "Unable to read final portable Pricing negative state.",
    );

    assert(
      JSON.stringify(
        portableNegativeFinal.data,
      ) ===
        portableNegativeBaselineJson,
      "Rejected portable PRICING_POLICY matrix mutated authoritative Control Store.",
    );

    console.log(
      "PASS: rejected portable PRICING_POLICY matrix left entire Control Store unchanged",
    );


    // ========================================================
    // EMPTY AUTHORITATIVE REPLACE -> BASE PRICING
    // ========================================================

    const emptyIssuedAt =
      new Date(
        now.getTime() +
          10 *
            60 *
            1000,
      ).toISOString();

    const emptyPayload =
      createPricingPayload(
        scope,
        historicalBinding,
        emptyIssuedAt,
        overrideSetId,
        [],
      );

    const emptyPackage =
      createSignedPackage({
        packageId:
          "PACKAGE-PRICING-PORTABLE-EMPTY-REPLACE",

        purpose:
          "PRICING_POLICY",

        target:
          historicalTarget,

        issuedAt:
          emptyIssuedAt,

        sequence:
          3,

        payload:
          emptyPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const emptyResult =
      await applyFinoraSignedPortablePricingPolicyPackage(
        emptyPackage,
        trustedKeys,
        new Date(
          emptyIssuedAt,
        ),
      );

    expectSuccess(
      "empty portable PRICING_POLICY REPLACE accepted",
      emptyResult,
    );

    const finalStore =
      await readFinoraControlStore();

    assert(
      finalStore.success &&
        finalStore.data,
      finalStore.error ??
        "Unable to read final portable Pricing state.",
    );

    const finalPolicy =
      finalStore.data.pricingPolicies
        ?.find(
          (
            item,
          ) =>
            item.overrideSetId ===
              overrideSetId,
        );

    assert(
      finalPolicy !==
        undefined &&
      finalPolicy.overrides.length ===
        0,
      "Empty portable PRICING_POLICY REPLACE did not restore Base Pricing schedule.",
    );

    assert(
      finalPolicy.installationId ===
        historicalTarget.installationId &&
      finalPolicy.bindingKeyId ===
        historicalTarget.bindingKeyId &&
      finalPolicy.publicKeyFingerprint ===
        historicalTarget.publicKeyFingerprint,
      "Empty portable Pricing REPLACE changed historical installation provenance.",
    );

    const finalPortableSequence =
      finalStore.data.portablePricingPolicySequences
        ?.find(
          (
            item,
          ) =>
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
      finalPortableSequence?.lastSequence ===
        3,
      "Empty portable Pricing REPLACE did not advance branch sequence to 3.",
    );

    assert(
      JSON.stringify(
        finalStore.data.controlSequences ??
          [],
      ) ===
        nativeSequencesBefore,
      "Portable empty Pricing REPLACE mutated native controlSequences.",
    );

    assert(
      finalStore.data.installation
        ?.installationId ===
        nativeBinding.installationId,
      "Portable empty Pricing REPLACE rebound current installation.",
    );

    console.log(
      "PASS: empty authoritative portable PRICING_POLICY REPLACE restored Base Pricing schedule",
    );

    console.log(
      "PASS: empty portable REPLACE preserved historical provenance and native recipient identity",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA PORTABLE PRICING_POLICY COORDINATOR-TO-RECIPIENT E2E SELFTEST",
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

      if (
        failure ===
          undefined
      ) {
        failure =
          cleanupError;
      }
    }
  }

  if (
    failure !==
      undefined
  ) {
    throw failure;
  }
}


// ============================================================
// EXECUTE
// ============================================================

void runSelfTest()
  .then(
    () => {

      console.log(
        "PASS: portable PRICING_POLICY portability self-test process exiting with code 0",
      );

      app.quit();
    },
  )
  .catch(
    (
      error:
        unknown,
    ) => {

      console.error(
        error,
      );

      process.exitCode =
        1;

      app.quit();
    },
  );


// ============================================================
// END
// ============================================================