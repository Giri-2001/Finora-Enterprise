/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ID CARD™

   PREMIUM PRESENTATION STYLES
   -----------------------------------------------------------
   RESPONSIVE:
   - Geometry comes only from ResponsiveTokens

   THEME:
   - Visual colours come only from FINORA Theme CSS variables
   - No local theme palette
   - No hard-coded gold / white / brown / green palette
   - Brand / border / surface / text values are inherited
     from the FINORA Theme Engine
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
   THEME CONTRACT
=========================================================== */

/*
 * CustomerIdCard does NOT own theme colours.
 *
 * ThemeProvider
 *      ↓
 * CustomerHanger
 *      ↓
 * FINORA Theme CSS variables
 *      ↓
 * CustomerIdCard styles
 *
 * IMPORTANT:
 *
 * The fallback values below are defensive CSS fallbacks only.
 * They are never intended to become a second theme definition.
 *
 * Responsive geometry remains exclusively inside
 * ResponsiveTokens.
 */


/* ===========================================================
   THEME VARIABLES
=========================================================== */

const THEME = {

  /* ---------------------------------------------------------
     SURFACES
  --------------------------------------------------------- */

  /*
   * Customer card surface is allowed to be a dedicated visual
   * surface supplied by CustomerHanger.
   *
   * Imperial Gold uses a full-opacity white card surface so the
   * card remains clearly separated from the softer page surface.
   * All other themes continue to resolve to their normal theme
   * surface through the fallback chain.
   */
  cardBackground:
    "var(--finora-theme-card-surface, var(--finora-theme-surface, var(--finora-theme-background-surface, #FFFFFF)))",

  cardBackgroundSoft:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #F1F3F6))",

  cardBackgroundStrong:
    "var(--finora-theme-surface-strong, #E7EAF0)",


  /* ---------------------------------------------------------
     BRAND
  --------------------------------------------------------- */

  brand:
    "var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #D4AF37))",

  brandPrimary:
    "var(--finora-theme-brand-primary, #B8860B)",

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
    "var(--finora-theme-text-secondary, var(--finora-theme-brand-primary, #4B5563))",

  textMuted:
    "var(--finora-theme-text-muted, var(--finora-theme-brand-secondary, #7A8494))",

  textInverse:
    "var(--finora-theme-text-inverse, #FFFFFF)",


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

  statusBackground:
    "var(--finora-theme-success-soft, var(--finora-theme-brand-accent-soft, #E7F6EF))",

  statusText:
    "var(--finora-theme-success, var(--finora-theme-brand-primary, #16845B))",

  statusBorder:
    "var(--finora-theme-success-border, var(--finora-theme-border-default, #D9DEE7))",


  /* ---------------------------------------------------------
     PHOTO
  --------------------------------------------------------- */

  photoBackground:
    "var(--finora-theme-surface-muted, var(--finora-theme-surface, #F1F3F6))",


  /* ---------------------------------------------------------
     EFFECTS
  --------------------------------------------------------- */

  overlay:
    "var(--finora-theme-overlay-shadow, rgba(15,23,42,.14))",

} as const;



/* ===========================================================
   CARD INNER LAYER
=========================================================== */

export function createCardInnerStyle(): CSSProperties {

  return {

    position:
      "relative",

    zIndex:
      2,

    display:
      "flex",

    flexDirection:
      "column",

    width:
      "100%",

    height:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   PHOTO IMAGE
=========================================================== */

export function createPhotoImageStyle(): CSSProperties {

  return {

    width:
      "100%",

    height:
      "100%",

    objectFit:
      "cover",

    objectPosition:
      "center",

    borderRadius:
      "50%",

    display:
      "block",

  };

}


/* ===========================================================
   FINORA LOGO IMAGE
=========================================================== */

export function createLogoImageStyle(): CSSProperties {

  return {

    width:
      "72%",

    height:
      "72%",

    objectFit:
      "contain",

    objectPosition:
      "center",

    display:
      "block",

  };

}


/* ===========================================================
   CARD STYLE BUILDER
=========================================================== */

export function createCardStyle(
  tokens: ResponsiveTokens,
): CSSProperties {

  return {

    /* -------------------------------------------------------
       RESPONSIVE GEOMETRY
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


    /* -------------------------------------------------------
       THEME-AWARE CARD SURFACE

       The active theme controls the card surface.

       No fixed cream / white / navy / purple / green
       presentation is owned by this component.
    ------------------------------------------------------- */

    background:
      `
      linear-gradient(
        135deg,
        color-mix(
          in srgb,
          ${THEME.cardBackground} 100%,
          transparent
        ),
        color-mix(
          in srgb,
          ${THEME.cardBackground} 100%,
          transparent
        )
      )
      `,


    padding:
      `0 0 ${tokens.customerCards.padding}px`,

/* -------------------------------------------------------
   RESPONSIVE CARD RADIUS
------------------------------------------------------- */

borderRadius:
  `${tokens.customerCards.radius}px`,

borderBottomLeftRadius:
  `${tokens.customerCards.radius}px`,

borderBottomRightRadius:
  `${tokens.customerCards.radius}px`,

overflow:
  "hidden",

isolation:
  "isolate",

clipPath:
  `inset(0 round ${tokens.customerCards.radius}px)`,

    /* -------------------------------------------------------
       THEME BORDER
    ------------------------------------------------------- */

    /*
     * CARD OUTER BORDER REMOVED.
     *
     * The FINORA card uses its theme surface + shadow for
     * separation. Inner Customer ID / KYC elements keep
     * their own theme-aware borders.
     */
    border:
      "none",


    /* -------------------------------------------------------
       THEME SHADOW
    ------------------------------------------------------- */

    /*
     * NO OUTER BORDER.
     *
     * The card must still remain clearly separated from the
     * page surface, especially on the White theme where the
     * card surface and page background are intentionally close.
     *
     * Visibility is therefore created by a soft theme-aware
     * elevation shadow, not by a visible border.
     */
    boxShadow:
      `
      0 22px 46px color-mix(
        in srgb,
        ${THEME.overlay} 82%,
        transparent
      ),
      0 7px 16px color-mix(
        in srgb,
        ${THEME.overlay} 62%,
        transparent
      ),
      0 3px 8px color-mix(
        in srgb,
        ${THEME.brand} 10%,
        transparent
      )
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

/*
 * Thin top strip of the Customer ID Card.
 *
 * IMPORTANT:
 *
 * This style is theme-aware.
 *
 * CustomerIdCard.tsx must NOT overwrite its background with
 * a hard-coded status colour after this style is applied.
 */

export function createStatusHeaderStyle(
  tokens: ResponsiveTokens,
): CSSProperties {

  const radius =
    `${tokens.customerCards.radius}px`;

  return {

    height:
      Math.max(
        tokens.border.width,
        tokens.border.width * 5,
      ),

    minHeight:
      Math.max(
        tokens.border.width,
        tokens.border.width * 5,
      ),

    width:
      "100%",

    flexShrink:
      0,

    boxSizing:
      "border-box",


    /* -------------------------------------------------------
       ACTIVE FINORA THEME ACCENT
    ------------------------------------------------------- */

    background:
      THEME.brand,


    /* -------------------------------------------------------
       TOP CORNERS ONLY

       Bottom corners remain square because this strip is
       physically attached to the card body.
    ------------------------------------------------------- */

    borderRadius:
      `${radius} ${radius} 0 0`,

  };

}



/* ===========================================================
   FINORA BRAND
=========================================================== */

export function createBrandStyle(
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
      tokens.spacing.medium - 4,

    fontSize:
      `${tokens.customerCards.brandSize}px`,

    fontWeight:
      800,

    letterSpacing:
      "1.2px",

    lineHeight:
      1.1,

    color:
      THEME.textPrimary,

    textTransform:
      "uppercase",

    flexShrink:
      0,

  };

}


/* ===========================================================
   COMPANY NAME BAND
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
      800,

    letterSpacing:
      "1.2px",

    lineHeight:
      1.1,
      
  background:
  `
  linear-gradient(
    180deg,
    color-mix(
      in srgb,
      ${THEME.brand} 18%,
      ${THEME.cardBackground}
    ) 0%,
    color-mix(
      in srgb,
      ${THEME.brandPrimary} 14%,
      ${THEME.cardBackgroundSoft}
    ) 100%
  )
  `,

    boxShadow:
      `
      inset 0 1px 3px
      color-mix(
        in srgb,
        ${THEME.textPrimary} 18%,
        transparent
      )
      `,

    color:
  THEME.textPrimary,

    padding:
      `${tokens.spacing.small}px ${tokens.spacing.inline}px`,

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
      500,

    color:
      THEME.textSecondary,

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


  const photoBorderWidth =
    Math.max(
      tokens.border.width,
      tokens.border.width +
      tokens.border.width * 3,
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
      THEME.photoBackground,

    border:
      `${photoBorderWidth}px solid ${THEME.cardBackground}`,

    boxShadow:
  `
  0 4px 10px ${THEME.overlay}
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
      600,

    lineHeight:
      tokens.lineHeight.compact,

    color:
      THEME.textPrimary,

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

/*
 * The Customer ID remains a genuine rounded identity pill.
 *
 * IMPORTANT:
 *
 * - Radius is intentionally maximum/pill geometry.
 * - Surface follows the active theme.
 * - Border follows the active theme.
 * - Text follows the active theme brand.
 *
 * This prevents the ID pill from becoming a square or
 * visually detached element at the lower card area.
 */

export function createCustomerIdStyle(
  tokens: ResponsiveTokens,
): CSSProperties {

  return {

    display:
      "block",

    width:
      "calc(100% - 32px)",

    maxWidth:
      "calc(100% - 32px)",

    boxSizing:
      "border-box",

    textAlign:
      "center",

    margin:
      `${tokens.spacing.medium}px auto 0`,

    padding:
      `${tokens.spacing.small}px ${tokens.button.paddingX}px`,

    borderRadius:
      "999px",


    /* -------------------------------------------------------
       THEME SURFACE
    ------------------------------------------------------- */

    background:
      `
      color-mix(
        in srgb,
        ${THEME.brand} 10%,
        ${THEME.cardBackground}
      )
      `,


    /* -------------------------------------------------------
       THEME BORDER
    ------------------------------------------------------- */

    border:
      `${tokens.border.width}px solid ${THEME.borderStrong}`,


    fontSize:
      `${tokens.customerCards.idSize + 1}px`,

    fontWeight:
      600,

    lineHeight:
      tokens.lineHeight.compact,


    /* -------------------------------------------------------
       THEME BRAND TEXT

       This intentionally avoids a fixed gold/brown value.
    ------------------------------------------------------- */

    color:
      THEME.textPrimary,

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
   PHONE
=========================================================== */

export function createPhoneStyle(
  tokens: ResponsiveTokens,
): CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    display:
      "block",

    textAlign:
      "center",

    fontSize:
      `${tokens.customerCards.phoneSize + 4}px`,

    fontWeight:
      600,

    lineHeight:
      tokens.lineHeight.compact,

    color:
      THEME.textPrimary,

    marginTop:
      tokens.spacing.small,

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
  verified: boolean = true,
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
  `10px auto 0`,

    padding:
      `${tokens.spacing.small}px ${tokens.button.paddingX}px`,

    borderRadius:
      "999px",


    /* -------------------------------------------------------
       THEME STATUS SURFACE
    ------------------------------------------------------- */

    background:
  "transparent",


    /* -------------------------------------------------------
       THEME STATUS BORDER
    ------------------------------------------------------- */

    border:
      `${tokens.border.width}px solid ${
        verified
          ? THEME.statusBorder
          : THEME.borderStrong
      }`,


    /* -------------------------------------------------------
       THEME STATUS TEXT
    ------------------------------------------------------- */

    color:
      verified
        ? THEME.statusText
        : THEME.textPrimary,

    fontSize:
      `${tokens.customerCards.kycSize + 2}px`,

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
   PHONE / BRANCH
=========================================================== */

/*
 * IMPORTANT:
 *
 * The customer mobile number must visually follow the active
 * FINORA theme.
 *
 * The previous implementation used a muted text variable
 * which was not consistently supplied by CustomerHanger.
 *
 * This version intentionally consumes a guaranteed FINORA
 * brand variable so the number visibly changes with every
 * selected theme.
 */

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
      `${tokens.customerCards.phoneSize + 4}px`,

    lineHeight:
      tokens.lineHeight.compact,


    /* -------------------------------------------------------
       THEME-AWARE MOBILE NUMBER
    ------------------------------------------------------- */

    color:
      THEME.brandPrimary,


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