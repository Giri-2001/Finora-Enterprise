import { createPortal } from "react-dom";
// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTIONS OFFICE™
//
// RESPONSIBILITY:
// - Default Collections workspace
// - Load persisted Collections through CollectionService
// - Restore authenticated storage contex
// - Statistics
// - Collection filters
// - Collection portfolio
// - Responsive presentation
// - Open existing Collection Studio
// - Open View Collection Details
//
// IMPORTANT:
// - No direct CollectionRepository access.
// - No collection business calculations.
// - CollectionStudioPage remains unchanged.
// ============================================================

import { Capacitor } from "@capacitor/core";
import {
  startFinoraProcessing,
  stopFinoraProcessing,
} from "../../components/common/feedback/finoraProcessing.service";
// FINORA_AP04_R006_R1_ANDROID_PROCESSING
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft as FinoraReceiptBackIcon, Share2 as FinoraReceiptShareIcon } from "lucide-react";
import {
  Copy as FinoraReceiptCopyIcon,
  Download as FinoraReceiptDownloadIcon,
  MessageCircle as FinoraReceiptWhatsAppIcon,
  Eye as FinoraReceiptPreviewIcon,
} from "lucide-react";

import type { CSSProperties } from "react";

import type { CollectionReviewData } from "../../components/collections/CollectionReviewData";

import { loadCollections } from "../../services/collection/collectionService";

import { getSession } from "../../store/authStore";

import {
  resolveBusinessDate,
} from "../../services/business/businessDateService";

import { getBusinessContext } from "../../services/business/businessContextService";
import { loadFinoraServerSettingsIdentity } from "../../services/business/finoraServerSettingsIdentity";

import { storageManager } from "../../storage/storageManager";

import { StorageAvailability, StorageMode } from "../../storage/storage.types";

import StudioLayout from "../../components/common/layout/StudioLayout";

import { FinoraCalendar } from "../../components/common/calendar";

import {
  finoraWarning,
  showFinoraDialog,
} from "../../components/common/dialog/finoraDialog.service";

import ViewCollectionDetails from "../../components/collections/details/ViewCollectionDetails";

import { useTheme } from "../../themes/provider";

import { useLoansOfficeResponsive } from "../../utils/responsive/loansOffice/loansOffice.useResponsive";

import {
  createLoansOfficePageStyle,
  createLoansOfficeTopBarStyle,
  createLoansOfficeStatisticsGridStyle,
  createLoansOfficeStatisticCardStyle,
  createLoansOfficeFiltersGridStyle,
  createLoansOfficePortfolioHeaderStyle,
  createLoansOfficePortfolioActionsStyle,
} from "../../utils/responsive/loansOffice/loansOffice.layout";

import CollectionPortfolioResponsiveRecord from "./components/CollectionPortfolioResponsiveRecord";

import type { Loan } from "../../components/customers/office/CustomerOffice/types";

import { fetchLoans } from "../../services/loan/loanService";

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
  collectionCountStyle,
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
  receiptIdentityStyle,
  receiptNumberStyle,

  customerNameStyle,
  customerPhoneStyle,
  loanIdentityStyle,
  loanNumberStyle,

  amountStyle,
  outstandingStyle,
  collectionTypeBadgeStyle,
  statusBadgeStyle,
  viewButtonStyle,
  emptyStateStyle,
  emptyTitleStyle,
  emptyDescriptionStyle,
  emptyCreateButtonStyle,
  tableFooterStyle,
  tableShowingStyle,
  paginationBarStyle,
  paginationSummaryStyle,
  paginationControlsStyle,
  paginationNavButtonStyle,
  paginationPageButtonStyle,
  paginationEllipsisStyle,
} from "./CollectionsOffice.styles";

// ============================================================
// TYPES
// ============================================================

type CollectionFilterType = "ALL" | "EMI" | "MANUAL";

type RuntimeCollection = CollectionReviewData & {
  id?: string;
};

// ============================================================
// CONSTANTS
// ============================================================

const STORAGE_MODE_SESSION_KEY = "FINORA_STORAGE_MODE";

const COLLECTION_STUDIO_OPEN_EVENT = "FINORA_V2_OPEN_COLLECTION_STUDIO";

const COLLECTIONS_PER_PAGE = 10;

// ============================================================
// STORAGE MODE
// ============================================================

function getAuthenticatedStorageMode(): StorageMode {
  // FINORA_R207_D2_STRICT_AUTHENTICATED_MODE
  // Missing authentication evidence must never imply LOCAL storage.
  let storedMode: string | null;

  try {
    storedMode = window.sessionStorage.getItem(STORAGE_MODE_SESSION_KEY);
  } catch {
    throw new Error("FINORA authenticated storage mode is unavailable.");
  }

  if (
    storedMode === StorageMode.LOCAL ||
    storedMode === StorageMode.USB ||
    storedMode === StorageMode.CLOUD
  ) {
    return storedMode as StorageMode;
  }

  throw new Error("FINORA authenticated storage mode is missing or invalid.");
}

// ============================================================
// HELPERS
// ============================================================

function safeNumber(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatCurrency(value: number | undefined): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",

    currency: "INR",

    maximumFractionDigits: 0,
  }).format(safeNumber(value)).replace(/^\u20B9\s*/, "\u20B9 ");
}

function formatDate(value: string): string {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

function getDateFilterKey(value: string): string {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function getCollectionDate(collection: CollectionReviewData): string {
  return (
    collection.receiptDate || collection.createdAt || collection.updatedAt || ""
  );
}

function getCollectionType(collection: CollectionReviewData): "EMI" | "MANUAL" {
  /*
   * Persisted EMI selection is the strongest evidence tha
   * this transaction belongs to the EMI collection workflow.
   *
   * Older Collection records may still contain
   * collectionType: "manual" because Collection Studio starts
   * from a manual default state.
   *
   * Therefore selectedEmiNumbers must be evaluated first.
   */

  if (
    Array.isArray(collection.selectedEmiNumbers) &&
    collection.selectedEmiNumbers.length > 0
  ) {
    return "EMI";
  }

  if (collection.collectionType === "emi") {
    return "EMI";
  }

  return "MANUAL";
}
function getSortTime(collection: CollectionReviewData): number {
  const values = [
    collection.updatedAt,
    collection.createdAt,
    collection.receiptDate,
  ];

  for (const value of values) {
    if (!value) {
      continue;
    }

    const timestamp = new Date(value).getTime();

    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  return 0;
}

// ============================================================
// ICON
// ============================================================

function PlusIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ============================================================
// COMPONENT
// ============================================================

interface CollectionsOfficeProps {
  collectionCreateDisabled?: boolean;
  collectionCreateTitle?: string;
}

export default function CollectionsOffice({
  collectionCreateDisabled,
  collectionCreateTitle,
}: CollectionsOfficeProps) {
  // ==========================================================
  // ERP BUSINESS DATE
  // ==========================================================

  const activeBusinessDate =
    resolveBusinessDate(
      getSession()
        ?.businessDate,
    ) ?? "";

  const { theme } = useTheme();

  const { tokens: responsiveTokens } = useLoansOfficeResponsive();

  // ==========================================================
  // THEME
  // ==========================================================

  const themeVariables: CSSProperties & Record<`--${string}`, string> = {
    "--finora-theme-background-page": theme.colors.background.page,

    "--finora-theme-page": theme.colors.background.page,

    "--finora-theme-background-surface": theme.colors.background.surface,

    "--finora-theme-surface": theme.colors.background.surface,

    "--finora-theme-background-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-surface-muted": theme.colors.background.surfaceMuted,

    "--finora-theme-text-primary": theme.colors.text.primary,

    "--finora-theme-text-secondary": theme.colors.text.secondary,

    "--finora-theme-text-muted": theme.colors.text.muted,

    "--finora-theme-text-inverse": theme.colors.text.inverse,

    "--finora-theme-border-default": theme.colors.border.default,

    "--finora-theme-border-strong": theme.colors.border.strong,

    "--finora-theme-brand-primary": theme.colors.brand.primary,

    "--finora-theme-brand-accent-soft": theme.colors.brand.accentSoft,

    "--finora-theme-success": theme.colors.status.success,

    "--finora-theme-success-soft": theme.colors.status.successSoft,

    "--finora-theme-info": theme.colors.status.info,

    "--finora-theme-info-soft": theme.colors.status.infoSoft,

    "--finora-theme-warning": theme.colors.status.warning,

    "--finora-theme-warning-soft": theme.colors.status.warningSoft,

    "--finora-theme-overlay-shadow": theme.colors.overlay.shadow,
  };

  // ==========================================================
  // RESPONSIVE
  // ==========================================================

  const responsivePageStyle: CSSProperties = {
    ...pageStyle,

    ...createLoansOfficePageStyle(responsiveTokens),

    ...themeVariables,
  };

  const responsiveTopBarStyle: CSSProperties = {
    ...topBarStyle,

    ...createLoansOfficeTopBarStyle(responsiveTokens),
  };

  const responsiveStatisticsGridStyle: CSSProperties = {
    ...statisticsGridStyle,

    ...createLoansOfficeStatisticsGridStyle(responsiveTokens),

    ...(responsiveTokens.viewport !== "mobile" &&
    responsiveTokens.viewport !== "tablet"
      ? {
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        }
      : {}),
  };

  const responsiveStatisticCardStyle: CSSProperties = {
    ...statisticCardStyle,

    ...createLoansOfficeStatisticCardStyle(responsiveTokens),
  };

  const responsiveFiltersGridStyle: CSSProperties = {
    ...filtersGridStyle,

    ...createLoansOfficeFiltersGridStyle(responsiveTokens),
  };

  const responsivePortfolioHeaderStyle: CSSProperties = {
    ...portfolioHeaderStyle,

    ...createLoansOfficePortfolioHeaderStyle(responsiveTokens),

    paddingTop:
      responsiveTokens.viewport === "mobile"
        ? "18px"
        : responsiveTokens.viewport === "tablet"
          ? "8px"
          : undefined,

    paddingBottom:
      responsiveTokens.viewport === "mobile"
        ? "12px"
        : responsiveTokens.viewport === "tablet"
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
  };

  // ==========================================================
  // STATE
  // ==========================================================

  const [collections, setCollections] = useState<CollectionReviewData[]>([]);

  const [loans, setLoans] = useState<Loan[]>([]);

  const [viewingCollection, setViewingCollection] =
    useState<CollectionReviewData | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);

  const [
    paginationWindowStart,
    setPaginationWindowStart,
  ] = useState(1);

  // ==========================================================
  // FILTERS
  // ==========================================================

  const [filterType, setFilterType] = useState<CollectionFilterType>("ALL");

  const [filterFromDate, setFilterFromDate] = useState("");

  const [filterToDate, setFilterToDate] = useState("");

  const [appliedFilterType, setAppliedFilterType] =
    useState<CollectionFilterType>("ALL");

  const [appliedFilterFromDate, setAppliedFilterFromDate] = useState("");

  const [appliedFilterToDate, setAppliedFilterToDate] = useState("");

  // ==========================================================
  // LOAD
  // ==========================================================

  const loadCollectionRecords = useCallback(
    async (isRefresh = false): Promise<void> => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        // FINORA_R207_D2_NO_DUPLICATE_STORAGE_TRANSITION
        // App owns authenticated mode selection and entitlement checks.
        // Collections verifies the committed context without selecting again.
        const expectedMode = getAuthenticatedStorageMode();

        if (!storageManager.isInitialized()) {
          throw new Error("FINORA authenticated storage is not initialized.");
        }

        if (storageManager.getStorageMode() !== expectedMode) {
          throw new Error("FINORA active storage mode mismatch.");
        }

        const verifiedRevision = storageManager.getLifecycleRevision();
        const verifiedAdapter = storageManager.getActiveAdapter();

        if (!verifiedAdapter) {
          throw new Error("FINORA active storage adapter is unavailable.");
        }

        const storageStatus = await verifiedAdapter.getStatus();

        if (
          storageStatus.availability !== StorageAvailability.READY ||
          storageStatus.mode !== expectedMode
        ) {
          throw new Error("FINORA authenticated storage is not ready.");
        }

        if (
          !storageManager.isInitialized() ||
          storageManager.getLifecycleRevision() !== verifiedRevision ||
          storageManager.getStorageMode() !== expectedMode ||
          storageManager.getActiveAdapter() !== verifiedAdapter
        ) {
          throw new Error("FINORA storage context changed during verification.");
        }

        const [records, loanRecords] = await Promise.all([
          loadCollections(),
          fetchLoans(),
        ]);

        setLoans(loanRecords);

        const sorted = [...records].sort(
          (a, b) => getSortTime(b) - getSortTime(a),
        );

        setCollections(sorted);

        setViewingCollection((currentCollection) => {
          if (!currentCollection) {
            return null;
          }

          const currentRuntime = currentCollection as RuntimeCollection;

          const refreshed = sorted.find((record) => {
            const runtime = record as RuntimeCollection;

            if (currentRuntime.id && runtime.id) {
              return currentRuntime.id === runtime.id;
            }

            return (
              record.receiptNumber === currentCollection.receiptNumber &&
              record.loanId === currentCollection.loanId
            );
          });

          return refreshed ?? currentCollection;
        });
      } catch (error) {
        console.error("FINORA COLLECTIONS OFFICE LOAD ERROR:", error);

        setCollections([]);
        setLoans([]);
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadCollectionRecords();
  }, [loadCollectionRecords]);

  useEffect(() => {
    const handleUpdate = () => {
      void loadCollectionRecords(true);
    };

    window.addEventListener("FINORA_COLLECTION_UPDATED", handleUpdate);
    window.addEventListener("FINORA_LOAN_UPDATED", handleUpdate);

    return () => {
      window.removeEventListener("FINORA_COLLECTION_UPDATED", handleUpdate);
      window.removeEventListener("FINORA_LOAN_UPDATED", handleUpdate);
    };
  }, [loadCollectionRecords]);

  // ==========================================================
  // STATISTICS
  // ==========================================================

      // FINORA_R203_B1_R4
  // Visual correction only for the three vivid themes.
  const finoraR203Vivid =
    theme.id === "royal-navy" ||
    theme.id === "amethyst" ||
    theme.id === "emerald";
const [receiptWorkspaceOpen, setReceiptWorkspaceOpen] = useState(() =>
    window.sessionStorage.getItem("finora:receipt-page:collections") === "1"
  ); // FINORA_R190_C_COLLECTION_NAV
  const [shareReceiptSearch, setShareReceiptSearch] = useState("");
  const [shareReceiptFrom, setShareReceiptFrom] = useState("");
  const [shareReceiptTo, setShareReceiptTo] = useState("");
  const [shareReceiptSelectedKey, setShareReceiptSelectedKey] = useState("");
  const [shareReceiptPreviewUrl, setShareReceiptPreviewUrl] = useState("");
  const [shareReceiptWorking, setShareReceiptWorking] = useState(false);


  const statistics = useMemo(() => {
    const operationalDate = activeBusinessDate;

    const todayCollections = collections.filter(
      (collection) => getDateFilterKey(getCollectionDate(collection)) === operationalDate,
    );

    const totalCollected = collections.reduce(
      (total, collection) => total + safeNumber(collection.paymentAmount),
      0,
    );

    const totalDiscount = collections.reduce(
      (total, collection) => total + safeNumber(collection.discountAmount),
      0,
    );

    const totalOutstanding = loans.reduce((total, loan) => {
      const status = String(loan.status ?? "")
        .trim()
        .toUpperCase();

      const outstanding = safeNumber(loan.outstanding);

      if ((status === "ACTIVE" || status === "RUNNING") && outstanding > 0) {
        return total + outstanding;
      }

      return total;
    }, 0);

    return {
      total: collections.length,
      today: todayCollections.length,
      collected: totalCollected,
      discount: totalDiscount,
      outstanding: totalOutstanding,
    };
  }, [activeBusinessDate, collections, loans]);

  // ==========================================================
  // FILTERED COLLECTIONS
  // ==========================================================

  const filteredCollections = useMemo(() => {
    return collections.filter((collection) => {
      const type = getCollectionType(collection);

      if (appliedFilterType !== "ALL" && appliedFilterType !== type) {
        return false;
      }

      const date = getDateFilterKey(getCollectionDate(collection));

      if (appliedFilterFromDate && (!date || date < appliedFilterFromDate)) {
        return false;
      }

      if (appliedFilterToDate && (!date || date > appliedFilterToDate)) {
        return false;
      }

      return true;
    });
  }, [
    collections,
    appliedFilterType,
    appliedFilterFromDate,
    appliedFilterToDate,
  ]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCollections.length / COLLECTIONS_PER_PAGE),
  );

  const pageStartIndex = (currentPage - 1) * COLLECTIONS_PER_PAGE;

  const paginatedCollections = filteredCollections.slice(
    pageStartIndex,
    pageStartIndex + COLLECTIONS_PER_PAGE,
  );

  const showingFrom = filteredCollections.length === 0 ? 0 : pageStartIndex + 1;

  const showingTo = Math.min(
    pageStartIndex + COLLECTIONS_PER_PAGE,
    filteredCollections.length,
  );

  // ----------------------------------------------------------
  // If records disappear / filters reduce the result count,
  // never leave pagination pointing to an invalid page.
  // ----------------------------------------------------------

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

  // ==========================================================
  // PAGINATION ITEMS
  // ==========================================================

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
  // ACTIONS
  // ==========================================================

  async function handleApplyFilters(): Promise<void> {
    if (filterFromDate && filterToDate && filterFromDate > filterToDate) {
      await finoraWarning("From Date cannot be later than To Date.");

      return;
    }

    setAppliedFilterType(filterType);

    setAppliedFilterFromDate(filterFromDate);

    setAppliedFilterToDate(filterToDate);

    setCurrentPage(1);
  }

  function handleClearFilters(): void {
    setFilterType("ALL");

    setFilterFromDate("");

    setFilterToDate("");

    setAppliedFilterType("ALL");

    setAppliedFilterFromDate("");

    setAppliedFilterToDate("");

    setCurrentPage(1);
  }

  function handleCreateCollection(): void {
    window.dispatchEvent(new CustomEvent(COLLECTION_STUDIO_OPEN_EVENT));
  }

  // ==========================================================
  // VIEW COLLECTION
  // ==========================================================

  const viewingLoan = viewingCollection
    ? loans.find((loan) => loan.id === viewingCollection.loanId)
    : undefined;

  if (viewingCollection) {
    return (
      <StudioLayout
        department="Collections"
        allowScroll={true}
        showHeader={false}
      >
        <ViewCollectionDetails
          collection={viewingCollection}
          loanDocuments={viewingLoan?.documents ?? []}
          onBack={() => setViewingCollection(null)}
        />
      </StudioLayout>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  // FINORA_R160_R1_STANDALONE
  if (receiptWorkspaceOpen) {
    const query = shareReceiptSearch.trim().toLowerCase();

    const filteredReceipts = collections.filter((receipt) => {
      const searchable = [
        receipt.customerName,
        receipt.customerId,
        receipt.receiptNumber,
        receipt.collectionNumber,
        receipt.loanId,
      ]
        .map((value) => String(value ?? ""))
        .join(" ")
        .toLowerCase();

      const receiptDate = String(
        receipt.receiptDate ?? ""
      ).slice(0, 10);

      return (
        (!query || searchable.includes(query)) &&
        (!shareReceiptFrom || receiptDate >= shareReceiptFrom) &&
        (!shareReceiptTo || receiptDate <= shareReceiptTo)
      );
    });
    const receiptAccentCandidate =
      createButtonStyle.backgroundColor ??
      createButtonStyle.background;

    const receiptAccent =
      typeof receiptAccentCandidate === "string"
        ? receiptAccentCandidate
        : "currentColor";
    return (
      <StudioLayout
        department="Collections"
        allowScroll={true}
        showHeader={false}
      >
        <main
          className="finora-receipts-page"
          style={{
            ...responsivePageStyle,
            display: "grid",
            gap: 18,
            alignContent: "start",
          }}
        >
          <header className="finora-receipts-heading">
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  opacity: 0.7,
                  letterSpacing: 1.1,
                }}
              >
                FINORA COLLECTIONS
              </div>

              <h1
                style={{
                  ...pageTitleStyle,
                  fontSize: 24,
                  margin: "7px 0",
                }}
              >
                Share Receipts
              </h1>

              <p style={pageSubtitleStyle}>
                Search and manage your saved collection receipts.
              </p>
            </div>

            <button
              type="button"
              className="finora-receipts-back"
              onClick={() => (window.sessionStorage.removeItem("finora:receipt-page:collections"), setReceiptWorkspaceOpen(false))}
              style={{
                color: finoraR203Vivid
                  ? "var(--finora-theme-text-primary)"
                  : receiptAccent,
                border: finoraR203Vivid
                  ? "1px solid var(--finora-theme-border-strong)"
                  : `1px solid ${receiptAccent}`,
                background: "transparent",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <FinoraReceiptBackIcon size={18} strokeWidth={1.9} aria-hidden="true" />
                Back to Collections
              </span>
            </button>
          </header>

          <section className="finora-receipts-panel">
            <div className="finora-receipts-toolbar">
              <div>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>
                  Receipt Library
                </h2>

                <p style={{
                  fontSize: 12,
                  color: "var(--finora-theme-text-secondary)",
                }}>
                  Find a receipt by customer, number or date.
                </p>
              </div>

              <span className="finora-receipts-count">
                {filteredReceipts.length} Receipts
              </span>
            </div>

            <style>{`
              /* FINORA_R206_B_SAFE_CALENDAR_LAYOUT */
              .finora-receipts-page .finora-receipts-filters {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 12px;
                align-items: end;
                margin: 16px 0;
              }
              .finora-receipts-page .finora-receipts-filters > * {
                box-sizing: border-box;
                min-width: 0;
                max-width: 100%;
              }
              .finora-receipts-page .finora-r206-date-controls {
                grid-column: span 2;
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
                min-width: 0;
              }
              .finora-receipts-page .finora-r206-date-field {
                display: flex;
                flex-direction: column;
                align-items: stretch;
                gap: 7px;
                min-width: 0;
                width: 100%;
              }
              .finora-receipts-page .finora-r206-date-label {
                font-size: 12px;
                font-weight: 650;
                color: var(--finora-theme-text-secondary);
              }
              .finora-receipts-page .finora-r206-date-field > *:last-child {
                width: 100%;
                min-width: 0;
                max-width: 100%;
              }
              .finora-receipts-page .finora-receipts-filters input {
                box-sizing: border-box;
                min-width: 0;
                max-width: 100%;
              }
              .finora-receipts-page .finora-receipts-filters > .finora-receipts-clear {
                display: block;
                position: static;
                grid-column: auto;
                width: 100%;
                min-width: 0;
                min-height: 46px;
                margin: 0;
              }
              @media (max-width: 900px) {
                .finora-receipts-page .finora-receipts-filters {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }
                .finora-receipts-page .finora-r206-date-controls,
                .finora-receipts-page .finora-receipts-filters > .finora-receipts-clear {
                  grid-column: 1 / -1;
                }
              }
              @media (max-width: 560px) {
                .finora-receipts-page .finora-receipts-filters {
                  display: flex;
                  flex-direction: column;
                  align-items: stretch;
                  gap: 12px;
                }
                .finora-receipts-page .finora-receipts-filters > * {
                  width: 100%;
                  min-width: 0;
                  flex: 0 0 auto;
                }
                .finora-receipts-page .finora-r206-date-controls {
                  display: flex;
                  flex-direction: column;
                  gap: 12px;
                  width: 100%;
                }
                .finora-receipts-page .finora-r206-date-field {
                  width: 100%;
                  min-width: 0;
                }
                .finora-receipts-page .finora-receipts-filters > .finora-receipts-clear {
                  display: block;
                  position: static;
                  width: 100%;
                  min-height: 44px;
                  margin: 0;
                }
              }
            `}</style>
            <div className="finora-receipts-filters">
              <label>
                <span>Customer / Receipt Search</span>
                <input
                  type="search"
                  value={shareReceiptSearch}
                  placeholder="Search saved receipts..."
                  onChange={(event) =>
                    setShareReceiptSearch(event.target.value)
                  }
                />
              </label>

              <div className="finora-r206-date-controls">
                <div className="finora-r206-date-field">
                  <span className="finora-r206-date-label">FROM</span>
                  <FinoraCalendar
                    value={shareReceiptFrom}
                    onChange={setShareReceiptFrom}
                    max={shareReceiptTo || undefined}
                    ariaLabel="From Date"
                    placeholder="DD/MM/YYYY"
                    allowClear={false}
                  />
                </div>
                <div className="finora-r206-date-field">
                  <span className="finora-r206-date-label">TO</span>
                  <FinoraCalendar
                    value={shareReceiptTo}
                    onChange={setShareReceiptTo}
                    min={shareReceiptFrom || undefined}
                    ariaLabel="To Date"
                    placeholder="DD/MM/YYYY"
                    allowClear={false}
                  />
                </div>
              </div>
              <button
              type="button"
              className="finora-receipts-clear"
              onClick={() => {
              setShareReceiptSearch("");
              setShareReceiptFrom("");
              setShareReceiptTo("");
              }}
              >
              Clear Filters
              </button>
            </div>
            <div className="finora-receipts-toolbar">


              <span style={{
                fontSize: 12,
                color: "var(--finora-theme-text-secondary)",
              }}>
                Newest firs
              </span>
            </div>

            <div className="finora-receipts-list">
              {filteredReceipts.length === 0 ? (
                <div className="finora-receipts-empty">
                  <strong>No Receipts Found</strong>
                  <span>
                    Saved collections matching your filters
                    will appear here.
                  </span>
                </div>
              ) : (
                filteredReceipts.map((receipt, index) => {
                  const receiptKey = [
                    receipt.loanId,
                    receipt.receiptNumber,
                    index,
                  ].join(":");

                  const selected =
                    shareReceiptSelectedKey === receiptKey;

                  const prepareReceipt = async (
                    action: "preview" | "download" | "share" | "whatsapp",
                  ) => {
                    if (shareReceiptWorking) return;

                    setShareReceiptWorking(true);

                    const androidReceiptProcessing =
                      Capacitor.isNativePlatform() &&
                      Capacitor.getPlatform() === "android";

                    const receiptProcessingId =
                      androidReceiptProcessing
                        ? startFinoraProcessing(
                            action === "preview"
                              ? "Preparing Collection Receipt Preview..."
                              : action === "download"
                                ? "Preparing Collection Receipt PNG..."
                                : action === "whatsapp"
                                  ? "Preparing Receipt for WhatsApp..."
                                  : "Preparing Collection Receipt to Share...",
                          )
                        : null;

                    try {
                      const result =
                        await finoraR161CreateReceiptImage(receipt);

                      if (action === "preview") {
                        setShareReceiptSelectedKey(receiptKey);
                        setShareReceiptPreviewUrl(result.dataUrl);
                        return;
                      }

                      // FINORA_C82_C6_A4_WINDOWS_COLLECTION_WHATSAPP
                      // Windows: copy PNG via existing Electron clipboard bridge.
                      // Android ACTION_SEND remains unchanged.
                      if (
                        action === "whatsapp" &&
                        !androidReceiptProcessing &&
                        /Windows/i.test(navigator.userAgent)
                      ) {
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
                            "Electron native clipboard unavailable. Restart FINORA Enterprise.",
                          );
                        }

                        const copied = await bridge.copyPng(result.dataUrl);

                        if (!copied.ok) {
                          throw new Error(
                            copied.error ?? "Receipt photo clipboard failed.",
                          );
                        }

                        const openWhatsApp = await showFinoraDialog({
                          kind: "success",
                          heading: "Receipt Photo Copied",
                          message: "Open WhatsApp and paste the photo using Ctrl+V.",
                          confirmLabel: "Open WhatsApp",
                          cancelLabel: "Close",
                          showCancel: true,
                        });

                        if (openWhatsApp) {
                          window.open(
                            "https://web.whatsapp.com/",
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }

                        return;
                      }
                      if (
                        androidReceiptProcessing &&
                        (action === "share" || action === "whatsapp")
                      ) {
                        // FINORA_AP04_R025_COLLECTION_NATIVE_SHARE
                        // One original PNG attachment through Android ACTION_SEND.
                        const { Filesystem, Directory } =
                          await import("@capacitor/filesystem");
                        const { Share } =
                          await import("@capacitor/share");

                        if (!result.dataUrl.startsWith("data:image/png;base64,")) {
                          throw new Error("Collection receipt PNG data is invalid.");
                        }

                        const safeFilename = result.filename
                          .replace(/[^a-zA-Z0-9_.-]/g, "_")
                          .slice(0, 120);

                                                // FINORA_C82_B7_COLLECTION_CACHE_NOMEDIA
                        // Exclude temporary share PNGs from Gallery indexing.
                        await Filesystem.writeFile({
                          path: "finora_receipt_share/.nomedia",
                          data: "",
                          directory: Directory.Cache,
                          recursive: true,
                        });
const saved = await Filesystem.writeFile({
                          path:
                            `finora_receipt_share/${Date.now()}_${safeFilename}`,
                          data: result.dataUrl.split(",")[1],
                          directory: Directory.Cache,
                          recursive: true,
                        });

                        if (!saved.uri) {
                          throw new Error("Collection receipt cache URI missing.");
                        }

                        if (receiptProcessingId !== null) {
                          stopFinoraProcessing(receiptProcessingId);
                        }

                        try {
                          await Share.share({
                            title: "FINORA Collection Receipt",
                            files: [saved.uri],
                            dialogTitle: "Share collection receipt photo",
                          });
                        } catch (error) {
                          const detail =
                            error instanceof Error
                              ? error.message
                              : String(error);

                          const name =
                            error instanceof Error ? error.name : "";

                          const cancelled =
                            name === "AbortError" ||
                            name === "Canceled" ||
                            name === "Cancelled" ||
                            /^(share\s+)?cancel(?:ed|led)$/i.test(detail.trim()) ||
                            /^user\s+cancel(?:ed|led)$/i.test(detail.trim());

                          if (!cancelled) {
                            throw error;
                          }
                        }

                        return;
                      }

                      if (action === "download") {
                        if (androidReceiptProcessing) {
                          // FINORA_AP04_R031_COLLECTION_GALLERY_DOWNLOAD
                          const { registerPlugin } =
                            await import("@capacitor/core");

                          const gallery = registerPlugin<{
                            saveReceiptPngToGallery(options: {
                              receiptType: "collection";
                              filename: string;
                              pngBase64: string;
                            }): Promise<{
                              success: boolean;
                              saved?: boolean;
                              album?: string;
                              filename?: string;
                            }>;
                          }>("FinoraControl");

                          if (
                            !result.dataUrl.startsWith(
                              "data:image/png;base64,",
                            )
                          ) {
                            throw new Error(
                              "Collection receipt PNG data is invalid.",
                            );
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
                            receipt.customerName,
                            "Customer",
                          );

                          const collectionNumber = safePart(
                            receipt.collectionNumber ??
                              receipt.receiptNumber,
                            "Collection",
                          );

                          const filename =
                            `${customer}_${collectionNumber}.png`;

                          const saveResult =
                            await gallery.saveReceiptPngToGallery({
                              receiptType: "collection",
                              filename,
                              pngBase64: result.dataUrl.split(",")[1],
                            });

                          if (!saveResult.success || !saveResult.saved) {
                            throw new Error(
                              "Android Gallery did not confirm collection receipt save.",
                            );
                          }

                                                    // FINORA_AP04_R035_R3_COLLECTION_SUCCESS
                          // Show success only after native Gallery save confirms it.
                          // Non-awaited dialog allows processing cleanup to finish.
                          void showFinoraDialog({
                            kind: "success",
                            heading: "Receipt Saved Successfully",
                            message:
                              `Gallery Folder: ${saveResult.album ?? "Finora Collection Receipts"}\n` +
                              `Image: ${saveResult.filename ?? filename}`,
                            confirmLabel: "Done",
                          });
return;
                        }

                                                // FINORA_AP04_R042_WINDOWS_COLLECTION_PICTURES
                        // Save original PNG to the Owner Windows Pictures folder.
                        const picturesBridge = (
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

                        if (!picturesBridge?.savePng) {
                          throw new Error(
                            "Windows Pictures saving is unavailable. Restart the latest FINORA Enterprise EXE.",
                          );
                        }

                        if (
                          !result.dataUrl.startsWith(
                            "data:image/png;base64,",
                          )
                        ) {
                          throw new Error(
                            "Collection Receipt PNG data is invalid.",
                          );
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
                          receipt.customerName,
                          "Customer",
                        );

                        const collectionNumber = safePart(
                          receipt.collectionNumber ??
                            receipt.receiptNumber,
                          "Collection",
                        );

                        const filename =
                          `${customer}_${collectionNumber}.png`;

                        const saved = await picturesBridge.savePng({
                          receiptType: "collection",
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
                            "Windows did not confirm Collection PNG save.",
                          );
                        }

                        // The Electron main process confirmed file creation.
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
                          if (receiptProcessingId !== null) {
                            stopFinoraProcessing(receiptProcessingId);
                          }

                          await navigator.share({
                            files: [file],
                            title: "FINORA Payment Receipt",
                            text: `Receipt ${receipt.receiptNumber}`,
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

                      finoraR161Download(result.blob, result.filename);

                      if (action === "whatsapp") {
                        window.alert(
                          "Receipt PNG downloaded. Attach this image in WhatsApp. Automatic WhatsApp Web file attachment is unavailable.",
                        );
                      } else {
                        window.alert(
                          "Native file sharing is unavailable. Receipt PNG downloaded instead.",
                        );
                      }
                    } catch (error) {
                      // FINORA_AP04_R037_COLLECTION_RED_ERROR
                      console.error("FINORA RECEIPT IMAGE ERROR:", error);

                      if (action === "download") {
                        const reason =
                          error instanceof Error
                            ? error.message
                            : String(error);

                        void showFinoraDialog({
                          kind: "error",
                          heading: "Receipt Download Failed",
                          message:
                            "Collection Receipt PNG could not be saved.\n" +
                            `Reason: ${reason || "Unknown save error"}`,
                          confirmLabel: "Close",
                        });
                      } else {
                        window.alert(
                          "Unable to create the receipt image. No receipt was shared.",
                        );
                      }
                    } finally {
                      if (receiptProcessingId !== null) {
                        stopFinoraProcessing(receiptProcessingId);
                      }

                      setShareReceiptWorking(false);
                    }
                  };

                  return (
                    <article
                      className="finora-receipts-item"
                      key={receiptKey}
                    >
                      <div className="finora-receipts-info">
                        <strong>
                          {receipt.customerName || "Customer"}
                        </strong>

                        <span>
                          {receipt.receiptNumber || "--"}
                        </span>

                        <small>
                          {String(receipt.receiptDate || "--").slice(0, 10)}
                          {" · "}
                          {receipt.paymentMethod || "--"}
                        </small>
                      </div>

                      <div className="finora-receipts-money">
                        {formatCurrency(
                          Number(receipt.paymentAmount || 0)
                        )}
                      </div>

                      <div className="finora-r161-actions">
                        <button
                          type="button"
                          disabled={shareReceiptWorking}
                          onClick={() => void prepareReceipt("preview")}
                        >
                          <FinoraReceiptPreviewIcon size={16} />
                          Preview
                        </button>

                        <button
                          type="button"
                          disabled={shareReceiptWorking}
                          onClick={() => void prepareReceipt("download")}
                        >
                          <FinoraReceiptDownloadIcon size={16} />
                          Download Image
                        </button>



                        <button
                          type="button"
                          className="finora-r161-whatsapp"
                          disabled={shareReceiptWorking}
                          onClick={() => void prepareReceipt("whatsapp")}
                        >
                          {/* FINORA_C82_C6_A8_WINDOWS_COPY_ICON */}
                          {!Capacitor.isNativePlatform() &&
                          /Windows/i.test(navigator.userAgent) ? (
                            <FinoraReceiptCopyIcon size={17} />
                          ) : (
                            <FinoraReceiptWhatsAppIcon size={17} />
                          )}
                          WhatsApp
                        </button>
                      </div>

                      {/* FINORA_C80_B34_B1_RECEIPT_MODAL */}
{selected && shareReceiptPreviewUrl &&
  createPortal(
    <div
      role="presentation"
      onClick={() => {
        setShareReceiptSelectedKey("");
        setShareReceiptPreviewUrl("");
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        boxSizing: "border-box",
        background: "rgba(12, 20, 35, 0.76)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Preview Receipt ${receipt.receiptNumber}`}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setShareReceiptSelectedKey("");
            setShareReceiptPreviewUrl("");
          }
        }}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(520px, 100%)",
          maxHeight: "calc(100dvh - 32px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 18,
          background: "#FFFFFF",
          border: "1px solid rgba(184, 134, 11, 0.3)",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.32)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            padding: "14px 18px",
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <strong
              style={{
                display: "block",
                color: "#122540",
                fontSize: 17,
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              }}
            >
              FINORA Receipt Preview
            </strong>
            <span
              style={{
                display: "block",
                marginTop: 4,
                fontSize: 11,
                color: "#64748B",
                overflowWrap: "anywhere",
              }}
            >
              {receipt.receiptNumber}
            </span>
          </div>
          <button
            type="button"
            aria-label="Close Receipt Preview"
            onClick={() => {
              setShareReceiptSelectedKey("");
              setShareReceiptPreviewUrl("");
            }}
            style={{
              flexShrink: 0,
              padding: "8px 14px",
              borderRadius: 9,
              border: "1px solid #CBD5E1",
              background: "#F1F5F9",
              color: "#122540",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
        <div
          style={{
            minHeight: 0,
            overflow: "auto",
            background: "#E9EDF3",
            padding: 12,
            textAlign: "center",
          }}
        >
          <img
            src={shareReceiptPreviewUrl}
            alt={`FINORA receipt ${receipt.receiptNumber}`}
            style={{
              display: "block",
              width: "100%",
              maxWidth: 460,
              height: "auto",
              margin: "0 auto",
              borderRadius: 10,
              boxShadow: "0 6px 22px rgba(0, 0, 0, 0.12)",
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  )}
                    </article>
                  );
                })
              )}
            </div>
          </section>

          <style>{`
            .finora-receipts-page,
            .finora-receipts-page * {
              box-sizing: border-box;
            }

            .finora-receipts-heading,
            .finora-receipts-toolbar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: wrap;
              gap: 15px;
            }

            .finora-receipts-back,
            .finora-receipts-clear {
              min-height: 44px;
              padding: 10px 16px;
              border-radius: 11px;
              font: inherit;
              font-size: 13px;
              font-weight: 700;
              cursor: pointer;
              transition:
                transform 160ms ease,
                box-shadow 160ms ease,
                background 160ms ease;
            }

            .finora-receipts-clear {
              color: inherit;
              background: rgba(125,135,155,0.08);
              border: 1px solid rgba(135,145,160,0.40);
            }

            .finora-receipts-back:hover,
            .finora-receipts-clear:hover {
              transform: translateY(-1px);
              background: rgba(125,135,155,0.13);
              box-shadow: 0 4px 14px rgba(0,0,0,0.09);
            }

            .finora-receipts-back:focus-visible,
            .finora-receipts-clear:focus-visible {
              outline: 2px solid ${receiptAccent};
              outline-offset: 3px;
            }

            .finora-receipts-panel {
              min-width: 0;
              padding: 19px;
              border-radius: 17px;
              background: rgba(125,135,155,0.045);
              border: 1px solid rgba(135,145,160,0.32);
            }

            .finora-receipts-count {
              font-size: 12px;
              font-weight: 700;
              border: 1px solid rgba(135,145,160,0.38);
              padding: 7px 12px;
              border-radius: 100px;
            }

            .finora-receipts-filters {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
              margin: 18px 0 15px;
            }

            .finora-receipts-filters label {
              display: grid;
              gap: 7px;
              min-width: 0;
              font-size: 12px;
              font-weight: 650;
            }

            .finora-receipts-filters input {
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

            .finora-receipts-filters input:hover,
            .finora-receipts-filters input:focus-visible {
              border-color: ${receiptAccent};
              background: rgba(125,135,155,0.14);
            }

            .finora-receipts-filters input:focus-visible {
              box-shadow: 0 0 0 3px rgba(135,145,160,0.18);
            }

            .finora-receipts-list {
              display: grid;
              gap: 10px;
              margin-top: 18px;
              max-height: 60vh;
              overflow-y: auto;
            }

            .finora-receipts-item {
              min-width: 0;
              padding: 14px;
              border-radius: 12px;
              border: 1px solid rgba(135,145,160,0.3);
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 13px;
              flex-wrap: wrap;
              transition:
                border-color 160ms ease,
                background 160ms ease;
            }

            .finora-receipts-item:hover {
              border-color: ${receiptAccent};
              background: rgba(125,135,155,0.08);
            }

            .finora-receipts-info {
              display: grid;
              gap: 5px;
              min-width: 0;
              overflow-wrap: anywhere;
              font-size: 13px;
            }

            .finora-receipts-info span,
            .finora-receipts-info small {
              /* FINORA_R202_B_RECEIPT_TEXT */
              color: var(--finora-theme-text-secondary);
              opacity: 1;
            }

            .finora-receipts-money {
              font-size: 17px;
              font-weight: 750;
              color: #16A34A;
            }

            .finora-receipts-empty {
              min-height: 190px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              gap: 9px;
              text-align: center;
              font-size: 13px;
              opacity: 0.75;
            }

            .finora-r161-actions {
              display: flex;
              flex-wrap: wrap;
              width: 100%;
              gap: 9px;
              padding-top: 12px;
              border-top: 1px solid rgba(135,145,160,.2);
            }

            .finora-r161-actions button {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 7px;
              border: 1px solid rgba(135,145,160,.4);
              background: rgba(125,135,155,.06);
              color: inherit;
              padding: 10px 13px;
              min-height: 43px;
              border-radius: 10px;
              font-size: 12px;
              font-weight: 700;
              cursor: pointer;
              transition: transform .15s ease, border-color .15s ease;
            }

            .finora-r161-actions button:hover:not(:disabled) {
              transform: translateY(-1px);
              border-color: ${receiptAccent};
            }

            .finora-r161-actions button:disabled {
              opacity: .5;
              cursor: wait;
            }


            .finora-r161-preview {
              width: 100%;
              display: flex;
              justify-content: center;
              padding-top: 12px;
            }

            .finora-r161-preview img {
              display: block;
              width: 100%;
              max-width: 430px;
              height: auto;
              border-radius: 12px;
              box-shadow: 0 8px 26px rgba(0,0,0,.12);
            }

            @media (max-width: 650px) {
              .finora-r161-actions button {
                flex: 1 1 calc(50% - 9px);
              }
            }
            @media (max-width: 1000px) {
              .finora-receipts-filters {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }

            @media (max-width: 650px) {
              .finora-receipts-panel {
                padding: 13px;
              }

              .finora-receipts-filters {
                grid-template-columns: minmax(0, 1fr);
              }

              .finora-receipts-back {
                width: 100%;
              }

              .finora-receipts-money {
                width: 100%;
              }
            }

                        /* FINORA_R201_B_CENTRAL_RECEIPT_THEME
               Presentation only. All colors resolve through
               the authoritative FINORA Theme Engine. */

            .finora-receipts-page {
              color: var(--finora-theme-text-primary, inherit);
            }

            .finora-receipts-panel {
              border-color: var(--finora-theme-border-default, currentColor);
              color: var(--finora-theme-text-primary, inherit);
            }

            .finora-receipts-panel article {
              border-color: var(--finora-theme-border-default, currentColor);
              color: var(--finora-theme-text-primary, inherit);
            }

            .finora-receipts-page .finora-receipts-back {
              color: var(--finora-theme-text-primary, inherit);
              border-color: var(--finora-theme-border-default, currentColor);
            }

            .finora-receipts-page .finora-receipts-count {
              color: var(--finora-theme-text-primary, inherit);
              border-color: var(--finora-theme-border-default, currentColor);
            }

            .finora-receipts-panel input {
              color: var(--finora-theme-text-primary, inherit);
              border-color: var(--finora-theme-border-default, currentColor);
              caret-color: var(--finora-theme-text-primary, currentColor);
            }

            .finora-receipts-panel input::placeholder {
              color: var(--finora-theme-text-secondary, inherit);
              opacity: 1;
            }

            .finora-receipts-panel label {
              color: var(--finora-theme-text-primary, inherit);
            }

            .finora-receipts-page button:not(:disabled) {
              border-color: var(--finora-theme-border-default, currentColor);
            }
@media (prefers-reduced-motion: reduce) {
              .finora-receipts-page * {
                transition: none !important;
              }
            }

            /* FINORA_R192_R1_THEME_BUTTONS */

            .finora-receipts-panel {
              background: var(--finora-theme-background-surface);
              background-color: var(--finora-theme-background-surface);
              background-image: none;
              border-radius: 17px;
            }

            .finora-receipts-panel article {
              background: var(--finora-theme-background-surface);
              background-color: var(--finora-theme-background-surface);
              background-image: none;
            }

            .finora-receipts-back,
            .finora-r192-share-button {
              background: var(--finora-theme-background-surface) !important;
              background-color: var(--finora-theme-background-surface) !important;
              background-image: none !important;
              min-height: 44px;
              border-radius: 11px !important;
              font-size: max(12px, 0.85rem);
              font-weight: 600;
              transition: filter 160ms ease;
            }

            .finora-receipts-back:hover:not(:disabled),
            .finora-r192-share-button:hover:not(:disabled) {
              filter: brightness(1.05);
            }

            .finora-receipts-back:focus-visible,
            .finora-r192-share-button:focus-visible {
              outline: 2px solid currentColor;
              outline-offset: 3px;
            }
`}</style>
        </main>
      </StudioLayout>
    );
  }
  return (
    <StudioLayout
      department="Collections"
      allowScroll={true}
      showHeader={false}
    >
      <main style={responsivePageStyle}>
        {/* HEADER */}

        <section style={responsiveTopBarStyle}>
          <div style={headingGroupStyle}>
            <h1 style={pageTitleStyle}>Collections Office</h1>

            <p style={pageSubtitleStyle}>
              Manage, review and record customer collections.
            </p>
          </div>

                    <div
            className="finora-collection-header-actions"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 10,
              marginLeft: "auto",
              flexWrap: "wrap",
              width:
                responsiveTokens.viewport === "mobile"
                  ? "100%"
                  : undefined,
            }}
          >{/* FINORA_R157_R2_SHARE_BUTTON */}
          <button className="finora-r192-share-button"
            type="button"
            onClick={() => (window.sessionStorage.setItem("finora:receipt-page:collections", "1"), setReceiptWorkspaceOpen(true))}
            style={{
              ...createButtonStyle,
              // FINORA_R163_THEME_LINK
              background: "var(--finora-theme-background-surface)" /* FINORA_R192_R2_OFFICE_BUTTON */,
              color: finoraR203Vivid ? "var(--finora-theme-text-primary)" : (typeof createButtonStyle.backgroundColor === "string"
                  ? createButtonStyle.backgroundColor
                  : typeof createButtonStyle.background === "string"
                    ? createButtonStyle.background
                    : "currentColor"),
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: finoraR203Vivid ? "var(--finora-theme-border-strong)" : (typeof createButtonStyle.backgroundColor === "string"
                  ? createButtonStyle.backgroundColor
                  : typeof createButtonStyle.background === "string"
                    ? createButtonStyle.background
                    : "currentColor"),
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginRight: 0,
              width:
                responsiveTokens.viewport === "mobile"
                  ? "100%"
                  : undefined,
            }}
          >
            <FinoraReceiptShareIcon size={17} />
            Share Receipts
          </button>
<button
            type="button"
            onClick={handleCreateCollection}
            disabled={collectionCreateDisabled}
            title={collectionCreateTitle ?? "New Collection"}
            style={{
              ...createButtonStyle,
              ...(collectionCreateDisabled
                ? { opacity: 0.55, cursor: "not-allowed" }
                : {}),

              width:
                responsiveTokens.viewport === "mobile" ? "100%" : undefined,
            }}
          >
            <PlusIcon />
            New Collection
          </button>
          </div>
        </section>

                {/* STATISTICS */}

        <section style={responsiveStatisticsGridStyle}>
          <article style={responsiveStatisticCardStyle}>
            <span style={statisticLabelStyle}>Total Collections</span>

            <strong style={statisticValueStyle}>{statistics.total}</strong>
          </article>

          <article style={responsiveStatisticCardStyle}>
            <span style={statisticLabelStyle}>Today Collections</span>

            <strong style={statisticValueStyle}>{statistics.today}</strong>
          </article>

          <article style={responsiveStatisticCardStyle}>
            <span style={statisticLabelStyle}>Total Collected</span>

            <strong style={statisticValueStyle}>
              {formatCurrency(statistics.collected)}
            </strong>
          </article>

          <article style={responsiveStatisticCardStyle}>
            <span style={statisticLabelStyle}>Total Discount</span>

            <strong style={statisticValueStyle}>
              {formatCurrency(statistics.discount)}
            </strong>
          </article>

          <article style={responsiveStatisticCardStyle}>
            <span style={statisticLabelStyle}>Total Outstanding</span>

            <strong style={statisticValueStyle}>
              {formatCurrency(statistics.outstanding)}
            </strong>
          </article>
        </section>

        {/* PORTFOLIO */}

        <section
          style={{
            ...portfolioStyle,
            ...(responsiveTokens.viewport === "mobile"
              ? { paddingBottom: "18px" }
              : {}),
          }}
        >
          <header
            style={{
              ...responsivePortfolioHeaderStyle,
              ...(responsiveTokens.viewport === "mobile"
                ? {
                    width: "100%",
                    minHeight: 0,
                    height: "auto",
                    maxHeight: "none",

                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    gap: "12px",
                    overflow: "visible",
                    boxSizing: "border-box",
                  }
                : {}),
            }}
          >
            <div style={portfolioTitleStyle}>
              <span
                style={{
                  width: "3px",

                  height: "16px",

                  borderRadius: "3px",

                  flexShrink: 0,

                  background: theme.colors.brand.primary,

                  boxShadow: `0 0 10px ${theme.colors.overlay.shadow}`,
                }}
              />
              Collection Portfolio
            </div>

            <div
              style={{
                ...responsivePortfolioActionsStyle,
                ...(responsiveTokens.viewport === "mobile"
                  ? {
                      width: "100%",
                      minWidth: 0,
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr)",
                      gap: "8px",
                      alignItems: "stretch",
                      overflow: "visible",
                      boxSizing: "border-box",
                    }
                  : {}),
              }}
            >
              <div
                style={{
                  ...filtersStyle,
                  ...(responsiveTokens.viewport === "mobile"
                    ? {
                        width: "100%",
                        minWidth: 0,
                        margin: 0,
                        display: "block",
                        overflow: "visible",
                        boxSizing: "border-box",
                      }
                    : {}),
                }}
              >
                <div
                  style={{
                    ...responsiveFiltersGridStyle,
                    ...(responsiveTokens.viewport === "mobile"
                      ? {
                          width: "100%",
                          minWidth: 0,
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr)",
                          gap: "8px",
                          alignItems: "stretch",
                          overflow: "visible",
                          boxSizing: "border-box",
                        }
                      : {}),
                  }}
                >
                  <div style={{
                      ...filterFieldStyle,
                      ...(responsiveTokens.viewport === "mobile"
                        ? {
                            width: "100%",
                            minWidth: 0,
                            gridColumn: "1 / -1",
                            boxSizing: "border-box",
                          }
                        : {}),
                    }}>
                    <label style={filterLabelStyle}>Type</label>

                    <select
                      value={filterType}
                      onChange={(event) =>
                        setFilterType(
                          event.target.value as CollectionFilterType,
                        )
                      }
                      style={{
                        ...filterSelectStyle,
                        ...(responsiveTokens.viewport === "mobile"
                          ? {
                              width: "100%",
                              minWidth: 0,
                              boxSizing: "border-box",
                            }
                          : {}),
                      }}
                    >
                      <option value="ALL">All</option>

                      <option value="EMI">EMI</option>

                      <option value="MANUAL">Manual</option>
                    </select>
                  </div>

                  <div
                    style={{
                      gridColumn:
                        responsiveTokens.viewport === "mobile"
                          ? "auto"
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
                        setFilterFromDate(
                          nextRange.from,
                        );

                        setFilterToDate(
                          nextRange.to,
                        );
                      }}
                      fromLabel="From"
                      toLabel="To"
                      placeholder="DD/MM/YYYY"
                      ariaLabel="Collection Portfolio Date Range"
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
                        ...clearFilterButtonStyle,
                        ...(responsiveTokens.viewport === "mobile"
                          ? {
                              width: "100%",
                              minWidth: 0,
                              maxWidth: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "static",
                              visibility: "visible",
                              opacity: 1,
                              gridColumn: "1 / -1",
                              alignSelf: "stretch",
                              boxSizing: "border-box",
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
                        ...applyFilterButtonStyle,
                        ...(responsiveTokens.viewport === "mobile"
                          ? {
                              width: "100%",
                              minWidth: 0,
                              maxWidth: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "static",
                              visibility: "visible",
                              opacity: 1,
                              gridColumn: "1 / -1",
                              alignSelf: "stretch",
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

              <button
                type="button"
                disabled={refreshing}
                onClick={() => void loadCollectionRecords(true)}
                style={{
                        ...refreshButtonStyle,
                        ...(responsiveTokens.viewport === "mobile"
                          ? {
                              width: "100%",
                              minWidth: 0,
                              maxWidth: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "static",
                              visibility: "visible",
                              opacity: 1,
                              gridColumn: "1 / -1",
                              alignSelf: "stretch",
                              boxSizing: "border-box",
                            }
                          : {}),
                      }}
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <span style={{
                ...collectionCountStyle,
                marginBottom:
                  responsiveTokens.viewport === "mobile"
                    ? "10px"
                    : undefined,
                ...(responsiveTokens.viewport === "mobile"
                  ? {
                      width: "100%",
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gridColumn: "1 / -1",
                      alignSelf: "stretch",
                      boxSizing: "border-box",
                    }
                  : {}),
              }}>
                {filteredCollections.length}{" "}
                {filteredCollections.length === 1
                  ? "Collection"
                  : "Collections"}
              </span>
            </div>
          </header>

          {/* CONTENT */}

          {loading ? (
            <div style={emptyStateStyle}>
              <div style={emptyTitleStyle}>Loading Collections...</div>

              <div style={emptyDescriptionStyle}>
                Reading collection records from FINORA storage.
              </div>
            </div>
          ) : filteredCollections.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={emptyTitleStyle}>
                {collections.length === 0
                  ? "No Collections Found"
                  : "No Collections Match Filters"}
              </div>

              <div style={emptyDescriptionStyle}>
                {collections.length === 0
                  ? "Create a new customer collection to begin the portfolio."
                  : "Change the collection type or date filters."}
              </div>

              {collections.length === 0 ? (
                <button
                  type="button"
                  onClick={handleCreateCollection}
            disabled={collectionCreateDisabled}
            title={collectionCreateTitle ?? "New Collection"}
                  style={emptyCreateButtonStyle}
                >
                  New Collection
                </button>
              ) : null}
            </div>
          ) : (
            <>
              {responsiveTokens.layout.tableVisible ? (
                <>
                  <div style={tableWrapperStyle}>
                    <div style={tableHeaderStyle}>
                      <div style={tableHeaderCenterStyle}>S.No</div>

                      <div style={tableHeaderCellStyle}>Receipt</div>

                      <div style={tableHeaderCellStyle}>Customer</div>

                      <div style={tableHeaderCellStyle}>Loan</div>

                      <div style={tableHeaderCenterStyle}>Type</div>

                      <div style={tableHeaderRightStyle}>Collected</div>

                      <div style={tableHeaderRightStyle}>Outstanding</div>

                      <div style={tableHeaderCenterStyle}>Date</div>

                      <div style={tableHeaderCenterStyle}>Status</div>

                      <div style={tableHeaderCenterStyle} />
                    </div>

                    <div style={tableBodyStyle}>
                      {paginatedCollections.map((collection, index) => {
                        const runtime = collection as RuntimeCollection;

                        const type = getCollectionType(collection);

                        return (
                          <div
                            key={
                              runtime.id ||
                              `${collection.receiptNumber}-${collection.loanId}-${index}`
                            }
                            style={{
                              ...tableRowStyle,
                              ...(safeNumber(collection.outstandingBalance) <= 0
                                ? {
                                    borderBottom: `1px solid ${theme.colors.status.danger}`,
                                    background: theme.colors.status.dangerSoft,
                                    boxShadow: `inset 3px 0 0 ${theme.colors.status.danger}`,
                                  }
                                : {}),
                            }}
                          >
                            <div style={serialCellStyle}>{index + 1}</div>

                            <div style={receiptIdentityStyle}>
                              <div style={receiptNumberStyle}>
                                {collection.receiptNumber || "--"}
                              </div>
                            </div>

                            <div style={tableCellStyle}>
                              <div style={customerNameStyle}>
                                {collection.customerName || "--"}
                              </div>

                              <div style={customerPhoneStyle}>
                                {collection.customerPhone || "--"}
                              </div>
                            </div>

                            <div style={loanIdentityStyle}>
                              <div style={loanNumberStyle}>
                                {collection.loanNumber || "--"}
                              </div>
                            </div>

                            <div style={tableCellCenterStyle}>
                              <span style={collectionTypeBadgeStyle(type)}>
                                {type === "EMI" ? "EMI" : "Manual"}
                              </span>
                            </div>

                            <div style={tableCellRightStyle}>
                              <span style={amountStyle}>
                                {formatCurrency(collection.paymentAmount)}
                              </span>
                            </div>

                            <div style={tableCellRightStyle}>
                              <span style={outstandingStyle}>
                                {formatCurrency(collection.outstandingBalance)}
                              </span>
                            </div>

                            <div style={tableCellCenterStyle}>
                              {formatDate(getCollectionDate(collection))}
                            </div>

                            <div style={tableCellCenterStyle}>
                              <span
                                style={{
                                  ...statusBadgeStyle(collection.status),
                                  ...(safeNumber(collection.outstandingBalance) <= 0
                                    ? {
                                        border: `1px solid ${theme.colors.status.danger}`,
                                        background: theme.colors.status.dangerSoft,
                                        color: theme.colors.status.danger,
                                      }
                                    : {}),
                                }}
                              >
                                {safeNumber(collection.outstandingBalance) <= 0
                                  ? "Closed"
                                  : collection.status}
                              </span>
                            </div>

                            <div style={tableCellCenterStyle}>
                              <button
                                type="button"
                                onClick={() => setViewingCollection(collection)}
                                style={viewButtonStyle}
                              >
                                View
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={paginationBarStyle}>
                    <span style={paginationSummaryStyle}>
                      Showing {showingFrom} to {showingTo} of{" "}
                      {filteredCollections.length} collections
                    </span>

                    <div style={paginationControlsStyle}>
                      <button
                        type="button"
                        disabled={!hasPreviousPaginationWindow}
                        onClick={() => {
                          showPreviousPaginationWindow();
                        }}
                        style={{
                          ...paginationNavButtonStyle,

                          opacity: !hasPreviousPaginationWindow ? 0.45 : 1,

                          cursor: !hasPreviousPaginationWindow ? "default" : "pointer",
                        }}
                      >
                        ? Previous
                      </button>

                      {paginationItems.map((item) => {
                        if (
                          item === "ellipsis-start" ||
                          item === "ellipsis-end"
                        ) {
                          return (
                            <span key={item} style={paginationEllipsisStyle}>
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
                            style={paginationPageButtonStyle(
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
                          ...paginationNavButtonStyle,

                          opacity: !hasNextPaginationWindow ? 0.45 : 1,

                          cursor: !hasNextPaginationWindow ? "default" : "pointer",
                        }}
                      >
                        Next ?
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    width: "100%",

                    minWidth: 0,

                    display: "flex",

                    flexDirection: "column",

                    gap: `${responsiveTokens.layout.mobileRecordGap}px`,
                  }}
                >
                  {paginatedCollections.map((collection, index) => {
                    const runtime = collection as RuntimeCollection;

                    return (
                      <CollectionPortfolioResponsiveRecord
                        key={
                          runtime.id ||
                          `${collection.receiptNumber}-${collection.loanId}-${index}`
                        }
                        collection={collection}
                        index={pageStartIndex + index}
                        tokens={responsiveTokens}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        getCollectionType={getCollectionType}
                        onView={setViewingCollection}
                      />
                    );
                  })}

                  <div style={tableFooterStyle}>
                    <span style={tableShowingStyle}>
                      Showing 1 to {filteredCollections.length} of{" "}
                      {filteredCollections.length} collections
                    </span>
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



// FINORA_R161_RECEIPT_IMAGE
// Creates a deterministic compact image from persisted receipt fields.
// Historical EMI states are deliberately not fabricated.

function finoraR161Download(
  blob: Blob,
  filename: string,
): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function finoraR161CreateReceiptImage(
  receipt: CollectionReviewData,
): Promise<{
  blob: Blob;
  dataUrl: string;
  filename: string;
}> {
  // FINORA_R164_FOUR_ROW_PNG
  // All historical values come from the saved Collection record.
  // Never use the current Loan schedule for an old receipt.

  const canvas = document.createElement("canvas");
  canvas.width = 1800;
  canvas.height = 2800; // FINORA_AP04_R009_R1_COLLECTION_READABILITY

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Receipt canvas unavailable.");
  }

  // FINORA_AP04_R021_2K_PNG
  ctx.scale(2, 2);

  const money = (value: number): string =>
    "₹" +
    (Number.isFinite(value) ? value : 0).toLocaleString(
      "en-IN",
      { maximumFractionDigits: 2 },
    );

  const safeText = (value: unknown): string => {
    const text = String(value ?? "").trim();
    return text || "--";
  };

  // FINORA_C80_B34_B3_R1_RECEIPT_IDENTITY
  const formatReceiptDateOnly = (value: unknown): string => {
    const text = safeText(value);
    const dateOnly = text.slice(0, 10);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);

    return match
      ? `${match[3]}-${match[2]}-${match[1]}`
      : text;
  };

  // Use only the authenticated active branch scope.
  // Do not invent Business/Branch identifiers for historical records.
  const receiptContext = getBusinessContext();

  const receiptRuntime = receipt as CollectionReviewData & {
    businessId?: string;
    branchId?: string;
  };

  const collectionBusinessScope =
    typeof receiptRuntime.businessId === "string"
      ? receiptRuntime.businessId.trim()
      : "";

  const collectionBranchScope =
    typeof receiptRuntime.branchId === "string"
      ? receiptRuntime.branchId.trim()
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

  const receiptScopeMatches = Boolean(
    receiptScope &&
    (!collectionBusinessScope ||
      collectionBusinessScope === receiptScope.businessId) &&
    (!collectionBranchScope ||
      collectionBranchScope === receiptScope.branchId),
  );

  let receiptBusinessName = "Not recorded";
  let receiptBranchName = "Not recorded";

  if (receiptScope && receiptScopeMatches) {
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

  const snapshot = receipt.receiptSnapshot;

  const amountReceived = Number(
    snapshot?.amountReceived ?? receipt.paymentAmount ?? 0,
  );

  const remainingBalance = Number(
    snapshot?.remainingOutstanding ??
    receipt.outstandingBalance ??
    0,
  );

  const penaltyReceived = Number(
    snapshot?.penaltyReceived ?? receipt.penaltyAmount ?? 0,
  );

  const previousBalance = snapshot
    ? money(snapshot.previousOutstanding)
    : "Unavailable";

  const installments =
    snapshot?.scheduleAvailable &&
    Array.isArray(snapshot.installments)
      ? [...snapshot.installments].sort(
          (a, b) => a.number - b.number,
        )
      : [];

  const paidStatuses = new Set([
    "paid",
    "overdue paid",
    "preclosed",
  ]);

  const selectedNumbers =
    snapshot?.selectedEmiNumbers?.filter(
      (number) =>
        Number.isSafeInteger(number) && number > 0,
    ) ?? [];

  const selectedRows = selectedNumbers
    .map((number) =>
      installments.find((row) => row.number === number),
    )
    .filter(
      (
        row,
      ): row is NonNullable<typeof row> =>
        row !== undefined,
    );

  const unpaidRows = installments.filter(
    (row) => {
      const remaining =
        row.amount - row.paidAmount - row.waivedAmount;

      return (
        !paidStatuses.has(row.status.toLowerCase()) &&
        remaining > 0.005
      );
    },
  );

  const nextEmi = unpaidRows[0];

  // Preserve exact numbers, including nonconsecutive selection.
  const selectedLabel =
    selectedNumbers.length === 1
      ? `EMI ${String(selectedNumbers[0]).padStart(2, "0")}`
      : selectedNumbers.length > 1
        ? "EMIs " + selectedNumbers.join(", ")
        : "EMI Not Selected";

  // FINORA_R165_OVERDUE_RECEIPT
  // Use the immutable saved status first; never recompute
  // a previously settled EMI from the current Loan.
  const receiptBusinessDate = String(
    receipt.receiptDate ?? "",
  ).slice(0, 10);

  const selectedHasOverdue = selectedRows.some((row) => {
    const recorded = row.status.trim().toLowerCase();
    const due = row.dueDate.slice(0, 10);

    return (
      recorded.includes("overdue") ||
      (
        due.length === 10 &&
        receiptBusinessDate.length === 10 &&
        due < receiptBusinessDate
      )
    );
  });

  const paidStatus =
    !snapshot?.scheduleAvailable
      ? "Snapshot Unavailable"
      : selectedRows.length === 0
        ? "Manual Payment"
        : selectedRows.length === 1
          ? (() => {
              const status = selectedRows[0].status
                .trim()
                .toLowerCase();

              if (status === "overdue paid") {
                return "OVERDUE PAID";
              }

              if (status === "partial" && selectedHasOverdue) {
                return "OVERDUE · PARTIAL";
              }

              if (status === "paid" && selectedHasOverdue) {
                return "OVERDUE PAID";
              }

              return status.toUpperCase();
            })()
          : selectedHasOverdue
            ? "MULTIPLE EMIs · OVERDUE INCLUDED"
            : "MULTIPLE EMI PAYMENTS";

  const nextEmiLabel = nextEmi
    ? `Next EMI ${String(nextEmi.number).padStart(2, "0")}`
    : snapshot?.scheduleAvailable
      ? "Next EMI"
      : "Next EMI Unavailable";

  const nextEmiValue = nextEmi
    ? money(
        Math.max(
          0,
          nextEmi.amount -
            nextEmi.paidAmount -
            nextEmi.waivedAmount,
        ),
      ) +
        (nextEmi.dueDate
          ? " · " + formatReceiptDateOnly(nextEmi.dueDate)
          : "")
    : snapshot?.scheduleAvailable
      ? "No Unpaid EMI"
      : "Unavailable";

  const remainingEmis =
    snapshot?.scheduleAvailable &&
    snapshot.remainingEmis !== null &&
    snapshot.totalEmis !== null
      ? `${snapshot.remainingEmis} / ${snapshot.totalEmis}`
      : "Unavailable";

  const summaryRows: Array<{
    label: string;
    value: string;
    color: string;
  }> = [
    {
      label: selectedLabel,
      value: paidStatus,
      color:
        paidStatus === "PAID" ||
        paidStatus === "OVERDUE PAID"
          ? "#15803d"
          : "#B77908",
    },
    {
      label: nextEmiLabel,
      value: nextEmiValue,
      color: "#B77908",
    },
    {
      label: "Remaining EMIs",
      value: remainingEmis,
      color: "#11243d",
    },
    {
      label: "Outstanding Balance",
      value: money(remainingBalance),
      color: "#11243d",
    },
  ];

  const drawText = (
    value: string,
    x: number,
    y: number,
    maxWidth: number,
    align: CanvasTextAlign = "left",
  ): void => {
    ctx.textAlign = align;
    ctx.fillText(value, x, y, maxWidth);
  };

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 900, 1400);

  // Brand header
  ctx.fillStyle = "#11243d";
  ctx.fillRect(0, 0, 900, 150);

  ctx.fillStyle = "#E9BF69";
  ctx.font = "bold 44px Arial, sans-serif";
  drawText("F I N O R A", 450, 72, 820, "center");

  ctx.fillStyle = "#ffffff";
  ctx.font = "23px Arial, sans-serif";
  drawText(
    "OFFICIAL PAYMENT RECEIPT",
    450,
    115,
    820,
    "center",
  );

  // FINORA_C80_B34_B3_R1_PREMIUM_IDENTITY_HEADER
  ctx.fillStyle = "#667085";
  ctx.font = "500 23px Arial, sans-serif";
  drawText("BUSINESS NAME", 42, 184, 390);
  drawText("BRANCH NAME", 858, 184, 390, "right");

  ctx.fillStyle = "#11243d";
  ctx.font = "650 29px Arial, sans-serif";
  drawText(receiptBusinessName, 42, 220, 390);
  drawText(receiptBranchName, 858, 220, 390, "right");

  ctx.strokeStyle = "#E4E7EC";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(42, 248);
  ctx.lineTo(858, 248);
  ctx.stroke();

  // Shift the original persisted receipt body down intact.
  ctx.save();
  ctx.translate(0, 95);
  // Payment amoun
  ctx.fillStyle = "#15803d";
  ctx.font = "bold 54px Arial, sans-serif";
  drawText(money(amountReceived), 450, 222, 815, "center");

  ctx.fillStyle = "#667085";
  ctx.font = "22px Arial, sans-serif";
  drawText(
    "PAYMENT RECEIVED",
    450,
    266,
    815,
    "center",
  );
  // Customer and receipt metadata
  const details: Array<[string, string]> = [
    ["Customer", safeText(receipt.customerName)],
    ["Receipt Number", safeText(receipt.receiptNumber)],
    ["Collection Number", safeText(receipt.collectionNumber)],
    [
      "Collection Date",
      formatReceiptDateOnly(receipt.receiptDate),
    ],
    ["Payment Mode", safeText(receipt.paymentMethod)],
  ];

  const detailsStartY = 329;
  const detailsRowHeight = 58;

  details.forEach(([label, value], index) => {
    const y = detailsStartY + index * detailsRowHeight;

    ctx.fillStyle = "#667085";
    ctx.font = "27px Arial, sans-serif";
    drawText(label, 42, y, 220);

    ctx.fillStyle = "#11243d";
    ctx.font = "bold 27px Arial, sans-serif";
    drawText(value, 285, y, 568);
  });

  // Premium spacing after Payment Mode
  const balancePanelTop =
    detailsStartY +
    details.length * detailsRowHeight +
    28;

  // Balance and penalty information
  ctx.fillStyle = "#f3f6fa";
  ctx.fillRect(34, balancePanelTop, 832, 118);

  ctx.fillStyle = "#667085";
  ctx.font = "26px Arial, sans-serif";
  drawText(
    "Previous Outstanding",
    52,
    balancePanelTop + 43,
    315,
  );

  ctx.fillStyle = "#11243d";
  ctx.font = "bold 27px Arial, sans-serif";
  drawText(
    previousBalance,
    850,
    balancePanelTop + 43,
    290,
    "right",
  );

  ctx.fillStyle = "#667085";
  ctx.font = "26px Arial, sans-serif";
  drawText(
    "Late Fee Received",
    52,
    balancePanelTop + 89,
    315,
  );

  ctx.fillStyle = "#11243d";
  ctx.font = "bold 27px Arial, sans-serif";
  drawText(
    money(penaltyReceived),
    850,
    balancePanelTop + 89,
    290,
    "right",
  );

  // EMI summary
  const summaryHeadingY = balancePanelTop + 170;

  ctx.fillStyle = "#11243d";
  ctx.font = "bold 31px Arial, sans-serif";
  drawText(
    "EMI PAYMENT SUMMARY",
    42,
    summaryHeadingY,
    810,
  );

  const tableTop = summaryHeadingY + 24;
  const rowHeight = 72;

  summaryRows.forEach((row, index) => {
    const y = tableTop + index * rowHeight;

    ctx.fillStyle =
      index === 3
        ? "#EDF2F8"
        : index % 2 === 0
          ? "#F8FAFC"
          : "#ffffff";

    ctx.fillRect(34, y, 832, rowHeight);

    ctx.fillStyle = "#475467";
    ctx.font =
      index === 3
        ? "bold 26px Arial, sans-serif"
        : "25px Arial, sans-serif";

    drawText(
      row.label,
      49,
      y + 45,
      380,
    );

    ctx.fillStyle = row.color;
    ctx.font = "bold 27px Arial, sans-serif";
    drawText(
      row.value,
      851,
      y + 45,
      440,
      "right",
    );
  });

  const footerInfoY =
    tableTop +
    summaryRows.length * rowHeight +
    54;

  ctx.fillStyle = "#667085";
  ctx.font = "20px Arial, sans-serif";
  drawText(
    snapshot?.scheduleAvailable
      ? "EMI details captured at payment time"
      : "EMI details unavailable for this receipt",
    450,
    footerInfoY,
    810,
    "center",
  );

  ctx.fillStyle = "#B8860B";
  ctx.font = "bold 24px Arial, sans-serif";
  drawText(
    "Thank you for your payment",
    450,
    footerInfoY + 42,
    810,
    "center",
  );

  ctx.restore();

  const blob = await new Promise<Blob>(
    (resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("PNG encoding failed."));
          }
        },
        "image/png",
      );
    },
  );

  const filename =
    "FINORA_" +
    String(receipt.receiptNumber || "RECEIPT")
      .replace(/[^A-Za-z0-9_-]/g, "_") +
    ".png";

  return {
    blob,
    dataUrl: canvas.toDataURL("image/png"),
    filename,
  };
}
