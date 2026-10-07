// ============================================================
// FINORA ENTERPRISE OSÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢
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

import SubscriptionSettingsSection from "./subscription/SubscriptionSettingsSection";

import {
  useSettingsResponsive,
} from "../../utils/responsive/settings/settings.index";

// ============================================================
// COMPONENT
// ============================================================

const FINORA_SETTINGS_ACTIVE_SECTION =
  "FINORA_SETTINGS_ACTIVE_SECTION";

function readPersistedSettingsSection():
  SettingsSectionId {
  try {
    const value =
      window.sessionStorage.getItem(
        FINORA_SETTINGS_ACTIVE_SECTION,
      );

    if (
      value === "business" ||
      value === "branch" ||
      value === "business-owner" ||
      value === "numbering-series" ||
      value === "gold-storage" ||
      value === "subscription"
    ) {
      return value;
    }
  }
  catch {
    // UI navigation persistence is best-effort only.
  }

  return DEFAULT_SETTINGS_SECTION;
}

export default function SettingsPage() {

  const [
    activeSection,
    setActiveSection,
  ] = useState<
    SettingsSectionId
  >(
    readPersistedSettingsSection,
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

    if (
      activeSection ===
      "subscription"
    ) {
      return (
        <SubscriptionSettingsSection />
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
              (nextSection) => {
                try {
                  window.sessionStorage.setItem(
                    FINORA_SETTINGS_ACTIVE_SECTION,
                    nextSection,
                  );
                }
                catch {
                  // UI navigation persistence is best-effort only.
                }

                setActiveSection(
                  nextSection,
                );
              }
            }
          />
        </aside>

        <main className={`finora-settings-page__main finora-settings-page__main--${activeSection}`}>
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
