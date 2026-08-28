// ============================================================
// FINORA ENTERPRISE OS™
//
// REPORTS ENGINE™
//
// LOAN STATEMENT PDF
//
// RESPONSIBILITY:
//
// - Build production Loan Statement PDF
// - Load authoritative Loan report data
// - Render Loan financial summary
// - Render EMI schedule
// - Render Collection history
// - Render settlement adjustment
// - Download Loan Statement
// - Print Loan Statement
// - Share Loan Statement through native Android share sheet
//
// IMPORTANT:
//
// - Loan data comes through reportDataService
// - No repository access
// - No StorageManager access
// - No localStorage access
// - No Loan mutation
// - No Collection mutation
// - Historical collection outstanding values are displayed
//   only as transaction snapshots
// - Current outstanding comes exclusively from Loan.outstanding
// - Settlement Adjustment is NOT treated as customer payment
//
// PDF FONT NOTE:
//
// jsPDF standard fonts do not reliably support the Indian
// Rupee glyph on every platform.
//
// Therefore monetary values use:
//
//   INR 15,000
//
// This keeps Web / Electron / Android PDFs consistent.
//
// VERSION : 1.1
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { jsPDF } from "jspdf";

import { buildLoanReportStatement } from "./reportDataService";

import type {
  LoanReportStatement,
  ReportCollectionRecord,
  ReportEmiRecord,
} from "./reportDataService";

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
// CURRENCY
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

  document.text("FINORA ENTERPRISE - LOAN STATEMENT", PAGE_MARGIN_X, PAGE_TOP);

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
// KEY / VALUE GRID
// ============================================================

interface PdfMetric {
  label: string;

  value: string;
}

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
// TABLE TYPES
// ============================================================

interface PdfTableColumn {
  label: string;

  width: number;

  align?: "left" | "center" | "right";
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

  document.setFontSize(7);

  document.setTextColor(35);

  columns.forEach((column, index) => {
    const align = column.align ?? "left";

    const rawValue = values[index] ?? "--";

    const text = document.splitTextToSize(rawValue, column.width - 4)[0] ?? "";

    const textX =
      align === "right"
        ? x + column.width - 2
        : align === "center"
          ? x + column.width / 2
          : x + 2;

    document.text(text, textX, currentY + 5, {
      align,
    });

    x += column.width;
  });

  document.setTextColor(0);

  return currentY + rowHeight;
}

// ============================================================
// LOAN META
// ============================================================

function getLoanMeta(statement: LoanReportStatement): PdfMetric[] {
  const loanRecord = statement.loan as typeof statement.loan &
    Record<string, unknown>;

  return [
    {
      label: "Loan Number",

      value: statement.loanNumber,
    },

    {
      label: "Customer ID",

      value: statement.customerId,
    },

    {
      label: "Loan Date",

      value: formatDate(statement.loanDate),
    },

    {
      label: "Status",

      value: safeText(statement.status).toUpperCase(),
    },

    {
      label: "Repayment Type",

      value: safeText(statement.repaymentType),
    },

    {
      label: "Loan Purpose / Title",

      value: safeText(
        loanRecord.title ?? loanRecord.loanTitle ?? loanRecord.purpose,
      ),
    },
  ];
}

// ============================================================
// FINANCIAL SUMMARY
// ============================================================

function getFinancialMetrics(statement: LoanReportStatement): PdfMetric[] {
  return [
    {
      label: "Original Principal",

      value: formatMoney(statement.principal),
    },

    {
      label: "Interest Rate",

      value: `${statement.interestRate}%`,
    },

    {
      label: "Total Payable",

      value: formatMoney(statement.totalPayable),
    },

    {
      label: "Total Collected",

      value: formatMoney(statement.totalCollected),
    },

    {
      label: "Total Discount",

      value: formatMoney(statement.totalDiscount),
    },

    {
      label: "Settlement Adjustment",

      value: formatMoney(statement.settlementAdjustment),
    },

    {
      label: "Current Outstanding",

      value: formatMoney(statement.currentOutstanding),
    },

    {
      label: "Collection Transactions",

      value: statement.collectionCount.toLocaleString("en-IN"),
    },
  ];
}

// ============================================================
// EMI TABLE
// ============================================================

function drawEmiSchedule(
  document: jsPDF,

  schedule: ReportEmiRecord[],

  currentY: number,
): number {
  const columns: PdfTableColumn[] = [
    {
      label: "EMI",

      width: 18,

      align: "center",
    },

    {
      label: "Due Date",

      width: 33,
    },

    {
      label: "Amount",

      width: 38,

      align: "right",
    },

    {
      label: "Paid",

      width: 35,

      align: "right",
    },

    {
      label: "Status",

      width: 30,

      align: "center",
    },

    {
      label: "Receipt",

      width: 26,

      align: "center",
    },
  ];

  // ==========================================================
  // KEEP TITLE + HEADER + FIRST ROW TOGETHER
  // ==========================================================

  let y = ensurePageSpace(document, currentY, schedule.length > 0 ? 29 : 20);

  y = drawSectionTitle(document, "EMI SCHEDULE", y);

  if (schedule.length === 0) {
    document.setFont("helvetica", "normal");

    document.setFontSize(8);

    document.text("No EMI schedule is stored for this loan.", PAGE_MARGIN_X, y);

    return y + 10;
  }

  y = drawTableHeader(document, columns, y);

  for (const installment of schedule) {
    const pageHeight = document.internal.pageSize.getHeight();

    if (y + 8 > pageHeight - PAGE_BOTTOM_RESERVED) {
      y = addContinuationPage(document);

      y = drawTableHeader(document, columns, y);
    }

    y = drawTableRow(
      document,
      columns,
      [
        String(installment.installmentNumber),

        formatDate(installment.dueDate),

        formatMoney(installment.installmentAmount),

        formatMoney(installment.paidAmount),

        safeText(installment.status).toUpperCase(),

        safeText(installment.receiptNumber),
      ],
      y,
    );
  }

  return y + 7;
}

// ============================================================
// COLLECTION TABLE
// ============================================================

function drawCollectionHistory(
  document: jsPDF,

  collections: ReportCollectionRecord[],

  currentY: number,
): number {
  const columns: PdfTableColumn[] = [
    {
      label: "Date",

      width: 29,
    },

    {
      label: "Receipt",

      width: 34,
    },

    {
      label: "Mode",

      width: 24,

      align: "center",
    },

    {
      label: "Collected",

      width: 34,

      align: "right",
    },

    {
      label: "Discount",

      width: 29,

      align: "right",
    },

    {
      label: "Balance*",

      width: 30,

      align: "right",
    },
  ];

  // ==========================================================
  // KEEP TITLE + HEADER + FIRST ROW TOGETHER
  //
  // Prevent:
  //
  // Page 1:
  //   COLLECTION HISTORY
  //
  // Page 2:
  //   table...
  //
  // ==========================================================

  let y = ensurePageSpace(document, currentY, collections.length > 0 ? 29 : 20);

  y = drawSectionTitle(document, "COLLECTION HISTORY", y);

  if (collections.length === 0) {
    document.setFont("helvetica", "normal");

    document.setFontSize(8);

    document.text(
      "No collection transactions are stored for this loan.",
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

        safeText(collection.paymentMethod).toUpperCase(),

        formatMoney(collection.paymentAmount),

        formatMoney(collection.discountAmount),

        formatMoney(collection.outstandingBalance),
      ],
      y,
    );
  }

  // ==========================================================
  // BALANCE NOTE
  // ==========================================================

  y = ensurePageSpace(document, y + 4, 10);

  document.setFont("helvetica", "italic");

  document.setFontSize(6.5);

  document.setTextColor(100);

  document.text(
    "* Balance represents the historical post-transaction balance stored with that collection.",
    PAGE_MARGIN_X,
    y,
  );

  document.setTextColor(0);

  return y + 7;
}

// ============================================================
// FINAL BALANCE
// ============================================================

function drawFinalBalance(
  document: jsPDF,

  statement: LoanReportStatement,

  currentY: number,
): number {
  const y = ensurePageSpace(document, currentY, 28);

  const contentWidth = getPageContentWidth(document);

  document.setDrawColor(40, 130, 90);

  document.setFillColor(240, 250, 245);

  document.roundedRect(PAGE_MARGIN_X, y, contentWidth, 22, 2, 2, "FD");

  document.setFont("helvetica", "bold");

  document.setFontSize(8);

  document.setTextColor(35, 120, 80);

  document.text("CURRENT AUTHORITATIVE OUTSTANDING", PAGE_MARGIN_X + 4, y + 7);

  document.setFontSize(15);

  document.text(
    formatMoney(statement.currentOutstanding),
    PAGE_MARGIN_X + contentWidth - 4,
    y + 14,
    {
      align: "right",
    },
  );

  document.setTextColor(0);

  return y + 28;
}

// ============================================================
// BUILD DOCUMENT
// ============================================================

export async function buildLoanStatementPdf(loanId: string): Promise<jsPDF> {
  const statement = await buildLoanReportStatement(loanId);

  if (!statement) {
    throw new Error("Unable to find the selected loan for the Loan Statement.");
  }

  const customerName = statement.collections.find((collection) =>
    Boolean(collection.customerName),
  )?.customerName;

  const subtitle = customerName
    ? `${customerName} - ${statement.loanNumber}`
    : statement.loanNumber;

  const document = createFinoraPdf({
    fileName: `FINORA_Loan_Statement_${statement.loanNumber}.pdf`,

    title: "LOAN STATEMENT",

    subtitle,
  });

  let y = CONTENT_START_Y;

  // ==========================================================
  // LOAN INFORMATION
  // ==========================================================

  y = drawSectionTitle(document, "LOAN INFORMATION", y);

  y = drawMetricGrid(document, getLoanMeta(statement), y, 2);

  // ==========================================================
  // FINANCIAL SUMMARY
  // ==========================================================

  y = drawSectionTitle(document, "FINANCIAL SUMMARY", y + 2);

  y = drawMetricGrid(document, getFinancialMetrics(statement), y, 2);

  // ==========================================================
  // EMI SCHEDULE
  // ==========================================================

  y = drawEmiSchedule(document, statement.schedule, y + 2);

  // ==========================================================
  // COLLECTION HISTORY
  // ==========================================================

  y = drawCollectionHistory(document, statement.collections, y);

  // ==========================================================
  // AUTHORITATIVE CURRENT BALANCE
  // ==========================================================

  drawFinalBalance(document, statement, y + 2);

  return document;
}

// ============================================================
// FILE NAME
// ============================================================

async function getLoanStatementFileName(loanId: string): Promise<string> {
  const statement = await buildLoanReportStatement(loanId);

  if (!statement) {
    throw new Error("Unable to find the selected loan.");
  }

  return `FINORA_Loan_Statement_${statement.loanNumber}.pdf`;
}

// ============================================================
// DOWNLOAD
// ============================================================

export async function downloadLoanStatementPdf(loanId: string): Promise<void> {
  const [document, fileName] = await Promise.all([
    buildLoanStatementPdf(loanId),

    getLoanStatementFileName(loanId),
  ]);

  addFinoraPdfFooters(document);

  downloadFinoraPdf(document, fileName);
}

// ============================================================
// PRINT
// ============================================================

export async function printLoanStatementPdf(loanId: string): Promise<void> {
  const document = await buildLoanStatementPdf(loanId);

  addFinoraPdfFooters(document);

  printFinoraPdf(document);
}

// ============================================================
// SHARE / WHATSAPP
// ============================================================

export async function shareLoanStatementPdf(loanId: string): Promise<void> {
  const statement = await buildLoanReportStatement(loanId);

  if (!statement) {
    throw new Error("Unable to find the selected loan.");
  }

  const document = await buildLoanStatementPdf(loanId);

  addFinoraPdfFooters(document);

  await shareFinoraPdf(
    document,

    `FINORA_Loan_Statement_${statement.loanNumber}.pdf`,

    {
      title: "FINORA Loan Statement",

      text: `Loan Statement - ${statement.loanNumber}`,

      dialogTitle: "Share Loan Statement",
    },
  );
}

// ============================================================
// END
// ============================================================
