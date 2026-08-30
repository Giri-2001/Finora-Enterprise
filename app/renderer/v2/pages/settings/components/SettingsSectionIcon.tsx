// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// SETTINGS SECTION ICON
//
// RESPONSIBILITY:
//
// - Resolve the icon for each Settings section
// - Keep icon selection outside navigation components
// - Expose class-based Lucide icons
//
// IMPORTANT:
//
// - No inline styles.
// - No theme values.
// - No responsive values.
// - No navigation state.
// - No persistence.
// - No business logic.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  Building2,
  Gem,
  Landmark,
  UserRoundCog,
} from "lucide-react";

import type {
  SettingsSectionId,
} from "../SettingsPage.types";

// ============================================================
// PROPS
// ============================================================

export interface SettingsSectionIconProps {
  section:
    SettingsSectionId;

  className?:
    string;
}

// ============================================================
// COMPONENT
// ============================================================

export default function SettingsSectionIcon({
  section,
  className = "",
}: SettingsSectionIconProps) {

  const iconClassName = [
    "finora-settings-section-icon",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (section === "branch") {
    return (
      <Building2
        className={iconClassName}
        aria-hidden="true"
      />
    );
  }

  if (section === "business-owner") {
    return (
      <UserRoundCog
        className={iconClassName}
        aria-hidden="true"
      />
    );
  }

  if (section === "gold-storage") {
    return (
      <Gem
        className={iconClassName}
        aria-hidden="true"
      />
    );
  }

  return (
    <Landmark
      className={iconClassName}
      aria-hidden="true"
    />
  );
}

// ============================================================
// END
// ============================================================
