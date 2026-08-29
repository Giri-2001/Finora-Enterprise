// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTIONS OFFICE™
//
// RESPONSIBILITY:
// - Default Collections workspace
// - Load persisted Collections through CollectionService
// - Restore authenticated storage context
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

import { useCallback, useEffect, useMemo, useState } from "react";

import type { CSSProperties } from "react";

import type { CollectionReviewData } from "../../components/collections/CollectionReviewData";

import { loadCollections } from "../../services/collection/collectionService";

import { storageManager } from "../../storage/storageManager";

import { StorageMode } from "../../storage/storage.types";

import StudioLayout from "../../components/common/layout/StudioLayout";

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
  filterDateInputStyle,
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
  receiptReferenceStyle,
  customerNameStyle,
  customerPhoneStyle,
  loanIdentityStyle,
  loanNumberStyle,
  loanIdStyle,
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
  }).format(safeNumber(value));
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
   * Persisted EMI selection is the strongest evidence that
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

export default function CollectionsOffice() {
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
        const storageMode = getAuthenticatedStorageMode();

        const storageActivated =
          await storageManager.selectStorageMode(storageMode);

        if (!storageActivated.success) {
          throw new Error(
            storageActivated.error ??
              `Unable to restore FINORA ${storageMode} storage.`,
          );
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

  const statistics = useMemo(() => {
    const today = getDateFilterKey(new Date().toISOString());

    const todayCollections = collections.filter(
      (collection) => getDateFilterKey(getCollectionDate(collection)) === today,
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
  }, [collections, loans]);

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
  }, [currentPage, totalPages]);

  // ==========================================================
  // PAGINATION ITEMS
  // ==========================================================

  const paginationItems = useMemo<
    Array<number | "ellipsis-start" | "ellipsis-end">
  >(() => {
    if (totalPages <= 7) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, index) => index + 1,
      );
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
  // ACTIONS
  // ==========================================================

  function handleApplyFilters(): void {
    if (filterFromDate && filterToDate && filterFromDate > filterToDate) {
      alert("From Date cannot be later than To Date.");

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

          <button
            type="button"
            onClick={handleCreateCollection}
            style={{
              ...createButtonStyle,

              width:
                responsiveTokens.viewport === "mobile" ? "100%" : undefined,
            }}
          >
            <PlusIcon />
            New Collection
          </button>
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

        <section style={portfolioStyle}>
          <header style={responsivePortfolioHeaderStyle}>
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

            <div style={responsivePortfolioActionsStyle}>
              <div style={filtersStyle}>
                <div style={responsiveFiltersGridStyle}>
                  <div style={filterFieldStyle}>
                    <label style={filterLabelStyle}>Type</label>

                    <select
                      value={filterType}
                      onChange={(event) =>
                        setFilterType(
                          event.target.value as CollectionFilterType,
                        )
                      }
                      style={filterSelectStyle}
                    >
                      <option value="ALL">All</option>

                      <option value="EMI">EMI</option>

                      <option value="MANUAL">Manual</option>
                    </select>
                  </div>

                  <div style={filterFieldStyle}>
                    <label style={filterLabelStyle}>From</label>

                    <input
                      type="date"
                      value={filterFromDate}
                      onChange={(event) =>
                        setFilterFromDate(event.target.value)
                      }
                      style={filterDateInputStyle}
                    />
                  </div>

                  <div style={filterFieldStyle}>
                    <label style={filterLabelStyle}>To</label>

                    <input
                      type="date"
                      value={filterToDate}
                      onChange={(event) => setFilterToDate(event.target.value)}
                      style={filterDateInputStyle}
                    />
                  </div>

                  <div style={filterActionsStyle}>
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      style={clearFilterButtonStyle}
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      onClick={handleApplyFilters}
                      style={applyFilterButtonStyle}
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
                style={refreshButtonStyle}
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <span style={collectionCountStyle}>
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
                      <div style={tableHeaderCenterStyle}>S.No.</div>

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
                            style={tableRowStyle}
                          >
                            <div style={serialCellStyle}>{index + 1}</div>

                            <div style={receiptIdentityStyle}>
                              <div style={receiptNumberStyle}>
                                {collection.receiptNumber || "--"}
                              </div>

                              <div style={receiptReferenceStyle}>
                                {collection.paymentReference
                                  ? `Ref: ${collection.paymentReference}`
                                  : "No reference"}
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

                              <div style={loanIdStyle}>
                                {collection.loanId || "--"}
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
                              <span style={statusBadgeStyle(collection.status)}>
                                {collection.status}
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
                        disabled={currentPage === 1}
                        onClick={() => {
                          setCurrentPage((page) => Math.max(1, page - 1));
                        }}
                        style={{
                          ...paginationNavButtonStyle,

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
                        disabled={currentPage === totalPages}
                        onClick={() => {
                          setCurrentPage((page) =>
                            Math.min(totalPages, page + 1),
                          );
                        }}
                        style={{
                          ...paginationNavButtonStyle,

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
