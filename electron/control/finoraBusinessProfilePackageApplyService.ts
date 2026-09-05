// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL PLANE
// SIGNED BUSINESS PROFILE PACKAGE APPLY SERVICE
//
// RESPONSIBILITY:
//
// - Resolve authoritative Control Store installation identity
// - Resolve authoritative Windows native binding identity
// - Cryptographically verify signed BUSINESS_PROFILE package
// - Enforce exact signed package target
// - Validate BUSINESS_PROFILE payload structure and timestamps
// - Enforce exact payload/native installation binding
// - Convert signed profile payload to trusted Control Store DTO
// - Delegate persistence to serialized verified atomic apply
//
// IMPORTANT:
//
// - MAIN PROCESS TRUSTED BOUNDARY.
// - No signing authority.
// - No private-key access.
// - No Business Date.
// - No operational Business / Branch settings mutation.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  FinoraControlBusinessProfile,
  FinoraControlStoreResult,
  FinoraVerifiedBusinessProfileApplyResult,
} from "./finoraControlStore.js";

import {
  applyFinoraVerifiedBusinessProfileState,
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

function failure(
  error:
    string,
): FinoraControlStoreResult<
  FinoraVerifiedBusinessProfileApplyResult
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

export async function applyFinoraSignedBusinessProfilePackage(
  signedPackage:
    unknown,

  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[],

  now:
    Date = new Date(),
): Promise<
  FinoraControlStoreResult<
    FinoraVerifiedBusinessProfileApplyResult
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
      "FINORA installation identity is required before applying a Business Profile.",
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
      "FINORA Windows native installation binding is required before applying a Business Profile.",
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
      "BUSINESS_PROFILE"
  ) {
    return failure(
      "FINORA signed package purpose must be BUSINESS_PROFILE.",
    );
  }

  if (
    controlPackage.payloadVersion !==
      1
  ) {
    return failure(
      "FINORA Business Profile payloadVersion must be 1.",
    );
  }


  // ----------------------------------------------------------
  // PAYLOAD ROOT
  // ----------------------------------------------------------

  const payload =
    controlPackage.payload;

  if (
    !isRecord(
      payload,
    ) ||
    payload.schemaVersion !==
      1 ||
    (
      payload.action !==
        "ISSUE" &&
      payload.action !==
        "REPLACE"
    ) ||
    !isRecord(
      payload.profile,
    ) ||
    !isRecord(
      payload.installationBinding,
    )
  ) {
    return failure(
      "FINORA signed BUSINESS_PROFILE payload is invalid.",
    );
  }


  // ----------------------------------------------------------
  // PAYLOAD / PACKAGE ISSUANCE TIME
  // ----------------------------------------------------------

  const payloadIssuedAt =
    parseCanonicalTimestamp(
      payload.issuedAt,
    );

  const packageIssuedAt =
    parseCanonicalTimestamp(
      controlPackage.issuedAt,
    );

  if (
    payloadIssuedAt ===
      undefined ||
    packageIssuedAt ===
      undefined ||
    payload.issuedAt !==
      controlPackage.issuedAt
  ) {
    return failure(
      "FINORA Business Profile payload and package issuedAt timestamps must match exactly.",
    );
  }


  // ----------------------------------------------------------
  // PROFILE STRUCTURE
  // ----------------------------------------------------------

  const profile =
    payload.profile;

  if (
    !isNonEmptyString(
      profile.profileId,
    ) ||
    !isNonEmptyString(
      profile.ownerId,
    ) ||
    !isNonEmptyString(
      profile.businessId,
    ) ||
    !isNonEmptyString(
      profile.branchId,
    ) ||
    !isNonEmptyString(
      profile.businessCode,
    ) ||
    !isNonEmptyString(
      profile.branchCode,
    ) ||
    !isNonEmptyString(
      profile.businessName,
    ) ||
    !isNonEmptyString(
      profile.branchName,
    ) ||
    profile.schemaVersion !==
      1
  ) {
    return failure(
      "FINORA signed Business Profile identity is invalid.",
    );
  }

  const profileCreatedAtValue =
    profile.createdAt;

  const profileUpdatedAtValue =
    profile.updatedAt;

  if (
    !isNonEmptyString(
      profileCreatedAtValue,
    ) ||
    !isNonEmptyString(
      profileUpdatedAtValue,
    )
  ) {
    return failure(
      "FINORA Business Profile audit timestamps are invalid for this signed package.",
    );
  }

  const profileCreatedAt =
    parseCanonicalTimestamp(
      profileCreatedAtValue,
    );

  const profileUpdatedAt =
    parseCanonicalTimestamp(
      profileUpdatedAtValue,
    );

  if (
    profileCreatedAt ===
      undefined ||
    profileUpdatedAt ===
      undefined ||
    profileUpdatedAt <
      profileCreatedAt ||
    profileUpdatedAt >
      payloadIssuedAt
  ) {
    return failure(
      "FINORA Business Profile audit timestamps are invalid for this signed package.",
    );
  }


  // ----------------------------------------------------------
  // PROFILE IDENTITY ↔ SIGNED PACKAGE TARGET
  // ----------------------------------------------------------

  if (
    profile.ownerId !==
      controlPackage.target.ownerId ||
    profile.businessId !==
      controlPackage.target.businessId ||
    profile.branchId !==
      controlPackage.target.branchId ||
    profile.ownerId !==
      installation.ownerId ||
    profile.businessId !==
      installation.businessId ||
    profile.branchId !==
      installation.branchId
  ) {
    return failure(
      "FINORA Business Profile identity does not match the verified package target.",
    );
  }


  // ----------------------------------------------------------
  // SIGNED PAYLOAD INSTALLATION BINDING
  // ----------------------------------------------------------

  const payloadBinding =
    payload.installationBinding;

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
      "FINORA BUSINESS_PROFILE installation binding is invalid.",
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
      "FINORA BUSINESS_PROFILE native installation binding does not match the verified package target.",
    );
  }


  // ----------------------------------------------------------
  // TRUSTED CONTROL STORE DTO
  //
  // The signed domain profile intentionally carries business
  // identity only. Native installation binding is attached here
  // after exact cryptographic target verification.
  // ----------------------------------------------------------

  const controlProfile:
    FinoraControlBusinessProfile = {

      profileId:
        profile.profileId,

      ownerId:
        profile.ownerId,

      businessId:
        profile.businessId,

      branchId:
        profile.branchId,

      businessCode:
        profile.businessCode,

      branchCode:
        profile.branchCode,

      businessName:
        profile.businessName,

      branchName:
        profile.branchName,

      installationId:
        payloadBinding.installationId,

      bindingKeyId:
        payloadBinding.bindingKeyId,

      fingerprintAlgorithm:
        "SHA-256",

      publicKeyFingerprint:
        payloadBinding.publicKeyFingerprint,

      createdAt:
        profileCreatedAtValue,

      updatedAt:
        profileUpdatedAtValue,

      schemaVersion:
        1,
    };


  // ----------------------------------------------------------
  // SERIALIZED REPLAY/SEQUENCE-SAFE ATOMIC APPLY
  // ----------------------------------------------------------

  return applyFinoraVerifiedBusinessProfileState({
    packageId:
      controlPackage.packageId,

    issuerId:
      controlPackage.issuer.issuerId,

    purpose:
      "BUSINESS_PROFILE",

    sequence:
      controlPackage.sequence,

    action:
      payload.action,

    target: {
      ownerId:
        controlPackage.target.ownerId,

      businessId:
        controlPackage.target.businessId,

      branchId:
        controlPackage.target.branchId,

      installationId:
        nativeBinding.installationId,
    },

    profile:
      controlProfile,

    appliedAt:
      now.toISOString(),
  });
}

// ============================================================
// END
// ============================================================