/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER RESPONSIVE ENGINE™

   TOKENS

   RESPONSIBILITY:
   - Customer responsive visual values ONLY
   - Customer typography
   - Customer spacing
   - Customer cards
   - Customer forms
   - Customer tables
   - Customer wizard
   - Customer dashboard
   - Customer modal
   - Customer layout

   IMPORTANT:
   - No breakpoint definitions
   - No device detection
   - No viewport calculations outside token selection
   - Breakpoint boundaries come from customers.breakpoints.ts
   - Global token contracts come from ../types

   DEVICE SYSTEM:
   01. MOBILE
   02. TABLET
   03. LAPTOP
   04. DESKTOP
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  ResponsiveViewport,
  ResponsiveTokenMap,
} from "../types";

import type {
  ResponsiveTokens,
} from "../tokens";


import {
  CUSTOMERS_MOBILE_MIN_WIDTH,
  CUSTOMERS_MOBILE_MAX_WIDTH,

  CUSTOMERS_TABLET_MIN_WIDTH,
  CUSTOMERS_TABLET_MAX_WIDTH,

  CUSTOMERS_LAPTOP_MIN_WIDTH,
  CUSTOMERS_LAPTOP_MAX_WIDTH,

  CUSTOMERS_DESKTOP_MIN_WIDTH,
} from "./customers.breakpoints";


/* ===========================================================
   TOKEN BUILDER
=========================================================== */

function createCustomerTokens(
  viewport: ResponsiveViewport,
  minWidth: number,
  maxWidth: number | null,

  values: {
    pageGutter: number;
    sectionGap: number;
    cardGap: number;
    cardPadding: number;

    titleSize: number;
    headingSize: number;
    bodySize: number;
    labelSize: number;
    smallSize: number;

    controlHeight: number;
    inputHeight: number;
    buttonHeight: number;

    cardRadius: number;
    panelRadius: number;

    customerCardWidth: number;
    customerCardHeight: number;

    columns: number;

    tableRowHeight: number;
    tableHeaderHeight: number;

    sidebarWidth: number;
    navigationHeight: number;

    modalWidth: number;

    wizardWidth: number;
  },
): ResponsiveTokens {

  return {

    /* =======================================================
       META
    ======================================================= */

    meta: {

      name:
        "customers",

      viewport,

      minWidth,

      maxWidth,

    },


    /* =======================================================
       TYPOGRAPHY
    ======================================================= */

    typography: {

      display:
        values.titleSize + 12,

      title:
        values.titleSize,

      heading:
        values.headingSize,

      subheading:
        values.headingSize - 2,

      body:
        values.bodySize,

      label:
        values.labelSize,

      small:
        values.smallSize,

      caption:
        values.smallSize - 1,

      button:
        values.labelSize,

      input:
        values.bodySize,

      table:
        values.smallSize,

      navigation:
        values.labelSize,

    },


    /* =======================================================
       LINE HEIGHT
    ======================================================= */

    lineHeight: {

      display:
        values.titleSize + 10,

      title:
        values.titleSize + 8,

      heading:
        values.headingSize + 7,

      body:
        values.bodySize + 7,

      compact:
        values.smallSize + 5,

    },


    /* =======================================================
       SPACING
    ======================================================= */

    spacing: {

      page:
        values.pageGutter,

      section:
        values.sectionGap,

      card:
        values.cardPadding,

      control:
        12,

      inline:
        8,

      small:
        6,

      medium:
        12,

      large:
        20,

      xlarge:
        28,

      xxlarge:
        36,

    },


    /* =======================================================
       CARD
    ======================================================= */

    card: {

      width:
        values.customerCardWidth,

      minWidth:
        values.customerCardWidth,

      maxWidth:
        values.customerCardWidth,

      minHeight:
        values.customerCardHeight,

      padding:
        values.cardPadding,

      radius:
        values.cardRadius,

      gap:
        values.cardGap,

    },


    /* =======================================================
       DOOR
    ======================================================= */

    door: {

      width:
        values.customerCardWidth,

      height:
        values.customerCardHeight,

      padding:
        values.cardPadding,

      radius:
        values.cardRadius,

      gap:
        values.cardGap,

      iconSize:
        values.headingSize + 4,

      iconRadius:
        values.cardRadius,

      titleSize:
        values.headingSize,

      subtitleSize:
        values.bodySize,

      statusSize:
        values.smallSize,

      statusPaddingX:
        10,

      statusPaddingY:
        5,

      statusMinHeight:
        24,

    },


    /* =======================================================
       PANEL
    ======================================================= */

    panel: {

      padding:
        values.cardPadding,

      radius:
        values.panelRadius,

      gap:
        values.cardGap,

      minHeight:
        values.customerCardHeight,

    },


    /* =======================================================
       BORDER
    ======================================================= */

    border: {

      width:
        1,

      radius:
        values.cardRadius,

      strongWidth:
        2,

    },


    /* =======================================================
       CONTROL
    ======================================================= */

    control: {

      height:
        values.controlHeight,

      minHeight:
        values.controlHeight,

      radius:
        values.cardRadius,

      paddingX:
        14,

      paddingY:
        8,

      gap:
        8,

    },


    /* =======================================================
       INPUT
    ======================================================= */

    input: {

      height:
        values.inputHeight,

      minHeight:
        values.inputHeight,

      radius:
        values.cardRadius,

      paddingX:
        14,

      paddingY:
        8,

      fontSize:
        values.bodySize,

      iconSize:
        values.bodySize + 4,

    },


    /* =======================================================
       BUTTON
    ======================================================= */

    button: {

      height:
        values.buttonHeight,

      minHeight:
        values.buttonHeight,

      radius:
        values.cardRadius,

      paddingX:
        16,

      paddingY:
        8,

      fontSize:
        values.labelSize,

      iconSize:
        values.labelSize + 4,

    },


    /* =======================================================
       ICON
    ======================================================= */

    icon: {

      xs:
        12,

      sm:
        16,

      md:
        20,

      lg:
        24,

      xl:
        32,

    },


    /* =======================================================
       LOGIN
       Contract compatibility only.
    ======================================================= */

    login: {

      pagePadding:
        values.pageGutter,

      cardWidth:
        "100%",

      cardMaxWidth:
        values.modalWidth,

      cardPadding:
        values.cardPadding,

      cardRadius:
        values.cardRadius,

      titleSize:
        values.titleSize,

      subtitleSize:
        values.bodySize,

      inputHeight:
        values.inputHeight,

      buttonHeight:
        values.buttonHeight,

      sectionGap:
        values.sectionGap,

    },


    /* =======================================================
       HEADER
    ======================================================= */

    header: {

      height:
        64,

      paddingX:
        values.pageGutter,

      logoHeight:
        32,

      titleSize:
        values.headingSize,

      iconSize:
        22,

      brandVisible:
        true,

    },


    /* =======================================================
       RECEPTION
       Contract compatibility only.
    ======================================================= */

    reception: {

      titleSize:
        values.titleSize,

      wallLogoSize:
        64,

      wallPadding:
        values.pageGutter,

      wallGap:
        values.sectionGap,

    },


    /* =======================================================
       SIDEBAR
    ======================================================= */

    sidebar: {

      width:
        values.sidebarWidth,

      collapsedWidth:
        72,

      padding:
        values.cardPadding,

      itemHeight:
        44,

      itemGap:
        6,

      iconSize:
        20,

      labelSize:
        values.labelSize,

    },


    /* =======================================================
       NAVIGATION
    ======================================================= */

    navigation: {

      height:
        values.navigationHeight,

      itemHeight:
        values.navigationHeight,

      gap:
        values.cardGap,

      iconSize:
        20,

      labelSize:
        values.labelSize,

    },


    /* =======================================================
       LAYOUT
    ======================================================= */

    layout: {

      pageGutter:
        values.pageGutter,

      contentGap:
        values.cardGap,

      cardGap:
        values.cardGap,

      sectionGap:
        values.sectionGap,

      maxContentWidth:
        values.wizardWidth,

      headerHeight:
        64,

      sidebarWidth:
        values.sidebarWidth,

    },


    /* =======================================================
       GRID
    ======================================================= */

    grid: {

      columns:
        values.columns,

      minCardWidth:
        values.customerCardWidth,

      gap:
        values.cardGap,

    },


    /* =======================================================
       CUSTOMER CARDS
    ======================================================= */

    customerCards: {

      columns:
        values.columns,

      width:
        values.customerCardWidth,

      minHeight:
        values.customerCardHeight,

      gap:
        values.cardGap,

      padding:
        values.cardPadding,

      radius:
        values.cardRadius,

    },


    /* =======================================================
       TABLE
    ======================================================= */

    table: {

      rowHeight:
        values.tableRowHeight,

      compactRowHeight:
        Math.max(
          32,
          values.tableRowHeight - 8,
        ),

      headerHeight:
        values.tableHeaderHeight,

      cellPaddingX:
        12,

      cellPaddingY:
        8,

      fontSize:
        values.smallSize,

    },


    /* =======================================================
       FORM
    ======================================================= */

    form: {

      fieldGap:
        12,

      rowGap:
        values.cardGap,

      sectionGap:
        values.sectionGap,

      labelSize:
        values.labelSize,

      labelGap:
        6,

      inputGap:
        8,

    },


    /* =======================================================
       WIZARD
    ======================================================= */

    wizard: {

      maxWidth:
        values.wizardWidth,

      padding:
        values.cardPadding,

      headerHeight:
        64,

      progressHeight:
        6,

      contentGap:
        values.sectionGap,

      navigationHeight:
        values.buttonHeight,

      stepGap:
        values.cardGap,

      stepIndicator:
        32,

    },


    /* =======================================================
       MODAL
    ======================================================= */

    modal: {

      width:
        values.modalWidth,

      maxWidth:
        values.modalWidth,

      padding:
        values.cardPadding,

      radius:
        values.panelRadius,

      gap:
        values.cardGap,

    },


    /* =======================================================
       DASHBOARD
    ======================================================= */

    dashboard: {

      maxWidth:
        values.wizardWidth,

      padding:
        values.pageGutter,

      cardGap:
        values.cardGap,

      columns:
        values.columns,

    },


    /* =======================================================
       PROJECTOR
       Contract compatibility only.
    ======================================================= */

    projector: {

      scale:
        1,

      pagePadding:
        values.pageGutter,

      cardGap:
        values.cardGap,

      titleSize:
        values.titleSize,

      bodySize:
        values.bodySize,

      statusSize:
        values.smallSize,

    },


    /* =======================================================
       FOOTER
    ======================================================= */

    footer: {

      height:
        64,

      minHeight:
        64,

      paddingX:
        values.pageGutter,

      paddingY:
        values.cardPadding,

      radius:
        0,

      gap:
        values.cardGap,

      fontSize:
        values.smallSize,

    },


    /* =======================================================
       IDENTITY FORM
    ======================================================= */

    identityForm: {

      wrapperGap:
        values.sectionGap,

      columnGap:
        values.cardGap,

      rowGap:
        values.cardGap,

      fieldGap:
        12,

      labelHeight:
        20,

      labelSize:
        values.labelSize,

      requiredSize:
        values.labelSize,

      inputHeight:
        values.inputHeight,

      inputRadius:
        values.cardRadius,

      inputPaddingX:
        14,

      inputFontSize:
        values.bodySize,

      checkboxSize:
        18,

      checkboxGap:
        8,

      iconSize:
        20,

      iconLeft:
        10,

      iconInputPaddingLeft:
        36,

      noteSize:
        values.smallSize,

      noteMarginTop:
        6,

    },

  };

}


/* ===========================================================
   MOBILE
=========================================================== */

export const CUSTOMER_MOBILE =
  createCustomerTokens(
    "mobile",
    CUSTOMERS_MOBILE_MIN_WIDTH,
    CUSTOMERS_MOBILE_MAX_WIDTH,
    {

      pageGutter: 16,
      sectionGap: 20,
      cardGap: 12,
      cardPadding: 16,

      titleSize: 24,
      headingSize: 20,
      bodySize: 15,
      labelSize: 14,
      smallSize: 12,

      controlHeight: 42,
      inputHeight: 44,
      buttonHeight: 44,

      cardRadius: 12,
      panelRadius: 14,

      customerCardWidth: 0,
      customerCardHeight: 164,

      columns: 1,

      tableRowHeight: 46,
      tableHeaderHeight: 46,

      sidebarWidth: 0,
      navigationHeight: 64,

      modalWidth: 360,

      wizardWidth: 600,

    },
  );


/* ===========================================================
   TABLET
=========================================================== */

export const CUSTOMER_TABLET =
  createCustomerTokens(
    "tablet",
    CUSTOMERS_TABLET_MIN_WIDTH,
    CUSTOMERS_TABLET_MAX_WIDTH,
    {

      pageGutter: 24,
      sectionGap: 24,
      cardGap: 16,
      cardPadding: 20,

      titleSize: 28,
      headingSize: 22,
      bodySize: 16,
      labelSize: 14,
      smallSize: 12,

      controlHeight: 46,
      inputHeight: 48,
      buttonHeight: 46,

      cardRadius: 14,
      panelRadius: 16,

      customerCardWidth: 280,
      customerCardHeight: 184,

      columns: 2,

      tableRowHeight: 50,
      tableHeaderHeight: 50,

      sidebarWidth: 220,
      navigationHeight: 64,

      modalWidth: 520,

      wizardWidth: 900,

    },
  );


/* ===========================================================
   LAPTOP
=========================================================== */

export const CUSTOMER_LAPTOP =
  createCustomerTokens(
    "laptop",
    CUSTOMERS_LAPTOP_MIN_WIDTH,
    CUSTOMERS_LAPTOP_MAX_WIDTH,
    {

      pageGutter: 28,
      sectionGap: 28,
      cardGap: 18,
      cardPadding: 22,

      titleSize: 30,
      headingSize: 24,
      bodySize: 16,
      labelSize: 14,
      smallSize: 12,

      controlHeight: 46,
      inputHeight: 48,
      buttonHeight: 46,

      cardRadius: 15,
      panelRadius: 17,

      customerCardWidth: 280,
      customerCardHeight: 190,

      columns: 4,

      tableRowHeight: 50,
      tableHeaderHeight: 50,

      sidebarWidth: 240,
      navigationHeight: 64,

      modalWidth: 600,

      wizardWidth: 1120,

    },
  );


/* ===========================================================
   DESKTOP
=========================================================== */

export const CUSTOMER_DESKTOP =
  createCustomerTokens(
    "desktop",
    CUSTOMERS_DESKTOP_MIN_WIDTH,
    null,
    {

      pageGutter: 32,
      sectionGap: 30,
      cardGap: 20,
      cardPadding: 24,

      titleSize: 32,
      headingSize: 26,
      bodySize: 16,
      labelSize: 15,
      smallSize: 13,

      controlHeight: 48,
      inputHeight: 50,
      buttonHeight: 48,

      cardRadius: 16,
      panelRadius: 18,

      customerCardWidth: 300,
      customerCardHeight: 200,

      columns: 4,

      tableRowHeight: 52,
      tableHeaderHeight: 52,

      sidebarWidth: 250,
      navigationHeight: 66,

      modalWidth: 640,

      wizardWidth: 1200,

    },
  );


/* ===========================================================
   CUSTOMER TOKEN MAP
=========================================================== */

export const CUSTOMER_RESPONSIVE_TOKENS:
  ResponsiveTokenMap = {

  mobile:
    CUSTOMER_MOBILE,

  tablet:
    CUSTOMER_TABLET,

  laptop:
    CUSTOMER_LAPTOP,

  desktop:
    CUSTOMER_DESKTOP,

};


/* ===========================================================
   TOKEN ACCESS BY VIEWPORT
=========================================================== */

export function getCustomerTokensByViewport(
  viewport: ResponsiveViewport,
): ResponsiveTokens {

  return CUSTOMER_RESPONSIVE_TOKENS[
    viewport
  ];

}


/* ===========================================================
   TOKEN ACCESS BY WIDTH
=========================================================== */

export function getCustomerTokens(
  width: number,
): ResponsiveTokens {

  const safeWidth =
    Number.isFinite(width)
      ? Math.max(0, width)
      : 0;


  if (
    safeWidth <=
    CUSTOMERS_MOBILE_MAX_WIDTH
  ) {

    return CUSTOMER_MOBILE;

  }


  if (
    safeWidth <=
    CUSTOMERS_TABLET_MAX_WIDTH
  ) {

    return CUSTOMER_TABLET;

  }


  if (
    safeWidth <=
    CUSTOMERS_LAPTOP_MAX_WIDTH
  ) {

    return CUSTOMER_LAPTOP;

  }


  return CUSTOMER_DESKTOP;

}


/* ===========================================================
   DEFAULT CUSTOMER TOKENS
=========================================================== */

export const DEFAULT_CUSTOMER_TOKENS:
  ResponsiveTokens =
    CUSTOMER_LAPTOP;


/* ===========================================================
   END
=========================================================== */