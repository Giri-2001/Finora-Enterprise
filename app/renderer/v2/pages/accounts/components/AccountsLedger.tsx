/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS LEDGER

   MODULE  : Accounts
   LAYER   : Physical Register Presentation
   VERSION : 1.0

   RESPONSIBILITY:

   - Render Daily Accounts Register heading
   - Render selected period label
   - Render eight physical-register columns
   - Render AccountsLedgerRow entries
   - Preserve row / column grid structure
   - Expose serial-number starting point

   IMPORTANT:

   - No inline styles.
   - No repository access.
   - No financial calculations.
   - No filtering.
   - No period calculations.
   - No theme calculations.
   - No responsive calculations.

   periodLabel and entries are supplied by AccountsLedgerView.
=========================================================== */

/* ===========================================================
   ICONS
=========================================================== */

import { BookOpen, CalendarDays } from "lucide-react";

/* ===========================================================
   CONSTANTS
=========================================================== */

import {
  ACCOUNTS_LEDGER_COLUMNS,
  ACCOUNTS_REGISTER_SUBTITLE,
  ACCOUNTS_REGISTER_TITLE,
} from "../../../constants/accounts/accounts.constants";

/* ===========================================================
   TYPES
=========================================================== */

import type { AccountsLedgerView } from "../../../types/accounts/accounts.types";

/* ===========================================================
   ROW
=========================================================== */

import { AccountsLedgerRow } from "./AccountsLedgerRow";

/* ===========================================================
   MOBILE CARD
=========================================================== */

import { AccountsLedgerMobileCard } from "./AccountsLedgerMobileCard";

/* ===========================================================
   STYLE CONTRACT
=========================================================== */

import {
  ACCOUNTS_LEDGER_CLASSES,
  ACCOUNTS_LEDGER_HEADER_CLASSES,
  ACCOUNTS_LEDGER_ICON_CLASSES,
  ACCOUNTS_LEDGER_MOBILE_CLASSES,
} from "./AccountsLedger.styles";

/* ===========================================================
   STYLESHEET
=========================================================== */

import "./AccountsLedger.css";

/* ===========================================================
   PROPS
=========================================================== */

export interface AccountsLedgerProps {
  ledger: AccountsLedgerView;

  /**
   * First visible physical-register serial number.
   *
   * Example:
   *
   * Page 1
   * startSerialNumber = 1
   *
   * Page 2 with 25 rows per page
   * parent can pass 26
   *
   * Pagination arithmetic remains outside this component.
   */
  startSerialNumber?: number;
}

/* ===========================================================
   SAFE SERIAL START

   Presentation safeguard only.

   Pagination calculation remains outside this component.
=========================================================== */

function resolveSerialStart(value: number): number {
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

/* ===========================================================
   COMPONENT
=========================================================== */

export function AccountsLedger({
  ledger,
  startSerialNumber = 1,
}: AccountsLedgerProps) {
  /* =========================================================
     DISPLAY VALUES
  ========================================================= */

  const serialStart = resolveSerialStart(startSerialNumber);

  const periodDisplay = ledger.periodLabel.trim() || "All Time";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section
      className={ACCOUNTS_LEDGER_CLASSES.section}
      aria-labelledby="finora-accounts-register-title"
    >
      {/* =====================================================
          REGISTER HEADER
      ===================================================== */}

      <div className={ACCOUNTS_LEDGER_CLASSES.header}>
        <div className={ACCOUNTS_LEDGER_CLASSES.headerIdentity}>
          <span
            className={ACCOUNTS_LEDGER_CLASSES.headerIcon}
            aria-hidden="true"
          >
            <BookOpen
              className={ACCOUNTS_LEDGER_ICON_CLASSES.register}
              strokeWidth={1.9}
            />
          </span>

          <div className={ACCOUNTS_LEDGER_CLASSES.headingGroup}>
            <h2
              id="finora-accounts-register-title"
              className={ACCOUNTS_LEDGER_CLASSES.title}
            >
              {ACCOUNTS_REGISTER_TITLE}
            </h2>

            <p className={ACCOUNTS_LEDGER_CLASSES.subtitle}>
              {ACCOUNTS_REGISTER_SUBTITLE}
            </p>
          </div>
        </div>

        {/* ===================================================
            PERIOD
        =================================================== */}

        <div
          className={ACCOUNTS_LEDGER_CLASSES.period}
          aria-label={`Register period: ${periodDisplay}`}
        >
          <CalendarDays
            className={ACCOUNTS_LEDGER_ICON_CLASSES.period}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          <span className={ACCOUNTS_LEDGER_CLASSES.periodText}>
            {periodDisplay}
          </span>
        </div>
      </div>

      {/* =====================================================
          PHYSICAL REGISTER

          Responsive Engine controls visibility:

          mobile
            → hidden

          tablet
            → visible + horizontal scroll

          laptop / desktop
            → full register
      ===================================================== */}

      <div className={ACCOUNTS_LEDGER_CLASSES.wrapper}>
        <table className={ACCOUNTS_LEDGER_CLASSES.table}>
          {/* =================================================
              TABLE HEAD
          ================================================= */}

          <thead className={ACCOUNTS_LEDGER_CLASSES.head}>
            <tr>
              <th scope="col" className={ACCOUNTS_LEDGER_HEADER_CLASSES.serial}>
                {ACCOUNTS_LEDGER_COLUMNS.SERIAL}
              </th>

              <th
                scope="col"
                className={ACCOUNTS_LEDGER_HEADER_CLASSES.dateTime}
              >
                {ACCOUNTS_LEDGER_COLUMNS.DATE_TIME}
              </th>

              <th
                scope="col"
                className={ACCOUNTS_LEDGER_HEADER_CLASSES.customer}
              >
                {ACCOUNTS_LEDGER_COLUMNS.CUSTOMER}
              </th>

              <th
                scope="col"
                className={ACCOUNTS_LEDGER_HEADER_CLASSES.activity}
              >
                {ACCOUNTS_LEDGER_COLUMNS.ACTIVITY}
              </th>

              <th
                scope="col"
                className={ACCOUNTS_LEDGER_HEADER_CLASSES.moneyOut}
              >
                {ACCOUNTS_LEDGER_COLUMNS.MONEY_OUT}
              </th>

              <th
                scope="col"
                className={ACCOUNTS_LEDGER_HEADER_CLASSES.moneyIn}
              >
                {ACCOUNTS_LEDGER_COLUMNS.MONEY_IN}
              </th>

              <th scope="col" className={ACCOUNTS_LEDGER_HEADER_CLASSES.method}>
                {ACCOUNTS_LEDGER_COLUMNS.METHOD}
              </th>

              <th
                scope="col"
                className={ACCOUNTS_LEDGER_HEADER_CLASSES.reference}
              >
                {ACCOUNTS_LEDGER_COLUMNS.REFERENCE}
              </th>
            </tr>
          </thead>

          {/* =================================================
              TABLE BODY
          ================================================= */}

          <tbody className={ACCOUNTS_LEDGER_CLASSES.body}>
            {ledger.entries.map((entry, index) => (
              <AccountsLedgerRow
                key={entry.id}
                entry={entry}
                serialNumber={serialStart + index}
              />
            ))}
          </tbody>
        </table>
      </div>
      {/* =====================================================
          MOBILE TRANSACTION REGISTER

          Uses the exact same authoritative ledger.entries.

          Responsive Engine controls visibility:

          mobile
            → visible

          tablet / laptop / desktop
            → hidden

          No duplicate filtering.
          No duplicate data source.
      ===================================================== */}

      <div
        className={ACCOUNTS_LEDGER_MOBILE_CLASSES.list}
        aria-label="Mobile accounts register"
      >
        {ledger.entries.map((entry) => (
          <AccountsLedgerMobileCard key={`mobile:${entry.id}`} entry={entry} />
        ))}
      </div>
    </section>
  );
}

/* ===========================================================
   DEFAULT EXPORT
=========================================================== */

export default AccountsLedger;

/* ===========================================================
   END
=========================================================== */
