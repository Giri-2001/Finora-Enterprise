/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ID CARD™

   PREMIUM PRESENTATION STYLES
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


import {
  DEFAULT_CUSTOMER_TOKENS,
} from "../../../../../utils/responsive/customers/customers.tokens";


/* ===========================================================
   COLORS
=========================================================== */

const COLORS = {

  cardTop:
    "#FFFDF9",

  cardMiddle:
    "#FEFBF5",

  cardBottom:
    "#FCF5E8",

  gold:
    "#8A612B",

  goldDark:
    "#5A3B16",

  text:
    "#1E293B",

  muted:
    "#7C7C7C",

  statusText:
    "#166534",

} as const;


/* ===========================================================
   CARD STYLE BUILDER
=========================================================== */

export function createCardStyle(
  tokens: ResponsiveTokens,
): CSSProperties {

  return {

        /* -------------------------------------------------------
       CUSTOMER RESPONSIVE ENGINE GEOMETRY
    ------------------------------------------------------- */

    width:
      typeof tokens.customerCards.width === "number"
        ? `${tokens.customerCards.width}px`
        : tokens.customerCards.width,

    minWidth:
      typeof tokens.customerCards.width === "number"
        ? `${tokens.customerCards.width}px`
        : tokens.customerCards.width,

    maxWidth:
      typeof tokens.customerCards.width === "number"
        ? `${tokens.customerCards.width}px`
        : tokens.customerCards.width,

    height:
  `${tokens.customerCards.height}px`,

minHeight:
  `${tokens.customerCards.height}px`,

maxHeight:
  `${tokens.customerCards.height}px`,

    boxSizing:
      "border-box",

    background:
      `
      linear-gradient(
        135deg,
        rgba(255,255,255,.65),
        transparent 35%
      ),
      linear-gradient(
        180deg,
        ${COLORS.cardTop} 0%,
        ${COLORS.cardMiddle} 60%,
        ${COLORS.cardBottom} 100%
      )
      `,

    padding:
      `0 0 ${tokens.customerCards.padding}px`,

    borderRadius:
      `${tokens.customerCards.radius}px`,

    overflow:
      "hidden",

    border:
      `${tokens.border.width}px solid rgba(180,145,82,.35)`,

    boxShadow:
      `
      0 25px 55px rgba(0,0,0,.30),
      0 8px 20px rgba(180,145,82,.25)
      `,

    position:
      "relative",

    display:
      "flex",

    flexDirection:
      "column",

    flexShrink:
      0,

  };

}


/* ===========================================================
   STATUS HEADER
=========================================================== */

export function createStatusHeaderStyle(
  tokens: ResponsiveTokens,
): CSSProperties {

  return {

    height:
      Math.max(
        tokens.border.width,
        tokens.border.width * 5,
      ),

    flexShrink:
      0,

    width:
      "100%",

  };

}


/* ===========================================================
   COMPANY BRAND
=========================================================== */

export function createCompanyStyle(
  tokens: ResponsiveTokens,
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

    whiteSpace:
      "nowrap",

    overflow:
      "visible",

    textOverflow:
      "clip",

    marginTop:
      tokens.spacing.small,

    fontSize:
      `${tokens.customerCards.brandSize}px`,

    fontWeight:
      700,

    letterSpacing:
      "1.2px",

    lineHeight:
      1.1,

    color:
      COLORS.gold,

    textTransform:
      "uppercase",

    flexShrink:
      0,

  };

}


/* ===========================================================
   CARD TITLE
=========================================================== */

export function createTitleStyle(
  tokens: ResponsiveTokens,
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
      `${tokens.customerCards.nameSize}px`,

    fontWeight:
      600,

    color:
      COLORS.muted,

    letterSpacing:
      "2px",

    marginTop:
      tokens.spacing.small,

    lineHeight:
      tokens.lineHeight.compact,

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace:
      "nowrap",

    flexShrink:
      0,

  };

}


/* ===========================================================
   PHOTO
=========================================================== */

export function createPhotoStyle(
  tokens: ResponsiveTokens,
): CSSProperties {

  const photoSize =
    Math.max(
      0,
      tokens.customerCards.photoSize,
    );


  return {

    width:
      `${photoSize}px`,

    height:
      `${photoSize}px`,

    minWidth:
      `${photoSize}px`,

    minHeight:
      `${photoSize}px`,

    margin:
      `${tokens.spacing.medium}px auto ${tokens.spacing.small}px`,

    borderRadius:
      "50%",

    background:
      `
      linear-gradient(
        180deg,
        #FFFFFF,
        #E8EEF7
      )
      `,

    border:
      `${Math.max(
        tokens.border.width,
        tokens.border.width +
        tokens.border.width * 3,
      )}px solid rgba(255,255,255,.9)`,

    boxShadow:
      `
      0 12px 35px rgba(0,0,0,.25),
      inset 0 0 10px rgba(255,255,255,.8)
      `,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    overflow:
      "hidden",

    flexShrink:
      0,

  };

}


/* ===========================================================
   NAME
=========================================================== */

export function createNameStyle(
  tokens: ResponsiveTokens,
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
      `${tokens.customerCards.nameSize}px`,

    fontWeight:
      700,

    lineHeight:
      tokens.lineHeight.compact,

    color:
      COLORS.text,

    marginTop:
      tokens.spacing.small,

    padding:
      `0 ${tokens.spacing.small}px`,

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace:
      "nowrap",

    flexShrink:
      0,

  };

}


/* ===========================================================
   CUSTOMER ID
=========================================================== */

export function createCustomerIdStyle(
  tokens: ResponsiveTokens,
): CSSProperties {

  return {

    display:
      "block",

    width:
      "fit-content",

    maxWidth:
      "100%",

    boxSizing:
      "border-box",

    textAlign:
      "center",

    margin:
      `${tokens.spacing.medium}px auto 0`,

    padding:
      `${tokens.spacing.small}px
       ${tokens.button.paddingX}px`,

    borderRadius:
      "999px",

    background:
      "linear-gradient(180deg,#F8E8C5,#EACB8B)",

    border:
      `${tokens.border.width}px solid rgba(180,145,82,.45)`,

    fontSize:
      `${tokens.customerCards.idSize}px`,

    fontWeight:
      700,

    lineHeight:
      tokens.lineHeight.compact,

    color:
      COLORS.goldDark,

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace:
      "nowrap",

    flexShrink:
      0,

  };

}


/* ===========================================================
   KYC
=========================================================== */

export function createKycStyle(
  tokens: ResponsiveTokens,
): CSSProperties {

  return {

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    width:
      "fit-content",

    maxWidth:
      "100%",

    boxSizing:
      "border-box",

    margin:
      `${tokens.spacing.small}px auto 0`,

    padding:
      `${tokens.spacing.small}px
       ${tokens.button.paddingX}px`,

    borderRadius:
      "999px",

    background:
      "#ECFDF3",

    color:
      COLORS.statusText,

    fontSize:
      `${tokens.customerCards.kycSize}px`,

    fontWeight:
      700,

    lineHeight:
      tokens.lineHeight.compact,

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace:
      "nowrap",

    flexShrink:
      0,

  };

}

/* ===========================================================
   BRANCH
=========================================================== */

export function createBranchStyle(
  tokens: ResponsiveTokens,
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

    marginTop:
      tokens.spacing.small,

    fontSize:
      `${tokens.customerCards.phoneSize}px`,

    lineHeight:
      tokens.lineHeight.compact,

    color:
      "#6B7280",

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace:
      "nowrap",

    flexShrink:
      0,

  };

}


/* ===========================================================
   QR
=========================================================== */

export function createQrStyle(): CSSProperties {

  return {

    display:
      "none",

  };

}


/* ===========================================================
   DEFAULT STYLE CONTRACTS
=========================================================== */

export const cardStyle:
  CSSProperties =
    createCardStyle(
      DEFAULT_CUSTOMER_TOKENS,
    );


export const statusHeaderStyle:
  CSSProperties =
    createStatusHeaderStyle(
      DEFAULT_CUSTOMER_TOKENS,
    );


export const companyStyle:
  CSSProperties =
    createCompanyStyle(
      DEFAULT_CUSTOMER_TOKENS,
    );


export const titleStyle:
  CSSProperties =
    createTitleStyle(
      DEFAULT_CUSTOMER_TOKENS,
    );


export const photoStyle:
  CSSProperties =
    createPhotoStyle(
      DEFAULT_CUSTOMER_TOKENS,
    );


export const nameStyle:
  CSSProperties =
    createNameStyle(
      DEFAULT_CUSTOMER_TOKENS,
    );


export const customerIdStyle:
  CSSProperties =
    createCustomerIdStyle(
      DEFAULT_CUSTOMER_TOKENS,
    );


export const kycStyle:
  CSSProperties =
    createKycStyle(
      DEFAULT_CUSTOMER_TOKENS,
    );


export const branchStyle:
  CSSProperties =
    createBranchStyle(
      DEFAULT_CUSTOMER_TOKENS,
    );


export const qrStyle:
  CSSProperties =
    createQrStyle();


/* ===========================================================
   END
=========================================================== */