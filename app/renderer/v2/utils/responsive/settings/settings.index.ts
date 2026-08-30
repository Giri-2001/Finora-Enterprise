/* ===========================================================
   FINORA ENTERPRISE OS™

   ENTERPRISE SETTINGS

   SETTINGS RESPONSIVE PUBLIC EXPORTS

   MODULE  : Settings
   LAYER   : Responsive Barrel
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Expose Settings responsive public contracts
   - Expose Settings module token resolver
   - Expose Settings layout resolver
   - Expose Settings CSS variable bridge
   - Expose Settings responsive hook

   IMPORTANT:

   - EXPORTS ONLY.
   - No responsive calculations.
   - No theme values.
   - No React component.
   - No persistence.
   - No business logic.
=========================================================== */

export {
  getSettingsModuleTokens,
} from "./settings.tokens";

export {
  createSettingsLayout,
} from "./settings.layout";

export {
  buildSettingsResponsiveCssVariables,
  applySettingsResponsiveCssVariables,
} from "./settings.cssVariables";

export {
  useSettingsResponsive,
} from "./settings.useResponsive";

export type {
  SettingsResponsiveDevice,
  SettingsTypographyTokens,
  SettingsSpacingTokens,
  SettingsControlTokens,
  SettingsPanelTokens,
  SettingsNavigationTokens,
  SettingsHeaderTokens,
  SettingsFormTokens,
  SettingsPhotoTokens,
  SettingsModuleTokens,
  SettingsPageLayout,
  SettingsWorkspaceLayout,
  SettingsNavigationLayout,
  SettingsHeaderLayout,
  SettingsContentLayout,
  SettingsFormLayout,
  SettingsPhotoLayout,
  SettingsLayout,
  SettingsLayoutInput,
  SettingsResponsiveValue,
} from "./settings.types";

export type {
  SettingsResponsiveCssVariableMap,
} from "./settings.cssVariables";

/* ===========================================================
   END
=========================================================== */
