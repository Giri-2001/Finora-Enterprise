import { formatFinoraDate } from "../../../shared/finoraDateTimeDisplay";
// ============================================================
// FINORA ENTERPRISE OS™
//
// REPORTS ENGINE™
//
// OUTSTANDING LOANS PDF
//
// RESPONSIBILITY:
//
// - Build production Outstanding Loans PDF
// - Render authoritative current receivables
// - Render Customer / Loan-wise outstanding table
// - Render actual collected and discount totals
// - Download Outstanding Loans PDF
// - Print Outstanding Loans PDF
// - Share Outstanding Loans PDF through Android native share
//
// IMPORTANT:
//
// - Current receivable comes ONLY from Loan.outstanding
// - Each ACTIVE / RUNNING Loan is counted exactly once
// - Collection.outstandingBalance is NEVER summed
// - Collection paymentAmount is actual cash collected
// - Collection discountAmount is reported separately
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { getBusinessContext } from "../business/businessContextService";
import { loadFinoraServerSettingsIdentity } from "../business/finoraServerSettingsIdentity";
import finoraOutstandingLogoUrl from "../../app/assets/paisarule_official_brand.png";

import type { jsPDF } from "jspdf";

import { buildOutstandingLoansReport } from "./outstandingLoansDataService";

import type {
  OutstandingLoansReport,
  OutstandingLoanReportRow,
} from "./outstandingLoansDataService";

import {
  addFinoraPdfFooters,
  createFinoraPdf,
  getReportGeneratedAt,
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

function resolveBusinessReportTitle(
  reportTitle: string,
): string {
  const businessName = String(
    getBusinessContext()
      ?.businessProfile
      ?.businessName ?? "",
  ).trim();

  return businessName
    ? `${businessName} ${reportTitle}`
    : reportTitle;
}

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
  if (!raw) return "";
  const result = formatFinoraDate(raw);
  return result === "\u2014" ? raw : result;
}

// ============================================================
// PAGE WIDTH
// ============================================================

// FINORA_C80_B24_B1_OUTSTANDING_PREMIUM_HEADER
// Owner-only operational PDF header. Never modifies financial data.

async function addFinoraOutstandingCenterLogo(
  document: jsPDF,
): Promise<void> {
  const image = new Image();
  image.src = finoraOutstandingLogoUrl;

  try {
    await image.decode();
  } catch {
    throw new Error("Unable to load PAISARULE Outstanding Loans logo.");
  }

  if (!image.naturalWidth || !image.naturalHeight) {
    throw new Error("PAISARULE Outstanding Loans logo dimensions invalid.");
  }

  const canvas = window.document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("PAISARULE Outstanding Loans logo canvas unavailable.");
  }

  // PAISARULE_PDF_LOGO_ROUNDED_CORNERS
  const paisaruleLogoRadius = Math.min(canvas.width, canvas.height) * 0.12;
  context.beginPath();
  context.moveTo(paisaruleLogoRadius, 0);
  context.lineTo(canvas.width - paisaruleLogoRadius, 0);
  context.quadraticCurveTo(canvas.width, 0, canvas.width, paisaruleLogoRadius);
  context.lineTo(canvas.width, canvas.height - paisaruleLogoRadius);
  context.quadraticCurveTo(canvas.width, canvas.height, canvas.width - paisaruleLogoRadius, canvas.height);
  context.lineTo(paisaruleLogoRadius, canvas.height);
  context.quadraticCurveTo(0, canvas.height, 0, canvas.height - paisaruleLogoRadius);
  context.lineTo(0, paisaruleLogoRadius);
  context.quadraticCurveTo(0, 0, paisaruleLogoRadius, 0);
  context.closePath();
  context.clip();
  context.drawImage(image, 0, 0, 256, 256);

  const size = 30;
  const pageWidth = document.internal.pageSize.getWidth();

  document.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    (pageWidth - size) / 2,
    5,
    size,
    size,
    "FINORA_OUTSTANDING_CENTER_LOGO",
    "FAST",
  );
}

async function drawFinoraOutstandingBusinessIdentity(
  document: jsPDF,
): Promise<void> {
  const context = getBusinessContext();

  const scope =
    context?.ownerId?.trim() &&
    context.businessId?.trim() &&
    context.branchId?.trim()
      ? {
          ownerId: context.ownerId.trim(),
          businessId: context.businessId.trim(),
          branchId: context.branchId.trim(),
        }
      : null;

  let businessName = "Not recorded";
  let branchName = "Not recorded";

  if (scope) {
    const serverIdentity =
      await loadFinoraServerSettingsIdentity(scope);

    if (serverIdentity.success) {
      businessName = serverIdentity.data.businessName.trim();
      branchName = serverIdentity.data.branchName.trim();
    } else {
      const profile = context?.businessProfile;

      if (
        profile &&
        profile.ownerId === scope.ownerId &&
        profile.businessId === scope.businessId &&
        profile.branchId === scope.branchId &&
        profile.businessName.trim() &&
        profile.branchName.trim()
      ) {
        businessName = profile.businessName.trim();
        branchName = profile.branchName.trim();
      }
    }
  }

  const rightX =
    document.internal.pageSize.getWidth() - PAGE_MARGIN_X;

  // Replace only the shared header's old top-right date.
  // Left title and center PNG remain untouched.
  document.setFillColor(255, 255, 255);
  document.rect(135, 9, rightX - 135 + 1, 23, "F");

  const rightName = (
    value: string,
    y: number,
    fontSize: number,
  ): void => {
    document.setFont("helvetica", "bold");
    document.setFontSize(fontSize);

    let visible = value || "Not recorded";

    while (
      visible.length > 4 &&
      document.getTextWidth(visible) > 58
    ) {
      visible = visible.slice(0, -1);
    }

    if (visible !== (value || "Not recorded")) {
      visible = `${visible.slice(0, -3)}...`;
    }

    document.text(visible, rightX, y, {
      align: "right",
    });
  };

  document.setTextColor(22, 35, 52);
  rightName(businessName, 17, 11);

  document.setTextColor(92, 101, 113);
  rightName(branchName, 25, 9);

  document.setTextColor(0);
}
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
    `PAISARULE - ${resolveBusinessReportTitle("Outstanding Loans")}`,
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

  document.setFontSize(6.5);

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

  highlightOutstanding = false,
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

    const outstandingCell =
      highlightOutstanding &&
      column.label.toLowerCase() === "outstanding";

    if (outstandingCell) {
      document.setFillColor(255, 239, 240);

      document.rect(
        x,
        currentY,
        column.width,
        rowHeight - 0.2,
        "F",
      );

      document.setFont("helvetica", "bold");
      document.setTextColor(145, 32, 43);
    } else {
      document.setFont("helvetica", "normal");
      document.setTextColor(35);
    }

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

function getSummaryMetrics(report: OutstandingLoansReport): PdfMetric[] {
  return [
    {
      label: "Outstanding Loans",

      value: report.loanCount.toLocaleString("en-IN"),
    },

    {
      label: "Customers",

      value: report.customerCount.toLocaleString("en-IN"),
    },

    {
      label: "Total Principal",

      value: formatMoney(report.totalPrincipal),
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
      label: "Total Outstanding",

      value: formatMoney(report.totalOutstanding),
    },

    {
      label: "Average Outstanding",

      value: formatMoney(report.averageOutstanding),
    },

    {
      label: "Highest Outstanding",

      value: formatMoney(report.highestOutstanding),
    },
  ];
}

// ============================================================
// OUTSTANDING LOAN TABLE
// ============================================================

function drawOutstandingLoansTable(
  document: jsPDF,

  loans: OutstandingLoanReportRow[],

  currentY: number,
): number {
  const columns: PdfTableColumn[] = [
    {
      label: "Customer",

      width: 30,
    },

    {
      label: "Mobile",

      width: 22,
    },

    {
      label: "Loan",

      width: 38,
    },

    {
      label: "Date",

      width: 23,
    },

    {
      label: "Principal",

      width: 22,

      align: "right",
    },

    {
      label: "Collected",

      width: 22,

      align: "right",
    },

    {
      label: "Outstanding",

      width: 23,

      align: "right",
    },
  ];

  // ==========================================================
  // KEEP TITLE + HEADER + FIRST ROW TOGETHER
  // ==========================================================

  let y = ensurePageSpace(document, currentY, loans.length > 0 ? 29 : 20);

  y = drawSectionTitle(document, "OUTSTANDING LOAN DETAILS", y);

  y += 2;

  if (loans.length === 0) {
    document.setFont("helvetica", "normal");

    document.setFontSize(8);

    document.text(
      "No active outstanding loans are currently stored in PAISARULE.",
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

        safeText(loan.customerMobile),

        safeText(loan.loanNumber).replace(/^FIN-(?=LOAN-)/i, "PAISA-"),

        formatDate(loan.loanDate),

        formatMoney(loan.principal),

        formatMoney(loan.totalCollected),

        formatMoney(loan.outstanding),
      ],
      y,
      8,
      true,
    );
  }

  // ==========================================================
  // AUTHORITATIVE NOTE
  // ==========================================================

  y = ensurePageSpace(document, y + 4, 16);

  document.setFont("helvetica", "italic");

  document.setFontSize(6.5);

  document.setTextColor(100);

  const note = document.splitTextToSize(
    "Current outstanding is sourced exclusively from each ACTIVE / RUNNING Loan.outstanding value. Historical Collection outstanding balances are not summed.",
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

  report: OutstandingLoansReport,

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

  document.text("TOTAL AUTHORITATIVE OUTSTANDING", PAGE_MARGIN_X + 4, y + 7);

  document.setFontSize(15);

  document.text(
    formatMoney(report.totalOutstanding),
    PAGE_MARGIN_X + contentWidth - 4,
    y + 14,
    {
      align: "right",
    },
  );

  document.setFont("helvetica", "normal");

  document.setFontSize(7);

  document.text(
    `${report.loanCount.toLocaleString(
      "en-IN",
    )} outstanding loan(s) across ${report.customerCount.toLocaleString(
      "en-IN",
    )} customer(s)`,
    PAGE_MARGIN_X + 4,
    y + 20,
  );

  document.setTextColor(0);

  return y + 30;
}

// ============================================================
// BUILD DOCUMENT
// ============================================================

export async function buildOutstandingLoansPdf(): Promise<jsPDF> {
  const report = await buildOutstandingLoansReport();

  const generatedAt = getReportGeneratedAt();
  const document = createFinoraPdf({
    fileName: "PAISARULE_Outstanding_Loans.pdf",

    title: "Outstanding Loans",


  });

  await addFinoraOutstandingCenterLogo(document);
  await drawFinoraOutstandingBusinessIdentity(document);

  let y = CONTENT_START_Y;

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summaryMetrics = getSummaryMetrics(report);

  const summaryRows = Math.ceil(summaryMetrics.length / 2);

  // FINORA_C80_B24_C1_PREMIUM_OUTSTANDING_STYLING
  const summaryHeight = 14 + summaryRows * 19;

  y = ensurePageSpace(document, y + 1, summaryHeight);

  y = drawSectionTitle(document, "OUTSTANDING SUMMARY", y);

  document.setFont("helvetica", "normal");
  document.setFontSize(7);
  document.setTextColor(85, 94, 108);
  document.text(
    `Generated: ${generatedAt}`,
    document.internal.pageSize.getWidth() - PAGE_MARGIN_X,
    y - 9,
    { align: "right" },
  );
  document.setTextColor(0);

  y = drawMetricGrid(document, summaryMetrics, y + 2, 2);

  // ==========================================================
  // OUTSTANDING LOANS
  // ==========================================================

  y = drawOutstandingLoansTable(document, report.generatedLoans, y + 4);

  // ==========================================================
  // FINAL AUTHORITATIVE OUTSTANDING
  // ==========================================================

  drawFinalOutstanding(document, report, y + 2);

  return document;
}

// ============================================================
// DOWNLOAD
// ============================================================

export async function downloadOutstandingLoansPdf(): Promise<void> {
  const document = await buildOutstandingLoansPdf();

  addFinoraPdfFooters(document);

  downloadFinoraPdf(document, "PAISARULE_Outstanding_Loans.pdf");
}

// ============================================================
// PRINT
// ============================================================

export async function printOutstandingLoansPdf(): Promise<void> {
  const document = await buildOutstandingLoansPdf();

  addFinoraPdfFooters(document);

  printFinoraPdf(document);
}

// ============================================================
// SHARE / WHATSAPP
// ============================================================

export async function shareOutstandingLoansPdf(): Promise<void> {
  const report = await buildOutstandingLoansReport();

  const document = await buildOutstandingLoansPdf();

  addFinoraPdfFooters(document);

  await shareFinoraPdf(
    document,

    "PAISARULE_Outstanding_Loans.pdf",

    {
      title: "PAISARULE Outstanding Loans",

      text: `Outstanding Loans - ${report.loanCount} Loans - ${formatMoney(
        report.totalOutstanding,
      )}`,

      dialogTitle: "Share Outstanding Loans",
    },
  );
}

// ============================================================
// END
// ============================================================
