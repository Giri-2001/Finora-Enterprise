// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// PRIVILEGED ISSUANCE COORDINATOR
//
// RESPONSIBILITY:
//
// - Accept validated Control Center issuance drafts
// - Keep packageId / sequence / root issuedAt out of renderer
// - Reserve authoritative envelope metadata in Electron main
// - Inject only authoritative root payload.issuedAt
// - Preserve nested lifecycle / audit timestamps
// - Delegate final validation and signing to purpose issuers
//
// SECURITY:
//
// - MAIN PROCESS ONLY.
// - NO IPC registration in this module.
// - NO private-key exposure.
// - Renderer never chooses packageId, sequence or root issuedAt.
//
// CURRENT PURPOSES:
//
// - BRANCH_ACTIVATION
// - STORAGE_ENTITLEMENT
// - BUSINESS_PROFILE
// - PRICING_POLICY
// - WALLET_RECHARGE
// ============================================================

import {
  signFinoraBranchActivationPackage,
  type SignFinoraBranchActivationPackageInput,
} from "./finoraBranchActivationIssuer.js";

import {
  signFinoraStorageEntitlementPackage,
  type SignFinoraStorageEntitlementPackageInput,
} from "./finoraStorageEntitlementIssuer.js";

import {
  signFinoraBusinessProfilePackage,
  type SignFinoraBusinessProfilePackageInput,
} from "./finoraBusinessProfileIssuer.js";

import {
  signFinoraPricingPolicyPackage,
  type SignFinoraPricingPolicyPackageInput,
} from "./finoraPricingPolicyIssuer.js";

import {
  signFinoraWalletRechargePackage,
  type SignFinoraWalletRechargePackageInput,
} from "./finoraWalletRechargeIssuer.js";

import {
  reserveFinoraControlCenterIssuance,
} from "./finoraControlCenterIssuanceLedger.js";

// ============================================================
// PUBLIC REQUEST CONTRACTS
// ============================================================

export type IssueFinoraBranchActivationRequest =
  Omit<
    SignFinoraBranchActivationPackageInput,
    | "packageId"
    | "sequence"
    | "issuedAt"
  >;

export type IssueFinoraStorageEntitlementRequest =
  Omit<
    SignFinoraStorageEntitlementPackageInput,
    | "packageId"
    | "sequence"
    | "issuedAt"
  >;

export type IssueFinoraBusinessProfileRequest =
  Omit<
    SignFinoraBusinessProfilePackageInput,
    | "packageId"
    | "sequence"
    | "issuedAt"
  >;

export type IssueFinoraPricingPolicyRequest =
  Omit<
    SignFinoraPricingPolicyPackageInput,
    | "packageId"
    | "sequence"
    | "issuedAt"
  >;

export type IssueFinoraWalletRechargeRequest =
  Omit<
    SignFinoraWalletRechargePackageInput,
    | "packageId"
    | "sequence"
    | "issuedAt"
  >;

// ============================================================
// HELPERS
// ============================================================

interface FinoraIssuanceTargetScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;
}

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {

  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function withAuthoritativeIssuedAt(
  payload:
    unknown,
  issuedAt:
    string,
): Record<string, unknown> {

  if (!isRecord(payload)) {
    throw new Error(
      "FINORA Control Center issuance payload must be an object.",
    );
  }

  /*
   * Only the root issuance timestamp is authoritative here.
   *
   * Nested lifecycle timestamps such as createdAt, updatedAt,
   * activatedAt and validity windows remain untouched and are
   * revalidated by the purpose-specific issuance policy.
   */
  return {
    ...payload,

    issuedAt,
  };
}

function toIssuanceScope(
  target:
    FinoraIssuanceTargetScope,
) {

  return {
    ownerId:
      target.ownerId,

    businessId:
      target.businessId,

    branchId:
      target.branchId,

    installationId:
      target.installationId,
  };
}

// ============================================================
// END-TO-END ISSUANCE SERIALIZATION
// ============================================================

let issuanceCoordinatorQueue:
  Promise<void> =
    Promise.resolve();

function runSerializedIssuance<T>(
  operation:
    () => Promise<T>,
): Promise<T> {

  const result =
    issuanceCoordinatorQueue.then(
      operation,
      operation,
    );

  issuanceCoordinatorQueue =
    result.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return result;
}

// ============================================================
// BRANCH ACTIVATION
// ============================================================

export function issueFinoraBranchActivationPackage(
  request:
    IssueFinoraBranchActivationRequest,
) {

  return runSerializedIssuance(
    async () => {

      const reservation =
        await reserveFinoraControlCenterIssuance({
          purpose:
            "BRANCH_ACTIVATION",

          scope:
            toIssuanceScope(
              request.target,
            ),
        });

      const payload =
        withAuthoritativeIssuedAt(
          request.payload,
          reservation.issuedAt,
        );

      return signFinoraBranchActivationPackage({
        packageId:
          reservation.packageId,

        sequence:
          reservation.sequence,

        issuedAt:
          reservation.issuedAt,

        target:
          request.target,

        payload,

        ...(
          request.packageValidity ===
            undefined
            ? {}
            : {
                packageValidity:
                  request.packageValidity,
              }
        ),
      });
    },
  );
}

// ============================================================
// STORAGE ENTITLEMENT
// ============================================================

export function issueFinoraStorageEntitlementPackage(
  request:
    IssueFinoraStorageEntitlementRequest,
) {

  return runSerializedIssuance(
    async () => {

      const reservation =
        await reserveFinoraControlCenterIssuance({
          purpose:
            "STORAGE_ENTITLEMENT",

          scope:
            toIssuanceScope(
              request.target,
            ),
        });

      const payload =
        withAuthoritativeIssuedAt(
          request.payload,
          reservation.issuedAt,
        );

      return signFinoraStorageEntitlementPackage({
        packageId:
          reservation.packageId,

        sequence:
          reservation.sequence,

        issuedAt:
          reservation.issuedAt,

        target:
          request.target,

        payload,

        ...(
          request.packageValidity ===
            undefined
            ? {}
            : {
                packageValidity:
                  request.packageValidity,
              }
        ),
      });
    },
  );
}

// ============================================================
// BUSINESS PROFILE
// ============================================================

export function issueFinoraBusinessProfilePackage(
  request:
    IssueFinoraBusinessProfileRequest,
) {

  return runSerializedIssuance(
    async () => {

      const reservation =
        await reserveFinoraControlCenterIssuance({
          purpose:
            "BUSINESS_PROFILE",

          scope:
            toIssuanceScope(
              request.target,
            ),
        });

      const payload =
        withAuthoritativeIssuedAt(
          request.payload,
          reservation.issuedAt,
        );

      return signFinoraBusinessProfilePackage({
        packageId:
          reservation.packageId,

        sequence:
          reservation.sequence,

        issuedAt:
          reservation.issuedAt,

        target:
          request.target,

        payload,

        ...(
          request.packageValidity ===
            undefined
            ? {}
            : {
                packageValidity:
                  request.packageValidity,
              }
        ),
      });
    },
  );
}

// ============================================================
// PRICING POLICY
// ============================================================

export function issueFinoraPricingPolicyPackage(
  request:
    IssueFinoraPricingPolicyRequest,
) {

  return runSerializedIssuance(
    async () => {

      const reservation =
        await reserveFinoraControlCenterIssuance({
          purpose:
            "PRICING_POLICY",

          scope:
            toIssuanceScope(
              request.target,
            ),
        });

      const payload =
        withAuthoritativeIssuedAt(
          request.payload,
          reservation.issuedAt,
        );

      return signFinoraPricingPolicyPackage({
        packageId:
          reservation.packageId,

        sequence:
          reservation.sequence,

        issuedAt:
          reservation.issuedAt,

        target:
          request.target,

        payload,

        ...(
          request.packageValidity ===
            undefined
            ? {}
            : {
                packageValidity:
                  request.packageValidity,
              }
        ),
      });
    },
  );
}

// ============================================================
// WALLET RECHARGE
// ============================================================

export function issueFinoraWalletRechargePackage(
  request:
    IssueFinoraWalletRechargeRequest,
) {

  return runSerializedIssuance(
    async () => {

      const reservation =
        await reserveFinoraControlCenterIssuance({
          purpose:
            "WALLET_RECHARGE",

          scope:
            toIssuanceScope(
              request.target,
            ),
        });

      const payload =
        withAuthoritativeIssuedAt(
          request.payload,
          reservation.issuedAt,
        );

      return signFinoraWalletRechargePackage({
        packageId:
          reservation.packageId,

        sequence:
          reservation.sequence,

        issuedAt:
          reservation.issuedAt,

        target:
          request.target,

        payload,

        ...(
          request.packageValidity ===
            undefined
            ? {}
            : {
                packageValidity:
                  request.packageValidity,
              }
        ),
      });
    },
  );
}

// ============================================================
// END
// ============================================================