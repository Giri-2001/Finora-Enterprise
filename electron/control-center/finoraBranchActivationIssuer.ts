// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// PRIVILEGED BRANCH ACTIVATION ISSUER
//
// RESPONSIBILITY:
//
// - Accept a prepared REGISTERED / DEMO activation payload
// - Revalidate it inside the privileged boundary
// - Bind it to the exact package target
// - Issue purpose = BRANCH_ACTIVATION
// - Sign it using FINORA Control Center private-key vault
//
// IMPORTANT:
//
// - MAIN PROCESS / CONTROL CENTER ONLY.
// - No renderer IPC is exposed here.
// - Private signing key never leaves the Step-1 signer.
// - Payload is revalidated immediately before signing.
// - Business Date is not accepted.
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
  FinoraBranchActivationIssuanceTarget,
} from "./finoraBranchActivationIssuancePolicy.js";

import {
  validateFinoraBranchActivationIssuance,
} from "./finoraBranchActivationIssuancePolicy.js";

// ============================================================
// INPUT
// ============================================================

export interface SignFinoraBranchActivationPackageInput {

  packageId:
    string;

  sequence:
    number;

  issuedAt:
    string;

  target:
    FinoraBranchActivationIssuanceTarget;

  payload:
    unknown;

  packageValidity?:
    FinoraControlCenterPackageValidity;
}

// ============================================================
// HELPERS
// ============================================================

function isNonEmptyString(
  value: unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function parseTimestamp(
  value: string,
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

export async function signFinoraBranchActivationPackage(
  input:
    SignFinoraBranchActivationPackageInput,
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
      "FINORA Branch Activation packageId is required.",
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
      "FINORA Branch Activation sequence must be a positive safe integer.",
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
      "FINORA Branch Activation package issuedAt is invalid.",
    );
  }


  const policy =
    validateFinoraBranchActivationIssuance(
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
      "FINORA Branch Activation payload and package issuedAt timestamps must match.",
    );
  }


  return signFinoraControlCenterPackage({
    packageId:
      input.packageId,

    purpose:
      "BRANCH_ACTIVATION",

    target: {
      ownerId:
        input.target.ownerId,

      businessId:
        input.target.businessId,

      branchId:
        input.target.branchId,

      installationId:
        input.target.installationId,
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