/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER
   PRIVILEGED BRANCH ACCESS ISSUER

   RESPONSIBILITY:

   - Revalidate one BRANCH_ACCESS payload at signing boundary
   - Bind it to exact installation / Owner / Business / Branch
   - Sign using the Control Center key authority
   - Carry optional credential-enrollment authorization without
     carrying any recipient credential secret

   SECURITY:

   - MAIN PROCESS / CONTROL CENTER ONLY.
   - No renderer IPC.
   - No recipient persistence.
   - No credential secret input.
   - No Business Date.
=========================================================== */

import type {
  FinoraControlCenterPackageValidity,
  FinoraControlCenterSignedPackage,
} from "./finoraControlCenterSigner.js";

import {
  signFinoraControlCenterPackage,
} from "./finoraControlCenterSigner.js";

import type {
  FinoraBranchAccessPackageTarget,
} from "../control/finoraBranchAccessPackage.types.js";

import {
  FINORA_BRANCH_ACCESS_PAYLOAD_VERSION,
} from "../control/finoraBranchAccessPackage.types.js";

import {
  validateFinoraBranchAccessIssuance,
} from "./finoraBranchAccessIssuancePolicy.js";

// ============================================================
// INPUT
// ============================================================

export interface SignFinoraBranchAccessPackageInput {

  packageId:
    string;

  sequence:
    number;

  issuedAt:
    string;

  target:
    FinoraBranchAccessPackageTarget;

  payload:
    unknown;

  packageValidity?:
    FinoraControlCenterPackageValidity;
}

// ============================================================
// HELPERS
// ============================================================

function hasText(
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

export async function signFinoraBranchAccessPackage(
  input:
    SignFinoraBranchAccessPackageInput,
): Promise<
  FinoraControlCenterSignedPackage<
    Record<string, unknown>
  >
> {

  if (
    !hasText(
      input.packageId,
    )
  ) {
    throw new Error(
      "FINORA Branch Access packageId is required.",
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
      "FINORA Branch Access sequence must be a positive safe integer.",
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
      "FINORA Branch Access package issuedAt is invalid.",
    );
  }

  const policy =
    validateFinoraBranchAccessIssuance(
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
      "FINORA Branch Access payload and package issuedAt timestamps must match.",
    );
  }

  return signFinoraControlCenterPackage({
    packageId:
      input.packageId,

    purpose:
      "BRANCH_ACCESS",

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
      FINORA_BRANCH_ACCESS_PAYLOAD_VERSION,

    payload:
      policy.payload as unknown as
        Record<string, unknown>,

    schemaVersion:
      1,
  });
}

// ============================================================
// END
// ============================================================