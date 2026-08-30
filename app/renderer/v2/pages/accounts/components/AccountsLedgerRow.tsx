/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS LEDGER ROW

   MODULE  : Accounts
   LAYER   : Register Row Presentation
   VERSION : 1.0

   RESPONSIBILITY:

   - Render one physical Accounts Register row
   - Render local ledger date and transaction time
   - Render customer identity
   - Render owner-facing activity
   - Render Gold / Standard loan identity
   - Render Money Out / Money In
   - Render payment method
   - Render authoritative source reference
   - Reuse global FINORA currency formatter

   IMPORTANT:

   - No inline styles.
   - No repository access.
   - No filtering.
   - No totals calculation.
   - No financial mutation.
   - No responsive calculation.
   - No theme calculation.
=========================================================== */

/* ===========================================================
   ICONS
=========================================================== */

import { Gem, HandCoins, WalletCards } from "lucide-react";

/* ===========================================================
   CONSTANTS
=========================================================== */

import {
  ACCOUNT_LOAN_TYPE_LABELS,
  ACCOUNTS_EMPTY_VALUE,
  ACCOUNTS_NUMBER_LOCALE,
} from "../../../constants/accounts/accounts.constants";

/* ===========================================================
   TYPES
=========================================================== */

import type { AccountEntry } from "../../../types/accounts/accounts.types";

/* ===========================================================
   SHARED MONEY FORMATTER
=========================================================== */

import { formatCurrency } from "../../../utils/currency/formatCurrency";

/* ===========================================================
   STYLE CONTRACT
=========================================================== */

import {
  ACCOUNTS_LEDGER_ACTIVITY_CLASSES,
  ACCOUNTS_LEDGER_CELL_CLASSES,
  ACCOUNTS_LEDGER_CUSTOMER_CLASSES,
  ACCOUNTS_LEDGER_DATE_CLASSES,
  ACCOUNTS_LEDGER_ICON_CLASSES,
  ACCOUNTS_LEDGER_METHOD_CLASSES,
  ACCOUNTS_LEDGER_MONEY_CLASSES,
  ACCOUNTS_LEDGER_REFERENCE_CLASSES,
  getAccountsLedgerLoanBadgeClassName,
  getAccountsLedgerRowClassName,
} from "./AccountsLedger.styles";

/* ===========================================================
   PROPS
=========================================================== */

export interface AccountsLedgerRowProps {
  entry: AccountEntry;

  serialNumber: number;
}

/* ===========================================================
   FORMAT LOCAL LEDGER DATE

   dateKey is already normalized by Accounts mappers as:

   YYYY-MM-DD

   Parsing it manually prevents UTC timezone movement.
=========================================================== */

function formatLedgerDate(dateKey: string): string {
  const raw = String(dateKey ?? "").trim();

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);

  if (!match) {
    return ACCOUNTS_EMPTY_VALUE;
  }

  const year = Number(match[1]);

  const month = Number(match[2]);

  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return ACCOUNTS_EMPTY_VALUE;
  }

  return date.toLocaleDateString(ACCOUNTS_NUMBER_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ===========================================================
   FORMAT TRANSACTION TIME

   Date-only source values deliberately display "--" for time
   instead of inventing midnight as an owner-visible time.
=========================================================== */

function formatLedgerTime(occurredAt: string): string {
  const raw = String(occurredAt ?? "").trim();

  if (!raw || !/[T\s]\d{1,2}:\d{2}/.test(raw)) {
    return ACCOUNTS_EMPTY_VALUE;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return ACCOUNTS_EMPTY_VALUE;
  }

  return date.toLocaleTimeString(ACCOUNTS_NUMBER_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/* ===========================================================
   COMPONENT
=========================================================== */

export function AccountsLedgerRow({
  entry,
  serialNumber,
}: AccountsLedgerRowProps) {
  /* =========================================================
     DATE / TIME DISPLAY
  ========================================================= */

  const dateDisplay = formatLedgerDate(entry.dateKey);

  const timeDisplay = formatLedgerTime(entry.occurredAt);

  /* =========================================================
     MONEY DISPLAY

     Direction was already determined by the Accounts mapper.
     No financial calculation occurs here.
  ========================================================= */

  const moneyOutDisplay =
    entry.moneyFlow === "MONEY_OUT"
      ? formatCurrency(entry.moneyOut)
      : ACCOUNTS_EMPTY_VALUE;

  const moneyInDisplay =
    entry.moneyFlow === "MONEY_IN"
      ? formatCurrency(entry.moneyIn)
      : ACCOUNTS_EMPTY_VALUE;

  /* =========================================================
     CUSTOMER DISPLAY
  ========================================================= */

  const customerNameDisplay = entry.customerName || ACCOUNTS_EMPTY_VALUE;

  const customerPhoneDisplay = entry.customerPhone || "";

  /* =========================================================
     LOAN TYPE PRESENTATION

     Historical collection entries may not always have a
     resolved loan type.

     We do NOT guess Standard when loan type is unresolved.
  ========================================================= */

  /* =========================================================
     LOAN TYPE PRESENTATION

     Historical collection entries may not always have a
     resolved loan type.

     We do NOT guess Standard when loan type is unresolved.
  ========================================================= */

  const resolvedLoanType =
    entry.loanType === "GOLD" || entry.loanType === "STANDARD"
      ? entry.loanType
      : undefined;

  const hasKnownLoanType = resolvedLoanType !== undefined;

  const loanTypeLabel = resolvedLoanType
    ? ACCOUNT_LOAN_TYPE_LABELS[resolvedLoanType]
    : "";

  const loanBadgeClassName = resolvedLoanType
    ? getAccountsLedgerLoanBadgeClassName(resolvedLoanType)
    : "";

  /* =========================================================
     ACTIVITY ICON

     Gold disbursement
       → Gem

     Standard disbursement
       → HandCoins

     Collection
       → WalletCards
  ========================================================= */

  const ActivityIcon =
    entry.activity === "COLLECTION_RECEIVED"
      ? WalletCards
      : entry.loanType === "GOLD"
        ? Gem
        : HandCoins;

  const activityIconToneClass =
    entry.moneyFlow === "MONEY_OUT"
      ? ACCOUNTS_LEDGER_ICON_CLASSES.moneyOut
      : ACCOUNTS_LEDGER_ICON_CLASSES.moneyIn;

  const activityIconClassName = `${ACCOUNTS_LEDGER_ACTIVITY_CLASSES.icon} ${activityIconToneClass}`;

  /* =========================================================
     PAYMENT METHOD

     Loan disbursement currently does not persist a payment
     method, therefore mapper-owned UNKNOWN displays "--".
  ========================================================= */

  const hasKnownPaymentMethod = entry.paymentMethod !== "UNKNOWN";

  const paymentMethodDisplay =
    hasKnownPaymentMethod && entry.paymentMethodLabel
      ? entry.paymentMethodLabel
      : ACCOUNTS_EMPTY_VALUE;

  const paymentMethodClassName = hasKnownPaymentMethod
    ? ACCOUNTS_LEDGER_METHOD_CLASSES.badge
    : ACCOUNTS_LEDGER_METHOD_CLASSES.unknown;

  /* =========================================================
     REFERENCE

     Primary:
       authoritative source reference

       Loan       → FIN-LOAN-...
       Collection → RCPT-...

     Secondary:
       Collection can additionally show related loan number.
  ========================================================= */

  const referencePrimary = entry.sourceReference || ACCOUNTS_EMPTY_VALUE;

  const referenceSecondary =
    entry.sourceType === "COLLECTION" &&
    entry.loanNumber &&
    entry.loanNumber !== entry.sourceReference
      ? entry.loanNumber
      : "";

  /* =========================================================
     ROW CLASS
  ========================================================= */

  const rowClassName = getAccountsLedgerRowClassName(entry.moneyFlow);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <tr className={rowClassName}>
      {/* =====================================================
          S.NO
      ===================================================== */}

      <td className={ACCOUNTS_LEDGER_CELL_CLASSES.serial}>{serialNumber}</td>

      {/* =====================================================
          DATE & TIME
      ===================================================== */}

      <td className={ACCOUNTS_LEDGER_CELL_CLASSES.dateTime}>
        <div className={ACCOUNTS_LEDGER_DATE_CLASSES.root}>
          <span className={ACCOUNTS_LEDGER_DATE_CLASSES.date}>
            {dateDisplay}
          </span>

          <span className={ACCOUNTS_LEDGER_DATE_CLASSES.time}>
            {timeDisplay}
          </span>
        </div>
      </td>

      {/* =====================================================
          CUSTOMER
      ===================================================== */}

      <td className={ACCOUNTS_LEDGER_CELL_CLASSES.customer}>
        <div className={ACCOUNTS_LEDGER_CUSTOMER_CLASSES.root}>
          <span className={ACCOUNTS_LEDGER_CUSTOMER_CLASSES.name}>
            {customerNameDisplay}
          </span>

          {customerPhoneDisplay && (
            <span className={ACCOUNTS_LEDGER_CUSTOMER_CLASSES.phone}>
              {customerPhoneDisplay}
            </span>
          )}
        </div>
      </td>

      {/* =====================================================
          ACTIVITY
      ===================================================== */}

      <td className={ACCOUNTS_LEDGER_CELL_CLASSES.activity}>
        <div className={ACCOUNTS_LEDGER_ACTIVITY_CLASSES.root}>
          <ActivityIcon
            className={activityIconClassName}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          <div className={ACCOUNTS_LEDGER_ACTIVITY_CLASSES.content}>
            <span className={ACCOUNTS_LEDGER_ACTIVITY_CLASSES.label}>
              {entry.description}
            </span>

            {hasKnownLoanType && (
              <div className={ACCOUNTS_LEDGER_ACTIVITY_CLASSES.loan}>
                <span className={loanBadgeClassName}>{loanTypeLabel}</span>
              </div>
            )}
          </div>
        </div>
      </td>

      {/* =====================================================
          MONEY OUT
      ===================================================== */}

      <td className={ACCOUNTS_LEDGER_CELL_CLASSES.moneyOut}>
        {entry.moneyFlow === "MONEY_OUT" ? (
          <span className={ACCOUNTS_LEDGER_MONEY_CLASSES.moneyOut}>
            {moneyOutDisplay}
          </span>
        ) : (
          <span className={ACCOUNTS_LEDGER_MONEY_CLASSES.empty}>
            {ACCOUNTS_EMPTY_VALUE}
          </span>
        )}
      </td>

      {/* =====================================================
          MONEY IN
      ===================================================== */}

      <td className={ACCOUNTS_LEDGER_CELL_CLASSES.moneyIn}>
        {entry.moneyFlow === "MONEY_IN" ? (
          <span className={ACCOUNTS_LEDGER_MONEY_CLASSES.moneyIn}>
            {moneyInDisplay}
          </span>
        ) : (
          <span className={ACCOUNTS_LEDGER_MONEY_CLASSES.empty}>
            {ACCOUNTS_EMPTY_VALUE}
          </span>
        )}
      </td>

      {/* =====================================================
          METHOD
      ===================================================== */}

      <td className={ACCOUNTS_LEDGER_CELL_CLASSES.method}>
        <span className={paymentMethodClassName}>{paymentMethodDisplay}</span>
      </td>

      {/* =====================================================
          REFERENCE
      ===================================================== */}

      <td className={ACCOUNTS_LEDGER_CELL_CLASSES.reference}>
        <div className={ACCOUNTS_LEDGER_REFERENCE_CLASSES.root}>
          <span className={ACCOUNTS_LEDGER_REFERENCE_CLASSES.primary}>
            {referencePrimary}
          </span>

          {referenceSecondary && (
            <span className={ACCOUNTS_LEDGER_REFERENCE_CLASSES.secondary}>
              {referenceSecondary}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ===========================================================
   DEFAULT EXPORT
=========================================================== */

export default AccountsLedgerRow;

/* ===========================================================
   END
=========================================================== */
