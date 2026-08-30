/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS DOCUMENT ACTIONS

   MODULE  : Accounts
   LAYER   : Reusable Presentation Component
   VERSION : 1.0

   RESPONSIBILITY:

   - Render Print action
   - Render Download PDF action
   - Render Share action
   - Keep document-generation logic outside presentation
   - Reuse Accounts Header action styling
   - Keep JSX className-only

   IMPORTANT:

   - No inline styles.
   - No PDF generation.
   - No repository access.
   - No financial calculations.
   - No filtering.
   - No responsive calculations.
   - No theme calculations.

   ACTION OWNERSHIP:

   Parent
      ↓
   onPrint / onDownload / onShare
      ↓
   AccountsDocumentActions
=========================================================== */

/* ===========================================================
   ICONS
=========================================================== */

import { Download, Printer, Share2 } from "lucide-react";

/* ===========================================================
   CONSTANTS
=========================================================== */

import {
  ACCOUNTS_DOWNLOAD_LABEL,
  ACCOUNTS_PRINT_LABEL,
  ACCOUNTS_SHARE_LABEL,
} from "../../../constants/accounts/accounts.constants";

/* ===========================================================
   STYLE CONTRACT
=========================================================== */

import {
  ACCOUNTS_HEADER_ACTION_CLASSES,
  ACCOUNTS_HEADER_ICON_CLASSES,
  ACCOUNTS_HEADER_STATE_CLASSES,
  getAccountsHeaderActionClassName,
  joinAccountsHeaderClassNames,
} from "./AccountsHeader.styles";

/* ===========================================================
   STYLESHEET

   Reuses the established Accounts document-action visual
   contract instead of creating duplicate button CSS.
=========================================================== */

import "./AccountsHeader.css";

/* ===========================================================
   PROPS
=========================================================== */

export interface AccountsDocumentActionsProps {
  onPrint: () => void;

  onDownload: () => void;

  onShare: () => void;

  isBusy?: boolean;

  disabled?: boolean;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export function AccountsDocumentActions({
  onPrint,
  onDownload,
  onShare,
  isBusy = false,
  disabled = false,
}: AccountsDocumentActionsProps) {
  /* =========================================================
     ACTION STATE
  ========================================================= */

  const actionsDisabled = disabled || isBusy;

  /* =========================================================
     ROOT CLASS
  ========================================================= */

  const rootClassName = joinAccountsHeaderClassNames(
    ACCOUNTS_HEADER_ACTION_CLASSES.root,

    actionsDisabled && ACCOUNTS_HEADER_STATE_CLASSES.actionsDisabled,
  );

  /* =========================================================
     BUTTON CLASSES
  ========================================================= */

  const printButtonClassName = getAccountsHeaderActionClassName(
    "SECONDARY",
    actionsDisabled,
  );

  const downloadButtonClassName = getAccountsHeaderActionClassName(
    "PRIMARY",
    actionsDisabled,
  );

  const shareButtonClassName = getAccountsHeaderActionClassName(
    "SECONDARY",
    actionsDisabled,
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className={rootClassName}
      aria-label="Accounts document actions"
      aria-busy={isBusy}
    >
      {/* =====================================================
          PRINT
      ===================================================== */}

      <button
        type="button"
        className={printButtonClassName}
        onClick={onPrint}
        disabled={actionsDisabled}
        aria-label={ACCOUNTS_PRINT_LABEL}
        title={ACCOUNTS_PRINT_LABEL}
      >
        <Printer
          className={joinAccountsHeaderClassNames(
            ACCOUNTS_HEADER_ACTION_CLASSES.icon,
            ACCOUNTS_HEADER_ICON_CLASSES.print,
          )}
          strokeWidth={1.9}
          aria-hidden="true"
        />

        <span className={ACCOUNTS_HEADER_ACTION_CLASSES.label}>
          {ACCOUNTS_PRINT_LABEL}
        </span>
      </button>

      {/* =====================================================
          DOWNLOAD PDF
      ===================================================== */}

      <button
        type="button"
        className={downloadButtonClassName}
        onClick={onDownload}
        disabled={actionsDisabled}
        aria-label={ACCOUNTS_DOWNLOAD_LABEL}
        title={ACCOUNTS_DOWNLOAD_LABEL}
      >
        <Download
          className={joinAccountsHeaderClassNames(
            ACCOUNTS_HEADER_ACTION_CLASSES.icon,
            ACCOUNTS_HEADER_ICON_CLASSES.download,
          )}
          strokeWidth={1.9}
          aria-hidden="true"
        />

        <span className={ACCOUNTS_HEADER_ACTION_CLASSES.label}>
          {ACCOUNTS_DOWNLOAD_LABEL}
        </span>
      </button>

      {/* =====================================================
          SHARE
      ===================================================== */}

      <button
        type="button"
        className={shareButtonClassName}
        onClick={onShare}
        disabled={actionsDisabled}
        aria-label={ACCOUNTS_SHARE_LABEL}
        title={ACCOUNTS_SHARE_LABEL}
      >
        <Share2
          className={joinAccountsHeaderClassNames(
            ACCOUNTS_HEADER_ACTION_CLASSES.icon,
            ACCOUNTS_HEADER_ICON_CLASSES.share,
          )}
          strokeWidth={1.9}
          aria-hidden="true"
        />

        <span className={ACCOUNTS_HEADER_ACTION_CLASSES.label}>
          {ACCOUNTS_SHARE_LABEL}
        </span>
      </button>
    </div>
  );
}

/* ===========================================================
   DEFAULT EXPORT
=========================================================== */

export default AccountsDocumentActions;

/* ===========================================================
   END
=========================================================== */
