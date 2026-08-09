// ============================================================
// FINORA ENTERPRISE OS™
// V2 USB / PENDRIVE STORAGE ADAPTER
//
// RESPONSIBILITY:
//
// - V2 USB storage adapter implementation
// - Follow the common StorageAdapter contract
// - Represent connected/disconnected USB storage safely
// - Keep Demo/Real context separate from storage mode
// - Prepare the renderer side for secure Electron IPC
//
// IMPORTANT:
//
// - NO localStorage fallback.
// - NO direct filesystem access.
// - NO Node.js filesystem APIs.
// - NO arbitrary path access from renderer.
// - Actual filesystem operations are provided through the
//   secure Electron preload bridge.
//
// VERSION : 2.0
// STATUS  : Production Foundation
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import {
  DataContext,
  StorageAdapter,
  StorageAvailability,
  StorageConfiguration,
  StorageMode,
  StorageQuery,
  StorageResult,
  StorageStatus,
  StorageWriteOptions,
} from "../storage.types";


// ============================================================
// ELECTRON USB BRIDGE CONTRACT
// ============================================================

/**
 * Narrow renderer-side contract for the Electron USB bridge.
 *
 * Actual implementation:
 *
 * Renderer
 *    ↓
 * window.finora
 *    ↓
 * preload.ts
 *    ↓
 * Electron IPC
 *    ↓
 * main.ts
 *    ↓
 * USB filesystem
 *
 * This adapter does not access the filesystem directly.
 */

interface FinoraUsbBridge {

  isAvailable?: () => Promise<boolean>;

  getStatus?: () => Promise<{
    availability: StorageAvailability;
    storageId?: string;
    message?: string;
  }>;

  get?: (
    query: StorageQuery,
  ) => Promise<StorageResult>;

  getAll?: (
    query: StorageQuery,
  ) => Promise<StorageResult>;

  save?: (
    record: unknown,
    options?: StorageWriteOptions,
  ) => Promise<StorageResult<unknown>>;

  update?: (
    record: unknown,
    options?: StorageWriteOptions,
  ) => Promise<StorageResult<unknown>>;

  delete?: (
    query: StorageQuery,
  ) => Promise<StorageResult<void>>;

  replaceAll?: (
    records: unknown[],
    options?: StorageWriteOptions,
  ) => Promise<StorageResult<void>>;

  clear?: (
    query: StorageQuery,
  ) => Promise<StorageResult<void>>;
}


// ============================================================
// GLOBAL BRIDGE LOOKUP
// ============================================================

function getUsbBridge(): FinoraUsbBridge | undefined {

  const runtime =
    globalThis as typeof globalThis & {
      finora?: {
        usb?: FinoraUsbBridge;
      };
    };

  return runtime.finora?.usb;
}


// ============================================================
// USB STORAGE ADAPTER
// ============================================================

export class USBStorageAdapter
  implements StorageAdapter {

  // ----------------------------------------------------------
  // STORAGE MODE
  // ----------------------------------------------------------

  readonly mode = StorageMode.USB;


  // ----------------------------------------------------------
  // CURRENT CONFIGURATION
  // ----------------------------------------------------------

  private configuration:
    StorageConfiguration | null = null;


  // ----------------------------------------------------------
  // CURRENT STATUS
  // ----------------------------------------------------------

  private status: StorageStatus = {
    mode: StorageMode.USB,

    availability:
      StorageAvailability.NOT_CONFIGURED,

    dataContext: DataContext.REAL,

    checkedAt:
      new Date().toISOString(),
  };


  // ==========================================================
  // INITIALIZE
  // ==========================================================

  async initialize(
    configuration: StorageConfiguration,
  ): Promise<StorageResult<void>> {

    if (
      configuration.storageMode !==
      StorageMode.USB
    ) {
      return {
        success: false,

        error:
          "USB storage adapter requires StorageMode.USB.",
      };
    }


    this.configuration = {
      ...configuration,
    };


    this.status = {
      mode: StorageMode.USB,

      availability:
        StorageAvailability.NOT_CONFIGURED,

      dataContext:
        configuration.dataContext,

      ownerId:
        configuration.ownerId,

      demoId:
        configuration.demoId,

      storageId:
        configuration.storageId,

      checkedAt:
        new Date().toISOString(),
    };


    await this.refreshStatus();


    return {
      success: true,
    };
  }


  // ==========================================================
  // AVAILABILITY
  // ==========================================================

  async isAvailable(): Promise<boolean> {

    const bridge =
      getUsbBridge();


    if (!bridge?.isAvailable) {
      return false;
    }


    try {

      const available =
        await bridge.isAvailable();


      if (!available) {

        this.status = {
          ...this.status,

          availability:
            StorageAvailability.DISCONNECTED,

          checkedAt:
            new Date().toISOString(),
        };

        return false;
      }


      this.status = {
        ...this.status,

        availability:
          StorageAvailability.READY,

        checkedAt:
          new Date().toISOString(),
      };


      return true;

    } catch {

      this.status = {
        ...this.status,

        availability:
          StorageAvailability.ERROR,

        checkedAt:
          new Date().toISOString(),
      };


      return false;
    }
  }


  // ==========================================================
  // STATUS
  // ==========================================================

  async getStatus(): Promise<StorageStatus> {

    await this.refreshStatus();

    return {
      ...this.status,
    };
  }


  // ==========================================================
  // REFRESH STATUS
  // ==========================================================

  private async refreshStatus(): Promise<void> {

    const bridge =
      getUsbBridge();


    if (!bridge) {

      this.status = {
        ...this.status,

        availability:
          StorageAvailability.NOT_CONFIGURED,

        message:
          "FINORA USB storage bridge is not configured.",

        checkedAt:
          new Date().toISOString(),
      };

      return;
    }


    if (!bridge.getStatus) {

      const available =
        await this.isAvailable();


      if (!available) {

        this.status = {
          ...this.status,

          availability:
            StorageAvailability.DISCONNECTED,

          checkedAt:
            new Date().toISOString(),
        };
      }

      return;
    }


    try {

      const result =
        await bridge.getStatus();


      this.status = {
        ...this.status,

        availability:
          result.availability,

        storageId:
          result.storageId ??
          this.status.storageId,

        message:
          result.message,

        checkedAt:
          new Date().toISOString(),
      };

    } catch (error) {

      this.status = {
        ...this.status,

        availability:
          StorageAvailability.ERROR,

        message:
          error instanceof Error
            ? error.message
            : "Unable to determine USB storage status.",

        checkedAt:
          new Date().toISOString(),
      };
    }
  }


  // ==========================================================
  // GET
  // ==========================================================

  async get<T = unknown>(
    query: StorageQuery,
  ): Promise<StorageResult<T | undefined>> {

    const bridge =
      getUsbBridge();


    if (!bridge?.get) {

      return {
        success: false,

        error:
          "USB storage is not connected or the secure USB bridge is unavailable.",
      };
    }


    try {

      const result =
        await bridge.get(query);


      return result as StorageResult<
        T | undefined
      >;

    } catch (error) {

      return {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to read USB storage.",
      };
    }
  }


  // ==========================================================
  // GET ALL
  // ==========================================================

  async getAll<T = unknown>(
    query: StorageQuery,
  ): Promise<StorageResult<T[]>> {

    const bridge =
      getUsbBridge();


    if (!bridge?.getAll) {

      return {
        success: false,

        error:
          "USB storage is not connected or the secure USB bridge is unavailable.",
      };
    }


    try {

      const result =
        await bridge.getAll(query);


      return result as StorageResult<T[]>;

    } catch (error) {

      return {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to read USB storage records.",
      };
    }
  }


  // ==========================================================
  // SAVE
  // ==========================================================

  async save<T = unknown>(
    record: T,
    options?: StorageWriteOptions,
  ): Promise<StorageResult<T>> {

    const bridge =
      getUsbBridge();


    if (!bridge?.save) {

      return {
        success: false,

        error:
          "USB storage is not connected or the secure USB bridge is unavailable.",
      };
    }


    try {

      const result =
        await bridge.save(
          record,
          options,
        );


      return result as StorageResult<T>;

    } catch (error) {

      return {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to save data to USB storage.",
      };
    }
  }


  // ==========================================================
  // UPDATE
  // ==========================================================

  async update<T = unknown>(
    record: T,
    options?: StorageWriteOptions,
  ): Promise<StorageResult<T>> {

    const bridge =
      getUsbBridge();


    if (!bridge?.update) {

      return {
        success: false,

        error:
          "USB storage is not connected or the secure USB bridge is unavailable.",
      };
    }


    try {

      const result =
        await bridge.update(
          record,
          options,
        );


      return result as StorageResult<T>;

    } catch (error) {

      return {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to update USB storage.",
      };
    }
  }


  // ==========================================================
  // DELETE
  // ==========================================================

  async delete(
    query: StorageQuery,
  ): Promise<StorageResult<void>> {

    const bridge =
      getUsbBridge();


    if (!bridge?.delete) {

      return {
        success: false,

        error:
          "USB storage is not connected or the secure USB bridge is unavailable.",
      };
    }


    try {

      const result =
        await bridge.delete(query);


      return result as StorageResult<void>;

    } catch (error) {

      return {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to delete USB storage record.",
      };
    }
  }


  // ==========================================================
  // REPLACE ALL
  // ==========================================================

  async replaceAll<T = unknown>(
    records: T[],
    options?: StorageWriteOptions,
  ): Promise<StorageResult<void>> {

    const bridge =
      getUsbBridge();


    if (!bridge?.replaceAll) {

      return {
        success: false,

        error:
          "USB storage is not connected or the secure USB bridge is unavailable.",
      };
    }


    try {

      const result =
        await bridge.replaceAll(
          records,
          options,
        );


      return result as StorageResult<void>;

    } catch (error) {

      return {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to replace USB storage records.",
      };
    }
  }


  // ==========================================================
  // CLEAR
  // ==========================================================

  async clear(
    query: StorageQuery,
  ): Promise<StorageResult<void>> {

    const bridge =
      getUsbBridge();


    if (!bridge?.clear) {

      return {
        success: false,

        error:
          "USB storage is not connected or the secure USB bridge is unavailable.",
      };
    }


    try {

      const result =
        await bridge.clear(query);


      return result as StorageResult<void>;

    } catch (error) {

      return {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to clear USB storage.",
      };
    }
  }
}


// ============================================================
// SINGLETON
// ============================================================

export const usbStorageAdapter =
  new USBStorageAdapter();
