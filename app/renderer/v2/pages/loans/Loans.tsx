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
// RELOAD CONTRACT:
// - Restore the authenticated storage mode from sessionStorage.
// - Activate that storage mode BEFORE getLoans().
// - This prevents persisted loans disappearing after Ctrl + R.
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

import { useLoansOfficeResponsive } from "../../utils/responsive/loansOffice/loansOffice.useResponsive";

import {
  ArchiveX,
  Gem,
  Plus,
} from "lucide-react";

import {
  createLoansOfficePageStyle,
  createLoansOfficeTopBarStyle,
  createLoansOfficeStatisticsGridStyle,
  createLoansOfficeStatisticCardStyle,
  createLoansOfficeFiltersGridStyle,
  createLoansOfficePortfolioHeaderStyle,
  createLoansOfficePortfolioActionsStyle,
} from "../../utils/responsive/loansOffice/loansOffice.layout";

import LoanPortfolioResponsiveRecord from "./components/LoanPortfolioResponsiveRecord";

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
  tableCellRightStyle,
  tableCellCenterStyle,
  loanIdentityStyle,
  loanNumberStyle,
  loanTitleStyle,
  customerNameStyle,
  customerPhoneStyle,
  amountStyle,
  loanTypeStyle,
  statusBadgeStyle,
  emptyStateStyle,
  emptyTitleStyle,
  emptyDescriptionStyle,
  emptyCreateButtonStyle,
  paginationBarStyle,
  paginationSummaryStyle,
  paginationControlsStyle,
  paginationNavButtonStyle,
  paginationPageButtonStyle,
  paginationEllipsisStyle,
} from "./LoansPage.styles";

// ============================================================
// HELPERS
// ============================================================

// ============================================================
// STORAGE MODE SESSION KEY
// ============================================================

const STORAGE_MODE_SESSION_KEY = "FINORA_STORAGE_MODE";

const LOANS_PER_PAGE = 10;

// ============================================================
// AUTHENTICATED STORAGE MODE
//
// Login persists the selected storage mode in sessionStorage.
//
// After renderer reload:
// - StorageManager creates a fresh runtime instance.
// - Its previous storage context is not automatically restored.
// - Loans Office therefore restores the authenticated mode
//   before reading Loan records.
//
// IMPORTANT:
// - No localStorage access.
// - No filesystem access.
// - No fallback from USB to LOCAL.
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

// ============================================================
// SAFE NUMBER
// ============================================================

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

  // ==========================================================
  // LOANS OFFICE RESPONSIVE ENGINE
  // ==========================================================

  const { tokens: responsiveTokens } = useLoansOfficeResponsive();

  const themeColors = useMemo(() => createThemeVisuals(theme), [theme]);

  // ==========================================================
  // THEME-AWARE VISUAL OVERRIDES
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

  const themedLoanTypeStyle: CSSProperties = {
    ...loanTypeStyle,
    color: themeColors.textPrimary,
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

  const themedPaginationBarStyle: CSSProperties = {
    ...paginationBarStyle,
    borderTop: `1px solid ${themeColors.border}`,
    background: themeColors.surface,
  };

  const themedPaginationSummaryStyle: CSSProperties = {
    ...paginationSummaryStyle,
    color: themeColors.textMuted,
  };

  const themedPaginationNavButtonStyle: CSSProperties = {
    ...paginationNavButtonStyle,
    border: `1px solid ${themeColors.border}`,
    background: themeColors.surfaceMuted,
    color: themeColors.textSecondary,
  };

  const themedPaginationEllipsisStyle: CSSProperties = {
    ...paginationEllipsisStyle,
    color: themeColors.textMuted,
  };

  const getThemedPaginationPageButtonStyle = (
    active: boolean,
  ): CSSProperties => ({
    ...paginationPageButtonStyle(active),
    border: `1px solid ${active ? themeColors.brand : themeColors.border}`,
    background: active ? themeColors.brand : themeColors.surfaceMuted,
    color: active ? themeColors.textInverse : themeColors.textSecondary,
  });

  // ==========================================================
  // RESPONSIVE PRESENTATION
  // ==========================================================

  const responsivePageStyle: CSSProperties = {
    ...themedPageStyle,
    ...createLoansOfficePageStyle(responsiveTokens),
  };

  const responsiveTopBarStyle: CSSProperties = {
    ...topBarStyle,
    ...createLoansOfficeTopBarStyle(responsiveTokens),
  };

  const responsiveCreateButtonStyle: CSSProperties = {
    ...themedCreateButtonStyle,
    width: responsiveTokens.viewport === "mobile" ? "100%" : undefined,
  };

  const responsiveHeaderActionsStyle: CSSProperties = {
    width: responsiveTokens.viewport === "mobile" ? "100%" : "auto",

    display: "flex",

    flexDirection: responsiveTokens.viewport === "mobile" ? "column" : "row",

    alignItems: "center",

    justifyContent: "flex-end",

    gap: "8px",
  };

  const responsiveRejectedButtonStyle: CSSProperties = {
    ...createButtonStyle,

    width:
      responsiveTokens.viewport === "mobile"
        ? "100%"
        : undefined,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "7px",

    border:
      `1px solid ${themeColors.borderStrong}`,

    background:
      themeColors.surfaceMuted,

    color:
      themeColors.textSecondary,

    boxShadow:
      "none",
  };

  const responsiveGoldCreateButtonStyle: CSSProperties = {
    ...createButtonStyle,

    width: responsiveTokens.viewport === "mobile" ? "100%" : undefined,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "7px",

    border: `1px solid ${themeColors.brand}`,

    background: themeColors.brandAccentSoft,

    color: themeColors.brand,

    boxShadow: "none",
  };

  const responsiveStatisticsGridStyle: CSSProperties = {
    ...statisticsGridStyle,
    ...createLoansOfficeStatisticsGridStyle(responsiveTokens),
  };

  const responsiveStatisticCardStyle: CSSProperties = {
    ...themedStatisticCardStyle,
    ...createLoansOfficeStatisticCardStyle(responsiveTokens),
  };

  const responsiveFiltersGridStyle: CSSProperties = {
    ...filtersGridStyle,
    ...createLoansOfficeFiltersGridStyle(responsiveTokens),
  };

  const responsivePortfolioHeaderStyle: CSSProperties = {
    ...themedPortfolioHeaderStyle,
    ...createLoansOfficePortfolioHeaderStyle(responsiveTokens),
  };

  const responsivePortfolioActionsStyle: CSSProperties = {
    ...portfolioActionsStyle,
    ...createLoansOfficePortfolioActionsStyle(responsiveTokens),
    width:
      responsiveTokens.viewport === "mobile" ||
      responsiveTokens.viewport === "tablet"
        ? "100%"
        : undefined,
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
  //
  // Draft state = current controls.
  // Applied state = actual portfolio filter.
  // ==========================================================

  const [filterStatus, setFilterStatus] = useState<LoanFilterStatus>("ALL");

  const [filterFromDate, setFilterFromDate] = useState("");

  const [filterToDate, setFilterToDate] = useState("");

  const [appliedFilterStatus, setAppliedFilterStatus] =
    useState<LoanFilterStatus>("ALL");

  const [appliedFilterFromDate, setAppliedFilterFromDate] = useState("");

  const [appliedFilterToDate, setAppliedFilterToDate] = useState("");

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const [currentPage, setCurrentPage] = useState(1);

  // ==========================================================
  // LOAD LOANS
  //
  // IMPORTANT:
  //
  // Restore authenticated storage mode FIRST.
  //
  // Only after storageManager.selectStorageMode()
  // succeeds do we call getLoans().
  //
  // This fixes:
  //
  // Ctrl + R
  //     ↓
  // fresh StorageManager
  //     ↓
  // wrong/default runtime context
  //     ↓
  // empty Loans Office
  //
  // ==========================================================

  const loadLoans = useCallback(async (isRefresh = false): Promise<void> => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // --------------------------------------------------
      // PRESERVE LIVE FINORA STORAGE CONTEXT
      //
      // If StorageManager is already initialized, its live
      // configuration is authoritative.
      //
      // This prevents a stale sessionStorage value from changing
      // an active USB session to LOCAL while navigating to Loans.
      //
      // Only a fresh / uninitialized StorageManager may restore
      // the persisted session mode.
      // --------------------------------------------------

      if (!storageManager.isInitialized()) {
        const storageMode = getAuthenticatedStorageMode();

        const storageActivated =
          await storageManager.selectStorageMode(storageMode);

        if (!storageActivated.success) {
          throw new Error(
            storageActivated.error ??
              `Unable to restore FINORA ${storageMode} storage.`,
          );
        }
      }

      // --------------------------------------------------
      // READ LOANS ONLY AFTER STORAGE IS READY
      // --------------------------------------------------

      const records = await getLoans();

      setLoans(records);

      /*
       * Keep View Loan Details connected to the latest persisted
       * Loan record.
       *
       * Collections dispatches FINORA_LOAN_UPDATED after a successful
       * payment. loadLoans() therefore reloads repository data and
       * replaces the old viewingLoan snapshot with the latest record.
       */

      setViewingLoan((currentLoan) => {
        if (!currentLoan) {
          return null;
        }

        const refreshedLoan = records.find(
          (record) => record.id === currentLoan.id,
        );

        return refreshedLoan ?? currentLoan;
      });
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
  // APPLY FILTERS
  // ==========================================================

  const handleApplyFilters = (): void => {
    if (filterFromDate && filterToDate && filterFromDate > filterToDate) {
      alert("From Date cannot be later than To Date.");

      return;
    }

    setAppliedFilterStatus(filterStatus);

    setAppliedFilterFromDate(filterFromDate);

    setAppliedFilterToDate(filterToDate);

    setCurrentPage(1);
  };

  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  const handleClearFilters = (): void => {
    setFilterStatus("ALL");

    setFilterFromDate("");

    setFilterToDate("");

    setAppliedFilterStatus("ALL");

    setAppliedFilterFromDate("");

    setAppliedFilterToDate("");

    setCurrentPage(1);
  };

  // ==========================================================
  // FILTERED LOANS
  // ==========================================================

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      // ----------------------------------------------
      // STATUS
      // ----------------------------------------------

      if (appliedFilterStatus === "RUNNING" && !isRunningLoan(loan)) {
        return false;
      }

      if (appliedFilterStatus === "CLOSED" && !isClosedLoan(loan)) {
        return false;
      }

      // ----------------------------------------------
      // DATE
      // ----------------------------------------------

      const loanDate = getDateFilterKey(loan.loanDate);

      if (
        appliedFilterFromDate &&
        (!loanDate || loanDate < appliedFilterFromDate)
      ) {
        return false;
      }

      if (
        appliedFilterToDate &&
        (!loanDate || loanDate > appliedFilterToDate)
      ) {
        return false;
      }

      return true;
    });
  }, [loans, appliedFilterStatus, appliedFilterFromDate, appliedFilterToDate]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLoans.length / LOANS_PER_PAGE),
  );

  const pageStartIndex = (currentPage - 1) * LOANS_PER_PAGE;

  const paginatedLoans = filteredLoans.slice(
    pageStartIndex,
    pageStartIndex + LOANS_PER_PAGE,
  );

  const showingFrom = filteredLoans.length === 0 ? 0 : pageStartIndex + 1;

  const showingTo = Math.min(
    pageStartIndex + LOANS_PER_PAGE,
    filteredLoans.length,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginationItems = useMemo<
    Array<number | "ellipsis-start" | "ellipsis-end">
  >(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis-end", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "ellipsis-start",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "ellipsis-start",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis-end",
      totalPages,
    ];
  }, [currentPage, totalPages]);

  // ==========================================================
  // REJECTED LOAN APPLICATIONS
  // ==========================================================

  const handleOpenRejectedApplications =
    useCallback(
      (): void => {
        window.dispatchEvent(
          new CustomEvent(
            "FINORA_V2_OPEN_REJECTED_LOAN_APPLICATIONS",
          ),
        );
      },
      [],
    );

  // ==========================================================
  // CREATE GOLD LOAN
  //
  // IMPORTANT:
  //
  // Gold Loan has its own Step 1.
  //
  // Existing normal Loan Studio event is intentionally NOT
  // reused here.
  //
  // LoansPage.tsx will handle this dedicated event separately.
  // ==========================================================

  const handleCreateGoldLoan = useCallback((): void => {
    window.dispatchEvent(new CustomEvent("FINORA_V2_OPEN_GOLD_LOAN_STUDIO"));
  }, []);

  // ==========================================================
  // CREATE STANDARD LOAN
  //
  // Existing production workflow remains untouched.
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
  // CLOSE LOAN DETAILS
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
      <main style={responsivePageStyle}>
        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <section style={responsiveTopBarStyle}>
          <div style={headingGroupStyle}>
            <h1 style={themedPageTitleStyle}>Loans Office</h1>

            <p style={themedPageSubtitleStyle}>
              Manage, review and create customer loans.
            </p>
          </div>

          <div style={responsiveHeaderActionsStyle}>
            <button
              type="button"
              onClick={
                handleOpenRejectedApplications
              }
              style={
                responsiveRejectedButtonStyle
              }
            >
              <ArchiveX
                size={16}
                strokeWidth={1.9}
              />

              Rejected Applications
            </button>

            <button
              type="button"
              onClick={handleCreateGoldLoan}
              style={responsiveGoldCreateButtonStyle}
            >
              <Gem size={16} strokeWidth={1.9} />
              Create Gold Loan
            </button>

            <button
              type="button"
              onClick={handleCreateLoan}
              style={responsiveCreateButtonStyle}
            >
              <Plus size={16} strokeWidth={1.9} />
              Create New Loan
            </button>
          </div>
        </section>

        {/* ==================================================
            STATISTICS
        ================================================== */}

        <section style={responsiveStatisticsGridStyle}>
          <article style={responsiveStatisticCardStyle}>
            <span style={themedStatisticLabelStyle}>Total Loans</span>

            <strong style={themedStatisticValueStyle}>
              {statistics.total}
            </strong>
          </article>

          <article style={responsiveStatisticCardStyle}>
            <span style={themedStatisticLabelStyle}>Active / Running</span>

            <strong style={themedStatisticValueStyle}>
              {statistics.active}
            </strong>
          </article>

          <article style={responsiveStatisticCardStyle}>
            <span style={themedStatisticLabelStyle}>Closed</span>

            <strong style={themedStatisticValueStyle}>
              {statistics.closed}
            </strong>
          </article>

          <article style={responsiveStatisticCardStyle}>
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
          <header style={responsivePortfolioHeaderStyle}>
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

            <div style={responsivePortfolioActionsStyle}>
              {/* ==========================================
                  FILTERS
              ========================================== */}

              <div style={filtersStyle}>
                <div style={responsiveFiltersGridStyle}>
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
                  RESPONSIVE PORTFOLIO
                  
                  LAPTOP / DESKTOP:
                    Existing table.

                  MOBILE:
                    LoanPortfolioResponsiveRecord.
                    One field per row.

                  TABLET:
                    LoanPortfolioResponsiveRecord.
                    Two-column field layout.
              ========================================== */}

              {responsiveTokens.layout.tableVisible ? (
                <>
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

                      <div style={themedTableHeaderCenterStyle} />
                    </div>

                    {/* TABLE BODY */}

                    <div style={tableBodyStyle} role="rowgroup">
                      {paginatedLoans.map((loan, index) => (
                        <div
                          key={loan.id}
                          style={themedTableRowStyle}
                          role="row"
                        >
                          <div style={themedSerialCellStyle}>
                            {pageStartIndex + index + 1}
                          </div>

                          <div style={loanIdentityStyle}>
                            <div style={themedLoanNumberStyle}>
                              {loan.loanNumber || loan.id || "--"}
                            </div>

                            <div style={themedLoanTitleStyle}>
                              {formatLoanTitle(loan)}
                            </div>
                          </div>

                          <div style={themedTableCellStyle}>
                            <div style={themedCustomerNameStyle}>
                              {loan.customerName || "--"}
                            </div>

                            <div style={themedCustomerPhoneStyle}>
                              {loan.phoneNumber || "--"}
                            </div>
                          </div>

                          <div style={themedLoanTypeStyle}>
                            {formatLoanType(loan)}
                          </div>

                          <div style={themedTableCellRightStyle}>
                            <span style={themedAmountStyle}>
                              {formatCurrency(loan.amount)}
                            </span>
                          </div>

                          <div style={themedTableCellRightStyle}>
                            <span style={themedAmountStyle}>
                              {formatCurrency(loan.outstanding)}
                            </span>
                          </div>

                          <div style={themedTableCellCenterStyle}>
                            {formatDate(loan.loanDate)}
                          </div>

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

                  <div style={themedPaginationBarStyle}>
                    <span style={themedPaginationSummaryStyle}>
                      Showing {showingFrom} to {showingTo} of{" "}
                      {filteredLoans.length} loans
                    </span>

                    <div style={paginationControlsStyle}>
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => {
                          setCurrentPage((page) => Math.max(1, page - 1));
                        }}
                        style={{
                          ...themedPaginationNavButtonStyle,
                          opacity: currentPage === 1 ? 0.45 : 1,
                          cursor: currentPage === 1 ? "default" : "pointer",
                        }}
                      >
                        ← Previous
                      </button>

                      {paginationItems.map((item) => {
                        if (
                          item === "ellipsis-start" ||
                          item === "ellipsis-end"
                        ) {
                          return (
                            <span
                              key={item}
                              style={themedPaginationEllipsisStyle}
                            >
                              …
                            </span>
                          );
                        }

                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              setCurrentPage(item);
                            }}
                            style={getThemedPaginationPageButtonStyle(
                              item === currentPage,
                            )}
                          >
                            {item}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => {
                          setCurrentPage((page) =>
                            Math.min(totalPages, page + 1),
                          );
                        }}
                        style={{
                          ...themedPaginationNavButtonStyle,
                          opacity: currentPage === totalPages ? 0.45 : 1,
                          cursor:
                            currentPage === totalPages ? "default" : "pointer",
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    gap: `${responsiveTokens.layout.mobileRecordGap}px`,
                  }}
                >
                  {paginatedLoans.map((loan, index) => (
                    <LoanPortfolioResponsiveRecord
                      key={loan.id}
                      loan={loan}
                      index={pageStartIndex + index}
                      tokens={responsiveTokens}
                      formatLoanTitle={formatLoanTitle}
                      formatLoanType={formatLoanType}
                      formatCurrency={(value) => formatCurrency(value ?? 0)}
                      formatDate={formatDate}
                      formatStatus={formatStatus}
                      onView={handleViewLoan}
                    />
                  ))}

                  <div style={themedPaginationBarStyle}>
                    <span style={themedPaginationSummaryStyle}>
                      Showing {showingFrom} to {showingTo} of{" "}
                      {filteredLoans.length} loans
                    </span>

                    <div style={paginationControlsStyle}>
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => {
                          setCurrentPage((page) => Math.max(1, page - 1));
                        }}
                        style={{
                          ...themedPaginationNavButtonStyle,
                          opacity: currentPage === 1 ? 0.45 : 1,
                          cursor: currentPage === 1 ? "default" : "pointer",
                        }}
                      >
                        ← Previous
                      </button>

                      {paginationItems.map((item) => {
                        if (
                          item === "ellipsis-start" ||
                          item === "ellipsis-end"
                        ) {
                          return (
                            <span
                              key={item}
                              style={themedPaginationEllipsisStyle}
                            >
                              …
                            </span>
                          );
                        }

                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              setCurrentPage(item);
                            }}
                            style={getThemedPaginationPageButtonStyle(
                              item === currentPage,
                            )}
                          >
                            {item}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => {
                          setCurrentPage((page) =>
                            Math.min(totalPages, page + 1),
                          );
                        }}
                        style={{
                          ...themedPaginationNavButtonStyle,
                          opacity: currentPage === totalPages ? 0.45 : 1,
                          cursor:
                            currentPage === totalPages ? "default" : "pointer",
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
