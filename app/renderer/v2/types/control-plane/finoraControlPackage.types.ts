// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL PLANE
// SIGNED CONTROL PACKAGE TYPES
//
// RESPONSIBILITY:
//
// - Define the canonical offline FINORA Control Package envelope
// - Define Control Center issuer identity
// - Bind packages to Owner / Business / Branch / Installation
// - Define deterministic signing metadata
// - Define package validity windows
// - Define package replay / sequencing metadata
// - Define package verification outcomes
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No private signing keys.
// - No signing implementation.
// - No signature verification implementation.
// - No filesystem.
// - No Electron IPC.
// - No Android plugin access.
// - No localStorage.
// - No wallet mutation.
// - No activation mutation.
// - No pricing mutation.
//
// SECURITY MODEL:
//
// FINORA Control Center
//   -> owns PRIVATE signing key
//   -> produces signed packages
//
// FINORA Branch Client
//   -> owns PUBLIC verification key only
//   -> verifies signed packages
//   -> never receives the Control Center private key
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  OwnerId,
  BusinessId,
  BranchId,
} from "../business/business.scope.types";

import type {
  FinoraInstallationId,
} from "../activation/finoraInstallation.types";

// ============================================================
// PACKAGE ID
// ============================================================

/**
 * Immutable identity of one signed FINORA control package.
 */
export type FinoraControlPackageId =
  string;

// ============================================================
// ISSUER
// ============================================================

/**
 * Logical FINORA authority issuing a control package.
 *
 * The current production issuer is the FINORA Control Center.
 */
export type FinoraControlIssuerType =
  "FINORA_CONTROL_CENTER";

/**
 * Stable identifier of one trusted FINORA Control Center.
 */
export type FinoraControlIssuerId =
  string;

/**
 * Identifies the public/private signing-key pair used to sign
 * one control package.
 *
 * The private key itself MUST NOT be represented in this
 * renderer/client contract.
 */
export type FinoraControlSigningKeyId =
  string;

export interface FinoraControlIssuer {

  type:
    FinoraControlIssuerType;

  issuerId:
    FinoraControlIssuerId;

  signingKeyId:
    FinoraControlSigningKeyId;
}

// ============================================================
// PACKAGE PURPOSE
// ============================================================

/**
 * High-level business purpose carried by one signed package.
 *
 * Detailed payload contracts are introduced by their owning
 * FINORA domains in later implementation phases.
 */
export type FinoraControlPackagePurpose =
  | "BRANCH_ACTIVATION"
  | "STORAGE_ENTITLEMENT"
  | "BUSINESS_PROFILE"
  | "PRICING_POLICY"
  | "WALLET_RECHARGE"
  | "CONTROL_BUNDLE";

// ============================================================
// TARGET
// ============================================================

/**
 * Canonical target of a FINORA control package.
 *
 * installationId is optional because some Control Center
 * packages may be prepared before final device binding.
 *
 * Packages requiring device binding MUST enforce it at their
 * owning service boundary.
 */
export interface FinoraControlPackageTarget {

  ownerId:
    OwnerId;

  businessId:
    BusinessId;

  branchId:
    BranchId;

  installationId?:
    FinoraInstallationId;
}

// ============================================================
// PACKAGE VALIDITY
// ============================================================

/**
 * Cryptographic package-envelope validity.
 *
 * This validity is NOT the same as a commercial registration,
 * Demo or subscription validity.
 *
 * Example:
 *
 * - a recharge voucher may be importable for a limited period;
 * - the branch activation payload may independently remain valid
 *   for a different commercial period.
 */
export interface FinoraControlPackageValidity {

  /**
   * Earliest timestamp at which the package may be accepted.
   */
  notBefore?: string;

  /**
   * Timestamp after which this package envelope must no longer
   * be accepted.
   */
  expiresAt?: string;
}

// ============================================================
// SEQUENCE
// ============================================================

/**
 * Monotonic Control Center sequence used by package-consuming
 * domains to reject stale/replayed control state where required.
 */
export type FinoraControlSequence =
  number;

// ============================================================
// DIGEST
// ============================================================

export type FinoraControlDigestAlgorithm =
  "SHA-256";

/**
 * Lowercase hexadecimal SHA-256 digest.
 */
export interface FinoraControlPayloadDigest {

  algorithm:
    FinoraControlDigestAlgorithm;

  value:
    string;
}

// ============================================================
// SIGNATURE
// ============================================================

/**
 * FINORA v1 signing algorithm.
 *
 * P-256 + SHA-256 is intentionally explicit so Electron and
 * Android can share the same verification contract.
 */
export type FinoraControlSignatureAlgorithm =
  "ECDSA_P256_SHA256";

/**
 * Portable ECDSA signature byte encoding used by both
 * Control Center signing and Branch Client verification.
 *
 * P-256 IEEE-P1363 = 32-byte R + 32-byte S.
 */
export type FinoraControlSignatureEncoding =
  "IEEE_P1363";

/**
 * Deterministic FINORA canonical serialization contract.
 *
 * The implementation is introduced separately from this type
 * contract.
 */
export type FinoraControlCanonicalization =
  "FINORA_CANONICAL_JSON_V1";

export interface FinoraControlSignature {

  algorithm:
    FinoraControlSignatureAlgorithm;

  encoding:
    FinoraControlSignatureEncoding;

  canonicalization:
    FinoraControlCanonicalization;

  signingKeyId:
    FinoraControlSigningKeyId;

  /**
   * Base64 encoded signature bytes.
   */
  value:
    string;
}

// ============================================================
// SIGNED PACKAGE
// ============================================================

/**
 * Canonical FINORA signed offline control package.
 *
 * Signature covers the canonical unsigned package fields,
 * including payload and payloadDigest.
 */
export interface FinoraSignedControlPackage<
  TPayload extends object =
    Record<string, unknown>,
> {

  packageId:
    FinoraControlPackageId;

  purpose:
    FinoraControlPackagePurpose;

  issuer:
    FinoraControlIssuer;

  target:
    FinoraControlPackageTarget;

  /**
   * Control Center issuance timestamp.
   */
  issuedAt:
    string;

  /**
   * Optional package-envelope acceptance window.
   */
  validity?:
    FinoraControlPackageValidity;

  /**
   * Monotonic issuer sequence.
   *
   * Must be a positive safe integer.
   */
  sequence:
    FinoraControlSequence;

  /**
   * Version of the domain-specific payload contract.
   */
  payloadVersion:
    number;

  payload:
    TPayload;

  payloadDigest:
    FinoraControlPayloadDigest;

  signature:
    FinoraControlSignature;

  schemaVersion:
    1;
}

// ============================================================
// UNSIGNED PACKAGE
// ============================================================

/**
 * Package representation before the privileged Control Center
 * signing boundary adds the final signature.
 */
export type FinoraUnsignedControlPackage<
  TPayload extends object =
    Record<string, unknown>,
> =
  Omit<
    FinoraSignedControlPackage<TPayload>,
    "signature"
  >;

// ============================================================
// VERIFICATION FAILURE REASONS
// ============================================================

export type FinoraControlVerificationFailure =
  | "MALFORMED_PACKAGE"
  | "UNSUPPORTED_SCHEMA"
  | "UNSUPPORTED_ALGORITHM"
  | "INVALID_PAYLOAD_DIGEST"
  | "INVALID_SIGNATURE"
  | "UNKNOWN_SIGNING_KEY"
  | "UNTRUSTED_ISSUER"
  | "SIGNING_KEY_REVOKED"
  | "SIGNING_KEY_NOT_VALID"
  | "NOT_YET_VALID"
  | "PACKAGE_EXPIRED"
  | "TARGET_MISMATCH"
  | "STALE_SEQUENCE"
  | "REPLAYED_PACKAGE";

// ============================================================
// VERIFICATION RESULT
// ============================================================

export interface FinoraControlVerificationSuccess {

  valid:
    true;

  packageId:
    FinoraControlPackageId;

  purpose:
    FinoraControlPackagePurpose;

  signingKeyId:
    FinoraControlSigningKeyId;
}

export interface FinoraControlVerificationFailureResult {

  valid:
    false;

  reason:
    FinoraControlVerificationFailure;

  error:
    string;

  packageId?:
    FinoraControlPackageId;
}

export type FinoraControlVerificationResult =
  | FinoraControlVerificationSuccess
  | FinoraControlVerificationFailureResult;

// ============================================================
// END
// ============================================================