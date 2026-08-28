// ============================================================
// FINORA ENTERPRISE OS™
//
// REPORTS ENGINE™
//
// REPORTS PAGE
//
// RESPONSIBILITY:
//
// - Render FINORA Reports workspace
// - Restore authenticated storage mode
// - Load authoritative Customer / Loan / Collection data
// - Generate Loan Statements
// - Generate Customer Statements
// - Generate Monthly Collections reports
// - Generate Outstanding Loans reports
// - Generate Closed Loans reports
// - Consume FINORA Responsive Engine
// - Consume FINORA global semantic theme system
// - Download PDF
// - Print PDF
// - Share PDF through Android native share sheet
// - Open WhatsApp Web on Desktop / Electron
// - Refresh when FINORA business data changes
//
// REPORT ROADMAP:
//
// 01. Loan Statement                COMPLETE
// 02. Customer Statement            COMPLETE
// 03. Monthly Collections           COMPLETE
// 04. Outstanding Loans             COMPLETE
// 05. Closed Loans                  COMPLETE
//
// RESPONSIVE:
//
// Mobile
// - Top compact report grid
// - One-column controls
// - Two-column metrics
// - One-column actions
//
// Tablet
// - Top report grid
// - Two-column controls
// - Two-column metrics
// - Three-column actions
//
// Laptop
// - Left report navigation
// - Three-column metrics
//
// Desktop
// - Left report navigation
// - Four-column metrics
//
// IMPORTANT:
//
// - No repository access
// - No direct persistence access from report UI
// - No financial aggregation inside UI
// - No CSS media queries
// - No direct viewport classification
// - Current outstanding comes from authoritative Loan data
// - Historical Collection outstanding snapshots are not summed
// - PDF generation belongs to Reports services
//
// VERSION : 2.0
// STATUS  : Production Responsive
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { useTheme } from "../../themes/provider";

import type { FinoraTheme } from "../../themes/core/types";

import { useCallback, useEffect, useState } from "react";

import type { CSSProperties } from "react";

import {
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  Download,
  FileText,
  Printer,
  RefreshCw,
  Share2,
  UserRound,
} from "lucide-react";

import { Capacitor } from "@capacitor/core";

import StudioLayout from "../../components/common/layout/StudioLayout";

import type { Loan } from "../../components/customers/office/CustomerOffice/types";

import type { CustomerProfile } from "../../types/customers";

import useResponsive from "../../utils/responsive/useResponsive";

import {
  buildLoanReportStatement,
  loadReportDataSnapshot,
} from "../../services/reports/reportDataService";

import type { LoanReportStatement } from "../../services/reports/reportDataService";

import {
  downloadLoanStatementPdf,
  printLoanStatementPdf,
  shareLoanStatementPdf,
} from "../../services/reports/loanStatementPdf";

import {
  buildCustomerReportStatement,
  loadCustomerReportCustomers,
} from "../../services/reports/customerStatementDataService";

import type { CustomerReportStatement } from "../../services/reports/customerStatementDataService";

import {
  downloadCustomerStatementPdf,
  printCustomerStatementPdf,
  shareCustomerStatementPdf,
} from "../../services/reports/customerStatementPdf";

import {
  buildMonthlyCollectionsReport,
  getCurrentReportMonthKey,
} from "../../services/reports/monthlyCollectionsDataService";

import type { MonthlyCollectionsReport } from "../../services/reports/monthlyCollectionsDataService";

import {
  downloadMonthlyCollectionsPdf,
  printMonthlyCollectionsPdf,
  shareMonthlyCollectionsPdf,
} from "../../services/reports/monthlyCollectionsPdf";

import { buildOutstandingLoansReport } from "../../services/reports/outstandingLoansDataService";

import type { OutstandingLoansReport } from "../../services/reports/outstandingLoansDataService";

import {
  downloadOutstandingLoansPdf,
  printOutstandingLoansPdf,
  shareOutstandingLoansPdf,
} from "../../services/reports/outstandingLoansPdf";

import { buildClosedLoansReport } from "../../services/reports/closedLoansDataService";

import type { ClosedLoansReport } from "../../services/reports/closedLoansDataService";

import {
  downloadClosedLoansPdf,
  printClosedLoansPdf,
  shareClosedLoansPdf,
} from "../../services/reports/closedLoansPdf";

import { storageManager } from "../../storage/storageManager";

import { StorageMode } from "../../storage/storage.types";

import { getReportsPageStyles } from "./ReportsPage.styles";

// ============================================================
// REPORT TYPE
// ============================================================

type ReportType =
  | "loan-statement"
  | "customer-statement"
  | "monthly-collections"
  | "outstanding-loans"
  | "closed-loans";

// ============================================================
// ACTION TYPE
// ============================================================

type ReportAction = "download" | "print" | "share" | null;

// ============================================================
// FINORA THEME STYLE
// ============================================================

type ReportsThemeStyle = CSSProperties & Record<`--${string}`, string>;

// ============================================================
// FINORA THEME VARIABLE FACTORY
// ============================================================
//
// ThemeProvider owns all five FINORA themes:
//
// - Imperial Gold
// - Royal Navy
// - Amethyst
// - Emerald
// - Obsidian
//
// Reports only exposes the active theme through semantic
// CSS variables consumed by ReportsPage.styles.ts.
// ============================================================

function createReportsThemeVariables(theme: FinoraTheme): ReportsThemeStyle {
  return {
    "--finora-theme-brand-primary": theme.colors.brand.primary,

    "--finora-theme-brand-secondary": theme.colors.brand.secondary,

    "--finora-theme-brand-accent": theme.colors.brand.accent,

    "--finora-theme-brand-accent-soft": theme.colors.brand.accentSoft,

    "--finora-theme-page": theme.colors.background.page,

    "--finora-theme-background-page": theme.colors.background.page,

    "--finora-theme-surface": theme.colors.background.surface,

    "--finora-theme-background-surface": theme.colors.background.surface,

    "--finora-theme-surface-muted": theme.colors.background.surfaceMuted,

    "--finora-theme-background-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-surface-strong": theme.colors.background.surfaceStrong,

    "--finora-theme-text-primary": theme.colors.text.primary,

    "--finora-theme-text-secondary": theme.colors.text.secondary,

    "--finora-theme-text-body": theme.colors.text.secondary,

    "--finora-theme-text-muted": theme.colors.text.muted,

    "--finora-theme-text-inverse": theme.colors.text.inverse,

    "--finora-theme-border-default": theme.colors.border.default,

    "--finora-theme-border-strong": theme.colors.border.strong,

    "--finora-theme-border-subtle": theme.colors.border.subtle,

    "--finora-theme-focus": theme.colors.border.focus,

    "--finora-theme-success": theme.colors.status.success,

    "--finora-theme-success-soft": theme.colors.status.successSoft,

    "--finora-theme-success-border": theme.colors.border.strong,

    "--finora-theme-warning": theme.colors.status.warning,

    "--finora-theme-warning-soft": theme.colors.status.warningSoft,

    "--finora-theme-danger": theme.colors.status.danger,

    "--finora-theme-danger-soft": theme.colors.status.dangerSoft,

    "--finora-theme-info": theme.colors.status.info,

    "--finora-theme-info-soft": theme.colors.status.infoSoft,

    "--finora-theme-overlay-shadow": theme.colors.overlay.shadow,

    "--finora-theme-overlay-backdrop": theme.colors.overlay.backdrop,
  };
}

// ============================================================
// REPORT OPTION
// ============================================================

interface ReportOption {
  id: ReportType;

  title: string;

  subtitle: string;

  enabled: boolean;

  icon: typeof FileText;
}

// ============================================================
// STORAGE MODE
// ============================================================

const STORAGE_MODE_SESSION_KEY = "FINORA_STORAGE_MODE";

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
// REPORT OPTIONS
// ============================================================

const REPORT_OPTIONS: ReportOption[] = [
  {
    id: "loan-statement",

    title: "Loan Statement",

    subtitle: "Complete loan, EMI and collection statement.",

    enabled: true,

    icon: FileText,
  },

  {
    id: "customer-statement",

    title: "Customer Statement",

    subtitle: "Customer loans, collections and current balances.",

    enabled: true,

    icon: UserRound,
  },

  {
    id: "monthly-collections",

    title: "Monthly Collections",

    subtitle: "Monthly collection and discount statement.",

    enabled: true,

    icon: CalendarRange,
  },

  {
    id: "outstanding-loans",

    title: "Outstanding Loans",

    subtitle: "Current receivables from active loans.",

    enabled: true,

    icon: CircleDollarSign,
  },

  {
    id: "closed-loans",

    title: "Closed Loans",

    subtitle: "Completed and fully settled loans.",

    enabled: true,

    icon: CheckCircle2,
  },
];

// ============================================================
// SAFE NUMBER
// ============================================================

function safeNumber(value: unknown): number {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, parsed);
}

// ============================================================
// SAFE STRING
// ============================================================

function safeString(value: unknown): string {
  return String(value ?? "").trim();
}

// ============================================================
// CURRENCY
// ============================================================

function formatCurrency(value: number): string {
  return `₹ ${Math.round(safeNumber(value)).toLocaleString("en-IN")}`;
}

// ============================================================
// LOAN LABEL
// ============================================================

function getLoanLabel(loan: Loan): string {
  const loanNumber = safeString(loan.loanNumber || loan.id || "--");

  const status = safeString(loan.status).toUpperCase();

  const outstanding = formatCurrency(safeNumber(loan.outstanding));

  return `${loanNumber} • ${status || "UNKNOWN"} • ${outstanding}`;
}

// ============================================================
// CUSTOMER LABEL
// ============================================================

function getCustomerLabel(customer: CustomerProfile): string {
  const customerName =
    safeString(customer.basic.fullName || customer.basic.displayName) ||
    "Unnamed Customer";

  const customerId = safeString(customer.identity.customerId) || "--";

  const mobile = safeString(customer.basic.mobileNumber) || "--";

  return `${customerName} • ${customerId} • ${mobile}`;
}

// ============================================================
// COMPONENT
// ============================================================

export default function ReportsPage() {
  // ==========================================================
  // FINORA THEME ENGINE
  // ==========================================================

  const { theme } = useTheme();

  const themeVariables = createReportsThemeVariables(theme);

  // ==========================================================
  // RESPONSIVE ENGINE
  // ==========================================================

  const responsive = useResponsive();

  const reportsPageStyles = getReportsPageStyles({
    tokens: responsive.tokens,

    isMobile: responsive.isMobile,

    isTablet: responsive.isTablet,

    isLaptop: responsive.isLaptop,

    isDesktop: responsive.isDesktop,
  });

  const actionIconSize = responsive.tokens.button.iconSize;

  // ==========================================================
  // PLATFORM
  // ==========================================================

  const isNativePlatform = Capacitor.isNativePlatform();

  // ==========================================================
  // REPORT TYPE
  // ==========================================================

  const [selectedReport, setSelectedReport] =
    useState<ReportType>("loan-statement");

  // ==========================================================
  // LOANS
  // ==========================================================

  const [loans, setLoans] = useState<Loan[]>([]);

  // ==========================================================
  // CUSTOMERS
  // ==========================================================

  const [customers, setCustomers] = useState<CustomerProfile[]>([]);

  // ==========================================================
  // SELECTED LOAN
  // ==========================================================

  const [selectedLoanId, setSelectedLoanId] = useState("");

  // ==========================================================
  // SELECTED CUSTOMER
  // ==========================================================

  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  // ==========================================================
  // SELECTED MONTH
  // ==========================================================

  const [selectedMonth, setSelectedMonth] = useState(
    getCurrentReportMonthKey(),
  );

  // ==========================================================
  // LOAN STATEMENT
  // ==========================================================

  const [loanStatement, setLoanStatement] =
    useState<LoanReportStatement | null>(null);

  // ==========================================================
  // CUSTOMER STATEMENT
  // ==========================================================

  const [customerStatement, setCustomerStatement] =
    useState<CustomerReportStatement | null>(null);

  // ==========================================================
  // MONTHLY COLLECTIONS
  // ==========================================================

  const [monthlyReport, setMonthlyReport] =
    useState<MonthlyCollectionsReport | null>(null);

  // ==========================================================
  // OUTSTANDING LOANS
  // ==========================================================

  const [outstandingReport, setOutstandingReport] =
    useState<OutstandingLoansReport | null>(null);

  // ==========================================================
  // CLOSED LOANS
  // ==========================================================

  const [closedLoansReport, setClosedLoansReport] =
    useState<ClosedLoansReport | null>(null);

  // ==========================================================
  // LOADING
  // ==========================================================

  const [loading, setLoading] = useState(true);

  const [loanStatementLoading, setLoanStatementLoading] = useState(false);

  const [customerStatementLoading, setCustomerStatementLoading] =
    useState(false);

  const [monthlyReportLoading, setMonthlyReportLoading] = useState(false);

  const [outstandingReportLoading, setOutstandingReportLoading] =
    useState(false);

  const [closedLoansReportLoading, setClosedLoansReportLoading] =
    useState(false);

  // ==========================================================
  // DATA VERSION
  // ==========================================================

  const [reportDataVersion, setReportDataVersion] = useState(0);

  // ==========================================================
  // ACTION STATE
  // ==========================================================

  const [reportAction, setReportAction] = useState<ReportAction>(null);

  // ==========================================================
  // ERROR
  // ==========================================================

  const [error, setError] = useState("");

  // ==========================================================
  // LOAD REPORT WORKSPACE
  // ==========================================================

  const loadWorkspace = useCallback(async (): Promise<void> => {
    setLoading(true);

    setError("");

    try {
      const storageMode = getAuthenticatedStorageMode();

      const storageActivated =
        await storageManager.selectStorageMode(storageMode);

      if (!storageActivated.success) {
        throw new Error(
          storageActivated.error ??
            `Unable to restore FINORA ${storageMode} storage.`,
        );
      }

      const [snapshot, reportCustomers] = await Promise.all([
        loadReportDataSnapshot(),

        loadCustomerReportCustomers(),
      ]);

      setLoans(snapshot.loans);

      setSelectedLoanId((previousLoanId) => {
        const previousExists = snapshot.loans.some(
          (loan) => safeString(loan.id) === previousLoanId,
        );

        if (previousExists) {
          return previousLoanId;
        }

        return safeString(snapshot.loans[0]?.id);
      });

      setCustomers(reportCustomers);

      setSelectedCustomerId((previousCustomerId) => {
        const previousExists = reportCustomers.some(
          (customer) =>
            safeString(customer.identity.customerId) === previousCustomerId,
        );

        if (previousExists) {
          return previousCustomerId;
        }

        return safeString(reportCustomers[0]?.identity.customerId);
      });
    } catch (loadError) {
      console.error("FINORA REPORTS WORKSPACE LOAD ERROR:", loadError);

      setLoans([]);

      setCustomers([]);

      setSelectedLoanId("");

      setSelectedCustomerId("");

      setLoanStatement(null);

      setCustomerStatement(null);

      setMonthlyReport(null);

      setOutstandingReport(null);

      setClosedLoansReport(null);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load FINORA report data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  // ==========================================================
  // LIVE REFRESH
  // ==========================================================

  useEffect(() => {
    async function refreshReports(): Promise<void> {
      await loadWorkspace();

      setReportDataVersion((previous) => previous + 1);
    }

    function handleReportRefresh(): void {
      void refreshReports();
    }

    window.addEventListener("FINORA_LOAN_UPDATED", handleReportRefresh);

    window.addEventListener("FINORA_COLLECTION_UPDATED", handleReportRefresh);

    window.addEventListener("FINORA_CUSTOMER_UPDATED", handleReportRefresh);

    return () => {
      window.removeEventListener("FINORA_LOAN_UPDATED", handleReportRefresh);

      window.removeEventListener(
        "FINORA_COLLECTION_UPDATED",
        handleReportRefresh,
      );

      window.removeEventListener(
        "FINORA_CUSTOMER_UPDATED",
        handleReportRefresh,
      );
    };
  }, [loadWorkspace]);

  // ==========================================================
  // CLEAR ERROR
  // ==========================================================

  useEffect(() => {
    setError("");
  }, [selectedReport]);

  // ==========================================================
  // LOAD LOAN STATEMENT
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadStatement(): Promise<void> {
      if (selectedReport !== "loan-statement") {
        return;
      }

      if (!selectedLoanId) {
        setLoanStatement(null);

        return;
      }

      setLoanStatementLoading(true);

      setError("");

      try {
        const nextStatement = await buildLoanReportStatement(selectedLoanId);

        if (cancelled) {
          return;
        }

        setLoanStatement(nextStatement);

        if (!nextStatement) {
          setError("Unable to find the selected Loan Statement.");
        }
      } catch (loadError) {
        if (!cancelled) {
          setLoanStatement(null);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load the selected Loan Statement.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoanStatementLoading(false);
        }
      }
    }

    void loadStatement();

    return () => {
      cancelled = true;
    };
  }, [selectedLoanId, selectedReport, reportDataVersion]);

  // ==========================================================
  // LOAD CUSTOMER STATEMENT
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadStatement(): Promise<void> {
      if (selectedReport !== "customer-statement") {
        return;
      }

      if (!selectedCustomerId) {
        setCustomerStatement(null);

        return;
      }

      setCustomerStatementLoading(true);

      setError("");

      try {
        const nextStatement =
          await buildCustomerReportStatement(selectedCustomerId);

        if (cancelled) {
          return;
        }

        setCustomerStatement(nextStatement);

        if (!nextStatement) {
          setError("Unable to find the selected Customer Statement.");
        }
      } catch (loadError) {
        if (!cancelled) {
          setCustomerStatement(null);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load the selected Customer Statement.",
          );
        }
      } finally {
        if (!cancelled) {
          setCustomerStatementLoading(false);
        }
      }
    }

    void loadStatement();

    return () => {
      cancelled = true;
    };
  }, [selectedCustomerId, selectedReport, reportDataVersion]);

  // ==========================================================
  // LOAD MONTHLY COLLECTIONS
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadMonthlyReport(): Promise<void> {
      if (selectedReport !== "monthly-collections") {
        return;
      }

      if (!selectedMonth) {
        setMonthlyReport(null);

        return;
      }

      setMonthlyReportLoading(true);

      setError("");

      try {
        const nextReport = await buildMonthlyCollectionsReport(selectedMonth);

        if (cancelled) {
          return;
        }

        setMonthlyReport(nextReport);
      } catch (loadError) {
        if (!cancelled) {
          setMonthlyReport(null);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load Monthly Collections report.",
          );
        }
      } finally {
        if (!cancelled) {
          setMonthlyReportLoading(false);
        }
      }
    }

    void loadMonthlyReport();

    return () => {
      cancelled = true;
    };
  }, [selectedMonth, selectedReport, reportDataVersion]);

  // ==========================================================
  // LOAD OUTSTANDING LOANS
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadOutstandingReport(): Promise<void> {
      if (selectedReport !== "outstanding-loans") {
        return;
      }

      setOutstandingReportLoading(true);

      setError("");

      try {
        const nextReport = await buildOutstandingLoansReport();

        if (cancelled) {
          return;
        }

        setOutstandingReport(nextReport);
      } catch (loadError) {
        console.error("FINORA OUTSTANDING LOANS LOAD ERROR:", loadError);

        if (!cancelled) {
          setOutstandingReport(null);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load Outstanding Loans report.",
          );
        }
      } finally {
        if (!cancelled) {
          setOutstandingReportLoading(false);
        }
      }
    }

    void loadOutstandingReport();

    return () => {
      cancelled = true;
    };
  }, [selectedReport, reportDataVersion]);

  // ==========================================================
  // LOAD CLOSED LOANS
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadClosedLoansReport(): Promise<void> {
      if (selectedReport !== "closed-loans") {
        return;
      }

      setClosedLoansReportLoading(true);

      setError("");

      try {
        const nextReport = await buildClosedLoansReport();

        if (cancelled) {
          return;
        }

        setClosedLoansReport(nextReport);
      } catch (loadError) {
        console.error("FINORA CLOSED LOANS LOAD ERROR:", loadError);

        if (!cancelled) {
          setClosedLoansReport(null);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load Closed Loans report.",
          );
        }
      } finally {
        if (!cancelled) {
          setClosedLoansReportLoading(false);
        }
      }
    }

    void loadClosedLoansReport();

    return () => {
      cancelled = true;
    };
  }, [selectedReport, reportDataVersion]);

  // ==========================================================
  // OPEN WHATSAPP WEB
  // ==========================================================

  function openWhatsAppWeb(): void {
    window.open("https://web.whatsapp.com/", "_blank");
  }

  // ==========================================================
  // REPORT ACTION
  // ==========================================================

  async function handleReportAction(
    action: Exclude<ReportAction, null>,
  ): Promise<void> {
    if (reportAction !== null) {
      return;
    }

    if (selectedReport === "loan-statement" && !selectedLoanId) {
      return;
    }

    if (selectedReport === "customer-statement" && !selectedCustomerId) {
      return;
    }

    if (selectedReport === "monthly-collections" && !selectedMonth) {
      return;
    }

    setReportAction(action);

    setError("");

    try {
      // ======================================================
      // LOAN STATEMENT
      // ======================================================

      if (selectedReport === "loan-statement") {
        if (action === "download") {
          await downloadLoanStatementPdf(selectedLoanId);

          return;
        }

        if (action === "print") {
          await printLoanStatementPdf(selectedLoanId);

          return;
        }

        if (isNativePlatform) {
          await shareLoanStatementPdf(selectedLoanId);

          return;
        }

        openWhatsAppWeb();

        return;
      }

      // ======================================================
      // CUSTOMER STATEMENT
      // ======================================================

      if (selectedReport === "customer-statement") {
        if (action === "download") {
          await downloadCustomerStatementPdf(selectedCustomerId);

          return;
        }

        if (action === "print") {
          await printCustomerStatementPdf(selectedCustomerId);

          return;
        }

        if (isNativePlatform) {
          await shareCustomerStatementPdf(selectedCustomerId);

          return;
        }

        openWhatsAppWeb();

        return;
      }

      // ======================================================
      // MONTHLY COLLECTIONS
      // ======================================================

      if (selectedReport === "monthly-collections") {
        if (action === "download") {
          await downloadMonthlyCollectionsPdf(selectedMonth);

          return;
        }

        if (action === "print") {
          await printMonthlyCollectionsPdf(selectedMonth);

          return;
        }

        if (isNativePlatform) {
          await shareMonthlyCollectionsPdf(selectedMonth);

          return;
        }

        openWhatsAppWeb();

        return;
      }

      // ======================================================
      // OUTSTANDING LOANS
      // ======================================================

      if (selectedReport === "outstanding-loans") {
        if (action === "download") {
          await downloadOutstandingLoansPdf();

          return;
        }

        if (action === "print") {
          await printOutstandingLoansPdf();

          return;
        }

        if (isNativePlatform) {
          await shareOutstandingLoansPdf();

          return;
        }

        openWhatsAppWeb();

        return;
      }

      // ======================================================
      // CLOSED LOANS
      // ======================================================

      if (selectedReport === "closed-loans") {
        if (action === "download") {
          await downloadClosedLoansPdf();

          return;
        }

        if (action === "print") {
          await printClosedLoansPdf();

          return;
        }

        if (isNativePlatform) {
          await shareClosedLoansPdf();

          return;
        }

        openWhatsAppWeb();

        return;
      }
    } catch (actionError) {
      console.error("FINORA REPORT ACTION ERROR:", actionError);

      const message =
        actionError instanceof Error
          ? actionError.message
          : "Unable to generate the selected report.";

      setError(message);

      alert(message);
    } finally {
      setReportAction(null);
    }
  }

  // ==========================================================
  // ACTION BUTTONS
  // ==========================================================

  function renderReportActions(disabled: boolean) {
    return (
      <div style={reportsPageStyles.actions}>
        <button
          type="button"
          disabled={disabled || reportAction !== null}
          onClick={() => void handleReportAction("download")}
          style={reportsPageStyles.secondaryButton}
        >
          <Download
            size={actionIconSize}
            strokeWidth={2}
            aria-hidden="true"
            style={{
              marginRight: "6px",

              verticalAlign: "middle",
            }}
          />

          {reportAction === "download" ? "GENERATING..." : "DOWNLOAD PDF"}
        </button>

        <button
          type="button"
          disabled={disabled || reportAction !== null}
          onClick={() => void handleReportAction("print")}
          style={reportsPageStyles.secondaryButton}
        >
          <Printer
            size={actionIconSize}
            strokeWidth={2}
            aria-hidden="true"
            style={{
              marginRight: "6px",

              verticalAlign: "middle",
            }}
          />

          {reportAction === "print" ? "OPENING..." : "PRINT"}
        </button>

        <button
          type="button"
          disabled={disabled || reportAction !== null}
          onClick={() => void handleReportAction("share")}
          style={reportsPageStyles.primaryButton}
        >
          <Share2
            size={actionIconSize}
            strokeWidth={2}
            aria-hidden="true"
            style={{
              marginRight: "6px",

              verticalAlign: "middle",
            }}
          />

          {reportAction === "share"
            ? isNativePlatform
              ? "PREPARING..."
              : "OPENING..."
            : isNativePlatform
              ? "SHARE / WHATSAPP"
              : "OPEN WHATSAPP WEB"}
        </button>
      </div>
    );
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <StudioLayout>
        <main
          style={{
            ...reportsPageStyles.page,
            ...themeVariables,
          }}
        >
          <div style={reportsPageStyles.pageInner}>
            <section style={reportsPageStyles.reportPanel}>
              <div style={reportsPageStyles.emptyState}>
                <RefreshCw
                  aria-hidden="true"
                  style={reportsPageStyles.panelIcon}
                />

                <strong style={reportsPageStyles.emptyStateTitle}>
                  Loading Reports Engine
                </strong>

                <span style={reportsPageStyles.loadingText}>
                  Loading authoritative Customer, Loan and Collection data.
                </span>
              </div>
            </section>
          </div>
        </main>
      </StudioLayout>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <StudioLayout>
      <main
        style={{
          ...reportsPageStyles.page,
          ...themeVariables,
        }}
      >
        <div style={reportsPageStyles.pageInner}>
          {/* ==================================================
              HEADER
          ================================================== */}

          <header style={reportsPageStyles.header}>
            <div style={reportsPageStyles.headerContent}>
              <span style={reportsPageStyles.eyebrow}>
                FINORA REPORTS ENGINE™
              </span>

              <h1 style={reportsPageStyles.title}>Reports & Statements</h1>

              <p style={reportsPageStyles.subtitle}>
                Generate authoritative business statements, printable PDFs and
                shareable reports.
              </p>
            </div>
          </header>

          {/* ==================================================
              WORKSPACE
          ================================================== */}

          <div style={reportsPageStyles.workspace}>
            {/* =================================================
                REPORT MENU
            ================================================= */}

            <aside style={reportsPageStyles.reportMenu}>
              <h2 style={reportsPageStyles.reportMenuTitle}>Reports</h2>

              {REPORT_OPTIONS.map((option) => {
                const Icon = option.icon;

                const active = selectedReport === option.id;

                const optionStyle: CSSProperties = {
                  ...reportsPageStyles.reportOption,

                  ...(active ? reportsPageStyles.reportOptionActive : {}),

                  ...(!option.enabled
                    ? {
                        opacity: 0.58,

                        cursor: "not-allowed",
                      }
                    : {}),
                };

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!option.enabled}
                    onClick={() => {
                      if (option.enabled) {
                        setSelectedReport(option.id);
                      }
                    }}
                    style={optionStyle}
                  >
                    <Icon
                      aria-hidden="true"
                      style={reportsPageStyles.reportOptionIcon}
                    />

                    <span style={reportsPageStyles.reportOptionText}>
                      <strong style={reportsPageStyles.reportOptionTitle}>
                        {option.title}
                      </strong>

                      <span style={reportsPageStyles.reportOptionSubtitle}>
                        {option.subtitle}
                      </span>
                    </span>
                  </button>
                );
              })}
            </aside>

            {/* =================================================
                REPORT PANEL
            ================================================= */}

            <section style={reportsPageStyles.reportPanel}>
              {/* ===============================================
                  LOAN STATEMENT
              =============================================== */}

              {selectedReport === "loan-statement" && (
                <>
                  <header style={reportsPageStyles.panelHeader}>
                    <FileText
                      aria-hidden="true"
                      style={reportsPageStyles.panelIcon}
                    />

                    <div style={reportsPageStyles.panelHeading}>
                      <h2 style={reportsPageStyles.panelTitle}>
                        Loan Statement
                      </h2>

                      <p style={reportsPageStyles.panelSubtitle}>
                        Generate a complete Loan, EMI and Collection statement
                        from authoritative FINORA data.
                      </p>
                    </div>
                  </header>

                  {loans.length === 0 ? (
                    <div style={reportsPageStyles.emptyState}>
                      <strong style={reportsPageStyles.emptyStateTitle}>
                        No Loans Available
                      </strong>

                      <span style={reportsPageStyles.emptyStateText}>
                        Loan Statements will become available after at least one
                        Loan exists in FINORA.
                      </span>
                    </div>
                  ) : (
                    <>
                      <div style={reportsPageStyles.controlGrid}>
                        <label style={reportsPageStyles.field}>
                          <span style={reportsPageStyles.label}>
                            Select Loan
                          </span>

                          <select
                            value={selectedLoanId}
                            onChange={(event) =>
                              setSelectedLoanId(event.target.value)
                            }
                            style={reportsPageStyles.select}
                          >
                            {loans.map((loan) => (
                              <option key={loan.id} value={loan.id}>
                                {getLoanLabel(loan)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div style={reportsPageStyles.field}>
                          <span style={reportsPageStyles.label}>
                            Report Status
                          </span>

                          <div
                            style={{
                              ...reportsPageStyles.select,

                              display: "flex",

                              alignItems: "center",
                            }}
                          >
                            {loanStatementLoading
                              ? "Loading..."
                              : loanStatement
                                ? "Ready to Generate"
                                : "Unavailable"}
                          </div>
                        </div>
                      </div>

                      {loanStatementLoading ? (
                        <div style={reportsPageStyles.emptyState}>
                          <span style={reportsPageStyles.loadingText}>
                            Loading selected Loan Statement...
                          </span>
                        </div>
                      ) : loanStatement ? (
                        <div style={reportsPageStyles.preview}>
                          <h3 style={reportsPageStyles.previewTitle}>
                            Statement Preview — {loanStatement.loanNumber}
                          </h3>

                          <div style={reportsPageStyles.metricGrid}>
                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Principal
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {formatCurrency(loanStatement.principal)}
                              </strong>
                            </div>

                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Total Payable
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {formatCurrency(loanStatement.totalPayable)}
                              </strong>
                            </div>

                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Collected
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {formatCurrency(loanStatement.totalCollected)}
                              </strong>
                            </div>

                            <div
                              style={{
                                ...reportsPageStyles.metric,
                                ...reportsPageStyles.outstandingMetric,
                              }}
                            >
                              <span style={reportsPageStyles.metricLabel}>
                                Current Outstanding
                              </span>

                              <strong
                                style={{
                                  ...reportsPageStyles.metricValue,
                                  ...reportsPageStyles.outstandingValue,
                                }}
                              >
                                {formatCurrency(
                                  loanStatement.currentOutstanding,
                                )}
                              </strong>
                            </div>

                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Discount
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {formatCurrency(loanStatement.totalDiscount)}
                              </strong>
                            </div>

                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Settlement Adjustment
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {formatCurrency(
                                  loanStatement.settlementAdjustment,
                                )}
                              </strong>
                            </div>

                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                EMI Rows
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {loanStatement.schedule.length}
                              </strong>
                            </div>

                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Collections
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {loanStatement.collectionCount}
                              </strong>
                            </div>

                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Status
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {safeString(
                                  loanStatement.status,
                                ).toUpperCase() || "--"}
                              </strong>
                            </div>
                          </div>

                          {renderReportActions(false)}
                        </div>
                      ) : null}
                    </>
                  )}
                </>
              )}

              {/* ===============================================
                  CUSTOMER STATEMENT
              =============================================== */}

              {selectedReport === "customer-statement" && (
                <>
                  <header style={reportsPageStyles.panelHeader}>
                    <UserRound
                      aria-hidden="true"
                      style={reportsPageStyles.panelIcon}
                    />

                    <div style={reportsPageStyles.panelHeading}>
                      <h2 style={reportsPageStyles.panelTitle}>
                        Customer Statement
                      </h2>

                      <p style={reportsPageStyles.panelSubtitle}>
                        Generate a complete Customer, Loan and Collection
                        statement using authoritative FINORA records.
                      </p>
                    </div>
                  </header>

                  {customers.length === 0 ? (
                    <div style={reportsPageStyles.emptyState}>
                      <strong style={reportsPageStyles.emptyStateTitle}>
                        No Customers Available
                      </strong>
                    </div>
                  ) : (
                    <>
                      <div style={reportsPageStyles.controlGrid}>
                        <label style={reportsPageStyles.field}>
                          <span style={reportsPageStyles.label}>
                            Select Customer
                          </span>

                          <select
                            value={selectedCustomerId}
                            onChange={(event) =>
                              setSelectedCustomerId(event.target.value)
                            }
                            style={reportsPageStyles.select}
                          >
                            {customers.map((customer) => (
                              <option
                                key={customer.identity.customerId}
                                value={customer.identity.customerId}
                              >
                                {getCustomerLabel(customer)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div style={reportsPageStyles.field}>
                          <span style={reportsPageStyles.label}>
                            Report Status
                          </span>

                          <div
                            style={{
                              ...reportsPageStyles.select,

                              display: "flex",

                              alignItems: "center",
                            }}
                          >
                            {customerStatementLoading
                              ? "Loading..."
                              : customerStatement
                                ? "Ready to Generate"
                                : "Unavailable"}
                          </div>
                        </div>
                      </div>

                      {customerStatementLoading ? (
                        <div style={reportsPageStyles.emptyState}>
                          <span style={reportsPageStyles.loadingText}>
                            Loading selected Customer Statement...
                          </span>
                        </div>
                      ) : customerStatement ? (
                        <div style={reportsPageStyles.preview}>
                          <h3 style={reportsPageStyles.previewTitle}>
                            Statement Preview — {customerStatement.customerName}{" "}
                            • {customerStatement.customerId}
                          </h3>

                          <div style={reportsPageStyles.metricGrid}>
                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Total Loans
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {customerStatement.totalLoans}
                              </strong>
                            </div>

                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Active Loans
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {customerStatement.activeLoans}
                              </strong>
                            </div>

                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Closed Loans
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {customerStatement.closedLoans}
                              </strong>
                            </div>

                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Total Principal
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {formatCurrency(
                                  customerStatement.totalPrincipal,
                                )}
                              </strong>
                            </div>

                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Total Payable
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {formatCurrency(customerStatement.totalPayable)}
                              </strong>
                            </div>

                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Collected
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {formatCurrency(
                                  customerStatement.totalCollected,
                                )}
                              </strong>
                            </div>

                            <div
                              style={{
                                ...reportsPageStyles.metric,
                                ...reportsPageStyles.outstandingMetric,
                              }}
                            >
                              <span style={reportsPageStyles.metricLabel}>
                                Current Outstanding
                              </span>

                              <strong
                                style={{
                                  ...reportsPageStyles.metricValue,
                                  ...reportsPageStyles.outstandingValue,
                                }}
                              >
                                {formatCurrency(
                                  customerStatement.currentOutstanding,
                                )}
                              </strong>
                            </div>

                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Discount
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {formatCurrency(
                                  customerStatement.totalDiscount,
                                )}
                              </strong>
                            </div>

                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Settlement Adjustment
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {formatCurrency(
                                  customerStatement.settlementAdjustment,
                                )}
                              </strong>
                            </div>

                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Collections
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {customerStatement.collectionCount}
                              </strong>
                            </div>

                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Status
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {safeString(
                                  customerStatement.status,
                                ).toUpperCase() || "--"}
                              </strong>
                            </div>

                            <div style={reportsPageStyles.metric}>
                              <span style={reportsPageStyles.metricLabel}>
                                Mobile
                              </span>

                              <strong style={reportsPageStyles.metricValue}>
                                {safeString(customerStatement.mobileNumber) ||
                                  "--"}
                              </strong>
                            </div>
                          </div>

                          {renderReportActions(false)}
                        </div>
                      ) : null}
                    </>
                  )}
                </>
              )}

              {/* ===============================================
                  MONTHLY COLLECTIONS
              =============================================== */}

              {selectedReport === "monthly-collections" && (
                <>
                  <header style={reportsPageStyles.panelHeader}>
                    <CalendarRange
                      aria-hidden="true"
                      style={reportsPageStyles.panelIcon}
                    />

                    <div style={reportsPageStyles.panelHeading}>
                      <h2 style={reportsPageStyles.panelTitle}>
                        Monthly Collections
                      </h2>

                      <p style={reportsPageStyles.panelSubtitle}>
                        Generate the complete collection statement for a
                        selected month using authoritative FINORA Collection
                        records.
                      </p>
                    </div>
                  </header>

                  <div style={reportsPageStyles.controlGrid}>
                    <label style={reportsPageStyles.field}>
                      <span style={reportsPageStyles.label}>Select Month</span>

                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(event) =>
                          setSelectedMonth(event.target.value)
                        }
                        style={reportsPageStyles.select}
                      />
                    </label>

                    <div style={reportsPageStyles.field}>
                      <span style={reportsPageStyles.label}>Report Status</span>

                      <div
                        style={{
                          ...reportsPageStyles.select,

                          display: "flex",

                          alignItems: "center",
                        }}
                      >
                        {monthlyReportLoading
                          ? "Loading..."
                          : monthlyReport
                            ? "Ready to Generate"
                            : "Unavailable"}
                      </div>
                    </div>
                  </div>

                  {monthlyReportLoading ? (
                    <div style={reportsPageStyles.emptyState}>
                      <span style={reportsPageStyles.loadingText}>
                        Loading Monthly Collections...
                      </span>
                    </div>
                  ) : monthlyReport ? (
                    <div style={reportsPageStyles.preview}>
                      <h3 style={reportsPageStyles.previewTitle}>
                        Monthly Preview — {monthlyReport.monthLabel}
                      </h3>

                      <div style={reportsPageStyles.metricGrid}>
                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Transactions
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {monthlyReport.transactionCount}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Customers
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {monthlyReport.customerCount}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Loans
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {monthlyReport.loanCount}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Total Collected
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {formatCurrency(monthlyReport.totalCollected)}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Total Discount
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {formatCurrency(monthlyReport.totalDiscount)}
                          </strong>
                        </div>

                        <div
                          style={{
                            ...reportsPageStyles.metric,
                            ...reportsPageStyles.outstandingMetric,
                          }}
                        >
                          <span style={reportsPageStyles.metricLabel}>
                            Liability Reduction
                          </span>

                          <strong
                            style={{
                              ...reportsPageStyles.metricValue,
                              ...reportsPageStyles.outstandingValue,
                            }}
                          >
                            {formatCurrency(monthlyReport.liabilityReduction)}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Average Collection
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {formatCurrency(monthlyReport.averageCollection)}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Payment Modes
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {monthlyReport.paymentModes.length}
                          </strong>
                        </div>
                      </div>

                      {renderReportActions(false)}
                    </div>
                  ) : null}
                </>
              )}

              {/* ===============================================
                  OUTSTANDING LOANS
              =============================================== */}

              {selectedReport === "outstanding-loans" && (
                <>
                  <header style={reportsPageStyles.panelHeader}>
                    <CircleDollarSign
                      aria-hidden="true"
                      style={reportsPageStyles.panelIcon}
                    />

                    <div style={reportsPageStyles.panelHeading}>
                      <h2 style={reportsPageStyles.panelTitle}>
                        Outstanding Loans
                      </h2>

                      <p style={reportsPageStyles.panelSubtitle}>
                        Generate the current authoritative receivables report
                        from ACTIVE / RUNNING FINORA Loans.
                      </p>
                    </div>
                  </header>

                  <div style={reportsPageStyles.controlGrid}>
                    <div style={reportsPageStyles.field}>
                      <span style={reportsPageStyles.label}>Report Scope</span>

                      <div
                        style={{
                          ...reportsPageStyles.select,

                          display: "flex",

                          alignItems: "center",
                        }}
                      >
                        Active / Running Loans with Outstanding Balance
                      </div>
                    </div>

                    <div style={reportsPageStyles.field}>
                      <span style={reportsPageStyles.label}>Report Status</span>

                      <div
                        style={{
                          ...reportsPageStyles.select,

                          display: "flex",

                          alignItems: "center",
                        }}
                      >
                        {outstandingReportLoading
                          ? "Loading..."
                          : outstandingReport
                            ? "Ready to Generate"
                            : "Unavailable"}
                      </div>
                    </div>
                  </div>

                  {outstandingReportLoading ? (
                    <div style={reportsPageStyles.emptyState}>
                      <span style={reportsPageStyles.loadingText}>
                        Loading authoritative outstanding balances...
                      </span>
                    </div>
                  ) : outstandingReport ? (
                    <div style={reportsPageStyles.preview}>
                      <h3 style={reportsPageStyles.previewTitle}>
                        Outstanding Loans Preview
                      </h3>

                      <div style={reportsPageStyles.metricGrid}>
                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Outstanding Loans
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {outstandingReport.loanCount}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Customers
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {outstandingReport.customerCount}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Total Principal
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {formatCurrency(outstandingReport.totalPrincipal)}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Total Collected
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {formatCurrency(outstandingReport.totalCollected)}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Total Discount
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {formatCurrency(outstandingReport.totalDiscount)}
                          </strong>
                        </div>

                        <div
                          style={{
                            ...reportsPageStyles.metric,
                            ...reportsPageStyles.outstandingMetric,
                          }}
                        >
                          <span style={reportsPageStyles.metricLabel}>
                            Total Outstanding
                          </span>

                          <strong
                            style={{
                              ...reportsPageStyles.metricValue,
                              ...reportsPageStyles.outstandingValue,
                            }}
                          >
                            {formatCurrency(outstandingReport.totalOutstanding)}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Average Outstanding
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {formatCurrency(
                              outstandingReport.averageOutstanding,
                            )}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Highest Outstanding
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {formatCurrency(
                              outstandingReport.highestOutstanding,
                            )}
                          </strong>
                        </div>
                      </div>

                      {renderReportActions(false)}
                    </div>
                  ) : null}
                </>
              )}

              {/* ===============================================
                  CLOSED LOANS
              =============================================== */}

              {selectedReport === "closed-loans" && (
                <>
                  <header style={reportsPageStyles.panelHeader}>
                    <CheckCircle2
                      aria-hidden="true"
                      style={reportsPageStyles.panelIcon}
                    />

                    <div style={reportsPageStyles.panelHeading}>
                      <h2 style={reportsPageStyles.panelTitle}>Closed Loans</h2>

                      <p style={reportsPageStyles.panelSubtitle}>
                        Generate the completed Loan settlement and
                        reconciliation report from authoritative FINORA records.
                      </p>
                    </div>
                  </header>

                  <div style={reportsPageStyles.controlGrid}>
                    <div style={reportsPageStyles.field}>
                      <span style={reportsPageStyles.label}>Report Scope</span>

                      <div
                        style={{
                          ...reportsPageStyles.select,

                          display: "flex",

                          alignItems: "center",
                        }}
                      >
                        All Closed Loans
                      </div>
                    </div>

                    <div style={reportsPageStyles.field}>
                      <span style={reportsPageStyles.label}>Report Status</span>

                      <div
                        style={{
                          ...reportsPageStyles.select,

                          display: "flex",

                          alignItems: "center",
                        }}
                      >
                        {closedLoansReportLoading
                          ? "Loading..."
                          : closedLoansReport
                            ? "Ready to Generate"
                            : "Unavailable"}
                      </div>
                    </div>
                  </div>

                  {closedLoansReportLoading ? (
                    <div style={reportsPageStyles.emptyState}>
                      <span style={reportsPageStyles.loadingText}>
                        Loading closed Loan settlements...
                      </span>
                    </div>
                  ) : closedLoansReport ? (
                    <div style={reportsPageStyles.preview}>
                      <h3 style={reportsPageStyles.previewTitle}>
                        Closed Loans Preview
                      </h3>

                      <div style={reportsPageStyles.metricGrid}>
                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Closed Loans
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {closedLoansReport.loanCount}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Customers
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {closedLoansReport.customerCount}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Collections
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {closedLoansReport.collectionCount}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Total Principal
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {formatCurrency(closedLoansReport.totalPrincipal)}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Total Payable
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {formatCurrency(closedLoansReport.totalPayable)}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Total Collected
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {formatCurrency(closedLoansReport.totalCollected)}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Total Discount
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {formatCurrency(closedLoansReport.totalDiscount)}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Settlement Adjustment
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {formatCurrency(
                              closedLoansReport.settlementAdjustment,
                            )}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Settlement Value
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {formatCurrency(closedLoansReport.settlementValue)}
                          </strong>
                        </div>

                        <div
                          style={{
                            ...reportsPageStyles.metric,

                            ...(closedLoansReport.totalResidualOutstanding === 0
                              ? reportsPageStyles.outstandingMetric
                              : {}),
                          }}
                        >
                          <span style={reportsPageStyles.metricLabel}>
                            Residual Outstanding
                          </span>

                          <strong
                            style={{
                              ...reportsPageStyles.metricValue,

                              ...(closedLoansReport.totalResidualOutstanding ===
                              0
                                ? reportsPageStyles.outstandingValue
                                : {}),
                            }}
                          >
                            {formatCurrency(
                              closedLoansReport.totalResidualOutstanding,
                            )}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Residual Closed Loans
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {closedLoansReport.residualLoanCount}
                          </strong>
                        </div>

                        <div style={reportsPageStyles.metric}>
                          <span style={reportsPageStyles.metricLabel}>
                            Average Collected / Loan
                          </span>

                          <strong style={reportsPageStyles.metricValue}>
                            {formatCurrency(
                              closedLoansReport.averageCollectedPerLoan,
                            )}
                          </strong>
                        </div>
                      </div>

                      {renderReportActions(false)}
                    </div>
                  ) : null}
                </>
              )}

              {/* ===============================================
                  ERROR
              =============================================== */}

              {error && (
                <div style={reportsPageStyles.emptyState}>
                  <strong style={reportsPageStyles.emptyStateTitle}>
                    Report Error
                  </strong>

                  <span style={reportsPageStyles.emptyStateText}>{error}</span>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </StudioLayout>
  );
}

// ============================================================
// END
// ============================================================
