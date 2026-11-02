/* ===========================================================
   FINORA ENTERPRISE OS
   THEME ENGINE

   THEME DEFINITIONS REGISTRY

   PURPOSE
   -----------------------------------------------------------
   Central registry for FINORA V2 theme definitions.

   IMPORTANT
   -----------------------------------------------------------
   Only themes that have been fully implemented are registered
   here.

   Responsive dimensions MUST continue to come from:

   app/renderer/v2/utils/responsive/

   This registry must NOT contain responsive geometry.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  FinoraTheme,
  ThemeId,
} from "../core/types";


/* ===========================================================
   THEME DEFINITIONS
=========================================================== */

import {
  IMPERIAL_GOLD_THEME,
} from "./imperialGold";

import {
  ROYAL_NAVY_THEME,
} from "./royalNavy";

import {
  AMETHYST_THEME,
} from "./amethyst";

import {
  EMERALD_THEME,
} from "./emerald";

import {
  OBSIDIAN_THEME,
} from "./obsidian";


/* ===========================================================
   AVAILABLE THEME DEFINITIONS
=========================================================== */

// FINORA_R199_D_VIVID
// Original hue families with saturated, bright surfaces.
// No white/light-mode conversion. Black and Gold remain untouched.

type FinoraVividPalette = {
  primary: string;
  hover: string;
  page: string;
  surface: string;
  elevated: string;
  muted: string;
  strong: string;
  header: string;
  border: string;
  accent: string;
  soft: string;
};

/* FINORA_C80_B20_R2_DARK15
   RGB page/card background darkening: 15%.
   Other theme tokens remain unchanged.
*/
function finoraDarkenBackground15(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error("FINORA: Invalid background colour");
  }

  const channel = (offset: number): string =>
    Math.round(
      parseInt(hex.slice(offset, offset + 2), 16) * 0.85,
    )
      .toString(16)
      .padStart(2, "0");

  return `#${channel(1)}${channel(3)}${channel(5)}`;
}
function createFinoraVividTheme(
  theme: FinoraTheme,
  p: FinoraVividPalette,
): FinoraTheme {
  return {
    ...theme,
    mode: "dark",
    colors: {
      ...theme.colors,
      brand: {
        ...theme.colors.brand,
        primary: p.primary,
        secondary: p.hover,
        accent: p.accent,
        accentSoft: p.soft,
      },
      background: {
        page: finoraDarkenBackground15(p.page),
        surface: p.surface,
        surfaceElevated: p.elevated,
        surfaceMuted: p.muted,
        surfaceStrong: p.strong,
      },
      text: {
        primary: "#FFFFFF",
        secondary: "#F0F5FF",
        muted: "#DCE6F7",
        inverse: "#152036",
        disabled: "#B7C9DE",
        link: "#FFFFFF",
      },
      border: {
        // FINORA_R200_D_PREMIUM_CONTRAST
        default: p.border,
        subtle: p.border,
        strong: p.accent,
        focus: "#FFFFFF",
      },
      interactive: {
        hover: p.hover,
        active: p.strong,
        selected: p.muted,
        focus: p.accent,
        disabled: p.soft,
      },
      overlay: {
        backdrop: "rgba(8, 12, 26, 0.62)",
        shadow: "rgba(5, 10, 30, 0.22)",
      },
    },
    typography: {
      heading: "#FFFFFF",
      body: "#F0F5FF",
      label: "#FFFFFF",
      caption: "#E0E9F7",
      placeholder: "#D8E5F6",
      link: "#FFFFFF",
      inverse: "#152036",
    },
    components: {
      ...theme.components,
      card: {
        background: finoraDarkenBackground15(p.surface),
        border: p.border,
        shadow: "rgba(5, 10, 30, 0.17)",
      },
      input: {
        background: p.elevated,
        border: p.border,
        text: "#FFFFFF",
        placeholder: "#E0E9F7",
        focusBorder: "#FFFFFF",
        focusBackground: p.muted,
        disabledBackground: p.soft,
      },
      button: {
        ...theme.components.button,
        primaryBackground: p.primary,
        primaryText: "#FFFFFF",
        primaryHover: p.hover,
        secondaryBackground: p.elevated,
        secondaryText: "#FFFFFF",
        secondaryBorder: p.border,
        secondaryHover: p.muted,
      },
      navigation: {
        background: p.header,
        text: "#FFFFFF",
        activeBackground: p.primary,
        activeText: "#FFFFFF",
        hoverBackground: p.hover,
      },
      header: {
        background: p.header,
        text: "#FFFFFF",
        border: p.border,
      },
      panel: {
        background: p.surface,
        border: p.border,
        shadow: "rgba(5, 10, 30, 0.16)",
      },
    },
  };
}

const FINORA_R199_BRIGHT_NAVY = createFinoraVividTheme(
  ROYAL_NAVY_THEME,
  {
    primary: "#5799E2",
    hover: "#3678B7",
    page: "#31669F",
    surface: "#3976B4",
    elevated: "#4985C2",
    muted: "#3977B3",
    strong: "#2A619B",
    header: "#31679F",
    border: "#D4ECFF",
    accent: "#F0F9FF",
    soft: "#295D95",
  },
);

const FINORA_R199_BRIGHT_AMETHYST = createFinoraVividTheme(
  AMETHYST_THEME,
  {
    primary: "#AC65FF",
    hover: "#7732C9",
    page: "#6024AC",
    surface: "#853BD9",
    elevated: "#944CE5",
    muted: "#7430C2",
    strong: "#6326AF",
    header: "#6D2CB7",
    border: "#E8CFFF",
    accent: "#F7E9FF",
    soft: "#59209D",
  },
);

const FINORA_R199_BRIGHT_EMERALD = createFinoraVividTheme(
  EMERALD_THEME,
  {
    primary: "#25B879",
    hover: "#118650",
    page: "#086D42",
    surface: "#15975F",
    elevated: "#1DA66B",
    muted: "#118650",
    strong: "#0B7448",
    header: "#0D7C4D",
    border: "#BDF5DC",
    accent: "#E1FFF0",
    soft: "#09643E",
  },
);

export const FINORA_THEMES:
  Partial<Record<ThemeId, FinoraTheme>> = {

  "imperial-gold":
    IMPERIAL_GOLD_THEME,

  "royal-navy":
    FINORA_R199_BRIGHT_NAVY,

  "amethyst":
    FINORA_R199_BRIGHT_AMETHYST,

  "emerald":
    FINORA_R199_BRIGHT_EMERALD,

  "obsidian":
    OBSIDIAN_THEME,

};


/* ===========================================================
   DEFAULT THEME
=========================================================== */

export const DEFAULT_THEME_ID:
  ThemeId =
    "imperial-gold";


/* ===========================================================
   END
=========================================================== */
