/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS LEDGER MOBILE CARD

   MODULE  : Accounts
   LAYER   : Mobile Register Presentation
   VERSION : 1.0

   RESPONSIBILITY:

   - Render one AccountEntry as a simple mobile card
   - Show Money Out prominently in red
   - Show Money In prominently in green
   - Show customer and activity
   - Show Gold / Standard loan identity when known
   - Show payment method only when meaningful
   - Show authoritative reference
   - Show local ledger date and transaction time
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
  ACCOUNTS_MONEY_IN_TITLE,
  ACCOUNTS_MONEY_OUT_TITLE,
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
  ACCOUNTS_LEDGER_ICON_CLASSES,
  ACCOUNTS_LEDGER_MOBILE_CLASSES,
  getAccountsLedgerMobileCardClassName,
  getAccountsLedgerMobileLoanBadgeClassName,
} from "./AccountsLedger.styles";

/* ===========================================================
   PROPS
=========================================================== */

export interface AccountsLedgerMobileCardProps {
  entry: AccountEntry;
}

/* ===========================================================
   LOCAL LEDGER DATE

   dateKey is normalized as YYYY-MM-DD.

   Manual local parsing avoids UTC date shifting.
=========================================================== */

function formatMobileLedgerDate(dateKey: string): string {
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
   TRANSACTION TIME

   Date-only source values intentionally display "--".
=========================================================== */

function formatMobileLedgerTime(occurredAt: string): string {
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

export function AccountsLedgerMobileCard({
  entry,
}: AccountsLedgerMobileCardProps) {
  /* =========================================================
     MONEY PRESENTATION
  ========================================================= */

  const isMoneyOut = entry.moneyFlow === "MONEY_OUT";

  const moneyLabel = isMoneyOut
    ? ACCOUNTS_MONEY_OUT_TITLE
    : ACCOUNTS_MONEY_IN_TITLE;

  const moneyDisplay = formatCurrency(
    isMoneyOut ? entry.moneyOut : entry.moneyIn,
  );

  const moneyValueClassName = isMoneyOut
    ? ACCOUNTS_LEDGER_MOBILE_CLASSES.moneyOutValue
    : ACCOUNTS_LEDGER_MOBILE_CLASSES.moneyInValue;

  const cardClassName = getAccountsLedgerMobileCardClassName(entry.moneyFlow);

  /* =========================================================
     DATE / TIME
  ========================================================= */

  const dateDisplay = formatMobileLedgerDate(entry.dateKey);

  const timeDisplay = formatMobileLedgerTime(entry.occurredAt);

  /* =========================================================
     CUSTOMER
  ========================================================= */

  const customerDisplay = entry.customerName || ACCOUNTS_EMPTY_VALUE;

  /* =========================================================
     LOAN TYPE

     Historical collection entries can legitimately have an
     unresolved loan type.

     We do not guess Standard.
  ========================================================= */

  const resolvedLoanType =
    entry.loanType === "GOLD" || entry.loanType === "STANDARD"
      ? entry.loanType
      : undefined;

  const loanTypeDisplay = resolvedLoanType
    ? ACCOUNT_LOAN_TYPE_LABELS[resolvedLoanType]
    : "";

  const loanBadgeClassName = resolvedLoanType
    ? getAccountsLedgerMobileLoanBadgeClassName(resolvedLoanType)
    : "";

  /* =========================================================
     PAYMENT METHOD

     Loan disbursement currently does not persist a payment
     method.

     Therefore UNKNOWN is omitted instead of showing a useless
     Method: -- row on mobile.
  ========================================================= */

  const hasPaymentMethod =
    entry.paymentMethod !== "UNKNOWN" && Boolean(entry.paymentMethodLabel);

  const paymentMethodDisplay = hasPaymentMethod ? entry.paymentMethodLabel : "";

  /* =========================================================
     REFERENCE
  ========================================================= */

  const referenceDisplay = entry.sourceReference || ACCOUNTS_EMPTY_VALUE;

  /* =========================================================
     ACTIVITY ICON

     Collection
       → WalletCards

     Gold disbursement
       → Gem

     Standard / unresolved disbursement
       → HandCoins
  ========================================================= */

  const ActivityIcon =
    entry.activity === "COLLECTION_RECEIVED"
      ? WalletCards
      : resolvedLoanType === "GOLD"
        ? Gem
        : HandCoins;

  const activityToneClass = isMoneyOut
    ? ACCOUNTS_LEDGER_ICON_CLASSES.moneyOut
    : ACCOUNTS_LEDGER_ICON_CLASSES.moneyIn;

  const activityIconClassName = `${ACCOUNTS_LEDGER_MOBILE_CLASSES.activityIcon} ${activityToneClass}`;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <article className={cardClassName}>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className={ACCOUNTS_LEDGER_MOBILE_CLASSES.header}>
        <div className={ACCOUNTS_LEDGER_MOBILE_CLASSES.identity}>
          <ActivityIcon
            className={activityIconClassName}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          <div className={ACCOUNTS_LEDGER_MOBILE_CLASSES.headingGroup}>
            <h3 className={ACCOUNTS_LEDGER_MOBILE_CLASSES.activity}>
              {entry.description}
            </h3>

            <span className={ACCOUNTS_LEDGER_MOBILE_CLASSES.customer}>
              {customerDisplay}
            </span>

            {resolvedLoanType && (
              <span className={loanBadgeClassName}>{loanTypeDisplay}</span>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          MONEY
      ===================================================== */}

      <div className={ACCOUNTS_LEDGER_MOBILE_CLASSES.moneySection}>
        <div>
          <span className={ACCOUNTS_LEDGER_MOBILE_CLASSES.moneyLabel}>
            {moneyLabel}
          </span>

          <strong className={moneyValueClassName}>{moneyDisplay}</strong>
        </div>
      </div>

      {/* =====================================================
          DETAILS

          Payment Method is rendered only when persisted and
          meaningful.
      ===================================================== */}

      {hasPaymentMethod && (
        <div className={ACCOUNTS_LEDGER_MOBILE_CLASSES.details}>
          <div className={ACCOUNTS_LEDGER_MOBILE_CLASSES.detail}>
            <span className={ACCOUNTS_LEDGER_MOBILE_CLASSES.detailLabel}>
              Method
            </span>

            <span className={ACCOUNTS_LEDGER_MOBILE_CLASSES.detailValue}>
              {paymentMethodDisplay}
            </span>
          </div>
        </div>
      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className={ACCOUNTS_LEDGER_MOBILE_CLASSES.footer}>
        {/* ===================================================
            DATE / TIME
        =================================================== */}

        <div className={ACCOUNTS_LEDGER_MOBILE_CLASSES.dateTime}>
          <span className={ACCOUNTS_LEDGER_MOBILE_CLASSES.date}>
            {dateDisplay}
          </span>

          <span aria-hidden="true">•</span>

          <span className={ACCOUNTS_LEDGER_MOBILE_CLASSES.time}>
            {timeDisplay}
          </span>
        </div>

        {/* ===================================================
            REFERENCE
        =================================================== */}

        <div className={ACCOUNTS_LEDGER_MOBILE_CLASSES.reference}>
          <span className={ACCOUNTS_LEDGER_MOBILE_CLASSES.referenceLabel}>
            Reference
          </span>

          <span className={ACCOUNTS_LEDGER_MOBILE_CLASSES.referenceValue}>
            {referenceDisplay}
          </span>
        </div>
      </div>
    </article>
  );
}

/* ===========================================================
   DEFAULT EXPORT
=========================================================== */

export default AccountsLedgerMobileCard;

/* ===========================================================
   END
=========================================================== */
