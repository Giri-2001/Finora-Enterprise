// ============================================================
// FINORA ENTERPRISE OS™
//
// REPORTS ENGINE™
//
// CUSTOMER STATEMENT PDF
//
// RESPONSIBILITY:
//
// - Build production Customer Statement PDF
// - Load authoritative Customer report data
// - Render Customer profile information
// - Render current address
// - Render Customer financial summary
// - Render Loan-wise statement
// - Render complete Collection history
// - Render settlement adjustments
// - Download Customer Statement
// - Print Customer Statement
// - Share Customer Statement through native Android share sheet
//
// IMPORTANT:
//
// - Customer data comes through customerStatementDataService
// - No repository access
// - No StorageManager access
// - No localStorage access
// - No Customer mutation
// - No Loan mutation
// - No Collection mutation
// - Historical collection outstanding values are displayed
//   only as transaction snapshots
// - Current outstanding comes from authoritative Loan.outstanding
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
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { jsPDF } from "jspdf";

import { buildCustomerReportStatement } from "./customerStatementDataService";

import type {
  CustomerReportStatement,
  CustomerStatementCollectionRecord,
  CustomerStatementLoanRecord,
} from "./customerStatementDataService";

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

  document.text(
    "FINORA ENTERPRISE - CUSTOMER STATEMENT",
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
// METRIC
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

    const fitted = fitTableText(document, rawValue, column.width - 4);

    const text = fitted.text;

    document.setFontSize(fitted.fontSize);

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

  document.setFontSize(7);

  document.setTextColor(0);

  return currentY + rowHeight;
}

// ============================================================
// CUSTOMER INFORMATION
// ============================================================

function getCustomerMetrics(statement: CustomerReportStatement): PdfMetric[] {
  return [
    {
      label: "Customer ID",

      value: safeText(statement.customerId),
    },

    {
      label: "Customer Name",

      value: safeText(statement.customerName),
    },

    {
      label: "Mobile Number",

      value: safeText(statement.mobileNumber),
    },

    {
      label: "WhatsApp Number",

      value: safeText(statement.whatsappNumber),
    },

    {
      label: "Father Name",

      value: safeText(statement.fatherName),
    },

    {
      label: "Branch ID",

      value: safeText(statement.branchId),
    },

    {
      label: "Customer Since",

      value: formatDate(statement.customerSince),
    },

    {
      label: "Status",

      value: safeText(statement.status).toUpperCase(),
    },

    {
      label: "Risk",

      value: safeText(statement.risk).toUpperCase(),
    },

    {
      label: "Internal Rating",

      value: statement.rating > 0 ? `${statement.rating} / 5` : "--",
    },

    {
      label: "Email",

      value: safeText(statement.email),
    },

    {
      label: "Business",

      value: safeText(statement.businessName),
    },
  ];
}

// ============================================================
// FINANCIAL SUMMARY
// ============================================================

function getFinancialMetrics(statement: CustomerReportStatement): PdfMetric[] {
  return [
    {
      label: "Total Loans",

      value: statement.totalLoans.toLocaleString("en-IN"),
    },

    {
      label: "Active Loans",

      value: statement.activeLoans.toLocaleString("en-IN"),
    },

    {
      label: "Closed Loans",

      value: statement.closedLoans.toLocaleString("en-IN"),
    },

    {
      label: "Collection Transactions",

      value: statement.collectionCount.toLocaleString("en-IN"),
    },

    {
      label: "Total Principal",

      value: formatMoney(statement.totalPrincipal),
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
  ];
}

// ============================================================
// ADDRESS TEXT
// ============================================================

function getAddressText(statement: CustomerReportStatement): string {
  const address = statement.address;

  const parts = [
    address.houseNumber,

    address.street,

    address.landmark,

    address.area,

    address.village,

    address.mandal,

    address.city,

    address.district,

    address.state,

    address.country,

    address.pinCode,
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "--";
  }

  return parts.join(", ");
}

// ============================================================
// ADDRESS BOX
// ============================================================

function drawAddress(
  document: jsPDF,

  statement: CustomerReportStatement,

  currentY: number,
): number {
  const contentWidth = getPageContentWidth(document);

  const addressText = getAddressText(statement);

  document.setFont("helvetica", "normal");

  document.setFontSize(8);

  const addressLines = document.splitTextToSize(addressText, contentWidth - 8);

  const boxHeight = Math.max(16, 8 + addressLines.length * 4);

  const y = ensurePageSpace(document, currentY, boxHeight + 2);

  document.setDrawColor(210);

  document.setFillColor(248, 249, 251);

  document.roundedRect(PAGE_MARGIN_X, y, contentWidth, boxHeight, 2, 2, "FD");

  document.setFont("helvetica", "normal");

  document.setFontSize(7);

  document.setTextColor(100);

  document.text("CURRENT ADDRESS", PAGE_MARGIN_X + 4, y + 5);

  document.setFont("helvetica", "bold");

  document.setFontSize(8);

  document.setTextColor(25);

  document.text(addressLines, PAGE_MARGIN_X + 4, y + 11);

  document.setTextColor(0);

  return y + boxHeight + 4;
}

// ============================================================
// LOAN TABLE
// ============================================================

function drawLoanStatement(
  document: jsPDF,

  loans: CustomerStatementLoanRecord[],

  currentY: number,
): number {
  const columns: PdfTableColumn[] = [
    {
      label: "Loan Number",

      width: 38,
    },

    {
      label: "Status",

      width: 20,

      align: "center",
    },

    {
      label: "Principal",

      width: 27,

      align: "right",
    },

    {
      label: "Payable",

      width: 27,

      align: "right",
    },

    {
      label: "Collected",

      width: 27,

      align: "right",
    },

    {
      label: "Adjust.",

      width: 20,

      align: "right",
    },

    {
      label: "Outstanding",

      width: 21,

      align: "right",
    },
  ];

  // ==========================================================
  // KEEP TITLE + HEADER + FIRST ROW TOGETHER
  // ==========================================================

  let y = ensurePageSpace(document, currentY, loans.length > 0 ? 29 : 20);

  y = drawSectionTitle(document, "LOAN-WISE STATEMENT", y);

  if (loans.length === 0) {
    document.setFont("helvetica", "normal");

    document.setFontSize(8);

    document.text("No loans are stored for this customer.", PAGE_MARGIN_X, y);

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
        safeText(loan.loanNumber),

        safeText(loan.status).toUpperCase(),

        formatMoney(loan.principal),

        formatMoney(loan.totalPayable),

        formatMoney(loan.totalCollected),

        formatMoney(loan.settlementAdjustment),

        formatMoney(loan.currentOutstanding),
      ],
      y,
    );
  }

  // ==========================================================
  // SETTLEMENT NOTE
  // ==========================================================

  y = ensurePageSpace(document, y + 4, 12);

  document.setFont("helvetica", "italic");

  document.setFontSize(6.5);

  document.setTextColor(100);

  const note = document.splitTextToSize(
    "Adjustment represents contractual loan value closed or preclosed without being recorded as customer payment or explicit discount.",
    getPageContentWidth(document),
  );

  document.text(note, PAGE_MARGIN_X, y);

  document.setTextColor(0);

  return y + note.length * 3.5 + 5;
}

// ============================================================
// COLLECTION HISTORY
// ============================================================

function drawCollectionHistory(
  document: jsPDF,

  collections: CustomerStatementCollectionRecord[],

  currentY: number,
): number {
  const columns: PdfTableColumn[] = [
    {
      label: "Date",

      width: 24,
    },

    {
      label: "Receipt",

      width: 31,
    },

    {
      label: "Loan",

      width: 33,
    },

    {
      label: "Mode",

      width: 20,

      align: "center",
    },

    {
      label: "Collected",

      width: 28,

      align: "right",
    },

    {
      label: "Discount",

      width: 22,

      align: "right",
    },

    {
      label: "Balance*",

      width: 22,

      align: "right",
    },
  ];

  // ==========================================================
  // KEEP TITLE + HEADER + FIRST ROW TOGETHER
  // ==========================================================

  let y = ensurePageSpace(document, currentY, collections.length > 0 ? 29 : 20);

  y = drawSectionTitle(document, "COLLECTION HISTORY", y);

  if (collections.length === 0) {
    document.setFont("helvetica", "normal");

    document.setFontSize(8);

    document.text(
      "No collection transactions are stored for this customer.",
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

        safeText(collection.loanNumber),

        safeText(collection.paymentMethod).toUpperCase(),

        formatMoney(collection.paymentAmount),

        formatMoney(collection.discountAmount),

        formatMoney(collection.outstandingBalance),
      ],
      y,
    );
  }

  // ==========================================================
  // HISTORICAL BALANCE NOTE
  // ==========================================================

  y = ensurePageSpace(document, y + 4, 12);

  document.setFont("helvetica", "italic");

  document.setFontSize(6.5);

  document.setTextColor(100);

  const note = document.splitTextToSize(
    "* Balance represents the historical post-transaction balance stored with that collection. It is not used to calculate the customer's current total outstanding.",
    getPageContentWidth(document),
  );

  document.text(note, PAGE_MARGIN_X, y);

  document.setTextColor(0);

  return y + note.length * 3.5 + 5;
}

// ============================================================
// FINAL OUTSTANDING
// ============================================================

function drawFinalOutstanding(
  document: jsPDF,

  statement: CustomerReportStatement,

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

  document.text(
    "CURRENT AUTHORITATIVE CUSTOMER OUTSTANDING",
    PAGE_MARGIN_X + 4,
    y + 7,
  );

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

export async function buildCustomerStatementPdf(
  customerId: string,
): Promise<jsPDF> {
  const statement = await buildCustomerReportStatement(customerId);

  if (!statement) {
    throw new Error(
      "Unable to find the selected customer for the Customer Statement.",
    );
  }

  const subtitle = `${statement.customerName} - ${statement.customerId}`;

  const document = createFinoraPdf({
    fileName: `FINORA_Customer_Statement_${statement.customerId}.pdf`,

    title: "CUSTOMER STATEMENT",

    subtitle,
  });

  let y = CONTENT_START_Y;

  // ==========================================================
  // CUSTOMER INFORMATION
  // ==========================================================

  y = drawSectionTitle(document, "CUSTOMER INFORMATION", y);

  y = drawMetricGrid(document, getCustomerMetrics(statement), y, 3);

  // ==========================================================
  // CURRENT ADDRESS
  // ==========================================================

  y = drawAddress(document, statement, y + 1);

  // ==========================================================
  // FINANCIAL SUMMARY
  // ==========================================================

  const financialMetrics = getFinancialMetrics(statement);

  const financialRows = Math.ceil(financialMetrics.length / 2);

  const financialSectionHeight = 12 + financialRows * 19;

  y = ensurePageSpace(document, y + 2, financialSectionHeight);

  y = drawSectionTitle(document, "FINANCIAL SUMMARY", y);

  y = drawMetricGrid(document, financialMetrics, y, 2);

  // ==========================================================
  // LOAN-WISE STATEMENT
  // ==========================================================

  y = drawLoanStatement(document, statement.loans, y + 2);

  // ==========================================================
  // COLLECTION HISTORY
  // ==========================================================

  y = drawCollectionHistory(document, statement.collections, y);

  // ==========================================================
  // AUTHORITATIVE CURRENT OUTSTANDING
  // ==========================================================

  drawFinalOutstanding(document, statement, y + 2);

  return document;
}

// ============================================================
// FILE NAME
// ============================================================

async function getCustomerStatementFileName(
  customerId: string,
): Promise<string> {
  const statement = await buildCustomerReportStatement(customerId);

  if (!statement) {
    throw new Error("Unable to find the selected customer.");
  }

  return `FINORA_Customer_Statement_${statement.customerId}.pdf`;
}

// ============================================================
// DOWNLOAD
// ============================================================

export async function downloadCustomerStatementPdf(
  customerId: string,
): Promise<void> {
  const [document, fileName] = await Promise.all([
    buildCustomerStatementPdf(customerId),

    getCustomerStatementFileName(customerId),
  ]);

  addFinoraPdfFooters(document);

  downloadFinoraPdf(document, fileName);
}

// ============================================================
// PRINT
// ============================================================

export async function printCustomerStatementPdf(
  customerId: string,
): Promise<void> {
  const document = await buildCustomerStatementPdf(customerId);

  addFinoraPdfFooters(document);

  printFinoraPdf(document);
}

// ============================================================
// SHARE / WHATSAPP
// ============================================================

export async function shareCustomerStatementPdf(
  customerId: string,
): Promise<void> {
  const statement = await buildCustomerReportStatement(customerId);

  if (!statement) {
    throw new Error("Unable to find the selected customer.");
  }

  const document = await buildCustomerStatementPdf(customerId);

  addFinoraPdfFooters(document);

  await shareFinoraPdf(
    document,

    `FINORA_Customer_Statement_${statement.customerId}.pdf`,

    {
      title: "FINORA Customer Statement",

      text: `Customer Statement - ${statement.customerName} - ${statement.customerId}`,

      dialogTitle: "Share Customer Statement",
    },
  );
}

// ============================================================
// END
// ============================================================
