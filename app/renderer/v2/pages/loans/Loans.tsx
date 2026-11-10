﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import {
  Eye as FinoraReceiptEye,
  Download as FinoraReceiptDownload,
  Share2 as FinoraReceiptShare,
  Copy as FinoraReceiptCopy,
  ArrowLeft as FinoraReceiptArrowLeft,
} from "lucide-react";
// FINORA_R171_ACTION_ICONS
﻿﻿﻿﻿﻿// FINORA ENTERPRISE OS™
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
import { getBusinessContext } from "../../services/business/businessContextService";
import { loadFinoraServerSettingsIdentity } from "../../services/business/finoraServerSettingsIdentity";

import { storageManager } from "../../storage/storageManager";

import { StorageMode } from "../../storage/storage.types";

import StudioLayout from "../../components/common/layout/StudioLayout";

import { FinoraCalendar } from "../../components/common/calendar";

import {
  finoraWarning,
} from "../../components/common/dialog/finoraDialog.service";

import {
  startFinoraProcessing,
  stopFinoraProcessing,
} from "../../components/common/feedback/finoraProcessing.service";
// FINORA_AP04_R010_LOAN_ANDROID_PROCESSING
import { showFinoraDialog } from "../../components/common/dialog/finoraDialog.service";
// FINORA_R189_B4_WHATSAPP_CHOICE
import { finoraSuccess } from "../../components/common/dialog/finoraDialog.service";
// FINORA_R189_B3_PREMIUM_DIALOG
import { MessageCircle as FinoraReceiptWhatsAppIcon } from "lucide-react";
import ViewLoanDetails from "../../components/loans/details/ViewLoanDetails";

import { useTheme } from "../../themes/provider";

import { formatRupee } from "../../utils/currency/formatCurrency";

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

// PAISARULE B05: UI display only.
// Keep original loanNumber for lookup, View, receipts and storage.
function displayPaisarulePortfolioLoanNumber(
  loanNumber: string,
): string {
  return loanNumber.replace(
    /^FIN-LOAN-(\d{6})-(\d{3})$/i,
    "PAISA-LOAN-$1-$2",
  );
}


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
  return formatRupee(
    safeNumber(value),
  );
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

interface LoansProps {
  loanCreateDisabled?: boolean;
  loanCreateTitle?: string;
}

export default function Loans({
  loanCreateDisabled,
  loanCreateTitle,
}: LoansProps) {
  // ==========================================================
  // FINORA THEME ENGINE
  // ==========================================================

  const { theme } = useTheme();

  // ==========================================================
  // LOANS OFFICE RESPONSIVE ENGINE
  // ==========================================================

  const { tokens: responsiveTokens } = useLoansOfficeResponsive();

  const themeColors = useMemo(() => createThemeVisuals(theme), [theme]);
  // FINORA_R200_B_WHITE_BUTTON_TEXT
  // Only the three vivid themes get white button labels.
  // Imperial Gold and Obsidian retain their original styles.
  const finoraVividLoanButtons =
    theme.id === "royal-navy" ||
    theme.id === "amethyst" ||
    theme.id === "emerald";


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

  const themedClosedTableRowStyle: CSSProperties = {
    ...themedTableRowStyle,
    borderBottom: `1px solid ${themeColors.danger}`,
    background: themeColors.dangerSoft,
    boxShadow: `inset 3px 0 0 ${themeColors.danger}`,
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
    ...(responsiveTokens.viewport === "mobile"
      ? {
          gridTemplateColumns: "minmax(0, 1fr)",
          width: "100%",
          rowGap: "8px",
        }
      : {}),
  };

  const responsivePortfolioHeaderStyle: CSSProperties = {
    ...themedPortfolioHeaderStyle,
    ...createLoansOfficePortfolioHeaderStyle(responsiveTokens),
    paddingTop:
      responsiveTokens.viewport === "mobile"
        ? "10px"
        : responsiveTokens.viewport === "tablet"
          ? "8px"
          : undefined,
    paddingBottom:
      responsiveTokens.viewport === "tablet"
        ? "8px"
        : undefined,
  };

  const responsivePortfolioActionsStyle: CSSProperties = {
    ...portfolioActionsStyle,
    ...createLoansOfficePortfolioActionsStyle(responsiveTokens),
    width:
      responsiveTokens.viewport === "mobile" ||
      responsiveTokens.viewport === "tablet"
        ? "100%"
        : undefined,
    ...(responsiveTokens.viewport === "mobile"
      ? {
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: "8px",
        }
      : {}),
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
  // FINORA_R166_H_LOAN_SHARE
  const [loanShareOpen, setLoanShareOpen] = useState(() =>
    window.sessionStorage.getItem("finora:receipt-page:loans") === "1"
  ); // FINORA_R190_C_LOAN_NAV
  const [loanShareSearch, setLoanShareSearch] = useState("");
  // FINORA_R203_C2_R2
  const [loanShareFromDate, setLoanShareFromDate] = useState("");
  const [loanShareToDate, setLoanShareToDate] = useState("");
  const [loanSharePreview, setLoanSharePreview] = useState("");
  const [loanShareBusy, setLoanShareBusy] = useState(false);

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

  const [
    paginationWindowStart,
    setPaginationWindowStart,
  ] = useState(1);

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
  // wrong/default runtime contex
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
              `Unable to restore PAISARULE ${storageMode} storage.`,
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

    const principal = loans.reduce(
      (total, loan) => total + safeNumber(loan.amount),
      0,
    );

    return {
      total: loans.length,

      active: activeLoans.length,

      closed: closedLoans.length,

      outstanding,

      principal,
    };
  }, [loans]);

  // ==========================================================
  // APPLY FILTERS
  // ==========================================================

  const handleApplyFilters = async (): Promise<void> => {
    if (filterFromDate && filterToDate && filterFromDate > filterToDate) {
      await finoraWarning("From Date cannot be later than To Date.");

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

    const lastWindowStart =
      Math.floor(
        (totalPages - 1) / 5,
      ) * 5 + 1;

    setPaginationWindowStart(
      (start) =>
        Math.min(
          start,
          lastWindowStart,
        ),
    );

  }, [
    currentPage,
    totalPages,
  ]);

  const paginationWindowEnd =
    Math.min(
      totalPages,
      paginationWindowStart + 4,
    );

  const hasPreviousPaginationWindow =
    paginationWindowStart > 1;

  const hasNextPaginationWindow =
    paginationWindowEnd < totalPages;

  const paginationItems = useMemo<
    Array<number | "ellipsis-start" | "ellipsis-end">
  >(() => {

    const visiblePageCount =
      paginationWindowEnd -
      paginationWindowStart +
      1;

    return Array.from(
      {
        length:
          visiblePageCount,
      },
      (_, index) =>
        paginationWindowStart +
        index,
    );

  }, [
    paginationWindowEnd,
    paginationWindowStart,
  ]);


  function showPreviousPaginationWindow(): void {

    setPaginationWindowStart(
      (start) =>
        Math.max(
          1,
          start - 5,
        ),
    );

  }


  function showNextPaginationWindow(): void {

    const lastWindowStart =
      Math.floor(
        (totalPages - 1) / 5,
      ) * 5 + 1;

    setPaginationWindowStart(
      (start) =>
        Math.min(
          lastWindowStart,
          start + 5,
        ),
    );

  }

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

    if (loanShareOpen) {
    // FINORA_R180_ORIGINAL_SURFACE
    const receiptOriginalCardBackground =
      typeof responsiveStatisticCardStyle.background === "string"
        ? responsiveStatisticCardStyle.background
        : themeColors.surface;

    const receiptOriginalCardBorder =
      typeof responsiveStatisticCardStyle.border === "string"
        ? responsiveStatisticCardStyle.border
        : `1px solid ${themeColors.border}`;

    // FINORA_R173_R4_THEME
    const receiptAccentCandidate =
      responsiveCreateButtonStyle.backgroundColor ??
      responsiveCreateButtonStyle.background;

    const receiptAccent =
      typeof receiptAccentCandidate === "string"
        ? receiptAccentCandidate
        : "currentColor";
    // FINORA_R175_TEXT_CONTRAST
    const receiptTextColor =
      typeof themedPageTitleStyle.color === "string"
        ? themedPageTitleStyle.color
        : "inherit";

    const records = (
      filteredLoans as unknown as Array<Record<string, unknown>>
    ).filter((loan) =>
      [
        loan.id,
        loan.loanNumber,
        loan.customerId,
        loan.customerName,
      ]
        .map((item) => String(item ?? ""))
        .join(" ")
        .toLowerCase()
        .includes(loanShareSearch.trim().toLowerCase()),
    ).filter((loan) => {
      // R205-D3: Receipt date filters work in every theme.

      if (!loanShareFromDate && !loanShareToDate) {
        return true;
      }

      // FINORA_R203_C2_R2_DISBURSEMENT_ONLY
      const fields = loan as unknown as Record<string, unknown>;

      const dateFields = [
        "disbursementDate",
        "disbursedAt",
        "loanDisbursementDate",
        "loanDate",
        "dateOfDisbursement",
        "dateOfLoan",
      ];

      let dateKey = "";

      for (const field of dateFields) {
        const value = fields[field];

        if (typeof value !== "string" || !value.trim()) {
          continue;
        }

        const candidate = getDateFilterKey(value.trim());

        if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
          dateKey = candidate;
          break;
        }
      }

      if (!dateKey) return false;

      if (
        loanShareFromDate &&
        dateKey < loanShareFromDate
      ) {
        return false;
      }

      if (
        loanShareToDate &&
        dateKey > loanShareToDate
      ) {
        return false;
      }

      return true;
    });

    // FINORA_R167_DISBURSEMENT_DATE
    // Never substitute record creation time for disbursement.
    const loanDisbursementDate = (
      loan: Record<string, unknown>,
    ): string => {
      const keys = [
        "disbursementDate",
        "disbursedAt",
        "loanDisbursementDate",
        "loanDate",
        "dateOfDisbursement",
        "dateOfLoan",
      ];

      for (const key of keys) {
        const candidate = loan[key];

        if (typeof candidate !== "string") {
          continue;
        }

        const raw = candidate.trim();

        if (!raw) {
          continue;
        }

        const iso = raw.match(
          /^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/
        );

        if (iso) {
          const year = Number(iso[1]);
          const month = Number(iso[2]);
          const day = Number(iso[3]);

          const check = new Date(
            Date.UTC(year, month - 1, day),
          );

          if (
            check.getUTCFullYear() === year &&
            check.getUTCMonth() === month - 1 &&
            check.getUTCDate() === day
          ) {
            return [
              iso[3],
              iso[2],
              iso[1],
            ].join("-");
          }
        }

        const indian = raw.match(
          /^(\d{2})-(\d{2})-(\d{4})$/
        );

        if (indian) {
          const day = Number(indian[1]);
          const month = Number(indian[2]);
          const year = Number(indian[3]);

          const check = new Date(
            Date.UTC(year, month - 1, day),
          );

          if (
            check.getUTCFullYear() === year &&
            check.getUTCMonth() === month - 1 &&
            check.getUTCDate() === day
          ) {
            return raw;
          }
        }
      }

      return "Not recorded";
    };
    // FINORA_R168_REPAYMENT_DAY
    // Explicit repayment-day setting takes precedence.
    // If absent, inspect the saved EMI schedule.
    const monthlyRepaymentDate = (
      loan: Record<string, unknown>,
    ): string => {
      const ordinal = (day: number): string => {
        const suffix =
          day % 100 >= 11 && day % 100 <= 13
            ? "th"
            : day % 10 === 1
              ? "st"
              : day % 10 === 2
                ? "nd"
                : day % 10 === 3
                  ? "rd"
                  : "th";

        return `${day}${suffix}`;
      };

      const explicitFields = [
        "repaymentDay",
        "repaymentDayOfMonth",
        "emiDueDay",
        "emiDay",
        "monthlyRepaymentDay",
        "installmentDueDay",
      ];

      for (const field of explicitFields) {
        const value = loan[field];

        if (value === null || value === undefined || value === "") {
          continue;
        }

        const day = Number(value);

        if (
          Number.isSafeInteger(day) &&
          day >= 1 &&
          day <= 31
        ) {
          return `Every Month on ${ordinal(day)}`;
        }
      }

      const rawSchedule = loan.schedule;

      if (!Array.isArray(rawSchedule) || rawSchedule.length === 0) {
        return "Not recorded";
      }

      const scheduleDays: number[] = [];
      const fullDates: string[] = [];

      for (const installment of rawSchedule) {
        if (
          installment === null ||
          typeof installment !== "object" ||
          Array.isArray(installment)
        ) {
          return "See EMI Schedule";
        }

        const row = installment as Record<string, unknown>;
        const dueDate =
          typeof row.dueDate === "string"
            ? row.dueDate.trim()
            : "";

        const match = dueDate.match(
          /^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/,
        );

        if (!match) {
          return "See EMI Schedule";
        }

        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);

        const valid = new Date(
          Date.UTC(year, month - 1, day),
        );

        if (
          valid.getUTCFullYear() !== year ||
          valid.getUTCMonth() !== month - 1 ||
          valid.getUTCDate() !== day
        ) {
          return "See EMI Schedule";
        }

        scheduleDays.push(day);
        fullDates.push(`${match[3]}-${match[2]}-${match[1]}`);
      }

      if (scheduleDays.length === 0) {
        return "Not recorded";
      }

      const uniqueDays = new Set(scheduleDays);

      if (uniqueDays.size === 1) {
        return `Every Month on ${ordinal(scheduleDays[0])}`;
      }

      // Example: monthly 31st adjusted to February 28.
      // Do not present a changing schedule as a fixed calendar day.
      return `First installment due ${fullDates[0]}`;
    };
    // FINORA_R169_LOAN_PNG
    // The original saved loan is the document source.
    // Do not substitute current outstanding for principal.
    const loanReceiptMoney = (
      loan: Record<string, unknown>,
      fields: string[],
    ): string => {
      const sources: Record<string, unknown>[] = [loan];

      for (const field of [
        "loanDetails",
        "loanTerms",
        "financialDetails",
        "terms",
      ]) {
        const nested = loan[field];

        if (
          nested &&
          typeof nested === "object" &&
          !Array.isArray(nested)
        ) {
          sources.push(nested as Record<string, unknown>);
        }
      }

      for (const record of sources) {
        for (const field of fields) {
          const raw = record[field];

          if (raw === null || raw === undefined || raw === "") {
            continue;
          }

          const number = Number(raw);

          if (Number.isFinite(number) && number >= 0) {
            return "₹" + number.toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            });
          }
        }
      }

      return "Not recorded";
    };

    const loanReceiptText = (
      loan: Record<string, unknown>,
      fields: string[],
    ): string => {
      const sources: Record<string, unknown>[] = [loan];

      for (const field of [
        "loanDetails",
        "loanTerms",
        "financialDetails",
        "terms",
      ]) {
        const nested = loan[field];

        if (
          nested &&
          typeof nested === "object" &&
          !Array.isArray(nested)
        ) {
          sources.push(nested as Record<string, unknown>);
        }
      }

      for (const record of sources) {
        for (const field of fields) {
          const raw = record[field];

          if (typeof raw === "string" && raw.trim()) {
            return raw.trim();
          }

          if (
            typeof raw === "number" &&
            Number.isFinite(raw)
          ) {
            return String(raw);
          }
        }
      }

      return "Not recorded";
    };

    // FINORA_R181_PRINCIPAL_SOURCE
    // Loans Office uses saved Loan.amount for original principal.
    const loanReceiptPrincipal = (
      loan: Record<string, unknown>,
    ): string =>
      loanReceiptMoney(loan, [
        "amount",
        "principalAmount",
        "principal",
        "loanAmount",
        "sanctionedAmount",
        "disbursedAmount",
        "originalPrincipal",
      ]);

    // FINORA_R182_R2_FONTS
    // FINORA_R183_B_SPACING
    // FINORA_R184_FINANCIAL_WIRING
    // Read original persisted loan values, not current outstanding.
    const receiptObject = (
      value: unknown,
    ): Record<string, unknown> | null =>
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;

    const receiptSources = (
      loan: Record<string, unknown>,
    ): Record<string, unknown>[] => {
      const sources = [loan];

      for (const field of [
        "loanDetails",
        "financialDetails",
        "loanData",
        "terms",
        "loanTerms",
        "repaymentDetails",
      ]) {
        const nested = receiptObject(loan[field]);
        if (nested) sources.push(nested);
      }

      return sources;
    };

    const receiptNumber = (
      loan: Record<string, unknown>,
      keys: string[],
    ): number | null => {
      for (const source of receiptSources(loan)) {
        for (const key of keys) {
          const raw = source[key];

          if (
            raw === null ||
            raw === undefined ||
            raw === "" ||
            typeof raw === "boolean"
          ) {
            continue;
          }

          const parsed =
            typeof raw === "string"
              ? Number(raw.replace(/[,₹\s]/g, ""))
              : Number(raw);

          if (
            Number.isFinite(parsed) &&
            parsed >= 0
          ) {
            return parsed;
          }
        }
      }

      return null;
    };

    const receiptSchedule = (
      loan: Record<string, unknown>,
    ): Record<string, unknown>[] => {
      for (const source of receiptSources(loan)) {
        for (const key of [
          "schedule",
          "emiSchedule",
          "installments",
        ]) {
          const raw = source[key];

          if (!Array.isArray(raw) || raw.length === 0) {
            continue;
          }

          const rows = raw
            .map(receiptObject)
            .filter(
              (row): row is Record<string, unknown> =>
                row !== null,
            );

          if (rows.length === raw.length) {
            return rows;
          }
        }
      }

      return [];
    };

    const receiptMoneyValue = (amount: number): string =>
      `₹${Math.round(amount).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      })}`;

    const receiptPrincipalValue = (
      loan: Record<string, unknown>,
    ): number | null =>
      receiptNumber(loan, [
        "amount",
        "originalPrincipal",
        "principalAmount",
        "principal",
        "loanAmount",
        "sanctionedAmount",
        "disbursedAmount",
      ]);

    const receiptScheduleAmounts = (
      loan: Record<string, unknown>,
    ): number[] => {
      const rows = receiptSchedule(loan);

      if (!rows.length) return [];

      const amounts = rows.map((row) => {
        for (const field of [
          "installmentAmount",
          "emiAmount",
          "amountDue",
        ]) {
          const raw = row[field];

          if (
            raw === undefined ||
            raw === null ||
            raw === ""
          ) {
            continue;
          }

          const amount = Number(raw);

          if (Number.isFinite(amount) && amount > 0) {
            return amount;
          }
        }

        return null;
      });

      if (amounts.some((amount) => amount === null)) {
        return [];
      }

      return amounts as number[];
    };

    const receiptTotalPayableValue = (
      loan: Record<string, unknown>,
    ): number | null => {
      const explicit = receiptNumber(loan, [
        "totalPayable",
        "totalPayableAmount",
        "totalRepaymentAmount",
        "totalAmount",
      ]);

      if (explicit !== null && explicit > 0) {
        return explicit;
      }

      const amounts = receiptScheduleAmounts(loan);

      if (!amounts.length) return null;

      return amounts.reduce((sum, amount) => sum + amount, 0);
    };

    const receiptInterestRate = (
      loan: Record<string, unknown>,
    ): string => {
      const rate = receiptNumber(loan, [
        "interest",
        "interestRate",
        "monthlyInterestRate",
        "rateOfInterest",
      ]);

      if (rate === null) return "Not recorded";

      const rateType = String(
        loan.interestPeriod ??
        loan.interestFrequency ??
        "monthly",
      ).toLowerCase();

      const formatted = Number(rate.toFixed(2));

      return rateType.includes("annual") ||
        rateType.includes("year")
          ? `${formatted}% per year`
          : `${formatted}% per month`;
    };

    const receiptTenure = (
      loan: Record<string, unknown>,
    ): string => {
      const explicit = receiptNumber(loan, [
        "tenureMonths",
        "durationMonths",
        "loanTenure",
        "tenure",
        "duration",
      ]);

      if (explicit !== null && explicit > 0) {
        return `${explicit} months`;
      }

      const schedule = receiptSchedule(loan);

      return schedule.length
        ? `${schedule.length} installments`
        : "Not recorded";
    };

    const receiptTotalInterest = (
      loan: Record<string, unknown>,
    ): string => {
      const explicit = receiptNumber(loan, [
        "totalInterest",
        "totalInterestAmount",
        "interestTotal",
      ]);

      if (explicit !== null) {
        return receiptMoneyValue(explicit);
      }

      const principal = receiptPrincipalValue(loan);
      const total = receiptTotalPayableValue(loan);

      if (principal === null || total === null || total < principal) {
        return "Not recorded";
      }

      return receiptMoneyValue(total - principal);
    };

    const receiptTotalPayable = (
      loan: Record<string, unknown>,
    ): string => {
      const total = receiptTotalPayableValue(loan);

      return total === null
        ? "Not recorded"
        : receiptMoneyValue(total);
    };

    const receiptEmiAmount = (
      loan: Record<string, unknown>,
    ): string => {
      const explicit = receiptNumber(loan, [
        "emiAmount",
        "monthlyEmi",
        "monthlyEMI",
        "installmentAmount",
      ]);

      if (explicit !== null && explicit > 0) {
        return receiptMoneyValue(explicit);
      }

      const amounts = receiptScheduleAmounts(loan);

      if (!amounts.length) return "Not recorded";

      const first = amounts[0];

      if (
        amounts.every(
          (amount) => Math.abs(amount - first) < 0.01,
        )
      ) {
        return receiptMoneyValue(first);
      }

      return "Varies by installment";
    };
    // FINORA_R186_NATIVE_PHOTO_SHARE
    // Android: share ONE actual PNG image, not a documen
    // or text-only WhatsApp link.

    const finoraAndroidNativeShareAvailable = (): boolean => {
      const bridge = (
        window as unknown as {
          Capacitor?: {
            isNativePlatform?: () => boolean;
            getPlatform?: () => string;
          };
        }
      ).Capacitor;

      return Boolean(
        bridge?.isNativePlatform?.() &&
        bridge?.getPlatform?.() === "android",
      );
    };

    const finoraNativePhotoShare = async (
      loan: Record<string, unknown>,
    ): Promise<void> => {
      const nativeProcessingId = startFinoraProcessing(
        "Preparing Loan Receipt Photo to Share...",
      );

      try {
        const bridge = (
          window as unknown as {
            Capacitor?: {
              Plugins?: {
                Filesystem?: {
                  writeFile: (options: {
                    path: string;
                    data: string;
                    directory: string;
                    recursive: boolean;
                  }) => Promise<{ uri: string }>;
                };
                Share?: {
                  share: (options: {
                    title: string;
                    files: string[];
                    dialogTitle: string;
                  }) => Promise<unknown>;
                };
              };
            };
          }
        ).Capacitor;

        const filesystem = bridge?.Plugins?.Filesystem;
        const share = bridge?.Plugins?.Share;

        if (!filesystem || !share) {
          throw new Error(
            "Native Filesystem / Share plugin is unavailable in this APK.",
          );
        }

        const receipt = await createLoanReceiptPng(loan);

        if (!receipt.dataUrl.startsWith("data:image/png;base64,")) {
          throw new Error("Receipt is not a valid PNG data URL.");
        }

        const customer = String(
          loan.customerName ?? "Customer",
        )
          .trim()
          .replace(/[^a-zA-Z0-9_-]+/g, "_")
          .replace(/^_+|_+$/g, "")
          .slice(0, 48) || "Customer";

        const number = String(
          loan.loanNumber ?? loan.id ?? "Loan",
        )
          .trim()
          .replace(/[^a-zA-Z0-9_-]+/g, "_")
          .slice(0, 64);

        const filename =
          `${customer}_Loan_Receipt_${number}.png`;

        // CACHE is the Capacitor Directory.Cache value.
        // A PNG extension allows Android to identify image/png.
                // FINORA_C82_B7_LOAN_CACHE_NOMEDIA
        // Keep temporary share images out of Gallery albums.
        await filesystem.writeFile({
          path: "finora_receipt_share/.nomedia",
          data: "",
          directory: "CACHE",
          recursive: true,
        });
const saved = await filesystem.writeFile({
          path: `finora_receipt_share/${filename}`,
          data: receipt.dataUrl.split(",")[1],
          directory: "CACHE",
          recursive: true,
        });

        if (!saved.uri) {
          throw new Error("Receipt cache URI was not returned.");
        }

        // One image only: Android ACTION_SEND / image/png.
        // Customer selects WhatsApp and recipient manually.
        stopFinoraProcessing(nativeProcessingId);

        await share.share({
          title: "PAISARULE Loan Receipt",
          files: [saved.uri],
          dialogTitle: "Share receipt photo",
        });
      } catch (error) {
        // FINORA_AP04_R024_ANDROID_SHARE_CANCEL
        // Android chooser dismissal is not a failed transfer.
        const detail =
          error instanceof Error ? error.message : String(error);

        const errorName =
          error instanceof Error ? error.name : "";

        const cancelled =
          errorName === "AbortError" ||
          errorName === "Canceled" ||
          errorName === "Cancelled" ||
          /^(share\s+)?cancel(?:ed|led)$/i.test(detail.trim()) ||
          /^user\s+cancel(?:ed|led)$/i.test(detail.trim());

        if (!cancelled) {
          // Do not claim the photo was sent.
          window.alert(`Receipt photo sharing failed: ${detail}`);
        }
      } finally {
        stopFinoraProcessing(nativeProcessingId);
      }
    };
    // FINORA_R187_B_WINDOWS_PHOTO
    // Windows: copy the actual PNG image to the clipboard.
    // WhatsApp Web requires the user to paste and send it.

    // FINORA_R187_C_FOCUS_FIX
    // Copy first while FINORA still has focus.
    // Open WhatsApp Web ONLY after successful clipboard write.
    // FINORA_R188_B_RENDERER
    // Native Electron clipboard does not require document focus.
    // FINORA_R189_B3_PREMIUM_DIALOG
    // No duplicate WhatsApp Web tabs.
    // Copy image with Electron native clipboard.
    const finoraWindowsWhatsAppPhotoShare = async (
      loan: Record<string, unknown>,
    ): Promise<void> => {
      try {
        const result = await createLoanReceiptPng(loan);

        if (
          result.blob.type !== "image/png" ||
          !result.dataUrl.startsWith("data:image/png;base64,")
        ) {
          throw new Error("Receipt is not a valid PNG image.");
        }

        const bridge = (
          window as unknown as {
            finoraReceiptClipboard?: {
              copyPng: (
                dataUrl: string,
              ) => Promise<{
                ok: boolean;
                error?: string;
              }>;
            };
          }
        ).finoraReceiptClipboard;

        if (!bridge?.copyPng) {
          throw new Error(
            "Electron native clipboard unavailable. Restart PAISARULE.",
          );
        }

        const copied = await bridge.copyPng(result.dataUrl);

        if (!copied.ok) {
          throw new Error(
            copied.error ?? "Receipt photo clipboard failed.",
          );
        }

        // FINORA_R189_B4_WHATSAPP_CHOICE
        const openWhatsApp = await showFinoraDialog({
        // FINORA_R193_R1_COMPACT_SUCCESS
        kind: "success",
        heading: "Receipt Photo Copied",
        message: "Open WhatsApp and paste the photo using Ctrl+V.",
        confirmLabel: "Open WhatsApp",
        cancelLabel: "Close", // FINORA_R193_R4_CLOSE
        showCancel: true,
      });

        if (openWhatsApp) {
          window.open(
            "https://web.whatsapp.com/",
            "_blank",
            "noopener,noreferrer",
          );
        }
      } catch (error) {
        const detail =
          error instanceof Error
            ? error.message
            : String(error);

        await finoraWarning(
          "Receipt photo could not be copied.\n\n" +
          detail +
          "\n\nUse Download PNG to attach the image as a Photo.",
        );
      }
    };

  // PAISARULE B06-R3: Receipt presentation only.
  // Never alter stored Customer IDs or Loan Numbers.
  function paisaruleLoanReceiptDisplayId(
    value: string,
  ): string {
    return value
      .replace(
        /^FIN-CUS-(\d{6})$/i,
        "PAISA-CUS-$1",
      )
      .replace(
        /^FIN-LOAN-(\d{6})-(\d{3})$/i,
        "PAISA-LOAN-$1-$2",
      );
  }

const createLoanReceiptPng = async (
      loan: Record<string, unknown>,
    ): Promise<{
      blob: Blob;
      dataUrl: string;
      filename: string;
    }> => {
      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 3300; // PAISARULE_C125_R109_FINANCIAL_RECEIPT

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Receipt canvas unavailable");
      }

      // FINORA_AP04_R021_2K_PNG
      ctx.scale(2, 2);

      const draw = (
        value: string,
        x: number,
        y: number,
        maxWidth: number,
        align: CanvasTextAlign = "left",
      ) => {
        ctx.textAlign = align;
        ctx.fillText(value, x, y, maxWidth);
      };

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, 960, 1650);

      ctx.fillStyle = "#11243D";
      ctx.fillRect(0, 0, 960, 170);

      ctx.fillStyle = "#E9BF69";
      ctx.font = "650 48px Arial, sans-serif";
      draw("P A I S A R U L E", 480, 80, 900, "center");

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "500 25px Arial, sans-serif";
      draw(
        "LOAN DISBURSEMENT DETAILS",
        480,
        125,
        900,
        "center",
      );

                  // FINORA_C80_B22_C1_RECEIPT_IDENTITY_ROW
      // FINORA_C80_B22_C3_C_R1_SERVER_NAMES
      // FINORA_C80_B22_C3_D1_R1
      // FINORA_C80_B22_C3_D3_SPACING
      // Use authenticated server identity for this loan storage scope.
      const receiptContext = getBusinessContext();

      const loanBusinessScope =
        typeof loan.businessId === "string"
          ? loan.businessId.trim()
          : "";

      const loanBranchScope =
        typeof loan.branchId === "string"
          ? loan.branchId.trim()
          : "";

      const receiptScope =
        receiptContext?.ownerId?.trim() &&
        receiptContext.businessId?.trim() &&
        receiptContext.branchId?.trim()
          ? {
              ownerId: receiptContext.ownerId.trim(),
              businessId: receiptContext.businessId.trim(),
              branchId: receiptContext.branchId.trim(),
            }
          : null;

      const loanScopeMatches = Boolean(
        receiptScope &&
        (!loanBusinessScope ||
          loanBusinessScope === receiptScope.businessId) &&
        (!loanBranchScope ||
          loanBranchScope === receiptScope.branchId),
      );

      let receiptBusinessName = "Not recorded";
      let receiptBranchName = "Not recorded";

      if (receiptScope && loanScopeMatches) {
        const serverIdentity =
          await loadFinoraServerSettingsIdentity(receiptScope);

        if (serverIdentity.success) {
          receiptBusinessName =
            serverIdentity.data.businessName.trim();

          receiptBranchName =
            serverIdentity.data.branchName.trim();
        } else {
          const profile = receiptContext?.businessProfile;

          if (
            profile &&
            profile.ownerId === receiptScope.ownerId &&
            profile.businessId === receiptScope.businessId &&
            profile.branchId === receiptScope.branchId &&
            profile.businessName.trim() &&
            profile.branchName.trim()
          ) {
            receiptBusinessName = profile.businessName.trim();
            receiptBranchName = profile.branchName.trim();
          }
        }
      }
ctx.fillStyle = "#667085";
      ctx.font = "500 23px Inter, ui-sans-serif, system-ui, sans-serif";
      draw("BUSINESS NAME", 55, 198, 400);
      draw("BRANCH NAME", 905, 198, 400, "right");

      ctx.fillStyle = "#11243D";
      ctx.font = "650 29px Inter, ui-sans-serif, system-ui, sans-serif";
      draw(receiptBusinessName, 55, 234, 400);
      draw(receiptBranchName, 905, 234, 400, "right");
ctx.fillStyle = "#667085";
      ctx.font = "500 25px Arial, sans-serif";
      draw(
        "ORIGINAL LOAN PRINCIPAL",
        480,
        265,
        890,
        "center",
      );

      ctx.fillStyle = "#16803D";
      ctx.font = "650 58px Arial, sans-serif";
      draw(
        loanReceiptPrincipal(loan),
        480,
        327,
        880,
        "center",
      );

      // PAISARULE_C125_R109: Loan receipt disclosure only.
      const receiptSafeAmount = (value: unknown): number => {
        const parsed = Number(value ?? 0);
        return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
      };

      const receiptMoney = (value: unknown): string =>
        `₹${Math.round(receiptSafeAmount(value)).toLocaleString("en-IN")}`;

      const receiptProcessingFee = receiptSafeAmount(loan.processingFee);
      const receiptAdvanceDeduction = receiptSafeAmount(loan.advanceDeduction);
      const receiptConfiguredLateFee = receiptSafeAmount(loan.lateFee);

      const receiptNetValue = loan.netDisbursement;
      const receiptHasNet =
        receiptNetValue !== null &&
        receiptNetValue !== undefined &&
        String(receiptNetValue).trim() !== "" &&
        Number.isFinite(Number(receiptNetValue)) &&
        Number(receiptNetValue) >= 0;

      const receiptNetDisbursement = receiptHasNet
        ? receiptSafeAmount(receiptNetValue)
        : Math.max(
            0,
            receiptSafeAmount(loan.amount) -
              receiptProcessingFee -
              receiptAdvanceDeduction,
          );
      const rows: Array<[string, string]> = [
        [
          "Customer",
          loanReceiptText(loan, ["customerName"]),
        ],
        [
          "Customer ID",
          paisaruleLoanReceiptDisplayId(loanReceiptText(loan, ["customerId"])),
        ],
        [
          "Loan Number",
          paisaruleLoanReceiptDisplayId(loanReceiptText(loan, ["loanNumber", "id"])),
        ],
        [
          "Loan Date",
          loanDisbursementDate(loan),
        ],
        [
          "Monthly Repayment",
          monthlyRepaymentDate(loan),
        ],
        [
          "Interest Rate",
          receiptInterestRate(loan),
        ],
        [
          "Loan Tenure",
          receiptTenure(loan),
        ],
        [
          "Total Interest",
          receiptTotalInterest(loan),
        ],
        [
          "Total Payable",
          receiptTotalPayable(loan),
        ],
        [
          "EMI Amount",
          receiptEmiAmount(loan),
        ],
        [
          "Processing Fee",
          receiptMoney(receiptProcessingFee),
        ],
        [
          "Advance Deduction",
          receiptMoney(receiptAdvanceDeduction),
        ],
        [
          "Net Disbursement",
          receiptMoney(receiptNetDisbursement),
        ],
        [
          "Late Fee (Configured)",
          receiptMoney(receiptConfiguredLateFee),
        ],
        [
          "Loan Status",
          loanReceiptText(loan, ["status"]),
        ],
      ];

      rows.forEach(([label, value], index) => {
        const y = 398 + index * 74;

        if (index % 2 === 0) {
          ctx.fillStyle = "#F3F6FA";
          ctx.fillRect(38, y - 42, 884, 70);
        }

        ctx.fillStyle = "#667085";
        ctx.font = "500 30px Arial, sans-serif";
        draw(label, 55, y, 315);

        ctx.fillStyle = "#11243D";
        ctx.font = "650 30px Arial, sans-serif";
        draw(value, 900, y, 525, "right");
      });

      ctx.fillStyle = "#11243D";
      ctx.fillRect(0, 1525, 960, 105);

      ctx.fillStyle = "#E9BF69";
      ctx.font = "650 27px Arial, sans-serif";
      draw(
        "THANK YOU FOR CHOOSING PAISARULE",
        480,
        1564,
        900,
        "center",
      );

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "500 24px Arial, sans-serif";
      draw(
        "Prepared from saved loan details",
        480,
        1605,
        900,
        "center",
      );

      const blob = await new Promise<Blob>(
        (resolve, reject) => {
          canvas.toBlob(
            (result) => {
              if (result) resolve(result);
              else reject(
                new Error("PNG generation failed"),
              );
            },
            "image/png",
          );
        },
      );

      const identifier = loanReceiptText(
        loan,
        ["loanNumber", "id"],
      );

      const filename =
        "PAISARULE_LOAN_" +
        identifier.replace(/[^A-Za-z0-9_-]/g, "_") +
        ".png";

      return {
        blob,
        dataUrl: canvas.toDataURL("image/png"),
        filename,
      };
    };

    const handleLoanReceiptAction = async (
      loan: Record<string, unknown>,
      action: "preview" | "download" | "share" | "whatsapp",
    ): Promise<void> => {
      if (loanShareBusy) return;

      setLoanShareBusy(true);

      const androidActionProcessing =
        finoraAndroidNativeShareAvailable();

      const actionProcessingId = androidActionProcessing
        ? startFinoraProcessing(
            action === "preview"
              ? "Preparing Loan Receipt Preview..."
              : action === "download"
                ? "Preparing Loan Receipt PNG..."
                : "Preparing Loan Receipt to Share...",
          )
        : null;

      try {
        const result = await createLoanReceiptPng(loan);

        if (action === "preview") {
          setLoanSharePreview(result.dataUrl);
          return;
        }

        const download = (): void => {
          const url = URL.createObjectURL(result.blob);
          const link = document.createElement("a");

          link.href = url;
          link.download = result.filename;

          document.body.appendChild(link);
          link.click();
          link.remove();

          window.setTimeout(
            () => URL.revokeObjectURL(url),
            60000,
          );
        };

        if (action === "download") {
          if (androidActionProcessing) {
            // FINORA_AP04_R030_LOAN_GALLERY_DOWNLOAD
            // Persist the original PNG to Android MediaStore.
            const { registerPlugin } = await import("@capacitor/core");

            const nativeGallery = registerPlugin<{
              saveReceiptPngToGallery(options: {
                receiptType: "loan";
                filename: string;
                pngBase64: string;
              }): Promise<{
                success: boolean;
                saved?: boolean;
                album?: string;
                filename?: string;
              }>;
            }>("FinoraControl");

            if (!result.dataUrl.startsWith("data:image/png;base64,")) {
              throw new Error("Loan receipt PNG data is invalid.");
            }

            const safePart = (
              value: unknown,
              fallback: string,
            ): string =>
              String(value ?? "")
                .trim()
                .replace(/[^A-Za-z0-9_-]+/g, "_")
                .replace(/^_+|_+$/g, "")
                .slice(0, 46) || fallback;

            const customer = safePart(
              loan.customerName,
              "Customer",
            );

            const loanNumber = safePart(
              loan.loanNumber ?? loan.id,
              "Loan",
            );

            const filename =
              `${customer}_${loanNumber}.png`;

            const saveResult =
              await nativeGallery.saveReceiptPngToGallery({
                receiptType: "loan",
                filename,
                pngBase64: result.dataUrl.split(",")[1],
              });

            if (!saveResult.success || !saveResult.saved) {
              throw new Error(
                "Android Gallery did not confirm the receipt was saved.",
              );
            }


            // FINORA_AP04_R034_LOAN_SUCCESS_DIALOG
            // Native Gallery confirmed that the PNG was published.
            // Do not block the processing overlay cleanup.
            void showFinoraDialog({
              kind: "success",
              heading: "Receipt Saved Successfully",
              message:
                `Gallery Folder: ${saveResult.album ?? "Paisarule Loan Receipts"}\n` +
                `Image: ${saveResult.filename ?? filename}`,
              confirmLabel: "Done",
            });

            return;
          }

                    // FINORA_AP04_R041_WINDOWS_LOAN_PICTURES
          // Windows native Pictures export. Android Gallery stays separate.
          const windowsPictures = (
            window as unknown as {
              finoraReceiptPictures?: {
                savePng: (request: {
                  receiptType: "loan" | "collection";
                  fileName: string;
                  dataBase64: string;
                }) => Promise<
                  | {
                      success: true;
                      saved: true;
                      album: string;
                      fileName: string;
                    }
                  | {
                      success: false;
                      errorCode: string;
                    }
                >;
              };
            }
          ).finoraReceiptPictures;

          if (!windowsPictures?.savePng) {
            throw new Error(
              "Windows Pictures saving is unavailable. Restart the latest PAISARULE EXE.",
            );
          }

          if (!result.dataUrl.startsWith("data:image/png;base64,")) {
            throw new Error("Loan receipt PNG data is invalid.");
          }

          const safePart = (
            value: unknown,
            fallback: string,
          ): string =>
            String(value ?? "")
              .trim()
              .replace(/[^A-Za-z0-9_-]+/g, "_")
              .replace(/^_+|_+$/g, "")
              .slice(0, 46) || fallback;

          const customer = safePart(
            loan.customerName,
            "Customer",
          );

          const loanNumber = safePart(
            loan.loanNumber ?? loan.id,
            "Loan",
          );

          const filename = `${customer}_${loanNumber}.png`;

          const saved = await windowsPictures.savePng({
            receiptType: "loan",
            fileName: filename,
            dataBase64: result.dataUrl.split(",")[1],
          });

          if (!saved.success) {
            throw new Error(
              `Windows Pictures save failed: ${saved.errorCode}`,
            );
          }

          if (!saved.saved) {
            throw new Error(
              "Windows did not confirm the PNG was saved.",
            );
          }

          // Success is reported only after Electron confirms file creation.
          void showFinoraDialog({
            kind: "success",
            heading: "Receipt Saved Successfully",
            message:
              `Pictures Folder: ${saved.album}\n` +
              `Image: ${saved.fileName}`,
            confirmLabel: "Done",
          });

          return;
        }

        const file = new File(
          [result.blob],
          result.filename,
          { type: "image/png" },
        );

        if (
          typeof navigator.share === "function" &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] })
        ) {
          try {
            if (actionProcessingId !== null) {
              stopFinoraProcessing(actionProcessingId);
            }

            await navigator.share({
              files: [file],
              title: "PAISARULE Loan Receipt",
              text: "PAISARULE Loan Disbursement Details",
            });
            return;
          } catch (error) {
            if (
              error instanceof Error &&
              error.name === "AbortError"
            ) {
              return;
            }
          }
        }

        download();

        window.alert(
          action === "whatsapp"
            ? "Loan PNG downloaded. Open WhatsApp and attach the PNG. Automatic file attachment is unavailable on this device."
            : "Native file sharing is unavailable. Loan PNG downloaded.",
        );
      } catch (error) {
          // FINORA_AP04_R036_R1_LOAN_RED_ERROR
          console.error("PAISARULE Loan Receipt:", error);

          if (action === "download") {
            const reason =
              error instanceof Error
                ? error.message
                : String(error);

            void showFinoraDialog({
              kind: "error",
              heading: "Receipt Download Failed",
              message:
                "Loan Receipt PNG could not be saved.\n" +
                `Reason: ${reason || "Unknown save error"}`,
              confirmLabel: "Close",
            });
          } else {
            window.alert(
              "Unable to generate or share the Loan Receipt PNG.",
            );
          }
        } finally {
        if (actionProcessingId !== null) {
          stopFinoraProcessing(actionProcessingId);
        }

        setLoanShareBusy(false);
      }
    };
    const principalText = (
      loan: Record<string, unknown>,
    ): string => {
      const candidate = loan.amount ?? loan.principalAmount ?? loan.principal;

      if (
        candidate === null ||
        candidate === undefined ||
        candidate === ""
      ) {
        return "Not recorded";
      }

      const amount = Number(candidate);

      return Number.isFinite(amount)
        ? "₹" + amount.toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          })
        : "Not recorded";
    };

    return (
      <StudioLayout
        department="Loans"
        allowScroll={true}
        showHeader={false}
      >
        <main
          className="finora-r173-receipt"
          style={{
            color: receiptTextColor,
            display: "grid",
            gap: 14,
            alignContent: "start",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h1
                style={{
                  ...themedPageTitleStyle,
                  fontSize: 24,
                }}
              >
                Share Loan Receipts
              </h1>

              <p style={themedPageSubtitleStyle}>
                Saved loan disbursement documents.
              </p>
            </div>

            <button
              type="button"
              onClick={() => (window.sessionStorage.removeItem("finora:receipt-page:loans"), setLoanShareOpen(false))}
              style={{
                ...responsiveRejectedButtonStyle,
              }}
            >
              <span style={{display:"inline-flex",alignItems:"center",gap:8}}><FinoraReceiptArrowLeft size={18} strokeWidth={1.9} />Back to Loans</span>
            </button>
          </header>

          <section
            style={{
              padding: 18,
              borderRadius: 16,
              border: "1px solid rgba(140,150,170,.35)",
              minWidth: 0,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>
              Loan Receipt Library
            </h2>

            <style>{`
              /* FINORA_R206_B_SAFE_CALENDAR_LAYOUT */
              .finora-r173-receipt .finora-r205-loan-filters {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 12px;
                align-items: end;
                margin: 16px 0;
              }
              .finora-r173-receipt .finora-r205-loan-filters > * {
                box-sizing: border-box;
                min-width: 0;
                max-width: 100%;
              }
              .finora-r173-receipt .finora-r206-date-controls {
                grid-column: span 2;
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
                min-width: 0;
              }
              .finora-r173-receipt .finora-r206-date-field {
                display: flex;
                flex-direction: column;
                align-items: stretch;
                gap: 7px;
                min-width: 0;
                width: 100%;
              }
              .finora-r173-receipt .finora-r206-date-label {
                font-size: 12px;
                font-weight: 650;
                color: var(--finora-theme-text-secondary);
              }
              .finora-r173-receipt .finora-r206-date-field > *:last-child {
                width: 100%;
                min-width: 0;
                max-width: 100%;
              }
              .finora-r173-receipt .finora-r205-loan-filters input {
                box-sizing: border-box;
                min-width: 0;
                max-width: 100%;
              }
              .finora-r173-receipt .finora-r205-loan-filters > .finora-r205-loan-clear {
                display: block;
                position: static;
                grid-column: auto;
                width: 100%;
                min-width: 0;
                min-height: 46px;
                margin: 0;
              }
              @media (max-width: 900px) {
                .finora-r173-receipt .finora-r205-loan-filters {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }
                .finora-r173-receipt .finora-r206-date-controls,
                .finora-r173-receipt .finora-r205-loan-filters > .finora-r205-loan-clear {
                  grid-column: 1 / -1;
                }
              }
              @media (max-width: 560px) {
                .finora-r173-receipt .finora-r205-loan-filters {
                  display: flex;
                  flex-direction: column;
                  align-items: stretch;
                  gap: 12px;
                }
                .finora-r173-receipt .finora-r205-loan-filters > * {
                  width: 100%;
                  min-width: 0;
                  flex: 0 0 auto;
                }
                .finora-r173-receipt .finora-r206-date-controls {
                  display: flex;
                  flex-direction: column;
                  gap: 12px;
                  width: 100%;
                }
                .finora-r173-receipt .finora-r206-date-field {
                  width: 100%;
                  min-width: 0;
                }
                .finora-r173-receipt .finora-r205-loan-filters > .finora-r205-loan-clear {
                  display: block;
                  position: static;
                  width: 100%;
                  min-height: 44px;
                  margin: 0;
                }
              }

              /* PAISARULE_B06_R4D_FILTER_MATCH */
              .finora-r173-receipt .finora-r205-loan-filters input {
                box-sizing: border-box;
                min-width: 0;
                max-width: 100%;
              }

              .finora-r173-receipt .finora-r205-loan-filters label {
              display: grid;
              gap: 7px;
              min-width: 0;
              font-size: 12px;
              font-weight: 650;
            }

              .finora-r173-receipt .finora-r205-loan-filters input {
              width: 100%;
              min-width: 0;
              min-height: 44px;
              padding: 10px 12px;
              border-radius: 10px;
              border: 1px solid rgba(135,145,160,0.4);
              background: rgba(125,135,155,0.08);
              color: inherit;
              font: inherit;
              outline: none;
              transition:
                border-color 160ms ease,
                background 160ms ease,
                box-shadow 160ms ease;
            }

              .finora-r173-receipt .finora-r205-loan-filters input:focus-visible {
              box-shadow: 0 0 0 3px rgba(135,145,160,0.18);
            }

              /* Apply uniformly across Loan Receipt filters. */
              .finora-r173-receipt .finora-r205-loan-filters {
                font-family: Inter, ui-sans-serif, system-ui, sans-serif;
              }

              .finora-r173-receipt .finora-r205-loan-filters .finora-r206-date-label {
                font-family: inherit;
                font-size: 12px;
                font-weight: 650;
                line-height: 1.35;
              }

              .finora-r173-receipt .finora-r205-loan-filters .finora-r206-date-field {
                gap: 7px;
              }

                            /* PAISARULE_C125_R113_LOAN_RECEIPT_CALENDAR_ALIGNMENT */
              /* Only Loan Share Receipts FROM / TO controls. */
              .finora-r173-receipt .finora-r205-loan-filters .finora-calendar-input-wrap {
                position: relative !important;
                width: 100%;
                min-width: 0;
                box-sizing: border-box;
              }

              .finora-r173-receipt .finora-r205-loan-filters .finora-calendar-input {
                width: 100%;
                min-width: 0;
                box-sizing: border-box;
                padding-right: 52px !important;
              }

              .finora-r173-receipt .finora-r205-loan-filters .finora-calendar-icon-button {
                position: absolute !important;
                top: 50% !important;
                right: 9px !important;
                bottom: auto !important;
                left: auto !important;
                transform: translateY(-50%) !important;
                width: 36px !important;
                height: 36px !important;
                min-width: 36px !important;
                min-height: 36px !important;
                margin: 0 !important;
                padding: 0 !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                flex-shrink: 0;
                box-sizing: border-box;
                z-index: 1;
              }

              .finora-r173-receipt .finora-r205-loan-filters .finora-calendar-icon-button:hover,
              .finora-r173-receipt .finora-r205-loan-filters .finora-calendar-icon-button:focus-visible {
                top: 50% !important;
                transform: translateY(-50%) !important;
              }
/* Calendar icon only: keep date input border. */
              .finora-r173-receipt .finora-r205-loan-filters .finora-calendar-icon-button {
                background: transparent !important;
                border: 0 !important;
                box-shadow: none !important;
              }

              .finora-r173-receipt .finora-r205-loan-filters .finora-calendar-icon-button:focus-visible {
                outline: 2px solid var(--finora-theme-info);
                outline-offset: 2px;
              }

`}</style>
            <div className="finora-r205-loan-filters">
              {/* FINORA_R206_C1_SEARCH_INLINE */}
              <label
                className="finora-r205-loan-search"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: 7,
                  width: "100%",
                  minWidth: 0,
                }}
              >
                <span>Customer / Loan Search</span>
                <input
                  type="search"
                  value={loanShareSearch}
                  onChange={(event) =>
                    setLoanShareSearch(event.target.value)
                  }
                  placeholder="Customer / Loan number..."
                />
              </label>
              <div className="finora-r206-date-controls">
                <div className="finora-r206-date-field">
                  <span className="finora-r206-date-label">FROM</span>
                  <FinoraCalendar
                    value={loanShareFromDate}
                    onChange={setLoanShareFromDate}
                    max={loanShareToDate || undefined}
                    ariaLabel="From Date"
                    placeholder="DD/MM/YYYY"
                    allowClear={false}
                  />
                </div>
                <div className="finora-r206-date-field">
                  <span className="finora-r206-date-label">TO</span>
                  <FinoraCalendar
                    value={loanShareToDate}
                    onChange={setLoanShareToDate}
                    min={loanShareFromDate || undefined}
                    ariaLabel="To Date"
                    placeholder="DD/MM/YYYY"
                    allowClear={false}
                  />
                </div>
              </div>
              <button
                type="button"
                className="finora-r205-loan-clear"
                onClick={() => {
                  setLoanShareSearch("");
                  setLoanShareFromDate("");
                  setLoanShareToDate("");
                }}
              >
                Clear Filters
              </button>
            </div>

            <p className="finora-b22-result-count" style={{ fontSize: 12, opacity: 0.75 }}>
              {records.length} matching loans
            </p>

                        {/* PAISARULE_C137_R74_LOAN_CARD_GRID */}
            <style>{`
              .finora-r173-receipt .paisarule-r74-loan-grid {
                display: grid !important;
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                align-items: stretch;
                gap: 14px !important;
                min-width: 0;
              }
              .finora-r173-receipt .paisarule-r74-loan-grid > article {
                min-width: 0;
                max-width: 100%;
                box-sizing: border-box;
                display: flex !important;
                flex-direction: column !important;
                align-items: stretch !important;
                justify-content: flex-start !important;
                gap: 12px;
                height: 100%;
                overflow-wrap: anywhere;
              }
              .finora-r173-receipt .paisarule-r74-loan-grid span,
              .finora-r173-receipt .paisarule-r74-loan-grid p,
              .finora-r173-receipt .paisarule-r74-loan-grid button {
                font-weight: 500;
              }
              .finora-r173-receipt .paisarule-r74-loan-grid strong {
                font-weight: 700;
              }
              .finora-r173-receipt .paisarule-r74-loan-grid > article > strong {
                font-weight: 800;
              }
              .finora-r173-receipt .paisarule-r74-loan-grid .finora-r185-actions {
                margin-top: auto !important;
                width: 100%;
                min-width: 0;
              }
              @media (max-width: 1100px) {
                .finora-r173-receipt .paisarule-r74-loan-grid {
                  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                }
              }
              @media (max-width: 600px) {
                .finora-r173-receipt .paisarule-r74-loan-grid {
                  grid-template-columns: minmax(0, 1fr) !important;
                }
              }
            `}</style>
<div className="paisarule-r74-loan-grid" style={{ display: "grid", gap: 12 }}>
              {records.length === 0 ? (
                <p>No matching loans found.</p>
              ) : (
                records.map((loan, index) => (
                  <article
                    key={`${String(loan.id ?? index)}`}
                    style={{
                      padding: 15,
                      border: "1px solid rgba(140,150,170,.3)",
                      borderRadius: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "grid", gap: 6 }}>
                      <strong>
                        {String(loan.customerName ?? "Customer")}
                      </strong>

                      <span style={{ fontSize: 12, opacity: 0.75 }}>
                        {paisaruleLoanReceiptDisplayId(String(loan.loanNumber ?? loan.id ?? "--"))}
                      </span>                      <span
                        style={{
                          fontSize: 12,
                          opacity: 0.85,
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        <strong>Loan Disbursement Date:</strong>
                        {loanDisbursementDate(loan)}
                      </span>                      <span
                        style={{
                          fontSize: 12,
                          opacity: 0.9,
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        <strong>Monthly Repayment Date:</strong>
                        {monthlyRepaymentDate(loan)}
                      </span>
                    </div>

                    <strong style={{ color: "#16A34A" }}>
                      {loanReceiptPrincipal(loan)}
                    </strong>

                    <div className="finora-r185-actions"
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        marginTop: 6,
                      }}
                    >
                      {([
                        ["preview", "Preview"],
                        ["download", "Download Image"],
                        ["whatsapp", "WhatsApp"],
                      ] as const).map(([action, label]) => (
                        <button onClickCapture={(event) => {
                          if (
                            action === "whatsapp" && finoraAndroidNativeShareAvailable()
                          ) {
                            event.preventDefault();
                            event.stopPropagation();
                            void finoraNativePhotoShare(loan);
                          } else if (
                            action === "whatsapp" &&
                            !finoraAndroidNativeShareAvailable() &&
                            /Windows/i.test(navigator.userAgent)
                          ) {
                            event.preventDefault();
                            event.stopPropagation();
                            void finoraWindowsWhatsAppPhotoShare(loan);
                          }
                        }} className="finora-r185-action-button"
                          key={action}
                          type="button"
                          disabled={loanShareBusy}
                          onClick={() =>
                            void handleLoanReceiptAction(loan, action)
                          }
                          style={{
                            // FINORA_R203_B2_WHATSAPP
                            minHeight: 43,
                            padding: "9px 13px",
                            borderRadius: 10,
                            border: "1px solid rgba(140,150,170,.4)",
                            background: "transparent",
                            color: "inherit",
                            fontWeight: 700,
                            cursor: loanShareBusy
                              ? "wait"
                              : "pointer",
                          }}
                        >
                          <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 7,
                          }}
                        >
                          {action === "preview" ? (
                            <FinoraReceiptEye size={17} strokeWidth={1.9} />
                          ) : action === "download" ? (
                            <FinoraReceiptDownload size={17} strokeWidth={1.9} />
                          ) : (
                            finoraAndroidNativeShareAvailable() ? (
                              <FinoraReceiptWhatsAppIcon
                                size={17}
                                strokeWidth={1.9}
                                aria-hidden="true"
                              />
                            ) : (
                              <FinoraReceiptCopy
                                size={17}
                                strokeWidth={1.9}
                                aria-hidden="true"
                              />
                            )
                          )}
                          {label}
                        </span>
                        </button>
                      ))}
                    </div>
                  </article>
                ))
              )}
            </div>
            {loanSharePreview && (
              // FINORA_C80_B22_C2_R1_PREVIEW_MODAL
              <div
                role="presentation"
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 10000,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 12,
                  boxSizing: "border-box",
                  background: "rgba(8, 17, 31, 0.78)",
                }}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Loan Receipt Preview"
                  style={{
                    width: "100%",
                    maxWidth: 560,
                    maxHeight: "calc(100dvh - 24px)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    overflowY: "auto",
                    boxSizing: "border-box",
                    padding: 12,
                    borderRadius: 16,
                    background: "#FFFFFF",
                    boxShadow: "0 24px 75px rgba(0,0,0,0.45)",
                    fontFamily:
                      "Inter, ui-sans-serif, system-ui, sans-serif",
                  }}
                >
                  <strong
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#11243D",
                      textAlign: "center",
                    }}
                  >
                    Loan Receipt Preview
                  </strong>

                  <img
                    src={loanSharePreview}
                    alt="PAISARULE Loan Receipt Preview"
                    style={{
                      display: "block",
                      width: "auto",
                      maxWidth: "100%",
                      height: "auto",
                      maxHeight: "calc(100dvh - 150px)",
                      objectFit: "contain",
                      borderRadius: 8,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setLoanSharePreview("")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 150,
                      minHeight: 44,
                      padding: "10px 24px",
                      border: "none",
                      borderRadius: 10,
                      background: "#11243D",
                      color: "#FFFFFF",
                      fontSize: 14,
                      fontWeight: 650,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </section>
          <style>{`
            /* FINORA_R177_PREMIUM_SPACING */

            /* FINORA_R178_B_SURFACE_REUSE */

            /* Same surface used by Loans Office cards */
            .finora-r173-receipt > section {
              background: ${themeColors.surface} !important;
              border: 1px solid ${themeColors.border} !important;
              box-shadow: none !important;
              color: ${themeColors.textPrimary} !important;
            }

            /* Same surface used by Statistics cards */
            .finora-r173-receipt > section article {
              background: ${themeColors.surface} !important;
              border: 1px solid ${themeColors.border} !important;
              box-shadow: none !important;
              color: ${themeColors.textPrimary} !important;
            }

            /* Preserve selected theme for the search field */
            .finora-r173-receipt input[type="search"] {
              background: ${themeColors.surface} !important;
              border-color: ${themeColors.border} !important;
              color: ${themeColors.textPrimary} !important;
            }

            /* Existing Loan Office-style neutral buttons */
            .finora-r173-receipt button {
              background: ${themeColors.surface} !important;
              border-color: ${themeColors.border} !important;
              color: ${themeColors.textPrimary} !important;
            }


            /* Visible keyboard focus with active theme */
            .finora-r173-receipt button:focus-visible,
            .finora-r173-receipt input:focus-visible {
              outline: 2px solid ${themeColors.brandAccent};
              outline-offset: 2px;
            }


            .finora-r173-receipt {
              box-sizing: border-box !important;
              width: 100% !important;
              max-width: 1760px;
              margin: 0 auto !important;
              padding: 20px clamp(18px, 2vw, 32px) clamp(18px, 2vw, 32px) !important;
            }

            .finora-r173-receipt > header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              flex-wrap: wrap;
              gap: 16px;
              margin: 0 !important;
              padding: 0 !important;
            }

            .finora-r173-receipt > header h1 {
              margin-top: 0 !important;
              margin-bottom: 4px !important;
            }

            .finora-r173-receipt > section {
              box-sizing: border-box !important;
              width: 100%;
              min-width: 0;
              padding: 18px !important;
              border-radius: 18px !important;
              box-shadow: 0 5px 22px rgba(0,0,0,.055);
            }

            .finora-r173-receipt > section article {
              box-sizing: border-box !important;
              padding: 18px !important;
              border-radius: 14px !important;
              margin-top: 6px;
              margin-bottom: 6px;
            }

            .finora-r173-receipt button {
              min-height: 44px;
              border-radius: 11px !important;
            }

            .finora-r173-receipt input[type="search"] {
              min-height: 46px;
              border-radius: 11px !important;
            }

            @media (max-width: 650px) {
              .finora-r173-receipt {
                padding: 14px !important;
              }

              .finora-r173-receipt > header {
                align-items: stretch;
                margin-bottom: 16px !important;
              }

              .finora-r173-receipt > section {
                padding: 14px !important;
                border-radius: 15px !important;
              }

              .finora-r173-receipt > section article {
                padding: 15px !important;
              }

              .finora-r173-receipt button {
                min-height: 46px;
              }
            }
            .finora-r173-receipt > section {
              border: 1px solid ${receiptAccent} !important;
              background: color-mix(in srgb, ${receiptAccent} 5%, transparent) !important;
            }

            .finora-r173-receipt > section article {
              border: 1px solid color-mix(
                in srgb, ${receiptAccent} 65%, transparen
              ) !important;
              background: color-mix(
                in srgb, ${receiptAccent} 7%, transparen
              ) !important;
            }

            .finora-r173-receipt input[type="search"] {
              border: 1px solid ${receiptAccent} !important;
              background: color-mix(
                in srgb, ${receiptAccent} 5%, transparen
              ) !important;
            }

            .finora-r173-receipt button {
              border: 1px solid ${receiptAccent} !important;
              background: color-mix(
                in srgb, ${receiptAccent} 9%, transparen
              ) !important;
              transition: background 160ms ease, transform 160ms ease;
            }

            .finora-r173-receipt button:hover:not(:disabled) {
              background: color-mix(
                in srgb, ${receiptAccent} 17%, transparen
              ) !important;
              transform: translateY(-1px);
            }

            .finora-r173-receipt button:focus-visible,
            .finora-r173-receipt input:focus-visible {
              outline: 2px solid ${receiptAccent};
              outline-offset: 2px;
            }

            @media (prefers-reduced-motion: reduce) {
              .finora-r173-receipt button {
                transition: none !important;
              }
            }
          `}</style>

          <style>{`
            /* FINORA R175 - ACCESSIBLE RECEIPT TYPOGRAPHY */
            /* FINORA_C80_B22_C4_B_PREMIUM_LIBRARY */

            /* Match FINORA Collections receipt typography. */
            .finora-r173-receipt,
            .finora-r173-receipt * {
              font-family:
                Inter, ui-sans-serif, system-ui, sans-serif !important;
            }

            .finora-r173-receipt > header h1 {
              font-size: 24px !important;
              font-weight: 750 !important;
              letter-spacing: -0.45px;
              line-height: 1.25;
            }

            .finora-r173-receipt > header p {
              font-size: 13px !important;
              font-weight: 450 !important;
              line-height: 1.5;
            }

            .finora-r173-receipt > section h2 {
              font-size: 19px !important;
              font-weight: 750 !important;
              letter-spacing: -0.3px;
              line-height: 1.3;
            }

            /* Search and filter labels. */
            .finora-r173-receipt .finora-r205-loan-filters label,
            .finora-r173-receipt .finora-r206-date-label {
              font-size: 12px !important;
              font-weight: 650 !important;
              letter-spacing: 0;
              line-height: 1.35;
            }

            .finora-r173-receip
            .finora-r205-loan-filters input[type="search"] {
              width: 100% !important;
              min-height: 46px !important;
              padding: 10px 13px !important;
              border-radius: 11px !important;
              border: 1px solid
                var(--finora-theme-border-default, #d9e0ea)
                !important;
              background:
                var(--finora-theme-background-surface-muted, #f2f4f7)
                !important;
              color:
                var(--finora-theme-text-primary, #142238)
                !important;
              font-size: 14px !important;
              font-weight: 500 !important;
              box-shadow: none !important;
            }

            .finora-r173-receip
            .finora-r205-loan-filters input[type="search"]::placeholder {
              font-size: 14px;
              font-weight: 450;
              opacity: 0.75;
            }

            /*
             * FinoraCalendar: remove the extra-looking outer
             * surface. Keep the actual date input and click target.
             */
            .finora-r173-receip
            .finora-r205-loan-filters
            .finora-calendar-input-wrap {
              min-width: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              box-sizing: border-box !important;
              background: transparent !important;
              border: 0 !important;
              box-shadow: none !important;
            }

            .finora-r173-receip
            .finora-r205-loan-filters
            .finora-calendar-input {
              width: 100% !important;
              min-width: 0 !important;
              min-height: 46px !important;
              box-sizing: border-box !important;
              border-radius: 11px !important;
              border: 1px solid
                var(--finora-theme-border-default, #d9e0ea)
                !important;
              background:
                var(--finora-theme-background-surface-muted, #f2f4f7)
                !important;
              color:
                var(--finora-theme-text-primary, #142238)
                !important;
              font-size: 14px !important;
              font-weight: 500 !important;
              box-shadow: none !important;
            }

            /*
             * Do not change the calendar popup.
             * Normalize only the icon button inside the input.
             */
            .finora-r173-receip
            .finora-r205-loan-filters
            .finora-calendar-input-wrap button {
              background: transparent !important;
              border: 0 !important;
              box-shadow: none !important;
              color:
                var(--finora-theme-text-secondary, #526176)
                !important;
              transform: none !important;
            }

            .finora-r173-receip
            .finora-r205-loan-filters
            .finora-calendar-input-wrap button:hover {
              background: transparent !important;
              transform: none !important;
            }

            .finora-r173-receip
            .finora-r205-loan-filters
            .finora-r205-loan-clear {
              font-size: 13px !important;
              font-weight: 650 !important;
              letter-spacing: 0;
              min-height: 46px !important;
              border-radius: 11px !important;
            }

                        /* FINORA_C80_B22_C4_C2_CALENDAR_CENTER */
            /*
             * The shared Calendar positions its icon with top: 50%.
             * Restore translateY(-50%) after the Loans-only generic
             * button override. Do not touch the calendar popup.
             */
            .finora-r173-receip
            .finora-r205-loan-filters
            .finora-calendar-input-wrap
            button.finora-calendar-icon-button {
              position: absolute !important;
              top: 50% !important;
              right: 8px !important;
              transform: translateY(-50%) !important;
              min-height: 0 !important;
              height: 38px !important;
              width: 38px !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              margin: 0 !important;
              padding: 0 !important;
              background: transparent !important;
              border: 0 !important;
              box-shadow: none !important;
              z-index: 1;
            }

            .finora-r173-receip
            .finora-r205-loan-filters
            .finora-calendar-input-wrap
            button.finora-calendar-icon-button:hover:not(:disabled) {
              transform: translateY(-50%) !important;
              background: transparent !important;
            }
            /* Match Collections receipt count typography. */
            .finora-r173-receipt .finora-b22-result-count {
              font-size: 12px !important;
              font-weight: 500 !important;
              opacity: 0.85 !important;
              line-height: 1.5;
            }

            /* Loan receipt cards: clean sans-serif presentation. */
            .finora-r173-receipt > section article {
              font-size: 13px !important;
              line-height: 1.5;
            }

            .finora-r173-receipt > section article strong {
              font-weight: 700 !important;
            }

            .finora-r173-receipt > section article button {
              font-size: 13px !important;
              font-weight: 550 !important;
            }

            @media (max-width: 560px) {
              .finora-r173-receip
              .finora-r205-loan-filters
              .finora-calendar-input {
                min-height: 46px !important;
              }
            }


            .finora-r173-receipt {
              color: ${receiptTextColor};
              font-size: 14px;
              font-weight: 500;
              line-height: 1.5;
            }

            .finora-r173-receipt > section,
            .finora-r173-receipt > section article,
            .finora-r173-receipt > section article div {
              color: ${receiptTextColor} !important;
            }

            .finora-r173-receipt h1,
            .finora-r173-receipt h2,
            .finora-r173-receipt h3,
            .finora-r173-receipt strong,
            .finora-r173-receipt p,
            .finora-r173-receipt span,
            .finora-r173-receipt small,
            .finora-r173-receipt label {
              color: inherit !important;
              font-weight: 500;
              line-height: 1.5;
            }

            .finora-r173-receipt h1 {
              font-size: 24px !important;
              font-weight: 700 !important;
            }

            .finora-r173-receipt h2 {
              font-size: 20px !important;
              font-weight: 700 !important;
            }

            .finora-r173-receipt strong {
              font-weight: 650 !important;
            }

            .finora-r173-receipt small,
            .finora-r173-receipt article span,
            .finora-r173-receipt article p {
              font-size: max(12px, 0.8rem);
              font-weight: 500 !important;
            }

            .finora-r173-receipt button,
            .finora-r173-receipt input {
              color: ${receiptTextColor} !important;
              font-size: max(13px, 0.85rem);
              font-weight: 600 !important;
            }

            .finora-r173-receipt input::placeholder {
              color: ${finoraVividLoanButtons ? "#FFFFFF" : receiptTextColor} !important;
              opacity: ${finoraVividLoanButtons ? 1 : 0.65};
            }

            .finora-r173-receipt button svg {
              flex-shrink: 0;
            }

            .finora-r173-receipt article strong {
              font-size: 15px;
              font-weight: 650 !important;
            }

            .finora-r173-receipt article button:last-child {
              /* FINORA_R200_C1_RECEIPT_CONTRAST */
              color: ${finoraVividLoanButtons ? "#FFFFFF" : "#22c55e"} !important;
            }
          `}</style>
          {/* FINORA_R180_ORIGINAL_SURFACE_FINAL_CSS */}
          <style>{`
            /*
             * Deliberately LAST:
             * override old tinted R173/R178 backgrounds.
             * The values below come from Loans Office
             * responsiveStatisticCardStyle, not a new palette.
             */

            .finora-r173-receipt > section,
            .finora-r173-receipt > section article {
              background: ${receiptOriginalCardBackground} !important;
              background-color: ${receiptOriginalCardBackground} !important;
              background-image: none !important;
              border: ${receiptOriginalCardBorder} !important;
              color: ${themeColors.textPrimary} !important;
            }

            .finora-r173-receipt input[type="search"] {
              background: ${receiptOriginalCardBackground} !important;
              background-color: ${receiptOriginalCardBackground} !important;
              background-image: none !important;
              border-color: ${themeColors.border} !important;
              color: ${themeColors.textPrimary} !important;
            }

            .finora-r173-receipt button {
              background: ${receiptOriginalCardBackground} !important;
              background-color: ${receiptOriginalCardBackground} !important;
              background-image: none !important;
              border-color: ${themeColors.border} !important;
              color: ${themeColors.textPrimary} !important;
            }

            .finora-r173-receipt article button:last-child {
              color: #16a34a !important;
            }

            .finora-r173-receipt > section,
            .finora-r173-receipt > section article {
              background-clip: padding-box;
            }
          `}</style>
          {/* FINORA_R185_MOBILE_ACTION_GRID */}
          <style>{`
            @media (max-width: 650px) {
              .finora-r173-receipt .finora-r185-actions {
                display: grid !important;
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 10px !important;
                width: 100% !important;
                min-width: 0 !important;
                align-items: stretch !important;
              }

              .finora-r173-receipt .finora-r185-action-button {
                width: 100% !important;
                min-width: 0 !important;
                min-height: 48px !important;
                padding: 12px 8px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 13px !important;
                font-weight: 600 !important;
                white-space: nowrap;
                box-sizing: border-box;
              }
            }
          `}</style>
        </main>
      </StudioLayout>
    );
  }
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
              onClick={() => (window.sessionStorage.setItem("finora:receipt-page:loans", "1"), setLoanShareOpen(true))}
              style={{
                ...responsiveRejectedButtonStyle,
                background: responsiveStatisticCardStyle.background ?? themeColors.surface, /* FINORA_R193_R1_LOAN_BUTTON */
                border: `1px solid ${typeof responsiveCreateButtonStyle.backgroundColor === "string"
                    ? responsiveCreateButtonStyle.backgroundColor
                    : typeof responsiveCreateButtonStyle.background === "string"
                      ? responsiveCreateButtonStyle.background
                      : "currentColor"}`,
                color:
                  finoraVividLoanButtons
                    ? "#FFFFFF"
                    : (typeof responsiveCreateButtonStyle.backgroundColor === "string"
                    ? responsiveCreateButtonStyle.backgroundColor
                    : typeof responsiveCreateButtonStyle.background === "string"
                      ? responsiveCreateButtonStyle.background
                      : "currentColor"),
              }}
            >
              <span style={{display:"inline-flex",alignItems:"center",gap:8}}><FinoraReceiptShare size={17} strokeWidth={1.9} />Share Loan Receipts</span>
            </button>

            <button
              type="button"
              onClick={
                handleOpenRejectedApplications
              }
              disabled={loanCreateDisabled}
              title={loanCreateTitle ?? "Rejected Applications"}
              style={{
                ...responsiveRejectedButtonStyle,
                ...(loanCreateDisabled
                  ? { opacity: 0.55, cursor: "not-allowed" }
                  : {}),
              }}
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
              disabled={loanCreateDisabled}
              title={loanCreateTitle ?? "Create Gold Loan"}
              style={{
                ...responsiveGoldCreateButtonStyle,
                color: finoraVividLoanButtons
                  ? "#FFFFFF"
                  : responsiveGoldCreateButtonStyle.color,
                ...(loanCreateDisabled
                  ? { opacity: 0.55, cursor: "not-allowed" }
                  : {}),
              }}
            >
              <Gem size={16} strokeWidth={1.9} />
              Create Gold Loan
            </button>

            <button
              type="button"
              onClick={handleCreateLoan}
              disabled={loanCreateDisabled}
              title={loanCreateTitle ?? "Create New Loan"}
              style={{
                ...responsiveCreateButtonStyle,
                color: finoraVividLoanButtons
                  ? "#FFFFFF"
                  : responsiveCreateButtonStyle.color,
                ...(loanCreateDisabled
                  ? { opacity: 0.55, cursor: "not-allowed" }
                  : {}),
              }}
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

          <article style={responsiveStatisticCardStyle}>
            <span style={themedStatisticLabelStyle}>Principal</span>

            <strong style={themedStatisticValueStyle}>
              {formatCurrency(statistics.principal)}
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
                  <div
                    style={{
                      ...filterFieldStyle,
                      ...(responsiveTokens.viewport === "mobile"
                        ? {
                            width: "100%",
                            minWidth: 0,
                          }
                        : {}),
                    }}
                  >
                    <label style={themedFilterLabelStyle}>Status</label>

                    <select
                      value={filterStatus}
                      onChange={(event) => {
                        setFilterStatus(event.target.value as LoanFilterStatus);
                      }}
                      style={{
                        ...filterSelectStyle,
                        ...themedFilterControlStyle,
                        ...(responsiveTokens.viewport === "mobile"
                          ? { width: "100%" }
                          : {}),
                      }}
                    >
                      <option value="ALL">All</option>

                      <option value="RUNNING">Running</option>

                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>

                  <div
                    style={{
                      gridColumn:
                        responsiveTokens.viewport === "mobile"
                          ? "1 / -1"
                          : "span 2",
                      minWidth: 0,
                      width: "100%",
                    }}
                  >
                    <FinoraCalendar
                      mode="range"
                      value={{
                        from: filterFromDate,
                        to: filterToDate,
                      }}
                      onChange={(nextRange) => {
                        setFilterFromDate(nextRange.from);
                        setFilterToDate(nextRange.to);
                      }}
                      fromLabel="From"
                      toLabel="To"
                      ariaLabel="Loan date filter"
                      placeholder="DD/MM/YYYY"
                      showDuration
                    />
                  </div>

                  <div
                    style={{
                      ...filterActionsStyle,
                      ...(responsiveTokens.viewport === "mobile"
                        ? {
                            width: "100%",
                            minWidth: 0,
                            maxWidth: "none",
                            height: "auto",
                            minHeight: "32px",
                            maxHeight: "none",
                            margin: 0,
                            marginLeft: 0,
                            marginRight: 0,
                            paddingTop: "48px",
                            display: "grid",
                            gridTemplateColumns: "minmax(0, 1fr)",
                            gridAutoRows: "minmax(32px, auto)",
                            gap: "8px",
                            gridColumn: "1 / -1",
                            alignItems: "stretch",
                            alignSelf: "stretch",
                            position: "static",
                            visibility: "visible",
                            overflow: "visible",
                            boxSizing: "border-box",
                          }
                        : {}),
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      style={{
                        ...themedClearFilterButtonStyle,
                    ...(responsiveTokens.viewport === "mobile"
                      ? {
                          width: "100%",
                          minWidth: 0,
                          maxWidth: "none",
                          boxSizing: "border-box",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "static",
                              visibility: "visible",
                              opacity: 1,
                              gridColumn: "1 / -1",
                              alignSelf: "stretch",
                        }
                      : {}),
                      }}
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      onClick={handleApplyFilters}
                      style={{
                        ...themedApplyFilterButtonStyle,
                    ...(responsiveTokens.viewport === "mobile"
                      ? {
                          width: "100%",
                          minWidth: 0,
                          maxWidth: "none",
                          boxSizing: "border-box",
                        }
                      : {}),
                      }}
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
                style={{
                  ...themedRefreshButtonStyle,
                    ...(responsiveTokens.viewport === "mobile"
                      ? {
                          width: "100%",
                          minWidth: 0,
                          maxWidth: "none",
                          boxSizing: "border-box",
                        }
                      : {}),
                }}
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <span
                style={{
                  ...themedLoanCountStyle,
                  marginBottom:
                    responsiveTokens.viewport === "mobile"
                      ? "10px"
                      : undefined,
                  ...(responsiveTokens.viewport === "mobile"
                    ? {
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxSizing: "border-box",
                      }
                    : {}),
                }}
              >
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
              <div style={themedEmptyTitleStyle}>Loading PAISARULE Loans...</div>

              <div style={themedEmptyDescriptionStyle}>
                Preparing your loan records...
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
                  disabled={loanCreateDisabled}
                  title={loanCreateTitle ?? "Create New Loan"}
                  style={{
                    ...themedEmptyCreateButtonStyle,
                    ...(loanCreateDisabled
                      ? { opacity: 0.55, cursor: "not-allowed" }
                      : {}),
                  }}
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
                      <div style={themedTableHeaderCenterStyle}>S.No</div>

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
                          style={
                            isClosedLoan(loan)
                              ? themedClosedTableRowStyle
                              : themedTableRowStyle
                          }
                          role="row"
                        >
                          <div style={themedSerialCellStyle}>
                            {pageStartIndex + index + 1}
                          </div>

                          <div style={loanIdentityStyle}>
                            <div style={themedLoanNumberStyle}>
                              {displayPaisarulePortfolioLoanNumber(loan.loanNumber || loan.id || "--")}
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
                                    ? themeColors.danger
                                    : themeColors.successBorder
                                }`,
                                background: isClosedLoan(loan)
                                  ? themeColors.dangerSoft
                                  : themeColors.successSoft,
                                color: isClosedLoan(loan)
                                  ? themeColors.danger
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
                        disabled={!hasPreviousPaginationWindow}
                        onClick={() => {
                          showPreviousPaginationWindow();
                        }}
                        style={{
                          ...themedPaginationNavButtonStyle,
                          opacity: !hasPreviousPaginationWindow ? 0.45 : 1,
                          cursor: !hasPreviousPaginationWindow ? "default" : "pointer",
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
                        disabled={!hasNextPaginationWindow}
                        onClick={() => {
                          showNextPaginationWindow();
                        }}
                        style={{
                          ...themedPaginationNavButtonStyle,
                          opacity: !hasNextPaginationWindow ? 0.45 : 1,
                          cursor: !hasNextPaginationWindow ? "default" : "pointer",
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
                    gap:
                      responsiveTokens.viewport === "mobile"
                        ? "10px"
                        : `${responsiveTokens.layout.mobileRecordGap}px`,
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
                      statusStyle={{
                        border: `1px solid ${
                          isClosedLoan(loan)
                            ? themeColors.danger
                            : themeColors.successBorder
                        }`,
                        background: isClosedLoan(loan)
                          ? themeColors.dangerSoft
                          : themeColors.successSoft,
                        color: isClosedLoan(loan)
                          ? themeColors.danger
                          : themeColors.success,
                      }}
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
                        disabled={!hasPreviousPaginationWindow}
                        onClick={() => {
                          showPreviousPaginationWindow();
                        }}
                        style={{
                          ...themedPaginationNavButtonStyle,
                          opacity: !hasPreviousPaginationWindow ? 0.45 : 1,
                          cursor: !hasPreviousPaginationWindow ? "default" : "pointer",
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
                        disabled={!hasNextPaginationWindow}
                        onClick={() => {
                          showNextPaginationWindow();
                        }}
                        style={{
                          ...themedPaginationNavButtonStyle,
                          opacity: !hasNextPaginationWindow ? 0.45 : 1,
                          cursor: !hasNextPaginationWindow ? "default" : "pointer",
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


