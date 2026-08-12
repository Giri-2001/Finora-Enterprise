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
// - Premium FINORA Enterprise presentation
//
// IMPORTANT:
// - Does NOT generate schedule.
// - Does NOT modify installments.
// - Does NOT access persistence.
// - Receives LoanInstallment[] from parent.
// - Existing schedule contract remains unchanged.
//
// DESIGN:
// - Deep Navy
// - FINORA Primary Blue
// - White / Slate typography
// - No brown
// - No gold
// - Natural table height
// - Parent workspace controls scrolling
//
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
// COMPONENT
// ============================================================

export default function LoanScheduleTable({
  schedule,
}: LoanScheduleTableProps) {

  const hasSchedule =
    schedule.length > 0;

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

          IMPORTANT:
          - No fixed height.
          - No max-height.
          - No vertical scrollbar here.
          - The parent Step-2 workspace controls overflow.
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

        </table>

      </div>

    </section>
  );
}

// ============================================================
// END
// ============================================================
