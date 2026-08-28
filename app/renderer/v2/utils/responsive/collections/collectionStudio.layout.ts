// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// RESPONSIVE LAYOUT BUILDERS
//
// RESPONSIBILITY:
//
// - Collection Studio responsive geometry
// - Consume global FINORA Responsive Engine state
// - Mobile layout overrides
// - Tablet layout overrides
// - Preserve Laptop / Desktop premium geometry
//
// IMPORTANT:
//
// - No breakpoint values
// - No window.innerWidth
// - No media queries
// - No business logic
// - No persistence logic
// - No local responsive token system
// - Global Responsive Engine remains authoritative
//
// VERSION : 1.0
// STATUS  : Production
// ============================================================

import type { CSSProperties } from "react";

import type {
  ResponsiveTokens,
  ResponsiveViewport,
} from "../types";

// ============================================================
// PAGE INNER
// ============================================================

export function createCollectionStudioPageInnerStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  // ----------------------------------------------------------
  // MOBILE
  // ----------------------------------------------------------

  if (viewport === "mobile") {
    return {
      maxWidth: "100%",

      padding: `${tokens.spacing.small}px ${tokens.spacing.inline}px ${tokens.spacing.section}px`,
    };
  }

  // ----------------------------------------------------------
  // TABLET
  // ----------------------------------------------------------

  if (viewport === "tablet") {
    return {
      maxWidth: "100%",

      padding: `${tokens.spacing.small}px ${tokens.spacing.medium}px ${tokens.spacing.section}px`,
    };
  }

  // ----------------------------------------------------------
  // LAPTOP / DESKTOP
  //
  // Existing premium geometry remains authoritative.
  // ----------------------------------------------------------

  return {};
}

// ============================================================
// CUSTOMER + CUSTOMER LOANS ROW
// ============================================================

export function createCollectionStudioSelectionRowStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile" || viewport === "tablet") {
    return {
      gridTemplateColumns: "minmax(0, 1fr)",

      gap: `${tokens.layout.cardGap}px`,
    };
  }

  return {};
}

// ============================================================
// CUSTOMER CARD
// ============================================================

export function createCollectionStudioCustomerCardStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile") {
    return {
      minHeight: 0,

      gridTemplateColumns: `minmax(0, 1fr) ${tokens.customerCards.photoSize}px`,

      gap: `${tokens.layout.cardGap}px`,

      padding: `${tokens.spacing.card}px`,
    };
  }

  if (viewport === "tablet") {
    return {
      minHeight: 0,

      gridTemplateColumns: `minmax(0, 1fr) ${tokens.customerCards.photoSize}px`,

      gap: `${tokens.layout.cardGap}px`,

      padding: `${tokens.spacing.card}px`,
    };
  }

  return {};
}

// ============================================================
// CUSTOMER PHOTO FRAME
// ============================================================

export function createCollectionStudioCustomerPhotoFrameStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile" || viewport === "tablet") {
    return {
      width: `${tokens.customerCards.photoSize}px`,

      minWidth: `${tokens.customerCards.photoSize}px`,

      minHeight: `${tokens.customerCards.photoSize}px`,
    };
  }

  return {};
}

// ============================================================
// CUSTOMER PHOTO PLACEHOLDER
// ============================================================

export function createCollectionStudioPhotoPlaceholderStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile" || viewport === "tablet") {
    return {
      minHeight: `${tokens.customerCards.photoSize}px`,
    };
  }

  return {};
}

// ============================================================
// CUSTOMER LOANS HEADER
// ============================================================

export function createCollectionStudioLoansHeaderStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile") {
    return {
      flexDirection: "column",

      alignItems: "stretch",

      gap: `${tokens.spacing.inline}px`,
    };
  }

  return {};
}

// ============================================================
// LOAN DROPDOWN
// ============================================================

export function createCollectionStudioLoanDropdownWrapperStyle(
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile") {
    return {
      width: "100%",

      minWidth: 0,
    };
  }

  return {};
}

// ============================================================
// LOAN CARDS GRID
// ============================================================

export function createCollectionStudioLoanCardsGridStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile") {
    return {
      gridTemplateColumns: "minmax(0, 1fr)",

      gap: `${tokens.layout.cardGap}px`,
    };
  }

  if (viewport === "tablet") {
    return {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

      gap: `${tokens.layout.cardGap}px`,
    };
  }

  return {};
}

// ============================================================
// SELECTED LOAN METRICS
// ============================================================

export function createCollectionStudioSelectedLoanGridStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile") {
    return {
      gridTemplateColumns: "minmax(0, 1fr)",

      gap: `${tokens.layout.cardGap}px`,
    };
  }

  if (viewport === "tablet") {
    return {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

      gap: `${tokens.layout.cardGap}px`,
    };
  }

  return {};
}

// ============================================================
// COLLECTION WORKSPACE OUTER SHELL
//
// IMPORTANT:
//
// CollectionEntry owns:
// EMI | SYSTEM GENERATED | MANUAL
//
// This builder only controls the PAGE-level workspace shell.
// ============================================================

export function createCollectionStudioWorkspaceStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile" || viewport === "tablet") {
    return {
      gridTemplateColumns: "minmax(0, 1fr)",

      gap: `${tokens.layout.cardGap}px`,
    };
  }

  return {};
}

// ============================================================
// PAYMENT DETAILS SECTION
// ============================================================

export function createCollectionStudioPaymentDetailsSectionStyle(
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile" || viewport === "tablet") {
    return {
      gridColumn: "1",
    };
  }

  return {};
}

// ============================================================
// DOCUMENTS + HISTORY
// ============================================================

export function createCollectionStudioDocumentsHistoryRowStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile" || viewport === "tablet") {
    return {
      gap: `${tokens.layout.cardGap}px`,
    };
  }

  return {};
}

// ============================================================
// DOCUMENT THUMBNAIL GRID
// ============================================================

export function createCollectionStudioDocumentThumbnailGridStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile") {
    return {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

      gap: `${tokens.layout.cardGap}px`,
    };
  }

  if (viewport === "tablet") {
    return {
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

      gap: `${tokens.layout.cardGap}px`,
    };
  }

  return {};
}

// ============================================================
// COLLECTION SUMMARY GRID
// ============================================================

export function createCollectionStudioSummaryGridStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile") {
    return {
      gridTemplateColumns: "minmax(0, 1fr)",

      gap: `${tokens.layout.cardGap}px`,
    };
  }

  if (viewport === "tablet") {
    return {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

      gap: `${tokens.layout.cardGap}px`,
    };
  }

  return {};
}

// ============================================================
// LEGACY PAYMENT DETAILS GRID
// ============================================================

export function createCollectionStudioLegacyPaymentGridStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile") {
    return {
      gridTemplateColumns: "minmax(0, 1fr)",

      gap: `${tokens.form.rowGap}px`,
    };
  }

  if (viewport === "tablet") {
    return {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

      gap: `${tokens.form.rowGap}px`,
    };
  }

  return {};
}

// ============================================================
// COLLECTION ENTRY WORKSPACE
//
// LAPTOP / DESKTOP
// EMI | SYSTEM GENERATED | MANUAL
//
// TABLET / MOBILE
// EMI
// SYSTEM GENERATED
// MANUAL
// ============================================================

export function createCollectionEntryModeWorkspaceStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile" || viewport === "tablet") {
    return {
      gridTemplateColumns: "minmax(0, 1fr)",

      gridTemplateAreas: `
        "emi"
        "system"
        "manual"
      `,

      gap: `${tokens.layout.cardGap}px`,

      alignItems: "stretch",
    };
  }

  return {};
}

// ============================================================
// EMI CARD
// ============================================================

export function createCollectionEntryEmiCardStyle(
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile" || viewport === "tablet") {
    return {
      gridArea: "emi",

      width: "100%",

      minWidth: 0,
    };
  }

  return {};
}

// ============================================================
// SYSTEM GENERATED SLOT
// ============================================================

export function createCollectionEntryMiddleSlotStyle(
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile" || viewport === "tablet") {
    return {
      gridArea: "system",

      width: "100%",

      minWidth: 0,
    };
  }

  return {};
}

// ============================================================
// MANUAL CARD
// ============================================================

export function createCollectionEntryManualCardStyle(
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile" || viewport === "tablet") {
    return {
      gridArea: "manual",

      width: "100%",

      minWidth: 0,
    };
  }

  return {};
}

// ============================================================
// MANUAL INPUT GRID
// ============================================================

export function createCollectionEntryManualInputGridStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile") {
    return {
      gridTemplateColumns: "minmax(0, 1fr)",

      gap: `${tokens.form.rowGap}px`,
    };
  }

  if (viewport === "tablet") {
    return {
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

      gap: `${tokens.form.fieldGap}px`,
    };
  }

  return {};
}

// ============================================================
// MANUAL VALUE GRID
// ============================================================

export function createCollectionEntryValueGridStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile") {
    return {
      gridTemplateColumns: "minmax(0, 1fr)",

      gap: `${tokens.layout.cardGap}px`,
    };
  }

  return {};
}

// ============================================================
// PAYMENT DETAILS BODY
//
// LAPTOP / DESKTOP
// Existing 7-column premium row.
//
// TABLET
// 2-column controlled workflow.
//
// MOBILE
// Single-column workflow.
// ============================================================

export function createPaymentDetailsBodyStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile") {
    return {
      gridTemplateColumns: "minmax(0, 1fr)",

      gap: `${tokens.form.rowGap}px`,
    };
  }

  if (viewport === "tablet") {
    return {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

      gap: `${tokens.form.rowGap}px ${tokens.form.fieldGap}px`,
    };
  }

  return {};
}

// ============================================================
// PAYMENT FIELD
// ============================================================

export function createPaymentDetailsFieldStyle(
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile" || viewport === "tablet") {
    return {
      gridColumn: "span 1",

      width: "100%",

      minWidth: 0,
    };
  }

  return {};
}

// ============================================================
// REMARKS
// ============================================================

export function createPaymentDetailsRemarksStyle(
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile") {
    return {
      gridColumn: "1 / -1",

      width: "100%",
    };
  }

  if (viewport === "tablet") {
    return {
      gridColumn: "span 1",

      width: "100%",
    };
  }

  return {};
}

// ============================================================
// FINAL COLLECTION
// ============================================================

export function createPaymentDetailsTotalStyle(
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile") {
    return {
      gridColumn: "1 / -1",

      width: "100%",
    };
  }

  if (viewport === "tablet") {
    return {
      gridColumn: "span 1",

      width: "100%",
    };
  }

  return {};
}

// ============================================================
// PAYMENT ACTIONS
// ============================================================

export function createPaymentDetailsActionsStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile") {
    return {
      gridColumn: "1 / -1",

      width: "100%",

      height: "auto",

      minHeight: 0,

      gridTemplateColumns: "minmax(0, 1fr)",

      gap: `${tokens.spacing.inline}px`,
    };
  }

  if (viewport === "tablet") {
    return {
      gridColumn: "1 / -1",

      width: "100%",

      height: "auto",

      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

      gap: `${tokens.spacing.inline}px`,
    };
  }

  return {};
}

// ============================================================
// PAYMENT INPUT
// ============================================================

export function createPaymentDetailsInputStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile" || viewport === "tablet") {
    return {
      height: `${tokens.input.height}px`,

      minHeight: `${tokens.input.minHeight}px`,

      fontSize: `${tokens.input.fontSize}px`,
    };
  }

  return {};
}

// ============================================================
// PAYMENT TEXTAREA
// ============================================================

export function createPaymentDetailsTextareaStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile" || viewport === "tablet") {
    const height = Math.max(
      tokens.input.height,
      tokens.input.minHeight,
    );

    return {
      height: `${height}px`,

      minHeight: `${height}px`,

      maxHeight: `${height}px`,

      fontSize: `${tokens.input.fontSize}px`,
    };
  }

  return {};
}

// ============================================================
// PAYMENT BUTTON
// ============================================================

export function createPaymentDetailsButtonStyle(
  tokens: ResponsiveTokens,
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile" || viewport === "tablet") {
    return {
      minHeight: `${Math.max(
        tokens.control.minHeight,
        tokens.button.minHeight,
      )}px`,

      fontSize: `${tokens.button.fontSize}px`,
    };
  }

  return {};
}

// ============================================================
// SYSTEM GENERATED FINANCIAL GRID
//
// MOBILE
// Principal Due
// Interest - till today
// Interest Basis
// Late Fee / Penalty
//
// One financial card per row.
//
// TABLET / LAPTOP / DESKTOP
// Existing geometry remains unchanged.
// ============================================================

export function createCollectionSystemFinancialListStyle(
  viewport: ResponsiveViewport,
): CSSProperties {
  if (viewport === "mobile") {
    return {
      gridTemplateColumns: "minmax(0, 1fr)",
    };
  }

  return {};
}

// ============================================================
// END
// ============================================================