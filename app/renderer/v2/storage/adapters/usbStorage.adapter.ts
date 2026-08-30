// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 USB / PENDRIVE STORAGE ADAPTER
//
// RESPONSIBILITY:
//
// - V2 USB storage adapter implementation
// - Follow the common StorageAdapter contract
// - Represent connected/disconnected USB storage safely
// - Keep Demo/Real context separate from storage mode
// - Prepare the renderer side for secure Electron IPC
// - Provide the FINORA-only data reset boundary
//
// IMPORTANT:
//
// - NO localStorage fallback.
// - NO direct filesystem access.
// - NO Node.js filesystem APIs.
// - NO arbitrary path access from renderer.
// - Actual filesystem operations are provided through the
//   secure Electron preload bridge.
// - FINORA reset MUST be implemented by the secure main-process
//   bridge.
// - Reset MUST NOT format the USB device.
// - Reset MUST NOT delete files outside FINORA storage.
//
// STARTUP BEHAVIOUR:
//
// - USB status checking MUST NOT block application startup.
// - initialize() establishes the adapter configuration first.
// - Initial USB status is refreshed asynchronously.
// - Later getStatus() / isAvailable() calls perform a fresh check.
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

import {
  getFinoraUsbBridge,
} from "../usbBridge";


// ============================================================
// USB STORAGE ADAPTER
// ============================================================

export class USBStorageAdapter
  implements StorageAdapter {

  // ----------------------------------------------------------
  // STORAGE MODE
  // ----------------------------------------------------------

  readonly mode =
    StorageMode.USB;


  // ----------------------------------------------------------
  // CURRENT CONFIGURATION
  // ----------------------------------------------------------

  private configuration:
    StorageConfiguration | null =
      null;


  // ----------------------------------------------------------
  // CURRENT STATUS
  // ----------------------------------------------------------

  private status:
    StorageStatus = {

    mode:
      StorageMode.USB,

    availability:
      StorageAvailability.NOT_CONFIGURED,

    dataContext:
      DataContext.REAL,

    checkedAt:
      new Date().toISOString(),
  };


  // ==========================================================
  // INITIALIZE
  // ==========================================================
  //
  // IMPORTANT:
  //
  // This method MUST NOT block application startup while waiting
  // for USB status IPC.
  //
  // The configuration becomes active immediately.
  //
  // The initial USB status refresh runs asynchronously.
  // ==========================================================

  async initialize(
    configuration:
      StorageConfiguration,
  ):
    Promise<
      StorageResult
    > {

    if (
      configuration.storageMode !==
      StorageMode.USB
    ) {

      return {

        success:
          false,

        error:
          "USB storage adapter requires StorageMode.USB.",
      };
    }


    // --------------------------------------------------------
    // Store configuration immediately.
    // --------------------------------------------------------

    this.configuration = {
      ...configuration,
    };


    // --------------------------------------------------------
    // Set a deterministic initial state.
    //
    // We do NOT claim READY until the bridge confirms that
    // the USB storage is actually available.
    // --------------------------------------------------------

    this.status = {

      mode:
        StorageMode.USB,

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


    // --------------------------------------------------------
    // NON-BLOCKING INITIAL STATUS CHECK
    //
    // Critical:
    //
    // Do NOT await this call.
    //
    // The application is allowed to continue mounting while
    // USB availability is being determined.
    // --------------------------------------------------------

    void this.refreshStatus();


    return {

      success:
        true,
    };
  }


  // ==========================================================
  // AVAILABILITY
  // ==========================================================

  async isAvailable():
    Promise<boolean> {

    const bridge =
      getFinoraUsbBridge();


    if (!bridge?.isAvailable) {

      this.status = {

        ...this.status,

        availability:
          StorageAvailability.NOT_CONFIGURED,

        message:
          "FINORA USB storage bridge is not configured.",

        checkedAt:
          new Date().toISOString(),
      };

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

          message:
            "FINORA USB storage is disconnected.",

          checkedAt:
            new Date().toISOString(),
        };

        return false;
      }


      this.status = {

        ...this.status,

        availability:
          StorageAvailability.READY,

        message:
          undefined,

        checkedAt:
          new Date().toISOString(),
      };


      return true;

    } catch (error) {

      this.status = {

        ...this.status,

        availability:
          StorageAvailability.ERROR,

        message:
          error instanceof Error
            ? error.message
            : "Unable to determine USB storage availability.",

        checkedAt:
          new Date().toISOString(),
      };


      return false;
    }
  }


  // ==========================================================
  // STATUS
  // ==========================================================

  async getStatus():
    Promise<StorageStatus> {

    await this.refreshStatus();


    return {
      ...this.status,
    };
  }


  // ==========================================================
  // REFRESH STATUS
  // ==========================================================

  private async refreshStatus():
    Promise<void> {

    const bridge =
      getFinoraUsbBridge();


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


    // --------------------------------------------------------
    // Preferred status API
    // --------------------------------------------------------

    if (bridge.getStatus) {

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

        return;

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

        return;
      }
    }


    // --------------------------------------------------------
    // Fallback availability API
    // --------------------------------------------------------

    if (bridge.isAvailable) {

      await this.isAvailable();

      return;
    }


    // --------------------------------------------------------
    // No usable status API
    // --------------------------------------------------------

    this.status = {

      ...this.status,

      availability:
        StorageAvailability.NOT_CONFIGURED,

      message:
        "FINORA USB storage status bridge is unavailable.",

      checkedAt:
        new Date().toISOString(),
    };
  }


  // ==========================================================
  // GET
  // ==========================================================

  async get<T = unknown>(
    query:
      StorageQuery,
  ):
    Promise<
      StorageResult<T | undefined>
    > {

    const bridge =
      getFinoraUsbBridge();


    if (!bridge?.get) {

      return {

        success:
          false,

        error:
          "USB storage is not connected or the secure USB bridge is unavailable.",
      };
    }


    try {

      const result =
        await bridge.get(
          query,
        );


      return result as
        StorageResult<T | undefined>;

    } catch (error) {

      return {

        success:
          false,

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
    query:
      StorageQuery,
  ):
    Promise<
      StorageResult<T[]>
    > {

    const bridge =
      getFinoraUsbBridge();


    if (!bridge?.getAll) {

      return {

        success:
          false,

        error:
          "USB storage is not connected or the secure USB bridge is unavailable.",
      };
    }


    try {

      const result =
        await bridge.getAll(
          query,
        );


      return result as
        StorageResult<T[]>;

    } catch (error) {

      return {

        success:
          false,

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
    record:
      T,

    options?:
      StorageWriteOptions,
  ):
    Promise<
      StorageResult
    > {

    const bridge =
      getFinoraUsbBridge();


    if (!bridge?.save) {

      return {

        success:
          false,

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


      return result;

    } catch (error) {

      return {

        success:
          false,

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
    record:
      T,

    options?:
      StorageWriteOptions,
  ):
    Promise<
      StorageResult
    > {

    const bridge =
      getFinoraUsbBridge();


    if (!bridge?.update) {

      return {

        success:
          false,

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


      return result;

    } catch (error) {

      return {

        success:
          false,

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
    query:
      StorageQuery,
  ):
    Promise<
      StorageResult
    > {

    const bridge =
      getFinoraUsbBridge();


    if (!bridge?.delete) {

      return {

        success:
          false,

        error:
          "USB storage is not connected or the secure USB bridge is unavailable.",
      };
    }


    try {

      const result =
        await bridge.delete(
          query,
        );


      return result;

    } catch (error) {

      return {

        success:
          false,

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
    records:
      T[],

    options?:
      StorageWriteOptions,
  ):
    Promise<
      StorageResult
    > {

    const bridge =
      getFinoraUsbBridge();


    if (!bridge?.replaceAll) {

      return {

        success:
          false,

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


      return result;

    } catch (error) {

      return {

        success:
          false,

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
    query:
      StorageQuery,
  ):
    Promise<
      StorageResult
    > {

    const bridge =
      getFinoraUsbBridge();


    if (!bridge?.clear) {

      return {

        success:
          false,

        error:
          "USB storage is not connected or the secure USB bridge is unavailable.",
      };
    }


    try {

      const result =
        await bridge.clear(
          query,
        );


      return result;

    } catch (error) {

      return {

        success:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to clear USB storage.",
      };
    }
  }


  // ==========================================================
  // RESET FINORA DATA
  // ==========================================================

  async resetFinoraData():
    Promise<
      StorageResult<void>
    > {

    const bridge =
      getFinoraUsbBridge();


    if (!bridge?.resetFinoraData) {

      return {

        success:
          false,

        error:
          "FINORA USB reset bridge is not configured yet.",
      };
    }


    try {

      const result =
        await bridge.resetFinoraData();


      return result;

    } catch (error) {

      return {

        success:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to reset FINORA data on USB storage.",
      };
    }
  }
}


// ============================================================
// SINGLETON
// ============================================================

export const usbStorageAdapter =
  new USBStorageAdapter();


// ============================================================
// END
// ============================================================
