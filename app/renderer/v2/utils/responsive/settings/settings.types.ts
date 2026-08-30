/* ===========================================================
   FINORA ENTERPRISE OS™

   ENTERPRISE SETTINGS

   SETTINGS RESPONSIVE TYPES

   MODULE  : Settings
   LAYER   : Responsive Contracts
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Define Settings responsive device contract
   - Define Settings module token contracts
   - Define Settings structural layout contracts
   - Define complete Settings responsive value
   - Reuse canonical FINORA Responsive Engine types

   DEVICE SYSTEM:

   mobile
   tablet
   laptop
   desktop

   IMPORTANT:

   - TYPES ONLY.
   - No breakpoint values.
   - No visual color values.
   - No theme values.
   - No layout calculations.
   - No React component.
   - No CSS variable publication.
   - No persistence.
=========================================================== */

import type {
  DeviceType,
  ResponsiveTokens,
} from "../types";

/* ===========================================================
   DEVICE
=========================================================== */

export type SettingsResponsiveDevice =
  DeviceType;

/* ===========================================================
   TYPOGRAPHY TOKENS
=========================================================== */

export interface SettingsTypographyTokens {
  pageTitle:
    number;

  pageSubtitle:
    number;

  eyebrow:
    number;

  navigationTitle:
    number;

  navigationLabel:
    number;

  navigationDescription:
    number;

  sectionTitle:
    number;

  sectionSubtitle:
    number;

  fieldLabel:
    number;

  fieldText:
    number;

  helperText:
    number;

  buttonText:
    number;

  feedbackTitle:
    number;

  feedbackMessage:
    number;

  photoTitle:
    number;

  photoDescription:
    number;
}

/* ===========================================================
   SPACING TOKENS
=========================================================== */

export interface SettingsSpacingTokens {
  pageX:
    number;

  pageTop:
    number;

  pageBottom:
    number;

  sectionGap:
    number;

  contentGap:
    number;

  panelGap:
    number;

  fieldGap:
    number;

  rowGap:
    number;

  compactGap:
    number;
}

/* ===========================================================
   CONTROL TOKENS
=========================================================== */

export interface SettingsControlTokens {
  inputHeight:
    number;

  buttonHeight:
    number;

  compactButtonHeight:
    number;

  inputRadius:
    number;

  buttonRadius:
    number;

  inputPaddingX:
    number;

  buttonPaddingX:
    number;

  iconSize:
    number;

  compactIconSize:
    number;
}

/* ===========================================================
   PANEL TOKENS
=========================================================== */

export interface SettingsPanelTokens {
  radius:
    number;

  compactRadius:
    number;

  borderWidth:
    number;

  padding:
    number;

  compactPadding:
    number;
}

/* ===========================================================
   NAVIGATION TOKENS
=========================================================== */

export interface SettingsNavigationTokens {
  width:
    number;

  itemMinHeight:
    number;

  itemRadius:
    number;

  itemPadding:
    number;

  iconContainerSize:
    number;

  iconSize:
    number;

  indicatorWidth:
    number;
}

/* ===========================================================
   HEADER TOKENS
=========================================================== */

export interface SettingsHeaderTokens {
  minHeight:
    number;

  iconContainerSize:
    number;

  iconSize:
    number;

  gap:
    number;
}

/* ===========================================================
   FORM TOKENS
=========================================================== */

export interface SettingsFormTokens {
  fieldMinWidth:
    number;

  textareaMinHeight:
    number;

  actionGap:
    number;

  sectionMinHeight:
    number;
}

/* ===========================================================
   PHOTO TOKENS
=========================================================== */

export interface SettingsPhotoTokens {
  previewWidth:
    number;

  previewHeight:
    number;

  previewRadius:
    number;

  gridGap:
    number;

  uploadMinHeight:
    number;

  removeHeight:
    number;

  badgeSize:
    number;
}

/* ===========================================================
   COMPLETE MODULE TOKENS
=========================================================== */

export interface SettingsModuleTokens {
  fontFamily:
    string;

  typography:
    SettingsTypographyTokens;

  spacing:
    SettingsSpacingTokens;

  control:
    SettingsControlTokens;

  panel:
    SettingsPanelTokens;

  navigation:
    SettingsNavigationTokens;

  header:
    SettingsHeaderTokens;

  form:
    SettingsFormTokens;

  photo:
    SettingsPhotoTokens;
}

/* ===========================================================
   PAGE LAYOUT
=========================================================== */

export interface SettingsPageLayout {
  width:
    number | string;

  maxWidth:
    number | string;

  paddingX:
    number;

  paddingTop:
    number;

  paddingBottom:
    number;

  sectionGap:
    number;
}

/* ===========================================================
   WORKSPACE LAYOUT
=========================================================== */

export interface SettingsWorkspaceLayout {
  columns:
    string;

  gap:
    number;

  navigationSticky:
    boolean;

  navigationTop:
    number;
}

/* ===========================================================
   NAVIGATION LAYOUT
=========================================================== */

export interface SettingsNavigationLayout {
  width:
    number | string;

  minHeight:
    number;

  gap:
    number;

  itemMinHeight:
    number;

  stacked:
    boolean;
}

/* ===========================================================
   HEADER LAYOUT
=========================================================== */

export interface SettingsHeaderLayout {
  minHeight:
    number;

  gap:
    number;

  iconContainerSize:
    number;

  stacked:
    boolean;
}

/* ===========================================================
   CONTENT LAYOUT
=========================================================== */

export interface SettingsContentLayout {
  minWidth:
    number;

  gap:
    number;

  panelPadding:
    number;

  panelRadius:
    number;
}

/* ===========================================================
   FORM LAYOUT
=========================================================== */

export interface SettingsFormLayout {
  columns:
    number;

  gap:
    number;

  rowGap:
    number;

  actionsStacked:
    boolean;
}

/* ===========================================================
   PHOTO LAYOUT
=========================================================== */

export interface SettingsPhotoLayout {
  columns:
    number;

  gap:
    number;

  previewWidth:
    number;

  previewHeight:
    number;

  actionsStacked:
    boolean;
}

/* ===========================================================
   COMPLETE SETTINGS LAYOUT
=========================================================== */

export interface SettingsLayout {
  device:
    SettingsResponsiveDevice;

  page:
    SettingsPageLayout;

  workspace:
    SettingsWorkspaceLayout;

  navigation:
    SettingsNavigationLayout;

  header:
    SettingsHeaderLayout;

  content:
    SettingsContentLayout;

  form:
    SettingsFormLayout;

  photo:
    SettingsPhotoLayout;
}

/* ===========================================================
   LAYOUT INPUT
=========================================================== */

export interface SettingsLayoutInput {
  width:
    number;

  height:
    number;

  device:
    SettingsResponsiveDevice;

  tokens:
    ResponsiveTokens;
}

/* ===========================================================
   COMPLETE RESPONSIVE VALUE
=========================================================== */

export interface SettingsResponsiveValue {
  width:
    number;

  height:
    number;

  device:
    SettingsResponsiveDevice;

  tokens:
    ResponsiveTokens;

  moduleTokens:
    SettingsModuleTokens;

  layout:
    SettingsLayout;

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
   END
=========================================================== */
