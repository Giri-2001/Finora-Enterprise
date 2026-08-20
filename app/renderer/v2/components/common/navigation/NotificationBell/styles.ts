/* ===========================================================
   FINORA ENTERPRISE OS™

   NOTIFICATION BELL™

   RESPONSIVE + THEME-AWARE STYLES

   RESPONSIBILITY:
   - Render notification bell presentation
   - Consume central FINORA Theme Engine
   - Consume central FINORA Responsive Engine
   - Preserve notification visual hierarchy

   IMPORTANT:
   - No local theme definitions.
   - No custom theme contract.
   - No hardcoded theme colors.
   - No hardcoded responsive geometry.
   - Theme values come directly from FinoraTheme.
   - Responsive geometry comes only from ResponsiveTokens.
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
   STYLE CONTRACT
=========================================================== */

export interface NotificationBellStyles {

  containerStyle:
    CSSProperties;

  bellStyle:
    CSSProperties;

  badgeStyle:
    CSSProperties;

}


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createNotificationBellStyles(

  tokens:
    ResponsiveTokens,

  theme:
    FinoraTheme,

): NotificationBellStyles {


  /* =========================================================
     RESPONSIVE TOKENS
  ========================================================= */

  const button =
    tokens.button;

  const icon =
    tokens.icon;


  /* =========================================================
     CENTRAL THEME TOKENS
  ========================================================= */

  const headerText =
    theme.components.header.text;

  const headerBackground =
    theme.components.header.background;

  const headerBorder =
    theme.components.header.border;

  const danger =
    theme.colors.status.danger;

  const inverseText =
    theme.colors.text.inverse;

  const shadow =
    theme.colors.overlay.shadow;


  /* =========================================================
     CONTAINER
  ========================================================= */

  const containerStyle:
    CSSProperties = {

    position:
      "relative",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    width:
      `${button.height}px`,

    height:
      `${button.height}px`,

    minWidth:
      `${button.height}px`,

    minHeight:
      `${button.height}px`,

    padding:
      0,

    margin:
      0,

    border:
      "0",

    borderRadius:
      "50%",

    background:
      "transparent",

    color:
      headerText,

    cursor:
      "pointer",

    userSelect:
      "none",

    flexShrink:
      0,

    boxSizing:
      "border-box",

    transition:
      "background 160ms ease, color 160ms ease",

  };


  /* =========================================================
     BELL ICON
  ========================================================= */

  const bellStyle:
    CSSProperties = {

    width:
      `${icon.sm}px`,

    height:
      `${icon.sm}px`,

    color:
      headerText,

    flexShrink:
      0,

    filter:
      `drop-shadow(0 0 4px ${shadow})`,

    transition:
      "color 160ms ease, filter 160ms ease",

  };


  /* =========================================================
     UNREAD BADGE
  ========================================================= */

  const badgeStyle:
    CSSProperties = {

    position:
      "absolute",

    top:
      0,

    right:
      0,

    minWidth:
      `${icon.xs}px`,

    height:
      `${icon.xs}px`,

    padding:
      `0 ${tokens.spacing.small}px`,

    borderRadius:
      "999px",

    background:
      danger,

    color:
      inverseText,

    border:
      `${tokens.border.width}px solid ${
        headerBackground ||
        headerBorder
      }`,

    boxShadow:
      `0 0 8px ${shadow}`,

    fontSize:
      `${tokens.typography.caption}px`,

    fontWeight:
      700,

    lineHeight:
      1,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    boxSizing:
      "border-box",

    pointerEvents:
      "none",

    whiteSpace:
      "nowrap",

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    containerStyle,

    bellStyle,

    badgeStyle,

  };

}


/* ===========================================================
   END
=========================================================== */