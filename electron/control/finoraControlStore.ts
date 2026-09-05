// ============================================================
// FINORA ENTERPRISE OS™
//
// ELECTRON CONTROL STORE
//
// RESPONSIBILITY:
//
// - Persist FINORA device-level control state
// - Persist branch activation metadata
// - Persist per-login LOCAL / USB storage entitlements
// - Encrypt the complete control payload with Electron safeStorage
// - Keep control state outside operational LOCAL / USB datasets
//
// IMPORTANT:
//
// - MAIN PROCESS ONLY.
// - Renderer receives no filesystem path.
// - Renderer receives no encryption material.
// - No customer data.
// - No loan data.
// - No collection data.
// - No Gold custody data.
// - No wallet balance.
// - No pricing amount.
// - No plaintext persistence fallback.
// - Corrupt control data is NEVER silently reset.
//
// STORAGE:
//
// Electron userData/
//   FINORA/
//     control/
//       finora-control.bin
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { app, safeStorage } from "electron";

import path from "node:path";

import fs from "node:fs/promises";

import { evaluateFinoraControlReplay } from "./finoraControlReplayPolicy.js";

import type {
  FinoraControlAppliedPackageRecord,
  FinoraControlSequenceStateRecord,
} from "./finoraControlReplayPolicy.js";

// ============================================================
// CONSTANTS
// ============================================================

const CONTROL_STORE_VERSION = "1.0" as const;

const CONTROL_DIRECTORY_NAME = "FINORA";

const CONTROL_SUBDIRECTORY_NAME = "control";

const CONTROL_FILE_NAME = "finora-control.bin";

// ============================================================
// DOMAIN TYPES
// ============================================================

export type FinoraControlActivationStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "DEACTIVATED";

export type FinoraControlStorageMode = "LOCAL" | "USB";

export type FinoraControlEntitlementStatus = "ACTIVE" | "SUSPENDED" | "REVOKED";

// ============================================================
// BRANCH ACTIVATION DTO
// ============================================================

export interface FinoraControlBranchActivation {
  activationId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  status: FinoraControlActivationStatus;

  activatedAt?: string;

  createdAt: string;

  updatedAt: string;

  schemaVersion: 1;
}

// ============================================================
// INSTALLATION IDENTITY DTO
// ============================================================

export interface FinoraControlInstallationIdentity {
  installationId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  /**
   * Immutable FINORA-assigned numbering codes.
   *
   * Optional only for legacy schemaVersion 1 installations.
   * New provisioning supplies both values together.
   */
  businessCode?: string;

  branchCode?: string;

  createdAt: string;

  updatedAt: string;

  schemaVersion: 1;
}

// ============================================================
// BUSINESS PROFILE DTO
// ============================================================

/**
 * Trusted native representation of one signed FINORA
 * Business / Branch Profile.
 *
 * Immutable identity:
 *
 * - profileId
 * - ownerId
 * - businessId
 * - branchId
 * - businessCode
 * - branchCode
 * - installation binding tuple
 *
 * Signed REPLACE may update businessName / branchName and
 * updatedAt while immutable identity remains unchanged.
 */
export interface FinoraControlBusinessProfile {

  profileId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  businessCode: string;

  branchCode: string;

  businessName: string;

  branchName: string;

  installationId: string;

  bindingKeyId: string;

  fingerprintAlgorithm: "SHA-256";

  publicKeyFingerprint: string;

  createdAt: string;

  updatedAt: string;

  schemaVersion: 1;
}
// ============================================================
// STORAGE ENTITLEMENT DTO
// ============================================================

export interface FinoraControlStorageEntitlement {
  entitlementId: string;

  userId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  installationId: string;

  bindingKeyId: string;

  fingerprintAlgorithm: "SHA-256";

  publicKeyFingerprint: string;
  storageMode: FinoraControlStorageMode;

  status: FinoraControlEntitlementStatus;

  activatedAt: string;

  createdAt: string;

  updatedAt: string;

  schemaVersion: 1;
}

// ============================================================
// CONTROL PACKAGE
// ============================================================

// ============================================================
// BRANCH ACCESS GRANT DTO
// ============================================================

export type FinoraControlBranchAccessType = "REGISTERED" | "DEMO";

export type FinoraControlBranchAccessStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

export interface FinoraControlRegistrationPayment {
  amount: number;

  currency: string;

  paymentMode: "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER";

  paidAt: string;

  reference?: string;

  remarks?: string;

  refundable: false;
}

export interface FinoraControlBranchAccessGrant {
  grantId: string;

  userId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  storageMode: FinoraControlStorageMode;
  accessType: FinoraControlBranchAccessType;

  administrativeStatus: FinoraControlBranchAccessStatus;

  validity: {
    validFrom: string;

    validUntil: string;
  };

  registrationPayment?: FinoraControlRegistrationPayment;

  registrationCycle?: number;

  demoId?: string;

  demoRemarks?: string;

  createdAt: string;

  updatedAt: string;

  schemaVersion: 1;
}

// ============================================================
// VERIFIED CONTROL STATE
// ============================================================
export interface FinoraControlStorePackage {
  version: typeof CONTROL_STORE_VERSION;

  installation?: FinoraControlInstallationIdentity;

  activations: FinoraControlBranchActivation[];

  storageEntitlements: FinoraControlStorageEntitlement[];

  /**
   * Current signed FINORA Business / Branch profile.
   *
   * Optional only for backward compatibility with encrypted
   * Control Stores created before Phase 4.
   *
   * New verified BUSINESS_PROFILE applies persist this array.
   */
  businessProfiles?:
    FinoraControlBusinessProfile[];

  /**
   * Current signed REGISTERED / DEMO access by login identity.
   *
   * Optional only for backward compatibility with encrypted
   * Control Stores created before the Branch Access Engine.
   */
  branchAccessGrants?: FinoraControlBranchAccessGrant[];

  /**
   * Cryptographically verified package IDs already applied.
   */
  appliedControlPackages?: FinoraControlAppliedPackageRecord[];

  /**
   * Highest accepted sequence per issuer / purpose / target.
   */
  controlSequences?: FinoraControlSequenceStateRecord[];

  updatedAt: string;
}

// ============================================================
// RESULT
// ============================================================

export interface FinoraControlStoreResult<T> {
  success: boolean;

  data?: T;

  error?: string;
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

function success<T>(data: T): FinoraControlStoreResult<T> {
  return {
    success: true,
    data,
  };
}

function failure<T = never>(error: string): FinoraControlStoreResult<T> {
  return {
    success: false,
    error,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isActivationStatus(
  value: unknown,
): value is FinoraControlActivationStatus {
  return (
    value === "PENDING" ||
    value === "ACTIVE" ||
    value === "SUSPENDED" ||
    value === "DEACTIVATED"
  );
}

function isStorageMode(value: unknown): value is FinoraControlStorageMode {
  return value === "LOCAL" || value === "USB";
}

function isEntitlementStatus(
  value: unknown,
): value is FinoraControlEntitlementStatus {
  return value === "ACTIVE" || value === "SUSPENDED" || value === "REVOKED";
}

// ============================================================
// DTO VALIDATION
// ============================================================

function isBranchActivation(
  value: unknown,
): value is FinoraControlBranchActivation {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.activationId) &&
    isNonEmptyString(value.ownerId) &&
    isNonEmptyString(value.businessId) &&
    isNonEmptyString(value.branchId) &&
    isActivationStatus(value.status) &&
    isOptionalString(value.activatedAt) &&
    isNonEmptyString(value.createdAt) &&
    isNonEmptyString(value.updatedAt) &&
    value.schemaVersion === 1
  );
}

function isInstallationIdentity(
  value: unknown,
): value is FinoraControlInstallationIdentity {
  if (!isRecord(value)) {
    return false;
  }

  const hasBusinessCode = value.businessCode !== undefined;

  const hasBranchCode = value.branchCode !== undefined;

  if (hasBusinessCode !== hasBranchCode) {
    return false;
  }

  if (
    hasBusinessCode &&
    (!isNonEmptyString(value.businessCode) ||
      !isNonEmptyString(value.branchCode))
  ) {
    return false;
  }

  return (
    isNonEmptyString(value.installationId) &&
    isNonEmptyString(value.ownerId) &&
    isNonEmptyString(value.businessId) &&
    isNonEmptyString(value.branchId) &&
    isNonEmptyString(value.createdAt) &&
    isNonEmptyString(value.updatedAt) &&
    value.schemaVersion === 1
  );
}

function isStorageEntitlementFingerprint(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

function isStorageEntitlementNativeBinding(
  value: Record<string, unknown>,
): boolean {
  if (
    !isNonEmptyString(value.installationId) ||
    !isNonEmptyString(value.bindingKeyId) ||
    value.fingerprintAlgorithm !== "SHA-256" ||
    !isStorageEntitlementFingerprint(value.publicKeyFingerprint)
  ) {
    return false;
  }

  const expectedBindingKeyId = `FINORA-BINDING-${value.publicKeyFingerprint
    .slice(0, 32)
    .toUpperCase()}`;

  return value.bindingKeyId === expectedBindingKeyId;
}

// ============================================================
// BUSINESS PROFILE VALIDATION
// ============================================================

function isBusinessProfile(
  value:
    unknown,
): value is FinoraControlBusinessProfile {

  if (!isRecord(value)) {
    return false;
  }

  if (
    !isNonEmptyString(value.profileId) ||
    !isNonEmptyString(value.ownerId) ||
    !isNonEmptyString(value.businessId) ||
    !isNonEmptyString(value.branchId) ||
    !isNonEmptyString(value.businessCode) ||
    !isNonEmptyString(value.branchCode) ||
    !isNonEmptyString(value.businessName) ||
    !isNonEmptyString(value.branchName) ||
    !isNonEmptyString(value.installationId) ||
    !isNonEmptyString(value.bindingKeyId) ||
    value.fingerprintAlgorithm !==
      "SHA-256" ||
    typeof value.publicKeyFingerprint !==
      "string" ||
    !/^[0-9a-f]{64}$/.test(
      value.publicKeyFingerprint,
    ) ||
    !isControlTimestamp(value.createdAt) ||
    !isControlTimestamp(value.updatedAt) ||
    value.schemaVersion !==
      1
  ) {
    return false;
  }

  const expectedBindingKeyId =
    `FINORA-BINDING-${value.publicKeyFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  if (
    value.bindingKeyId !==
      expectedBindingKeyId
  ) {
    return false;
  }

  const createdAt =
    Date.parse(
      value.createdAt,
    );

  const updatedAt =
    Date.parse(
      value.updatedAt,
    );

  return (
    Number.isFinite(createdAt) &&
    Number.isFinite(updatedAt) &&
    updatedAt >=
      createdAt
  );
}
function isStorageEntitlement(
  value: unknown,
): value is FinoraControlStorageEntitlement {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.entitlementId) &&
    isNonEmptyString(value.userId) &&
    isNonEmptyString(value.ownerId) &&
    isNonEmptyString(value.businessId) &&
    isNonEmptyString(value.branchId) &&
    isStorageEntitlementNativeBinding(value) &&
    isStorageMode(value.storageMode) &&
    isEntitlementStatus(value.status) &&
    isNonEmptyString(value.activatedAt) &&
    isNonEmptyString(value.createdAt) &&
    isNonEmptyString(value.updatedAt) &&
    value.schemaVersion === 1
  );
}

function hasDuplicateActivationKeys(
  activations: FinoraControlBranchActivation[],
): boolean {
  const keys = new Set<string>();

  for (const activation of activations) {
    const key = [
      activation.ownerId,
      activation.businessId,
      activation.branchId,
    ].join("::");

    if (keys.has(key)) {
      return true;
    }

    keys.add(key);
  }

  return false;
}

// ============================================================
// DUPLICATE BUSINESS PROFILE VALIDATION
// ============================================================

function hasDuplicateBusinessProfileKeys(
  profiles:
    readonly FinoraControlBusinessProfile[],
): boolean {

  const scopeKeys =
    new Set<string>();

  const profileIds =
    new Set<string>();

  for (const profile of profiles) {

    const scopeKey =
      [
        profile.ownerId,
        profile.businessId,
        profile.branchId,
      ].join(
        "::",
      );

    if (
      scopeKeys.has(
        scopeKey,
      ) ||
      profileIds.has(
        profile.profileId,
      )
    ) {
      return true;
    }

    scopeKeys.add(
      scopeKey,
    );

    profileIds.add(
      profile.profileId,
    );
  }

  return false;
}
function hasDuplicateEntitlementKeys(
  entitlements: FinoraControlStorageEntitlement[],
): boolean {
  const keys = new Set<string>();

  for (const entitlement of entitlements) {
    const key = [
      entitlement.userId,
      entitlement.ownerId,
      entitlement.businessId,
      entitlement.branchId,
      entitlement.storageMode,
    ].join("::");

    if (keys.has(key)) {
      return true;
    }

    keys.add(key);
  }

  return false;
}

function isControlTimestamp(value: unknown): value is string {
  return isNonEmptyString(value) && Number.isFinite(Date.parse(value));
}

function isBranchAccessGrant(
  value: unknown,
): value is FinoraControlBranchAccessGrant {
  if (!isRecord(value)) {
    return false;
  }

  if (value.storageMode !== "LOCAL" && value.storageMode !== "USB") {
    return false;
  }

  if (!isRecord(value)) {
    return false;
  }

  if (
    value.schemaVersion !== 1 ||
    !isNonEmptyString(value.grantId) ||
    !isNonEmptyString(value.userId) ||
    !isNonEmptyString(value.ownerId) ||
    !isNonEmptyString(value.businessId) ||
    !isNonEmptyString(value.branchId) ||
    (value.administrativeStatus !== "ACTIVE" &&
      value.administrativeStatus !== "SUSPENDED" &&
      value.administrativeStatus !== "REVOKED") ||
    !isRecord(value.validity) ||
    !isControlTimestamp(value.validity.validFrom) ||
    !isControlTimestamp(value.validity.validUntil) ||
    !isControlTimestamp(value.createdAt) ||
    !isControlTimestamp(value.updatedAt) ||
    !isOptionalString(value.demoRemarks)
  ) {
    return false;
  }

  const validFrom = Date.parse(value.validity.validFrom);

  const validUntil = Date.parse(value.validity.validUntil);

  if (validUntil <= validFrom) {
    return false;
  }

  // ----------------------------------------------------------
  // REGISTERED
  // ----------------------------------------------------------

  if (value.accessType === "REGISTERED") {
    const registrationDuration = 365 * 24 * 60 * 60 * 1000;

    if (
      validUntil - validFrom !== registrationDuration ||
      !Number.isSafeInteger(value.registrationCycle) ||
      (value.registrationCycle as number) <= 0 ||
      !isRecord(value.registrationPayment) ||
      value.demoId !== undefined
    ) {
      return false;
    }

    const payment = value.registrationPayment;

    return (
      payment.amount === 2000 &&
      payment.currency === "INR" &&
      (payment.paymentMode === "CASH" ||
        payment.paymentMode === "UPI" ||
        payment.paymentMode === "BANK_TRANSFER" ||
        payment.paymentMode === "OTHER") &&
      isControlTimestamp(payment.paidAt) &&
      isOptionalString(payment.reference) &&
      isOptionalString(payment.remarks) &&
      payment.refundable === false
    );
  }

  // ----------------------------------------------------------
  // DEMO
  // ----------------------------------------------------------

  if (value.accessType === "DEMO") {
    return (
      isNonEmptyString(value.demoId) &&
      value.registrationPayment === undefined &&
      value.registrationCycle === undefined
    );
  }

  return false;
}

function isAppliedControlPackageRecord(
  value: unknown,
): value is FinoraControlAppliedPackageRecord {
  return (
    isRecord(value) &&
    isNonEmptyString(value.packageId) &&
    isNonEmptyString(value.issuerId) &&
    isNonEmptyString(value.purpose) &&
    Number.isSafeInteger(value.sequence) &&
    (value.sequence as number) > 0 &&
    isNonEmptyString(value.ownerId) &&
    isNonEmptyString(value.businessId) &&
    isNonEmptyString(value.branchId) &&
    isNonEmptyString(value.installationId) &&
    isControlTimestamp(value.appliedAt)
  );
}

function isControlSequenceStateRecord(
  value: unknown,
): value is FinoraControlSequenceStateRecord {
  return (
    isRecord(value) &&
    isNonEmptyString(value.issuerId) &&
    isNonEmptyString(value.purpose) &&
    isNonEmptyString(value.ownerId) &&
    isNonEmptyString(value.businessId) &&
    isNonEmptyString(value.branchId) &&
    isNonEmptyString(value.installationId) &&
    Number.isSafeInteger(value.lastSequence) &&
    (value.lastSequence as number) > 0 &&
    isControlTimestamp(value.updatedAt)
  );
}

function hasDuplicateBranchAccessKeys(
  grants: FinoraControlBranchAccessGrant[],
): boolean {
  const keys = new Set<string>();

  for (const grant of grants) {
    const key = [
      grant.userId,
      grant.ownerId,
      grant.businessId,
      grant.branchId,
    ].join("::");

    if (keys.has(key)) {
      return true;
    }

    keys.add(key);
  }

  return false;
}

function hasDuplicateAppliedPackageIds(
  records: FinoraControlAppliedPackageRecord[],
): boolean {
  const packageIds = new Set<string>();

  for (const record of records) {
    if (packageIds.has(record.packageId)) {
      return true;
    }

    packageIds.add(record.packageId);
  }

  return false;
}

function hasDuplicateControlSequenceKeys(
  records: FinoraControlSequenceStateRecord[],
): boolean {
  const keys = new Set<string>();

  for (const record of records) {
    const key = [
      record.issuerId,
      record.purpose,
      record.ownerId,
      record.businessId,
      record.branchId,
      record.installationId,
    ].join("::");

    if (keys.has(key)) {
      return true;
    }

    keys.add(key);
  }

  return false;
}

function isControlStorePackage(
  value: unknown,
): value is FinoraControlStorePackage {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.version !== CONTROL_STORE_VERSION ||
    (value.installation !== undefined &&
      !isInstallationIdentity(value.installation)) ||
    !Array.isArray(value.activations) ||
    !Array.isArray(value.storageEntitlements) ||
    !isNonEmptyString(value.updatedAt)
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // EXISTING STATE
  // ----------------------------------------------------------

  if (!value.activations.every(isBranchActivation)) {
    return false;
  }

  if (!value.storageEntitlements.every(isStorageEntitlement)) {
    return false;
  }

  if (hasDuplicateActivationKeys(value.activations)) {
    return false;
  }

  if (hasDuplicateEntitlementKeys(value.storageEntitlements)) {
    return false;
  }

  // ----------------------------------------------------------
  // SIGNED BUSINESS PROFILE STATE
  //
  // Optional only for backward compatibility with encrypted
  // Control Stores created before the Business Profile Engine.
  // ----------------------------------------------------------

  if (
    value.businessProfiles !==
      undefined &&
    (
      !Array.isArray(
        value.businessProfiles,
      ) ||
      !value.businessProfiles.every(
        isBusinessProfile,
      ) ||
      hasDuplicateBusinessProfileKeys(
        value.businessProfiles,
      )
    )
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // SIGNED BRANCH ACCESS STATE
  // ----------------------------------------------------------

  const branchAccessGrants = value.branchAccessGrants;

  if (branchAccessGrants !== undefined) {
    if (
      !Array.isArray(branchAccessGrants) ||
      !branchAccessGrants.every(isBranchAccessGrant) ||
      hasDuplicateBranchAccessKeys(branchAccessGrants)
    ) {
      return false;
    }
  }

  // ----------------------------------------------------------
  // REPLAY LEDGER
  // ----------------------------------------------------------

  const appliedControlPackages = value.appliedControlPackages;

  if (appliedControlPackages !== undefined) {
    if (
      !Array.isArray(appliedControlPackages) ||
      !appliedControlPackages.every(isAppliedControlPackageRecord) ||
      hasDuplicateAppliedPackageIds(appliedControlPackages)
    ) {
      return false;
    }
  }

  // ----------------------------------------------------------
  // MONOTONIC SEQUENCES
  // ----------------------------------------------------------

  const controlSequences = value.controlSequences;

  if (controlSequences !== undefined) {
    if (
      !Array.isArray(controlSequences) ||
      !controlSequences.every(isControlSequenceStateRecord) ||
      hasDuplicateControlSequenceKeys(controlSequences)
    ) {
      return false;
    }
  }

  return true;
}

// ============================================================
// DEVELOPMENT VALIDATION DIAGNOSTIC
// ============================================================
//
// Reports only the failing structural section / array index.
// No IDs, names, fingerprints, payments or decrypted values
// are emitted.
//
// Enabled only by:
// FINORA_DEV_CONTROL_STORE_DIAGNOSTICS=1
// ============================================================

function describeStorageEntitlementValidationFailure(
  value:
    unknown,
): string {

  if (!isRecord(value)) {
    return "NOT_OBJECT";
  }

  if (
    !isNonEmptyString(
      value.entitlementId,
    )
  ) {
    return "ENTITLEMENT_ID_INVALID";
  }

  if (
    !isNonEmptyString(
      value.userId,
    )
  ) {
    return "USER_ID_INVALID";
  }

  if (
    !isNonEmptyString(
      value.ownerId,
    )
  ) {
    return "OWNER_ID_INVALID";
  }

  if (
    !isNonEmptyString(
      value.businessId,
    )
  ) {
    return "BUSINESS_ID_INVALID";
  }

  if (
    !isNonEmptyString(
      value.branchId,
    )
  ) {
    return "BRANCH_ID_INVALID";
  }

  if (
    !isNonEmptyString(
      value.installationId,
    )
  ) {
    return "INSTALLATION_ID_INVALID";
  }

  if (
    !isNonEmptyString(
      value.bindingKeyId,
    )
  ) {
    return "BINDING_KEY_ID_INVALID";
  }

  if (
    value.fingerprintAlgorithm !==
      "SHA-256"
  ) {
    return "FINGERPRINT_ALGORITHM_INVALID";
  }

  if (
    !isStorageEntitlementFingerprint(
      value.publicKeyFingerprint,
    )
  ) {
    return "PUBLIC_KEY_FINGERPRINT_INVALID";
  }

  const expectedBindingKeyId =
    `FINORA-BINDING-${value.publicKeyFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  if (
    value.bindingKeyId !==
      expectedBindingKeyId
  ) {
    return "BINDING_KEY_FINGERPRINT_MISMATCH";
  }

  if (
    !isStorageMode(
      value.storageMode,
    )
  ) {
    return "STORAGE_MODE_INVALID";
  }

  if (
    !isEntitlementStatus(
      value.status,
    )
  ) {
    return "STATUS_INVALID";
  }

  if (
    !isNonEmptyString(
      value.activatedAt,
    )
  ) {
    return "ACTIVATED_AT_INVALID";
  }

  if (
    !isNonEmptyString(
      value.createdAt,
    )
  ) {
    return "CREATED_AT_INVALID";
  }

  if (
    !isNonEmptyString(
      value.updatedAt,
    )
  ) {
    return "UPDATED_AT_INVALID";
  }

  if (
    value.schemaVersion !==
      1
  ) {
    return "SCHEMA_VERSION_INVALID";
  }

  return "UNKNOWN_STORAGE_ENTITLEMENT_FAILURE";
}

function describeControlStorePackageValidationFailure(
  value:
    unknown,
): string {

  if (!isRecord(value)) {
    return "ROOT_NOT_OBJECT";
  }

  if (
    value.version !==
      CONTROL_STORE_VERSION
  ) {
    return "ROOT_VERSION_INVALID";
  }

  if (
    value.installation !==
      undefined &&
    !isInstallationIdentity(
      value.installation,
    )
  ) {
    return "INSTALLATION_INVALID";
  }

  if (
    !Array.isArray(
      value.activations,
    )
  ) {
    return "ACTIVATIONS_NOT_ARRAY";
  }

  const activationInvalidIndex =
    value.activations.findIndex(
      (item) =>
        !isBranchActivation(
          item,
        ),
    );

  if (
    activationInvalidIndex >=
      0
  ) {
    return `ACTIVATION_INVALID_INDEX_${activationInvalidIndex}`;
  }

  const activations =
    value.activations as
      FinoraControlBranchActivation[];

  if (
    hasDuplicateActivationKeys(
      activations,
    )
  ) {
    return "ACTIVATION_DUPLICATE_SCOPE";
  }

  if (
    !Array.isArray(
      value.storageEntitlements,
    )
  ) {
    return "STORAGE_ENTITLEMENTS_NOT_ARRAY";
  }

  const entitlementInvalidIndex =
    value.storageEntitlements.findIndex(
      (item) =>
        !isStorageEntitlement(
          item,
        ),
    );

  if (
    entitlementInvalidIndex >=
      0
  ) {
    const entitlementFailure =
      describeStorageEntitlementValidationFailure(
        value.storageEntitlements[
          entitlementInvalidIndex
        ],
      );

    return `STORAGE_ENTITLEMENT_INVALID_INDEX_${entitlementInvalidIndex}_${entitlementFailure}`;
  }

  const storageEntitlements =
    value.storageEntitlements as
      FinoraControlStorageEntitlement[];

  if (
    hasDuplicateEntitlementKeys(
      storageEntitlements,
    )
  ) {
    return "STORAGE_ENTITLEMENT_DUPLICATE_SCOPE";
  }

  if (
    value.businessProfiles !==
      undefined
  ) {

    if (
      !Array.isArray(
        value.businessProfiles,
      )
    ) {
      return "BUSINESS_PROFILES_NOT_ARRAY";
    }

    const profileInvalidIndex =
      value.businessProfiles.findIndex(
        (item) =>
          !isBusinessProfile(
            item,
          ),
      );

    if (
      profileInvalidIndex >=
        0
    ) {
      return `BUSINESS_PROFILE_INVALID_INDEX_${profileInvalidIndex}`;
    }

    const businessProfiles =
      value.businessProfiles as
        FinoraControlBusinessProfile[];

    if (
      hasDuplicateBusinessProfileKeys(
        businessProfiles,
      )
    ) {
      return "BUSINESS_PROFILE_DUPLICATE_IDENTITY";
    }
  }

  if (
    value.branchAccessGrants !==
      undefined
  ) {

    if (
      !Array.isArray(
        value.branchAccessGrants,
      )
    ) {
      return "BRANCH_ACCESS_GRANTS_NOT_ARRAY";
    }

    const accessGrantInvalidIndex =
      value.branchAccessGrants.findIndex(
        (item) =>
          !isBranchAccessGrant(
            item,
          ),
      );

    if (
      accessGrantInvalidIndex >=
        0
    ) {
      return `BRANCH_ACCESS_GRANT_INVALID_INDEX_${accessGrantInvalidIndex}`;
    }

    const branchAccessGrants =
      value.branchAccessGrants as
        FinoraControlBranchAccessGrant[];

    if (
      hasDuplicateBranchAccessKeys(
        branchAccessGrants,
      )
    ) {
      return "BRANCH_ACCESS_GRANT_DUPLICATE_SCOPE";
    }
  }

  if (
    value.appliedControlPackages !==
      undefined
  ) {

    if (
      !Array.isArray(
        value.appliedControlPackages,
      )
    ) {
      return "APPLIED_CONTROL_PACKAGES_NOT_ARRAY";
    }

    const appliedInvalidIndex =
      value.appliedControlPackages.findIndex(
        (item) =>
          !isAppliedControlPackageRecord(
            item,
          ),
      );

    if (
      appliedInvalidIndex >=
        0
    ) {
      return `APPLIED_CONTROL_PACKAGE_INVALID_INDEX_${appliedInvalidIndex}`;
    }

    const appliedControlPackages =
      value.appliedControlPackages as
        FinoraControlAppliedPackageRecord[];

    if (
      hasDuplicateAppliedPackageIds(
        appliedControlPackages,
      )
    ) {
      return "APPLIED_CONTROL_PACKAGE_DUPLICATE_ID";
    }
  }

  if (
    value.controlSequences !==
      undefined
  ) {

    if (
      !Array.isArray(
        value.controlSequences,
      )
    ) {
      return "CONTROL_SEQUENCES_NOT_ARRAY";
    }

    const sequenceInvalidIndex =
      value.controlSequences.findIndex(
        (item) =>
          !isControlSequenceStateRecord(
            item,
          ),
      );

    if (
      sequenceInvalidIndex >=
        0
    ) {
      return `CONTROL_SEQUENCE_INVALID_INDEX_${sequenceInvalidIndex}`;
    }

    const controlSequences =
      value.controlSequences as
        FinoraControlSequenceStateRecord[];

    if (
      hasDuplicateControlSequenceKeys(
        controlSequences,
      )
    ) {
      return "CONTROL_SEQUENCE_DUPLICATE_SCOPE";
    }
  }

  if (
    !isNonEmptyString(
      value.updatedAt,
    )
  ) {
    return "ROOT_UPDATED_AT_INVALID";
  }

  return "UNKNOWN_VALIDATION_FAILURE";
}
// ============================================================
// DEFAULT PACKAGE
// ============================================================

function createEmptyControlStore(): FinoraControlStorePackage {
  return {
    version: CONTROL_STORE_VERSION,

    activations: [],

    storageEntitlements: [],

    branchAccessGrants: [],

    appliedControlPackages: [],

    controlSequences: [],

    updatedAt: new Date().toISOString(),
  };
}
// ============================================================
// FILE PATH
// ============================================================

function getControlDirectory(): string {
  if (!app.isReady()) {
    throw new Error(
      "FINORA Control Store is unavailable before Electron app readiness.",
    );
  }

  return path.join(
    app.getPath("userData"),
    CONTROL_DIRECTORY_NAME,
    CONTROL_SUBDIRECTORY_NAME,
  );
}

function getControlFile(): string {
  return path.join(getControlDirectory(), CONTROL_FILE_NAME);
}

// ============================================================
// ENCRYPTION
// ============================================================

async function encryptControlPayload(plainText: string): Promise<Buffer> {
  if (!app.isReady()) {
    throw new Error(
      "FINORA Control Store encryption is unavailable before Electron app readiness.",
    );
  }

  if (await safeStorage.isAsyncEncryptionAvailable()) {
    return safeStorage.encryptStringAsync(plainText);
  }

  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(plainText);
  }

  throw new Error(
    "Secure operating-system encryption is unavailable for the FINORA Control Store.",
  );
}

interface DecryptedPayload {
  plainText: string;

  shouldReEncrypt: boolean;
}

async function decryptControlPayload(
  encrypted: Buffer,
): Promise<DecryptedPayload> {
  if (!app.isReady()) {
    throw new Error(
      "FINORA Control Store decryption is unavailable before Electron app readiness.",
    );
  }

  if (await safeStorage.isAsyncEncryptionAvailable()) {
    const result = await safeStorage.decryptStringAsync(encrypted);

    return {
      plainText: result.result,

      shouldReEncrypt: result.shouldReEncrypt,
    };
  }

  if (safeStorage.isEncryptionAvailable()) {
    return {
      plainText: safeStorage.decryptString(encrypted),

      shouldReEncrypt: false,
    };
  }

  throw new Error(
    "Secure operating-system decryption is unavailable for the FINORA Control Store.",
  );
}

// ============================================================
// LOW-LEVEL PERSISTENCE
// ============================================================

async function persistControlStorePackage(
  controlStore: FinoraControlStorePackage,
): Promise<void> {
  if (!isControlStorePackage(controlStore)) {
    throw new Error(
      "Refusing to persist an invalid FINORA Control Store package.",
    );
  }

  const controlDirectory = getControlDirectory();

  const controlFile = getControlFile();

  const temporaryFile = `${controlFile}.tmp`;

  await fs.mkdir(controlDirectory, {
    recursive: true,
    mode: 0o700,
  });

  const plainText = JSON.stringify(controlStore);

  const encrypted = await encryptControlPayload(plainText);

  await fs.writeFile(temporaryFile, encrypted, {
    mode: 0o600,
  });

  await fs.rename(temporaryFile, controlFile);
}

async function controlFileExists(): Promise<boolean> {
  try {
    await fs.access(getControlFile());

    return true;
  } catch {
    return false;
  }
}

// ============================================================
// READ CONTROL STORE
// ============================================================

export async function readFinoraControlStore(): Promise<
  FinoraControlStoreResult<FinoraControlStorePackage>
> {
  try {
    if (!(await controlFileExists())) {
      return success(createEmptyControlStore());
    }

    const encrypted = await fs.readFile(getControlFile());

    if (encrypted.length === 0) {
      return failure("FINORA Control Store file is empty.");
    }

    const decrypted = await decryptControlPayload(encrypted);

    let parsed: unknown;

    try {
      parsed = JSON.parse(decrypted.plainText);
    } catch {
      return failure("FINORA Control Store contains invalid encrypted data.");
    }

    if (!isControlStorePackage(parsed)) {

      if (
        process.env.FINORA_DEV_CONTROL_STORE_DIAGNOSTICS ===
          "1"
      ) {
        console.error(
          "[FINORA CONTROL DIAG]",
          describeControlStorePackageValidationFailure(
            parsed,
          ),
        );
      }

      return failure(
        "FINORA Control Store package validation failed.",
      );
    }

    if (decrypted.shouldReEncrypt) {
      await persistControlStorePackage(parsed);
    }

    return success(parsed);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to read the FINORA Control Store.",
    );
  }
}

// ============================================================
// GET INSTALLATION IDENTITY FOR BINDING RECONCILIATION
// ============================================================
//
// MIGRATION-ONLY READ:
//
// The native installation-binding vault may need to be created
// for a legacy Control Store whose operational state no longer
// passes current full-package validation.
//
// This reader therefore validates ONLY:
//
// - encrypted Control Store readability
// - JSON root structure
// - Control Store version
// - installation identity structure
//
// It deliberately does NOT:
//
// - validate or authorize storage entitlements
// - validate or authorize branch access grants
// - expose operational state
// - persist / rewrite / repair the legacy Control Store
//
// Normal runtime access continues through readFinoraControlStore()
// and remains fail-closed on any invalid legacy entitlement.
// ============================================================

export async function getFinoraInstallationIdentityForBindingReconciliation():
  Promise<
    FinoraControlStoreResult<
      FinoraControlInstallationIdentity |
      undefined
    >
  > {

  try {

    if (
      !await controlFileExists()
    ) {
      return success(
        undefined,
      );
    }

    const encrypted =
      await fs.readFile(
        getControlFile(),
      );

    if (
      encrypted.length ===
        0
    ) {
      return failure(
        "FINORA Control Store file is empty.",
      );
    }

    const decrypted =
      await decryptControlPayload(
        encrypted,
      );

    let parsed:
      unknown;

    try {

      parsed =
        JSON.parse(
          decrypted.plainText,
        );

    } catch {

      return failure(
        "FINORA Control Store contains invalid encrypted data.",
      );
    }

    if (
      !isRecord(
        parsed,
      )
    ) {
      return failure(
        "FINORA Control Store root structure is invalid for installation binding reconciliation.",
      );
    }

    if (
      parsed.version !==
        CONTROL_STORE_VERSION
    ) {
      return failure(
        "FINORA Control Store version is invalid for installation binding reconciliation.",
      );
    }

    if (
      parsed.installation ===
        undefined
    ) {
      return success(
        undefined,
      );
    }

    if (
      !isInstallationIdentity(
        parsed.installation,
      )
    ) {
      return failure(
        "FINORA Control Store installation identity is invalid for binding reconciliation.",
      );
    }

    return success(
      parsed.installation,
    );

  } catch (
    error
  ) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to read FINORA installation identity for binding reconciliation.",
    );
  }
}

// ============================================================
// GET INSTALLATION IDENTITY
// ============================================================

export async function getFinoraInstallationIdentity(): Promise<
  FinoraControlStoreResult<FinoraControlInstallationIdentity | undefined>
> {
  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  return success(currentResult.data.installation);
}

// ============================================================
// SAVE INSTALLATION IDENTITY
// ============================================================

export async function saveFinoraInstallationIdentity(
  installation: FinoraControlInstallationIdentity,
): Promise<FinoraControlStoreResult<FinoraControlInstallationIdentity>> {
  if (!isInstallationIdentity(installation)) {
    return failure("A valid FINORA installation identity is required.");
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const existing = controlStore.installation;

  if (existing) {
    const identityChanged =
      existing.installationId !== installation.installationId ||
      existing.ownerId !== installation.ownerId ||
      existing.businessId !== installation.businessId ||
      existing.branchId !== installation.branchId;

    if (identityChanged) {
      return failure("FINORA installation identity cannot be replaced.");
    }

    const numberingCodeChanged =
      (existing.businessCode !== undefined &&
        existing.businessCode !== installation.businessCode) ||
      (existing.branchCode !== undefined &&
        existing.branchCode !== installation.branchCode);

    if (numberingCodeChanged) {
      return failure("FINORA installation numbering codes cannot be replaced.");
    }
  }

  controlStore.installation = installation;

  controlStore.updatedAt = new Date().toISOString();

  try {
    await persistControlStorePackage(controlStore);

    return success(installation);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to save FINORA installation identity.",
    );
  }
}

// ============================================================
// SAVE BRANCH ACTIVATION
// ============================================================

export async function saveFinoraBranchActivation(
  activation: FinoraControlBranchActivation,
): Promise<FinoraControlStoreResult<FinoraControlBranchActivation>> {
  if (!isBranchActivation(activation)) {
    return failure("A valid FINORA branch activation is required.");
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const existingIndex = controlStore.activations.findIndex(
    (item) =>
      item.ownerId === activation.ownerId &&
      item.businessId === activation.businessId &&
      item.branchId === activation.branchId,
  );

  if (existingIndex >= 0) {
    const existing = controlStore.activations[existingIndex];

    if (existing.activationId !== activation.activationId) {
      return failure("FINORA branch activation identity cannot be replaced.");
    }

    controlStore.activations[existingIndex] = activation;
  } else {
    controlStore.activations.push(activation);
  }

  controlStore.updatedAt = new Date().toISOString();

  try {
    await persistControlStorePackage(controlStore);

    return success(activation);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to save FINORA branch activation.",
    );
  }
}

// ============================================================
// FIND BRANCH ACTIVATION
// ============================================================

export async function findFinoraBranchActivation(
  ownerId: string,
  businessId: string,
  branchId: string,
): Promise<
  FinoraControlStoreResult<FinoraControlBranchActivation | undefined>
> {
  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const activation = currentResult.data.activations.find(
    (item) =>
      item.ownerId === ownerId &&
      item.businessId === businessId &&
      item.branchId === branchId,
  );

  return success(activation);
}

// ============================================================
// SAVE STORAGE ENTITLEMENT
// ============================================================

export async function saveFinoraStorageEntitlement(
  entitlement: FinoraControlStorageEntitlement,
): Promise<FinoraControlStoreResult<FinoraControlStorageEntitlement>> {
  if (!isStorageEntitlement(entitlement)) {
    return failure("A valid FINORA storage entitlement is required.");
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const existingIndex = controlStore.storageEntitlements.findIndex(
    (item) =>
      item.userId === entitlement.userId &&
      item.ownerId === entitlement.ownerId &&
      item.businessId === entitlement.businessId &&
      item.branchId === entitlement.branchId &&
      item.storageMode === entitlement.storageMode,
  );

  if (existingIndex >= 0) {
    const existing = controlStore.storageEntitlements[existingIndex];

    if (existing.entitlementId !== entitlement.entitlementId) {
      return failure("FINORA storage entitlement identity cannot be replaced.");
    }

    if (
      existing.installationId !== entitlement.installationId ||
      existing.bindingKeyId !== entitlement.bindingKeyId ||
      existing.fingerprintAlgorithm !== entitlement.fingerprintAlgorithm ||
      existing.publicKeyFingerprint !== entitlement.publicKeyFingerprint
    ) {
      return failure(
        "FINORA storage entitlement native installation binding cannot be replaced.",
      );
    }
    controlStore.storageEntitlements[existingIndex] = entitlement;
  } else {
    controlStore.storageEntitlements.push(entitlement);
  }

  controlStore.updatedAt = new Date().toISOString();

  try {
    await persistControlStorePackage(controlStore);

    return success(entitlement);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to save FINORA storage entitlement.",
    );
  }
}

// ============================================================
// FIND STORAGE ENTITLEMENT
// ============================================================

export async function findFinoraStorageEntitlement(
  userId: string,
  ownerId: string,
  businessId: string,
  branchId: string,
  storageMode: FinoraControlStorageMode,
): Promise<
  FinoraControlStoreResult<FinoraControlStorageEntitlement | undefined>
> {
  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const entitlement = currentResult.data.storageEntitlements.find(
    (item) =>
      item.userId === userId &&
      item.ownerId === ownerId &&
      item.businessId === businessId &&
      item.branchId === branchId &&
      item.storageMode === storageMode,
  );

  return success(entitlement);
}

// ============================================================
// ACTIVE STORAGE ACCESS CHECK
// ============================================================

export interface FinoraControlRuntimeInstallationBinding {
  installationId: string;

  bindingKeyId: string;

  fingerprintAlgorithm: "SHA-256";

  publicKeyFingerprint: string;
}

export async function hasActiveFinoraStorageEntitlement(
  userId: string,
  ownerId: string,
  businessId: string,
  branchId: string,
  storageMode: FinoraControlStorageMode,
  nativeBinding: FinoraControlRuntimeInstallationBinding,
): Promise<FinoraControlStoreResult<boolean>> {
  // ----------------------------------------------------------
  // TRUSTED NATIVE INSTALLATION BINDING
  //
  // Renderer does not provide this object.
  //
  // Electron main resolves it independently from the
  // safeStorage-backed native installation binding vault.
  // ----------------------------------------------------------

  const nativeBindingRecord: Record<string, unknown> = {
    installationId: nativeBinding?.installationId,

    bindingKeyId: nativeBinding?.bindingKeyId,

    fingerprintAlgorithm: nativeBinding?.fingerprintAlgorithm,

    publicKeyFingerprint: nativeBinding?.publicKeyFingerprint,
  };

  if (
    !nativeBinding ||
    !isStorageEntitlementNativeBinding(nativeBindingRecord)
  ) {
    return failure(
      "A valid FINORA native installation binding is required to verify storage access.",
    );
  }

  // ----------------------------------------------------------
  // AUTHORITATIVE ENCRYPTED CONTROL STATE
  // ----------------------------------------------------------

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const installation = currentResult.data.installation;

  if (
    !installation ||
    installation.ownerId !== ownerId ||
    installation.businessId !== businessId ||
    installation.branchId !== branchId ||
    installation.installationId !== nativeBinding.installationId
  ) {
    return success(false);
  }

  // ----------------------------------------------------------
  // EXACT LOGICAL STORAGE ENTITLEMENT
  // ----------------------------------------------------------

  const entitlement = currentResult.data.storageEntitlements.find(
    (item) =>
      item.userId === userId &&
      item.ownerId === ownerId &&
      item.businessId === businessId &&
      item.branchId === branchId &&
      item.storageMode === storageMode,
  );

  if (!entitlement) {
    return success(false);
  }

  // ----------------------------------------------------------
  // ACTIVE + EXACT NATIVE BINDING
  // ----------------------------------------------------------

  return success(
    entitlement.status === "ACTIVE" &&
      entitlement.storageMode === storageMode &&
      entitlement.installationId === nativeBinding.installationId &&
      entitlement.bindingKeyId === nativeBinding.bindingKeyId &&
      entitlement.fingerprintAlgorithm === nativeBinding.fingerprintAlgorithm &&
      entitlement.publicKeyFingerprint === nativeBinding.publicKeyFingerprint,
  );
}
// ============================================================
// VERIFIED BRANCH ACTIVATION ATOMIC APPLY
// ============================================================

export interface FinoraVerifiedBranchActivationApplyInput {
  packageId: string;

  issuerId: string;

  purpose: "BRANCH_ACTIVATION";

  sequence: number;

  target: {
    ownerId: string;

    businessId: string;

    branchId: string;

    installationId: string;
  };

  activation: FinoraControlBranchActivation;

  accessGrant: FinoraControlBranchAccessGrant;

  appliedAt: string;
}

export interface FinoraVerifiedBranchActivationApplyResult {
  activation: FinoraControlBranchActivation;

  accessGrant: FinoraControlBranchAccessGrant;
}

export interface FinoraVerifiedStorageEntitlementApplyInput {
  packageId: string;

  issuerId: string;

  purpose: "STORAGE_ENTITLEMENT";

  sequence: number;

  target: {
    ownerId: string;

    businessId: string;

    branchId: string;

    installationId: string;

    bindingKeyId: string;

    fingerprintAlgorithm: "SHA-256";

    publicKeyFingerprint: string;
  };

  entitlement: FinoraControlStorageEntitlement;

  appliedAt: string;
}

export interface FinoraVerifiedStorageEntitlementApplyResult {
  entitlement: FinoraControlStorageEntitlement;
}

/**
 * Serializes verified Control Package mutations that share the
 * encrypted FINORA Control Store.
 *
 * BRANCH_ACTIVATION and STORAGE_ENTITLEMENT therefore cannot
 * race each other and overwrite a newer committed package.
 */

// ============================================================
// VERIFIED BUSINESS PROFILE APPLY CONTRACT
// ============================================================

export interface FinoraVerifiedBusinessProfileApplyInput {

  packageId:
    string;

  issuerId:
    string;

  purpose:
    "BUSINESS_PROFILE";

  sequence:
    number;

  action:
    "ISSUE" | "REPLACE";

  target: {
    ownerId:
      string;

    businessId:
      string;

    branchId:
      string;

    installationId:
      string;
  };

  profile:
    FinoraControlBusinessProfile;

  appliedAt:
    string;
}

export interface FinoraVerifiedBusinessProfileApplyResult {

  profile:
    FinoraControlBusinessProfile;
}

let controlPackageApplyQueue: Promise<void> = Promise.resolve();

async function applyVerifiedBranchActivationInternal(
  input: FinoraVerifiedBranchActivationApplyInput,
): Promise<
  FinoraControlStoreResult<FinoraVerifiedBranchActivationApplyResult>
> {
  if (
    !isNonEmptyString(input.packageId) ||
    !isNonEmptyString(input.issuerId) ||
    input.purpose !== "BRANCH_ACTIVATION" ||
    !Number.isSafeInteger(input.sequence) ||
    input.sequence <= 0 ||
    !isControlTimestamp(input.appliedAt) ||
    !isBranchActivation(input.activation) ||
    !isBranchAccessGrant(input.accessGrant)
  ) {
    return failure(
      "A valid verified FINORA Branch Activation package is required.",
    );
  }

  // ----------------------------------------------------------
  // LOAD AUTHORITATIVE ENCRYPTED STATE
  // ----------------------------------------------------------

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const installation = controlStore.installation;

  // ----------------------------------------------------------
  // INSTALLATION TARGET BINDING
  // ----------------------------------------------------------

  if (
    !installation ||
    installation.installationId !== input.target.installationId ||
    installation.ownerId !== input.target.ownerId ||
    installation.businessId !== input.target.businessId ||
    installation.branchId !== input.target.branchId
  ) {
    return failure(
      "FINORA Branch Activation target does not match this installation.",
    );
  }

  // ----------------------------------------------------------
  // DOMAIN TARGET BINDING
  // ----------------------------------------------------------

  if (
    input.activation.ownerId !== input.target.ownerId ||
    input.activation.businessId !== input.target.businessId ||
    input.activation.branchId !== input.target.branchId ||
    input.accessGrant.ownerId !== input.target.ownerId ||
    input.accessGrant.businessId !== input.target.businessId ||
    input.accessGrant.branchId !== input.target.branchId
  ) {
    return failure(
      "FINORA verified activation payload identity does not match its target.",
    );
  }

  // ----------------------------------------------------------
  // REPLAY / MONOTONIC SEQUENCE
  // ----------------------------------------------------------

  const appliedPackages = controlStore.appliedControlPackages ?? [];

  const sequenceStates = controlStore.controlSequences ?? [];

  const replayDecision = evaluateFinoraControlReplay(
    {
      packageId: input.packageId,

      issuerId: input.issuerId,

      purpose: input.purpose,

      sequence: input.sequence,

      ownerId: input.target.ownerId,

      businessId: input.target.businessId,

      branchId: input.target.branchId,

      installationId: input.target.installationId,
    },
    appliedPackages,
    sequenceStates,
  );

  if (!replayDecision.accepted) {
    return failure(`${replayDecision.reason}: ${replayDecision.error}`);
  }

  // ----------------------------------------------------------
  // ACTIVATION
  //
  // Activation identity remains immutable for this branch.
  // Commercial REGISTERED / DEMO grants may be replaced through
  // newer signed packages.
  // ----------------------------------------------------------

  const activationIndex = controlStore.activations.findIndex(
    (item) =>
      item.ownerId === input.activation.ownerId &&
      item.businessId === input.activation.businessId &&
      item.branchId === input.activation.branchId,
  );

  if (activationIndex >= 0) {
    const existingActivation = controlStore.activations[activationIndex];

    if (
      !existingActivation ||
      existingActivation.activationId !== input.activation.activationId
    ) {
      return failure("FINORA branch activation identity cannot be replaced.");
    }

    controlStore.activations[activationIndex] = input.activation;
  } else {
    controlStore.activations.push(input.activation);
  }

  // ----------------------------------------------------------
  // CURRENT ACCESS GRANT
  // ----------------------------------------------------------

  const accessGrants = controlStore.branchAccessGrants ?? [];

  const accessIndex = accessGrants.findIndex(
    (item) =>
      item.userId === input.accessGrant.userId &&
      item.ownerId === input.accessGrant.ownerId &&
      item.businessId === input.accessGrant.businessId &&
      item.branchId === input.accessGrant.branchId,
  );

  if (accessIndex >= 0) {
    accessGrants[accessIndex] = input.accessGrant;
  } else {
    accessGrants.push(input.accessGrant);
  }

  // ----------------------------------------------------------
  // REPLAY LEDGER
  // ----------------------------------------------------------

  appliedPackages.push({
    packageId: input.packageId,

    issuerId: input.issuerId,

    purpose: input.purpose,

    sequence: input.sequence,

    ownerId: input.target.ownerId,

    businessId: input.target.businessId,

    branchId: input.target.branchId,

    installationId: input.target.installationId,

    appliedAt: input.appliedAt,
  });

  // ----------------------------------------------------------
  // MONOTONIC SEQUENCE STATE
  // ----------------------------------------------------------

  const sequenceIndex = sequenceStates.findIndex(
    (item) =>
      item.issuerId === input.issuerId &&
      item.purpose === input.purpose &&
      item.ownerId === input.target.ownerId &&
      item.businessId === input.target.businessId &&
      item.branchId === input.target.branchId &&
      item.installationId === input.target.installationId,
  );

  const nextSequenceState: FinoraControlSequenceStateRecord = {
    issuerId: input.issuerId,

    purpose: input.purpose,

    ownerId: input.target.ownerId,

    businessId: input.target.businessId,

    branchId: input.target.branchId,

    installationId: input.target.installationId,

    lastSequence: input.sequence,

    updatedAt: input.appliedAt,
  };

  if (sequenceIndex >= 0) {
    sequenceStates[sequenceIndex] = nextSequenceState;
  } else {
    sequenceStates.push(nextSequenceState);
  }

  // ----------------------------------------------------------
  // ONE AUTHORITATIVE STATE OBJECT
  // ----------------------------------------------------------

  controlStore.branchAccessGrants = accessGrants;

  controlStore.appliedControlPackages = appliedPackages;

  controlStore.controlSequences = sequenceStates;

  controlStore.updatedAt = input.appliedAt;

  // ----------------------------------------------------------
  // ONE ENCRYPTED ATOMIC FILE REPLACEMENT
  //
  // activation + access grant + replay ledger + sequence are
  // validated and persisted as one Control Store package.
  // ----------------------------------------------------------

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to atomically persist verified FINORA control state.",
    );
  }

  return success({
    activation: input.activation,

    accessGrant: input.accessGrant,
  });
}

export function applyFinoraVerifiedBranchActivationState(
  input: FinoraVerifiedBranchActivationApplyInput,
): Promise<
  FinoraControlStoreResult<FinoraVerifiedBranchActivationApplyResult>
> {
  const operation = controlPackageApplyQueue.then(
    () => applyVerifiedBranchActivationInternal(input),
    () => applyVerifiedBranchActivationInternal(input),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

// ============================================================
// VERIFIED STORAGE ENTITLEMENT ATOMIC APPLY
// ============================================================

async function applyVerifiedStorageEntitlementInternal(
  input: FinoraVerifiedStorageEntitlementApplyInput,
): Promise<
  FinoraControlStoreResult<FinoraVerifiedStorageEntitlementApplyResult>
> {
  const expectedBindingKeyId = isStorageEntitlementFingerprint(
    input.target.publicKeyFingerprint,
  )
    ? `FINORA-BINDING-${input.target.publicKeyFingerprint
        .slice(0, 32)
        .toUpperCase()}`
    : undefined;

  if (
    !isNonEmptyString(input.packageId) ||
    !isNonEmptyString(input.issuerId) ||
    input.purpose !== "STORAGE_ENTITLEMENT" ||
    !Number.isSafeInteger(input.sequence) ||
    input.sequence <= 0 ||
    !isNonEmptyString(input.target.ownerId) ||
    !isNonEmptyString(input.target.businessId) ||
    !isNonEmptyString(input.target.branchId) ||
    !isNonEmptyString(input.target.installationId) ||
    !isNonEmptyString(input.target.bindingKeyId) ||
    input.target.fingerprintAlgorithm !== "SHA-256" ||
    !expectedBindingKeyId ||
    input.target.bindingKeyId !== expectedBindingKeyId ||
    !isControlTimestamp(input.appliedAt) ||
    !isStorageEntitlement(input.entitlement)
  ) {
    return failure(
      "A valid verified FINORA Storage Entitlement package is required.",
    );
  }

  // ----------------------------------------------------------
  // LOAD AUTHORITATIVE ENCRYPTED STATE
  // ----------------------------------------------------------

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const installation = controlStore.installation;

  // ----------------------------------------------------------
  // INSTALLATION TARGET BINDING
  // ----------------------------------------------------------

  if (
    !installation ||
    installation.installationId !== input.target.installationId ||
    installation.ownerId !== input.target.ownerId ||
    installation.businessId !== input.target.businessId ||
    installation.branchId !== input.target.branchId
  ) {
    return failure(
      "FINORA Storage Entitlement target does not match the installed branch identity.",
    );
  }

  // ----------------------------------------------------------
  // ENTITLEMENT <-> SIGNED TARGET
  // ----------------------------------------------------------

  if (
    input.entitlement.ownerId !== input.target.ownerId ||
    input.entitlement.businessId !== input.target.businessId ||
    input.entitlement.branchId !== input.target.branchId ||
    input.entitlement.installationId !== input.target.installationId ||
    input.entitlement.bindingKeyId !== input.target.bindingKeyId ||
    input.entitlement.fingerprintAlgorithm !==
      input.target.fingerprintAlgorithm ||
    input.entitlement.publicKeyFingerprint !== input.target.publicKeyFingerprint
  ) {
    return failure(
      "FINORA Storage Entitlement payload does not match the verified package target.",
    );
  }

  // ----------------------------------------------------------
  // REPLAY / MONOTONIC SEQUENCE
  // ----------------------------------------------------------

  const appliedPackages = controlStore.appliedControlPackages ?? [];

  const sequenceStates = controlStore.controlSequences ?? [];

  const replayDecision = evaluateFinoraControlReplay(
    {
      packageId: input.packageId,

      issuerId: input.issuerId,

      purpose: input.purpose,

      sequence: input.sequence,

      ownerId: input.target.ownerId,

      businessId: input.target.businessId,

      branchId: input.target.branchId,

      installationId: input.target.installationId,
    },
    appliedPackages,
    sequenceStates,
  );

  if (!replayDecision.accepted) {
    return failure(`${replayDecision.reason}: ${replayDecision.error}`);
  }

  // ----------------------------------------------------------
  // STORAGE ENTITLEMENT
  //
  // Logical identity:
  //
  // userId + ownerId + businessId + branchId + storageMode
  //
  // entitlementId and native installation binding are immutable.
  // ----------------------------------------------------------

  const entitlements = controlStore.storageEntitlements ?? [];

  const entitlementIndex = entitlements.findIndex(
    (item) =>
      item.userId === input.entitlement.userId &&
      item.ownerId === input.entitlement.ownerId &&
      item.businessId === input.entitlement.businessId &&
      item.branchId === input.entitlement.branchId &&
      item.storageMode === input.entitlement.storageMode,
  );

  const sameEntitlementIdIndex = entitlements.findIndex(
    (item) => item.entitlementId === input.entitlement.entitlementId,
  );

  if (
    sameEntitlementIdIndex >= 0 &&
    sameEntitlementIdIndex !== entitlementIndex
  ) {
    return failure(
      "FINORA storage entitlement identity cannot move to another user, branch or storage mode.",
    );
  }

  if (entitlementIndex >= 0) {
    const existing = entitlements[entitlementIndex];

    if (
      !existing ||
      existing.entitlementId !== input.entitlement.entitlementId
    ) {
      return failure("FINORA storage entitlement identity cannot be replaced.");
    }

    if (
      existing.installationId !== input.entitlement.installationId ||
      existing.bindingKeyId !== input.entitlement.bindingKeyId ||
      existing.fingerprintAlgorithm !==
        input.entitlement.fingerprintAlgorithm ||
      existing.publicKeyFingerprint !== input.entitlement.publicKeyFingerprint
    ) {
      return failure(
        "FINORA storage entitlement native installation binding cannot be replaced.",
      );
    }

    entitlements[entitlementIndex] = input.entitlement;
  } else {
    entitlements.push(input.entitlement);
  }

  // ----------------------------------------------------------
  // REPLAY LEDGER
  // ----------------------------------------------------------

  appliedPackages.push({
    packageId: input.packageId,

    issuerId: input.issuerId,

    purpose: input.purpose,

    sequence: input.sequence,

    ownerId: input.target.ownerId,

    businessId: input.target.businessId,

    branchId: input.target.branchId,

    installationId: input.target.installationId,

    appliedAt: input.appliedAt,
  });

  // ----------------------------------------------------------
  // MONOTONIC SEQUENCE STATE
  // ----------------------------------------------------------

  const sequenceIndex = sequenceStates.findIndex(
    (item) =>
      item.issuerId === input.issuerId &&
      item.purpose === input.purpose &&
      item.ownerId === input.target.ownerId &&
      item.businessId === input.target.businessId &&
      item.branchId === input.target.branchId &&
      item.installationId === input.target.installationId,
  );

  const nextSequenceState: FinoraControlSequenceStateRecord = {
    issuerId: input.issuerId,

    purpose: input.purpose,

    ownerId: input.target.ownerId,

    businessId: input.target.businessId,

    branchId: input.target.branchId,

    installationId: input.target.installationId,

    lastSequence: input.sequence,

    updatedAt: input.appliedAt,
  };

  if (sequenceIndex >= 0) {
    sequenceStates[sequenceIndex] = nextSequenceState;
  } else {
    sequenceStates.push(nextSequenceState);
  }

  // ----------------------------------------------------------
  // ONE AUTHORITATIVE STATE OBJECT
  // ----------------------------------------------------------

  controlStore.storageEntitlements = entitlements;

  controlStore.appliedControlPackages = appliedPackages;

  controlStore.controlSequences = sequenceStates;

  controlStore.updatedAt = input.appliedAt;

  // ----------------------------------------------------------
  // ONE ENCRYPTED ATOMIC FILE REPLACEMENT
  //
  // entitlement + replay ledger + sequence are validated and
  // persisted as one encrypted Control Store package.
  // ----------------------------------------------------------

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to atomically persist verified FINORA Storage Entitlement state.",
    );
  }

  return success({
    entitlement: input.entitlement,
  });
}

export function applyFinoraVerifiedStorageEntitlementState(
  input: FinoraVerifiedStorageEntitlementApplyInput,
): Promise<
  FinoraControlStoreResult<FinoraVerifiedStorageEntitlementApplyResult>
> {
  const operation = controlPackageApplyQueue.then(
    () => applyVerifiedStorageEntitlementInternal(input),
    () => applyVerifiedStorageEntitlementInternal(input),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

// ============================================================
// VERIFIED BUSINESS PROFILE ATOMIC APPLY
// ============================================================

async function applyVerifiedBusinessProfileInternal(
  input:
    FinoraVerifiedBusinessProfileApplyInput,
): Promise<
  FinoraControlStoreResult<
    FinoraVerifiedBusinessProfileApplyResult
  >
> {

  // ----------------------------------------------------------
  // INPUT STRUCTURE
  // ----------------------------------------------------------

  if (
    !isNonEmptyString(
      input.packageId,
    ) ||
    !isNonEmptyString(
      input.issuerId,
    ) ||
    input.purpose !==
      "BUSINESS_PROFILE" ||
    (
      input.action !==
        "ISSUE" &&
      input.action !==
        "REPLACE"
    ) ||
    !Number.isSafeInteger(
      input.sequence,
    ) ||
    input.sequence <=
      0 ||
    !isControlTimestamp(
      input.appliedAt,
    ) ||
    !isBusinessProfile(
      input.profile,
    ) ||
    !isRecord(
      input.target,
    ) ||
    !isNonEmptyString(
      input.target.ownerId,
    ) ||
    !isNonEmptyString(
      input.target.businessId,
    ) ||
    !isNonEmptyString(
      input.target.branchId,
    ) ||
    !isNonEmptyString(
      input.target.installationId,
    )
  ) {
    return failure(
      "A valid verified FINORA Business Profile package is required.",
    );
  }


  // ----------------------------------------------------------
  // PROFILE ↔ TARGET
  // ----------------------------------------------------------

  if (
    input.profile.ownerId !==
      input.target.ownerId ||
    input.profile.businessId !==
      input.target.businessId ||
    input.profile.branchId !==
      input.target.branchId ||
    input.profile.installationId !==
      input.target.installationId
  ) {
    return failure(
      "FINORA Business Profile identity does not match the verified package target.",
    );
  }


  // ----------------------------------------------------------
  // PROFILE AUDIT TIME
  // ----------------------------------------------------------

  const appliedAtTime =
    Date.parse(
      input.appliedAt,
    );

  const profileUpdatedAtTime =
    Date.parse(
      input.profile.updatedAt,
    );

  if (
    !Number.isFinite(
      appliedAtTime,
    ) ||
    !Number.isFinite(
      profileUpdatedAtTime,
    ) ||
    profileUpdatedAtTime >
      appliedAtTime
  ) {
    return failure(
      "FINORA Business Profile update timestamp cannot be later than package application.",
    );
  }


  // ----------------------------------------------------------
  // AUTHORITATIVE CONTROL STORE
  // ----------------------------------------------------------

  const currentResult =
    await readFinoraControlStore();

  if (
    !currentResult.success ||
    !currentResult.data
  ) {
    return failure(
      currentResult.error ??
        "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore =
    currentResult.data;

  const installation =
    controlStore.installation;

  if (!installation) {
    return failure(
      "FINORA installation identity is required before applying a Business Profile.",
    );
  }


  // ----------------------------------------------------------
  // CONTROL STORE INSTALLATION ↔ VERIFIED TARGET
  // ----------------------------------------------------------

  if (
    installation.ownerId !==
      input.target.ownerId ||
    installation.businessId !==
      input.target.businessId ||
    installation.branchId !==
      input.target.branchId ||
    installation.installationId !==
      input.target.installationId
  ) {
    return failure(
      "FINORA Business Profile target does not match the Control Store installation identity.",
    );
  }


  // ----------------------------------------------------------
  // NUMBERING CODE CONSISTENCY
  //
  // Existing Phase-3 installations may be legacy records with
  // both codes absent.
  //
  // If Control Store already has authoritative numbering codes,
  // the signed Business Profile must match them exactly.
  // ----------------------------------------------------------

  const installationHasBusinessCode =
    isNonEmptyString(
      installation.businessCode,
    );

  const installationHasBranchCode =
    isNonEmptyString(
      installation.branchCode,
    );

  if (
    installationHasBusinessCode !==
      installationHasBranchCode
  ) {
    return failure(
      "FINORA Control Store installation numbering-code state is inconsistent.",
    );
  }

  if (
    installationHasBusinessCode &&
    installationHasBranchCode &&
    (
      installation.businessCode !==
        input.profile.businessCode ||
      installation.branchCode !==
        input.profile.branchCode
    )
  ) {
    return failure(
      "FINORA Business Profile numbering codes do not match the installation identity.",
    );
  }


  // ----------------------------------------------------------
  // REPLAY / MONOTONIC SEQUENCE
  // ----------------------------------------------------------

  const appliedPackages =
    controlStore.appliedControlPackages ??
    [];

  const sequenceStates =
    controlStore.controlSequences ??
    [];

  const replayDecision =
    evaluateFinoraControlReplay(
      {
        packageId:
          input.packageId,

        issuerId:
          input.issuerId,

        purpose:
          input.purpose,

        sequence:
          input.sequence,

        ownerId:
          input.target.ownerId,

        businessId:
          input.target.businessId,

        branchId:
          input.target.branchId,

        installationId:
          input.target.installationId,
      },
      appliedPackages,
      sequenceStates,
    );

  if (!replayDecision.accepted) {
    return failure(
      `${replayDecision.reason}: ${replayDecision.error}`,
    );
  }


  // ----------------------------------------------------------
  // BUSINESS PROFILE
  //
  // Logical identity:
  //
  // ownerId + businessId + branchId
  //
  // Immutable across signed replacements:
  //
  // - profileId
  // - ownerId
  // - businessId
  // - branchId
  // - businessCode
  // - branchCode
  // - installationId
  // - bindingKeyId
  // - fingerprintAlgorithm
  // - publicKeyFingerprint
  // - createdAt
  //
  // REPLACE may update:
  //
  // - businessName
  // - branchName
  // - updatedAt
  // ----------------------------------------------------------

  const profiles =
    controlStore.businessProfiles ??
    [];

  const profileIndex =
    profiles.findIndex(
      (item) =>
        item.ownerId ===
          input.profile.ownerId &&
        item.businessId ===
          input.profile.businessId &&
        item.branchId ===
          input.profile.branchId,
    );

  const sameProfileIdIndex =
    profiles.findIndex(
      (item) =>
        item.profileId ===
          input.profile.profileId,
    );


  // ----------------------------------------------------------
  // PROFILE ID CANNOT MOVE TO ANOTHER SCOPE
  // ----------------------------------------------------------

  if (
    sameProfileIdIndex >=
      0 &&
    sameProfileIdIndex !==
      profileIndex
  ) {
    return failure(
      "FINORA Business Profile identity cannot move to another Owner / Business / Branch scope.",
    );
  }


  // ----------------------------------------------------------
  // ISSUE / REPLACE LIFECYCLE
  // ----------------------------------------------------------

  if (
    input.action ===
      "ISSUE" &&
    profileIndex >=
      0
  ) {
    return failure(
      "FINORA Business Profile already exists; a newer signed REPLACE package is required.",
    );
  }

  if (
    input.action ===
      "REPLACE" &&
    profileIndex <
      0
  ) {
    return failure(
      "FINORA Business Profile REPLACE requires an existing signed profile.",
    );
  }


  // ----------------------------------------------------------
  // REPLACE IMMUTABILITY
  // ----------------------------------------------------------

  if (
    profileIndex >=
      0
  ) {

    const existingProfile =
      profiles[
        profileIndex
      ];

    if (!existingProfile) {
      return failure(
        "FINORA existing Business Profile state is invalid.",
      );
    }

    if (
      existingProfile.profileId !==
        input.profile.profileId ||
      existingProfile.ownerId !==
        input.profile.ownerId ||
      existingProfile.businessId !==
        input.profile.businessId ||
      existingProfile.branchId !==
        input.profile.branchId ||
      existingProfile.businessCode !==
        input.profile.businessCode ||
      existingProfile.branchCode !==
        input.profile.branchCode ||
      existingProfile.installationId !==
        input.profile.installationId ||
      existingProfile.bindingKeyId !==
        input.profile.bindingKeyId ||
      existingProfile.fingerprintAlgorithm !==
        input.profile.fingerprintAlgorithm ||
      existingProfile.publicKeyFingerprint !==
        input.profile.publicKeyFingerprint ||
      existingProfile.createdAt !==
        input.profile.createdAt
    ) {
      return failure(
        "FINORA Business Profile immutable identity cannot be replaced.",
      );
    }

    profiles[
      profileIndex
    ] =
      input.profile;

  } else {

    profiles.push(
      input.profile,
    );
  }


  // ----------------------------------------------------------
  // APPLIED PACKAGE LEDGER
  // ----------------------------------------------------------

  appliedPackages.push({
    packageId:
      input.packageId,

    issuerId:
      input.issuerId,

    purpose:
      input.purpose,

    sequence:
      input.sequence,

    ownerId:
      input.target.ownerId,

    businessId:
      input.target.businessId,

    branchId:
      input.target.branchId,

    installationId:
      input.target.installationId,

    appliedAt:
      input.appliedAt,
  });


  // ----------------------------------------------------------
  // MONOTONIC SEQUENCE STATE
  // ----------------------------------------------------------

  const sequenceIndex =
    sequenceStates.findIndex(
      (item) =>
        item.issuerId ===
          input.issuerId &&
        item.purpose ===
          input.purpose &&
        item.ownerId ===
          input.target.ownerId &&
        item.businessId ===
          input.target.businessId &&
        item.branchId ===
          input.target.branchId &&
        item.installationId ===
          input.target.installationId,
    );

  const nextSequenceState:
    FinoraControlSequenceStateRecord = {

      issuerId:
        input.issuerId,

      purpose:
        input.purpose,

      ownerId:
        input.target.ownerId,

      businessId:
        input.target.businessId,

      branchId:
        input.target.branchId,

      installationId:
        input.target.installationId,

      lastSequence:
        input.sequence,

      updatedAt:
        input.appliedAt,
    };

  if (
    sequenceIndex >=
      0
  ) {
    sequenceStates[
      sequenceIndex
    ] =
      nextSequenceState;
  } else {
    sequenceStates.push(
      nextSequenceState,
    );
  }


  // ----------------------------------------------------------
  // ONE AUTHORITATIVE STATE OBJECT
  // ----------------------------------------------------------

  controlStore.businessProfiles =
    profiles;

  controlStore.appliedControlPackages =
    appliedPackages;

  controlStore.controlSequences =
    sequenceStates;

  controlStore.updatedAt =
    input.appliedAt;


  // ----------------------------------------------------------
  // ONE ENCRYPTED ATOMIC FILE REPLACEMENT
  //
  // profile + replay ledger + monotonic sequence are committed
  // together as one Control Store package.
  // ----------------------------------------------------------

  try {

    await persistControlStorePackage(
      controlStore,
    );

  } catch (error) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to atomically persist verified FINORA Business Profile state.",
    );
  }


  return success({
    profile:
      input.profile,
  });
}


// ============================================================
// SERIALIZED VERIFIED BUSINESS PROFILE APPLY
// ============================================================

export function applyFinoraVerifiedBusinessProfileState(
  input:
    FinoraVerifiedBusinessProfileApplyInput,
): Promise<
  FinoraControlStoreResult<
    FinoraVerifiedBusinessProfileApplyResult
  >
> {

  const operation =
    controlPackageApplyQueue.then(
      () =>
        applyVerifiedBusinessProfileInternal(
          input,
        ),
      () =>
        applyVerifiedBusinessProfileInternal(
          input,
        ),
    );

  controlPackageApplyQueue =
    operation.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return operation;
}

// ============================================================
// FIND SIGNED BUSINESS PROFILE
// ============================================================

/**
 * Read the current trusted signed FINORA Business / Branch
 * Profile for one exact Owner / Business / Branch scope.
 *
 * READ ONLY:
 *
 * - No profile creation.
 * - No profile replacement.
 * - No repository mutation.
 * - No renderer-provided display identity authority.
 *
 * Legacy Control Stores may not yet contain businessProfiles.
 * In that case this returns success(undefined).
 */
export async function findFinoraBusinessProfile(
  ownerId:
    string,

  businessId:
    string,

  branchId:
    string,
): Promise<
  FinoraControlStoreResult<
    FinoraControlBusinessProfile | undefined
  >
> {

  if (
    !isNonEmptyString(
      ownerId,
    ) ||
    !isNonEmptyString(
      businessId,
    ) ||
    !isNonEmptyString(
      branchId,
    )
  ) {
    return failure(
      "Owner ID, Business ID and Branch ID are required to read the FINORA Business Profile.",
    );
  }

  const currentResult =
    await readFinoraControlStore();

  if (
    !currentResult.success ||
    !currentResult.data
  ) {
    return failure(
      currentResult.error ??
        "Unable to load the FINORA Control Store.",
    );
  }

  const installation =
    currentResult.data.installation;

  if (!installation) {
    return failure(
      "FINORA installation identity is required before reading the Business Profile.",
    );
  }

  // ----------------------------------------------------------
  // CALLER SCOPE MUST BE THIS INSTALLATION
  // ----------------------------------------------------------

  if (
    installation.ownerId !==
      ownerId ||
    installation.businessId !==
      businessId ||
    installation.branchId !==
      branchId
  ) {
    return failure(
      "FINORA Business Profile request does not match the installation identity.",
    );
  }

  const profiles =
    currentResult.data.businessProfiles ??
    [];

  const profile =
    profiles.find(
      (item) =>
        item.ownerId ===
          ownerId &&
        item.businessId ===
          businessId &&
        item.branchId ===
          branchId,
    );

  if (!profile) {
    return success(
      undefined,
    );
  }

  // ----------------------------------------------------------
  // DEFENCE-IN-DEPTH INSTALLATION CONSISTENCY
  // ----------------------------------------------------------

  if (
    profile.installationId !==
      installation.installationId
  ) {
    return failure(
      "FINORA Business Profile installation identity is inconsistent.",
    );
  }

  if (
    isNonEmptyString(
      installation.businessCode,
    ) &&
    installation.businessCode !==
      profile.businessCode
  ) {
    return failure(
      "FINORA Business Profile businessCode does not match the installation identity.",
    );
  }

  if (
    isNonEmptyString(
      installation.branchCode,
    ) &&
    installation.branchCode !==
      profile.branchCode
  ) {
    return failure(
      "FINORA Business Profile branchCode does not match the installation identity.",
    );
  }

  return success(
    profile,
  );
}

// ============================================================
// FIND CURRENT BRANCH ACCESS GRANT
// ============================================================

// ============================================================
// SAVE BRANCH ACCESS GRANT
//
// INTERNAL MAIN-PROCESS MUTATION.
//
// Production signed packages continue through their verified
// package-apply service. This function is not renderer IPC.
// ============================================================

export async function saveFinoraBranchAccessGrant(
  accessGrant: FinoraControlBranchAccessGrant,
): Promise<FinoraControlStoreResult<FinoraControlBranchAccessGrant>> {
  if (!isBranchAccessGrant(accessGrant)) {
    return failure("A valid FINORA Branch Access Grant is required.");
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const branchAccessGrants = controlStore.branchAccessGrants ?? [];

  controlStore.branchAccessGrants = branchAccessGrants;

  const existingIndex = branchAccessGrants.findIndex(
    (item) =>
      item.userId === accessGrant.userId &&
      item.ownerId === accessGrant.ownerId &&
      item.businessId === accessGrant.businessId &&
      item.branchId === accessGrant.branchId,
  );

  if (existingIndex >= 0) {
    const existing = branchAccessGrants[existingIndex];

    if (existing.storageMode !== accessGrant.storageMode) {
      return failure(
        "FINORA Branch Access storage mode cannot be replaced through direct Control Store mutation.",
      );
    }

    branchAccessGrants[existingIndex] = accessGrant;
  } else {
    branchAccessGrants.push(accessGrant);
  }

  controlStore.updatedAt = new Date().toISOString();

  try {
    await persistControlStorePackage(controlStore);

    return success(accessGrant);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to save FINORA Branch Access Grant.",
    );
  }
}
export async function findFinoraBranchAccessGrant(
  userId: string,

  ownerId: string,

  businessId: string,

  branchId: string,
): Promise<
  FinoraControlStoreResult<FinoraControlBranchAccessGrant | undefined>
> {
  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const accessGrant = currentResult.data.branchAccessGrants?.find(
    (item) =>
      item.userId === userId &&
      item.ownerId === ownerId &&
      item.businessId === businessId &&
      item.branchId === branchId,
  );

  return success(accessGrant);
}

// END
// ============================================================
