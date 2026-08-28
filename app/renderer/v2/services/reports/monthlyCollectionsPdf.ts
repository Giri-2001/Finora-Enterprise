// ============================================================
// FINORA ENTERPRISE OS™
//
// REPORTS ENGINE™
//
// MONTHLY COLLECTIONS PDF
//
// RESPONSIBILITY:
//
// - Build production Monthly Collections PDF
// - Render selected month summary
// - Render payment-mode summary
// - Render complete receipt-wise Collection history
// - Preserve historical collection balances as snapshots only
// - Download Monthly Collections PDF
// - Print Monthly Collections PDF
// - Share Monthly Collections PDF through Android native share
//
// IMPORTANT:
//
// - Report data comes through monthlyCollectionsDataService
// - No repository access
// - No StorageManager access
// - No localStorage access
// - No Collection mutation
//
// REPORTING RULES:
//
// Total Collected
//   = actual Collection.paymentAmount
//
// Total Discount
//   = explicit Collection.discountAmount
//
// Liability Reduction
//   = Total Collected + Total Discount
//
// Collection.outstandingBalance
//   = historical post-transaction snapshot only
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { jsPDF } from "jspdf";

import { buildMonthlyCollectionsReport } from "./monthlyCollectionsDataService";

import type {
  MonthlyCollectionsReport,
  MonthlyPaymentModeSummary,
} from "./monthlyCollectionsDataService";

import type { ReportCollectionRecord } from "./reportDataService";

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

  document.text(
    "FINORA ENTERPRISE - MONTHLY COLLECTIONS",
    PAGE_MARGIN_X,
    PAGE_TOP,
  );

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

  document.setFontSize(7);

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

function getSummaryMetrics(report: MonthlyCollectionsReport): PdfMetric[] {
  return [
    {
      label: "Reporting Month",

      value: report.monthLabel,
    },

    {
      label: "Collection Transactions",

      value: report.transactionCount.toLocaleString("en-IN"),
    },

    {
      label: "Customers Collected",

      value: report.customerCount.toLocaleString("en-IN"),
    },

    {
      label: "Loans Collected",

      value: report.loanCount.toLocaleString("en-IN"),
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
      label: "Liability Reduction",

      value: formatMoney(report.liabilityReduction),
    },

    {
      label: "Average Collection",

      value: formatMoney(report.averageCollection),
    },
  ];
}

// ============================================================
// PAYMENT MODE SUMMARY
// ============================================================

function drawPaymentModeSummary(
  document: jsPDF,

  paymentModes: MonthlyPaymentModeSummary[],

  currentY: number,
): number {
  const columns: PdfTableColumn[] = [
    {
      label: "Payment Mode",

      width: 45,
    },

    {
      label: "Transactions",

      width: 30,

      align: "center",
    },

    {
      label: "Collected",

      width: 35,

      align: "right",
    },

    {
      label: "Discount",

      width: 35,

      align: "right",
    },

    {
      label: "Liability Reduction",

      width: 35,

      align: "right",
    },
  ];

  let y = ensurePageSpace(
    document,
    currentY,
    paymentModes.length > 0 ? 29 : 20,
  );

  y = drawSectionTitle(document, "PAYMENT MODE SUMMARY", y);

  if (paymentModes.length === 0) {
    document.setFont("helvetica", "normal");

    document.setFontSize(8);

    document.text(
      "No collection transactions exist for the selected month.",
      PAGE_MARGIN_X,
      y,
    );

    return y + 10;
  }

  y = drawTableHeader(document, columns, y);

  for (const mode of paymentModes) {
    const pageHeight = document.internal.pageSize.getHeight();

    if (y + 8 > pageHeight - PAGE_BOTTOM_RESERVED) {
      y = addContinuationPage(document);

      y = drawTableHeader(document, columns, y);
    }

    y = drawTableRow(
      document,
      columns,
      [
        safeText(mode.paymentMethod).toUpperCase(),

        mode.transactionCount.toLocaleString("en-IN"),

        formatMoney(mode.totalCollected),

        formatMoney(mode.totalDiscount),

        formatMoney(mode.liabilityReduction),
      ],
      y,
    );
  }

  return y + 7;
}

// ============================================================
// COLLECTION HISTORY
// ============================================================

function drawCollectionHistory(
  document: jsPDF,

  collections: ReportCollectionRecord[],

  currentY: number,
): number {
  const columns: PdfTableColumn[] = [
    {
      label: "Date",

      width: 24,
    },

    {
      label: "Receipt",

      width: 28,
    },

    {
      label: "Customer",

      width: 30,
    },

    {
      label: "Loan",

      width: 35,
    },

    {
      label: "Mode",

      width: 18,

      align: "center",
    },

    {
      label: "Collected",

      width: 25,

      align: "right",
    },

    {
      label: "Discount",

      width: 20,

      align: "right",
    },
  ];

  let y = ensurePageSpace(document, currentY, collections.length > 0 ? 29 : 20);

  y = drawSectionTitle(document, "COLLECTION HISTORY", y);

  if (collections.length === 0) {
    document.setFont("helvetica", "normal");

    document.setFontSize(8);

    document.text(
      "No collection transactions are stored for the selected month.",
      PAGE_MARGIN_X,
      y,
    );

    return y + 10;
  }

  y = drawTableHeader(document, columns, y);

  for (const collection of collections) {
    const pageHeight = document.internal.pageSize.getHeight();

    if (y + 8 > pageHeight - PAGE_BOTTOM_RESERVED) {
      y = addContinuationPage(document);

      y = drawTableHeader(document, columns, y);
    }

    y = drawTableRow(
      document,
      columns,
      [
        formatDate(collection.receiptDate),

        safeText(collection.receiptNumber),

        safeText(collection.customerName || collection.customerId),

        safeText(collection.loanNumber),

        safeText(collection.paymentMethod).toUpperCase(),

        formatMoney(collection.paymentAmount),

        formatMoney(collection.discountAmount),
      ],
      y,
    );
  }

  // ==========================================================
  // BALANCE / PAYMENT NOTE
  // ==========================================================

  y = ensurePageSpace(document, y + 4, 16);

  document.setFont("helvetica", "italic");

  document.setFontSize(6.5);

  document.setTextColor(100);

  const note = document.splitTextToSize(
    "Collected represents actual customer payment. Discount is reported separately and is not counted as cash collected. Historical collection outstanding balances are not summed to calculate current receivables.",
    getPageContentWidth(document),
  );

  document.text(note, PAGE_MARGIN_X, y);

  document.setTextColor(0);

  return y + note.length * 3.5 + 5;
}

// ============================================================
// FINAL TOTAL
// ============================================================

function drawFinalTotal(
  document: jsPDF,

  report: MonthlyCollectionsReport,

  currentY: number,
): number {
  const y = ensurePageSpace(document, currentY, 30);

  const contentWidth = getPageContentWidth(document);

  document.setDrawColor(40, 130, 90);

  document.setFillColor(240, 250, 245);

  document.roundedRect(PAGE_MARGIN_X, y, contentWidth, 24, 2, 2, "FD");

  document.setFont("helvetica", "bold");

  document.setFontSize(8);

  document.setTextColor(35, 120, 80);

  document.text("TOTAL ACTUAL COLLECTION FOR MONTH", PAGE_MARGIN_X + 4, y + 7);

  document.setFontSize(15);

  document.text(
    formatMoney(report.totalCollected),
    PAGE_MARGIN_X + contentWidth - 4,
    y + 14,
    {
      align: "right",
    },
  );

  document.setFont("helvetica", "normal");

  document.setFontSize(7);

  document.text(
    `Discount: ${formatMoney(
      report.totalDiscount,
    )}  |  Liability Reduction: ${formatMoney(report.liabilityReduction)}`,
    PAGE_MARGIN_X + 4,
    y + 20,
  );

  document.setTextColor(0);

  return y + 30;
}

// ============================================================
// BUILD DOCUMENT
// ============================================================

export async function buildMonthlyCollectionsPdf(
  monthKey: string,
): Promise<jsPDF> {
  const report = await buildMonthlyCollectionsReport(monthKey);

  const document = createFinoraPdf({
    fileName: `FINORA_Monthly_Collections_${report.monthKey}.pdf`,

    title: "MONTHLY COLLECTIONS",

    subtitle: report.monthLabel,
  });

  let y = CONTENT_START_Y;

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summaryMetrics = getSummaryMetrics(report);

  const summaryRows = Math.ceil(summaryMetrics.length / 2);

  const summaryHeight = 12 + summaryRows * 19;

  y = ensurePageSpace(document, y, summaryHeight);

  y = drawSectionTitle(document, "MONTHLY SUMMARY", y);

  y = drawMetricGrid(document, summaryMetrics, y, 2);

  // ==========================================================
  // PAYMENT MODE SUMMARY
  // ==========================================================

  y = drawPaymentModeSummary(document, report.paymentModes, y + 2);

  // ==========================================================
  // COLLECTION HISTORY
  // ==========================================================

  y = drawCollectionHistory(document, report.collections, y);

  // ==========================================================
  // FINAL TOTAL
  // ==========================================================

  drawFinalTotal(document, report, y + 2);

  return document;
}

// ============================================================
// FILE NAME
// ============================================================

async function getMonthlyCollectionsFileName(
  monthKey: string,
): Promise<string> {
  const report = await buildMonthlyCollectionsReport(monthKey);

  return `FINORA_Monthly_Collections_${report.monthKey}.pdf`;
}

// ============================================================
// DOWNLOAD
// ============================================================

export async function downloadMonthlyCollectionsPdf(
  monthKey: string,
): Promise<void> {
  const [document, fileName] = await Promise.all([
    buildMonthlyCollectionsPdf(monthKey),

    getMonthlyCollectionsFileName(monthKey),
  ]);

  addFinoraPdfFooters(document);

  downloadFinoraPdf(document, fileName);
}

// ============================================================
// PRINT
// ============================================================

export async function printMonthlyCollectionsPdf(
  monthKey: string,
): Promise<void> {
  const document = await buildMonthlyCollectionsPdf(monthKey);

  addFinoraPdfFooters(document);

  printFinoraPdf(document);
}

// ============================================================
// SHARE / WHATSAPP
// ============================================================

export async function shareMonthlyCollectionsPdf(
  monthKey: string,
): Promise<void> {
  const report = await buildMonthlyCollectionsReport(monthKey);

  const document = await buildMonthlyCollectionsPdf(monthKey);

  addFinoraPdfFooters(document);

  await shareFinoraPdf(
    document,

    `FINORA_Monthly_Collections_${report.monthKey}.pdf`,

    {
      title: "FINORA Monthly Collections",

      text: `Monthly Collections - ${report.monthLabel}`,

      dialogTitle: "Share Monthly Collections",
    },
  );
}

// ============================================================
// END
// ============================================================
