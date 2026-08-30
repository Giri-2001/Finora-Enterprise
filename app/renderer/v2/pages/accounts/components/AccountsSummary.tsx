/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS SUMMARY

   MODULE  : Accounts
   LAYER   : Presentation Component
   VERSION : 1.0

   RESPONSIBILITY:

   - Render Money Out summary
   - Render Money In summary
   - Render Net Movement summary
   - Render Transactions summary
   - Reuse authoritative AccountsSummary calculations
   - Reuse global FINORA Indian currency formatter
   - Preserve simple owner-facing debit / credit semantics

   IMPORTANT:

   - No inline styles.
   - No repository access.
   - No financial calculations.
   - No filtering.
   - No responsive calculations.
   - No theme calculations.
   - No duplicate currency formatter.
=========================================================== */

/* ===========================================================
   ICONS
=========================================================== */

import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  ReceiptIndianRupee,
} from "lucide-react";

/* ===========================================================
   CONSTANTS
=========================================================== */

import {
  ACCOUNTS_MONEY_IN_ACCOUNTING_LABEL,
  ACCOUNTS_MONEY_IN_SUBTITLE,
  ACCOUNTS_MONEY_IN_TITLE,
  ACCOUNTS_MONEY_OUT_ACCOUNTING_LABEL,
  ACCOUNTS_MONEY_OUT_SUBTITLE,
  ACCOUNTS_MONEY_OUT_TITLE,
  ACCOUNTS_NET_MOVEMENT_SUBTITLE,
  ACCOUNTS_NET_MOVEMENT_TITLE,
  ACCOUNTS_TRANSACTIONS_SUBTITLE,
  ACCOUNTS_TRANSACTIONS_TITLE,
} from "../../../constants/accounts/accounts.constants";

/* ===========================================================
   TYPES
=========================================================== */

import type { AccountsSummary as AccountsSummaryData } from "../../../types/accounts/accounts.types";

/* ===========================================================
   SHARED FORMATTER
=========================================================== */

import { formatCurrency } from "../../../utils/currency/formatCurrency";

/* ===========================================================
   STYLE CONTRACT
=========================================================== */

import {
  ACCOUNTS_SUMMARY_CLASSES,
  ACCOUNTS_SUMMARY_ICON_CLASSES,
  ACCOUNTS_SUMMARY_VALUE_CLASSES,
  ACCOUNTS_SUMMARY_VARIANT_CLASSES,
  getAccountsNetCardClassName,
  getAccountsNetIconClassName,
  getAccountsNetValueClassName,
  resolveAccountsNetMovementTone,
} from "./AccountsSummary.styles";

/* ===========================================================
   STYLESHEET
=========================================================== */

import "./AccountsSummary.css";

/* ===========================================================
   PROPS
=========================================================== */

export interface AccountsSummaryProps {
  summary: AccountsSummaryData;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export function AccountsSummary({ summary }: AccountsSummaryProps) {
  /* =========================================================
     PRESENTATION VALUES

     Financial values are already calculated by
     accountsTotals.ts.

     This component only formats them for display.
  ========================================================= */

  const moneyOutDisplay = formatCurrency(summary.totalMoneyOut);

  const moneyInDisplay = formatCurrency(summary.totalMoneyIn);

  const netMovementDisplay = formatCurrency(summary.netMovement);

  const transactionCountDisplay =
    summary.transactionCount.toLocaleString("en-IN");

  const moneyOutCountDisplay = summary.moneyOutCount.toLocaleString("en-IN");

  const moneyInCountDisplay = summary.moneyInCount.toLocaleString("en-IN");

  /* =========================================================
     NET PRESENTATION TONE

     This does not calculate Net Movement.

     It only converts the already-calculated result into:
     - positive
     - negative
     - neutral
  ========================================================= */

  const netTone = resolveAccountsNetMovementTone(summary.netMovement);

  const netCardClassName = getAccountsNetCardClassName(netTone);

  const netValueClassName = getAccountsNetValueClassName(netTone);

  const netIconClassName = getAccountsNetIconClassName(netTone);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section
      className={ACCOUNTS_SUMMARY_CLASSES.root}
      aria-label="Accounts summary"
    >
      <div className={ACCOUNTS_SUMMARY_CLASSES.grid}>
        {/* ===================================================
            MONEY OUT
        =================================================== */}

        <article className={ACCOUNTS_SUMMARY_VARIANT_CLASSES.moneyOut}>
          <div className={ACCOUNTS_SUMMARY_CLASSES.cardHeader}>
            <div className={ACCOUNTS_SUMMARY_CLASSES.identity}>
              <span
                className={ACCOUNTS_SUMMARY_CLASSES.icon}
                aria-hidden="true"
              >
                <ArrowUpRight
                  className={ACCOUNTS_SUMMARY_ICON_CLASSES.moneyOut}
                  strokeWidth={2}
                />
              </span>

              <div className={ACCOUNTS_SUMMARY_CLASSES.headingGroup}>
                <div className={ACCOUNTS_SUMMARY_CLASSES.titleRow}>
                  <h2 className={ACCOUNTS_SUMMARY_CLASSES.title}>
                    {ACCOUNTS_MONEY_OUT_TITLE}
                  </h2>

                  <span className={ACCOUNTS_SUMMARY_CLASSES.accountingLabel}>
                    {ACCOUNTS_MONEY_OUT_ACCOUNTING_LABEL}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className={ACCOUNTS_SUMMARY_VALUE_CLASSES.moneyOut}>
            {moneyOutDisplay}
          </p>

          <div className={ACCOUNTS_SUMMARY_CLASSES.footer}>
            <p className={ACCOUNTS_SUMMARY_CLASSES.subtitle}>
              {ACCOUNTS_MONEY_OUT_SUBTITLE}
            </p>

            <span
              className={ACCOUNTS_SUMMARY_CLASSES.count}
              title="Money Out transactions"
            >
              {moneyOutCountDisplay}
            </span>
          </div>
        </article>

        {/* ===================================================
            MONEY IN
        =================================================== */}

        <article className={ACCOUNTS_SUMMARY_VARIANT_CLASSES.moneyIn}>
          <div className={ACCOUNTS_SUMMARY_CLASSES.cardHeader}>
            <div className={ACCOUNTS_SUMMARY_CLASSES.identity}>
              <span
                className={ACCOUNTS_SUMMARY_CLASSES.icon}
                aria-hidden="true"
              >
                <ArrowDownLeft
                  className={ACCOUNTS_SUMMARY_ICON_CLASSES.moneyIn}
                  strokeWidth={2}
                />
              </span>

              <div className={ACCOUNTS_SUMMARY_CLASSES.headingGroup}>
                <div className={ACCOUNTS_SUMMARY_CLASSES.titleRow}>
                  <h2 className={ACCOUNTS_SUMMARY_CLASSES.title}>
                    {ACCOUNTS_MONEY_IN_TITLE}
                  </h2>

                  <span className={ACCOUNTS_SUMMARY_CLASSES.accountingLabel}>
                    {ACCOUNTS_MONEY_IN_ACCOUNTING_LABEL}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className={ACCOUNTS_SUMMARY_VALUE_CLASSES.moneyIn}>
            {moneyInDisplay}
          </p>

          <div className={ACCOUNTS_SUMMARY_CLASSES.footer}>
            <p className={ACCOUNTS_SUMMARY_CLASSES.subtitle}>
              {ACCOUNTS_MONEY_IN_SUBTITLE}
            </p>

            <span
              className={ACCOUNTS_SUMMARY_CLASSES.count}
              title="Money In transactions"
            >
              {moneyInCountDisplay}
            </span>
          </div>
        </article>

        {/* ===================================================
            NET MOVEMENT
        =================================================== */}

        <article className={netCardClassName}>
          <div className={ACCOUNTS_SUMMARY_CLASSES.cardHeader}>
            <div className={ACCOUNTS_SUMMARY_CLASSES.identity}>
              <span
                className={ACCOUNTS_SUMMARY_CLASSES.icon}
                aria-hidden="true"
              >
                <CircleDollarSign
                  className={netIconClassName}
                  strokeWidth={2}
                />
              </span>

              <div className={ACCOUNTS_SUMMARY_CLASSES.headingGroup}>
                <div className={ACCOUNTS_SUMMARY_CLASSES.titleRow}>
                  <h2 className={ACCOUNTS_SUMMARY_CLASSES.title}>
                    {ACCOUNTS_NET_MOVEMENT_TITLE}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          <p className={netValueClassName}>{netMovementDisplay}</p>

          <div className={ACCOUNTS_SUMMARY_CLASSES.footer}>
            <p className={ACCOUNTS_SUMMARY_CLASSES.subtitle}>
              {ACCOUNTS_NET_MOVEMENT_SUBTITLE}
            </p>
          </div>
        </article>

        {/* ===================================================
            TRANSACTIONS
        =================================================== */}

        <article className={ACCOUNTS_SUMMARY_VARIANT_CLASSES.transactions}>
          <div className={ACCOUNTS_SUMMARY_CLASSES.cardHeader}>
            <div className={ACCOUNTS_SUMMARY_CLASSES.identity}>
              <span
                className={ACCOUNTS_SUMMARY_CLASSES.icon}
                aria-hidden="true"
              >
                <ReceiptIndianRupee
                  className={ACCOUNTS_SUMMARY_ICON_CLASSES.transactions}
                  strokeWidth={2}
                />
              </span>

              <div className={ACCOUNTS_SUMMARY_CLASSES.headingGroup}>
                <div className={ACCOUNTS_SUMMARY_CLASSES.titleRow}>
                  <h2 className={ACCOUNTS_SUMMARY_CLASSES.title}>
                    {ACCOUNTS_TRANSACTIONS_TITLE}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          <p className={ACCOUNTS_SUMMARY_VALUE_CLASSES.transactions}>
            {transactionCountDisplay}
          </p>

          <div className={ACCOUNTS_SUMMARY_CLASSES.footer}>
            <p className={ACCOUNTS_SUMMARY_CLASSES.subtitle}>
              {ACCOUNTS_TRANSACTIONS_SUBTITLE}
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

/* ===========================================================
   DEFAULT EXPORT
=========================================================== */

export default AccountsSummary;

/* ===========================================================
   END
=========================================================== */
