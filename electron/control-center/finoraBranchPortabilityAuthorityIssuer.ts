import type {
  FinoraBranchCredentialEnrollmentAuthorization,
} from "../control/finoraBranchAccessPackage.types.js";

import {
  FINORA_BRANCH_PORTABILITY_AUTHORITY_PAYLOAD_VERSION,
} from "../control/finoraBranchPortabilityAuthorityPackage.types.js";

import type {
  FinoraBranchPortabilityAuthorityPackageTarget,
  FinoraBranchPortabilityAuthorityPayloadV1,
} from "../control/finoraBranchPortabilityAuthorityPackage.types.js";

import {
  reserveFinoraBranchPortabilityAuthorityIssuance,
} from "./finoraBranchPortabilityAuthorityIssuanceLedger.js";

import {
  validateFinoraBranchPortabilityAuthorityIssuance,
} from "./finoraBranchPortabilityAuthorityIssuancePolicy.js";

import {
  signFinoraControlCenterPackage,
} from "./finoraControlCenterSigner.js";

import type {
  FinoraControlCenterPackageValidity,
  FinoraControlCenterSignedPackage,
} from "./finoraControlCenterSigner.js";

export interface IssueFinoraBranchPortabilityAuthorityPackageInput {
  target:
    FinoraBranchPortabilityAuthorityPackageTarget;

  sourceAuthorization:
    FinoraBranchCredentialEnrollmentAuthorization;

  packageValidity?:
    FinoraControlCenterPackageValidity;
}

export async function issueFinoraBranchPortabilityAuthorityPackage(
  input:
    IssueFinoraBranchPortabilityAuthorityPackageInput,
): Promise<
  FinoraControlCenterSignedPackage<
    FinoraBranchPortabilityAuthorityPayloadV1
  >
> {

  const policy =
    validateFinoraBranchPortabilityAuthorityIssuance(
      input.sourceAuthorization,
      input.target,
    );

  /*
   * Validate every caller-controlled lineage and scope field
   * BEFORE consuming the durable branch sequence.
   */
  if (!policy.valid) {
    throw new Error(
      policy.error,
    );
  }

  const reservation =
    await reserveFinoraBranchPortabilityAuthorityIssuance(
      {
        ownerId:
          policy.payload.ownerId,

        businessId:
          policy.payload.businessId,

        branchId:
          policy.payload.branchId,
      },
    );

  return signFinoraControlCenterPackage({
    packageId:
      reservation.packageId,

    purpose:
      "BRANCH_PORTABILITY_AUTHORITY",

    target: {
      ownerId:
        policy.payload.ownerId,

      businessId:
        policy.payload.businessId,

      branchId:
        policy.payload.branchId,
    },

    issuedAt:
      reservation.issuedAt,

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
      reservation.sequence,

    payloadVersion:
      FINORA_BRANCH_PORTABILITY_AUTHORITY_PAYLOAD_VERSION,

    payload:
      policy.payload,

    schemaVersion:
      1,
  });
}