/* ===========================================================
   FINORA ENTERPRISE OS™

   ENTERPRISE SETTINGS

   SETTINGS RESPONSIVE TOKENS

   MODULE  : Settings
   LAYER   : Responsive Module Tokens
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Define Settings typography sizing
   - Define Settings spacing sizing
   - Define Settings control sizing
   - Define Settings navigation sizing
   - Define Settings header sizing
   - Define Settings form sizing
   - Define Settings photo sizing
   - Resolve module tokens from canonical FINORA device tier

   DEVICE SYSTEM:

   mobile
   tablet
   laptop
   desktop

   IMPORTANT:

   - No breakpoint boundaries.
   - No viewport classification.
   - No @media queries.
   - No theme colors.
   - No React.
   - No repository access.
   - No business logic.
   - Global FINORA Responsive Engine remains authoritative.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import {
  SETTINGS_FONT_FAMILY,
} from "../../../constants/settings/settings.constants";

import type {
  SettingsModuleTokens,
  SettingsResponsiveDevice,
} from "./settings.types";

/* ===========================================================
   MOBILE
=========================================================== */

const MOBILE_TOKENS:
  SettingsModuleTokens = {

  fontFamily:
    SETTINGS_FONT_FAMILY,

  typography: {
    pageTitle: 22,
    pageSubtitle: 12,
    eyebrow: 10,

    navigationTitle: 17,
    navigationLabel: 14,
    navigationDescription: 11,

    sectionTitle: 17,
    sectionSubtitle: 12,

    fieldLabel: 12,
    fieldText: 14,
    helperText: 11,

    buttonText: 13,

    feedbackTitle: 13,
    feedbackMessage: 12,

    photoTitle: 14,
    photoDescription: 11,
  },

  spacing: {
    pageX: 14,
    pageTop: 16,
    pageBottom: 24,

    sectionGap: 18,
    contentGap: 14,
    panelGap: 12,

    fieldGap: 10,
    rowGap: 10,
    compactGap: 6,
  },

  control: {
    inputHeight: 46,
    buttonHeight: 46,
    compactButtonHeight: 40,

    inputRadius: 10,
    buttonRadius: 10,

    inputPaddingX: 12,
    buttonPaddingX: 14,

    iconSize: 18,
    compactIconSize: 16,
  },

  panel: {
    radius: 14,
    compactRadius: 12,
    borderWidth: 1,

    padding: 14,
    compactPadding: 12,
  },

  navigation: {
    width: 0,

    itemMinHeight: 58,
    itemRadius: 12,
    itemPadding: 12,

    iconContainerSize: 38,
    iconSize: 19,

    indicatorWidth: 3,
  },

  header: {
    minHeight: 86,

    iconContainerSize: 44,
    iconSize: 22,

    gap: 12,
  },

  form: {
    fieldMinWidth: 0,

    textareaMinHeight: 110,

    actionGap: 10,

    sectionMinHeight: 180,
  },

  photo: {
    previewWidth: 132,
    previewHeight: 112,

    previewRadius: 12,

    gridGap: 10,

    uploadMinHeight: 46,

    removeHeight: 38,

    badgeSize: 24,
  },
};

/* ===========================================================
   TABLET
=========================================================== */

const TABLET_TOKENS:
  SettingsModuleTokens = {

  fontFamily:
    SETTINGS_FONT_FAMILY,

  typography: {
    pageTitle: 24,
    pageSubtitle: 12,
    eyebrow: 10,

    navigationTitle: 18,
    navigationLabel: 14,
    navigationDescription: 11,

    sectionTitle: 18,
    sectionSubtitle: 12,

    fieldLabel: 12,
    fieldText: 14,
    helperText: 11,

    buttonText: 13,

    feedbackTitle: 13,
    feedbackMessage: 12,

    photoTitle: 15,
    photoDescription: 11,
  },

  spacing: {
    pageX: 18,
    pageTop: 18,
    pageBottom: 28,

    sectionGap: 20,
    contentGap: 16,
    panelGap: 14,

    fieldGap: 12,
    rowGap: 12,
    compactGap: 7,
  },

  control: {
    inputHeight: 44,
    buttonHeight: 44,
    compactButtonHeight: 40,

    inputRadius: 10,
    buttonRadius: 10,

    inputPaddingX: 12,
    buttonPaddingX: 14,

    iconSize: 18,
    compactIconSize: 16,
  },

  panel: {
    radius: 14,
    compactRadius: 12,
    borderWidth: 1,

    padding: 16,
    compactPadding: 12,
  },

  navigation: {
    width: 244,

    itemMinHeight: 62,
    itemRadius: 12,
    itemPadding: 12,

    iconContainerSize: 40,
    iconSize: 20,

    indicatorWidth: 3,
  },

  header: {
    minHeight: 90,

    iconContainerSize: 46,
    iconSize: 23,

    gap: 13,
  },

  form: {
    fieldMinWidth: 210,

    textareaMinHeight: 116,

    actionGap: 10,

    sectionMinHeight: 200,
  },

  photo: {
    previewWidth: 144,
    previewHeight: 120,

    previewRadius: 12,

    gridGap: 12,

    uploadMinHeight: 44,

    removeHeight: 38,

    badgeSize: 24,
  },
};

/* ===========================================================
   LAPTOP
=========================================================== */

const LAPTOP_TOKENS:
  SettingsModuleTokens = {

  fontFamily:
    SETTINGS_FONT_FAMILY,

  typography: {
    pageTitle: 26,
    pageSubtitle: 13,
    eyebrow: 11,

    navigationTitle: 19,
    navigationLabel: 15,
    navigationDescription: 12,

    sectionTitle: 19,
    sectionSubtitle: 13,

    fieldLabel: 13,
    fieldText: 14,
    helperText: 12,

    buttonText: 14,

    feedbackTitle: 14,
    feedbackMessage: 13,

    photoTitle: 16,
    photoDescription: 12,
  },

  spacing: {
    pageX: 22,
    pageTop: 20,
    pageBottom: 30,

    sectionGap: 22,
    contentGap: 18,
    panelGap: 16,

    fieldGap: 12,
    rowGap: 12,
    compactGap: 8,
  },

  control: {
    inputHeight: 46,
    buttonHeight: 46,
    compactButtonHeight: 42,

    inputRadius: 10,
    buttonRadius: 10,

    inputPaddingX: 14,
    buttonPaddingX: 16,

    iconSize: 19,
    compactIconSize: 17,
  },

  panel: {
    radius: 15,
    compactRadius: 12,
    borderWidth: 1,

    padding: 18,
    compactPadding: 14,
  },

  navigation: {
    width: 270,

    itemMinHeight: 68,
    itemRadius: 13,
    itemPadding: 14,

    iconContainerSize: 42,
    iconSize: 21,

    indicatorWidth: 3,
  },

  header: {
    minHeight: 96,

    iconContainerSize: 48,
    iconSize: 24,

    gap: 14,
  },

  form: {
    fieldMinWidth: 230,

    textareaMinHeight: 122,

    actionGap: 12,

    sectionMinHeight: 220,
  },

  photo: {
    previewWidth: 156,
    previewHeight: 130,

    previewRadius: 13,

    gridGap: 14,

    uploadMinHeight: 46,

    removeHeight: 40,

    badgeSize: 26,
  },
};

/* ===========================================================
   DESKTOP
=========================================================== */

const DESKTOP_TOKENS:
  SettingsModuleTokens = {

  fontFamily:
    SETTINGS_FONT_FAMILY,

  typography: {
    pageTitle: 28,
    pageSubtitle: 14,
    eyebrow: 11,

    navigationTitle: 20,
    navigationLabel: 15,
    navigationDescription: 12,

    sectionTitle: 20,
    sectionSubtitle: 13,

    fieldLabel: 13,
    fieldText: 15,
    helperText: 12,

    buttonText: 14,

    feedbackTitle: 14,
    feedbackMessage: 13,

    photoTitle: 16,
    photoDescription: 12,
  },

  spacing: {
    pageX: 28,
    pageTop: 24,
    pageBottom: 34,

    sectionGap: 24,
    contentGap: 20,
    panelGap: 18,

    fieldGap: 14,
    rowGap: 14,
    compactGap: 8,
  },

  control: {
    inputHeight: 48,
    buttonHeight: 48,
    compactButtonHeight: 44,

    inputRadius: 11,
    buttonRadius: 11,

    inputPaddingX: 15,
    buttonPaddingX: 18,

    iconSize: 20,
    compactIconSize: 18,
  },

  panel: {
    radius: 16,
    compactRadius: 13,
    borderWidth: 1,

    padding: 20,
    compactPadding: 15,
  },

  navigation: {
    width: 292,

    itemMinHeight: 72,
    itemRadius: 14,
    itemPadding: 15,

    iconContainerSize: 44,
    iconSize: 22,

    indicatorWidth: 4,
  },

  header: {
    minHeight: 102,

    iconContainerSize: 50,
    iconSize: 25,

    gap: 15,
  },

  form: {
    fieldMinWidth: 250,

    textareaMinHeight: 128,

    actionGap: 12,

    sectionMinHeight: 240,
  },

  photo: {
    previewWidth: 168,
    previewHeight: 140,

    previewRadius: 14,

    gridGap: 16,

    uploadMinHeight: 48,

    removeHeight: 42,

    badgeSize: 28,
  },
};

/* ===========================================================
   TOKEN MAP
=========================================================== */

const SETTINGS_TOKEN_MAP:
  Readonly<
    Record<
      SettingsResponsiveDevice,
      SettingsModuleTokens
    >
  > = {

  mobile:
    MOBILE_TOKENS,

  tablet:
    TABLET_TOKENS,

  laptop:
    LAPTOP_TOKENS,

  desktop:
    DESKTOP_TOKENS,
};

/* ===========================================================
   TOKEN RESOLVER
=========================================================== */

export function getSettingsModuleTokens(
  device:
    SettingsResponsiveDevice,
): SettingsModuleTokens {

  return (
    SETTINGS_TOKEN_MAP[device] ??
    MOBILE_TOKENS
  );
}

/* ===========================================================
   END
=========================================================== */
