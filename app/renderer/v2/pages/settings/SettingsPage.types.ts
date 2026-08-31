// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// SETTINGS PAGE TYPES
//
// RESPONSIBILITY:
//
// - Define Settings page navigation contracts
// - Define supported Settings sections
// - Keep Settings navigation type-safe
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No React component.
// - No styles.
// - No theme values.
// - No responsive values.
// - No persistence.
// - No business logic.
//
// VERSION : 1.1
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// SETTINGS SECTION ID
// ============================================================

export type SettingsSectionId =
  | "business"
  | "branch"
  | "business-owner"
  | "numbering-series"
  | "gold-storage";

// ============================================================
// SETTINGS SECTION
// ============================================================

export interface SettingsSectionDefinition {
  id: SettingsSectionId;

  label: string;

  shortLabel: string;

  description: string;
}

// ============================================================
// SETTINGS NAVIGATION PROPS
// ============================================================

export interface SettingsNavigationProps {
  activeSection: SettingsSectionId;

  onSectionChange:
    (section: SettingsSectionId) => void;
}

// ============================================================
// END
// ============================================================
