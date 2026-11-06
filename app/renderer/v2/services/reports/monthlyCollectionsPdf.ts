import { formatFinoraDate } from "../../../shared/finoraDateTimeDisplay";
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

import { getBusinessContext } from "../business/businessContextService";
import { loadFinoraServerSettingsIdentity } from "../business/finoraServerSettingsIdentity";
import finoraMonthlyLogoUrl from "../../app/assets/paisarule_official_brand.png";

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

// FINORA_C80_B28_B4_B_MONTHLY_IDENTITY
// Original PNG is centered. Business identity stays right-aligned.
// The shared header's upper-right generated date is covered only
// inside the existing right-side header area.
async function drawMonthlyBusinessIdentity(
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

  // Preserve left header and center FINORA logo.
  // This rectangle touches only the existing right header.
  document.setFillColor(255, 255, 255);
  document.rect(135, 9, rightX - 135 + 1, 23, "F");

  const drawName = (
    original: string,
    y: number,
    fontSize: number,
    fontWeight: "bold" | "normal",
  ): void => {
    document.setFont("helvetica", fontWeight);
    document.setFontSize(fontSize);

    let size = fontSize;

    while (
      size > 7 &&
      document.getTextWidth(original) > 58
    ) {
      size -= 0.5;
      document.setFontSize(size);
    }

    let visible = original;

    while (
      visible.length > 4 &&
      document.getTextWidth(visible) > 58
    ) {
      visible = visible.slice(0, -1);
    }

    if (visible !== original) {
      visible = `${visible.slice(0, -3)}...`;
    }

    document.text(visible, rightX, y, {
      align: "right",
    });
  };

  document.setTextColor(22, 35, 52);
  drawName(businessName, 17, 11, "bold");

  document.setTextColor(92, 101, 113);
  drawName(branchName, 25, 9, "normal");

  document.setTextColor(0);
}
// FINORA_C80_B28_B3_MONTHLY_RANGE_FILENAME
function monthlyDateLabel(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error("Invalid Monthly Collections report date.");
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function monthlyPdfFilename(monthKey: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);

  if (!match) {
    throw new Error("Invalid Monthly Collections month key.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (
    year < 2000 ||
    year > 9999 ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Invalid Monthly Collections year or month.");
  }

  const monthName = new Date(
    Date.UTC(year, month - 1, 1),
  ).toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });

  // FINORA_C80_B28_B6_CLEAN_MONTHLY_FILENAME
  // Filename reflects the selected report month and year only.
  return `PAISARULE_Monthly_Collections_${monthName}_${year}.pdf`;
}
// FINORA_C80_B28_B2_CENTER_LOGO
// Center branding stays clear of left/right shared-header text.
async function drawMonthlyCenterLogo(document: jsPDF): Promise<void> {
  const image = new Image();
  image.src = finoraMonthlyLogoUrl;

  try {
    await image.decode();
  } catch {
    throw new Error("Unable to load original PAISARULE Monthly PDF logo.");
  }

  if (!image.naturalWidth || !image.naturalHeight) {
    throw new Error("Invalid PAISARULE Monthly PDF logo dimensions.");
  }

  const canvas = window.document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to render PAISARULE Monthly PDF logo.");
  }

  // Preserve image proportions; avoid cropping or stretching.
  const scale = Math.min(
    canvas.width / image.naturalWidth,
    canvas.height / image.naturalHeight,
  );
  const imageWidth = image.naturalWidth * scale;
  const imageHeight = image.naturalHeight * scale;

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
  context.drawImage(
    image,
    (canvas.width - imageWidth) / 2,
    (canvas.height - imageHeight) / 2,
    imageWidth,
    imageHeight,
  );

  const logoSize = 28;
  const pageWidth = document.internal.pageSize.getWidth();

  document.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    (pageWidth - logoSize) / 2,
    6,
    logoSize,
    logoSize,
    "FINORA_MONTHLY_ORIGINAL_CENTER_LOGO",
    "FAST",
  );
}

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

function displayMonthlyPaisaruleId(value: unknown): string {
  return safeText(value).replace(
    /^FIN-(?=(?:CUS|LOAN|RCP|COL)-)/i,
    "PAISA-",
  );
}

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
    `PAISARULE - ${resolveBusinessReportTitle("Monthly Collections")}`,
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

  // FINORA_C80_B28_B5_R1_PAYMENT_MODE_SPACING
  // Add breathing room without changing payment totals.
  y = ensurePageSpace(document, y + 4, 18);
  y = drawSectionTitle(document, "PAYMENT MODE SUMMARY", y);
  y += 3;

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

        displayMonthlyPaisaruleId(collection.receiptNumber),

        displayMonthlyPaisaruleId(collection.customerName || collection.customerId),

        displayMonthlyPaisaruleId(collection.loanNumber),

        safeText(collection.paymentMethod).toUpperCase(),

        formatMoney(collection.paymentAmount),

        formatMoney(collection.discountAmount),
      ],
      y,
    );

    // FINORA_C80_B28_B1_RECEIPT_DETAILS
    // Preserve every collection, including INR 1 transactions.
    // Additional details belong to the same receipt row.
    const receiptDetails = [
      `Customer ID: ${displayMonthlyPaisaruleId(collection.customerId)}`,
      `Phone: ${safeText(collection.customerPhone)}`,
      `Collection Type: ${safeText(collection.collectionType)}`,
      `Status: ${safeText(collection.status)}`,
      `Payment Reference: ${safeText(collection.paymentReference)}`,
      `Remarks: ${safeText(collection.remarks)}`,
    ];

    document.setFont("helvetica", "normal");
    document.setFontSize(7);
    document.setTextColor(91, 102, 117);

    const detailText = receiptDetails.join("   |   ");
    const detailLines = document.splitTextToSize(
      detailText,
      getPageContentWidth(document) - 6,
    ) as string[];

    for (const detailLine of detailLines) {
      const pageHeight = document.internal.pageSize.getHeight();

      if (y + 4.5 > pageHeight - PAGE_BOTTOM_RESERVED) {
        y = addContinuationPage(document);

        document.setFont("helvetica", "normal");
        document.setFontSize(7);
        document.setTextColor(91, 102, 117);
      }

      document.text(detailLine, PAGE_MARGIN_X + 3, y + 3.4);
      y += 4.4;
    }

    y += 2;

    document.setTextColor(0);
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
    fileName: monthlyPdfFilename(report.monthKey),

    title: resolveBusinessReportTitle("Monthly Collections"),

    subtitle: "",
  });

  // Keep the original FINORA PNG in its own clear center zone.
  await drawMonthlyCenterLogo(document);

  // Actual server-scoped Business/Branch identity occupies right zone.
  await drawMonthlyBusinessIdentity(document);

  let y = CONTENT_START_Y;

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summaryMetrics = getSummaryMetrics(report);

  const summaryRows = Math.ceil(summaryMetrics.length / 2);

  const summaryHeight = 12 + summaryRows * 19;

  y = ensurePageSpace(document, y, summaryHeight);

  y = drawSectionTitle(document, `MONTHLY SUMMARY - ${report.monthLabel}`, y);

  // Show the exact selected month, not the PDF generation month.
  document.setFont("helvetica", "normal");
  document.setFontSize(8);
  document.setTextColor(82, 95, 111);
  document.text(
    `Reporting Period: ${monthlyDateLabel(report.fromDate)} to ${monthlyDateLabel(report.toDate)}`,
    PAGE_MARGIN_X,
    y,
  );
  document.setTextColor(0);

  y = drawMetricGrid(document, summaryMetrics, y + 5, 2);

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

  return monthlyPdfFilename(report.monthKey);
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

    monthlyPdfFilename(report.monthKey),

    {
      title: "PAISARULE Monthly Collections",

      text: `Monthly Collections - ${report.monthLabel}`,

      dialogTitle: "Share Monthly Collections",
    },
  );
}

// ============================================================
// END
// ============================================================
