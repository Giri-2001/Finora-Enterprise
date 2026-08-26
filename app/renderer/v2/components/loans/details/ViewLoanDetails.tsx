// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 LOANS OFFICE™
//
// VIEW LOAN DETAILS
//
// RESPONSIBILITY:
// - Display persisted Loan record
// - Read-only loan information
// - Customer information
// - Financial summary
// - Repayment information
// - Guarantor information
// - Purpose / remarks
// - Loan document evidence gallery
// - Repayment schedule
//
// IMPORTANT:
// - No business calculations
// - No persistence
// - No repository access
// - No Loan Studio dependency
// - No duplicate loan calculation
// - Read-only presentation only
// - Documents are read from the persisted Loan record
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { useState } from "react";

import type { CSSProperties } from "react";

import type { Loan } from "../../customers/office/CustomerOffice/types";

import type { DocumentsStudioItem } from "../documents/DocumentsStudio";

// ============================================================
// THEME ENGINE
// ============================================================

import { useTheme } from "../../../themes/provider/ThemeProvider";

import {
  responsiveMediaQuery,
  pageStyle,
  headerStyle,
  headerLeftStyle,
  backButtonStyle,
  headerAccentStyle,
  titleGroupStyle,
  titleStyle,
  subtitleStyle,
  headerMetaStyle,
  loanNumberBadgeStyle,
  contentGridStyle,
  sectionStyle,
  fullWidthSectionStyle,
  sectionHeaderStyle,
  sectionTitleStyle,
  sectionSubtitleStyle,
  infoGridStyle,
  infoItemStyle,
  infoLabelStyle,
  infoValueStyle,
  customerNameValueStyle,
  financialGridStyle,
  financialCardStyle,
  primaryFinancialCardStyle,
  outstandingFinancialCardStyle,
  financialLabelStyle,
  financialValueStyle,
  textBlockStyle,
  documentGalleryGridStyle,
  documentCardStyle,
  documentPreviewStyle,
  documentImageStyle,
  documentPdfPreviewStyle,
  documentPdfIconStyle,
  documentInfoStyle,
  documentNameStyle,
  documentTypeStyle,
  documentEmptyStyle,
  documentOpenButtonStyle,
  documentCountBadgeStyle,
  documentViewerBackdropStyle,
  documentViewerStyle,
  documentViewerHeaderStyle,
  documentViewerTitleStyle,
  documentViewerCloseStyle,
  documentViewerBodyStyle,
  documentViewerImageStyle,
  documentViewerPdfStyle,
  scheduleWrapperStyle,
  scheduleHeaderStyle,
  scheduleHeaderCellStyle,
  scheduleRowStyle,
  scheduleCellStyle,
  scheduleEmptyStyle,
  footerStyle,
  footerBackButtonStyle,
  statusBadgeStyle,
} from "./ViewLoanDetails.styles";

// ============================================================
// TYPES
// ============================================================

interface ViewLoanDetailsProps {
  loan: Loan;

  onBack: () => void;
}

// ============================================================
// HELPERS
// ============================================================

function safeNumber(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

// ============================================================
// CURRENCY
// ============================================================

function formatCurrency(value: number | undefined): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",

    currency: "INR",

    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

// ============================================================
// DATE
// ============================================================

function formatDate(value: string | undefined): string {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  const day = String(date.getDate()).padStart(2, "0");

  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${day}/${month}/${date.getFullYear()}`;
}

// ============================================================
// LOAN TYPE
// ============================================================

function formatLoanType(loan: Loan): string {
  const value = (loan.loanType || loan.repaymentType || "")
    .trim()
    .toUpperCase();

  switch (value) {
    case "DAILY":
      return "Daily Loan";

    case "WEEKLY":
      return "Weekly Loan";

    case "MONTHLY":
      return "Monthly Loan";

    default:
      return value || "--";
  }
}

// ============================================================
// STATUS
// ============================================================

function formatStatus(status: string | undefined): string {
  const normalized = (status || "").trim().toUpperCase();

  switch (normalized) {
    case "ACTIVE":
    case "RUNNING":
      return "Running";

    case "CLOSED":
      return "Closed";

    default:
      return status || "Pending";
  }
}

// ============================================================
// SAFE TEXT
// ============================================================

function safeText(value: string | number | undefined): string {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "--";
  }

  return String(value);
}

// ============================================================
// SCHEDULE VALUE HELPER
//
// ViewLoanDetails intentionally reads schedule values
// defensively without performing calculations.
// ============================================================

function getScheduleValue(installment: unknown, keys: string[]): unknown {
  if (!installment || typeof installment !== "object") {
    return undefined;
  }

  const record = installment as Record<string, unknown>;

  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }

  return undefined;
}

// ============================================================
// SCHEDULE TEXT
// ============================================================

function formatScheduleDate(value: unknown): string {
  if (typeof value !== "string") {
    return safeText(value as string | number | undefined);
  }

  return formatDate(value);
}

// ============================================================
// DOCUMENT SOURCE
//
// Persisted documents prefer dataUrl because the temporary
// object URL may no longer exist after the browser session.
//
// url remains as a fallback for documents that do not have
// a persisted data URL.
// ============================================================

function getDocumentSource(document: DocumentsStudioItem): string {
  return document.dataUrl || document.url || "";
}

// ============================================================
// DOCUMENT TYPE LABEL
// ============================================================

function getDocumentTypeLabel(document: DocumentsStudioItem): string {
  if (document.type === "pdf") {
    return "PDF";
  }

  if (document.mimeType) {
    const mimeType = document.mimeType.toLowerCase();

    if (mimeType.includes("webp")) {
      return "WEBP";
    }

    if (mimeType.includes("png")) {
      return "PNG";
    }

    if (mimeType.includes("gif")) {
      return "GIF";
    }

    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
      return "JPG";
    }
  }

  return "IMAGE";
}

// ============================================================
// COMPONENT
// ============================================================

type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

export default function ViewLoanDetails({
  loan,
  onBack,
}: ViewLoanDetailsProps) {
  // ==========================================================
  // FINORA THEME ENGINE
  //
  // Theme controls visual appearance only.
  // Existing page geometry and behaviour remain unchanged.
  // ==========================================================

  const { theme } = useTheme();

  const themeVariables: ThemeStyle = {
    "--finora-theme-brand-primary": theme.colors.brand.primary,

    "--finora-theme-brand-secondary": theme.colors.brand.secondary,

    "--finora-theme-brand-accent": theme.colors.brand.accent,

    "--finora-theme-brand-accent-soft": theme.colors.brand.accentSoft,

    "--finora-theme-background-page": theme.colors.background.page,

    "--finora-theme-page": theme.colors.background.page,

    "--finora-theme-background-surface": theme.colors.background.surface,

    "--finora-theme-surface": theme.colors.background.surface,

    "--finora-theme-background-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-surface-muted": theme.colors.background.surfaceMuted,

    "--finora-theme-surface-strong": theme.colors.background.surfaceStrong,

    "--finora-theme-text-primary": theme.colors.text.primary,

    "--finora-theme-text-secondary": theme.colors.text.secondary,

    "--finora-theme-text-muted": theme.colors.text.muted,

    "--finora-theme-text-inverse": theme.colors.text.inverse,

    "--finora-theme-border-default": theme.colors.border.default,

    "--finora-theme-border-strong": theme.colors.border.strong,

    "--finora-theme-border-subtle": theme.colors.border.subtle,

    "--finora-theme-focus": theme.colors.border.focus,

    "--finora-theme-success": theme.colors.status.success,

    "--finora-theme-success-soft": theme.colors.status.successSoft,

    "--finora-theme-warning": theme.colors.status.warning,

    "--finora-theme-warning-soft": theme.colors.status.warningSoft,

    "--finora-theme-danger": theme.colors.status.danger,

    "--finora-theme-danger-soft": theme.colors.status.dangerSoft,

    "--finora-theme-info": theme.colors.status.info,

    "--finora-theme-info-soft": theme.colors.status.infoSoft,

    "--finora-theme-overlay-shadow": theme.colors.overlay.shadow,

    "--finora-theme-overlay-backdrop": theme.colors.overlay.backdrop,
  };

  // ==========================================================
  // DERIVED DISPLAY VALUES
  // ==========================================================

  const loanNumber = loan.loanNumber || loan.id || "--";

  const status = formatStatus(loan.status);

  const loanType = formatLoanType(loan);

  const schedule = Array.isArray(loan.schedule) ? loan.schedule : [];

  const documents = Array.isArray(loan.documents) ? loan.documents : [];

  // ==========================================================
  // DOCUMENT VIEWER
  //
  // The gallery is read-only.
  //
  // Images open inside the FINORA viewer.
  // PDFs open in the browser PDF viewer.
  // ==========================================================

  const [viewerDocument, setViewerDocument] =
    useState<DocumentsStudioItem | null>(null);

  // ==========================================================
  // DOCUMENT OPEN
  // ==========================================================

  function handleDocumentOpen(document: DocumentsStudioItem): void {
    const source = getDocumentSource(document);

    if (!source) {
      return;
    }

    if (document.type === "pdf") {
      window.open(source, "_blank", "noopener,noreferrer");

      return;
    }

    setViewerDocument(document);
  }

  // ==========================================================
  // CLOSE DOCUMENT VIEWER
  // ==========================================================

  function closeDocumentViewer(): void {
    setViewerDocument(null);
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="finora-view-loan-page"
      style={{
        ...pageStyle,
        ...themeVariables,
      }}
    >
      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="finora-view-loan-header" style={headerStyle}>
        <div className="finora-view-loan-header-left" style={headerLeftStyle}>
          <button type="button" onClick={onBack} style={backButtonStyle}>
            ← Back
          </button>

          <div style={headerAccentStyle} aria-hidden="true" />

          <div className="finora-view-loan-title-group" style={titleGroupStyle}>
            <h1 className="finora-view-loan-title" style={titleStyle}>
              View Loan Details
            </h1>

            <p className="finora-view-loan-subtitle" style={subtitleStyle}>
              Read-only loan information and repayment overview.
            </p>
          </div>
        </div>

        <div className="finora-view-loan-header-meta" style={headerMetaStyle}>
          <span style={loanNumberBadgeStyle}>{loanNumber}</span>

          <span style={statusBadgeStyle(loan.status)}>{status}</span>
        </div>
      </header>

      {/* ====================================================
          MAIN CONTENT
      ==================================================== */}

      <div className="finora-view-loan-content-grid" style={contentGridStyle}>
        {/* ==================================================
            LEFT COLUMN
        ================================================== */}

        <div className="finora-view-loan-column">
          {/* ================================================
              CUSTOMER
          ================================================ */}

          <section style={sectionStyle}>
            <div
              className="finora-view-loan-section-header"
              style={sectionHeaderStyle}
            >
              <div>
                <h2 style={sectionTitleStyle}>Customer Information</h2>

                <p style={sectionSubtitleStyle}>
                  Customer identity linked to this loan.
                </p>
              </div>
            </div>

            <div className="finora-view-loan-info-grid" style={infoGridStyle}>
              <div style={infoItemStyle}>
                <span style={infoLabelStyle}>Customer Name</span>

                <strong style={customerNameValueStyle}>
                  {safeText(loan.customerName)}
                </strong>
              </div>

              <div style={infoItemStyle}>
                <span style={infoLabelStyle}>Customer ID</span>

                <span style={infoValueStyle}>{safeText(loan.customerId)}</span>
              </div>

              <div style={infoItemStyle}>
                <span style={infoLabelStyle}>Phone Number</span>

                <span style={infoValueStyle}>{safeText(loan.phoneNumber)}</span>
              </div>

              <div style={infoItemStyle}>
                <span style={infoLabelStyle}>Loan Number</span>

                <span style={infoValueStyle}>{loanNumber}</span>
              </div>
            </div>
          </section>

          {/* ================================================
              LOAN INFORMATION
          ================================================ */}

          <section style={sectionStyle}>
            <div
              className="finora-view-loan-section-header"
              style={sectionHeaderStyle}
            >
              <div>
                <h2 style={sectionTitleStyle}>Loan Information</h2>

                <p style={sectionSubtitleStyle}>
                  Core configuration saved with the loan.
                </p>
              </div>
            </div>

            <div className="finora-view-loan-info-grid" style={infoGridStyle}>
              <div style={infoItemStyle}>
                <span style={infoLabelStyle}>Loan Type</span>

                <span style={infoValueStyle}>{loanType}</span>
              </div>

              <div style={infoItemStyle}>
                <span style={infoLabelStyle}>Status</span>

                <span style={infoValueStyle}>{status}</span>
              </div>

              <div style={infoItemStyle}>
                <span style={infoLabelStyle}>Interest</span>

                <span style={infoValueStyle}>{safeNumber(loan.interest)}%</span>
              </div>

              <div style={infoItemStyle}>
                <span style={infoLabelStyle}>Repayment Type</span>

                <span style={infoValueStyle}>
                  {safeText(loan.repaymentType)}
                </span>
              </div>

              <div style={infoItemStyle}>
                <span style={infoLabelStyle}>Duration</span>

                <span style={infoValueStyle}>
                  {loan.duration !== undefined
                    ? `${loan.duration} ${loan.durationType || ""}`.trim()
                    : "--"}
                </span>
              </div>

              <div style={infoItemStyle}>
                <span style={infoLabelStyle}>Loan Date</span>

                <span style={infoValueStyle}>{formatDate(loan.loanDate)}</span>
              </div>

              <div style={infoItemStyle}>
                <span style={infoLabelStyle}>Due / Maturity Date</span>

                <span style={infoValueStyle}>{formatDate(loan.dueDate)}</span>
              </div>

              <div style={infoItemStyle}>
                <span style={infoLabelStyle}>Loan Title</span>

                <span style={infoValueStyle}>{safeText(loan.title)}</span>
              </div>
            </div>
          </section>

          {/* ================================================
              PURPOSE / REMARKS
          ================================================ */}

          <section style={sectionStyle}>
            <div
              className="finora-view-loan-section-header"
              style={sectionHeaderStyle}
            >
              <div>
                <h2 style={sectionTitleStyle}>Purpose & Remarks</h2>
              </div>
            </div>

            <div className="finora-view-loan-text-grid">
              <div>
                <span style={infoLabelStyle}>Purpose</span>

                <div style={textBlockStyle}>{safeText(loan.purpose)}</div>
              </div>

              <div>
                <span style={infoLabelStyle}>Remarks</span>

                <div style={textBlockStyle}>{safeText(loan.remarks)}</div>
              </div>
            </div>
          </section>

          {/* ================================================
              LOAN DOCUMENTS / EVIDENCE
          ================================================ */}

          <section style={sectionStyle}>
            <div
              className="finora-view-loan-section-header"
              style={sectionHeaderStyle}
            >
              <div>
                <h2 style={sectionTitleStyle}>Loan Documents / Evidence</h2>

                <p style={sectionSubtitleStyle}>
                  Documents persisted with this loan.
                </p>
              </div>

              <span
                className="finora-view-loan-document-count"
                style={documentCountBadgeStyle}
              >
                {documents.length}{" "}
                {documents.length === 1 ? "document" : "documents"}
              </span>
            </div>

            {documents.length === 0 ? (
              <div style={documentEmptyStyle}>
                No loan documents are currently stored for this loan.
              </div>
            ) : (
              <div
                className="finora-loan-document-gallery"
                style={documentGalleryGridStyle}
              >
                {documents.map((document) => {
                  const source = getDocumentSource(document);

                  const typeLabel = getDocumentTypeLabel(document);

                  return (
                    <article key={document.id} style={documentCardStyle}>
                      <button
                        type="button"
                        onClick={() => handleDocumentOpen(document)}
                        style={documentPreviewStyle}
                        aria-label={`Open ${document.name}`}
                      >
                        {document.type === "image" ? (
                          source ? (
                            <img
                              src={source}
                              alt={document.name}
                              style={documentImageStyle}
                            />
                          ) : (
                            <div style={documentPdfPreviewStyle}>
                              <span style={documentPdfIconStyle}>IMG</span>
                            </div>
                          )
                        ) : (
                          <div style={documentPdfPreviewStyle}>
                            <span style={documentPdfIconStyle}>PDF</span>
                          </div>
                        )}
                      </button>

                      <div style={documentInfoStyle}>
                        <div style={documentNameStyle} title={document.name}>
                          {document.name}
                        </div>

                        <div style={documentTypeStyle}>{typeLabel}</div>

                        <button
                          type="button"
                          onClick={() => handleDocumentOpen(document)}
                          style={documentOpenButtonStyle}
                        >
                          {document.type === "pdf" ? "Open PDF" : "View"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ==================================================
            RIGHT COLUMN
        ================================================== */}

        <div className="finora-view-loan-column">
          {/* ================================================
              FINANCIAL SUMMARY
          ================================================ */}

          <section style={sectionStyle}>
            <div
              className="finora-view-loan-section-header"
              style={sectionHeaderStyle}
            >
              <div>
                <h2 style={sectionTitleStyle}>Financial Summary</h2>

                <p style={sectionSubtitleStyle}>
                  Persisted loan financial values.
                </p>
              </div>
            </div>

            <div
              className="finora-view-loan-financial-grid"
              style={financialGridStyle}
            >
              <div style={primaryFinancialCardStyle}>
                <span style={financialLabelStyle}>Principal</span>

                <strong style={financialValueStyle}>
                  {formatCurrency(loan.amount)}
                </strong>
              </div>

              <div style={outstandingFinancialCardStyle}>
                <span style={financialLabelStyle}>Outstanding</span>

                <strong style={financialValueStyle}>
                  {formatCurrency(loan.outstanding)}
                </strong>
              </div>

              <div style={financialCardStyle}>
                <span style={financialLabelStyle}>Processing Fee</span>

                <strong style={financialValueStyle}>
                  {formatCurrency(loan.processingFee)}
                </strong>
              </div>

              <div style={financialCardStyle}>
                <span style={financialLabelStyle}>Advance Deduction</span>

                <strong style={financialValueStyle}>
                  {formatCurrency(loan.advanceDeduction)}
                </strong>
              </div>

              <div style={primaryFinancialCardStyle}>
                <span style={financialLabelStyle}>Net Disbursement</span>

                <strong style={financialValueStyle}>
                  {formatCurrency(loan.netDisbursement)}
                </strong>
              </div>

              <div style={financialCardStyle}>
                <span style={financialLabelStyle}>Late Fee</span>

                <strong style={financialValueStyle}>
                  {formatCurrency(loan.lateFee)}
                </strong>
              </div>
            </div>
          </section>

          {/* ================================================
              GUARANTOR
          ================================================ */}

          <section style={sectionStyle}>
            <div
              className="finora-view-loan-section-header"
              style={sectionHeaderStyle}
            >
              <div>
                <h2 style={sectionTitleStyle}>Guarantor</h2>

                <p style={sectionSubtitleStyle}>
                  Guarantor information recorded for this loan.
                </p>
              </div>
            </div>

            <div style={infoGridStyle}>
              <div style={infoItemStyle}>
                <span style={infoLabelStyle}>Guarantor Name</span>

                <span style={infoValueStyle}>{safeText(loan.guarantor)}</span>
              </div>

              <div style={infoItemStyle}>
                <span style={infoLabelStyle}>Guarantor</span>

                <span style={infoValueStyle}>{safeText(loan.guarantor)}</span>
              </div>
            </div>
          </section>

          {/* ================================================
              REPAYMENT
          ================================================ */}

          <section style={sectionStyle}>
            <div
              className="finora-view-loan-section-header"
              style={sectionHeaderStyle}
            >
              <div>
                <h2 style={sectionTitleStyle}>Repayment</h2>

                <p style={sectionSubtitleStyle}>
                  Current repayment configuration.
                </p>
              </div>
            </div>

            <div style={infoGridStyle}>
              <div style={infoItemStyle}>
                <span style={infoLabelStyle}>Repayment Type</span>

                <span style={infoValueStyle}>
                  {safeText(loan.repaymentType)}
                </span>
              </div>

              <div style={infoItemStyle}>
                <span style={infoLabelStyle}>Schedule Entries</span>

                <span style={infoValueStyle}>{schedule.length}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ====================================================
          REPAYMENT SCHEDULE
      ==================================================== */}

      <section style={fullWidthSectionStyle}>
        <div
          className="finora-view-loan-section-header"
          style={sectionHeaderStyle}
        >
          <div>
            <h2 style={sectionTitleStyle}>Repayment Schedule</h2>

            <p style={sectionSubtitleStyle}>
              Persisted installment schedule for this loan.
            </p>
          </div>
        </div>

        {schedule.length === 0 ? (
          <div style={scheduleEmptyStyle}>
            No repayment schedule is currently stored for this loan.
          </div>
        ) : (
          <div style={scheduleWrapperStyle}>
            <div style={scheduleHeaderStyle}>
              <div style={scheduleHeaderCellStyle}>#</div>

              <div style={scheduleHeaderCellStyle}>Due Date</div>

              <div style={scheduleHeaderCellStyle}>Principal</div>

              <div style={scheduleHeaderCellStyle}>Interest</div>

              <div style={scheduleHeaderCellStyle}>Installment</div>

              <div style={scheduleHeaderCellStyle}>Balance</div>
            </div>

            {schedule.map((installment, index) => {
              const installmentNumber = getScheduleValue(installment, [
                "installmentNumber",
                "installment",
                "number",
                "sequence",
              ]);

              const dueDate = getScheduleValue(installment, [
                "dueDate",
                "date",
                "installmentDate",
              ]);

              const principal = getScheduleValue(installment, [
                "principal",
                "principalAmount",
              ]);

              const interest = getScheduleValue(installment, [
                "interest",
                "interestAmount",
              ]);

              const installmentAmount = getScheduleValue(installment, [
                "installmentAmount",
                "emi",
                "amount",
                "total",
              ]);

              const balance = getScheduleValue(installment, [
                "balance",
                "outstanding",
                "remainingBalance",
              ]);

              return (
                <div
                  key={String(installmentNumber ?? index)}
                  style={scheduleRowStyle}
                >
                  <div style={scheduleCellStyle}>
                    {safeText(
                      (installmentNumber ?? index + 1) as string | number,
                    )}
                  </div>

                  <div style={scheduleCellStyle}>
                    {formatScheduleDate(dueDate)}
                  </div>

                  <div style={scheduleCellStyle}>
                    {typeof principal === "number"
                      ? formatCurrency(principal)
                      : safeText(principal as string | number | undefined)}
                  </div>

                  <div style={scheduleCellStyle}>
                    {typeof interest === "number"
                      ? formatCurrency(interest)
                      : safeText(interest as string | number | undefined)}
                  </div>

                  <div style={scheduleCellStyle}>
                    {typeof installmentAmount === "number"
                      ? formatCurrency(installmentAmount)
                      : safeText(
                          installmentAmount as string | number | undefined,
                        )}
                  </div>

                  <div style={scheduleCellStyle}>
                    {typeof balance === "number"
                      ? formatCurrency(balance)
                      : safeText(balance as string | number | undefined)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ====================================================
          FOOTER
      ==================================================== */}

      <footer style={footerStyle}>
        <button type="button" onClick={onBack} style={footerBackButtonStyle}>
          ← Back to Loans Office
        </button>
      </footer>

      {/* ====================================================
          IMAGE DOCUMENT VIEWER
      ==================================================== */}

      {viewerDocument && (
        <div
          className="finora-view-loan-document-viewer-backdrop"
          style={documentViewerBackdropStyle}
          role="dialog"
          aria-modal="true"
          aria-label={viewerDocument.name}
          onClick={closeDocumentViewer}
        >
          <div
            className="finora-view-loan-document-viewer"
            style={documentViewerStyle}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={documentViewerHeaderStyle}>
              <div style={documentViewerTitleStyle} title={viewerDocument.name}>
                {viewerDocument.name}
              </div>

              <button
                type="button"
                onClick={closeDocumentViewer}
                style={documentViewerCloseStyle}
                aria-label="Close document viewer"
              >
                ×
              </button>
            </div>

            <div
              className="finora-view-loan-document-viewer-body"
              style={documentViewerBodyStyle}
            >
              {getDocumentSource(viewerDocument) ? (
                <img
                  src={getDocumentSource(viewerDocument)}
                  alt={viewerDocument.name}
                  style={documentViewerImageStyle}
                />
              ) : (
                <div style={documentViewerPdfStyle}>
                  Document preview unavailable.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          RESPONSIVE CSS
      ==================================================== */}

      <style>{responsiveMediaQuery}</style>
    </div>
  );
}

// ============================================================
// END
// ============================================================
