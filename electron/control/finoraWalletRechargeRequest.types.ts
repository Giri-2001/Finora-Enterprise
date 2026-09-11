/* ============================================================
   FINORA ENTERPRISE OS™

   WALLET RECHARGE REQUEST EXCHANGE

   MODULE  : Wallet
   LAYER   : Native Shared Contract
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Define one canonical Owner -> Control Center Wallet Recharge
     request artifact.
   - Bind the request to the exact authenticated branch scope.
   - Bind the request to the exact native installation identity.
   - Carry stable paymentReference identity.
   - Carry human-readable Business / Branch codes for operator UX.
   - Carry one native installation-binding possession signature.

   SECURITY:

   - The filename is NEVER authority.
   - businessCode / branchCode are display + filename metadata only.
   - ownerId / businessId / branchId + native installation binding
     are authoritative request scope.
   - Signature verification must use the provisioned Branch Registry
     installation public key.
   - No Control Center private signing material exists here.
   - No Wallet credit is authorized by this request.
   - This request only asks the Control Center to make a decision.

   IMPORTANT:

   - REQ != DONE.
   - A valid REQ never credits Wallet balance.
   - Only a separately signed Control Center WALLET_RECHARGE
     authorization may credit the Wallet.
============================================================ */

export const FINORA_WALLET_RECHARGE_REQUEST_PURPOSE =
  "WALLET_RECHARGE_REQUEST" as const;

export const FINORA_WALLET_RECHARGE_REQUEST_SCHEMA_VERSION =
  1 as const;

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
// PAYMENT METHOD
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
// AUTHORITATIVE BRANCH SCOPE
// ============================================================

export interface FinoraWalletRechargeRequestScope {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

// ============================================================
// DISPLAY IDENTITY
//
// These values improve filename/operator readability.
// They are NOT independent authorization authority.
// ============================================================

export interface FinoraWalletRechargeRequestDisplayIdentity {

  businessCode:
    string;

  branchCode:
    string;
}

// ============================================================
// NATIVE INSTALLATION BINDING
// ============================================================

export interface FinoraWalletRechargeRequestInstallationBinding {

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    typeof FINORA_WALLET_RECHARGE_REQUEST_FINGERPRINT_ALGORITHM;

  publicKeyFingerprint:
    string;
}

// ============================================================
// CANONICAL SIGNED PAYLOAD
// ============================================================

export interface FinoraWalletRechargeRequestPayloadV1 {

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

  installation:
    FinoraWalletRechargeRequestInstallationBinding;

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

  schemaVersion:
    typeof FINORA_WALLET_RECHARGE_REQUEST_SCHEMA_VERSION;
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
// SIGNED REQUEST
// ============================================================

export interface FinoraSignedWalletRechargeRequestV1 {

  payload:
    FinoraWalletRechargeRequestPayloadV1;

  signature:
    FinoraWalletRechargeRequestSignature;

  schemaVersion:
    typeof FINORA_WALLET_RECHARGE_REQUEST_SCHEMA_VERSION;
}

export type FinoraSignedWalletRechargeRequest =
  FinoraSignedWalletRechargeRequestV1;

/* ============================================================
   END
============================================================ */