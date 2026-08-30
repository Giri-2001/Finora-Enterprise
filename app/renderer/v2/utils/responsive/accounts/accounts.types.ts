/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS RESPONSIVE TYPES

   MODULE  : Accounts
   LAYER   : Responsive Contracts
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Define Accounts responsive compatibility contracts
   - Define Accounts page geometry contracts
   - Define header / document action layout contracts
   - Define summary-grid layout contracts
   - Define filter-workspace layout contracts
   - Define desktop register layout contracts
   - Define mobile transaction-card layout contracts
   - Define pagination layout contracts
   - Define Accounts responsive hook value

   FINORA OWNER-FACING DEVICE SYSTEM:

   01. MOBILE
   02. TABLET
   03. LAPTOP
   04. DESKTOP

   IMPORTANT:

   - No breakpoint values.
   - No local breakpoint authority.
   - No visual colors.
   - No theme values.
   - No React logic.
   - No calculations.
   - No repository access.
   - No financial calculations.
   - Global FINORA Responsive Engine remains authoritative.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type { ResponsiveState } from "../types";

import type { ResponsiveTokens } from "../tokens";

/* ===========================================================
   RESPONSIVE DEVICE

   Accounts intentionally presents four owner-facing tiers.

   Global FINORA device classification remains authoritative.
=========================================================== */

export type AccountsResponsiveDevice =
  | "mobile"
  | "tablet"
  | "laptop"
  | "desktop";

/* ===========================================================
   CANONICAL RESPONSIVE STATE
=========================================================== */

export type AccountsResponsiveState = ResponsiveState;

/* ===========================================================
   CANONICAL RESPONSIVE TOKENS
=========================================================== */

export type AccountsResponsiveTokens = ResponsiveTokens;

/* ===========================================================
   VIEWPORT
=========================================================== */

export interface AccountsViewport {
  width: number;

  height: number;

  device: AccountsResponsiveDevice;
}

/* ===========================================================
   DEVICE FLAGS
=========================================================== */

export interface AccountsDeviceFlags {
  isMobile: boolean;

  isTablet: boolean;

  isLaptop: boolean;

  isDesktop: boolean;
}

/* ===========================================================
   RESPONSIVE DETAILS
=========================================================== */

export interface AccountsResponsiveDetails {
  viewport: AccountsViewport;

  flags: AccountsDeviceFlags;

  tokens: AccountsResponsiveTokens;
}

/* ===========================================================
   PAGE LAYOUT
=========================================================== */

export interface AccountsPageLayout {
  width: number | string;

  maxWidth: number | string;

  paddingX: number;

  paddingTop: number;

  paddingBottom: number;

  sectionGap: number;

  contentGap: number;
}

/* ===========================================================
   HEADER LAYOUT

   Accounts header contains:

   - Accounts identity
   - Heading / subtitle
   - PDF actions
   - Print
   - Share
   - Download

   Mobile can stack actions below heading.
=========================================================== */

export interface AccountsHeaderLayout {
  minHeight: number;

  gap: number;

  contentGap: number;

  actionGap: number;

  actionColumns: number;

  isStacked: boolean;

  iconContainerSize: number;
}

/* ===========================================================
   SUMMARY LAYOUT

   Desktop / Laptop:
   typically four summary cards.

   Tablet:
   two-column summary.

   Mobile:
   stacked or compact single-column presentation.
=========================================================== */

export interface AccountsSummaryLayout {
  columns: number;

  gap: number;

  cardMinHeight: number;

  cardPadding: number;

  cardRadius: number;

  iconSize: number;

  iconContainerSize: number;
}

/* ===========================================================
   FILTER WORKSPACE LAYOUT
=========================================================== */

export interface AccountsFiltersLayout {
  columns: number;

  gap: number;

  rowGap: number;

  panelPadding: number;

  panelRadius: number;

  controlHeight: number;

  actionHeight: number;

  actionColumns: number;

  actionGap: number;

  isStacked: boolean;
}

/* ===========================================================
   SEARCH LAYOUT
=========================================================== */

export interface AccountsSearchLayout {
  width: number | string;

  minHeight: number;

  iconSize: number;

  gap: number;
}

/* ===========================================================
   REGISTER LAYOUT

   Physical-register style Accounts table.

   Columns:

   S.No
   Date & Time
   Customer
   Activity
   Money Out
   Money In
   Method
   Reference

   Column separators and row separators are presentation
   responsibilities and consume this geometry.
=========================================================== */

export interface AccountsRegisterLayout {
  visible: boolean;

  minWidth: number;

  headerHeight: number;

  rowMinHeight: number;

  cellPaddingX: number;

  cellPaddingY: number;

  borderWidth: number;

  radius: number;

  horizontalScroll: boolean;

  serialColumnWidth: number;

  dateColumnWidth: number;

  customerColumnWidth: number;

  activityColumnWidth: number;

  moneyColumnWidth: number;

  methodColumnWidth: number;

  referenceColumnWidth: number;
}

/* ===========================================================
   MOBILE TRANSACTION CARD LAYOUT

   Used instead of the desktop register on narrow screens.

   Money Out / Money In remain visually separate.
=========================================================== */

export interface AccountsMobileCardLayout {
  visible: boolean;

  minHeight: number;

  padding: number;

  radius: number;

  gap: number;

  sectionGap: number;

  moneyColumns: number;

  moneyGap: number;

  metadataColumns: number;

  metadataGap: number;

  iconSize: number;
}

/* ===========================================================
   REGISTER SECTION LAYOUT
=========================================================== */

export interface AccountsRegisterSectionLayout {
  minHeight: number;

  panelPadding: number;

  panelRadius: number;

  headerGap: number;

  contentGap: number;
}

/* ===========================================================
   DOCUMENT ACTIONS LAYOUT
=========================================================== */

export interface AccountsDocumentActionsLayout {
  columns: number;

  gap: number;

  buttonHeight: number;

  buttonMinWidth: number;

  isStacked: boolean;

  iconSize: number;
}

/* ===========================================================
   PAGINATION LAYOUT
=========================================================== */

export interface AccountsPaginationLayout {
  minHeight: number;

  gap: number;

  controlGap: number;

  controlHeight: number;

  isStacked: boolean;
}

/* ===========================================================
   EMPTY STATE LAYOUT
=========================================================== */

export interface AccountsEmptyStateLayout {
  minHeight: number;

  padding: number;

  gap: number;

  iconSize: number;
}

/* ===========================================================
   COMPLETE ACCOUNTS LAYOUT
=========================================================== */

export interface AccountsLayout {
  device: AccountsResponsiveDevice;

  page: AccountsPageLayout;

  header: AccountsHeaderLayout;

  summary: AccountsSummaryLayout;

  filters: AccountsFiltersLayout;

  search: AccountsSearchLayout;

  registerSection: AccountsRegisterSectionLayout;

  register: AccountsRegisterLayout;

  mobileCard: AccountsMobileCardLayout;

  documentActions: AccountsDocumentActionsLayout;

  pagination: AccountsPaginationLayout;

  emptyState: AccountsEmptyStateLayout;
}

/* ===========================================================
   LAYOUT INPUT

   Global FINORA responsive state supplies:

   - live width
   - live height
   - canonical responsive tokens

   Accounts adds only its resolved four-tier presentation mode.
=========================================================== */

export interface AccountsLayoutInput {
  width: number;

  height: number;

  tokens: AccountsResponsiveTokens;

  device: AccountsResponsiveDevice;
}

/* ===========================================================
   RESPONSIVE HOOK VALUE
=========================================================== */

export interface AccountsResponsiveValue {
  width: number;

  height: number;

  device: AccountsResponsiveDevice;

  tokens: AccountsResponsiveTokens;

  layout: AccountsLayout;

  isMobile: boolean;

  isTablet: boolean;

  isLaptop: boolean;

  isDesktop: boolean;
}

/* ===========================================================
   RESPONSIVE SNAPSHOT

   Useful for non-component consumers requiring resolved
   structural geometry without duplicating layout contracts.
=========================================================== */

export interface AccountsResponsiveSnapshot {
  viewport: AccountsViewport;

  flags: AccountsDeviceFlags;

  layout: AccountsLayout;
}

/* ===========================================================
   COMPATIBILITY VALUE TYPES
=========================================================== */

export type AccountsResponsiveNumber = number;

export type AccountsResponsiveString = string;

export type AccountsResponsiveBoolean = boolean;

export type AccountsResponsiveDimension = number | string;

/* ===========================================================
   END
=========================================================== */
