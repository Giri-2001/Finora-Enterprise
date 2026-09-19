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
// - BRANCH_ACCESS
// - STORAGE_ENTITLEMENT
// - BUSINESS_PROFILE
// - PRICING_POLICY
// - WALLET_RECHARGE
// - CONTROL_BUNDLE
// ============================================================

import {
  signFinoraBranchActivationPackage,
  type SignFinoraBranchActivationPackageInput,
} from "./finoraBranchActivationIssuer.js";

import {
  signFinoraBranchAccessPackage,
  type SignFinoraBranchAccessPackageInput,
} from "./finoraBranchAccessIssuer.js";

import {
  signFinoraBranchDeviceRevocationPackage,
  type SignFinoraBranchDeviceRevocationPackageInput,
} from "./finoraBranchDeviceTrustRevocationIssuer.js";

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
  signFinoraWalletRechargeDeclinePackage,
  type SignFinoraWalletRechargeDeclinePackageInput,
} from "./finoraWalletRechargeDeclineIssuer.js";


import {
  signFinoraControlBundlePackage,
  type SignFinoraControlBundlePackageInput,
} from "./finoraControlBundleIssuer.js";

import {
  reserveFinoraControlCenterIssuance,
} from "./finoraControlCenterIssuanceLedger.js";
import {
  reserveFinoraPortableBranchAccessIssuance,
} from "./finoraPortableBranchAccessIssuanceLedger.js";
import {
  reserveFinoraPortableBusinessProfileIssuance,
} from "./finoraPortableBusinessProfileIssuanceLedger.js";
import {
  reserveFinoraPortablePricingPolicyIssuance,
} from "./finoraPortablePricingPolicyIssuanceLedger.js";
import {
  reserveFinoraPortableStorageEntitlementIssuance,
} from "./finoraPortableStorageEntitlementIssuanceLedger.js";

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

export type IssueFinoraBranchAccessRequest =
  Omit<
    SignFinoraBranchAccessPackageInput,
    | "packageId"
    | "sequence"
    | "issuedAt"
  >;

export type IssueFinoraBranchDeviceRevocationRequest =
  Omit<
    SignFinoraBranchDeviceRevocationPackageInput,
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

export type IssueFinoraWalletRechargeDeclineRequest =
  Omit<
    SignFinoraWalletRechargeDeclinePackageInput,
    | "packageId"
    | "sequence"
    | "issuedAt"
  >;

export type IssueFinoraControlBundleRequest =
  Omit<
    SignFinoraControlBundlePackageInput,
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

export type FinoraBranchAccessIssuanceSequenceLane =
  | "NATIVE_INSTALLATION"
  | "PORTABLE_BRANCH";

export function resolveFinoraBranchAccessIssuanceSequenceLane(
  payload:
    unknown,
): FinoraBranchAccessIssuanceSequenceLane {

  if (!isRecord(payload)) {
    return "NATIVE_INSTALLATION";
  }

  /*
   * Any credential-enrollment authority is installation-bound.
   *
   * Presence is checked rather than truthiness. Even malformed
   * or explicitly-undefined credentialEnrollment input must not
   * acquire portable sequence authority before final signing
   * policy rejects it.
   */
  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      "credentialEnrollment",
    )
  ) {
    return "NATIVE_INSTALLATION";
  }

  const action =
    payload.action;

  if (
    action ===
      "AUTHORIZE_CREDENTIAL"
  ) {
    return "NATIVE_INSTALLATION";
  }

  switch (action) {
    case "ISSUE":
    case "RENEW":
    case "REPLACE":
    case "SUSPEND":
    case "RESUME":
    case "REVOKE":
      return "PORTABLE_BRANCH";

    default:
      /*
       * Unknown / missing / malformed actions fail closed toward
       * the existing installation-scoped sequence namespace.
       *
       * The purpose-specific signer remains the authoritative
       * payload validator and will reject invalid issuance.
       */
      return "NATIVE_INSTALLATION";
  }
}

// ============================================================
// BUSINESS_PROFILE SEQUENCE AUTHORITY
// ============================================================

export type FinoraBusinessProfileIssuanceSequenceLane =
  | "NATIVE_INSTALLATION"
  | "PORTABLE_BRANCH";

export function resolveFinoraBusinessProfileIssuanceSequenceLane(
  payload:
    unknown,
): FinoraBusinessProfileIssuanceSequenceLane {

  if (
    typeof payload !==
      "object" ||
    payload ===
      null ||
    Array.isArray(
      payload,
    )
  ) {
    return "NATIVE_INSTALLATION";
  }

  const action =
    (
      payload as
        Record<
          string,
          unknown
        >
    ).action;

  /*
   * Initial BUSINESS_PROFILE ISSUE remains tied to native
   * provisioning authority. Signed REPLACE is branch-global
   * operational state and therefore uses the portable branch
   * sequence namespace. Invalid/malformed lifecycle payloads
   * fail closed toward native; the issuer policy rejects them
   * before signing.
   */
  return action ===
    "REPLACE"
    ? "PORTABLE_BRANCH"
    : "NATIVE_INSTALLATION";
}
// ============================================================
// PRICING_POLICY SEQUENCE AUTHORITY
// ============================================================

export type FinoraPricingPolicyIssuanceSequenceLane =
  | "NATIVE_INSTALLATION"
  | "PORTABLE_BRANCH";

export function resolveFinoraPricingPolicyIssuanceSequenceLane(
  payload:
    unknown,
): FinoraPricingPolicyIssuanceSequenceLane {

  if (
    typeof payload !==
      "object" ||
    payload ===
      null ||
    Array.isArray(
      payload,
    )
  ) {
    return "NATIVE_INSTALLATION";
  }

  const action =
    (
      payload as
        Record<
          string,
          unknown
        >
    ).action;

  /*
   * PRICING_POLICY intentionally has no separate ISSUE lifecycle.
   * Authoritative REPLACE initializes absent branch pricing and
   * later replaces the same branch-global override lineage.
   *
   * Therefore valid REPLACE uses the portable branch sequence
   * namespace. Invalid or malformed lifecycle payloads fail
   * closed toward native issuance; the Pricing issuer rejects
   * them before signing.
   */
  return action ===
    "REPLACE"
    ? "PORTABLE_BRANCH"
    : "NATIVE_INSTALLATION";
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

function toPortableBranchAccessIssuanceScope(
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
  };
}

function toPortableBusinessProfileIssuanceScope(
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
  };
}
function toPortablePricingPolicyIssuanceScope(
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
  };
}
function toPortableStorageEntitlementIssuanceScope(
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
// BRANCH ACCESS
// ============================================================

export function issueFinoraBranchAccessPackage(
  request:
    IssueFinoraBranchAccessRequest,
) {

  return runSerializedIssuance(
    async () => {

      const sequenceLane =
        resolveFinoraBranchAccessIssuanceSequenceLane(
          request.payload,
        );

      const reservation =
        sequenceLane ===
          "PORTABLE_BRANCH"
          ? await reserveFinoraPortableBranchAccessIssuance(
              toPortableBranchAccessIssuanceScope(
                request.target,
              ),
            )
          : await reserveFinoraControlCenterIssuance({
              purpose:
                "BRANCH_ACCESS",

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

      return signFinoraBranchAccessPackage({
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
// DEVICE REVOCATION
// ============================================================

export function issueFinoraBranchDeviceRevocationPackage(
  request:
    IssueFinoraBranchDeviceRevocationRequest,
) {

  return runSerializedIssuance(
    async () => {

      const reservation =
        await reserveFinoraControlCenterIssuance({
          purpose:
            "DEVICE_REVOCATION",

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

      return signFinoraBranchDeviceRevocationPackage({
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
// PORTABLE STORAGE ENTITLEMENT
// ============================================================

export function issueFinoraPortableStorageEntitlementPackage(
  request:
    IssueFinoraStorageEntitlementRequest,
) {

  return runSerializedIssuance(
    async () => {

      const reservation =
        await reserveFinoraPortableStorageEntitlementIssuance(
          toPortableStorageEntitlementIssuanceScope(
            request.target,
          ),
        );

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

      const sequenceLane =
        resolveFinoraBusinessProfileIssuanceSequenceLane(
          request.payload,
        );

      const reservation =
        sequenceLane ===
          "PORTABLE_BRANCH"
          ? await reserveFinoraPortableBusinessProfileIssuance(
              toPortableBusinessProfileIssuanceScope(
                request.target,
              ),
            )
          : await reserveFinoraControlCenterIssuance({
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

      const sequenceLane =
        resolveFinoraPricingPolicyIssuanceSequenceLane(
          request.payload,
        );

      const reservation =
        sequenceLane ===
          "PORTABLE_BRANCH"
          ? await reserveFinoraPortablePricingPolicyIssuance(
              toPortablePricingPolicyIssuanceScope(
                request.target,
              ),
            )
          : await reserveFinoraControlCenterIssuance({
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
// WALLET RECHARGE DECLINE
// ============================================================

export function issueFinoraWalletRechargeDeclinePackage(
  request:
    IssueFinoraWalletRechargeDeclineRequest,
) {

  return runSerializedIssuance(
    async () => {

      const reservation =
        await reserveFinoraControlCenterIssuance({
          purpose:
            "WALLET_RECHARGE_DECLINE",

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

      return signFinoraWalletRechargeDeclinePackage({
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
// CONTROL BUNDLE
// ============================================================

export function issueFinoraControlBundlePackage(
  request:
    IssueFinoraControlBundleRequest,
) {

  return runSerializedIssuance(
    async () => {

      const reservation =
        await reserveFinoraControlCenterIssuance({
          purpose:
            "CONTROL_BUNDLE",

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

      return signFinoraControlBundlePackage({
        packageId:
          reservation.packageId,

        sequence:
          reservation.sequence,

        issuedAt:
          reservation.issuedAt,

        target:
          request.target,

        payload,
      });
    },
  );
}

// ============================================================
// END
// ============================================================
