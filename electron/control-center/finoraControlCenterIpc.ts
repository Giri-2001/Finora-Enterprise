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
  issueFinoraBranchAccessPackage,
  issueFinoraBusinessProfilePackage,
  issueFinoraControlBundlePackage,
  issueFinoraPricingPolicyPackage,
  issueFinoraStorageEntitlementPackage,
  issueFinoraWalletRechargePackage,
  type IssueFinoraBranchActivationRequest,
  type IssueFinoraBranchAccessRequest,
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
  openVerifiedFinoraInstallationEnrollmentRequest,
} from "./finoraInstallationEnrollmentRequestFileTransport.js";

import {
  getFinoraVerifiedInstallationEnrollment,
  rememberFinoraVerifiedInstallationEnrollment,
  takeFinoraVerifiedInstallationEnrollment,
} from "./finoraInstallationEnrollmentSessionAuthority.js";

import {
  issueFinoraInstallationEnrollmentResponse,
  type FinoraInstallationEnrollmentOperatorAssignment,
} from "./finoraInstallationEnrollmentResponseIssuanceCoordinator.js";

import {
  exportFinoraInstallationEnrollmentResponseFile,
} from "./finoraInstallationEnrollmentResponseFileTransport.js";

import {
  loadFinoraControlCenterBranchRegistry,
  registerFinoraControlCenterBranch,
} from "./finoraControlCenterBranchRegistryStore.js";
import {
  authorizeFinoraControlCenterRegistryBoundIssuanceTarget,
} from "./finoraControlCenterBranchIssuanceAuthorization.js";

import {
  backfillFinoraControlCenterBranchFromHistoricalEnrollmentEvidence,
} from "./finoraInstallationEnrollmentHistoricalBackfillCoordinator.js";
import {
  isTrustedFinoraControlCenterRenderer,
} from "./finoraControlCenterWindow.js";

// ============================================================
// IPC CHANNELS
// ============================================================

export const FINORA_CONTROL_CENTER_IPC_CHANNELS = {
  GET_TRUST_RECORD:
    "finora:control-center:get-trust-record",

  GET_BRANCH_REGISTRY:
    "finora:control-center:get-branch-registry",

  BACKFILL_HISTORICAL_ENROLLMENT_BRANCH:
    "finora:control-center:backfill-historical-enrollment-branch",
  OPEN_INSTALLATION_ENROLLMENT_REQUEST:
    "finora:control-center:open-installation-enrollment-request",

  ISSUE_AND_EXPORT_INSTALLATION_ENROLLMENT_RESPONSE:
    "finora:control-center:issue-and-export-installation-enrollment-response",

  ISSUE_BRANCH_ACTIVATION:
    "finora:control-center:issue-branch-activation",

  ISSUE_BRANCH_ACCESS:
    "finora:control-center:issue-branch-access",

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
// INSTALLATION ENROLLMENT OPERATOR ASSIGNMENT
// ============================================================

function isInstallationEnrollmentOperatorAssignment(
  value:
    unknown,
): value is FinoraInstallationEnrollmentOperatorAssignment {

  if (!isRecord(value)) {
    return false;
  }

  const expectedKeys = [
    "ownerId",
    "businessId",
    "branchId",
    "businessCode",
    "branchCode",
  ].sort();

  const actualKeys =
    Object.keys(
      value,
    ).sort();

  if (
    actualKeys.length !==
      expectedKeys.length ||
    !actualKeys.every(
      (key, index) =>
        key ===
          expectedKeys[index],
    )
  ) {
    return false;
  }

  function isAssignmentText(
    candidate:
      unknown,
    maxLength:
      number,
  ): candidate is string {

    return (
      typeof candidate ===
        "string" &&
      candidate.length >
        0 &&
      candidate.length <=
        maxLength &&
      candidate ===
        candidate.trim()
    );
  }

  return (
    isAssignmentText(
      value.ownerId,
      256,
    ) &&
    isAssignmentText(
      value.businessId,
      256,
    ) &&
    isAssignmentText(
      value.branchId,
      256,
    ) &&
    isAssignmentText(
      value.businessCode,
      64,
    ) &&
    isAssignmentText(
      value.branchCode,
      64,
    )
  );
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
  // BRANCH REGISTRY READ
  //
  // SECURITY:
  //
  // - Dedicated privileged Control Center renderer only.
  // - Zero renderer arguments.
  // - Read-only defensive registry snapshot.
  // - No registry mutation capability crosses IPC.
  // ----------------------------------------------------------

  ipcMain.handle(
    FINORA_CONTROL_CENTER_IPC_CHANNELS.GET_BRANCH_REGISTRY,
    async (
      event,
    ) => {

      if (
        !isTrustedFinoraControlCenterRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Control Center Branch Registry access is restricted to the dedicated privileged renderer.",
        );
      }

      return executePrivileged(
        () =>
          loadFinoraControlCenterBranchRegistry(),
      );
    },
  );

  // ----------------------------------------------------------
  // VERIFIED INSTALLATION ENROLLMENT REQUEST
  //
  // SECURITY:
  //
  // - Dedicated Control Center renderer only.
  // - Zero renderer arguments.
  // - Renderer supplies no filesystem path.
  // - Renderer supplies no request bytes.
  // - Main process owns native file selection and verification.
  // - Native public key bytes are not returned to renderer.
  // - Opening/verifying a request does not approve enrollment.
  // ----------------------------------------------------------

  // ----------------------------------------------------------
  // HISTORICAL ENROLLMENT BRANCH BACKFILL
  //
  // Renderer supplies ZERO identity fields, ZERO file paths,
  // and ZERO file bytes.
  //
  // Native file selection, Request verification, historical
  // Response authentication, and Registry persistence remain
  // authoritative Electron-main responsibilities.
  // ----------------------------------------------------------

  ipcMain.handle(
    FINORA_CONTROL_CENTER_IPC_CHANNELS
      .BACKFILL_HISTORICAL_ENROLLMENT_BRANCH,
    async (
      event,
    ) => {

      if (
        !isTrustedFinoraControlCenterRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "Unauthorized FINORA Control Center historical Branch backfill request.",
        );
      }

      /*
       * The trusted renderer predicate proves this invocation
       * originates from the dedicated Control Center main frame.
       *
       * Native dialogs must be parented by that exact owning
       * BrowserWindow. No renderer-supplied window/path is used.
       */
      const parentWindow =
        BrowserWindow.fromWebContents(
          event.sender,
        );

      if (
        !parentWindow ||
        parentWindow.isDestroyed() ||
        parentWindow.webContents !==
          event.sender
      ) {
        return failure(
          "FINORA Control Center historical Branch backfill requires the trusted owning Control Center window.",
        );
      }

      const backfill =
        await backfillFinoraControlCenterBranchFromHistoricalEnrollmentEvidence(
          parentWindow,
        );

      if (!backfill.success) {
        return failure(
          backfill.error,
        );
      }

      if (backfill.cancelled) {
        return success({
          cancelled:
            true as const,

          cancelledAt:
            backfill.cancelledAt,
        });
      }

      /*
       * Return only the minimal operator-facing summary.
       *
       * Do not expose:
       * - recipient public-key material
       * - verification signing-key metadata
       * - native filesystem paths
       * - raw Enrollment evidence
       *
       * The renderer can refresh the normal read-only Branch
       * Registry view after successful completion.
       */
      return success({
        cancelled:
          false as const,

        created:
          backfill.created,

        requestFileName:
          backfill.requestFileName,

        responseFileName:
          backfill.responseFileName,

        branchId:
          backfill.record.identity.branchId,

        businessCode:
          backfill.record.identity.businessCode,

        branchCode:
          backfill.record.identity.branchCode,
      });
    },
  );

  // ----------------------------------------------------------
  // INSTALLATION ENROLLMENT REQUEST
  // ----------------------------------------------------------
  ipcMain.handle(
    FINORA_CONTROL_CENTER_IPC_CHANNELS
      .OPEN_INSTALLATION_ENROLLMENT_REQUEST,
    async (
      event,
    ) => {

      if (
        !isTrustedFinoraControlCenterRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Installation Enrollment Request access is restricted to the dedicated Control Center renderer.",
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
          "The FINORA Control Center window is unavailable for Installation Enrollment Request selection.",
        );
      }

      if (
        event.senderFrame !==
          parentWindow.webContents.mainFrame
      ) {
        return failure(
          "FINORA Installation Enrollment Request access is restricted to the dedicated Control Center main frame.",
        );
      }

      const openResult =
        await openVerifiedFinoraInstallationEnrollmentRequest(
          parentWindow,
        );

      if (!openResult.success) {
        return failure(
          openResult.error,
        );
      }

      if (openResult.cancelled) {
        return success({
          cancelled:
            true as const,
        });
      }

      const enrollment =
        openResult.enrollment;

      rememberFinoraVerifiedInstallationEnrollment(
        event.sender,
        enrollment,
      );

      return success({
        cancelled:
          false as const,

        fileName:
          openResult.fileName,

        bytesRead:
          openResult.bytesRead,

        requestId:
          enrollment.requestId,

        requestedAt:
          enrollment.requestedAt,

        installationId:
          enrollment.target.installationId,

        bindingKeyId:
          enrollment.target.bindingKeyId,

        fingerprintAlgorithm:
          enrollment.target.fingerprintAlgorithm,

        publicKeyFingerprint:
          enrollment.target.publicKeyFingerprint,
      });
    },
  );

  // ----------------------------------------------------------
  // INSTALLATION ENROLLMENT RESPONSE — ISSUE + EXPORT
  //
  // Renderer authority is limited to the five operator
  // assignment strings validated above.
  //
  // Native installation identity / binding data comes only
  // from the previously verified main-process session.
  // ----------------------------------------------------------

  ipcMain.handle(
    FINORA_CONTROL_CENTER_IPC_CHANNELS
      .ISSUE_AND_EXPORT_INSTALLATION_ENROLLMENT_RESPONSE,
    async (
      event,
      assignment:
        unknown,
    ) => {

      if (
        !isTrustedFinoraControlCenterRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Installation Enrollment Response issuance is restricted to the dedicated Control Center renderer.",
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
          "The FINORA Control Center window is unavailable for Installation Enrollment Response export.",
        );
      }

      if (
        event.senderFrame !==
          parentWindow.webContents.mainFrame
      ) {
        return failure(
          "FINORA Installation Enrollment Response issuance is restricted to the dedicated Control Center main frame.",
        );
      }

      if (
        !isInstallationEnrollmentOperatorAssignment(
          assignment,
        )
      ) {
        return failure(
          "A valid FINORA Installation Enrollment operator assignment is required.",
        );
      }

      const verifiedEnrollment =
        takeFinoraVerifiedInstallationEnrollment(
          event.sender,
        );

      if (!verifiedEnrollment) {
        return failure(
          "Open and cryptographically verify an Installation Enrollment Request before issuing its Enrollment Response.",
        );
      }

      let responseExported =
        false;

      try {
        const signedResponse =
          await issueFinoraInstallationEnrollmentResponse({
            verifiedEnrollment,

            assignment,
          });

        const exportResult =
          await exportFinoraInstallationEnrollmentResponseFile(
            parentWindow,
            signedResponse,
          );

        if (!exportResult.success) {
          return failure(
            exportResult.error,
          );
        }

        if (exportResult.cancelled) {
          return success({
            cancelled:
              true as const,
          });
        }

        /*
         * A non-cancelled native export means the signed Enrollment
         * Response now exists outside Control Center.
         *
         * From this point forward the verified Enrollment Request
         * must never be restored merely because registry persistence
         * fails. Reissuing would create a second signed response for
         * an already-exported enrollment operation.
         */
        responseExported =
          true;

        await registerFinoraControlCenterBranch({
          identity: {
            ownerId:
              assignment.ownerId,

            businessId:
              assignment.businessId,

            branchId:
              assignment.branchId,

            businessCode:
              assignment.businessCode,

            branchCode:
              assignment.branchCode,

            installation: {
              installationId:
                verifiedEnrollment.deviceBinding.installationId,

              bindingKeyId:
                verifiedEnrollment.deviceBinding.bindingKeyId,

              platform:
                verifiedEnrollment.deviceBinding.platform,

              algorithm:
                verifiedEnrollment.deviceBinding.algorithm,

              publicKeyFormat:
                verifiedEnrollment.deviceBinding.publicKeyFormat,

              publicKey:
                verifiedEnrollment.deviceBinding.publicKey,

              fingerprintAlgorithm:
                verifiedEnrollment.deviceBinding.fingerprintAlgorithm,

              publicKeyFingerprint:
                verifiedEnrollment.deviceBinding.publicKeyFingerprint,

              bindingCreatedAt:
                verifiedEnrollment.deviceBinding.createdAt,
            },
          },
        });

        return success({
          cancelled:
            false as const,

          fileName:
            exportResult.fileName,

          bytesWritten:
            exportResult.bytesWritten,

          responseId:
            exportResult.responseId,

          requestId:
            exportResult.requestId,

          installationId:
            exportResult.installationId,
        });

      } catch (error) {

        if (responseExported) {
          const registryError =
            error instanceof Error
              ? error.message
              : "Unknown Branch Registry persistence failure.";

          return failure(
            `The FINORA Installation Enrollment Response was exported successfully, but automatic Branch Registry registration failed. Do not issue another Enrollment Response for this request. Repair/backfill the Branch Registry from authentic enrollment evidence. Registry error: ${registryError}`,
          );
        }

        return failure(
          error instanceof Error
            ? error.message
            : "Unable to issue and export the FINORA Installation Enrollment Response.",
        );

      } finally {

        /*
         * The verified request is consumed permanently only
         * after a successful response export.
         *
         * On cancellation/failure, restore it only when no
         * newer verified request has already replaced it.
         */
        if (
          !responseExported &&
          !event.sender.isDestroyed() &&
          getFinoraVerifiedInstallationEnrollment(
            event.sender,
          ) ===
            undefined
        ) {
          rememberFinoraVerifiedInstallationEnrollment(
            event.sender,
            verifiedEnrollment,
          );
        }
      }
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

      const authorizedRequest =
        request as
          IssueFinoraBranchActivationRequest;

      return executePrivileged(
        async () => {
          await authorizeFinoraControlCenterRegistryBoundIssuanceTarget(
            authorizedRequest.target,
          );

          return issueFinoraBranchActivationPackage(
            authorizedRequest,
          );
        },
      );
    },
  );

  // ----------------------------------------------------------
  // BRANCH ACCESS
  // ----------------------------------------------------------

  ipcMain.handle(
    FINORA_CONTROL_CENTER_IPC_CHANNELS.ISSUE_BRANCH_ACCESS,
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
          "FINORA Branch Access issuance is restricted to the dedicated Control Center renderer.",
        );
      }

      if (
        !isBaseIssuanceRequest(
          request,
        )
      ) {
        return failure(
          "A valid FINORA Branch Access issuance request is required.",
        );
      }

      const authorizedRequest =
        request as
          IssueFinoraBranchAccessRequest;

      return executePrivileged(
        async () => {
          await authorizeFinoraControlCenterRegistryBoundIssuanceTarget(
            authorizedRequest.target,
          );

          return issueFinoraBranchAccessPackage(
            authorizedRequest,
          );
        },
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

      const authorizedRequest =
        request as
          IssueFinoraStorageEntitlementRequest;

      return executePrivileged(
        async () => {
          await authorizeFinoraControlCenterRegistryBoundIssuanceTarget(
            authorizedRequest.target,
          );

          return issueFinoraStorageEntitlementPackage(
            authorizedRequest,
          );
        },
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

      const authorizedRequest =
        request as
          IssueFinoraBusinessProfileRequest;

      return executePrivileged(
        async () => {
          await authorizeFinoraControlCenterRegistryBoundIssuanceTarget(
            authorizedRequest.target,
          );

          return issueFinoraBusinessProfilePackage(
            authorizedRequest,
          );
        },
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

      const authorizedRequest =
        request as
          IssueFinoraPricingPolicyRequest;

      return executePrivileged(
        async () => {
          await authorizeFinoraControlCenterRegistryBoundIssuanceTarget(
            authorizedRequest.target,
          );

          return issueFinoraPricingPolicyPackage(
            authorizedRequest,
          );
        },
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

      const authorizedRequest =
        request as
          IssueFinoraWalletRechargeRequest;

      return executePrivileged(
        async () => {
          await authorizeFinoraControlCenterRegistryBoundIssuanceTarget(
            authorizedRequest.target,
          );

          return issueFinoraWalletRechargePackage(
            authorizedRequest,
          );
        },
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