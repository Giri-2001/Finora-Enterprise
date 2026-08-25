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
// THEME:
// - Visual colours come from FINORA Theme Engine CSS variables.
// - No local colour palette.
// - No hardcoded gradients.
// - Layout / dimensions unchanged.
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
// FINORA THEME TOKENS
// ============================================================

const THEME = {

  background:
    "var(--finora-theme-background-page, var(--finora-theme-background, #0F172A))",

  panel:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  panelSoft:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #142238))",

  border:
    "var(--finora-theme-border-default, rgba(148, 163, 184, 0.16))",

  borderStrong:
    "var(--finora-theme-border-strong, rgba(37, 99, 235, 0.35))",

  primary:
    "var(--finora-theme-brand-primary, #2563EB)",

  primarySoft:
    "var(--finora-theme-brand-accent-soft, rgba(37, 99, 235, 0.10))",

  text:
    "var(--finora-theme-text-primary, #FFFFFF)",

  textSecondary:
    "var(--finora-theme-text-secondary, #CBD5E1)",

  textMuted:
    "var(--finora-theme-text-muted, #94A3B8)",

  shadow:
    "var(--finora-theme-overlay-shadow, rgba(0, 0, 0, 0.18))",

};

// ============================================================
// CURRENCY FORMATTER
// ============================================================

function formatIndianCurrency(
  value: number,
): string {

  const safeValue =
    Number.isFinite(value)
      ? Math.max(
          0,
          Math.round(value),
        )
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
          `1px solid ${THEME.border}`,

        borderRadius:
          "10px",

        overflow:
          "hidden",

        background:
          THEME.background,

        boxShadow:
          `0 8px 24px ${THEME.shadow}`,
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
            `1px solid ${THEME.border}`,

          background:
            `linear-gradient(
              90deg,
              ${THEME.panelSoft},
              ${THEME.panel}
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

              background: "transparent",

              boxShadow:
                `0 0 10px ${THEME.primarySoft}`,
            }}
          />

          <span
            style={{
              color:
                THEME.text,

              fontSize:
                "13px",

              fontWeight:
                750,

              lineHeight:
                1.2,
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
              `1px solid ${THEME.border}`,

            borderRadius:
              "999px",

            background: "transparent",

            color:
              THEME.text,

            fontSize:
              "12px",

            fontWeight:
              650,
          }}
        >
          {schedule.length} Installments
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

            minWidth:
              "560px",

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
                  THEME.panel,

                borderBottom:
                  `1px solid ${THEME.border}`,
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
                    THEME.textMuted,

                  fontSize:
                    "12px",

                  fontWeight:
                    650,

                  lineHeight:
                    1.2,
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
                    THEME.textMuted,

                  fontSize:
                    "12px",

                  fontWeight:
                    650,

                  lineHeight:
                    1.2,
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
                    THEME.textMuted,

                  fontSize:
                    "12px",

                  fontWeight:
                    650,

                  lineHeight:
                    1.2,
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
                    THEME.textMuted,

                  fontSize:
                    "12px",

                  fontWeight:
                    650,

                  lineHeight:
                    1.2,
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
                      THEME.textMuted,

                    fontSize:
                      "12px",

                    fontWeight:
                      500,

                    lineHeight:
                      1.4,

                    background:
                      THEME.background,
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
          ================================================== */}

          {hasSchedule && (

            <tfoot>

              <tr
                style={{
                  background:
      THEME.panelSoft,

                  borderTop:
                    `1px solid ${THEME.borderStrong}`,
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
                      THEME.textSecondary,

                    fontSize:
                      "12px",

                    fontWeight:
                      750,

                    lineHeight:
                      1.2,
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
                      THEME.text,

                    fontSize:
                      "14px",

                    fontWeight:
                      800,

                    lineHeight:
                      1.2,

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
                      THEME.textMuted,

                    fontSize:
                      "11px",

                    fontWeight:
                      650,

                    lineHeight:
                      1.2,
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