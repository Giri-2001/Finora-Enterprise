// ============================================================
// FINORA ENTERPRISE OS™
//
// REPORTS ENGINE™
//
// CLOSED LOANS PDF
//
// RESPONSIBILITY:
//
// - Build production Closed Loans PDF
// - Render Closed Loans financial summary
// - Render loan-wise settlement reconciliation
// - Show residual outstanding integrity status
// - Download Closed Loans PDF
// - Print Closed Loans PDF
// - Share Closed Loans PDF through Android native share sheet
//
// IMPORTANT:
//
// - Data comes through closedLoansDataService
// - No repository access
// - No StorageManager access
// - No localStorage access
// - No Loan mutation
// - No Collection mutation
//
// FINANCIAL RECONCILIATION:
//
// Total Payable
//   - Collected
//   - Discount
//   - Settlement Adjustment
//   = Residual Outstanding
//
// CLOSED Loans should normally have:
//
//   Residual Outstanding = 0
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { jsPDF } from "jspdf";

import { buildClosedLoansReport } from "./closedLoansDataService";

import type {
  ClosedLoanReportRow,
  ClosedLoansReport,
} from "./closedLoansDataService";

import {
  addFinoraPdfFooters,
  createFinoraPdf,
  downloadFinoraPdf,
  printFinoraPdf,
  shareFinoraPdf,
} from "./reportPdfService";

// ============================================================
// PDF GEOMETRY
// ============================================================

const PAGE_MARGIN_X = 15;

const PAGE_TOP = 18;

const PAGE_BOTTOM_RESERVED = 18;

const CONTENT_START_Y = 47;

// ============================================================
// MONEY
// ============================================================

function formatMoney(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;

  return `INR ${Math.round(safeValue).toLocaleString("en-IN")}`;
}

// ============================================================
// TEXT
// ============================================================

function safeText(value: unknown, fallback = "--"): string {
  const text = String(value ?? "").trim();

  return text || fallback;
}

// ============================================================
// DATE
// ============================================================

function formatDate(value: string): string {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return "--";
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",

    month: "short",

    year: "numeric",
  });
}

// ============================================================
// PAGE WIDTH
// ============================================================

function getPageContentWidth(document: jsPDF): number {
  return document.internal.pageSize.getWidth() - PAGE_MARGIN_X * 2;
}

// ============================================================
// CONTINUATION PAGE
// ============================================================

function addContinuationPage(document: jsPDF): number {
  document.addPage();

  document.setFont("helvetica", "normal");

  document.setFontSize(8);

  document.setTextColor(0);

  document.text("FINORA ENTERPRISE - CLOSED LOANS", PAGE_MARGIN_X, PAGE_TOP);

  document.setLineWidth(0.2);

  document.line(
    PAGE_MARGIN_X,
    PAGE_TOP + 4,
    document.internal.pageSize.getWidth() - PAGE_MARGIN_X,
    PAGE_TOP + 4,
  );

  return PAGE_TOP + 12;
}

// ============================================================
// PAGE BREAK
// ============================================================

function ensurePageSpace(
  document: jsPDF,

  currentY: number,

  requiredHeight: number,
): number {
  const pageHeight = document.internal.pageSize.getHeight();

  const usableBottom = pageHeight - PAGE_BOTTOM_RESERVED;

  if (currentY + requiredHeight <= usableBottom) {
    return currentY;
  }

  return addContinuationPage(document);
}

// ============================================================
// SECTION TITLE
// ============================================================

function drawSectionTitle(
  document: jsPDF,

  title: string,

  currentY: number,
): number {
  const y = ensurePageSpace(document, currentY, 12);

  document.setFont("helvetica", "bold");

  document.setFontSize(11);

  document.setTextColor(0);

  document.text(title, PAGE_MARGIN_X, y);

  document.setLineWidth(0.25);

  document.line(
    PAGE_MARGIN_X,
    y + 3,
    document.internal.pageSize.getWidth() - PAGE_MARGIN_X,
    y + 3,
  );

  return y + 9;
}

// ============================================================
// METRIC TYPE
// ============================================================

interface PdfMetric {
  label: string;

  value: string;
}

// ============================================================
// METRIC GRID
// ============================================================

function drawMetricGrid(
  document: jsPDF,

  metrics: PdfMetric[],

  currentY: number,

  columns = 2,
): number {
  const contentWidth = getPageContentWidth(document);

  const gap = 4;

  const columnWidth = (contentWidth - gap * (columns - 1)) / columns;

  const rowHeight = 16;

  let y = currentY;

  for (let index = 0; index < metrics.length; index += columns) {
    y = ensurePageSpace(document, y, rowHeight + 2);

    const row = metrics.slice(index, index + columns);

    row.forEach((metric, columnIndex) => {
      const x = PAGE_MARGIN_X + columnIndex * (columnWidth + gap);

      document.setDrawColor(210);

      document.setFillColor(248, 249, 251);

      document.roundedRect(x, y, columnWidth, rowHeight, 2, 2, "FD");

      document.setFont("helvetica", "normal");

      document.setFontSize(7);

      document.setTextColor(100);

      document.text(metric.label, x + 3, y + 5);

      document.setFont("helvetica", "bold");

      document.setFontSize(9);

      document.setTextColor(20);

      const valueLines = document.splitTextToSize(
        metric.value,
        columnWidth - 6,
      );

      document.text(valueLines, x + 3, y + 11);
    });

    y += rowHeight + 3;
  }

  document.setTextColor(0);

  return y;
}

// ============================================================
// TABLE COLUMN
// ============================================================

interface PdfTableColumn {
  label: string;

  width: number;

  align?: "left" | "center" | "right";
}

// ============================================================
// FIT TABLE TEXT
// ============================================================

function fitTableText(
  document: jsPDF,

  value: string,

  maxWidth: number,
): {
  text: string;

  fontSize: number;
} {
  const text = safeText(value);

  let fontSize = 7;

  document.setFontSize(fontSize);

  while (fontSize > 4.5 && document.getTextWidth(text) > maxWidth) {
    fontSize -= 0.25;

    document.setFontSize(fontSize);
  }

  return {
    text,

    fontSize,
  };
}

// ============================================================
// TABLE HEADER
// ============================================================

function drawTableHeader(
  document: jsPDF,

  columns: PdfTableColumn[],

  currentY: number,
): number {
  const rowHeight = 8;

  let x = PAGE_MARGIN_X;

  document.setFillColor(240, 242, 245);

  document.rect(
    PAGE_MARGIN_X,
    currentY,
    getPageContentWidth(document),
    rowHeight,
    "F",
  );

  document.setFont("helvetica", "bold");

  document.setFontSize(6.25);

  document.setTextColor(60);

  columns.forEach((column) => {
    const align = column.align ?? "left";

    const textX =
      align === "right"
        ? x + column.width - 2
        : align === "center"
          ? x + column.width / 2
          : x + 2;

    document.text(column.label, textX, currentY + 5, {
      align,
    });

    x += column.width;
  });

  document.setTextColor(0);

  return currentY + rowHeight;
}

// ============================================================
// TABLE ROW
// ============================================================

function drawTableRow(
  document: jsPDF,

  columns: PdfTableColumn[],

  values: string[],

  currentY: number,

  rowHeight = 8,
): number {
  let x = PAGE_MARGIN_X;

  document.setDrawColor(225);

  document.line(
    PAGE_MARGIN_X,
    currentY + rowHeight,
    document.internal.pageSize.getWidth() - PAGE_MARGIN_X,
    currentY + rowHeight,
  );

  document.setFont("helvetica", "normal");

  document.setTextColor(35);

  columns.forEach((column, index) => {
    const align = column.align ?? "left";

    const rawValue = values[index] ?? "--";

    const fitted = fitTableText(document, rawValue, column.width - 4);

    const textX =
      align === "right"
        ? x + column.width - 2
        : align === "center"
          ? x + column.width / 2
          : x + 2;

    document.setFontSize(fitted.fontSize);

    document.text(fitted.text, textX, currentY + 5, {
      align,
    });

    x += column.width;
  });

  document.setFontSize(7);

  document.setTextColor(0);

  return currentY + rowHeight;
}

// ============================================================
// SUMMARY METRICS
// ============================================================

function getSummaryMetrics(report: ClosedLoansReport): PdfMetric[] {
  return [
    {
      label: "Closed Loans",

      value: report.loanCount.toLocaleString("en-IN"),
    },

    {
      label: "Customers",

      value: report.customerCount.toLocaleString("en-IN"),
    },

    {
      label: "Collection Transactions",

      value: report.collectionCount.toLocaleString("en-IN"),
    },

    {
      label: "Total Principal",

      value: formatMoney(report.totalPrincipal),
    },

    {
      label: "Total Payable",

      value: formatMoney(report.totalPayable),
    },

    {
      label: "Total Collected",

      value: formatMoney(report.totalCollected),
    },

    {
      label: "Total Discount",

      value: formatMoney(report.totalDiscount),
    },

    {
      label: "Settlement Adjustment",

      value: formatMoney(report.settlementAdjustment),
    },

    {
      label: "Settlement Value",

      value: formatMoney(report.settlementValue),
    },

    {
      label: "Residual Outstanding",

      value: formatMoney(report.totalResidualOutstanding),
    },

    {
      label: "Residual Closed Loans",

      value: report.residualLoanCount.toLocaleString("en-IN"),
    },

    {
      label: "Average Collected / Loan",

      value: formatMoney(report.averageCollectedPerLoan),
    },
  ];
}

// ============================================================
// CLOSED LOAN TABLE
// ============================================================

function drawClosedLoansTable(
  document: jsPDF,

  loans: ClosedLoanReportRow[],

  currentY: number,
): number {
  const columns: PdfTableColumn[] = [
    {
      label: "Customer",

      width: 27,
    },

    {
      label: "Loan",

      width: 35,
    },

    {
      label: "Date",

      width: 20,
    },

    {
      label: "Payable",

      width: 24,

      align: "right",
    },

    {
      label: "Collected",

      width: 24,

      align: "right",
    },

    {
      label: "Discount",

      width: 20,

      align: "right",
    },

    {
      label: "Adjust.",

      width: 16,

      align: "right",
    },

    {
      label: "Residual",

      width: 14,

      align: "right",
    },
  ];

  let y = ensurePageSpace(document, currentY, loans.length > 0 ? 29 : 20);

  y = drawSectionTitle(document, "CLOSED LOAN RECONCILIATION", y);

  if (loans.length === 0) {
    document.setFont("helvetica", "normal");

    document.setFontSize(8);

    document.text(
      "No CLOSED Loans are currently stored in FINORA.",
      PAGE_MARGIN_X,
      y,
    );

    return y + 10;
  }

  y = drawTableHeader(document, columns, y);

  for (const loan of loans) {
    const pageHeight = document.internal.pageSize.getHeight();

    if (y + 8 > pageHeight - PAGE_BOTTOM_RESERVED) {
      y = addContinuationPage(document);

      y = drawTableHeader(document, columns, y);
    }

    y = drawTableRow(
      document,
      columns,
      [
        safeText(loan.customerName),

        safeText(loan.loanNumber),

        formatDate(loan.loanDate),

        formatMoney(loan.totalPayable),

        formatMoney(loan.totalCollected),

        formatMoney(loan.totalDiscount),

        formatMoney(loan.settlementAdjustment),

        formatMoney(loan.currentOutstanding),
      ],
      y,
    );
  }

  // ==========================================================
  // RECONCILIATION NOTE
  // ==========================================================

  y = ensurePageSpace(document, y + 4, 18);

  document.setFont("helvetica", "italic");

  document.setFontSize(6.5);

  document.setTextColor(100);

  const note = document.splitTextToSize(
    "Reconciliation rule: Total Payable - Collected - Discount - Settlement Adjustment = Residual Outstanding. CLOSED Loans should normally have zero residual outstanding.",
    getPageContentWidth(document),
  );

  document.text(note, PAGE_MARGIN_X, y);

  document.setTextColor(0);

  return y + note.length * 3.5 + 5;
}

// ============================================================
// FINAL SETTLEMENT
// ============================================================

function drawFinalSettlement(
  document: jsPDF,

  report: ClosedLoansReport,

  currentY: number,
): number {
  const y = ensurePageSpace(document, currentY, 32);

  const contentWidth = getPageContentWidth(document);

  const integrityClean =
    report.totalResidualOutstanding === 0 && report.residualLoanCount === 0;

  if (integrityClean) {
    document.setDrawColor(40, 130, 90);

    document.setFillColor(240, 250, 245);
  } else {
    document.setDrawColor(185, 110, 35);

    document.setFillColor(255, 248, 235);
  }

  document.roundedRect(PAGE_MARGIN_X, y, contentWidth, 26, 2, 2, "FD");

  document.setFont("helvetica", "bold");

  document.setFontSize(8);

  document.setTextColor(
    integrityClean ? 35 : 160,
    integrityClean ? 120 : 90,
    integrityClean ? 80 : 30,
  );

  document.text(
    integrityClean
      ? "CLOSED LOAN INTEGRITY STATUS — RECONCILED"
      : "CLOSED LOAN INTEGRITY STATUS — REVIEW REQUIRED",
    PAGE_MARGIN_X + 4,
    y + 7,
  );

  document.setFontSize(14);

  document.text(
    formatMoney(report.totalResidualOutstanding),
    PAGE_MARGIN_X + contentWidth - 4,
    y + 14,
    {
      align: "right",
    },
  );

  document.setFont("helvetica", "normal");

  document.setFontSize(7);

  document.text(
    `Settlement Value: ${formatMoney(
      report.settlementValue,
    )}  |  Residual Loans: ${report.residualLoanCount}`,
    PAGE_MARGIN_X + 4,
    y + 21,
  );

  document.setTextColor(0);

  return y + 32;
}

// ============================================================
// BUILD DOCUMENT
// ============================================================

export async function buildClosedLoansPdf(): Promise<jsPDF> {
  const report = await buildClosedLoansReport();

  const document = createFinoraPdf({
    fileName: "FINORA_Closed_Loans.pdf",

    title: "CLOSED LOANS",

    subtitle: "Completed Loan Settlement Report",
  });

  let y = CONTENT_START_Y;

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summaryMetrics = getSummaryMetrics(report);

  const summaryRows = Math.ceil(summaryMetrics.length / 2);

  const summaryHeight = 12 + summaryRows * 19;

  y = ensurePageSpace(document, y, summaryHeight);

  y = drawSectionTitle(document, "CLOSED LOANS SUMMARY", y);

  y = drawMetricGrid(document, summaryMetrics, y, 2);

  // ==========================================================
  // RECONCILIATION
  // ==========================================================

  y = drawClosedLoansTable(document, report.loans, y + 2);

  // ==========================================================
  // FINAL INTEGRITY STATUS
  // ==========================================================

  drawFinalSettlement(document, report, y + 2);

  return document;
}

// ============================================================
// DOWNLOAD
// ============================================================

export async function downloadClosedLoansPdf(): Promise<void> {
  const document = await buildClosedLoansPdf();

  addFinoraPdfFooters(document);

  downloadFinoraPdf(document, "FINORA_Closed_Loans.pdf");
}

// ============================================================
// PRINT
// ============================================================

export async function printClosedLoansPdf(): Promise<void> {
  const document = await buildClosedLoansPdf();

  addFinoraPdfFooters(document);

  printFinoraPdf(document);
}

// ============================================================
// SHARE / WHATSAPP
// ============================================================

export async function shareClosedLoansPdf(): Promise<void> {
  const report = await buildClosedLoansReport();

  const document = await buildClosedLoansPdf();

  addFinoraPdfFooters(document);

  await shareFinoraPdf(
    document,

    "FINORA_Closed_Loans.pdf",

    {
      title: "FINORA Closed Loans",

      text: `Closed Loans - ${report.loanCount} Loans - Settlement ${formatMoney(
        report.settlementValue,
      )}`,

      dialogTitle: "Share Closed Loans",
    },
  );
}

// ============================================================
// END
// ============================================================
