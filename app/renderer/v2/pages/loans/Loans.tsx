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
// IMPORTANT:
// - No V1 Loans.tsx usage.
// - No V1 loanStore.
// - No direct localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - Persistence remains behind LoanRepository.
// - UI logic preserved.
// - Premium presentation only.
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Loan,
} from "../../components/customers/office/CustomerOffice/types";

import {
  getLoans,
} from "../../repositories/loan/loanRepository";

import StudioLayout
  from "../../components/common/layout/StudioLayout";

import ViewLoanDetails
  from "../../components/loans/details/ViewLoanDetails";

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

function safeNumber(
  value: number | undefined,
): number {

  return (
    typeof value === "number" &&
    Number.isFinite(value)
  )
    ? value
    : 0;

}


// ============================================================
// CURRENCY
// ============================================================

function formatCurrency(
  value: number,
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


// ============================================================
// DATE FORMATTER
// ============================================================

function formatDate(
  value: string,
): string {

  if (!value) {

    return "--";

  }


  const date =
    new Date(
      value,
    );


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


  const year =
    date.getFullYear();


  return `${day}/${month}/${year}`;

}


// ============================================================
// DATE FILTER KEY
// ============================================================

function getDateFilterKey(
  value: string,
): string {

  if (!value) {

    return "";

  }


  const date =
    new Date(
      value,
    );


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


// ============================================================
// LOAN TYPE
// ============================================================

function formatLoanType(
  loan: Loan,
): string {

  const value =
    (
      loan.loanType ||
      loan.repaymentType ||
      ""
    )
      .trim()
      .toUpperCase();


  if (
    value === "DAILY"
  ) {

    return "DAILY";

  }


  if (
    value === "WEEKLY"
  ) {

    return "WEEKLY";

  }


  if (
    value === "MONTHLY"
  ) {

    return "MONTHLY";

  }


  return (
    value ||
    "--"
  );

}


// ============================================================
// LOAN TITLE
// ============================================================

function formatLoanTitle(
  loan: Loan,
): string {

  if (
    loan.title &&
    loan.title.trim()
  ) {

    return loan.title;

  }


  const type =
    formatLoanType(
      loan,
    );


  if (
    type === "DAILY"
  ) {

    return "Daily Loan";

  }


  if (
    type === "WEEKLY"
  ) {

    return "Weekly Loan";

  }


  if (
    type === "MONTHLY"
  ) {

    return "Monthly Loan";

  }


  return "Loan";

}


// ============================================================
// STATUS
// ============================================================

type LoanFilterStatus =
  | "ALL"
  | "RUNNING"
  | "CLOSED";


function isRunningLoan(
  loan: Loan,
): boolean {

  return (
    loan.status === "ACTIVE" ||
    loan.status === "RUNNING"
  );

}


function isClosedLoan(
  loan: Loan,
): boolean {

  return (
    loan.status === "CLOSED"
  );

}


function formatStatus(
  loan: Loan,
): string {

  if (
    isClosedLoan(
      loan,
    )
  ) {

    return "Closed";

  }


  if (
    isRunningLoan(
      loan,
    )
  ) {

    return "Running";

  }


  return "Pending";

}


// ============================================================
// COMPONENT
// ============================================================

export default function Loans() {

  // ==========================================================
  // LOAN STATE
  // ==========================================================

  const [
    loans,
    setLoans,
  ] = useState<Loan[]>(
    [],
  );


  // ==========================================================
  // VIEW LOAN STATE
  //
  // When a loan is selected from the portfolio, Loans Office
  // temporarily switches to the read-only View Loan Details
  // workspace.
  //
  // This does NOT modify the persisted loan.
  // ==========================================================

  const [
    viewingLoan,
    setViewingLoan,
  ] = useState<
    Loan | null
  >(
    null,
  );


  // ==========================================================
  // LOADING
  // ==========================================================

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );


  // ==========================================================
  // REFRESHING
  // ==========================================================

  const [
    refreshing,
    setRefreshing,
  ] = useState(
    false,
  );


  // ==========================================================
  // FILTER STATE
  // ==========================================================

  const [
    filterStatus,
    setFilterStatus,
  ] = useState<LoanFilterStatus>(
    "ALL",
  );


  const [
    filterFromDate,
    setFilterFromDate,
  ] = useState(
    "",
  );


  const [
    filterToDate,
    setFilterToDate,
  ] = useState(
    "",
  );


  // ==========================================================
  // LOAD LOANS
  // ==========================================================

  const loadLoans =
    useCallback(
      async (
        isRefresh = false,
      ): Promise<void> => {

        if (
          isRefresh
        ) {

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
            await getLoans();


          setLoans(
            records,
          );

        } catch (
          error
        ) {

          console.error(
            "FINORA V2 LOANS OFFICE LOAD ERROR:",
            error,
          );


          setLoans(
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


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(
    () => {

      void loadLoans();

    },
    [
      loadLoans,
    ],
  );


  // ==========================================================
  // REFRESH AFTER LOAN WORKFLOW
  // ==========================================================

  useEffect(
    () => {

      const handleLoanUpdate =
        () => {

          void loadLoans();

        };


      window.addEventListener(
        "FINORA_LOAN_UPDATED",
        handleLoanUpdate,
      );


      return () => {

        window.removeEventListener(
          "FINORA_LOAN_UPDATED",
          handleLoanUpdate,
        );

      };

    },
    [
      loadLoans,
    ],
  );


  // ==========================================================
  // STATISTICS
  // ==========================================================

  const statistics =
    useMemo(
      () => {

        const activeLoans =
          loans.filter(
            isRunningLoan,
          );


        const closedLoans =
          loans.filter(
            isClosedLoan,
          );


        const outstanding =
          loans.reduce(
            (
              total,
              loan,
            ) =>
              total +
              safeNumber(
                loan.outstanding,
              ),
            0,
          );


        return {

          total:
            loans.length,

          active:
            activeLoans.length,

          closed:
            closedLoans.length,

          outstanding,

        };

      },
      [
        loans,
      ],
    );


  // ==========================================================
  // FILTER VALIDATION
  // ==========================================================

  const handleApplyFilters =
    (): void => {

      if (
        filterFromDate &&
        filterToDate &&
        filterFromDate >
          filterToDate
      ) {

        alert(
          "From Date cannot be later than To Date.",
        );

        return;

      }

    };


  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  const handleClearFilters =
    (): void => {

      setFilterStatus(
        "ALL",
      );

      setFilterFromDate(
        "",
      );

      setFilterToDate(
        "",
      );

    };


  // ==========================================================
  // FILTERED LOANS
  // ==========================================================

  const filteredLoans =
    useMemo(
      () => {

        return loans.filter(
          (
            loan,
          ) => {

            // ------------------------------------------------
            // STATUS
            // ------------------------------------------------

            if (
              filterStatus ===
              "RUNNING" &&
              !isRunningLoan(
                loan,
              )
            ) {

              return false;

            }


            if (
              filterStatus ===
              "CLOSED" &&
              !isClosedLoan(
                loan,
              )
            ) {

              return false;

            }


            // ------------------------------------------------
            // DATE
            // ------------------------------------------------

            const loanDate =
              getDateFilterKey(
                loan.loanDate,
              );


            if (
              filterFromDate &&
              (
                !loanDate ||
                loanDate <
                  filterFromDate
              )
            ) {

              return false;

            }


            if (
              filterToDate &&
              (
                !loanDate ||
                loanDate >
                  filterToDate
              )
            ) {

              return false;

            }


            return true;

          },
        );

      },
      [
        loans,
        filterStatus,
        filterFromDate,
        filterToDate,
      ],
    );


  // ==========================================================
  // CREATE LOAN
  // ==========================================================

  const handleCreateLoan =
    useCallback(
      (): void => {

        window.dispatchEvent(
          new CustomEvent(
            "FINORA_V2_OPEN_LOAN_STUDIO",
          ),
        );

      },
      [],
    );


  // ==========================================================
  // VIEW LOAN
  // ==========================================================

  const handleViewLoan =
    useCallback(
      (
        loan: Loan,
      ): void => {

        setViewingLoan(
          loan,
        );

      },
      [],
    );


  // ==========================================================
  // CLOSE VIEW
  // ==========================================================

  const handleCloseLoanDetails =
    useCallback(
      (): void => {

        setViewingLoan(
          null,
        );

      },
      [],
    );


  // ==========================================================
  // VIEW LOAN DETAILS
  //
  // This is intentionally before the portfolio JSX.
  //
  // The Loans Office remains the route owner.
  // We simply switch the workspace content.
  // ==========================================================

  if (
    viewingLoan
  ) {

    return (

      <StudioLayout
        department="Loans"
        allowScroll={true}
        showHeader={false}
      >

        <ViewLoanDetails
          loan={
            viewingLoan
          }
          onBack={
            handleCloseLoanDetails
          }
        />

      </StudioLayout>

    );

  }


  // ==========================================================
  // RENDER LOANS OFFICE
  // ==========================================================

  return (

    <StudioLayout
      department="Loans"
      allowScroll={true}
      showHeader={false}
    >

      <main
        style={
          pageStyle
        }
      >

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <section
          style={
            topBarStyle
          }
        >

          <div
            style={
              headingGroupStyle
            }
          >

            <h1
              style={
                pageTitleStyle
              }
            >
              Loans Office
            </h1>


            <p
              style={
                pageSubtitleStyle
              }
            >
              Manage, review and create customer loans.
            </p>

          </div>


          <button
            type="button"
            onClick={
              handleCreateLoan
            }
            style={
              createButtonStyle
            }
          >
            + Create New Loan
          </button>

        </section>


        {/* ==================================================
            STATISTICS
        ================================================== */}

        <section
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
              Total Loans
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
              Active / Running
            </span>


            <strong
              style={
                statisticValueStyle
              }
            >
              {statistics.active}
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
              Closed
            </span>


            <strong
              style={
                statisticValueStyle
              }
            >
              {statistics.closed}
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
              Outstanding
            </span>


            <strong
              style={
                statisticValueStyle
              }
            >
              {
                formatCurrency(
                  statistics.outstanding,
                )
              }
            </strong>

          </article>

        </section>


        {/* ==================================================
            LOAN PORTFOLIO
        ================================================== */}

        <section
          style={
            portfolioStyle
          }
        >

          <header
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
                style={{
                  width:
                    "3px",

                  height:
                    "16px",

                  flexShrink:
                    0,

                  borderRadius:
                    "3px",

                  background:
                    "#2563EB",

                  boxShadow:
                    "0 0 10px rgba(37,99,235,0.25)",
                }}
              />

              Loan Portfolio

            </div>


            <div
              style={
                portfolioActionsStyle
              }
            >

              {/* ==========================================
                  FILTERS
              ========================================== */}

              <div
                style={
                  filtersStyle
                }
              >

                <div
                  style={
                    filtersGridStyle
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
                      Status
                    </label>


                    <select
                      value={
                        filterStatus
                      }
                      onChange={
                        (
                          event,
                        ) => {

                          setFilterStatus(
                            event.target.value as
                              LoanFilterStatus,
                          );

                        }
                      }
                      style={
                        filterSelectStyle
                      }
                    >

                      <option value="ALL">
                        All
                      </option>

                      <option value="RUNNING">
                        Running
                      </option>

                      <option value="CLOSED">
                        Closed
                      </option>

                    </select>

                  </div>


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
                      From
                    </label>


                    <input
                      type="date"
                      value={
                        filterFromDate
                      }
                      onChange={
                        (
                          event,
                        ) => {

                          setFilterFromDate(
                            event.target.value,
                          );

                        }
                      }
                      style={
                        filterDateInputStyle
                      }
                    />

                  </div>


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
                      To
                    </label>


                    <input
                      type="date"
                      value={
                        filterToDate
                      }
                      onChange={
                        (
                          event,
                        ) => {

                          setFilterToDate(
                            event.target.value,
                          );

                        }
                      }
                      style={
                        filterDateInputStyle
                      }
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

              </div>


              {/* ==========================================
                  REFRESH
              ========================================== */}

              <button
                type="button"
                onClick={() => {

                  void loadLoans(
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
                {
                  refreshing
                    ? "Refreshing..."
                    : "Refresh"
                }
              </button>


              <span
                style={
                  loanCountStyle
                }
              >
                {
                  filteredLoans.length
                }{" "}

                {
                  filteredLoans.length ===
                  1
                    ? "Loan"
                    : "Loans"
                }
              </span>

            </div>

          </header>


          {/* =================================================
              CONTENT
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
                Loading V2 Loans...
              </div>


              <div
                style={
                  emptyDescriptionStyle
                }
              >
                Reading loan records from FINORA V2 storage.
              </div>

            </div>

          ) : filteredLoans.length ===
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
                {
                  loans.length ===
                  0
                    ? "No V2 Loans Found"
                    : "No Loans Match Filters"
                }
              </div>


              <div
                style={
                  emptyDescriptionStyle
                }
              >
                {
                  loans.length ===
                  0
                    ? "No V2 loan records are currently available. Create a new loan to begin the portfolio."
                    : "Change the status or date filters to view matching loan records."
                }
              </div>


              {
                loans.length ===
                0 ? (

                  <button
                    type="button"
                    onClick={
                      handleCreateLoan
                    }
                    style={
                      emptyCreateButtonStyle
                    }
                  >
                    + Create New Loan
                  </button>

                ) : null
              }

            </div>

          ) : (

            <>

              {/* ==========================================
                  PORTFOLIO TABLE
              ========================================== */}

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
                  role="row"
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
                    Loan
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
                    Type
                  </div>


                  <div
                    style={
                      tableHeaderRightStyle
                    }
                  >
                    Principal
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
                    Loan Date
                  </div>


                  <div
                    style={
                      tableHeaderCenterStyle
                    }
                  >
                    Status
                  </div>


                  {/* VIEW */}

                  <div
                    style={
                      tableHeaderCenterStyle
                    }
                  >
                  </div>

                </div>


                {/* TABLE BODY */}

                <div
                  style={
                    tableBodyStyle
                  }
                  role="rowgroup"
                >

                  {
                    filteredLoans.map(
                      (
                        loan,
                        index,
                      ) => (

                        <div
                          key={
                            loan.id
                          }
                          style={{
                            ...tableRowStyle,

                            gridTemplateColumns:
                              "56px minmax(120px,1.2fr) minmax(130px,1.25fr) minmax(80px,0.8fr) minmax(100px,0.9fr) minmax(110px,1fr) minmax(95px,0.8fr) minmax(80px,0.7fr) 72px",
                          }}
                          role="row"
                        >

                          {/* S.NO. */}

                          <div
                            style={
                              serialCellStyle
                            }
                          >
                            {
                              index +
                              1
                            }
                          </div>


                          {/* LOAN */}

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
                              {
                                loan.loanNumber ||
                                loan.id ||
                                "--"
                              }
                            </div>


                            <div
                              style={
                                loanTitleStyle
                              }
                            >
                              {
                                formatLoanTitle(
                                  loan,
                                )
                              }
                            </div>

                          </div>


                          {/* CUSTOMER */}

                          <div
                            style={
                              tableCellStyle
                            }
                          >

                            <div
                              style={
                                customerNameStyle
                              }
                            >
                              {
                                loan.customerName ||
                                "--"
                              }
                            </div>


                            <div
                              style={
                                customerPhoneStyle
                              }
                            >
                              {
                                loan.phoneNumber ||
                                "--"
                              }
                            </div>

                          </div>


                          {/* TYPE */}

                          <div
                            style={
                              tableCellSecondaryStyle
                            }
                          >
                            {
                              formatLoanType(
                                loan,
                              )
                            }
                          </div>


                          {/* PRINCIPAL */}

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
                              {
                                formatCurrency(
                                  loan.amount,
                                )
                              }
                            </span>

                          </div>


                          {/* OUTSTANDING */}

                          <div
                            style={
                              tableCellRightStyle
                            }
                          >

                            <span
                              style={
                                outstandingStyle
                              }
                            >
                              {
                                formatCurrency(
                                  loan.outstanding,
                                )
                              }
                            </span>

                          </div>


                          {/* LOAN DATE */}

                          <div
                            style={
                              tableCellCenterStyle
                            }
                          >
                            {
                              formatDate(
                                loan.loanDate,
                              )
                            }
                          </div>


                          {/* STATUS */}

                          <div
                            style={
                              tableCellCenterStyle
                            }
                          >

                            <span
                              style={
                                statusBadgeStyle(
                                  loan.status,
                                )
                              }
                            >
                              {
                                formatStatus(
                                  loan,
                                )
                              }
                            </span>

                          </div>


                          {/* VIEW ACTION */}

                          <div
                            style={
                              tableCellCenterStyle
                            }
                          >

                            <button
                              type="button"
                              onClick={() =>
                                handleViewLoan(
                                  loan,
                                )
                              }
                              style={{
                                minHeight:
                                  "28px",

                                padding:
                                  "0 9px",

                                border:
                                  "1px solid rgba(37,99,235,0.35)",

                                borderRadius:
                                  "6px",

                                background:
                                  "rgba(37,99,235,0.10)",

                                color:
                                  "#93C5FD",

                                fontSize:
                                  "10px",

                                fontWeight:
                                  750,

                                cursor:
                                  "pointer",

                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              View
                            </button>

                          </div>

                        </div>

                      ),
                    )
                  }

                </div>

              </div>


              {/* =================================================
                  TABLE FOOTER
              ================================================= */}

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
                    filteredLoans.length
                  }{" "}
                  of{" "}
                  {
                    filteredLoans.length
                  }{" "}
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
