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

// ============================================================
// IPC CHANNELS
//
// Duplicated intentionally instead of importing the main-process
// IPC module. The preload must not load main-process handler code.
// ============================================================

const CONTROL_CENTER_CHANNELS = {
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
// BRIDGE CONTRACT
// ============================================================

export interface FinoraControlCenterBridge {
  getTrustRecord:
    () =>
      Promise<
        FinoraControlCenterResult<
          FinoraControlCenterTrustRecordView
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