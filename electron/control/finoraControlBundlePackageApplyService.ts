// ============================================================
// FINORA ENTERPRISE OSÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢
//
// ELECTRON CONTROL
// SIGNED CONTROL BUNDLE PACKAGE APPLY SERVICE
//
// RESPONSIBILITY:
//
// - Resolve authoritative Control Store installation identity
// - Resolve authoritative Windows native binding identity
// - Cryptographically verify the outer CONTROL_BUNDLE package
// - Validate FINORA_CONTROL_BUNDLE_V1 composition
// - Preserve signed child packages unchanged
// - Dispatch children to existing purpose-specific apply services
// - Return explicit per-child outcomes
//
// SECURITY:
//
// - MAIN PROCESS ONLY.
// - PUBLIC verification only.
// - No signing.
// - No private keys.
// - No renderer IPC.
// - No filesystem/dialog handling.
// - No renderer-provided target.
// - No renderer-provided trust authority.
//
// APPLY SEMANTICS:
//
// - Outer verification/preflight failure applies zero children.
// - After successful preflight, children are attempted in signed
//   bundle order.
// - One child failure does not roll back prior successful children.
// - Remaining children continue after an individual child failure.
// - Therefore bundle application is deliberately NON-ATOMIC.
// - Purpose-specific replay/sequence/domain rules remain
//   authoritative in the existing child apply services.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  readFinoraControlStore,
} from "./finoraControlStore.js";

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  verifyFinoraSignedBranchPortabilityAuthorityPackage,
  verifyFinoraSignedControlPackageBranchScope,
  verifyFinoraSignedControlPackageNative,
} from "./finoraSignedControlPackageVerifier.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import {
  isFinoraBranchCredentialPortabilityAuthorityProvenanceV1,
} from "./finoraBranchCredentialPortabilityAuthorityProvenance.js";

import type {
  FinoraBranchCredentialPortabilityAuthorityProvenanceV1,
} from "./finoraBranchCredentialPortabilityAuthorityProvenance.js";

import type {
  FinoraBranchOperationalSessionPrincipal,
} from "./finoraBranchLoginSessionAuthority.js";

import {
  applyFinoraSignedBranchActivationPackage,
} from "./finoraBranchActivationPackageApplyService.js";

import {
  applyFinoraSignedBranchAccessPackage,
  applyFinoraSignedPortableBranchAccessPackage,
} from "./finoraBranchAccessPackageApplyService.js";

import {
  applyFinoraSignedPortableStorageEntitlementPackage,
  applyFinoraSignedStorageEntitlementPackage,
} from "./finoraStorageEntitlementPackageApplyService.js";

import {
  applyFinoraSignedBusinessProfilePackage,
  applyFinoraSignedPortableBusinessProfilePackage,
} from "./finoraBusinessProfilePackageApplyService.js";

import {
  applyFinoraSignedPortablePricingPolicyPackage,
  applyFinoraSignedPricingPolicyPackage,
} from "./finoraPricingPolicyPackageApplyService.js";

import {
  applyFinoraSignedWalletRechargePackage,
} from "./finoraWalletRechargePackageApplyService.js";

import {
  applyFinoraSignedWalletOpeningBalancePackage,
} from "./finoraWalletOpeningBalancePackageApplyService.js";

import {
  applyFinoraSignedWalletRechargeDeclinePackage,
} from "./finoraWalletRechargeDeclinePackageApplyService.js";

// ============================================================
// CONTRACT
// ============================================================

export const FINORA_CONTROL_BUNDLE_FORMAT =
  "FINORA_CONTROL_BUNDLE_V1" as const;

export type FinoraControlBundleChildPurpose =
  | "BRANCH_ACTIVATION"
  | "BRANCH_ACCESS"
  | "STORAGE_ENTITLEMENT"
  | "BUSINESS_PROFILE"
  | "PRICING_POLICY"
  | "WALLET_RECHARGE"
  | "WALLET_RECHARGE_DECLINE"
  | "WALLET_OPENING_BALANCE"
  | "BRANCH_PORTABILITY_AUTHORITY";

export type FinoraControlBundleImportAuthorityContext =
  | {
      lane:
        "BOOTSTRAP_NATIVE";
    }
  | {
      lane:
        "AUTHENTICATED_PORTABLE";

      principal:
        FinoraBranchOperationalSessionPrincipal;

      portableAuthFingerprint:
        string;
    };

export interface FinoraControlBundleChildApplyResult {

  packageId:
    string;

  purpose:
    FinoraControlBundleChildPurpose;

  success:
    boolean;

  error?:
    string;
}

export interface FinoraControlBundleApplySummary {

  bundlePackageId:
    string;

  issuerId:
    string;

  signingKeyId:
    string;

  sequence:
    number;

  issuedAt:
    string;

  childResults:
    FinoraControlBundleChildApplyResult[];

  succeededCount:
    number;

  failedCount:
    number;

  allChildrenApplied:
    boolean;
}

export type FinoraControlBundleApplyResult =
  | {
      success:
        true;

      data:
        FinoraControlBundleApplySummary;
    }
  | {
      success:
        false;

      error:
        string;
    };

// ============================================================
// HELPERS
// ============================================================

function failure(
  error:
    string,
): FinoraControlBundleApplyResult {

  return {
    success:
      false,

    error,
  };
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

function verifiedSignersMatchExactly(
  left:
    FinoraBranchTrustedControlPublicKey,

  right:
    FinoraBranchTrustedControlPublicKey,
): boolean {

  return (
    left.issuerId === right.issuerId &&
    left.signingKeyId === right.signingKeyId &&
    left.algorithm === right.algorithm &&
    left.format === right.format &&
    left.publicKey === right.publicKey &&
    left.status === right.status &&
    left.validFrom === right.validFrom &&
    left.validUntil === right.validUntil
  );
}

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

function isCanonicalTimestamp(
  value:
    unknown,
): value is string {

  if (!isNonEmptyString(value)) {
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

function isSupportedChildPurpose(
  value:
    unknown,
): value is FinoraControlBundleChildPurpose {

  return (
    value ===
      "BRANCH_ACTIVATION" ||
    value ===
      "BRANCH_ACCESS" ||
    value ===
      "STORAGE_ENTITLEMENT" ||
    value ===
      "BUSINESS_PROFILE" ||
    value ===
      "PRICING_POLICY" ||
    value ===
      "WALLET_RECHARGE" ||
    value ===
      "WALLET_RECHARGE_DECLINE" ||
    value ===
      "WALLET_OPENING_BALANCE" ||
    value ===
      "BRANCH_PORTABILITY_AUTHORITY"
  );
}

function targetsMatch(
  left:
    unknown,

  right:
    unknown,
): boolean {

  if (
    !isRecord(
      left,
    ) ||
    !isRecord(
      right,
    )
  ) {
    return false;
  }

  return (
    left.ownerId ===
      right.ownerId &&
    left.businessId ===
      right.businessId &&
    left.branchId ===
      right.branchId &&
    left.installationId ===
      right.installationId &&
    left.bindingKeyId ===
      right.bindingKeyId &&
    left.fingerprintAlgorithm ===
      right.fingerprintAlgorithm &&
    left.publicKeyFingerprint ===
      right.publicKeyFingerprint
  );
}

type FinoraControlBundleBranchAccessChildLane =
  | "NATIVE_BRANCH_ACCESS"
  | "PORTABLE_BRANCH_ACCESS";

type FinoraControlBundleStorageEntitlementChildLane =
  | "NATIVE_STORAGE_ENTITLEMENT"
  | "PORTABLE_STORAGE_ENTITLEMENT";

type FinoraControlBundleBusinessProfileChildLane =
  | "NATIVE_BUSINESS_PROFILE"
  | "PORTABLE_BUSINESS_PROFILE";

type FinoraControlBundlePricingPolicyChildLane =
  | "NATIVE_PRICING_POLICY"
  | "PORTABLE_PRICING_POLICY";

function isPortableBranchAccessBundleAction(
  value:
    unknown,
): value is
  | "ISSUE"
  | "RENEW"
  | "REPLACE"
  | "SUSPEND"
  | "RESUME"
  | "REVOKE" {

  return (
    value ===
      "ISSUE" ||
    value ===
      "RENEW" ||
    value ===
      "REPLACE" ||
    value ===
      "SUSPEND" ||
    value ===
      "RESUME" ||
    value ===
      "REVOKE"
  );
}

// ============================================================
// CHILD DISPATCH
// ============================================================

async function applyChildPackage(
  purpose:
    FinoraControlBundleChildPurpose,

  branchAccessLane:
    FinoraControlBundleBranchAccessChildLane,

  storageEntitlementLane:
    FinoraControlBundleStorageEntitlementChildLane,

  businessProfileLane:
    FinoraControlBundleBusinessProfileChildLane,

  pricingPolicyLane:
    FinoraControlBundlePricingPolicyChildLane,

  signedPackage:
    unknown,

  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[],

  now:
    Date,

  credentialPortabilityAuthorityProvenance?:
    FinoraBranchCredentialPortabilityAuthorityProvenanceV1,
): Promise<
  {
    success:
      boolean;

    error?:
      string;
  }
> {

  switch (purpose) {

    case "BRANCH_ACTIVATION": {

      const result =
        await applyFinoraSignedBranchActivationPackage(
          signedPackage,
          trustedKeys,
          now,
        );

      return result.success
        ? {
            success:
              true,
          }
        : {
            success:
              false,

            error:
              result.error ??
              "FINORA Branch Activation child apply failed.",
          };
    }

    case "BRANCH_ACCESS": {

      const result =
        branchAccessLane ===
          "PORTABLE_BRANCH_ACCESS"
          ? await applyFinoraSignedPortableBranchAccessPackage(
              signedPackage,
              trustedKeys,
              now,
            )
          : await applyFinoraSignedBranchAccessPackage(
              signedPackage,
              trustedKeys,
              now,
              credentialPortabilityAuthorityProvenance,
            );

      return result.success
        ? {
            success:
              true,
          }
        : {
            success:
              false,

            error:
              result.error ??
              "FINORA Branch Access child apply failed.",
          };
    }

    case "STORAGE_ENTITLEMENT": {

      const result =
        storageEntitlementLane ===
          "PORTABLE_STORAGE_ENTITLEMENT"
          ? await applyFinoraSignedPortableStorageEntitlementPackage(
              signedPackage,
              trustedKeys,
              now,
            )
          : await applyFinoraSignedStorageEntitlementPackage(
              signedPackage,
              trustedKeys,
              now,
            );

      return result.success
        ? {
            success:
              true,
          }
        : {
            success:
              false,

            error:
              result.error ??
              "FINORA Storage Entitlement child apply failed.",
          };
    }

    case "BUSINESS_PROFILE": {

      const result =
        businessProfileLane ===
          "PORTABLE_BUSINESS_PROFILE"
          ? await applyFinoraSignedPortableBusinessProfilePackage(
              signedPackage,
              trustedKeys,
              now,
            )
          : await applyFinoraSignedBusinessProfilePackage(
              signedPackage,
              trustedKeys,
              now,
            );

      return result.success
        ? {
            success:
              true,
          }
        : {
            success:
              false,

            error:
              result.error ??
              "FINORA Business Profile child apply failed.",
          };
    }

    case "PRICING_POLICY": {

      const result =
        pricingPolicyLane ===
          "PORTABLE_PRICING_POLICY"
          ? await applyFinoraSignedPortablePricingPolicyPackage(
              signedPackage,
              trustedKeys,
              now,
            )
          : await applyFinoraSignedPricingPolicyPackage(
              signedPackage,
              trustedKeys,
              now,
            );

      return result.success
        ? {
            success:
              true,
          }
        : {
            success:
              false,

            error:
              result.error ??
              "FINORA Pricing Policy child apply failed.",
          };
    }

    case "WALLET_RECHARGE": {

      const result =
        await applyFinoraSignedWalletRechargePackage(
          signedPackage,
          trustedKeys,
          now,
        );

      return result.success
        ? {
            success:
              true,
          }
        : {
            success:
              false,

            error:
              result.error ??
              "FINORA Wallet Recharge child apply failed.",
          };
    }

    case "WALLET_OPENING_BALANCE": {

      const result =
        await applyFinoraSignedWalletOpeningBalancePackage(
          signedPackage,
          trustedKeys,
          now,
        );

      return result.success
        ? {
            success:
              true,
          }
        : {
            success:
              false,

            error:
              result.error ??
              "FINORA Wallet Opening Balance child apply failed.",
          };
    }
    case "WALLET_RECHARGE_DECLINE": {

      const result =
        await applyFinoraSignedWalletRechargeDeclinePackage(
          signedPackage,
          trustedKeys,
          now,
        );

      return result.success
        ? {
            success:
              true,
          }
        : {
            success:
              false,

            error:
              result.error ??
              "FINORA Wallet Recharge Decline child apply failed.",
          };
    }
    case "BRANCH_PORTABILITY_AUTHORITY": {

      /*
       * Supporting cryptographic proof only.
       *
       * Signature, branch target, credential lineage and exact
       * Control Center signer are verified during whole-bundle
       * preflight before any child mutation begins.
       *
       * This proof is intentionally not independently replay- or
       * sequence-consumed.
       */
      return {
        success:
          true,
      };
    }

  }
}

// ============================================================
// APPLY
// ============================================================

export async function applyFinoraSignedControlBundlePackage(
  signedBundle:
    unknown,

  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[],

  now:
    Date,

  authorityContext:
    FinoraControlBundleImportAuthorityContext,
): Promise<
  FinoraControlBundleApplyResult
> {

  /*
   * G4 selects the outer Control Bundle target policy only from
   * the already-derived main-process import authority.
   *
   * BOOTSTRAP_NATIVE:
   *   exact current native installation target.
   *
   * AUTHENTICATED_PORTABLE:
   *   exact authoritative branch scope carried by the validated
   *   operational session. The signed historical installation
   *   target remains cryptographically preserved as provenance.
   *
   * Migrated child preflight and apply are branch-portable;
   * non-migrated child families remain strict native.
   */
  if (
    authorityContext.lane !==
      "BOOTSTRAP_NATIVE" &&
    authorityContext.lane !==
      "AUTHENTICATED_PORTABLE"
  ) {
    return failure(
      "FINORA Control Bundle import authority context is invalid.",
    );
  }

  // ----------------------------------------------------------
  // AUTHORITATIVE CONTROL STORE INSTALLATION
  // ----------------------------------------------------------

  const storeResult =
    await readFinoraControlStore();

  if (
    !storeResult.success ||
    !storeResult.data
  ) {
    return failure(
      storeResult.error ??
        "Unable to load the FINORA Control Store.",
    );
  }

  const installation =
    storeResult.data.installation;

  if (!installation) {
    return failure(
      "FINORA installation identity is required before importing a Control Bundle.",
    );
  }

  const expectedBranchScope = {
    ownerId:
      installation.ownerId,

    businessId:
      installation.businessId,

    branchId:
      installation.branchId,
  };

  if (
    authorityContext.lane ===
      "AUTHENTICATED_PORTABLE"
  ) {
    if (
      !isNonEmptyString(
        authorityContext.portableAuthFingerprint,
      ) ||
      !isNonEmptyString(
        authorityContext.principal.ownerId,
      ) ||
      !isNonEmptyString(
        authorityContext.principal.businessId,
      ) ||
      !isNonEmptyString(
        authorityContext.principal.branchId,
      )
    ) {
      return failure(
        "FINORA authenticated portable Control Bundle authority context is invalid.",
      );
    }

    if (
      authorityContext.principal.ownerId !==
        expectedBranchScope.ownerId ||
      authorityContext.principal.businessId !==
        expectedBranchScope.businessId ||
      authorityContext.principal.branchId !==
        expectedBranchScope.branchId
    ) {
      return failure(
        "FINORA authenticated portable Control Bundle session does not belong to the authoritative Control Store branch.",
      );
    }
  }

  // ----------------------------------------------------------
  // AUTHORITATIVE WINDOWS NATIVE BINDING
  // ----------------------------------------------------------

  let nativeBinding;

  try {

    nativeBinding =
      await getFinoraWindowsInstallationBinding();

  } catch (error) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to load the FINORA native installation binding.",
    );
  }

  if (!nativeBinding) {
    return failure(
      "FINORA native installation binding is required before importing a Control Bundle.",
    );
  }

  if (
    authorityContext.lane ===
      "BOOTSTRAP_NATIVE" &&
    nativeBinding.installationId !==
      installation.installationId
  ) {
    return failure(
      "FINORA native installation binding does not match the Control Store installation identity.",
    );
  }

  const nativeExpectedTarget = {
    ownerId:
      installation.ownerId,

    businessId:
      installation.businessId,

    branchId:
      installation.branchId,

    installationId:
      nativeBinding.installationId,

    bindingKeyId:
      nativeBinding.bindingKeyId,

    fingerprintAlgorithm:
      "SHA-256" as const,

    publicKeyFingerprint:
      nativeBinding.publicKeyFingerprint,
  };

  // ----------------------------------------------------------
  // OUTER CRYPTOGRAPHIC VERIFICATION
  //
  // No child mutation can occur before this succeeds.
  // ----------------------------------------------------------

  const verification =
    authorityContext.lane ===
      "BOOTSTRAP_NATIVE"
      ? verifyFinoraSignedControlPackageNative(
          signedBundle,
          trustedKeys,
          nativeExpectedTarget,
          now,
        )
      : verifyFinoraSignedControlPackageBranchScope(
          signedBundle,
          trustedKeys,
          expectedBranchScope,
          now,
        );

  if (!verification.valid) {
    return failure(
      `${verification.reason}: ${verification.error}`,
    );
  }

  const controlBundle =
    verification.controlPackage;

  if (
    controlBundle.purpose !==
      "CONTROL_BUNDLE"
  ) {
    return failure(
      "FINORA imported package purpose must be CONTROL_BUNDLE.",
    );
  }

  if (
    controlBundle.payloadVersion !==
      1
  ) {
    return failure(
      "FINORA CONTROL_BUNDLE payloadVersion must be 1.",
    );
  }

  // ----------------------------------------------------------
  // OUTER PAYLOAD PREFLIGHT
  //
  // Entire composition is checked before any child apply.
  // ----------------------------------------------------------

  const payload =
    controlBundle.payload;

  if (
    payload.bundleFormat !==
      FINORA_CONTROL_BUNDLE_FORMAT ||
    payload.schemaVersion !==
      1 ||
    !isCanonicalTimestamp(
      payload.issuedAt,
    ) ||
    payload.issuedAt !==
      controlBundle.issuedAt ||
    !Array.isArray(
      payload.packages,
    ) ||
    payload.packages.length <
      1 ||
    payload.packages.length >
      7
  ) {
    return failure(
      "FINORA CONTROL_BUNDLE payload structure is invalid.",
    );
  }

  const packageIds =
    new Set<string>();

  const purposes =
    new Set<
      FinoraControlBundleChildPurpose
    >();

  const children:
    {
      packageId:
        string;

      purpose:
        FinoraControlBundleChildPurpose;

      branchAccessLane:
        FinoraControlBundleBranchAccessChildLane;

      storageEntitlementLane:
        FinoraControlBundleStorageEntitlementChildLane;

      businessProfileLane:
        FinoraControlBundleBusinessProfileChildLane;

      pricingPolicyLane:
        FinoraControlBundlePricingPolicyChildLane;

      signedPackage:
        unknown;
    }[] =
      [];

  let verifiedUsbCredentialBranchAccess:
    {
      signedPackage:
        Record<string, unknown>;

      verifiedTrustedKey:
        FinoraBranchTrustedControlPublicKey;

      credentialEnrollment:
        Record<string, unknown>;
    } |
    undefined;

  let verifiedUsbPortabilityProof:
    {
      signedPackage:
        Record<string, unknown>;

      verifiedTrustedKey:
        FinoraBranchTrustedControlPublicKey;

      payload:
        Record<string, unknown>;
    } |
    undefined;

  for (
    const child of
      payload.packages
  ) {

    if (!isRecord(child)) {
      return failure(
        "FINORA CONTROL_BUNDLE contains an invalid child package.",
      );
    }

    if (
      child.purpose ===
        "CONTROL_BUNDLE"
    ) {
      return failure(
        "Nested FINORA CONTROL_BUNDLE packages are not supported.",
      );
    }

    if (
      !isNonEmptyString(
        child.packageId,
      ) ||
      !isSupportedChildPurpose(
        child.purpose,
      )
    ) {
      return failure(
        "FINORA CONTROL_BUNDLE contains an unsupported or malformed child package.",
      );
    }

    const childTargetMatches =
      child.purpose ===
        "BRANCH_PORTABILITY_AUTHORITY"
        ? (
            isRecord(
              child.target,
            ) &&
            child.target.ownerId ===
              controlBundle.target.ownerId &&
            child.target.businessId ===
              controlBundle.target.businessId &&
            child.target.branchId ===
              controlBundle.target.branchId
          )
        : targetsMatch(
            child.target,
            controlBundle.target,
          );

    if (!childTargetMatches) {
      return failure(
        "FINORA CONTROL_BUNDLE child package target does not match the verified outer bundle target.",
      );
    }

    /*
     * Complete cryptographic preflight for every child before
     * any purpose-specific child apply is allowed to begin.
     *
     * BRANCH_ACCESS lifecycle, BUSINESS_PROFILE, and PRICING_POLICY
     * are migrated portable child families. Every other package
     * family remains strict-native during this migration.
     *
     * Existing child apply services intentionally verify again
     * at mutation time. This duplicate verification provides a
     * defense-in-depth boundary while preserving those services
     * as the authoritative domain/replay/state validators.
     */
    /*
     * Credential-bearing BRANCH_ACCESS is intentionally native-only.
     *
     * AUTHENTICATED_PORTABLE authorizes portable lifecycle operations,
     * but it must never reroute ISSUE/AUTHORIZE_CREDENTIAL enrollment
     * authority into the portable lifecycle lane.
     *
     * The verified native BRANCH_ACCESS service persists the pending
     * one-time authorization; the separately verified portability
     * authority is retained as provenance.
     */
    const childCarriesCredentialEnrollment =
      child.purpose === "BRANCH_ACCESS" &&
      isRecord(child.payload) &&
      Object.prototype.hasOwnProperty.call(
        child.payload,
        "credentialEnrollment",
      );

    const childIsCredentialAuthorization =
      child.purpose === "BRANCH_ACCESS" &&
      isRecord(child.payload) &&
      child.payload.action === "AUTHORIZE_CREDENTIAL";

    /*
     * Portable historical bundles must fail closed for credential
     * enrollment operations before native target verification.
     *
     * A genuine new-owner credential-bearing ISSUE is still routed to
     * the native lane below; this guard applies only when the signed
     * package target is historical relative to the current installation.
     */
    if (
      authorityContext.lane === "AUTHENTICATED_PORTABLE" &&
      child.purpose === "BRANCH_ACCESS" &&
      isRecord(child.payload) &&
      (
        child.payload.action === "AUTHORIZE_CREDENTIAL" ||
        Object.prototype.hasOwnProperty.call(
          child.payload,
          "credentialEnrollment",
        )
      ) &&
      isRecord(child.target) &&
      child.target.installationId !==
        nativeExpectedTarget.installationId
    ) {
      return failure(
        child.payload.action === "AUTHORIZE_CREDENTIAL"
          ? `FINORA CONTROL_BUNDLE child ${child.packageId} BRANCH_ACCESS AUTHORIZE_CREDENTIAL is native-only.`
          : `FINORA CONTROL_BUNDLE child ${child.packageId} portable BRANCH_ACCESS cannot carry credential enrollment authority.`,
      );
    }
    const branchAccessLane:
      FinoraControlBundleBranchAccessChildLane =
        authorityContext.lane ===
          "AUTHENTICATED_PORTABLE" &&
        child.purpose ===
          "BRANCH_ACCESS" &&
        !childCarriesCredentialEnrollment &&
        !childIsCredentialAuthorization
          ? "PORTABLE_BRANCH_ACCESS"
          : "NATIVE_BRANCH_ACCESS";

    const storageEntitlementLane:
      FinoraControlBundleStorageEntitlementChildLane =
        authorityContext.lane ===
          "AUTHENTICATED_PORTABLE" &&
        child.purpose ===
          "STORAGE_ENTITLEMENT"
          ? "PORTABLE_STORAGE_ENTITLEMENT"
          : "NATIVE_STORAGE_ENTITLEMENT";

    const businessProfileLane:
      FinoraControlBundleBusinessProfileChildLane =
        authorityContext.lane ===
          "AUTHENTICATED_PORTABLE" &&
        child.purpose ===
          "BUSINESS_PROFILE"
          ? "PORTABLE_BUSINESS_PROFILE"
          : "NATIVE_BUSINESS_PROFILE";

    const pricingPolicyLane:
      FinoraControlBundlePricingPolicyChildLane =
        authorityContext.lane ===
          "AUTHENTICATED_PORTABLE" &&
        child.purpose ===
          "PRICING_POLICY"
          ? "PORTABLE_PRICING_POLICY"
          : "NATIVE_PRICING_POLICY";

    const childVerification =
      child.purpose ===
        "BRANCH_PORTABILITY_AUTHORITY"
        ? verifyFinoraSignedBranchPortabilityAuthorityPackage(
            child,
            trustedKeys,
            expectedBranchScope,
            now,
          )
        : (
            branchAccessLane ===
              "PORTABLE_BRANCH_ACCESS" ||
            storageEntitlementLane ===
              "PORTABLE_STORAGE_ENTITLEMENT" ||
            businessProfileLane ===
              "PORTABLE_BUSINESS_PROFILE" ||
            pricingPolicyLane ===
              "PORTABLE_PRICING_POLICY"
          )
          ? verifyFinoraSignedControlPackageBranchScope(
              child,
              trustedKeys,
              expectedBranchScope,
              now,
            )
          : verifyFinoraSignedControlPackageNative(
              child,
              trustedKeys,
              nativeExpectedTarget,
              now,
            );

    if (!childVerification.valid) {
      return failure(
        `FINORA CONTROL_BUNDLE child ${child.packageId} failed cryptographic preflight: ${childVerification.reason}: ${childVerification.error}`,
      );
    }

    if (
      childVerification.controlPackage.purpose !==
        child.purpose
    ) {
      return failure(
        "FINORA CONTROL_BUNDLE verified child purpose does not match the preflight purpose.",
      );
    }

    /*
     * Native-only BRANCH_ACCESS sub-actions must fail during
     * complete bundle preflight, before the first child mutation.
     *
     * Presence of credentialEnrollment is itself authoritative
     * evidence that the child belongs to the native enrollment
     * lane, even when the property value is undefined.
     */
    if (
      branchAccessLane ===
        "PORTABLE_BRANCH_ACCESS"
    ) {
      const verifiedPayload =
        childVerification.controlPackage.payload;

      if (!isRecord(verifiedPayload)) {
        return failure(
          `FINORA CONTROL_BUNDLE child ${child.packageId} portable BRANCH_ACCESS payload is invalid.`,
        );
      }

      if (
        verifiedPayload.action ===
          "AUTHORIZE_CREDENTIAL"
      ) {
        return failure(
          `FINORA CONTROL_BUNDLE child ${child.packageId} BRANCH_ACCESS AUTHORIZE_CREDENTIAL is native-only.`,
        );
      }

      if (
        Object.prototype.hasOwnProperty.call(
          verifiedPayload,
          "credentialEnrollment",
        )
      ) {
        return failure(
          `FINORA CONTROL_BUNDLE child ${child.packageId} portable BRANCH_ACCESS cannot carry credential enrollment authority.`,
        );
      }

      if (
        !isPortableBranchAccessBundleAction(
          verifiedPayload.action,
        )
      ) {
        return failure(
          `FINORA CONTROL_BUNDLE child ${child.packageId} BRANCH_ACCESS action is not eligible for portable authority.`,
        );
      }
    }

    if (
      child.purpose ===
        "BRANCH_ACCESS" &&
      branchAccessLane ===
        "NATIVE_BRANCH_ACCESS"
    ) {
      const verifiedPayload =
        childVerification.controlPackage.payload;

      if (
        isRecord(verifiedPayload) &&
        verifiedPayload.action ===
          "ISSUE" &&
        isRecord(
          verifiedPayload.credentialEnrollment,
        )
      ) {
        verifiedUsbCredentialBranchAccess = {
          signedPackage:
            child,

          verifiedTrustedKey: {
            ...childVerification.verifiedTrustedKey,
          },

          credentialEnrollment:
            verifiedPayload.credentialEnrollment,
        };
      }
    }

    if (
      child.purpose ===
        "BRANCH_PORTABILITY_AUTHORITY"
    ) {
      const verifiedPayload =
        childVerification.controlPackage.payload;

      if (!isRecord(verifiedPayload)) {
        return failure(
          "FINORA CONTROL_BUNDLE verified BRANCH_PORTABILITY_AUTHORITY payload is invalid.",
        );
      }

      verifiedUsbPortabilityProof = {
        signedPackage:
          child,

        verifiedTrustedKey: {
          ...childVerification.verifiedTrustedKey,
        },

        payload:
          verifiedPayload,
      };
    }

    if (
      packageIds.has(
        child.packageId,
      )
    ) {
      return failure(
        "FINORA CONTROL_BUNDLE contains a duplicate child package ID.",
      );
    }

    if (
      purposes.has(
        child.purpose,
      )
    ) {
      return failure(
        "FINORA CONTROL_BUNDLE v1 allows only one child package per purpose.",
      );
    }

    packageIds.add(
      child.packageId,
    );

    purposes.add(
      child.purpose,
    );

    /*
     * Preserve the signed child object exactly as parsed from
     * the verified outer payload. Existing child services
     * independently verify each child signature and purpose.
     */
    children.push({
      packageId:
        child.packageId,

      purpose:
        child.purpose,

      branchAccessLane,

      storageEntitlementLane,

      businessProfileLane,

      pricingPolicyLane,

      signedPackage:
        child,
    });
  }

  let credentialPortabilityAuthorityProvenance:
    FinoraBranchCredentialPortabilityAuthorityProvenanceV1 |
    undefined;

  if (
    verifiedUsbCredentialBranchAccess !==
      undefined ||
    verifiedUsbPortabilityProof !==
      undefined
  ) {
    if (
      verifiedUsbCredentialBranchAccess ===
        undefined ||
      verifiedUsbPortabilityProof ===
        undefined
    ) {
      return failure(
        "FINORA CONTROL_BUNDLE USB credential enrollment requires its correlated BRANCH_PORTABILITY_AUTHORITY proof.",
      );
    }

    const credentialEnrollment =
      verifiedUsbCredentialBranchAccess
        .credentialEnrollment;

    const portabilityPayload =
      verifiedUsbPortabilityProof
        .payload;

    if (
      credentialEnrollment.authorizationId !==
        portabilityPayload.sourceAuthorizationId ||
      credentialEnrollment.userId !==
        portabilityPayload.userId ||
      credentialEnrollment.username !==
        portabilityPayload.username ||
      credentialEnrollment.role !==
        portabilityPayload.role ||
      credentialEnrollment.ownerId !==
        portabilityPayload.ownerId ||
      credentialEnrollment.businessId !==
        portabilityPayload.businessId ||
      credentialEnrollment.branchId !==
        portabilityPayload.branchId ||
      credentialEnrollment.storageMode !==
        portabilityPayload.storageMode ||
      credentialEnrollment.dataContext !==
        portabilityPayload.dataContext ||
      credentialEnrollment.method !==
        portabilityPayload.sourceAuthorizationMethod ||
      credentialEnrollment.demoId !==
        portabilityPayload.demoId
    ) {
      return failure(
        "FINORA CONTROL_BUNDLE USB credential enrollment and Branch Portability Authority lineage do not match.",
      );
    }

    if (
      credentialEnrollment.ownerId !==
        controlBundle.target.ownerId ||
      credentialEnrollment.businessId !==
        controlBundle.target.businessId ||
      credentialEnrollment.branchId !==
        controlBundle.target.branchId
    ) {
      return failure(
        "FINORA CONTROL_BUNDLE USB credential authorization does not match the verified bundle branch target.",
      );
    }

    if (
      !verifiedSignersMatchExactly(
        verifiedUsbCredentialBranchAccess
          .verifiedTrustedKey,
        verifiedUsbPortabilityProof
          .verifiedTrustedKey,
      )
    ) {
      return failure(
        "FINORA CONTROL_BUNDLE USB credential children were not verified by the exact same trusted Control Center signing key.",
      );
    }

    const branchAccessIssuer =
      verifiedUsbCredentialBranchAccess
        .signedPackage.issuer;

    const portabilityIssuer =
      verifiedUsbPortabilityProof
        .signedPackage.issuer;

    if (
      !isRecord(branchAccessIssuer) ||
      !isRecord(portabilityIssuer) ||
      branchAccessIssuer.issuerId !==
        verifiedUsbCredentialBranchAccess
          .verifiedTrustedKey.issuerId ||
      branchAccessIssuer.signingKeyId !==
        verifiedUsbCredentialBranchAccess
          .verifiedTrustedKey.signingKeyId ||
      portabilityIssuer.issuerId !==
        verifiedUsbPortabilityProof
          .verifiedTrustedKey.issuerId ||
      portabilityIssuer.signingKeyId !==
        verifiedUsbPortabilityProof
          .verifiedTrustedKey.signingKeyId
    ) {
      return failure(
        "FINORA CONTROL_BUNDLE USB credential signer identity does not match verified trusted-key evidence.",
      );
    }

    const provenanceCandidate = {
      sourceAuthorizationId:
        portabilityPayload.sourceAuthorizationId,

      signedPortabilityAuthorityPackage:
        verifiedUsbPortabilityProof
          .signedPackage,

      verifiedControlSigner: {
        ...verifiedUsbPortabilityProof
          .verifiedTrustedKey,
      },

      verifiedAt:
        now.toISOString(),

      schemaVersion:
        1,
    };

    if (
      !isFinoraBranchCredentialPortabilityAuthorityProvenanceV1(
        provenanceCandidate,
      )
    ) {
      return failure(
        "FINORA CONTROL_BUNDLE verified Branch Portability Authority provenance is invalid.",
      );
    }

    credentialPortabilityAuthorityProvenance =
      provenanceCandidate;
  }

  // ----------------------------------------------------------
  // BEST-EFFORT ORDERED CHILD APPLY
  //
  // NON-ATOMIC:
  //
  // - A successful earlier child is not rolled back.
  // - A failed child does not prevent later child attempts.
  // ----------------------------------------------------------

  const childResults:
    FinoraControlBundleChildApplyResult[] =
      [];

  for (
    const child of
      children
  ) {

    try {

      const childResult =
        await applyChildPackage(
          child.purpose,
          child.branchAccessLane,
          child.storageEntitlementLane,
          child.businessProfileLane,
          child.pricingPolicyLane,
          child.signedPackage,
          trustedKeys,
          now,
          child.purpose ===
              "BRANCH_ACCESS"
            ? credentialPortabilityAuthorityProvenance
            : undefined,
        );

      childResults.push({
        packageId:
          child.packageId,

        purpose:
          child.purpose,

        success:
          childResult.success,

        ...(
          childResult.error
            ? {
                error:
                  childResult.error,
              }
            : {}
        ),
      });

    } catch (error) {

      childResults.push({
        packageId:
          child.packageId,

        purpose:
          child.purpose,

        success:
          false,

        error:
          error instanceof Error
            ? error.message
            : "FINORA Control Bundle child apply failed unexpectedly.",
      });
    }
  }

  const succeededCount =
    childResults.filter(
      (result) =>
        result.success,
    ).length;

  const failedCount =
    childResults.length -
    succeededCount;

  return {
    success:
      true,

    data: {
      bundlePackageId:
        controlBundle.packageId,

      issuerId:
        controlBundle.issuer.issuerId,

      signingKeyId:
        controlBundle.issuer.signingKeyId,

      sequence:
        controlBundle.sequence,

      issuedAt:
        controlBundle.issuedAt,

      childResults,

      succeededCount,

      failedCount,

      allChildrenApplied:
        failedCount ===
          0,
    },
  };
}

// ============================================================
// END
// ============================================================


