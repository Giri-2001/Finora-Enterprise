/* ===========================================================
   FINORA ENTERPRISE OS™

   COLLECTION STUDIO™

   READ-ONLY EMI SCHEDULE

   RESPONSIBILITY

   - Display authoritative persisted Loan EMI schedule
   - Support View Collection Details audit workflow
   - Preserve persisted installment status
   - Preserve penalty / overdue presentation
   - Preserve partial-payment presentation
   - Preserve discount / waived settlement in remaining balance
   - Refresh after Loan / Collection updates
   - Read-only presentation

   IMPORTANT

   - No persistence
   - No repository access
   - No StorageManager access
   - No collection mutation
   - No EMI selection controls
   - No business-state mutation
=========================================================== */

import { useEffect, useMemo, useState } from "react";

import { CalendarCheck2 } from "lucide-react";

import { fetchLoan } from "../../../services/loan/loanService";

import { collectionEntryStyles } from "./CollectionEntry.styles";

import { collectionHistoryStyles } from "./CollectionHistory.styles";

// ============================================================
// TYPES
// ============================================================

interface Props {
  loanId?: string;
}

interface EmiScheduleRecord {
  installmentNumber: number;

  dueDate: string;

  installmentAmount: number;

  paidAmount: number;

  waivedAmount: number;

  penaltyAmount: number;

  status: string;

  receiptNumber?: string;

  paidDate?: string;
}

// ============================================================
// HELPERS
// ============================================================

function safeNumber(value: unknown): number {
  const number = Number(value);

  return Number.isFinite(number)
    ? Math.max(0, number)
    : 0;
}

function normalizeStatus(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function formatCurrency(value: unknown): string {
  return `₹ ${safeNumber(value).toLocaleString("en-IN")}`;
}

function formatEmiDate(value: string): string {
  if (!value) {
    return "--";
  }

  const date = new Date(
    value.includes("T")
      ? value
      : `${value}T00:00:00`,
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getRemainingAmount(
  installment: EmiScheduleRecord,
): number {
  return Math.max(
    0,
    installment.installmentAmount -
      installment.paidAmount -
      installment.waivedAmount,
  );
}

function getStatusLabel(value: string): string {
  const normalizedStatus = normalizeStatus(value);

  if (normalizedStatus === "overdue paid") {
    return "OVERDUE PAID";
  }

  if (normalizedStatus === "preclosed") {
    return "PRECLOSED";
  }

  if (normalizedStatus === "paid") {
    return "PAID";
  }

  if (normalizedStatus === "overdue") {
    return "OVERDUE";
  }

  if (normalizedStatus === "partial") {
    return "PARTIAL";
  }

  return String(value || "Pending").toUpperCase();
}

// ============================================================
// COMPONENT
// ============================================================

export default function CollectionEmiSchedule({
  loanId,
}: Props) {
  const [schedule, setSchedule] =
    useState<EmiScheduleRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  // ==========================================================
  // LOAD AUTHORITATIVE LOAN SCHEDULE
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadSchedule(): Promise<void> {
      const activeLoanId =
        String(loanId ?? "").trim();

      if (!activeLoanId) {
        if (!cancelled) {
          setSchedule([]);

          setLoadError("");

          setLoading(false);
        }

        return;
      }

      setLoading(true);

      setLoadError("");

      try {
        const loan =
          await fetchLoan(activeLoanId);

        if (cancelled) {
          return;
        }

        const rawSchedule =
          Array.isArray(
            (
              loan as
                | {
                    schedule?: unknown;
                  }
                | undefined
            )?.schedule,
          )
            ? (
                loan as {
                  schedule: Array<{
                    installmentNumber?: unknown;
                    dueDate?: unknown;
                    installmentAmount?: unknown;
                    paidAmount?: unknown;
                    waivedAmount?: unknown;
                    penaltyAmount?: unknown;
                    status?: unknown;
                    receiptNumber?: unknown;
                    paidDate?: unknown;
                  }>;
                }
              ).schedule
            : [];

        const normalizedSchedule =
          rawSchedule
            .map(
              (
                installment,
              ): EmiScheduleRecord => ({
                installmentNumber:
                  safeNumber(
                    installment.installmentNumber,
                  ),

                dueDate:
                  String(
                    installment.dueDate ?? "",
                  ),

                installmentAmount:
                  safeNumber(
                    installment.installmentAmount,
                  ),

                paidAmount:
                  safeNumber(
                    installment.paidAmount,
                  ),

                waivedAmount:
                  safeNumber(
                    installment.waivedAmount,
                  ),

                penaltyAmount:
                  safeNumber(
                    installment.penaltyAmount,
                  ),

                status:
                  String(
                    installment.status ??
                      "Pending",
                  ),

                receiptNumber:
                  String(
                    installment.receiptNumber ??
                      "",
                  ),

                paidDate:
                  String(
                    installment.paidDate ??
                      "",
                  ),
              }),
            )
            .filter(
              (installment) =>
                installment.installmentNumber > 0,
            )
            .sort(
              (a, b) =>
                a.installmentNumber -
                b.installmentNumber,
            );

        setSchedule(normalizedSchedule);
      } catch (error) {
        console.error(
          "FINORA VIEW EMI SCHEDULE LOAD ERROR:",
          error,
        );

        if (!cancelled) {
          setSchedule([]);

          setLoadError(
            "Unable to load the EMI schedule for this loan.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSchedule();

    function handleRefresh(): void {
      void loadSchedule();
    }

    window.addEventListener(
      "FINORA_LOAN_UPDATED",
      handleRefresh,
    );

    window.addEventListener(
      "FINORA_COLLECTION_UPDATED",
      handleRefresh,
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        "FINORA_LOAN_UPDATED",
        handleRefresh,
      );

      window.removeEventListener(
        "FINORA_COLLECTION_UPDATED",
        handleRefresh,
      );
    };
  }, [loanId]);

  // ==========================================================
  // TOTAL CONTRACTUAL BALANCE
  // ==========================================================

  const totalBalance =
    useMemo(
      () =>
        schedule.reduce(
          (total, installment) =>
            total +
            getRemainingAmount(
              installment,
            ),
          0,
        ),
      [schedule],
    );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section
      aria-label="EMI Schedule"
      style={
        collectionHistoryStyles.section
      }
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        style={
          collectionHistoryStyles.header
        }
      >
        <div
          style={
            collectionHistoryStyles.headerTitle
          }
        >
          <CalendarCheck2
            aria-hidden="true"
            style={
              collectionHistoryStyles.headerIcon
            }
          />

          <div
            style={
              collectionHistoryStyles.headerContent
            }
          >
            <h2
              style={
                collectionHistoryStyles.title
              }
            >
              EMI SCHEDULE
            </h2>

            <p
              style={
                collectionHistoryStyles.subtitle
              }
            >
              Authoritative persisted installment schedule for this loan.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          LOADING / ERROR / EMPTY
      ====================================================== */}

      {loading ? (
        <div
          style={
            collectionEntryStyles.loadingSchedule
          }
        >
          Loading EMI schedule...
        </div>
      ) : loadError ? (
        <div
          style={
            collectionEntryStyles.errorSchedule
          }
        >
          {loadError}
        </div>
      ) : schedule.length === 0 ? (
        <div
          style={
            collectionEntryStyles.emptySchedule
          }
        >
          No EMI schedule is stored for this loan.
        </div>
      ) : (
        <div
          style={{
            ...collectionEntryStyles.schedule,

            overflowX: "auto",
          }}
        >
          {/* ==================================================
              TABLE HEADER
          ================================================== */}

          <div
            style={{
              ...collectionEntryStyles.scheduleTableHeader,

              gridTemplateColumns:
                "minmax(90px, 0.8fr) minmax(130px, 1fr) minmax(150px, 1fr) minmax(130px, 0.9fr)",
            }}
          >
            <span>EMI</span>

            <span>DUE DATE</span>

            <span>AMOUNT</span>

            <span>STATUS</span>
          </div>

          {/* ==================================================
              TABLE ROWS
          ================================================== */}

          <div
            style={
              collectionEntryStyles.scheduleTable
            }
          >
            {schedule.map(
              (installment) => {
                const normalizedStatus =
                  normalizeStatus(
                    installment.status,
                  );

                const statusStyle = {
                  ...collectionEntryStyles.status,

                  ...(
                    normalizedStatus ===
                      "paid" ||
                    normalizedStatus ===
                      "overdue paid"
                      ? collectionEntryStyles.statusPaid
                      : normalizedStatus ===
                          "preclosed"
                        ? collectionEntryStyles.statusPreclosed
                        : normalizedStatus ===
                            "overdue"
                          ? collectionEntryStyles.statusOverdue
                          : collectionEntryStyles.statusPending
                  ),
                };

                const displayedAmount =
                  installment.penaltyAmount > 0
                    ? `${
                        normalizedStatus ===
                        "overdue paid"
                          ? formatCurrency(
                              installment.installmentAmount,
                            )
                          : formatCurrency(
                              getRemainingAmount(
                                installment,
                              ),
                            )
                      } + ${formatCurrency(
                        installment.penaltyAmount,
                      )}`
                    : normalizedStatus ===
                        "partial"
                      ? `${formatCurrency(
                          installment.installmentAmount,
                        )} - ${formatCurrency(
                          installment.paidAmount +
                            installment.waivedAmount,
                        )}`
                      : formatCurrency(
                          installment.installmentAmount,
                        );

                return (
                  <div
                    key={
                      installment.installmentNumber
                    }
                    style={{
                      ...collectionEntryStyles.scheduleTableRow,

                      gridTemplateColumns:
                        "minmax(90px, 0.8fr) minmax(130px, 1fr) minmax(150px, 1fr) minmax(130px, 0.9fr)",
                    }}
                  >
                    <span
                      style={
                        collectionEntryStyles.emiName
                      }
                    >
                      EMI{" "}
                      {
                        installment.installmentNumber
                      }
                    </span>

                    <span
                      style={
                        collectionEntryStyles.scheduleTableCell
                      }
                    >
                      {formatEmiDate(
                        installment.dueDate,
                      )}
                    </span>

                    <strong
                      style={
                        collectionEntryStyles.emiAmount
                      }
                      title={`Remaining ${formatCurrency(
                        getRemainingAmount(
                          installment,
                        ),
                      )}`}
                    >
                      {displayedAmount}
                    </strong>

                    <span
                      style={
                        statusStyle
                      }
                    >
                      {getStatusLabel(
                        installment.status,
                      )}
                    </span>
                  </div>
                );
              },
            )}

            {/* ================================================
                TOTAL BALANCE
            ================================================ */}

            <div
              style={{
                ...collectionEntryStyles.emiTotalRow,

                gridTemplateColumns:
                  "minmax(90px, 0.8fr) minmax(130px, 1fr) minmax(150px, 1fr) minmax(130px, 0.9fr)",
              }}
            >
              <strong
                style={
                  collectionEntryStyles.emiTotalLabel
                }
              >
                TOTAL BALANCE
              </strong>

              <span />

              <strong
                style={
                  collectionEntryStyles.emiTotalAmount
                }
              >
                {formatCurrency(
                  totalBalance,
                )}
              </strong>

              <span />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================
// END
// ============================================================
