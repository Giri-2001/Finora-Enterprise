// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTIONS OFFICE RESPONSIVE PORTFOLIO RECORD™
//
// RESPONSIBILITY:
// - Mobile collection portfolio
// - Tablet collection portfolio
// - Preserve desktop table unchanged
//
// RESPONSIVE CONTRACT:
// - Mobile  : one field per row
// - Tablet  : two fields per row
// - Desktop : component is not rendered
// ============================================================

import type {
  CSSProperties,
  ReactNode,
} from "react";

import type {
  CollectionReviewData,
} from "../../../components/collections/CollectionReviewData";

import { useTheme } from "../../../themes/provider";

import {
  createLoansOfficeMobileFieldStyle,
  createLoansOfficeMobileRecordStyle,
  createLoansOfficeTabletFieldGridStyle,
} from "../../../utils/responsive/loansOffice/loansOffice.layout";

import type {
  LoansOfficeResponsiveTokens,
} from "../../../utils/responsive/loansOffice/loansOffice.types";

import {
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
} from "../CollectionsOffice.styles";

// ============================================================
// TYPES
// ============================================================

interface Props {
  collection: CollectionReviewData;

  index: number;

  tokens: LoansOfficeResponsiveTokens;

  formatCurrency(
    value: number | undefined,
  ): string;

  formatDate(
    value: string,
  ): string;

  getCollectionType(
    collection: CollectionReviewData,
  ): "EMI" | "MANUAL";

  onView(
    collection: CollectionReviewData,
  ): void;
}

// ============================================================
// COMPONENT
// ============================================================

export default function CollectionPortfolioResponsiveRecord({
  collection,
  index,
  tokens,
  formatCurrency,
  formatDate,
  getCollectionType,
  onView,
}: Props) {
  const { theme } = useTheme();

  const type =
    getCollectionType(
      collection,
    );

  const labelStyle: CSSProperties = {
    color: theme.colors.text.muted,

    fontSize: `${tokens.typography.mobileLabel}px`,

    fontWeight: 650,

    lineHeight: 1.2,

    textTransform: "uppercase",

    letterSpacing: "0.02em",
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

    color:
      theme.colors.text.secondary,
  };

  const recordStyle: CSSProperties = {
    ...createLoansOfficeMobileRecordStyle(
      tokens,
    ),

    borderTop:
      `1px solid ${theme.colors.border.subtle}`,

    background:
      theme.colors.background.surface,
  };

  const fieldStyle =
    (): CSSProperties => ({
      ...createLoansOfficeMobileFieldStyle(
        tokens,
      ),

      borderBottom:
        tokens.layout.mobileFieldSeparator
          ? `1px solid ${theme.colors.border.subtle}`
          : undefined,
    });

  const field = (
    label: string,

    value: ReactNode,

    key: string,

    secondary = false,
  ) => (
    <div
      key={key}
      style={fieldStyle()}
    >
      <div style={labelStyle}>
        {label}
      </div>

      <div
        style={
          secondary
            ? secondaryValueStyle
            : valueStyle
        }
      >
        {value}
      </div>
    </div>
  );

  const fields = [
    field(
      "S.No.",
      index + 1,
      "serial",
      true,
    ),

    field(
      "Receipt",
      <div style={receiptIdentityStyle}>
        <div
          style={{
            ...receiptNumberStyle,

            whiteSpace: "normal",

            overflow: "visible",

            textOverflow: "clip",
          }}
        >
          {collection.receiptNumber ||
            "--"}
        </div>

        <div
          style={{
            ...receiptReferenceStyle,

            whiteSpace: "normal",
          }}
        >
          {collection.paymentReference
            ? `Ref: ${collection.paymentReference}`
            : "No reference"}
        </div>
      </div>,
      "receipt",
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
          }}
        >
          {collection.customerName ||
            "--"}
        </div>

        <div
          style={{
            ...customerPhoneStyle,

            whiteSpace: "normal",
          }}
        >
          {collection.customerPhone ||
            "--"}
        </div>
      </div>,
      "customer",
    ),

    field(
      "Loan",
      <div style={loanIdentityStyle}>
        <div
          style={{
            ...loanNumberStyle,

            whiteSpace: "normal",

            overflow: "visible",

            textOverflow: "clip",
          }}
        >
          {collection.loanNumber ||
            "--"}
        </div>

        <div
          style={{
            ...loanIdStyle,

            whiteSpace: "normal",

            overflow: "visible",
          }}
        >
          {collection.loanId ||
            "--"}
        </div>
      </div>,
      "loan",
    ),

    field(
      "Type",
      <span
        style={
          collectionTypeBadgeStyle(
            type,
          )
        }
      >
        {type === "EMI"
          ? "EMI"
          : "Manual"}
      </span>,
      "type",
    ),

    field(
      "Collected",
      <span style={amountStyle}>
        {formatCurrency(
          collection.paymentAmount,
        )}
      </span>,
      "amount",
    ),

    field(
      "Outstanding",
      <span style={outstandingStyle}>
        {formatCurrency(
          collection.outstandingBalance,
        )}
      </span>,
      "outstanding",
    ),

    field(
      "Collection Date",
      formatDate(
        collection.receiptDate ||
          collection.createdAt,
      ),
      "date",
      true,
    ),

    field(
      "Status",
      <span
        style={
          statusBadgeStyle(
            collection.status,
          )
        }
      >
        {collection.status}
      </span>,
      "status",
    ),

    field(
      "View",
      <button
        type="button"
        onClick={() =>
          onView(
            collection,
          )
        }
        style={{
          ...viewButtonStyle,

          minHeight: "32px",

          padding: "0 12px",
        }}
      >
        View Collection
      </button>,
      "view",
    ),
  ];

  // ==========================================================
  // MOBILE
  // ==========================================================

  if (
    tokens.viewport ===
    "mobile"
  ) {
    return (
      <article style={recordStyle}>
        {fields}
      </article>
    );
  }

  // ==========================================================
  // TABLET
  // ==========================================================

  const rows: ReactNode[] =
    [];

  for (
    let fieldIndex = 0;
    fieldIndex <
    fields.length;
    fieldIndex += 2
  ) {
    rows.push(
      <div
        key={`row-${fieldIndex}`}
        style={
          createLoansOfficeTabletFieldGridStyle(
            tokens,
          )
        }
      >
        {fields[fieldIndex]}

        {fields[fieldIndex + 1] ??
          null}
      </div>,
    );
  }

  return (
    <article style={recordStyle}>
      {rows}
    </article>
  );
}

// ============================================================
// END
// ============================================================