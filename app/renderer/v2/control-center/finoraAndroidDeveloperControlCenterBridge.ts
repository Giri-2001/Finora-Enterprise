import {
  Capacitor,
  registerPlugin,
} from "@capacitor/core";

import type {
  FinoraControlCenterBridge,
} from "../../../../electron/control-center/finoraControlCenterPreload";

type NativeMethod =
  (
    options?: unknown,
  ) => Promise<unknown>;

type NativeDeveloperControlCenterPlugin =
  Record<
    string,
    NativeMethod
  >;

const androidDeveloperPlugin =
  registerPlugin<
    NativeDeveloperControlCenterPlugin
  >(
    "FinoraDeveloperControlCenter",
  );

function invokeNative<T>(
  method:
    string,
  options?:
    unknown,
): Promise<T> {

  const candidate =
    androidDeveloperPlugin[
      method
    ];

  if (
    typeof candidate !==
    "function"
  ) {
    return Promise.resolve(
      {
        success:
          false,

        error:
          `FINORA Android Developer Control Center method ${method} is unavailable.`,
      } as T,
    );
  }

  if (
    options ===
    undefined
  ) {
    return candidate() as Promise<T>;
  }

  return candidate(
    options,
  ) as Promise<T>;
}

function createAndroidBridge():
  FinoraControlCenterBridge {

  return {

    getDeveloperSecurityState:
      () =>
        invokeNative(
          "getDeveloperSecurityState",
        ),

    initializeDeveloperSecurityCodeFromAdminRecovery:
      (
        request,
      ) =>
        invokeNative(
          "initializeDeveloperSecurityCodeFromAdminRecovery",
          request,
        ),

    unlockDeveloperControlCenter:
      (
        securityCode,
      ) =>
        invokeNative(
          "unlockDeveloperControlCenter",
          {
            securityCode,
          },
        ),

    lockDeveloperControlCenter:
      () =>
        invokeNative(
          "lockDeveloperControlCenter",
        ),

    exportPortableState:
      (
        input,
      ) =>
        invokeNative(
          "exportPortableState",
          input,
        ),

    importPortableState:
      (
        input,
      ) =>
        invokeNative(
          "importPortableState",
          input,
        ),
    getTrustRecord:
      () =>
        invokeNative(
          "getTrustRecord",
        ),

    getBranchRegistry:
      () =>
        invokeNative(
          "getBranchRegistry",
        ),

    getBranchDirectoryMetadata:
      () =>
        invokeNative(
          "getBranchDirectoryMetadata",
        ),

    getFinoraIncomePricing:
      () =>
        invokeNative(
          "getFinoraIncomePricing",
        ),

    updateFinoraIncomePricing:
      (
        input,
      ) =>
        invokeNative(
          "updateFinoraIncomePricing",
          input,
        ),

    getFinoraBranchPricing:
      (
        scope,
      ) =>
        invokeNative(
          "getFinoraBranchPricing",
          scope,
        ),

    updateFinoraBranchPricing:
      (
        input,
      ) =>
        invokeNative(
          "updateFinoraBranchPricing",
          input,
        ),

    getWalletHistory:
      () =>
        invokeNative(
          "getWalletHistory",
        ),

    backfillHistoricalEnrollmentBranch:
      () =>
        invokeNative(
          "backfillHistoricalEnrollmentBranch",
        ),

    openBranchCertificationRotationRequest:
      () =>
        invokeNative(
          "openBranchCertificationRotationRequest",
        ),

    issueAndExportBranchCertificationRotation:
      () =>
        invokeNative(
          "issueAndExportBranchCertificationRotation",
        ),

    openInstallationEnrollmentRequest:
      () =>
        invokeNative(
          "openInstallationEnrollmentRequest",
        ),

    openWalletRechargeRequest:
      () =>
        invokeNative(
          "openWalletRechargeRequest",
        ),

    approveAndExportWalletRechargeRequest:
      () =>
        invokeNative(
          "approveAndExportWalletRechargeRequest",
        ),

    declineAndExportWalletRechargeRequest:
      () =>
        invokeNative(
          "declineAndExportWalletRechargeRequest",
        ),

    issueAndExportInstallationEnrollmentResponse:
      (
        assignment,
      ) =>
        invokeNative(
          "issueAndExportInstallationEnrollmentResponse",
          assignment,
        ),

    issueBranchActivation:
      (
        request,
      ) =>
        invokeNative(
          "issueBranchActivation",
          request,
        ),

    issueBranchAccess:
      (
        request,
      ) =>
        invokeNative(
          "issueBranchAccess",
          request,
        ),

    issueBranchDeviceRevocation:
      (
        request,
      ) =>
        invokeNative(
          "issueBranchDeviceRevocation",
          request,
        ),

    issueStorageEntitlement:
      (
        request,
      ) =>
        invokeNative(
          "issueStorageEntitlement",
          request,
        ),

    issuePortableStorageEntitlement:
      (
        request,
      ) =>
        invokeNative(
          "issuePortableStorageEntitlement",
          request,
        ),

    issueBusinessProfile:
      (
        request,
      ) =>
        invokeNative(
          "issueBusinessProfile",
          request,
        ),

    issuePricingPolicy:
      (
        request,
      ) =>
        invokeNative(
          "issuePricingPolicy",
          request,
        ),

    issueWalletRecharge:
      (
        request,
      ) =>
        invokeNative(
          "issueWalletRecharge",
          request,
        ),

    issueAndExportControlBundle:
      (
        request,
      ) =>
        invokeNative(
          "issueAndExportControlBundle",
          request,
        ),

    exportAdminAuthorityRecovery:
      (
        securityCode,
      ) =>
        invokeNative(
          "exportAdminAuthorityRecovery",
          {
            securityCode,
          },
        ),

    importAndRecoverAdminAuthority:
      (
        securityCode,
      ) =>
        invokeNative(
          "importAndRecoverAdminAuthority",
          {
            securityCode,
          },
        ),

    changeDeveloperSecurityCode:
      (
        request,
      ) =>
        invokeNative(
          "changeDeveloperSecurityCode",
          request,
        ),

  } as FinoraControlCenterBridge;
}

export function
installFinoraAndroidDeveloperControlCenterBridge():
  boolean {

  if (
    typeof window ===
    "undefined"
  ) {
    return false;
  }

  /*
   * Electron preload remains authoritative on Windows.
   */
  if (
    window.finoraControlCenter
  ) {
    return false;
  }

  if (
    !Capacitor.isNativePlatform() ||
    Capacitor.getPlatform() !==
      "android"
  ) {
    return false;
  }

  if (
    !Capacitor.isPluginAvailable(
      "FinoraDeveloperControlCenter",
    )
  ) {
    return false;
  }

  window.finoraControlCenter =
    createAndroidBridge();

  return true;
}