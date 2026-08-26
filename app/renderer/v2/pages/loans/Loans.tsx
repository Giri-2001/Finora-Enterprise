// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 LOANS OFFICE™
//
// LOANS PORTFOLIO
//
// RESPONSIBILITY:
// - Render the V2 Loans Office
// - Read Loan records through LoanRepository
// - Display portfolio statistics
// - Display persisted Loan records
// - Provide status and date filters
// - Refresh portfolio
// - Open Loan Studio
// - Open View Loan Details
//
// THEME CONTRACT:
// - Consume the central FINORA Theme Engine.
// - All visual colours come from the active FinoraTheme.
// - No second theme system.
// - No local theme palette.
// - Responsive / layout geometry remains untouched.
//
// IMPORTANT:
// - No V1 Loans.tsx usage.
// - No V1 loanStore.
// - No direct localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - Persistence remains behind LoanRepository.
// - UI logic preserved.
// - Premium presentation preserved.
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";

import type { CSSProperties } from "react";

import type { Loan } from "../../components/customers/office/CustomerOffice/types";

import { getLoans } from "../../repositories/loan/loanRepository";

import { storageManager } from "../../storage/storageManager";

import { StorageMode } from "../../storage/storage.types";

import StudioLayout from "../../components/common/layout/StudioLayout";

import ViewLoanDetails from "../../components/loans/details/ViewLoanDetails";

import { useTheme } from "../../themes/provider";

import {
  pageStyle,
  topBarStyle,
  headingGroupStyle,
  pageTitleStyle,
  pageSubtitleStyle,
  createButtonStyle,
  statisticsGridStyle,
  statisticCardStyle,
  statisticLabelStyle,
  statisticValueStyle,
  filtersStyle,
  filtersGridStyle,
  filterFieldStyle,
  filterLabelStyle,
  filterSelectStyle,
  filterDateInputStyle,
  filterActionsStyle,
  clearFilterButtonStyle,
  applyFilterButtonStyle,
  portfolioStyle,
  portfolioHeaderStyle,
  portfolioTitleStyle,
  portfolioActionsStyle,
  refreshButtonStyle,
  loanCountStyle,
  tableWrapperStyle,
  tableHeaderStyle,
  tableHeaderCellStyle,
  tableHeaderRightStyle,
  tableHeaderCenterStyle,
  tableBodyStyle,
  tableRowStyle,
  serialCellStyle,
  tableCellStyle,
  tableCellSecondaryStyle,
  tableCellRightStyle,
  tableCellCenterStyle,
  loanIdentityStyle,
  loanNumberStyle,
  loanTitleStyle,
  customerNameStyle,
  customerPhoneStyle,
  amountStyle,
  outstandingStyle,
  statusBadgeStyle,
  emptyStateStyle,
  emptyTitleStyle,
  emptyDescriptionStyle,
  emptyCreateButtonStyle,
  tableFooterStyle,
  tableShowingStyle,
} from "./LoansPage.styles";

// ============================================================
// HELPERS
// ============================================================

// ============================================================
// STORAGE MODE SESSION KEY
// ============================================================

const STORAGE_MODE_SESSION_KEY = "FINORA_STORAGE_MODE";

// ============================================================
// AUTHENTICATED STORAGE MODE
//
// The selected storage mode is persisted by Login in
// sessionStorage. Loans Office must restore that same mode
// before reading persisted Loan records.
//
// This is especially important after renderer reload because
// StorageManager itself starts without the previous renderer
// storage context.
//
// ============================================================

function getAuthenticatedStorageMode(): StorageMode {
  try {
    const storedMode = window.sessionStorage.getItem(STORAGE_MODE_SESSION_KEY);

    if (storedMode === StorageMode.USB) {
      return StorageMode.USB;
    }

    if (storedMode === StorageMode.CLOUD) {
      return StorageMode.CLOUD;
    }

    return StorageMode.LOCAL;
  } catch {
    return StorageMode.LOCAL;
  }
}

function safeNumber(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

// ============================================================
// CURRENCY
// ============================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

// ============================================================
// DATE FORMATTER
// ============================================================

function formatDate(value: string): string {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  const day = String(date.getDate()).padStart(2, "0");

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

// ============================================================
// DATE FILTER KEY
// ============================================================

function getDateFilterKey(value: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ============================================================
// LOAN TYPE
// ============================================================

function formatLoanType(loan: Loan): string {
  const value = (loan.loanType || loan.repaymentType || "")
    .trim()
    .toUpperCase();

  if (value === "DAILY") {
    return "DAILY";
  }

  if (value === "WEEKLY") {
    return "WEEKLY";
  }

  if (value === "MONTHLY") {
    return "MONTHLY";
  }

  return value || "--";
}

// ============================================================
// LOAN TITLE
// ============================================================

function formatLoanTitle(loan: Loan): string {
  if (loan.title && loan.title.trim()) {
    return loan.title;
  }

  const type = formatLoanType(loan);

  if (type === "DAILY") {
    return "Daily Loan";
  }

  if (type === "WEEKLY") {
    return "Weekly Loan";
  }

  if (type === "MONTHLY") {
    return "Monthly Loan";
  }

  return "Loan";
}

// ============================================================
// STATUS
// ============================================================

type LoanFilterStatus = "ALL" | "RUNNING" | "CLOSED";

function isRunningLoan(loan: Loan): boolean {
  return loan.status === "ACTIVE" || loan.status === "RUNNING";
}

function isClosedLoan(loan: Loan): boolean {
  return loan.status === "CLOSED";
}

function formatStatus(loan: Loan): string {
  if (isClosedLoan(loan)) {
    return "Closed";
  }

  if (isRunningLoan(loan)) {
    return "Running";
  }

  return "Pending";
}

// ============================================================
// THEME VISUAL CONTRACT
// ============================================================
//
// IMPORTANT:
//
// This component does NOT create a second theme definition.
//
// It simply resolves semantic values from the central
// FinoraTheme and applies them over the existing presentation
// styles.
//
// Geometry remains owned by LoansPage.styles.ts.
//
// ============================================================

function createThemeVisuals(theme: ReturnType<typeof useTheme>["theme"]) {
  const colors = theme.colors;

  return {
    page: colors.background.page,

    surface: colors.background.surface,

    surfaceMuted: colors.background.surfaceMuted,

    brand: colors.brand.primary,

    brandSecondary: colors.brand.secondary,

    brandAccent: colors.brand.accent,

    brandAccentSoft: colors.brand.accentSoft,

    textPrimary: colors.text.primary,

    textSecondary: colors.text.secondary,

    textMuted: colors.text.muted,

    textInverse: colors.text.inverse,

    border: colors.border.default,

    borderStrong: colors.border.strong,

    borderSubtle: colors.border.subtle,

    shadow: colors.overlay.shadow,

    success: colors.status.success,

    successSoft: colors.status.successSoft,

    successBorder: colors.border.strong,

    danger: colors.status.danger,

    dangerSoft: colors.status.dangerSoft,

    dangerBorder: colors.border.strong,
  };
}

// ============================================================
// COMPONENT
// ============================================================

export default function Loans() {
  // ==========================================================
  // FINORA THEME ENGINE
  // ==========================================================

  const { theme } = useTheme();

  const themeColors = useMemo(() => createThemeVisuals(theme), [theme]);

  // ==========================================================
  // THEME-AWARE VISUAL OVERRIDES
  //
  // IMPORTANT:
  //
  // Only colours/effects are overridden here.
  //
  // Existing dimensions, spacing, typography, grid geometry
  // and responsive behaviour remain untouched.
  // ==========================================================

  const themedPageStyle: CSSProperties = {
    ...pageStyle,

    background: themeColors.page,

    color: themeColors.textPrimary,
  };

  const themedPageTitleStyle: CSSProperties = {
    ...pageTitleStyle,

    color: themeColors.textPrimary,
  };

  const themedPageSubtitleStyle: CSSProperties = {
    ...pageSubtitleStyle,

    color: themeColors.textMuted,
  };

  const themedCreateButtonStyle: CSSProperties = {
    ...createButtonStyle,

    border: `1px solid ${themeColors.brandAccent}`,

    background: themeColors.brand,

    color: themeColors.textInverse,

    boxShadow: `0 7px 18px ${themeColors.shadow}`,
  };

  const themedStatisticCardStyle: CSSProperties = {
    ...statisticCardStyle,

    border: `1px solid ${themeColors.border}`,

    background: themeColors.surface,

    boxShadow: "none",
  };

  const themedStatisticLabelStyle: CSSProperties = {
    ...statisticLabelStyle,

    color: themeColors.textMuted,
  };

  const themedStatisticValueStyle: CSSProperties = {
    ...statisticValueStyle,

    color: themeColors.textPrimary,
  };

  const themedPortfolioStyle: CSSProperties = {
    ...portfolioStyle,

    border: `1px solid ${themeColors.border}`,

    background: themeColors.surface,

    boxShadow: "none",
  };

  const themedPortfolioHeaderStyle: CSSProperties = {
    ...portfolioHeaderStyle,

    borderBottom: `1px solid ${themeColors.border}`,

    background: `linear-gradient(
        90deg,
        ${themeColors.surfaceMuted},
        ${themeColors.surface}
      )`,
  };

  const themedPortfolioTitleStyle: CSSProperties = {
    ...portfolioTitleStyle,

    color: themeColors.textPrimary,
  };

  const themedRefreshButtonStyle: CSSProperties = {
    ...refreshButtonStyle,

    border: `1px solid ${themeColors.border}`,

    background: themeColors.surfaceMuted,

    color: themeColors.textSecondary,
  };

  const themedLoanCountStyle: CSSProperties = {
    ...loanCountStyle,

    border: `1px solid ${themeColors.borderStrong}`,

    background: themeColors.brandAccentSoft,

    color: themeColors.brand,
  };

  const themedFilterLabelStyle: CSSProperties = {
    ...filterLabelStyle,

    color: themeColors.textMuted,
  };

  const themedFilterControlStyle: CSSProperties = {
    border: `1px solid ${themeColors.border}`,

    background: themeColors.surface,

    color: themeColors.textPrimary,
  };

  const themedClearFilterButtonStyle: CSSProperties = {
    ...clearFilterButtonStyle,

    border: `1px solid ${themeColors.border}`,

    background: themeColors.surfaceMuted,

    color: themeColors.textSecondary,
  };

  const themedApplyFilterButtonStyle: CSSProperties = {
    ...applyFilterButtonStyle,

    border: `1px solid ${themeColors.brand}`,

    background: themeColors.brand,

    color: themeColors.textInverse,
  };

  const themedTableHeaderStyle: CSSProperties = {
    ...tableHeaderStyle,

    borderBottom: `1px solid ${themeColors.border}`,

    background: themeColors.surfaceMuted,
  };

  const themedTableHeaderCellStyle: CSSProperties = {
    ...tableHeaderCellStyle,

    color: themeColors.textMuted,
  };

  const themedTableHeaderRightStyle: CSSProperties = {
    ...tableHeaderRightStyle,

    color: themeColors.textMuted,
  };

  const themedTableHeaderCenterStyle: CSSProperties = {
    ...tableHeaderCenterStyle,

    color: themeColors.textMuted,
  };

  const themedTableRowStyle: CSSProperties = {
    ...tableRowStyle,

    borderBottom: `1px solid ${themeColors.border}`,

    background: themeColors.surface,
  };

  const themedSerialCellStyle: CSSProperties = {
    ...serialCellStyle,

    color: themeColors.textSecondary,
  };

  const themedTableCellStyle: CSSProperties = {
    ...tableCellStyle,

    color: themeColors.textSecondary,
  };

  const themedTableCellSecondaryStyle: CSSProperties = {
    ...tableCellSecondaryStyle,

    color: themeColors.brandSecondary,
  };

  const themedTableCellRightStyle: CSSProperties = {
    ...tableCellRightStyle,

    color: themeColors.textSecondary,
  };

  const themedTableCellCenterStyle: CSSProperties = {
    ...tableCellCenterStyle,

    color: themeColors.textSecondary,
  };

  const themedLoanNumberStyle: CSSProperties = {
    ...loanNumberStyle,

    color: themeColors.textPrimary,
  };

  const themedLoanTitleStyle: CSSProperties = {
    ...loanTitleStyle,

    color: themeColors.textMuted,
  };

  const themedCustomerNameStyle: CSSProperties = {
    ...customerNameStyle,

    color: themeColors.textPrimary,
  };

  const themedCustomerPhoneStyle: CSSProperties = {
    ...customerPhoneStyle,

    color: themeColors.textMuted,
  };

  const themedAmountStyle: CSSProperties = {
    ...amountStyle,

    color: themeColors.textPrimary,
  };

  const themedOutstandingStyle: CSSProperties = {
    ...outstandingStyle,

    color: themeColors.brand,
  };

  const themedEmptyStateStyle: CSSProperties = {
    ...emptyStateStyle,

    background: themeColors.surface,
  };

  const themedEmptyTitleStyle: CSSProperties = {
    ...emptyTitleStyle,

    color: themeColors.textPrimary,
  };

  const themedEmptyDescriptionStyle: CSSProperties = {
    ...emptyDescriptionStyle,

    color: themeColors.textMuted,
  };

  const themedEmptyCreateButtonStyle: CSSProperties = {
    ...emptyCreateButtonStyle,

    border: `1px solid ${themeColors.brandAccent}`,

    background: themeColors.brand,

    color: themeColors.textInverse,

    boxShadow: `0 7px 18px ${themeColors.shadow}`,
  };

  const themedTableFooterStyle: CSSProperties = {
    ...tableFooterStyle,

    borderTop: `1px solid ${themeColors.border}`,

    background: themeColors.surface,
  };

  const themedTableShowingStyle: CSSProperties = {
    ...tableShowingStyle,

    color: themeColors.textMuted,
  };

  // ==========================================================
  // LOAN STATE
  // ==========================================================

  const [loans, setLoans] = useState<Loan[]>([]);

  // ==========================================================
  // VIEW LOAN STATE
  // ==========================================================

  const [viewingLoan, setViewingLoan] = useState<Loan | null>(null);

  // ==========================================================
  // LOADING
  // ==========================================================

  const [loading, setLoading] = useState(true);

  // ==========================================================
  // REFRESHING
  // ==========================================================

  const [refreshing, setRefreshing] = useState(false);

  // ==========================================================
  // FILTER STATE
  // ==========================================================

  const [filterStatus, setFilterStatus] = useState<LoanFilterStatus>("ALL");

  const [filterFromDate, setFilterFromDate] = useState("");

  const [filterToDate, setFilterToDate] = useState("");

  // ==========================================================
  // LOAD LOANS
  //
  // IMPORTANT:
  //
  // Loans Office must restore the authenticated FINORA
  // storage context before reading persisted Loan records.
  //
  // This is required after renderer reload because
  // StorageManager starts with a fresh runtime context.
  //
  // ==========================================================

  const loadLoans = useCallback(async (isRefresh = false): Promise<void> => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // ----------------------------------------------------
      // RESTORE AUTHENTICATED STORAGE MODE
      // ----------------------------------------------------

      const storageMode = getAuthenticatedStorageMode();

      const storageActivated =
        await storageManager.selectStorageMode(storageMode);

      if (!storageActivated.success) {
        throw new Error(
          storageActivated.error ??
            `Unable to restore FINORA ${storageMode} storage.`,
        );
      }

      // ----------------------------------------------------
      // READ LOANS FROM THE RESTORED STORAGE
      // ----------------------------------------------------

      const records = await getLoans();

      setLoans(records);
    } catch (error) {
      console.error("FINORA V2 LOANS OFFICE LOAD ERROR:", error);

      setLoans([]);
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  }, []);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    void loadLoans();
  }, [loadLoans]);

  // ==========================================================
  // REFRESH AFTER LOAN WORKFLOW
  // ==========================================================

  useEffect(() => {
    const handleLoanUpdate = () => {
      void loadLoans();
    };

    window.addEventListener("FINORA_LOAN_UPDATED", handleLoanUpdate);

    return () => {
      window.removeEventListener("FINORA_LOAN_UPDATED", handleLoanUpdate);
    };
  }, [loadLoans]);

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const statistics = useMemo(() => {
    const activeLoans = loans.filter(isRunningLoan);

    const closedLoans = loans.filter(isClosedLoan);

    const outstanding = loans.reduce(
      (total, loan) => total + safeNumber(loan.outstanding),
      0,
    );

    return {
      total: loans.length,

      active: activeLoans.length,

      closed: closedLoans.length,

      outstanding,
    };
  }, [loans]);

  // ==========================================================
  // FILTER VALIDATION
  // ==========================================================

  const handleApplyFilters = (): void => {
    if (filterFromDate && filterToDate && filterFromDate > filterToDate) {
      alert("From Date cannot be later than To Date.");

      return;
    }
  };

  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  const handleClearFilters = (): void => {
    setFilterStatus("ALL");

    setFilterFromDate("");

    setFilterToDate("");
  };

  // ==========================================================
  // FILTERED LOANS
  // ==========================================================

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      // ------------------------------------------------
      // STATUS
      // ------------------------------------------------

      if (filterStatus === "RUNNING" && !isRunningLoan(loan)) {
        return false;
      }

      if (filterStatus === "CLOSED" && !isClosedLoan(loan)) {
        return false;
      }

      // ------------------------------------------------
      // DATE
      // ------------------------------------------------

      const loanDate = getDateFilterKey(loan.loanDate);

      if (filterFromDate && (!loanDate || loanDate < filterFromDate)) {
        return false;
      }

      if (filterToDate && (!loanDate || loanDate > filterToDate)) {
        return false;
      }

      return true;
    });
  }, [loans, filterStatus, filterFromDate, filterToDate]);

  // ==========================================================
  // CREATE LOAN
  // ==========================================================

  const handleCreateLoan = useCallback((): void => {
    window.dispatchEvent(new CustomEvent("FINORA_V2_OPEN_LOAN_STUDIO"));
  }, []);

  // ==========================================================
  // VIEW LOAN
  // ==========================================================

  const handleViewLoan = useCallback((loan: Loan): void => {
    setViewingLoan(loan);
  }, []);

  // ==========================================================
  // CLOSE VIEW
  // ==========================================================

  const handleCloseLoanDetails = useCallback((): void => {
    setViewingLoan(null);
  }, []);

  // ==========================================================
  // VIEW LOAN DETAILS
  // ==========================================================

  if (viewingLoan) {
    return (
      <StudioLayout department="Loans" allowScroll={true} showHeader={false}>
        <ViewLoanDetails loan={viewingLoan} onBack={handleCloseLoanDetails} />
      </StudioLayout>
    );
  }

  // ==========================================================
  // RENDER LOANS OFFICE
  // ==========================================================

  return (
    <StudioLayout department="Loans" allowScroll={true} showHeader={false}>
      <main style={themedPageStyle}>
        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <section style={topBarStyle}>
          <div style={headingGroupStyle}>
            <h1 style={themedPageTitleStyle}>Loans Office</h1>

            <p style={themedPageSubtitleStyle}>
              Manage, review and create customer loans.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateLoan}
            style={themedCreateButtonStyle}
          >
            + Create New Loan
          </button>
        </section>

        {/* ==================================================
            STATISTICS
        ================================================== */}

        <section style={statisticsGridStyle}>
          <article style={themedStatisticCardStyle}>
            <span style={themedStatisticLabelStyle}>Total Loans</span>

            <strong style={themedStatisticValueStyle}>
              {statistics.total}
            </strong>
          </article>

          <article style={themedStatisticCardStyle}>
            <span style={themedStatisticLabelStyle}>Active / Running</span>

            <strong style={themedStatisticValueStyle}>
              {statistics.active}
            </strong>
          </article>

          <article style={themedStatisticCardStyle}>
            <span style={themedStatisticLabelStyle}>Closed</span>

            <strong style={themedStatisticValueStyle}>
              {statistics.closed}
            </strong>
          </article>

          <article style={themedStatisticCardStyle}>
            <span style={themedStatisticLabelStyle}>Outstanding</span>

            <strong style={themedStatisticValueStyle}>
              {formatCurrency(statistics.outstanding)}
            </strong>
          </article>
        </section>

        {/* ==================================================
            LOAN PORTFOLIO
        ================================================== */}

        <section style={themedPortfolioStyle}>
          <header style={themedPortfolioHeaderStyle}>
            <div style={themedPortfolioTitleStyle}>
              <span
                style={{
                  width: "3px",

                  height: "16px",

                  flexShrink: 0,

                  borderRadius: "3px",

                  background: themeColors.brand,

                  boxShadow: `0 0 10px ${themeColors.shadow}`,
                }}
              />
              Loan Portfolio
            </div>

            <div style={portfolioActionsStyle}>
              {/* ==========================================
                  FILTERS
              ========================================== */}

              <div style={filtersStyle}>
                <div style={filtersGridStyle}>
                  <div style={filterFieldStyle}>
                    <label style={themedFilterLabelStyle}>Status</label>

                    <select
                      value={filterStatus}
                      onChange={(event) => {
                        setFilterStatus(event.target.value as LoanFilterStatus);
                      }}
                      style={{
                        ...filterSelectStyle,
                        ...themedFilterControlStyle,
                      }}
                    >
                      <option value="ALL">All</option>

                      <option value="RUNNING">Running</option>

                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>

                  <div style={filterFieldStyle}>
                    <label style={themedFilterLabelStyle}>From</label>

                    <input
                      type="date"
                      value={filterFromDate}
                      onChange={(event) => {
                        setFilterFromDate(event.target.value);
                      }}
                      style={{
                        ...filterDateInputStyle,
                        ...themedFilterControlStyle,
                      }}
                    />
                  </div>

                  <div style={filterFieldStyle}>
                    <label style={themedFilterLabelStyle}>To</label>

                    <input
                      type="date"
                      value={filterToDate}
                      onChange={(event) => {
                        setFilterToDate(event.target.value);
                      }}
                      style={{
                        ...filterDateInputStyle,
                        ...themedFilterControlStyle,
                      }}
                    />
                  </div>

                  <div style={filterActionsStyle}>
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      style={themedClearFilterButtonStyle}
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      onClick={handleApplyFilters}
                      style={themedApplyFilterButtonStyle}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* ==========================================
                  REFRESH
              ========================================== */}

              <button
                type="button"
                onClick={() => {
                  void loadLoans(true);
                }}
                disabled={refreshing}
                style={themedRefreshButtonStyle}
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <span style={themedLoanCountStyle}>
                {filteredLoans.length}{" "}
                {filteredLoans.length === 1 ? "Loan" : "Loans"}
              </span>
            </div>
          </header>

          {/* =================================================
              CONTENT
          ================================================= */}

          {loading ? (
            <div style={themedEmptyStateStyle}>
              <div style={themedEmptyTitleStyle}>Loading V2 Loans...</div>

              <div style={themedEmptyDescriptionStyle}>
                Reading loan records from FINORA V2 storage.
              </div>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div style={themedEmptyStateStyle}>
              <div style={themedEmptyTitleStyle}>
                {loans.length === 0
                  ? "No V2 Loans Found"
                  : "No Loans Match Filters"}
              </div>

              <div style={themedEmptyDescriptionStyle}>
                {loans.length === 0
                  ? "No V2 loan records are currently available. Create a new loan to begin the portfolio."
                  : "Change the status or date filters to view matching loan records."}
              </div>

              {loans.length === 0 ? (
                <button
                  type="button"
                  onClick={handleCreateLoan}
                  style={themedEmptyCreateButtonStyle}
                >
                  + Create New Loan
                </button>
              ) : null}
            </div>
          ) : (
            <>
              {/* ==========================================
                  PORTFOLIO TABLE
              ========================================== */}

              <div style={tableWrapperStyle}>
                {/* TABLE HEADER */}

                <div style={themedTableHeaderStyle} role="row">
                  <div style={themedTableHeaderCenterStyle}>S.No.</div>

                  <div style={themedTableHeaderCellStyle}>Loan</div>

                  <div style={themedTableHeaderCellStyle}>Customer</div>

                  <div style={themedTableHeaderCellStyle}>Type</div>

                  <div style={themedTableHeaderRightStyle}>Principal</div>

                  <div style={themedTableHeaderRightStyle}>Outstanding</div>

                  <div style={themedTableHeaderCenterStyle}>Loan Date</div>

                  <div style={themedTableHeaderCenterStyle}>Status</div>

                  {/* VIEW */}

                  <div style={themedTableHeaderCenterStyle}></div>
                </div>

                {/* TABLE BODY */}

                <div style={tableBodyStyle} role="rowgroup">
                  {filteredLoans.map((loan, index) => (
                    <div
                      key={loan.id}
                      style={{
                        ...themedTableRowStyle,

                        gridTemplateColumns:
                          "56px minmax(120px,1.2fr) minmax(130px,1.25fr) minmax(80px,0.8fr) minmax(100px,0.9fr) minmax(110px,1fr) minmax(95px,0.8fr) minmax(80px,0.7fr) 72px",
                      }}
                      role="row"
                    >
                      {/* S.NO. */}

                      <div style={themedSerialCellStyle}>{index + 1}</div>

                      {/* LOAN */}

                      <div style={loanIdentityStyle}>
                        <div style={themedLoanNumberStyle}>
                          {loan.loanNumber || loan.id || "--"}
                        </div>

                        <div style={themedLoanTitleStyle}>
                          {formatLoanTitle(loan)}
                        </div>
                      </div>

                      {/* CUSTOMER */}

                      <div style={themedTableCellStyle}>
                        <div style={themedCustomerNameStyle}>
                          {loan.customerName || "--"}
                        </div>

                        <div style={themedCustomerPhoneStyle}>
                          {loan.phoneNumber || "--"}
                        </div>
                      </div>

                      {/* TYPE */}

                      <div style={amountStyle}>{formatLoanType(loan)}</div>

                      {/* PRINCIPAL */}

                      <div style={themedTableCellRightStyle}>
                        <span style={themedAmountStyle}>
                          {formatCurrency(loan.amount)}
                        </span>
                      </div>

                      {/* OUTSTANDING */}

                      <div style={themedTableCellRightStyle}>
                        <span style={amountStyle}>
                          {formatCurrency(loan.outstanding)}
                        </span>
                      </div>

                      {/* LOAN DATE */}

                      <div style={themedTableCellCenterStyle}>
                        {formatDate(loan.loanDate)}
                      </div>

                      {/* STATUS */}

                      <div style={themedTableCellCenterStyle}>
                        <span
                          style={{
                            ...statusBadgeStyle(loan.status),

                            border: `1px solid ${
                              isClosedLoan(loan)
                                ? themeColors.border
                                : themeColors.successBorder
                            }`,

                            background: isClosedLoan(loan)
                              ? themeColors.surfaceMuted
                              : themeColors.successSoft,

                            color: isClosedLoan(loan)
                              ? themeColors.textMuted
                              : themeColors.success,
                          }}
                        >
                          {formatStatus(loan)}
                        </span>
                      </div>

                      {/* VIEW ACTION */}

                      <div style={themedTableCellCenterStyle}>
                        <button
                          type="button"
                          onClick={() => handleViewLoan(loan)}
                          style={{
                            minHeight: "28px",

                            padding: "0 9px",

                            border: `1px solid ${themeColors.borderStrong}`,

                            borderRadius: "6px",

                            background: themeColors.brandAccentSoft,

                            color: themeColors.brand,

                            fontSize: "10px",

                            fontWeight: 750,

                            cursor: "pointer",

                            whiteSpace: "nowrap",
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* =================================================
                  TABLE FOOTER
              ================================================= */}

              <div style={themedTableFooterStyle}>
                <span style={themedTableShowingStyle}>
                  Showing 1 to {filteredLoans.length} of {filteredLoans.length}{" "}
                  loans
                </span>
              </div>
            </>
          )}
        </section>
      </main>
    </StudioLayout>
  );
}

// ============================================================
// END
// ============================================================
