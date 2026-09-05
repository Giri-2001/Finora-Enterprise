// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// PRIVILEGED BUSINESS PROFILE ISSUER
//
// RESPONSIBILITY:
//
// - Accept a prepared BUSINESS_PROFILE payload
// - Revalidate it inside the privileged boundary
// - Bind it to the exact package + native binding target
// - Enforce payload/package issuedAt equality
// - Issue purpose = BUSINESS_PROFILE
// - Sign using FINORA Control Center private-key vault
//
// IMPORTANT:
//
// - MAIN PROCESS / CONTROL CENTER ONLY.
// - No renderer IPC is exposed here.
// - Private signing key remains inside Control Center signer.
// - Payload is revalidated immediately before signing.
// - Business Date is not accepted.
// - No operational Business / Branch settings mutation.
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
  FinoraBusinessProfileIssuanceTarget,
} from "./finoraBusinessProfileIssuancePolicy.js";

import {
  validateFinoraBusinessProfileIssuance,
} from "./finoraBusinessProfileIssuancePolicy.js";

// ============================================================
// INPUT
// ============================================================

export interface SignFinoraBusinessProfilePackageInput {

  packageId:
    string;

  sequence:
    number;

  issuedAt:
    string;

  target:
    FinoraBusinessProfileIssuanceTarget;

  payload:
    unknown;

  packageValidity?:
    FinoraControlCenterPackageValidity;
}

// ============================================================
// HELPERS
// ============================================================

function parseTimestamp(
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

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : undefined;
}

// ============================================================
// SIGN
// ============================================================

export async function signFinoraBusinessProfilePackage(
  input:
    SignFinoraBusinessProfilePackageInput,
): Promise<
  FinoraControlCenterSignedPackage<
    Record<string, unknown>
  >
> {

  if (
    !input.packageId.trim()
  ) {
    throw new Error(
      "FINORA Business Profile packageId is required.",
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
      "FINORA Business Profile package sequence must be a positive safe integer.",
    );
  }

  const envelopeIssuedAt =
    parseTimestamp(
      input.issuedAt,
    );

  if (
    envelopeIssuedAt ===
      undefined
  ) {
    throw new Error(
      "FINORA Business Profile package issuedAt timestamp is invalid.",
    );
  }

  const policy =
    validateFinoraBusinessProfileIssuance(
      input.payload,
      input.target,
    );

  if (!policy.valid) {
    throw new Error(
      policy.error,
    );
  }

  const payloadIssuedAt =
    parseTimestamp(
      policy.payload.issuedAt,
    );

  if (
    payloadIssuedAt ===
      undefined ||
    payloadIssuedAt !==
      envelopeIssuedAt
  ) {
    throw new Error(
      "FINORA Business Profile payload and package issuedAt timestamps must match.",
    );
  }

  return signFinoraControlCenterPackage({
    packageId:
      input.packageId,

    purpose:
      "BUSINESS_PROFILE",

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
      new Date(
        envelopeIssuedAt,
      ).toISOString(),

    validity:
      input.packageValidity,

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