/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS PDF REGISTER

   MODULE  : Accounts
   LAYER   : Document Service
   VERSION : 1.0

   RESPONSIBILITY:

   - Build FINORA Accounts Register PDF
   - Render selected period
   - Render Money Out / Money In summary
   - Render Net Movement / Transactions summary
   - Render physical financial transaction register
   - Download through shared reportPdfService
   - Print through shared reportPdfService
   - Share through shared reportPdfService
   - Reuse global FINORA currency formatter

   IMPORTANT:

   - No repository access.
   - No Accounts persistence.
   - No filtering.
   - No totals calculation.
   - No React.
   - No UI state access.
   - No duplicate PDF platform plumbing.

   SOURCE:

   AccountsDocumentRequest
        ↓
   buildAccountsPdf()
        ↓
   reportPdfService
        ↓
   Download / Print / Share
=========================================================== */

/* ===========================================================
   CONSTANTS
=========================================================== */

import {
  ACCOUNTS_DOCUMENT_FILE_PREFIX,
  ACCOUNTS_DOCUMENT_SHARE_DIALOG_TITLE,
  ACCOUNTS_DOCUMENT_SHARE_TITLE,
  ACCOUNTS_DOCUMENT_TITLE,
  ACCOUNTS_EMPTY_VALUE,
  ACCOUNTS_LEDGER_COLUMNS,
  ACCOUNTS_MONEY_IN_ACCOUNTING_LABEL,
  ACCOUNTS_MONEY_IN_TITLE,
  ACCOUNTS_MONEY_OUT_ACCOUNTING_LABEL,
  ACCOUNTS_MONEY_OUT_TITLE,
  ACCOUNTS_NET_MOVEMENT_TITLE,
  ACCOUNTS_NUMBER_LOCALE,
  ACCOUNTS_TRANSACTIONS_TITLE,
} from "../../constants/accounts/accounts.constants";

/* ===========================================================
   TYPES
=========================================================== */

import type {
  AccountEntry,
  AccountsDocumentRequest,
} from "../../types/accounts/accounts.types";

/* ===========================================================
   SHARED CURRENCY FORMATTER
=========================================================== */

import { formatCurrency } from "../../utils/currency/formatCurrency";

/* ===========================================================
   SHARED REPORT PDF SERVICE
=========================================================== */

import {
  addFinoraPdfFooters,
  createFinoraPdf,
  finalizeAndDownloadFinoraPdf,
  finalizeAndShareFinoraPdf,
  getReportGeneratedAt,
  printFinoraPdf,
} from "../reports/reportPdfService";

/* ===========================================================
   PDF TYPE

   Avoid importing jsPDF directly into Accounts.
   reportPdfService remains the PDF infrastructure owner.
=========================================================== */

type AccountsPdfDocument = ReturnType<typeof createFinoraPdf>;

/* ===========================================================
   PAGE GEOMETRY
=========================================================== */

const PAGE_MARGIN_X = 10;

const CONTENT_START_Y = 46;

const PAGE_BOTTOM_MARGIN = 18;

const SUMMARY_CARD_HEIGHT = 18;

const SUMMARY_GAP = 3;

const TABLE_HEADER_HEIGHT = 10;

const TABLE_MIN_ROW_HEIGHT = 10;

const CELL_PADDING_X = 1.4;

const CELL_PADDING_Y = 2;

const BODY_FONT_SIZE = 6.6;

const SECONDARY_FONT_SIZE = 5.8;

const HEADER_FONT_SIZE = 6.2;

/* ===========================================================
   COLUMN CONTRACT

   A4 portrait usable width is approximately 190 mm.

   Total:
   10 + 23 + 29 + 36 + 22 + 22 + 18 + 30
   =
   190 mm
=========================================================== */

interface AccountsPdfColumn {
  key:
    | "serial"
    | "date"
    | "customer"
    | "activity"
    | "moneyOut"
    | "moneyIn"
    | "method"
    | "reference";

  label: string;

  width: number;

  align?: "left" | "center" | "right";
}

const ACCOUNTS_PDF_COLUMNS: readonly AccountsPdfColumn[] = [
  {
    key: "serial",

    label: ACCOUNTS_LEDGER_COLUMNS.SERIAL,

    width: 10,

    align: "center",
  },

  {
    key: "date",

    label: ACCOUNTS_LEDGER_COLUMNS.DATE_TIME,

    width: 23,
  },

  {
    key: "customer",

    label: ACCOUNTS_LEDGER_COLUMNS.CUSTOMER,

    width: 29,
  },

  {
    key: "activity",

    label: ACCOUNTS_LEDGER_COLUMNS.ACTIVITY,

    width: 36,
  },

  {
    key: "moneyOut",

    label: ACCOUNTS_LEDGER_COLUMNS.MONEY_OUT,

    width: 22,

    align: "right",
  },

  {
    key: "moneyIn",

    label: ACCOUNTS_LEDGER_COLUMNS.MONEY_IN,

    width: 22,

    align: "right",
  },

  {
    key: "method",

    label: ACCOUNTS_LEDGER_COLUMNS.METHOD,

    width: 18,
  },

  {
    key: "reference",

    label: ACCOUNTS_LEDGER_COLUMNS.REFERENCE,

    width: 30,
  },
];

/* ===========================================================
   SAFE TEXT
=========================================================== */

function safeText(value: unknown): string {
  const text = String(value ?? "").trim();

  return text || ACCOUNTS_EMPTY_VALUE;
}

/* ===========================================================
   PDF MONEY

   Accounts display policy:
   - Indian grouping
   - no decimals
   - no duplicate formatter
=========================================================== */

function formatPdfMoney(value: number): string {
  return formatCurrency(value);
}

/* ===========================================================
   DATE FORMAT

   dateKey is normalized local YYYY-MM-DD.
=========================================================== */

function formatPdfDate(dateKey: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey ?? "").trim());

  if (!match) {
    return ACCOUNTS_EMPTY_VALUE;
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  if (Number.isNaN(date.getTime())) {
    return ACCOUNTS_EMPTY_VALUE;
  }

  return date.toLocaleDateString(ACCOUNTS_NUMBER_LOCALE, {
    day: "2-digit",

    month: "short",

    year: "numeric",
  });
}

/* ===========================================================
   TIME FORMAT

   Date-only values do not invent midnight.
=========================================================== */

function formatPdfTime(occurredAt: string): string {
  const raw = String(occurredAt ?? "").trim();

  if (!raw || !/[T\s]\d{1,2}:\d{2}/.test(raw)) {
    return ACCOUNTS_EMPTY_VALUE;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return ACCOUNTS_EMPTY_VALUE;
  }

  return date.toLocaleTimeString(ACCOUNTS_NUMBER_LOCALE, {
    hour: "2-digit",

    minute: "2-digit",

    hour12: true,
  });
}

/* ===========================================================
   FILE NAME
=========================================================== */

function buildAccountsPdfFileName(request: AccountsDocumentRequest): string {
  const generatedDate = new Date().toISOString().slice(0, 10);

  const period = request.period.label
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);

  const suffix = period || generatedDate;

  return `${ACCOUNTS_DOCUMENT_FILE_PREFIX}_${suffix}.pdf`;
}

/* ===========================================================
   SPLIT TEXT
=========================================================== */

function splitPdfText(
  document: AccountsPdfDocument,

  value: string,

  width: number,
): string[] {
  const result = document.splitTextToSize(value, Math.max(width, 1));

  if (Array.isArray(result)) {
    return result.map(String);
  }

  return [String(result)];
}

/* ===========================================================
   SUMMARY CARD
=========================================================== */

function drawSummaryCard(
  document: AccountsPdfDocument,

  x: number,

  y: number,

  width: number,

  title: string,

  value: string,

  tone: "OUT" | "IN" | "NEUTRAL",
): void {
  document.setDrawColor(205, 205, 205);

  document.setFillColor(249, 249, 249);

  document.roundedRect(x, y, width, SUMMARY_CARD_HEIGHT, 2, 2, "FD");

  if (tone === "OUT") {
    document.setTextColor(185, 28, 28);
  } else if (tone === "IN") {
    document.setTextColor(21, 128, 61);
  } else {
    document.setTextColor(35, 35, 35);
  }

  document.setFont("helvetica", "bold");

  document.setFontSize(7);

  document.text(title, x + 3, y + 6);

  document.setFontSize(11);

  document.text(value, x + 3, y + 13.5);

  document.setTextColor(35, 35, 35);
}

/* ===========================================================
   SUMMARY
=========================================================== */

function drawAccountsSummary(
  document: AccountsPdfDocument,

  request: AccountsDocumentRequest,

  startY: number,
): number {
  const pageWidth = document.internal.pageSize.getWidth();

  const usableWidth = pageWidth - PAGE_MARGIN_X * 2;

  const cardWidth = (usableWidth - SUMMARY_GAP) / 2;

  drawSummaryCard(
    document,
    PAGE_MARGIN_X,
    startY,
    cardWidth,
    `${ACCOUNTS_MONEY_OUT_TITLE} (${ACCOUNTS_MONEY_OUT_ACCOUNTING_LABEL})`,
    formatPdfMoney(request.summary.totalMoneyOut),
    "OUT",
  );

  drawSummaryCard(
    document,
    PAGE_MARGIN_X + cardWidth + SUMMARY_GAP,
    startY,
    cardWidth,
    `${ACCOUNTS_MONEY_IN_TITLE} (${ACCOUNTS_MONEY_IN_ACCOUNTING_LABEL})`,
    formatPdfMoney(request.summary.totalMoneyIn),
    "IN",
  );

  const secondRowY = startY + SUMMARY_CARD_HEIGHT + SUMMARY_GAP;

  const netTone: "OUT" | "IN" | "NEUTRAL" =
    request.summary.netMovement < 0
      ? "OUT"
      : request.summary.netMovement > 0
        ? "IN"
        : "NEUTRAL";

  drawSummaryCard(
    document,
    PAGE_MARGIN_X,
    secondRowY,
    cardWidth,
    ACCOUNTS_NET_MOVEMENT_TITLE,
    formatPdfMoney(request.summary.netMovement),
    netTone,
  );

  drawSummaryCard(
    document,
    PAGE_MARGIN_X + cardWidth + SUMMARY_GAP,
    secondRowY,
    cardWidth,
    ACCOUNTS_TRANSACTIONS_TITLE,
    request.summary.transactionCount.toLocaleString(ACCOUNTS_NUMBER_LOCALE),
    "NEUTRAL",
  );

  return secondRowY + SUMMARY_CARD_HEIGHT + 6;
}

/* ===========================================================
   PERIOD LINE
=========================================================== */

function drawPeriodLine(
  document: AccountsPdfDocument,

  request: AccountsDocumentRequest,

  y: number,
): number {
  document.setTextColor(55, 55, 55);

  document.setFont("helvetica", "bold");

  document.setFontSize(8);

  document.text(`Period: ${safeText(request.period.label)}`, PAGE_MARGIN_X, y);

  document.setFont("helvetica", "normal");

  document.setTextColor(100, 100, 100);

  document.setFontSize(7);

  document.text(
    `Generated: ${safeText(request.generatedAt)}`,
    PAGE_MARGIN_X,
    y + 5,
  );

  return y + 10;
}

/* ===========================================================
   TABLE HEADER
=========================================================== */

function drawTableHeader(
  document: AccountsPdfDocument,

  y: number,
): number {
  let x = PAGE_MARGIN_X;

  document.setFillColor(240, 240, 240);

  document.setDrawColor(170, 170, 170);

  document.setFont("helvetica", "bold");

  document.setFontSize(HEADER_FONT_SIZE);

  for (const column of ACCOUNTS_PDF_COLUMNS) {
    document.rect(x, y, column.width, TABLE_HEADER_HEIGHT, "FD");

    if (column.key === "moneyOut") {
      document.setTextColor(185, 28, 28);
    } else if (column.key === "moneyIn") {
      document.setTextColor(21, 128, 61);
    } else {
      document.setTextColor(45, 45, 45);
    }

    const textX =
      column.align === "right"
        ? x + column.width - CELL_PADDING_X
        : column.align === "center"
          ? x + column.width / 2
          : x + CELL_PADDING_X;

    document.text(column.label, textX, y + 6.3, {
      align: column.align ?? "left",
    });

    x += column.width;
  }

  document.setTextColor(35, 35, 35);

  return y + TABLE_HEADER_HEIGHT;
}

/* ===========================================================
   CELL VALUE
=========================================================== */

function getAccountsPdfCellValue(
  entry: AccountEntry,

  serialNumber: number,

  key: AccountsPdfColumn["key"],
): string {
  switch (key) {
    case "serial":
      return String(serialNumber);

    case "date": {
      const date = formatPdfDate(entry.dateKey);

      const time = formatPdfTime(entry.occurredAt);

      return time === ACCOUNTS_EMPTY_VALUE ? date : `${date}\n${time}`;
    }

    case "customer":
      return entry.customerPhone
        ? `${safeText(entry.customerName)}\n${entry.customerPhone}`
        : safeText(entry.customerName);

    case "activity":
      return safeText(entry.description);

    case "moneyOut":
      return entry.moneyFlow === "MONEY_OUT"
        ? formatPdfMoney(entry.moneyOut)
        : ACCOUNTS_EMPTY_VALUE;

    case "moneyIn":
      return entry.moneyFlow === "MONEY_IN"
        ? formatPdfMoney(entry.moneyIn)
        : ACCOUNTS_EMPTY_VALUE;

    case "method":
      return entry.paymentMethod === "UNKNOWN"
        ? ACCOUNTS_EMPTY_VALUE
        : safeText(entry.paymentMethodLabel);

    case "reference":
      return safeText(entry.sourceReference);

    default:
      return ACCOUNTS_EMPTY_VALUE;
  }
}

/* ===========================================================
   ROW HEIGHT
=========================================================== */

function calculatePdfRowHeight(
  document: AccountsPdfDocument,

  entry: AccountEntry,

  serialNumber: number,
): number {
  let maximumLines = 1;

  document.setFontSize(BODY_FONT_SIZE);

  for (const column of ACCOUNTS_PDF_COLUMNS) {
    const value = getAccountsPdfCellValue(entry, serialNumber, column.key);

    const lines = splitPdfText(
      document,
      value,
      column.width - CELL_PADDING_X * 2,
    );

    maximumLines = Math.max(maximumLines, lines.length);
  }

  return Math.max(
    TABLE_MIN_ROW_HEIGHT,
    maximumLines * 3.4 + CELL_PADDING_Y * 2,
  );
}

/* ===========================================================
   DRAW ROW
=========================================================== */

function drawAccountsPdfRow(
  document: AccountsPdfDocument,

  entry: AccountEntry,

  serialNumber: number,

  y: number,

  rowHeight: number,
): void {
  let x = PAGE_MARGIN_X;

  document.setDrawColor(205, 205, 205);

  document.setFont("helvetica", "normal");

  document.setFontSize(BODY_FONT_SIZE);

  for (const column of ACCOUNTS_PDF_COLUMNS) {
    document.rect(x, y, column.width, rowHeight);

    const value = getAccountsPdfCellValue(entry, serialNumber, column.key);

    const lines = splitPdfText(
      document,
      value,
      column.width - CELL_PADDING_X * 2,
    );

    if (column.key === "moneyOut" && entry.moneyFlow === "MONEY_OUT") {
      document.setTextColor(185, 28, 28);

      document.setFont("helvetica", "bold");
    } else if (column.key === "moneyIn" && entry.moneyFlow === "MONEY_IN") {
      document.setTextColor(21, 128, 61);

      document.setFont("helvetica", "bold");
    } else {
      document.setTextColor(45, 45, 45);

      document.setFont("helvetica", "normal");
    }

    const textX =
      column.align === "right"
        ? x + column.width - CELL_PADDING_X
        : column.align === "center"
          ? x + column.width / 2
          : x + CELL_PADDING_X;

    document.text(lines, textX, y + CELL_PADDING_Y + 2.5, {
      align: column.align ?? "left",
    });

    x += column.width;
  }

  document.setTextColor(35, 35, 35);
}

/* ===========================================================
   EMPTY REGISTER
=========================================================== */

function drawEmptyRegister(
  document: AccountsPdfDocument,

  y: number,
): void {
  document.setFont("helvetica", "normal");

  document.setFontSize(9);

  document.setTextColor(95, 95, 95);

  document.text(
    "No money movement matches the selected Accounts filters.",
    PAGE_MARGIN_X,
    y + 8,
  );
}

/* ===========================================================
   REGISTER
=========================================================== */

function drawAccountsRegister(
  document: AccountsPdfDocument,

  request: AccountsDocumentRequest,

  startY: number,
): void {
  if (request.entries.length === 0) {
    drawEmptyRegister(document, startY);

    return;
  }

  let y = drawTableHeader(document, startY);

  for (let index = 0; index < request.entries.length; index += 1) {
    const entry = request.entries[index];

    const serialNumber = index + 1;

    const rowHeight = calculatePdfRowHeight(document, entry, serialNumber);

    const pageHeight = document.internal.pageSize.getHeight();

    if (y + rowHeight > pageHeight - PAGE_BOTTOM_MARGIN) {
      document.addPage();

      y = drawTableHeader(document, 16);
    }

    drawAccountsPdfRow(document, entry, serialNumber, y, rowHeight);

    y += rowHeight;
  }
}

/* ===========================================================
   BUILD PDF
=========================================================== */

export function buildAccountsPdf(
  request: AccountsDocumentRequest,
): AccountsPdfDocument {
  const fileName = buildAccountsPdfFileName(request);

  const generatedAt = request.generatedAt || getReportGeneratedAt();

  const document = createFinoraPdf({
    fileName,

    title: request.title || ACCOUNTS_DOCUMENT_TITLE,

    subtitle: `Period: ${safeText(request.period.label)}`,

    generatedAt,
  });

  let y = CONTENT_START_Y;

  y = drawAccountsSummary(document, request, y);

  y = drawPeriodLine(
    document,
    {
      ...request,

      generatedAt,
    },
    y,
  );

  drawAccountsRegister(document, request, y);

  return document;
}

/* ===========================================================
   DOWNLOAD
=========================================================== */

export function downloadAccountsPdf(request: AccountsDocumentRequest): void {
  const document = buildAccountsPdf(request);

  finalizeAndDownloadFinoraPdf(document, buildAccountsPdfFileName(request));
}

/* ===========================================================
   PRINT
=========================================================== */

export function printAccountsPdf(request: AccountsDocumentRequest): void {
  const document = buildAccountsPdf(request);

  addFinoraPdfFooters(document);

  printFinoraPdf(document);
}

/* ===========================================================
   SHARE
=========================================================== */

export async function shareAccountsPdf(
  request: AccountsDocumentRequest,
): Promise<void> {
  const document = buildAccountsPdf(request);

  await finalizeAndShareFinoraPdf(
    document,

    buildAccountsPdfFileName(request),

    {
      title: ACCOUNTS_DOCUMENT_SHARE_TITLE,

      text: `${ACCOUNTS_DOCUMENT_TITLE} • ${safeText(request.period.label)}`,

      dialogTitle: ACCOUNTS_DOCUMENT_SHARE_DIALOG_TITLE,
    },
  );
}

/* ===========================================================
   END
=========================================================== */
