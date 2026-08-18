/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMERS RESPONSIVE ENGINE™

   TYPES

   RESPONSIBILITY:
   - Customers responsive contracts ONLY
   - No visual values
   - No breakpoint values
   - No device detection logic
   - No layout calculations
   - Reuse global Responsive Engine contracts where possible

   ARCHITECTURE:

   responsive/
   ├── types.ts
   ├── breakpoints.ts
   ├── tokens.ts
   ├── layout.ts
   ├── helpers.ts
   ├── useResponsive.ts
   └── index.ts

   responsive/customers/
   ├── customers.types.ts
   ├── customers.breakpoints.ts
   ├── customers.tokens.ts
   ├── customers.layout.ts
   ├── customers.helpers.ts
   ├── customers.useResponsive.ts
   └── customers.index.ts

=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  ResponsiveDevice,
  ResponsiveViewport,
  ResponsiveNumber,
  ResponsiveDimension,
  ResponsiveBoolean,
} from "../types";


/* ===========================================================
   CUSTOMER VIEW MODE
=========================================================== */

export type CustomersViewMode =
  | "cards"
  | "table";


/* ===========================================================
   CUSTOMER LIST DENSITY
=========================================================== */

export type CustomersListDensity =
  | "compact"
  | "comfortable"
  | "spacious";


/* ===========================================================
   CUSTOMER LAYOUT MODE
=========================================================== */

export type CustomersLayoutMode =
  | "singleColumn"
  | "twoColumn"
  | "grid"
  | "table";


/* ===========================================================
   CUSTOMER CARD SIZE
=========================================================== */

export type CustomersCardSize =
  | "compact"
  | "standard"
  | "large";


/* ===========================================================
   CUSTOMER BREAKPOINT KEY
=========================================================== */

export type CustomersBreakpointKey =
  | ResponsiveDevice;


/* ===========================================================
   CUSTOMER VIEWPORT KEY
=========================================================== */

export type CustomersViewportKey =
  | ResponsiveViewport;


/* ===========================================================
   CUSTOMER RESPONSIVE GRID
=========================================================== */

export interface CustomersResponsiveGrid {

  columns:
    ResponsiveNumber;

  minCardWidth:
    ResponsiveDimension;

  gap:
    ResponsiveNumber;

}


/* ===========================================================
   CUSTOMER RESPONSIVE CARD
=========================================================== */

export interface CustomersResponsiveCard {

  width:
    ResponsiveDimension;

  minWidth:
    ResponsiveNumber;

  maxWidth:
    ResponsiveNumber;

  minHeight:
    ResponsiveNumber;

  padding:
    ResponsiveNumber;

  radius:
    ResponsiveNumber;

  gap:
    ResponsiveNumber;

}


/* ===========================================================
   CUSTOMER RESPONSIVE LIST
=========================================================== */

export interface CustomersResponsiveList {

  gap:
    ResponsiveNumber;

  rowGap:
    ResponsiveNumber;

  columnGap:
    ResponsiveNumber;

  padding:
    ResponsiveNumber;

}


/* ===========================================================
   CUSTOMER RESPONSIVE SEARCH
=========================================================== */

export interface CustomersResponsiveSearch {

  width:
    ResponsiveDimension;

  height:
    ResponsiveNumber;

  minHeight:
    ResponsiveNumber;

  radius:
    ResponsiveNumber;

  paddingX:
    ResponsiveNumber;

  paddingY:
    ResponsiveNumber;

  fontSize:
    ResponsiveNumber;

  iconSize:
    ResponsiveNumber;

}


/* ===========================================================
   CUSTOMER RESPONSIVE FILTER
=========================================================== */

export interface CustomersResponsiveFilter {

  width:
    ResponsiveDimension;

  height:
    ResponsiveNumber;

  minHeight:
    ResponsiveNumber;

  radius:
    ResponsiveNumber;

  paddingX:
    ResponsiveNumber;

  paddingY:
    ResponsiveNumber;

  fontSize:
    ResponsiveNumber;

}


/* ===========================================================
   CUSTOMER RESPONSIVE TABLE
=========================================================== */

export interface CustomersResponsiveTable {

  rowHeight:
    ResponsiveNumber;

  compactRowHeight:
    ResponsiveNumber;

  headerHeight:
    ResponsiveNumber;

  cellPaddingX:
    ResponsiveNumber;

  cellPaddingY:
    ResponsiveNumber;

  fontSize:
    ResponsiveNumber;

}


/* ===========================================================
   CUSTOMER RESPONSIVE HEADER
=========================================================== */

export interface CustomersResponsiveHeader {

  height:
    ResponsiveNumber;

  paddingX:
    ResponsiveNumber;

  titleSize:
    ResponsiveNumber;

  subtitleSize:
    ResponsiveNumber;

  iconSize:
    ResponsiveNumber;

}


/* ===========================================================
   CUSTOMER RESPONSIVE ACTIONS
=========================================================== */

export interface CustomersResponsiveActions {

  height:
    ResponsiveNumber;

  minHeight:
    ResponsiveNumber;

  gap:
    ResponsiveNumber;

  paddingX:
    ResponsiveNumber;

  paddingY:
    ResponsiveNumber;

  iconSize:
    ResponsiveNumber;

  fontSize:
    ResponsiveNumber;

}


/* ===========================================================
   CUSTOMER RESPONSIVE DETAILS
=========================================================== */

export interface CustomersResponsiveDetails {

  maxWidth:
    ResponsiveNumber;

  padding:
    ResponsiveNumber;

  sectionGap:
    ResponsiveNumber;

  fieldGap:
    ResponsiveNumber;

  labelSize:
    ResponsiveNumber;

  valueSize:
    ResponsiveNumber;

}


/* ===========================================================
   CUSTOMER RESPONSIVE FORM
=========================================================== */

export interface CustomersResponsiveForm {

  maxWidth:
    ResponsiveNumber;

  fieldGap:
    ResponsiveNumber;

  rowGap:
    ResponsiveNumber;

  sectionGap:
    ResponsiveNumber;

  labelSize:
    ResponsiveNumber;

  inputGap:
    ResponsiveNumber;

}


/* ===========================================================
   CUSTOMER RESPONSIVE MODAL
=========================================================== */

export interface CustomersResponsiveModal {

  width:
    ResponsiveDimension;

  maxWidth:
    ResponsiveNumber;

  padding:
    ResponsiveNumber;

  radius:
    ResponsiveNumber;

  gap:
    ResponsiveNumber;

}


/* ===========================================================
   CUSTOMER RESPONSIVE PAGINATION
=========================================================== */

export interface CustomersResponsivePagination {

  height:
    ResponsiveNumber;

  gap:
    ResponsiveNumber;

  itemSize:
    ResponsiveNumber;

  fontSize:
    ResponsiveNumber;

}


/* ===========================================================
   CUSTOMER RESPONSIVE EMPTY STATE
=========================================================== */

export interface CustomersResponsiveEmptyState {

  padding:
    ResponsiveNumber;

  iconSize:
    ResponsiveNumber;

  titleSize:
    ResponsiveNumber;

  messageSize:
    ResponsiveNumber;

  gap:
    ResponsiveNumber;

}


/* ===========================================================
   CUSTOMER RESPONSIVE STATE
=========================================================== */

export interface CustomersResponsiveState {

  width:
    number;

  height:
    number;

  device:
    CustomersBreakpointKey;

  viewport:
    CustomersViewportKey;

  viewMode:
    CustomersViewMode;

  density:
    CustomersListDensity;

  layoutMode:
    CustomersLayoutMode;

}


/* ===========================================================
   CUSTOMER DEVICE FLAGS
=========================================================== */

export interface CustomersDeviceFlags {

  isMobile:
    boolean;

  isTablet:
    boolean;

  isLaptop:
    boolean;

  isDesktop:
    boolean;

  isWideDesktop:
    boolean;

  isUltraWide:
    boolean;

  isTv:
    boolean;

}


/* ===========================================================
   CUSTOMER RESPONSIVE FLAGS
=========================================================== */

export interface CustomersResponsiveFlags
  extends CustomersDeviceFlags {

  isCardsView:
    boolean;

  isTableView:
    boolean;

  isCompact:
    boolean;

  isComfortable:
    boolean;

  isSpacious:
    boolean;

}


/* ===========================================================
   CUSTOMER RESPONSIVE CONFIG
=========================================================== */

export interface CustomersResponsiveConfig {

  viewMode:
    CustomersViewMode;

  density:
    CustomersListDensity;

  layoutMode:
    CustomersLayoutMode;

  cardSize:
    CustomersCardSize;

}


/* ===========================================================
   CUSTOMER RESPONSIVE VALUE
=========================================================== */

export type CustomersResponsiveValue<T> =
  T
  | {
      mobile: T;
      tablet: T;
      laptop: T;
      desktop: T;
      wideDesktop: T;
      ultraWide: T;
      tv: T;
    };


/* ===========================================================
   CUSTOMER RESPONSIVE NUMBER
=========================================================== */

export type CustomersResponsiveNumber =
  CustomersResponsiveValue<number>;


/* ===========================================================
   CUSTOMER RESPONSIVE STRING
=========================================================== */

export type CustomersResponsiveString =
  CustomersResponsiveValue<string>;


/* ===========================================================
   CUSTOMER RESPONSIVE DIMENSION
=========================================================== */

export type CustomersResponsiveDimension =
  CustomersResponsiveValue<number | string>;


/* ===========================================================
   CUSTOMER RESPONSIVE BOOLEAN
=========================================================== */

export type CustomersResponsiveBoolean =
  CustomersResponsiveValue<boolean>;


/* ===========================================================
   CUSTOMER RESPONSIVE STYLE VALUE
=========================================================== */

export type CustomersResponsiveStyleValue =
  CustomersResponsiveValue<
    number | string
  >;


/* ===========================================================
   CUSTOMER RESPONSIVE RESOLVER
=========================================================== */

export type CustomersResponsiveResolver<T> =
  (
    device: CustomersBreakpointKey,
  ) => T;


/* ===========================================================
   CUSTOMER VIEWPORT RESOLVER
=========================================================== */

export type CustomersViewportResolver<T> =
  (
    width: number,
  ) => T;


/* ===========================================================
   CUSTOMER LAYOUT RESOLVER
=========================================================== */

export type CustomersLayoutResolver<T> =
  (
    width: number,
    height: number,
  ) => T;


/* ===========================================================
   CUSTOMER RESPONSIVE PROFILE
=========================================================== */

export interface CustomersResponsiveProfile {

  device:
    CustomersBreakpointKey;

  viewport:
    CustomersViewportKey;

  viewMode:
    CustomersViewMode;

  density:
    CustomersListDensity;

  layoutMode:
    CustomersLayoutMode;

  cardSize:
    CustomersCardSize;

  flags:
    CustomersResponsiveFlags;

}


/* ===========================================================
   END
=========================================================== */

