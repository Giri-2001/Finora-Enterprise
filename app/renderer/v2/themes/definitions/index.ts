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

export const FINORA_THEMES:
  Partial<Record<ThemeId, FinoraTheme>> = {

  "imperial-gold":
    IMPERIAL_GOLD_THEME,

  "royal-navy":
    ROYAL_NAVY_THEME,

  "amethyst":
    AMETHYST_THEME,

  "emerald":
    EMERALD_THEME,

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
