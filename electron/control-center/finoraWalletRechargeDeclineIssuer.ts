/* ============================================================
   FINORA ENTERPRISE OSâ„¢

   CONTROL CENTER
   PRIVILEGED WALLET RECHARGE DECLINE ISSUER

   RESPONSIBILITY:

   - Revalidate prepared WALLET_RECHARGE_DECLINE payload.
   - Enforce payload/package authoritative issuedAt equality.
   - Sign purpose = WALLET_RECHARGE_DECLINE through the existing
     Control Center signer.
   - Never mutate recipient Wallet or Payment Intent state.
============================================================ */

import type {
  FinoraControlCenterPackageValidity,
  FinoraControlCenterSignedPackage,
} from "./finoraControlCenterSigner.js";

import {
  signFinoraControlCenterPackage,
} from "./finoraControlCenterSigner.js";

import type {
  FinoraWalletRechargeIssuanceTarget,
} from "./finoraWalletRechargeIssuancePolicy.js";

import {
  validateFinoraWalletRechargeDeclineIssuance,
} from "./finoraWalletRechargeDeclineIssuancePolicy.js";

export interface SignFinoraWalletRechargeDeclinePackageInput {
  packageId:
    string;

  sequence:
    number;

  issuedAt:
    string;

  target:
    FinoraWalletRechargeIssuanceTarget;

  payload:
    unknown;

  packageValidity?:
    FinoraControlCenterPackageValidity;
}

function isCanonicalTimestamp(
  value:
    unknown,
): value is string {

  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
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

export async function signFinoraWalletRechargeDeclinePackage(
  input:
    SignFinoraWalletRechargeDeclinePackageInput,
): Promise<
  FinoraControlCenterSignedPackage<
    Record<string, unknown>
  >
> {

  if (
    typeof input.packageId !==
      "string" ||
    input.packageId.trim().length ===
      0
  ) {
    throw new Error(
      "FINORA Wallet Recharge Decline packageId is required.",
    );
  }

  if (
    !Number.isSafeInteger(
      input.sequence,
    ) ||
    input.sequence <=
      0
  ) {
    throw new Error(
      "FINORA Wallet Recharge Decline package sequence must be a positive safe integer.",
    );
  }

  if (
    !isCanonicalTimestamp(
      input.issuedAt,
    )
  ) {
    throw new Error(
      "FINORA Wallet Recharge Decline package issuedAt must be canonical.",
    );
  }

  const policy =
    validateFinoraWalletRechargeDeclineIssuance(
      input.payload,
      input.target,
    );

  if (!policy.valid) {
    throw new Error(
      policy.error,
    );
  }

  if (
    policy.payload.issuedAt !==
      input.issuedAt
  ) {
    throw new Error(
      "FINORA Wallet Recharge Decline payload and package issuedAt timestamps must match exactly.",
    );
  }

  return signFinoraControlCenterPackage({
    packageId:
      input.packageId,

    purpose:
      "WALLET_RECHARGE_DECLINE",

    target: {
      ownerId:
        input.target.ownerId,

      businessId:
        input.target.businessId,

      branchId:
        input.target.branchId,

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

    ...(
      input.packageValidity ===
        undefined
        ? {}
        : {
            validity:
              input.packageValidity,
          }
    ),

    sequence:
      input.sequence,

    payloadVersion:
      1,

    payload:
      policy.payload,

    schemaVersion:
      1,
  });
}

/* ============================================================
   END
============================================================ */