// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL PLANE
// SIGNED PRICING POLICY PACKAGE APPLY SERVICE
//
// RESPONSIBILITY:
//
// - Resolve authoritative Control Store installation identity
// - Resolve authoritative Windows native binding identity
// - Cryptographically verify signed PRICING_POLICY package
// - Enforce exact signed package target
// - Validate PRICING_POLICY payload structure and timestamps
// - Enforce exact payload/native installation binding
// - Convert signed Pricing Policy payload to trusted Store DTO
// - Delegate semantic validation, replay and persistence to the
//   hardened FINORA Control Store
//
// IMPORTANT:
//
// - MAIN PROCESS TRUSTED BOUNDARY.
// - No signing authority.
// - No private-key access.
// - No Business Date.
// - No Pricing catalog duplication.
// - No renderer write API.
// - Base-enabled charge authority remains in Control Store.
// - Persistence remains serialized and atomic in Control Store.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  FinoraControlPricingOverrideRule,
  FinoraControlPricingPolicy,
  FinoraControlStoreResult,
  FinoraVerifiedPricingPolicyApplyResult,
} from "./finoraControlStore.js";

import {
  applyFinoraVerifiedPricingPolicyState,
  readFinoraControlStore,
} from "./finoraControlStore.js";

import {
  verifyFinoraSignedControlPackageNative,
} from "./finoraSignedControlPackageVerifier.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";


// ============================================================
// HELPERS
// ============================================================

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {

  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function isNonEmptyString(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function isSha256Fingerprint(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    /^[0-9a-f]{64}$/.test(
      value,
    )
  );
}

function parseCanonicalTimestamp(
  value:
    unknown,
): number | undefined {

  if (!isNonEmptyString(value)) {
    return undefined;
  }

  const parsed =
    Date.parse(
      value,
    );

  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    return undefined;
  }

  if (
    new Date(
      parsed,
    ).toISOString() !==
      value
  ) {
    return undefined;
  }

  return parsed;
}

function bindingIdentityIsValid(
  bindingKeyId:
    unknown,

  fingerprintAlgorithm:
    unknown,

  publicKeyFingerprint:
    unknown,
): boolean {

  if (
    !isNonEmptyString(
      bindingKeyId,
    ) ||
    fingerprintAlgorithm !==
      "SHA-256" ||
    !isSha256Fingerprint(
      publicKeyFingerprint,
    )
  ) {
    return false;
  }

  const expectedBindingKeyId =
    `FINORA-BINDING-${publicKeyFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  return (
    bindingKeyId ===
      expectedBindingKeyId
  );
}


/**
 * Structural mapper only.
 *
 * This deliberately does NOT own the canonical Pricing catalog
 * or decide which canonical charge codes are enabled.
 *
 * Hardened semantic acceptance remains authoritative inside
 * finoraControlStore.ts -> isPricingPolicy(...).
 */
function toControlPricingOverrideRule(
  value:
    unknown,
): FinoraControlPricingOverrideRule | undefined {

  if (!isRecord(value)) {
    return undefined;
  }

  const validity =
    value.validity;

  if (!isRecord(validity)) {
    return undefined;
  }

  const validFrom =
    validity.validFrom;

  const validUntil =
    validity.validUntil;

  const parsedValidFrom =
    parseCanonicalTimestamp(
      validFrom,
    );

  const parsedValidUntil =
    parseCanonicalTimestamp(
      validUntil,
    );

  if (
    !isNonEmptyString(
      value.overrideId,
    ) ||
    !isNonEmptyString(
      value.chargeCode,
    ) ||
    value.model !==
      "FIXED_PRICE_OVERRIDE" ||
    typeof value.amount !==
      "number" ||
    !Number.isFinite(
      value.amount,
    ) ||
    value.amount <=
      0 ||
    value.currency !==
      "INR" ||
    !isNonEmptyString(
      validFrom,
    ) ||
    !isNonEmptyString(
      validUntil,
    ) ||
    parsedValidFrom ===
      undefined ||
    parsedValidUntil ===
      undefined ||
    parsedValidUntil <=
      parsedValidFrom ||
    value.schemaVersion !==
      1
  ) {
    return undefined;
  }

  return {
    overrideId:
      value.overrideId,

    chargeCode:
      value.chargeCode as
        FinoraControlPricingOverrideRule["chargeCode"],

    model:
      "FIXED_PRICE_OVERRIDE",

    amount:
      value.amount,

    currency:
      "INR",

    validFrom,

    validUntil,

    schemaVersion:
      1,
  };
}

function failure(
  error:
    string,
): FinoraControlStoreResult<
  FinoraVerifiedPricingPolicyApplyResult
> {

  return {
    success:
      false,

    error,
  };
}


// ============================================================
// APPLY
// ============================================================

export async function applyFinoraSignedPricingPolicyPackage(
  signedPackage:
    unknown,

  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[],

  now:
    Date = new Date(),
): Promise<
  FinoraControlStoreResult<
    FinoraVerifiedPricingPolicyApplyResult
  >
> {

  // ----------------------------------------------------------
  // AUTHORITATIVE CONTROL STORE INSTALLATION
  // ----------------------------------------------------------

  const storeResult =
    await readFinoraControlStore();

  if (
    !storeResult.success ||
    !storeResult.data
  ) {
    return failure(
      storeResult.error ??
        "Unable to load the FINORA Control Store.",
    );
  }

  const installation =
    storeResult.data.installation;

  if (!installation) {
    return failure(
      "FINORA installation identity is required before applying a Pricing Policy.",
    );
  }


  // ----------------------------------------------------------
  // AUTHORITATIVE WINDOWS NATIVE BINDING
  // ----------------------------------------------------------

  let nativeBinding;

  try {

    nativeBinding =
      await getFinoraWindowsInstallationBinding();

  } catch (error) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to load the FINORA Windows native installation binding.",
    );
  }

  if (!nativeBinding) {
    return failure(
      "FINORA Windows native installation binding is required before applying a Pricing Policy.",
    );
  }

  if (
    nativeBinding.installationId !==
      installation.installationId
  ) {
    return failure(
      "FINORA native installation binding does not match the Control Store installation identity.",
    );
  }


  // ----------------------------------------------------------
  // CRYPTOGRAPHIC SIGNATURE + EXACT TARGET VERIFICATION
  // ----------------------------------------------------------

  const verification =
    verifyFinoraSignedControlPackageNative(
      signedPackage,
      trustedKeys,
      {
        ownerId:
          installation.ownerId,

        businessId:
          installation.businessId,

        branchId:
          installation.branchId,

        installationId:
          nativeBinding.installationId,

        bindingKeyId:
          nativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          nativeBinding.fingerprintAlgorithm,

        publicKeyFingerprint:
          nativeBinding.publicKeyFingerprint,
      },
      now,
    );

  if (!verification.valid) {
    return failure(
      `${verification.reason}: ${verification.error}`,
    );
  }

  const controlPackage =
    verification.controlPackage;


  // ----------------------------------------------------------
  // PURPOSE / PAYLOAD VERSION
  // ----------------------------------------------------------

  if (
    controlPackage.purpose !==
      "PRICING_POLICY"
  ) {
    return failure(
      "FINORA signed package purpose must be PRICING_POLICY.",
    );
  }

  if (
    controlPackage.payloadVersion !==
      1
  ) {
    return failure(
      "FINORA Pricing Policy payloadVersion must be 1.",
    );
  }


  // ----------------------------------------------------------
  // PAYLOAD ROOT
  // ----------------------------------------------------------

  const payload =
    controlPackage.payload;

  if (!isRecord(payload)) {
    return failure(
      "FINORA signed PRICING_POLICY payload is invalid.",
    );
  }

  const overrideSet =
    payload.overrideSet;

  const payloadBinding =
    payload.installationBinding;

  if (
    payload.schemaVersion !==
      1 ||
    payload.action !==
      "REPLACE" ||
    !isRecord(
      overrideSet,
    ) ||
    !isRecord(
      payloadBinding,
    )
  ) {
    return failure(
      "FINORA signed PRICING_POLICY payload is invalid.",
    );
  }


  // ----------------------------------------------------------
  // PAYLOAD / PACKAGE ISSUANCE TIME
  // ----------------------------------------------------------

  const payloadIssuedAt =
    payload.issuedAt;

  const parsedPayloadIssuedAt =
    parseCanonicalTimestamp(
      payloadIssuedAt,
    );

  const parsedPackageIssuedAt =
    parseCanonicalTimestamp(
      controlPackage.issuedAt,
    );

  if (
    !isNonEmptyString(
      payloadIssuedAt,
    ) ||
    parsedPayloadIssuedAt ===
      undefined ||
    parsedPackageIssuedAt ===
      undefined ||
    payloadIssuedAt !==
      controlPackage.issuedAt
  ) {
    return failure(
      "FINORA Pricing Policy payload and package issuedAt timestamps must match exactly.",
    );
  }


  // ----------------------------------------------------------
  // AUTHORITATIVE OVERRIDE SET STRUCTURE
  // ----------------------------------------------------------

  const scope =
    overrideSet.scope;

  const signedOverrides =
    overrideSet.overrides;

  if (
    overrideSet.schemaVersion !==
      1 ||
    !isNonEmptyString(
      overrideSet.overrideSetId,
    ) ||
    !isRecord(
      scope,
    ) ||
    !Array.isArray(
      signedOverrides,
    )
  ) {
    return failure(
      "FINORA signed PRICING_POLICY override set is invalid.",
    );
  }

  if (
    !isNonEmptyString(
      scope.ownerId,
    ) ||
    !isNonEmptyString(
      scope.businessId,
    ) ||
    !isNonEmptyString(
      scope.branchId,
    )
  ) {
    return failure(
      "FINORA Pricing Policy scope is invalid.",
    );
  }


  // ----------------------------------------------------------
  // POLICY SCOPE ↔ VERIFIED PACKAGE TARGET ↔ INSTALLATION
  // ----------------------------------------------------------

  if (
    scope.ownerId !==
      controlPackage.target.ownerId ||
    scope.businessId !==
      controlPackage.target.businessId ||
    scope.branchId !==
      controlPackage.target.branchId ||
    scope.ownerId !==
      installation.ownerId ||
    scope.businessId !==
      installation.businessId ||
    scope.branchId !==
      installation.branchId
  ) {
    return failure(
      "FINORA Pricing Policy scope does not match the verified package target.",
    );
  }


  // ----------------------------------------------------------
  // SIGNED PAYLOAD INSTALLATION BINDING
  // ----------------------------------------------------------

  if (
    payloadBinding.schemaVersion !==
      1 ||
    !isNonEmptyString(
      payloadBinding.installationId,
    ) ||
    !bindingIdentityIsValid(
      payloadBinding.bindingKeyId,
      payloadBinding.fingerprintAlgorithm,
      payloadBinding.publicKeyFingerprint,
    )
  ) {
    return failure(
      "FINORA PRICING_POLICY installation binding is invalid.",
    );
  }

  if (
    payloadBinding.installationId !==
      nativeBinding.installationId ||
    payloadBinding.installationId !==
      controlPackage.target.installationId ||
    payloadBinding.bindingKeyId !==
      nativeBinding.bindingKeyId ||
    payloadBinding.bindingKeyId !==
      controlPackage.target.bindingKeyId ||
    payloadBinding.fingerprintAlgorithm !==
      nativeBinding.fingerprintAlgorithm ||
    payloadBinding.fingerprintAlgorithm !==
      controlPackage.target.fingerprintAlgorithm ||
    payloadBinding.publicKeyFingerprint !==
      nativeBinding.publicKeyFingerprint ||
    payloadBinding.publicKeyFingerprint !==
      controlPackage.target.publicKeyFingerprint
  ) {
    return failure(
      "FINORA PRICING_POLICY native installation binding does not match the verified package target.",
    );
  }


  // ----------------------------------------------------------
  // SIGNED OVERRIDE RULES -> TRUSTED STRUCTURAL DTO
  //
  // Duplicate IDs, overlapping windows, canonical charge-code
  // membership and Base-enabled restrictions remain enforced
  // by the hardened Control Store Pricing Policy validator.
  // ----------------------------------------------------------

  const controlOverrides:
    FinoraControlPricingOverrideRule[] = [];

  for (
    let index = 0;
    index < signedOverrides.length;
    index += 1
  ) {

    const controlRule =
      toControlPricingOverrideRule(
        signedOverrides[
          index
        ],
      );

    if (!controlRule) {
      return failure(
        `FINORA PRICING_POLICY override rule at index ${index} is invalid.`,
      );
    }

    controlOverrides.push(
      controlRule,
    );
  }


  // ----------------------------------------------------------
  // TRUSTED CONTROL STORE DTO
  // ----------------------------------------------------------

  const controlPolicy:
    FinoraControlPricingPolicy = {

      overrideSetId:
        overrideSet.overrideSetId,

      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        scope.branchId,

      installationId:
        payloadBinding.installationId,

      bindingKeyId:
        payloadBinding.bindingKeyId as string,

      fingerprintAlgorithm:
        "SHA-256",

      publicKeyFingerprint:
        payloadBinding.publicKeyFingerprint as string,

      overrides:
        controlOverrides,

      issuedAt:
        payloadIssuedAt,

      schemaVersion:
        1,
    };


  // ----------------------------------------------------------
  // SERIALIZED REPLAY/SEQUENCE-SAFE ATOMIC APPLY
  // ----------------------------------------------------------

  return applyFinoraVerifiedPricingPolicyState({
    packageId:
      controlPackage.packageId,

    issuerId:
      controlPackage.issuer.issuerId,

    purpose:
      "PRICING_POLICY",

    sequence:
      controlPackage.sequence,

    action:
      "REPLACE",

    target: {
      ownerId:
        controlPackage.target.ownerId,

      businessId:
        controlPackage.target.businessId,

      branchId:
        controlPackage.target.branchId,

      installationId:
        nativeBinding.installationId,

      bindingKeyId:
        nativeBinding.bindingKeyId,

      fingerprintAlgorithm:
        nativeBinding.fingerprintAlgorithm,

      publicKeyFingerprint:
        nativeBinding.publicKeyFingerprint,
    },

    policy:
      controlPolicy,

    appliedAt:
      now.toISOString(),
  });
}

// ============================================================
// END
// ============================================================