/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ADDRESS FORM
   RESPONSIVE TOKENS

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Address workspace responsive geometry
   - Address field grid geometry
   - Input geometry
   - Typography geometry
   - Preview geometry
   - Mobile / Tablet / Laptop / Desktop contracts

   IMPORTANT:

   - Responsive sizing lives ONLY here.
   - No business logic.
   - No form state.
   - No viewport detection.
   - No media queries.
   - No component-level breakpoint decisions.
   - Address Proof / Map / GIS / Verification tokens do NOT exist.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  ResponsiveViewport,
} from "../customers.tokens";


/* ===========================================================
   TYPES
=========================================================== */

export interface AddressResponsiveTokens {

  viewport:
    ResponsiveViewport;


  /* ---------------------------------------------------------
     PAGE
  --------------------------------------------------------- */

  pagePaddingX:
    number;

  pagePaddingTop:
    number;

  pagePaddingBottom:
    number;

  pageGap:
    number;


  /* ---------------------------------------------------------
     CONTENT DISTRIBUTION
  --------------------------------------------------------- */

  contentColumns:
    number;

  sectionGap:
    number;


  /* ---------------------------------------------------------
     SECTION
  --------------------------------------------------------- */

  sectionPaddingX:
    number;

  sectionPaddingY:
    number;

  sectionRadius:
    number;

  sectionHeaderGap:
    number;

  sectionHeaderHeight:
    number;

  sectionHeaderPaddingBottom:
    number;


  /* ---------------------------------------------------------
     ADDRESS FIELD GRID
  --------------------------------------------------------- */

  addressColumns:
    number;

  addressColumnGap:
    number;

  addressRowGap:
    number;

  fullAddressColumns:
    number;


  /* ---------------------------------------------------------
     FIELD
  --------------------------------------------------------- */

  fieldGap:
    number;

  labelGap:
    number;

  labelFontSize:
    number;

  labelFontWeight:
    number;

  labelLetterSpacing:
    number;


  /* ---------------------------------------------------------
     INPUT
  --------------------------------------------------------- */

  inputHeight:
    number;

  addressInputHeight:
    number;

  inputPaddingX:
    number;

  inputRadius:
    number;

  inputFontSize:
    number;

  inputFontWeight:
    number;


  /* ---------------------------------------------------------
     FIELD ICON
  --------------------------------------------------------- */

  fieldIconSize:
    number;

  fieldIconOffset:
    number;

  selectChevronSize:
    number;


  /* ---------------------------------------------------------
     SECTION ICON
  --------------------------------------------------------- */

  sectionIconSize:
    number;

  sectionIconFontSize:
    number;


  /* ---------------------------------------------------------
     ADDRESS PREVIEW
  --------------------------------------------------------- */

  previewPaddingX:
    number;

  previewPaddingY:
    number;

  previewGap:
    number;

  previewIconSize:
    number;

  previewIconRadius:
    number;

  previewTitleSize:
    number;

  previewSubtitleSize:
    number;

  previewLabelSize:
    number;

  previewValueSize:
    number;

  previewRowGap:
    number;

  previewRowPaddingY:
    number;

  previewMetaColumns:
    number;

  previewMetaGap:
    number;

  previewRadius:
    number;


  /* ---------------------------------------------------------
     COMPATIBILITY
  --------------------------------------------------------- */

  minWidth:
    number;

}


/* ===========================================================
   MOBILE
   0 - 767px
=========================================================== */

export const MOBILE_ADDRESS_TOKENS:
  AddressResponsiveTokens = {

  viewport:
    "mobile",

  pagePaddingX:
    8,

  pagePaddingTop:
    6,

  pagePaddingBottom:
    6,

  pageGap:
    8,

  contentColumns:
    1,

  sectionGap:
    7,

  sectionPaddingX:
    10,

  sectionPaddingY:
    10,

  sectionRadius:
    13,

  sectionHeaderGap:
    8,

  sectionHeaderHeight:
    34,

  sectionHeaderPaddingBottom:
    7,

  addressColumns:
    1,

  addressColumnGap:
    8,

  addressRowGap:
    7,

  fullAddressColumns:
    1,

  fieldGap:
    4,

  labelGap:
    4,

  labelFontSize:
    9,

  labelFontWeight:
    700,

  labelLetterSpacing:
    0.30,

  inputHeight:
    38,

  addressInputHeight:
    40,

  inputPaddingX:
    10,

  inputRadius:
    8,

  inputFontSize:
    11,

  inputFontWeight:
    500,

  fieldIconSize:
    15,

  fieldIconOffset:
    9,

  selectChevronSize:
    14,

  sectionIconSize:
    32,

  sectionIconFontSize:
    15,

  previewPaddingX:
    9,

  previewPaddingY:
    9,

  previewGap:
    7,

  previewIconSize:
    30,

  previewIconRadius:
    9,

  previewTitleSize:
    12,

  previewSubtitleSize:
    9,

  previewLabelSize:
    8,

  previewValueSize:
    10,

  previewRowGap:
    6,

  previewRowPaddingY:
    6,

  previewMetaColumns:
    1,

  previewMetaGap:
    6,

  previewRadius:
    10,

  minWidth:
    0,

};


/* ===========================================================
   TABLET
   768 - 1023px
=========================================================== */

export const TABLET_ADDRESS_TOKENS:
  AddressResponsiveTokens = {

  viewport:
    "tablet",

  pagePaddingX:
    10,

  pagePaddingTop:
    7,

  pagePaddingBottom:
    6,

  pageGap:
    8,

  contentColumns:
    2,

  sectionGap:
    7,

  sectionPaddingX:
    12,

  sectionPaddingY:
    10,

  sectionRadius:
    14,

  sectionHeaderGap:
    9,

  sectionHeaderHeight:
    36,

  sectionHeaderPaddingBottom:
    7,

  addressColumns:
    2,

  addressColumnGap:
    9,

  addressRowGap:
    7,

  fullAddressColumns:
    1,

  fieldGap:
    4,

  labelGap:
    4,

  labelFontSize:
    9,

  labelFontWeight:
    700,

  labelLetterSpacing:
    0.35,

  inputHeight:
    39,

  addressInputHeight:
    41,

  inputPaddingX:
    11,

  inputRadius:
    9,

  inputFontSize:
    11,

  inputFontWeight:
    500,

  fieldIconSize:
    16,

  fieldIconOffset:
    10,

  selectChevronSize:
    15,

  sectionIconSize:
    34,

  sectionIconFontSize:
    16,

  previewPaddingX:
    10,

  previewPaddingY:
    10,

  previewGap:
    8,

  previewIconSize:
    32,

  previewIconRadius:
    10,

  previewTitleSize:
    13,

  previewSubtitleSize:
    9.5,

  previewLabelSize:
    8.5,

  previewValueSize:
    10.5,

  previewRowGap:
    7,

  previewRowPaddingY:
    7,

  previewMetaColumns:
    3,

  previewMetaGap:
    7,

  previewRadius:
    11,

  minWidth:
    0,

};


/* ===========================================================
   LAPTOP
   1024 - 1599px
=========================================================== */

export const LAPTOP_ADDRESS_TOKENS:
  AddressResponsiveTokens = {

  viewport:
    "laptop",

  pagePaddingX:
    14,

  pagePaddingTop:
    8,

  pagePaddingBottom:
    6,

  pageGap:
    9,

  contentColumns:
    2,

  sectionGap:
    7,

  sectionPaddingX:
    14,

  sectionPaddingY:
    11,

  sectionRadius:
    17,

  sectionHeaderGap:
    15,

  sectionHeaderHeight:
    38,

  sectionHeaderPaddingBottom:
    11,

  addressColumns:
    2,

  addressColumnGap:
    12,

  addressRowGap:
    20,

  fullAddressColumns:
    1,

  fieldGap:
    7,

  labelGap:
    7,

  labelFontSize:
    10,

  labelFontWeight:
    650,

  labelLetterSpacing:
    0.35,

  inputHeight:
    42,

  addressInputHeight:
    42,

  inputPaddingX:
    14,

  inputRadius:
    11,

  inputFontSize:
    13,

  inputFontWeight:
    600,

  fieldIconSize:
    17,

  fieldIconOffset:
    12,

  selectChevronSize:
    16,

  sectionIconSize:
    36,

  sectionIconFontSize:
    17,

  previewPaddingX:
    12,

  previewPaddingY:
    12,

  previewGap:
    9,

  previewIconSize:
    38,

  previewIconRadius:
    11,

  previewTitleSize:
    14,

  previewSubtitleSize:
    11,

  previewLabelSize:
    10,

  previewValueSize:
    12,

  previewRowGap:
    12,

  previewRowPaddingY:
    8,

  previewMetaColumns:
    3,

  previewMetaGap:
    9,

  previewRadius:
    12,

  minWidth:
    0,

};


/* ===========================================================
   DESKTOP
   1600px+
=========================================================== */

export const DESKTOP_ADDRESS_TOKENS:
  AddressResponsiveTokens = {

  viewport:
    "desktop",

  pagePaddingX:
    18,

  pagePaddingTop:
    8,

  pagePaddingBottom:
    6,

  pageGap:
    9,

  contentColumns:
    2,

  sectionGap:
    8,

  sectionPaddingX:
    16,

  sectionPaddingY:
    12,

  sectionRadius:
    17,

  sectionHeaderGap:
    15,

  sectionHeaderHeight:
    39,

  sectionHeaderPaddingBottom:
    11,

  addressColumns:
    2,

  addressColumnGap:
    14,

  addressRowGap:
    20,

  fullAddressColumns:
    1,

  fieldGap:
    7,

  labelGap:
    7,

  labelFontSize:
    10,

  labelFontWeight:
    650,

  labelLetterSpacing:
    0.40,

  inputHeight:
    42,

  addressInputHeight:
    42,

  inputPaddingX:
    14,

  inputRadius:
    11,

  inputFontSize:
    13,

  inputFontWeight:
    600,

  fieldIconSize:
    18,

  fieldIconOffset:
    12,

  selectChevronSize:
    17,

  sectionIconSize:
    37,

  sectionIconFontSize:
    17,

  previewPaddingX:
    13,

  previewPaddingY:
    13,

  previewGap:
    10,

  previewIconSize:
    40,

  previewIconRadius:
    12,

  previewTitleSize:
    14,

  previewSubtitleSize:
    10.5,

  previewLabelSize:
    10,

  previewValueSize:
    12.5,

  previewRowGap:
    12,

  previewRowPaddingY:
    9,

  previewMetaColumns:
    3,

  previewMetaGap:
    10,

  previewRadius:
    13,

  minWidth:
    0,

};


/* ===========================================================
   RESOLVER
=========================================================== */

export function getAddressTokens(
  viewport:
    ResponsiveViewport,
):
  AddressResponsiveTokens {

  switch (
    viewport
  ) {

    case "mobile":

      return MOBILE_ADDRESS_TOKENS;

    case "tablet":

      return TABLET_ADDRESS_TOKENS;

    case "laptop":

      return LAPTOP_ADDRESS_TOKENS;

    case "desktop":

      return DESKTOP_ADDRESS_TOKENS;

    default:

      return LAPTOP_ADDRESS_TOKENS;

  }

}


/* ===========================================================
   DEFAULT
=========================================================== */

export const DEFAULT_ADDRESS_TOKENS:
  AddressResponsiveTokens =
    LAPTOP_ADDRESS_TOKENS;


/* ===========================================================
   END
=========================================================== */
