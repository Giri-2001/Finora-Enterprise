/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER IDENTITY FORM™

   PRESENTATION STYLES

   Responsibility:
   - Step 1 identity form presentation
   - Theme-aware visual presentation
   - Responsive geometry consumed from Basic Form Engine
   - FINORA dark / light theme controls
   - Lucide icon presentation
   - No business logic
   - No form state

   IMPORTANT:
   - Theme colours come ONLY from FINORA Theme CSS variables.
   - Responsive geometry is resolved by IdentityForm.tsx from
     the Basic Form Responsive Engine.
   - No local theme palette exists here.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


/* ===========================================================
   THEME VARIABLES
=========================================================== */

/*
 * ThemeProvider
 *
 *      ↓
 *
 * FinoraTheme
 *
 *      ↓
 *
 * CSS variables on IdentityForm root
 *
 *      ↓
 *
 * Presentation styles
 *
 * This keeps the form connected to the same global theme
 * selected from the FINORA header.
 */

const THEME = {

  /* ---------------------------------------------------------
     SURFACES
  --------------------------------------------------------- */

  surface:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #151820))",

  surfaceMuted:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #1D212B))",

  surfaceStrong:
    "var(--finora-theme-surface-strong, var(--finora-theme-surface-muted, #20242D))",


  /* ---------------------------------------------------------
     BRAND
  --------------------------------------------------------- */

  brandPrimary:
    "var(--finora-theme-brand-primary, #D7B56A)",

  brandSecondary:
    "var(--finora-theme-brand-secondary, var(--finora-theme-brand-primary, #B8860B))",

  brandAccent:
    "var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #D7B56A))",

  brandAccentSoft:
    "var(--finora-theme-brand-accent-soft, var(--finora-theme-brand-primary, #D7B56A))",


  /* ---------------------------------------------------------
     TEXT
  --------------------------------------------------------- */

  textPrimary:
    "var(--finora-theme-text-primary, #F5F2EA)",

  textSecondary:
    "var(--finora-theme-text-secondary, #B9B5AC)",

  textMuted:
    "var(--finora-theme-text-muted, #77756F)",

  textInverse:
    "var(--finora-theme-text-inverse, #FFFFFF)",


  /* ---------------------------------------------------------
     BORDERS
  --------------------------------------------------------- */

  border:
    "var(--finora-theme-border-default, #30343E)",

  borderStrong:
    "var(--finora-theme-border-strong, #474C58)",

  borderSubtle:
    "var(--finora-theme-border-subtle, #252932)",


  /* ---------------------------------------------------------
     EFFECTS
  --------------------------------------------------------- */

  overlay:
    "var(--finora-theme-overlay-shadow, rgba(0,0,0,.48))",

} as const;


/* ===========================================================
   ROOT
=========================================================== */

export const wrapperStyle:
  CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  minHeight:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  boxSizing:
    "border-box",

  color:
    THEME.textPrimary,

  fontFamily:
    "var(--finora-theme-font-family, Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",

  WebkitFontSmoothing:
    "antialiased",

};


/* ===========================================================
   FIELD GRID
=========================================================== */

export const fieldGridStyle:
  CSSProperties = {

  width:
    "100%",

  display:
    "grid",

  gridTemplateColumns:
    "minmax(0, 1fr) minmax(0, 1fr)",

  boxSizing:
    "border-box",

};


/* ===========================================================
   FIELD
=========================================================== */

export const fieldStyle:
  CSSProperties = {

  minWidth:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  boxSizing:
    "border-box",

};


/* ===========================================================
   LABEL
=========================================================== */

export const labelStyle:
  CSSProperties = {

  display:
    "flex",

  alignItems:
    "center",

  minWidth:
    0,

  color:
    THEME.textPrimary,

  fontFamily:
    "var(--finora-theme-font-family, Inter, system-ui, sans-serif)",

  fontWeight:
    800,

  textTransform:
    "uppercase",

  lineHeight:
    1.35,

  letterSpacing:
    ".7px",

  textShadow:
    `0 1px 8px ${THEME.overlay}`,

};


/* ===========================================================
   REQUIRED MARK
=========================================================== */

export const requiredStyle:
  CSSProperties = {

  marginLeft:
    "4px",

  color:
    THEME.brandAccent,

  fontWeight:
    900,

  lineHeight:
    1,

};


/* ===========================================================
   INPUT
=========================================================== */

export const inputStyle:
  CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  boxSizing:
    "border-box",

  border:
    `1px solid ${THEME.borderStrong}`,

  outline:
    "none",

  borderRadius:
    "10px",

  background:
    `
      linear-gradient(
        180deg,
        color-mix(
          in srgb,
          ${THEME.surfaceMuted} 82%,
          transparent
        ),
        color-mix(
          in srgb,
          ${THEME.surface} 94%,
          transparent
        )
      )
    `,

  color:
    THEME.textPrimary,

  fontFamily:
    "var(--finora-theme-font-family, Inter, system-ui, sans-serif)",

  fontWeight:
    600,

  lineHeight:
    1.35,

  boxShadow:
    `
      inset 0 1px 0
      color-mix(
        in srgb,
        ${THEME.textInverse} 4%,
        transparent
      )
    `,

  transition:
    "border-color 180ms ease, box-shadow 180ms ease, background 180ms ease, color 180ms ease",

  appearance:
    "none",

  WebkitAppearance:
    "none",

};


/* ===========================================================
   DATE INPUT
=========================================================== */

export const dateInputStyle:
  CSSProperties = {

  ...inputStyle,

  appearance:
    "none",

  WebkitAppearance:
    "none",

};

/* ===========================================================
   END DATE INPUT
=========================================================== */


/* ===========================================================
   READONLY INPUT
=========================================================== */

export const readOnlyInputStyle:
  CSSProperties = {

  ...inputStyle,

  background:
    `
      linear-gradient(
        180deg,
        color-mix(
          in srgb,
          ${THEME.brandAccent} 9%,
          ${THEME.surfaceMuted}
        ),
        ${THEME.surface}
      )
    `,

  color:
    THEME.textPrimary,

  fontWeight:
    700,

  cursor:
    "default",

};


/* ===========================================================
   PLACEHOLDER
=========================================================== */

export const placeholderColor =
  "var(--finora-theme-text-muted, rgba(255,255,255,.58))";


/* ===========================================================
   FULL WIDTH FIELD
=========================================================== */

export const fullWidthFieldStyle:
  CSSProperties = {

  gridColumn:
    "1 / -1",

};


/* ===========================================================
   WHATSAPP ROW
=========================================================== */

export const checkboxRowStyle:
  CSSProperties = {

  gridColumn:
    "1 / -1",

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "8px",

  boxSizing:
    "border-box",

  color:
    THEME.textSecondary,

  fontWeight:
    600,

  lineHeight:
    1.35,

};


/* ===========================================================
   CHECKBOX
=========================================================== */

export const checkboxStyle:
  CSSProperties = {

  margin:
    0,

  accentColor:
    THEME.brandAccent,

  cursor:
    "pointer",

  flexShrink:
    0,

};


/* ===========================================================
   FIELD ICON
=========================================================== */

export const fieldIconStyle:
  CSSProperties = {

  display:
    "inline-flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  flexShrink:
    0,

  color:
    THEME.brandAccent,

  filter:
    `
      drop-shadow(
        0 0 5px
        color-mix(
          in srgb,
          ${THEME.brandAccent} 24%,
          transparent
        )
      )
    `,

};


/* ===========================================================
   INPUT WRAPPER
=========================================================== */

export const inputWrapperStyle:
  CSSProperties = {

  position:
    "relative",

  width:
    "100%",

  minWidth:
    0,

  boxSizing:
    "border-box",

};


/* ===========================================================
   INPUT WITH ICON
=========================================================== */

export const iconInputStyle:
  CSSProperties = {

  ...inputStyle,

};


/* ===========================================================
   READONLY WITH ICON
=========================================================== */

export const iconReadOnlyInputStyle:
  CSSProperties = {

  ...readOnlyInputStyle,

};


/* ===========================================================
   LOCK / FIELD ICON POSITION
=========================================================== */

export const lockIconStyle:
  CSSProperties = {

  position:
    "absolute",

  top:
    "50%",

  transform:
    "translateY(-50%)",

  color:
    THEME.brandAccent,

  pointerEvents:
    "none",

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  zIndex:
    2,

};


/* ===========================================================
   FIELD GROUP
=========================================================== */

export const fieldGroupStyle:
  CSSProperties = {

  minWidth:
    0,

  display:
    "flex",

  flexDirection:
    "column",

};


/* ===========================================================
   FORM FOOT NOTE
=========================================================== */

export const formNoteStyle:
  CSSProperties = {

  color:
    THEME.textMuted,

  lineHeight:
    1.5,

};


/* ===========================================================
   MOBILE / NARROW GRID
=========================================================== */

export const mobileFieldGridStyle:
  CSSProperties = {

  gridTemplateColumns:
    "minmax(0, 1fr)",

};


/* ===========================================================
   SELECT
=========================================================== */

export const selectStyle:
  CSSProperties = {

  ...inputStyle,

  cursor:
    "pointer",

};


/* ===========================================================
   FOCUS TOKEN
=========================================================== */

export const focusShadow =
  `
    0 0 0 2px
    color-mix(
      in srgb,
      ${THEME.brandAccent} 18%,
      transparent
    ),
    0 0 18px
    color-mix(
      in srgb,
      ${THEME.brandAccent} 16%,
      transparent
    )
  `;


/* ===========================================================
   INPUT THEME HELPERS
=========================================================== */

export const inputHoverStyle:
  CSSProperties = {

  borderColor:
    THEME.brandAccent,

};


export const disabledInputStyle:
  CSSProperties = {

  opacity:
    0.72,

  cursor:
    "not-allowed",

};


/* ===========================================================
   END
=========================================================== */