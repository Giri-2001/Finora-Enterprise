/*
 * FINORA_C80_B26_D6_B_CUSTOMER_CLOSED_LOAN_NOC
 *
 * Dedicated customer-facing, single-loan closure certificate.
 * Never modifies Owner All Closed Loans or Loan Statement.
 *
 * Eligibility:
 * - exactly one selected loan
 * - matching Customer ID
 * - authoritative CLOSED status
 * - current outstanding exactly zero
 *
 * Never claims that other customer loans are cleared.
 */

import { jsPDF } from "jspdf";

import finoraLogoUrl from "../../app/assets/finoraenterprise.png";

import { getBusinessContext } from "../business/businessContextService";

import { buildClosedLoansReport } from "./closedLoansDataService";

import {
  addFinoraPdfFooters,
  downloadFinoraPdf,
  getReportGeneratedAt,
  printFinoraPdf,
  shareFinoraPdf,
} from "./reportPdfService";

import type { ClosedLoanReportRow } from "./closedLoansDataService";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;

const NAVY: [number, number, number] = [23, 39, 65];
const GOLD: [number, number, number] = [167, 119, 40];
const GREY: [number, number, number] = [94, 105, 120];
const GREEN: [number, number, number] = [31, 116, 84];

function safeText(value: unknown, fallback = "--"): string {
  const result = String(value ?? "").trim();
  return result || fallback;
}

function money(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error("Invalid NOC financial amount.");
  }

  return `INR ${Math.round(value).toLocaleString("en-IN")}`;
}

function cleanFilePart(value: string, fallback: string): string {
  return (
    String(value ?? "")
      .trim()
      .replace(/[^a-zA-Z0-9-]+/g, "")
      .slice(0, 65) || fallback
  );
}

function makeFileName(loan: ClosedLoanReportRow): string {
  return (
    `Finora_${cleanFilePart(loan.customerName, "Customer")}` +
    `_Closed_Loan_NOC_${cleanFilePart(loan.loanNumber, "Loan")}.pdf`
  );
}

async function loadVerifiedClosedLoan(
  customerId: string,
  loanId: string,
): Promise<ClosedLoanReportRow> {
  if (!customerId.trim() || !loanId.trim()) {
    throw new Error("Select a Customer and a Closed Loan.");
  }

  // Rebuild from current authoritative report source on every export.
  const report = await buildClosedLoansReport();

  const matching = report.loans.filter(
    (loan) =>
      loan.customerId === customerId &&
      loan.loanId === loanId &&
      loan.status.trim().toUpperCase() === "CLOSED",
  );

  if (matching.length !== 1) {
    throw new Error("Unique CLOSED Loan verification failed.");
  }

  const loan = matching[0];

  if (
    !Number.isFinite(loan.currentOutstanding) ||
    loan.currentOutstanding !== 0
  ) {
    throw new Error(
      "NOC denied: Selected Closed Loan has non-zero outstanding.",
    );
  }

  for (const amount of [
    loan.principal,
    loan.totalPayable,
    loan.totalCollected,
    loan.totalDiscount,
    loan.settlementAdjustment,
  ]) {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error("NOC denied: Invalid settlement amount.");
    }
  }

  if (!loan.loanNumber.trim() || !loan.customerName.trim()) {
    throw new Error("NOC denied: Missing Loan or Customer identity.");
  }

  return loan;
}

async function drawLogo(document: jsPDF): Promise<void> {
  const image = new Image();
  image.src = finoraLogoUrl;

  try {
    await image.decode();
  } catch {
    throw new Error("Unable to load original FINORA PNG logo.");
  }

  if (!image.naturalWidth || !image.naturalHeight) {
    throw new Error("FINORA PNG logo has invalid dimensions.");
  }

  const canvas = window.document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to prepare FINORA logo.");
  }

  context.drawImage(image, 0, 0, 256, 256);

  const size = 30;

  document.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    (PAGE_WIDTH - size) / 2,
    9,
    size,
    size,
    "FINORA_CUSTOMER_NOC_ORIGINAL_LOGO",
    "FAST",
  );
}

function drawBackground(document: jsPDF): void {
  // Underlying background first: never paint over certificate text.
  document.setDrawColor(...GOLD);
  document.setLineWidth(0.45);
  document.rect(9, 9, PAGE_WIDTH - 18, PAGE_HEIGHT - 18);

  document.setDrawColor(225, 211, 184);
  document.setLineWidth(0.15);
  document.rect(12, 12, PAGE_WIDTH - 24, PAGE_HEIGHT - 24);

  // Very light printed tint, readable underneath foreground.
  document.setFont("helvetica", "bold");
  document.setFontSize(56);
  document.setTextColor(243, 244, 246);
  document.text("CLOSED", 105, 154, { align: "center", angle: 30 });

  document.setFontSize(32);
  document.setTextColor(246, 246, 247);
  document.text("FINORA", 105, 179, { align: "center", angle: 30 });
}

function labelValue(
  document: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width = 80,
): void {
  document.setFont("helvetica", "normal");
  document.setFontSize(8);
  document.setTextColor(...GREY);
  document.text(label, x, y);

  document.setFont("helvetica", "bold");
  document.setFontSize(10);
  document.setTextColor(...NAVY);

  const lines = document.splitTextToSize(value, width);
  document.text(lines.slice(0, 2), x, y + 6);
}

function sectionTitle(document: jsPDF, title: string, y: number): void {
  document.setFont("helvetica", "bold");
  document.setFontSize(10);
  document.setTextColor(...NAVY);
  document.text(title, 21, y);

  document.setDrawColor(217, 223, 230);
  document.setLineWidth(0.25);
  document.line(21, y + 3, 189, y + 3);
}

function drawSeal(document: jsPDF, x: number, y: number): void {
  document.setFillColor(255, 251, 243);
  document.setDrawColor(...GOLD);
  document.setLineWidth(0.85);
  document.circle(x, y, 19, "FD");

  document.setDrawColor(...GREEN);
  document.setLineWidth(0.35);
  document.circle(x, y, 16);

  document.setTextColor(...NAVY);
  document.setFont("helvetica", "bold");
  document.setFontSize(6.7);
  document.text("FINORA", x, y - 9.0, { align: "center" });

  document.setFontSize(12);
  document.setTextColor(...GREEN);
  document.text("CLOSED", x, y, { align: "center" });

  document.setFontSize(10);
  document.setTextColor(...GOLD);
  document.text("NOC", x, y + 7.0, { align: "center" });

  // Decorative seal only. No fabricated signature or approval.
}

function drawCertificate(
  document: jsPDF,
  loan: ClosedLoanReportRow,
  issuedAt: string,
): void {
  const businessContext = getBusinessContext();

  const businessName = safeText(
    businessContext?.businessProfile?.businessName,
    "FINORA Enterprise",
  );

  document.setFont("helvetica", "bold");
  document.setFontSize(9);
  document.setTextColor(...NAVY);
  document.text("FINORA ENTERPRISE", 21, 24);

  document.setFont("helvetica", "normal");
  document.setFontSize(7.5);
  document.setTextColor(...GREY);
  document.text("LOAN CLOSURE CERTIFICATE", 189, 24, {
    align: "right",
  });

  document.setDrawColor(221, 224, 229);
  document.setLineWidth(0.2);
  document.line(21, 43, 189, 43);

  document.setFont("helvetica", "bold");
  document.setFontSize(18);
  document.setTextColor(...NAVY);
  document.text("LOAN CLOSURE CERTIFICATE", 105, 57, {
    align: "center",
  });

  document.setFontSize(9);
  document.setTextColor(...GOLD);
  document.text("NO OBJECTION / CLOSED LOAN CONFIRMATION", 105, 64, {
    align: "center",
  });

  document.setFont("helvetica", "normal");
  document.setFontSize(8);
  document.setTextColor(...GREY);
  document.text(
    `Issued: ${issuedAt}`,
    105,
    73,
    { align: "center" },
  );

  sectionTitle(document, "ISSUING BUSINESS", 86);
  labelValue(document, "Business", businessName, 21, 96, 156);

  sectionTitle(document, "CUSTOMER AND LOAN IDENTITY", 118);
  labelValue(document, "Customer Name", loan.customerName, 21, 129);
  labelValue(document, "Customer ID", loan.customerId, 111, 129);
  labelValue(document, "Loan Number", loan.loanNumber, 21, 149);
  labelValue(document, "Loan Status", "CLOSED", 111, 149);

  sectionTitle(document, "FINAL LOAN SETTLEMENT", 171);

  const amounts: Array<[string, number]> = [
    ["Principal", loan.principal],
    ["Total Payable", loan.totalPayable],
    ["Total Received", loan.totalCollected],
    ["Discount", loan.totalDiscount],
    ["Settlement Adjustment", loan.settlementAdjustment],
  ];

  amounts.forEach(([label, amount], index) => {
    const y = 180 + index * 8.5;

    document.setFont("helvetica", "normal");
    document.setFontSize(8.5);
    document.setTextColor(...GREY);
    document.text(label, 22, y);

    document.setFont("helvetica", "bold");
    document.setTextColor(...NAVY);
    document.text(money(amount), 133, y, { align: "right" });
  });

  document.setFillColor(235, 248, 241);
  document.setDrawColor(172, 212, 187);
  document.roundedRect(21, 223, 168, 16, 3, 3, "FD");

  document.setFont("helvetica", "bold");
  document.setFontSize(10);
  document.setTextColor(...GREEN);
  document.text("FINAL OUTSTANDING", 27, 233);
  document.text(money(0), 181, 233, { align: "right" });

  document.setFont("helvetica", "normal");
  document.setFontSize(8.2);
  document.setTextColor(...NAVY);

  const declaration =
    "The above identified loan is recorded as CLOSED with no " +
    "outstanding balance against this specific loan number. " +
    "This confirmation applies only to the loan identified here " +
    "and does not certify clearance of any other loan.";

  const lines = document.splitTextToSize(declaration, 123);

  document.text(lines, 22, 249);

  drawSeal(document, 164, 258);

  document.setFont("helvetica", "italic");
  document.setFontSize(7);
  document.setTextColor(...GREY);
  document.text(
    "Generated from FINORA closed-loan records.",
    21,
    273,
  );
}

export async function buildCustomerClosedLoanNocPdf(
  customerId: string,
  loanId: string,
): Promise<{ document: jsPDF; fileName: string }> {
  const loan = await loadVerifiedClosedLoan(customerId, loanId);
  const issuedAt = getReportGeneratedAt();

  const document = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  // Strict layer order: watermark -> logo -> all foreground details.
  drawBackground(document);
  await drawLogo(document);
  drawCertificate(document, loan, issuedAt);

  document.setProperties({
    title: `Loan Closure NOC - ${loan.loanNumber}`,
    subject: "Specific Loan Closure Confirmation",
    author: "FINORA Enterprise",
  });

  addFinoraPdfFooters(document);

  return {
    document,
    fileName: makeFileName(loan),
  };
}

export async function downloadCustomerClosedLoanNocPdf(
  customerId: string,
  loanId: string,
): Promise<void> {
  const result = await buildCustomerClosedLoanNocPdf(customerId, loanId);
  downloadFinoraPdf(result.document, result.fileName);
}

export async function printCustomerClosedLoanNocPdf(
  customerId: string,
  loanId: string,
): Promise<void> {
  const result = await buildCustomerClosedLoanNocPdf(customerId, loanId);
  printFinoraPdf(result.document);
}

export async function shareCustomerClosedLoanNocPdf(
  customerId: string,
  loanId: string,
): Promise<void> {
  const result = await buildCustomerClosedLoanNocPdf(customerId, loanId);

  await shareFinoraPdf(result.document, result.fileName, {
    title: "FINORA Loan Closure NOC",
    text: "Closed Loan / No Outstanding Confirmation",
    dialogTitle: "Share Loan Closure Certificate",
  });
}