/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 3 — ADDRESS STUDIO™

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Address workspace presentation
   - Responsive address geometry
   - Theme-aware visual presentation
   - Typography consumed from Address Responsive Engine
   - Spacing consumed from Address Responsive Engine
   - Input geometry consumed from Address Responsive Engine

   REMOVED:

   - Address Proof
   - Address Map
   - GIS / Location
   - Verification cards
   - Verification-only styles

   IMPORTANT:

   - NO local breakpoints
   - NO viewport detection
   - NO media queries
   - NO local responsive calculations
   - NO local colour palette
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import type {
  AddressResponsiveTokens,
} from "../../../../utils/responsive/customers/address/address.tokens";


import type {
  FinoraTheme,
} from "../../../../themes/core/types";


import {
  DEFAULT_ADDRESS_TOKENS,
} from "../../../../utils/responsive/customers/address/address.tokens";


import {
  createAddressContentStyle,
  createAddressFieldAreaStyle,
  createAddressPageStyle,
  createAddressSectionHeaderStyle,
  createAddressSectionIconStyle,
  createAddressSectionStyle,
} from "../../../../utils/responsive/customers/address/address.layout";


/* ===========================================================
   THEME VARIABLE TYPE
=========================================================== */

export type Step3ThemeStyle =
  CSSProperties &
  Record<
    `--${string}`,
    string
  >;


/* ===========================================================
   THEME VARIABLE FACTORY
=========================================================== */

export function createStep3ThemeVariables(
  theme:
    FinoraTheme,
):
  Step3ThemeStyle {

  return {

    "--finora-theme-brand-primary":
      theme.colors.brand.primary,

    "--finora-theme-brand-secondary":
      theme.colors.brand.secondary,

    "--finora-theme-brand-accent":
      theme.colors.brand.accent,

    "--finora-theme-brand-accent-soft":
      theme.colors.brand.accentSoft,

    "--finora-theme-page":
      theme.colors.background.page,

    "--finora-theme-surface":
      theme.colors.background.surface,

    "--finora-theme-background-surface":
      theme.colors.background.surface,

    "--finora-theme-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-background-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-text-primary":
      theme.colors.text.primary,

    "--finora-theme-text-secondary":
      theme.colors.text.secondary,

    "--finora-theme-text-body":
      theme.colors.text.secondary,

    "--finora-theme-text-muted":
      theme.colors.text.muted,

    "--finora-theme-text-inverse":
      theme.colors.text.inverse,

    "--finora-theme-border-default":
      theme.colors.border.default,

    "--finora-theme-border-strong":
      theme.colors.border.strong,

    "--finora-theme-border-subtle":
      theme.colors.border.subtle,

    "--finora-theme-overlay-shadow":
      theme.colors.overlay.shadow,

  };

}


/* ===========================================================
   STYLE CONTRACT
=========================================================== */

export interface Step3AddressStyles {

  pageStyle:
    CSSProperties;

  pageHeaderStyle:
    CSSProperties;

  pageTitleStyle:
    CSSProperties;

  pageSubtitleStyle:
    CSSProperties;

  contentStyle:
    CSSProperties;

  sectionStyle:
    CSSProperties;

  sectionHeaderStyle:
    CSSProperties;

  sectionIconStyle:
    CSSProperties;

  sectionTitleStyle:
    CSSProperties;

  sectionSubtitleStyle:
    CSSProperties;

  fieldAreaStyle:
    CSSProperties;

  addressGridStyle:
    CSSProperties;

  fullAddressFieldStyle:
    CSSProperties;

  fieldStyle:
    CSSProperties;

  labelStyle:
    CSSProperties;

  inputStyle:
    CSSProperties;

  addressInputStyle:
    CSSProperties;

  numberInputStyle:
    CSSProperties;

  addressGlobalStyle:
    string;

}


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createStep3AddressStyles(

  tokens:
    AddressResponsiveTokens,

  theme:
    FinoraTheme,

): Step3AddressStyles {

  const themeVariables =
    createStep3ThemeVariables(
      theme,
    );


  const pageStyle =
    createAddressPageStyle(
      tokens,
    );


  const contentStyle =
    createAddressContentStyle(
      tokens,
    );


  const sectionStyle =
    createAddressSectionStyle(
      tokens,
    );


  const sectionHeaderStyle =
    createAddressSectionHeaderStyle(
      tokens,
    );


  const sectionIconStyle =
    createAddressSectionIconStyle(
      tokens,
    );


  const fieldAreaStyle =
    createAddressFieldAreaStyle(
      tokens,
    );


  const pageHeaderStyle:
    CSSProperties = {

    display:
      "none",

  };


  const pageTitleStyle:
    CSSProperties = {

    margin:
      0,

    padding:
      0,

    color:
      "var(--finora-theme-text-primary, #171A21)",

    fontSize:
      `${tokens.inputFontSize + 5}px`,

    lineHeight:
      1.15,

    fontWeight:
      800,

  };


  const pageSubtitleStyle:
    CSSProperties = {

    margin:
      `${Math.max(2, tokens.labelGap - 2)}px 0 0`,

    padding:
      0,

    color:
      "var(--finora-theme-text-secondary, #4B5563)",

    fontSize:
      `${Math.max(9, tokens.inputFontSize)}px`,

    lineHeight:
      1.3,

    fontWeight:
      600,

  };


  const sectionTitleStyle:
    CSSProperties = {

    margin:
      0,

    padding:
      0,

    color:
      theme.colors.text.primary,

    fontSize:
      `${Math.max(13, tokens.inputFontSize + 4)}px`,

    lineHeight:
      1.15,

    fontWeight:
      800,

    letterSpacing:
      "-0.1px",

  };


  const sectionSubtitleStyle:
    CSSProperties = {

    margin:
      `${Math.max(0, tokens.labelGap - 1)}px 0 0`,

    padding:
      0,

    color:
      theme.colors.text.secondary,

    fontSize:
      `${tokens.inputFontSize}px`,

    lineHeight:
      1.3,

    fontWeight:
      600,

  };


  const addressGridStyle =
    sectionStyle;


  const fullAddressFieldStyle =
    sectionStyle;


  const fieldStyle =
    sectionStyle;


  const labelStyle =
    sectionStyle;


  const inputStyle =
    sectionStyle;


  const addressInputStyle =
    sectionStyle;


  const numberInputStyle =
    sectionStyle;


  const addressGlobalStyle = `

    .finora-address-input {

  color:
    ${theme.colors.text.primary} !important;

  caret-color:
    ${theme.colors.brand.accent};

  font-family:
    var(
      --finora-theme-font-family,
      Inter,
      system-ui,
      sans-serif
    );

  font-size:
    ${tokens.inputFontSize}px !important;

  line-height:
    1.25;
    

  box-shadow:
  inset 0 1px 0
  color-mix(
    in srgb,
    ${theme.colors.text.inverse} 4%,
    transparent
  );

}

    .finora-address-input::placeholder {

      color:
        ${theme.colors.text.muted} !important;

      opacity:
        1 !important;

      font-weight:
        500;

    }


    .finora-address-input:hover {

  border-color:
    ${theme.colors.border.strong} !important;

}

    .finora-address-input:focus {

  border-color:
    ${theme.colors.border.strong} !important;

  background:
    linear-gradient(
      180deg,
      color-mix(
        in srgb,
        ${theme.colors.background.surfaceMuted} 82%,
        transparent
      ),
      color-mix(
        in srgb,
        ${theme.colors.background.surface} 94%,
        transparent
      )
    ) !important;

  box-shadow:
    inset 0 1px 0
    color-mix(
      in srgb,
      ${theme.colors.text.inverse} 4%,
      transparent
    ) !important;

  outline:
    none !important;

}


    .finora-address-input:disabled {

      color:
        ${theme.colors.text.muted} !important;

      opacity:
        .72;

    }


    input,
    textarea,
    select {

      font-family:
        inherit;

    }

  `;


  void themeVariables;


  return {

    pageStyle,

    pageHeaderStyle,

    pageTitleStyle,

    pageSubtitleStyle,

    contentStyle,

    sectionStyle,

    sectionHeaderStyle,

    sectionIconStyle,

    sectionTitleStyle,

    sectionSubtitleStyle,

    fieldAreaStyle,

    addressGridStyle,

    fullAddressFieldStyle,

    fieldStyle,

    labelStyle,

    inputStyle,

    addressInputStyle,

    numberInputStyle,

    addressGlobalStyle,

  };

}


/* ===========================================================
   DEFAULT COMPATIBILITY EXPORTS
=========================================================== */

const DEFAULT_THEME_VARIABLES:
  Step3ThemeStyle = {

  "--finora-theme-brand-primary":
    "var(--finora-theme-brand-primary, #B8860B)",

};


export const pageStyle:
  CSSProperties = {

  ...createAddressPageStyle(
    DEFAULT_ADDRESS_TOKENS,
  ),

};


export const pageHeaderStyle:
  CSSProperties = {

  display:
    "none",

};


export const pageTitleStyle:
  CSSProperties = {

  margin:
    0,

};


export const pageSubtitleStyle:
  CSSProperties = {

  margin:
    0,

};


export const contentStyle:
  CSSProperties = {

  ...createAddressContentStyle(
    DEFAULT_ADDRESS_TOKENS,
  ),

};


export const sectionStyle:
  CSSProperties = {

  ...createAddressSectionStyle(
    DEFAULT_ADDRESS_TOKENS,
  ),

};


export const sectionHeaderStyle:
  CSSProperties = {

  ...createAddressSectionHeaderStyle(
    DEFAULT_ADDRESS_TOKENS,
  ),

};


export const sectionIconStyle:
  CSSProperties = {

  ...createAddressSectionIconStyle(
    DEFAULT_ADDRESS_TOKENS,
  ),

};


export const sectionTitleStyle:
  CSSProperties = {

  margin:
    0,

  color:
    DEFAULT_THEME_VARIABLES[
      "--finora-theme-text-primary"
    ],

};


export const sectionSubtitleStyle:
  CSSProperties = {

  margin:
    0,

  color:
    DEFAULT_THEME_VARIABLES[
      "--finora-theme-text-secondary"
    ],

};


export const fieldAreaStyle:
  CSSProperties = {

  ...createAddressFieldAreaStyle(
    DEFAULT_ADDRESS_TOKENS,
  ),

};


/* ===========================================================
   LEGACY EMPTY CONTRACTS

   AddressForm now consumes address.layout directly.
   These exports remain only for source compatibility.
=========================================================== */

export const addressGridStyle:
  CSSProperties = {

  width:
    "100%",

};


export const fullAddressFieldStyle:
  CSSProperties = {

  minWidth:
    0,

};


export const fieldStyle:
  CSSProperties = {

  minWidth:
    0,

};


export const labelStyle:
  CSSProperties = {

  margin:
    0,

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
    "1px solid var(--finora-theme-border-strong, #474C58)",

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
          var(--finora-theme-surface-muted, #1D212B) 82%,
          transparent
        ),
        color-mix(
          in srgb,
          var(--finora-theme-surface, #151820) 94%,
          transparent
        )
      )
    `,

  color:
    "var(--finora-theme-text-primary, #F5F2EA)",

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
        var(--finora-theme-text-inverse, #FFFFFF) 4%,
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


export const addressInputStyle:
  CSSProperties = {

  width:
    "100%",

};


export const numberInputStyle:
  CSSProperties = {

  width:
    "100%",

};


export const addressGlobalStyle =
  "";


/* ===========================================================
   END
=========================================================== */