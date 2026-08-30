// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 USB STORAGE
// CROSS-PLATFORM USB BRIDGE
//
// RESPONSIBILITY:
//
// - Resolve FINORA USB operations per runtime
// - Use Electron preload USB API on desktop
// - Use native FinoraUsb Capacitor plugin on Android
// - Keep Login and USBStorageAdapter platform-independent
//
// IMPORTANT:
//
// - NO LOCAL fallback.
// - NO direct renderer filesystem access.
// - Android native calls use object payloads required by
//   Capacitor and are adapted back to the existing FINORA
//   renderer bridge contract.
// - USB access remains FINORA-scoped.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  Capacitor,
  registerPlugin,
} from "@capacitor/core";

import type {
  StorageAvailability,
  StorageQuery,
  StorageResult,
  StorageWriteOptions,
} from "./storage.types";

// ============================================================
// USB STATUS
// ============================================================

export interface FinoraUsbStatus {
  availability:
    StorageAvailability;

  storageId?:
    string;

  message?:
    string;
}

// ============================================================
// RENDERER USB BRIDGE CONTRACT
// ============================================================

export interface FinoraUsbBridge {

  isAvailable?():
    Promise<boolean>;

  getStatus?():
    Promise<FinoraUsbStatus>;

  /**
   * Android SAF permission / USB-root selection entry point.
   *
   * Electron does not require this method because the desktop
   * main process discovers removable drives directly.
   */
  requestAccess?():
    Promise<
      StorageResult<FinoraUsbStatus>
    >;

  get?(
    query:
      StorageQuery,
  ):
    Promise<
      StorageResult
    >;

  getAll?(
    query:
      StorageQuery,
  ):
    Promise<
      StorageResult
    >;

  save?(
    record:
      unknown,
    options?:
      StorageWriteOptions,
  ):
    Promise<
      StorageResult<unknown>
    >;

  update?(
    record:
      unknown,
    options?:
      StorageWriteOptions,
  ):
    Promise<
      StorageResult<unknown>
    >;

  delete?(
    query:
      StorageQuery,
  ):
    Promise<
      StorageResult<void>
    >;

  replaceAll?(
    records:
      unknown[],
    options?:
      StorageWriteOptions,
  ):
    Promise<
      StorageResult<void>
    >;

  clear?(
    query:
      StorageQuery,
  ):
    Promise<
      StorageResult<void>
    >;

  resetFinoraData?():
    Promise<
      StorageResult<void>
    >;
}

// ============================================================
// ANDROID NATIVE PLUGIN CONTRACT
//
// Capacitor plugin methods accept one object payload.
// ============================================================

interface FinoraAndroidUsbPlugin {

  isAvailable():
    Promise<{
      value:
        boolean;
    }>;

  getStatus():
    Promise<
      FinoraUsbStatus
    >;

  requestAccess():
    Promise<
      StorageResult<FinoraUsbStatus>
    >;

  get(
    request: {
      query:
        StorageQuery;
    },
  ):
    Promise<
      StorageResult
    >;

  getAll(
    request: {
      query:
        StorageQuery;
    },
  ):
    Promise<
      StorageResult
    >;

  save(
    request: {
      record:
        unknown;

      options?:
        StorageWriteOptions;
    },
  ):
    Promise<
      StorageResult<unknown>
    >;

  update(
    request: {
      record:
        unknown;

      options?:
        StorageWriteOptions;
    },
  ):
    Promise<
      StorageResult<unknown>
    >;

  delete(
    request: {
      query:
        StorageQuery;
    },
  ):
    Promise<
      StorageResult<void>
    >;

  replaceAll(
    request: {
      records:
        unknown[];

      options?:
        StorageWriteOptions;
    },
  ):
    Promise<
      StorageResult<void>
    >;

  clear(
    request: {
      query:
        StorageQuery;
    },
  ):
    Promise<
      StorageResult<void>
    >;

  resetFinoraData():
    Promise<
      StorageResult<void>
    >;
}

// ============================================================
// ANDROID CAPACITOR PLUGIN
// ============================================================

const finoraAndroidUsbPlugin =
  registerPlugin<
    FinoraAndroidUsbPlugin
  >(
    "FinoraUsb",
  );

// ============================================================
// ELECTRON BRIDGE RESOLUTION
// ============================================================

function getElectronUsbBridge():
  FinoraUsbBridge | undefined {

  const bridge =
    window.finora?.usb;

  if (!bridge) {
    return undefined;
  }

  return bridge;
}

// ============================================================
// ANDROID BRIDGE RESOLUTION
// ============================================================

function getAndroidUsbBridge():
  FinoraUsbBridge | undefined {

  if (!Capacitor.isNativePlatform()) {
    return undefined;
  }

  if (
    Capacitor.getPlatform() !==
    "android"
  ) {
    return undefined;
  }

  if (
    !Capacitor.isPluginAvailable(
      "FinoraUsb",
    )
  ) {
    return undefined;
  }

  return {

    isAvailable:
      async () => {

        const result =
          await finoraAndroidUsbPlugin
            .isAvailable();

        return result.value;
      },

    getStatus:
      async () =>
        finoraAndroidUsbPlugin
          .getStatus(),

    requestAccess:
      async () =>
        finoraAndroidUsbPlugin
          .requestAccess(),

    get:
      async (
        query,
      ) =>
        finoraAndroidUsbPlugin
          .get({
            query,
          }),

    getAll:
      async (
        query,
      ) =>
        finoraAndroidUsbPlugin
          .getAll({
            query,
          }),

    save:
      async (
        record,
        options,
      ) =>
        finoraAndroidUsbPlugin
          .save({
            record,
            options,
          }),

    update:
      async (
        record,
        options,
      ) =>
        finoraAndroidUsbPlugin
          .update({
            record,
            options,
          }),

    delete:
      async (
        query,
      ) =>
        finoraAndroidUsbPlugin
          .delete({
            query,
          }),

    replaceAll:
      async (
        records,
        options,
      ) =>
        finoraAndroidUsbPlugin
          .replaceAll({
            records,
            options,
          }),

    clear:
      async (
        query,
      ) =>
        finoraAndroidUsbPlugin
          .clear({
            query,
          }),

    resetFinoraData:
      async () =>
        finoraAndroidUsbPlugin
          .resetFinoraData(),
  };
}

// ============================================================
// PUBLIC RESOLVER
// ============================================================

/**
 * Resolve the secure FINORA USB API for the current runtime.
 *
 * Priority:
 *
 * 1. Electron preload bridge
 * 2. Android Capacitor native plugin
 *
 * Undefined means the current runtime does not expose a FINORA
 * USB implementation.
 */
export function getFinoraUsbBridge():
  FinoraUsbBridge | undefined {

  const electronBridge =
    getElectronUsbBridge();

  if (electronBridge) {
    return electronBridge;
  }

  return getAndroidUsbBridge();
}

// ============================================================
// END
// ============================================================
