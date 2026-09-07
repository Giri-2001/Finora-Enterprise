// ============================================================
// FINORA ENTERPRISE OS™
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
  verifyFinoraSignedControlPackageNative,
} from "./finoraSignedControlPackageVerifier.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import {
  applyFinoraSignedBranchActivationPackage,
} from "./finoraBranchActivationPackageApplyService.js";

import {
  applyFinoraSignedStorageEntitlementPackage,
} from "./finoraStorageEntitlementPackageApplyService.js";

import {
  applyFinoraSignedBusinessProfilePackage,
} from "./finoraBusinessProfilePackageApplyService.js";

import {
  applyFinoraSignedPricingPolicyPackage,
} from "./finoraPricingPolicyPackageApplyService.js";

import {
  applyFinoraSignedWalletRechargePackage,
} from "./finoraWalletRechargePackageApplyService.js";

// ============================================================
// CONTRACT
// ============================================================

export const FINORA_CONTROL_BUNDLE_FORMAT =
  "FINORA_CONTROL_BUNDLE_V1" as const;

export type FinoraControlBundleChildPurpose =
  | "BRANCH_ACTIVATION"
  | "STORAGE_ENTITLEMENT"
  | "BUSINESS_PROFILE"
  | "PRICING_POLICY"
  | "WALLET_RECHARGE";

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
      "STORAGE_ENTITLEMENT" ||
    value ===
      "BUSINESS_PROFILE" ||
    value ===
      "PRICING_POLICY" ||
    value ===
      "WALLET_RECHARGE"
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

// ============================================================
// CHILD DISPATCH
// ============================================================

async function applyChildPackage(
  purpose:
    FinoraControlBundleChildPurpose,

  signedPackage:
    unknown,

  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[],

  now:
    Date,
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

    case "STORAGE_ENTITLEMENT": {

      const result =
        await applyFinoraSignedStorageEntitlementPackage(
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
        await applyFinoraSignedBusinessProfilePackage(
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
        await applyFinoraSignedPricingPolicyPackage(
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
    Date = new Date(),
): Promise<
  FinoraControlBundleApplyResult
> {

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
    nativeBinding.installationId !==
      installation.installationId
  ) {
    return failure(
      "FINORA native installation binding does not match the Control Store installation identity.",
    );
  }

  const expectedTarget = {
    ownerId:
      installation.ownerId,

    businessId:
      installation.businessId,

    branchId:
      installation.branchId,

    installationId:
      installation.installationId,

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
    verifyFinoraSignedControlPackageNative(
      signedBundle,
      trustedKeys,
      expectedTarget,
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
      5
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

      signedPackage:
        unknown;
    }[] =
      [];

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

    if (
      !targetsMatch(
        child.target,
        controlBundle.target,
      )
    ) {
      return failure(
        "FINORA CONTROL_BUNDLE child package target does not match the verified outer bundle target.",
      );
    }

    /*
     * Complete cryptographic preflight for every child before
     * any purpose-specific child apply is allowed to begin.
     *
     * Existing child apply services intentionally verify again
     * at mutation time. This duplicate verification provides a
     * defense-in-depth boundary while preserving those services
     * as the authoritative domain/replay/state validators.
     */
    const childVerification =
      verifyFinoraSignedControlPackageNative(
        child,
        trustedKeys,
        expectedTarget,
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

      signedPackage:
        child,
    });
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
          child.signedPackage,
          trustedKeys,
          now,
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