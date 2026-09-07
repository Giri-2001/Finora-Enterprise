// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// CONTROL BUNDLE ISSUER
//
// RESPONSIBILITY:
//
// - Validate authoritative CONTROL_BUNDLE envelope fields
// - Revalidate CONTROL_BUNDLE pre-sign issuance policy
// - Enforce exact payload/envelope issuedAt parity
// - Sign one CONTROL_BUNDLE package through the privileged
//   Control Center signer
//
// IMPORTANT:
//
// - MAIN PROCESS ONLY.
// - No IPC.
// - No filesystem.
// - No dialog.
// - No recipient Control Store mutation.
// - No private key is exposed from this module.
// - packageId / sequence / issuedAt are authoritative inputs
//   supplied by the issuance coordinator.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  signFinoraControlCenterPackage,
} from "./finoraControlCenterSigner.js";

import type {
  FinoraControlCenterSignedPackage,
} from "./finoraControlCenterSigner.js";

import {
  validateFinoraControlBundleIssuance,
} from "./finoraControlBundleIssuancePolicy.js";

import type {
  FinoraControlBundleIssuanceTarget,
} from "./finoraControlBundleIssuancePolicy.js";

// ============================================================
// INPUT
// ============================================================

export interface SignFinoraControlBundlePackageInput {

  packageId:
    string;

  sequence:
    number;

  target:
    FinoraControlBundleIssuanceTarget;

  issuedAt:
    string;

  payload:
    Record<string, unknown>;
}

// ============================================================
// HELPERS
// ============================================================

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

// ============================================================
// SIGN
// ============================================================

export async function signFinoraControlBundlePackage(
  input:
    SignFinoraControlBundlePackageInput,
): Promise<
  FinoraControlCenterSignedPackage<
    Record<string, unknown>
  >
> {

  // ----------------------------------------------------------
  // AUTHORITATIVE ENVELOPE
  // ----------------------------------------------------------

  if (
    typeof input.packageId !==
      "string" ||
    input.packageId.trim().length ===
      0
  ) {
    throw new Error(
      "FINORA Control Bundle packageId is required.",
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
      "FINORA Control Bundle sequence must be a positive safe integer.",
    );
  }

  if (
    !isCanonicalTimestamp(
      input.issuedAt,
    )
  ) {
    throw new Error(
      "FINORA Control Bundle envelope issuedAt must be a canonical ISO timestamp.",
    );
  }

  // ----------------------------------------------------------
  // PURE PRE-SIGN POLICY
  // ----------------------------------------------------------

  const policyResult =
    validateFinoraControlBundleIssuance(
      input.payload,
      input.target,
    );

  if (!policyResult.valid) {
    throw new Error(
      policyResult.error,
    );
  }

  // ----------------------------------------------------------
  // PAYLOAD ↔ ENVELOPE TIME
  // ----------------------------------------------------------

  if (
    policyResult.payload.issuedAt !==
      input.issuedAt
  ) {
    throw new Error(
      "FINORA Control Bundle payload and envelope issuedAt timestamps must match exactly.",
    );
  }

  // ----------------------------------------------------------
  // PRIVILEGED SIGNER
  // ----------------------------------------------------------

  return signFinoraControlCenterPackage({
    packageId:
      input.packageId,

    purpose:
      "CONTROL_BUNDLE",

    target:
      input.target,

    issuedAt:
      input.issuedAt,

    sequence:
      input.sequence,

    payloadVersion:
      1,

    payload:
      policyResult.payload,

    schemaVersion:
      1,
  });
}

// ============================================================
// END
// ============================================================