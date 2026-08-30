/* ===========================================================
   FINORA ENTERPRISE OS™
   ACCOUNTS ENGINE™

   COLLECTION → ACCOUNT ENTRY MAPPER

   RESPONSIBILITY:
   - Convert approved Collection records into Accounts rows
   - Use actual paymentAmount as Money In
   - Preserve receipt and payment-method information
   - Resolve Gold / Standard type from authoritative Loan
   - Preserve valid collections even when related Loan metadata
     is unavailable
   - Report unsafe source records without corrupting totals

   IMPORTANT:
   - No React.
   - No styles.
   - No persistence.
   - No repository access.
   - No mutation.
   - No totals.
   - No filtering.
   - No currency formatting.
   - No theme logic.
   - No responsive logic.

   ACCOUNT RULE:

   APPROVED COLLECTION
          ↓
   paymentAmount
          ↓
   MONEY IN
          ↓
   CREDIT

   IMPORTANT:

   discountAmount
          ↓
   NOT CASH RECEIVED
          ↓
   NEVER ADD TO MONEY IN

   VERSION : 1.0
=========================================================== */

import type { CollectionReviewData } from "../../components/collections/CollectionReviewData";

import type { Loan } from "../../components/customers/office/CustomerOffice/types";

import {
  ACCOUNT_ACTIVITY_DESCRIPTIONS,
  ACCOUNT_PAYMENT_METHOD_LABELS,
} from "../../constants/accounts/accounts.constants";

import type {
  AccountDataIssue,
  AccountEntry,
  AccountLoanType,
  AccountPaymentMethod,
} from "../../types/accounts/accounts.types";

import { resolveAccountLoanType } from "./loanAccount.mapper";

/* ===========================================================
   RUNTIME COLLECTION

   Repository preserves storage ID at runtime without changing
   the public CollectionReviewData contract.
=========================================================== */

type RuntimeCollection = CollectionReviewData & {
  id?: string;
};

/* ===========================================================
   MAPPING RESULT
=========================================================== */

export interface CollectionAccountMappingResult {
  entries: AccountEntry[];

  issues: AccountDataIssue[];
}

/* ===========================================================
   SAFE NUMBER
=========================================================== */

function safeNumber(value: unknown): number {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return numericValue;
}

/* ===========================================================
   SAFE TEXT
=========================================================== */

function safeText(value: unknown, fallback = ""): string {
  const text = String(value ?? "").trim();

  return text || fallback;
}

/* ===========================================================
   LOCAL DATE KEY

   Accounts follows the owner's local calendar date.

   UTC slicing is intentionally avoided because it can move
   transactions to another date in Indian local time.
=========================================================== */

function resolveLocalDateKey(value: string): string | null {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* ===========================================================
   OCCURRED AT

   Primary:
   receiptDate

   Historical compatibility fallback:
   createdAt
=========================================================== */

function resolveCollectionOccurredAt(
  collection: CollectionReviewData,
): string | null {
  const receiptDate = safeText(collection.receiptDate);

  if (receiptDate && resolveLocalDateKey(receiptDate)) {
    return receiptDate;
  }

  const createdAt = safeText(collection.createdAt);

  if (createdAt && resolveLocalDateKey(createdAt)) {
    return createdAt;
  }

  return null;
}

/* ===========================================================
   PAYMENT METHOD NORMALIZATION

   IMPORTANT:

   Original paymentMethod text is always preserved separately
   for owner-facing display.

   Only known FINORA values are normalized.

   Unknown text is never guessed.
=========================================================== */

export function resolveAccountPaymentMethod(
  paymentMethod: string,
): AccountPaymentMethod {
  const normalized = safeText(paymentMethod)
    .toUpperCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized === "CASH") {
    return "CASH";
  }

  if (normalized === "UPI") {
    return "UPI";
  }

  if (normalized === "BANK TRANSFER" || normalized === "BANK") {
    return "BANK_TRANSFER";
  }

  if (normalized === "CHEQUE" || normalized === "CHECK") {
    return "CHEQUE";
  }

  if (normalized === "CARD") {
    return "CARD";
  }

  if (normalized === "OTHER") {
    return "OTHER";
  }

  return "UNKNOWN";
}

/* ===========================================================
   COLLECTION IDENTITY

   Preferred order:

   1. Repository runtime storage ID
   2. Receipt number
   3. Loan ID + creation timestamp

   This preserves stable Accounts row identity without using
   loanId alone because one Loan can have many Collections.
=========================================================== */

function resolveCollectionIdentity(
  collection: RuntimeCollection,
): string | null {
  const runtimeId = safeText(collection.id);

  if (runtimeId) {
    return runtimeId;
  }

  const receiptNumber = safeText(collection.receiptNumber);

  if (receiptNumber) {
    return `RECEIPT:${receiptNumber}`;
  }

  const loanId = safeText(collection.loanId);

  const createdAt = safeText(collection.createdAt);

  if (loanId && createdAt) {
    return `${loanId}:${createdAt}`;
  }

  return null;
}

/* ===========================================================
   COLLECTION DESCRIPTION
=========================================================== */

function resolveCollectionDescription(loanType?: AccountLoanType): string {
  if (loanType === "GOLD") {
    return ACCOUNT_ACTIVITY_DESCRIPTIONS.GOLD_LOAN_COLLECTION;
  }

  if (loanType === "STANDARD") {
    return ACCOUNT_ACTIVITY_DESCRIPTIONS.STANDARD_LOAN_COLLECTION;
  }

  return "Collection Received";
}

/* ===========================================================
   COLLECTION AMOUNT

   ONLY paymentAmount represents actual incoming money.

   DO NOT ADD:
   - discountAmount
   - advanceAdjustment
   - outstandingBalance
   - penaltyAmount separately

   paymentAmount is already the final persisted transaction
   amount prepared by the Collection workflow.
=========================================================== */

export function resolveCollectionAccountAmount(
  collection: CollectionReviewData,
): number | null {
  const paymentAmount = safeNumber(collection.paymentAmount);

  if (paymentAmount <= 0) {
    return null;
  }

  return paymentAmount;
}

/* ===========================================================
   SINGLE COLLECTION → ACCOUNT ENTRY
=========================================================== */

export function mapCollectionToAccountEntry(
  collection: CollectionReviewData,

  relatedLoan?: Loan,

  goldLoanIds?: ReadonlySet<string>,
): AccountEntry | null {
  /*
   * Draft is not a finalized financial movement.
   */
  if (collection.status !== "Approved") {
    return null;
  }

  const runtimeCollection = collection as RuntimeCollection;

  const identity = resolveCollectionIdentity(runtimeCollection);

  if (!identity) {
    return null;
  }

  const loanId = safeText(collection.loanId);

  if (!loanId) {
    return null;
  }

  const occurredAt = resolveCollectionOccurredAt(collection);

  if (!occurredAt) {
    return null;
  }

  const dateKey = resolveLocalDateKey(occurredAt);

  if (!dateKey) {
    return null;
  }

  const amount = resolveCollectionAccountAmount(collection);

  if (amount === null || amount <= 0) {
    return null;
  }

  const receiptNumber = safeText(collection.receiptNumber);

  const loanNumber = safeText(collection.loanNumber, loanId);

  const customerId = safeText(collection.customerId);

  const customerName = safeText(collection.customerName, "--");

  const customerPhone = safeText(collection.customerPhone);

  const sourcePaymentMethod = safeText(collection.paymentMethod);

  const paymentMethod = resolveAccountPaymentMethod(sourcePaymentMethod);

  const paymentMethodLabel =
    paymentMethod === "OTHER"
      ? sourcePaymentMethod || ACCOUNT_PAYMENT_METHOD_LABELS.OTHER
      : paymentMethod === "UNKNOWN"
        ? sourcePaymentMethod || ACCOUNT_PAYMENT_METHOD_LABELS.UNKNOWN
        : ACCOUNT_PAYMENT_METHOD_LABELS[paymentMethod];

  const loanType: AccountLoanType | undefined = goldLoanIds?.has(loanId)
    ? "GOLD"
    : relatedLoan
      ? resolveAccountLoanType(relatedLoan, goldLoanIds)
      : undefined;

  const remarks = safeText(collection.remarks);

  const collectionId =
    safeText(runtimeCollection.id) || receiptNumber || identity;

  return {
    id: `COLLECTION:${identity}`,

    sourceType: "COLLECTION",

    sourceId: collectionId,

    sourceReference: receiptNumber || collectionId,

    occurredAt,

    dateKey,

    direction: "CREDIT",

    moneyFlow: "MONEY_IN",

    activity: "COLLECTION_RECEIVED",

    amount,

    moneyOut: 0,

    moneyIn: amount,

    customerId,

    customerName,

    customerPhone: customerPhone || undefined,

    loanId,

    loanNumber,

    loanType,

    collectionId,

    receiptNumber: receiptNumber || undefined,

    paymentMethod,

    paymentMethodLabel: paymentMethodLabel || "--",

    description: resolveCollectionDescription(loanType),

    remarks: remarks || undefined,
  };
}

/* ===========================================================
   ISSUE FACTORY
=========================================================== */

function createCollectionMappingIssue(
  collection: CollectionReviewData,
  message: string,
): AccountDataIssue {
  const runtimeCollection = collection as RuntimeCollection;

  return {
    sourceType: "COLLECTION",

    sourceId:
      safeText(runtimeCollection.id) ||
      safeText(collection.receiptNumber) ||
      safeText(collection.loanId, "UNKNOWN"),

    message,
  };
}

/* ===========================================================
   LOAN LOOKUP
=========================================================== */

function createLoanLookup(loans: readonly Loan[]): Map<string, Loan> {
  const lookup = new Map<string, Loan>();

  for (const loan of loans) {
    const loanId = safeText(loan.id);

    if (!loanId) {
      continue;
    }

    lookup.set(loanId, loan);
  }

  return lookup;
}

/* ===========================================================
   MULTIPLE COLLECTIONS → ACCOUNT ENTRIES

   IMPORTANT:

   Draft collections:
   - intentionally ignored
   - not treated as data corruption

   Approved collection without related Loan:
   - cash movement is preserved
   - loanType remains undefined
   - issue is reported
   - no Gold / Standard guessing
=========================================================== */

export function mapCollectionsToAccountEntries(
  collections: readonly CollectionReviewData[],

  loans: readonly Loan[] = [],

  goldLoanIds?: ReadonlySet<string>,
): CollectionAccountMappingResult {
  const entries: AccountEntry[] = [];

  const issues: AccountDataIssue[] = [];

  const loanLookup = createLoanLookup(loans);

  for (const collection of collections) {
    /*
     * Draft is not Accounts activity.
     */
    if (collection.status !== "Approved") {
      continue;
    }

    const runtimeCollection = collection as RuntimeCollection;

    if (!resolveCollectionIdentity(runtimeCollection)) {
      issues.push(
        createCollectionMappingIssue(
          collection,
          "Collection identity could not be resolved.",
        ),
      );

      continue;
    }

    const loanId = safeText(collection.loanId);

    if (!loanId) {
      issues.push(
        createCollectionMappingIssue(
          collection,
          "Collection Loan ID is missing.",
        ),
      );

      continue;
    }

    const occurredAt = resolveCollectionOccurredAt(collection);

    if (!occurredAt) {
      issues.push(
        createCollectionMappingIssue(
          collection,
          "Collection receipt date and creation date are missing or invalid.",
        ),
      );

      continue;
    }

    const amount = resolveCollectionAccountAmount(collection);

    if (amount === null || amount <= 0) {
      issues.push(
        createCollectionMappingIssue(
          collection,
          "Collection payment amount must be greater than zero.",
        ),
      );

      continue;
    }

    const relatedLoan = loanLookup.get(loanId);

    /*
     * Missing Loan metadata must NOT remove valid incoming cash
     * from Accounts.
     */
    if (!relatedLoan) {
      issues.push(
        createCollectionMappingIssue(
          collection,
          "Related Loan was not found. Collection is preserved but Loan type is unavailable.",
        ),
      );
    }

    const entry = mapCollectionToAccountEntry(
      collection,
      relatedLoan,
      goldLoanIds,
    );

    if (!entry) {
      issues.push(
        createCollectionMappingIssue(
          collection,
          "Unable to create Accounts entry from Collection.",
        ),
      );

      continue;
    }

    entries.push(entry);
  }

  return {
    entries,

    issues,
  };
}

/* ===========================================================
   END
=========================================================== */
