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
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  createContext,
  useContext,
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

import {
  DEFAULT_THEME_ID,
  FINORA_THEMES,
} from "../definitions";


/* ===========================================================
   THEME CONTEXT
=========================================================== */

const ThemeContext =
  createContext<ThemeContextValue | undefined>(
    undefined,
  );


/* ===========================================================
   THEME RESOLVER
=========================================================== */

function resolveTheme(
  themeId: ThemeId,
): FinoraTheme {

  const theme =
    FINORA_THEMES[themeId];

  if (theme) {

    return theme;

  }

  return FINORA_THEMES[DEFAULT_THEME_ID]
    ?? (() => {
      throw new Error(
        "FINORA Theme Engine: Default theme is not registered.",
      );
    })();

}


/* ===========================================================
   THEME OPTIONS BUILDER
=========================================================== */

function buildThemeOptions(): ThemeOption[] {

  return Object.values(
    FINORA_THEMES,
  )
    .filter(
      (
        theme,
      ): theme is FinoraTheme =>
        Boolean(theme),
    )
    .map(
      (
        theme,
      ): ThemeOption => ({
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

export function ThemeProvider(
  {
    children,
  }: PropsWithChildren,
) {

  /* ---------------------------------------------------------
     ACTIVE THEME STATE
  --------------------------------------------------------- */

  const [
    themeId,
    setThemeId,
  ] = useState<ThemeId>(
    DEFAULT_THEME_ID,
  );


  /* ---------------------------------------------------------
     RESOLVE ACTIVE THEME
  --------------------------------------------------------- */

  const theme =
    useMemo(
      () =>
        resolveTheme(
          themeId,
        ),
      [
        themeId,
      ],
    );


  /* ---------------------------------------------------------
     AVAILABLE THEMES
  --------------------------------------------------------- */

  const themes =
    useMemo(
      () =>
        buildThemeOptions(),
      [],
    );


  /* ---------------------------------------------------------
     THEME CHANGE HANDLER
  --------------------------------------------------------- */

  const setTheme = (
    nextThemeId: ThemeId,
  ): void => {

    if (
      !FINORA_THEMES[nextThemeId]
    ) {

      console.warn(
        `FINORA Theme Engine: Theme "${nextThemeId}" is not currently registered.`,
      );

      return;

    }

    setThemeId(
      nextThemeId,
    );

  };


  /* ---------------------------------------------------------
     CONTEXT VALUE
  --------------------------------------------------------- */

  const contextValue:
    ThemeContextValue = {

    theme,

    themeId,

    setTheme,

    themes,

    isThemeReady: true,

  };


  /* ---------------------------------------------------------
     PROVIDER
  --------------------------------------------------------- */

  return (
    <ThemeContext.Provider
      value={
        contextValue
      }
    >
      {
        children
      }
    </ThemeContext.Provider>
  );

}


/* ===========================================================
   THEME HOOK
=========================================================== */

export function useTheme():
  ThemeContextValue {

  const context =
    useContext(
      ThemeContext,
    );

  if (
    !context
  ) {

    throw new Error(
      "useTheme must be used inside ThemeProvider.",
    );

  }

  return context;

}


/* ===========================================================
   END
=========================================================== */