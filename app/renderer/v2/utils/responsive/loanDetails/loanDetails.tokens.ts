// ============================================================
// FINORA ENTERPRISE OS™
// LOAN DETAILS — RESPONSIVE ENGINE
// TOKENS
// ============================================================

import type {
  LoanDetailsLayoutTokens,
  LoanDetailsResponsiveTokens,
} from "./loanDetails.types";

import type { LoanDetailsViewport } from "./loanDetails.breakpoints";

function createBaseTokens(
  viewport: LoanDetailsViewport,
): LoanDetailsLayoutTokens {
  return {
    viewport,

    // --------------------------------------------------------
    // PAGE
    // Desktop baseline is intentionally preserved.
    // --------------------------------------------------------

    pagePaddingX: 18,
    pagePaddingTop: 10,
    pagePaddingBottom: 110,

    // --------------------------------------------------------
    // CUSTOMER SELECTOR
    // --------------------------------------------------------

    customerColumns: 1,
    customerGap: 10,
    customerMinHeight: 120,

    // --------------------------------------------------------
    // SUMMARY
    // --------------------------------------------------------

    summaryColumns: 3,
    summaryGap: 10,
    summaryCardMinHeight: 110,

    // --------------------------------------------------------
    // MAIN CONTENT
    // --------------------------------------------------------

    mainContentGap: 10,
    formColumns: 1,

    // --------------------------------------------------------
    // FORM
    // --------------------------------------------------------

    basicDetailsColumns: 4,
    financialTermsColumns: 3,
    durationColumns: 2,
    additionalInformationColumns: 2,

    formGap: 10,
    sectionGap: 8,

    // --------------------------------------------------------
    // PREVIEW
    // --------------------------------------------------------

    previewColumns: 1,
    previewMinWidth: 420,

    // --------------------------------------------------------
    // FOOTER
    // --------------------------------------------------------

    footerColumns: 6,
    footerGap: 8,
    footerStacked: false,

    // --------------------------------------------------------
    // MOBILE
    // --------------------------------------------------------

    mobileFieldGap: 8,
    mobileSectionGap: 10,
  };
}

export function createLoanDetailsTokens(
  viewport: LoanDetailsViewport,
): LoanDetailsResponsiveTokens {
  const tokens = createBaseTokens(viewport);

  // ==========================================================
  // MOBILE
  // ==========================================================

  if (viewport === "mobile") {
    return {
      viewport,

      layout: {
        ...tokens,

        pagePaddingX: 10,
        pagePaddingTop: 8,
        pagePaddingBottom: 180,

        // Select Customer becomes one full-width block.
        customerColumns: 1,
        customerGap: 8,
        customerMinHeight: 150,

        // One summary card per row.
        summaryColumns: 1,
        summaryGap: 8,
        summaryCardMinHeight: 96,

        // One form input per row.
        formColumns: 1,

        basicDetailsColumns: 1,
        financialTermsColumns: 1,
        durationColumns: 1,
        additionalInformationColumns: 1,

        formGap: 8,
        sectionGap: 8,

        // Preview moves below the form.
        previewColumns: 1,
        previewMinWidth: 0,

        // One footer step per row.
        footerColumns: 1,
        footerGap: 8,
        footerStacked: true,

        mobileFieldGap: 7,
        mobileSectionGap: 10,
      },
    };
  }

  // ==========================================================
  // TABLET
  // ==========================================================

  if (viewport === "tablet") {
    return {
      viewport,

      layout: {
        ...tokens,

        pagePaddingX: 14,
        pagePaddingTop: 10,
        pagePaddingBottom: 140,

        // Customer area remains compact.
        customerColumns: 1,
        customerGap: 10,
        customerMinHeight: 130,

        // Two cards per row.
        summaryColumns: 2,
        summaryGap: 10,
        summaryCardMinHeight: 100,

        // Main form.
        formColumns: 1,

        // Two inputs per row.
        basicDetailsColumns: 2,
        financialTermsColumns: 2,
        durationColumns: 2,
        additionalInformationColumns: 2,

        formGap: 10,
        sectionGap: 8,

        // Preview remains full width below the form.
        previewColumns: 1,
        previewMinWidth: 0,

        // Two footer steps per row.
        footerColumns: 2,
        footerGap: 8,
        footerStacked: true,

        mobileFieldGap: 8,
        mobileSectionGap: 10,
      },
    };
  }

  // ==========================================================
  // LAPTOP + DESKTOP
  // ==========================================================
  //
  // IMPORTANT:
  // These remain the existing page layout.
  // No responsive redesign is applied here.
  //

  return {
    viewport,

    layout: {
      ...tokens,

      summaryColumns: 3,

      formColumns: 1,

      basicDetailsColumns: 4,
      financialTermsColumns: 3,
      durationColumns: 2,
      additionalInformationColumns: 2,

      previewColumns: 1,
      previewMinWidth: 420,

      footerColumns: 6,
      footerStacked: false,
    },
  };
}
