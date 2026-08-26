// ============================================================
// FINORA ENTERPRISE OS™
//
// PAYMENT SCHEDULE ENGINE™
//
// LOAN SCHEDULE ROW
//
// RESPONSIBILITY:
// - Render one repayment installment
// - Display EMI number
// - Display due date
// - Display installment amount
// - Display installment status
//
// IMPORTANT:
// - No schedule calculation.
// - No persistence.
// - No mutation.
// - Existing LoanInstallment contract preserved.
//
// RESPONSIVE:
// - Desktop / Laptop : normal table row
// - Tablet / Mobile  : stacked label/value presentation
//
// THEME CONTRACT:
// - All visual colours come from FINORA Theme Engine.
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { LoanInstallment } from "./types";

import { formatCurrency } from "../../../utils/currency/formatCurrency";

// ============================================================
// TYPES
// ============================================================

interface LoanScheduleRowProps {
  installment: LoanInstallment;
}

// ============================================================
// THEME TOKENS
// ============================================================

const THEME = {
  rowBackground:
    "var(--finora-theme-background-page, var(--finora-theme-page, #0B1220))",

  surface:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  primary: "var(--finora-theme-brand-primary, #2563EB)",

  primarySoft: "var(--finora-theme-brand-accent-soft, rgba(37,99,235,.14))",

  textPrimary: "var(--finora-theme-text-primary, #FFFFFF)",

  textSecondary: "var(--finora-theme-text-secondary, #CBD5E1)",

  textMuted: "var(--finora-theme-text-muted, #94A3B8)",

  border: "var(--finora-theme-border-default, rgba(148,163,184,.16))",

  borderStrong: "var(--finora-theme-border-strong, rgba(37,99,235,.42))",

  borderSubtle: "var(--finora-theme-border-subtle, rgba(148,163,184,.10))",

  success: "var(--finora-theme-success, #34D399)",

  successSoft: "var(--finora-theme-success-soft, rgba(16,185,129,.10))",

  successBorder:
    "var(--finora-theme-success-border, var(--finora-theme-border-strong, rgba(16,185,129,.35)))",

  warning: "var(--finora-theme-warning, #F59E0B)",

  warningSoft: "var(--finora-theme-warning-soft, rgba(245,158,11,.10))",

  danger: "var(--finora-theme-danger, #EF4444)",

  dangerSoft: "var(--finora-theme-danger-soft, rgba(239,68,68,.10))",

  info: "var(--finora-theme-info, #60A5FA)",

  infoSoft: "var(--finora-theme-info-soft, rgba(96,165,250,.10))",
} as const;

// ============================================================
// STATUS STYLE HELPER
// ============================================================

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
// DATE FORMATTER
// ============================================================
//
// FINORA standard: DD/MM/YYYY
// ============================================================

function formatIndianDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  const day = String(date.getDate()).padStart(2, "0");

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

// ============================================================
// COMPONENT
// ============================================================

export default function LoanScheduleRow({ installment }: LoanScheduleRowProps) {
  const statusStyle = getStatusStyle(installment.status);

  return (
    <tr
      className="finora-loan-schedule-row"
      style={{
        borderBottom: `1px solid ${THEME.borderSubtle}`,

        background: THEME.surface,
      }}
    >
      {/* ====================================================
          EMI NUMBER
      ==================================================== */}

      <td
        data-label="EMI"
        style={{
          padding: "8px 10px",

          background: "transparent",

          color: THEME.textPrimary,

          fontSize: "12px",

          fontWeight: 700,

          lineHeight: 1.2,

          boxSizing: "border-box",
        }}
      >
        <span
          style={{
            display: "inline-flex",

            alignItems: "center",

            justifyContent: "center",

            width: "24px",

            height: "24px",

            flexShrink: 0,

            borderRadius: "6px",

            background: "transparent",

            border: `1px solid ${THEME.borderStrong}`,

            color: THEME.textPrimary,

            fontSize: "12px",

            fontWeight: 700,

            boxSizing: "border-box",
          }}
        >
          {installment.installmentNumber}
        </span>
      </td>

      {/* ====================================================
          DUE DATE
      ==================================================== */}

      <td
        data-label="Due Date"
        style={{
          padding: "8px 10px",

          color: THEME.textSecondary,

          fontSize: "14px",

          fontWeight: 500,

          lineHeight: 1.2,

          whiteSpace: "nowrap",

          boxSizing: "border-box",
        }}
      >
        {formatIndianDate(installment.dueDate)}
      </td>

      {/* ====================================================
          INSTALLMENT AMOUNT
      ==================================================== */}

      <td
        data-label="Amount"
        style={{
          padding: "8px 10px",

          textAlign: "right",

          color: THEME.textPrimary,

          fontSize: "14px",

          fontWeight: 700,

          lineHeight: 1.2,

          whiteSpace: "nowrap",

          boxSizing: "border-box",
        }}
      >
        ₹ {formatCurrency(installment.installmentAmount)}
      </td>

      {/* ====================================================
          STATUS
      ==================================================== */}

      <td
        data-label="Status"
        style={{
          padding: "8px 10px",

          textAlign: "center",

          boxSizing: "border-box",
        }}
      >
        <span
          style={{
            display: "inline-flex",

            alignItems: "center",

            justifyContent: "center",

            minWidth: "76px",

            padding: "4px 9px",

            boxSizing: "border-box",

            borderRadius: "999px",

            background: statusStyle.background,

            border: statusStyle.border,

            color: statusStyle.color,

            fontSize: "12px",

            fontWeight: 700,

            lineHeight: 1.2,
          }}
        >
          {installment.status}
        </span>
      </td>
    </tr>
  );
}

// ============================================================
// END
// ============================================================
