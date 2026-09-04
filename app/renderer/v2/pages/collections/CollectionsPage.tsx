// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTIONS OFFICE™
//
// COLLECTIONS PAGE
//
// RESPONSIBILITY:
//
// - Render Collections Office as the default Collections workspace
// - Load persisted Collection transactions through CollectionService
// - Display collection portfolio statistics
// - Display persisted collection transactions
// - Provide collection type and date filters
// - Refresh collection portfolio
// - Open existing Collection Studio
// - Prepare Collection Details navigation
//
// IMPORTANT:
//
// - No direct repository access.
// - No direct StorageManager access.
// - No direct localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - Existing Collection Studio remains unchanged.
// - Customer Workspace Collection Studio remains unchanged.
// - CollectionService remains the persistence boundary.
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CSSProperties,
} from "react";

import StudioLayout from "../../components/common/layout/StudioLayout";

import { FinoraCalendar } from "../../components/common/calendar";

import {
  finoraWarning,
} from "../../components/common/dialog/finoraDialog.service";

import CollectionStudio from "../../components/customers/office/CustomerOffice/components/CollectionStudio";

import type {
  CollectionReviewData,
} from "../../components/collections/CollectionReviewData";

import {
  loadCollections,
} from "../../services/collection/collectionService";

import {
  getSession,
} from "../../store/authStore";

import {
  resolveBusinessDate,
} from "../../services/business/businessDateService";

import {
  useTheme,
} from "../../themes/provider";

import {
  pageStyle,
  topBarStyle,
  headingGroupStyle,
  pageTitleStyle,
  pageSubtitleStyle,
  createButtonStyle,
  studioWorkspaceStyle,
  studioBackBarStyle,
  studioBackButtonStyle,
  statisticsGridStyle,
  statisticCardStyle,
  statisticLabelStyle,
  statisticValueStyle,
  portfolioStyle,
  portfolioHeaderStyle,
  portfolioTitleStyle,
  portfolioActionsStyle,
  filtersStyle,
  filterFieldStyle,
  filterLabelStyle,
  filterSelectStyle,
  filterActionsStyle,
  clearFilterButtonStyle,
  applyFilterButtonStyle,
  refreshButtonStyle,
  collectionCountStyle,
  tableWrapperStyle,
  tableHeaderStyle,
  tableHeaderCellStyle,
  tableHeaderCenterStyle,
  tableHeaderRightStyle,
  tableBodyStyle,
  tableRowStyle,
  tableCellStyle,
  tableCellCenterStyle,
  tableCellRightStyle,
  serialCellStyle,
  receiptIdentityStyle,
  receiptNumberStyle,
  receiptReferenceStyle,
  customerIdentityStyle,
  customerNameStyle,
  customerPhoneStyle,
  loanIdentityStyle,
  loanNumberStyle,
  loanIdStyle,
  amountStyle,
  collectionTypeBadgeStyle,
  statusBadgeStyle,
  viewButtonStyle,
  emptyStateStyle,
  emptyTitleStyle,
  emptyDescriptionStyle,
  tableFooterStyle,
  tableShowingStyle,
  responsiveMediaQuery,
} from "./CollectionsPage.styles";

/* ============================================================
   TYPES
============================================================ */

type CollectionPageMode =
  | "office"
  | "studio";

type CollectionFilterType =
  | "ALL"
  | "EMI"
  | "MANUAL";

type CollectionRuntimeRecord =
  CollectionReviewData & {
    id?: string;
  };

/* ============================================================
   SAFE NUMBER
============================================================ */

function safeNumber(
  value: number | undefined,
): number {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : 0;
}

/* ============================================================
   CURRENCY
============================================================ */

function formatCurrency(
  value: number | undefined,
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",

      currency: "INR",

      maximumFractionDigits: 0,
    },
  ).format(
    safeNumber(value),
  );
}

/* ============================================================
   DATE
============================================================ */

function formatDate(
  value: string | undefined,
): string {
  if (!value) {
    return "--";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "--";
  }

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    );

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  return `${day}/${month}/${date.getFullYear()}`;
}

/* ============================================================
   DATE FILTER KEY
============================================================ */

function getDateFilterKey(
  value: string | undefined,
): string {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}


/* ============================================================
   COLLECTION DATE
============================================================ */

function getCollectionDate(
  collection: CollectionReviewData,
): string {
  return (
    collection.receiptDate ||
    collection.createdAt ||
    collection.updatedAt ||
    ""
  );
}

/* ============================================================
   COLLECTION TYPE
============================================================ */

function getCollectionType(
  collection: CollectionReviewData,
): "EMI" | "MANUAL" {
  if (
    collection.collectionType ===
    "manual"
  ) {
    return "MANUAL";
  }

  if (
    collection.collectionType ===
    "emi"
  ) {
    return "EMI";
  }

  if (
    Array.isArray(
      collection.selectedEmiNumbers,
    ) &&
    collection.selectedEmiNumbers.length >
      0
  ) {
    return "EMI";
  }

  return "MANUAL";
}

/* ============================================================
   SORT TIME
============================================================ */

function getCollectionSortTime(
  collection: CollectionReviewData,
): number {
  const candidates = [
    collection.updatedAt,
    collection.createdAt,
    collection.receiptDate,
  ];

  for (
    const value of candidates
  ) {
    if (!value) {
      continue;
    }

    const timestamp =
      new Date(
        value,
      ).getTime();

    if (
      Number.isFinite(
        timestamp,
      )
    ) {
      return timestamp;
    }
  }

  return 0;
}

/* ============================================================
   PLUS ICON
============================================================ */

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function CollectionsPage() {
  /* ==========================================================
     ERP BUSINESS DATE
  ========================================================== */

  const activeBusinessDate =
    resolveBusinessDate(
      getSession()
        ?.businessDate,
    ) ?? "";

  /* ==========================================================
     FINORA THEME ENGINE
  ========================================================== */

  const {
    theme,
  } =
    useTheme();

  /* ==========================================================
     PAGE MODE
  ========================================================== */

  const [
    pageMode,
    setPageMode,
  ] =
    useState<CollectionPageMode>(
      "office",
    );

  /* ==========================================================
     COLLECTION STATE
  ========================================================== */

  const [
    collections,
    setCollections,
  ] =
    useState<
      CollectionReviewData[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  /* ==========================================================
     FILTER STATE
  ========================================================== */

  const [
    filterType,
    setFilterType,
  ] =
    useState<CollectionFilterType>(
      "ALL",
    );

  const [
    filterFromDate,
    setFilterFromDate,
  ] =
    useState("");

  const [
    filterToDate,
    setFilterToDate,
  ] =
    useState("");

  const [
    appliedFilterType,
    setAppliedFilterType,
  ] =
    useState<CollectionFilterType>(
      "ALL",
    );

  const [
    appliedFilterFromDate,
    setAppliedFilterFromDate,
  ] =
    useState("");

  const [
    appliedFilterToDate,
    setAppliedFilterToDate,
  ] =
    useState("");

  /* ==========================================================
     THEME VARIABLES
  ========================================================== */

  const themeVariables:
    CSSProperties &
      Record<
        `--${string}`,
        string
      > = {
    "--finora-theme-background-page":
      theme.colors.background.page,

    "--finora-theme-background-surface":
      theme.colors.background.surface,

    "--finora-theme-background-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-surface-strong":
      theme.colors.background.surfaceStrong,

    "--finora-theme-text-primary":
      theme.colors.text.primary,

    "--finora-theme-text-secondary":
      theme.colors.text.secondary,

    "--finora-theme-text-muted":
      theme.colors.text.muted,

    "--finora-theme-text-inverse":
      theme.colors.text.inverse,

    "--finora-theme-border-default":
      theme.colors.border.default,

    "--finora-theme-border-strong":
      theme.colors.border.strong,

    "--finora-theme-border-subtle":
      theme.colors.border.subtle,

    "--finora-theme-brand-primary":
      theme.colors.brand.primary,

    "--finora-theme-brand-accent":
      theme.colors.brand.accent,

    "--finora-theme-brand-accent-soft":
      theme.colors.brand.accentSoft,

    "--finora-theme-success":
      theme.colors.status.success,

    "--finora-theme-success-soft":
      theme.colors.status.successSoft,

    "--finora-theme-warning":
      theme.colors.status.warning,

    "--finora-theme-warning-soft":
      theme.colors.status.warningSoft,

    "--finora-theme-info":
      theme.colors.status.info,

    "--finora-theme-info-soft":
      theme.colors.status.infoSoft,

    "--finora-theme-overlay-shadow":
      theme.colors.overlay.shadow,
  };

  /* ==========================================================
     LOAD COLLECTIONS
  ========================================================== */

  const loadCollectionRecords =
    useCallback(
      async (
        isRefresh = false,
      ): Promise<void> => {
        if (isRefresh) {
          setRefreshing(
            true,
          );
        } else {
          setLoading(
            true,
          );
        }

        try {
          const records =
            await loadCollections();

          const sortedRecords =
            [...records].sort(
              (
                a,
                b,
              ) =>
                getCollectionSortTime(
                  b,
                ) -
                getCollectionSortTime(
                  a,
                ),
            );

          setCollections(
            sortedRecords,
          );
        } catch (error) {
          console.error(
            "FINORA COLLECTIONS OFFICE LOAD ERROR:",
            error,
          );

          setCollections(
            [],
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [],
    );

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadCollectionRecords();
  }, [
    loadCollectionRecords,
  ]);

  /* ==========================================================
     COLLECTION UPDATE LISTENER
  ========================================================== */

  useEffect(() => {
    const handleCollectionUpdate =
      () => {
        void loadCollectionRecords(
          true,
        );
      };

    window.addEventListener(
      "FINORA_COLLECTION_UPDATED",
      handleCollectionUpdate,
    );

    return () => {
      window.removeEventListener(
        "FINORA_COLLECTION_UPDATED",
        handleCollectionUpdate,
      );
    };
  }, [
    loadCollectionRecords,
  ]);

  /* ==========================================================
     STATISTICS
  ========================================================== */

  const statistics =
    useMemo(() => {
      const operationalDate =
        activeBusinessDate;

      const todayCollections =
        collections.filter(
          (collection) =>
            getDateFilterKey(
              getCollectionDate(
                collection,
              ),
            ) === operationalDate,
        );

      const totalCollected =
        collections.reduce(
          (
            total,
            collection,
          ) =>
            total +
            safeNumber(
              collection.paymentAmount,
            ),
          0,
        );

      const totalDiscount =
        collections.reduce(
          (
            total,
            collection,
          ) =>
            total +
            safeNumber(
              collection.discountAmount,
            ),
          0,
        );

      return {
        total:
          collections.length,

        today:
          todayCollections.length,

        collected:
          totalCollected,

        discount:
          totalDiscount,
      };
    }, [
      activeBusinessDate,
      collections,
    ]);

  /* ==========================================================
     FILTERS
  ========================================================== */

  const filteredCollections =
    useMemo(() => {
      return collections.filter(
        (collection) => {
          const type =
            getCollectionType(
              collection,
            );

          if (
            appliedFilterType !==
              "ALL" &&
            type !==
              appliedFilterType
          ) {
            return false;
          }

          const collectionDate =
            getDateFilterKey(
              getCollectionDate(
                collection,
              ),
            );

          if (
            appliedFilterFromDate &&
            (
              !collectionDate ||
              collectionDate <
                appliedFilterFromDate
            )
          ) {
            return false;
          }

          if (
            appliedFilterToDate &&
            (
              !collectionDate ||
              collectionDate >
                appliedFilterToDate
            )
          ) {
            return false;
          }

          return true;
        },
      );
    }, [
      collections,
      appliedFilterType,
      appliedFilterFromDate,
      appliedFilterToDate,
    ]);

  /* ==========================================================
     APPLY FILTER
  ========================================================== */

  async function handleApplyFilters(): Promise<void> {
    if (
      filterFromDate &&
      filterToDate &&
      filterFromDate >
        filterToDate
    ) {
      await finoraWarning(
        "From Date cannot be later than To Date.",
      );

      return;
    }

    setAppliedFilterType(
      filterType,
    );

    setAppliedFilterFromDate(
      filterFromDate,
    );

    setAppliedFilterToDate(
      filterToDate,
    );
  }

  /* ==========================================================
     CLEAR FILTER
  ========================================================== */

  function handleClearFilters(): void {
    setFilterType(
      "ALL",
    );

    setFilterFromDate(
      "",
    );

    setFilterToDate(
      "",
    );

    setAppliedFilterType(
      "ALL",
    );

    setAppliedFilterFromDate(
      "",
    );

    setAppliedFilterToDate(
      "",
    );
  }

  /* ==========================================================
     NEW COLLECTION
  ========================================================== */

  function handleNewCollection(): void {
    setPageMode(
      "studio",
    );
  }

  /* ==========================================================
     BACK TO OFFICE
  ========================================================== */

  function handleBackToOffice(): void {
    setPageMode(
      "office",
    );

    void loadCollectionRecords(
      true,
    );
  }

  /* ==========================================================
     COLLECTION STUDIO
  ========================================================== */

  if (
    pageMode ===
    "studio"
  ) {
    return (
      <StudioLayout
        department="Collections"
        allowScroll={true}
        showHeader={false}
      >
        <div
          style={{
            ...studioWorkspaceStyle,
            ...themeVariables,
          }}
        >
          <div style={studioBackBarStyle}>
            <button
              type="button"
              onClick={
                handleBackToOffice
              }
              style={
                studioBackButtonStyle
              }
            >
              ← Back to Collections Office
            </button>
          </div>

          <CollectionStudio />
        </div>
      </StudioLayout>
    );
  }

  /* ==========================================================
     COLLECTIONS OFFICE
  ========================================================== */

  return (
    <StudioLayout
      department="Collections"
      allowScroll={true}
      showHeader={false}
    >
      <main
        className="finora-collections-office"
        style={{
          ...pageStyle,
          ...themeVariables,
        }}
      >
        {/* ==================================================
            TOP BAR
        ================================================== */}

        <section
          className="finora-collections-top-bar"
          style={topBarStyle}
        >
          <div style={headingGroupStyle}>
            <h1 style={pageTitleStyle}>
              Collections Office
            </h1>

            <p style={pageSubtitleStyle}>
              Manage, review and track customer collections.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleNewCollection
            }
            style={
              createButtonStyle
            }
          >
            <PlusIcon />

            <span>
              New Collection
            </span>
          </button>
        </section>

        {/* ==================================================
            STATISTICS
        ================================================== */}

        <section
          className="finora-collections-statistics"
          style={
            statisticsGridStyle
          }
        >
          <article
            style={
              statisticCardStyle
            }
          >
            <span
              style={
                statisticLabelStyle
              }
            >
              Total Collections
            </span>

            <strong
              style={
                statisticValueStyle
              }
            >
              {statistics.total}
            </strong>
          </article>

          <article
            style={
              statisticCardStyle
            }
          >
            <span
              style={
                statisticLabelStyle
              }
            >
              Today Collections
            </span>

            <strong
              style={
                statisticValueStyle
              }
            >
              {statistics.today}
            </strong>
          </article>

          <article
            style={
              statisticCardStyle
            }
          >
            <span
              style={
                statisticLabelStyle
              }
            >
              Total Collected
            </span>

            <strong
              style={
                statisticValueStyle
              }
            >
              {formatCurrency(
                statistics.collected,
              )}
            </strong>
          </article>

          <article
            style={
              statisticCardStyle
            }
          >
            <span
              style={
                statisticLabelStyle
              }
            >
              Total Discount
            </span>

            <strong
              style={
                statisticValueStyle
              }
            >
              {formatCurrency(
                statistics.discount,
              )}
            </strong>
          </article>
        </section>

        {/* ==================================================
            COLLECTION PORTFOLIO
        ================================================== */}

        <section
          style={
            portfolioStyle
          }
        >
          <header
            className="finora-collections-portfolio-header"
            style={
              portfolioHeaderStyle
            }
          >
            <div
              style={
                portfolioTitleStyle
              }
            >
              <span
                aria-hidden="true"
                style={{
                  width: "3px",

                  height: "16px",

                  flexShrink: 0,

                  borderRadius: "3px",

                  background:
                    "var(--finora-theme-brand-primary)",

                  boxShadow:
                    "0 0 10px var(--finora-theme-overlay-shadow)",
                }}
              />

              Collection Portfolio
            </div>

            <div
              className="finora-collections-portfolio-actions"
              style={
                portfolioActionsStyle
              }
            >
              {/* FILTERS */}

              <div
                className="finora-collections-filters"
                style={
                  filtersStyle
                }
              >
                <div
                  style={
                    filterFieldStyle
                  }
                >
                  <label
                    style={
                      filterLabelStyle
                    }
                  >
                    Type
                  </label>

                  <select
                    value={
                      filterType
                    }
                    onChange={(
                      event,
                    ) => {
                      setFilterType(
                        event.target.value as CollectionFilterType,
                      );
                    }}
                    style={
                      filterSelectStyle
                    }
                  >
                    <option value="ALL">
                      All
                    </option>

                    <option value="EMI">
                      EMI
                    </option>

                    <option value="MANUAL">
                      Manual
                    </option>
                  </select>
                </div>

                <div
                  style={{
                    minWidth: 0,

                    width:
                      "min(100%, 300px)",

                    flex:
                      "0 1 300px",
                  }}
                >
                  <FinoraCalendar
                    mode="range"
                    value={{
                      from:
                        filterFromDate,

                      to:
                        filterToDate,
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
                    ariaLabel="Collections Date Range"
                    showDuration
                  />
                </div>

                <div
                  style={
                    filterActionsStyle
                  }
                >
                  <button
                    type="button"
                    onClick={
                      handleClearFilters
                    }
                    style={
                      clearFilterButtonStyle
                    }
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleApplyFilters
                    }
                    style={
                      applyFilterButtonStyle
                    }
                  >
                    Apply
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  void loadCollectionRecords(
                    true,
                  );
                }}
                disabled={
                  refreshing
                }
                style={
                  refreshButtonStyle
                }
              >
                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>

              <span
                style={
                  collectionCountStyle
                }
              >
                {
                  filteredCollections.length
                }{" "}
                {filteredCollections.length ===
                1
                  ? "Collection"
                  : "Collections"}
              </span>
            </div>
          </header>

          {/* =================================================
              PORTFOLIO CONTENT
          ================================================= */}

          {loading ? (
            <div
              style={
                emptyStateStyle
              }
            >
              <div
                style={
                  emptyTitleStyle
                }
              >
                Loading Collections...
              </div>

              <div
                style={
                  emptyDescriptionStyle
                }
              >
                Reading persisted collection records from FINORA storage.
              </div>
            </div>
          ) : filteredCollections.length ===
            0 ? (
            <div
              style={
                emptyStateStyle
              }
            >
              <div
                style={
                  emptyTitleStyle
                }
              >
                {collections.length ===
                0
                  ? "No Collections Found"
                  : "No Collections Match Filters"}
              </div>

              <div
                style={
                  emptyDescriptionStyle
                }
              >
                {collections.length ===
                0
                  ? "No collection transactions are currently available."
                  : "Change the collection type or date filters to view matching records."}
              </div>
            </div>
          ) : (
            <>
              <div
                style={
                  tableWrapperStyle
                }
              >
                {/* TABLE HEADER */}

                <div
                  style={
                    tableHeaderStyle
                  }
                >
                  <div
                    style={
                      tableHeaderCenterStyle
                    }
                  >
                    S.No.
                  </div>

                  <div
                    style={
                      tableHeaderCellStyle
                    }
                  >
                    Receipt
                  </div>

                  <div
                    style={
                      tableHeaderCellStyle
                    }
                  >
                    Customer
                  </div>

                  <div
                    style={
                      tableHeaderCellStyle
                    }
                  >
                    Loan
                  </div>

                  <div
                    style={
                      tableHeaderCenterStyle
                    }
                  >
                    Type
                  </div>

                  <div
                    style={
                      tableHeaderRightStyle
                    }
                  >
                    Collected
                  </div>

                  <div
                    style={
                      tableHeaderRightStyle
                    }
                  >
                    Outstanding
                  </div>

                  <div
                    style={
                      tableHeaderCenterStyle
                    }
                  >
                    Date
                  </div>

                  <div
                    style={
                      tableHeaderCenterStyle
                    }
                  >
                    Status
                  </div>

                  <div
                    style={
                      tableHeaderCenterStyle
                    }
                  />
                </div>

                {/* TABLE BODY */}

                <div
                  style={
                    tableBodyStyle
                  }
                >
                  {filteredCollections.map(
                    (
                      collection,
                      index,
                    ) => {
                      const runtimeRecord =
                        collection as CollectionRuntimeRecord;

                      const type =
                        getCollectionType(
                          collection,
                        );

                      return (
                        <div
                          key={
                            runtimeRecord.id ||
                            `${collection.receiptNumber}-${collection.loanId}-${collection.createdAt}-${index}`
                          }
                          style={
                            tableRowStyle
                          }
                        >
                          <div
                            style={
                              serialCellStyle
                            }
                          >
                            {index + 1}
                          </div>

                          <div
                            style={
                              receiptIdentityStyle
                            }
                          >
                            <div
                              style={
                                receiptNumberStyle
                              }
                            >
                              {collection.receiptNumber ||
                                "--"}
                            </div>

                            <div
                              style={
                                receiptReferenceStyle
                              }
                            >
                              {collection.paymentReference
                                ? `Ref: ${collection.paymentReference}`
                                : "No reference"}
                            </div>
                          </div>

                          <div
                            style={
                              customerIdentityStyle
                            }
                          >
                            <div
                              style={
                                customerNameStyle
                              }
                            >
                              {collection.customerName ||
                                "--"}
                            </div>

                            <div
                              style={
                                customerPhoneStyle
                              }
                            >
                              {collection.customerPhone ||
                                "--"}
                            </div>
                          </div>

                          <div
                            style={
                              loanIdentityStyle
                            }
                          >
                            <div
                              style={
                                loanNumberStyle
                              }
                            >
                              {collection.loanNumber ||
                                "--"}
                            </div>

                            <div
                              style={
                                loanIdStyle
                              }
                            >
                              {collection.loanId ||
                                "--"}
                            </div>
                          </div>

                          <div
                            style={
                              tableCellCenterStyle
                            }
                          >
                            <span
                              style={
                                collectionTypeBadgeStyle(
                                  type,
                                )
                              }
                            >
                              {type ===
                              "EMI"
                                ? "EMI"
                                : "Manual"}
                            </span>
                          </div>

                          <div
                            style={
                              tableCellRightStyle
                            }
                          >
                            <span
                              style={
                                amountStyle
                              }
                            >
                              {formatCurrency(
                                collection.paymentAmount,
                              )}
                            </span>
                          </div>

                          <div
                            style={
                              tableCellRightStyle
                            }
                          >
                            <span
                              style={
                                amountStyle
                              }
                            >
                              {formatCurrency(
                                collection.outstandingBalance,
                              )}
                            </span>
                          </div>

                          <div
                            style={
                              tableCellCenterStyle
                            }
                          >
                            {formatDate(
                              getCollectionDate(
                                collection,
                              ),
                            )}
                          </div>

                          <div
                            style={
                              tableCellCenterStyle
                            }
                          >
                            <span
                              style={
                                statusBadgeStyle(
                                  collection.status,
                                )
                              }
                            >
                              {collection.status ||
                                "Draft"}
                            </span>
                          </div>

                          <div
                            style={
                              tableCellStyle
                            }
                          >
                            <button
                              type="button"
                              style={
                                viewButtonStyle
                              }
                              onClick={() => {
                                /*
                                 * View Collection Details
                                 * will be connected in the
                                 * next implementation step.
                                 */
                                console.log(
                                  "FINORA VIEW COLLECTION",
                                  collection,
                                );
                              }}
                            >
                              View
                            </button>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              <div
                style={
                  tableFooterStyle
                }
              >
                <span
                  style={
                    tableShowingStyle
                  }
                >
                  Showing 1 to{" "}
                  {
                    filteredCollections.length
                  }{" "}
                  of{" "}
                  {
                    filteredCollections.length
                  }{" "}
                  collections
                </span>
              </div>
            </>
          )}
        </section>

        <style>
          {responsiveMediaQuery}
        </style>
      </main>
    </StudioLayout>
  );
}

// ============================================================
// END
// ============================================================
