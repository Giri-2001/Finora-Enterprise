/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER BASIC FORM
   RESPONSIVE TOKENS

   RESPONSIBILITY:
   - Basic customer form responsive geometry
   - Combined Step 1 + Step 2 layout
   - Mobile / Tablet / Laptop / Desktop contracts
   - Date picker responsive geometry
   - Calendar icon responsive geometry

   IMPORTANT:
   - Responsive sizing lives here
   - No business logic
   - No form state
   - No navigation
   - No component breakpoints
   - Components only consume resolved values

   Version : 3.2
   Status  : Production
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

export interface BasicFormResponsiveTokens {

  viewport:
    ResponsiveViewport;


  /* ---------------------------------------------------------
     LAYOUT
  --------------------------------------------------------- */

  pageGap:
    number;

  columnGap:
    number;

  fieldGap:
    number;

  basicFieldGap:
    number;

  formColumns:
    number;

  fieldColumns:
    number;


  /* ---------------------------------------------------------
     CONTROL GEOMETRY
  --------------------------------------------------------- */

  inputHeight:
    number;

  inputPaddingX:
    number;

  inputRadius:
    number;

  labelMinHeight:
    number;

  labelGap:
    number;


  /* ---------------------------------------------------------
     TYPOGRAPHY
  --------------------------------------------------------- */

  labelFontSize:
    number;

  labelFontWeight:
    number;

  labelLetterSpacing:
    number;

  inputFontSize:
    number;

  inputFontWeight:
    number;

  optionFontSize:
    number;

  basicLabelFontSize:
    number;

  basicInputFontSize:
    number;

  basicOptionFontSize:
    number;

  optionFontWeight:
    number;


  /* ---------------------------------------------------------
     GENERAL ICON
  --------------------------------------------------------- */

  iconSize:
    number;

  iconOffset:
    number;


  /* ---------------------------------------------------------
     CALENDAR ICON
     
     Used by IdentityForm for the FINORA-owned
     Date of Birth calendar button.
  --------------------------------------------------------- */

  calendarIconSize:
    number;

  calendarIconOffset:
    number;


  /* ---------------------------------------------------------
     DATE PICKER ICON
     
     Used by FinoraDatePicker.
     
     Kept separate from general form icons so the
     date picker can scale independently while still
     remaining fully controlled by the Responsive Engine.
  --------------------------------------------------------- */

  datePickerIconSize:
    number;

  datePickerIconOffset:
    number;


  /* ---------------------------------------------------------
     DATE PICKER POPUP
  --------------------------------------------------------- */

  datePickerPopupWidth:
    number;

  datePickerPopupPadding:
    number;


  /* ---------------------------------------------------------
     DATE PICKER TYPOGRAPHY
  --------------------------------------------------------- */

  datePickerHeaderFontSize:
    number;

  datePickerWeekdayFontSize:
    number;

  datePickerDayFontSize:
    number;


  /* ---------------------------------------------------------
     DATE PICKER DAY GEOMETRY
  --------------------------------------------------------- */

  datePickerDaySize:
    number;

  datePickerGridGap:
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

export const MOBILE_BASICFORM_TOKENS:
  BasicFormResponsiveTokens = {

  viewport:
    "mobile",


  /* ---------------------------------------------------------
     LAYOUT
  --------------------------------------------------------- */

  pageGap:
    12,

  columnGap:
    8,

  fieldGap:
    5,

  basicFieldGap:
    10,

  formColumns:
    1,

  fieldColumns:
    1,


  /* ---------------------------------------------------------
     CONTROL GEOMETRY
  --------------------------------------------------------- */

  inputHeight:
    38,

  inputPaddingX:
    10,

  inputRadius:
    8,

  labelMinHeight:
    16,

  labelGap:
    5,


  /* ---------------------------------------------------------
     TYPOGRAPHY
  --------------------------------------------------------- */

  labelFontSize:
    10,

  labelFontWeight:
    600,

  labelLetterSpacing:
    0.45,

  inputFontSize:
    11,

    

  inputFontWeight:
    500,

  optionFontSize:
    11,

  optionFontWeight:
    500,


  /* ---------------------------------------------------------
     GENERAL ICON
  --------------------------------------------------------- */
  basicLabelFontSize:
    9,

  basicInputFontSize:
    10,

  basicOptionFontSize:
    10,
  iconSize:
    16,

  iconOffset:
    10,


  /* ---------------------------------------------------------
     CALENDAR ICON
  --------------------------------------------------------- */

  calendarIconSize:
    20,

  calendarIconOffset:
    6,


  /* ---------------------------------------------------------
     DATE PICKER ICON
  --------------------------------------------------------- */

  datePickerIconSize:
    20,

  datePickerIconOffset:
    6,


  /* ---------------------------------------------------------
     DATE PICKER POPUP
  --------------------------------------------------------- */

  datePickerPopupWidth:
    280,

  datePickerPopupPadding:
    10,


  /* ---------------------------------------------------------
     DATE PICKER TYPOGRAPHY
  --------------------------------------------------------- */

  datePickerHeaderFontSize:
    13,

  datePickerWeekdayFontSize:
    10,

  datePickerDayFontSize:
    11,


  /* ---------------------------------------------------------
     DATE PICKER DAY GEOMETRY
  --------------------------------------------------------- */

  datePickerDaySize:
    30,

  datePickerGridGap:
    4,


  /* ---------------------------------------------------------
     COMPATIBILITY
  --------------------------------------------------------- */

  minWidth:
    0,

};


/* ===========================================================
   TABLET
   768 - 1023px
=========================================================== */

export const TABLET_BASICFORM_TOKENS:
  BasicFormResponsiveTokens = {

  viewport:
    "tablet",


  /* ---------------------------------------------------------
     LAYOUT
  --------------------------------------------------------- */

  pageGap:
    16,

  columnGap:
    16,

  fieldGap:
    5,

  basicFieldGap:
    10,

  formColumns:
    1,

  fieldColumns:
    2,


  /* ---------------------------------------------------------
     CONTROL GEOMETRY
  --------------------------------------------------------- */

  inputHeight:
    38,

  inputPaddingX:
    10,

  inputRadius:
    8,

  labelMinHeight:
    16,

  labelGap:
    5,


  /* ---------------------------------------------------------
     TYPOGRAPHY
  --------------------------------------------------------- */

  labelFontSize:
    10,

  labelFontWeight:
    600,

  labelLetterSpacing:
    0.45,

  inputFontSize:
    11,

  basicLabelFontSize:
    9,

  basicInputFontSize:
    10,

  basicOptionFontSize:
    10,

  inputFontWeight:
    500,

  optionFontSize:
    11,

  optionFontWeight:
    500,


  /* ---------------------------------------------------------
     GENERAL ICON
  --------------------------------------------------------- */

  iconSize:
    17,

  iconOffset:
    10,


  /* ---------------------------------------------------------
     CALENDAR ICON
  --------------------------------------------------------- */

  calendarIconSize:
    21,

  calendarIconOffset:
    7,


  /* ---------------------------------------------------------
     DATE PICKER ICON
  --------------------------------------------------------- */

  datePickerIconSize:
    21,

  datePickerIconOffset:
    7,


  /* ---------------------------------------------------------
     DATE PICKER POPUP
  --------------------------------------------------------- */

  datePickerPopupWidth:
    290,

  datePickerPopupPadding:
    10,


  /* ---------------------------------------------------------
     DATE PICKER TYPOGRAPHY
  --------------------------------------------------------- */

  datePickerHeaderFontSize:
    13,

  datePickerWeekdayFontSize:
    10,

  datePickerDayFontSize:
    11,


  /* ---------------------------------------------------------
     DATE PICKER DAY GEOMETRY
  --------------------------------------------------------- */

  datePickerDaySize:
    32,

  datePickerGridGap:
    5,


  /* ---------------------------------------------------------
     COMPATIBILITY
  --------------------------------------------------------- */

  minWidth:
    0,

};


/* ===========================================================
   LAPTOP
   1024 - 1599px
=========================================================== */

export const LAPTOP_BASICFORM_TOKENS:
  BasicFormResponsiveTokens = {

  viewport:
    "laptop",


  /* ---------------------------------------------------------
     LAYOUT
  --------------------------------------------------------- */

  pageGap:
    16,

  columnGap:
    5,

  fieldGap:
    6,

  basicFieldGap:
    10,

  formColumns:
    2,

  fieldColumns:
    2,


  /* ---------------------------------------------------------
     CONTROL GEOMETRY
  --------------------------------------------------------- */

  inputHeight:
    40,

  inputPaddingX:
    13,

  inputRadius:
    10,

  labelMinHeight:
    16,

  labelGap:
    5,


  /* ---------------------------------------------------------
     TYPOGRAPHY
  --------------------------------------------------------- */

  labelFontSize:
    10,

  labelFontWeight:
    600,

  labelLetterSpacing:
    0.45,

  inputFontSize:
    12,

  basicLabelFontSize:
    9,

  basicInputFontSize:
    10,

  basicOptionFontSize:
    10,

  inputFontWeight:
    500,

  optionFontSize:
    11,

  optionFontWeight:
    500,


  /* ---------------------------------------------------------
     GENERAL ICON
  --------------------------------------------------------- */

  iconSize:
    18,

  iconOffset:
    10,


  /* ---------------------------------------------------------
     CALENDAR ICON
  --------------------------------------------------------- */

  calendarIconSize:
    22,

  calendarIconOffset:
    8,


  /* ---------------------------------------------------------
     DATE PICKER ICON
  --------------------------------------------------------- */

  datePickerIconSize:
    22,

  datePickerIconOffset:
    8,


  /* ---------------------------------------------------------
     DATE PICKER POPUP
  --------------------------------------------------------- */

  datePickerPopupWidth:
    300,

  datePickerPopupPadding:
    12,


  /* ---------------------------------------------------------
     DATE PICKER TYPOGRAPHY
  --------------------------------------------------------- */

  datePickerHeaderFontSize:
    14,

  datePickerWeekdayFontSize:
    10,

  datePickerDayFontSize:
    11,


  /* ---------------------------------------------------------
     DATE PICKER DAY GEOMETRY
  --------------------------------------------------------- */

  datePickerDaySize:
    34,

  datePickerGridGap:
    5,


  /* ---------------------------------------------------------
     COMPATIBILITY
  --------------------------------------------------------- */

  minWidth:
    0,

};


/* ===========================================================
   DESKTOP
   1600px+
=========================================================== */

export const DESKTOP_BASICFORM_TOKENS:
  BasicFormResponsiveTokens = {

  viewport:
    "desktop",


  /* ---------------------------------------------------------
     LAYOUT
  --------------------------------------------------------- */

  pageGap:
    20,

  columnGap:
    5,

  fieldGap:
    5,

  basicFieldGap:
    10,

  formColumns:
    2,

  fieldColumns:
    2,


  /* ---------------------------------------------------------
     CONTROL GEOMETRY
  --------------------------------------------------------- */

  inputHeight:
    38,

  inputPaddingX:
    10,

  inputRadius:
    8,

  labelMinHeight:
    16,

  labelGap:
    5,


  /* ---------------------------------------------------------
     TYPOGRAPHY
  --------------------------------------------------------- */

  labelFontSize:
    10,

  labelFontWeight:
    600,

  labelLetterSpacing:
    0.45,

  inputFontSize:
    11,

  basicLabelFontSize:
    9,

  basicInputFontSize:
    10,

  basicOptionFontSize:
    10,

  inputFontWeight:
    500,

  optionFontSize:
    11,

  optionFontWeight:
    500,


  /* ---------------------------------------------------------
     GENERAL ICON
  --------------------------------------------------------- */

  iconSize:
    19,

  iconOffset:
    10,


  /* ---------------------------------------------------------
     CALENDAR ICON
  --------------------------------------------------------- */

  calendarIconSize:
    24,

  calendarIconOffset:
    9,


  /* ---------------------------------------------------------
     DATE PICKER ICON
  --------------------------------------------------------- */

  datePickerIconSize:
    24,

  datePickerIconOffset:
    9,


  /* ---------------------------------------------------------
     DATE PICKER POPUP
  --------------------------------------------------------- */

  datePickerPopupWidth:
    320,

  datePickerPopupPadding:
    14,


  /* ---------------------------------------------------------
     DATE PICKER TYPOGRAPHY
  --------------------------------------------------------- */

  datePickerHeaderFontSize:
    15,

  datePickerWeekdayFontSize:
    11,

  datePickerDayFontSize:
    12,


  /* ---------------------------------------------------------
     DATE PICKER DAY GEOMETRY
  --------------------------------------------------------- */

  datePickerDaySize:
    36,

  datePickerGridGap:
    6,


  /* ---------------------------------------------------------
     COMPATIBILITY
  --------------------------------------------------------- */

  minWidth:
    0,

};


/* ===========================================================
   RESOLVER
=========================================================== */

export function getBasicFormTokens(
  viewport:
    ResponsiveViewport,
):
  BasicFormResponsiveTokens {

  switch (
    viewport
  ) {

    case "mobile":

      return MOBILE_BASICFORM_TOKENS;


    case "tablet":

      return TABLET_BASICFORM_TOKENS;


    case "laptop":

      return LAPTOP_BASICFORM_TOKENS;


    case "desktop":

      return DESKTOP_BASICFORM_TOKENS;


    default:

      return LAPTOP_BASICFORM_TOKENS;

  }

}


/* ===========================================================
   DEFAULT
=========================================================== */

export const DEFAULT_BASICFORM_TOKENS:
  BasicFormResponsiveTokens =
    LAPTOP_BASICFORM_TOKENS;


/* ===========================================================
   END
=========================================================== */