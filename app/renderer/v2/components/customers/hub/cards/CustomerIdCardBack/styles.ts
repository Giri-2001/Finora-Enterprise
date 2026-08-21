/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ID CARD BACK™

   PREMIUM PRESENTATION STYLES

   RESPONSIBILITY:
   - Customer ID back-card presentation only
   - Responsive dimensions come from Customer Responsive Engine
   - No breakpoint logic
   - No viewport detection
   - No independent responsive sizing decisions

   THEME CONTRACT:
   - Visual colours come only from FINORA Theme CSS variables
   - No local theme palette
   - Defensive CSS fallback chains are used
   - color-mix() always receives valid colour fallbacks

   FINAL CONTENT CONTRACT:
   - Customer ID
   - Village
   - Mandal
   - District
   - Since
   - Loan Summary
   - All Loans
   - Active
   - Closed
   - Outstanding

   IMPORTANT:
   - FAMILY is intentionally not rendered.
   - TOTAL LOANS is displayed as ALL LOANS.
   - No bottom marker is provided.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import type {
  ResponsiveTokens,
} from "../../../../../utils/responsive/customers/customers.tokens";


import "@fontsource/cinzel/600.css";
import "@fontsource/cinzel/700.css";


/* ===========================================================
   THEME VARIABLES
   -----------------------------------------------------------
   ThemeProvider
        ↓
   CustomerHanger
        ↓
   FINORA Theme CSS Variables
        ↓
   CustomerIdCardBack
=========================================================== */

const THEME = {

  /* ---------------------------------------------------------
     SURFACES
  --------------------------------------------------------- */

  card:
    "var(--finora-theme-card-surface, var(--finora-theme-surface, var(--finora-theme-background-surface, #FFFFFF)))",

  cardSoft:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #F1F3F6))",

  cardStrong:
    "var(--finora-theme-surface-strong, var(--finora-theme-surface-muted, #E7EAF0))",


  /* ---------------------------------------------------------
     BRAND
  --------------------------------------------------------- */

  brand:
    "var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #D4AF37))",

  brandPrimary:
    "var(--finora-theme-brand-primary, var(--finora-theme-brand-accent, #B8860B))",

  brandSecondary:
    "var(--finora-theme-brand-secondary, var(--finora-theme-brand-primary, #8C6A00))",

  brandSoft:
    "var(--finora-theme-brand-accent-soft, var(--finora-theme-brand-primary, #D4AF37))",


  /* ---------------------------------------------------------
     TEXT
  --------------------------------------------------------- */

  textPrimary:
    "var(--finora-theme-text-primary, var(--finora-theme-brand-primary, #171A21))",

  textSecondary:
    "var(--finora-theme-text-secondary, var(--finora-theme-text-primary, #4B5563))",

  textMuted:
    "var(--finora-theme-text-muted, var(--finora-theme-text-secondary, #7A8494))",


  /* ---------------------------------------------------------
     BORDERS
  --------------------------------------------------------- */

  border:
    "var(--finora-theme-border-default, #D9DEE7)",

  borderStrong:
    "var(--finora-theme-border-strong, var(--finora-theme-border-default, #B8C0CC))",

  borderSubtle:
    "var(--finora-theme-border-subtle, var(--finora-theme-border-default, #E8EBF0))",


  /* ---------------------------------------------------------
     STATUS
  --------------------------------------------------------- */

  success:
    "var(--finora-theme-success, #16A34A)",

  successSoft:
    "var(--finora-theme-success-soft, var(--finora-theme-brand-accent-soft, #E7F6EF))",

  successBorder:
    "var(--finora-theme-success-border, var(--finora-theme-border-strong, #B8C0CC))",


  /* ---------------------------------------------------------
     OVERLAY
  --------------------------------------------------------- */

  overlay:
    "var(--finora-theme-overlay-shadow, rgba(0,0,0,.18))",

} as const;


/* ===========================================================
   PREMIUM NUMBER FONT
=========================================================== */

const PREMIUM_NUMBER_FONT =
  '"Cinzel", serif';


/* ===========================================================
   CARD
=========================================================== */

export function createCardStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    width:
      "100%",

    height:
      "100%",

    minWidth:
      0,

    minHeight:
      `${tokens.customerCards.minHeight}px`,

    boxSizing:
      "border-box",

    display:
      "flex",

    flexDirection:
      "column",

    overflow:
      "hidden",

    borderRadius:
      `${tokens.customerCards.radius}px`,

    background:
  THEME.card,

    border:
      `${tokens.border.width}px solid color-mix(
        in srgb,
        ${THEME.border} 70%,
        transparent
      )`,

    borderTop:
      `5px solid ${THEME.brand}`,

    boxShadow:
      `
      0 14px 30px ${THEME.overlay},
      inset 0 0 0 1px color-mix(
        in srgb,
        ${THEME.card} 55%,
        transparent
      )
      `,

    color:
      THEME.textPrimary,

  };

}


/* ===========================================================
   CONTENT
=========================================================== */

export function createContentStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    display:
      "flex",

    flexDirection:
      "column",

    flex:
      "1 1 auto",

    height:
      "100%",

    minHeight:
      0,

    gap:
      "5px",

    justifyContent:
      "flex-start",

    padding:
      `
      ${Math.max(
        tokens.spacing.small,
        6,
      )}px

      ${Math.max(
        tokens.spacing.small,
        7,
      )}px

      ${Math.max(
        tokens.spacing.small,
        1,
      )}px
      `,

    overflow:
      "hidden",

  };

}


/* ===========================================================
   CUSTOMER ID
=========================================================== */

export function createCustomerIdStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    textAlign:
      "center",

    fontSize:
      `${Math.max(
        tokens.customerCards.idSize + 1,
        13,
      )}px`,

    fontFamily:
      PREMIUM_NUMBER_FONT,

    fontWeight:
      700,

    letterSpacing:
      ".8px",

    lineHeight:
      1.2,

    fontVariantNumeric:
      "tabular-nums",

    fontFeatureSettings:
      '"tnum" 1',

    color:
      THEME.textPrimary,

    whiteSpace:
      "nowrap",

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

  };

}


/* ===========================================================
   TOP DIVIDER
=========================================================== */

export function createTopDividerStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    position:
      "relative",

    width:
      "100%",

    height:
      "4px",

    flexShrink:
      0,

    marginTop:
      "3px",

    marginBottom:
      "3px",

    borderTop:
      `3px solid color-mix(
        in srgb,
        ${THEME.brand} 45%,
        transparent
      )`,

  };

}


/* ===========================================================
   FIELD LIST
=========================================================== */

export function createFieldListStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      "2px",

  };

}


/* ===========================================================
   FIELD ROW
=========================================================== */

export function createFieldRowStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    display:
      "grid",

    gridTemplateColumns:
      `
      ${Math.max(
        tokens.icon.xs,
        13,
      )}px

      56px

      8px

      minmax(
        0,
        1fr
      )
      `,

    columnGap:
      "5px",

    alignItems:
      "center",

    minHeight:
      "21px",

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   ICON
=========================================================== */

export function createIconStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    width:
      `${Math.max(
        tokens.icon.xs,
        13,
      )}px`,

    height:
      `${Math.max(
        tokens.icon.xs,
        13,
      )}px`,

    color:
      THEME.brand,

    flexShrink:
      0,

  };

}


/* ===========================================================
   FIELD LABEL
=========================================================== */

export function createLabelStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    minWidth:
      0,

    fontSize:
      `${Math.max(
        tokens.customerCards.idSize,
        11,
      )}px`,

    fontWeight:
      800,

    letterSpacing:
      ".35px",

    lineHeight:
      tokens.lineHeight.compact,

    color:
      THEME.textSecondary,

    whiteSpace:
      "nowrap",

  };

}


/* ===========================================================
   FIELD VALUE
=========================================================== */

export function createValueStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    minWidth:
      0,

    fontSize:
      `${Math.max(
        tokens.customerCards.phoneSize,
        13,
      )}px`,

    fontWeight:
      650,

    letterSpacing:
      ".25px",

    lineHeight:
      tokens.lineHeight.compact,

    color:
      THEME.textPrimary,

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace:
      "nowrap",

  };

}


/* ===========================================================
   SECTION DIVIDER
=========================================================== */

export function createSectionDividerStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    width:
      "100%",

    height:
      "2px",

    margin:
      "3px 0",

    background:
      `color-mix(
        in srgb,
        ${THEME.brand} 35%,
        transparent
      )`,

    flexShrink:
      0,

  };

}


/* ===========================================================
   LOAN SUMMARY TITLE
=========================================================== */

export function createSectionTitleStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "5px",

    width:
      "100%",

    fontSize:
      `${Math.max(
        tokens.customerCards.phoneSize,
        10,
      )}px`,

    fontWeight:
      800,

    letterSpacing:
      ".35px",

    lineHeight:
      tokens.lineHeight.compact,

    color:
      THEME.textPrimary,

    textTransform:
      "uppercase",

  };

}


/* ===========================================================
   LOAN SUMMARY GRID
=========================================================== */

export function createLoanSummaryStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    display:
      "grid",

    gridTemplateColumns:
      "repeat(3,minmax(0,1fr))",

    gap:
      "6px",

    marginTop:
      "3px",

  };

}


/* ===========================================================
   LOAN METRIC BOX
=========================================================== */

export function createLoanMetricStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    minWidth:
      0,

    boxSizing:
      "border-box",

    minHeight:
      "58px",

    padding:
      "6px 3px",

    textAlign:
      "center",

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "1px",

    border:
      `2px solid color-mix(
        in srgb,
        ${THEME.brand} 30%,
        ${THEME.borderSubtle}
      )`,

    borderRadius:
      "7px",

    background:
      `color-mix(
        in srgb,
        ${THEME.brand} 5%,
        ${THEME.card}
      )`,

  };

}


/* ===========================================================
   LOAN METRIC LABEL
=========================================================== */

export function createLoanMetricLabelStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    minWidth:
      0,

    fontSize:
      `${Math.max(
        tokens.customerCards.idSize - 1,
        12,
      )}px`,

    fontWeight:
      700,

    lineHeight:
      1.95,

    letterSpacing:
      ".25px",

    color:
      THEME.textMuted,

    whiteSpace:
      "nowrap",

    textAlign:
      "center",

  };

}


/* ===========================================================
   LOAN METRIC VALUE
=========================================================== */

export function createLoanMetricValueStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    fontFamily:
      PREMIUM_NUMBER_FONT,

    fontSize:
      `${Math.max(
        tokens.customerCards.idSize,
        14,
      )}px`,

    fontWeight:
      700,

    lineHeight:
      1.05,

    letterSpacing:
      ".2px",

    fontVariantNumeric:
      "tabular-nums",

    fontFeatureSettings:
      '"tnum" 1',

    color:
      THEME.textPrimary,

  };

}


/* ===========================================================
   OUTSTANDING
=========================================================== */

export function createOutstandingStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    display:
      "grid",

    gridTemplateColumns:
      `
      ${Math.max(
        tokens.icon.xs,
        18,
      )}px

      minmax(
        0,
        1fr
      )

      auto
      `,

    alignItems:
      "center",

    columnGap:
      "5px",

    marginTop:
      "4px",

    padding:
      "8px 6px",

    borderRadius:
      "7px",

    background:
  "var(--finora-theme-card-surface, var(--finora-theme-surface, #FFFFFF))",

    border:
      `2px solid color-mix(
        in srgb,
        ${THEME.brand} 22%,
        ${THEME.borderSubtle}
      )`,

  };

}


/* ===========================================================
   OUTSTANDING LABEL
=========================================================== */

export function createOutstandingLabelStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    minWidth:
      0,

    fontSize:
      `${Math.max(
        tokens.customerCards.idSize,
        11,
      )}px`,

    fontWeight:
      800,

    lineHeight:
      1.05,

    color:
      THEME.textSecondary,

    whiteSpace:
      "nowrap",

  };

}


/* ===========================================================
   OUTSTANDING VALUE
=========================================================== */

export function createOutstandingValueStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    minWidth:
      0,

    paddingLeft:
      "6px",

    fontFamily:
      PREMIUM_NUMBER_FONT,

    fontSize:
      `${Math.max(
        tokens.customerCards.idSize + 1,
        12,
      )}px`,

    fontWeight:
      700,

    lineHeight:
      1.05,

    letterSpacing:
      ".25px",

    fontVariantNumeric:
      "tabular-nums",

    fontFeatureSettings:
      '"tnum" 1',

    color:
      THEME.textPrimary,

    whiteSpace:
      "nowrap",

    textAlign:
      "right",

  };

}


/* ===========================================================
   LAST PAYMENT ICON
=========================================================== */

export function createLastPaymentIconStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    width:
      `${Math.max(
        tokens.icon.xs - 2,
        16,
      )}px`,

    height:
      `${Math.max(
        tokens.icon.xs - 2,
        16,
      )}px`,

    color:
      THEME.brand,

    flexShrink:
      0,

  };

}


/* ===========================================================
   LAST PAYMENT
=========================================================== */

export function createLastPaymentStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    display:
      "grid",

    gridTemplateColumns:
      `
      ${Math.max(
        tokens.icon.xs,
        18,
      )}px

      minmax(
        0,
        1fr
      )

      auto
      `,

    alignItems:
      "center",

    columnGap:
      "6px",

    marginTop:
      "4px",

    padding:
      "6px 6px",

    borderRadius:
      "7px",

    background:
      `color-mix(
        in srgb,
        ${THEME.brand} 5%,
        ${THEME.card}
      )`,

    border:
  `2px solid color-mix(
    in srgb,
    ${THEME.brand} 22%,
    ${THEME.borderSubtle}
  )`,

  };

}


/* ===========================================================
   LAST PAYMENT LABEL
=========================================================== */

export function createLastPaymentLabelStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    minWidth:
      0,

    fontSize:
      `${Math.max(
        tokens.customerCards.idSize,
        10,
      )}px`,

    fontWeight:
      800,

    lineHeight:
      1.25,

    letterSpacing:
      ".3px",

    color:
      THEME.textSecondary,

    whiteSpace:
      "nowrap",

  };

}


/* ===========================================================
   LAST PAYMENT VALUE
=========================================================== */

export function createLastPaymentValueStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    minWidth:
      0,

    fontFamily:
      PREMIUM_NUMBER_FONT,

    fontSize:
      `${Math.max(
        tokens.customerCards.idSize - 1,
        13,
      )}px`,

    fontWeight:
      600,

    lineHeight:
      1.05,

    letterSpacing:
      ".2px",

    color:
      THEME.textPrimary,

    whiteSpace:
      "nowrap",

  };

}


/* ===========================================================
   END
=========================================================== */