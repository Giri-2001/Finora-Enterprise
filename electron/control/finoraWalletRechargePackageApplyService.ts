// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL PLANE
// SIGNED WALLET RECHARGE PACKAGE APPLY SERVICE
//
// RESPONSIBILITY:
//
// - Resolve authoritative Control Store installation identity
// - Resolve authoritative Windows native binding identity
// - Cryptographically verify signed WALLET_RECHARGE package
// - Enforce exact signed package target
// - Validate Recharge payload structure and timestamps
// - Enforce exact payload/native installation binding
// - Convert signed Recharge payload to trusted Store DTO
// - Delegate replay, sequence and persistence to Control Store
//
// IMPORTANT:
//
// - MAIN PROCESS TRUSTED BOUNDARY.
// - No signing authority.
// - No private-key access.
// - No renderer write authority.
// - No Business Date.
// - No Wallet balance mutation.
// - No payment gateway dependency.
// - verifiedAt is signed-package acceptance evidence only.
// - Wallet financial timestamps are owned by Wallet mutation.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  FinoraControlStoreResult,
  FinoraControlWalletRechargeAuthorization,
  FinoraVerifiedWalletRechargeApplyResult,
} from "./finoraControlStore.js";

import {
  applyFinoraVerifiedWalletRechargeAuthorizationState,
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

function isRechargePaymentMethod(
  value:
    unknown,
): value is FinoraControlWalletRechargeAuthorization["paymentMethod"] {

  return (
    value === "UPI" ||
    value === "PHONEPE" ||
    value === "GOOGLE_PAY" ||
    value === "PAYTM" ||
    value === "RAZORPAY" ||
    value === "BANK_TRANSFER" ||
    value === "OTHER"
  );
}

function isRechargePaymentSource(
  value:
    unknown,
): value is FinoraControlWalletRechargeAuthorization["paymentSource"] {

  return (
    value === "PHONEPE" ||
    value === "RAZORPAY" ||
    value === "UPI" ||
    value === "GOOGLE_PAY" ||
    value === "PAYTM" ||
    value === "BANK_TRANSFER" ||
    value === "MANUAL"
  );
}

function failure(
  error:
    string,
): FinoraControlStoreResult<
  FinoraVerifiedWalletRechargeApplyResult
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

export async function applyFinoraSignedWalletRechargePackage(
  signedPackage:
    unknown,

  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[],

  now:
    Date = new Date(),
): Promise<
  FinoraControlStoreResult<
    FinoraVerifiedWalletRechargeApplyResult
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
      "FINORA installation identity is required before applying a Wallet Recharge authorization.",
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
      "FINORA Windows native installation binding is required before applying a Wallet Recharge authorization.",
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
      "WALLET_RECHARGE"
  ) {
    return failure(
      "FINORA signed package purpose must be WALLET_RECHARGE.",
    );
  }

  if (
    controlPackage.payloadVersion !==
      1
  ) {
    return failure(
      "FINORA WALLET_RECHARGE payload version is unsupported.",
    );
  }

  // ----------------------------------------------------------
  // PAYLOAD STRUCTURE
  // ----------------------------------------------------------

  const payload =
    controlPackage.payload;

  if (!isRecord(payload)) {
    return failure(
      "FINORA WALLET_RECHARGE payload is malformed.",
    );
  }

  const scope =
    payload.scope;

  const payloadBinding =
    payload.installationBinding;

  if (
    !isRecord(
      scope,
    ) ||
    !isRecord(
      payloadBinding,
    )
  ) {
    return failure(
      "FINORA WALLET_RECHARGE scope or installation binding is malformed.",
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
    ) ||
    !isNonEmptyString(
      payloadBinding.installationId,
    ) ||
    !bindingIdentityIsValid(
      payloadBinding.bindingKeyId,
      payloadBinding.fingerprintAlgorithm,
      payloadBinding.publicKeyFingerprint,
    ) ||
    payloadBinding.schemaVersion !==
      1 ||
    !isNonEmptyString(
      payload.paymentReference,
    ) ||
    typeof payload.amountMinor !==
      "number" ||
    !Number.isSafeInteger(payload.amountMinor) ||
    payload.amountMinor <=
      0 ||
    payload.currency !==
      "INR" ||
    !isRechargePaymentMethod(
      payload.paymentMethod,
    ) ||
    !isRechargePaymentSource(
      payload.paymentSource,
    ) ||
    (
      payload.providerOrderId !==
        undefined &&
      !isNonEmptyString(
        payload.providerOrderId,
      )
    ) ||
    (
      payload.providerTransactionId !==
        undefined &&
      !isNonEmptyString(
        payload.providerTransactionId,
      )
    ) ||
    !isNonEmptyString(
      payload.issuedAt,
    ) ||
    payload.schemaVersion !==
      1
  ) {
    return failure(
      "FINORA WALLET_RECHARGE payload is invalid.",
    );
  }

  // ----------------------------------------------------------
  // CANONICAL ISSUANCE TIMESTAMP
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
      "FINORA WALLET_RECHARGE payload and package issuedAt timestamps must match.",
    );
  }

  // ----------------------------------------------------------
  // PAYLOAD SCOPE <-> VERIFIED PACKAGE TARGET
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
      "FINORA WALLET_RECHARGE payload scope does not match the verified branch target.",
    );
  }

  // ----------------------------------------------------------
  // PAYLOAD BINDING <-> NATIVE BINDING <-> SIGNED TARGET
  // ----------------------------------------------------------

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
      "FINORA WALLET_RECHARGE native installation binding does not match the verified package target.",
    );
  }

  // ----------------------------------------------------------
  // TRUSTED CONTROL STORE AUTHORIZATION DTO
  //
  // verifiedAt is package-acceptance evidence only.
  // It is deliberately NOT a Wallet financial timestamp.
  // ----------------------------------------------------------

  const verifiedAt =
    now.toISOString();

  const authorization:
    FinoraControlWalletRechargeAuthorization = {

      packageId:
        controlPackage.packageId,

      issuerId:
        controlPackage.issuer.issuerId,

      signingKeyId:
        controlPackage.issuer.signingKeyId,

      purpose:
        "WALLET_RECHARGE",

      sequence:
        controlPackage.sequence,

      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        scope.branchId,

      installationId:
        payloadBinding.installationId,

      bindingKeyId:
        payloadBinding.bindingKeyId,

      fingerprintAlgorithm:
        "SHA-256",

      publicKeyFingerprint:
        payloadBinding.publicKeyFingerprint,

      paymentReference:
        payload.paymentReference,

      amountMinor:
        payload.amountMinor,

      currency:
        "INR",

      paymentMethod:
        payload.paymentMethod,

      paymentSource:
        payload.paymentSource,

      providerOrderId:
        payload.providerOrderId,

      providerTransactionId:
        payload.providerTransactionId,

      issuedAt:
        payload.issuedAt,

      verifiedAt,

      schemaVersion:
        1,
    };

  // ----------------------------------------------------------
  // SERIALIZED REPLAY / SEQUENCE-SAFE ATOMIC APPLY
  // ----------------------------------------------------------

  return applyFinoraVerifiedWalletRechargeAuthorizationState({
    packageId:
      controlPackage.packageId,

    issuerId:
      controlPackage.issuer.issuerId,

    signingKeyId:
      controlPackage.issuer.signingKeyId,

    purpose:
      "WALLET_RECHARGE",

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
        nativeBinding.installationId,

      bindingKeyId:
        nativeBinding.bindingKeyId,

      fingerprintAlgorithm:
        nativeBinding.fingerprintAlgorithm,

      publicKeyFingerprint:
        nativeBinding.publicKeyFingerprint,
    },

    authorization,

    appliedAt:
      verifiedAt,
  });
}

// ============================================================
// END
// ============================================================
