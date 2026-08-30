/* ===========================================================
   FINORA ENTERPRISE OS
   THEME ENGINE

   THEME PROVIDER

   PURPOSE
   -----------------------------------------------------------
   Provides the active FINORA V2 theme to the React application.

   RESPONSIBILITIES
   -----------------------------------------------------------
   1. Maintain the active theme.
   2. Resolve themes from the central theme registry.
   3. Expose setTheme().
   4. Expose available theme options.
   5. Expose theme readiness state.
   6. Preserve the selected theme during provider remounts.
   7. Publish active theme tokens as global CSS variables.

   IMPORTANT
   -----------------------------------------------------------
   Theme Provider controls visual theme state only.

   Responsive dimensions such as:
   - width
   - height
   - padding
   - gap
   - radius
   - font sizing
   - layout geometry

   MUST continue to come from:

   app/renderer/v2/utils/responsive/

   This provider must NOT become a Responsive Engine.

   THEME STATE RULE
   -----------------------------------------------------------
   The active theme is retained for the lifetime of the
   renderer session.

   This prevents an accidental ThemeProvider remount from
   silently returning the application to DEFAULT_THEME_ID.

   No localStorage.
   No sessionStorage.
   No duplicate theme system.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type {
  FinoraTheme,
  ThemeContextValue,
  ThemeId,
  ThemeOption,
} from "../core/types";

import { applyFinoraThemeCssVariables } from "../core/themeCssVariables";

import { DEFAULT_THEME_ID, FINORA_THEMES } from "../definitions";

/* ===========================================================
   SESSION THEME STATE
   -----------------------------------------------------------
   This module-level value survives a React provider remount
   during the same renderer session.

   IMPORTANT:
   -----------------------------------------------------------
   This is NOT persistent storage.

   Application restart / renderer reload will correctly return
   to DEFAULT_THEME_ID.
=========================================================== */

let rendererThemeId: ThemeId = DEFAULT_THEME_ID;

/* ===========================================================
   THEME CONTEXT
=========================================================== */

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/* ===========================================================
   THEME RESOLVER
=========================================================== */

function resolveTheme(themeId: ThemeId): FinoraTheme {
  const theme = FINORA_THEMES[themeId];

  if (theme) {
    return theme;
  }

  const defaultTheme = FINORA_THEMES[DEFAULT_THEME_ID];

  if (defaultTheme) {
    return defaultTheme;
  }

  throw new Error("FINORA Theme Engine: Default theme is not registered.");
}

/* ===========================================================
   THEME OPTIONS BUILDER
=========================================================== */

function buildThemeOptions(): ThemeOption[] {
  return Object.values(FINORA_THEMES)
    .filter((theme): theme is FinoraTheme => Boolean(theme))
    .map(
      (theme): ThemeOption => ({
        id: theme.id,

        name: theme.name,

        mode: theme.mode,

        description: theme.description,
      }),
    );
}

/* ===========================================================
   THEME PROVIDER
=========================================================== */

export function ThemeProvider({ children }: PropsWithChildren) {
  /* =========================================================
     ACTIVE THEME STATE
     ---------------------------------------------------------
     IMPORTANT:
     ---------------------------------------------------------
     Initialize from rendererThemeId instead of always using
     DEFAULT_THEME_ID.

     Therefore, if ThemeProvider is remounted after the user
     selected another theme, the selected theme is restored.
  ========================================================= */

  const [themeId, setThemeId] = useState<ThemeId>(() => rendererThemeId);

  /* =========================================================
     RESOLVE ACTIVE THEME
  ========================================================= */

  const theme = useMemo(() => resolveTheme(themeId), [themeId]);

  /* =========================================================
     PUBLISH GLOBAL THEME CSS VARIABLES

     The Theme Engine remains the only visual-color authority.

     Class-based modules such as Accounts can now consume:

     --finora-theme-background-page
     --finora-theme-text-primary
     --finora-theme-brand-primary
     --finora-theme-success
     --finora-theme-danger
     etc.

     without JSX style={...} theme injection.
  ========================================================= */

  useEffect(() => {
    applyFinoraThemeCssVariables(theme);
  }, [theme]);

  /* =========================================================
     AVAILABLE THEMES
  ========================================================= */

  const themes = useMemo(() => buildThemeOptions(), []);

  /* =========================================================
     THEME CHANGE HANDLER
  ========================================================= */

  const setTheme = (nextThemeId: ThemeId): void => {
    /* -------------------------------------------------------
       VALIDATE THEME
    ------------------------------------------------------- */

    const nextTheme = FINORA_THEMES[nextThemeId];

    if (!nextTheme) {
      console.warn(
        `FINORA Theme Engine: Theme "${nextThemeId}" is not currently registered.`,
      );

      return;
    }

    /* -------------------------------------------------------
       SAME THEME
       -------------------------------------------------------
       Clicking the already-active swatch must NOT reset
       anything.
    ------------------------------------------------------- */

    if (rendererThemeId === nextThemeId) {
      return;
    }

    /* -------------------------------------------------------
       UPDATE RENDERER SESSION THEME
    ------------------------------------------------------- */

    console.log("[FINORA THEME] CHANGE REQUEST", {
      from: rendererThemeId,

      to: nextThemeId,
    });

    rendererThemeId = nextThemeId;

    /* -------------------------------------------------------
       UPDATE REACT STATE
    ------------------------------------------------------- */

    setThemeId(nextThemeId);
  };

  /* =========================================================
     CONTEXT VALUE
  ========================================================= */

  const contextValue: ThemeContextValue = {
    theme,

    themeId,

    setTheme,

    themes,

    isThemeReady: true,
  };

  /* =========================================================
     PROVIDER
  ========================================================= */

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ===========================================================
   USE THEME HOOK
=========================================================== */

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
}

/* ===========================================================
   END OF FILE
=========================================================== */
