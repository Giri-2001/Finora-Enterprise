// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 STORAGE FOUNDATION
// STORAGE MODE MANAGER
//
// RESPONSIBILITY:
//
// - Manage the active FINORA V2 storage mode
// - Select LOCAL / USB / CLOUD adapter
// - Manage REAL / DEMO data context
// - Initialize the selected storage adapter
// - Expose unified storage operations
// - Provide current storage status
// - Provide FINORA-owned data reset boundary
// - Keep domain business logic outside storage
//
// IMPORTANT:
//
// - DEMO is a DataContext, not a StorageMode.
// - REAL is a DataContext, not a StorageMode.
// - LOCAL / USB / CLOUD are physical storage modes.
// - No Customer logic.
// - No Loan logic.
// - No Collection logic.
// - No Payment logic.
// - No Report logic.
// - No direct filesystem access.
// - USB is the default FINORA V2 storage mode.
// - USB is NEVER silently replaced by LOCAL when disconnected.
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
} from "./storage.types";


import {
  localStorageAdapter,
} from "./adapters/localStorage.adapter";


import {
  cloudStorageAdapter,
} from "./adapters/cloudStorage.adapter";


import {
  usbStorageAdapter,
} from "./adapters/usbStorage.adapter";


// ============================================================
// STORAGE MANAGER
// ============================================================

export class StorageManager {

  // ==========================================================
  // REGISTERED ADAPTERS
  // ==========================================================

  private readonly adapters:
    Map<
      StorageMode,
      StorageAdapter
    >;


  // ==========================================================
  // CURRENT CONFIGURATION
  // ==========================================================

  private configuration:
    StorageConfiguration;


  // ==========================================================
  // CURRENT INITIALIZATION STATE
  // ==========================================================

  private initialized =
    false;


  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  constructor() {

    const adapterEntries:
      Array<
        [StorageMode, StorageAdapter]
      > = [

      [
        StorageMode.LOCAL,
        localStorageAdapter,
      ],

      [
        StorageMode.USB,
        usbStorageAdapter,
      ],

      [
        StorageMode.CLOUD,
        cloudStorageAdapter,
      ],
    ];


    this.adapters =
      new Map<
        StorageMode,
        StorageAdapter
      >(
        adapterEntries,
      );


    // --------------------------------------------------------
    // IMPORTANT:
    //
    // USB is the default V2 storage mode.
    //
    // We deliberately DO NOT fall back to LOCAL when USB is
    // disconnected.
    //
    // This prevents old LOCAL customer data from appearing
    // when the configured business storage is USB.
    // --------------------------------------------------------

    this.configuration = {

      storageMode:
        StorageMode.USB,

      dataContext:
        DataContext.REAL,
    };
  }


  // ==========================================================
  // INITIALIZE
  // ==========================================================

  async initialize(
    configuration?:
      StorageConfiguration,
  ):
    Promise<
      StorageResult<void>
    > {

    // --------------------------------------------------------
    // EXPLICIT CONFIGURATION
    //
    // If the application supplies a configuration, respect it.
    // --------------------------------------------------------

    if (configuration) {

      this.configuration = {
        ...configuration,
      };
    }


    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      this.initialized =
        false;


      return {

        success:
          false,

        error:
          `No storage adapter is registered for ${this.configuration.storageMode}.`,
      };
    }


    // --------------------------------------------------------
    // INITIALIZE SELECTED ADAPTER
    //
    // IMPORTANT:
    //
    // If USB is disconnected, the USB adapter is allowed to
    // report its unavailable state.
    //
    // We do NOT switch to LOCAL.
    // --------------------------------------------------------

    const result =
      await adapter.initialize(
        this.configuration,
      );


    this.initialized =
      result.success;


    if (!result.success) {

      return {

        success:
          false,

        error:
          result.error ??
          "Unable to initialize storage.",
      };
    }


    return {

      success:
        true,
    };
  }


  // ==========================================================
  // SELECT STORAGE MODE
  // ==========================================================

  async selectStorageMode(
    storageMode:
      StorageMode,
  ):
    Promise<
      StorageResult<void>
    > {

    const nextConfiguration:
      StorageConfiguration = {

      ...this.configuration,

      storageMode,
    };


    const adapter =
      this.adapters.get(
        storageMode,
      );


    if (!adapter) {

      return {

        success:
          false,

        error:
          `Storage mode ${storageMode} is not registered.`,
      };
    }


    const result =
      await adapter.initialize(
        nextConfiguration,
      );


    if (!result.success) {

      return {

        success:
          false,

        error:
          result.error ??
          "Unable to initialize selected storage mode.",
      };
    }


    // --------------------------------------------------------
    // USB READINESS GATE
    //
    // USBStorageAdapter.initialize() intentionally performs
    // its first status refresh in the background so application
    // startup is not blocked.
    //
    // CustomerDepartment, however, may immediately hydrate
    // Customer data after selectStorageMode() completes.
    //
    // Without this readiness gate:
    //
    //   USB initialize()
    //        ↓
    //   Customer getAll()
    //        ↓
    //   USB root detection still running
    //        ↓
    //   "FINORA Pendrive is disconnected"
    //
    // Therefore USB selection waits briefly for the adapter to
    // report READY before exposing the selected mode to the
    // rest of the application.
    //
    // This does NOT introduce a LOCAL fallback.
    // If USB is genuinely disconnected, the selection fails.
    // --------------------------------------------------------

    if (
      storageMode ===
      StorageMode.USB
    ) {

      const maxAttempts =
        5;

      const retryDelayMs =
        150;

      let lastStatus:
        StorageStatus | undefined;


      for (
        let attempt = 0;
        attempt < maxAttempts;
        attempt += 1
      ) {

        lastStatus =
          await adapter.getStatus();


        if (
          lastStatus.availability ===
          StorageAvailability.READY
        ) {

          break;
        }


        if (
          attempt <
          maxAttempts - 1
        ) {

          await new Promise<void>(
            (resolve) => {

              window.setTimeout(
                resolve,
                retryDelayMs,
              );

            },
          );

        }

      }


      if (
        !lastStatus ||
        lastStatus.availability !==
        StorageAvailability.READY
      ) {

        return {

          success:
            false,

          error:
            lastStatus?.message ??
            "FINORA Pendrive is not ready.",
        };
      }

    }


    this.configuration =
      nextConfiguration;


    this.initialized =
      true;


    return {

      success:
        true,
    };
  }


  // ==========================================================
  // SET DATA CONTEXT
  // ==========================================================

  async setDataContext(
    dataContext:
      DataContext,

    identifiers?: {

      ownerId?: string;

      demoId?: string;

      deviceId?: string;

      storageId?: string;
    },
  ):
    Promise<
      StorageResult<void>
    > {

    const nextConfiguration:
      StorageConfiguration = {

      ...this.configuration,

      dataContext,

      ownerId:
        identifiers?.ownerId ??
        this.configuration.ownerId,

      demoId:
        identifiers?.demoId ??
        this.configuration.demoId,

      deviceId:
        identifiers?.deviceId ??
        this.configuration.deviceId,

      storageId:
        identifiers?.storageId ??
        this.configuration.storageId,
    };


    // --------------------------------------------------------
    // REAL CONTEXT
    // --------------------------------------------------------

    if (
      dataContext ===
      DataContext.REAL
    ) {

      nextConfiguration.demoId =
        undefined;
    }


    // --------------------------------------------------------
    // DEMO CONTEXT REQUIRES DEMO ID
    // --------------------------------------------------------

    if (
      dataContext ===
      DataContext.DEMO &&
      !nextConfiguration.demoId
    ) {

      return {

        success:
          false,

        error:
          "A Demo ID is required for DEMO data context.",
      };
    }


    // --------------------------------------------------------
    // REAL CONTEXT REQUIRES OWNER ID
    // --------------------------------------------------------

    if (
      dataContext ===
      DataContext.REAL &&
      !nextConfiguration.ownerId
    ) {

      return {

        success:
          false,

        error:
          "An Owner ID is required for REAL data context.",
      };
    }


    const adapter =
      this.getAdapter(
        nextConfiguration.storageMode,
      );


    if (!adapter) {

      return {

        success:
          false,

        error:
          `Storage mode ${nextConfiguration.storageMode} is not registered.`,
      };
    }


    const result =
      await adapter.initialize(
        nextConfiguration,
      );


    if (!result.success) {

      return {

        success:
          false,

        error:
          result.error ??
          "Unable to initialize data context.",
      };
    }


    this.configuration =
      nextConfiguration;


    this.initialized =
      true;


    return {

      success:
        true,
    };
  }


  // ==========================================================
  // RESET DATA CONTEXT
  //
  // IMPORTANT:
  //
  // This only resets the ACTIVE RUNTIME CONTEXT.
  //
  // It does NOT delete persisted FINORA data.
  //
  // It does NOT:
  //
  // - format USB
  // - delete unrelated USB files
  // - clear browser localStorage globally
  // - delete cloud records
  //
  // This is intentionally different from:
  //
  // resetFinoraData()
  //
  // which is the explicit FINORA data wipe boundary.
  // ==========================================================

  async resetDataContext():
    Promise<
      StorageResult<void>
    > {

    const nextConfiguration:
      StorageConfiguration = {

      storageMode:
        this.configuration.storageMode,

      dataContext:
        DataContext.REAL,
    };


    const adapter =
      this.getAdapter(
        nextConfiguration.storageMode,
      );


    if (!adapter) {

      this.initialized =
        false;


      return {

        success:
          false,

        error:
          `Storage mode ${nextConfiguration.storageMode} is not registered.`,
      };
    }


    const result =
      await adapter.initialize(
        nextConfiguration,
      );


    if (!result.success) {

      return {

        success:
          false,

        error:
          result.error ??
          "Unable to reset storage context.",
      };
    }


    this.configuration =
      nextConfiguration;


    this.initialized =
      true;


    return {

      success:
        true,
    };
  }


  // ==========================================================
  // RESET FINORA DATA
  //
  // IMPORTANT:
  //
  // This is the explicit FINORA data reset boundary.
  //
  // The active adapter owns the physical implementation.
  //
  // LOCAL:
  // - FINORA-owned local storage only.
  //
  // USB:
  // - FINORA-owned USB storage namespace only.
  //
  // CLOUD:
  // - FINORA-owned cloud data only.
  //
  // NEVER:
  // - format USB
  // - delete unrelated USB files
  // - wipe the entire device
  // - wipe unrelated browser storage
  // - wipe another owner
  // - wipe another Demo environment
  // ==========================================================

  async resetFinoraData():
    Promise<
      StorageResult<void>
    > {

    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      return {

        success:
          false,

        error:
          "No active FINORA storage adapter.",
      };
    }


    const result =
      await adapter.resetFinoraData();


    if (!result.success) {

      return {

        success:
          false,

        error:
          result.error ??
          "Unable to reset FINORA data.",
      };
    }


    return {

      success:
        true,
    };
  }


  // ==========================================================
  // GET CURRENT CONFIGURATION
  // ==========================================================

  getConfiguration():
    StorageConfiguration {

    return {
      ...this.configuration,
    };
  }


  // ==========================================================
  // GET ACTIVE STORAGE MODE
  // ==========================================================

  getStorageMode():
    StorageMode {

    return this.configuration.storageMode;
  }


  // ==========================================================
  // GET DATA CONTEXT
  // ==========================================================

  getDataContext():
    DataContext {

    return this.configuration.dataContext;
  }


  // ==========================================================
  // GET ACTIVE ADAPTER
  // ==========================================================

  getActiveAdapter():
    StorageAdapter | undefined {

    return this.adapters.get(
      this.configuration.storageMode,
    );
  }


  // ==========================================================
  // GET ADAPTER
  // ==========================================================

  getAdapter(
    storageMode:
      StorageMode,
  ):
    StorageAdapter | undefined {

    return this.adapters.get(
      storageMode,
    );
  }


  // ==========================================================
  // IS INITIALIZED
  // ==========================================================

  isInitialized():
    boolean {

    return this.initialized;
  }


  // ==========================================================
  // IS AVAILABLE
  // ==========================================================

  async isAvailable():
    Promise<boolean> {

    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      return false;
    }


    return adapter.isAvailable();
  }


  // ==========================================================
  // GET STATUS
  // ==========================================================

  async getStatus():
    Promise<StorageStatus> {

    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      return {

        mode:
          this.configuration.storageMode,

        availability:
          StorageAvailability.ERROR,

        dataContext:
          this.configuration.dataContext,

        ownerId:
          this.configuration.ownerId,

        demoId:
          this.configuration.demoId,

        storageId:
          this.configuration.storageId,

        message:
          "Active storage adapter is not registered.",

        checkedAt:
          new Date().toISOString(),
      };
    }


    const status =
      await adapter.getStatus();


    return {

      ...status,

      mode:
        this.configuration.storageMode,

      dataContext:
        this.configuration.dataContext,

      ownerId:
        this.configuration.ownerId,

      demoId:
        this.configuration.demoId,

      storageId:
        status.storageId ??
        this.configuration.storageId,
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

    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      return {

        success:
          false,

        error:
          "No active FINORA storage adapter.",
      };
    }


    const result =
      await adapter.get<T>(
        this.applyContextToQuery(
          query,
        ),
      );


    if (!result.success) {

      return {

        success:
          false,

        error:
          result.error ??
          "Unable to read FINORA storage.",
      };
    }


    return {

      success:
        true,

      data:
        result.data as
          T | undefined,
    };
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

    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      return {

        success:
          false,

        error:
          "No active FINORA storage adapter.",
      };
    }


    const result =
      await adapter.getAll<T>(
        this.applyContextToQuery(
          query,
        ),
      );


    if (!result.success) {

      return {

        success:
          false,

        error:
          result.error ??
          "Unable to read FINORA storage records.",
      };
    }


    return {

      success:
        true,

      data:
        (result.data ?? []) as
          T[],
    };
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
      StorageResult<T>
    > {

    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      return {

        success:
          false,

        error:
          "No active FINORA storage adapter.",
      };
    }


    const result =
      await adapter.save<T>(
        record,

        this.applyContextToWriteOptions(
          options,
        ),
      );


    if (!result.success) {

      return {

        success:
          false,

        error:
          result.error ??
          "Unable to save FINORA record.",
      };
    }


    return {

      success:
        true,

      data:
        result.data as
          T,
    };
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
      StorageResult<T>
    > {

    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      return {

        success:
          false,

        error:
          "No active FINORA storage adapter.",
      };
    }


    const result =
      await adapter.update<T>(
        record,

        this.applyContextToWriteOptions(
          options,
        ),
      );


    if (!result.success) {

      return {

        success:
          false,

        error:
          result.error ??
          "Unable to update FINORA record.",
      };
    }


    return {

      success:
        true,

      data:
        result.data as
          T,
    };
  }


  // ==========================================================
  // DELETE
  // ==========================================================

  async delete(
    query:
      StorageQuery,
  ):
    Promise<
      StorageResult<void>
    > {

    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      return {

        success:
          false,

        error:
          "No active FINORA storage adapter.",
      };
    }


    const result =
      await adapter.delete(
        this.applyContextToQuery(
          query,
        ),
      );


    if (!result.success) {

      return {

        success:
          false,

        error:
          result.error ??
          "Unable to delete FINORA record.",
      };
    }


    return {

      success:
        true,
    };
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
      StorageResult<void>
    > {

    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      return {

        success:
          false,

        error:
          "No active FINORA storage adapter.",
      };
    }


    const result =
      await adapter.replaceAll<T>(
        records,

        this.applyContextToWriteOptions(
          options,
        ),
      );


    if (!result.success) {

      return {

        success:
          false,

        error:
          result.error ??
          "Unable to replace FINORA records.",
      };
    }


    return {

      success:
        true,
    };
  }


  // ==========================================================
  // CLEAR
  // ==========================================================

  async clear(
    query:
      StorageQuery,
  ):
    Promise<
      StorageResult<void>
    > {

    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      return {

        success:
          false,

        error:
          "No active FINORA storage adapter.",
      };
    }


    const result =
      await adapter.clear(
        this.applyContextToQuery(
          query,
        ),
      );


    if (!result.success) {

      return {

        success:
          false,

        error:
          result.error ??
          "Unable to clear FINORA storage.",
      };
    }


    return {

      success:
        true,
    };
  }


  // ==========================================================
  // APPLY CONTEXT TO QUERY
  // ==========================================================

  private applyContextToQuery(
    query:
      StorageQuery,
  ):
    StorageQuery {

    return {

      ...query,

      ownerId:
        query.ownerId ??
        this.configuration.ownerId,

      demoId:
        query.demoId ??
        this.configuration.demoId,
    };
  }


  // ==========================================================
  // APPLY CONTEXT TO WRITE OPTIONS
  // ==========================================================

  private applyContextToWriteOptions(
    options?:
      StorageWriteOptions,
  ):
    StorageWriteOptions {

    return {

      ownerId:
        options?.ownerId ??
        this.configuration.ownerId,

      demoId:
        options?.demoId ??
        this.configuration.demoId,
    };
  }
}


// ============================================================
// SINGLETON
// ============================================================

export const storageManager =
  new StorageManager();


// ============================================================
// END
// ============================================================
