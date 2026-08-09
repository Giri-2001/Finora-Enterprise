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

  // ----------------------------------------------------------
  // REGISTERED ADAPTERS
  // ----------------------------------------------------------

  private readonly adapters:
    Map<StorageMode, StorageAdapter>;


  // ----------------------------------------------------------
  // CURRENT CONFIGURATION
  // ----------------------------------------------------------

  private configuration:
    StorageConfiguration;


  // ----------------------------------------------------------
  // CURRENT INITIALIZATION STATE
  // ----------------------------------------------------------

  private initialized =
    false;


  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  constructor() {

    this.adapters =
      new Map<StorageMode, StorageAdapter>([
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
      ]);


    this.configuration = {
      storageMode:
        StorageMode.LOCAL,

      dataContext:
        DataContext.REAL,
    };
  }


  // ==========================================================
  // INITIALIZE
  // ==========================================================

  async initialize(
    configuration?: StorageConfiguration,
  ): Promise<StorageResult<void>> {

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
        success: false,

        error:
          `No storage adapter is registered for ${this.configuration.storageMode}.`,
      };
    }


    const result =
      await adapter.initialize(
        this.configuration,
      );


    this.initialized =
      result.success;


    return result;
  }


  // ==========================================================
  // SELECT STORAGE MODE
  // ==========================================================

  async selectStorageMode(
    storageMode: StorageMode,
  ): Promise<StorageResult<void>> {

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
        success: false,

        error:
          `Storage mode ${storageMode} is not registered.`,
      };
    }


    const result =
      await adapter.initialize(
        nextConfiguration,
      );


    if (!result.success) {
      return result;
    }


    this.configuration =
      nextConfiguration;


    this.initialized =
      true;


    return {
      success: true,
    };
  }


  // ==========================================================
  // SET DATA CONTEXT
  // ==========================================================

  async setDataContext(
    dataContext: DataContext,
    identifiers?: {
      ownerId?: string;
      demoId?: string;
      deviceId?: string;
      storageId?: string;
    },


  ): Promise<StorageResult<void>> {

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


    if (
      dataContext === DataContext.REAL
    ) {

      nextConfiguration.demoId =
        undefined;

    }


    if (
      dataContext === DataContext.DEMO &&
      !nextConfiguration.demoId
    ) {

      return {
        success: false,

        error:
          "A Demo ID is required for DEMO data context.",
      };
    }


    const adapter =
      this.getAdapter(
        nextConfiguration.storageMode,
      );


    if (!adapter) {

      return {
        success: false,

        error:
          `Storage mode ${nextConfiguration.storageMode} is not registered.`,
      };
    }


    const result =
      await adapter.initialize(
        nextConfiguration,
      );


    if (!result.success) {
      return result;
    }


    this.configuration =
      nextConfiguration;


    this.initialized =
      true;


    return {
      success: true,
    };
  }

  // ==========================================================
// RESET DATA CONTEXT
// ==========================================================
//
// Resets the active runtime storage context to the neutral
// FINORA startup state.
//
// IMPORTANT:
//
// - Does NOT delete persisted data.
// - Does NOT clear localStorage.
// - Does NOT remove USB/CLOUD data.
// - Only resets the active in-memory storage boundary.
// - REAL is used as the neutral post-logout context.
// - owner/demo identifiers are cleared.
//
// This is intentionally different from a data wipe.
//

async resetDataContext():
Promise<StorageResult> {

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

      success: false,

      error:
        `Storage mode ${nextConfiguration.storageMode} is not registered.`,
    };
  }

  const result =
    await adapter.initialize(
      nextConfiguration,
    );

  if (!result.success) {

    return result;
  }

  this.configuration =
    nextConfiguration;

  this.initialized =
    true;

  return {

    success: true,
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
  // GET ACTIVE MODE
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
    storageMode: StorageMode,
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
    query: StorageQuery,
  ): Promise<
    StorageResult<T | undefined>
  > {

    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      return {
        success: false,

        error:
          "No active FINORA storage adapter.",
      };
    }


    return adapter.get<T>(
      this.applyContextToQuery(
        query,
      ),
    );
  }


  // ==========================================================
  // GET ALL
  // ==========================================================

  async getAll<T = unknown>(
    query: StorageQuery,
  ): Promise<
    StorageResult<T[]>
  > {

    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      return {
        success: false,

        error:
          "No active FINORA storage adapter.",
      };
    }


    return adapter.getAll<T>(
      this.applyContextToQuery(
        query,
      ),
    );
  }


  // ==========================================================
  // SAVE
  // ==========================================================

  async save<T = unknown>(
    record: T,
    options?: StorageWriteOptions,
  ): Promise<
    StorageResult<T>
  > {

    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      return {
        success: false,

        error:
          "No active FINORA storage adapter.",
      };
    }


    return adapter.save<T>(
      record,
      this.applyContextToWriteOptions(
        options,
      ),
    );
  }


  // ==========================================================
  // UPDATE
  // ==========================================================

  async update<T = unknown>(
    record: T,
    options?: StorageWriteOptions,
  ): Promise<
    StorageResult<T>
  > {

    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      return {
        success: false,

        error:
          "No active FINORA storage adapter.",
      };
    }


    return adapter.update<T>(
      record,
      this.applyContextToWriteOptions(
        options,
      ),
    );
  }


  // ==========================================================
  // DELETE
  // ==========================================================

  async delete(
    query: StorageQuery,
  ): Promise<
    StorageResult<void>
  > {

    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      return {
        success: false,

        error:
          "No active FINORA storage adapter.",
      };
    }


    return adapter.delete(
      this.applyContextToQuery(
        query,
      ),
    );
  }


  // ==========================================================
  // REPLACE ALL
  // ==========================================================

  async replaceAll<T = unknown>(
    records: T[],
    options?: StorageWriteOptions,
  ): Promise<
    StorageResult<void>
  > {

    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      return {
        success: false,

        error:
          "No active FINORA storage adapter.",
      };
    }


    return adapter.replaceAll<T>(
      records,
      this.applyContextToWriteOptions(
        options,
      ),
    );
  }


  // ==========================================================
  // CLEAR
  // ==========================================================

  async clear(
    query: StorageQuery,
  ): Promise<
    StorageResult<void>
  > {

    const adapter =
      this.getActiveAdapter();


    if (!adapter) {

      return {
        success: false,

        error:
          "No active FINORA storage adapter.",
      };
    }


    return adapter.clear(
      this.applyContextToQuery(
        query,
      ),
    );
  }


  // ==========================================================
  // APPLY CONTEXT TO QUERY
  // ==========================================================

  private applyContextToQuery(
    query: StorageQuery,
  ): StorageQuery {

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
    options?: StorageWriteOptions,
  ): StorageWriteOptions {

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
