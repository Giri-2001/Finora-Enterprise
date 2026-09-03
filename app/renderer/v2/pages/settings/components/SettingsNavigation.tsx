// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// SETTINGS NAVIGATION
//
// RESPONSIBILITY:
//
// - Render Settings section navigation
// - Display section labels and descriptions
// - Expose active Settings section state
// - Notify parent when the active section changes
//
// IMPORTANT:
//
// - No inline styles.
// - No theme values.
// - No responsive values.
// - No persistence.
// - No business logic.
// - Navigation metadata comes from SettingsPage.constants.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  SETTINGS_SECTIONS,
} from "../SettingsPage.constants";

import type {
  SettingsNavigationProps,
} from "../SettingsPage.types";

import SettingsSectionIcon from "./SettingsSectionIcon";

// ============================================================
// COMPONENT
// ============================================================

export default function SettingsNavigation({
  activeSection,
  onSectionChange,
}: SettingsNavigationProps) {

  return (
    <nav
      className="finora-settings-navigation"
      aria-label="Enterprise Settings"
    >
      <div className="finora-settings-navigation__header">

        <h2 className="finora-settings-navigation__title">
          Enterprise Settings
        </h2>
      </div>

      <div className="finora-settings-navigation__list">
        {SETTINGS_SECTIONS.map((section) => {
          const isActive =
            section.id === activeSection;

          const itemClassName = [
            "finora-settings-navigation__item",

            isActive
              ? "finora-settings-navigation__item--active"
              : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={section.id}
              type="button"
              className={itemClassName}
              aria-current={
                isActive
                  ? "page"
                  : undefined
              }
              onClick={() =>
                onSectionChange(
                  section.id,
                )
              }
            >
              <span className="finora-settings-navigation__icon">
                <SettingsSectionIcon
                  section={section.id}
                />
              </span>

              <span className="finora-settings-navigation__content">
                <span className="finora-settings-navigation__label">
                  {section.label}
                </span>

                <span className="finora-settings-navigation__description">
                  {section.description}
                </span>
              </span>

              <span
                className="finora-settings-navigation__indicator"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ============================================================
// END
// ============================================================
