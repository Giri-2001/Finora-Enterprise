// ============================================================
// FINORA ENTERPRISE OS™
//
// VIEW COLLECTION DETAILS
//
// RESPONSIBILITY:
// - Read-only persisted Collection transaction
// - Customer information
// - Loan information
// - Payment information
// - Settlement information
// - EMI information
// - Reference number
// - Remarks
// - Receipt / audit information
//
// IMPORTANT:
// - No persistence.
// - No repository access.
// - No service access.
// - No business mutation.
// ============================================================

import type { CSSProperties } from "react";

import type { CollectionReviewData } from "../CollectionReviewData";

import type { DocumentsStudioItem } from "../../loans/documents/DocumentsStudio";

import LoanDocuments from "../collectionStudio/LoanDocuments";
import CollectionEmiSchedule from "../collectionStudio/CollectionEmiSchedule";
import CollectionHistory from "../collectionStudio/CollectionHistory";

import { useTheme } from "../../../themes/provider";

import {
  pageStyle,
  headerStyle,
  headerLeftStyle,
  backButtonStyle,
  titleStyle,
  subtitleStyle,
  receiptBadgeStyle,
  contentGridStyle,
  columnStyle,
  sectionStyle,
  sectionTitleStyle,
  infoGridStyle,
  infoItemStyle,
  labelStyle,
  valueStyle,
  amountValueStyle,
  remarksStyle,
  statusStyle,
  footerStyle,
  responsiveCss,
} from "./ViewCollectionDetails.styles";

// ============================================================
// TYPES
// ============================================================

interface Props {
  collection: CollectionReviewData;

  loanDocuments?: DocumentsStudioItem[];

  onBack(): void;
}

type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

// ============================================================
// HELPERS
// ============================================================

function safeNumber(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatCurrency(value: number | undefined): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",

    currency: "INR",

    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

function safeText(value: string | number | undefined): string {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "--";
  }

  return String(value);
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

function formatDateTime(value: string | undefined): string {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString("en-IN");
}

function getCollectionType(collection: CollectionReviewData): string {
  if (collection.collectionType === "emi") {
    return "EMI Collection";
  }

  if (collection.collectionType === "manual") {
    return "Manual Collection";
  }

  if (collection.selectedEmiNumbers?.length) {
    return "EMI Collection";
  }

  return "Manual Collection";
}

// ============================================================
// COMPONENT
// ============================================================

export default function ViewCollectionDetails({
  collection,
  loanDocuments = [],
  onBack,
}: Props) {
  const { theme } = useTheme();

  const themeVariables: ThemeStyle = {
    "--finora-theme-background-page": theme.colors.background.page,

    "--finora-theme-background-surface": theme.colors.background.surface,

    "--finora-theme-background-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-text-primary": theme.colors.text.primary,

    "--finora-theme-text-secondary": theme.colors.text.secondary,

    "--finora-theme-text-muted": theme.colors.text.muted,

    "--finora-theme-border-default": theme.colors.border.default,

    "--finora-theme-border-strong": theme.colors.border.strong,

    "--finora-theme-brand-primary": theme.colors.brand.primary,

    "--finora-theme-brand-accent-soft": theme.colors.brand.accentSoft,

    "--finora-theme-success": theme.colors.status.success,

    "--finora-theme-success-soft": theme.colors.status.successSoft,
  };

  const selectedEmis = collection.selectedEmiNumbers?.length
    ? collection.selectedEmiNumbers.join(", ")
    : "--";

  return (
    <main
      className="finora-view-collection-page"
      style={{
        ...pageStyle,
        ...themeVariables,
      }}
    >
      <header className="finora-view-collection-header" style={headerStyle}>
        <div style={headerLeftStyle}>
          <button type="button" onClick={onBack} style={backButtonStyle}>
            ← Back
          </button>

          <div>
            <h1 style={titleStyle}>View Collection Details</h1>

            <p style={subtitleStyle}>
              Read-only persisted collection transaction.
            </p>
          </div>
        </div>

        <span style={receiptBadgeStyle}>
          {collection.receiptNumber || "No Receipt"}
        </span>
      </header>

      <div className="finora-view-collection-grid" style={contentGridStyle}>
        {/* LEFT */}

        <div style={columnStyle}>
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Customer Information</h2>

            <div
              className="finora-view-collection-info-grid"
              style={infoGridStyle}
            >
              <Info label="Customer Name" value={collection.customerName} />

              <Info label="Customer ID" value={collection.customerId} />

              <Info label="Phone Number" value={collection.customerPhone} />

              <Info
                label="Collection Type"
                value={getCollectionType(collection)}
              />
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Loan Information</h2>

            <div
              className="finora-view-collection-info-grid"
              style={infoGridStyle}
            >
              <Info label="Loan Number" value={collection.loanNumber} />

              <Info label="Loan ID" value={collection.loanId} />

              <Info
                label="Original Principal"
                value={formatCurrency(collection.loanAmount)}
              />

              <Info
                label="Interest Rate"
                value={`${safeNumber(collection.loanInterestRate)}%`}
              />

              <Info label="Loan Date" value={formatDate(collection.loanDate)} />

              <Info
                label="Recorded Outstanding"
                value={formatCurrency(collection.outstandingBalance)}
                amount
              />
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Payment Details</h2>

            <div
              className="finora-view-collection-info-grid"
              style={infoGridStyle}
            >
              <Info
                label="Collected Amount"
                value={formatCurrency(collection.paymentAmount)}
                amount
              />

              <Info label="Payment Method" value={collection.paymentMethod} />

              <Info
                label="Reference Number"
                value={collection.paymentReference}
              />

              <Info
                label="Receipt Date"
                value={formatDate(collection.receiptDate)}
              />
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Remarks</h2>

            <div style={remarksStyle}>
              {collection.remarks?.trim()
                ? collection.remarks
                : "No remarks recorded for this collection."}
            </div>
          </section>
        </div>

        {/* RIGHT */}

        <div style={columnStyle}>
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>EMI Information</h2>

            <div
              className="finora-view-collection-info-grid"
              style={infoGridStyle}
            >
              <Info label="Selected EMI Numbers" value={selectedEmis} />

              <Info
                label="Selected EMI Amount"
                value={formatCurrency(collection.selectedEmiAmount)}
              />

              <Info
                label="Today Due"
                value={formatCurrency(collection.todayDue)}
              />

              <Info
                label="Previous Due"
                value={formatCurrency(collection.previousDue)}
              />
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Settlement Details</h2>

            <div
              className="finora-view-collection-info-grid"
              style={infoGridStyle}
            >
              <Info
                label="Penalty"
                value={formatCurrency(collection.penaltyAmount)}
              />

              <Info
                label="Discount"
                value={formatCurrency(collection.discountAmount)}
              />

              <Info
                label="Advance Adjustment"
                value={formatCurrency(collection.advanceAdjustment)}
              />

              <Info
                label="Outstanding"
                value={formatCurrency(collection.outstandingBalance)}
                amount
              />
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Receipt & Audit</h2>

            <div
              className="finora-view-collection-info-grid"
              style={infoGridStyle}
            >
              <Info label="Receipt Number" value={collection.receiptNumber} />

              <div style={infoItemStyle}>
                <span style={labelStyle}>Status</span>

                <span style={statusStyle}>{collection.status}</span>
              </div>

              <Info
                label="Created At"
                value={formatDateTime(collection.createdAt)}
              />

              <Info
                label="Updated At"
                value={formatDateTime(collection.updatedAt)}
              />
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Payment Reference</h2>

            <div style={remarksStyle}>
              {collection.paymentReference?.trim()
                ? collection.paymentReference
                : "No payment reference recorded."}
            </div>
          </section>
        </div>
      </div>
      <LoanDocuments documents={loanDocuments} />

      <CollectionEmiSchedule loanId={collection.loanId} />

      <CollectionHistory loanId={collection.loanId} />

      <footer style={footerStyle}>
        <button type="button" onClick={onBack} style={backButtonStyle}>
          ← Back to Collections Office
        </button>
      </footer>

      <style>{responsiveCss}</style>
    </main>
  );
}

// ============================================================
// INFO ITEM
// ============================================================

function Info({
  label,
  value,
  amount = false,
}: {
  label: string;

  value: string | number | undefined;

  amount?: boolean;
}) {
  return (
    <div style={infoItemStyle}>
      <span style={labelStyle}>{label}</span>

      <span style={amount ? amountValueStyle : valueStyle}>
        {safeText(value)}
      </span>
    </div>
  );
}

// ============================================================
// END
// ============================================================
