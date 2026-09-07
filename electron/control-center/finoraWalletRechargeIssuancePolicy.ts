// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// WALLET RECHARGE PRE-SIGN ISSUANCE POLICY
//
// RESPONSIBILITY:
//
// - Validate one WALLET_RECHARGE payload before signing
// - Enforce exact package target / payload scope parity
// - Enforce exact installation-binding identity
// - Enforce canonical signed issuance timestamp
// - Enforce INR minor-unit Recharge amount
// - Enforce supported payment method / source metadata
//
// IMPORTANT:
//
// - PURE DOMAIN POLICY.
// - No Electron APIs.
// - No IPC.
// - No filesystem.
// - No private signing key.
// - No Wallet mutation.
// - No payment gateway dependency.
// - No recipient Control Store reads.
// - Replay, payment-reference uniqueness and monotonic applied
//   sequence checks remain recipient-side stateful authority.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// TARGET
// ============================================================

export interface FinoraWalletRechargeIssuanceTarget {

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

// ============================================================
// RESULT
// ============================================================

export interface FinoraWalletRechargeIssuanceAccepted {

  valid:
    true;

  payload:
    Record<string, unknown>;
}

export interface FinoraWalletRechargeIssuanceRejected {

  valid:
    false;

  error:
    string;
}

export type FinoraWalletRechargeIssuancePolicyResult =
  | FinoraWalletRechargeIssuanceAccepted
  | FinoraWalletRechargeIssuanceRejected;

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

  if (
    !isNonEmptyString(
      value,
    )
  ) {
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

function isValidBindingIdentity(
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
    typeof publicKeyFingerprint !==
      "string" ||
    !/^[0-9a-f]{64}$/.test(
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
): boolean {

  return (
    value ===
      "UPI" ||
    value ===
      "PHONEPE" ||
    value ===
      "GOOGLE_PAY" ||
    value ===
      "PAYTM" ||
    value ===
      "RAZORPAY" ||
    value ===
      "BANK_TRANSFER" ||
    value ===
      "OTHER"
  );
}

function isRechargePaymentSource(
  value:
    unknown,
): boolean {

  return (
    value ===
      "PHONEPE" ||
    value ===
      "RAZORPAY" ||
    value ===
      "UPI" ||
    value ===
      "GOOGLE_PAY" ||
    value ===
      "PAYTM" ||
    value ===
      "BANK_TRANSFER" ||
    value ===
      "MANUAL"
  );
}

function rejected(
  error:
    string,
): FinoraWalletRechargeIssuanceRejected {

  return {
    valid:
      false,

    error,
  };
}

function accepted(
  payload:
    Record<string, unknown>,
): FinoraWalletRechargeIssuanceAccepted {

  return {
    valid:
      true,

    payload,
  };
}

// ============================================================
// VALIDATE
// ============================================================

export function validateFinoraWalletRechargeIssuance(
  payload:
    unknown,

  target:
    FinoraWalletRechargeIssuanceTarget,
): FinoraWalletRechargeIssuancePolicyResult {

  // ----------------------------------------------------------
  // TARGET
  // ----------------------------------------------------------

  if (
    !isNonEmptyString(
      target.ownerId,
    ) ||
    !isNonEmptyString(
      target.businessId,
    ) ||
    !isNonEmptyString(
      target.branchId,
    ) ||
    !isNonEmptyString(
      target.installationId,
    )
  ) {
    return rejected(
      "FINORA Wallet Recharge issuance target is incomplete.",
    );
  }

  if (
    !isValidBindingIdentity(
      target.bindingKeyId,
      target.fingerprintAlgorithm,
      target.publicKeyFingerprint,
    )
  ) {
    return rejected(
      "FINORA Wallet Recharge issuance target installation binding is invalid.",
    );
  }

  // ----------------------------------------------------------
  // PAYLOAD ROOT
  // ----------------------------------------------------------

  if (!isRecord(payload)) {
    return rejected(
      "FINORA WALLET_RECHARGE payload is invalid.",
    );
  }

  if (
    payload.schemaVersion !==
      1
  ) {
    return rejected(
      "FINORA WALLET_RECHARGE payload schema is unsupported.",
    );
  }

  if (
    parseCanonicalTimestamp(
      payload.issuedAt,
    ) ===
      undefined
  ) {
    return rejected(
      "FINORA WALLET_RECHARGE issuedAt must be a canonical ISO timestamp.",
    );
  }

  // ----------------------------------------------------------
  // SCOPE
  // ----------------------------------------------------------

  if (
    !isRecord(
      payload.scope,
    )
  ) {
    return rejected(
      "FINORA WALLET_RECHARGE scope is required.",
    );
  }

  const scope =
    payload.scope;

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
    return rejected(
      "FINORA WALLET_RECHARGE scope is invalid.",
    );
  }

  if (
    scope.ownerId !==
      target.ownerId ||
    scope.businessId !==
      target.businessId ||
    scope.branchId !==
      target.branchId
  ) {
    return rejected(
      "FINORA WALLET_RECHARGE scope does not match the package target.",
    );
  }

  // ----------------------------------------------------------
  // INSTALLATION BINDING
  // ----------------------------------------------------------

  if (
    !isRecord(
      payload.installationBinding,
    )
  ) {
    return rejected(
      "FINORA WALLET_RECHARGE installation binding is required.",
    );
  }

  const installationBinding =
    payload.installationBinding;

  if (
    installationBinding.schemaVersion !==
      1 ||
    !isNonEmptyString(
      installationBinding.installationId,
    ) ||
    !isValidBindingIdentity(
      installationBinding.bindingKeyId,
      installationBinding.fingerprintAlgorithm,
      installationBinding.publicKeyFingerprint,
    )
  ) {
    return rejected(
      "FINORA WALLET_RECHARGE installation binding is invalid.",
    );
  }

  if (
    installationBinding.installationId !==
      target.installationId ||
    installationBinding.bindingKeyId !==
      target.bindingKeyId ||
    installationBinding.fingerprintAlgorithm !==
      target.fingerprintAlgorithm ||
    installationBinding.publicKeyFingerprint !==
      target.publicKeyFingerprint
  ) {
    return rejected(
      "FINORA WALLET_RECHARGE installation binding does not match the package target.",
    );
  }

  // ----------------------------------------------------------
  // PAYMENT IDENTITY
  // ----------------------------------------------------------

  if (
    !isNonEmptyString(
      payload.paymentReference,
    )
  ) {
    return rejected(
      "FINORA WALLET_RECHARGE payment reference is required.",
    );
  }

  // ----------------------------------------------------------
  // AMOUNT / CURRENCY
  // ----------------------------------------------------------

  if (
    typeof payload.amountMinor !==
      "number" ||
    !Number.isSafeInteger(
      payload.amountMinor,
    ) ||
    payload.amountMinor <=
      0
  ) {
    return rejected(
      "FINORA WALLET_RECHARGE amountMinor must be a positive safe integer.",
    );
  }

  if (
    payload.currency !==
      "INR"
  ) {
    return rejected(
      "FINORA WALLET_RECHARGE currency must be INR.",
    );
  }

  // ----------------------------------------------------------
  // PAYMENT METADATA
  // ----------------------------------------------------------

  if (
    !isRechargePaymentMethod(
      payload.paymentMethod,
    )
  ) {
    return rejected(
      "FINORA WALLET_RECHARGE payment method is invalid.",
    );
  }

  if (
    !isRechargePaymentSource(
      payload.paymentSource,
    )
  ) {
    return rejected(
      "FINORA WALLET_RECHARGE payment source is invalid.",
    );
  }

  if (
    payload.providerOrderId !==
      undefined &&
    !isNonEmptyString(
      payload.providerOrderId,
    )
  ) {
    return rejected(
      "FINORA WALLET_RECHARGE provider order ID is invalid.",
    );
  }

  if (
    payload.providerTransactionId !==
      undefined &&
    !isNonEmptyString(
      payload.providerTransactionId,
    )
  ) {
    return rejected(
      "FINORA WALLET_RECHARGE provider transaction ID is invalid.",
    );
  }

  // ----------------------------------------------------------
  // ACCEPT
  // ----------------------------------------------------------

  return accepted(
    payload,
  );
}

// ============================================================
// END
// ============================================================