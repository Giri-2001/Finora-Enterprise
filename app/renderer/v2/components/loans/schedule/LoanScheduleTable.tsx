// ============================================================
// FINORA ENTERPRISE OS™
// PAYMENT SCHEDULE ENGINE™
// LOAN SCHEDULE TABLE
//
// RESPONSIBILITY:
// - Render generated repayment schedule.
// - Desktop / Laptop: compact table.
// - Tablet / Mobile: readable single-column installment cards.
// - Calculate only the visible schedule total from row amounts.
//
// IMPORTANT:
// - No persistence.
// - No mutation.
// - No schedule generation logic.
// - FINORA Responsive Engine controls viewport mode.
// ============================================================

import { useResponsive } from "../../../utils/responsive";

import type { LoanInstallment } from "./types";
import LoanScheduleRow from "./LoanScheduleRow";

// ============================================================
// TYPES
// ============================================================

interface LoanScheduleTableProps {
  schedule: LoanInstallment[];
}

// ============================================================
// THEME TOKENS
// ============================================================

const THEME = {
  background:
    "var(--finora-theme-background-page, var(--finora-theme-background, #0F172A))",
  panel:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",
  panelSoft:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #142238))",
  border: "var(--finora-theme-border-default, rgba(148, 163, 184, 0.16))",
  borderStrong: "var(--finora-theme-border-strong, rgba(37, 99, 235, 0.35))",
  primary: "var(--finora-theme-brand-primary, #2563EB)",
  primarySoft: "var(--finora-theme-brand-accent-soft, rgba(37,99,235,.10))",
  text: "var(--finora-theme-text-primary, #FFFFFF)",
  textSecondary: "var(--finora-theme-text-secondary, #CBD5E1)",
  textMuted: "var(--finora-theme-text-muted, #94A3B8)",
  success: "var(--finora-theme-success, #34D399)",
  successSoft: "var(--finora-theme-success-soft, rgba(16,185,129,.10))",
  successBorder: "var(--finora-theme-success-border, rgba(16,185,129,.35))",
  warning: "var(--finora-theme-warning, #F59E0B)",
  warningSoft: "var(--finora-theme-warning-soft, rgba(245,158,11,.10))",
  danger: "var(--finora-theme-danger, #EF4444)",
  dangerSoft: "var(--finora-theme-danger-soft, rgba(239,68,68,.10))",
  info: "var(--finora-theme-info, #60A5FA)",
} as const;

// ============================================================
// HELPERS
// ============================================================

function formatIndianCurrency(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;

  return safeValue.toLocaleString("en-IN");
}

function formatIndianDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day} ${date.toLocaleString("en-IN", { month: "short" })} ${year}`;
}

function getStatusStyle(status: LoanInstallment["status"]) {
  switch (status) {
    case "Paid":
      return {
        background: THEME.successSoft,
        border: `1px solid ${THEME.successBorder}`,
        color: THEME.success,
      };
    case "Partial":
      return {
        background: THEME.warningSoft,
        border: `1px solid ${THEME.warning}`,
        color: THEME.warning,
      };
    case "Overdue":
      return {
        background: THEME.dangerSoft,
        border: `1px solid ${THEME.danger}`,
        color: THEME.danger,
      };
    case "Preclosed":
      return {
        background: THEME.primarySoft,
        border: `1px solid ${THEME.borderStrong}`,
        color: THEME.info,
      };
    case "Pending":
    default:
      return {
        background: "transparent",
        border: `1px solid ${THEME.primary}`,
        color: THEME.primary,
      };
  }
}

// ============================================================
// MOBILE / TABLET INSTALLMENT CARD
// ============================================================

function CompactScheduleRow({
  installment,
  last,
}: {
  installment: LoanInstallment;
  last: boolean;
}) {
  const statusStyle = getStatusStyle(installment.status);

  return (
    <div
      style={{
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        padding: "10px 12px",
        borderBottom: last ? "none" : `1px solid ${THEME.border}`,
        background: THEME.panel,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(82px, 0.7fr) minmax(0, 1.3fr)",
          gap: "7px 12px",
          width: "100%",
          minWidth: 0,
          alignItems: "center",
        }}
      >
        <span
          style={{ color: THEME.textMuted, fontSize: "12px", fontWeight: 600 }}
        >
          EMI
        </span>
        <span style={{ color: THEME.text, fontSize: "13px", fontWeight: 750 }}>
          {installment.installmentNumber}
        </span>

        <span
          style={{ color: THEME.textMuted, fontSize: "12px", fontWeight: 600 }}
        >
          Due Date
        </span>
        <span
          style={{
            color: THEME.textSecondary,
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {formatIndianDate(installment.dueDate)}
        </span>

        <span
          style={{ color: THEME.textMuted, fontSize: "12px", fontWeight: 600 }}
        >
          Amount
        </span>
        <span style={{ color: THEME.text, fontSize: "13px", fontWeight: 750 }}>
          ₹ {formatIndianCurrency(Number(installment.installmentAmount))}
        </span>

        <span
          style={{ color: THEME.textMuted, fontSize: "12px", fontWeight: 600 }}
        >
          Status
        </span>
        <span
          style={{
            display: "inline-flex",
            width: "fit-content",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "76px",
            padding: "4px 9px",
            boxSizing: "border-box",
            borderRadius: "999px",
            background: statusStyle.background,
            border: statusStyle.border,
            color: statusStyle.color,
            fontSize: "11px",
            fontWeight: 750,
            lineHeight: 1.2,
          }}
        >
          {installment.status}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function LoanScheduleTable({
  schedule,
}: LoanScheduleTableProps) {
  const { tokens } = useResponsive();

  const compact =
    tokens.meta.viewport === "mobile" || tokens.meta.viewport === "tablet";

  const hasSchedule = schedule.length > 0;

  const totalScheduledEMI = schedule.reduce((total, installment) => {
    const amount = Number(installment.installmentAmount);
    return total + (Number.isFinite(amount) ? Math.max(0, amount) : 0);
  }, 0);

  return (
    <section
      style={{
          fontFamily:
            "Inter, ui-sans-serif, system-ui, sans-serif",

        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        border: `1px solid ${THEME.border}`,
        borderRadius: "10px",
        overflow: "hidden",
        background: THEME.background,
      }}
    >
      {/* ====================================================
          HEADER — ALWAYS VISIBLE
      ==================================================== */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          minWidth: 0,
          padding: compact ? "9px 10px" : "10px 12px",
          borderBottom: `1px solid ${THEME.border}`,
          background: THEME.panelSoft,
          boxSizing: "border-box",
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
              background: THEME.primary,
            }}
          />
          <span
            style={{
              minWidth: 0,
              color: THEME.text,
              fontSize: compact ? "12px" : "13px",
              fontWeight: 750,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            EMI Schedule
          </span>
        </div>

        <span
          style={{
            flexShrink: 0,
            padding: "4px 8px",
            border: `1px solid ${THEME.border}`,
            borderRadius: "999px",
            background: "transparent",
            color: THEME.text,
            fontSize: "11px",
            fontWeight: 650,
            lineHeight: 1.1,
          }}
        >
          {schedule.length} Installments
        </span>
      </div>

      {!hasSchedule ? (
        <div
          style={{
            padding: compact ? "18px 12px" : "18px 12px",
            textAlign: "center",
            color: THEME.textMuted,
            fontSize: "12px",
            fontWeight: 500,
            lineHeight: 1.4,
            background: THEME.background,
          }}
        >
          Select a repayment frequency to generate the EMI schedule.
        </div>
      ) : compact ? (
        <div style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}>
          {schedule.map((installment, index) => (
            <CompactScheduleRow
              key={installment.installmentNumber}
              installment={installment}
              last={index === schedule.length - 1}
            />
          ))}

          {/* ==================================================
              MOBILE / TABLET TOTAL
          ================================================== */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              padding: "11px 12px",
              borderTop: `1px solid ${THEME.borderStrong}`,
              background: THEME.panelSoft,
              boxSizing: "border-box",
            }}
          >
            <span
              style={{
                color: THEME.textSecondary,
                fontSize: "12px",
                fontWeight: 750,
                lineHeight: 1.2,
              }}
            >
              TOTAL EMI COLLECTION
            </span>
            <span
              style={{
                color: THEME.text,
                fontSize: "14px",
                fontWeight: 800,
                lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}
            >
              ₹ {formatIndianCurrency(totalScheduledEMI)}
            </span>
          </div>
        </div>
      ) : (
        /* ====================================================
           LAPTOP / DESKTOP TABLE
        ==================================================== */
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
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr
                style={{
                  background: THEME.panel,
                  borderBottom: `1px solid ${THEME.border}`,
                }}
              >
                <th style={headerCellStyle("14%", "left")}>EMI</th>
                <th style={headerCellStyle("28%", "left")}>Due Date</th>
                <th style={headerCellStyle("28%", "right")}>Amount</th>
                <th style={headerCellStyle("30%", "center")}>Status</th>
              </tr>
            </thead>

            <tbody>
              {schedule.map((installment) => (
                <LoanScheduleRow
                  key={installment.installmentNumber}
                  installment={installment}
                />
              ))}
            </tbody>

            <tfoot>
              <tr
                style={{
                  background: THEME.panelSoft,
                  borderTop: `1px solid ${THEME.borderStrong}`,
                }}
              >
                <td colSpan={2} style={totalLabelStyle}>
                  TOTAL EMI COLLECTION
                </td>
                <td style={totalAmountStyle}>
                  ₹ {formatIndianCurrency(totalScheduledEMI)}
                </td>
                <td style={totalStatusStyle}>AUTO CALCULATED</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

// ============================================================
// DESKTOP TABLE STYLES
// ============================================================

function headerCellStyle(
  width: string,
  textAlign: "left" | "right" | "center",
) {
  return {
    width,
    padding: "8px 10px",
    textAlign,
    color: THEME.textMuted,
    fontSize: "13px",
    fontWeight: 650,
    lineHeight: 1.2,
  } as const;
}

const totalLabelStyle = {
  padding: "11px 10px",
  textAlign: "left" as const,
  color: THEME.textSecondary,
  fontSize: "12px",
  fontWeight: 750,
  lineHeight: 1.2,
};

const totalAmountStyle = {
  padding: "11px 10px",
  textAlign: "right" as const,
  color: THEME.text,
  fontSize: "14px",
  fontWeight: 800,
  lineHeight: 1.2,
  whiteSpace: "nowrap" as const,
};

const totalStatusStyle = {
  padding: "11px 10px",
  textAlign: "center" as const,
  color: THEME.textMuted,
  fontSize: "11px",
  fontWeight: 650,
  lineHeight: 1.2,
};

// ============================================================
// END
// ============================================================
