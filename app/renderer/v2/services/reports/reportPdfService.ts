// ============================================================
// FINORA ENTERPRISE OS™
//
// REPORTS ENGINE™
//
// PDF + SHARE SERVICE
//
// RESPONSIBILITY:
//
// - Generate FINORA PDF documents
// - Download PDFs on Web / Desktop
// - Persist temporary PDFs on native Android
// - Open native share sheet
// - Allow WhatsApp sharing through Android share sheet
// - Keep report UI independent from jsPDF / Capacitor
//
// ARCHITECTURE:
//
// Report Data
//      ↓
// PDF Builder
//      ↓
// reportPdfService
//      ↓
// Web / Desktop Download
// OR
// Android Cache + Native Share
//
// IMPORTANT:
//
// - No LoanRepository access
// - No CollectionRepository access
// - No CustomerRepository access
// - No report financial calculations
// - No business aggregation
// - No hardcoded customer/loan data
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { Capacitor } from "@capacitor/core";

import { Directory, Filesystem } from "@capacitor/filesystem";

import { Share } from "@capacitor/share";

import { jsPDF } from "jspdf";

// ============================================================
// TYPES
// ============================================================

export interface FinoraPdfReportOptions {
  fileName: string;

  title: string;

  subtitle?: string;

  generatedAt?: string;
}

export interface FinoraPdfShareOptions {
  title?: string;

  text?: string;

  dialogTitle?: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const REPORT_FOLDER = "finora-reports";

// ============================================================
// FILE NAME
// ============================================================

function sanitizeFileName(value: string): string {
  const normalized = String(value || "FINORA_Report")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");

  if (normalized.toLowerCase().endsWith(".pdf")) {
    return normalized;
  }

  return `${normalized}.pdf`;
}

// ============================================================
// GENERATED DATE
// ============================================================

export function getReportGeneratedAt(): string {
  const now = new Date();

  return now.toLocaleString("en-IN", {
    day: "2-digit",

    month: "short",

    year: "numeric",

    hour: "2-digit",

    minute: "2-digit",

    hour12: true,
  });
}

// ============================================================
// CREATE BASE FINORA PDF
// ============================================================

export function createFinoraPdf(options: FinoraPdfReportOptions): jsPDF {
  const document = new jsPDF({
    orientation: "portrait",

    unit: "mm",

    format: "a4",

    compress: true,
  });

  const pageWidth = document.internal.pageSize.getWidth();

  // ==========================================================
  // BRAND
  // ==========================================================

  document.setFont("helvetica", "bold");

  document.setFontSize(11);

  document.text("FINORA ENTERPRISE", 15, 16);

  // ==========================================================
  // REPORT TITLE
  // ==========================================================

  document.setFontSize(18);

  document.text(options.title, 15, 27);

  // ==========================================================
  // SUBTITLE
  // ==========================================================

  if (options.subtitle) {
    document.setFont("helvetica", "normal");

    document.setFontSize(9);

    document.text(options.subtitle, 15, 34);
  }

  // ==========================================================
  // GENERATED DATE
  // ==========================================================

  document.setFont("helvetica", "normal");

  document.setFontSize(8);

  document.text(
    `Generated: ${options.generatedAt ?? getReportGeneratedAt()}`,
    pageWidth - 15,
    16,
    {
      align: "right",
    },
  );

  // ==========================================================
  // DIVIDER
  // ==========================================================

  document.setLineWidth(0.3);

  document.line(15, 39, pageWidth - 15, 39);

  return document;
}

// ============================================================
// ADD PAGE FOOTER
// ============================================================

export function addFinoraPdfFooters(document: jsPDF): void {
  const pageCount = document.getNumberOfPages();

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    document.setPage(pageNumber);

    const pageWidth = document.internal.pageSize.getWidth();

    const pageHeight = document.internal.pageSize.getHeight();

    document.setFont("helvetica", "normal");

    document.setFontSize(7);

    document.text("Generated by FINORA Enterprise", 15, pageHeight - 8);

    document.text(
      `Page ${pageNumber} of ${pageCount}`,
      pageWidth - 15,
      pageHeight - 8,
      {
        align: "right",
      },
    );
  }
}

// ============================================================
// PDF → BASE64
// ============================================================

function getPdfBase64(document: jsPDF): string {
  const dataUri = document.output("datauristring");

  const separatorIndex = dataUri.indexOf(",");

  if (separatorIndex < 0) {
    throw new Error("Unable to convert FINORA report into PDF data.");
  }

  return dataUri.slice(separatorIndex + 1);
}

// ============================================================
// DOWNLOAD PDF
//
// WEB / ELECTRON RENDERER
// ============================================================

export function downloadFinoraPdf(
  document: jsPDF,

  fileName: string,
): void {
  const safeFileName = sanitizeFileName(fileName);

  document.save(safeFileName);
}

// ============================================================
// WRITE NATIVE PDF
//
// Android:
// Directory.Cache is intentionally used.
//
// Capacitor Share supports sharing files from the application
// cache directory without requiring permanent public-storage
// ownership.
// ============================================================

async function writeNativePdf(
  document: jsPDF,

  fileName: string,
): Promise<string> {
  const safeFileName = sanitizeFileName(fileName);

  const base64 = getPdfBase64(document);

  const result = await Filesystem.writeFile({
    path: `${REPORT_FOLDER}/${safeFileName}`,

    data: base64,

    directory: Directory.Cache,

    recursive: true,
  });

  return result.uri;
}

// ============================================================
// SHARE PDF
//
// Native Android:
//
// Android Share Sheet opens.
// User can select:
//
// - WhatsApp
// - Gmail
// - Messages
// - Drive
// - Other installed applications
//
// This avoids hard dependency on WhatsApp being installed.
// ============================================================

export async function shareFinoraPdf(
  document: jsPDF,

  fileName: string,

  options: FinoraPdfShareOptions = {},
): Promise<void> {
  // ==========================================================
  // NATIVE
  // ==========================================================

  if (Capacitor.isNativePlatform()) {
    const fileUri = await writeNativePdf(document, fileName);

    await Share.share({
      title: options.title ?? "FINORA Report",

      text: options.text ?? "FINORA Enterprise Report",

      files: [fileUri],

      dialogTitle: options.dialogTitle ?? "Share FINORA Report",
    });

    return;
  }

  // ==========================================================
  // WEB / DESKTOP FALLBACK
  // ==========================================================

  downloadFinoraPdf(document, fileName);
}

// ============================================================
// FINALIZE + DOWNLOAD
// ============================================================

export function finalizeAndDownloadFinoraPdf(
  document: jsPDF,

  fileName: string,
): void {
  addFinoraPdfFooters(document);

  downloadFinoraPdf(document, fileName);
}

// ============================================================
// FINALIZE + SHARE
// ============================================================

export async function finalizeAndShareFinoraPdf(
  document: jsPDF,

  fileName: string,

  options: FinoraPdfShareOptions = {},
): Promise<void> {
  addFinoraPdfFooters(document);

  await shareFinoraPdf(document, fileName, options);
}

// ============================================================
// PRINT PDF
// ============================================================

export function printFinoraPdf(document: jsPDF): void {
  const blobUrl = document.output("bloburl");

  const printWindow = window.open(String(blobUrl), "_blank");

  if (!printWindow) {
    throw new Error("Unable to open the FINORA report print window.");
  }
}

// ============================================================
// END
// ============================================================
