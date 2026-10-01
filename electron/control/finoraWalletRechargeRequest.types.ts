/* ============================================================
   FINORA ENTERPRISE OS™

   WALLET RECHARGE REQUEST EXCHANGE

   MODULE  : Wallet
   LAYER   : Native Shared Contract
   VERSION : 2.0
   STATUS  : Production Foundation

   SECURITY:
   - V1 remains defined only for historical compatibility.
   - New Owner Wallet Recharge Requests use portable V2.
   - V2 carries the current installation public identity and
     both installation-possession + Branch Certification proofs.
============================================================ */

import type {
  FinoraBranchCertificationSignatureV1,
} from "./finoraBranchCertificationContract.js";

export const FINORA_WALLET_RECHARGE_REQUEST_PURPOSE =
  "WALLET_RECHARGE_REQUEST" as const;

export const FINORA_WALLET_RECHARGE_REQUEST_SCHEMA_VERSION_V1 =
  1 as const;

export const FINORA_WALLET_RECHARGE_REQUEST_SCHEMA_VERSION_V2 =
  2 as const;

/*
 * Current production emission version.
 * Historical V1 types use the explicit V1 constant above.
 */
export const FINORA_WALLET_RECHARGE_REQUEST_SCHEMA_VERSION =
  FINORA_WALLET_RECHARGE_REQUEST_SCHEMA_VERSION_V1;

export const FINORA_WALLET_RECHARGE_REQUEST_SIGNATURE_ALGORITHM =
  "ECDSA_P256_SHA256" as const;

export const FINORA_WALLET_RECHARGE_REQUEST_SIGNATURE_ENCODING =
  "IEEE_P1363" as const;

export const FINORA_WALLET_RECHARGE_REQUEST_CANONICALIZATION =
  "FINORA_CANONICAL_JSON_V1" as const;

export const FINORA_WALLET_RECHARGE_REQUEST_FINGERPRINT_ALGORITHM =
  "SHA-256" as const;

export const FINORA_WALLET_RECHARGE_REQUEST_CURRENCY =
  "INR" as const;

// ============================================================
// PAYMENT
// ============================================================

export type FinoraWalletRechargeRequestPaymentMethod =
  | "UPI"
  | "PHONEPE"
  | "GOOGLE_PAY"
  | "PAYTM"
  | "RAZORPAY"
  | "BANK_TRANSFER"
  | "OTHER";

export type FinoraWalletRechargeRequestPaymentSource =
  | "PHONEPE"
  | "RAZORPAY"
  | "UPI"
  | "GOOGLE_PAY"
  | "PAYTM"
  | "BANK_TRANSFER"
  | "MANUAL";

// ============================================================
// SCOPE / DISPLAY
// ============================================================

export interface FinoraWalletRechargeRequestScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export interface FinoraWalletRechargeRequestDisplayIdentity {
  businessCode:
    string;

  branchCode:
    string;
}

// ============================================================
// INSTALLATION IDENTITY
// ============================================================

export interface FinoraWalletRechargeRequestInstallationBindingV1 {
  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    typeof FINORA_WALLET_RECHARGE_REQUEST_FINGERPRINT_ALGORITHM;

  publicKeyFingerprint:
    string;
}

export interface FinoraWalletRechargeRequestInstallationBindingV2
  extends FinoraWalletRechargeRequestInstallationBindingV1 {

  platform:
    string;

  algorithm:
    typeof FINORA_WALLET_RECHARGE_REQUEST_SIGNATURE_ALGORITHM;

  publicKeyFormat:
    "SPKI_DER_BASE64";

  publicKey:
    string;

  createdAt:
    string;

  schemaVersion:
    1;
}

/*
 * Historical public name retained for V1 consumers.
 */
export type FinoraWalletRechargeRequestInstallationBinding =
  FinoraWalletRechargeRequestInstallationBindingV1;

// ============================================================
// PAYLOADS
// ============================================================

interface FinoraWalletRechargeRequestPayloadBase {
  purpose:
    typeof FINORA_WALLET_RECHARGE_REQUEST_PURPOSE;

  requestId:
    string;

  paymentReference:
    string;

  scope:
    FinoraWalletRechargeRequestScope;

  displayIdentity:
    FinoraWalletRechargeRequestDisplayIdentity;

  amountMinor:
    number;

  currency:
    typeof FINORA_WALLET_RECHARGE_REQUEST_CURRENCY;

  paymentMethod:
    FinoraWalletRechargeRequestPaymentMethod;

  paymentSource:
    FinoraWalletRechargeRequestPaymentSource;

  requestedAt:
    string;
}

export interface FinoraWalletRechargeRequestPayloadV1
  extends FinoraWalletRechargeRequestPayloadBase {

  installation:
    FinoraWalletRechargeRequestInstallationBindingV1;

  schemaVersion:
    typeof FINORA_WALLET_RECHARGE_REQUEST_SCHEMA_VERSION_V1;
}

export interface FinoraWalletRechargeRequestPayloadV2
  extends FinoraWalletRechargeRequestPayloadBase {

  installation:
    FinoraWalletRechargeRequestInstallationBindingV2;

  schemaVersion:
    typeof FINORA_WALLET_RECHARGE_REQUEST_SCHEMA_VERSION_V2;
}

// ============================================================
// INSTALLATION POSSESSION SIGNATURE
// ============================================================

export interface FinoraWalletRechargeRequestSignature {
  algorithm:
    typeof FINORA_WALLET_RECHARGE_REQUEST_SIGNATURE_ALGORITHM;

  encoding:
    typeof FINORA_WALLET_RECHARGE_REQUEST_SIGNATURE_ENCODING;

  canonicalization:
    typeof FINORA_WALLET_RECHARGE_REQUEST_CANONICALIZATION;

  bindingKeyId:
    string;

  value:
    string;
}

// ============================================================
// SIGNED REQUESTS
// ============================================================

export interface FinoraSignedWalletRechargeRequestV1 {
  payload:
    FinoraWalletRechargeRequestPayloadV1;

  signature:
    FinoraWalletRechargeRequestSignature;

  schemaVersion:
    typeof FINORA_WALLET_RECHARGE_REQUEST_SCHEMA_VERSION_V1;
}

export interface FinoraSignedWalletRechargeRequestV2 {
  payload:
    FinoraWalletRechargeRequestPayloadV2;

  signature:
    FinoraWalletRechargeRequestSignature;

  branchCertificationSignature:
    FinoraBranchCertificationSignatureV1;

  schemaVersion:
    typeof FINORA_WALLET_RECHARGE_REQUEST_SCHEMA_VERSION_V2;
}

export type FinoraSignedWalletRechargeRequest =
  | FinoraSignedWalletRechargeRequestV1
  | FinoraSignedWalletRechargeRequestV2;

/* ============================================================
   END
============================================================ */
