// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// PRIVILEGED PRICING POLICY ISSUER
//
// RESPONSIBILITY:
//
// - Accept a prepared PRICING_POLICY payload
// - Revalidate it inside the privileged boundary
// - Bind it to the exact package + installation target
// - Enforce canonical payload/package issuedAt equality
// - Issue purpose = PRICING_POLICY
// - Sign using FINORA Control Center private-key vault
//
// IMPORTANT:
//
// - MAIN PROCESS / CONTROL CENTER ONLY.
// - No renderer IPC is exposed here.
// - Private signing key remains inside Control Center signer.
// - Payload is revalidated immediately before signing.
// - No operational Pricing state mutation.
// - Pricing lineage/current-state checks remain recipient-side
//   inside the serialized Control Store apply boundary.
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
  FinoraPricingPolicyIssuanceTarget,
} from "./finoraPricingPolicyIssuancePolicy.js";

import {
  validateFinoraPricingPolicyIssuance,
} from "./finoraPricingPolicyIssuancePolicy.js";

// ============================================================
// INPUT
// ============================================================

export interface SignFinoraPricingPolicyPackageInput {

  packageId:
    string;

  sequence:
    number;

  issuedAt:
    string;

  target:
    FinoraPricingPolicyIssuanceTarget;

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

export async function signFinoraPricingPolicyPackage(
  input:
    SignFinoraPricingPolicyPackageInput,
): Promise<
  FinoraControlCenterSignedPackage<
    Record<string, unknown>
  >
> {

  if (
    !input.packageId.trim()
  ) {
    throw new Error(
      "FINORA Pricing Policy packageId is required.",
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
      "FINORA Pricing Policy package sequence must be a positive safe integer.",
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
      "FINORA Pricing Policy package issuedAt must be a canonical ISO timestamp.",
    );
  }

  const policy =
    validateFinoraPricingPolicyIssuance(
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
      "FINORA Pricing Policy payload and package issuedAt timestamps must match exactly.",
    );
  }

  return signFinoraControlCenterPackage({
    packageId:
      input.packageId,

    purpose:
      "PRICING_POLICY",

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