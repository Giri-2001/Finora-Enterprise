// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// PRIVILEGED WALLET RECHARGE ISSUER
//
// RESPONSIBILITY:
//
// - Accept a prepared WALLET_RECHARGE payload
// - Revalidate it inside the privileged boundary
// - Bind it to the exact package + installation target
// - Enforce canonical payload/package issuedAt equality
// - Issue purpose = WALLET_RECHARGE
// - Sign using FINORA Control Center private-key vault
//
// IMPORTANT:
//
// - MAIN PROCESS / CONTROL CENTER ONLY.
// - No renderer IPC is exposed here.
// - No renderer-controlled packageId / sequence / issuedAt.
// - No renderer-controlled signingKeyId.
// - Private signing key remains inside Control Center signer.
// - Payload is revalidated immediately before signing.
// - No Wallet balance or Payment Intent mutation.
// - Replay / payment-reference uniqueness / applied-sequence
//   checks remain recipient-side Control Store authority.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

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
  validateFinoraWalletRechargeIssuance,
} from "./finoraWalletRechargeIssuancePolicy.js";

// ============================================================
// INPUT
// ============================================================

export interface SignFinoraWalletRechargePackageInput {

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

// ============================================================
// HELPERS
// ============================================================

function parseCanonicalTimestamp(
  value:
    unknown,
): number | undefined {

  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
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

// ============================================================
// SIGN
// ============================================================

export async function signFinoraWalletRechargePackage(
  input:
    SignFinoraWalletRechargePackageInput,
): Promise<
  FinoraControlCenterSignedPackage<
    Record<string, unknown>
  >
> {

  if (
    !input.packageId.trim()
  ) {
    throw new Error(
      "FINORA Wallet Recharge packageId is required.",
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
      "FINORA Wallet Recharge package sequence must be a positive safe integer.",
    );
  }

  const envelopeIssuedAt =
    parseCanonicalTimestamp(
      input.issuedAt,
    );

  if (
    envelopeIssuedAt ===
      undefined
  ) {
    throw new Error(
      "FINORA Wallet Recharge package issuedAt must be a canonical ISO timestamp.",
    );
  }

  const policy =
    validateFinoraWalletRechargeIssuance(
      input.payload,
      input.target,
    );

  if (!policy.valid) {
    throw new Error(
      policy.error,
    );
  }

  const payloadIssuedAt =
    policy.payload.issuedAt;

  const parsedPayloadIssuedAt =
    parseCanonicalTimestamp(
      payloadIssuedAt,
    );

  if (
    parsedPayloadIssuedAt ===
      undefined ||
    parsedPayloadIssuedAt !==
      envelopeIssuedAt ||
    payloadIssuedAt !==
      input.issuedAt
  ) {
    throw new Error(
      "FINORA Wallet Recharge payload and package issuedAt timestamps must match exactly.",
    );
  }

  return signFinoraControlCenterPackage({
    packageId:
      input.packageId,

    purpose:
      "WALLET_RECHARGE",

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

// ============================================================
// END
// ============================================================