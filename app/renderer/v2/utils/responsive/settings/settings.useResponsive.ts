/* ===========================================================
   FINORA ENTERPRISE OS™

   ENTERPRISE SETTINGS

   SETTINGS RESPONSIVE HOOK

   MODULE  : Settings
   LAYER   : Responsive Hook
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Consume canonical FINORA Responsive Engine state
   - Read live viewport width / height
   - Reuse canonical FINORA device classification
   - Reuse canonical FINORA responsive tokens
   - Resolve Settings module tokens
   - Resolve Settings structural layout
   - Expose four Settings device flags
   - Publish Settings responsive CSS variables
   - React to live viewport changes

   FINORA DEVICE SYSTEM:

   mobile
   tablet
   laptop
   desktop

   IMPORTANT:

   - No local breakpoints.
   - No window.innerWidth access.
   - No resize listener.
   - No @media queries.
   - No theme colors.
   - No persistence.
   - No repository access.
   - No business logic.
   - No JSX inline styles.

   Canonical FINORA useResponsive() remains authoritative.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useEffect,
  useMemo,
} from "react";

import {
  useResponsive,
} from "../useResponsive";

import {
  applySettingsResponsiveCssVariables,
} from "./settings.cssVariables";

import {
  createSettingsLayout,
} from "./settings.layout";

import {
  getSettingsModuleTokens,
} from "./settings.tokens";

import type {
  SettingsResponsiveDevice,
  SettingsResponsiveValue,
} from "./settings.types";

/* ===========================================================
   SAFE VIEWPORT VALUE
=========================================================== */

function getSafeViewportValue(
  value:
    number,
): number {

  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    return 0;
  }

  return value;
}

/* ===========================================================
   HOOK
=========================================================== */

export function useSettingsResponsive():
  SettingsResponsiveValue {

  /* =========================================================
     CANONICAL FINORA RESPONSIVE STATE
  ========================================================= */

  const responsive =
    useResponsive();

  /* =========================================================
     SAFE VIEWPORT
  ========================================================= */

  const width =
    getSafeViewportValue(
      responsive.width,
    );

  const height =
    getSafeViewportValue(
      responsive.height,
    );

  /* =========================================================
     CANONICAL DEVICE

     SettingsResponsiveDevice directly reuses FINORA
     DeviceType and therefore introduces no local classifier.
  ========================================================= */

  const device:
    SettingsResponsiveDevice =
      responsive.device;

  /* =========================================================
     SETTINGS MODULE TOKENS
  ========================================================= */

  const moduleTokens =
    useMemo(
      () =>
        getSettingsModuleTokens(
          device,
        ),
      [
        device,
      ],
    );

  /* =========================================================
     SETTINGS STRUCTURAL LAYOUT
  ========================================================= */

  const layout =
    useMemo(
      () =>
        createSettingsLayout({
          width,

          height,

          tokens:
            responsive.tokens,

          device,
        }),
      [
        device,
        height,
        responsive.tokens,
        width,
      ],
    );

  /* =========================================================
     COMPLETE SETTINGS RESPONSIVE VALUE
  ========================================================= */

  const settingsResponsive =
    useMemo<
      SettingsResponsiveValue
    >(
      () => ({
        width,

        height,

        device,

        tokens:
          responsive.tokens,

        moduleTokens,

        layout,

        isMobile:
          responsive.isMobile,

        isTablet:
          responsive.isTablet,

        isLaptop:
          responsive.isLaptop,

        isDesktop:
          responsive.isDesktop,
      }),
      [
        device,
        height,
        layout,
        moduleTokens,
        responsive.isDesktop,
        responsive.isLaptop,
        responsive.isMobile,
        responsive.isTablet,
        responsive.tokens,
        width,
      ],
    );

  /* =========================================================
     PUBLISH SETTINGS RESPONSIVE CSS VARIABLES

     Settings components can remain:

     className="..."

     without JSX style props.
  ========================================================= */

  useEffect(
    () => {
      applySettingsResponsiveCssVariables(
        settingsResponsive,
      );
    },
    [
      settingsResponsive,
    ],
  );

  /* =========================================================
     RETURN
  ========================================================= */

  return settingsResponsive;
}

/* ===========================================================
   DEFAULT EXPORT
=========================================================== */

export default useSettingsResponsive;

/* ===========================================================
   END
=========================================================== */
