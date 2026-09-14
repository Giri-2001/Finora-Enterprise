// ============================================================
// FINORA ENTERPRISE OS™
//
// ELECTRON CONTROL IPC
//
// RESPONSIBILITY:
//
// - Expose narrow read-only FINORA control-state operations
// - Support pre-login installation / activation checks
// - Support per-login LOCAL / USB entitlement checks
// - Enforce trusted-renderer validation on every request
//
// SECURITY:
//
// Renderer MAY:
// - Read installation identity
// - Read branch activation state
// - Check whether one storage entitlement is ACTIVE
//
// Renderer MUST NOT:
// - Create branch activation
// - Modify branch activation
// - Create LOCAL / USB entitlement
// - Modify entitlement status
//
// Paid activation and entitlement writes remain inside trusted
// FINORA provisioning / main-process flows.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  BrowserWindow,
  ipcMain,
} from "electron";

import {
  findFinoraBranchActivation,
  getFinoraInstallationIdentity,
  hasActiveFinoraStorageEntitlement,
} from "./finoraControlStore.js";

import type {
  FinoraControlStorageMode,
} from "./finoraControlStore.js";

import {
  findFinoraBusinessProfile,
  findFinoraPricingPolicy,
  findFinoraWalletRechargeAuthorization,

  findFinoraWalletRechargeDecline,
} from "./finoraControlStore.js";

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  importFinoraControlBundleFromNativeDialog,
} from "./finoraControlBundleImportCoordinator.js";

import {
  exportFinoraInstallationEnrollmentRequestFromNativeDialog,
} from "./finoraInstallationEnrollmentRequestFileTransport.js";

import {
  openVerifiedFinoraInstallationEnrollmentResponse,
} from "./finoraInstallationEnrollmentResponseFileTransport.js";

import {
  applyVerifiedFinoraInstallationEnrollmentResponse,
} from "./finoraInstallationEnrollmentBootstrapCoordinator.js";

import {
  evaluateFinoraAuthoritativeBranchAccess,
} from "./finoraBranchAccessAuthorityService.js";

// ============================================================
// IPC CHANNELS
// ============================================================

import {
  exportFinoraWalletRechargeRequestFromNativeDialog,
} from "./finoraWalletRechargeRequestFileTransport.js";

import type {
  CreateFinoraWalletRechargeRequestInput,
} from "./finoraWalletRechargeRequestService.js";

import type {
  FinoraWalletRechargeRequestPaymentMethod,
  FinoraWalletRechargeRequestPaymentSource,
} from "./finoraWalletRechargeRequest.types.js";

const CONTROL_IPC_CHANNELS = {
  GET_INSTALLATION:
    "finora:control:get-installation",

  FIND_BRANCH_ACTIVATION:
    "finora:control:find-branch-activation",

  EVALUATE_BRANCH_ACCESS:
    "finora:control:evaluate-branch-access",

  FIND_BUSINESS_PROFILE:
    "finora:control:find-business-profile",

  FIND_PRICING_POLICY:
    "finora:control:find-pricing-policy",

  FIND_WALLET_RECHARGE_AUTHORIZATION:
    "finora:control:find-wallet-recharge-authorization",

  FIND_WALLET_RECHARGE_DECLINE:
    "finora:control:find-wallet-recharge-decline",

  EXPORT_WALLET_RECHARGE_REQUEST:
    "finora:control:export-wallet-recharge-request",
  HAS_ACTIVE_STORAGE_ENTITLEMENT:
    "finora:control:has-active-storage-entitlement",

  EXPORT_INSTALLATION_ENROLLMENT_REQUEST:
    "finora:control:export-installation-enrollment-request",

  IMPORT_INSTALLATION_ENROLLMENT_RESPONSE:
    "finora:control:import-installation-enrollment-response",

  IMPORT_CONTROL_BUNDLE:
    "finora:control:import-control-bundle",
} as const;

// ============================================================
// TRUST VALIDATOR
// ============================================================

export type FinoraControlRendererValidator = (
  senderFrame:
    Electron.WebFrameMain | null,
) => boolean;

// ============================================================
// REQUEST TYPES
// ============================================================

interface FindBranchActivationRequest {
  ownerId: string;

  businessId: string;

  branchId: string;
}

interface FindBranchAccessGrantRequest {
  userId: string;

  ownerId: string;

  businessId: string;

  branchId: string;
}
interface FindWalletRechargeAuthorizationRequest {
  ownerId: string;

  businessId: string;

  branchId: string;

  paymentReference: string;
}

type ExportWalletRechargeRequest =
  CreateFinoraWalletRechargeRequestInput;

interface StorageEntitlementCheckRequest {
  userId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  storageMode: FinoraControlStorageMode;
}

// ============================================================
// RESULT HELPERS
// ============================================================

function failure(
  error: string,
) {
  return {
    success: false,
    error,
  };
}
function success<T>(
  data:
    T,
) {
  return {
    success:
      true,

    data,
  };
}

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isStorageMode(
  value: unknown,
): value is FinoraControlStorageMode {
  return (
    value === "LOCAL" ||
    value === "USB"
  );
}

// ============================================================
// REQUEST VALIDATION
// ============================================================

function isFindBranchActivationRequest(
  value: unknown,
): value is FindBranchActivationRequest {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const request =
    value as Record<string, unknown>;

  return (
    isNonEmptyString(request.ownerId) &&
    isNonEmptyString(request.businessId) &&
    isNonEmptyString(request.branchId)
  );
}

function isFindBranchAccessGrantRequest(
  value: unknown,
): value is FindBranchAccessGrantRequest {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const request =
    value as Record<string, unknown>;

  return (
    isNonEmptyString(request.userId) &&
    isNonEmptyString(request.ownerId) &&
    isNonEmptyString(request.businessId) &&
    isNonEmptyString(request.branchId)
  );
}
function isFindWalletRechargeAuthorizationRequest(
  value: unknown,
): value is FindWalletRechargeAuthorizationRequest {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const request =
    value as Record<string, unknown>;

  return (
    isNonEmptyString(request.ownerId) &&
    isNonEmptyString(request.businessId) &&
    isNonEmptyString(request.branchId) &&
    isNonEmptyString(request.paymentReference)
  );
}

function isWalletRechargeRequestPaymentMethod(
  value:
    unknown,
): value is FinoraWalletRechargeRequestPaymentMethod {

  return (
    value === "UPI" ||
    value === "PHONEPE" ||
    value === "GOOGLE_PAY" ||
    value === "PAYTM" ||
    value === "RAZORPAY" ||
    value === "BANK_TRANSFER" ||
    value === "OTHER"
  );
}

function isWalletRechargeRequestPaymentSource(
  value:
    unknown,
): value is FinoraWalletRechargeRequestPaymentSource {

  return (
    value === "PHONEPE" ||
    value === "RAZORPAY" ||
    value === "UPI" ||
    value === "GOOGLE_PAY" ||
    value === "PAYTM" ||
    value === "BANK_TRANSFER" ||
    value === "MANUAL"
  );
}

function isExportWalletRechargeRequest(
  value:
    unknown,
): value is ExportWalletRechargeRequest {

  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(
      value,
    )
  ) {
    return false;
  }

  const request =
    value as Record<string, unknown>;

  return (
    isNonEmptyString(
      request.sessionId,
    ) &&
    isNonEmptyString(
      request.paymentReference,
    ) &&
    typeof request.amountMinor ===
      "number" &&
    Number.isSafeInteger(
      request.amountMinor,
    ) &&
    request.amountMinor >
      0 &&
    isWalletRechargeRequestPaymentMethod(
      request.paymentMethod,
    ) &&
    isWalletRechargeRequestPaymentSource(
      request.paymentSource,
    )
  );
}

function isStorageEntitlementCheckRequest(
  value: unknown,
): value is StorageEntitlementCheckRequest {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const request =
    value as Record<string, unknown>;

  return (
    isNonEmptyString(request.userId) &&
    isNonEmptyString(request.ownerId) &&
    isNonEmptyString(request.businessId) &&
    isNonEmptyString(request.branchId) &&
    isStorageMode(request.storageMode)
  );
}

// ============================================================
// REGISTRATION STATE
// ============================================================

let controlHandlersRegistered =
  false;

// ============================================================
// REGISTER CONTROL IPC HANDLERS
// ============================================================

export function registerFinoraControlHandlers(
  isTrustedRenderer:
    FinoraControlRendererValidator,
): void {
  if (controlHandlersRegistered) {
    return;
  }

  controlHandlersRegistered = true;

  // ----------------------------------------------------------
  // INSTALLATION IDENTITY
  // ----------------------------------------------------------

  ipcMain.handle(
    CONTROL_IPC_CHANNELS.GET_INSTALLATION,
    async (event) => {
      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "Untrusted renderer.",
        );
      }

      return getFinoraInstallationIdentity();
    },
  );

  // ----------------------------------------------------------
  // BRANCH ACTIVATION
  // ----------------------------------------------------------

  ipcMain.handle(
    CONTROL_IPC_CHANNELS.FIND_BRANCH_ACTIVATION,
    async (
      event,
      request: unknown,
    ) => {
      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "Untrusted renderer.",
        );
      }

      if (
        !isFindBranchActivationRequest(
          request,
        )
      ) {
        return failure(
          "A valid FINORA branch activation request is required.",
        );
      }

      return findFinoraBranchActivation(
        request.ownerId,
        request.businessId,
        request.branchId,
      );
    },
  );

  // ----------------------------------------------------------
  // AUTHORITATIVE BRANCH ACCESS
  //
  // SECURITY:
  //
  // Renderer supplies identity only.
  // Current wall-clock authority, installation binding,
  // persisted high-water and Branch Access validity evaluation
  // remain inside Electron main.
  // ----------------------------------------------------------

  ipcMain.handle(
    CONTROL_IPC_CHANNELS.EVALUATE_BRANCH_ACCESS,
    async (
      event,
      request: unknown,
    ) => {
      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "Untrusted renderer.",
        );
      }

      const parentWindow =
        BrowserWindow.fromWebContents(
          event.sender,
        );

      if (
        !parentWindow ||
        parentWindow.isDestroyed()
      ) {
        return failure(
          "The FINORA application window is not available for Branch Access authorization.",
        );
      }

      if (
        event.senderFrame !==
          parentWindow.webContents.mainFrame
      ) {
        return failure(
          "FINORA Branch Access authorization is restricted to the trusted application main frame.",
        );
      }

      if (
        !isFindBranchAccessGrantRequest(
          request,
        )
      ) {
        return failure(
          "A valid FINORA branch access authorization request is required.",
        );
      }

      return evaluateFinoraAuthoritativeBranchAccess({
        userId:
          request.userId,

        ownerId:
          request.ownerId,

        businessId:
          request.businessId,

        branchId:
          request.branchId,
      });
    },
  );

  // ----------------------------------------------------------
  // BUSINESS PROFILE
  //
  // READ ONLY.
  //
  // Native installation-binding metadata remains inside
  // Electron main. Renderer receives only provisioned identity.
  // ----------------------------------------------------------

  ipcMain.handle(
    CONTROL_IPC_CHANNELS.FIND_BUSINESS_PROFILE,
    async (
      event,
      request: unknown,
    ) => {

      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Control Business Profile access is restricted to the trusted renderer.",
        );
      }

      if (
        typeof request !==
          "object" ||
        request ===
          null ||
        Array.isArray(
          request,
        )
      ) {
        return failure(
          "A valid FINORA Business Profile request is required.",
        );
      }

      const record =
        request as Record<string, unknown>;

      const ownerId =
        typeof record.ownerId ===
          "string"
          ? record.ownerId.trim()
          : "";

      const businessId =
        typeof record.businessId ===
          "string"
          ? record.businessId.trim()
          : "";

      const branchId =
        typeof record.branchId ===
          "string"
          ? record.branchId.trim()
          : "";

      if (
        !ownerId ||
        !businessId ||
        !branchId
      ) {
        return failure(
          "Owner ID, Business ID and Branch ID are required to read the FINORA Business Profile.",
        );
      }

      const result =
        await findFinoraBusinessProfile(
          ownerId,
          businessId,
          branchId,
        );

      if (!result.success) {
        return result;
      }

      if (!result.data) {
        return {
          success:
            true,

          data:
            undefined,
        };
      }

      const profile =
        result.data;

      return {
        success:
          true,

        data: {
          profileId:
            profile.profileId,

          ownerId:
            profile.ownerId,

          businessId:
            profile.businessId,

          branchId:
            profile.branchId,

          businessCode:
            profile.businessCode,

          branchCode:
            profile.branchCode,

          businessName:
            profile.businessName,

          branchName:
            profile.branchName,

          createdAt:
            profile.createdAt,

          updatedAt:
            profile.updatedAt,

          schemaVersion:
            1 as const,
        },
      };
    },
  );

  // ----------------------------------------------------------
  // PRICING POLICY
  //
  // READ ONLY.
  //
  // Native installation-binding metadata remains inside
  // Electron main. Renderer receives only the authoritative
  // verified Pricing Override schedule.
  // ----------------------------------------------------------

  ipcMain.handle(
    CONTROL_IPC_CHANNELS.FIND_PRICING_POLICY,
    async (
      event,
      request: unknown,
    ) => {

      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Control Pricing Policy access is restricted to the trusted renderer.",
        );
      }

      if (
        typeof request !==
          "object" ||
        request ===
          null ||
        Array.isArray(
          request,
        )
      ) {
        return failure(
          "A valid FINORA Pricing Policy request is required.",
        );
      }

      const record =
        request as Record<string, unknown>;

      const ownerId =
        typeof record.ownerId ===
          "string"
          ? record.ownerId.trim()
          : "";

      const businessId =
        typeof record.businessId ===
          "string"
          ? record.businessId.trim()
          : "";

      const branchId =
        typeof record.branchId ===
          "string"
          ? record.branchId.trim()
          : "";

      if (
        !ownerId ||
        !businessId ||
        !branchId
      ) {
        return failure(
          "Owner ID, Business ID and Branch ID are required to read the FINORA Pricing Policy.",
        );
      }

      const result =
        await findFinoraPricingPolicy(
          ownerId,
          businessId,
          branchId,
        );

      if (!result.success) {
        return result;
      }

      if (!result.data) {
        return {
          success:
            true,

          data:
            undefined,
        };
      }

      const policy =
        result.data;

      return {
        success:
          true,

        data: {
          overrideSetId:
            policy.overrideSetId,

          scope: {
            ownerId:
              policy.ownerId,

            businessId:
              policy.businessId,

            branchId:
              policy.branchId,
          },

          overrides:
            policy.overrides.map(
              (rule) => ({
                overrideId:
                  rule.overrideId,

                chargeCode:
                  rule.chargeCode,

                model:
                  rule.model,

                amount:
                  rule.amount,

                currency:
                  rule.currency,

                validity: {
                  validFrom:
                    rule.validFrom,

                  validUntil:
                    rule.validUntil,
                },

                schemaVersion:
                  1 as const,
              }),
            ),

          schemaVersion:
            1 as const,
        },
      };
    },
  );
  // ----------------------------------------------------------
  // VERIFIED WALLET RECHARGE AUTHORIZATION
  //
  // READ ONLY.
  //
  // Signed-package verification/application remains inside
  // trusted main/native Control Plane flows.
  //
  // Installation binding metadata remains private to Electron
  // main. Renderer receives only sanitized verified
  // authorization evidence required for Wallet consumption.
  // ----------------------------------------------------------

  ipcMain.handle(
    CONTROL_IPC_CHANNELS.FIND_WALLET_RECHARGE_AUTHORIZATION,
    async (
      event,
      request: unknown,
    ) => {

      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Wallet Recharge authorization access is restricted to the trusted renderer.",
        );
      }

      if (
        !isFindWalletRechargeAuthorizationRequest(
          request,
        )
      ) {
        return failure(
          "A valid FINORA Wallet Recharge authorization request is required.",
        );
      }

      const nativeBinding =
        await getFinoraWindowsInstallationBinding();

      if (!nativeBinding) {
        return failure(
          "FINORA Windows native installation binding is unavailable.",
        );
      }

      const result =
        await findFinoraWalletRechargeAuthorization(
          request.ownerId,
          request.businessId,
          request.branchId,
          request.paymentReference,
        );

      if (!result.success) {
        return result;
      }

      if (!result.data) {
        return {
          success:
            true,

          data:
            undefined,
        };
      }

      const authorization =
        result.data;

      if (
        authorization.installationId !==
          nativeBinding.installationId ||
        authorization.bindingKeyId !==
          nativeBinding.bindingKeyId ||
        authorization.fingerprintAlgorithm !==
          nativeBinding.fingerprintAlgorithm ||
        authorization.publicKeyFingerprint !==
          nativeBinding.publicKeyFingerprint
      ) {
        return failure(
          "FINORA Wallet Recharge authorization does not match the current native installation binding.",
        );
      }

      return {
        success:
          true,

        data: {
          packageId:
            authorization.packageId,

          issuerId:
            authorization.issuerId,

          signingKeyId:
            authorization.signingKeyId,

          purpose:
            authorization.purpose,

          sequence:
            authorization.sequence,

          scope: {
            ownerId:
              authorization.ownerId,

            businessId:
              authorization.businessId,

            branchId:
              authorization.branchId,
          },

          paymentReference:
            authorization.paymentReference,

          amountMinor:
            authorization.amountMinor,

          currency:
            authorization.currency,

          paymentMethod:
            authorization.paymentMethod,

          paymentSource:
            authorization.paymentSource,

          ...(authorization.providerOrderId
            ? {
                providerOrderId:
                  authorization.providerOrderId,
              }
            : {}),

          ...(authorization.providerTransactionId
            ? {
                providerTransactionId:
                  authorization.providerTransactionId,
              }
            : {}),

          issuedAt:
            authorization.issuedAt,

          verifiedAt:
            authorization.verifiedAt,

          schemaVersion:
            1 as const,
        },
      };
    },
  );

  // ----------------------------------------------------------
  // STORAGE ENTITLEMENT CHECK
  // ----------------------------------------------------------

  ipcMain.handle(
    CONTROL_IPC_CHANNELS.HAS_ACTIVE_STORAGE_ENTITLEMENT,
    async (
      event,
      request: unknown,
    ) => {
      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "Untrusted renderer.",
        );
      }

      if (
        !isStorageEntitlementCheckRequest(
          request,
        )
      ) {
        return failure(
          "A valid FINORA storage entitlement request is required.",
        );
      }

      const nativeBinding =
        await getFinoraWindowsInstallationBinding();

      if (!nativeBinding) {
        return failure(
          "FINORA Windows native installation binding is unavailable.",
        );
      }

      return hasActiveFinoraStorageEntitlement(
        request.userId,
        request.ownerId,
        request.businessId,
        request.branchId,
        request.storageMode,
        {
          installationId:
            nativeBinding.installationId,

          bindingKeyId:
            nativeBinding.bindingKeyId,

          fingerprintAlgorithm:
            nativeBinding.fingerprintAlgorithm,

          publicKeyFingerprint:
            nativeBinding.publicKeyFingerprint,
        },
      );
    },
  );

  // ----------------------------------------------------------
  // WALLET RECHARGE REQUEST EXPORT
  //
  // SECURITY:
  //
  // - Trusted renderer only.
  // - Exact owning BrowserWindow main frame only.
  // - Renderer supplies no filesystem path.
  // - Renderer supplies no owner/business/branch identity.
  // - Renderer supplies no installation/binding identity.
  // - Renderer supplies no signature.
  // - Native session authority resolves branch scope.
  // - Native Business Profile resolves display identity.
  // - Native installation binding signs the request.
  // - Native main process owns the Save dialog.
  // ----------------------------------------------------------

  // ----------------------------------------------------------
  // FIND VERIFIED WALLET RECHARGE DECLINE
  //
  // Read-only sanitized evidence bridge.
  // ----------------------------------------------------------

  ipcMain.handle(
    CONTROL_IPC_CHANNELS
      .FIND_WALLET_RECHARGE_DECLINE,
    async (
      event,
      request:
        unknown,
    ) => {

      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Wallet Recharge decline evidence is restricted to the trusted renderer.",
        );
      }

      if (
        !isFindWalletRechargeAuthorizationRequest(
          request,
        )
      ) {
        return failure(
          "A valid FINORA Wallet Recharge decline evidence request is required.",
        );
      }

      const nativeBinding =
        await getFinoraWindowsInstallationBinding();

      if (!nativeBinding) {
        return failure(
          "FINORA Windows native installation binding is unavailable.",
        );
      }

      const result =
        await findFinoraWalletRechargeDecline(
          request.ownerId,
          request.businessId,
          request.branchId,
          request.paymentReference,
        );

      if (!result.success) {
        return result;
      }

      if (!result.data) {
        return success(
          undefined,
        );
      }

      const decline =
        result.data;

      if (
        decline.installationId !==
          nativeBinding.installationId ||
        decline.bindingKeyId !==
          nativeBinding.bindingKeyId ||
        decline.fingerprintAlgorithm !==
          nativeBinding.fingerprintAlgorithm ||
        decline.publicKeyFingerprint !==
          nativeBinding.publicKeyFingerprint
      ) {
        return failure(
          "FINORA Wallet Recharge decline evidence does not match the current native installation binding.",
        );
      }

      return success({
        packageId:
          decline.packageId,

        issuerId:
          decline.issuerId,

        signingKeyId:
          decline.signingKeyId,

        purpose:
          decline.purpose,

        sequence:
          decline.sequence,

        ownerId:
          decline.ownerId,

        businessId:
          decline.businessId,

        branchId:
          decline.branchId,

        installationId:
          decline.installationId,

        bindingKeyId:
          decline.bindingKeyId,

        fingerprintAlgorithm:
          decline.fingerprintAlgorithm,

        publicKeyFingerprint:
          decline.publicKeyFingerprint,

        requestId:
          decline.requestId,

        paymentReference:
          decline.paymentReference,

        amountMinor:
          decline.amountMinor,

        currency:
          decline.currency,

        paymentMethod:
          decline.paymentMethod,

        paymentSource:
          decline.paymentSource,

        requestedAt:
          decline.requestedAt,

        outcome:
          decline.outcome,

        issuedAt:
          decline.issuedAt,

        verifiedAt:
          decline.verifiedAt,

        schemaVersion:
          decline.schemaVersion,
      });
    },
  );
  ipcMain.handle(
    CONTROL_IPC_CHANNELS.EXPORT_WALLET_RECHARGE_REQUEST,
    async (
      event,
      request:
        unknown,
    ) => {

      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Wallet Recharge Request export is restricted to the trusted renderer.",
        );
      }

      if (
        !isExportWalletRechargeRequest(
          request,
        )
      ) {
        return failure(
          "FINORA Wallet Recharge Request export input is invalid.",
        );
      }

      const parentWindow =
        BrowserWindow.fromWebContents(
          event.sender,
        );

      if (
        !parentWindow ||
        parentWindow.isDestroyed()
      ) {
        return failure(
          "The FINORA application window is not available for Wallet Recharge Request export.",
        );
      }

      if (
        event.senderFrame !==
          parentWindow.webContents.mainFrame
      ) {
        return failure(
          "FINORA Wallet Recharge Request export is restricted to the trusted application main frame.",
        );
      }

      return exportFinoraWalletRechargeRequestFromNativeDialog(
        parentWindow,
        request,
      );
    },
  );

  // ----------------------------------------------------------
  // INSTALLATION ENROLLMENT REQUEST EXPORT
  //
  // SECURITY:
  //
  // - Zero renderer arguments.
  // - Renderer supplies no filesystem path.
  // - Renderer supplies no enrollment payload.
  // - Renderer supplies no signature.
  // - Native main process generates the possession proof.
  // - Native main process owns the Save dialog.
  // - Trusted application main frame only.
  // ----------------------------------------------------------

  ipcMain.handle(
    CONTROL_IPC_CHANNELS.EXPORT_INSTALLATION_ENROLLMENT_REQUEST,
    async (event) => {

      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Installation Enrollment Request export is restricted to the trusted renderer.",
        );
      }

      const parentWindow =
        BrowserWindow.fromWebContents(
          event.sender,
        );

      if (
        !parentWindow ||
        parentWindow.isDestroyed()
      ) {
        return failure(
          "The FINORA application window is not available for Installation Enrollment Request export.",
        );
      }

      if (
        event.senderFrame !==
          parentWindow.webContents.mainFrame
      ) {
        return failure(
          "FINORA Installation Enrollment Request export is restricted to the trusted application main frame.",
        );
      }

      return exportFinoraInstallationEnrollmentRequestFromNativeDialog(
        parentWindow,
      );
    },
  );

  // ----------------------------------------------------------
  // INSTALLATION ENROLLMENT RESPONSE — IMPORT + BOOTSTRAP
  //
  // SECURITY:
  //
  // - Renderer supplies only the independently known Control
  //   Center SHA-256 fingerprint.
  // - Renderer supplies no filepath.
  // - Renderer supplies no signed response bytes.
  // - Renderer supplies no trusted key.
  // - Renderer supplies no installation identity.
  // - Native main process owns file selection and verification.
  // - Verified response never crosses into renderer state.
  // - Bootstrap mutation remains entirely main-process owned.
  // ----------------------------------------------------------

  ipcMain.handle(
    CONTROL_IPC_CHANNELS.IMPORT_INSTALLATION_ENROLLMENT_RESPONSE,
    async (
      event,
      expectedControlCenterPublicKeyFingerprint:
        unknown,
    ) => {

      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Installation Enrollment Response import is restricted to the trusted renderer.",
        );
      }

      const parentWindow =
        BrowserWindow.fromWebContents(
          event.sender,
        );

      if (
        !parentWindow ||
        parentWindow.isDestroyed()
      ) {
        return failure(
          "The FINORA application window is not available for Installation Enrollment Response import.",
        );
      }

      if (
        event.senderFrame !==
          parentWindow.webContents.mainFrame
      ) {
        return failure(
          "FINORA Installation Enrollment Response import is restricted to the trusted application main frame.",
        );
      }

      if (
        typeof expectedControlCenterPublicKeyFingerprint !==
          "string" ||
        !/^[0-9a-f]{64}$/.test(
          expectedControlCenterPublicKeyFingerprint,
        )
      ) {
        return failure(
          "Enter the independently supplied lowercase 64-character FINORA Control Center SHA-256 fingerprint.",
        );
      }

      const openResult =
        await openVerifiedFinoraInstallationEnrollmentResponse(
          parentWindow,
          expectedControlCenterPublicKeyFingerprint,
        );

      if (!openResult.success) {
        return failure(
          openResult.error,
        );
      }

      if (openResult.cancelled) {
        return {
          success:
            true,

          cancelled:
            true as const,
        };
      }

      const applyResult =
        await applyVerifiedFinoraInstallationEnrollmentResponse(
          openResult.response,
        );

      if (!applyResult.success) {
        return failure(
          applyResult.error,
        );
      }

      return {
        success:
          true,

        cancelled:
          false as const,

        fileName:
          openResult.fileName,

        bytesRead:
          openResult.bytesRead,

        responseId:
          applyResult.data.responseId,

        requestId:
          applyResult.data.requestId,

        installationId:
          applyResult.data.installationId,

        ownerId:
          applyResult.data.ownerId,

        businessId:
          applyResult.data.businessId,

        branchId:
          applyResult.data.branchId,

        businessCode:
          applyResult.data.businessCode,

        branchCode:
          applyResult.data.branchCode,

        trustRecovered:
          applyResult.data.trustRecovered,

        installationRecovered:
          applyResult.data.installationRecovered,

        completedAt:
          applyResult.data.completedAt,
      };
    },
  );

  // ----------------------------------------------------------
  // CONTROL BUNDLE IMPORT
  //
  // SECURITY:
  //
  // - Renderer supplies no filesystem path.
  // - Renderer supplies no signed package bytes.
  // - Renderer supplies no trusted signing keys.
  // - Renderer supplies no installation target.
  // - Native file selection remains Electron main-process owned.
  // - Existing trusted-origin validation is required.
  // - Sender must also be the exact main frame of its owning
  //   BrowserWindow; trusted-origin subframes are rejected.
  // ----------------------------------------------------------

  ipcMain.handle(
    CONTROL_IPC_CHANNELS.IMPORT_CONTROL_BUNDLE,
    async (event) => {
      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Control Bundle import is restricted to the trusted renderer.",
        );
      }

      const parentWindow =
        BrowserWindow.fromWebContents(
          event.sender,
        );

      if (
        !parentWindow ||
        parentWindow.isDestroyed()
      ) {
        return failure(
          "The FINORA application window is not available for Control Bundle import.",
        );
      }

      if (
        event.senderFrame !==
          parentWindow.webContents.mainFrame
      ) {
        return failure(
          "FINORA Control Bundle import is restricted to the trusted application main frame.",
        );
      }

      return importFinoraControlBundleFromNativeDialog(
        parentWindow,
      );
    },
  );
}

// ============================================================
// END
// ============================================================
