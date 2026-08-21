/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER SEARCH BAR™

   PREMIUM THEME-AWARE PRESENTATION

   RESPONSIBILITY:
   - Premium search presentation
   - Search icon geometry
   - Input presentation
   - Focus-friendly visual structure

   IMPORTANT:
   - Search behavior does not belong here.
   - Search filtering does not belong here.
   - Responsive breakpoint decisions do not belong here.
   - Responsive geometry is intentionally unchanged.
   - Visual colours come only from FINORA Theme CSS variables.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


/* ===========================================================
   THEME CONTRACT

   CustomerSearchBar.tsx
          ↓
   Active FINORA Theme Engine
          ↓
   CSS Variables
          ↓
   Search Presentation

   No independent theme palette is maintained here.
=========================================================== */

const THEME = {

  surface:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #FFFFFF))",

  surfaceMuted:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #F1F3F6))",

  brand:
    "var(--finora-theme-brand-accent, #D4AF37)",

  textPrimary:
    "var(--finora-theme-text-primary, #171A21)",

  textMuted:
    "var(--finora-theme-text-muted, #7A8494)",

  border:
    "var(--finora-theme-border-default, #D9DEE7)",

  borderStrong:
    "var(--finora-theme-border-strong, #B8C0CC)",

  overlay:
    "var(--finora-theme-overlay-shadow, rgba(15,23,42,.12))",

} as const;


/* ===========================================================
   ROOT

   Responsive geometry remains exactly as before.

   Only visual colour sources are theme-aware.
=========================================================== */

export const containerStyle:
  CSSProperties = {

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "9px",

  width:
    "100%",

  maxWidth:
    "340px",

  minWidth:
    0,

  height:
    "38px",

  padding:
    "0 13px",

  /* ---------------------------------------------------------
     THEME-AWARE SURFACE

     Active theme controls both the primary surface and
     subtle surface blend.
  --------------------------------------------------------- */

  background:
    `
    linear-gradient(
      180deg,
      color-mix(
        in srgb,
        ${THEME.surface} 94%,
        ${THEME.brand} 6%
      ),
      ${THEME.surfaceMuted}
    )
    `,

  /* ---------------------------------------------------------
     THEME-AWARE BORDER
  --------------------------------------------------------- */

  border:
    `1px solid ${THEME.borderStrong}`,

  borderRadius:
    "999px",

  /* ---------------------------------------------------------
     THEME-AWARE SHADOW
  --------------------------------------------------------- */

  boxShadow:
    `
    0 5px 16px ${THEME.overlay},
    inset 0 1px 0
    color-mix(
      in srgb,
      ${THEME.surface} 80%,
      transparent
    )
    `,

  boxSizing:
    "border-box",

  transition:
    "border-color .2s ease, box-shadow .2s ease",

};


/* ===========================================================
   ICON

   Search icon follows the active theme accent.

   Examples:
   - Imperial Gold → gold accent
   - Royal Navy   → blue accent
   - Amethyst     → purple accent
   - Emerald      → green accent
   - Obsidian     → active obsidian accent
=========================================================== */

export const iconStyle:
  CSSProperties = {

  width:
    "17px",

  height:
    "17px",

  minWidth:
    "17px",

  color:
    THEME.brand,

  flexShrink:
    0,

  userSelect:
    "none",

  pointerEvents:
    "none",

};


/* ===========================================================
   INPUT

   Input text follows the active FINORA text colour.

   Placeholder inherits browser placeholder rendering,
   while the surrounding surface, border and icon are
   completely theme-connected.
=========================================================== */

export const inputStyle:
  CSSProperties = {

  flex:
    1,

  minWidth:
    0,

  width:
    "100%",

  border:
    "none",

  outline:
    "none",

  background:
    "transparent",

  fontFamily:
    "inherit",

  fontSize:
    "14px",

  fontWeight:
    500,

  color:
    THEME.textPrimary,

  boxSizing:
    "border-box",

  lineHeight:
    1.2,

  padding:
    0,

};


/* ===========================================================
   END
=========================================================== */