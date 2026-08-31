// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// SETTINGS PAGE CONSTANTS
//
// RESPONSIBILITY:
//
// - Define Settings section metadata
// - Define Settings section ordering
// - Keep navigation labels centralized
//
// IMPORTANT:
//
// - CONSTANTS ONLY.
// - No React component.
// - No icon components.
// - No styles.
// - No theme values.
// - No responsive values.
// - No persistence.
// - No business logic.
//
// VERSION : 1.1
// STATUS  : Production Foundation
// ============================================================

import type {
  SettingsSectionDefinition,
  SettingsSectionId,
} from "./SettingsPage.types";

// ============================================================
// DEFAULT SECTION
// ============================================================

export const DEFAULT_SETTINGS_SECTION:
  SettingsSectionId =
  "business";

// ============================================================
// SECTION DEFINITIONS
// ============================================================

export const SETTINGS_SECTIONS:
  readonly SettingsSectionDefinition[] = [
    {
      id:
        "business",

      label:
        "Business",

      shortLabel:
        "Business",

      description:
        "Manage enterprise-level business identity and contact settings.",
    },

    {
      id:
        "branch",

      label:
        "Branch",

      shortLabel:
        "Branch",

      description:
        "Manage active branch contact details and branch office photos.",
    },

    {
      id:
        "business-owner",

      label:
        "Business Owner",

      shortLabel:
        "Owner",

      description:
        "Manage Business Owner profile information and identification photos.",
    },

    {
      id:
        "numbering-series",

      label:
        "Numbering & Series",

      shortLabel:
        "Numbering",

      description:
        "Configure the permanent Customer ID series and view system-generated Loan, Collection and Receipt numbering rules.",
    },

    {
      id:
        "gold-storage",

      label:
        "Gold Storage",

      shortLabel:
        "Gold",

      description:
        "Manage Locker Rooms, Lockers, Racks and Gold custody capacity.",
    },
  ];

// ============================================================
// END
// ============================================================
