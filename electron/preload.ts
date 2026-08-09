// ============================================================
// FINORA ENTERPRISE OS™
// ELECTRON PRELOAD
// V2 SECURE STORAGE BRIDGE
//
// RESPONSIBILITY:
//
// - Expose a minimal FINORA API to the renderer
// - Keep contextIsolation enabled
// - Keep Node.js APIs away from the renderer
// - Bridge V2 USB storage operations through IPC
//
// IMPORTANT:
//
// - No arbitrary filesystem API is exposed.
// - Renderer receives only FINORA-specific operations.
// - Actual filesystem access remains inside Electron main.
// - This bridge is for FINORA V2 storage only.
//
// VERSION : 2.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  contextBridge,
  ipcRenderer,
} from "electron";


// ============================================================
// TYPES
// ============================================================

interface StorageQuery {
  entity: string;
  id?: string;
  ownerId?: string;
  demoId?: string;
  limit?: number;
  offset?: number;
}

interface StorageWriteOptions {
  ownerId?: string;
  demoId?: string;
}

interface UsbStorageStatus {
  availability: string;
  storageId?: string;
  message?: string;
}

interface UsbStorageBridge {
  isAvailable: () => Promise<boolean>;

  getStatus: () => Promise<UsbStorageStatus>;

  get: (
    query: StorageQuery,
  ) => Promise<unknown>;

  getAll: (
    query: StorageQuery,
  ) => Promise<unknown>;

  save: (
    record: unknown,
    options?: StorageWriteOptions,
  ) => Promise<unknown>;

  update: (
    record: unknown,
    options?: StorageWriteOptions,
  ) => Promise<unknown>;

  delete: (
    query: StorageQuery,
  ) => Promise<unknown>;

  replaceAll: (
    records: unknown[],
    options?: StorageWriteOptions,
  ) => Promise<unknown>;

  clear: (
    query: StorageQuery,
  ) => Promise<unknown>;
}


// ============================================================
// IPC CHANNELS
// ============================================================

const USB_CHANNELS = {
  IS_AVAILABLE: "finora:usb:is-available",

  GET_STATUS: "finora:usb:get-status",

  GET: "finora:usb:get",

  GET_ALL: "finora:usb:get-all",

  SAVE: "finora:usb:save",

  UPDATE: "finora:usb:update",

  DELETE: "finora:usb:delete",

  REPLACE_ALL: "finora:usb:replace-all",

  CLEAR: "finora:usb:clear",
} as const;


// ============================================================
// SECURE USB BRIDGE
// ============================================================

const usbBridge: UsbStorageBridge = {

  // ----------------------------------------------------------
  // AVAILABILITY
  // ----------------------------------------------------------

  isAvailable: () =>
    ipcRenderer.invoke(
      USB_CHANNELS.IS_AVAILABLE,
    ),


  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  getStatus: () =>
    ipcRenderer.invoke(
      USB_CHANNELS.GET_STATUS,
    ),


  // ----------------------------------------------------------
  // GET
  // ----------------------------------------------------------

  get: (
    query: StorageQuery,
  ) =>
    ipcRenderer.invoke(
      USB_CHANNELS.GET,
      query,
    ),


  // ----------------------------------------------------------
  // GET ALL
  // ----------------------------------------------------------

  getAll: (
    query: StorageQuery,
  ) =>
    ipcRenderer.invoke(
      USB_CHANNELS.GET_ALL,
      query,
    ),


  // ----------------------------------------------------------
  // SAVE
  // ----------------------------------------------------------

  save: (
    record: unknown,
    options?: StorageWriteOptions,
  ) =>
    ipcRenderer.invoke(
      USB_CHANNELS.SAVE,
      record,
      options,
    ),


  // ----------------------------------------------------------
  // UPDATE
  // ----------------------------------------------------------

  update: (
    record: unknown,
    options?: StorageWriteOptions,
  ) =>
    ipcRenderer.invoke(
      USB_CHANNELS.UPDATE,
      record,
      options,
    ),


  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  delete: (
    query: StorageQuery,
  ) =>
    ipcRenderer.invoke(
      USB_CHANNELS.DELETE,
      query,
    ),


  // ----------------------------------------------------------
  // REPLACE ALL
  // ----------------------------------------------------------

  replaceAll: (
    records: unknown[],
    options?: StorageWriteOptions,
  ) =>
    ipcRenderer.invoke(
      USB_CHANNELS.REPLACE_ALL,
      records,
      options,
    ),


  // ----------------------------------------------------------
  // CLEAR
  // ----------------------------------------------------------

  clear: (
    query: StorageQuery,
  ) =>
    ipcRenderer.invoke(
      USB_CHANNELS.CLEAR,
      query,
    ),
};


// ============================================================
// FINORA RENDERER BRIDGE
// ============================================================

contextBridge.exposeInMainWorld(
  "finora",
  {
    version: "2.0.0",

    usb: usbBridge,
  },
);


// ============================================================
// MODULE EXPORT
// ============================================================

export {};
