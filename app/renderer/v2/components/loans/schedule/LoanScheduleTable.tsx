// ============================================================
// FINORA ENTERPRISE OS™
//
// PAYMENT SCHEDULE ENGINE™
//
// LOAN SCHEDULE TABLE
//
// RESPONSIBILITY:
// - Render generated repayment schedule
// - Display EMI number, due date, amount and status
// - Automatically calculate total scheduled EMI collection
// - Premium FINORA Enterprise presentation
//
// IMPORTANT:
// - Does NOT generate schedule.
// - Does NOT modify installments.
// - Does NOT access persistence.
// - Receives LoanInstallment[] from parent.
// - Total is calculated directly from schedule rows.
// - No manual calculator is required by the owner.
//
// BUSINESS DISPLAY RULE:
// - "Total EMI Collection" = SUM(all scheduled installment amounts)
// - This is the actual amount the customer will pay through EMI rows.
// - Advance Deduction is not silently added to this figure.
// - Total Loan Payable / Total Repayable remains the domain summary.
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  LoanInstallment,
} from "./types";

import LoanScheduleRow
  from "./LoanScheduleRow";

// ============================================================
// TYPES
// ============================================================

interface LoanScheduleTableProps {
  schedule: LoanInstallment[];
}

// ============================================================
// CONSTANTS
// ============================================================

const COLORS = {
  background: "#0F172A",
  panel: "#111C2E",
  panelSoft: "#142238",
  border: "rgba(148, 163, 184, 0.16)",
  borderStrong: "rgba(37, 99, 235, 0.35)",
  primary: "#2563EB",
  primarySoft: "rgba(37, 99, 235, 0.10)",
  text: "#FFFFFF",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
};

// ============================================================
// CURRENCY FORMATTER
// ============================================================

function formatIndianCurrency(
  value: number,
): string {

  const safeValue =
    Number.isFinite(value)
      ? Math.max(0, Math.round(value))
      : 0;

  return safeValue.toLocaleString(
    "en-IN",
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function LoanScheduleTable({
  schedule,
}: LoanScheduleTableProps) {

  const hasSchedule =
    schedule.length > 0;

  // ==========================================================
  // AUTOMATIC TOTAL EMI COLLECTION
  //
  // Source of truth:
  // every visible schedule row's installmentAmount.
  //
  // Example:
  // ₹450 + ₹450 + ₹450 + ₹450 + ₹450 + ₹14,550
  // = ₹16,800
  //
  // No manual calculator required.
  // ==========================================================

  const totalScheduledEMI =
    schedule.reduce(
      (
        total,
        installment,
      ) => {

        const amount =
          Number(
            installment.installmentAmount,
          );

        return (
          total +
          (
            Number.isFinite(amount)
              ? Math.max(0, amount)
              : 0
          )
        );

      },
      0,
    );

  return (

    <section
      style={{
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",

        border:
          `1px solid ${COLORS.border}`,

        borderRadius: "10px",

        overflow: "hidden",

        background:
          COLORS.background,

        boxShadow:
          "0 8px 24px rgba(0, 0, 0, 0.18)",
      }}
    >

      {/* ====================================================
          TABLE HEADER
      ==================================================== */}

      <div
        style={{
          display: "flex",

          alignItems: "center",

          justifyContent:
            "space-between",

          gap: "12px",

          padding:
            "10px 12px",

          borderBottom:
            `1px solid ${COLORS.border}`,

          background:
            `linear-gradient(
              90deg,
              ${COLORS.panelSoft},
              ${COLORS.panel}
            )`,
        }}
      >

        <div
          style={{
            display: "flex",

            alignItems: "center",

            gap: "8px",

            minWidth: 0,
          }}
        >

          <span
            style={{
              width: "3px",

              height: "16px",

              flexShrink: 0,

              borderRadius: "3px",

              background:
                COLORS.primary,

              boxShadow:
                "0 0 10px rgba(37,99,235,0.22)",
            }}
          />

          <span
            style={{
              color:
                COLORS.text,

              fontSize: "13px",

              fontWeight: 750,

              lineHeight: 1.2,
            }}
          >
            EMI Schedule
          </span>

        </div>

        <span
          style={{
            flexShrink: 0,

            padding:
              "4px 8px",

            border:
              `1px solid ${
                hasSchedule
                  ? COLORS.borderStrong
                  : COLORS.border
              }`,

            borderRadius: "999px",

            background:
              hasSchedule
                ? COLORS.primarySoft
                : "rgba(255,255,255,0.03)",

            color:
              hasSchedule
                ? "#93C5FD"
                : COLORS.textMuted,

            fontSize: "12px",

            fontWeight: 650,

            lineHeight: 1.2,
          }}
        >
          {schedule.length}{" "}
          {schedule.length === 1
            ? "Installment"
            : "Installments"}
        </span>

      </div>

      {/* ====================================================
          TABLE
      ==================================================== */}

      <div
        style={{
          width: "100%",

          minWidth: 0,

          overflowX: "auto",

          overflowY: "visible",

          boxSizing: "border-box",
        }}
      >

        <table
          style={{
            width: "100%",

            minWidth: "560px",

            borderCollapse:
              "collapse",

            tableLayout:
              "fixed",
          }}
        >

          {/* ==================================================
              TABLE HEAD
          ================================================== */}

          <thead>

            <tr
              style={{
                background:
                  COLORS.panel,

                borderBottom:
                  `1px solid ${COLORS.border}`,
              }}
            >

              <th
                style={{
                  width: "14%",

                  padding:
                    "8px 10px",

                  textAlign:
                    "left",

                  color:
                    COLORS.textMuted,

                  fontSize: "12px",

                  fontWeight: 650,

                  lineHeight: 1.2,
                }}
              >
                EMI
              </th>

              <th
                style={{
                  width: "28%",

                  padding:
                    "8px 10px",

                  textAlign:
                    "left",

                  color:
                    COLORS.textMuted,

                  fontSize: "12px",

                  fontWeight: 650,

                  lineHeight: 1.2,
                }}
              >
                Due Date
              </th>

              <th
                style={{
                  width: "28%",

                  padding:
                    "8px 10px",

                  textAlign:
                    "right",

                  color:
                    COLORS.textMuted,

                  fontSize: "12px",

                  fontWeight: 650,

                  lineHeight: 1.2,
                }}
              >
                Amount
              </th>

              <th
                style={{
                  width: "30%",

                  padding:
                    "8px 10px",

                  textAlign:
                    "center",

                  color:
                    COLORS.textMuted,

                  fontSize: "12px",

                  fontWeight: 650,

                  lineHeight: 1.2,
                }}
              >
                Status
              </th>

            </tr>

          </thead>

          {/* ==================================================
              TABLE BODY
          ================================================== */}

          <tbody>

            {hasSchedule ? (

              schedule.map(
                (
                  installment,
                ) => (

                  <LoanScheduleRow
                    key={
                      installment
                        .installmentNumber
                    }
                    installment={
                      installment
                    }
                  />

                ),
              )

            ) : (

              <tr>

                <td
                  colSpan={4}
                  style={{
                    padding:
                      "18px 12px",

                    textAlign:
                      "center",

                    color:
                      COLORS.textMuted,

                    fontSize: "12px",

                    fontWeight: 500,

                    lineHeight: 1.4,

                    background:
                      COLORS.background,
                  }}
                >
                  Select a repayment frequency
                  to generate the EMI schedule.
                </td>

              </tr>

            )}

          </tbody>

          {/* ==================================================
              AUTOMATIC TOTAL FOOTER
          ==================================================

              This is intentionally inside the schedule table
              so the owner sees the result immediately after
              the final EMI row.

              Example:
              5 × ₹450 + ₹14,550
              = ₹16,800
          ================================================== */}

          {hasSchedule && (

            <tfoot>

              <tr
                style={{
                  background:
                    "linear-gradient(90deg,#142238,#111C2E)",

                  borderTop:
                    `1px solid ${COLORS.borderStrong}`,
                }}
              >

                <td
                  colSpan={2}
                  style={{
                    padding:
                      "11px 10px",

                    textAlign:
                      "left",

                    color:
                      COLORS.textSecondary,

                    fontSize: "12px",

                    fontWeight: 750,

                    lineHeight: 1.2,
                  }}
                >
                  TOTAL EMI COLLECTION
                </td>

                <td
                  style={{
                    padding:
                      "11px 10px",

                    textAlign:
                      "right",

                    color:
                      "#FFFFFF",

                    fontSize: "15px",

                    fontWeight: 600,

                    lineHeight: 1.2,

                    whiteSpace:
                      "nowrap",
                  }}
                >
                  ₹{" "}
                  {formatIndianCurrency(
                    totalScheduledEMI,
                  )}
                </td>

                <td
                  style={{
                    padding:
                      "11px 10px",

                    textAlign:
                      "center",

                    color:
                      "#93C5FD",

                    fontSize: "11px",

                    fontWeight: 550,

                    lineHeight: 1.2,
                  }}
                >
                  AUTO CALCULATED
                </td>

              </tr>

            </tfoot>

          )}

        </table>

      </div>

    </section>
  );
}

// ============================================================
// END
// ============================================================
