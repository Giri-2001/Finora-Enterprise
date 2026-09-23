/* ===========================================================
   FINORA ENTERPRISE OS™

   RECEPTION™

   RECEPTION HALL™

   STYLES

   IMPORTANT
   -----------------------------------------------------------
   - Responsive geometry comes ONLY from Responsive Engine.
   - Theme colors come ONLY from FINORA Theme Engine.
   - No local theme definitions.
   - No hard-coded theme colors.
   - Reception surfaces intentionally use multiple semantic
     theme layers so every theme has visible depth.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  ResponsiveTokens,
} from "../../../../utils/responsive";

import type {
  FinoraTheme,
} from "../../../../themes/core/types";


/* ===========================================================
   TYPES
=========================================================== */

export interface ReceptionHallStyles {

  containerStyle:
    CSSProperties;

  wallStyle:
    CSSProperties;


  wallBrandRowStyle:
    CSSProperties;


  wallBrandContentStyle:
    CSSProperties;

  doorGridStyle:
    CSSProperties;

  wallLogoStyle:
    CSSProperties;

  wallTitleStyle:
    CSSProperties;

  wallDividerStyle:
    CSSProperties;


  wallGreetingStyle:
    CSSProperties;

  wallSubtitleStyle:
    CSSProperties;

}


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createReceptionHallStyles(

  tokens:
    ResponsiveTokens,

  theme:
    FinoraTheme,

): ReceptionHallStyles {


  /* =========================================================
     ROOT RECEPTION SURFACE

     The page itself must visibly belong to the selected theme.

     We deliberately use:
       background.page

     instead of transparent.

     This gives:
       - Imperial Gold → soft professional light page
       - Royal Navy   → navy/dark page when supplied
       - Amethyst     → purple-tinted page
       - Emerald      → green-tinted page
       - Obsidian     → deep black page

     No local theme mapping exists here.
  ========================================================= */

  const containerStyle:
    CSSProperties = {

    width:
      "100%",

    flex:
      "1 1 auto",

    minHeight:
      0,

    display:
      "flex",

    flexDirection:
      "column",

    justifyContent:
      "flex-start",

    alignItems:
      "center",

    padding:
      `${tokens.spacing.small}px ${tokens.spacing.large}px`,

    boxSizing:
      "border-box",

    background:
      theme.colors.background.page,

    position:
      "relative",

    overflow:
      "visible",

    borderBottom:
      "none",

    boxShadow:
      "none",

    transition:
      "background-color 180ms ease",

  };


  /* =========================================================
     FEATURE WALL

     The wall intentionally uses a DIFFERENT visual layer from
     the page.

     Page:
       background.page

     Wall:
       surfaceElevated
       surface
       surfaceMuted

     This creates the required visual depth, especially for
     Imperial Gold / Amethyst / Emerald light themes.
  ========================================================= */

  const wallStyle:
    CSSProperties = {

    width:
      "100%",

    maxWidth:
      `${tokens.layout.maxContentWidth}px`,

    minWidth:
      0,

    boxSizing:
      "border-box",

    borderRadius:
      `${tokens.panel.radius}px`,

    padding:
      `${tokens.reception.wallPadding}px ${tokens.spacing.medium}px ${tokens.spacing.large}px`,

    background:
      `
        linear-gradient(
          180deg,
          ${theme.colors.background.surfaceElevated} 0%,
          ${theme.colors.background.surface} 52%,
          ${theme.colors.background.surfaceMuted} 100%
        )
      `,

    border:
      `${tokens.border.width}px solid ${theme.colors.border.default}`,

    borderBottom:
      `${tokens.border.strongWidth}px solid ${theme.colors.border.strong}`,

    boxShadow:
      `
        0 40px 90px ${theme.colors.overlay.shadow},
        0 10px 30px ${theme.colors.overlay.shadow}
      `,

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

    transition:
      "background 180ms ease, border-color 180ms ease, box-shadow 180ms ease",

  };


  /* =========================================================
     DEPARTMENT DOOR GRID

     RESPONSIVE CONTRACT
     ---------------------------------------------------------
     - Mobile / one-column layout must use the full available
       reception width.
     - Door width comes from Responsive Engine.
     - Never append "px" to a token that may be "100%".
     - Grid tracks must not shrink to content width.
  ========================================================= */

  const doorGridStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    display:
      "grid",

    gridTemplateColumns:
      tokens.meta.viewport === "mobile"
        ? "minmax(0, 1fr)"
        : `repeat(
            auto-fit,
            minmax(
              ${typeof tokens.door.width === "number"
                ? `${tokens.door.width}px`
                : tokens.door.width},
              1fr
            )
          )`,

    justifyItems:
      "stretch",

    justifyContent:
      "stretch",

    alignItems:
      "start",

    columnGap:
      `${tokens.door.gap}px`,

    rowGap:
      `${tokens.spacing.large}px`,

    marginTop:
      `${tokens.spacing.large}px`,

  };
  /* =========================================================
     WALL BRAND ROW

     Logo + title are horizontally centered as one unit.

     Height intentionally equals the OLD vertical footprint:
       old logo + old logo bottom gap + old title line height.

     This prevents Reception wall/card height from changing.
  ========================================================= */

  const wallBrandRowStyle:
    CSSProperties = {

    width:
      "fit-content",

    maxWidth:
      "100%",

    height:
      `${
        tokens.reception.wallLogoSize +
        tokens.reception.wallGap +
        Math.round(
          tokens.reception.titleSize *
          tokens.lineHeight.title,
        ) +
        tokens.spacing.small +
        tokens.border.strongWidth +
        tokens.spacing.small +
        Math.round(
          (tokens.typography.caption + 1) *
          tokens.lineHeight.body,
        )
      }px`,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "8px",

    margin:
      0,

    boxSizing:
      "border-box",

  };
  /* =========================================================
     WALL BRAND CONTENT

     Title + divider + subtitle stay together as one
     vertical block to the right of the FINORA logo.
  ========================================================= */

  const wallBrandContentStyle:
    CSSProperties = {

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

    justifyContent:
      "center",

    minWidth:
      0,

    width:
      "max-content",

    maxWidth:
      "100%",

  };





  /* =========================================================
     WALL LOGO
  ========================================================= */

  const wallLogoStyle:
    CSSProperties = {

    width:
      "auto",

    height:
      `${Math.min(
        Math.round(tokens.reception.wallLogoSize * 2.25),
        tokens.reception.wallLogoSize +
          tokens.reception.wallGap +
          Math.round(
            tokens.reception.titleSize *
            tokens.lineHeight.title,
          ),
      )}px`,

    marginBottom:
      0,

    objectFit:
      "contain",

  };


  /* =========================================================
     WALL TITLE
  ========================================================= */

  const wallTitleStyle:
    CSSProperties = {

    color:
      theme.colors.text.primary,

    fontSize:
      `${tokens.reception.titleSize - 2}px`,

    margin:
      0,

    fontWeight:
      800,

    letterSpacing:
      "1px",

    lineHeight:
      tokens.lineHeight.title,

    textAlign:
      "center",

    transition:
      "color 180ms ease",

  };


  /* =========================================================
     WALL DIVIDER
  ========================================================= */

  const wallDividerStyle:
    CSSProperties = {

    width:
      "100%",

    maxWidth:
      "100%",

    height:
      `${tokens.border.strongWidth}px`,

    background:
      `
        linear-gradient(
          90deg,
          transparent,
          ${theme.colors.brand.primary},
          transparent
        )
      `,

    marginTop:
      `${tokens.spacing.small}px`,

    transition:
      "background 180ms ease",

  };
  /* =========================================================
     WALL GREETING
  ========================================================= */

  const wallGreetingStyle:
    CSSProperties = {

    color:
      theme.colors.text.primary,

    margin:
      "3px 0 0 0",

    fontFamily:
      "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize:
      `${tokens.typography.caption + 4}px`,

    fontWeight:
      600,

    lineHeight:
      tokens.lineHeight.body,

    textAlign:
      "center",

  };




  /* =========================================================
     WALL SUBTITLE
  ========================================================= */

  const wallSubtitleStyle:
    CSSProperties = {

    color:
      theme.colors.text.secondary,

    margin:
      0,

    marginTop:
      `${Math.max(tokens.spacing.small - 3, 0)}px`,

    fontSize:
      `${tokens.typography.caption + 3}px`,

    fontWeight:
      500,

    lineHeight:
      tokens.lineHeight.body,

    textAlign:
      "center",

    transition:
      "color 180ms ease",

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    containerStyle,

    wallStyle,

    wallBrandRowStyle,

    wallBrandContentStyle,

    doorGridStyle,

    wallLogoStyle,

    wallTitleStyle,

    wallDividerStyle,

    wallGreetingStyle,

    wallSubtitleStyle,

  };

}


/* ===========================================================
   END
=========================================================== */