/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS OFFICE

   MODULE  : Accounts
   LAYER   : Page Orchestration
   VERSION : 1.0

   RESPONSIBILITY:

   - Load authoritative Accounts read-model data
   - Maintain draft and applied filters
   - Build filtered AccountsLedgerView
   - Render Header / Summary / Filters / Ledger
   - Render loading / error / empty states
   - Build immutable document snapshots
   - Delegate PDF Print / Download / Share
   - Activate Accounts responsive CSS-variable bridge

   IMPORTANT:

   - No inline styles.
   - No financial calculations in JSX.
   - No direct LOAN / COLLECTION repository access.
   - No duplicate Accounts persistence.
   - No ad-hoc responsive breakpoints.
   - No theme calculations.
   - No PDF drawing logic.

   DATA FLOW:

   LOAN + COLLECTION
          ↓
   accountsDataService
          ↓
   AccountEntry[]
          ↓
   buildAccountsLedgerView()
          ↓
   Accounts Office
          ↓
   UI + PDF Snapshot
=========================================================== */

/* ===========================================================
   REACT
=========================================================== */

import { useEffect, useMemo, useState } from "react";

/* ===========================================================
   CONSTANTS
=========================================================== */

import {
  ACCOUNTS_DOCUMENT_TITLE,
  DEFAULT_ACCOUNTS_FILTERS,
} from "../../constants/accounts/accounts.constants";

/* ===========================================================
   TYPES
=========================================================== */

import type {
  AccountsDataResult,
  AccountsDocumentPeriod,
  AccountsDocumentRequest,
  AccountsFilterState,
} from "../../types/accounts/accounts.types";

/* ===========================================================
   DATA SERVICE
=========================================================== */

import { loadAccountsData } from "../../services/accounts/accountsDataService";

/* ===========================================================
   SELECTORS
=========================================================== */

import { buildAccountsLedgerView } from "../../selectors/accounts/accounts.selectors";

/* ===========================================================
   PDF SERVICE
=========================================================== */

import {
  downloadAccountsPdf,
  printAccountsPdf,
  shareAccountsPdf,
} from "../../services/accounts/accountsPdf";

/* ===========================================================
   SHARED REPORT GENERATED DATE
=========================================================== */

import { getReportGeneratedAt } from "../../services/reports/reportPdfService";

/* ===========================================================
   RESPONSIVE ENGINE
=========================================================== */

import { useAccountsResponsive } from "../../utils/responsive/accounts/accounts.useResponsive";

/* ===========================================================
   COMPONENTS
=========================================================== */

import { AccountsHeader } from "./components/AccountsHeader";

import { AccountsSummary } from "./components/AccountsSummary";

import { AccountsFilters } from "./components/AccountsFilters";

import { AccountsLedger } from "./components/AccountsLedger";

import { AccountsEmptyState } from "./components/AccountsEmptyState";

/* ===========================================================
   STYLE CONTRACT
=========================================================== */

import {
  ACCOUNTS_OFFICE_CLASSES,
  ACCOUNTS_STATE_CLASSES,
} from "./AccountsOffice.styles";

/* ===========================================================
   STYLESHEET
=========================================================== */

import "./AccountsOffice.css";

import { Capacitor } from "@capacitor/core";

/* ===========================================================
   DEFAULT FILTER FACTORY

   DEFAULT_ACCOUNTS_FILTERS is readonly.

   UI state receives an independent mutable snapshot.
=========================================================== */

function createDefaultAccountsFilters(): AccountsFilterState {
  return {
    ...DEFAULT_ACCOUNTS_FILTERS,
  };
}

/* ===========================================================
   SAFE ERROR MESSAGE
=========================================================== */

function getAccountsErrorMessage(
  error: unknown,

  fallback: string,
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

/* ===========================================================
   DOCUMENT PERIOD SNAPSHOT
=========================================================== */

function buildAccountsDocumentPeriod(
  filters: AccountsFilterState,

  periodLabel: string,
): AccountsDocumentPeriod {
  return {
    preset: filters.period,

    label: periodLabel,

    selectedDate: filters.selectedDate || undefined,

    fromDate: filters.fromDate || undefined,

    toDate: filters.toDate || undefined,

    selectedMonth: filters.selectedMonth || undefined,

    selectedYear: filters.selectedYear || undefined,
  };
}

/* ===========================================================
   COMPONENT
=========================================================== */

export function AccountsOffice() {
  /* =========================================================
     RESPONSIVE ENGINE

     Hook applies the current Accounts responsive CSS variables
     to the FINORA document root.

     No visual values are calculated in this page.
  ========================================================= */

  useAccountsResponsive();

  /* =========================================================
     DATA STATE
  ========================================================= */

  const [data, setData] = useState<AccountsDataResult | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [reloadVersion, setReloadVersion] = useState(0);

  /* =========================================================
     FILTER STATE

     draftFilters
       → what owner is currently editing

     appliedFilters
       → what actually controls Accounts ledger
  ========================================================= */

  const [draftFilters, setDraftFilters] = useState<AccountsFilterState>(
    createDefaultAccountsFilters,
  );

  const [appliedFilters, setAppliedFilters] = useState<AccountsFilterState>(
    createDefaultAccountsFilters,
  );

  /* =========================================================
     DOCUMENT STATE
  ========================================================= */

  const [isDocumentBusy, setIsDocumentBusy] = useState(false);

  const [documentError, setDocumentError] = useState<string | null>(null);

  /* =========================================================
     LOAD AUTHORITATIVE ACCOUNTS DATA
  ========================================================= */

  useEffect(() => {
    let isActive = true;

    async function run(): Promise<void> {
      setIsLoading(true);

      setLoadError(null);

      try {
        const result = await loadAccountsData();

        if (!isActive) {
          return;
        }

        setData(result);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setData(null);

        setLoadError(
          getAccountsErrorMessage(
            error,
            "Unable to load Accounts data. Please try again.",
          ),
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void run();

    return () => {
      isActive = false;
    };
  }, [reloadVersion]);

  /* =========================================================
     FILTERED LEDGER VIEW

     All financial filtering and totals remain inside the
     selector/calculation layer.
  ========================================================= */

  const ledger = useMemo(
    () => buildAccountsLedgerView(data?.entries ?? [], appliedFilters),
    [data?.entries, appliedFilters],
  );

  /* =========================================================
     ACTION AVAILABILITY
  ========================================================= */

  const documentActionsDisabled =
    isLoading ||
    Boolean(loadError) ||
    data === null ||
    ledger.entries.length === 0;

  /* =========================================================
     FILTER HANDLERS
  ========================================================= */

  function handleFilterChange(filters: AccountsFilterState): void {
    setDraftFilters({
      ...filters,
    });
  }

  function handleApplyFilters(): void {
    setAppliedFilters({
      ...draftFilters,
    });

    setDocumentError(null);
  }

  function handleResetFilters(): void {
    const defaults = createDefaultAccountsFilters();

    setDraftFilters(defaults);

    setAppliedFilters({
      ...defaults,
    });

    setDocumentError(null);
  }

  /* =========================================================
     RETRY DATA LOAD
  ========================================================= */

  function handleRetry(): void {
    setReloadVersion((current) => current + 1);
  }

  /* =========================================================
     DOCUMENT REQUEST

     Snapshot is created only when an owner requests an action.

     Therefore generatedAt reflects actual Print / Download /
     Share time instead of page-open time.
  ========================================================= */

  function createDocumentRequest(): AccountsDocumentRequest {
    return {
      title: ACCOUNTS_DOCUMENT_TITLE,

      period: buildAccountsDocumentPeriod(appliedFilters, ledger.periodLabel),

      filters: {
        ...appliedFilters,
      },

      entries: [...ledger.entries],

      summary: {
        ...ledger.summary,
      },

      generatedAt: getReportGeneratedAt(),
    };
  }

  /* =========================================================
     PRINT
  ========================================================= */

  function handlePrint(): void {
    if (documentActionsDisabled) {
      return;
    }

    setIsDocumentBusy(true);

    setDocumentError(null);

    try {
      printAccountsPdf(createDocumentRequest());
    } catch (error) {
      setDocumentError(
        getAccountsErrorMessage(
          error,
          "Unable to print the Accounts Register.",
        ),
      );
    } finally {
      setIsDocumentBusy(false);
    }
  }

  /* =========================================================
     DOWNLOAD
  ========================================================= */

  function handleDownload(): void {
    if (documentActionsDisabled) {
      return;
    }

    setIsDocumentBusy(true);

    setDocumentError(null);

    try {
      downloadAccountsPdf(createDocumentRequest());
    } catch (error) {
      setDocumentError(
        getAccountsErrorMessage(
          error,
          "Unable to download the Accounts Register.",
        ),
      );
    } finally {
      setIsDocumentBusy(false);
    }
  }

  /* =========================================================
     SHARE
  ========================================================= */

  async function handleShare(): Promise<void> {
    if (documentActionsDisabled) {
      return;
    }

    setIsDocumentBusy(true);

    setDocumentError(null);

    try {
      /*
       * Android / native:
       * Generate the Accounts PDF and open the native share sheet.
       */
      if (Capacitor.isNativePlatform()) {
        await shareAccountsPdf(createDocumentRequest());

        return;
      }

      /*
       * Desktop / Electron:
       *
       * Electron's Chromium runtime does not expose navigator.share.
       * Match the existing FINORA Reports desktop-share behavior by
       * opening WhatsApp Web instead of incorrectly triggering a PDF
       * download/save dialog.
       */
      window.open("https://web.whatsapp.com/", "_blank");
    } catch (error) {
      setDocumentError(
        getAccountsErrorMessage(
          error,
          "Unable to share the Accounts Register.",
        ),
      );
    } finally {
      setIsDocumentBusy(false);
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className={ACCOUNTS_OFFICE_CLASSES.page}>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AccountsHeader
        onPrint={handlePrint}
        onDownload={handleDownload}
        onShare={handleShare}
        isBusy={isDocumentBusy}
        actionsDisabled={documentActionsDisabled}
      />

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <main className={ACCOUNTS_OFFICE_CLASSES.content}>
        {/* ===================================================
            LOADING
        =================================================== */}

        {isLoading && (
          <section
            className={ACCOUNTS_STATE_CLASSES.loadingPanel}
            aria-live="polite"
            aria-busy="true"
          >
            <h2 className={ACCOUNTS_STATE_CLASSES.title}>Opening Accounts</h2>

            <p className={ACCOUNTS_STATE_CLASSES.text}>
              Reading loan disbursements and collections...
            </p>
          </section>
        )}

        {/* ===================================================
            LOAD ERROR
        =================================================== */}

        {!isLoading && loadError && (
          <section className={ACCOUNTS_STATE_CLASSES.errorPanel} role="alert">
            <h2 className={ACCOUNTS_STATE_CLASSES.title}>
              Accounts could not be opened
            </h2>

            <p className={ACCOUNTS_STATE_CLASSES.text}>{loadError}</p>

            <button
              type="button"
              className={ACCOUNTS_STATE_CLASSES.retryButton}
              onClick={handleRetry}
            >
              Try Again
            </button>
          </section>
        )}

        {/* ===================================================
            ACCOUNTS WORKSPACE
        =================================================== */}

        {!isLoading && !loadError && data && (
          <>
            {/* =================================================
                  DOCUMENT ERROR

                  Does not hide Accounts data.
              ================================================= */}

            {documentError && (
              <section
                className={ACCOUNTS_STATE_CLASSES.errorPanel}
                role="alert"
              >
                <h2 className={ACCOUNTS_STATE_CLASSES.title}>
                  Document action failed
                </h2>

                <p className={ACCOUNTS_STATE_CLASSES.text}>{documentError}</p>
              </section>
            )}

            {/* =================================================
                  SUMMARY
              ================================================= */}

            <div className={ACCOUNTS_OFFICE_CLASSES.section}>
              <AccountsSummary summary={ledger.summary} />
            </div>

            {/* =================================================
                  FILTERS
              ================================================= */}

            <div className={ACCOUNTS_OFFICE_CLASSES.section}>
              <AccountsFilters
                filters={draftFilters}
                customers={data.customers}
                onChange={handleFilterChange}
                onReset={handleResetFilters}
                onApply={handleApplyFilters}
                disabled={isDocumentBusy}
              />
            </div>

            {/* =================================================
                  REGISTER / EMPTY RESULT
              ================================================= */}

            <div className={ACCOUNTS_OFFICE_CLASSES.section}>
              {ledger.entries.length > 0 ? (
                <AccountsLedger ledger={ledger} startSerialNumber={1} />
              ) : (
                <AccountsEmptyState
                  onReset={handleResetFilters}
                  disabled={isDocumentBusy}
                />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ===========================================================
   DEFAULT EXPORT
=========================================================== */

export default AccountsOffice;

/* ===========================================================
   END
=========================================================== */
