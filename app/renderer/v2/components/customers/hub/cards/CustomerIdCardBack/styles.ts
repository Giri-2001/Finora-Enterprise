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
   COLORS
=========================================================== */

const COLORS = {

  card:
    "#FCFAF4",

  cardSoft:
    "#F7F1E4",

  text:
    "#273246",

  muted:
    "#6B7280",

  label:
    "#334155",

  gold:
    "#A87524",

  goldDark:
    "#76501B",

  goldLine:
    "rgba(168,117,36,.34)",

  shadow:
    "rgba(46,33,20,.18)",

} as const;


/* ===========================================================
   PREMIUM NUMBER FONT
   -----------------------------------------------------------
   Cinzel is intentionally limited to identity / numerical
   presentation so normal card labels remain clean.
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
      `
      linear-gradient(
        180deg,
        ${COLORS.card} 0%,
        ${COLORS.card} 72%,
        ${COLORS.cardSoft} 100%
      )
      `,

    border:
  `${tokens.border.width}px solid rgba(180,145,82,.34)`,

borderTop:
  "5px solid #16A34A",

    boxShadow:
  `
  0 14px 30px ${COLORS.shadow},
  inset 0 0 0 1px rgba(255,255,255,.55)
  `,

    color:
      COLORS.text,

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
      COLORS.text,

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
      `3px solid ${COLORS.goldLine}`,

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
      COLORS.gold,

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
      COLORS.label,

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
      COLORS.text,

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
      COLORS.goldLine,

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
      COLORS.text,

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
      `2px solid ${COLORS.goldLine}`,

    borderRadius:
      "7px",

    background:
      "rgba(255,255,255,.58)",

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
      ".25",

    color:
      COLORS.muted,

    whiteSpace:
      "nowrap",

    textAlign:
      "center",

  };

}


/* ===========================================================
   LOAN METRIC VALUE
   -----------------------------------------------------------
   Premium Cinzel numerical presentation.
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
      COLORS.text,

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
      "rgba(248,232,197,.52)",

    border:
      "2px solid rgba(180,145,82,.24)",

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
      COLORS.label,

    whiteSpace:
      "nowrap",

  };

}


/* ===========================================================
   OUTSTANDING VALUE
   -----------------------------------------------------------
   Premium Cinzel numerical presentation.
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
      COLORS.goldDark,

    whiteSpace:
      "nowrap",

    textAlign:
      "right",

  };

}


/* ===========================================================
   LAST PAYMENT
   -----------------------------------------------------------
   Premium compact payment presentation.
   Uses the existing Responsive Engine tokens.
=========================================================== */

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
      COLORS.gold,

    flexShrink:
      0,

  };

}

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
      "rgba(255,255,255,.58)",

    border:
      "3px solid rgba(180,145,82,.24)",

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
      COLORS.label,

    whiteSpace:
      "nowrap",

  };

}

/* ===========================================================
   LAST PAYMENT VALUE
   -----------------------------------------------------------
   Premium Cinzel numerical presentation.
=========================================================== */

export function createLastPaymentValueStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    minWidth:
      0,

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
      COLORS.goldDark,

    whiteSpace:
      "nowrap",

  };

}


/* ===========================================================
   END
=========================================================== */