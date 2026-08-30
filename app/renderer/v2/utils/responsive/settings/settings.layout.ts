/* ===========================================================
   FINORA ENTERPRISE OS™

   ENTERPRISE SETTINGS

   SETTINGS RESPONSIVE LAYOUT

   MODULE  : Settings
   LAYER   : Responsive Layout Resolver
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Convert Settings module tokens into structural geometry
   - Resolve Settings workspace structure
   - Resolve navigation behavior
   - Resolve header behavior
   - Resolve form columns
   - Resolve photo-grid columns
   - Consume canonical FINORA responsive tokens

   IMPORTANT:

   - No breakpoint boundaries.
   - No viewport classification.
   - No @media queries.
   - No theme colors.
   - No React.
   - No persistence.
   - No repository access.
   - No business logic.
   - Global FINORA Responsive Engine remains authoritative.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import {
  getSettingsModuleTokens,
} from "./settings.tokens";

import type {
  SettingsContentLayout,
  SettingsFormLayout,
  SettingsHeaderLayout,
  SettingsLayout,
  SettingsLayoutInput,
  SettingsNavigationLayout,
  SettingsPageLayout,
  SettingsPhotoLayout,
  SettingsResponsiveDevice,
  SettingsWorkspaceLayout,
} from "./settings.types";

/* ===========================================================
   CONSTANTS
=========================================================== */

const FULL_WIDTH =
  "100%";

/* ===========================================================
   SAFE POSITIVE NUMBER
=========================================================== */

function safePositiveNumber(
  value:
    unknown,
  fallback:
    number,
): number {

  const numericValue =
    Number(value);

  if (
    !Number.isFinite(numericValue) ||
    numericValue <= 0
  ) {
    return fallback;
  }

  return numericValue;
}

/* ===========================================================
   FORM COLUMNS
=========================================================== */

function resolveFormColumns(
  device:
    SettingsResponsiveDevice,
): number {

  switch (device) {
    case "mobile":
      return 1;

    case "tablet":
    case "laptop":
    case "desktop":
      return 2;

    default:
      return 1;
  }
}

/* ===========================================================
   PHOTO COLUMNS
=========================================================== */

function resolvePhotoColumns(
  device:
    SettingsResponsiveDevice,
): number {

  switch (device) {
    case "mobile":
      return 2;

    case "tablet":
      return 2;

    case "laptop":
    case "desktop":
      return 3;

    default:
      return 1;
  }
}

/* ===========================================================
   PAGE
=========================================================== */

function resolvePageLayout(
  input:
    SettingsLayoutInput,
): SettingsPageLayout {

  const moduleTokens =
    getSettingsModuleTokens(input.device);

  const globalMaxWidth =
    safePositiveNumber(
      input.tokens.layout.maxContentWidth,
      1600,
    );

  return {
    width:
      FULL_WIDTH,

    maxWidth:
      globalMaxWidth,

    paddingX:
      moduleTokens.spacing.pageX,

    paddingTop:
      moduleTokens.spacing.pageTop,

    paddingBottom:
      moduleTokens.spacing.pageBottom,

    sectionGap:
      moduleTokens.spacing.sectionGap,
  };
}

/* ===========================================================
   WORKSPACE
=========================================================== */

function resolveWorkspaceLayout(
  input:
    SettingsLayoutInput,
): SettingsWorkspaceLayout {

  const moduleTokens =
    getSettingsModuleTokens(input.device);

  const stacked =
    input.device === "mobile";

  return {
    columns:
      stacked
        ? "minmax(0, 1fr)"
        : `${moduleTokens.navigation.width}px minmax(0, 1fr)`,

    gap:
      moduleTokens.spacing.panelGap,

    navigationSticky:
      !stacked,

    navigationTop:
      moduleTokens.spacing.pageTop,
  };
}

/* ===========================================================
   NAVIGATION
=========================================================== */

function resolveNavigationLayout(
  input:
    SettingsLayoutInput,
): SettingsNavigationLayout {

  const moduleTokens =
    getSettingsModuleTokens(input.device);

  const stacked =
    input.device === "mobile";

  return {
    width:
      stacked
        ? FULL_WIDTH
        : moduleTokens.navigation.width,

    minHeight:
      moduleTokens.navigation.itemMinHeight,

    gap:
      moduleTokens.spacing.compactGap,

    itemMinHeight:
      moduleTokens.navigation.itemMinHeight,

    stacked,
  };
}

/* ===========================================================
   HEADER
=========================================================== */

function resolveHeaderLayout(
  input:
    SettingsLayoutInput,
): SettingsHeaderLayout {

  const moduleTokens =
    getSettingsModuleTokens(input.device);

  const stacked =
    input.device === "mobile";

  return {
    minHeight:
      moduleTokens.header.minHeight,

    gap:
      moduleTokens.header.gap,

    iconContainerSize:
      moduleTokens.header.iconContainerSize,

    stacked,
  };
}

/* ===========================================================
   CONTENT
=========================================================== */

function resolveContentLayout(
  input:
    SettingsLayoutInput,
): SettingsContentLayout {

  const moduleTokens =
    getSettingsModuleTokens(input.device);

  return {
    minWidth:
      0,

    gap:
      moduleTokens.spacing.contentGap,

    panelPadding:
      moduleTokens.panel.padding,

    panelRadius:
      moduleTokens.panel.radius,
  };
}

/* ===========================================================
   FORM
=========================================================== */

function resolveFormLayout(
  input:
    SettingsLayoutInput,
): SettingsFormLayout {

  const moduleTokens =
    getSettingsModuleTokens(input.device);

  const actionsStacked =
    input.device === "mobile";

  return {
    columns:
      resolveFormColumns(input.device),

    gap:
      moduleTokens.spacing.fieldGap,

    rowGap:
      moduleTokens.spacing.rowGap,

    actionsStacked,
  };
}

/* ===========================================================
   PHOTO
=========================================================== */

function resolvePhotoLayout(
  input:
    SettingsLayoutInput,
): SettingsPhotoLayout {

  const moduleTokens =
    getSettingsModuleTokens(input.device);

  const actionsStacked =
    input.device === "mobile";

  return {
    columns:
      resolvePhotoColumns(input.device),

    gap:
      moduleTokens.photo.gridGap,

    previewWidth:
      moduleTokens.photo.previewWidth,

    previewHeight:
      moduleTokens.photo.previewHeight,

    actionsStacked,
  };
}

/* ===========================================================
   CREATE COMPLETE SETTINGS LAYOUT
=========================================================== */

export function createSettingsLayout(
  input:
    SettingsLayoutInput,
): SettingsLayout {

  return {
    device:
      input.device,

    page:
      resolvePageLayout(input),

    workspace:
      resolveWorkspaceLayout(input),

    navigation:
      resolveNavigationLayout(input),

    header:
      resolveHeaderLayout(input),

    content:
      resolveContentLayout(input),

    form:
      resolveFormLayout(input),

    photo:
      resolvePhotoLayout(input),
  };
}

/* ===========================================================
   END
=========================================================== */
