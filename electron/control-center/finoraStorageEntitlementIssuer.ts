// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// PRIVILEGED STORAGE ENTITLEMENT ISSUER
//
// RESPONSIBILITY:
//
// - Accept a prepared LOCAL / USB storage entitlement payload
// - Revalidate it inside the privileged signing boundary
// - Bind it to the exact native installation target
// - Issue purpose = STORAGE_ENTITLEMENT
// - Sign using FINORA Control Center private-key vault
//
// IMPORTANT:
//
// - MAIN PROCESS / CONTROL CENTER ONLY.
// - No renderer IPC is exposed here.
// - Private signing key remains inside the Control Center signer.
// - Payload is revalidated immediately before signing.
// - No Business Date.
// - USB volume identity is not accepted.
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
  FinoraStorageEntitlementIssuanceTarget,
} from "./finoraStorageEntitlementIssuancePolicy.js";

import {
  validateFinoraStorageEntitlementIssuance,
} from "./finoraStorageEntitlementIssuancePolicy.js";

// ============================================================
// INPUT
// ============================================================

export interface SignFinoraStorageEntitlementPackageInput {

  packageId:
    string;

  sequence:
    number;

  issuedAt:
    string;

  target:
    FinoraStorageEntitlementIssuanceTarget;

  payload:
    unknown;

  packageValidity?:
    FinoraControlCenterPackageValidity;
}

// ============================================================
// HELPERS
// ============================================================

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

function parseTimestamp(
  value:
    string,
): number | undefined {

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

export async function signFinoraStorageEntitlementPackage(
  input:
    SignFinoraStorageEntitlementPackageInput,
): Promise<
  FinoraControlCenterSignedPackage<
    Record<string, unknown>
  >
> {

  if (
    !isNonEmptyString(
      input.packageId,
    )
  ) {
    throw new Error(
      "FINORA Storage Entitlement packageId is required.",
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
      "FINORA Storage Entitlement sequence must be a positive safe integer.",
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
      "FINORA Storage Entitlement package issuedAt is invalid.",
    );
  }

  const policy =
    validateFinoraStorageEntitlementIssuance(
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
      String(
        policy.payload.issuedAt,
      ),
    );

  if (
    payloadIssuedAt ===
      undefined ||
    payloadIssuedAt !==
      envelopeIssuedAt
  ) {
    throw new Error(
      "FINORA Storage Entitlement payload and package issuedAt timestamps must match.",
    );
  }

  return signFinoraControlCenterPackage({
    packageId:
      input.packageId,

    purpose:
      "STORAGE_ENTITLEMENT",

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