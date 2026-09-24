/* ===========================================================
   FINORA ENTERPRISE
   RECEPTION FOOTER STYLES
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


export interface ReceptionFooterStyles {
  containerStyle: CSSProperties;
  contentStyle: CSSProperties;
  brandStyle: CSSProperties;
  storageBadgeStyle: CSSProperties;
  versionBadgeStyle: CSSProperties;
  metadataLabelStyle: CSSProperties;
  metadataDividerStyle: CSSProperties;
  metadataValueStyle: CSSProperties;
}


export function createReceptionFooterStyles(
  tokens: ResponsiveTokens,
  theme: FinoraTheme,
  isMobile: boolean,
): ReceptionFooterStyles {

  const fontFamily =
    "Inter, ui-sans-serif, system-ui, sans-serif";

  const chipPaddingY =
    Math.max(
      tokens.footer.paddingY - 2,
      3,
    );

  const chipRadius =
    `${tokens.border.radius * 2}px`;

  const containerStyle:
    CSSProperties = {

    width:
      `calc(100% - ${tokens.layout.pageGutter * 2}px)`,

    maxWidth:
      `${tokens.layout.maxContentWidth}px`,

    minWidth:
      0,

    minHeight:
      `${tokens.footer.minHeight}px`,

    height:
      isMobile
        ? "auto"
        : `${tokens.footer.height}px`,

    padding:
      `${tokens.footer.paddingY}px ${tokens.footer.paddingX}px`,

    marginTop:
      "auto",

    alignSelf:
      "center",

    flexShrink:
      0,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    boxSizing:
      "border-box",

    border:
      `${tokens.border.width}px solid ${theme.colors.border.strong}`,

    borderRadius:
      `${tokens.border.radius}px`,

    background:
      "transparent",

    boxShadow:
      "none",
  };

  const contentStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    display:
      "grid",

    gridTemplateColumns:
      isMobile
        ? "minmax(0, 1fr)"
        : "minmax(0, 1fr) auto minmax(0, 1fr)",

    alignItems:
      "center",

    columnGap:
      `${tokens.spacing.medium}px`,

    rowGap:
      isMobile
        ? `${tokens.spacing.small}px`
        : 0,

    boxSizing:
      "border-box",
  };

  const brandStyle:
    CSSProperties = {

    minWidth:
      0,

    justifySelf:
      isMobile
        ? "stretch"
        : "start",

    width:
      isMobile
        ? "100%"
        : "auto",

    display:
      isMobile
        ? "flex"
        : "block",

    alignItems:
      "center",

    justifyContent:
      "center",

    padding:
      isMobile
        ? `${chipPaddingY}px ${tokens.spacing.small}px`
        : 0,

    border:
      isMobile
        ? `${tokens.border.width}px solid ${theme.colors.border.default}`
        : "none",

    borderRadius:
      isMobile
        ? chipRadius
        : 0,

    background:
      isMobile
        ? theme.colors.background.surfaceElevated
        : "transparent",

    boxSizing:
      "border-box",

    color:
      theme.colors.text.primary,

    fontFamily,

    fontSize:
      `${tokens.footer.fontSize + 1}px`,

    fontWeight:
      700,

    lineHeight:
      tokens.lineHeight.body,

    letterSpacing:
      "0.1px",

    whiteSpace:
      "nowrap",
  };

  const sharedBadgeStyle:
    CSSProperties = {

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      `${Math.max(tokens.spacing.small - 2, 4)}px`,

    padding:
      `${chipPaddingY}px ${tokens.spacing.small}px`,

    border:
      `${tokens.border.width}px solid ${theme.colors.border.default}`,

    borderRadius:
      chipRadius,

    background:
      theme.colors.background.surfaceElevated,

    color:
      theme.colors.text.primary,

    fontFamily,

    lineHeight:
      tokens.lineHeight.body,

    whiteSpace:
      "nowrap",

    boxSizing:
      "border-box",
  };

  const storageBadgeStyle:
    CSSProperties = {

    ...sharedBadgeStyle,

    justifySelf:
      isMobile
        ? "stretch"
        : "center",

    width:
      isMobile
        ? "100%"
        : "auto",
  };

  const versionBadgeStyle:
    CSSProperties = {

    ...sharedBadgeStyle,

    justifySelf:
      isMobile
        ? "stretch"
        : "end",

    width:
      isMobile
        ? "100%"
        : "auto",
  };

  const metadataLabelStyle:
    CSSProperties = {

    color:
      theme.colors.text.secondary,

    fontFamily,

    fontSize:
      `${Math.max(tokens.footer.fontSize - 1, 10)}px`,

    fontWeight:
      500,

    lineHeight:
      tokens.lineHeight.body,
  };

  const metadataDividerStyle:
    CSSProperties = {

    color:
      theme.colors.text.secondary,

    fontFamily,

    fontSize:
      `${tokens.footer.fontSize}px`,

    fontWeight:
      500,

    lineHeight:
      1,
  };

  const metadataValueStyle:
    CSSProperties = {

    color:
      theme.colors.text.primary,

    fontFamily,

    fontSize:
      `${tokens.footer.fontSize}px`,

    fontWeight:
      700,

    lineHeight:
      tokens.lineHeight.body,

    letterSpacing:
      "0.1px",
  };

  return {
    containerStyle,
    contentStyle,
    brandStyle,
    storageBadgeStyle,
    versionBadgeStyle,
    metadataLabelStyle,
    metadataDividerStyle,
    metadataValueStyle,
  };
}
