/* ===========================================================
   FINORA ENTERPRISE OS™

   IDENTITY PREVIEW CARD™

   RESPONSIVE PRESENTATION STYLES
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  ResponsiveTokens,
} from "../../../utils/responsive";

import type {
  FinoraTheme,
} from "../../../themes/core/types";

/* ===========================================================
   TYPES
=========================================================== */

export interface IdentityPreviewCardStyles {

  cardStyle:
    CSSProperties;

  headerStyle:
    CSSProperties;

  photoStyle:
    CSSProperties;

  imageStyle:
    CSSProperties;

  photoTextStyle:
    CSSProperties;

  nameStyle:
    CSSProperties;

  idStyle:
    CSSProperties;

  infoGroupStyle:
    CSSProperties;

  infoLabelStyle:
    CSSProperties;

  infoValueStyle:
    CSSProperties;

  verificationStyle:
    CSSProperties;

  verificationTitleStyle:
    CSSProperties;

  verificationTextStyle:
    CSSProperties;

  statusStyle:
    CSSProperties;

  statusTextStyle:
    CSSProperties;

  footerStyle:
    CSSProperties;

}

/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createIdentityPreviewCardStyles(

  tokens:
    ResponsiveTokens,

  theme:
    FinoraTheme,

): IdentityPreviewCardStyles {

  const cardWidth =
    Math.max(
      tokens.customerCards.width +
      tokens.spacing.large,
      250,
    );

  const photoSize =
    Math.min(
      tokens.customerCards.photoSize,
      96,
    );

  const borderRadius =
    Math.max(
      tokens.customerCards.radius,
      14,
    );

  const textPrimary =
    theme.colors.text.primary;

  const textSecondary =
    theme.colors.text.secondary;

  const textMuted =
    theme.colors.text.muted;

  const surface =
    theme.colors.background.surface;

  const surfaceMuted =
    theme.colors.background.surfaceMuted;

  const surfaceStrong =
    theme.colors.background.surfaceStrong;

  const border =
    theme.colors.border.default;

  const borderStrong =
    theme.colors.border.strong;

  const brandPrimary =
    theme.colors.brand.primary;

  const brandAccent =
    theme.colors.brand.accent;

  const brandAccentSoft =
    theme.colors.brand.accentSoft;

  const success =
    theme.colors.status.success;

  const successSoft =
    theme.colors.status.successSoft;

  const successBorder =
  theme.colors.border.default;

  const shadow =
    theme.colors.overlay.shadow;

  return {

    cardStyle: {

      width:
        "100%",

      maxWidth:
        `${cardWidth}px`,

      minWidth:
        0,

      boxSizing:
        "border-box",

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        `${tokens.spacing.small}px`,

      padding:
        `${tokens.customerCards.padding}px`,

      border:
        `${tokens.border.width}px solid ${border}`,

      borderRadius:
        `${borderRadius}px`,

      background:
        `
        linear-gradient(
          145deg,
          ${surface},
          ${surfaceMuted}
        )
        `,

      color:
        textPrimary,

      boxShadow:
        `0 ${tokens.spacing.medium}px ${tokens.spacing.xlarge}px ${shadow}`,

      overflow:
        "hidden",

      alignSelf:
        "flex-start",

    },

    headerStyle: {

      width:
        "100%",

      minWidth:
        0,

      boxSizing:
        "border-box",

      color:
        textPrimary,

      fontSize:
        `${Math.max(
          tokens.customerCards.brandSize,
          12,
        )}px`,

      fontWeight:
        800,

      letterSpacing:
        "1.4px",

      lineHeight:
        tokens.lineHeight.compact,

      textTransform:
        "uppercase",

    },

    photoStyle: {

      width:
        `${photoSize}px`,

      height:
        `${photoSize}px`,

      minWidth:
        `${photoSize}px`,

      minHeight:
        `${photoSize}px`,

      display:
        "flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      boxSizing:
        "border-box",

      marginTop:
        `${tokens.spacing.small}px`,

      marginBottom:
        `${tokens.spacing.small}px`,

      border:
        `${tokens.border.width}px solid ${borderStrong}`,

      borderRadius:
        `${Math.max(
          borderRadius - 4,
          10,
        )}px`,

      background:
        surfaceStrong,

      overflow:
        "hidden",

      flexShrink:
        0,

    },

    imageStyle: {

      width:
        "100%",

      height:
        "100%",

      objectFit:
        "cover",

      objectPosition:
        "center",

      display:
        "block",

    },

    photoTextStyle: {

      color:
        textPrimary,

      fontSize:
        `${Math.max(
          tokens.customerCards.companySize,
          11,
        )}px`,

      fontWeight:
        800,

      lineHeight:
        tokens.lineHeight.compact,

      textTransform:
        "uppercase",

    },

    nameStyle: {

      margin:
        0,

      minWidth:
        0,

      color:
        textPrimary,

      fontSize:
        `${Math.max(
          tokens.customerCards.nameSize,
          18,
        )}px`,

      fontWeight:
        800,

      lineHeight:
        tokens.lineHeight.compact,

      overflow:
        "hidden",

      textOverflow:
        "ellipsis",

      whiteSpace:
        "nowrap",

    },

    idStyle: {

      margin:
        0,

      minWidth:
        0,

      color:
        brandPrimary,

      fontSize:
        `${Math.max(
          tokens.customerCards.idSize,
          10,
        )}px`,

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

    },

    infoGroupStyle: {

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        `${tokens.spacing.small}px`,

      width:
        "100%",

      minWidth:
        0,

      marginTop:
        `${tokens.spacing.small}px`,

    },

    infoLabelStyle: {

      margin:
        0,

      color:
        textMuted,

      fontSize:
        `${Math.max(
          tokens.customerCards.idSize,
          10,
        )}px`,

      fontWeight:
        800,

      lineHeight:
        tokens.lineHeight.compact,

      letterSpacing:
        ".6px",

      textTransform:
        "uppercase",

    },

    infoValueStyle: {

      margin:
        0,

      color:
        textPrimary,

      fontSize:
        `${Math.max(
          tokens.customerCards.companySize,
          12,
        )}px`,

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

    },

    verificationStyle: {

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

      gap:
        `${tokens.spacing.small}px`,

      marginTop:
        `${tokens.spacing.small}px`,

      padding:
        `${tokens.spacing.medium}px`,

      border:
        `${tokens.border.width}px solid ${border}`,

      borderRadius:
        `${Math.max(
          tokens.customerCards.radius - 4,
          10,
        )}px`,

      background:
        `
        color-mix(
          in srgb,
          ${brandAccent} 8%,
          ${surface}
        )
        `,

    },

    verificationTitleStyle: {

      margin:
        0,

      color:
        textPrimary,

      fontSize:
        `${Math.max(
          tokens.customerCards.companySize,
          12,
        )}px`,

      fontWeight:
        800,

      lineHeight:
        tokens.lineHeight.compact,

    },

    verificationTextStyle: {

      margin:
        0,

      color:
        textSecondary,

      fontSize:
        `${Math.max(
          tokens.customerCards.idSize,
          10,
        )}px`,

      fontWeight:
        500,

      lineHeight:
        tokens.lineHeight.body,

    },

    statusStyle: {

      display:
        "inline-flex",

      alignItems:
        "center",

      alignSelf:
        "flex-start",

      width:
        "fit-content",

      maxWidth:
        "100%",

      boxSizing:
        "border-box",

      padding:
        `${tokens.spacing.small}px ${tokens.button.paddingX}px`,

      border:
        `${tokens.border.width}px solid ${successBorder}`,

      borderRadius:
        "999px",

      background:
        successSoft,

      color:
        success,

      overflow:
        "hidden",

    },

    statusTextStyle: {

      minWidth:
        0,

      color:
        success,

      fontSize:
        `${Math.max(
          tokens.customerCards.kycSize,
          10,
        )}px`,

      fontWeight:
        800,

      lineHeight:
        tokens.lineHeight.compact,

      overflow:
        "hidden",

      textOverflow:
        "ellipsis",

      whiteSpace:
        "nowrap",

    },

    footerStyle: {

      width:
        "100%",

      minWidth:
        0,

      boxSizing:
        "border-box",

      marginTop:
        `${tokens.spacing.small}px`,

      paddingTop:
        `${tokens.spacing.small}px`,

      borderTop:
        `${tokens.border.width}px solid ${border}`,

      color:
        textMuted,

      fontSize:
        `${Math.max(
          tokens.customerCards.idSize - 1,
          9,
        )}px`,

      fontWeight:
        500,

      lineHeight:
        tokens.lineHeight.compact,

    },

  };

}

/* ===========================================================
   END
=========================================================== */