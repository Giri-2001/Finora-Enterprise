// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// SETTINGS PAGE
//
// RESPONSIBILITY:
//
// - Render the Enterprise Settings workspace
// - Own the active Settings section
// - Activate the Settings Responsive Engine bridge
// - Connect Settings navigation and shared header
// - Render the selected Settings section
// - Preserve the existing Gold Storage Settings page
//
// IMPORTANT:
//
// - No inline styles.
// - No persistence.
// - No repository access.
// - No direct StorageManager access.
// - No authentication logic.
// - No theme values.
// - No breakpoint values.
// - Section-specific business logic belongs to section components.
//
// VERSION : 1.1
// STATUS  : Production Foundation
// ============================================================

import {
  useState,
} from "react";

import "./styles/settings.css";

import {
  DEFAULT_SETTINGS_SECTION,
} from "./SettingsPage.constants";

import type {
  SettingsSectionId,
} from "./SettingsPage.types";

import SettingsNavigation from "./components/SettingsNavigation";

import SettingsHeader from "./components/SettingsHeader";

import BusinessSettingsSection from "./business/BusinessSettingsSection";

import BranchSettingsSection from "./branch/BranchSettingsSection";

import BusinessOwnerProfileSection from "./owner/BusinessOwnerProfileSection";

import NumberingSeriesSettingsSection from "./numbering/NumberingSeriesSettingsSection";

import GoldStorageSettingsPage from "./GoldStorageSettingsPage";

import {
  useSettingsResponsive,
} from "../../utils/responsive/settings/settings.index";

// ============================================================
// COMPONENT
// ============================================================

export default function SettingsPage() {

  const [
    activeSection,
    setActiveSection,
  ] = useState<
    SettingsSectionId
  >(
    DEFAULT_SETTINGS_SECTION,
  );

  // ==========================================================
  // RESPONSIVE ENGINE
  //
  // The hook publishes Settings-specific responsive CSS
  // variables to the document root.
  //
  // No JSX inline styles are required.
  // ==========================================================

  useSettingsResponsive();

  // ==========================================================
  // ACTIVE CONTENT
  // ==========================================================

  function renderActiveSection() {

    if (
      activeSection ===
      "branch"
    ) {
      return (
        <BranchSettingsSection />
      );
    }

    if (
      activeSection ===
      "business-owner"
    ) {
      return (
        <BusinessOwnerProfileSection />
      );
    }

    if (
      activeSection ===
      "numbering-series"
    ) {
      return (
        <NumberingSeriesSettingsSection />
      );
    }

    if (
      activeSection ===
      "gold-storage"
    ) {
      return (
        <GoldStorageSettingsPage />
      );
    }

    return (
      <BusinessSettingsSection />
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="finora-settings-page">
      <div className="finora-settings-page__workspace">
        <aside className="finora-settings-page__navigation">
          <SettingsNavigation
            activeSection={activeSection}
            onSectionChange={
              setActiveSection
            }
          />
        </aside>

        <main className="finora-settings-page__main">
          <SettingsHeader
            activeSection={
              activeSection
            }
          />

          <div className="finora-settings-page__content">
            {renderActiveSection()}
          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================================
// END
// ============================================================
