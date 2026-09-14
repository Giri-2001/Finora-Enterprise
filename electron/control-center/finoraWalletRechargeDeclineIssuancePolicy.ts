/* ============================================================
   FINORA ENTERPRISE OSâ„¢

   CONTROL CENTER
   WALLET RECHARGE DECLINE PRE-SIGN ISSUANCE POLICY

   RESPONSIBILITY:

   - Validate one WALLET_RECHARGE_DECLINE payload before signing.
   - Bind decline to the exact verified Recharge Request identity.
   - Enforce exact owner/business/branch/installation target parity.
   - Enforce exact native installation-binding identity.
   - Enforce canonical requestedAt and authoritative issuedAt.
   - Preserve amount / currency / payment channel evidence.

   IMPORTANT:

   - PURE DOMAIN POLICY.
   - No Electron APIs.
   - No IPC.
   - No filesystem.
   - No Wallet or Payment Intent mutation.
   - Recipient replay / sequence / durable decline evidence
     remain recipient-side authority.
============================================================ */

import type {
  FinoraWalletRechargeIssuanceTarget,
} from "./finoraWalletRechargeIssuancePolicy.js";

export interface FinoraWalletRechargeDeclineIssuanceAccepted {
  valid:
    true;

  payload:
    Record<string, unknown>;
}

export interface FinoraWalletRechargeDeclineIssuanceRejected {
  valid:
    false;

  error:
    string;
}

export type FinoraWalletRechargeDeclineIssuancePolicyResult =
  | FinoraWalletRechargeDeclineIssuanceAccepted
  | FinoraWalletRechargeDeclineIssuanceRejected;

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

function isCanonicalTimestamp(
  value:
    unknown,
): value is string {

  if (!isNonEmptyString(value)) {
    return false;
  }

  const parsed =
    Date.parse(
      value,
    );

  return (
    Number.isFinite(
      parsed,
    ) &&
    new Date(
      parsed,
    ).toISOString() ===
      value
  );
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
): boolean {

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

function rejected(
  error:
    string,
): FinoraWalletRechargeDeclineIssuanceRejected {

  return {
    valid:
      false,

    error,
  };
}

function accepted(
  payload:
    Record<string, unknown>,
): FinoraWalletRechargeDeclineIssuanceAccepted {

  return {
    valid:
      true,

    payload,
  };
}

export function validateFinoraWalletRechargeDeclineIssuance(
  payload:
    unknown,

  target:
    FinoraWalletRechargeIssuanceTarget,
): FinoraWalletRechargeDeclineIssuancePolicyResult {

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
    ) ||
    !isValidBindingIdentity(
      target.bindingKeyId,
      target.fingerprintAlgorithm,
      target.publicKeyFingerprint,
    )
  ) {
    return rejected(
      "FINORA Wallet Recharge Decline issuance target is invalid.",
    );
  }

  if (!isRecord(payload)) {
    return rejected(
      "FINORA WALLET_RECHARGE_DECLINE payload is invalid.",
    );
  }

  if (
    payload.schemaVersion !==
      1 ||
    payload.outcome !==
      "DECLINED" ||
    !isNonEmptyString(
      payload.requestId,
    ) ||
    !/^FINORA-WAL-REQ-[0-9A-F]{64}$/.test(
      payload.requestId,
    ) ||
    !isNonEmptyString(
      payload.paymentReference,
    ) ||
    !Number.isSafeInteger(
      payload.amountMinor,
    ) ||
    (
      payload.amountMinor as number
    ) <= 0 ||
    payload.currency !==
      "INR" ||
    !isRechargePaymentMethod(
      payload.paymentMethod,
    ) ||
    !isRechargePaymentSource(
      payload.paymentSource,
    ) ||
    !isCanonicalTimestamp(
      payload.requestedAt,
    ) ||
    !isCanonicalTimestamp(
      payload.issuedAt,
    )
  ) {
    return rejected(
      "FINORA WALLET_RECHARGE_DECLINE payload fields are invalid.",
    );
  }

  const scope =
    payload.scope;

  if (
    !isRecord(scope) ||
    scope.ownerId !==
      target.ownerId ||
    scope.businessId !==
      target.businessId ||
    scope.branchId !==
      target.branchId
  ) {
    return rejected(
      "FINORA Wallet Recharge Decline payload scope does not match the package target.",
    );
  }

  const installationBinding =
    payload.installationBinding;

  if (
    !isRecord(
      installationBinding,
    ) ||
    installationBinding.schemaVersion !==
      1 ||
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
      "FINORA Wallet Recharge Decline installation binding does not match the package target.",
    );
  }

  return accepted(
    payload,
  );
}

/* ============================================================
   END
============================================================ */