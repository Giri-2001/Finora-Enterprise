/* ============================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER — BRANCH REGISTRY CONTRACT

   MODULE  : Control Center
   LAYER   : Admin Authority Contract
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Represent one provisioned FINORA branch in Control Center
   - Preserve immutable installation / scope identity
   - Preserve provisioned Business / Branch codes
   - Track current signed access summary
   - Track last owner-reported wallet state
   - Track last owner-signed sync evidence
   - Support branch-card Admin Panel rendering

   SECURITY:

   - This registry contains PUBLIC installation-binding material
     only. It must never contain recipient private keys.
   - Control Center private signing material does not belong here.
   - Identity-critical fields are not ordinary editable settings.
   - Business / Branch display profile changes must flow through
     signed recipient control packages.
   - Last reported wallet state is NOT a live remote balance.
   - Remaining validity is derived from validUntil at read time.
   - No Business Date is used for security validity.
============================================================ */

import type {
  FinoraBranchCertificationPublicKeyV1,
} from "../control/finoraBranchCertificationContract.js";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_CONTROL_CENTER_BRANCH_REGISTRY_SCHEMA_VERSION =
  2 as const;

export const FINORA_CONTROL_CENTER_BRANCH_REGISTRY_PLATFORM =
  "WINDOWS" as const;

export const FINORA_CONTROL_CENTER_BRANCH_REGISTRY_BINDING_ALGORITHM =
  "ECDSA_P256_SHA256" as const;

export const FINORA_CONTROL_CENTER_BRANCH_REGISTRY_PUBLIC_KEY_FORMAT =
  "SPKI_DER_BASE64" as const;

export const FINORA_CONTROL_CENTER_BRANCH_REGISTRY_FINGERPRINT_ALGORITHM =
  "SHA-256" as const;

// ============================================================
// ENUM-LIKE TYPES
// ============================================================

export type FinoraControlCenterBranchAccessType =
  | "REGISTERED"
  | "DEMO";

export type FinoraControlCenterBranchAdministrativeStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

export type FinoraControlCenterBranchStorageMode =
  | "LOCAL"
  | "USB";

export type FinoraControlCenterBranchAuthorizedDeviceEvidenceSource =
  | "INITIAL_PROVISIONING";

// ============================================================
// PUBLIC RECIPIENT INSTALLATION IDENTITY
// ============================================================

export interface FinoraControlCenterBranchInstallationIdentity {

  installationId:
    string;

  bindingKeyId:
    string;

  platform:
    typeof FINORA_CONTROL_CENTER_BRANCH_REGISTRY_PLATFORM;

  algorithm:
    typeof FINORA_CONTROL_CENTER_BRANCH_REGISTRY_BINDING_ALGORITHM;

  publicKeyFormat:
    typeof FINORA_CONTROL_CENTER_BRANCH_REGISTRY_PUBLIC_KEY_FORMAT;

  publicKey:
    string;

  fingerprintAlgorithm:
    typeof FINORA_CONTROL_CENTER_BRANCH_REGISTRY_FINGERPRINT_ALGORITHM;

  publicKeyFingerprint:
    string;

  bindingCreatedAt:
    string;
}

// ============================================================
// AUTHORIZED DEVICE
//
// Registry-side administrative evidence only.
// Recipient Device Trust remains the runtime login authority.
// ============================================================

export interface FinoraControlCenterBranchAuthorizedDevice {

  installation:
    FinoraControlCenterBranchInstallationIdentity;

  evidenceSource:
    FinoraControlCenterBranchAuthorizedDeviceEvidenceSource;

  firstObservedAt:
    string;

  updatedAt:
    string;
}

// ============================================================
// PROVISIONED IDENTITY
//
// These values identify the branch and are not ordinary editable
// profile fields.
// ============================================================

export interface FinoraControlCenterBranchProvisionedIdentity {

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

  installation:
    FinoraControlCenterBranchInstallationIdentity;
}

// ============================================================
// DISPLAY PROFILE
//
// Mutable names are deliberately separated from provisioned IDs.
// Changes are expected to be issued through signed control packages.
// ============================================================

export interface FinoraControlCenterBranchDisplayProfile {

  businessName:
    string;

  branchName:
    string;

  sourcePackageId?:
    string;

  updatedAt:
    string;
}

// ============================================================
// ACCESS SUMMARY
// ============================================================

export interface FinoraControlCenterBranchAccessSummary {

  grantId?:
    string;

  accessType:
    FinoraControlCenterBranchAccessType;

  administrativeStatus:
    FinoraControlCenterBranchAdministrativeStatus;

  storageMode:
    FinoraControlCenterBranchStorageMode;

  validFrom:
    string;

  validUntil:
    string;

  sourcePackageId?:
    string;

  updatedAt:
    string;
}

// ============================================================
// LAST OWNER-SIGNED SYNC
//
// This is evidence of the last state reported by the recipient.
// It is not continuous online synchronization.
// ============================================================

export interface FinoraControlCenterBranchLastSync {

  snapshotId:
    string;

  reportedAt:
    string;

  receivedAt:
    string;
}

// ============================================================
// LAST REPORTED WALLET
//
// Monetary transport uses integer minor units.
// Admin UI may format this as whole INR according to FINORA UI
// display rules.
//
// This is explicitly LAST REPORTED state, not claimed live state.
// ============================================================

export interface FinoraControlCenterBranchLastReportedWallet {

  walletId:
    string;

  balanceMinor:
    number;

  currency:
    "INR";

  reportedAt:
    string;

  lastTransactionAt?:
    string;
}

// ============================================================
// BRANCH CERTIFICATION ROTATION EVIDENCE
//
// Durable evidence of the most recent successful Control Center
// certification-authority transition.
//
// This is required to distinguish an exact idempotent retry from
// a stale/conflicting rotation after the Registry already holds
// the replacement authority.
// ============================================================

export interface FinoraControlCenterBranchCertificationRotationEvidence {

  sourcePackageId:
    string;

  sequence:
    number;

  requestingInstallationId:
    string;

  requestingBindingKeyId:
    string;

  requestingFingerprintAlgorithm:
    "SHA-256";

  requestingPublicKeyFingerprint:
    string;

  legacyCertificationAdoption?:
    true;

  previousCertificationPublicKey?:
    FinoraBranchCertificationPublicKeyV1;

  replacementCertificationPublicKey:
    FinoraBranchCertificationPublicKeyV1;

  rotatedAt:
    string;

  schemaVersion:
    1;
}

// ============================================================
// BRANCH REGISTRY RECORD
// ============================================================

export interface FinoraControlCenterBranchRegistryRecord {

  identity:
    FinoraControlCenterBranchProvisionedIdentity;

  authorizedDevices:
    FinoraControlCenterBranchAuthorizedDevice[];

  /*
   * Branch-held public certification authority.
   *
   * Registration treats an existing pin as immutable. The only
   * permitted replacement is the dedicated cryptographically
   * authorized Branch Certification Rotation path.
   *
   * Legacy Registry V2 records may legitimately omit this field.
   */
  branchCertificationPublicKey?:
    FinoraBranchCertificationPublicKeyV1;

  branchCertificationRotation?:
    FinoraControlCenterBranchCertificationRotationEvidence;

  profile?:
    FinoraControlCenterBranchDisplayProfile;

  access?:
    FinoraControlCenterBranchAccessSummary;

  lastSync?:
    FinoraControlCenterBranchLastSync;

  lastReportedWallet?:
    FinoraControlCenterBranchLastReportedWallet;

  createdAt:
    string;

  updatedAt:
    string;

  schemaVersion:
    typeof FINORA_CONTROL_CENTER_BRANCH_REGISTRY_SCHEMA_VERSION;
}

// ============================================================
// REGISTRY ROOT
// ============================================================

export interface FinoraControlCenterBranchRegistry {

  branches:
    FinoraControlCenterBranchRegistryRecord[];

  createdAt:
    string;

  updatedAt:
    string;

  schemaVersion:
    typeof FINORA_CONTROL_CENTER_BRANCH_REGISTRY_SCHEMA_VERSION;
}

// ============================================================
// END
// ============================================================