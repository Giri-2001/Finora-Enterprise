/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD LOAN RESPONSIVE TYPES

   MODULE  : Gold Loan
   LAYER   : Responsive Contracts
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Define Gold Loan responsive compatibility contracts
   - Define Gold Loan page layout contracts
   - Define Customer / Locker 30:70 layout contract
   - Define Locker / Rack responsive layout contracts
   - Define Gold Items layout contracts
   - Define Gold Valuation form layout contracts
   - Define action layout contracts

   FINORA DEVICE SYSTEM:

   01. MOBILE
   02. TABLET
   03. LAPTOP
   04. DESKTOP

   IMPORTANT:

   - No breakpoint values.
   - No visual token values.
   - No React logic.
   - No calculations.
   - No theme colors.
   - Global responsive contracts remain authoritative.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type { ResponsiveState } from "../types";

import type { ResponsiveTokens } from "../tokens";

/* ===========================================================
   RESPONSIVE DEVICE
=========================================================== */

export type GoldLoanResponsiveDevice =
  | "mobile"
  | "tablet"
  | "laptop"
  | "desktop";

/* ===========================================================
   RESPONSIVE STATE
=========================================================== */

export type GoldLoanResponsiveState = ResponsiveState;

/* ===========================================================
   RESPONSIVE TOKENS
=========================================================== */

export type GoldLoanResponsiveTokens = ResponsiveTokens;

/* ===========================================================
   VIEWPORT CONTRACT
=========================================================== */

export interface GoldLoanViewport {
  width: number;

  height: number;

  device: GoldLoanResponsiveDevice;
}

/* ===========================================================
   DEVICE FLAGS
=========================================================== */

export interface GoldLoanDeviceFlags {
  isMobile: boolean;

  isTablet: boolean;

  isLaptop: boolean;

  isDesktop: boolean;
}

/* ===========================================================
   RESPONSIVE DETAILS
=========================================================== */

export interface GoldLoanResponsiveDetails {
  viewport: GoldLoanViewport;

  flags: GoldLoanDeviceFlags;

  tokens: GoldLoanResponsiveTokens;
}

/* ===========================================================
   PAGE LAYOUT

   Owns only structural geometry consumed by:

   GoldLoanForm.tsx
=========================================================== */

export interface GoldLoanPageLayout {
  width: number | string;

  maxWidth: number | string;

  pagePadding: number;

  sectionGap: number;

  panelGap: number;

  panelRadius: number;
}

/* ===========================================================
   TOP WORKSPACE LAYOUT

   DESKTOP / LAPTOP:

   Customer Selection  = 30%
   Gold Locker Room    = 70%

   MOBILE / TABLET:

   Responsive Engine may stack or resize while preserving
   Customer Selection as the first workspace section.
=========================================================== */

export interface GoldLoanTopWorkspaceLayout {
  columns: number;

  customerWidth: number | string;

  lockerWidth: number | string;

  gap: number;

  minHeight: number;

  customerPanelHeight: number;

  lockerPanelHeight: number;

  isStacked: boolean;
}

/* ===========================================================
   CUSTOMER SELECTOR LAYOUT

   IMPORTANT:

   Gold Loan customer selector must visually align with the
   existing Loans / Collections selector.

   No additional customer widgets belong here.
=========================================================== */

export interface GoldLoanCustomerSelectorLayout {
  width: number | string;

  minHeight: number;

  padding: number;

  radius: number;

  photoSize: number;

  fieldHeight: number;

  gap: number;
}

/* ===========================================================
   LOCKER ROOM LAYOUT
=========================================================== */

export interface GoldLoanLockerRoomLayout {
  width: number | string;

  minHeight: number;

  padding: number;

  radius: number;

  headerGap: number;

  lockerGridColumns: number;

  lockerGap: number;
}

/* ===========================================================
   LOCKER CARD LAYOUT
=========================================================== */

export interface GoldLoanLockerCardLayout {
  minHeight: number;

  padding: number;

  radius: number;

  gap: number;

  statusHeight: number;

  progressHeight: number;

  viewButtonHeight: number;
}

/* ===========================================================
   RACK GRID LAYOUT

   Desired premium desktop behaviour:

   Five Rack cards per row when the available width permits.

   Tablet / Mobile will reduce column count through the
   Gold Loan responsive token resolver.
=========================================================== */

export interface GoldLoanRackGridLayout {
  columns: number;

  gap: number;

  cardMinWidth: number;

  cardMinHeight: number;
}

/* ===========================================================
   RACK CARD LAYOUT
=========================================================== */

export interface GoldLoanRackCardLayout {
  padding: number;

  radius: number;

  gap: number;

  progressHeight: number;

  actionHeight: number;
}

/* ===========================================================
   FORM LAYOUT

   Full-width Gold form begins below the top Customer /
   Locker workspace.
=========================================================== */

export interface GoldLoanFormLayout {
  width: number | string;

  sectionColumns: number;

  fieldColumns: number;

  sectionGap: number;

  rowGap: number;

  fieldGap: number;

  sectionPadding: number;

  sectionRadius: number;
}

/* ===========================================================
   VALUATION LAYOUT
=========================================================== */

export interface GoldLoanValuationLayout {
  columns: number;

  gap: number;

  summaryColumns: number;

  inputHeight: number;
}

/* ===========================================================
   GOLD ITEMS LAYOUT
=========================================================== */

export interface GoldLoanItemsLayout {
  columns: number;

  gap: number;

  itemCardMinHeight: number;

  itemCardPadding: number;

  itemCardRadius: number;

  summaryColumns: number;
}

/* ===========================================================
   STORAGE ALLOCATION LAYOUT
=========================================================== */

export interface GoldLoanStorageAllocationLayout {
  columns: number;

  gap: number;

  locatorColumns: number;

  controlHeight: number;
}

/* ===========================================================
   ACTION LAYOUT
=========================================================== */

export interface GoldLoanActionLayout {
  columns: number;

  gap: number;

  buttonHeight: number;

  isStacked: boolean;
}

/* ===========================================================
   COMPLETE GOLD LOAN LAYOUT
=========================================================== */

export interface GoldLoanLayout {
  device: GoldLoanResponsiveDevice;

  page: GoldLoanPageLayout;

  topWorkspace: GoldLoanTopWorkspaceLayout;

  customerSelector: GoldLoanCustomerSelectorLayout;

  lockerRoom: GoldLoanLockerRoomLayout;

  lockerCard: GoldLoanLockerCardLayout;

  rackGrid: GoldLoanRackGridLayout;

  rackCard: GoldLoanRackCardLayout;

  form: GoldLoanFormLayout;

  valuation: GoldLoanValuationLayout;

  items: GoldLoanItemsLayout;

  storageAllocation: GoldLoanStorageAllocationLayout;

  actions: GoldLoanActionLayout;
}

/* ===========================================================
   RESPONSIVE LAYOUT INPUT
=========================================================== */

export interface GoldLoanLayoutInput {
  width: number;

  height: number;

  tokens: GoldLoanResponsiveTokens;

  device: GoldLoanResponsiveDevice;
}

/* ===========================================================
   RESPONSIVE HOOK VALUE
=========================================================== */

export interface GoldLoanResponsiveValue {
  width: number;

  height: number;

  device: GoldLoanResponsiveDevice;

  tokens: GoldLoanResponsiveTokens;

  layout: GoldLoanLayout;

  isMobile: boolean;

  isTablet: boolean;

  isLaptop: boolean;

  isDesktop: boolean;
}

/* ===========================================================
   RESPONSIVE SNAPSHOT

   Useful outside React when only resolved geometry is needed.
=========================================================== */

export interface GoldLoanResponsiveSnapshot {
  viewport: GoldLoanViewport;

  flags: GoldLoanDeviceFlags;

  layout: GoldLoanLayout;
}

/* ===========================================================
   COMPATIBILITY VALUE TYPES
=========================================================== */

export type GoldLoanResponsiveNumber = number;

export type GoldLoanResponsiveString = string;

export type GoldLoanResponsiveBoolean = boolean;

export type GoldLoanResponsiveDimension = number | string;

/* ===========================================================
   END
=========================================================== */
