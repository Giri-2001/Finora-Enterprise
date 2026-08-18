/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   CUSTOMERS RESPONSIVE HOOK

   RESPONSIBILITY:
   - Provide live viewport state for Customers module
   - Connect React viewport state to Customers Engine
   - Recalculate only when viewport changes
   - Expose Customers tokens and layout
   - Keep responsive logic outside page/components

   ARCHITECTURE:

   customers.types.ts
        ↓
   customers.breakpoints.ts
        ↓
   customers.helpers.ts
        ↓
   customers.tokens.ts
        ↓
   customers.layout.ts
        ↓
   customers.useResponsive.ts

   IMPORTANT:
   - React dependency ONLY in this file
   - No react-native dependency
   - No visual values
   - No breakpoint values
   - No component styling
   - Uses global Responsive Engine contracts
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useEffect,
  useMemo,
  useState,
} from "react";


import type {
  DeviceType,
  ResponsiveState,
} from "../types";

import type {
  ResponsiveTokens,
} from "../tokens";


import {
  getCustomerResponsiveProfile,
  getCustomerDeviceFlags,
} from "./customers.helpers";


import {
  getCustomerTokens,
} from "./customers.tokens";


import {
  getCustomerLayout,
} from "./customers.layout";


import type {
  CustomerLayout,
} from "./customers.layout";


/* ===========================================================
   VIEWPORT SNAPSHOT
=========================================================== */

export interface CustomerViewportSnapshot {

  width:
    number;

  height:
    number;

}


/* ===========================================================
   RESPONSIVE RESULT
=========================================================== */

export interface CustomerResponsiveResult {

  width:
    number;

  height:
    number;

  device:
    DeviceType;

  state:
    ResponsiveState;

  tokens:
    ResponsiveTokens;

  layout:
    CustomerLayout;

}


/* ===========================================================
   INITIAL VIEWPORT
=========================================================== */

function getInitialCustomerViewport():
  CustomerViewportSnapshot {

  if (
    typeof window ===
    "undefined"
  ) {

    return {

      width:
        0,

      height:
        0,

    };

  }


  return {

    width:
      Number.isFinite(
        window.innerWidth,
      )
        ? window.innerWidth
        : 0,

    height:
      Number.isFinite(
        window.innerHeight,
      )
        ? window.innerHeight
        : 0,

  };

}


/* ===========================================================
   VIEWPORT NORMALIZATION
=========================================================== */

function normalizeCustomerViewport(
  width: number,
  height: number,
): CustomerViewportSnapshot {

  return {

    width:
      Number.isFinite(
        width,
      )
        ? Math.max(
            0,
            width,
          )
        : 0,

    height:
      Number.isFinite(
        height,
      )
        ? Math.max(
            0,
            height,
          )
        : 0,

  };

}


/* ===========================================================
   VIEWPORT HOOK
=========================================================== */

export function useCustomerViewport():
  CustomerViewportSnapshot {

  const [
    viewport,
    setViewport,
  ] =
    useState<CustomerViewportSnapshot>(
      getInitialCustomerViewport,
    );


  /* =========================================================
     LIVE VIEWPORT LISTENER
  ========================================================= */

  useEffect(() => {

    if (
      typeof window ===
      "undefined"
    ) {

      return undefined;

    }


    const handleResize =
      () => {

        const nextViewport =
          normalizeCustomerViewport(
            window.innerWidth,
            window.innerHeight,
          );


        setViewport(
          (
            currentViewport,
          ) => {

            if (
              currentViewport.width ===
                nextViewport.width &&
              currentViewport.height ===
                nextViewport.height
            ) {

              return currentViewport;

            }


            return nextViewport;

          },
        );

      };


    window.addEventListener(
      "resize",
      handleResize,
    );


    return () => {

      window.removeEventListener(
        "resize",
        handleResize,
      );

    };

  }, []);


  return viewport;

}


/* ===========================================================
   CUSTOMER RESPONSIVE STATE BUILDER
=========================================================== */

function buildCustomerResponsiveState(
  width: number,
  height: number,
): ResponsiveState {

  const profile =
    getCustomerResponsiveProfile(
      width,
    );


  const flags =
    getCustomerDeviceFlags(
      width,
    );


  return {

    /*
     * IMPORTANT:
     * Preserve the complete Customer responsive profile.
     *
     * This keeps properties owned by the global Responsive
     * Engine such as:
     * - device
     * - viewport
     * - index
     * - breakpoint metadata
     *
     * without manually rebuilding the contract.
     */

    ...profile,

    width,

    height,

    tokens:
      getCustomerTokens(
        width,
      ),

    ...flags,

  };

}


/* ===========================================================
   CUSTOMER RESPONSIVE HOOK
=========================================================== */

export function useCustomerResponsive():
  CustomerResponsiveResult {

  const viewport =
    useCustomerViewport();


  /* =========================================================
     RESPONSIVE PROFILE
  ========================================================= */

  const profile =
    useMemo(
      () =>
        getCustomerResponsiveProfile(
          viewport.width,
        ),
      [
        viewport.width,
      ],
    );


  /* =========================================================
     RESPONSIVE TOKENS
  ========================================================= */

  const tokens =
    useMemo(
      () =>
        getCustomerTokens(
          viewport.width,
        ),
      [
        viewport.width,
      ],
    );


  /* =========================================================
     RESPONSIVE STATE
  ========================================================= */

  const state =
    useMemo(
      () => {

        const flags =
          getCustomerDeviceFlags(
            viewport.width,
          );


        return {

          /*
           * Preserve the complete responsive profile.
           * This includes the required `index` property.
           */

          ...profile,

          width:
            viewport.width,

          height:
            viewport.height,

          tokens,

          ...flags,

        };

      },
      [
        viewport.width,
        viewport.height,
        profile,
        tokens,
      ],
    );


  /* =========================================================
     CUSTOMER LAYOUT
  ========================================================= */

  const layout =
    useMemo(
      () =>
        getCustomerLayout(
          viewport.width,
        ),
      [
        viewport.width,
      ],
    );


  /* =========================================================
     RESULT
  ========================================================= */

  return useMemo(
    () => ({

      width:
        viewport.width,

      height:
        viewport.height,

      device:
        state.device,

      state,

      tokens,

      layout,

    }),
    [
      viewport.width,
      viewport.height,
      state,
      tokens,
      layout,
    ],
  );

}


/* ===========================================================
   CUSTOMER DEVICE HOOK
=========================================================== */

export function useCustomerDevice():
  DeviceType {

  const {
    device,
  } =
    useCustomerResponsive();


  return device;

}


/* ===========================================================
   CUSTOMER STATE HOOK
=========================================================== */

export function useCustomerResponsiveState():
  ResponsiveState {

  const {
    state,
  } =
    useCustomerResponsive();


  return state;

}


/* ===========================================================
   CUSTOMER TOKENS HOOK
=========================================================== */

export function useCustomerResponsiveTokens():
  ResponsiveTokens {

  const {
    tokens,
  } =
    useCustomerResponsive();


  return tokens;

}


/* ===========================================================
   CUSTOMER LAYOUT HOOK
=========================================================== */

export function useCustomerResponsiveLayout():
  CustomerLayout {

  const {
    layout,
  } =
    useCustomerResponsive();


  return layout;

}


/* ===========================================================
   END
=========================================================== */