// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// DEDICATED PRIVILEGED PRELOAD
//
// RESPONSIBILITY:
//
// - Expose the narrow Control Center renderer bridge
// - Read safe public signing trust identity
// - Invoke purpose-specific issuance IPC operations
//
// SECURITY:
//
// - Dedicated Control Center BrowserWindow preload only.
// - No generic signer.
// - No private-key material.
// - No signing-key vault.
// - No filesystem API.
// - No packageId / sequence / root issuedAt authority.
// - No operational FINORA renderer bridge reuse.
// ============================================================

import {
  contextBridge,
  ipcRenderer,
} from "electron";

import type {
  FinoraControlCenterBranchRegistry,
} from "./finoraControlCenterBranchRegistry.types.js";

// ============================================================
// IPC CHANNELS
//
// Duplicated intentionally instead of importing the main-process
// IPC module. The preload must not load main-process handler code.
// ============================================================

const CONTROL_CENTER_CHANNELS = {
  GET_TRUST_RECORD:
    "finora:control-center:get-trust-record",

  GET_BRANCH_REGISTRY:
    "finora:control-center:get-branch-registry",

  BACKFILL_HISTORICAL_ENROLLMENT_BRANCH:
    "finora:control-center:backfill-historical-enrollment-branch",

  OPEN_INSTALLATION_ENROLLMENT_REQUEST:
    "finora:control-center:open-installation-enrollment-request",

  OPEN_WALLET_RECHARGE_REQUEST:
    "finora:control-center:open-wallet-recharge-request",

  APPROVE_AND_EXPORT_WALLET_RECHARGE_REQUEST:
    "finora:control-center:approve-and-export-wallet-recharge-request",

  DECLINE_AND_EXPORT_WALLET_RECHARGE_REQUEST:
    "finora:control-center:decline-and-export-wallet-recharge-request",

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

  EXPORT_ADMIN_AUTHORITY_RECOVERY:
    "finora:control-center:export-admin-authority-recovery",

  IMPORT_AND_RECOVER_ADMIN_AUTHORITY:
    "finora:control-center:import-and-recover-admin-authority",
} as const;

// ============================================================
// RESULT CONTRACT
// ============================================================

interface FinoraControlCenterResultSuccess<T> {
  success:
    true;

  data:
    T;
}

interface FinoraControlCenterResultFailure {
  success:
    false;

  error:
    string;
}

type FinoraControlCenterResult<T> =
  | FinoraControlCenterResultSuccess<T>
  | FinoraControlCenterResultFailure;

// ============================================================
// BRANCH REGISTRY VIEW
// ============================================================

export type FinoraControlCenterBranchRegistryView =
  FinoraControlCenterBranchRegistry;


// ============================================================
// HISTORICAL BRANCH BACKFILL VIEW
//
// This is intentionally an operator-facing summary only.
// No raw Enrollment evidence, filesystem path, recipient public
// key, binding fingerprint, or Control Center signing-key
// verification metadata crosses into the renderer.
// ============================================================

export type FinoraControlCenterHistoricalBranchBackfillView =
  | {
      cancelled:
        true;

      cancelledAt:
        "REQUEST" | "RESPONSE";
    }
  | {
      cancelled:
        false;

      created:
        boolean;

      requestFileName:
        string;

      responseFileName:
        string;

      branchId:
        string;

      businessCode:
        string;

      branchCode:
        string;
    };// ============================================================
// TRUST RECORD
// ============================================================

export interface FinoraControlCenterTrustRecordView {
  issuerId:
    string;

  signingKeyId:
    string;

  algorithm:
    "ECDSA_P256_SHA256";

  format:
    "SPKI_DER_BASE64";

  publicKey:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;

  status:
    "ACTIVE";

  validFrom:
    string;

  createdAt:
    string;

  schemaVersion:
    1;
}

// ============================================================
// ISSUANCE REQUEST
// ============================================================

export interface FinoraControlCenterIssuanceTarget {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;
}

export interface FinoraControlCenterIssuanceRequest {
  target:
    FinoraControlCenterIssuanceTarget;

  payload:
    Record<string, unknown>;

  packageValidity?:
    Record<string, unknown>;
}

export type FinoraControlCenterSignedPackageView =
  Record<string, unknown>;

export interface FinoraControlCenterBundleIssuanceRequest {
  target:
    FinoraControlCenterIssuanceTarget;

  payload:
    Record<string, unknown>;
}

export type FinoraControlBundleExportView =
  | {
      cancelled:
        true;
    }
  | {
      cancelled:
        false;

      fileName:
        string;

      bytesWritten:
        number;
    };

// ============================================================
// VERIFIED INSTALLATION ENROLLMENT VIEW
// ============================================================

export type FinoraControlCenterEnrollmentOpenView =
  | {
      cancelled:
        true;
    }
  | {
      cancelled:
        false;

      fileName:
        string;

      bytesRead:
        number;

      requestId:
        string;

      requestedAt:
        string;

      installationId:
        string;

      bindingKeyId:
        string;

      fingerprintAlgorithm:
        "SHA-256";

      publicKeyFingerprint:
        string;
    };

// ============================================================
// VERIFIED WALLET RECHARGE REQUEST VIEW
// ============================================================

export type FinoraControlCenterWalletRechargeRequestOpenView =
  | {
      cancelled:
        true;
    }
  | {
      cancelled:
        false;

      fileName:
        string;

      bytesRead:
        number;

      requestId:
        string;

      paymentReference:
        string;

      ownerId:
        string;

      businessId:
        string;

      branchId:
        string;

      businessCode:
        string;

      branchCode:
        string;

      installationId:
        string;

      bindingKeyId:
        string;

      fingerprintAlgorithm:
        "SHA-256";

      publicKeyFingerprint:
        string;

      amountMinor:
        number;

      currency:
        "INR";

      paymentMethod:
        string;

      paymentSource:
        string;

      requestedAt:
        string;
    };

// ============================================================
// INSTALLATION ENROLLMENT RESPONSE OPERATOR ASSIGNMENT
// ============================================================

// ============================================================
// WALLET RECHARGE REQUEST APPROVAL EXPORT VIEW
// ============================================================

export type FinoraControlCenterWalletRechargeRequestApprovalExportView =
  | {
      cancelled:
        true;
    }
  | {
      cancelled:
        false;

      fileName:
        string;

      bytesWritten:
        number;

      requestId:
        string;

      paymentReference:
        string;

      controlBundlePackageId:
        string;
    };

export interface FinoraControlCenterEnrollmentOperatorAssignment {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  businessCode:
    string;

  branchCode:
    string;
}

export type FinoraControlCenterEnrollmentResponseExportView =
  | {
      cancelled:
        true;
    }
  | {
      cancelled:
        false;

      fileName:
        string;

      bytesWritten:
        number;

      responseId:
        string;

      requestId:
        string;

      installationId:
        string;
    };

// ============================================================
// BRIDGE CONTRACT
// ============================================================

export type FinoraControlCenterAdminAuthorityRecoveryExportView =
  | {
      success:
        true;

      cancelled:
        false;

      status:
        "EXPORTED";

      issuerId:
        string;

      signingKeyId:
        string;

      fileName:
        string;

      bytes:
        number;
    }
  | {
      success:
        false;

      cancelled:
        true;
    }
  | {
      success:
        false;

      cancelled:
        false;

      error:
        string;
    };

export type FinoraControlCenterAdminAuthorityRecoveryImportView =
  | {
      success:
        true;

      cancelled:
        false;

      status:
        "RESTORED";

      issuerId:
        string;

      signingKeyId:
        string;

      createdAt:
        string;

      retainedSigningKeyCount:
        number;

      fileName:
        string;

      bytes:
        number;
    }
  | {
      success:
        false;

      cancelled:
        true;
    }
  | {
      success:
        false;

      cancelled:
        false;

      errorCode?:
        string;

      error:
        string;
    };

export interface FinoraControlCenterBridge {
  getTrustRecord:
    () =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterTrustRecordView
        >
      >;

  getBranchRegistry:
    () =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterBranchRegistryView | undefined
        >
      >;

  backfillHistoricalEnrollmentBranch:
    () =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterHistoricalBranchBackfillView
        >
      >;
  openInstallationEnrollmentRequest:
    () =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterEnrollmentOpenView
        >
      >;

  openWalletRechargeRequest:
    () =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterWalletRechargeRequestOpenView
        >
      >;

  approveAndExportWalletRechargeRequest:
    () =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterWalletRechargeRequestApprovalExportView
        >
      >;

  declineAndExportWalletRechargeRequest:
    () =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterWalletRechargeRequestApprovalExportView
        >
      >;
  issueAndExportInstallationEnrollmentResponse:
    (
      assignment:
        FinoraControlCenterEnrollmentOperatorAssignment,
    ) =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterEnrollmentResponseExportView
        >
      >;

  issueBranchActivation:
    (
      request:
        FinoraControlCenterIssuanceRequest,
    ) =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterSignedPackageView
        >
      >;

  issueBranchAccess:
    (
      request:
        FinoraControlCenterIssuanceRequest,
    ) =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterSignedPackageView
        >
      >;

  issueStorageEntitlement:
    (
      request:
        FinoraControlCenterIssuanceRequest,
    ) =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterSignedPackageView
        >
      >;

  issueBusinessProfile:
    (
      request:
        FinoraControlCenterIssuanceRequest,
    ) =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterSignedPackageView
        >
      >;

  issuePricingPolicy:
    (
      request:
        FinoraControlCenterIssuanceRequest,
    ) =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterSignedPackageView
        >
      >;

  issueWalletRecharge:
    (
      request:
        FinoraControlCenterIssuanceRequest,
    ) =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterSignedPackageView
        >
      >;

  issueAndExportControlBundle:
    (
      request:
        FinoraControlCenterBundleIssuanceRequest,
    ) =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlBundleExportView
        >
      >;

  exportAdminAuthorityRecovery:
    (
      securityCode:
        string,
    ) =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterAdminAuthorityRecoveryExportView
        >
      >;

  importAndRecoverAdminAuthority:
    (
      securityCode:
        string,
    ) =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterAdminAuthorityRecoveryImportView
        >
      >;
}

// ============================================================
// BRIDGE
// ============================================================

const controlCenterBridge:
  FinoraControlCenterBridge = {

  getTrustRecord:
    () =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS.GET_TRUST_RECORD,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterTrustRecordView
        >
      >,

  getBranchRegistry:
    () =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS.GET_BRANCH_REGISTRY,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterBranchRegistryView | undefined
        >
      >,

  backfillHistoricalEnrollmentBranch:
    () =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS
          .BACKFILL_HISTORICAL_ENROLLMENT_BRANCH,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterHistoricalBranchBackfillView
        >
      >,
  openInstallationEnrollmentRequest:
    () =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS
          .OPEN_INSTALLATION_ENROLLMENT_REQUEST,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterEnrollmentOpenView
        >
      >,

  openWalletRechargeRequest:
    () =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS
          .OPEN_WALLET_RECHARGE_REQUEST,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterWalletRechargeRequestOpenView
        >
      >,

  approveAndExportWalletRechargeRequest:
    () =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS
          .APPROVE_AND_EXPORT_WALLET_RECHARGE_REQUEST,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterWalletRechargeRequestApprovalExportView
        >
      >,

  declineAndExportWalletRechargeRequest:
    () =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS
          .DECLINE_AND_EXPORT_WALLET_RECHARGE_REQUEST,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterWalletRechargeRequestApprovalExportView
        >
      >,
  issueAndExportInstallationEnrollmentResponse:
    (
      assignment,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS
          .ISSUE_AND_EXPORT_INSTALLATION_ENROLLMENT_RESPONSE,
        assignment,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterEnrollmentResponseExportView
        >
      >,

  issueBranchActivation:
    (
      request,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS.ISSUE_BRANCH_ACTIVATION,
        request,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterSignedPackageView
        >
      >,

  issueBranchAccess:
    (
      request,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS.ISSUE_BRANCH_ACCESS,
        request,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterSignedPackageView
        >
      >,

  issueStorageEntitlement:
    (
      request,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS.ISSUE_STORAGE_ENTITLEMENT,
        request,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterSignedPackageView
        >
      >,

  issueBusinessProfile:
    (
      request,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS.ISSUE_BUSINESS_PROFILE,
        request,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterSignedPackageView
        >
      >,

  issuePricingPolicy:
    (
      request,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS.ISSUE_PRICING_POLICY,
        request,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterSignedPackageView
        >
      >,

  issueWalletRecharge:
    (
      request,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS.ISSUE_WALLET_RECHARGE,
        request,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterSignedPackageView
        >
      >,

  issueAndExportControlBundle:
    (
      request,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS
          .ISSUE_AND_EXPORT_CONTROL_BUNDLE,
        request,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlBundleExportView
        >
      >,

  exportAdminAuthorityRecovery:
    (
      securityCode,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS
          .EXPORT_ADMIN_AUTHORITY_RECOVERY,
        securityCode,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterAdminAuthorityRecoveryExportView
        >
      >,

  importAndRecoverAdminAuthority:
    (
      securityCode,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS
          .IMPORT_AND_RECOVER_ADMIN_AUTHORITY,
        securityCode,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterAdminAuthorityRecoveryImportView
        >
      >,
};

// ============================================================
// EXPOSE
// ============================================================

contextBridge.exposeInMainWorld(
  "finoraControlCenter",
  controlCenterBridge,
);

// ============================================================
// END
// ============================================================