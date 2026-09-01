/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET TRANSACTION DESCRIPTION

   RESPONSIBILITY:
   - Resolve owner-facing Wallet transaction titles
   - Resolve canonical FINORA transaction references
   - Format Wallet transaction subtitle text
   - Keep Wallet history presentation metadata deterministic

   IMPORTANT:
   - Pure helper only.
   - No React.
   - No persistence.
   - No repository access.
   - No balance calculations.
   - No payment gateway logic.
   - Prefer canonical FINORA references over raw storage IDs.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

import type {
  WalletTransactionType,
} from "../../types/wallet/wallet.types";

/* ============================================================
   INPUT
============================================================ */

export interface WalletTransactionReferenceInput {
  customerId?:
    string;

  loanNumber?:
    string;

  collectionNumber?:
    string;

  receiptNumber?:
    string;

  fallbackReference?:
    string;
}

export interface WalletTransactionDescriptionInput
  extends WalletTransactionReferenceInput {
  type:
    WalletTransactionType;

  occurredAt:
    string;
}

/* ============================================================
   OUTPUT
============================================================ */

export interface WalletTransactionDescription {
  title:
    string;

  reference:
    string;

  dateTime:
    string;

  subtitle:
    string;
}

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeText(
  value: string | undefined,
): string {
  return String(value ?? "").trim();
}

/* ============================================================
   TITLE RESOLUTION
============================================================ */

export function resolveWalletTransactionTitle(
  type: WalletTransactionType,
): string {
  switch (type) {
    case "WALLET_RECHARGE":
      return "FINORA Wallet Recharge";

    case "LOAN_DISBURSEMENT_PLATFORM_FEE":
      return "Loan Disbursement Platform Fee";

    case "LOAN_NUMBER_GENERATION_FEE":
      return "Loan Number Generation Fee";

    case "CUSTOMER_NUMBER_GENERATION_FEE":
      return "Customer Number Generation Fee";

    case "COLLECTION_PROCESSING_FEE":
      return "Collection Processing Fee";

    case "RECEIPT_PROCESSING_FEE":
      return "Receipt Processing Fee";

    case "CUSTOMER_ID_CARD_GENERATION_FEE":
      return "Customer ID Card Generation Fee";

    case "OTHER_PLATFORM_FEE":
      return "FINORA Platform Fee";

    default:
      return "FINORA Wallet Transaction";
  }
}

/* ============================================================
   REFERENCE RESOLUTION
============================================================ */

export function resolveWalletTransactionReference(
  type: WalletTransactionType,
  input: WalletTransactionReferenceInput,
): string {
  const customerId =
    normalizeText(input.customerId);

  const loanNumber =
    normalizeText(input.loanNumber);

  const collectionNumber =
    normalizeText(input.collectionNumber);

  const receiptNumber =
    normalizeText(input.receiptNumber);

  const fallbackReference =
    normalizeText(input.fallbackReference);

  switch (type) {
    case "LOAN_DISBURSEMENT_PLATFORM_FEE":
    case "LOAN_NUMBER_GENERATION_FEE":
      return (
        loanNumber ||
        customerId ||
        fallbackReference
      );

    case "CUSTOMER_NUMBER_GENERATION_FEE":
    case "CUSTOMER_ID_CARD_GENERATION_FEE":
      return (
        customerId ||
        fallbackReference
      );

    case "COLLECTION_PROCESSING_FEE":
      return (
        collectionNumber ||
        loanNumber ||
        customerId ||
        fallbackReference
      );

    case "RECEIPT_PROCESSING_FEE":
      return (
        receiptNumber ||
        collectionNumber ||
        loanNumber ||
        customerId ||
        fallbackReference
      );

    case "WALLET_RECHARGE":
    case "OTHER_PLATFORM_FEE":
    default:
      return fallbackReference;
  }
}

/* ============================================================
   DATE TIME FORMAT
============================================================ */

export function formatWalletTransactionDateTime(
  occurredAt: string,
): string {
  const normalizedOccurredAt =
    normalizeText(occurredAt);

  if (!normalizedOccurredAt) {
    return "";
  }

  const date =
    new Date(normalizedOccurredAt);

  if (Number.isNaN(date.getTime())) {
    return normalizedOccurredAt;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        true,
    },
  ).format(date);
}

/* ============================================================
   DESCRIPTION BUILDER
============================================================ */

export function buildWalletTransactionDescription(
  input: WalletTransactionDescriptionInput,
): WalletTransactionDescription {
  const title =
    resolveWalletTransactionTitle(
      input.type,
    );

  const reference =
    resolveWalletTransactionReference(
      input.type,
      input,
    );

  const dateTime =
    formatWalletTransactionDateTime(
      input.occurredAt,
    );

  const subtitle =
    [reference, dateTime]
      .filter(Boolean)
      .join(" • ");

  return {
    title,
    reference,
    dateTime,
    subtitle,
  };
}

/* ============================================================
   END
============================================================ */
