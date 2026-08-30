// ============================================================
// FINORA ENTERPRISE OSâ„¢
// ELECTRON PRELOAD
// V2 SECURE STORAGE BRIDGE
//
// RESPONSIBILITY:
//
// - Expose a minimal FINORA API to the renderer
// - Keep contextIsolation enabled
// - Keep Node.js APIs away from the renderer
// - Bridge V2 USB storage operations through IPC
// - Expose the dedicated FINORA data reset operation
//
// IMPORTANT:
//
// - No arbitrary filesystem API is exposed.
// - Renderer receives only FINORA-specific operations.
// - Actual filesystem access remains inside Electron main.
// - RESET FINORA DATA does NOT format the USB device.
// - RESET FINORA DATA does NOT delete unrelated USB files.
// - The actual reset implementation remains inside Electron main.
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


interface StorageResult<T = unknown> {

  success: boolean;

  data?: T;

  error?: string;
}


interface UsbStorageStatus {

  availability: string;

  storageId?: string;

  message?: string;
}


interface UsbStorageBridge {

  // ----------------------------------------------------------
  // AVAILABILITY
  // ----------------------------------------------------------

  isAvailable:
    () => Promise<boolean>;


  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  getStatus:
    () => Promise<UsbStorageStatus>;


  // ----------------------------------------------------------
  // GET
  // ----------------------------------------------------------

  get:
    <T = unknown>(
      query: StorageQuery,
    ) =>
      Promise<
        StorageResult<
          T | undefined
        >
      >;


  // ----------------------------------------------------------
  // GET ALL
  // ----------------------------------------------------------

  getAll:
    <T = unknown>(
      query: StorageQuery,
    ) =>
      Promise<
        StorageResult<T[]>
      >;


  // ----------------------------------------------------------
  // SAVE
  // ----------------------------------------------------------

  save:
    <T = unknown>(
      record: unknown,

      options?:
        StorageWriteOptions,
    ) =>
      Promise<
        StorageResult<T>
      >;


  // ----------------------------------------------------------
  // UPDATE
  // ----------------------------------------------------------

  update:
    <T = unknown>(
      record: unknown,

      options?:
        StorageWriteOptions,
    ) =>
      Promise<
        StorageResult<T>
      >;


  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  delete:
    (
      query: StorageQuery,
    ) =>
      Promise<
        StorageResult<void>
      >;


  // ----------------------------------------------------------
  // REPLACE ALL
  // ----------------------------------------------------------

  replaceAll:
    (
      records: unknown[],

      options?:
        StorageWriteOptions,
    ) =>
      Promise<
        StorageResult<void>
      >;


  // ----------------------------------------------------------
  // CLEAR
  // ----------------------------------------------------------

  clear:
    (
      query: StorageQuery,
    ) =>
      Promise<
        StorageResult<void>
      >;


  // ----------------------------------------------------------
  // RESET FINORA DATA
  //
  // IMPORTANT:
  //
  // This invokes ONLY the dedicated FINORA reset IPC channel.
  //
  // No filesystem path is accepted from the renderer.
  // No drive letter is accepted from the renderer.
  // No arbitrary delete operation is exposed.
  // ----------------------------------------------------------

  resetFinoraData:
    () =>
      Promise<
        StorageResult<void>
      >;
}


// ============================================================
// FINORA CONTROL TYPES
// ============================================================

type FinoraControlStorageMode =
  | "LOCAL"
  | "USB";

interface FinoraControlInstallationIdentity {
  installationId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  createdAt: string;

  updatedAt: string;

  schemaVersion: 1;
}

interface FinoraControlBranchActivation {
  activationId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  status:
    | "PENDING"
    | "ACTIVE"
    | "SUSPENDED"
    | "DEACTIVATED";

  activatedAt?: string;

  createdAt: string;

  updatedAt: string;

  schemaVersion: 1;
}

interface FindBranchActivationRequest {
  ownerId: string;

  businessId: string;

  branchId: string;
}

interface StorageEntitlementCheckRequest {
  userId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  storageMode: FinoraControlStorageMode;
}

interface FinoraControlBridge {
  getInstallation:
    () =>
      Promise<
        StorageResult<
          FinoraControlInstallationIdentity | undefined
        >
      >;

  findBranchActivation:
    (
      request:
        FindBranchActivationRequest,
    ) =>
      Promise<
        StorageResult<
          FinoraControlBranchActivation | undefined
        >
      >;

  hasActiveStorageEntitlement:
    (
      request:
        StorageEntitlementCheckRequest,
    ) =>
      Promise<
        StorageResult<boolean>
      >;
}


// ============================================================
// IPC CHANNELS
// ============================================================

const USB_CHANNELS = {

  IS_AVAILABLE:
    "finora:usb:is-available",

  GET_STATUS:
    "finora:usb:get-status",

  GET:
    "finora:usb:get",

  GET_ALL:
    "finora:usb:get-all",

  SAVE:
    "finora:usb:save",

  UPDATE:
    "finora:usb:update",

  DELETE:
    "finora:usb:delete",

  REPLACE_ALL:
    "finora:usb:replace-all",

  CLEAR:
    "finora:usb:clear",

  RESET_FINORA_DATA:
    "finora:usb:reset-finora-data",

} as const;


// ============================================================
// CONTROL IPC CHANNELS
// ============================================================

const CONTROL_CHANNELS = {

  GET_INSTALLATION:
    "finora:control:get-installation",

  FIND_BRANCH_ACTIVATION:
    "finora:control:find-branch-activation",

  HAS_ACTIVE_STORAGE_ENTITLEMENT:
    "finora:control:has-active-storage-entitlement",

} as const;


// ============================================================
// SECURE USB BRIDGE
// ============================================================

const usbBridge:
  UsbStorageBridge = {

  // ==========================================================
  // AVAILABILITY
  // ==========================================================

  isAvailable:
    () =>
      ipcRenderer.invoke(
        USB_CHANNELS.IS_AVAILABLE,
      ),


  // ==========================================================
  // STATUS
  // ==========================================================

  getStatus:
    () =>
      ipcRenderer.invoke(
        USB_CHANNELS.GET_STATUS,
      ),


  // ==========================================================
  // GET
  // ==========================================================

  get:
    <T = unknown>(
      query:
        StorageQuery,
    ) =>
      ipcRenderer.invoke(
        USB_CHANNELS.GET,
        query,
      ) as Promise<
        StorageResult<
          T | undefined
        >
      >,


  // ==========================================================
  // GET ALL
  // ==========================================================

  getAll:
    <T = unknown>(
      query:
        StorageQuery,
    ) =>
      ipcRenderer.invoke(
        USB_CHANNELS.GET_ALL,
        query,
      ) as Promise<
        StorageResult<T[]>
      >,


  // ==========================================================
  // SAVE
  // ==========================================================

  save:
    <T = unknown>(
      record:
        unknown,

      options?:
        StorageWriteOptions,
    ) =>
      ipcRenderer.invoke(
        USB_CHANNELS.SAVE,
        record,
        options,
      ) as Promise<
        StorageResult<T>
      >,


  // ==========================================================
  // UPDATE
  // ==========================================================

  update:
    <T = unknown>(
      record:
        unknown,

      options?:
        StorageWriteOptions,
    ) =>
      ipcRenderer.invoke(
        USB_CHANNELS.UPDATE,
        record,
        options,
      ) as Promise<
        StorageResult<T>
      >,


  // ==========================================================
  // DELETE
  // ==========================================================

  delete:
    (
      query:
        StorageQuery,
    ) =>
      ipcRenderer.invoke(
        USB_CHANNELS.DELETE,
        query,
      ) as Promise<
        StorageResult<void>
      >,


  // ==========================================================
  // REPLACE ALL
  // ==========================================================

  replaceAll:
    (
      records:
        unknown[],

      options?:
        StorageWriteOptions,
    ) =>
      ipcRenderer.invoke(
        USB_CHANNELS.REPLACE_ALL,
        records,
        options,
      ) as Promise<
        StorageResult<void>
      >,


  // ==========================================================
  // CLEAR
  // ==========================================================

  clear:
    (
      query:
        StorageQuery,
    ) =>
      ipcRenderer.invoke(
        USB_CHANNELS.CLEAR,
        query,
      ) as Promise<
        StorageResult<void>
      >,


  // ==========================================================
  // RESET FINORA DATA
  //
  // The renderer only requests a FINORA reset.
  //
  // Electron main decides:
  //
  // - Which removable device is valid
  // - Which FINORA storage namespace is valid
  // - Which file is allowed to change
  //
  // The renderer cannot provide a filesystem path.
  // ==========================================================

  resetFinoraData:
    () =>
      ipcRenderer.invoke(
        USB_CHANNELS.RESET_FINORA_DATA,
      ) as Promise<
        StorageResult<void>
      >,
};


// ============================================================
// FINORA CONTROL BRIDGE
//
// READ / CHECK ONLY.
//
// Activation creation and storage entitlement granting are
// intentionally NOT exposed to the renderer.
// ============================================================

const controlBridge:
  FinoraControlBridge = {

  // ----------------------------------------------------------
  // INSTALLATION IDENTITY
  // ----------------------------------------------------------

  getInstallation:
    () =>
      ipcRenderer.invoke(
        CONTROL_CHANNELS.GET_INSTALLATION,
      ) as Promise<
        StorageResult<
          FinoraControlInstallationIdentity | undefined
        >
      >,


  // ----------------------------------------------------------
  // BRANCH ACTIVATION
  // ----------------------------------------------------------

  findBranchActivation:
    (
      request:
        FindBranchActivationRequest,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CHANNELS.FIND_BRANCH_ACTIVATION,
        request,
      ) as Promise<
        StorageResult<
          FinoraControlBranchActivation | undefined
        >
      >,


  // ----------------------------------------------------------
  // STORAGE ENTITLEMENT CHECK
  // ----------------------------------------------------------

  hasActiveStorageEntitlement:
    (
      request:
        StorageEntitlementCheckRequest,
    ) =>
      ipcRenderer.invoke(
        CONTROL_CHANNELS.HAS_ACTIVE_STORAGE_ENTITLEMENT,
        request,
      ) as Promise<
        StorageResult<boolean>
      >,
};


// ============================================================
// FINORA RENDERER BRIDGE
// ============================================================

contextBridge.exposeInMainWorld(
  "finora",
  {

    version:
      "2.0.0",

    usb:
      usbBridge,

    control:
      controlBridge,

  },
);


// ============================================================
// MODULE EXPORT
// ============================================================

export {};
