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

import { evaluateFinoraPortableBusinessProfileSequence } from "./finoraPortableBusinessProfileSequenceAuthority.js";

import { evaluateFinoraPortablePricingPolicySequence } from "./finoraPortablePricingPolicySequenceAuthority.js";
import { evaluateFinoraPortableStorageEntitlementSequence } from "./finoraPortableStorageEntitlementSequenceAuthority.js";

import type {
  FinoraControlAppliedPackageRecord,
  FinoraControlSequenceStateRecord,
} from "./finoraControlReplayPolicy.js";

import type { FinoraBranchCredentialEnrollmentAuthorization } from "./finoraBranchAccessPackage.types.js";

import type { FinoraBranchTrustedControlPublicKey } from "./finoraSignedControlPackageVerifier.js";
import { isFinoraBranchCredentialPortabilityAuthorityProvenanceV1 } from "./finoraBranchCredentialPortabilityAuthorityProvenance.js";

import type { FinoraBranchCredentialPortabilityAuthorityProvenanceV1 } from "./finoraBranchCredentialPortabilityAuthorityProvenance.js";

import {
  canAdvanceFinoraPortableBranchAuthEnrollmentTransaction,
  validateFinoraPortableBranchAuthEnrollmentTransactionV1,
} from "./finoraPortableBranchAuthEnrollmentTransaction.js";

import type {
  FinoraPortableBranchAuthEnrollmentTransactionV1,
  FinoraPortableBranchAuthEnrollmentTransactionStatus,
} from "./finoraPortableBranchAuthEnrollmentTransaction.js";

import {
  canAdvanceFinoraPortableBranchAuthCredentialRotationTransaction,
  validateFinoraPortableBranchAuthCredentialRotationTransactionV1,
} from "./finoraPortableBranchAuthCredentialRotationTransaction.js";

import type {
  FinoraPortableBranchAuthCredentialRotationTransactionStatus,
  FinoraPortableBranchAuthCredentialRotationTransactionV1,
} from "./finoraPortableBranchAuthCredentialRotationTransaction.js";

// ============================================================
// PORTABLE BRANCH AUTH ENROLLMENT JOURNAL VALIDATION
// ============================================================

function hasExactPortableBranchAuthEnrollmentTransactionKeys(
  value: Record<string, unknown>,
  status: FinoraPortableBranchAuthEnrollmentTransactionStatus,
): boolean {
  const expectedKeys = [
    "schemaVersion",
    "transactionId",
    "sourceAuthorizationId",
    "sourceAuthorizationVerificationEvidence",
    "canonicalUsername",
    "ownerId",
    "businessId",
    "branchId",
    "storageMode",
    "status",
    "credential",
    "portableEnvelope",
    "portableEnvelopeSha256",
    "createdAt",
    "updatedAt",
  ];

  const hasCertificationProvenance =
    Object.prototype.hasOwnProperty.call(
      value,
      "branchCertificationProvenance",
    );

  if (
    status === "PORTABLE_WRITTEN" ||
    status === "CONTROL_APPLIED" ||
    status === "CERTIFICATION_MIGRATED" ||
    status === "COMPLETE"
  ) {
    expectedKeys.push("portableWrittenAt");
  }

  if (
    status === "CONTROL_APPLIED" ||
    status === "CERTIFICATION_MIGRATED" ||
    status === "COMPLETE"
  ) {
    expectedKeys.push("controlAppliedAt");
  }

  if (hasCertificationProvenance) {
    expectedKeys.push("branchCertificationProvenance");
  }

  if (
    status === "CERTIFICATION_MIGRATED" ||
    (
      status === "COMPLETE" &&
      hasCertificationProvenance
    )
  ) {
    expectedKeys.push("certificationMigratedAt");
  }

  if (status === "COMPLETE") {
    expectedKeys.push("completedAt");
  }

  const actualKeys = Object.keys(value).sort();

  expectedKeys.sort();

  return (
    actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) => key === expectedKeys[index])
  );
}

function isPortableBranchAuthEnrollmentTransaction(
  value: unknown,
): value is FinoraPortableBranchAuthEnrollmentTransactionV1 {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  try {
    validateFinoraPortableBranchAuthEnrollmentTransactionV1(
      value as FinoraPortableBranchAuthEnrollmentTransactionV1,
    );
  } catch {
    return false;
  }

  const transaction = value as FinoraPortableBranchAuthEnrollmentTransactionV1;

  if (
    !hasExactPortableBranchAuthEnrollmentTransactionKeys(
      value as Record<string, unknown>,
      transaction.status,
    )
  ) {
    return false;
  }

  return isBranchCredential(transaction.credential);
}

function hasDuplicatePortableBranchAuthEnrollmentTransactionKeys(
  transactions: FinoraPortableBranchAuthEnrollmentTransactionV1[],
): boolean {
  const transactionIds = new Set<string>();

  const sourceAuthorizationIds = new Set<string>();

  for (const transaction of transactions) {
    if (
      transactionIds.has(transaction.transactionId) ||
      sourceAuthorizationIds.has(transaction.sourceAuthorizationId)
    ) {
      return true;
    }

    transactionIds.add(transaction.transactionId);

    sourceAuthorizationIds.add(transaction.sourceAuthorizationId);
  }

  return false;
}

// ============================================================
// PORTABLE BRANCH AUTH CREDENTIAL ROTATION JOURNAL VALIDATION
// ============================================================

function hasExactPortableBranchAuthCredentialRotationTransactionKeys(
  value: Record<string, unknown>,
  status: FinoraPortableBranchAuthCredentialRotationTransactionStatus,
  dataContext: "REAL" | "DEMO",
): boolean {
  const expectedKeys = [
    "schemaVersion",
    "transactionId",
    "sourceAuthorizationId",
    "sourceAuthorizationVerificationEvidence",
    "credentialId",
    "userId",
    "canonicalUsername",
    "ownerId",
    "businessId",
    "branchId",
    "storageMode",
    "dataContext",
    "currentGeneration",
    "targetGeneration",
    "expectedCredential",
    "replacementCredential",
    "expectedPortableEnvelope",
    "expectedPortableEnvelopeSha256",
    "replacementPortableEnvelope",
    "replacementPortableEnvelopeSha256",
    "status",
    "createdAt",
    "updatedAt",
  ];

  if (dataContext === "DEMO") {
    expectedKeys.push("demoId");
  }

  if (
    status === "PORTABLE_REPLACED" ||
    status === "CONTROL_APPLIED" ||
    status === "COMPLETE"
  ) {
    expectedKeys.push("portableReplacedAt");
  }

  if (status === "CONTROL_APPLIED" || status === "COMPLETE") {
    expectedKeys.push("controlAppliedAt");
  }

  if (status === "COMPLETE") {
    expectedKeys.push("completedAt");
  }

  const actualKeys = Object.keys(value).sort();

  expectedKeys.sort();

  return (
    actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) => key === expectedKeys[index])
  );
}

function isPortableBranchAuthCredentialRotationTransaction(
  value: unknown,
): value is FinoraPortableBranchAuthCredentialRotationTransactionV1 {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  try {
    validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
      value as FinoraPortableBranchAuthCredentialRotationTransactionV1,
    );
  } catch {
    return false;
  }

  const transaction =
    value as FinoraPortableBranchAuthCredentialRotationTransactionV1;

  if (
    !hasExactPortableBranchAuthCredentialRotationTransactionKeys(
      value as Record<string, unknown>,
      transaction.status,
      transaction.dataContext,
    )
  ) {
    return false;
  }

  return (
    isBranchCredential(transaction.expectedCredential) &&
    isBranchCredential(transaction.replacementCredential)
  );
}

function hasDuplicatePortableBranchAuthCredentialRotationTransactionIds(
  transactions: FinoraPortableBranchAuthCredentialRotationTransactionV1[],
): boolean {
  const transactionIds = new Set<string>();

  for (const transaction of transactions) {
    if (transactionIds.has(transaction.transactionId)) {
      return true;
    }

    transactionIds.add(transaction.transactionId);
  }

  return false;
}

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
/* ============================================================
   SIGNED PRICING POLICY DTO
============================================================ */

export type FinoraControlPricingChargeCode =
  | "LOAN_DISBURSEMENT"
  | "LOAN_NUMBER_GENERATION"
  | "CUSTOMER_NUMBER_GENERATION"
  | "COLLECTION_PROCESSING"
  | "RECEIPT_PROCESSING"
  | "CUSTOMER_ID_CARD_GENERATION"
  | "OTHER_PLATFORM_FEE";

export interface FinoraControlPricingOverrideRule {
  overrideId: string;

  chargeCode: FinoraControlPricingChargeCode;

  model: "FIXED_PRICE_OVERRIDE";

  amount: number;

  currency: "INR";

  validFrom: string;

  validUntil: string;

  schemaVersion: 1;
}

/**
 * Current verified signed Pricing Policy for one exact
 * Owner / Business / Branch / installation scope.
 *
 * Signed Control Package purpose = PRICING_POLICY.
 */
export interface FinoraControlPricingPolicy {
  overrideSetId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  installationId: string;

  bindingKeyId: string;

  fingerprintAlgorithm: "SHA-256";

  publicKeyFingerprint: string;

  overrides: FinoraControlPricingOverrideRule[];

  issuedAt: string;

  schemaVersion: 1;
}
/* ============================================================
   VERIFIED WALLET RECHARGE AUTHORIZATION DTO
============================================================ */

export type FinoraControlWalletRechargePaymentMethod =
  | "UPI"
  | "PHONEPE"
  | "GOOGLE_PAY"
  | "PAYTM"
  | "RAZORPAY"
  | "BANK_TRANSFER"
  | "OTHER";

export type FinoraControlWalletPaymentSource =
  | "PHONEPE"
  | "RAZORPAY"
  | "UPI"
  | "GOOGLE_PAY"
  | "PAYTM"
  | "BANK_TRANSFER"
  | "MANUAL";

/**
 * Durable public evidence that one WALLET_RECHARGE package was
 * cryptographically verified and accepted for this exact native
 * installation.
 *
 * This record authorizes later Wallet mutation by stable
 * paymentReference.
 *
 * verifiedAt is Control Package verification/application
 * evidence only. It MUST NOT drive Wallet financial timestamps.
 */
export interface FinoraControlWalletRechargeAuthorization {
  packageId: string;

  issuerId: string;

  signingKeyId: string;

  purpose: "WALLET_RECHARGE";

  sequence: number;

  ownerId: string;

  businessId: string;

  branchId: string;

  installationId: string;

  bindingKeyId: string;

  fingerprintAlgorithm: "SHA-256";

  publicKeyFingerprint: string;

  paymentReference: string;

  amountMinor: number;

  currency: "INR";

  paymentMethod: FinoraControlWalletRechargePaymentMethod;

  paymentSource: FinoraControlWalletPaymentSource;

  providerOrderId?: string;

  providerTransactionId?: string;

  issuedAt: string;

  verifiedAt: string;

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

/* ============================================================
   VERIFIED WALLET RECHARGE DECLINE EVIDENCE DTO
============================================================ */

/**
 * Durable public evidence that one WALLET_RECHARGE_DECLINE
 * package was cryptographically verified and accepted for this
 * exact native installation.
 *
 * This record never authorizes Wallet credit. It only proves
 * that the exact signed Recharge Request identity was declined.
 *
 * verifiedAt is Control Package acceptance evidence only.
 */
export interface FinoraControlWalletRechargeDeclineEvidence {
  packageId: string;

  issuerId: string;

  signingKeyId: string;

  purpose: "WALLET_RECHARGE_DECLINE";

  sequence: number;

  ownerId: string;

  businessId: string;

  branchId: string;

  installationId: string;

  bindingKeyId: string;

  fingerprintAlgorithm: "SHA-256";

  publicKeyFingerprint: string;

  requestId: string;

  paymentReference: string;

  amountMinor: number;

  currency: "INR";

  paymentMethod: FinoraControlWalletRechargePaymentMethod;

  paymentSource: FinoraControlWalletPaymentSource;

  requestedAt: string;

  outcome: "DECLINED";

  issuedAt: string;

  verifiedAt: string;

  schemaVersion: 1;
}
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
// LOCAL BRANCH CREDENTIAL
//
// IMPORTANT:
//
// - This is recipient-local credential-verifier state.
// - It is persisted only inside the encrypted Control Store.
// - The plaintext password is never persisted.
// - sourceAuthorizationId permanently records the consumed
//   signed one-time credential-enrollment authority.
// - Branch Access remains separately authoritative.
// ============================================================

export interface FinoraControlBranchCredentialVerifierV1 {
  algorithm: "SCRYPT";

  saltEncoding: "BASE64";

  salt: string;

  derivedKeyEncoding: "BASE64";

  derivedKey: string;

  keyLength: 32;

  N: 32768;

  r: 8;

  p: 1;
}

export interface FinoraControlBranchCredential {
  credentialId: string;

  sourceAuthorizationId: string;

  /**
   * Current Portable Auth credential lineage generation.
   *
   * Optional only for backward compatibility with credentials
   * persisted before D4E4I8. New enrollment persists the
   * initial generation explicitly.
   */
  authGeneration?: number;

  userId: string;

  username: string;

  canonicalUsername: string;

  fullName: string;

  role: "ADMIN" | "MANAGER" | "COLLECTOR" | "VIEWER";

  ownerId: string;

  businessId: string;

  branchId: string;

  storageMode: FinoraControlStorageMode;

  dataContext: "REAL" | "DEMO";

  demoId?: string;

  status: "ACTIVE";

  verifier: FinoraControlBranchCredentialVerifierV1;

  securityVerifier?: FinoraControlBranchCredentialVerifierV1;

  createdAt: string;

  updatedAt: string;

  schemaVersion: 1;
}

/* ============================================================
   VERIFIED CREDENTIAL AUTHORIZATION SIGNER EVIDENCE DTO
============================================================ */

/**
 * Recipient-local public verification evidence for one signed
 * credential-enrollment authorization.
 *
 * SECURITY:
 *
 * - This record is never signing authority by itself.
 * - verifiedControlSigner is copied only from the exact trusted
 *   public key selected by native signature verification.
 * - No password, Security Code or private key is stored here.
 * - authorizationId binds evidence to credential enrollment.
 * - verifiedAt is verification/application evidence only.
 */
export interface FinoraBranchCredentialAuthorizationVerificationEvidence {
  authorizationId: string;

  packageId: string;

  issuerId: string;

  sequence: number;

  verifiedControlSigner: FinoraBranchTrustedControlPublicKey;

  verifiedAt: string;

  schemaVersion: 1;
}
// ============================================================
// VERIFIED CONTROL STATE
// ============================================================
export interface FinoraPortableBranchAccessSequenceStateRecord {
  issuerId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  lastSequence: number;

  updatedAt: string;
}

export interface FinoraPortableBusinessProfileSequenceStateRecord {
  issuerId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  lastSequence: number;

  updatedAt: string;
}

export interface FinoraPortablePricingPolicySequenceStateRecord {
  issuerId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  lastSequence: number;

  updatedAt: string;
}

export interface FinoraPortableStorageEntitlementSequenceStateRecord {
  issuerId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  lastSequence: number;

  updatedAt: string;
}
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
  businessProfiles?: FinoraControlBusinessProfile[];

  /**
   * Current signed FINORA Pricing Policy for this branch.
   *
   * Optional only for backward compatibility with encrypted
   * Control Stores created before the Pricing Policy Engine.
   *
   * New verified PRICING_POLICY applies persist this array.
   */
  pricingPolicies?: FinoraControlPricingPolicy[];

  /**
   * Accepted signed WALLET_RECHARGE authorizations.
   *
   * Optional only for backward compatibility with encrypted
   * Control Stores created before the Signed Recharge Engine.
   *
   * Historical accepted authorizations remain available for
   * crash-safe Wallet completion by paymentReference.
   */
  walletRechargeAuthorizations?: FinoraControlWalletRechargeAuthorization[];

  /**
   * Accepted signed WALLET_RECHARGE_DECLINE evidence.
   *
   * Optional for backward compatibility with Control Stores
   * created before remote Recharge decline support.
   */
  walletRechargeDeclines?: FinoraControlWalletRechargeDeclineEvidence[];
  /**
   * Current signed REGISTERED / DEMO access by login identity.
   *
   * Optional only for backward compatibility with encrypted
   * Control Stores created before the Branch Access Engine.
   */
  branchAccessGrants?: FinoraControlBranchAccessGrant[];

  /**
   * Pending one-time signed recipient credential enrollment
   * authorizations.
   *
   * No password, password hash, salt or credential verifier
   * is stored in this Control Store collection.
   */
  branchCredentialEnrollmentAuthorizations?: FinoraBranchCredentialEnrollmentAuthorization[];
  /**
   * Public signer evidence captured from successful native
   * verification of credential-enrollment authority.
   *
   * Optional only for backward compatibility with encrypted
   * Control Stores created before this evidence existed.
   *
   * Evidence may temporarily outlive its pending authorization
   * while Portable Branch Auth crash recovery is incomplete.
   */
  branchCredentialAuthorizationVerificationEvidence?: FinoraBranchCredentialAuthorizationVerificationEvidence[];

  /**
   * Verified reusable Branch Portability Authority provenance
   * bound to one credential-enrollment source authorization.
   *
   * SECURITY:
   *
   * - Exact signed portability package is preserved.
   * - Exact verified Control Center public signer is preserved.
   * - This collection is NOT the applied-package replay ledger.
   * - Portability authority remains reusable on legitimate
   *   devices for this exact credential lineage.
   * - Optional for backward compatibility with older stores.
   */
  branchCredentialPortabilityAuthorities?: FinoraBranchCredentialPortabilityAuthorityProvenanceV1[];

  /**
   * Recipient-local production credential verifiers.
   *
   * Optional only for backward compatibility with encrypted
   * Control Stores created before local credential authority.
   *
   * Plaintext passwords are never stored here.
   */
  branchCredentials?: FinoraControlBranchCredential[];

  /**
   * Durable crash-recovery journal for Portable Branch Auth
   * credential enrollment.
   *
   * The journal contains only the already-derived credential
   * verifier record and the already-encrypted portable envelope.
   * Plaintext password and Security Code are never stored here.
   *
   * Optional only for backward compatibility with encrypted
   * Control Stores created before Portable Branch Auth support.
   */
  portableBranchAuthEnrollmentTransactions?: FinoraPortableBranchAuthEnrollmentTransactionV1[];

  /**
   * Durable crash-recovery journal for Portable Branch Auth
   * credential rotation.
   *
   * The journal preserves only derived credential verifier
   * snapshots and encrypted Portable Auth envelopes.
   * Plaintext Password and Security Code are never stored.
   *
   * Multiple completed rotations may retain the same immutable
   * sourceAuthorizationId because that value identifies credential
   * lineage provenance, not one-time rotation authority.
   *
   * transactionId remains unique per durable rotation.
   *
   * Optional only for backward compatibility with encrypted
   * Control Stores created before credential rotation support.
   */
  portableBranchAuthCredentialRotationTransactions?: FinoraPortableBranchAuthCredentialRotationTransactionV1[];

  /**
   * Cryptographically verified package IDs already applied.
   */
  appliedControlPackages?: FinoraControlAppliedPackageRecord[];

  /**
   * Highest accepted sequence per issuer / purpose / target.
   */
  controlSequences?: FinoraControlSequenceStateRecord[];

  /**
   * Highest accepted portable BRANCH_ACCESS sequence per
   * trusted issuer and permanent branch scope.
   *
   * This intentionally has no installationId. Historical
   * installation-scoped BRANCH_ACCESS sequence state remains
   * in controlSequences and is not rewritten.
   *
   * Optional only for backward compatibility with encrypted
   * Control Stores created before BRANCH_ACCESS portability.
   */
  portableBranchAccessSequences?: FinoraPortableBranchAccessSequenceStateRecord[];
  portableBusinessProfileSequences?: FinoraPortableBusinessProfileSequenceStateRecord[];

  portablePricingPolicySequences?: FinoraPortablePricingPolicySequenceStateRecord[];

  portableStorageEntitlementSequences?: FinoraPortableStorageEntitlementSequenceStateRecord[];

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
  value: unknown,
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
    value.fingerprintAlgorithm !== "SHA-256" ||
    typeof value.publicKeyFingerprint !== "string" ||
    !/^[0-9a-f]{64}$/.test(value.publicKeyFingerprint) ||
    !isControlTimestamp(value.createdAt) ||
    !isControlTimestamp(value.updatedAt) ||
    value.schemaVersion !== 1
  ) {
    return false;
  }

  const expectedBindingKeyId = `FINORA-BINDING-${value.publicKeyFingerprint
    .slice(0, 32)
    .toUpperCase()}`;

  if (value.bindingKeyId !== expectedBindingKeyId) {
    return false;
  }

  const createdAt = Date.parse(value.createdAt);

  const updatedAt = Date.parse(value.updatedAt);

  return (
    Number.isFinite(createdAt) &&
    Number.isFinite(updatedAt) &&
    updatedAt >= createdAt
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
  profiles: readonly FinoraControlBusinessProfile[],
): boolean {
  const scopeKeys = new Set<string>();

  const profileIds = new Set<string>();

  for (const profile of profiles) {
    const scopeKey = [
      profile.ownerId,
      profile.businessId,
      profile.branchId,
    ].join("::");

    if (scopeKeys.has(scopeKey) || profileIds.has(profile.profileId)) {
      return true;
    }

    scopeKeys.add(scopeKey);

    profileIds.add(profile.profileId);
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

function isPricingOverrideRule(
  value: unknown,
): value is FinoraControlPricingOverrideRule {
  if (!isRecord(value)) {
    return false;
  }

  const supportedChargeCodes: readonly FinoraControlPricingChargeCode[] = [
    "LOAN_DISBURSEMENT",
    "LOAN_NUMBER_GENERATION",
    "CUSTOMER_NUMBER_GENERATION",
    "COLLECTION_PROCESSING",
    "RECEIPT_PROCESSING",
    "CUSTOMER_ID_CARD_GENERATION",
    "OTHER_PLATFORM_FEE",
  ];

  if (
    !isNonEmptyString(value.overrideId) ||
    typeof value.chargeCode !== "string" ||
    !supportedChargeCodes.includes(
      value.chargeCode as FinoraControlPricingChargeCode,
    ) ||
    value.chargeCode !== "LOAN_DISBURSEMENT" ||
    value.model !== "FIXED_PRICE_OVERRIDE" ||
    typeof value.amount !== "number" ||
    !Number.isFinite(value.amount) ||
    value.amount <= 0 ||
    value.currency !== "INR" ||
    !isControlTimestamp(value.validFrom) ||
    !isControlTimestamp(value.validUntil) ||
    value.schemaVersion !== 1
  ) {
    return false;
  }

  return Date.parse(value.validUntil) > Date.parse(value.validFrom);
}

function isPricingPolicy(value: unknown): value is FinoraControlPricingPolicy {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !isNonEmptyString(value.overrideSetId) ||
    !isNonEmptyString(value.ownerId) ||
    !isNonEmptyString(value.businessId) ||
    !isNonEmptyString(value.branchId) ||
    !isNonEmptyString(value.installationId) ||
    !isNonEmptyString(value.bindingKeyId) ||
    value.fingerprintAlgorithm !== "SHA-256" ||
    typeof value.publicKeyFingerprint !== "string" ||
    !/^[0-9a-f]{64}$/.test(value.publicKeyFingerprint) ||
    !Array.isArray(value.overrides) ||
    !value.overrides.every(isPricingOverrideRule) ||
    !isControlTimestamp(value.issuedAt) ||
    value.schemaVersion !== 1
  ) {
    return false;
  }

  const expectedBindingKeyId = `FINORA-BINDING-${value.publicKeyFingerprint
    .slice(0, 32)
    .toUpperCase()}`;

  if (value.bindingKeyId !== expectedBindingKeyId) {
    return false;
  }

  const overrides = value.overrides as FinoraControlPricingOverrideRule[];

  const overrideIds = new Set<string>();

  for (const rule of overrides) {
    if (overrideIds.has(rule.overrideId)) {
      return false;
    }

    overrideIds.add(rule.overrideId);
  }

  const byCharge = new Map<
    FinoraControlPricingChargeCode,
    FinoraControlPricingOverrideRule[]
  >();

  for (const rule of overrides) {
    const rules = byCharge.get(rule.chargeCode) ?? [];

    rules.push(rule);

    byCharge.set(rule.chargeCode, rules);
  }

  for (const rules of byCharge.values()) {
    const ordered = [...rules].sort(
      (left, right) => Date.parse(left.validFrom) - Date.parse(right.validFrom),
    );

    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1];

      const current = ordered[index];

      if (Date.parse(current.validFrom) < Date.parse(previous.validUntil)) {
        return false;
      }
    }
  }

  return true;
}

function hasDuplicatePricingPolicyKeys(
  policies: readonly FinoraControlPricingPolicy[],
): boolean {
  const scopeKeys = new Set<string>();

  const overrideSetIds = new Set<string>();

  for (const policy of policies) {
    const scopeKey = [
      policy.ownerId,
      policy.businessId,
      policy.branchId,
      policy.installationId,
    ].join("\u001f");

    if (scopeKeys.has(scopeKey) || overrideSetIds.has(policy.overrideSetId)) {
      return true;
    }

    scopeKeys.add(scopeKey);

    overrideSetIds.add(policy.overrideSetId);
  }

  return false;
}
function isWalletRechargePaymentMethod(
  value: unknown,
): value is FinoraControlWalletRechargePaymentMethod {
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

function isWalletPaymentSource(
  value: unknown,
): value is FinoraControlWalletPaymentSource {
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

function isWalletRechargeDeclineEvidence(
  value: unknown,
): value is FinoraControlWalletRechargeDeclineEvidence {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !isNonEmptyString(value.packageId) ||
    !isNonEmptyString(value.issuerId) ||
    !isNonEmptyString(value.signingKeyId) ||
    value.purpose !== "WALLET_RECHARGE_DECLINE" ||
    !Number.isSafeInteger(value.sequence) ||
    (value.sequence as number) <= 0 ||
    !isNonEmptyString(value.ownerId) ||
    !isNonEmptyString(value.businessId) ||
    !isNonEmptyString(value.branchId) ||
    !isNonEmptyString(value.installationId) ||
    !isNonEmptyString(value.bindingKeyId) ||
    value.fingerprintAlgorithm !== "SHA-256" ||
    typeof value.publicKeyFingerprint !== "string" ||
    !/^[0-9a-f]{64}$/.test(value.publicKeyFingerprint) ||
    !isNonEmptyString(value.requestId) ||
    !/^FINORA-WAL-REQ-[0-9A-F]{64}$/.test(value.requestId) ||
    !isNonEmptyString(value.paymentReference) ||
    !Number.isSafeInteger(value.amountMinor) ||
    (value.amountMinor as number) <= 0 ||
    value.currency !== "INR" ||
    !isWalletRechargePaymentMethod(value.paymentMethod) ||
    !isWalletPaymentSource(value.paymentSource) ||
    !isControlTimestamp(value.requestedAt) ||
    value.outcome !== "DECLINED" ||
    !isControlTimestamp(value.issuedAt) ||
    !isControlTimestamp(value.verifiedAt) ||
    value.schemaVersion !== 1
  ) {
    return false;
  }

  const expectedBindingKeyId = `FINORA-BINDING-${value.publicKeyFingerprint
    .slice(0, 32)
    .toUpperCase()}`;

  if (value.bindingKeyId !== expectedBindingKeyId) {
    return false;
  }

  return (
    Date.parse(value.requestedAt) <= Date.parse(value.issuedAt) &&
    Date.parse(value.issuedAt) <= Date.parse(value.verifiedAt)
  );
}

function hasDuplicateWalletRechargeDeclineKeys(
  values: FinoraControlWalletRechargeDeclineEvidence[],
): boolean {
  const packageIds = new Set<string>();

  const paymentReferences = new Set<string>();

  const requestIds = new Set<string>();

  for (const value of values) {
    if (
      packageIds.has(value.packageId) ||
      paymentReferences.has(value.paymentReference) ||
      requestIds.has(value.requestId)
    ) {
      return true;
    }

    packageIds.add(value.packageId);

    paymentReferences.add(value.paymentReference);

    requestIds.add(value.requestId);
  }

  return false;
}
function isWalletRechargeAuthorization(
  value: unknown,
): value is FinoraControlWalletRechargeAuthorization {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !isNonEmptyString(value.packageId) ||
    !isNonEmptyString(value.issuerId) ||
    !isNonEmptyString(value.signingKeyId) ||
    value.purpose !== "WALLET_RECHARGE" ||
    !Number.isSafeInteger(value.sequence) ||
    (value.sequence as number) <= 0 ||
    !isNonEmptyString(value.ownerId) ||
    !isNonEmptyString(value.businessId) ||
    !isNonEmptyString(value.branchId) ||
    !isNonEmptyString(value.installationId) ||
    !isNonEmptyString(value.bindingKeyId) ||
    value.fingerprintAlgorithm !== "SHA-256" ||
    typeof value.publicKeyFingerprint !== "string" ||
    !/^[0-9a-f]{64}$/.test(value.publicKeyFingerprint) ||
    !isNonEmptyString(value.paymentReference) ||
    !Number.isSafeInteger(value.amountMinor) ||
    (value.amountMinor as number) <= 0 ||
    value.currency !== "INR" ||
    !isWalletRechargePaymentMethod(value.paymentMethod) ||
    !isWalletPaymentSource(value.paymentSource) ||
    (value.providerOrderId !== undefined &&
      !isNonEmptyString(value.providerOrderId)) ||
    (value.providerTransactionId !== undefined &&
      !isNonEmptyString(value.providerTransactionId)) ||
    !isControlTimestamp(value.issuedAt) ||
    !isControlTimestamp(value.verifiedAt) ||
    value.schemaVersion !== 1
  ) {
    return false;
  }

  const expectedBindingKeyId = `FINORA-BINDING-${value.publicKeyFingerprint
    .slice(0, 32)
    .toUpperCase()}`;

  if (value.bindingKeyId !== expectedBindingKeyId) {
    return false;
  }

  return Date.parse(value.issuedAt) <= Date.parse(value.verifiedAt);
}

function hasDuplicateWalletRechargeAuthorizationKeys(
  values: FinoraControlWalletRechargeAuthorization[],
): boolean {
  const packageIds = new Set<string>();

  const paymentReferences = new Set<string>();

  for (const value of values) {
    if (
      packageIds.has(value.packageId) ||
      paymentReferences.has(value.paymentReference)
    ) {
      return true;
    }

    packageIds.add(value.packageId);

    paymentReferences.add(value.paymentReference);
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

// ============================================================
// BRANCH CREDENTIAL ENROLLMENT AUTHORIZATION
// ============================================================

function hasExactBranchCredentialAuthorizationKeys(
  value: Record<string, unknown>,
): boolean {
  const expectedKeys = [
    "authorizationId",
    "userId",
    "username",
    "fullName",
    "role",
    "ownerId",
    "businessId",
    "branchId",
    "storageMode",
    "dataContext",
    "method",
    "oneTime",
    "schemaVersion",
  ];

  if (value.demoId !== undefined) {
    expectedKeys.push("demoId");
  }

  const actualKeys = Object.keys(value).sort();
  expectedKeys.sort();

  return (
    actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) => key === expectedKeys[index])
  );
}

function isBranchCredentialEnrollmentAuthorization(
  value: unknown,
): value is FinoraBranchCredentialEnrollmentAuthorization {
  if (!isRecord(value) || !hasExactBranchCredentialAuthorizationKeys(value)) {
    return false;
  }

  if (
    !isNonEmptyString(value.authorizationId) ||
    !isNonEmptyString(value.userId) ||
    !isNonEmptyString(value.username) ||
    !isNonEmptyString(value.fullName) ||
    !isNonEmptyString(value.ownerId) ||
    !isNonEmptyString(value.businessId) ||
    !isNonEmptyString(value.branchId) ||
    (value.role !== "ADMIN" &&
      value.role !== "MANAGER" &&
      value.role !== "COLLECTOR" &&
      value.role !== "VIEWER") ||
    (value.storageMode !== "LOCAL" && value.storageMode !== "USB") ||
    (value.dataContext !== "REAL" && value.dataContext !== "DEMO") ||
    value.method !== "SET_PASSWORD_ON_RECIPIENT" ||
    value.oneTime !== true ||
    value.schemaVersion !== 1
  ) {
    return false;
  }

  if (value.dataContext === "REAL") {
    return value.demoId === undefined;
  }

  return isNonEmptyString(value.demoId);
}

function hasExactVerifiedControlSignerEvidenceKeys(
  value: Record<string, unknown>,
): boolean {
  const expectedKeys = [
    "issuerId",
    "signingKeyId",
    "algorithm",
    "format",
    "publicKey",
    "status",
    "validFrom",
  ];

  if (value.validUntil !== undefined) {
    expectedKeys.push("validUntil");
  }

  const actualKeys = Object.keys(value).sort();

  expectedKeys.sort();

  return (
    actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) => key === expectedKeys[index])
  );
}

function isVerifiedControlSignerEvidence(
  value: unknown,
): value is FinoraBranchTrustedControlPublicKey {
  if (
    !isRecord(value) ||
    !hasExactVerifiedControlSignerEvidenceKeys(value) ||
    !isNonEmptyString(value.issuerId) ||
    !isNonEmptyString(value.signingKeyId) ||
    value.algorithm !== "ECDSA_P256_SHA256" ||
    value.format !== "SPKI_DER_BASE64" ||
    !isNonEmptyString(value.publicKey) ||
    (value.status !== "ACTIVE" && value.status !== "RETIRED") ||
    !isControlTimestamp(value.validFrom) ||
    (value.validUntil !== undefined && !isControlTimestamp(value.validUntil))
  ) {
    return false;
  }

  if (
    value.validUntil !== undefined &&
    Date.parse(value.validUntil) < Date.parse(value.validFrom)
  ) {
    return false;
  }

  return true;
}

function hasExactBranchCredentialAuthorizationVerificationEvidenceKeys(
  value: Record<string, unknown>,
): boolean {
  const actualKeys = Object.keys(value).sort();

  const expectedKeys = [
    "authorizationId",
    "packageId",
    "issuerId",
    "sequence",
    "verifiedControlSigner",
    "verifiedAt",
    "schemaVersion",
  ].sort();

  return (
    actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) => key === expectedKeys[index])
  );
}

function isBranchCredentialAuthorizationVerificationEvidence(
  value: unknown,
): value is FinoraBranchCredentialAuthorizationVerificationEvidence {
  if (
    !isRecord(value) ||
    !hasExactBranchCredentialAuthorizationVerificationEvidenceKeys(value) ||
    !isNonEmptyString(value.authorizationId) ||
    !isNonEmptyString(value.packageId) ||
    !isNonEmptyString(value.issuerId) ||
    !Number.isSafeInteger(value.sequence) ||
    (value.sequence as number) <= 0 ||
    !isVerifiedControlSignerEvidence(value.verifiedControlSigner) ||
    !isControlTimestamp(value.verifiedAt) ||
    value.schemaVersion !== 1
  ) {
    return false;
  }

  return value.verifiedControlSigner.issuerId === value.issuerId;
}

function hasDuplicateBranchCredentialAuthorizationVerificationEvidenceKeys(
  evidence: FinoraBranchCredentialAuthorizationVerificationEvidence[],
): boolean {
  const authorizationIds = new Set<string>();

  const packageIds = new Set<string>();

  for (const item of evidence) {
    if (
      authorizationIds.has(item.authorizationId) ||
      packageIds.has(item.packageId)
    ) {
      return true;
    }

    authorizationIds.add(item.authorizationId);

    packageIds.add(item.packageId);
  }

  return false;
}
function hasDuplicateBranchCredentialPortabilityAuthorityProvenanceKeys(
  records: FinoraBranchCredentialPortabilityAuthorityProvenanceV1[],
): boolean {
  const sourceAuthorizationIds = new Set<string>();

  const packageIds = new Set<string>();

  for (const record of records) {
    if (
      sourceAuthorizationIds.has(record.sourceAuthorizationId) ||
      packageIds.has(record.signedPortabilityAuthorityPackage.packageId)
    ) {
      return true;
    }

    sourceAuthorizationIds.add(record.sourceAuthorizationId);

    packageIds.add(record.signedPortabilityAuthorityPackage.packageId);
  }

  return false;
}
function hasDuplicateBranchCredentialAuthorizationKeys(
  values: FinoraBranchCredentialEnrollmentAuthorization[],
): boolean {
  const authorizationIds = new Set<string>();
  const scopes = new Set<string>();

  for (const value of values) {
    if (authorizationIds.has(value.authorizationId)) {
      return true;
    }

    authorizationIds.add(value.authorizationId);

    const scope = [
      value.userId,
      value.ownerId,
      value.businessId,
      value.branchId,
    ].join("::");

    if (scopes.has(scope)) {
      return true;
    }

    scopes.add(scope);
  }

  return false;
}

// ============================================================
// LOCAL BRANCH CREDENTIAL VALIDATION
// ============================================================

export function canonicalizeFinoraCredentialUsername(value: string): string {
  return value.trim().normalize("NFKC").toLowerCase();
}

function isCanonicalBase64OfByteLength(
  value: unknown,
  expectedByteLength: number,
): value is string {
  if (
    !isNonEmptyString(value) ||
    !Number.isSafeInteger(expectedByteLength) ||
    expectedByteLength <= 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value,
    )
  ) {
    return false;
  }

  try {
    const decoded = Buffer.from(value, "base64");

    return (
      decoded.length === expectedByteLength &&
      decoded.toString("base64") === value
    );
  } catch {
    return false;
  }
}

function hasExactBranchCredentialVerifierKeys(
  value: Record<string, unknown>,
): boolean {
  const expectedKeys = [
    "algorithm",
    "saltEncoding",
    "salt",
    "derivedKeyEncoding",
    "derivedKey",
    "keyLength",
    "N",
    "r",
    "p",
  ].sort();

  const actualKeys = Object.keys(value).sort();

  return (
    actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) => key === expectedKeys[index])
  );
}

function isBranchCredentialVerifierV1(
  value: unknown,
): value is FinoraControlBranchCredentialVerifierV1 {
  return (
    isRecord(value) &&
    hasExactBranchCredentialVerifierKeys(value) &&
    value.algorithm === "SCRYPT" &&
    value.saltEncoding === "BASE64" &&
    isCanonicalBase64OfByteLength(value.salt, 16) &&
    value.derivedKeyEncoding === "BASE64" &&
    isCanonicalBase64OfByteLength(value.derivedKey, 32) &&
    value.keyLength === 32 &&
    value.N === 32768 &&
    value.r === 8 &&
    value.p === 1
  );
}

function hasExactBranchCredentialKeys(value: Record<string, unknown>): boolean {
  const expectedKeys = [
    "credentialId",
    "sourceAuthorizationId",
    "userId",
    "username",
    "canonicalUsername",
    "fullName",
    "role",
    "ownerId",
    "businessId",
    "branchId",
    "storageMode",
    "dataContext",
    "status",
    "verifier",
    "createdAt",
    "updatedAt",
    "schemaVersion",
  ];

  if (value.authGeneration !== undefined) {
    expectedKeys.push("authGeneration");
  }

  if (value.demoId !== undefined) {
    expectedKeys.push("demoId");
  }

  if (value.securityVerifier !== undefined) {
    expectedKeys.push("securityVerifier");
  }

  const actualKeys = Object.keys(value).sort();

  expectedKeys.sort();

  return (
    actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) => key === expectedKeys[index])
  );
}

function isBranchCredential(
  value: unknown,
): value is FinoraControlBranchCredential {
  if (!isRecord(value) || !hasExactBranchCredentialKeys(value)) {
    return false;
  }

  if (
    value.schemaVersion !== 1 ||
    !isNonEmptyString(value.credentialId) ||
    !isNonEmptyString(value.sourceAuthorizationId) ||
    (value.authGeneration !== undefined &&
      (!Number.isSafeInteger(value.authGeneration) ||
        (value.authGeneration as number) <= 0)) ||
    !isNonEmptyString(value.userId) ||
    !isNonEmptyString(value.username) ||
    !isNonEmptyString(value.canonicalUsername) ||
    value.canonicalUsername !==
      canonicalizeFinoraCredentialUsername(value.username) ||
    !isNonEmptyString(value.fullName) ||
    (value.role !== "ADMIN" &&
      value.role !== "MANAGER" &&
      value.role !== "COLLECTOR" &&
      value.role !== "VIEWER") ||
    !isNonEmptyString(value.ownerId) ||
    !isNonEmptyString(value.businessId) ||
    !isNonEmptyString(value.branchId) ||
    (value.storageMode !== "LOCAL" && value.storageMode !== "USB") ||
    (value.dataContext !== "REAL" && value.dataContext !== "DEMO") ||
    value.status !== "ACTIVE" ||
    !isBranchCredentialVerifierV1(value.verifier) ||
    (value.securityVerifier !== undefined &&
      !isBranchCredentialVerifierV1(value.securityVerifier)) ||
    !isControlTimestamp(value.createdAt) ||
    !isControlTimestamp(value.updatedAt)
  ) {
    return false;
  }

  if (value.dataContext === "REAL") {
    return value.demoId === undefined;
  }

  return isNonEmptyString(value.demoId);
}

function hasDuplicateBranchCredentialKeys(
  values: FinoraControlBranchCredential[],
): boolean {
  const credentialIds = new Set<string>();

  const sourceAuthorizationIds = new Set<string>();

  const scopes = new Set<string>();

  const canonicalUsernames = new Set<string>();

  for (const value of values) {
    if (
      credentialIds.has(value.credentialId) ||
      sourceAuthorizationIds.has(value.sourceAuthorizationId) ||
      canonicalUsernames.has(value.canonicalUsername)
    ) {
      return true;
    }

    const scope = [
      value.userId,
      value.ownerId,
      value.businessId,
      value.branchId,
    ].join("::");

    if (scopes.has(scope)) {
      return true;
    }

    credentialIds.add(value.credentialId);

    sourceAuthorizationIds.add(value.sourceAuthorizationId);

    canonicalUsernames.add(value.canonicalUsername);

    scopes.add(scope);
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

function isPortableBranchAccessSequenceStateRecord(
  value: unknown,
): value is FinoraPortableBranchAccessSequenceStateRecord {
  return (
    isRecord(value) &&
    isNonEmptyString(value.issuerId) &&
    isNonEmptyString(value.ownerId) &&
    isNonEmptyString(value.businessId) &&
    isNonEmptyString(value.branchId) &&
    Number.isSafeInteger(value.lastSequence) &&
    (value.lastSequence as number) > 0 &&
    isControlTimestamp(value.updatedAt)
  );
}

function isPortableBusinessProfileSequenceStateRecord(
  value: unknown,
): value is FinoraPortableBusinessProfileSequenceStateRecord {
  return (
    isRecord(value) &&
    isNonEmptyString(value.issuerId) &&
    isNonEmptyString(value.ownerId) &&
    isNonEmptyString(value.businessId) &&
    isNonEmptyString(value.branchId) &&
    Number.isSafeInteger(value.lastSequence) &&
    (value.lastSequence as number) > 0 &&
    isControlTimestamp(value.updatedAt)
  );
}

function isPortablePricingPolicySequenceStateRecord(
  value: unknown,
): value is FinoraPortablePricingPolicySequenceStateRecord {
  return (
    isRecord(value) &&
    isNonEmptyString(value.issuerId) &&
    isNonEmptyString(value.ownerId) &&
    isNonEmptyString(value.businessId) &&
    isNonEmptyString(value.branchId) &&
    Number.isSafeInteger(value.lastSequence) &&
    (value.lastSequence as number) > 0 &&
    isControlTimestamp(value.updatedAt)
  );
}

function isPortableStorageEntitlementSequenceStateRecord(
  value: unknown,
): value is FinoraPortableStorageEntitlementSequenceStateRecord {
  return (
    isRecord(value) &&
    isNonEmptyString(value.issuerId) &&
    isNonEmptyString(value.ownerId) &&
    isNonEmptyString(value.businessId) &&
    isNonEmptyString(value.branchId) &&
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

function hasDuplicatePortableBranchAccessSequenceKeys(
  records: FinoraPortableBranchAccessSequenceStateRecord[],
): boolean {
  const keys = new Set<string>();

  for (const record of records) {
    const key = [
      record.issuerId,
      record.ownerId,
      record.businessId,
      record.branchId,
    ].join("::");

    if (keys.has(key)) {
      return true;
    }

    keys.add(key);
  }

  return false;
}

function hasDuplicatePortableBusinessProfileSequenceKeys(
  records: FinoraPortableBusinessProfileSequenceStateRecord[],
): boolean {
  const keys = new Set<string>();

  for (const record of records) {
    const key = [
      record.issuerId,
      record.ownerId,
      record.businessId,
      record.branchId,
    ].join("::");

    if (keys.has(key)) {
      return true;
    }

    keys.add(key);
  }

  return false;
}

function hasDuplicatePortablePricingPolicySequenceKeys(
  records: FinoraPortablePricingPolicySequenceStateRecord[],
): boolean {
  const keys = new Set<string>();

  for (const record of records) {
    const key = [
      record.issuerId,
      record.ownerId,
      record.businessId,
      record.branchId,
    ].join("::");

    if (keys.has(key)) {
      return true;
    }

    keys.add(key);
  }

  return false;
}

function hasDuplicatePortableStorageEntitlementSequenceKeys(
  records: FinoraPortableStorageEntitlementSequenceStateRecord[],
): boolean {
  const keys = new Set<string>();

  for (const record of records) {
    const key = [
      record.issuerId,
      record.ownerId,
      record.businessId,
      record.branchId,
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
    value.businessProfiles !== undefined &&
    (!Array.isArray(value.businessProfiles) ||
      !value.businessProfiles.every(isBusinessProfile) ||
      hasDuplicateBusinessProfileKeys(value.businessProfiles))
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // SIGNED PRICING POLICY STATE
  //
  // Optional only for backward compatibility with encrypted
  // Control Stores created before the Pricing Policy Engine.
  // ----------------------------------------------------------

  if (
    value.pricingPolicies !== undefined &&
    (!Array.isArray(value.pricingPolicies) ||
      !value.pricingPolicies.every(isPricingPolicy) ||
      hasDuplicatePricingPolicyKeys(value.pricingPolicies))
  ) {
    return false;
  }
  // ----------------------------------------------------------
  // SIGNED WALLET RECHARGE AUTHORIZATION STATE
  //
  // Optional only for backward compatibility with encrypted
  // Control Stores created before the Signed Recharge Engine.
  // ----------------------------------------------------------

  if (
    value.walletRechargeAuthorizations !== undefined &&
    (!Array.isArray(value.walletRechargeAuthorizations) ||
      !value.walletRechargeAuthorizations.every(
        isWalletRechargeAuthorization,
      ) ||
      hasDuplicateWalletRechargeAuthorizationKeys(
        value.walletRechargeAuthorizations,
      ))
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // ----------------------------------------------------------
  // SIGNED WALLET RECHARGE DECLINE STATE
  //
  // Optional for backward compatibility. A paymentReference
  // may never coexist as both APPROVED and DECLINED evidence.
  // ----------------------------------------------------------

  if (
    value.walletRechargeDeclines !== undefined &&
    (!Array.isArray(value.walletRechargeDeclines) ||
      !value.walletRechargeDeclines.every(isWalletRechargeDeclineEvidence) ||
      hasDuplicateWalletRechargeDeclineKeys(value.walletRechargeDeclines))
  ) {
    return false;
  }

  if (
    value.walletRechargeAuthorizations !== undefined &&
    value.walletRechargeDeclines !== undefined
  ) {
    const authorizedPaymentReferences = new Set(
      value.walletRechargeAuthorizations.map((item) => item.paymentReference),
    );

    if (
      value.walletRechargeDeclines.some((item) =>
        authorizedPaymentReferences.has(item.paymentReference),
      )
    ) {
      return false;
    }
  }
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

  // ----------------------------------------------------------
  // SIGNED CREDENTIAL ENROLLMENT AUTHORIZATION STATE
  // ----------------------------------------------------------

  const branchCredentialEnrollmentAuthorizations =
    value.branchCredentialEnrollmentAuthorizations;

  if (branchCredentialEnrollmentAuthorizations !== undefined) {
    if (
      !Array.isArray(branchCredentialEnrollmentAuthorizations) ||
      !branchCredentialEnrollmentAuthorizations.every(
        isBranchCredentialEnrollmentAuthorization,
      ) ||
      hasDuplicateBranchCredentialAuthorizationKeys(
        branchCredentialEnrollmentAuthorizations,
      )
    ) {
      return false;
    }
  }

  // ----------------------------------------------------------
  // LOCAL BRANCH CREDENTIAL STATE
  //
  // Optional only for backward compatibility with encrypted
  // Control Stores created before local credential authority.
  // ----------------------------------------------------------

  const branchCredentials = value.branchCredentials;

  if (branchCredentials !== undefined) {
    if (
      !Array.isArray(branchCredentials) ||
      !branchCredentials.every(isBranchCredential) ||
      hasDuplicateBranchCredentialKeys(branchCredentials)
    ) {
      return false;
    }
  }

  // ----------------------------------------------------------
  // PORTABLE BRANCH AUTH ENROLLMENT RECOVERY JOURNAL
  // ----------------------------------------------------------

  const branchCredentialPortabilityAuthorities =
    value.branchCredentialPortabilityAuthorities;

  if (branchCredentialPortabilityAuthorities !== undefined) {
    if (
      !Array.isArray(branchCredentialPortabilityAuthorities) ||
      !branchCredentialPortabilityAuthorities.every((item) =>
        isFinoraBranchCredentialPortabilityAuthorityProvenanceV1(item),
      ) ||
      hasDuplicateBranchCredentialPortabilityAuthorityProvenanceKeys(
        branchCredentialPortabilityAuthorities as FinoraBranchCredentialPortabilityAuthorityProvenanceV1[],
      )
    ) {
      return false;
    }
  }
  const portableBranchAuthEnrollmentTransactions =
    value.portableBranchAuthEnrollmentTransactions;

  if (portableBranchAuthEnrollmentTransactions !== undefined) {
    if (
      !Array.isArray(portableBranchAuthEnrollmentTransactions) ||
      !portableBranchAuthEnrollmentTransactions.every(
        isPortableBranchAuthEnrollmentTransaction,
      ) ||
      hasDuplicatePortableBranchAuthEnrollmentTransactionKeys(
        portableBranchAuthEnrollmentTransactions,
      )
    ) {
      return false;
    }
  }

  const portableBranchAuthCredentialRotationTransactions =
    value.portableBranchAuthCredentialRotationTransactions;

  if (portableBranchAuthCredentialRotationTransactions !== undefined) {
    if (
      !Array.isArray(portableBranchAuthCredentialRotationTransactions) ||
      !portableBranchAuthCredentialRotationTransactions.every(
        isPortableBranchAuthCredentialRotationTransaction,
      ) ||
      hasDuplicatePortableBranchAuthCredentialRotationTransactionIds(
        portableBranchAuthCredentialRotationTransactions,
      )
    ) {
      return false;
    }
  }

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
  // ----------------------------------------------------------
  // PORTABLE BRANCH_ACCESS MONOTONIC SEQUENCES
  //
  // Optional only for backward compatibility with encrypted
  // Control Stores created before BRANCH_ACCESS portability.
  //
  // This namespace is branch-scoped and deliberately excludes
  // installationId.
  // ----------------------------------------------------------

  const portableBranchAccessSequences = value.portableBranchAccessSequences;

  if (portableBranchAccessSequences !== undefined) {
    if (
      !Array.isArray(portableBranchAccessSequences) ||
      !portableBranchAccessSequences.every(
        isPortableBranchAccessSequenceStateRecord,
      ) ||
      hasDuplicatePortableBranchAccessSequenceKeys(
        portableBranchAccessSequences,
      )
    ) {
      return false;
    }
  }
  // PORTABLE BUSINESS_PROFILE MONOTONIC SEQUENCES
  //
  // Optional only for backward compatibility with encrypted
  // Control Stores created before BUSINESS_PROFILE portability.
  //
  // This namespace is branch-scoped and deliberately excludes
  // installationId.
  // ----------------------------------------------------------

  const portableBusinessProfileSequences =
    value.portableBusinessProfileSequences;

  if (portableBusinessProfileSequences !== undefined) {
    if (
      !Array.isArray(portableBusinessProfileSequences) ||
      !portableBusinessProfileSequences.every(
        isPortableBusinessProfileSequenceStateRecord,
      ) ||
      hasDuplicatePortableBusinessProfileSequenceKeys(
        portableBusinessProfileSequences,
      )
    ) {
      return false;
    }
  }

  const portablePricingPolicySequences =
    value.portablePricingPolicySequences;

  if (portablePricingPolicySequences !== undefined) {
    if (
      !Array.isArray(portablePricingPolicySequences) ||
      !portablePricingPolicySequences.every(
        isPortablePricingPolicySequenceStateRecord,
      ) ||
      hasDuplicatePortablePricingPolicySequenceKeys(
        portablePricingPolicySequences,
      )
    ) {
      return false;
    }
  }

  const portableStorageEntitlementSequences =
    value.portableStorageEntitlementSequences;

  if (portableStorageEntitlementSequences !== undefined) {
    if (
      !Array.isArray(portableStorageEntitlementSequences) ||
      !portableStorageEntitlementSequences.every(
        isPortableStorageEntitlementSequenceStateRecord,
      ) ||
      hasDuplicatePortableStorageEntitlementSequenceKeys(
        portableStorageEntitlementSequences,
      )
    ) {
      return false;
    }
  }


  if (value.branchCredentialAuthorizationVerificationEvidence !== undefined) {
    if (
      !Array.isArray(value.branchCredentialAuthorizationVerificationEvidence)
    ) {
      return false;
    }

    const verificationEvidenceInvalidIndex =
      value.branchCredentialAuthorizationVerificationEvidence.findIndex(
        (item) => !isBranchCredentialAuthorizationVerificationEvidence(item),
      );

    if (verificationEvidenceInvalidIndex >= 0) {
      return false;
    }

    const verificationEvidence =
      value.branchCredentialAuthorizationVerificationEvidence as FinoraBranchCredentialAuthorizationVerificationEvidence[];

    if (
      hasDuplicateBranchCredentialAuthorizationVerificationEvidenceKeys(
        verificationEvidence,
      )
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

function describeStorageEntitlementValidationFailure(value: unknown): string {
  if (!isRecord(value)) {
    return "NOT_OBJECT";
  }

  if (!isNonEmptyString(value.entitlementId)) {
    return "ENTITLEMENT_ID_INVALID";
  }

  if (!isNonEmptyString(value.userId)) {
    return "USER_ID_INVALID";
  }

  if (!isNonEmptyString(value.ownerId)) {
    return "OWNER_ID_INVALID";
  }

  if (!isNonEmptyString(value.businessId)) {
    return "BUSINESS_ID_INVALID";
  }

  if (!isNonEmptyString(value.branchId)) {
    return "BRANCH_ID_INVALID";
  }

  if (!isNonEmptyString(value.installationId)) {
    return "INSTALLATION_ID_INVALID";
  }

  if (!isNonEmptyString(value.bindingKeyId)) {
    return "BINDING_KEY_ID_INVALID";
  }

  if (value.fingerprintAlgorithm !== "SHA-256") {
    return "FINGERPRINT_ALGORITHM_INVALID";
  }

  if (!isStorageEntitlementFingerprint(value.publicKeyFingerprint)) {
    return "PUBLIC_KEY_FINGERPRINT_INVALID";
  }

  const expectedBindingKeyId = `FINORA-BINDING-${value.publicKeyFingerprint
    .slice(0, 32)
    .toUpperCase()}`;

  if (value.bindingKeyId !== expectedBindingKeyId) {
    return "BINDING_KEY_FINGERPRINT_MISMATCH";
  }

  if (!isStorageMode(value.storageMode)) {
    return "STORAGE_MODE_INVALID";
  }

  if (!isEntitlementStatus(value.status)) {
    return "STATUS_INVALID";
  }

  if (!isNonEmptyString(value.activatedAt)) {
    return "ACTIVATED_AT_INVALID";
  }

  if (!isNonEmptyString(value.createdAt)) {
    return "CREATED_AT_INVALID";
  }

  if (!isNonEmptyString(value.updatedAt)) {
    return "UPDATED_AT_INVALID";
  }

  if (value.schemaVersion !== 1) {
    return "SCHEMA_VERSION_INVALID";
  }

  return "UNKNOWN_STORAGE_ENTITLEMENT_FAILURE";
}

function describeControlStorePackageValidationFailure(value: unknown): string {
  if (!isRecord(value)) {
    return "ROOT_NOT_OBJECT";
  }

  if (value.version !== CONTROL_STORE_VERSION) {
    return "ROOT_VERSION_INVALID";
  }

  if (
    value.installation !== undefined &&
    !isInstallationIdentity(value.installation)
  ) {
    return "INSTALLATION_INVALID";
  }

  if (!Array.isArray(value.activations)) {
    return "ACTIVATIONS_NOT_ARRAY";
  }

  const activationInvalidIndex = value.activations.findIndex(
    (item) => !isBranchActivation(item),
  );

  if (activationInvalidIndex >= 0) {
    return `ACTIVATION_INVALID_INDEX_${activationInvalidIndex}`;
  }

  const activations = value.activations as FinoraControlBranchActivation[];

  if (hasDuplicateActivationKeys(activations)) {
    return "ACTIVATION_DUPLICATE_SCOPE";
  }

  if (!Array.isArray(value.storageEntitlements)) {
    return "STORAGE_ENTITLEMENTS_NOT_ARRAY";
  }

  const entitlementInvalidIndex = value.storageEntitlements.findIndex(
    (item) => !isStorageEntitlement(item),
  );

  if (entitlementInvalidIndex >= 0) {
    const entitlementFailure = describeStorageEntitlementValidationFailure(
      value.storageEntitlements[entitlementInvalidIndex],
    );

    return `STORAGE_ENTITLEMENT_INVALID_INDEX_${entitlementInvalidIndex}_${entitlementFailure}`;
  }

  const storageEntitlements =
    value.storageEntitlements as FinoraControlStorageEntitlement[];

  if (hasDuplicateEntitlementKeys(storageEntitlements)) {
    return "STORAGE_ENTITLEMENT_DUPLICATE_SCOPE";
  }

  if (value.businessProfiles !== undefined) {
    if (!Array.isArray(value.businessProfiles)) {
      return "BUSINESS_PROFILES_NOT_ARRAY";
    }

    const profileInvalidIndex = value.businessProfiles.findIndex(
      (item) => !isBusinessProfile(item),
    );

    if (profileInvalidIndex >= 0) {
      return `BUSINESS_PROFILE_INVALID_INDEX_${profileInvalidIndex}`;
    }

    const businessProfiles =
      value.businessProfiles as FinoraControlBusinessProfile[];

    if (hasDuplicateBusinessProfileKeys(businessProfiles)) {
      return "BUSINESS_PROFILE_DUPLICATE_IDENTITY";
    }
  }

  if (value.pricingPolicies !== undefined) {
    if (!Array.isArray(value.pricingPolicies)) {
      return "PRICING_POLICIES_NOT_ARRAY";
    }

    const pricingPolicyInvalidIndex = value.pricingPolicies.findIndex(
      (item) => !isPricingPolicy(item),
    );

    if (pricingPolicyInvalidIndex >= 0) {
      return `PRICING_POLICY_INVALID_INDEX_${pricingPolicyInvalidIndex}`;
    }

    const pricingPolicies =
      value.pricingPolicies as FinoraControlPricingPolicy[];

    if (hasDuplicatePricingPolicyKeys(pricingPolicies)) {
      return "PRICING_POLICY_DUPLICATE_IDENTITY";
    }
  }
  if (value.branchAccessGrants !== undefined) {
    if (!Array.isArray(value.branchAccessGrants)) {
      return "BRANCH_ACCESS_GRANTS_NOT_ARRAY";
    }

    const accessGrantInvalidIndex = value.branchAccessGrants.findIndex(
      (item) => !isBranchAccessGrant(item),
    );

    if (accessGrantInvalidIndex >= 0) {
      return `BRANCH_ACCESS_GRANT_INVALID_INDEX_${accessGrantInvalidIndex}`;
    }

    const branchAccessGrants =
      value.branchAccessGrants as FinoraControlBranchAccessGrant[];

    if (hasDuplicateBranchAccessKeys(branchAccessGrants)) {
      return "BRANCH_ACCESS_GRANT_DUPLICATE_SCOPE";
    }
  }

  if (value.branchCredentialEnrollmentAuthorizations !== undefined) {
    if (!Array.isArray(value.branchCredentialEnrollmentAuthorizations)) {
      return "BRANCH_CREDENTIAL_ENROLLMENT_AUTHORIZATIONS_NOT_ARRAY";
    }

    const credentialAuthorizationInvalidIndex =
      value.branchCredentialEnrollmentAuthorizations.findIndex(
        (item) => !isBranchCredentialEnrollmentAuthorization(item),
      );

    if (credentialAuthorizationInvalidIndex >= 0) {
      return `BRANCH_CREDENTIAL_ENROLLMENT_AUTHORIZATION_INVALID_INDEX_${credentialAuthorizationInvalidIndex}`;
    }

    const credentialAuthorizations =
      value.branchCredentialEnrollmentAuthorizations as FinoraBranchCredentialEnrollmentAuthorization[];

    if (
      hasDuplicateBranchCredentialAuthorizationKeys(credentialAuthorizations)
    ) {
      return "BRANCH_CREDENTIAL_ENROLLMENT_AUTHORIZATION_DUPLICATE";
    }
  }

  if (value.branchCredentialAuthorizationVerificationEvidence !== undefined) {
    if (
      !Array.isArray(value.branchCredentialAuthorizationVerificationEvidence)
    ) {
      return "BRANCH_CREDENTIAL_AUTHORIZATION_VERIFICATION_EVIDENCE_NOT_ARRAY";
    }

    const verificationEvidenceInvalidIndex =
      value.branchCredentialAuthorizationVerificationEvidence.findIndex(
        (item) => !isBranchCredentialAuthorizationVerificationEvidence(item),
      );

    if (verificationEvidenceInvalidIndex >= 0) {
      return `BRANCH_CREDENTIAL_AUTHORIZATION_VERIFICATION_EVIDENCE_INVALID_INDEX_${verificationEvidenceInvalidIndex}`;
    }

    const verificationEvidence =
      value.branchCredentialAuthorizationVerificationEvidence as FinoraBranchCredentialAuthorizationVerificationEvidence[];

    if (
      hasDuplicateBranchCredentialAuthorizationVerificationEvidenceKeys(
        verificationEvidence,
      )
    ) {
      return "BRANCH_CREDENTIAL_AUTHORIZATION_VERIFICATION_EVIDENCE_DUPLICATE";
    }
  }
  if (value.branchCredentialPortabilityAuthorities !== undefined) {
    if (!Array.isArray(value.branchCredentialPortabilityAuthorities)) {
      return "BRANCH_CREDENTIAL_PORTABILITY_AUTHORITIES_NOT_ARRAY";
    }

    const portabilityAuthorityInvalidIndex =
      value.branchCredentialPortabilityAuthorities.findIndex(
        (item) =>
          !isFinoraBranchCredentialPortabilityAuthorityProvenanceV1(item),
      );

    if (portabilityAuthorityInvalidIndex >= 0) {
      return `BRANCH_CREDENTIAL_PORTABILITY_AUTHORITY_INVALID_INDEX_${portabilityAuthorityInvalidIndex}`;
    }

    const portabilityAuthorities =
      value.branchCredentialPortabilityAuthorities as FinoraBranchCredentialPortabilityAuthorityProvenanceV1[];

    if (
      hasDuplicateBranchCredentialPortabilityAuthorityProvenanceKeys(
        portabilityAuthorities,
      )
    ) {
      return "BRANCH_CREDENTIAL_PORTABILITY_AUTHORITY_DUPLICATE";
    }
  }
  if (value.branchCredentials !== undefined) {
    if (!Array.isArray(value.branchCredentials)) {
      return "BRANCH_CREDENTIALS_NOT_ARRAY";
    }

    const branchCredentialInvalidIndex = value.branchCredentials.findIndex(
      (item) => !isBranchCredential(item),
    );

    if (branchCredentialInvalidIndex >= 0) {
      return `BRANCH_CREDENTIAL_INVALID_INDEX_${branchCredentialInvalidIndex}`;
    }

    const branchCredentials =
      value.branchCredentials as FinoraControlBranchCredential[];

    if (hasDuplicateBranchCredentialKeys(branchCredentials)) {
      return "BRANCH_CREDENTIAL_DUPLICATE";
    }
  }

  if (value.portableBranchAuthEnrollmentTransactions !== undefined) {
    if (!Array.isArray(value.portableBranchAuthEnrollmentTransactions)) {
      return "PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTIONS_NOT_ARRAY";
    }

    const portableTransactionInvalidIndex =
      value.portableBranchAuthEnrollmentTransactions.findIndex(
        (item) => !isPortableBranchAuthEnrollmentTransaction(item),
      );

    if (portableTransactionInvalidIndex >= 0) {
      return `PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_INVALID_INDEX_${portableTransactionInvalidIndex}`;
    }

    const portableTransactions =
      value.portableBranchAuthEnrollmentTransactions as FinoraPortableBranchAuthEnrollmentTransactionV1[];

    const transactionIds = new Set(
      portableTransactions.map((item) => item.transactionId),
    );

    if (transactionIds.size !== portableTransactions.length) {
      return "PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_ID_DUPLICATE";
    }

    const sourceAuthorizationIds = new Set(
      portableTransactions.map((item) => item.sourceAuthorizationId),
    );

    if (sourceAuthorizationIds.size !== portableTransactions.length) {
      return "PORTABLE_BRANCH_AUTH_ENROLLMENT_SOURCE_AUTHORIZATION_ID_DUPLICATE";
    }
  }

  if (value.portableBranchAuthCredentialRotationTransactions !== undefined) {
    if (
      !Array.isArray(value.portableBranchAuthCredentialRotationTransactions)
    ) {
      return "PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTIONS_NOT_ARRAY";
    }

    const rotationTransactionInvalidIndex =
      value.portableBranchAuthCredentialRotationTransactions.findIndex(
        (item) => !isPortableBranchAuthCredentialRotationTransaction(item),
      );

    if (rotationTransactionInvalidIndex >= 0) {
      return `PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_INVALID_INDEX_${rotationTransactionInvalidIndex}`;
    }

    const rotationTransactions =
      value.portableBranchAuthCredentialRotationTransactions as FinoraPortableBranchAuthCredentialRotationTransactionV1[];

    if (
      hasDuplicatePortableBranchAuthCredentialRotationTransactionIds(
        rotationTransactions,
      )
    ) {
      return "PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_DUPLICATE";
    }
  }

  if (value.appliedControlPackages !== undefined) {
    if (!Array.isArray(value.appliedControlPackages)) {
      return "APPLIED_CONTROL_PACKAGES_NOT_ARRAY";
    }

    const appliedInvalidIndex = value.appliedControlPackages.findIndex(
      (item) => !isAppliedControlPackageRecord(item),
    );

    if (appliedInvalidIndex >= 0) {
      return `APPLIED_CONTROL_PACKAGE_INVALID_INDEX_${appliedInvalidIndex}`;
    }

    const appliedControlPackages =
      value.appliedControlPackages as FinoraControlAppliedPackageRecord[];

    if (hasDuplicateAppliedPackageIds(appliedControlPackages)) {
      return "APPLIED_CONTROL_PACKAGE_DUPLICATE_ID";
    }
  }

  if (value.controlSequences !== undefined) {
    if (!Array.isArray(value.controlSequences)) {
      return "CONTROL_SEQUENCES_NOT_ARRAY";
    }

    const sequenceInvalidIndex = value.controlSequences.findIndex(
      (item) => !isControlSequenceStateRecord(item),
    );

    if (sequenceInvalidIndex >= 0) {
      return `CONTROL_SEQUENCE_INVALID_INDEX_${sequenceInvalidIndex}`;
    }

    const controlSequences =
      value.controlSequences as FinoraControlSequenceStateRecord[];

    if (hasDuplicateControlSequenceKeys(controlSequences)) {
      return "CONTROL_SEQUENCE_DUPLICATE_SCOPE";
    }
  }
  if (value.portableBranchAccessSequences !== undefined) {
    if (!Array.isArray(value.portableBranchAccessSequences)) {
      return "PORTABLE_BRANCH_ACCESS_SEQUENCES_NOT_ARRAY";
    }

    const portableSequenceInvalidIndex =
      value.portableBranchAccessSequences.findIndex(
        (item) => !isPortableBranchAccessSequenceStateRecord(item),
      );

    if (portableSequenceInvalidIndex >= 0) {
      return `PORTABLE_BRANCH_ACCESS_SEQUENCE_INVALID_INDEX_${portableSequenceInvalidIndex}`;
    }

    const portableBranchAccessSequences =
      value.portableBranchAccessSequences as FinoraPortableBranchAccessSequenceStateRecord[];

    if (
      hasDuplicatePortableBranchAccessSequenceKeys(
        portableBranchAccessSequences,
      )
    ) {
      return "PORTABLE_BRANCH_ACCESS_SEQUENCE_DUPLICATE_SCOPE";
    }
  }

  if (value.portableBusinessProfileSequences !== undefined) {
    if (!Array.isArray(value.portableBusinessProfileSequences)) {
      return "PORTABLE_BUSINESS_PROFILE_SEQUENCES_NOT_ARRAY";
    }

    const portableSequenceInvalidIndex =
      value.portableBusinessProfileSequences.findIndex(
        (item) => !isPortableBusinessProfileSequenceStateRecord(item),
      );

    if (portableSequenceInvalidIndex >= 0) {
      return `PORTABLE_BUSINESS_PROFILE_SEQUENCE_INVALID_INDEX_${portableSequenceInvalidIndex}`;
    }

    const portableBusinessProfileSequences =
      value.portableBusinessProfileSequences as FinoraPortableBusinessProfileSequenceStateRecord[];

    if (
      hasDuplicatePortableBusinessProfileSequenceKeys(
        portableBusinessProfileSequences,
      )
    ) {
      return "PORTABLE_BUSINESS_PROFILE_SEQUENCE_DUPLICATE_SCOPE";
    }
  }

  if (value.portablePricingPolicySequences !== undefined) {
    if (!Array.isArray(value.portablePricingPolicySequences)) {
      return "PORTABLE_PRICING_POLICY_SEQUENCES_NOT_ARRAY";
    }

    const portableSequenceInvalidIndex =
      value.portablePricingPolicySequences.findIndex(
        (item) => !isPortablePricingPolicySequenceStateRecord(item),
      );

    if (portableSequenceInvalidIndex >= 0) {
      return `PORTABLE_PRICING_POLICY_SEQUENCE_INVALID_INDEX_${portableSequenceInvalidIndex}`;
    }

    const portablePricingPolicySequences =
      value.portablePricingPolicySequences as FinoraPortablePricingPolicySequenceStateRecord[];

    if (
      hasDuplicatePortablePricingPolicySequenceKeys(
        portablePricingPolicySequences,
      )
    ) {
      return "PORTABLE_PRICING_POLICY_SEQUENCE_DUPLICATE_SCOPE";
    }
  }

  if (value.portableStorageEntitlementSequences !== undefined) {
    if (!Array.isArray(value.portableStorageEntitlementSequences)) {
      return "PORTABLE_STORAGE_ENTITLEMENT_SEQUENCES_NOT_ARRAY";
    }

    const portableSequenceInvalidIndex =
      value.portableStorageEntitlementSequences.findIndex(
        (item) => !isPortableStorageEntitlementSequenceStateRecord(item),
      );

    if (portableSequenceInvalidIndex >= 0) {
      return `PORTABLE_STORAGE_ENTITLEMENT_SEQUENCE_INVALID_INDEX_${portableSequenceInvalidIndex}`;
    }

    const portableStorageEntitlementSequences =
      value.portableStorageEntitlementSequences as FinoraPortableStorageEntitlementSequenceStateRecord[];

    if (
      hasDuplicatePortableStorageEntitlementSequenceKeys(
        portableStorageEntitlementSequences,
      )
    ) {
      return "PORTABLE_STORAGE_ENTITLEMENT_SEQUENCE_DUPLICATE_SCOPE";
    }
  }

  if (!isNonEmptyString(value.updatedAt)) {
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

    pricingPolicies: [],

    walletRechargeAuthorizations: [],

    walletRechargeDeclines: [],

    branchAccessGrants: [],

    branchCredentialEnrollmentAuthorizations: [],

    branchCredentialAuthorizationVerificationEvidence: [],

    branchCredentialPortabilityAuthorities: [],

    branchCredentials: [],

    portableBranchAuthEnrollmentTransactions: [],

    portableBranchAuthCredentialRotationTransactions: [],

    appliedControlPackages: [],

    controlSequences: [],

    portableBranchAccessSequences: [],

    portableBusinessProfileSequences: [],

    portablePricingPolicySequences: [],

    portableStorageEntitlementSequences: [],

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
      if (process.env.FINORA_DEV_CONTROL_STORE_DIAGNOSTICS === "1") {
        console.error(
          "[FINORA CONTROL DIAG]",
          describeControlStorePackageValidationFailure(parsed),
        );
      }

      return failure("FINORA Control Store package validation failed.");
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

export async function getFinoraInstallationIdentityForBindingReconciliation(): Promise<
  FinoraControlStoreResult<FinoraControlInstallationIdentity | undefined>
> {
  try {
    if (!(await controlFileExists())) {
      return success(undefined);
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

    if (!isRecord(parsed)) {
      return failure(
        "FINORA Control Store root structure is invalid for installation binding reconciliation.",
      );
    }

    if (parsed.version !== CONTROL_STORE_VERSION) {
      return failure(
        "FINORA Control Store version is invalid for installation binding reconciliation.",
      );
    }

    if (parsed.installation === undefined) {
      return success(undefined);
    }

    if (!isInstallationIdentity(parsed.installation)) {
      return failure(
        "FINORA Control Store installation identity is invalid for binding reconciliation.",
      );
    }

    return success(parsed.installation);
  } catch (error) {
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

  action: "ISSUE" | "RENEW" | "REPLACE" | "SUSPEND" | "RESUME" | "REVOKE";

  sequence: number;

  target: {
    ownerId: string;

    businessId: string;

    branchId: string;

    installationId: string;
  };

  activation: FinoraControlBranchActivation;

  appliedAt: string;
}

export interface FinoraVerifiedBranchActivationApplyResult {
  activation: FinoraControlBranchActivation;
}

// ============================================================
// VERIFIED BRANCH ACCESS APPLY CONTRACT
// ============================================================

export interface FinoraVerifiedBranchAccessApplyInput {
  packageId: string;

  issuerId: string;

  purpose: "BRANCH_ACCESS";

  action: "ISSUE" | "RENEW" | "REPLACE" | "SUSPEND" | "RESUME" | "REVOKE";

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

  accessGrant: FinoraControlBranchAccessGrant;

  credentialEnrollmentAuthorization?: FinoraBranchCredentialEnrollmentAuthorization;

  verifiedControlSigner?: FinoraBranchTrustedControlPublicKey;

  credentialPortabilityAuthorityProvenance?: FinoraBranchCredentialPortabilityAuthorityProvenanceV1;

  appliedAt: string;
}

export interface FinoraVerifiedBranchCredentialAuthorizationApplyInput {
  packageId: string;

  issuerId: string;

  purpose: "BRANCH_ACCESS";

  sequence: number;

  action: "AUTHORIZE_CREDENTIAL";

  target: FinoraVerifiedBranchAccessApplyInput["target"];

  credentialEnrollmentAuthorization: FinoraBranchCredentialEnrollmentAuthorization;

  verifiedControlSigner: FinoraBranchTrustedControlPublicKey;

  credentialPortabilityAuthorityProvenance?: FinoraBranchCredentialPortabilityAuthorityProvenanceV1;

  appliedAt: string;
}

export interface FinoraVerifiedBranchAccessApplyResult {
  accessGrant: FinoraControlBranchAccessGrant;

  credentialEnrollmentAuthorization?: FinoraBranchCredentialEnrollmentAuthorization;
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

export type FinoraBusinessProfileSequenceAuthority =
  | "NATIVE_INSTALLATION"
  | "PORTABLE_BRANCH";

export interface FinoraVerifiedBusinessProfileApplyInput {
  packageId: string;

  issuerId: string;

  purpose: "BUSINESS_PROFILE";

  sequence: number;

  action: "ISSUE" | "REPLACE";

  target: {
    ownerId: string;

    businessId: string;

    branchId: string;

    installationId: string;
  };

  profile: FinoraControlBusinessProfile;

  appliedAt: string;
}

export interface FinoraVerifiedBusinessProfileApplyResult {
  profile: FinoraControlBusinessProfile;
}

let controlPackageApplyQueue: Promise<void> = Promise.resolve();

export function runFinoraControlPackageApplySerialized<T>(
  operation: () => Promise<T>,
): Promise<T> {
  const result = controlPackageApplyQueue.then(operation, operation);
  controlPackageApplyQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export interface FinoraDeviceRevocationReplayInput {
  packageId: string;
  issuerId: string;
  purpose: "DEVICE_REVOCATION";
  sequence: number;
  target: { ownerId: string; businessId: string; branchId: string; installationId: string };
  appliedAt: string;
}

export interface FinoraDeviceRevocationReplayPrecheckResult {
  accepted: true;
}

export async function precheckFinoraDeviceRevocationReplay(
  input: FinoraDeviceRevocationReplayInput,
): Promise<FinoraControlStoreResult<FinoraDeviceRevocationReplayPrecheckResult>> {
  if (!isNonEmptyString(input.packageId) || !isNonEmptyString(input.issuerId) || input.purpose !== "DEVICE_REVOCATION" || !Number.isSafeInteger(input.sequence) || input.sequence <= 0 || !isControlTimestamp(input.appliedAt) || !isNonEmptyString(input.target.ownerId) || !isNonEmptyString(input.target.businessId) || !isNonEmptyString(input.target.branchId) || !isNonEmptyString(input.target.installationId)) {
    return failure("A valid FINORA Device Revocation replay input is required.");
  }
  const currentResult = await readFinoraControlStore();
  if (!currentResult.success || !currentResult.data) return failure(currentResult.error ?? "Unable to load the FINORA Control Store.");
  const decision = evaluateFinoraControlReplay({ packageId: input.packageId, issuerId: input.issuerId, purpose: input.purpose, sequence: input.sequence, ownerId: input.target.ownerId, businessId: input.target.businessId, branchId: input.target.branchId, installationId: input.target.installationId }, currentResult.data.appliedControlPackages ?? [], currentResult.data.controlSequences ?? []);
  if (!decision.accepted) return failure(`${decision.reason}: ${decision.error}`);
  return success({ accepted: true });
}

export interface FinoraDeviceRevocationReplayCommitResult {
  committed: true;
}

export async function commitFinoraDeviceRevocationReplay(
  input: FinoraDeviceRevocationReplayInput,
): Promise<FinoraControlStoreResult<FinoraDeviceRevocationReplayCommitResult>> {
  if (!isNonEmptyString(input.packageId) || !isNonEmptyString(input.issuerId) || input.purpose !== "DEVICE_REVOCATION" || !Number.isSafeInteger(input.sequence) || input.sequence <= 0 || !isControlTimestamp(input.appliedAt) || !isNonEmptyString(input.target.ownerId) || !isNonEmptyString(input.target.businessId) || !isNonEmptyString(input.target.branchId) || !isNonEmptyString(input.target.installationId)) {
    return failure("A valid FINORA Device Revocation replay commit input is required.");
  }

  const currentResult = await readFinoraControlStore();
  if (!currentResult.success || !currentResult.data) return failure(currentResult.error ?? "Unable to load the FINORA Control Store.");

  const controlStore = currentResult.data;
  const appliedPackages = controlStore.appliedControlPackages ?? [];
  const sequenceStates = controlStore.controlSequences ?? [];
  const decision = evaluateFinoraControlReplay({ packageId: input.packageId, issuerId: input.issuerId, purpose: input.purpose, sequence: input.sequence, ownerId: input.target.ownerId, businessId: input.target.businessId, branchId: input.target.branchId, installationId: input.target.installationId }, appliedPackages, sequenceStates);
  if (!decision.accepted) return failure(`${decision.reason}: ${decision.error}`);

  appliedPackages.push({ packageId: input.packageId, issuerId: input.issuerId, purpose: input.purpose, sequence: input.sequence, ownerId: input.target.ownerId, businessId: input.target.businessId, branchId: input.target.branchId, installationId: input.target.installationId, appliedAt: input.appliedAt });

  const sequenceIndex = sequenceStates.findIndex((item) => item.issuerId === input.issuerId && item.purpose === input.purpose && item.ownerId === input.target.ownerId && item.businessId === input.target.businessId && item.branchId === input.target.branchId && item.installationId === input.target.installationId);
  const nextSequenceState: FinoraControlSequenceStateRecord = { issuerId: input.issuerId, purpose: input.purpose, ownerId: input.target.ownerId, businessId: input.target.businessId, branchId: input.target.branchId, installationId: input.target.installationId, lastSequence: input.sequence, updatedAt: input.appliedAt };
  if (sequenceIndex >= 0) sequenceStates[sequenceIndex] = nextSequenceState; else sequenceStates.push(nextSequenceState);

  controlStore.appliedControlPackages = appliedPackages;
  controlStore.controlSequences = sequenceStates;
  controlStore.updatedAt = input.appliedAt;

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Unable to atomically persist FINORA Device Revocation replay authority.");
  }

  return success({ committed: true });
}

async function applyVerifiedBranchActivationInternal(
  input: FinoraVerifiedBranchActivationApplyInput,
): Promise<
  FinoraControlStoreResult<FinoraVerifiedBranchActivationApplyResult>
> {
  if (
    !isNonEmptyString(input.packageId) ||
    !isNonEmptyString(input.issuerId) ||
    input.purpose !== "BRANCH_ACTIVATION" ||
    (input.action !== "ISSUE" &&
      input.action !== "RENEW" &&
      input.action !== "REPLACE" &&
      input.action !== "SUSPEND" &&
      input.action !== "RESUME" &&
      input.action !== "REVOKE") ||
    !Number.isSafeInteger(input.sequence) ||
    input.sequence <= 0 ||
    !isControlTimestamp(input.appliedAt) ||
    !isBranchActivation(input.activation) ||
    input.activation.status !== "ACTIVE"
  ) {
    return failure(
      "A valid verified FINORA Branch Activation package is required.",
    );
  }

  if (String(input.action) !== "ISSUE") {
    return failure(
      "FINORA BRANCH_ACTIVATION accepts only ISSUE. Access lifecycle actions must use BRANCH_ACCESS.",
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
    input.activation.branchId !== input.target.branchId
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

  const isStatusAction =
    input.action === "SUSPEND" ||
    input.action === "RESUME" ||
    input.action === "REVOKE";

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

    if (
      isStatusAction &&
      (existingActivation.activationId !== input.activation.activationId ||
        existingActivation.ownerId !== input.activation.ownerId ||
        existingActivation.businessId !== input.activation.businessId ||
        existingActivation.branchId !== input.activation.branchId ||
        existingActivation.status !== input.activation.status ||
        existingActivation.activatedAt !== input.activation.activatedAt ||
        existingActivation.createdAt !== input.activation.createdAt ||
        existingActivation.updatedAt !== input.activation.updatedAt ||
        existingActivation.schemaVersion !== input.activation.schemaVersion)
    ) {
      return failure(
        "FINORA Branch Access status action cannot modify the Branch Activation record.",
      );
    }

    controlStore.activations[activationIndex] = input.activation;
  } else {
    if (isStatusAction) {
      return failure(
        "FINORA Branch Access status action requires an existing Branch Activation.",
      );
    }

    controlStore.activations.push(input.activation);
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

  controlStore.appliedControlPackages = appliedPackages;

  controlStore.controlSequences = sequenceStates;

  controlStore.updatedAt = input.appliedAt;

  // ----------------------------------------------------------
  // ONE ENCRYPTED ATOMIC FILE REPLACEMENT
  //
  // activation + replay ledger + sequence are
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

// ============================================================
// BRANCH ACCESS SEQUENCE AUTHORITY
// ============================================================

export type FinoraBranchAccessSequenceAuthority =
  | "NATIVE_INSTALLATION"
  | "PORTABLE_BRANCH";

export function evaluateFinoraPortableBranchAccessSequence(
  input: {
    packageId: string;

    issuerId: string;

    sequence: number;

    ownerId: string;

    businessId: string;

    branchId: string;
  },

  appliedPackages: readonly FinoraControlAppliedPackageRecord[],

  sequenceStates: readonly FinoraControlSequenceStateRecord[],

  portableSequenceStates: readonly FinoraPortableBranchAccessSequenceStateRecord[],
) {
  /*
   * packageId replay remains global across every signed
   * control-package purpose and sequence namespace.
   */
  const replayed = appliedPackages.some(
    (record) => record.packageId === input.packageId,
  );

  if (replayed) {
    return {
      accepted: false as const,

      reason: "REPLAYED_PACKAGE" as const,

      error: "FINORA Control Package has already been applied.",
    };
  }

  /*
   * Historical native BRANCH_ACCESS rows remain physically
   * installation-scoped. Portable evaluation folds all matching
   * historical installations into one branch high-water.
   */
  let legacyHighWater = 0;

  for (const state of sequenceStates) {
    if (
      state.issuerId === input.issuerId &&
      state.purpose === "BRANCH_ACCESS" &&
      state.ownerId === input.ownerId &&
      state.businessId === input.businessId &&
      state.branchId === input.branchId
    ) {
      legacyHighWater = Math.max(legacyHighWater, state.lastSequence);
    }
  }

  const portableState = portableSequenceStates.find(
    (state) =>
      state.issuerId === input.issuerId &&
      state.ownerId === input.ownerId &&
      state.businessId === input.businessId &&
      state.branchId === input.branchId,
  );

  const portableHighWater = portableState?.lastSequence ?? 0;

  const previousSequence = Math.max(legacyHighWater, portableHighWater);

  if (input.sequence <= previousSequence) {
    return {
      accepted: false as const,

      reason: "STALE_SEQUENCE" as const,

      error: "FINORA Control Package sequence is stale.",

      previousSequence,
    };
  }

  return {
    accepted: true as const,

    previousSequence: previousSequence > 0 ? previousSequence : undefined,
  };
}
// ============================================================
// VERIFIED BRANCH ACCESS ATOMIC APPLY
// ============================================================

async function applyVerifiedBranchAccessInternal(
  input: FinoraVerifiedBranchAccessApplyInput,

  sequenceAuthority: FinoraBranchAccessSequenceAuthority,
): Promise<FinoraControlStoreResult<FinoraVerifiedBranchAccessApplyResult>> {
  const fingerprintValid = /^[0-9a-f]{64}$/.test(
    input.target.publicKeyFingerprint,
  );

  const expectedBindingKeyId = fingerprintValid
    ? `FINORA-BINDING-${input.target.publicKeyFingerprint
        .slice(0, 32)
        .toUpperCase()}`
    : undefined;

  if (
    !isNonEmptyString(input.packageId) ||
    !isNonEmptyString(input.issuerId) ||
    input.purpose !== "BRANCH_ACCESS" ||
    (input.action !== "ISSUE" &&
      input.action !== "RENEW" &&
      input.action !== "REPLACE" &&
      input.action !== "SUSPEND" &&
      input.action !== "RESUME" &&
      input.action !== "REVOKE") ||
    !Number.isSafeInteger(input.sequence) ||
    input.sequence <= 0 ||
    !isControlTimestamp(input.appliedAt) ||
    !isNonEmptyString(input.target.ownerId) ||
    !isNonEmptyString(input.target.businessId) ||
    !isNonEmptyString(input.target.branchId) ||
    !isNonEmptyString(input.target.installationId) ||
    !isNonEmptyString(input.target.bindingKeyId) ||
    input.target.fingerprintAlgorithm !== "SHA-256" ||
    !expectedBindingKeyId ||
    input.target.bindingKeyId !== expectedBindingKeyId ||
    !isBranchAccessGrant(input.accessGrant) ||
    (input.credentialEnrollmentAuthorization !== undefined &&
      !isBranchCredentialEnrollmentAuthorization(
        input.credentialEnrollmentAuthorization,
      ))
  ) {
    return failure(
      "A valid verified FINORA Branch Access package is required.",
    );
  }

  if (
    sequenceAuthority === "PORTABLE_BRANCH" &&
    input.credentialEnrollmentAuthorization !== undefined
  ) {
    return failure(
      "FINORA portable BRANCH_ACCESS lifecycle apply cannot carry credential enrollment authority.",
    );
  }
  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const installation = controlStore.installation;

  if (
    !installation ||
    installation.ownerId !== input.target.ownerId ||
    installation.businessId !== input.target.businessId ||
    installation.branchId !== input.target.branchId ||
    (sequenceAuthority === "NATIVE_INSTALLATION" &&
      installation.installationId !== input.target.installationId)
  ) {
    return failure(
      sequenceAuthority === "PORTABLE_BRANCH"
        ? "FINORA Branch Access target does not match this branch."
        : "FINORA Branch Access target does not match this installation.",
    );
  }

  if (
    input.accessGrant.ownerId !== input.target.ownerId ||
    input.accessGrant.businessId !== input.target.businessId ||
    input.accessGrant.branchId !== input.target.branchId
  ) {
    return failure(
      "FINORA Branch Access Grant does not match the verified package target.",
    );
  }

  const credentialAuthorization = input.credentialEnrollmentAuthorization;
  const verifiedControlSigner = input.verifiedControlSigner;

  const credentialPortabilityAuthorityProvenance =
    input.credentialPortabilityAuthorityProvenance;

  /*
   * Credential enrollment authority must carry the exact
   * public Control Center key selected by the successful native
   * package verifier.
   *
   * Ordinary BRANCH_ACCESS mutations without credential
   * enrollment must not smuggle unrelated signer evidence into
   * this state boundary.
   */
  if (credentialAuthorization === undefined) {
    if (
      verifiedControlSigner !== undefined ||
      credentialPortabilityAuthorityProvenance !== undefined
    ) {
      return failure(
        "FINORA verified Control signer evidence is valid only with credential enrollment authority.",
      );
    }
  } else if (
    !verifiedControlSigner ||
    !isNonEmptyString(verifiedControlSigner.issuerId) ||
    verifiedControlSigner.issuerId !== input.issuerId ||
    !isNonEmptyString(verifiedControlSigner.signingKeyId) ||
    verifiedControlSigner.algorithm !== "ECDSA_P256_SHA256" ||
    verifiedControlSigner.format !== "SPKI_DER_BASE64" ||
    !isNonEmptyString(verifiedControlSigner.publicKey) ||
    (verifiedControlSigner.status !== "ACTIVE" &&
      verifiedControlSigner.status !== "RETIRED") ||
    !isControlTimestamp(verifiedControlSigner.validFrom) ||
    (verifiedControlSigner.validUntil !== undefined &&
      !isControlTimestamp(verifiedControlSigner.validUntil))
  ) {
    return failure(
      "FINORA credential enrollment requires exact verified Control Center signer evidence.",
    );
  }

  if (credentialPortabilityAuthorityProvenance !== undefined) {
    if (
      credentialAuthorization === undefined ||
      !verifiedControlSigner ||
      !isFinoraBranchCredentialPortabilityAuthorityProvenanceV1(
        credentialPortabilityAuthorityProvenance,
      )
    ) {
      return failure(
        "FINORA credential portability authority provenance is invalid.",
      );
    }

    const signedPortabilityAuthorityPackage =
      credentialPortabilityAuthorityProvenance.signedPortabilityAuthorityPackage;

    const portabilityPayload = signedPortabilityAuthorityPackage.payload;

    const portabilitySigner =
      credentialPortabilityAuthorityProvenance.verifiedControlSigner;

    const signerMatchesExactly =
      portabilitySigner.issuerId === verifiedControlSigner.issuerId &&
      portabilitySigner.signingKeyId === verifiedControlSigner.signingKeyId &&
      portabilitySigner.algorithm === verifiedControlSigner.algorithm &&
      portabilitySigner.format === verifiedControlSigner.format &&
      portabilitySigner.publicKey === verifiedControlSigner.publicKey &&
      portabilitySigner.status === verifiedControlSigner.status &&
      portabilitySigner.validFrom === verifiedControlSigner.validFrom &&
      portabilitySigner.validUntil === verifiedControlSigner.validUntil;

    const credentialLineageMatches =
      portabilityPayload.sourceAuthorizationId ===
        credentialAuthorization.authorizationId &&
      portabilityPayload.userId === credentialAuthorization.userId &&
      portabilityPayload.username === credentialAuthorization.username &&
      portabilityPayload.role === credentialAuthorization.role &&
      portabilityPayload.ownerId === credentialAuthorization.ownerId &&
      portabilityPayload.businessId === credentialAuthorization.businessId &&
      portabilityPayload.branchId === credentialAuthorization.branchId &&
      portabilityPayload.storageMode === credentialAuthorization.storageMode &&
      portabilityPayload.dataContext === credentialAuthorization.dataContext &&
      portabilityPayload.sourceAuthorizationMethod ===
        credentialAuthorization.method &&
      (credentialAuthorization.dataContext === "DEMO"
        ? portabilityPayload.demoId === credentialAuthorization.demoId
        : portabilityPayload.demoId === undefined);

    if (
      credentialPortabilityAuthorityProvenance.sourceAuthorizationId !==
        credentialAuthorization.authorizationId ||
      credentialPortabilityAuthorityProvenance.verifiedAt !== input.appliedAt ||
      signedPortabilityAuthorityPackage.target.ownerId !==
        credentialAuthorization.ownerId ||
      signedPortabilityAuthorityPackage.target.businessId !==
        credentialAuthorization.businessId ||
      signedPortabilityAuthorityPackage.target.branchId !==
        credentialAuthorization.branchId ||
      signedPortabilityAuthorityPackage.issuer.issuerId !== input.issuerId ||
      !credentialLineageMatches ||
      !signerMatchesExactly
    ) {
      return failure(
        "FINORA credential portability authority provenance does not match the verified credential authorization lineage.",
      );
    }
  }
  if (credentialAuthorization !== undefined) {
    const expectedDataContext =
      input.accessGrant.accessType === "DEMO" ? "DEMO" : "REAL";

    if (
      (input.action !== "ISSUE" && input.action !== "REPLACE") ||
      credentialAuthorization.userId !== input.accessGrant.userId ||
      credentialAuthorization.ownerId !== input.accessGrant.ownerId ||
      credentialAuthorization.businessId !== input.accessGrant.businessId ||
      credentialAuthorization.branchId !== input.accessGrant.branchId ||
      credentialAuthorization.storageMode !== input.accessGrant.storageMode ||
      credentialAuthorization.dataContext !== expectedDataContext ||
      (input.accessGrant.accessType === "DEMO"
        ? credentialAuthorization.demoId !== input.accessGrant.demoId
        : credentialAuthorization.demoId !== undefined)
    ) {
      return failure(
        "FINORA credential enrollment authorization does not match the verified Branch Access grant.",
      );
    }
  }

  const appliedPackages = controlStore.appliedControlPackages ?? [];

  const sequenceStates = controlStore.controlSequences ?? [];

  const portableSequenceStates =
    controlStore.portableBranchAccessSequences ?? [];

  const replayDecision =
    sequenceAuthority === "PORTABLE_BRANCH"
      ? evaluateFinoraPortableBranchAccessSequence(
          {
            packageId: input.packageId,

            issuerId: input.issuerId,

            sequence: input.sequence,

            ownerId: input.target.ownerId,

            businessId: input.target.businessId,

            branchId: input.target.branchId,
          },
          appliedPackages,
          sequenceStates,
          portableSequenceStates,
        )
      : evaluateFinoraControlReplay(
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

  const accessGrants = controlStore.branchAccessGrants ?? [];

  const accessIndex = accessGrants.findIndex(
    (item) =>
      item.userId === input.accessGrant.userId &&
      item.ownerId === input.accessGrant.ownerId &&
      item.businessId === input.accessGrant.businessId &&
      item.branchId === input.accessGrant.branchId,
  );

  const existingAccessGrant =
    accessIndex >= 0 ? accessGrants[accessIndex] : undefined;

  const nextAdministrativeStatus = input.accessGrant.administrativeStatus;

  if (
    (input.action === "ISSUE" && nextAdministrativeStatus !== "ACTIVE") ||
    (input.action === "SUSPEND" && nextAdministrativeStatus !== "SUSPENDED") ||
    (input.action === "RESUME" && nextAdministrativeStatus !== "ACTIVE") ||
    (input.action === "REVOKE" && nextAdministrativeStatus !== "REVOKED")
  ) {
    return failure(
      "FINORA Branch Access action does not match the administrative status.",
    );
  }

  if (
    input.action === "RENEW" &&
    input.accessGrant.accessType !== "REGISTERED"
  ) {
    return failure("FINORA RENEW action is valid only for REGISTERED access.");
  }

  if (input.action === "ISSUE") {
    if (existingAccessGrant) {
      return failure(
        "FINORA ISSUE action requires that no current Branch Access grant exists for this scope.",
      );
    }
  } else if (!existingAccessGrant) {
    return failure(
      "FINORA Branch Access lifecycle action requires an existing current grant.",
    );
  }

  const isStatusAction =
    input.action === "SUSPEND" ||
    input.action === "RESUME" ||
    input.action === "REVOKE";

  if (existingAccessGrant) {
    const currentAdministrativeStatus =
      existingAccessGrant.administrativeStatus;

    if (
      currentAdministrativeStatus === "REVOKED" &&
      nextAdministrativeStatus !== "REVOKED"
    ) {
      return failure(
        "FINORA revoked Branch Access is terminal and cannot become active or suspended again.",
      );
    }

    if (
      input.action === "RENEW" &&
      existingAccessGrant.accessType !== "REGISTERED"
    ) {
      return failure(
        "FINORA RENEW action requires existing REGISTERED access.",
      );
    }

    if (
      input.action === "REPLACE" &&
      existingAccessGrant.accessType === "REGISTERED" &&
      input.accessGrant.accessType === "DEMO"
    ) {
      return failure(
        "FINORA REGISTERED access cannot be replaced with DEMO access.",
      );
    }

    if (
      existingAccessGrant.accessType !== input.accessGrant.accessType &&
      input.action !== "REPLACE"
    ) {
      return failure(
        "FINORA Branch Access type can change only through the signed REPLACE action.",
      );
    }

    if (
      (input.action === "SUSPEND" &&
        currentAdministrativeStatus !== "ACTIVE") ||
      (input.action === "RESUME" &&
        currentAdministrativeStatus !== "SUSPENDED") ||
      (input.action === "REVOKE" &&
        currentAdministrativeStatus !== "ACTIVE" &&
        currentAdministrativeStatus !== "SUSPENDED") ||
      ((input.action === "RENEW" || input.action === "REPLACE") &&
        nextAdministrativeStatus !== currentAdministrativeStatus)
    ) {
      return failure(
        "FINORA signed Branch Access administrative status transition is invalid.",
      );
    }

    if (isStatusAction) {
      const currentPayment = existingAccessGrant.registrationPayment;

      const nextPayment = input.accessGrant.registrationPayment;

      const registrationPaymentMatches =
        currentPayment === undefined
          ? nextPayment === undefined
          : nextPayment !== undefined &&
            currentPayment.amount === nextPayment.amount &&
            currentPayment.currency === nextPayment.currency &&
            currentPayment.paymentMode === nextPayment.paymentMode &&
            currentPayment.paidAt === nextPayment.paidAt &&
            currentPayment.reference === nextPayment.reference &&
            currentPayment.remarks === nextPayment.remarks &&
            currentPayment.refundable === nextPayment.refundable;

      if (
        existingAccessGrant.grantId !== input.accessGrant.grantId ||
        existingAccessGrant.userId !== input.accessGrant.userId ||
        existingAccessGrant.ownerId !== input.accessGrant.ownerId ||
        existingAccessGrant.businessId !== input.accessGrant.businessId ||
        existingAccessGrant.branchId !== input.accessGrant.branchId ||
        existingAccessGrant.storageMode !== input.accessGrant.storageMode ||
        existingAccessGrant.accessType !== input.accessGrant.accessType ||
        existingAccessGrant.validity.validFrom !==
          input.accessGrant.validity.validFrom ||
        existingAccessGrant.validity.validUntil !==
          input.accessGrant.validity.validUntil ||
        existingAccessGrant.registrationCycle !==
          input.accessGrant.registrationCycle ||
        existingAccessGrant.demoId !== input.accessGrant.demoId ||
        existingAccessGrant.demoRemarks !== input.accessGrant.demoRemarks ||
        existingAccessGrant.createdAt !== input.accessGrant.createdAt ||
        existingAccessGrant.schemaVersion !== input.accessGrant.schemaVersion ||
        !registrationPaymentMatches
      ) {
        return failure(
          "FINORA Branch Access status action cannot modify grant metadata.",
        );
      }
    }
  }

  // ----------------------------------------------------------
  // INTERNAL CREDENTIAL AUTHORIZATION ADAPTER
  //
  // External signed recovery uses AUTHORIZE_CREDENTIAL.
  // The dedicated native adapter resolves the authoritative
  // existing grant and enters this exact-match REPLACE path.
  //
  // SECURITY:
  //
  // - External REPLACE packages cannot carry credential authority.
  // - Every existing grant field must remain identical.
  // - Only the one-time credential authorization may be added.
  // - Storage mode / lifecycle / validity / payment / identity
  //   cannot be changed through credential recovery.
  // ----------------------------------------------------------

  if (credentialAuthorization !== undefined && input.action === "REPLACE") {
    if (!existingAccessGrant) {
      return failure(
        "FINORA credential recovery requires an existing Branch Access grant.",
      );
    }

    const existingPayment = existingAccessGrant.registrationPayment;

    const replacementPayment = input.accessGrant.registrationPayment;

    const registrationPaymentMatches =
      existingPayment === undefined
        ? replacementPayment === undefined
        : replacementPayment !== undefined &&
          existingPayment.amount === replacementPayment.amount &&
          existingPayment.currency === replacementPayment.currency &&
          existingPayment.paymentMode === replacementPayment.paymentMode &&
          existingPayment.paidAt === replacementPayment.paidAt &&
          existingPayment.reference === replacementPayment.reference &&
          existingPayment.remarks === replacementPayment.remarks &&
          existingPayment.refundable === replacementPayment.refundable;

    const grantMatchesExactly =
      existingAccessGrant.grantId === input.accessGrant.grantId &&
      existingAccessGrant.userId === input.accessGrant.userId &&
      existingAccessGrant.ownerId === input.accessGrant.ownerId &&
      existingAccessGrant.businessId === input.accessGrant.businessId &&
      existingAccessGrant.branchId === input.accessGrant.branchId &&
      existingAccessGrant.storageMode === input.accessGrant.storageMode &&
      existingAccessGrant.accessType === input.accessGrant.accessType &&
      existingAccessGrant.administrativeStatus ===
        input.accessGrant.administrativeStatus &&
      existingAccessGrant.validity.validFrom ===
        input.accessGrant.validity.validFrom &&
      existingAccessGrant.validity.validUntil ===
        input.accessGrant.validity.validUntil &&
      existingAccessGrant.registrationCycle ===
        input.accessGrant.registrationCycle &&
      existingAccessGrant.demoId === input.accessGrant.demoId &&
      existingAccessGrant.demoRemarks === input.accessGrant.demoRemarks &&
      existingAccessGrant.createdAt === input.accessGrant.createdAt &&
      existingAccessGrant.updatedAt === input.accessGrant.updatedAt &&
      existingAccessGrant.schemaVersion === input.accessGrant.schemaVersion &&
      registrationPaymentMatches;

    if (!grantMatchesExactly) {
      return failure(
        "FINORA credential recovery REPLACE cannot modify Branch Access grant metadata.",
      );
    }
  }

  const credentialAuthorizations =
    controlStore.branchCredentialEnrollmentAuthorizations ?? [];

  const credentialAuthorizationVerificationEvidence =
    controlStore.branchCredentialAuthorizationVerificationEvidence ?? [];

  const credentialPortabilityAuthorities = [
    ...(controlStore.branchCredentialPortabilityAuthorities ?? []),
  ];

  if (credentialAuthorization !== undefined) {
    const canonicalCredentialUsername = canonicalizeFinoraCredentialUsername(
      credentialAuthorization.username,
    );

    const existingCredential = (controlStore.branchCredentials ?? []).some(
      (item) =>
        item.canonicalUsername === canonicalCredentialUsername ||
        (item.userId === credentialAuthorization.userId &&
          item.ownerId === credentialAuthorization.ownerId &&
          item.businessId === credentialAuthorization.businessId &&
          item.branchId === credentialAuthorization.branchId),
    );

    if (existingCredential) {
      return failure(
        "FINORA Branch Credential already exists for this username or user scope.",
      );
    }

    const duplicateAuthorization = credentialAuthorizations.some(
      (item) =>
        item.authorizationId === credentialAuthorization.authorizationId ||
        (item.userId === credentialAuthorization.userId &&
          item.ownerId === credentialAuthorization.ownerId &&
          item.businessId === credentialAuthorization.businessId &&
          item.branchId === credentialAuthorization.branchId),
    );

    if (duplicateAuthorization) {
      return failure(
        "FINORA credential enrollment authorization already exists for this user scope.",
      );
    }
    if (!verifiedControlSigner) {
      return failure(
        "FINORA credential enrollment verified signer evidence is missing.",
      );
    }

    const duplicateVerificationEvidence =
      credentialAuthorizationVerificationEvidence.some(
        (item) =>
          item.authorizationId === credentialAuthorization.authorizationId ||
          item.packageId === input.packageId,
      );

    if (duplicateVerificationEvidence) {
      return failure(
        "FINORA credential authorization verification evidence already exists.",
      );
    }

    if (credentialPortabilityAuthorityProvenance !== undefined) {
      const duplicatePortabilityAuthority =
        credentialPortabilityAuthorities.some(
          (item) =>
            item.sourceAuthorizationId ===
              credentialPortabilityAuthorityProvenance.sourceAuthorizationId ||
            item.signedPortabilityAuthorityPackage.packageId ===
              credentialPortabilityAuthorityProvenance
                .signedPortabilityAuthorityPackage.packageId,
        );

      if (duplicatePortabilityAuthority) {
        return failure(
          "FINORA credential portability authority provenance already exists.",
        );
      }
    }
  }

  if (accessIndex >= 0) {
    if (credentialAuthorization === undefined || input.action !== "REPLACE") {
      accessGrants[accessIndex] = input.accessGrant;
    }
  } else {
    accessGrants.push(input.accessGrant);
  }

  if (credentialAuthorization !== undefined) {
    if (!verifiedControlSigner) {
      return failure(
        "FINORA credential enrollment verified signer evidence is missing before persistence.",
      );
    }

    credentialAuthorizations.push(credentialAuthorization);

    credentialAuthorizationVerificationEvidence.push({
      authorizationId: credentialAuthorization.authorizationId,

      packageId: input.packageId,

      issuerId: input.issuerId,

      sequence: input.sequence,

      verifiedControlSigner: {
        ...verifiedControlSigner,
      },

      verifiedAt: input.appliedAt,

      schemaVersion: 1,
    });

    if (credentialPortabilityAuthorityProvenance !== undefined) {
      credentialPortabilityAuthorities.push(
        credentialPortabilityAuthorityProvenance,
      );
    }
  }

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

  if (sequenceAuthority === "PORTABLE_BRANCH") {
    const portableSequenceIndex = portableSequenceStates.findIndex(
      (item) =>
        item.issuerId === input.issuerId &&
        item.ownerId === input.target.ownerId &&
        item.businessId === input.target.businessId &&
        item.branchId === input.target.branchId,
    );

    const nextPortableSequenceState: FinoraPortableBranchAccessSequenceStateRecord =
      {
        issuerId: input.issuerId,

        ownerId: input.target.ownerId,

        businessId: input.target.businessId,

        branchId: input.target.branchId,

        lastSequence: input.sequence,

        updatedAt: input.appliedAt,
      };

    if (portableSequenceIndex >= 0) {
      portableSequenceStates[portableSequenceIndex] = nextPortableSequenceState;
    } else {
      portableSequenceStates.push(nextPortableSequenceState);
    }

    controlStore.portableBranchAccessSequences = portableSequenceStates;
  } else {
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

    controlStore.controlSequences = sequenceStates;
  }

  controlStore.branchAccessGrants = accessGrants;

  controlStore.branchCredentialEnrollmentAuthorizations =
    credentialAuthorizations;

  controlStore.branchCredentialAuthorizationVerificationEvidence =
    credentialAuthorizationVerificationEvidence;

  controlStore.branchCredentialPortabilityAuthorities =
    credentialPortabilityAuthorities;

  controlStore.appliedControlPackages = appliedPackages;

  controlStore.updatedAt = input.appliedAt;

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to atomically persist verified FINORA Branch Access state.",
    );
  }

  return success({
    accessGrant: input.accessGrant,

    ...(credentialAuthorization === undefined
      ? {}
      : {
          credentialEnrollmentAuthorization: credentialAuthorization,
        }),
  });
}

export function applyFinoraVerifiedBranchAccessState(
  input: FinoraVerifiedBranchAccessApplyInput,
): Promise<FinoraControlStoreResult<FinoraVerifiedBranchAccessApplyResult>> {
  const operation = controlPackageApplyQueue.then(
    () => applyVerifiedBranchAccessInternal(input, "NATIVE_INSTALLATION"),
    () => applyVerifiedBranchAccessInternal(input, "NATIVE_INSTALLATION"),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

export function applyFinoraVerifiedPortableBranchAccessState(
  input: FinoraVerifiedBranchAccessApplyInput,
): Promise<FinoraControlStoreResult<FinoraVerifiedBranchAccessApplyResult>> {
  const operation = controlPackageApplyQueue.then(
    () => applyVerifiedBranchAccessInternal(input, "PORTABLE_BRANCH"),
    () => applyVerifiedBranchAccessInternal(input, "PORTABLE_BRANCH"),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

export async function applyFinoraVerifiedBranchCredentialAuthorizationState(
  input: FinoraVerifiedBranchCredentialAuthorizationApplyInput,
): Promise<FinoraControlStoreResult<FinoraVerifiedBranchAccessApplyResult>> {
  if (
    !isNonEmptyString(input.packageId) ||
    !isNonEmptyString(input.issuerId) ||
    input.purpose !== "BRANCH_ACCESS" ||
    input.action !== "AUTHORIZE_CREDENTIAL" ||
    !Number.isSafeInteger(input.sequence) ||
    input.sequence <= 0 ||
    !isControlTimestamp(input.appliedAt) ||
    !isBranchCredentialEnrollmentAuthorization(
      input.credentialEnrollmentAuthorization,
    )
  ) {
    return failure(
      "A valid verified FINORA Branch Credential authorization package is required.",
    );
  }

  const authorization = input.credentialEnrollmentAuthorization;

  if (
    authorization.ownerId !== input.target.ownerId ||
    authorization.businessId !== input.target.businessId ||
    authorization.branchId !== input.target.branchId
  ) {
    return failure(
      "FINORA credential authorization scope does not match the verified package target.",
    );
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const existingAccessGrant = currentResult.data.branchAccessGrants?.find(
    (item) =>
      item.userId === authorization.userId &&
      item.ownerId === authorization.ownerId &&
      item.businessId === authorization.businessId &&
      item.branchId === authorization.branchId,
  );

  if (!existingAccessGrant) {
    return failure(
      "FINORA credential authorization requires an existing Branch Access grant.",
    );
  }

  const expectedDataContext =
    existingAccessGrant.accessType === "DEMO" ? "DEMO" : "REAL";

  if (
    existingAccessGrant.administrativeStatus !== "ACTIVE" ||
    existingAccessGrant.storageMode !== authorization.storageMode ||
    expectedDataContext !== authorization.dataContext ||
    (expectedDataContext === "DEMO"
      ? existingAccessGrant.demoId !== authorization.demoId
      : authorization.demoId !== undefined)
  ) {
    return failure(
      "FINORA credential authorization does not match active Branch Access.",
    );
  }

  return applyFinoraVerifiedBranchAccessState({
    packageId: input.packageId,

    issuerId: input.issuerId,

    purpose: "BRANCH_ACCESS",

    sequence: input.sequence,

    action: "REPLACE",

    target: input.target,

    accessGrant: existingAccessGrant,

    credentialEnrollmentAuthorization: authorization,

    verifiedControlSigner: {
      ...input.verifiedControlSigner,
    },

    credentialPortabilityAuthorityProvenance:
      input.credentialPortabilityAuthorityProvenance,

    appliedAt: input.appliedAt,
  });
}

// ============================================================
// LOCAL ONE-TIME BRANCH CREDENTIAL ENROLLMENT
//
// ATOMIC SUCCESS:
//
// - Pending signed credential authorization exists.
// - Current Branch Access grant still matches that authority.
// - Derived credential exactly matches signed identity/scope.
// - No credential / authorization / username / scope replay.
// - Credential is appended.
// - Pending authorization is removed.
// - Both changes persist in ONE encrypted Control Store write.
//
// IMPORTANT:
//
// - This boundary never accepts a plaintext password.
// - Credential creation does not itself grant Branch Access.
// ============================================================

// ============================================================
// PORTABLE BRANCH AUTH ENROLLMENT TRANSACTION MUTATIONS
//
// Cross-file atomicity is intentionally NOT claimed here.
//
// This Control Store owns only the durable transaction journal,
// pending signed enrollment authorization, and local credential.
//
// Portable file mutation is performed by the native Portable
// Branch Auth Store outside this encrypted Control Store.
//
// Recovery therefore advances the durable state monotonically:
//
// PREPARED
//   -> PORTABLE_WRITTEN
//   -> CONTROL_APPLIED
//   -> COMPLETE
//
// CONTROL_APPLIED is special:
// credential insertion + signed authorization consumption +
// journal transition are persisted in ONE encrypted Control
// Store write.
// ============================================================

export interface FinoraPortableBranchAuthEnrollmentPrepareInput {
  transaction: FinoraPortableBranchAuthEnrollmentTransactionV1;
}

export interface FinoraPortableBranchAuthEnrollmentTransitionInput {
  transactionId: string;

  transitionedAt: string;
}

export interface FinoraPortableBranchAuthEnrollmentMutationResult {
  transaction: FinoraPortableBranchAuthEnrollmentTransactionV1;
}

export interface FinoraPortableBranchAuthEnrollmentControlApplyResult {
  transaction: FinoraPortableBranchAuthEnrollmentTransactionV1;

  credential: FinoraControlBranchCredential;

  consumedAuthorizationId: string;
}

function portableBranchAuthEnrollmentTransactionsEqual(
  left: FinoraPortableBranchAuthEnrollmentTransactionV1,
  right: FinoraPortableBranchAuthEnrollmentTransactionV1,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function portableBranchAuthCredentialsEqual(
  left: FinoraControlBranchCredential,
  right: FinoraControlBranchCredential,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

interface FinoraPortableBranchAuthEnrollmentAuthorityMatch {
  authorizationIndex: number;

  authorization: FinoraBranchCredentialEnrollmentAuthorization;
}

function resolvePortableBranchAuthEnrollmentAuthority(
  controlStore: FinoraControlStorePackage,
  transaction: FinoraPortableBranchAuthEnrollmentTransactionV1,
):
  | {
      success: true;

      data: FinoraPortableBranchAuthEnrollmentAuthorityMatch;
    }
  | {
      success: false;

      error: string;
    } {
  const authorizations =
    controlStore.branchCredentialEnrollmentAuthorizations ?? [];

  const authorizationIndex = authorizations.findIndex(
    (item) => item.authorizationId === transaction.sourceAuthorizationId,
  );

  if (authorizationIndex < 0) {
    return {
      success: false,

      error:
        "FINORA credential enrollment authorization is missing or already consumed.",
    };
  }

  const authorization = authorizations[authorizationIndex];

  const credential = transaction.credential;

  const expectedCanonicalUsername = canonicalizeFinoraCredentialUsername(
    authorization.username,
  );

  if (
    credential.sourceAuthorizationId !== authorization.authorizationId ||
    credential.userId !== authorization.userId ||
    credential.username !== authorization.username ||
    credential.canonicalUsername !== expectedCanonicalUsername ||
    credential.fullName !== authorization.fullName ||
    credential.role !== authorization.role ||
    credential.ownerId !== authorization.ownerId ||
    credential.businessId !== authorization.businessId ||
    credential.branchId !== authorization.branchId ||
    credential.storageMode !== authorization.storageMode ||
    credential.dataContext !== authorization.dataContext ||
    (authorization.dataContext === "DEMO"
      ? credential.demoId !== authorization.demoId
      : credential.demoId !== undefined)
  ) {
    return {
      success: false,

      error:
        "FINORA Branch Credential does not match the signed enrollment authorization.",
    };
  }

  const accessGrant = controlStore.branchAccessGrants?.find(
    (item) =>
      item.userId === authorization.userId &&
      item.ownerId === authorization.ownerId &&
      item.businessId === authorization.businessId &&
      item.branchId === authorization.branchId,
  );

  if (!accessGrant) {
    return {
      success: false,

      error:
        "FINORA Branch Credential enrollment requires the matching Branch Access grant.",
    };
  }

  const expectedDataContext =
    accessGrant.accessType === "DEMO" ? "DEMO" : "REAL";

  if (
    accessGrant.administrativeStatus !== "ACTIVE" ||
    accessGrant.storageMode !== authorization.storageMode ||
    expectedDataContext !== authorization.dataContext ||
    (expectedDataContext === "DEMO"
      ? accessGrant.demoId !== authorization.demoId
      : authorization.demoId !== undefined)
  ) {
    return {
      success: false,

      error:
        "FINORA Branch Credential enrollment authorization no longer matches active Branch Access.",
    };
  }

  return {
    success: true,

    data: {
      authorizationIndex,

      authorization,
    },
  };
}

async function preparePortableBranchAuthEnrollmentTransactionInternal(
  input: FinoraPortableBranchAuthEnrollmentPrepareInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthEnrollmentMutationResult>
> {
  try {
    validateFinoraPortableBranchAuthEnrollmentTransactionV1(input.transaction);
  } catch {
    return failure(
      "A valid PREPARED Portable Branch Auth enrollment transaction is required.",
    );
  }

  const transaction = input.transaction;

  if (transaction.status !== "PREPARED") {
    return failure(
      "Portable Branch Auth enrollment preparation requires PREPARED state.",
    );
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const transactions = [
    ...(controlStore.portableBranchAuthEnrollmentTransactions ?? []),
  ];

  const existingByTransactionId = transactions.find(
    (item) => item.transactionId === transaction.transactionId,
  );

  if (existingByTransactionId) {
    if (
      portableBranchAuthEnrollmentTransactionsEqual(
        existingByTransactionId,
        transaction,
      )
    ) {
      return success({
        transaction: existingByTransactionId,
      });
    }

    return failure(
      "Portable Branch Auth enrollment transactionId already exists with different state.",
    );
  }

  if (
    transactions.some(
      (item) =>
        item.sourceAuthorizationId === transaction.sourceAuthorizationId,
    )
  ) {
    return failure(
      "Portable Branch Auth enrollment authorization already has a durable transaction.",
    );
  }

  const authorityResult = resolvePortableBranchAuthEnrollmentAuthority(
    controlStore,
    transaction,
  );

  if (!authorityResult.success) {
    return failure(authorityResult.error);
  }

  const branchCredentials = controlStore.branchCredentials ?? [];

  if (
    hasDuplicateBranchCredentialKeys([
      ...branchCredentials,
      transaction.credential,
    ])
  ) {
    return failure(
      "FINORA Branch Credential already exists for this authorization, username or user scope.",
    );
  }

  transactions.push(transaction);

  controlStore.portableBranchAuthEnrollmentTransactions = transactions;

  controlStore.updatedAt = transaction.updatedAt;

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to persist PREPARED Portable Branch Auth enrollment transaction.",
    );
  }

  return success({
    transaction,
  });
}

async function markPortableBranchAuthEnrollmentWrittenInternal(
  input: FinoraPortableBranchAuthEnrollmentTransitionInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthEnrollmentMutationResult>
> {
  if (
    !isNonEmptyString(input.transactionId) ||
    !isControlTimestamp(input.transitionedAt)
  ) {
    return failure(
      "A valid Portable Branch Auth written transition is required.",
    );
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const transactions = [
    ...(controlStore.portableBranchAuthEnrollmentTransactions ?? []),
  ];

  const transactionIndex = transactions.findIndex(
    (item) => item.transactionId === input.transactionId,
  );

  if (transactionIndex < 0) {
    return failure(
      "Portable Branch Auth enrollment transaction was not found.",
    );
  }

  const transaction = transactions[transactionIndex];

  if (
    transaction.status === "PORTABLE_WRITTEN" ||
    transaction.status === "CONTROL_APPLIED" ||
    transaction.status === "CERTIFICATION_MIGRATED" ||
    transaction.status === "COMPLETE"
  ) {
    return success({
      transaction,
    });
  }

  if (
    !canAdvanceFinoraPortableBranchAuthEnrollmentTransaction(
      transaction.status,
      "PORTABLE_WRITTEN",
    )
  ) {
    return failure(
      "Portable Branch Auth enrollment transaction cannot advance to PORTABLE_WRITTEN.",
    );
  }

  const nextTransaction: FinoraPortableBranchAuthEnrollmentTransactionV1 = {
    ...transaction,

    status: "PORTABLE_WRITTEN",

    updatedAt: input.transitionedAt,

    portableWrittenAt: input.transitionedAt,
  };

  try {
    validateFinoraPortableBranchAuthEnrollmentTransactionV1(nextTransaction);
  } catch {
    return failure(
      "Portable Branch Auth PORTABLE_WRITTEN transition is invalid.",
    );
  }

  transactions[transactionIndex] = nextTransaction;

  controlStore.portableBranchAuthEnrollmentTransactions = transactions;

  controlStore.updatedAt = input.transitionedAt;

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to persist PORTABLE_WRITTEN enrollment state.",
    );
  }

  return success({
    transaction: nextTransaction,
  });
}

async function applyPortableBranchAuthEnrollmentControlStateInternal(
  input: FinoraPortableBranchAuthEnrollmentTransitionInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthEnrollmentControlApplyResult>
> {
  if (
    !isNonEmptyString(input.transactionId) ||
    !isControlTimestamp(input.transitionedAt)
  ) {
    return failure(
      "A valid Portable Branch Auth Control apply transition is required.",
    );
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const transactions = [
    ...(controlStore.portableBranchAuthEnrollmentTransactions ?? []),
  ];

  const transactionIndex = transactions.findIndex(
    (item) => item.transactionId === input.transactionId,
  );

  if (transactionIndex < 0) {
    return failure(
      "Portable Branch Auth enrollment transaction was not found.",
    );
  }

  const transaction = transactions[transactionIndex];

  if (
    transaction.status === "CONTROL_APPLIED" ||
    transaction.status === "CERTIFICATION_MIGRATED" ||
    transaction.status === "COMPLETE"
  ) {
    const existingCredential = controlStore.branchCredentials?.find(
      (item) =>
        item.credentialId === transaction.credential.credentialId &&
        item.sourceAuthorizationId === transaction.sourceAuthorizationId,
    );

    if (
      !existingCredential ||
      !portableBranchAuthCredentialsEqual(
        existingCredential,
        transaction.credential,
      )
    ) {
      return failure(
        "Portable Branch Auth Control-applied transaction is missing matching credential evidence.",
      );
    }

    return success({
      transaction,

      credential: existingCredential,

      consumedAuthorizationId: transaction.sourceAuthorizationId,
    });
  }

  if (
    !canAdvanceFinoraPortableBranchAuthEnrollmentTransaction(
      transaction.status,
      "CONTROL_APPLIED",
    )
  ) {
    return failure(
      "Portable Branch Auth enrollment transaction cannot advance to CONTROL_APPLIED.",
    );
  }

  const authorityResult = resolvePortableBranchAuthEnrollmentAuthority(
    controlStore,
    transaction,
  );

  if (!authorityResult.success) {
    return failure(authorityResult.error);
  }

  const branchCredentials = [...(controlStore.branchCredentials ?? [])];

  if (
    hasDuplicateBranchCredentialKeys([
      ...branchCredentials,
      transaction.credential,
    ])
  ) {
    return failure(
      "FINORA Branch Credential already exists for this authorization, username or user scope.",
    );
  }

  const authorizations = [
    ...(controlStore.branchCredentialEnrollmentAuthorizations ?? []),
  ];

  authorizations.splice(authorityResult.data.authorizationIndex, 1);

  branchCredentials.push(transaction.credential);

  const nextTransaction: FinoraPortableBranchAuthEnrollmentTransactionV1 = {
    ...transaction,

    status: "CONTROL_APPLIED",

    updatedAt: input.transitionedAt,

    controlAppliedAt: input.transitionedAt,
  };

  try {
    validateFinoraPortableBranchAuthEnrollmentTransactionV1(nextTransaction);
  } catch {
    return failure(
      "Portable Branch Auth CONTROL_APPLIED transition is invalid.",
    );
  }

  transactions[transactionIndex] = nextTransaction;

  // ----------------------------------------------------------
  // ONE LOGICAL ENCRYPTED CONTROL STORE COMMIT
  //
  // These three mutations must persist together:
  //
  // 1. exact pre-generated credential becomes ACTIVE evidence
  // 2. pending signed authorization is consumed
  // 3. durable transaction becomes CONTROL_APPLIED
  // ----------------------------------------------------------

  controlStore.branchCredentials = branchCredentials;

  controlStore.branchCredentialEnrollmentAuthorizations = authorizations;

  controlStore.portableBranchAuthEnrollmentTransactions = transactions;

  controlStore.updatedAt = input.transitionedAt;

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to atomically persist Portable Branch Auth Control application.",
    );
  }

  return success({
    transaction: nextTransaction,

    credential: transaction.credential,

    consumedAuthorizationId: authorityResult.data.authorization.authorizationId,
  });
}

async function markPortableBranchAuthEnrollmentCertificationMigratedInternal(
  input: FinoraPortableBranchAuthEnrollmentTransitionInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthEnrollmentMutationResult>
> {
  if (
    !isNonEmptyString(input.transactionId) ||
    !isControlTimestamp(input.transitionedAt)
  ) {
    return failure(
      "A valid Portable Branch Auth certification migration transition is required.",
    );
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const transactions = [
    ...(controlStore.portableBranchAuthEnrollmentTransactions ?? []),
  ];

  const transactionIndex = transactions.findIndex(
    (item) => item.transactionId === input.transactionId,
  );

  if (transactionIndex < 0) {
    return failure(
      "Portable Branch Auth enrollment transaction was not found.",
    );
  }

  const transaction = transactions[transactionIndex];

  if (
    transaction.status === "CERTIFICATION_MIGRATED" ||
    transaction.status === "COMPLETE"
  ) {
    if (
      transaction.branchCertificationProvenance === undefined ||
      transaction.certificationMigratedAt === undefined
    ) {
      return failure(
        "Portable Branch Auth certification migration state is missing durable provenance evidence.",
      );
    }

    return success({
      transaction,
    });
  }

  if (transaction.branchCertificationProvenance === undefined) {
    return failure(
      "Portable Branch Auth certification migration requires durable certification provenance.",
    );
  }

  if (
    !canAdvanceFinoraPortableBranchAuthEnrollmentTransaction(
      transaction.status,
      "CERTIFICATION_MIGRATED",
    )
  ) {
    return failure(
      "Portable Branch Auth enrollment transaction cannot advance to CERTIFICATION_MIGRATED.",
    );
  }

  const existingCredential = controlStore.branchCredentials?.find(
    (item) =>
      item.credentialId === transaction.credential.credentialId &&
      item.sourceAuthorizationId === transaction.sourceAuthorizationId,
  );

  if (
    !existingCredential ||
    !portableBranchAuthCredentialsEqual(
      existingCredential,
      transaction.credential,
    )
  ) {
    return failure(
      "Portable Branch Auth certification migration requires matching persisted credential evidence.",
    );
  }

  if (
    (controlStore.branchCredentialEnrollmentAuthorizations ?? []).some(
      (item) => item.authorizationId === transaction.sourceAuthorizationId,
    )
  ) {
    return failure(
      "Portable Branch Auth certification migration requires consumed enrollment authorization.",
    );
  }

  const nextTransaction: FinoraPortableBranchAuthEnrollmentTransactionV1 = {
    ...transaction,

    status: "CERTIFICATION_MIGRATED",

    updatedAt: input.transitionedAt,

    certificationMigratedAt: input.transitionedAt,
  };

  try {
    validateFinoraPortableBranchAuthEnrollmentTransactionV1(nextTransaction);
  } catch {
    return failure(
      "Portable Branch Auth CERTIFICATION_MIGRATED transition is invalid.",
    );
  }

  transactions[transactionIndex] = nextTransaction;

  // ----------------------------------------------------------
  // ONE LOGICAL ENCRYPTED CONTROL STORE COMMIT
  //
  // Certification private authority is already inside the
  // encrypted Portable Auth envelope. This commit persists
  // only non-secret migration provenance + transition time.
  // Credential and enrollment-authorization state are unchanged.
  // ----------------------------------------------------------

  controlStore.portableBranchAuthEnrollmentTransactions = transactions;

  controlStore.updatedAt = input.transitionedAt;

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to persist CERTIFICATION_MIGRATED Portable Branch Auth enrollment state.",
    );
  }

  return success({
    transaction: nextTransaction,
  });
}

async function completePortableBranchAuthEnrollmentTransactionInternal(
  input: FinoraPortableBranchAuthEnrollmentTransitionInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthEnrollmentMutationResult>
> {
  if (
    !isNonEmptyString(input.transactionId) ||
    !isControlTimestamp(input.transitionedAt)
  ) {
    return failure(
      "A valid Portable Branch Auth completion transition is required.",
    );
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const transactions = [
    ...(controlStore.portableBranchAuthEnrollmentTransactions ?? []),
  ];

  const transactionIndex = transactions.findIndex(
    (item) => item.transactionId === input.transactionId,
  );

  if (transactionIndex < 0) {
    return failure(
      "Portable Branch Auth enrollment transaction was not found.",
    );
  }

  const transaction = transactions[transactionIndex];

  if (transaction.status === "COMPLETE") {
    return success({
      transaction,
    });
  }

  if (
    transaction.branchCertificationProvenance !== undefined &&
    transaction.status !== "CERTIFICATION_MIGRATED"
  ) {
    return failure(
      "Certification-aware Portable Branch Auth enrollment requires durable CERTIFICATION_MIGRATED evidence before COMPLETE.",
    );
  }

  if (
    !canAdvanceFinoraPortableBranchAuthEnrollmentTransaction(
      transaction.status,
      "COMPLETE",
    )
  ) {
    return failure(
      "Portable Branch Auth enrollment transaction cannot advance to COMPLETE.",
    );
  }

  const existingCredential = controlStore.branchCredentials?.find(
    (item) =>
      item.credentialId === transaction.credential.credentialId &&
      item.sourceAuthorizationId === transaction.sourceAuthorizationId,
  );

  if (
    !existingCredential ||
    !portableBranchAuthCredentialsEqual(
      existingCredential,
      transaction.credential,
    )
  ) {
    return failure(
      "Portable Branch Auth completion requires matching persisted credential evidence.",
    );
  }

  if (
    (controlStore.branchCredentialEnrollmentAuthorizations ?? []).some(
      (item) => item.authorizationId === transaction.sourceAuthorizationId,
    )
  ) {
    return failure(
      "Portable Branch Auth completion requires consumed enrollment authorization.",
    );
  }

  const nextTransaction: FinoraPortableBranchAuthEnrollmentTransactionV1 = {
    ...transaction,

    status: "COMPLETE",

    updatedAt: input.transitionedAt,

    completedAt: input.transitionedAt,
  };

  try {
    validateFinoraPortableBranchAuthEnrollmentTransactionV1(nextTransaction);
  } catch {
    return failure("Portable Branch Auth COMPLETE transition is invalid.");
  }

  transactions[transactionIndex] = nextTransaction;

  controlStore.portableBranchAuthEnrollmentTransactions = transactions;

  controlStore.updatedAt = input.transitionedAt;

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to persist COMPLETE Portable Branch Auth enrollment state.",
    );
  }

  return success({
    transaction: nextTransaction,
  });
}

export function prepareFinoraPortableBranchAuthEnrollmentTransaction(
  input: FinoraPortableBranchAuthEnrollmentPrepareInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthEnrollmentMutationResult>
> {
  const operation = controlPackageApplyQueue.then(
    () => preparePortableBranchAuthEnrollmentTransactionInternal(input),
    () => preparePortableBranchAuthEnrollmentTransactionInternal(input),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

export function markFinoraPortableBranchAuthEnrollmentWritten(
  input: FinoraPortableBranchAuthEnrollmentTransitionInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthEnrollmentMutationResult>
> {
  const operation = controlPackageApplyQueue.then(
    () => markPortableBranchAuthEnrollmentWrittenInternal(input),
    () => markPortableBranchAuthEnrollmentWrittenInternal(input),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

export function applyFinoraPortableBranchAuthEnrollmentControlState(
  input: FinoraPortableBranchAuthEnrollmentTransitionInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthEnrollmentControlApplyResult>
> {
  const operation = controlPackageApplyQueue.then(
    () => applyPortableBranchAuthEnrollmentControlStateInternal(input),
    () => applyPortableBranchAuthEnrollmentControlStateInternal(input),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

export function markFinoraPortableBranchAuthEnrollmentCertificationMigrated(
  input: FinoraPortableBranchAuthEnrollmentTransitionInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthEnrollmentMutationResult>
> {
  const operation = controlPackageApplyQueue.then(
    () => markPortableBranchAuthEnrollmentCertificationMigratedInternal(input),
    () => markPortableBranchAuthEnrollmentCertificationMigratedInternal(input),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

export function completeFinoraPortableBranchAuthEnrollmentTransaction(
  input: FinoraPortableBranchAuthEnrollmentTransitionInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthEnrollmentMutationResult>
> {
  const operation = controlPackageApplyQueue.then(
    () => completePortableBranchAuthEnrollmentTransactionInternal(input),
    () => completePortableBranchAuthEnrollmentTransactionInternal(input),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

// ============================================================
// PORTABLE BRANCH AUTH CREDENTIAL ROTATION MUTATION AUTHORITY
//
// PREPARED
//   -> PORTABLE_REPLACED
//   -> CONTROL_APPLIED
//   -> COMPLETE
//
// CONTROL_APPLIED is the atomic Control Store boundary:
//
// 1. exact expected credential is replaced
// 2. durable rotation transaction advances to CONTROL_APPLIED
//
// Both mutations persist through one encrypted Control Store write.
// No enrollment authorization is consumed by credential rotation.
// ============================================================

export interface FinoraPortableBranchAuthCredentialRotationPrepareInput {
  transaction: FinoraPortableBranchAuthCredentialRotationTransactionV1;
}

export interface FinoraPortableBranchAuthCredentialRotationTransitionInput {
  transactionId: string;

  transitionedAt: string;
}

export interface FinoraPortableBranchAuthCredentialRotationMutationResult {
  transaction: FinoraPortableBranchAuthCredentialRotationTransactionV1;
}

export interface FinoraPortableBranchAuthCredentialRotationControlApplyResult {
  transaction: FinoraPortableBranchAuthCredentialRotationTransactionV1;

  credential: FinoraControlBranchCredential;
}

function portableBranchAuthCredentialRotationTransactionsEqual(
  left: FinoraPortableBranchAuthCredentialRotationTransactionV1,
  right: FinoraPortableBranchAuthCredentialRotationTransactionV1,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function preparePortableBranchAuthCredentialRotationTransactionInternal(
  input: FinoraPortableBranchAuthCredentialRotationPrepareInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthCredentialRotationMutationResult>
> {
  try {
    validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
      input.transaction,
    );
  } catch {
    return failure(
      "A valid PREPARED Portable Branch Auth credential rotation transaction is required.",
    );
  }

  const transaction = input.transaction;

  if (transaction.status !== "PREPARED") {
    return failure(
      "Portable Branch Auth credential rotation preparation requires PREPARED state.",
    );
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const transactions = [
    ...(controlStore.portableBranchAuthCredentialRotationTransactions ?? []),
  ];

  const existingByTransactionId = transactions.find(
    (item) => item.transactionId === transaction.transactionId,
  );

  if (existingByTransactionId) {
    if (
      portableBranchAuthCredentialRotationTransactionsEqual(
        existingByTransactionId,
        transaction,
      )
    ) {
      return success({
        transaction: existingByTransactionId,
      });
    }

    return failure(
      "Portable Branch Auth credential rotation transactionId already exists with different state.",
    );
  }

  const activeForCredential = transactions.find(
    (item) =>
      item.credentialId === transaction.credentialId &&
      item.status !== "COMPLETE",
  );

  if (activeForCredential) {
    return failure(
      "FINORA Branch Credential already has an unfinished credential rotation transaction.",
    );
  }

  const branchCredentials = [...(controlStore.branchCredentials ?? [])];

  const credentialIndex = branchCredentials.findIndex(
    (item) =>
      item.credentialId === transaction.credentialId &&
      item.sourceAuthorizationId === transaction.sourceAuthorizationId,
  );

  if (credentialIndex < 0) {
    return failure(
      "Portable Branch Auth credential rotation requires the authoritative current credential.",
    );
  }

  const currentCredential = branchCredentials[credentialIndex];

  if (
    !portableBranchAuthCredentialsEqual(
      currentCredential,
      transaction.expectedCredential,
    )
  ) {
    return failure(
      "Portable Branch Auth credential rotation expected credential is stale or does not match authoritative state.",
    );
  }

  const replacementCandidate = [...branchCredentials];

  replacementCandidate[credentialIndex] = transaction.replacementCredential;

  if (hasDuplicateBranchCredentialKeys(replacementCandidate)) {
    return failure(
      "Portable Branch Auth replacement credential conflicts with existing credential identity.",
    );
  }

  transactions.push(transaction);

  controlStore.portableBranchAuthCredentialRotationTransactions = transactions;

  controlStore.updatedAt = transaction.updatedAt;

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to persist PREPARED Portable Branch Auth credential rotation transaction.",
    );
  }

  return success({
    transaction,
  });
}

async function markPortableBranchAuthCredentialRotationPortableReplacedInternal(
  input: FinoraPortableBranchAuthCredentialRotationTransitionInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthCredentialRotationMutationResult>
> {
  if (
    !isNonEmptyString(input.transactionId) ||
    !isControlTimestamp(input.transitionedAt)
  ) {
    return failure(
      "A valid Portable Branch Auth PORTABLE_REPLACED transition is required.",
    );
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const transactions = [
    ...(controlStore.portableBranchAuthCredentialRotationTransactions ?? []),
  ];

  const transactionIndex = transactions.findIndex(
    (item) => item.transactionId === input.transactionId,
  );

  if (transactionIndex < 0) {
    return failure(
      "Portable Branch Auth credential rotation transaction was not found.",
    );
  }

  const transaction = transactions[transactionIndex];

  if (
    transaction.status === "PORTABLE_REPLACED" ||
    transaction.status === "CONTROL_APPLIED" ||
    transaction.status === "COMPLETE"
  ) {
    return success({
      transaction,
    });
  }

  if (
    !canAdvanceFinoraPortableBranchAuthCredentialRotationTransaction(
      transaction.status,
      "PORTABLE_REPLACED",
    )
  ) {
    return failure(
      "Portable Branch Auth credential rotation cannot advance to PORTABLE_REPLACED.",
    );
  }

  const nextTransaction: FinoraPortableBranchAuthCredentialRotationTransactionV1 =
    {
      ...transaction,

      status: "PORTABLE_REPLACED",

      updatedAt: input.transitionedAt,

      portableReplacedAt: input.transitionedAt,
    };

  try {
    validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
      nextTransaction,
    );
  } catch {
    return failure(
      "Portable Branch Auth credential rotation PORTABLE_REPLACED transition is invalid.",
    );
  }

  transactions[transactionIndex] = nextTransaction;

  controlStore.portableBranchAuthCredentialRotationTransactions = transactions;

  controlStore.updatedAt = input.transitionedAt;

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to persist PORTABLE_REPLACED credential rotation state.",
    );
  }

  return success({
    transaction: nextTransaction,
  });
}

async function applyPortableBranchAuthCredentialRotationControlStateInternal(
  input: FinoraPortableBranchAuthCredentialRotationTransitionInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthCredentialRotationControlApplyResult>
> {
  if (
    !isNonEmptyString(input.transactionId) ||
    !isControlTimestamp(input.transitionedAt)
  ) {
    return failure(
      "A valid Portable Branch Auth credential rotation Control apply transition is required.",
    );
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const transactions = [
    ...(controlStore.portableBranchAuthCredentialRotationTransactions ?? []),
  ];

  const transactionIndex = transactions.findIndex(
    (item) => item.transactionId === input.transactionId,
  );

  if (transactionIndex < 0) {
    return failure(
      "Portable Branch Auth credential rotation transaction was not found.",
    );
  }

  const transaction = transactions[transactionIndex];

  const branchCredentials = [...(controlStore.branchCredentials ?? [])];

  const credentialIndex = branchCredentials.findIndex(
    (item) =>
      item.credentialId === transaction.credentialId &&
      item.sourceAuthorizationId === transaction.sourceAuthorizationId,
  );

  if (credentialIndex < 0) {
    return failure(
      "Portable Branch Auth credential rotation is missing authoritative credential evidence.",
    );
  }

  const currentCredential = branchCredentials[credentialIndex];

  if (
    transaction.status === "CONTROL_APPLIED" ||
    transaction.status === "COMPLETE"
  ) {
    if (
      !portableBranchAuthCredentialsEqual(
        currentCredential,
        transaction.replacementCredential,
      )
    ) {
      return failure(
        "Portable Branch Auth credential rotation Control-applied state is missing exact replacement credential evidence.",
      );
    }

    return success({
      transaction,

      credential: currentCredential,
    });
  }

  if (
    !canAdvanceFinoraPortableBranchAuthCredentialRotationTransaction(
      transaction.status,
      "CONTROL_APPLIED",
    )
  ) {
    return failure(
      "Portable Branch Auth credential rotation cannot advance to CONTROL_APPLIED.",
    );
  }

  if (
    !portableBranchAuthCredentialsEqual(
      currentCredential,
      transaction.expectedCredential,
    )
  ) {
    return failure(
      "Portable Branch Auth credential rotation expected credential changed before Control application.",
    );
  }

  const replacementCandidate = [...branchCredentials];

  replacementCandidate[credentialIndex] = transaction.replacementCredential;

  if (hasDuplicateBranchCredentialKeys(replacementCandidate)) {
    return failure(
      "Portable Branch Auth replacement credential conflicts with authoritative credential state.",
    );
  }

  const nextTransaction: FinoraPortableBranchAuthCredentialRotationTransactionV1 =
    {
      ...transaction,

      status: "CONTROL_APPLIED",

      updatedAt: input.transitionedAt,

      controlAppliedAt: input.transitionedAt,
    };

  try {
    validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
      nextTransaction,
    );
  } catch {
    return failure(
      "Portable Branch Auth credential rotation CONTROL_APPLIED transition is invalid.",
    );
  }

  replacementCandidate[credentialIndex] = transaction.replacementCredential;

  transactions[transactionIndex] = nextTransaction;

  // ----------------------------------------------------------
  // ONE LOGICAL ENCRYPTED CONTROL STORE COMMIT
  //
  // These two authoritative mutations MUST persist together:
  //
  // 1. exact expected credential becomes replacement credential
  // 2. durable rotation transaction becomes CONTROL_APPLIED
  //
  // There is deliberately no enrollment-authorization mutation.
  // sourceAuthorizationId remains immutable lineage provenance.
  // ----------------------------------------------------------

  controlStore.branchCredentials = replacementCandidate;

  controlStore.portableBranchAuthCredentialRotationTransactions = transactions;

  controlStore.updatedAt = input.transitionedAt;

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to atomically persist Portable Branch Auth credential rotation Control state.",
    );
  }

  return success({
    transaction: nextTransaction,

    credential: transaction.replacementCredential,
  });
}

async function completePortableBranchAuthCredentialRotationTransactionInternal(
  input: FinoraPortableBranchAuthCredentialRotationTransitionInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthCredentialRotationMutationResult>
> {
  if (
    !isNonEmptyString(input.transactionId) ||
    !isControlTimestamp(input.transitionedAt)
  ) {
    return failure(
      "A valid Portable Branch Auth credential rotation completion transition is required.",
    );
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const transactions = [
    ...(controlStore.portableBranchAuthCredentialRotationTransactions ?? []),
  ];

  const transactionIndex = transactions.findIndex(
    (item) => item.transactionId === input.transactionId,
  );

  if (transactionIndex < 0) {
    return failure(
      "Portable Branch Auth credential rotation transaction was not found.",
    );
  }

  const transaction = transactions[transactionIndex];

  const currentCredential = controlStore.branchCredentials?.find(
    (item) =>
      item.credentialId === transaction.credentialId &&
      item.sourceAuthorizationId === transaction.sourceAuthorizationId,
  );

  if (
    !currentCredential ||
    !portableBranchAuthCredentialsEqual(
      currentCredential,
      transaction.replacementCredential,
    )
  ) {
    return failure(
      "Portable Branch Auth credential rotation completion requires exact replacement credential evidence.",
    );
  }

  if (transaction.status === "COMPLETE") {
    return success({
      transaction,
    });
  }

  if (
    !canAdvanceFinoraPortableBranchAuthCredentialRotationTransaction(
      transaction.status,
      "COMPLETE",
    )
  ) {
    return failure(
      "Portable Branch Auth credential rotation cannot advance to COMPLETE.",
    );
  }

  const nextTransaction: FinoraPortableBranchAuthCredentialRotationTransactionV1 =
    {
      ...transaction,

      status: "COMPLETE",

      updatedAt: input.transitionedAt,

      completedAt: input.transitionedAt,
    };

  try {
    validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
      nextTransaction,
    );
  } catch {
    return failure(
      "Portable Branch Auth credential rotation COMPLETE transition is invalid.",
    );
  }

  transactions[transactionIndex] = nextTransaction;

  controlStore.portableBranchAuthCredentialRotationTransactions = transactions;

  controlStore.updatedAt = input.transitionedAt;

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to persist COMPLETE Portable Branch Auth credential rotation state.",
    );
  }

  return success({
    transaction: nextTransaction,
  });
}

export function prepareFinoraPortableBranchAuthCredentialRotationTransaction(
  input: FinoraPortableBranchAuthCredentialRotationPrepareInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthCredentialRotationMutationResult>
> {
  const operation = controlPackageApplyQueue.then(
    () => preparePortableBranchAuthCredentialRotationTransactionInternal(input),
    () => preparePortableBranchAuthCredentialRotationTransactionInternal(input),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

export function markFinoraPortableBranchAuthCredentialRotationPortableReplaced(
  input: FinoraPortableBranchAuthCredentialRotationTransitionInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthCredentialRotationMutationResult>
> {
  const operation = controlPackageApplyQueue.then(
    () =>
      markPortableBranchAuthCredentialRotationPortableReplacedInternal(input),
    () =>
      markPortableBranchAuthCredentialRotationPortableReplacedInternal(input),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

export function applyFinoraPortableBranchAuthCredentialRotationControlState(
  input: FinoraPortableBranchAuthCredentialRotationTransitionInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthCredentialRotationControlApplyResult>
> {
  const operation = controlPackageApplyQueue.then(
    () => applyPortableBranchAuthCredentialRotationControlStateInternal(input),
    () => applyPortableBranchAuthCredentialRotationControlStateInternal(input),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

export function completeFinoraPortableBranchAuthCredentialRotationTransaction(
  input: FinoraPortableBranchAuthCredentialRotationTransitionInput,
): Promise<
  FinoraControlStoreResult<FinoraPortableBranchAuthCredentialRotationMutationResult>
> {
  const operation = controlPackageApplyQueue.then(
    () =>
      completePortableBranchAuthCredentialRotationTransactionInternal(input),
    () =>
      completePortableBranchAuthCredentialRotationTransactionInternal(input),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

/* ============================================================
   LEGACY SECURITY CODE BOOTSTRAP — CREDENTIAL COMMIT

   This authority is intentionally narrow:
   - existing ACTIVE credential only
   - legacy credential must have no securityVerifier
   - immutable credential identity cannot change
   - authGeneration advances exactly once
   - retained signed authorization + portability provenance required
   - Portable Auth file mutation is owned by the coordinator
============================================================ */

export interface FinoraLegacySecurityCodeBootstrapCredentialReplaceInput {
  expectedCredential: FinoraControlBranchCredential;
  replacementCredential: FinoraControlBranchCredential;
  appliedAt: string;
}

function legacySecurityCodeBootstrapCredentialIdentityEqual(
  left: FinoraControlBranchCredential,
  right: FinoraControlBranchCredential,
): boolean {
  return (
    left.credentialId === right.credentialId &&
    left.sourceAuthorizationId === right.sourceAuthorizationId &&
    left.userId === right.userId &&
    left.username === right.username &&
    left.canonicalUsername === right.canonicalUsername &&
    left.fullName === right.fullName &&
    left.role === right.role &&
    left.ownerId === right.ownerId &&
    left.businessId === right.businessId &&
    left.branchId === right.branchId &&
    left.storageMode === right.storageMode &&
    left.dataContext === right.dataContext &&
    left.demoId === right.demoId &&
    left.status === right.status &&
    left.createdAt === right.createdAt &&
    left.schemaVersion === right.schemaVersion
  );
}

async function applyLegacySecurityCodeBootstrapCredentialReplaceInternal(
  input: FinoraLegacySecurityCodeBootstrapCredentialReplaceInput,
): Promise<FinoraControlStoreResult<FinoraControlBranchCredential>> {
  if (
    !isControlTimestamp(input.appliedAt) ||
    !isBranchCredential(input.expectedCredential) ||
    !isBranchCredential(input.replacementCredential)
  ) {
    return failure("A valid FINORA legacy Security Code bootstrap credential replacement is required.");
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(currentResult.error ?? "Unable to load the FINORA Control Store.");
  }

  const controlStore = currentResult.data;
  const credentials = [...(controlStore.branchCredentials ?? [])];
  const credentialIndex = credentials.findIndex(
    (item) =>
      item.credentialId === input.expectedCredential.credentialId &&
      item.sourceAuthorizationId === input.expectedCredential.sourceAuthorizationId,
  );

  if (credentialIndex < 0) {
    return failure("FINORA legacy bootstrap credential was not found.");
  }

  const currentCredential = credentials[credentialIndex];

  if (JSON.stringify(currentCredential) !== JSON.stringify(input.expectedCredential)) {
    return failure("FINORA legacy bootstrap credential changed before commit.");
  }

  if (currentCredential.securityVerifier !== undefined) {
    return failure("FINORA legacy bootstrap is allowed only when Security Code has never been established.");
  }

  const replacementCredential = input.replacementCredential;
  const currentGeneration = currentCredential.authGeneration ?? 1;
  const targetGeneration = currentGeneration + 1;

  if (
    !Number.isSafeInteger(targetGeneration) ||
    replacementCredential.securityVerifier === undefined ||
    replacementCredential.authGeneration !== targetGeneration ||
    replacementCredential.updatedAt !== input.appliedAt ||
    !legacySecurityCodeBootstrapCredentialIdentityEqual(
      currentCredential,
      replacementCredential,
    )
  ) {
    return failure("FINORA legacy bootstrap replacement credential lineage is invalid.");
  }

  const verificationEvidence =
    (controlStore.branchCredentialAuthorizationVerificationEvidence ?? []).filter(
      (item) => item.authorizationId === currentCredential.sourceAuthorizationId,
    );

  const portabilityAuthorities =
    (controlStore.branchCredentialPortabilityAuthorities ?? []).filter(
      (item) => item.sourceAuthorizationId === currentCredential.sourceAuthorizationId,
    );

  if (verificationEvidence.length !== 1 || portabilityAuthorities.length !== 1) {
    return failure("FINORA legacy bootstrap requires exact retained signed credential portability provenance.");
  }

  credentials[credentialIndex] = structuredClone(replacementCredential);
  controlStore.branchCredentials = credentials;
  controlStore.updatedAt = input.appliedAt;

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to atomically persist FINORA legacy Security Code bootstrap credential state.",
    );
  }

  return success(structuredClone(replacementCredential));
}

export function applyFinoraLegacySecurityCodeBootstrapCredentialReplace(
  input: FinoraLegacySecurityCodeBootstrapCredentialReplaceInput,
): Promise<FinoraControlStoreResult<FinoraControlBranchCredential>> {
  const operation = controlPackageApplyQueue.then(
    () => applyLegacySecurityCodeBootstrapCredentialReplaceInternal(input),
    () => applyLegacySecurityCodeBootstrapCredentialReplaceInternal(input),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

type FinoraStorageEntitlementSequenceAuthority =
  | "NATIVE_INSTALLATION"
  | "PORTABLE_BRANCH";

async function applyVerifiedStorageEntitlementInternal(
  input: FinoraVerifiedStorageEntitlementApplyInput,

  sequenceAuthority:
    FinoraStorageEntitlementSequenceAuthority,
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
    installation.ownerId !== input.target.ownerId ||
    installation.businessId !== input.target.businessId ||
    installation.branchId !== input.target.branchId ||
    (sequenceAuthority === "NATIVE_INSTALLATION" &&
      installation.installationId !== input.target.installationId)
  ) {
    return failure(
      sequenceAuthority === "PORTABLE_BRANCH"
        ? "FINORA Storage Entitlement target does not match the Control Store branch identity."
        : "FINORA Storage Entitlement target does not match the installed branch identity.",
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

  const portableSequenceStates =
    controlStore.portableStorageEntitlementSequences ?? [];

  if (sequenceAuthority === "PORTABLE_BRANCH") {
    const portableReplayDecision =
      evaluateFinoraPortableStorageEntitlementSequence({
        packageId: input.packageId,

        issuerId: input.issuerId,

        sequence: input.sequence,

        ownerId: input.target.ownerId,

        businessId: input.target.businessId,

        branchId: input.target.branchId,

        appliedControlPackages: appliedPackages,

        controlSequences: sequenceStates,

        portableStorageEntitlementSequences: portableSequenceStates,
      });

    if ("reason" in portableReplayDecision) {
      return failure(
        `${portableReplayDecision.reason}: FINORA portable STORAGE_ENTITLEMENT sequence authority rejected the package.`,
      );
    }
  } else {
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

  if (sequenceAuthority === "PORTABLE_BRANCH") {
    const portableSequenceIndex = portableSequenceStates.findIndex(
      (item) =>
        item.issuerId === input.issuerId &&
        item.ownerId === input.target.ownerId &&
        item.businessId === input.target.businessId &&
        item.branchId === input.target.branchId,
    );

    const nextPortableSequenceState: FinoraPortableStorageEntitlementSequenceStateRecord =
      {
        issuerId: input.issuerId,

        ownerId: input.target.ownerId,

        businessId: input.target.businessId,

        branchId: input.target.branchId,

        lastSequence: input.sequence,

        updatedAt: input.appliedAt,
      };

    if (portableSequenceIndex >= 0) {
      portableSequenceStates[portableSequenceIndex] =
        nextPortableSequenceState;
    } else {
      portableSequenceStates.push(
        nextPortableSequenceState,
      );
    }

    controlStore.portableStorageEntitlementSequences =
      portableSequenceStates;
  } else {
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

    controlStore.controlSequences =
      sequenceStates;
  }

  // ----------------------------------------------------------
  // ONE AUTHORITATIVE STATE OBJECT
  // ----------------------------------------------------------

  controlStore.storageEntitlements = entitlements;

  controlStore.appliedControlPackages = appliedPackages;

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
    () =>
      applyVerifiedStorageEntitlementInternal(
        input,
        "NATIVE_INSTALLATION",
      ),
    () =>
      applyVerifiedStorageEntitlementInternal(
        input,
        "NATIVE_INSTALLATION",
      ),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

export function applyFinoraVerifiedPortableStorageEntitlementState(
  input: FinoraVerifiedStorageEntitlementApplyInput,
): Promise<
  FinoraControlStoreResult<FinoraVerifiedStorageEntitlementApplyResult>
> {
  const operation = controlPackageApplyQueue.then(
    () =>
      applyVerifiedStorageEntitlementInternal(
        input,
        "PORTABLE_BRANCH",
      ),
    () =>
      applyVerifiedStorageEntitlementInternal(
        input,
        "PORTABLE_BRANCH",
      ),
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
  input: FinoraVerifiedBusinessProfileApplyInput,
  sequenceAuthority: FinoraBusinessProfileSequenceAuthority,
): Promise<FinoraControlStoreResult<FinoraVerifiedBusinessProfileApplyResult>> {
  // ----------------------------------------------------------
  // INPUT STRUCTURE
  // ----------------------------------------------------------

  if (
    !isNonEmptyString(input.packageId) ||
    !isNonEmptyString(input.issuerId) ||
    input.purpose !== "BUSINESS_PROFILE" ||
    (input.action !== "ISSUE" && input.action !== "REPLACE") ||
    !Number.isSafeInteger(input.sequence) ||
    input.sequence <= 0 ||
    !isControlTimestamp(input.appliedAt) ||
    !isBusinessProfile(input.profile) ||
    !isRecord(input.target) ||
    !isNonEmptyString(input.target.ownerId) ||
    !isNonEmptyString(input.target.businessId) ||
    !isNonEmptyString(input.target.branchId) ||
    !isNonEmptyString(input.target.installationId)
  ) {
    return failure(
      "A valid verified FINORA Business Profile package is required.",
    );
  }

  // ----------------------------------------------------------
  // PROFILE ↔ TARGET
  // ----------------------------------------------------------

  if (
    input.profile.ownerId !== input.target.ownerId ||
    input.profile.businessId !== input.target.businessId ||
    input.profile.branchId !== input.target.branchId ||
    input.profile.installationId !== input.target.installationId
  ) {
    return failure(
      "FINORA Business Profile identity does not match the verified package target.",
    );
  }

  // ----------------------------------------------------------
  // PROFILE AUDIT TIME
  // ----------------------------------------------------------

  const appliedAtTime = Date.parse(input.appliedAt);

  const profileUpdatedAtTime = Date.parse(input.profile.updatedAt);

  if (
    !Number.isFinite(appliedAtTime) ||
    !Number.isFinite(profileUpdatedAtTime) ||
    profileUpdatedAtTime > appliedAtTime
  ) {
    return failure(
      "FINORA Business Profile update timestamp cannot be later than package application.",
    );
  }

  // ----------------------------------------------------------
  // AUTHORITATIVE CONTROL STORE
  // ----------------------------------------------------------

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const installation = controlStore.installation;

  if (!installation) {
    return failure(
      "FINORA installation identity is required before applying a Business Profile.",
    );
  }

  // ----------------------------------------------------------
  // CONTROL STORE INSTALLATION ↔ VERIFIED TARGET
  // ----------------------------------------------------------

  if (
    installation.ownerId !== input.target.ownerId ||
    installation.businessId !== input.target.businessId ||
    installation.branchId !== input.target.branchId ||
    (sequenceAuthority === "NATIVE_INSTALLATION" &&
      installation.installationId !== input.target.installationId)
  ) {
    return failure(
      sequenceAuthority === "PORTABLE_BRANCH"
        ? "FINORA Business Profile target does not match the Control Store branch identity."
        : "FINORA Business Profile target does not match the Control Store installation identity.",
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

  const installationHasBusinessCode = isNonEmptyString(
    installation.businessCode,
  );

  const installationHasBranchCode = isNonEmptyString(installation.branchCode);

  if (installationHasBusinessCode !== installationHasBranchCode) {
    return failure(
      "FINORA Control Store installation numbering-code state is inconsistent.",
    );
  }

  if (
    installationHasBusinessCode &&
    installationHasBranchCode &&
    (installation.businessCode !== input.profile.businessCode ||
      installation.branchCode !== input.profile.branchCode)
  ) {
    return failure(
      "FINORA Business Profile numbering codes do not match the installation identity.",
    );
  }

  // ----------------------------------------------------------
  // REPLAY / MONOTONIC SEQUENCE
  // ----------------------------------------------------------

  const appliedPackages = controlStore.appliedControlPackages ?? [];

  const sequenceStates = controlStore.controlSequences ?? [];

  const portableSequenceStates =
    controlStore.portableBusinessProfileSequences ?? [];

  if (sequenceAuthority === "PORTABLE_BRANCH") {
    const portableReplayDecision =
      evaluateFinoraPortableBusinessProfileSequence({
        packageId: input.packageId,

        issuerId: input.issuerId,

        sequence: input.sequence,

        ownerId: input.target.ownerId,

        businessId: input.target.businessId,

        branchId: input.target.branchId,

        appliedControlPackages: appliedPackages,

        controlSequences: sequenceStates,

        portableBusinessProfileSequences: portableSequenceStates,
      });

    if ("reason" in portableReplayDecision) {
      return failure(
        `${portableReplayDecision.reason}: FINORA portable BUSINESS_PROFILE sequence authority rejected the package.`,
      );
    }
  } else {
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

  const profiles = controlStore.businessProfiles ?? [];

  const profileIndex = profiles.findIndex(
    (item) =>
      item.ownerId === input.profile.ownerId &&
      item.businessId === input.profile.businessId &&
      item.branchId === input.profile.branchId,
  );

  const sameProfileIdIndex = profiles.findIndex(
    (item) => item.profileId === input.profile.profileId,
  );

  // ----------------------------------------------------------
  // PROFILE ID CANNOT MOVE TO ANOTHER SCOPE
  // ----------------------------------------------------------

  if (sameProfileIdIndex >= 0 && sameProfileIdIndex !== profileIndex) {
    return failure(
      "FINORA Business Profile identity cannot move to another Owner / Business / Branch scope.",
    );
  }

  // ----------------------------------------------------------
  // ISSUE / REPLACE LIFECYCLE
  // ----------------------------------------------------------

  if (input.action === "ISSUE" && profileIndex >= 0) {
    return failure(
      "FINORA Business Profile already exists; a newer signed REPLACE package is required.",
    );
  }

  if (input.action === "REPLACE" && profileIndex < 0) {
    return failure(
      "FINORA Business Profile REPLACE requires an existing signed profile.",
    );
  }

  // ----------------------------------------------------------
  // REPLACE IMMUTABILITY
  // ----------------------------------------------------------

  if (profileIndex >= 0) {
    const existingProfile = profiles[profileIndex];

    if (!existingProfile) {
      return failure("FINORA existing Business Profile state is invalid.");
    }

    if (
      existingProfile.profileId !== input.profile.profileId ||
      existingProfile.ownerId !== input.profile.ownerId ||
      existingProfile.businessId !== input.profile.businessId ||
      existingProfile.branchId !== input.profile.branchId ||
      existingProfile.businessCode !== input.profile.businessCode ||
      existingProfile.branchCode !== input.profile.branchCode ||
      existingProfile.installationId !== input.profile.installationId ||
      existingProfile.bindingKeyId !== input.profile.bindingKeyId ||
      existingProfile.fingerprintAlgorithm !==
        input.profile.fingerprintAlgorithm ||
      existingProfile.publicKeyFingerprint !==
        input.profile.publicKeyFingerprint ||
      existingProfile.createdAt !== input.profile.createdAt
    ) {
      return failure(
        "FINORA Business Profile immutable identity cannot be replaced.",
      );
    }

    profiles[profileIndex] = input.profile;
  } else {
    profiles.push(input.profile);
  }

  controlStore.businessProfiles =
    profiles;

  // ----------------------------------------------------------
  // APPLIED PACKAGE LEDGER
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

  if (sequenceAuthority === "PORTABLE_BRANCH") {
    const portableSequenceIndex = portableSequenceStates.findIndex(
      (item) =>
        item.issuerId === input.issuerId &&
        item.ownerId === input.target.ownerId &&
        item.businessId === input.target.businessId &&
        item.branchId === input.target.branchId,
    );

    const nextPortableSequenceState: FinoraPortableBusinessProfileSequenceStateRecord =
      {
        issuerId: input.issuerId,

        ownerId: input.target.ownerId,

        businessId: input.target.businessId,

        branchId: input.target.branchId,

        lastSequence: input.sequence,

        updatedAt: input.appliedAt,
      };

    if (portableSequenceIndex >= 0) {
      portableSequenceStates[portableSequenceIndex] = nextPortableSequenceState;
    } else {
      portableSequenceStates.push(nextPortableSequenceState);
    }

    controlStore.portableBusinessProfileSequences = portableSequenceStates;
  } else {
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

    controlStore.controlSequences = sequenceStates;
  }

  controlStore.updatedAt = input.appliedAt;

  // ----------------------------------------------------------
  // ONE ENCRYPTED ATOMIC FILE REPLACEMENT
  //
  // profile + replay ledger + monotonic sequence are committed
  // together as one Control Store package.
  // ----------------------------------------------------------

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to atomically persist verified FINORA Business Profile state.",
    );
  }

  return success({
    profile: input.profile,
  });
}

// ============================================================
// SERIALIZED VERIFIED BUSINESS PROFILE APPLY
// ============================================================

export function applyFinoraVerifiedBusinessProfileState(
  input: FinoraVerifiedBusinessProfileApplyInput,
): Promise<FinoraControlStoreResult<FinoraVerifiedBusinessProfileApplyResult>> {
  const operation = controlPackageApplyQueue.then(
    () => applyVerifiedBusinessProfileInternal(input, "NATIVE_INSTALLATION"),
    () => applyVerifiedBusinessProfileInternal(input, "NATIVE_INSTALLATION"),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

export function applyFinoraVerifiedPortableBusinessProfileState(
  input: FinoraVerifiedBusinessProfileApplyInput,
): Promise<FinoraControlStoreResult<FinoraVerifiedBusinessProfileApplyResult>> {
  const operation = controlPackageApplyQueue.then(
    () => applyVerifiedBusinessProfileInternal(input, "PORTABLE_BRANCH"),
    () => applyVerifiedBusinessProfileInternal(input, "PORTABLE_BRANCH"),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
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
  ownerId: string,

  businessId: string,

  branchId: string,
): Promise<FinoraControlStoreResult<FinoraControlBusinessProfile | undefined>> {
  if (
    !isNonEmptyString(ownerId) ||
    !isNonEmptyString(businessId) ||
    !isNonEmptyString(branchId)
  ) {
    return failure(
      "Owner ID, Business ID and Branch ID are required to read the FINORA Business Profile.",
    );
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const installation = currentResult.data.installation;

  if (!installation) {
    return failure(
      "FINORA installation identity is required before reading the Business Profile.",
    );
  }

  // ----------------------------------------------------------
  // CALLER SCOPE MUST BE THIS INSTALLATION
  // ----------------------------------------------------------

  if (
    installation.ownerId !== ownerId ||
    installation.businessId !== businessId ||
    installation.branchId !== branchId
  ) {
    return failure(
      "FINORA Business Profile request does not match the installation identity.",
    );
  }

  const profiles = currentResult.data.businessProfiles ?? [];

  const profile = profiles.find(
    (item) =>
      item.ownerId === ownerId &&
      item.businessId === businessId &&
      item.branchId === branchId,
  );

  if (!profile) {
    return success(undefined);
  }

  // ----------------------------------------------------------
  // DEFENCE-IN-DEPTH INSTALLATION CONSISTENCY
  // ----------------------------------------------------------

  if (profile.installationId !== installation.installationId) {
    return failure(
      "FINORA Business Profile installation identity is inconsistent.",
    );
  }

  if (
    isNonEmptyString(installation.businessCode) &&
    installation.businessCode !== profile.businessCode
  ) {
    return failure(
      "FINORA Business Profile businessCode does not match the installation identity.",
    );
  }

  if (
    isNonEmptyString(installation.branchCode) &&
    installation.branchCode !== profile.branchCode
  ) {
    return failure(
      "FINORA Business Profile branchCode does not match the installation identity.",
    );
  }

  return success(profile);
}

// ============================================================
// FIND PORTABLE SIGNED BUSINESS PROFILE
//
// Historical installation/binding provenance is preserved.
// Authorization remains exact Owner / Business / Branch scope.
// No renderer or caller may rebind signed profile provenance.
// ============================================================

export async function findFinoraPortableBusinessProfile(
  ownerId: string,

  businessId: string,

  branchId: string,
): Promise<FinoraControlStoreResult<FinoraControlBusinessProfile | undefined>> {
  if (
    !isNonEmptyString(ownerId) ||
    !isNonEmptyString(businessId) ||
    !isNonEmptyString(branchId)
  ) {
    return failure(
      "Owner ID, Business ID and Branch ID are required to read the FINORA Business Profile.",
    );
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const installation = currentResult.data.installation;

  if (!installation) {
    return failure(
      "FINORA installation identity is required before reading the Business Profile.",
    );
  }

  // ----------------------------------------------------------
  // CALLER SCOPE MUST BE THIS BRANCH
  // ----------------------------------------------------------

  if (
    installation.ownerId !== ownerId ||
    installation.businessId !== businessId ||
    installation.branchId !== branchId
  ) {
    return failure(
      "FINORA portable Business Profile request does not match the current branch identity.",
    );
  }

  const profiles = currentResult.data.businessProfiles ?? [];

  const profile = profiles.find(
    (item) =>
      item.ownerId === ownerId &&
      item.businessId === businessId &&
      item.branchId === branchId,
  );

  if (!profile) {
    return success(undefined);
  }

  // ----------------------------------------------------------
  // SIGNED HISTORICAL PROVENANCE
  //
  // profile.installationId / binding / fingerprint belong to
  // the signed historical BUSINESS_PROFILE authority and are
  // deliberately NOT rebound to the current portable device.
  // Current authorization is owner/business/branch scoped.
  // ----------------------------------------------------------

  if (
    isNonEmptyString(installation.businessCode) &&
    installation.businessCode !== profile.businessCode
  ) {
    return failure(
      "FINORA Business Profile businessCode does not match the installation identity.",
    );
  }

  if (
    isNonEmptyString(installation.branchCode) &&
    installation.branchCode !== profile.branchCode
  ) {
    return failure(
      "FINORA Business Profile branchCode does not match the installation identity.",
    );
  }

  return success(profile);
}

// ============================================================
// VERIFIED PRICING POLICY APPLY CONTRACT
// ============================================================

export interface FinoraVerifiedPricingPolicyApplyInput {
  packageId: string;

  issuerId: string;

  purpose: "PRICING_POLICY";

  sequence: number;

  /**
   * Pricing Policy is an authoritative snapshot schedule.
   *
   * REPLACE may initialize an absent policy and subsequently
   * replace that same stable overrideSetId lineage.
   */
  action: "REPLACE";

  target: {
    ownerId: string;

    businessId: string;

    branchId: string;

    installationId: string;

    bindingKeyId: string;

    fingerprintAlgorithm: "SHA-256";

    publicKeyFingerprint: string;
  };

  policy: FinoraControlPricingPolicy;

  appliedAt: string;
}

export interface FinoraVerifiedPricingPolicyApplyResult {
  policy: FinoraControlPricingPolicy;
}

// ============================================================
// VERIFIED PRICING POLICY ATOMIC APPLY
// ============================================================

type FinoraPricingPolicySequenceAuthority =
  | "NATIVE_INSTALLATION"
  | "PORTABLE_BRANCH";

async function applyVerifiedPricingPolicyInternal(
  input: FinoraVerifiedPricingPolicyApplyInput,

  sequenceAuthority:
    FinoraPricingPolicySequenceAuthority,
): Promise<FinoraControlStoreResult<FinoraVerifiedPricingPolicyApplyResult>> {
  // ----------------------------------------------------------
  // INPUT STRUCTURE
  // ----------------------------------------------------------

  if (
    !isNonEmptyString(input.packageId) ||
    !isNonEmptyString(input.issuerId) ||
    input.purpose !== "PRICING_POLICY" ||
    input.action !== "REPLACE" ||
    !Number.isSafeInteger(input.sequence) ||
    input.sequence <= 0 ||
    !isControlTimestamp(input.appliedAt) ||
    !isRecord(input.target) ||
    !isNonEmptyString(input.target.ownerId) ||
    !isNonEmptyString(input.target.businessId) ||
    !isNonEmptyString(input.target.branchId) ||
    !isNonEmptyString(input.target.installationId) ||
    !isNonEmptyString(input.target.bindingKeyId) ||
    input.target.fingerprintAlgorithm !== "SHA-256" ||
    typeof input.target.publicKeyFingerprint !== "string" ||
    !/^[0-9a-f]{64}$/.test(input.target.publicKeyFingerprint) ||
    !isPricingPolicy(input.policy)
  ) {
    return failure(
      "A valid verified FINORA Pricing Policy package is required.",
    );
  }

  // ----------------------------------------------------------
  // CANONICAL TARGET BINDING KEY
  // ----------------------------------------------------------

  const expectedTargetBindingKeyId = `FINORA-BINDING-${input.target.publicKeyFingerprint
    .slice(0, 32)
    .toUpperCase()}`;

  if (input.target.bindingKeyId !== expectedTargetBindingKeyId) {
    return failure("FINORA Pricing Policy target binding identity is invalid.");
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
    installation.ownerId !== input.target.ownerId ||
    installation.businessId !== input.target.businessId ||
    installation.branchId !== input.target.branchId ||
    (sequenceAuthority === "NATIVE_INSTALLATION" &&
      installation.installationId !== input.target.installationId)
  ) {
    return failure(
      sequenceAuthority === "PORTABLE_BRANCH"
        ? "FINORA Pricing Policy target does not match the Control Store branch identity."
        : "FINORA Pricing Policy target does not match this installation.",
    );
  }

  // ----------------------------------------------------------
  // POLICY ↔ VERIFIED TARGET BINDING
  // ----------------------------------------------------------

  if (
    input.policy.ownerId !== input.target.ownerId ||
    input.policy.businessId !== input.target.businessId ||
    input.policy.branchId !== input.target.branchId ||
    input.policy.installationId !== input.target.installationId ||
    input.policy.bindingKeyId !== input.target.bindingKeyId ||
    input.policy.fingerprintAlgorithm !== input.target.fingerprintAlgorithm ||
    input.policy.publicKeyFingerprint !== input.target.publicKeyFingerprint
  ) {
    return failure(
      "FINORA Pricing Policy state does not match the verified package target.",
    );
  }

  // ----------------------------------------------------------
  // REPLAY / MONOTONIC SEQUENCE
  // ----------------------------------------------------------

    const appliedPackages = controlStore.appliedControlPackages ?? [];

  const sequenceStates = controlStore.controlSequences ?? [];

  const portableSequenceStates =
    controlStore.portablePricingPolicySequences ?? [];

  if (sequenceAuthority === "PORTABLE_BRANCH") {
    const portableReplayDecision =
      evaluateFinoraPortablePricingPolicySequence({
        packageId: input.packageId,

        issuerId: input.issuerId,

        sequence: input.sequence,

        ownerId: input.target.ownerId,

        businessId: input.target.businessId,

        branchId: input.target.branchId,

        appliedControlPackages: appliedPackages,

        controlSequences: sequenceStates,

        portablePricingPolicySequences: portableSequenceStates,
      });

    if ("reason" in portableReplayDecision) {
      return failure(
        `${portableReplayDecision.reason}: FINORA portable PRICING_POLICY sequence authority rejected the package.`,
      );
    }
  } else {
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
  }

  // ----------------------------------------------------------
  // AUTHORITATIVE PRICING POLICY SNAPSHOT
  //
  // There is intentionally no ISSUE lifecycle.
  //
  // First REPLACE:
  // - initializes an absent authoritative policy.
  //
  // Later REPLACE:
  // - must remain on the same stable overrideSetId lineage.
  //
  // Empty overrides[] remains a valid authoritative schedule
  // and therefore restores Base Pricing.
  // ----------------------------------------------------------

  const policies = controlStore.pricingPolicies ?? [];

    const branchPolicyIndexes =
    policies
      .map(
        (item, index) =>
          item.ownerId === input.policy.ownerId &&
          item.businessId === input.policy.businessId &&
          item.branchId === input.policy.branchId
            ? index
            : -1,
      )
      .filter(
        (index) => index >= 0,
      );

  if (
    sequenceAuthority === "PORTABLE_BRANCH" &&
    branchPolicyIndexes.length > 1
  ) {
    return failure(
      "FINORA portable Pricing Policy state is ambiguous because multiple historical installation-scoped policies exist for this branch.",
    );
  }

  const policyIndex =
    sequenceAuthority === "PORTABLE_BRANCH"
      ? (branchPolicyIndexes[0] ?? -1)
      : policies.findIndex(
          (item) =>
            item.ownerId === input.policy.ownerId &&
            item.businessId === input.policy.businessId &&
            item.branchId === input.policy.branchId &&
            item.installationId === input.policy.installationId,
        );

  const sameOverrideSetIdIndex = policies.findIndex(
    (item) => item.overrideSetId === input.policy.overrideSetId,
  );

  // ----------------------------------------------------------
  // OVERRIDE SET ID CANNOT MOVE TO ANOTHER SCOPE
  // ----------------------------------------------------------

  if (sameOverrideSetIdIndex >= 0 && sameOverrideSetIdIndex !== policyIndex) {
    return failure(
      "FINORA Pricing Policy overrideSetId cannot move to another Owner / Business / Branch / installation scope.",
    );
  }

  // ----------------------------------------------------------
  // REPLACE IMMUTABILITY
  // ----------------------------------------------------------

  if (policyIndex >= 0) {
    const existingPolicy = policies[policyIndex];

    if (!existingPolicy) {
      return failure("FINORA existing Pricing Policy state is invalid.");
    }

    if (
      existingPolicy.overrideSetId !== input.policy.overrideSetId ||
      existingPolicy.ownerId !== input.policy.ownerId ||
      existingPolicy.businessId !== input.policy.businessId ||
      existingPolicy.branchId !== input.policy.branchId ||
      existingPolicy.installationId !== input.policy.installationId ||
      existingPolicy.bindingKeyId !== input.policy.bindingKeyId ||
      existingPolicy.fingerprintAlgorithm !==
        input.policy.fingerprintAlgorithm ||
      existingPolicy.publicKeyFingerprint !== input.policy.publicKeyFingerprint
    ) {
      return failure(
        "FINORA Pricing Policy immutable identity cannot be replaced.",
      );
    }

    policies[policyIndex] = input.policy;
  } else {
    policies.push(input.policy);
  }

  // ----------------------------------------------------------
  // APPLIED PACKAGE LEDGER
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

    if (sequenceAuthority === "PORTABLE_BRANCH") {
    const portableSequenceIndex = portableSequenceStates.findIndex(
      (item) =>
        item.issuerId === input.issuerId &&
        item.ownerId === input.target.ownerId &&
        item.businessId === input.target.businessId &&
        item.branchId === input.target.branchId,
    );

    const nextPortableSequenceState: FinoraPortablePricingPolicySequenceStateRecord =
      {
        issuerId: input.issuerId,

        ownerId: input.target.ownerId,

        businessId: input.target.businessId,

        branchId: input.target.branchId,

        lastSequence: input.sequence,

        updatedAt: input.appliedAt,
      };

    if (portableSequenceIndex >= 0) {
      portableSequenceStates[portableSequenceIndex] = nextPortableSequenceState;
    } else {
      portableSequenceStates.push(nextPortableSequenceState);
    }

    controlStore.portablePricingPolicySequences = portableSequenceStates;
  } else {
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

    controlStore.controlSequences = sequenceStates;
  }

  // ----------------------------------------------------------
  // ONE AUTHORITATIVE STATE OBJECT
  // ----------------------------------------------------------

  controlStore.pricingPolicies = policies;

  controlStore.appliedControlPackages = appliedPackages;


  controlStore.updatedAt = input.appliedAt;

  // ----------------------------------------------------------
  // ONE ENCRYPTED ATOMIC FILE REPLACEMENT
  //
  // Pricing Policy + replay ledger + monotonic sequence are
  // committed together as one Control Store package.
  // ----------------------------------------------------------

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to atomically persist verified FINORA Pricing Policy state.",
    );
  }

  return success({
    policy: input.policy,
  });
}

// ============================================================
// SERIALIZED VERIFIED PRICING POLICY APPLY
// ============================================================

export function applyFinoraVerifiedPricingPolicyState(
  input: FinoraVerifiedPricingPolicyApplyInput,
): Promise<FinoraControlStoreResult<FinoraVerifiedPricingPolicyApplyResult>> {
  const operation = controlPackageApplyQueue.then(
    () => applyVerifiedPricingPolicyInternal(input, "NATIVE_INSTALLATION"),
    () => applyVerifiedPricingPolicyInternal(input, "NATIVE_INSTALLATION"),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

export function applyFinoraVerifiedPortablePricingPolicyState(
  input: FinoraVerifiedPricingPolicyApplyInput,
): Promise<FinoraControlStoreResult<FinoraVerifiedPricingPolicyApplyResult>> {
  const operation = controlPackageApplyQueue.then(
    () => applyVerifiedPricingPolicyInternal(input, "PORTABLE_BRANCH"),
    () => applyVerifiedPricingPolicyInternal(input, "PORTABLE_BRANCH"),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

// ============================================================
// FIND SIGNED PRICING POLICY
// ============================================================

/**
 * Read the current trusted signed FINORA Pricing Policy for one
 * exact Owner / Business / Branch installation scope.
 *
 * READ ONLY:
 *
 * - No Pricing Policy creation.
 * - No Pricing Policy replacement.
 * - No replay-state mutation.
 * - No renderer-provided Pricing authority.
 *
 * Legacy Control Stores may not yet contain pricingPolicies.
 * In that case this returns success(undefined).
 */
export async function findFinoraPricingPolicy(
  ownerId: string,

  businessId: string,

  branchId: string,
): Promise<FinoraControlStoreResult<FinoraControlPricingPolicy | undefined>> {
  if (
    !isNonEmptyString(ownerId) ||
    !isNonEmptyString(businessId) ||
    !isNonEmptyString(branchId)
  ) {
    return failure(
      "Owner ID, Business ID and Branch ID are required to read the FINORA Pricing Policy.",
    );
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const installation = currentResult.data.installation;

  if (!installation) {
    return failure(
      "FINORA installation identity is required before reading the Pricing Policy.",
    );
  }

  // ----------------------------------------------------------
  // CALLER SCOPE MUST BE THIS INSTALLATION
  // ----------------------------------------------------------

  if (
    installation.ownerId !== ownerId ||
    installation.businessId !== businessId ||
    installation.branchId !== branchId
  ) {
    return failure(
      "FINORA Pricing Policy request does not match the installation identity.",
    );
  }

  const policies = currentResult.data.pricingPolicies ?? [];

  const policy = policies.find(
    (item) =>
      item.ownerId === ownerId &&
      item.businessId === businessId &&
      item.branchId === branchId &&
      item.installationId === installation.installationId,
  );

  if (!policy) {
    return success(undefined);
  }

  // ----------------------------------------------------------
  // DEFENCE-IN-DEPTH INSTALLATION CONSISTENCY
  // ----------------------------------------------------------

  if (policy.installationId !== installation.installationId) {
    return failure(
      "FINORA Pricing Policy installation identity is inconsistent.",
    );
  }

  return success(policy);
}
// ============================================================
// VERIFIED WALLET RECHARGE AUTHORIZATION APPLY CONTRACT
// ============================================================

export interface FinoraVerifiedWalletRechargeApplyInput {
  packageId: string;

  issuerId: string;

  signingKeyId: string;

  purpose: "WALLET_RECHARGE";

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

  authorization: FinoraControlWalletRechargeAuthorization;

  appliedAt: string;
}

export interface FinoraVerifiedWalletRechargeApplyResult {
  authorization: FinoraControlWalletRechargeAuthorization;
}

// ============================================================
// VERIFIED WALLET RECHARGE AUTHORIZATION ATOMIC APPLY
// ============================================================

async function applyVerifiedWalletRechargeAuthorizationInternal(
  input: FinoraVerifiedWalletRechargeApplyInput,
): Promise<FinoraControlStoreResult<FinoraVerifiedWalletRechargeApplyResult>> {
  // ----------------------------------------------------------
  // INPUT STRUCTURE
  // ----------------------------------------------------------

  if (
    !isNonEmptyString(input.packageId) ||
    !isNonEmptyString(input.issuerId) ||
    !isNonEmptyString(input.signingKeyId) ||
    input.purpose !== "WALLET_RECHARGE" ||
    !Number.isSafeInteger(input.sequence) ||
    input.sequence <= 0 ||
    !isControlTimestamp(input.appliedAt) ||
    !isRecord(input.target) ||
    !isNonEmptyString(input.target.ownerId) ||
    !isNonEmptyString(input.target.businessId) ||
    !isNonEmptyString(input.target.branchId) ||
    !isNonEmptyString(input.target.installationId) ||
    !isNonEmptyString(input.target.bindingKeyId) ||
    input.target.fingerprintAlgorithm !== "SHA-256" ||
    typeof input.target.publicKeyFingerprint !== "string" ||
    !/^[0-9a-f]{64}$/.test(input.target.publicKeyFingerprint) ||
    !isWalletRechargeAuthorization(input.authorization)
  ) {
    return failure(
      "A valid verified FINORA Wallet Recharge authorization package is required.",
    );
  }

  const expectedTargetBindingKeyId = `FINORA-BINDING-${input.target.publicKeyFingerprint
    .slice(0, 32)
    .toUpperCase()}`;

  if (input.target.bindingKeyId !== expectedTargetBindingKeyId) {
    return failure(
      "FINORA Wallet Recharge target binding identity is invalid.",
    );
  }

  // ----------------------------------------------------------
  // AUTHORIZATION <-> VERIFIED PACKAGE EVIDENCE
  // ----------------------------------------------------------

  const authorization = input.authorization;

  if (
    authorization.packageId !== input.packageId ||
    authorization.issuerId !== input.issuerId ||
    authorization.signingKeyId !== input.signingKeyId ||
    authorization.purpose !== input.purpose ||
    authorization.sequence !== input.sequence ||
    authorization.ownerId !== input.target.ownerId ||
    authorization.businessId !== input.target.businessId ||
    authorization.branchId !== input.target.branchId ||
    authorization.installationId !== input.target.installationId ||
    authorization.bindingKeyId !== input.target.bindingKeyId ||
    authorization.fingerprintAlgorithm !== input.target.fingerprintAlgorithm ||
    authorization.publicKeyFingerprint !== input.target.publicKeyFingerprint ||
    authorization.verifiedAt !== input.appliedAt
  ) {
    return failure(
      "FINORA Wallet Recharge authorization does not match the verified signed package target.",
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

  if (!installation) {
    return failure(
      "FINORA installation identity is required before applying a Wallet Recharge authorization.",
    );
  }

  if (
    installation.ownerId !== input.target.ownerId ||
    installation.businessId !== input.target.businessId ||
    installation.branchId !== input.target.branchId ||
    installation.installationId !== input.target.installationId
  ) {
    return failure(
      "FINORA Wallet Recharge authorization target does not match the installed branch identity.",
    );
  }

  const authorizations = controlStore.walletRechargeAuthorizations ?? [];

  const declines = controlStore.walletRechargeDeclines ?? [];

  const appliedPackages = controlStore.appliedControlPackages ?? [];

  const sequenceStates = controlStore.controlSequences ?? [];

  // ----------------------------------------------------------
  // PACKAGE REPLAY
  // ----------------------------------------------------------

  if (appliedPackages.some((item) => item.packageId === input.packageId)) {
    return failure(
      "FINORA Wallet Recharge signed package has already been applied.",
    );
  }

  // ----------------------------------------------------------
  // ----------------------------------------------------------
  // PAYMENT REFERENCE DECLINE CONFLICT
  // ----------------------------------------------------------

  if (
    declines.some(
      (item) => item.paymentReference === authorization.paymentReference,
    )
  ) {
    return failure(
      "FINORA Wallet Recharge payment reference has already been declined.",
    );
  }

  // ----------------------------------------------------------  // PAYMENT REFERENCE DUPLICATE AUTHORIZATION
  //
  // A fresh package must never authorize the same payment
  // reference a second time.
  // ----------------------------------------------------------

  if (
    authorizations.some(
      (item) => item.paymentReference === authorization.paymentReference,
    )
  ) {
    return failure(
      "FINORA Wallet Recharge payment reference has already been authorized.",
    );
  }

  // ----------------------------------------------------------
  // MONOTONIC SEQUENCE
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

  if (
    sequenceIndex >= 0 &&
    input.sequence <= sequenceStates[sequenceIndex].lastSequence
  ) {
    return failure("FINORA Wallet Recharge signed package sequence is stale.");
  }

  // ----------------------------------------------------------
  // AUTHORIZATION APPEND
  // ----------------------------------------------------------

  authorizations.push(authorization);

  // ----------------------------------------------------------
  // APPLIED PACKAGE LEDGER
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

  controlStore.walletRechargeAuthorizations = authorizations;

  controlStore.appliedControlPackages = appliedPackages;

  controlStore.controlSequences = sequenceStates;

  controlStore.updatedAt = input.appliedAt;

  // ----------------------------------------------------------
  // ONE ENCRYPTED CONTROL STORE REPLACEMENT
  //
  // Authorization + replay ledger + monotonic sequence are
  // committed together.
  // ----------------------------------------------------------

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to atomically persist verified FINORA Wallet Recharge authorization state.",
    );
  }

  return success({
    authorization,
  });
}

// ============================================================
// SERIALIZED VERIFIED WALLET RECHARGE APPLY
// ============================================================

export function applyFinoraVerifiedWalletRechargeAuthorizationState(
  input: FinoraVerifiedWalletRechargeApplyInput,
): Promise<FinoraControlStoreResult<FinoraVerifiedWalletRechargeApplyResult>> {
  const operation = controlPackageApplyQueue.then(
    () => applyVerifiedWalletRechargeAuthorizationInternal(input),
    () => applyVerifiedWalletRechargeAuthorizationInternal(input),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

// ============================================================
// FIND VERIFIED WALLET RECHARGE AUTHORIZATION
// ============================================================

export async function findFinoraWalletRechargeAuthorization(
  ownerId: string,

  businessId: string,

  branchId: string,

  paymentReference: string,
): Promise<
  FinoraControlStoreResult<FinoraControlWalletRechargeAuthorization | undefined>
> {
  if (
    !isNonEmptyString(ownerId) ||
    !isNonEmptyString(businessId) ||
    !isNonEmptyString(branchId) ||
    !isNonEmptyString(paymentReference)
  ) {
    return failure(
      "Owner ID, Business ID, Branch ID and payment reference are required to read a FINORA Wallet Recharge authorization.",
    );
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const installation = currentResult.data.installation;

  if (!installation) {
    return failure(
      "FINORA installation identity is required before reading a Wallet Recharge authorization.",
    );
  }

  if (
    installation.ownerId !== ownerId ||
    installation.businessId !== businessId ||
    installation.branchId !== branchId
  ) {
    return failure(
      "FINORA Wallet Recharge authorization request does not match the installation identity.",
    );
  }

  const authorizations = currentResult.data.walletRechargeAuthorizations ?? [];

  const authorization = authorizations.find(
    (item) =>
      item.ownerId === ownerId &&
      item.businessId === businessId &&
      item.branchId === branchId &&
      item.installationId === installation.installationId &&
      item.paymentReference === paymentReference,
  );

  if (!authorization) {
    return success(undefined);
  }

  if (authorization.installationId !== installation.installationId) {
    return failure(
      "FINORA Wallet Recharge authorization installation identity is inconsistent.",
    );
  }

  return success(authorization);
}

// ============================================================
// ============================================================
// VERIFIED WALLET RECHARGE DECLINE APPLY CONTRACT
// ============================================================

export interface FinoraVerifiedWalletRechargeDeclineApplyInput {
  packageId: string;

  issuerId: string;

  signingKeyId: string;

  purpose: "WALLET_RECHARGE_DECLINE";

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

  decline: FinoraControlWalletRechargeDeclineEvidence;

  appliedAt: string;
}

export interface FinoraVerifiedWalletRechargeDeclineApplyResult {
  decline: FinoraControlWalletRechargeDeclineEvidence;
}

async function applyVerifiedWalletRechargeDeclineInternal(
  input: FinoraVerifiedWalletRechargeDeclineApplyInput,
): Promise<
  FinoraControlStoreResult<FinoraVerifiedWalletRechargeDeclineApplyResult>
> {
  if (
    !isNonEmptyString(input.packageId) ||
    !isNonEmptyString(input.issuerId) ||
    !isNonEmptyString(input.signingKeyId) ||
    input.purpose !== "WALLET_RECHARGE_DECLINE" ||
    !Number.isSafeInteger(input.sequence) ||
    input.sequence <= 0 ||
    !isControlTimestamp(input.appliedAt) ||
    !isRecord(input.target) ||
    !isNonEmptyString(input.target.ownerId) ||
    !isNonEmptyString(input.target.businessId) ||
    !isNonEmptyString(input.target.branchId) ||
    !isNonEmptyString(input.target.installationId) ||
    !isNonEmptyString(input.target.bindingKeyId) ||
    input.target.fingerprintAlgorithm !== "SHA-256" ||
    typeof input.target.publicKeyFingerprint !== "string" ||
    !/^[0-9a-f]{64}$/.test(input.target.publicKeyFingerprint) ||
    !isWalletRechargeDeclineEvidence(input.decline)
  ) {
    return failure(
      "A valid verified FINORA Wallet Recharge Decline package is required.",
    );
  }

  const expectedTargetBindingKeyId = `FINORA-BINDING-${input.target.publicKeyFingerprint
    .slice(0, 32)
    .toUpperCase()}`;

  if (input.target.bindingKeyId !== expectedTargetBindingKeyId) {
    return failure(
      "FINORA Wallet Recharge Decline target binding identity is invalid.",
    );
  }

  const decline = input.decline;

  if (
    decline.packageId !== input.packageId ||
    decline.issuerId !== input.issuerId ||
    decline.signingKeyId !== input.signingKeyId ||
    decline.purpose !== input.purpose ||
    decline.sequence !== input.sequence ||
    decline.ownerId !== input.target.ownerId ||
    decline.businessId !== input.target.businessId ||
    decline.branchId !== input.target.branchId ||
    decline.installationId !== input.target.installationId ||
    decline.bindingKeyId !== input.target.bindingKeyId ||
    decline.fingerprintAlgorithm !== input.target.fingerprintAlgorithm ||
    decline.publicKeyFingerprint !== input.target.publicKeyFingerprint ||
    decline.verifiedAt !== input.appliedAt
  ) {
    return failure(
      "FINORA Wallet Recharge Decline evidence does not match the verified signed package target.",
    );
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore = currentResult.data;

  const installation = controlStore.installation;

  if (!installation) {
    return failure(
      "FINORA installation identity is required before applying a Wallet Recharge Decline.",
    );
  }

  if (
    installation.ownerId !== input.target.ownerId ||
    installation.businessId !== input.target.businessId ||
    installation.branchId !== input.target.branchId ||
    installation.installationId !== input.target.installationId
  ) {
    return failure(
      "FINORA Wallet Recharge Decline target does not match the installed branch identity.",
    );
  }

  const authorizations = controlStore.walletRechargeAuthorizations ?? [];

  const declines = controlStore.walletRechargeDeclines ?? [];

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
    return failure(replayDecision.error);
  }

  if (
    authorizations.some(
      (item) => item.paymentReference === decline.paymentReference,
    )
  ) {
    return failure(
      "FINORA Wallet Recharge payment reference has already been authorized and cannot be declined.",
    );
  }

  if (
    declines.some(
      (item) =>
        item.paymentReference === decline.paymentReference ||
        item.requestId === decline.requestId,
    )
  ) {
    return failure("FINORA Wallet Recharge request has already been declined.");
  }

  declines.push(decline);

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

  controlStore.walletRechargeDeclines = declines;

  controlStore.appliedControlPackages = appliedPackages;

  controlStore.controlSequences = sequenceStates;

  controlStore.updatedAt = input.appliedAt;

  try {
    await persistControlStorePackage(controlStore);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to atomically persist verified FINORA Wallet Recharge Decline state.",
    );
  }

  return success({
    decline,
  });
}

// ============================================================
// SERIALIZED VERIFIED WALLET RECHARGE DECLINE APPLY
// ============================================================

export function applyFinoraVerifiedWalletRechargeDeclineState(
  input: FinoraVerifiedWalletRechargeDeclineApplyInput,
): Promise<
  FinoraControlStoreResult<FinoraVerifiedWalletRechargeDeclineApplyResult>
> {
  const operation = controlPackageApplyQueue.then(
    () => applyVerifiedWalletRechargeDeclineInternal(input),
    () => applyVerifiedWalletRechargeDeclineInternal(input),
  );

  controlPackageApplyQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

// ============================================================
// FIND VERIFIED WALLET RECHARGE DECLINE
// ============================================================

export async function findFinoraWalletRechargeDecline(
  ownerId: string,

  businessId: string,

  branchId: string,

  paymentReference: string,
): Promise<
  FinoraControlStoreResult<
    FinoraControlWalletRechargeDeclineEvidence | undefined
  >
> {
  if (
    !isNonEmptyString(ownerId) ||
    !isNonEmptyString(businessId) ||
    !isNonEmptyString(branchId) ||
    !isNonEmptyString(paymentReference)
  ) {
    return failure(
      "Owner ID, Business ID, Branch ID and payment reference are required to read a FINORA Wallet Recharge Decline.",
    );
  }

  const currentResult = await readFinoraControlStore();

  if (!currentResult.success || !currentResult.data) {
    return failure(
      currentResult.error ?? "Unable to load the FINORA Control Store.",
    );
  }

  const installation = currentResult.data.installation;

  if (!installation) {
    return failure(
      "FINORA installation identity is required to read a Wallet Recharge Decline.",
    );
  }

  if (
    installation.ownerId !== ownerId ||
    installation.businessId !== businessId ||
    installation.branchId !== branchId
  ) {
    return failure(
      "FINORA Wallet Recharge Decline request does not match the installation identity.",
    );
  }

  const declines = currentResult.data.walletRechargeDeclines ?? [];

  const decline = declines.find(
    (item) =>
      item.ownerId === ownerId &&
      item.businessId === businessId &&
      item.branchId === branchId &&
      item.installationId === installation.installationId &&
      item.paymentReference === paymentReference,
  );

  if (!decline) {
    return success(undefined);
  }

  if (decline.installationId !== installation.installationId) {
    return failure(
      "FINORA Wallet Recharge Decline installation identity is inconsistent.",
    );
  }

  return success(decline);
}
// FIND CURRENT BRANCH ACCESS GRANT
// ============================================================

// ============================================================
// CREATE BRANCH ACCESS GRANT
//
// DEVELOPMENT BOOTSTRAP ONLY.
//
// This direct Control Store helper may create a missing
// Branch Access Grant, but it must never replace an existing
// grant.
//
// Production ISSUE / RENEW / REPLACE / SUSPEND / RESUME /
// REVOKE authority remains exclusively in the verified signed
// package-apply path. This function is not renderer IPC.
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
    return failure(
      "Existing FINORA Branch Access Grants cannot be changed through direct Control Store mutation.",
    );
  }

  branchAccessGrants.push(accessGrant);

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
