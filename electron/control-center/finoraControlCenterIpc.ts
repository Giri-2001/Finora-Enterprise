// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// PRIVILEGED IPC
//
// RESPONSIBILITY:
//
// - Expose safe public Control Center trust identity
// - Expose narrow purpose-specific issuance operations
// - Require the dedicated Control Center BrowserWindow mainFrame
// - Normalize privileged-operation failures for the renderer
//
// SECURITY:
//
// - Dedicated Control Center renderer only.
// - Operational renderer trust is NOT accepted here.
// - No generic signer IPC.
// - No signing-key vault IPC.
// - No private-key material crosses IPC.
// - Renderer cannot provide packageId / sequence / root issuedAt.
//
// CURRENT ISSUANCE SURFACE:
//
// - BRANCH_ACTIVATION
// - STORAGE_ENTITLEMENT
// - BUSINESS_PROFILE
// - PRICING_POLICY
// - WALLET_RECHARGE
// ============================================================

import {
  BrowserWindow,
  ipcMain,
} from "electron";

import {
  issueFinoraBranchActivationPackage,
  issueFinoraBusinessProfilePackage,
  issueFinoraControlBundlePackage,
  issueFinoraPricingPolicyPackage,
  issueFinoraStorageEntitlementPackage,
  issueFinoraWalletRechargePackage,
  type IssueFinoraBranchActivationRequest,
  type IssueFinoraBusinessProfileRequest,
  type IssueFinoraControlBundleRequest,
  type IssueFinoraPricingPolicyRequest,
  type IssueFinoraStorageEntitlementRequest,
  type IssueFinoraWalletRechargeRequest,
} from "./finoraControlCenterIssuanceCoordinator.js";

import {
  getFinoraControlCenterTrustRecord,
} from "./finoraControlCenterSigner.js";

import {
  exportFinoraControlBundleFile,
} from "./finoraControlBundleFileTransport.js";

import {
  isTrustedFinoraControlCenterRenderer,
} from "./finoraControlCenterWindow.js";

// ============================================================
// IPC CHANNELS
// ============================================================

export const FINORA_CONTROL_CENTER_IPC_CHANNELS = {
  GET_TRUST_RECORD:
    "finora:control-center:get-trust-record",

  ISSUE_BRANCH_ACTIVATION:
    "finora:control-center:issue-branch-activation",

  ISSUE_STORAGE_ENTITLEMENT:
    "finora:control-center:issue-storage-entitlement",

  ISSUE_BUSINESS_PROFILE:
    "finora:control-center:issue-business-profile",

  ISSUE_PRICING_POLICY:
    "finora:control-center:issue-pricing-policy",

  ISSUE_WALLET_RECHARGE:
    "finora:control-center:issue-wallet-recharge",

  ISSUE_AND_EXPORT_CONTROL_BUNDLE:
    "finora:control-center:issue-and-export-control-bundle",
} as const;

// ============================================================
// RESULT
// ============================================================

export interface FinoraControlCenterIpcSuccess<T> {
  success:
    true;

  data:
    T;
}

export interface FinoraControlCenterIpcFailure {
  success:
    false;

  error:
    string;
}

export type FinoraControlCenterIpcResult<T> =
  | FinoraControlCenterIpcSuccess<T>
  | FinoraControlCenterIpcFailure;

function success<T>(
  data:
    T,
): FinoraControlCenterIpcSuccess<T> {

  return {
    success:
      true,

    data,
  };
}

function failure(
  error:
    string,
): FinoraControlCenterIpcFailure {

  return {
    success:
      false,

    error,
  };
}

function getErrorMessage(
  error:
    unknown,
): string {

  return error instanceof Error
    ? error.message
    : "FINORA Control Center privileged operation failed.";
}

// ============================================================
// REQUEST VALIDATION
// ============================================================

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

function isIssuanceTarget(
  value:
    unknown,
): boolean {

  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(
      value.ownerId,
    ) &&
    isNonEmptyString(
      value.businessId,
    ) &&
    isNonEmptyString(
      value.branchId,
    ) &&
    isNonEmptyString(
      value.installationId,
    ) &&
    isNonEmptyString(
      value.bindingKeyId,
    ) &&
    value.fingerprintAlgorithm ===
      "SHA-256" &&
    isNonEmptyString(
      value.publicKeyFingerprint,
    )
  );
}

function isBaseIssuanceRequest(
  value:
    unknown,
): boolean {

  if (!isRecord(value)) {
    return false;
  }

  if (
    !isIssuanceTarget(
      value.target,
    ) ||
    !isRecord(
      value.payload,
    )
  ) {
    return false;
  }

  /*
   * Envelope authority fields must never arrive from renderer.
   *
   * Reject rather than silently ignore them.
   */
  if (
    Object.prototype.hasOwnProperty.call(
      value,
      "packageId",
    ) ||
    Object.prototype.hasOwnProperty.call(
      value,
      "sequence",
    ) ||
    Object.prototype.hasOwnProperty.call(
      value,
      "issuedAt",
    )
  ) {
    return false;
  }

  /*
   * packageValidity remains optional. Its semantic validation is
   * performed by the purpose-specific issuer / generic signer.
   */
  if (
    value.packageValidity !==
      undefined &&
    !isRecord(
      value.packageValidity,
    )
  ) {
    return false;
  }

  return true;
}

// ============================================================
// PRIVILEGED EXECUTION
// ============================================================

async function executePrivileged<T>(
  operation:
    () => Promise<T>,
): Promise<
  FinoraControlCenterIpcResult<T>
> {

  try {

    return success(
      await operation(),
    );

  } catch (error) {

    return failure(
      getErrorMessage(
        error,
      ),
    );
  }
}

// ============================================================
// REGISTRATION STATE
// ============================================================

let controlCenterHandlersRegistered =
  false;

// ============================================================
// CONTROL BUNDLE REQUEST
// ============================================================

function isControlBundleIssuanceRequest(
  value:
    unknown,
): boolean {

  if (
    !isBaseIssuanceRequest(
      value,
    ) ||
    !isRecord(
      value,
    )
  ) {
    return false;
  }

  /*
   * CONTROL_BUNDLE v1 does not expose an outer validity draft.
   *
   * Reject extra packageValidity authority instead of silently
   * dropping it at the coordinator boundary.
   */
  if (
    Object.prototype.hasOwnProperty.call(
      value,
      "packageValidity",
    )
  ) {
    return false;
  }

  return true;
}

// ============================================================
// REGISTER
// ============================================================

export function registerFinoraControlCenterHandlers():
  void {

  if (
    controlCenterHandlersRegistered
  ) {
    return;
  }

  controlCenterHandlersRegistered =
    true;

  // ----------------------------------------------------------
  // PUBLIC TRUST RECORD
  // ----------------------------------------------------------

  ipcMain.handle(
    FINORA_CONTROL_CENTER_IPC_CHANNELS.GET_TRUST_RECORD,
    async (
      event,
    ) => {

      if (
        !isTrustedFinoraControlCenterRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Control Center access is restricted to the dedicated privileged renderer.",
        );
      }

      return executePrivileged(
        () =>
          getFinoraControlCenterTrustRecord(),
      );
    },
  );

  // ----------------------------------------------------------
  // BRANCH ACTIVATION
  // ----------------------------------------------------------

  ipcMain.handle(
    FINORA_CONTROL_CENTER_IPC_CHANNELS.ISSUE_BRANCH_ACTIVATION,
    async (
      event,
      request:
        unknown,
    ) => {

      if (
        !isTrustedFinoraControlCenterRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Branch Activation issuance is restricted to the dedicated Control Center renderer.",
        );
      }

      if (
        !isBaseIssuanceRequest(
          request,
        )
      ) {
        return failure(
          "A valid FINORA Branch Activation issuance request is required.",
        );
      }

      return executePrivileged(
        () =>
          issueFinoraBranchActivationPackage(
            request as
              IssueFinoraBranchActivationRequest,
          ),
      );
    },
  );

  // ----------------------------------------------------------
  // STORAGE ENTITLEMENT
  // ----------------------------------------------------------

  ipcMain.handle(
    FINORA_CONTROL_CENTER_IPC_CHANNELS.ISSUE_STORAGE_ENTITLEMENT,
    async (
      event,
      request:
        unknown,
    ) => {

      if (
        !isTrustedFinoraControlCenterRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Storage Entitlement issuance is restricted to the dedicated Control Center renderer.",
        );
      }

      if (
        !isBaseIssuanceRequest(
          request,
        )
      ) {
        return failure(
          "A valid FINORA Storage Entitlement issuance request is required.",
        );
      }

      return executePrivileged(
        () =>
          issueFinoraStorageEntitlementPackage(
            request as
              IssueFinoraStorageEntitlementRequest,
          ),
      );
    },
  );

  // ----------------------------------------------------------
  // BUSINESS PROFILE
  // ----------------------------------------------------------

  ipcMain.handle(
    FINORA_CONTROL_CENTER_IPC_CHANNELS.ISSUE_BUSINESS_PROFILE,
    async (
      event,
      request:
        unknown,
    ) => {

      if (
        !isTrustedFinoraControlCenterRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Business Profile issuance is restricted to the dedicated Control Center renderer.",
        );
      }

      if (
        !isBaseIssuanceRequest(
          request,
        )
      ) {
        return failure(
          "A valid FINORA Business Profile issuance request is required.",
        );
      }

      return executePrivileged(
        () =>
          issueFinoraBusinessProfilePackage(
            request as
              IssueFinoraBusinessProfileRequest,
          ),
      );
    },
  );

  // ----------------------------------------------------------
  // PRICING POLICY
  // ----------------------------------------------------------

  ipcMain.handle(
    FINORA_CONTROL_CENTER_IPC_CHANNELS.ISSUE_PRICING_POLICY,
    async (
      event,
      request:
        unknown,
    ) => {

      if (
        !isTrustedFinoraControlCenterRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Pricing Policy issuance is restricted to the dedicated Control Center renderer.",
        );
      }

      if (
        !isBaseIssuanceRequest(
          request,
        )
      ) {
        return failure(
          "A valid FINORA Pricing Policy issuance request is required.",
        );
      }

      return executePrivileged(
        () =>
          issueFinoraPricingPolicyPackage(
            request as
              IssueFinoraPricingPolicyRequest,
          ),
      );
    },
  );

  // ----------------------------------------------------------
  // WALLET RECHARGE
  // ----------------------------------------------------------

  ipcMain.handle(
    FINORA_CONTROL_CENTER_IPC_CHANNELS.ISSUE_WALLET_RECHARGE,
    async (
      event,
      request:
        unknown,
    ) => {

      if (
        !isTrustedFinoraControlCenterRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Wallet Recharge issuance is restricted to the dedicated Control Center renderer.",
        );
      }

      if (
        !isBaseIssuanceRequest(
          request,
        )
      ) {
        return failure(
          "A valid FINORA Wallet Recharge issuance request is required.",
        );
      }

      return executePrivileged(
        () =>
          issueFinoraWalletRechargePackage(
            request as
              IssueFinoraWalletRechargeRequest,
          ),
      );
    },
  );

  // ----------------------------------------------------------
  // CONTROL BUNDLE — ISSUE + NATIVE .FINORA EXPORT
  //
  // The renderer supplies only the issuance draft.
  //
  // Main process:
  // 1. verifies the exact privileged Control Center mainFrame,
  // 2. resolves that sender's BrowserWindow,
  // 3. reserves/signs the CONTROL_BUNDLE,
  // 4. opens the native Save dialog,
  // 5. writes the signed .finora file.
  //
  // Save cancellation may consume a reserved issuance sequence.
  // Issuance-ledger gaps are permitted by the current contract.
  // ----------------------------------------------------------

  ipcMain.handle(
    FINORA_CONTROL_CENTER_IPC_CHANNELS
      .ISSUE_AND_EXPORT_CONTROL_BUNDLE,
    async (
      event,
      request:
        unknown,
    ) => {

      if (
        !isTrustedFinoraControlCenterRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Control Bundle export is restricted to the dedicated Control Center renderer.",
        );
      }

      if (
        !isControlBundleIssuanceRequest(
          request,
        )
      ) {
        return failure(
          "A valid FINORA Control Bundle issuance request is required.",
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
          "The FINORA Control Center window is not available for bundle export.",
        );
      }

      return executePrivileged(
        async () => {

          const signedBundle =
            await issueFinoraControlBundlePackage(
              request as
                IssueFinoraControlBundleRequest,
            );

          const exportResult =
            await exportFinoraControlBundleFile(
              parentWindow,
              signedBundle,
            );

          if (!exportResult.success) {
            throw new Error(
              exportResult.error,
            );
          }

          return exportResult;
        },
      );
    },
  );
}

// ============================================================
// END
// ============================================================