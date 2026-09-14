/* ============================================================
   FINORA ENTERPRISE OSâ„¢

   CONTROL PLANE
   SIGNED WALLET RECHARGE DECLINE PACKAGE APPLY SERVICE

   RESPONSIBILITY:

   - Resolve authoritative Control Store installation identity.
   - Resolve authoritative Windows native binding identity.
   - Cryptographically verify signed WALLET_RECHARGE_DECLINE.
   - Enforce exact signed package target and native binding.
   - Validate exact Request / payment / amount / channel evidence.
   - Persist durable decline evidence through the Control Store.
   - Never mutate Wallet balance or renderer Payment Intent state.

   IMPORTANT:

   - MAIN PROCESS TRUSTED BOUNDARY.
   - No signing authority.
   - No private-key access.
   - No renderer write authority.
   - No Business Date.
   - verifiedAt is signed-package acceptance evidence only.
============================================================ */

import type {
  FinoraControlStoreResult,
  FinoraControlWalletRechargeDeclineEvidence,
  FinoraVerifiedWalletRechargeDeclineApplyResult,
} from "./finoraControlStore.js";

import {
  applyFinoraVerifiedWalletRechargeDeclineState,
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
): value is FinoraControlWalletRechargeDeclineEvidence["paymentMethod"] {

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
): value is FinoraControlWalletRechargeDeclineEvidence["paymentSource"] {

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
  FinoraVerifiedWalletRechargeDeclineApplyResult
> {

  return {
    success:
      false,

    error,
  };
}

export async function applyFinoraSignedWalletRechargeDeclinePackage(
  signedPackage:
    unknown,

  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[],

  now:
    Date,
): Promise<
  FinoraControlStoreResult<
    FinoraVerifiedWalletRechargeDeclineApplyResult
  >
> {

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
      "FINORA installation identity is required before applying a Wallet Recharge Decline.",
    );
  }

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
      "FINORA Windows native installation binding is unavailable.",
    );
  }

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

  if (
    controlPackage.purpose !==
      "WALLET_RECHARGE_DECLINE"
  ) {
    return failure(
      "FINORA signed package purpose must be WALLET_RECHARGE_DECLINE.",
    );
  }

  if (
    controlPackage.payloadVersion !==
      1
  ) {
    return failure(
      "FINORA WALLET_RECHARGE_DECLINE payload version is unsupported.",
    );
  }

  const payload =
    controlPackage.payload;

  if (!isRecord(payload)) {
    return failure(
      "FINORA WALLET_RECHARGE_DECLINE payload is malformed.",
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
      "FINORA WALLET_RECHARGE_DECLINE scope or installation binding is malformed.",
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
      payload.requestId,
    ) ||
    !/^FINORA-WAL-REQ-[0-9A-F]{64}$/.test(
      payload.requestId,
    ) ||
    !isNonEmptyString(
      payload.paymentReference,
    ) ||
    typeof payload.amountMinor !==
      "number" ||
    !Number.isSafeInteger(
      payload.amountMinor,
    ) ||
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
    !isNonEmptyString(
      payload.requestedAt,
    ) ||
    payload.outcome !==
      "DECLINED" ||
    !isNonEmptyString(
      payload.issuedAt,
    ) ||
    payload.schemaVersion !==
      1
  ) {
    return failure(
      "FINORA WALLET_RECHARGE_DECLINE payload is invalid.",
    );
  }

  const requestedAt =
    parseCanonicalTimestamp(
      payload.requestedAt,
    );

  const payloadIssuedAt =
    parseCanonicalTimestamp(
      payload.issuedAt,
    );

  const packageIssuedAt =
    parseCanonicalTimestamp(
      controlPackage.issuedAt,
    );

  if (
    requestedAt ===
      undefined ||
    payloadIssuedAt ===
      undefined ||
    packageIssuedAt ===
      undefined ||
    requestedAt >
      payloadIssuedAt ||
    payload.issuedAt !==
      controlPackage.issuedAt
  ) {
    return failure(
      "FINORA WALLET_RECHARGE_DECLINE request/package timestamps are invalid.",
    );
  }

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
      "FINORA WALLET_RECHARGE_DECLINE payload scope does not match the verified branch target.",
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
      "FINORA WALLET_RECHARGE_DECLINE native installation binding does not match the verified package target.",
    );
  }

  const verifiedAt =
    now.toISOString();

  const decline:
    FinoraControlWalletRechargeDeclineEvidence = {

      packageId:
        controlPackage.packageId,

      issuerId:
        controlPackage.issuer.issuerId,

      signingKeyId:
        controlPackage.issuer.signingKeyId,

      purpose:
        "WALLET_RECHARGE_DECLINE",

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

      requestId:
        payload.requestId,

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

      requestedAt:
        payload.requestedAt,

      outcome:
        "DECLINED",

      issuedAt:
        payload.issuedAt,

      verifiedAt,

      schemaVersion:
        1,
    };

  return applyFinoraVerifiedWalletRechargeDeclineState({
    packageId:
      controlPackage.packageId,

    issuerId:
      controlPackage.issuer.issuerId,

    signingKeyId:
      controlPackage.issuer.signingKeyId,

    purpose:
      "WALLET_RECHARGE_DECLINE",

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

    decline,

    appliedAt:
      verifiedAt,
  });
}

/* ============================================================
   END
============================================================ */