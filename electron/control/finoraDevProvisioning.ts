// ============================================================
// FINORA ENTERPRISE OS™
//
// ELECTRON DEVELOPMENT PROVISIONING
//
// RESPONSIBILITY:
//
// - Support trusted main-process activation smoke testing
// - Provision one installation identity
// - Provision one ACTIVE branch activation
// - Optionally provision one ACTIVE LOCAL storage entitlement
//
// SECURITY:
//
// - Main process only.
// - Explicit FINORA_DEV_PROVISION_BRANCH=1 required for branch
//   provisioning.
// - Explicit FINORA_DEV_PROVISION_LOCAL_ENTITLEMENT=1 required
//   for LOCAL entitlement provisioning.
// - No renderer IPC.
// - No USB entitlement grant.
// - No pricing.
// - No operational customer data.
//
// IMPORTANT:
//
// This module exists only for development/runtime validation.
// Production provisioning will use the final trusted FINORA
// provisioning/licensing path.
//
// VERSION : 1.1
// STATUS  : Development Only
// ============================================================

import {
  findFinoraBranchAccessGrant,
  findFinoraStorageEntitlement,
  saveFinoraBranchAccessGrant,
  saveFinoraBranchActivation,
  saveFinoraInstallationIdentity,
  saveFinoraStorageEntitlement,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchAccessGrant,
  FinoraControlBranchActivation,
  FinoraControlInstallationIdentity,
  FinoraControlStorageEntitlement,
  FinoraControlStorageMode,
} from "./finoraControlStore.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

// ============================================================
// ENVIRONMENT
// ============================================================

function requireEnvironmentValue(
  key: string,
): string {
  const value =
    process.env[key]?.trim();

  if (!value) {
    throw new Error(
      `Missing required FINORA development environment variable: ${key}`,
    );
  }

  return value;
}

const FINORA_DEV_REGISTERED_ACCESS_DURATION_MS =
  365 * 24 * 60 * 60 * 1000;

async function provisionFinoraDevelopmentRegisteredAccessGrant(
  entitlementId: string,
  userId: string,
  ownerId: string,
  businessId: string,
  branchId: string,
  storageMode: FinoraControlStorageMode,
  now: string,
): Promise<void> {

  const existingResult =
    await findFinoraBranchAccessGrant(
      userId,
      ownerId,
      businessId,
      branchId,
    );

  if (!existingResult.success) {
    throw new Error(
      existingResult.error ??
        "Unable to load the FINORA development Branch Access Grant.",
    );
  }

  const grantId =
    `FINORA-DEV-GRANT-${entitlementId}`;

  if (existingResult.data) {
    const existing =
      existingResult.data;

    if (
      existing.grantId !==
        grantId
    ) {
      throw new Error(
        "FINORA DEV Branch Access Grant identity does not match the existing registration.",
      );
    }

    if (
      existing.storageMode !==
        storageMode
    ) {
      throw new Error(
        "FINORA DEV registration storage mode cannot be changed.",
      );
    }

    return;
  }

  const validFromMs =
    Date.parse(
      now,
    );

  if (!Number.isFinite(validFromMs)) {
    throw new Error(
      "FINORA DEV registration timestamp is invalid.",
    );
  }

  const validUntil =
    new Date(
      validFromMs +
        FINORA_DEV_REGISTERED_ACCESS_DURATION_MS,
    ).toISOString();

  const accessGrant:
    FinoraControlBranchAccessGrant = {

      grantId,

      userId,

      ownerId,

      businessId,

      branchId,

      storageMode,

      accessType:
        "REGISTERED",

      administrativeStatus:
        "ACTIVE",

      validity: {
        validFrom:
          now,

        validUntil,
      },

      registrationPayment: {
        amount:
          2000,

        currency:
          "INR",

        paymentMode:
          "CASH",

        paidAt:
          now,

        remarks:
          "FINORA trusted development provisioning.",

        refundable:
          false,
      },

      registrationCycle:
        1,

      createdAt:
        now,

      updatedAt:
        now,

      schemaVersion:
        1,
    };

  const saveResult =
    await saveFinoraBranchAccessGrant(
      accessGrant,
    );

  if (!saveResult.success) {
    throw new Error(
      saveResult.error ??
        "FINORA development Branch Access Grant provisioning failed.",
    );
  }
}
// ============================================================
// DEVELOPMENT PROVISIONING
// ============================================================

export async function runFinoraDevelopmentProvisioning():
  Promise<void> {

  const shouldProvisionBranch =
    process.env.FINORA_DEV_PROVISION_BRANCH ===
    "1";

  const shouldProvisionLocalEntitlement =
    process.env.FINORA_DEV_PROVISION_LOCAL_ENTITLEMENT ===
    "1";

  const shouldProvisionUsbEntitlement =
    process.env.FINORA_DEV_PROVISION_USB_ENTITLEMENT ===
    "1";

  const shouldRevokeUsbEntitlement =
    process.env.FINORA_DEV_REVOKE_USB_ENTITLEMENT ===
    "1";

  const shouldDelayedRevokeUsbEntitlement =
    process.env.FINORA_DEV_DELAYED_REVOKE_USB_ENTITLEMENT ===
    "1";

  if (
    shouldProvisionLocalEntitlement &&
    shouldProvisionUsbEntitlement
  ) {
    throw new Error(
      "FINORA DEV registration cannot provision both LOCAL and USB storage modes.",
    );
  }
  if (
    shouldProvisionUsbEntitlement &&
    shouldRevokeUsbEntitlement
  ) {
    throw new Error(
      "FINORA DEV USB entitlement cannot be provisioned and revoked in the same startup.",
    );
  }

  if (
    !shouldProvisionBranch &&
    !shouldProvisionLocalEntitlement &&
    !shouldProvisionUsbEntitlement &&
    !shouldRevokeUsbEntitlement &&
    !shouldDelayedRevokeUsbEntitlement
  ) {
    return;
  }

  const ownerId =
    requireEnvironmentValue(
      "FINORA_DEV_OWNER_ID",
    );

  const businessId =
    requireEnvironmentValue(
      "FINORA_DEV_BUSINESS_ID",
    );

  const branchId =
    requireEnvironmentValue(
      "FINORA_DEV_BRANCH_ID",
    );

  // ==========================================================
  // BRANCH PROVISIONING
  // ==========================================================

  if (shouldProvisionBranch) {

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    const installationId =
      nativeBinding.installationId;

    /*
     * Backward-compatible development assertion only.
     *
     * FINORA_DEV_INSTALLATION_ID no longer creates or selects
     * installation identity. Native binding is authoritative.
     */
    const configuredInstallationId =
      process.env.FINORA_DEV_INSTALLATION_ID
        ?.trim();

    if (
      configuredInstallationId &&
      configuredInstallationId !==
        installationId
    ) {
      throw new Error(
        "FINORA DEV installation ID does not match the native installation binding.",
      );
    }

    const activationId =
      requireEnvironmentValue(
        "FINORA_DEV_ACTIVATION_ID",
      );

    const businessCode =
      requireEnvironmentValue(
        "FINORA_DEV_BUSINESS_CODE",
      );

    const branchCode =
      requireEnvironmentValue(
        "FINORA_DEV_BRANCH_CODE",
      );

    const now =
      new Date().toISOString();

    const installation:
      FinoraControlInstallationIdentity = {

      installationId,

      ownerId,

      businessId,

      branchId,

      businessCode,

      branchCode,

      createdAt:
        now,

      updatedAt:
        now,

      schemaVersion:
        1,
    };

    const installationResult =
      await saveFinoraInstallationIdentity(
        installation,
      );

    if (!installationResult.success) {
      throw new Error(
        installationResult.error ??
          "FINORA development installation provisioning failed.",
      );
    }

    const activation:
      FinoraControlBranchActivation = {

      activationId,

      ownerId,

      businessId,

      branchId,

      status:
        "ACTIVE",

      activatedAt:
        now,

      createdAt:
        now,

      updatedAt:
        now,

      schemaVersion:
        1,
    };

    const activationResult =
      await saveFinoraBranchActivation(
        activation,
      );

    if (!activationResult.success) {
      throw new Error(
        activationResult.error ??
          "FINORA development branch activation provisioning failed.",
      );
    }

    console.log(
      "[FINORA DEV] Branch provisioning completed:",
      {
        installationId,
        ownerId,
        businessId,
        branchId,
        activationStatus:
          "ACTIVE",
      },
    );
  }

  // ==========================================================
  // LOCAL STORAGE ENTITLEMENT PROVISIONING
  //
  // Commercial entitlement is scoped to:
  //
  // userId + ownerId + businessId + branchId + storageMode
  //
  // USB is deliberately NOT granted here.
  // ==========================================================

  if (shouldProvisionLocalEntitlement) {

    const entitlementId =
      requireEnvironmentValue(
        "FINORA_DEV_LOCAL_ENTITLEMENT_ID",
      );

    const userId =
      requireEnvironmentValue(
        "FINORA_DEV_ENTITLEMENT_USER_ID",
      );

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    const now =
      new Date().toISOString();

    const entitlement:
      FinoraControlStorageEntitlement = {

      entitlementId,

      userId,

      ownerId,

      businessId,

      branchId,

      installationId:
        nativeBinding.installationId,

      bindingKeyId:
        nativeBinding.bindingKeyId,

      fingerprintAlgorithm:
        nativeBinding.fingerprintAlgorithm,

      publicKeyFingerprint:
        nativeBinding.publicKeyFingerprint,

      storageMode:
        "LOCAL",

      status:
        "ACTIVE",

      activatedAt:
        now,

      createdAt:
        now,

      updatedAt:
        now,

      schemaVersion:
        1,
    };

    const entitlementResult =
      await saveFinoraStorageEntitlement(
        entitlement,
      );

    if (!entitlementResult.success) {
      throw new Error(
        entitlementResult.error ??
          "FINORA development LOCAL storage entitlement provisioning failed.",
      );
    }

    await provisionFinoraDevelopmentRegisteredAccessGrant(
      entitlementId,
      userId,
      ownerId,
      businessId,
      branchId,
      "LOCAL",
      now,
    );
    console.log(
      "[FINORA DEV] LOCAL storage entitlement provisioning completed:",
      {
        entitlementId,
        userId,
        ownerId,
        businessId,
        branchId,
        storageMode:
          "LOCAL",
        entitlementStatus:
          "ACTIVE",
      },
    );
  }

  // ==========================================================
  // USB STORAGE ENTITLEMENT PROVISIONING
  //
  // Commercial entitlement is independently scoped to:
  //
  // userId + ownerId + businessId + branchId + USB
  //
  // LOCAL entitlement is not implied by this grant.
  // ==========================================================

  if (shouldProvisionUsbEntitlement) {

    const entitlementId =
      requireEnvironmentValue(
        "FINORA_DEV_USB_ENTITLEMENT_ID",
      );

    const userId =
      requireEnvironmentValue(
        "FINORA_DEV_ENTITLEMENT_USER_ID",
      );

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    const now =
      new Date().toISOString();

    const entitlement:
      FinoraControlStorageEntitlement = {

      entitlementId,

      userId,

      ownerId,

      businessId,

      branchId,

      installationId:
        nativeBinding.installationId,

      bindingKeyId:
        nativeBinding.bindingKeyId,

      fingerprintAlgorithm:
        nativeBinding.fingerprintAlgorithm,

      publicKeyFingerprint:
        nativeBinding.publicKeyFingerprint,

      storageMode:
        "USB",

      status:
        "ACTIVE",

      activatedAt:
        now,

      createdAt:
        now,

      updatedAt:
        now,

      schemaVersion:
        1,
    };

    const entitlementResult =
      await saveFinoraStorageEntitlement(
        entitlement,
      );

    if (!entitlementResult.success) {
      throw new Error(
        entitlementResult.error ??
          "FINORA development USB storage entitlement provisioning failed.",
      );
    }

    await provisionFinoraDevelopmentRegisteredAccessGrant(
      entitlementId,
      userId,
      ownerId,
      businessId,
      branchId,
      "USB",
      now,
    );
    console.log(
      "[FINORA DEV] USB storage entitlement provisioning completed:",
      {
        entitlementId,
        userId,
        ownerId,
        businessId,
        branchId,
        storageMode:
          "USB",
        entitlementStatus:
          "ACTIVE",
      },
    );
  }

  // ==========================================================
  // USB STORAGE ENTITLEMENT REVOCATION
  //
  // Trusted development-only lifecycle test.
  //
  // Existing entitlement identity and activation history are
  // preserved. Only status and updatedAt are changed.
  // ==========================================================

  if (shouldRevokeUsbEntitlement) {

    const expectedEntitlementId =
      requireEnvironmentValue(
        "FINORA_DEV_USB_ENTITLEMENT_ID",
      );

    const userId =
      requireEnvironmentValue(
        "FINORA_DEV_ENTITLEMENT_USER_ID",
      );

    const existingResult =
      await findFinoraStorageEntitlement(
        userId,
        ownerId,
        businessId,
        branchId,
        "USB",
      );

    if (!existingResult.success) {
      throw new Error(
        existingResult.error ??
          "Unable to load the FINORA USB storage entitlement for revocation.",
      );
    }

    if (!existingResult.data) {
      throw new Error(
        "No FINORA USB storage entitlement exists for revocation.",
      );
    }

    const existingEntitlement =
      existingResult.data;

    if (
      existingEntitlement.entitlementId !==
      expectedEntitlementId
    ) {
      throw new Error(
        "FINORA DEV USB entitlement identity does not match the existing entitlement.",
      );
    }

    const revokedEntitlement:
      FinoraControlStorageEntitlement = {

      ...existingEntitlement,

      status:
        "REVOKED",

      updatedAt:
        new Date().toISOString(),
    };

    const revokeResult =
      await saveFinoraStorageEntitlement(
        revokedEntitlement,
      );

    if (!revokeResult.success) {
      throw new Error(
        revokeResult.error ??
          "FINORA development USB storage entitlement revocation failed.",
      );
    }

    console.log(
      "[FINORA DEV] USB storage entitlement revoked:",
      {
        entitlementId:
          revokedEntitlement.entitlementId,
        userId,
        ownerId,
        businessId,
        branchId,
        storageMode:
          "USB",
        entitlementStatus:
          "REVOKED",
      },
    );
  }

  // ==========================================================
  // DELAYED USB STORAGE ENTITLEMENT REVOCATION
  //
  // Development-only active-session lifecycle test.
  // No renderer write capability is exposed.
  // ==========================================================

  if (shouldDelayedRevokeUsbEntitlement) {

    const expectedEntitlementId =
      requireEnvironmentValue(
        "FINORA_DEV_USB_ENTITLEMENT_ID",
      );

    const userId =
      requireEnvironmentValue(
        "FINORA_DEV_ENTITLEMENT_USER_ID",
      );

    const delayValue =
      requireEnvironmentValue(
        "FINORA_DEV_DELAYED_REVOKE_USB_AFTER_MS",
      );

    const delayMilliseconds =
      Number(delayValue);

    if (
      !Number.isFinite(delayMilliseconds) ||
      delayMilliseconds < 1000
    ) {
      throw new Error(
        "FINORA DEV delayed USB revoke delay must be at least 1000 milliseconds.",
      );
    }

    console.log(
      "[FINORA DEV] USB storage entitlement delayed revocation scheduled:",
      {
        entitlementId:
          expectedEntitlementId,
        userId,
        ownerId,
        businessId,
        branchId,
        delayMilliseconds,
      },
    );

    setTimeout(() => {
      void (async () => {

        try {
          const existingResult =
            await findFinoraStorageEntitlement(
              userId,
              ownerId,
              businessId,
              branchId,
              "USB",
            );

          if (
            !existingResult.success ||
            !existingResult.data
          ) {
            throw new Error(
              existingResult.error ??
                "No FINORA USB storage entitlement exists for delayed revocation.",
            );
          }

          const existingEntitlement =
            existingResult.data;

          if (
            existingEntitlement.entitlementId !==
            expectedEntitlementId
          ) {
            throw new Error(
              "FINORA DEV delayed USB entitlement identity mismatch.",
            );
          }

          const revokedEntitlement:
            FinoraControlStorageEntitlement = {

            ...existingEntitlement,

            status:
              "REVOKED",

            updatedAt:
              new Date().toISOString(),
          };

          const revokeResult =
            await saveFinoraStorageEntitlement(
              revokedEntitlement,
            );

          if (!revokeResult.success) {
            throw new Error(
              revokeResult.error ??
                "FINORA delayed USB entitlement revocation failed.",
            );
          }

          console.log(
            "[FINORA DEV] USB storage entitlement delayed revoke completed:",
            {
              entitlementId:
                revokedEntitlement.entitlementId,
              userId,
              ownerId,
              businessId,
              branchId,
              storageMode:
                "USB",
              entitlementStatus:
                "REVOKED",
            },
          );
        } catch (error) {
          console.error(
            "[FINORA DEV] USB delayed entitlement revoke failed:",
            error,
          );
        }
      })();
    }, delayMilliseconds);
  }
}

// ============================================================
// END
// ============================================================