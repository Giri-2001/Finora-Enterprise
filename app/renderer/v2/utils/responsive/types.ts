/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   TYPES

   RESPONSIBILITY:
   - Responsive type contracts ONLY
   - No visual values
   - No breakpoint values
   - No device detection logic
   - No layout calculations

   DEVICE SYSTEM:

   01. MOBILE
   02. TABLET
   03. LAPTOP
   04. DESKTOP

   IMPORTANT:
   - ResponsiveViewport uses the same 4-device system.
   - No wideDesktop.
   - No ultraWide.
   - No tv.
   - No extra viewport classifications.
=========================================================== */

import type { ResponsiveTokens } from "./tokens";


/* ===========================================================
   HIGH-LEVEL DEVICE TYPE
=========================================================== */

export type DeviceType =
  | "mobile"
  | "tablet"
  | "laptop"
  | "desktop";


/* ===========================================================
   RESPONSIVE DEVICE
=========================================================== */

export type ResponsiveDevice =
  DeviceType;


/* ===========================================================
   DEVICE INDEX
=========================================================== */

export type ResponsiveDeviceIndex =
  | 0
  | 1
  | 2
  | 3;


/* ===========================================================
   RESPONSIVE VIEWPORT

   Same 4-device classification.
=========================================================== */

export type ResponsiveViewport =
  | "mobile"
  | "tablet"
  | "laptop"
  | "desktop";


/* ===========================================================
   VIEWPORT SIZE
=========================================================== */

export interface ViewportSize {

  width:
    number;

  height:
    number;

}


/* ===========================================================
   RESPONSIVE BREAKPOINT
=========================================================== */

export interface ResponsiveBreakpoint {

  minWidth:
    number;

  maxWidth:
    number | null;

}


/* ===========================================================
   RESPONSIVE BREAKPOINT MAP
=========================================================== */

export type ResponsiveBreakpointMap = {

  [device in DeviceType]:
    ResponsiveBreakpoint;

};


/* ===========================================================
   RESPONSIVE META
=========================================================== */

export interface ResponsiveTokenMeta {

  name:
    string;

  viewport:
    ResponsiveViewport;

  minWidth:
    number;

  maxWidth:
    number | null;

}


/* ===========================================================
   TYPOGRAPHY
=========================================================== */

export interface ResponsiveTypography {

  display:
    number;

  title:
    number;

  heading:
    number;

  subheading:
    number;

  body:
    number;

  label:
    number;

  small:
    number;

  caption:
    number;

  button:
    number;

  input:
    number;

  table:
    number;

  navigation:
    number;

}


/* ===========================================================
   LINE HEIGHT
=========================================================== */

export interface ResponsiveLineHeight {

  display:
    number;

  title:
    number;

  heading:
    number;

  body:
    number;

  compact:
    number;

}


/* ===========================================================
   SPACING
=========================================================== */

export interface ResponsiveSpacing {

  page:
    number;

  section:
    number;

  card:
    number;

  control:
    number;

  inline:
    number;

  small:
    number;

  medium:
    number;

  large:
    number;

  xlarge:
    number;

  xxlarge:
    number;

}


/* ===========================================================
   CARD
=========================================================== */

export interface ResponsiveCard {

  width:
    number | string;

  minWidth:
    number;

  maxWidth:
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
   DEPARTMENT DOOR
=========================================================== */

export interface ResponsiveDoor {

  width:
    number | string;

  height:
    number;

  padding:
    number;

  radius:
    number;

  gap:
    number;

  iconSize:
    number;

  iconRadius:
    number;

  titleSize:
    number;

  subtitleSize:
    number;

  statusSize:
    number;

  statusPaddingX:
    number;

  statusPaddingY:
    number;

  statusMinHeight:
    number;

}


/* ===========================================================
   PANEL
=========================================================== */

export interface ResponsivePanel {

  padding:
    number;

  radius:
    number;

  gap:
    number;

  minHeight:
    number;

}


/* ===========================================================
   BORDER
=========================================================== */

export interface ResponsiveBorder {

  width:
    number;

  radius:
    number;

  strongWidth:
    number;

}


/* ===========================================================
   CONTROL
=========================================================== */

export interface ResponsiveControl {

  height:
    number;

  minHeight:
    number;

  radius:
    number;

  paddingX:
    number;

  paddingY:
    number;

  gap:
    number;

}


/* ===========================================================
   INPUT
=========================================================== */

export interface ResponsiveInput {

  height:
    number;

  minHeight:
    number;

  radius:
    number;

  paddingX:
    number;

  paddingY:
    number;

  fontSize:
    number;

  iconSize:
    number;

}


/* ===========================================================
   BUTTON
=========================================================== */

export interface ResponsiveButton {

  height:
    number;

  minHeight:
    number;

  radius:
    number;

  paddingX:
    number;

  paddingY:
    number;

  fontSize:
    number;

  iconSize:
    number;

}


/* ===========================================================
   ICON
=========================================================== */

export interface ResponsiveIcon {

  xs:
    number;

  sm:
    number;

  md:
    number;

  lg:
    number;

  xl:
    number;

}


/* ===========================================================
   LOGIN
=========================================================== */

export interface ResponsiveLogin {

  pagePadding:
    number;

  cardWidth:
    number | string;

  cardMaxWidth:
    number;

  cardPadding:
    number;

  cardRadius:
    number;

  titleSize:
    number;

  subtitleSize:
    number;

  inputHeight:
    number;

  buttonHeight:
    number;

  sectionGap:
    number;

}


/* ===========================================================
   HEADER
=========================================================== */

export interface ResponsiveHeader {

  visible:
    boolean;

  height:
    number;

  paddingX:
    number;

  logoHeight:
    number;

  titleSize:
    number;

  iconSize:
    number;

  brandVisible:
    boolean;

}


/* ===========================================================
   RECEPTION
=========================================================== */

export interface ResponsiveReception {

  titleSize:
    number;

  wallLogoSize:
    number;

  wallPadding:
    number;

  wallGap:
    number;

}


/* ===========================================================
   SIDEBAR
=========================================================== */

export interface ResponsiveSidebar {

  width:
    number;

  collapsedWidth:
    number;

  padding:
    number;

  itemHeight:
    number;

  itemGap:
    number;

  iconSize:
    number;

  labelSize:
    number;

}


/* ===========================================================
   NAVIGATION
=========================================================== */

export interface ResponsiveNavigation {

  height:
    number;

  itemHeight:
    number;

  gap:
    number;

  iconSize:
    number;

  labelSize:
    number;

}


/* ===========================================================
   LAYOUT
=========================================================== */

export interface ResponsiveLayout {

  pageGutter:
    number;

  contentGap:
    number;

  cardGap:
    number;

  sectionGap:
    number;

  maxContentWidth:
    number;

  headerHeight:
    number;

  sidebarWidth:
    number;

}


/* ===========================================================
   GRID
=========================================================== */

export interface ResponsiveGrid {

  columns:
    number;

  minCardWidth:
    number;

  gap:
    number;

}


/* ===========================================================
   CUSTOMER CARDS
=========================================================== */

export interface ResponsiveCustomerCards {

  columns:
    number;

  width:
    number;

  minHeight:
    number;

  gap:
    number;

  padding:
    number;

  radius:
    number;

}


/* ===========================================================
   TABLE
=========================================================== */

export interface ResponsiveTable {

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
   FORM
=========================================================== */

export interface ResponsiveForm {

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
   WIZARD
=========================================================== */

export interface ResponsiveWizard {

  maxWidth:
    number;

  padding:
    number;

  headerHeight:
    number;

  progressHeight:
    number;

  contentGap:
    number;

  navigationHeight:
    number;

  stepGap:
    number;

  stepIndicator:
    number;

}


/* ===========================================================
   MODAL
=========================================================== */

export interface ResponsiveModal {

  width:
    number;

  maxWidth:
    number;

  padding:
    number;

  radius:
    number;

  gap:
    number;

}


/* ===========================================================
   DASHBOARD
=========================================================== */

export interface ResponsiveDashboard {

  maxWidth:
    number;

  padding:
    number;

  cardGap:
    number;

  columns:
    number;

}


/* ===========================================================
   PROJECTOR
=========================================================== */

export interface ResponsiveProjector {

  scale:
    number;

  pagePadding:
    number;

  cardGap:
    number;

  titleSize:
    number;

  bodySize:
    number;

  statusSize:
    number;

}


/* ===========================================================
   TOKEN MAP
=========================================================== */

export type ResponsiveTokenMap = {

  [viewport in ResponsiveViewport]:
    ResponsiveTokens;

};


/* ===========================================================
   TOKEN RESOLVER
=========================================================== */

export type ResponsiveTokenResolver =
  (
    device: ResponsiveDevice,
  ) => ResponsiveTokens;


/* ===========================================================
   VIEWPORT TOKEN RESOLVER
=========================================================== */

export type ResponsiveViewportTokenResolver =
  (
    width: number,
  ) => ResponsiveTokens;


/* ===========================================================
   DEVICE FLAGS
=========================================================== */

export interface ResponsiveDeviceFlags {

  isMobile:
    boolean;

  isTablet:
    boolean;

  isLaptop:
    boolean;

  isDesktop:
    boolean;

}


/* ===========================================================
   RESPONSIVE STATE
=========================================================== */

export interface ResponsiveState
  extends ResponsiveDeviceFlags {

  width:
    number;

  height:
    number;

  device:
    DeviceType;

  viewport:
    ResponsiveViewport;

  tokens:
    ResponsiveTokens;

}


/* ===========================================================
   RESPONSIVE VALUE
=========================================================== */

export type ResponsiveValue<T> =
  T
  | {
      mobile: T;
      tablet: T;
      laptop: T;
      desktop: T;
    };


/* ===========================================================
   RESPONSIVE NUMBER
=========================================================== */

export type ResponsiveNumber =
  ResponsiveValue<number>;


/* ===========================================================
   RESPONSIVE STRING
=========================================================== */

export type ResponsiveString =
  ResponsiveValue<string>;


/* ===========================================================
   RESPONSIVE DIMENSION
=========================================================== */

export type ResponsiveDimension =
  ResponsiveValue<number | string>;


/* ===========================================================
   RESPONSIVE BOOLEAN
=========================================================== */

export type ResponsiveBoolean =
  ResponsiveValue<boolean>;


/* ===========================================================
   CSS VALUE
=========================================================== */

export type ResponsiveCssValue =
  number | string;


/* ===========================================================
   RESPONSIVE STYLE VALUE
=========================================================== */

export type ResponsiveStyleValue =
  ResponsiveValue<ResponsiveCssValue>;


/* ===========================================================
   END
=========================================================== */