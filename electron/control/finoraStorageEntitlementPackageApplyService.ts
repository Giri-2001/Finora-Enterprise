// ============================================================
// FINORA ENTERPRISE OS™
//
// ELECTRON CONTROL
// VERIFIED STORAGE ENTITLEMENT PACKAGE APPLY SERVICE
//
// RESPONSIBILITY:
//
// - Resolve authoritative installed branch identity
// - Resolve safeStorage-backed native installation binding
// - Verify Control Center ECDSA P-256 signature
// - Require purpose = STORAGE_ENTITLEMENT
// - Verify payload / signed target / native binding equality
// - Send only verified entitlement state to atomic Control Store
//
// SECURITY:
//
// - MAIN PROCESS ONLY.
// - PUBLIC verification only.
// - No private key.
// - No signing.
// - No renderer IPC.
// - No Business Date.
// - USB volume identity is not licensing authority.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  applyFinoraVerifiedStorageEntitlementState,
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraControlStorageEntitlement,
  FinoraControlStoreResult,
  FinoraVerifiedStorageEntitlementApplyResult,
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

function isNativeBindingIdentityValid(
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

function isStorageEntitlement(
  value:
    unknown,
): value is FinoraControlStorageEntitlement {

  if (!isRecord(value)) {
    return false;
  }

  if (
    !isNonEmptyString(
      value.entitlementId,
    ) ||
    !isNonEmptyString(
      value.userId,
    ) ||
    !isNonEmptyString(
      value.ownerId,
    ) ||
    !isNonEmptyString(
      value.businessId,
    ) ||
    !isNonEmptyString(
      value.branchId,
    ) ||
    !isNonEmptyString(
      value.installationId,
    ) ||
    !isNativeBindingIdentityValid(
      value.bindingKeyId,
      value.fingerprintAlgorithm,
      value.publicKeyFingerprint,
    ) ||
    (
      value.storageMode !==
        "LOCAL" &&
      value.storageMode !==
        "USB"
    ) ||
    (
      value.status !==
        "ACTIVE" &&
      value.status !==
        "SUSPENDED" &&
      value.status !==
        "REVOKED"
    ) ||
    value.schemaVersion !==
      1
  ) {
    return false;
  }

  const activatedAt =
    parseCanonicalTimestamp(
      value.activatedAt,
    );

  const createdAt =
    parseCanonicalTimestamp(
      value.createdAt,
    );

  const updatedAt =
    parseCanonicalTimestamp(
      value.updatedAt,
    );

  return (
    activatedAt !==
      undefined &&
    createdAt !==
      undefined &&
    updatedAt !==
      undefined &&
    createdAt <=
      activatedAt &&
    activatedAt <=
      updatedAt
  );
}

function failure(
  error:
    string,
): FinoraControlStoreResult<
  FinoraVerifiedStorageEntitlementApplyResult
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

export async function applyFinoraSignedStorageEntitlementPackage(
  signedPackage:
    unknown,

  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[],

  now:
    Date = new Date(),
): Promise<
  FinoraControlStoreResult<
    FinoraVerifiedStorageEntitlementApplyResult
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
      "FINORA installation identity is required before applying a Storage Entitlement.",
    );
  }


  // ----------------------------------------------------------
  // AUTHORITATIVE NATIVE INSTALLATION BINDING
  // ----------------------------------------------------------

  const nativeBinding =
    await getFinoraWindowsInstallationBinding();

  if (!nativeBinding) {
    return failure(
      "FINORA Windows native installation binding is required before applying a Storage Entitlement.",
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
  // SIGNATURE + EXACT TARGET
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
      "STORAGE_ENTITLEMENT"
  ) {
    return failure(
      "FINORA signed package purpose must be STORAGE_ENTITLEMENT.",
    );
  }

  if (
    controlPackage.payloadVersion !==
      1
  ) {
    return failure(
      "FINORA Storage Entitlement payloadVersion must be 1.",
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
    !isStorageEntitlement(
      payload.entitlement,
    )
  ) {
    return failure(
      "FINORA signed Storage Entitlement payload is invalid.",
    );
  }

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
      "FINORA Storage Entitlement payload and package issuedAt timestamps must match.",
    );
  }

  const entitlement =
    payload.entitlement;

  const entitlementUpdatedAt =
    parseCanonicalTimestamp(
      entitlement.updatedAt,
    );

  if (
    entitlementUpdatedAt ===
      undefined ||
    entitlementUpdatedAt >
      payloadIssuedAt
  ) {
    return failure(
      "FINORA Storage Entitlement update timestamp cannot be later than package issuance.",
    );
  }


  // ----------------------------------------------------------
  // PAYLOAD <-> SIGNED TARGET <-> NATIVE BINDING
  // ----------------------------------------------------------

  if (
    entitlement.ownerId !==
      controlPackage.target.ownerId ||
    entitlement.businessId !==
      controlPackage.target.businessId ||
    entitlement.branchId !==
      controlPackage.target.branchId ||
    entitlement.installationId !==
      controlPackage.target.installationId ||
    entitlement.bindingKeyId !==
      controlPackage.target.bindingKeyId ||
    entitlement.fingerprintAlgorithm !==
      controlPackage.target.fingerprintAlgorithm ||
    entitlement.publicKeyFingerprint !==
      controlPackage.target.publicKeyFingerprint ||
    entitlement.installationId !==
      nativeBinding.installationId ||
    entitlement.bindingKeyId !==
      nativeBinding.bindingKeyId ||
    entitlement.fingerprintAlgorithm !==
      nativeBinding.fingerprintAlgorithm ||
    entitlement.publicKeyFingerprint !==
      nativeBinding.publicKeyFingerprint
  ) {
    return failure(
      "FINORA Storage Entitlement payload does not match the signed native installation target.",
    );
  }


  // ----------------------------------------------------------
  // REPLAY-PROTECTED ATOMIC APPLY
  // ----------------------------------------------------------

  return applyFinoraVerifiedStorageEntitlementState({
    packageId:
      controlPackage.packageId,

    issuerId:
      controlPackage.issuer.issuerId,

    purpose:
      "STORAGE_ENTITLEMENT",

    sequence:
      controlPackage.sequence,

    target: {
      ownerId:
        controlPackage.target.ownerId,

      businessId:
        controlPackage.target.businessId,

      branchId:
        controlPackage.target.branchId,

      installationId:
        controlPackage.target.installationId,

      bindingKeyId:
        controlPackage.target.bindingKeyId,

      fingerprintAlgorithm:
        controlPackage.target.fingerprintAlgorithm,

      publicKeyFingerprint:
        controlPackage.target.publicKeyFingerprint,
    },

    entitlement,

    appliedAt:
      now.toISOString(),
  });
}

// ============================================================
// END
// ============================================================