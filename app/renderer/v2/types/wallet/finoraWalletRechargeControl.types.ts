/* ============================================================
   FINORA ENTERPRISE OS™

   SIGNED WALLET RECHARGE ENGINE™

   CONTROL CONTRACTS

   RESPONSIBILITY:

   - Define the canonical WALLET_RECHARGE signed payload
   - Reuse the generic FINORA signed Control Package envelope
   - Bind Recharge authorization to exact branch installation
   - Preserve stable paymentReference identity
   - Separate signed verification evidence from Wallet mutation time

   IMPORTANT:

   - TYPES / CONTRACTS ONLY.
   - No persistence.
   - No signing.
   - No signature verification.
   - No Wallet balance mutation.
   - No Business Date.
   - No payment gateway dependency.
   - No duplicate generic signed-package authority.
   - Wallet financial occurredAt / updatedAt timestamps are NOT
     represented by verifiedAt.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

import type {
  FinoraInstallationBindingTarget,
} from "../activation/finoraInstallationBinding.types";

import type {
  FinoraSignedControlPackage,
} from "../control-plane/finoraControlPackage.types";

import type {
  WalletPaymentReference,
  WalletPaymentSource,
  WalletRechargePaymentMethod,
} from "./wallet.types";

/* ============================================================
   CONSTANTS
============================================================ */

export const FINORA_WALLET_RECHARGE_CONTROL_PURPOSE =
  "WALLET_RECHARGE" as const;

export const FINORA_WALLET_RECHARGE_PAYLOAD_VERSION =
  1 as const;

export const FINORA_WALLET_RECHARGE_AUTHORIZATION_VERSION =
  1 as const;

/* ============================================================
   CURRENCY
============================================================ */

/**
 * Ready-to-Use v1 Wallet Recharge currency.
 *
 * Initial production deployment is INR-only.
 */
export type FinoraWalletRechargeCurrency =
  "INR";

/* ============================================================
   SCOPE
============================================================ */

/**
 * Exact operational scope carried by the signed Recharge
 * payload.
 *
 * installation identity remains separately represented by
 * installationBinding.
 */
export interface FinoraWalletRechargeScope {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

/* ============================================================
   SIGNED DOMAIN PAYLOAD
============================================================ */

/**
 * Canonical v1 WALLET_RECHARGE payload.
 *
 * paymentReference is the stable payment/recharge identity used
 * by the Wallet idempotency engine.
 *
 * walletId is deliberately not signed here. It is derived from
 * the authoritative Owner / Business / Branch Wallet scope and
 * must match the local Payment Intent at the consuming boundary.
 *
 * verifiedAt is deliberately absent. Verification time is native
 * evidence produced after cryptographic verification; it must
 * never become the Wallet financial mutation clock.
 */
export interface FinoraWalletRechargeControlPayloadV1 {

  scope:
    FinoraWalletRechargeScope;

  installationBinding:
    FinoraInstallationBindingTarget;

  paymentReference:
    WalletPaymentReference;

  /**
   * Must be a positive safe integer expressed in INR minor units.
   *
   * Runtime enforcement belongs to the signed-package apply
   * service and Wallet mutation boundary.
   */
  amountMinor:
    number;

  currency:
    FinoraWalletRechargeCurrency;

  paymentMethod:
    WalletRechargePaymentMethod;

  paymentSource:
    WalletPaymentSource;

  providerOrderId?:
    string;

  providerTransactionId?:
    string;

  /**
   * Must match the generic Control Package issuedAt exactly.
   *
   * This is signed-package evidence only. It is never a Wallet
   * financial occurredAt / updatedAt timestamp.
   */
  issuedAt:
    string;

  schemaVersion:
    1;
}

export type FinoraWalletRechargeControlPayload =
  FinoraWalletRechargeControlPayloadV1;

/* ============================================================
   TYPED SIGNED PACKAGE
============================================================ */

/**
 * WALLET_RECHARGE specialization of the existing generic FINORA
 * signed Control Package.
 *
 * The generic envelope remains the sole authority for packageId,
 * issuer, target, validity, sequence, digest and signature.
 */
export type FinoraSignedWalletRechargeControlPackageV1 =
  Omit<
    FinoraSignedControlPackage<
      FinoraWalletRechargeControlPayloadV1
    >,
    "purpose" | "payloadVersion"
  > & {
    purpose:
      typeof FINORA_WALLET_RECHARGE_CONTROL_PURPOSE;

    payloadVersion:
      typeof FINORA_WALLET_RECHARGE_PAYLOAD_VERSION;
  };

export type FinoraSignedWalletRechargeControlPackage =
  FinoraSignedWalletRechargeControlPackageV1;

/* ============================================================
   VERIFIED NATIVE AUTHORIZATION
============================================================ */

/**
 * Sanitized result of a successfully verified and accepted
 * signed WALLET_RECHARGE package.
 *
 * This object contains public verification evidence only.
 * It contains no signature private material.
 *
 * verifiedAt is the native verification/application evidence
 * timestamp. It MUST NOT drive Wallet createdAt, updatedAt,
 * lastTransactionAt or recoverySnapshot financial timestamps.
 */
export interface FinoraVerifiedWalletRechargeAuthorizationV1 {

  packageId:
    FinoraSignedControlPackage["packageId"];

  issuerId:
    FinoraSignedControlPackage["issuer"]["issuerId"];

  signingKeyId:
    FinoraSignedControlPackage["issuer"]["signingKeyId"];

  purpose:
    typeof FINORA_WALLET_RECHARGE_CONTROL_PURPOSE;

  sequence:
    FinoraSignedControlPackage["sequence"];

  scope:
    FinoraWalletRechargeScope;

  installationBinding:
    FinoraInstallationBindingTarget;

  paymentReference:
    WalletPaymentReference;

  amountMinor:
    number;

  currency:
    FinoraWalletRechargeCurrency;

  paymentMethod:
    WalletRechargePaymentMethod;

  paymentSource:
    WalletPaymentSource;

  providerOrderId?:
    string;

  providerTransactionId?:
    string;

  /**
   * Original signed package issuance timestamp.
   */
  issuedAt:
    string;

  /**
   * Actual native signed-package verification/application time.
   *
   * Evidence only; not the Wallet financial mutation clock.
   */
  verifiedAt:
    string;

  schemaVersion:
    typeof FINORA_WALLET_RECHARGE_AUTHORIZATION_VERSION;
}

export type FinoraVerifiedWalletRechargeAuthorization =
  FinoraVerifiedWalletRechargeAuthorizationV1;

/* ============================================================
   END
============================================================ */
