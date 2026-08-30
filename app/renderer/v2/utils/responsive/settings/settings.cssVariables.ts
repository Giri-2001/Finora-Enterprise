/* ===========================================================
   FINORA ENTERPRISE OS™

   ENTERPRISE SETTINGS

   SETTINGS RESPONSIVE CSS VARIABLE BRIDGE

   MODULE  : Settings
   LAYER   : Responsive CSS Bridge
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Convert resolved Settings responsive values into
     namespaced CSS custom properties
   - Allow Settings JSX to remain className-only
   - Preserve Settings TS tokens as the single geometry source
   - Publish the resolved Settings device for diagnostics
   - Support live viewport/device changes

   IMPORTANT:

   - No breakpoint values.
   - No @media queries.
   - No theme colors.
   - No persistence.
   - No repository access.
   - No React component.
   - No duplicated responsive values in CSS.

   FLOW:

   FINORA Responsive Engine
          ↓
   Settings Responsive Engine
          ↓
   SettingsResponsiveValue
          ↓
   --finora-settings-*
          ↓
   Settings CSS classes
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  SettingsResponsiveValue,
} from "./settings.types";

/* ===========================================================
   CSS VARIABLE CONTRACT
=========================================================== */

export type SettingsResponsiveCssVariableMap =
  Record<
    `--finora-settings-${string}`,
    string
  >;

/* ===========================================================
   PIXEL VALUE
=========================================================== */

function px(
  value:
    number,
): string {

  const safeValue =
    Number.isFinite(value)
      ? value
      : 0;

  return `${safeValue}px`;
}

/* ===========================================================
   CSS DIMENSION
=========================================================== */

function dimension(
  value:
    number | string,
): string {

  if (
    typeof value === "number"
  ) {
    return px(value);
  }

  return String(value).trim();
}

/* ===========================================================
   BOOLEAN CSS VALUE
=========================================================== */

function cssBoolean(
  value:
    boolean,
): string {

  return value
    ? "1"
    : "0";
}

/* ===========================================================
   BUILD RESPONSIVE CSS VARIABLES

   PURE FUNCTION

   No DOM access occurs here.
=========================================================== */

export function buildSettingsResponsiveCssVariables(
  responsive:
    SettingsResponsiveValue,
): SettingsResponsiveCssVariableMap {

  const {
    moduleTokens,
    layout,
  } = responsive;

  const {
    page,
    workspace,
    navigation,
    header,
    content,
    form,
    photo,
  } = layout;

  return {
    /* =======================================================
       DEVICE
    ======================================================= */

    "--finora-settings-device":
      responsive.device,

    /* =======================================================
       FONT
    ======================================================= */

    "--finora-settings-font-family":
      moduleTokens.fontFamily,

    /* =======================================================
       TYPOGRAPHY
    ======================================================= */

    "--finora-settings-font-page-title":
      px(moduleTokens.typography.pageTitle),

    "--finora-settings-font-page-subtitle":
      px(moduleTokens.typography.pageSubtitle),

    "--finora-settings-font-eyebrow":
      px(moduleTokens.typography.eyebrow),

    "--finora-settings-font-navigation-title":
      px(moduleTokens.typography.navigationTitle),

    "--finora-settings-font-navigation-label":
      px(moduleTokens.typography.navigationLabel),

    "--finora-settings-font-navigation-description":
      px(moduleTokens.typography.navigationDescription),

    "--finora-settings-font-section-title":
      px(moduleTokens.typography.sectionTitle),

    "--finora-settings-font-section-subtitle":
      px(moduleTokens.typography.sectionSubtitle),

    "--finora-settings-font-field-label":
      px(moduleTokens.typography.fieldLabel),

    "--finora-settings-font-field-text":
      px(moduleTokens.typography.fieldText),

    "--finora-settings-font-helper":
      px(moduleTokens.typography.helperText),

    "--finora-settings-font-button":
      px(moduleTokens.typography.buttonText),

    "--finora-settings-font-feedback-title":
      px(moduleTokens.typography.feedbackTitle),

    "--finora-settings-font-feedback-message":
      px(moduleTokens.typography.feedbackMessage),

    "--finora-settings-font-photo-title":
      px(moduleTokens.typography.photoTitle),

    "--finora-settings-font-photo-description":
      px(moduleTokens.typography.photoDescription),

    /* =======================================================
       PAGE
    ======================================================= */

    "--finora-settings-page-width":
      dimension(page.width),

    "--finora-settings-page-max-width":
      dimension(page.maxWidth),

    "--finora-settings-page-padding-x":
      px(page.paddingX),

    "--finora-settings-page-padding-top":
      px(page.paddingTop),

    "--finora-settings-page-padding-bottom":
      px(page.paddingBottom),

    "--finora-settings-section-gap":
      px(page.sectionGap),

    /* =======================================================
       GENERAL SPACING
    ======================================================= */

    "--finora-settings-content-gap":
      px(moduleTokens.spacing.contentGap),

    "--finora-settings-panel-gap":
      px(moduleTokens.spacing.panelGap),

    "--finora-settings-field-gap":
      px(moduleTokens.spacing.fieldGap),

    "--finora-settings-row-gap":
      px(moduleTokens.spacing.rowGap),

    "--finora-settings-compact-gap":
      px(moduleTokens.spacing.compactGap),

    /* =======================================================
       CONTROLS
    ======================================================= */

    "--finora-settings-input-height":
      px(moduleTokens.control.inputHeight),

    "--finora-settings-button-height":
      px(moduleTokens.control.buttonHeight),

    "--finora-settings-compact-button-height":
      px(moduleTokens.control.compactButtonHeight),

    "--finora-settings-input-radius":
      px(moduleTokens.control.inputRadius),

    "--finora-settings-button-radius":
      px(moduleTokens.control.buttonRadius),

    "--finora-settings-input-padding-x":
      px(moduleTokens.control.inputPaddingX),

    "--finora-settings-button-padding-x":
      px(moduleTokens.control.buttonPaddingX),

    "--finora-settings-icon-size":
      px(moduleTokens.control.iconSize),

    "--finora-settings-compact-icon-size":
      px(moduleTokens.control.compactIconSize),

    /* =======================================================
       PANEL
    ======================================================= */

    "--finora-settings-panel-radius":
      px(moduleTokens.panel.radius),

    "--finora-settings-panel-compact-radius":
      px(moduleTokens.panel.compactRadius),

    "--finora-settings-panel-border-width":
      px(moduleTokens.panel.borderWidth),

    "--finora-settings-panel-padding":
      px(moduleTokens.panel.padding),

    "--finora-settings-panel-compact-padding":
      px(moduleTokens.panel.compactPadding),

    /* =======================================================
       WORKSPACE
    ======================================================= */

    "--finora-settings-workspace-columns":
      workspace.columns,

    "--finora-settings-workspace-gap":
      px(workspace.gap),

    "--finora-settings-navigation-position":
      workspace.navigationSticky
        ? "sticky"
        : "static",

    "--finora-settings-navigation-top":
      px(workspace.navigationTop),

    "--finora-settings-navigation-sticky":
      cssBoolean(workspace.navigationSticky),

    /* =======================================================
       NAVIGATION
    ======================================================= */

    "--finora-settings-navigation-width":
      dimension(navigation.width),

    "--finora-settings-navigation-min-height":
      px(navigation.minHeight),

    "--finora-settings-navigation-gap":
      px(navigation.gap),

    "--finora-settings-navigation-item-min-height":
      px(navigation.itemMinHeight),

    "--finora-settings-navigation-item-radius":
      px(moduleTokens.navigation.itemRadius),

    "--finora-settings-navigation-item-padding":
      px(moduleTokens.navigation.itemPadding),

    "--finora-settings-navigation-icon-container-size":
      px(moduleTokens.navigation.iconContainerSize),

    "--finora-settings-navigation-icon-size":
      px(moduleTokens.navigation.iconSize),

    "--finora-settings-navigation-indicator-width":
      px(moduleTokens.navigation.indicatorWidth),

    "--finora-settings-navigation-stacked":
      cssBoolean(navigation.stacked),

    /* =======================================================
       HEADER
    ======================================================= */

    "--finora-settings-header-min-height":
      px(header.minHeight),

    "--finora-settings-header-gap":
      px(header.gap),

    "--finora-settings-header-icon-container-size":
      px(header.iconContainerSize),

    "--finora-settings-header-icon-size":
      px(moduleTokens.header.iconSize),

    "--finora-settings-header-stacked":
      cssBoolean(header.stacked),

    "--finora-settings-header-direction":
      header.stacked
        ? "column"
        : "row",

    /* =======================================================
       CONTENT
    ======================================================= */

    "--finora-settings-content-min-width":
      px(content.minWidth),

    "--finora-settings-content-layout-gap":
      px(content.gap),

    "--finora-settings-content-panel-padding":
      px(content.panelPadding),

    "--finora-settings-content-panel-radius":
      px(content.panelRadius),

    /* =======================================================
       FORM
    ======================================================= */

    "--finora-settings-form-columns":
      String(form.columns),

    "--finora-settings-form-template-columns":
      `repeat(${form.columns}, minmax(0, 1fr))`,

    "--finora-settings-form-gap":
      px(form.gap),

    "--finora-settings-form-row-gap":
      px(form.rowGap),

    "--finora-settings-form-field-min-width":
      px(moduleTokens.form.fieldMinWidth),

    "--finora-settings-form-textarea-min-height":
      px(moduleTokens.form.textareaMinHeight),

    "--finora-settings-form-section-min-height":
      px(moduleTokens.form.sectionMinHeight),

    "--finora-settings-form-action-gap":
      px(moduleTokens.form.actionGap),

    "--finora-settings-form-actions-stacked":
      cssBoolean(form.actionsStacked),

    "--finora-settings-form-actions-direction":
      form.actionsStacked
        ? "column"
        : "row",

    /* =======================================================
       PHOTOS
    ======================================================= */

    "--finora-settings-photo-columns":
      String(photo.columns),

    "--finora-settings-photo-template-columns":
      `repeat(${photo.columns}, minmax(0, 1fr))`,

    "--finora-settings-photo-gap":
      px(photo.gap),

    "--finora-settings-photo-preview-width":
      px(photo.previewWidth),

    "--finora-settings-photo-preview-height":
      px(photo.previewHeight),

    "--finora-settings-photo-preview-radius":
      px(moduleTokens.photo.previewRadius),

    "--finora-settings-photo-upload-min-height":
      px(moduleTokens.photo.uploadMinHeight),

    "--finora-settings-photo-remove-height":
      px(moduleTokens.photo.removeHeight),

    "--finora-settings-photo-badge-size":
      px(moduleTokens.photo.badgeSize),

    "--finora-settings-photo-actions-stacked":
      cssBoolean(photo.actionsStacked),
  };
}

/* ===========================================================
   APPLY RESPONSIVE VARIABLES

   Variables are namespaced to Enterprise Settings.

   No JSX inline styles are required.
=========================================================== */

export function applySettingsResponsiveCssVariables(
  responsive:
    SettingsResponsiveValue,
): void {

  if (
    typeof document === "undefined"
  ) {
    return;
  }

  const root =
    document.documentElement;

  const variables =
    buildSettingsResponsiveCssVariables(
      responsive,
    );

  for (
    const [property, value]
    of Object.entries(variables)
  ) {
    root.style.setProperty(
      property,
      value,
    );
  }

  /* =========================================================
     DEVICE IDENTITY

     Diagnostics only.

     Device classification remains owned by canonical
     FINORA Responsive Engine.
  ========================================================= */

  root.dataset.finoraSettingsDevice =
    responsive.device;
}

/* ===========================================================
   END
=========================================================== */
