/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   CUSTOMERS LAYOUT ENGINE

   RESPONSIBILITY:
   - Customers module layout calculations ONLY
   - Consume Customers responsive tokens
   - Consume Customers breakpoint helpers
   - No hardcoded viewport detection outside this engine
   - No component/page styling
   - No React dependencies

   ARCHITECTURE:

   types.ts
        ↓
   customers.breakpoints.ts
        ↓
   customers.helpers.ts
        ↓
   customers.tokens.ts
        ↓
   customers.layout.ts

   IMPORTANT:
   - Global responsive contracts come from ../types
   - Customer visual values come from customers.tokens.ts
   - Layout calculations live ONLY in this file
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  ResponsiveDevice,
  ResponsiveState,
} from "../types";

import type {
  ResponsiveTokens,
} from "../tokens";


import {
  getCustomerResponsiveProfile,
  resolveCustomerDevice,
} from "./customers.helpers";


import {
  getCustomerTokens,
} from "./customers.tokens";


/* ===========================================================
   CUSTOMER TYPE ALIASES
=========================================================== */

/*
 * Compatibility aliases for the Customers layout engine.
 *
 * The central Responsive Engine owns the responsive contracts.
 * These aliases keep the Customers layout API readable without
 * creating duplicate responsive contracts.
 */

export type CustomerResponsiveDevice =
  ResponsiveDevice;


export type CustomerResponsiveState =
  ReturnType<
    typeof getCustomerResponsiveProfile
  >;


export type CustomerResponsiveTokens =
  ResponsiveTokens;


/* ===========================================================
   CUSTOMER PAGE LAYOUT
=========================================================== */

export interface CustomerPageLayout {

  padding:
    number;

  maxWidth:
    number;

  gap:
    number;

  sectionGap:
    number;

}


/* ===========================================================
   CUSTOMER GRID LAYOUT
=========================================================== */

export interface CustomerGridLayout {

  columns:
    number;

  gap:
    number;

  minCardWidth:
    number;

}


/* ===========================================================
   CUSTOMER CARD LAYOUT
=========================================================== */

export interface CustomerCardLayout {

  width:
    number;

  minHeight:
    number;

  padding:
    number;

  radius:
    number;

  gap:
    number;

}


/* ===========================================================
   CUSTOMER TABLE LAYOUT
=========================================================== */

export interface CustomerTableLayout {

  rowHeight:
    number;

  compactRowHeight:
    number;

  headerHeight:
    number;

  cellPaddingX:
    number;

  cellPaddingY:
    number;

  fontSize:
    number;

}


/* ===========================================================
   CUSTOMER FORM LAYOUT
=========================================================== */

export interface CustomerFormLayout {

  fieldGap:
    number;

  rowGap:
    number;

  sectionGap:
    number;

  labelSize:
    number;

  labelGap:
    number;

  inputGap:
    number;

}


/* ===========================================================
   COMPLETE CUSTOMER LAYOUT
=========================================================== */

export interface CustomerLayout {

  page:
    CustomerPageLayout;

  grid:
    CustomerGridLayout;

  card:
    CustomerCardLayout;

  table:
    CustomerTableLayout;

  form:
    CustomerFormLayout;

}


/* ===========================================================
   CUSTOMER LAYOUT INPUT
=========================================================== */

export interface CustomerLayoutInput {

  width:
    number;

  height:
    number;

}


/* ===========================================================
   SAFE WIDTH
=========================================================== */

export function getSafeCustomerWidth(
  width: number,
): number {

  if (
    !Number.isFinite(width)
  ) {

    return 0;

  }

  return Math.max(
    0,
    width,
  );

}


/* ===========================================================
   SAFE HEIGHT
=========================================================== */

export function getSafeCustomerHeight(
  height: number,
): number {

  if (
    !Number.isFinite(height)
  ) {

    return 0;

  }

  return Math.max(
    0,
    height,
  );

}


/* ===========================================================
   CUSTOMER RESPONSIVE STATE
=========================================================== */

export function resolveCustomerLayoutState(
  width: number,
  height: number,
) {

  const safeWidth =
    getSafeCustomerWidth(width);

  const safeHeight =
    getSafeCustomerHeight(height);

  return {
    width:
      safeWidth,

    height:
      safeHeight,

    ...getCustomerResponsiveProfile(
      safeWidth,
    ),
  };

}

/* ===========================================================
   CUSTOMER TOKENS
=========================================================== */

export function resolveCustomerLayoutTokens(
  width: number,
): CustomerResponsiveTokens {

  const safeWidth =
    getSafeCustomerWidth(
      width,
    );

  return getCustomerTokens(
    safeWidth,
  );

}


/* ===========================================================
   CUSTOMER DEVICE
=========================================================== */

export function resolveCustomerLayoutDevice(
  width: number,
): CustomerResponsiveDevice {

  const safeWidth =
    getSafeCustomerWidth(
      width,
    );

  return resolveCustomerDevice(
    safeWidth,
  );

}


/* ===========================================================
   PAGE LAYOUT
=========================================================== */

export function getCustomerPageLayout(
  tokens: CustomerResponsiveTokens,
): CustomerPageLayout {

  return {

    padding:
      tokens.layout.pageGutter,

    maxWidth:
      tokens.layout.maxContentWidth,

    gap:
      tokens.layout.contentGap,

    sectionGap:
      tokens.layout.sectionGap,

  };

}


/* ===========================================================
   CUSTOMER GRID LAYOUT
=========================================================== */

export function getCustomerGridLayout(
  tokens: CustomerResponsiveTokens,
): CustomerGridLayout {

  return {

    columns:
      tokens.customerCards.columns,

    gap:
      tokens.customerCards.gap,

    minCardWidth:
      tokens.customerCards.width,

  };

}


/* ===========================================================
   CUSTOMER CARD LAYOUT
=========================================================== */

export function getCustomerCardLayout(
  tokens: CustomerResponsiveTokens,
): CustomerCardLayout {

  return {

    width:
      tokens.customerCards.width,

    minHeight:
      tokens.customerCards.minHeight,

    padding:
      tokens.customerCards.padding,

    radius:
      tokens.customerCards.radius,

    gap:
      tokens.customerCards.gap,

  };

}


/* ===========================================================
   CUSTOMER TABLE LAYOUT
=========================================================== */

export function getCustomerTableLayout(
  tokens: CustomerResponsiveTokens,
): CustomerTableLayout {

  return {

    rowHeight:
      tokens.table.rowHeight,

    compactRowHeight:
      tokens.table.compactRowHeight,

    headerHeight:
      tokens.table.headerHeight,

    cellPaddingX:
      tokens.table.cellPaddingX,

    cellPaddingY:
      tokens.table.cellPaddingY,

    fontSize:
      tokens.table.fontSize,

  };

}


/* ===========================================================
   CUSTOMER FORM LAYOUT
=========================================================== */

export function getCustomerFormLayout(
  tokens: CustomerResponsiveTokens,
): CustomerFormLayout {

  return {

    fieldGap:
      tokens.form.fieldGap,

    rowGap:
      tokens.form.rowGap,

    sectionGap:
      tokens.form.sectionGap,

    labelSize:
      tokens.form.labelSize,

    labelGap:
      tokens.form.labelGap,

    inputGap:
      tokens.form.inputGap,

  };

}


/* ===========================================================
   CUSTOMER COMPLETE LAYOUT
=========================================================== */

export function getCustomerLayout(
  width: number,
): CustomerLayout {

  const tokens =
    resolveCustomerLayoutTokens(
      width,
    );

  return {

    page:
      getCustomerPageLayout(
        tokens,
      ),

    grid:
      getCustomerGridLayout(
        tokens,
      ),

    card:
      getCustomerCardLayout(
        tokens,
      ),

    table:
      getCustomerTableLayout(
        tokens,
      ),

    form:
      getCustomerFormLayout(
        tokens,
      ),

  };

}


/* ===========================================================
   CUSTOMER RESPONSIVE LAYOUT
=========================================================== */

export function getCustomerResponsiveLayout(
  width: number,
  height: number,
): CustomerLayout & {

  device:
    CustomerResponsiveDevice;

  state:
    CustomerResponsiveState;

} {

  const state =
    resolveCustomerLayoutState(
      width,
      height,
    );

  const layout =
    getCustomerLayout(
      width,
    );

  return {

    ...layout,

    device:
      state.device,

    state,

  };

}


/* ===========================================================
   CUSTOMER CONTENT WIDTH
=========================================================== */

export function getCustomerContentWidth(
  width: number,
  tokens: CustomerResponsiveTokens,
): number {

  const safeWidth =
    getSafeCustomerWidth(
      width,
    );

  const pagePadding =
    tokens.layout.pageGutter;

  const maxContentWidth =
    tokens.layout.maxContentWidth;

  const availableWidth =
    Math.max(
      0,
      safeWidth -
        pagePadding * 2,
    );

  return Math.min(
    availableWidth,
    maxContentWidth,
  );

}


/* ===========================================================
   CUSTOMER GRID WIDTH
=========================================================== */

export function getCustomerGridWidth(
  width: number,
  tokens: CustomerResponsiveTokens,
): number {

  return getCustomerContentWidth(
    width,
    tokens,
  );

}


/* ===========================================================
   CUSTOMER CARD WIDTH
=========================================================== */

export function getCustomerCardWidth(
  width: number,
  tokens: CustomerResponsiveTokens,
): number {

  const gridWidth =
    getCustomerGridWidth(
      width,
      tokens,
    );

  const columns =
    Math.max(
      1,
      tokens.customerCards.columns,
    );

  const gap =
    Math.max(
      0,
      tokens.customerCards.gap,
    );

  const totalGap =
    Math.max(
      0,
      columns - 1,
    ) * gap;

  const availableWidth =
    Math.max(
      0,
      gridWidth -
        totalGap,
    );

  return Math.max(
    tokens.customerCards.width,
    availableWidth / columns,
  );

}


/* ===========================================================
   CUSTOMER CARD COUNT
=========================================================== */

export function getCustomerGridColumnCount(
  tokens: CustomerResponsiveTokens,
): number {

  return Math.max(
    1,
    Math.floor(
      tokens.customerCards.columns,
    ),
  );

}


/* ===========================================================
   CUSTOMER GRID TOTAL HEIGHT
=========================================================== */

export function getCustomerGridHeight(
  rowCount: number,
  cardHeight: number,
  tokens: CustomerResponsiveTokens,
): number {

  const safeRows =
    Math.max(
      0,
      Math.floor(
        rowCount,
      ),
    );

  const safeCardHeight =
    Math.max(
      0,
      cardHeight,
    );

  const rows =
    Math.ceil(
      safeRows /
        getCustomerGridColumnCount(
          tokens,
        ),
    );

  const gap =
    Math.max(
      0,
      tokens.customerCards.gap,
    );

  const totalGap =
    Math.max(
      0,
      rows - 1,
    ) * gap;

  return (
    rows *
      safeCardHeight +
    totalGap
  );

}


/* ===========================================================
   CUSTOMER LIST MINIMUM HEIGHT
=========================================================== */

export function getCustomerListMinimumHeight(
  tokens: CustomerResponsiveTokens,
): number {

  return Math.max(
    tokens.customerCards.minHeight,
    tokens.table.rowHeight,
  );

}


/* ===========================================================
   CUSTOMER FORM WIDTH
=========================================================== */

export function getCustomerFormWidth(
  width: number,
  tokens: CustomerResponsiveTokens,
): number {

  return getCustomerContentWidth(
    width,
    tokens,
  );

}


/* ===========================================================
   CUSTOMER TABLE WIDTH
=========================================================== */

export function getCustomerTableWidth(
  width: number,
  tokens: CustomerResponsiveTokens,
): number {

  return getCustomerContentWidth(
    width,
    tokens,
  );

}


/* ===========================================================
   CUSTOMER LAYOUT WIDTH VALIDATION
=========================================================== */

export function isValidCustomerLayoutWidth(
  width: number,
): boolean {

  return (
    Number.isFinite(width) &&
    width >= 0
  );

}


/* ===========================================================
   CUSTOMER LAYOUT HEIGHT VALIDATION
=========================================================== */

export function isValidCustomerLayoutHeight(
  height: number,
): boolean {

  return (
    Number.isFinite(height) &&
    height >= 0
  );

}


/* ===========================================================
   CUSTOMER LAYOUT SNAPSHOT
=========================================================== */

export function createCustomerLayoutSnapshot(
  width: number,
  height: number,
): CustomerLayout & {

  device:
    CustomerResponsiveDevice;

  state:
    CustomerResponsiveState;

} {

  if (
    !isValidCustomerLayoutWidth(
      width,
    ) ||
    !isValidCustomerLayoutHeight(
      height,
    )
  ) {

    const safeWidth =
      getSafeCustomerWidth(
        width,
      );

    const safeHeight =
      getSafeCustomerHeight(
        height,
      );

    return getCustomerResponsiveLayout(
      safeWidth,
      safeHeight,
    );

  }

  return getCustomerResponsiveLayout(
    width,
    height,
  );

}


/* ===========================================================
   END
=========================================================== */