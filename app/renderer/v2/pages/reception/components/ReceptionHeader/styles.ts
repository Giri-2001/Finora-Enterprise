/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   RECEPTION HEADER™

   STYLES
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  ResponsiveTokens,
} from "../../../../utils/responsive/tokens";

/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createReceptionHeaderStyles(
  tokens: ResponsiveTokens,
) {

  /* =========================================================
     ROOT
  ========================================================= */

  const containerStyle: CSSProperties = {

    width: "100%",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: tokens.spacing.medium,

    padding: `${tokens.spacing.large}px ${tokens.layout.pageGutter}px`,

    boxSizing: "border-box",

  };


  /* =========================================================
     LOGO
  ========================================================= */

  const logoStyle: CSSProperties = {

    width: tokens.header.logoHeight,

    height: tokens.header.logoHeight,

    objectFit: "contain",

  };


  /* =========================================================
     TITLE
  ========================================================= */

  const titleStyle: CSSProperties = {

    margin: 0,

    fontSize: tokens.reception.titleSize,

    fontWeight: 800,

    color: "#F8FAFC",

    letterSpacing: "1px",

    textAlign: "center",

    lineHeight: tokens.lineHeight.title,

  };


  /* =========================================================
     SUBTITLE
  ========================================================= */

  const subtitleStyle: CSSProperties = {

    margin: 0,

    fontSize: tokens.typography.subheading,

    fontWeight: 600,

    color: "#E5E7EB",

    textAlign: "center",

    lineHeight: tokens.lineHeight.heading,

  };


  /* =========================================================
     DESCRIPTION
  ========================================================= */

  const descriptionStyle: CSSProperties = {

    maxWidth: tokens.layout.maxContentWidth,

    margin: 0,

    fontSize: tokens.typography.body,

    lineHeight: tokens.lineHeight.body,

    color: "#CBD5E1",

    textAlign: "center",

  };


  /* =========================================================
     VERSION
  ========================================================= */

  const versionStyle: CSSProperties = {

    marginTop: tokens.spacing.small,

    padding: `${tokens.spacing.small}px ${tokens.spacing.medium}px`,

    borderRadius: tokens.border.radius,

    background: "rgba(255,255,255,.08)",

    border: "1px solid rgba(212,175,55,.45)",

    fontSize: tokens.typography.caption,

    fontWeight: 700,

    color: "#D4AF37",

  };


  return {

    containerStyle,

    logoStyle,

    titleStyle,

    subtitleStyle,

    descriptionStyle,

    versionStyle,

  };  

}

/* ===========================================================
   END
=========================================================== */