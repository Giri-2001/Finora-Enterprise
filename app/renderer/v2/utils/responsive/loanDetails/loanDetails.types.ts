// ============================================================
// FINORA ENTERPRISE OS™
// LOAN DETAILS — RESPONSIVE ENGINE
// TYPES
// ============================================================

import type { CSSProperties } from "react";

import type { LoanDetailsViewport } from "./loanDetails.breakpoints";

export interface LoanDetailsLayoutTokens {
  viewport: LoanDetailsViewport;

  // ----------------------------------------------------------
  // PAGE
  // ----------------------------------------------------------

  pagePaddingX: number;
  pagePaddingTop: number;
  pagePaddingBottom: number;

  // ----------------------------------------------------------
  // CUSTOMER SELECTOR
  // ----------------------------------------------------------

  customerColumns: number;
  customerGap: number;
  customerMinHeight: number;

  // ----------------------------------------------------------
  // SUMMARY CARDS
  // ----------------------------------------------------------

  summaryColumns: number;
  summaryGap: number;
  summaryCardMinHeight: number;

  // ----------------------------------------------------------
  // MAIN CONTENT
  // ----------------------------------------------------------

  mainContentGap: number;
  formColumns: number;

  // ----------------------------------------------------------
  // FORM SECTIONS
  // ----------------------------------------------------------

  basicDetailsColumns: number;
  financialTermsColumns: number;
  durationColumns: number;
  additionalInformationColumns: number;

  formGap: number;
  sectionGap: number;

  // ----------------------------------------------------------
  // PREVIEW
  // ----------------------------------------------------------

  previewColumns: number;
  previewMinWidth: number;

  // ----------------------------------------------------------
  // FOOTER / STEPS
  // ----------------------------------------------------------

  footerColumns: number;
  footerGap: number;
  footerStacked: boolean;

  // ----------------------------------------------------------
  // MOBILE
  // ----------------------------------------------------------

  mobileFieldGap: number;
  mobileSectionGap: number;
}

export interface LoanDetailsResponsiveTokens {
  viewport: LoanDetailsViewport;
  layout: LoanDetailsLayoutTokens;
}

export type LoanDetailsStyleBuilder = (
  tokens: LoanDetailsResponsiveTokens,
) => CSSProperties;
