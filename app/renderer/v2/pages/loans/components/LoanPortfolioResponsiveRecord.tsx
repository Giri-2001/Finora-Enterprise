// ============================================================
// FINORA ENTERPRISE OS™
//
// LOANS OFFICE RESPONSIVE PORTFOLIO RECORD™
//
// RESPONSIBILITY:
// - Preserve the existing Loan Portfolio data
// - Present the existing table record vertically on Mobile
// - Present the same record as a two-column detail form on Tablet
// - Preserve the existing desktop table unchanged
// - No business calculations
// - No persistence logic
// - No new Loan domain fields
// - No new visual design system
//
// RESPONSIVE CONTRACT:
// - Mobile : one field per row
// - Tablet : two fields per row
// - Laptop/Desktop : this component is not rendered
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties, ReactNode } from "react";

import type { Loan } from "../../../components/customers/office/CustomerOffice/types";

import { useTheme } from "../../../themes/provider";

import {
  createLoansOfficeMobileFieldStyle,
  createLoansOfficeMobileRecordStyle,
  createLoansOfficeTabletFieldGridStyle,
} from "../../../utils/responsive/loansOffice/loansOffice.layout";

import type { LoansOfficeResponsiveTokens } from "../../../utils/responsive/loansOffice/loansOffice.types";

import {
  loanIdentityStyle,
  loanNumberStyle,
  loanTitleStyle,
  customerNameStyle,
  customerPhoneStyle,
  amountStyle,
  outstandingStyle,
  statusBadgeStyle,
} from "../LoansPage.styles";

// ============================================================
// TYPES
// ============================================================

export interface LoanPortfolioResponsiveRecordProps {
  loan: Loan;
  index: number;
  tokens: LoansOfficeResponsiveTokens;
  formatLoanTitle: (loan: Loan) => string;
  formatLoanType: (loan: Loan) => string;
  formatCurrency: (value: number | undefined) => string;
  formatDate: (value: string) => string;
  formatStatus: (loan: Loan) => string;
  onView: (loan: Loan) => void;
}

// ============================================================
// COMPONENT
// ============================================================

export default function LoanPortfolioResponsiveRecord({
  loan,
  index,
  tokens,
  formatLoanTitle,
  formatLoanType,
  formatCurrency,
  formatDate,
  formatStatus,
  onView,
}: LoanPortfolioResponsiveRecordProps) {
  // ==========================================================
  // FINORA THEME ENGINE
  // ==========================================================

  const { theme } = useTheme();

  // ==========================================================
  // THEME VARIABLES
  // ==========================================================

  const fieldBorder = theme.colors.border.subtle;

  const labelStyle: CSSProperties = {
    color: theme.colors.text.muted,
    fontSize: `${tokens.typography.mobileLabel}px`,
    fontWeight: 650,
    lineHeight: 1.2,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  };

  const valueStyle: CSSProperties = {
    color: theme.colors.text.primary,
    fontSize: `${tokens.typography.mobileValue}px`,
    fontWeight: 650,
    lineHeight: 1.35,
    minWidth: 0,
    overflowWrap: "anywhere",
  };

  const secondaryValueStyle: CSSProperties = {
    ...valueStyle,
    color: theme.colors.text.secondary,
  };

  const recordStyle: CSSProperties = {
    ...createLoansOfficeMobileRecordStyle(tokens),
    borderTop: `1px solid ${fieldBorder}`,
    background: theme.colors.background.surface,
  };

  const fieldStyle = (): CSSProperties => ({
    ...createLoansOfficeMobileFieldStyle(tokens),
    borderBottom: tokens.layout.mobileFieldSeparator
      ? `1px solid ${fieldBorder}`
      : undefined,
  });

  const viewButtonStyle: CSSProperties = {
    minHeight: "32px",
    alignSelf: "flex-start",
    padding: "0 12px",
    border: `1px solid ${theme.colors.border.strong}`,
    borderRadius: "7px",
    background: theme.colors.brand.accentSoft,
    color: theme.colors.brand.primary,
    fontSize: `${tokens.typography.filterButton}px`,
    fontWeight: 750,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const field = (
    label: string,
    value: ReactNode,
    key: string,
    valueClassName?: "primary" | "secondary",
  ) => (
    <div key={key} style={fieldStyle()}>
      <div style={labelStyle}>{label}</div>
      <div
        style={
          valueClassName === "secondary" ? secondaryValueStyle : valueStyle
        }
      >
        {value}
      </div>
    </div>
  );

  const fields = [
    field("S.No.", index + 1, "serial", "secondary"),
    field(
      "Loan",
      <div style={loanIdentityStyle}>
        <div
          style={{
            ...loanNumberStyle,
            fontSize: `${tokens.typography.mobileLoanNumber}px`,
            whiteSpace: "normal",
            overflow: "visible",
            textOverflow: "clip",
            overflowWrap: "anywhere",
            color: theme.colors.text.primary,
          }}
        >
          {loan.loanNumber || loan.id || "--"}
        </div>
        <div
          style={{
            ...loanTitleStyle,
            fontSize: `${tokens.typography.mobileLoanTitle}px`,
            whiteSpace: "normal",
            overflow: "visible",
            textOverflow: "clip",
          }}
        >
          {formatLoanTitle(loan)}
        </div>
      </div>,
      "loan",
    ),
    field(
      "Customer",
      <div>
        <div
          style={{
            ...customerNameStyle,
            whiteSpace: "normal",
            overflow: "visible",
            textOverflow: "clip",
            fontSize: `${tokens.typography.mobileValue}px`,
            color: theme.colors.text.primary,
          }}
        >
          {loan.customerName || "--"}
        </div>
        <div
          style={{
            ...customerPhoneStyle,
            fontSize: `${tokens.typography.mobileLoanTitle}px`,
            whiteSpace: "normal",
          }}
        >
          {loan.phoneNumber || "--"}
        </div>
      </div>,
      "customer",
    ),
    field(
      "Type",
      <span
        style={{
          ...secondaryValueStyle,
          color: theme.colors.brand.secondary,
          fontWeight: 750,
          letterSpacing: "0.04em",
        }}
      >
        {formatLoanType(loan)}
      </span>,
      "type",
    ),
    field(
      "Principal",
      <span
        style={{
          ...amountStyle,
          fontSize: `${tokens.typography.mobileValue}px`,
          color: theme.colors.text.primary,
        }}
      >
        {formatCurrency(loan.amount)}
      </span>,
      "principal",
    ),
    field(
      "Outstanding",
      <span
        style={{
          ...outstandingStyle,
          fontSize: `${tokens.typography.mobileValue}px`,
          color: theme.colors.brand.primary,
        }}
      >
        {formatCurrency(loan.outstanding)}
      </span>,
      "outstanding",
    ),
    field("Loan Date", formatDate(loan.loanDate), "date", "secondary"),
    field(
      "Status",
      <span
        style={{
          ...statusBadgeStyle(loan.status),
          borderColor: theme.colors.border.strong,
          background: theme.colors.status.successSoft,
          color: theme.colors.status.success,
          fontSize: `${tokens.typography.mobileStatus}px`,
        }}
      >
        {formatStatus(loan)}
      </span>,
      "status",
    ),
    field(
      "View",
      <button
        type="button"
        onClick={() => onView(loan)}
        style={viewButtonStyle}
      >
        View Loan
      </button>,
      "view",
    ),
  ];

  // ==========================================================
  // MOBILE — ONE FIELD PER ROW
  // ==========================================================

  if (tokens.viewport === "mobile") {
    return <article style={recordStyle}>{fields}</article>;
  }

  // ==========================================================
  // TABLET — TWO FIELDS PER ROW
  // ==========================================================

  const rows: ReactNode[] = [];

  for (let index = 0; index < fields.length; index += 2) {
    rows.push(
      <div
        key={`row-${index}`}
        style={createLoansOfficeTabletFieldGridStyle(tokens)}
      >
        {fields[index]}
        {fields[index + 1] ?? null}
      </div>,
    );
  }

  return <article style={recordStyle}>{rows}</article>;
}

// ============================================================
// END
// ============================================================
