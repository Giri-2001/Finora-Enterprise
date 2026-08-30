/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS HEADER

   MODULE  : Accounts
   LAYER   : Presentation Component
   VERSION : 1.0

   RESPONSIBILITY:

   - Render Accounts Office identity
   - Render simple owner-facing subtitle
   - Render Accounts Register identity
   - Expose reusable document actions
   - Use meaningful Lucide icons
   - Remain className-only

   IMPORTANT:

   - No inline styles.
   - No financial calculations.
   - No repository access.
   - No PDF generation logic.
   - No responsive calculations.
   - No theme calculations.
   - Button actions are delegated to the parent.
=========================================================== */

/* ===========================================================
   ICONS
=========================================================== */

import { BookOpen, Landmark } from "lucide-react";

/* ===========================================================
   CONSTANTS
=========================================================== */

import {
  ACCOUNTS_PAGE_SUBTITLE,
  ACCOUNTS_PAGE_TITLE,
  ACCOUNTS_REGISTER_TITLE,
} from "../../../constants/accounts/accounts.constants";

/* ===========================================================
   STYLE CONTRACT
=========================================================== */

import {
  ACCOUNTS_HEADER_CLASSES,
  ACCOUNTS_HEADER_ICON_CLASSES,
  ACCOUNTS_HEADER_STATE_CLASSES,
  joinAccountsHeaderClassNames,
} from "./AccountsHeader.styles";

/* ===========================================================
   DOCUMENT ACTIONS
=========================================================== */

import { AccountsDocumentActions } from "./AccountsDocumentActions";

/* ===========================================================
   STYLESHEET
=========================================================== */

import "./AccountsHeader.css";

/* ===========================================================
   PROPS
=========================================================== */

export interface AccountsHeaderProps {
  onPrint: () => void;

  onDownload: () => void;

  onShare: () => void;

  isBusy?: boolean;

  actionsDisabled?: boolean;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export function AccountsHeader({
  onPrint,
  onDownload,
  onShare,
  isBusy = false,
  actionsDisabled = false,
}: AccountsHeaderProps) {
  /* =========================================================
     ACTION STATE
  ========================================================= */

  const areActionsDisabled = actionsDisabled || isBusy;

  /* =========================================================
     CLASS NAMES
  ========================================================= */

  const headerClassName = joinAccountsHeaderClassNames(
    ACCOUNTS_HEADER_CLASSES.root,

    isBusy && ACCOUNTS_HEADER_STATE_CLASSES.busy,
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <header className={headerClassName} aria-busy={isBusy}>
      {/* =====================================================
          ACCOUNTS IDENTITY
      ===================================================== */}

      <div className={ACCOUNTS_HEADER_CLASSES.identity}>
        <span className={ACCOUNTS_HEADER_CLASSES.icon} aria-hidden="true">
          <Landmark
            className={ACCOUNTS_HEADER_ICON_CLASSES.office}
            strokeWidth={1.9}
          />
        </span>

        <div className={ACCOUNTS_HEADER_CLASSES.headingGroup}>
          <div className={ACCOUNTS_HEADER_CLASSES.titleRow}>
            <h1 className={ACCOUNTS_HEADER_CLASSES.title}>
              {ACCOUNTS_PAGE_TITLE}
            </h1>

            <span
              className={ACCOUNTS_HEADER_CLASSES.registerBadge}
              title={ACCOUNTS_REGISTER_TITLE}
            >
              <BookOpen
                className={joinAccountsHeaderClassNames(
                  ACCOUNTS_HEADER_CLASSES.registerBadgeIcon,
                  ACCOUNTS_HEADER_ICON_CLASSES.register,
                )}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span className={ACCOUNTS_HEADER_CLASSES.registerBadgeText}>
                {ACCOUNTS_REGISTER_TITLE}
              </span>
            </span>
          </div>

          <p className={ACCOUNTS_HEADER_CLASSES.subtitle}>
            {ACCOUNTS_PAGE_SUBTITLE}
          </p>
        </div>
      </div>

      {/* =====================================================
          DOCUMENT ACTIONS
      ===================================================== */}

      <AccountsDocumentActions
        onPrint={onPrint}
        onDownload={onDownload}
        onShare={onShare}
        isBusy={isBusy}
        disabled={areActionsDisabled}
      />
    </header>
  );
}

/* ===========================================================
   DEFAULT EXPORT
=========================================================== */

export default AccountsHeader;

/* ===========================================================
   END
=========================================================== */
