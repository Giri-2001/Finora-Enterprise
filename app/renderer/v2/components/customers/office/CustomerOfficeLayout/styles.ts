/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER OFFICE LAYOUT™

   STYLES

   RESPONSIBILITY:
   - Provide Customer Office layout styles
   - Consume Responsive Engine tokens
   - Keep responsive dimensions centralized
   - No responsive sizing decisions inside static styles
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


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createCustomerOfficeLayoutStyles(
  tokens: ResponsiveTokens,
) {

  /* =========================================================
     ROOT
  ========================================================= */

  const containerStyle: CSSProperties = {

    display: "flex",

    flexDirection: "column",

    width: "100%",

    height: "100%",

    minHeight: 0,

    overflow: "hidden",

    gap: tokens.spacing.inline,

  };


  /* =========================================================
     HEADER
  ========================================================= */

  const headerStyle: CSSProperties = {

    flex: "0 0 auto",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: tokens.spacing.small,

  };


  /* =========================================================
     TITLE
  ========================================================= */

  const titleStyle: CSSProperties = {

    margin: 0,

    fontSize: tokens.typography.title,

    fontWeight: 800,

    color: "#2B1B12",

    letterSpacing: "1px",

    lineHeight: tokens.lineHeight.title,

  };


  /* =========================================================
     SUBTITLE
  ========================================================= */

  const subtitleStyle: CSSProperties = {

    margin: 0,

    fontSize: tokens.typography.label,

    color: "#64748B",

    lineHeight: tokens.lineHeight.body,

  };


  /* =========================================================
     BODY
  ========================================================= */

  const bodyStyle: CSSProperties = {

    flex: 1,

    display: "flex",

    flexDirection: "column",

    width: "100%",

    minHeight: 0,

    overflow: "hidden",

    gap: tokens.spacing.inline,

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    containerStyle,

    headerStyle,

    titleStyle,

    subtitleStyle,

    bodyStyle,

  };

}


/* ===========================================================
   END
=========================================================== */