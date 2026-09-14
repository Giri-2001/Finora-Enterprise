import {
  FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_FORMAT,
  validateFinoraBranchCredentialEnrollmentBundle,
} from "../control/finoraBranchCredentialEnrollmentBundle.js";

import type {
  FinoraBranchCredentialEnrollmentBundleV1,
} from "../control/finoraBranchCredentialEnrollmentBundle.js";

import type {
  FinoraBranchAccessPackageTarget,
  FinoraBranchCredentialEnrollmentAuthorization,
} from "../control/finoraBranchAccessPackage.types.js";

import {
  validateFinoraBranchPortabilityAuthorityIssuance,
} from "./finoraBranchPortabilityAuthorityIssuancePolicy.js";

import {
  issueFinoraBranchPortabilityAuthorityPackage,
} from "./finoraBranchPortabilityAuthorityIssuer.js";

import {
  issueFinoraBranchAccessPackage,
} from "./finoraControlCenterIssuanceCoordinator.js";

import type {
  FinoraControlCenterPackageValidity,
} from "./finoraControlCenterSigner.js";

export interface IssueFinoraBranchCredentialEnrollmentBundleInput {
  target:
    FinoraBranchAccessPackageTarget;

  sourceAuthorization:
    FinoraBranchCredentialEnrollmentAuthorization;

  packageValidity?:
    FinoraControlCenterPackageValidity;
}

export async function issueFinoraBranchCredentialEnrollmentBundle(
  input:
    IssueFinoraBranchCredentialEnrollmentBundleInput,
): Promise<
  FinoraBranchCredentialEnrollmentBundleV1
> {

  const branchTarget = {
    ownerId:
      input.target.ownerId,

    businessId:
      input.target.businessId,

    branchId:
      input.target.branchId,
  };

  /*
   * Pure preflight occurs before either child reserves a sequence.
   *
   * This guarantees obvious lineage/scope failures cannot consume
   * either the installation issuance sequence or the dedicated
   * branch portability sequence.
   */
  const portabilityPreflight =
    validateFinoraBranchPortabilityAuthorityIssuance(
      input.sourceAuthorization,
      branchTarget,
    );

  if (!portabilityPreflight.valid) {
    throw new Error(
      portabilityPreflight.error,
    );
  }

  const branchAccessPackage =
    await issueFinoraBranchAccessPackage({
      target:
        input.target,

      payload: {
        action:
          "AUTHORIZE_CREDENTIAL",

        credentialEnrollment:
          input.sourceAuthorization,

        schemaVersion:
          1,
      },

      ...(
        input.packageValidity ===
          undefined
          ? {}
          : {
              packageValidity:
                input.packageValidity,
            }
      ),
    });

  const branchPortabilityAuthorityPackage =
    await issueFinoraBranchPortabilityAuthorityPackage({
      target:
        branchTarget,

      sourceAuthorization:
        input.sourceAuthorization,

      ...(
        input.packageValidity ===
          undefined
          ? {}
          : {
              packageValidity:
                input.packageValidity,
            }
      ),
    });

  const candidate = {
    bundleFormat:
      FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_FORMAT,

    branchAccessPackage,

    branchPortabilityAuthorityPackage,

    schemaVersion:
      1 as const,
  };

  /*
   * The unsigned wrapper is not trusted by construction.
   * Final composition validation proves exact child roles,
   * branch scope, issuer lineage and authorization correlation.
   */
  const composition =
    validateFinoraBranchCredentialEnrollmentBundle(
      candidate,
    );

  if (!composition.valid) {
    throw new Error(
      composition.error,
    );
  }

  return composition.bundle;
}