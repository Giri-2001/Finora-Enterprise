/* ===========================================================
   FINORA ENTERPRISE OS™
   ACCOUNTS ENGINE™

   LOAN → ACCOUNT ENTRY MAPPER

   RESPONSIBILITY:
   - Convert persisted Loan records into Accounts read-model rows
   - Resolve actual Loan disbursement amount
   - Normalize Standard / Gold Loan classification
   - Normalize owner-facing Money Out metadata
   - Report unsafe source records without corrupting totals

   IMPORTANT:
   - No React.
   - No styles.
   - No persistence.
   - No repository access.
   - No mutation.
   - No account totals.
   - No filtering.
   - No currency formatting.
   - No theme logic.
   - No responsive logic.

   ACCOUNT RULE:

   LOAN DISBURSEMENT
        ↓
   MONEY OUT
        ↓
   DEBIT

   AUTHORITATIVE AMOUNT:

   1. Loan.netDisbursement
   2. Historical fallback:
      Loan.amount
        - Loan.processingFee
        - Loan.advanceDeduction

   VERSION : 1.0
=========================================================== */

import type { Loan } from "../../components/customers/office/CustomerOffice/types";

import {
  ACCOUNT_ACTIVITY_DESCRIPTIONS,
  ACCOUNT_PAYMENT_METHOD_LABELS,
} from "../../constants/accounts/accounts.constants";

import type {
  AccountDataIssue,
  AccountEntry,
  AccountLoanType,
} from "../../types/accounts/accounts.types";

/* ===========================================================
   MAPPING RESULT
=========================================================== */

export interface LoanAccountMappingResult {
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

   IMPORTANT:

   Do not use:
   ISO_STRING.slice(0, 10)

   because UTC timestamps can move to a different local
   calendar date in India.

   Accounts must follow the owner's local calendar date.
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
   LOAN TYPE

   Gold classification is intentionally tolerant of
   historical text variants.

   Examples:
   GOLD
   GOLD_LOAN
   GOLD LOAN
   Gold Loan

   Anything that is not explicitly Gold is treated as the
   Standard Loan family for Accounts presentation.
=========================================================== */

export function resolveAccountLoanType(
  loan: Loan,

  goldLoanIds?: ReadonlySet<string>,
): AccountLoanType {
  const loanId = safeText(loan.id);

  /*
   * Authoritative Gold history wins.
   *
   * A released Gold Loan must remain a Gold Loan forever
   * in Accounts history, so classification cannot depend on
   * active custody only.
   */
  if (loanId && goldLoanIds?.has(loanId)) {
    return "GOLD";
  }

  /*
   * Historical compatibility fallback.
   *
   * Older records may already carry Gold identity directly
   * in loanType / title.
   */
  const sourceText = [loan.loanType, loan.title]
    .map((value) => safeText(value).toUpperCase())
    .join(" ");

  if (sourceText.includes("GOLD")) {
    return "GOLD";
  }

  return "STANDARD";
}
/* ===========================================================
   NET DISBURSEMENT

   Primary:
   Loan.netDisbursement

   Historical fallback:
   Principal
     - Processing Fee
     - Advance Deduction

   The fallback exists only for older Loan records created
   before netDisbursement was persisted.
=========================================================== */

export function resolveLoanAccountDisbursementAmount(
  loan: Loan,
): number | null {
  const persistedNetDisbursement = safeNumber(loan.netDisbursement);

  if (persistedNetDisbursement > 0) {
    return persistedNetDisbursement;
  }

  const principal = safeNumber(loan.amount);

  if (principal <= 0) {
    return null;
  }

  const processingFee = Math.max(0, safeNumber(loan.processingFee));

  const advanceDeduction = Math.max(0, safeNumber(loan.advanceDeduction));

  const derivedNetDisbursement = principal - processingFee - advanceDeduction;

  if (!Number.isFinite(derivedNetDisbursement) || derivedNetDisbursement <= 0) {
    return null;
  }

  return derivedNetDisbursement;
}

/* ===========================================================
   DESCRIPTION
=========================================================== */

function resolveLoanDescription(loanType: AccountLoanType): string {
  if (loanType === "GOLD") {
    return ACCOUNT_ACTIVITY_DESCRIPTIONS.GOLD_LOAN_DISBURSEMENT;
  }

  return ACCOUNT_ACTIVITY_DESCRIPTIONS.STANDARD_LOAN_DISBURSEMENT;
}

/* ===========================================================
   SINGLE LOAN → ACCOUNT ENTRY
=========================================================== */

export function mapLoanToAccountEntry(
  loan: Loan,

  goldLoanIds?: ReadonlySet<string>,
): AccountEntry | null {
  const sourceId = safeText(loan.id);

  if (!sourceId) {
    return null;
  }

  const occurredAt = safeText(loan.loanDate);

  if (!occurredAt) {
    return null;
  }

  const dateKey = resolveLocalDateKey(occurredAt);

  if (!dateKey) {
    return null;
  }

  const amount = resolveLoanAccountDisbursementAmount(loan);

  if (amount === null || amount <= 0) {
    return null;
  }

  const loanType = resolveAccountLoanType(loan, goldLoanIds);

  const loanNumber = safeText(loan.loanNumber, sourceId);

  const customerId = safeText(loan.customerId);

  const customerName = safeText(loan.customerName, "--");

  const customerPhone = safeText(loan.phoneNumber);

  const remarks = safeText(loan.remarks);

  return {
    id: `LOAN:${sourceId}`,

    sourceType: "LOAN",

    sourceId,

    sourceReference: loanNumber,

    occurredAt,

    dateKey,

    direction: "DEBIT",

    moneyFlow: "MONEY_OUT",

    activity: "LOAN_DISBURSEMENT",

    amount,

    moneyOut: amount,

    moneyIn: 0,

    customerId,

    customerName,

    customerPhone: customerPhone || undefined,

    loanId: sourceId,

    loanNumber,

    loanType,

    collectionId: undefined,

    receiptNumber: undefined,

    /*
     * Current Loan contract does not persist
     * disbursement payment method.
     *
     * Never guess Cash / Bank / UPI.
     */
    paymentMethod: "UNKNOWN",

    paymentMethodLabel: ACCOUNT_PAYMENT_METHOD_LABELS.UNKNOWN,

    description: resolveLoanDescription(loanType),

    remarks: remarks || undefined,
  };
}

/* ===========================================================
   ISSUE FACTORY
=========================================================== */

function createLoanMappingIssue(loan: Loan, message: string): AccountDataIssue {
  return {
    sourceType: "LOAN",

    sourceId: safeText(loan.id, "UNKNOWN"),

    message,
  };
}

/* ===========================================================
   MULTIPLE LOANS → ACCOUNT ENTRIES

   Invalid source records are intentionally skipped from
   ledger totals and exposed separately as issues.
=========================================================== */

export function mapLoansToAccountEntries(
  loans: readonly Loan[],

  goldLoanIds?: ReadonlySet<string>,
): LoanAccountMappingResult {
  const entries: AccountEntry[] = [];

  const issues: AccountDataIssue[] = [];

  for (const loan of loans) {
    if (!safeText(loan.id)) {
      issues.push(createLoanMappingIssue(loan, "Loan ID is missing."));

      continue;
    }

    if (!safeText(loan.loanDate) || !resolveLocalDateKey(loan.loanDate)) {
      issues.push(
        createLoanMappingIssue(loan, "Loan date is missing or invalid."),
      );

      continue;
    }

    const amount = resolveLoanAccountDisbursementAmount(loan);

    if (amount === null || amount <= 0) {
      issues.push(
        createLoanMappingIssue(
          loan,
          "Unable to resolve a valid Loan disbursement amount.",
        ),
      );

      continue;
    }

    const entry = mapLoanToAccountEntry(loan, goldLoanIds);

    if (!entry) {
      issues.push(
        createLoanMappingIssue(
          loan,
          "Unable to create Accounts entry from Loan.",
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
