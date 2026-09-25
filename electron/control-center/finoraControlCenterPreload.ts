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

  GET_BRANCH_DIRECTORY_METADATA:
    "finora:control-center:get-branch-directory-metadata",

  GET_FINORA_INCOME_PRICING:
    "finora:control-center:get-finora-income-pricing",

  UPDATE_FINORA_INCOME_PRICING:
    "finora:control-center:update-finora-income-pricing",
  GET_FINORA_BRANCH_PRICING:
    "finora:control-center:get-finora-branch-pricing",

  UPDATE_FINORA_BRANCH_PRICING:
    "finora:control-center:update-finora-branch-pricing",

  GET_WALLET_HISTORY:
    "finora:control-center:get-wallet-history",

  BACKFILL_HISTORICAL_ENROLLMENT_BRANCH:
    "finora:control-center:backfill-historical-enrollment-branch",

  OPEN_BRANCH_CERTIFICATION_ROTATION_REQUEST:
    "finora:control-center:open-branch-certification-rotation-request",

  ISSUE_AND_EXPORT_BRANCH_CERTIFICATION_ROTATION:
    "finora:control-center:issue-and-export-branch-certification-rotation",
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

  ISSUE_BRANCH_DEVICE_REVOCATION:
    "finora:control-center:issue-branch-device-revocation",

  ISSUE_STORAGE_ENTITLEMENT:
    "finora:control-center:issue-storage-entitlement",

  ISSUE_PORTABLE_STORAGE_ENTITLEMENT:
    "finora:control-center:issue-portable-storage-entitlement",

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

export type FinoraControlCenterBranchCertificationRotationOpenView =
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

      ownerId:
        string;

      businessId:
        string;

      branchId:
        string;

      requestingInstallationId:
        string;

      requestedAt:
        string;

      previousCertificationKeyId:
        string;

      replacementCertificationKeyId:
        string;
    };

export type FinoraControlCenterBranchCertificationRotationExportView =
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

      packageId:
        string;

      requestId:
        string;

      sequence:
        number;

      registryUpdated:
        boolean;
    };
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

export interface FinoraControlCenterBranchDirectoryMetadataView {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  ownerName?:
    string;

  businessName?:
    string;

  branchName?:
    string;

  lastSource:
    | "OPERATOR_CONFIRMED"
    | "BRANCH_ACCESS_ISSUANCE"
    | "BUSINESS_PROFILE_ISSUANCE";

  updatedAt:
    string;

  schemaVersion:
    1;
}
export interface FinoraControlCenterWalletHistoryView {
  historyId:
    string;

  decision:
    | "APPROVED"
    | "DECLINED";

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
    string;

  publicKeyFingerprint:
    string;

  requestId:
    string;

  paymentReference:
    string;

  amountMinor:
    number;

  currency:
    string;

  paymentMethod:
    string;

  paymentSource:
    string;

  requestedAt:
    string;

  decisionAt:
    string;

  recordedAt:
    string;

  controlBundlePackageId:
    string;

  importedRequestFileName:
    string;

  importedRequestFilePath:
    string;

  exportedResultFileName:
    string;

  exportedResultFilePath:
    string;

  schemaVersion:
    1;
}
export interface FinoraControlCenterIncomePricingInput {
  customerCreateFee:
    number;

  loanDisbursementFee:
    number;

  collectionBelow25000Fee:
    number;

  collection25000To50000Fee:
    number;

  collectionAbove50000Fee:
    number;
}

export interface FinoraControlCenterIncomePricingView
  extends FinoraControlCenterIncomePricingInput {

  source:
    | "MANDATORY_DEFAULT"
    | "CONTROL_CENTER";

  revision:
    number;

  updatedAt?:
    string;

  schemaVersion:
    1;
}
export interface FinoraControlCenterBranchPricingScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export interface FinoraControlCenterBranchPricingInput
  extends FinoraControlCenterBranchPricingScope {

  customerCreateFee?:
    number | null;

  loanDisbursementFee?:
    number | null;

  collectionBelow25000Fee?:
    number | null;

  collection25000To50000Fee?:
    number | null;

  collectionAbove50000Fee?:
    number | null;
}

export interface FinoraControlCenterBranchPricingView
  extends FinoraControlCenterBranchPricingScope {

  customerCreateFee?:
    number;

  loanDisbursementFee?:
    number;

  collectionBelow25000Fee?:
    number;

  collection25000To50000Fee?:
    number;

  collectionAbove50000Fee?:
    number;

  revision:
    number;

  updatedAt:
    string;

  schemaVersion:
    1;
}
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

  getBranchDirectoryMetadata:
    () =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterBranchDirectoryMetadataView[]
        >
      >;

  getFinoraIncomePricing:
    () =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterIncomePricingView
        >
      >;

  updateFinoraIncomePricing:
    (
      input:
        FinoraControlCenterIncomePricingInput,
    ) =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterIncomePricingView
        >
      >;
  getFinoraBranchPricing:
    (
      scope:
        FinoraControlCenterBranchPricingScope,
    ) =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterBranchPricingView | undefined
        >
      >;

  updateFinoraBranchPricing:
    (
      input:
        FinoraControlCenterBranchPricingInput,
    ) =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterBranchPricingView | undefined
        >
      >;

  getWalletHistory:
    () =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterWalletHistoryView[]
        >
      >;

  backfillHistoricalEnrollmentBranch:
    () =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterHistoricalBranchBackfillView
        >
      >;
  openBranchCertificationRotationRequest:
    () =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterBranchCertificationRotationOpenView
        >
      >;

  issueAndExportBranchCertificationRotation:
    () =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterBranchCertificationRotationExportView
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

  issueBranchDeviceRevocation:
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

  issuePortableStorageEntitlement:
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

  getBranchDirectoryMetadata:
    () =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS.GET_BRANCH_DIRECTORY_METADATA,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterBranchDirectoryMetadataView[]
        >
      >,

  getFinoraIncomePricing:
    () =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS.GET_FINORA_INCOME_PRICING,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterIncomePricingView
        >
      >,

  updateFinoraIncomePricing:
    (
      input,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS.UPDATE_FINORA_INCOME_PRICING,
        input,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterIncomePricingView
        >
      >,
  getFinoraBranchPricing:
    (
      scope,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS.GET_FINORA_BRANCH_PRICING,
        scope,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterBranchPricingView | undefined
        >
      >,

  updateFinoraBranchPricing:
    (
      input,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS.UPDATE_FINORA_BRANCH_PRICING,
        input,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterBranchPricingView | undefined
        >
      >,

  getWalletHistory:
    () =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS.GET_WALLET_HISTORY,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterWalletHistoryView[]
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
  openBranchCertificationRotationRequest:
    () =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS
          .OPEN_BRANCH_CERTIFICATION_ROTATION_REQUEST,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterBranchCertificationRotationOpenView
        >
      >,

  issueAndExportBranchCertificationRotation:
    () =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS
          .ISSUE_AND_EXPORT_BRANCH_CERTIFICATION_ROTATION,
      ) as Promise<
        FinoraControlCenterResult<
          FinoraControlCenterBranchCertificationRotationExportView
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

  issueBranchDeviceRevocation:
    (
      request,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS.ISSUE_BRANCH_DEVICE_REVOCATION,
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

  issuePortableStorageEntitlement:
    (
      request,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CENTER_CHANNELS.ISSUE_PORTABLE_STORAGE_ENTITLEMENT,
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