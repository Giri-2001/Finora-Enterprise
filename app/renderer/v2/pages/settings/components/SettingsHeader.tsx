// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// SETTINGS HEADER
//
// RESPONSIBILITY:
//
// - Render the shared Enterprise Settings page header
// - Display the currently selected Settings section identity
// - Keep page-heading markup outside SettingsPage
//
// IMPORTANT:
//
// - No inline styles.
// - No theme values.
// - No responsive values.
// - No persistence.
// - No business logic.
// - No navigation state mutation.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  SETTINGS_SECTIONS,
} from "../SettingsPage.constants";

import type {
  SettingsSectionId,
} from "../SettingsPage.types";

import SettingsSectionIcon from "./SettingsSectionIcon";

// ============================================================
// PROPS
// ============================================================

export interface SettingsHeaderProps {
  activeSection:
    SettingsSectionId;
}

// ============================================================
// COMPONENT
// ============================================================

export default function SettingsHeader({
  activeSection,
}: SettingsHeaderProps) {

  const section =
    SETTINGS_SECTIONS.find(
      (item) =>
        item.id === activeSection,
    ) ??
    SETTINGS_SECTIONS[0];

  return (
    <header className="finora-settings-header">
      <div className="finora-settings-header__identity">
        <span className="finora-settings-header__icon">
          <SettingsSectionIcon
            section={section.id}
          />
        </span>

        <div className="finora-settings-header__content">

          <h1 className="finora-settings-header__title">
            {section.label}
          </h1>

          <p className="finora-settings-header__subtitle">
            {section.description}
          </p>
        </div>
      </div>
    </header>
  );
}

// ============================================================
// END
// ============================================================
