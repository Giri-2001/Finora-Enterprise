/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS EMPTY STATE

   MODULE  : Accounts
   LAYER   : Presentation Component
   VERSION : 1.0

   RESPONSIBILITY:

   - Render empty Accounts result
   - Explain that selected filters have no money movements
   - Expose Reset Filters action
   - Keep empty-state behavior simple for business owners

   IMPORTANT:

   - No inline styles.
   - No repository access.
   - No filtering.
   - No totals calculation.
   - No responsive calculation.
   - No theme calculation.
=========================================================== */

/* ===========================================================
   ICON
=========================================================== */

import { SearchX } from "lucide-react";

/* ===========================================================
   CONSTANTS
=========================================================== */

import {
  ACCOUNTS_EMPTY_SUBTITLE,
  ACCOUNTS_EMPTY_TITLE,
  ACCOUNTS_FILTER_RESET_LABEL,
} from "../../../constants/accounts/accounts.constants";

/* ===========================================================
   PAGE STYLE CONTRACT
=========================================================== */

import { ACCOUNTS_STATE_CLASSES } from "../AccountsOffice.styles";

/* ===========================================================
   FILTER ICON CONTRACT
=========================================================== */

import {
  ACCOUNTS_FILTER_ACTION_CLASSES,
  ACCOUNTS_FILTER_ICON_CLASSES,
} from "./AccountsFilters.styles";

/* ===========================================================
   PROPS
=========================================================== */

export interface AccountsEmptyStateProps {
  onReset: () => void;

  disabled?: boolean;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export function AccountsEmptyState({
  onReset,
  disabled = false,
}: AccountsEmptyStateProps) {
  return (
    <section
      className={ACCOUNTS_STATE_CLASSES.loadingPanel}
      aria-labelledby="finora-accounts-empty-title"
    >
      {/* =====================================================
          ICON
      ===================================================== */}

      <SearchX
        className={ACCOUNTS_FILTER_ICON_CLASSES.search}
        strokeWidth={1.8}
        aria-hidden="true"
      />

      {/* =====================================================
          MESSAGE
      ===================================================== */}

      <h2
        id="finora-accounts-empty-title"
        className={ACCOUNTS_STATE_CLASSES.title}
      >
        {ACCOUNTS_EMPTY_TITLE}
      </h2>

      <p className={ACCOUNTS_STATE_CLASSES.text}>{ACCOUNTS_EMPTY_SUBTITLE}</p>

      {/* =====================================================
          RESET
      ===================================================== */}

      <button
        type="button"
        className={ACCOUNTS_STATE_CLASSES.retryButton}
        onClick={onReset}
        disabled={disabled}
      >
        <SearchX
          className={ACCOUNTS_FILTER_ACTION_CLASSES.icon}
          strokeWidth={1.9}
          aria-hidden="true"
        />

        <span className={ACCOUNTS_FILTER_ACTION_CLASSES.label}>
          {ACCOUNTS_FILTER_RESET_LABEL}
        </span>
      </button>
    </section>
  );
}

/* ===========================================================
   DEFAULT EXPORT
=========================================================== */

export default AccountsEmptyState;

/* ===========================================================
   END
=========================================================== */
