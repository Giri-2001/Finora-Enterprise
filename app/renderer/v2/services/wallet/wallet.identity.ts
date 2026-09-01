/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET IDENTITY + IDEMPOTENCY

   RESPONSIBILITY:
   - Build deterministic Wallet identifiers
   - Build deterministic transaction identifiers
   - Build deterministic idempotency keys
   - Normalize identity components safely

   IMPORTANT:
   - PURE FUNCTIONS ONLY.
   - No React.
   - No persistence.
   - No repository access.
   - No payment gateway calls.
   - No balance mutation.
   - No random identifiers.
============================================================ */

import type {
  WalletId,
  WalletTransactionId,
} from "../../types/wallet/wallet.types";

import type {
  WalletTransactionSourceType,
} from "../../types/wallet/wallet.transaction.types";

/* ============================================================
   INTERNAL NORMALIZATION
============================================================ */

function normalizeIdentityPart(
  value: string,
): string {
  const normalized =
    value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  if (!normalized) {
    throw new Error(
      "FINORA Wallet identity part cannot be empty.",
    );
  }

  return normalized;
}

/* ============================================================
   WALLET ID
============================================================ */

/**
 * One deterministic Wallet per Owner / Business / Branch scope.
 */
export function buildWalletId(input: {
  ownerId: string;
  businessId: string;
  branchId: string;
}): WalletId {
  const ownerId =
    normalizeIdentityPart(input.ownerId);

  const businessId =
    normalizeIdentityPart(input.businessId);

  const branchId =
    normalizeIdentityPart(input.branchId);

  return [
    "FINORA",
    "WALLET",
    ownerId,
    businessId,
    branchId,
  ].join(":");
}

/* ============================================================
   TRANSACTION ID
============================================================ */

/**
 * Deterministic transaction identity.
 *
 * sourceReference must be stable for the originating operation.
 *
 * Examples:
 * - provider payment reference
 * - loan id
 * - collection id
 */
export function buildWalletTransactionId(input: {
  walletId: WalletId;
  sourceType: WalletTransactionSourceType;
  sourceReference: string;
  transactionKind: "RECHARGE" | "DEBIT";
}): WalletTransactionId {
  const walletId =
    normalizeIdentityPart(input.walletId);

  const sourceType =
    normalizeIdentityPart(input.sourceType);

  const sourceReference =
    normalizeIdentityPart(input.sourceReference);

  const transactionKind =
    normalizeIdentityPart(input.transactionKind);

  return [
    "FINORA",
    "WALLET-TXN",
    walletId,
    transactionKind,
    sourceType,
    sourceReference,
  ].join(":");
}

/* ============================================================
   RECHARGE IDEMPOTENCY
============================================================ */

/**
 * Prevents the same verified payment from crediting
 * the Wallet more than once.
 */
export function buildWalletRechargeIdempotencyKey(input: {
  walletId: WalletId;
  paymentReference: string;
}): string {
  return [
    "FINORA",
    "WALLET",
    "RECHARGE",
    normalizeIdentityPart(input.walletId),
    normalizeIdentityPart(input.paymentReference),
  ].join(":");
}

/* ============================================================
   DEBIT IDEMPOTENCY
============================================================ */

/**
 * Prevents duplicate platform-fee deduction for the same
 * billable FINORA operation.
 */
export function buildWalletDebitIdempotencyKey(input: {
  walletId: WalletId;
  sourceType: WalletTransactionSourceType;
  sourceId: string;
  chargeCode: string;
}): string {
  return [
    "FINORA",
    "WALLET",
    "DEBIT",
    normalizeIdentityPart(input.walletId),
    normalizeIdentityPart(input.sourceType),
    normalizeIdentityPart(input.sourceId),
    normalizeIdentityPart(input.chargeCode),
  ].join(":");
}

/* ============================================================
   END
============================================================ */
