/* ===========================================================
   FINORA ENTERPRISE OS™

   V2 STORAGE FOUNDATION
   CLOUD STORAGE ADAPTER

   RESPONSIBILITY:

   - Define the Cloud Storage implementation boundary
   - Safely report cloud availability
   - Prevent fake cloud persistence
   - Prepare the adapter for the future FINORA backend
   - Implement the common StorageAdapter contract

   IMPORTANT:

   - This adapter does NOT fake cloud persistence.
   - No external API is assumed.
   - No hard-coded cloud URL.
   - No customer business logic.
   - No loan business logic.
   - No collection business logic.
   - No payment business logic.
   - No report business logic.
   - No authentication logic.

   Until the real FINORA cloud backend is connected,
   write/read operations explicitly return a controlled
   NOT_CONFIGURED result.

   VERSION : 2.0
   STATUS  : Production
=========================================================== */

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


/* ==========================================================
   CLOUD CONFIGURATION

   The real cloud endpoint will be supplied later through
   the FINORA backend configuration.

   We intentionally do NOT hard-code a production URL here.
========================================================== */

const CLOUD_NOT_CONFIGURED_MESSAGE =
  "FINORA Cloud Storage is not configured yet.";


/* ==========================================================
   CLOUD STORAGE ADAPTER
========================================================== */

export class CloudStorageAdapter
  implements StorageAdapter {

  /* ========================================================
     MODE
  ======================================================== */

  readonly mode =
    StorageMode.CLOUD;


  /* ========================================================
     CURRENT CONFIGURATION
  ======================================================== */

  private configuration:
    StorageConfiguration | null = null;


  /* ========================================================
     INITIALIZE
  ======================================================== */

  async initialize(
    configuration: StorageConfiguration,
  ): Promise<StorageResult<void>> {

    this.configuration =
      configuration;

    return {
      success: true,
    };

  }


  /* ========================================================
     AVAILABILITY

     Cloud is unavailable until the real FINORA cloud
     backend has been configured.
========================================================== */

  async isAvailable():
    Promise<boolean> {

    return false;

  }


  /* ========================================================
     STATUS
========================================================== */

  async getStatus():
    Promise<StorageStatus> {

    return {

      mode:
        StorageMode.CLOUD,

      availability:
        StorageAvailability.NOT_CONFIGURED,

      dataContext:
        this.configuration?.dataContext ??
        DataContext.REAL,

      ownerId:
        this.configuration?.ownerId,

      demoId:
        this.configuration?.demoId,

      storageId:
        this.configuration?.storageId,

      message:
        CLOUD_NOT_CONFIGURED_MESSAGE,

      checkedAt:
        new Date().toISOString(),

    };

  }


  /* ========================================================
     GET ONE
========================================================== */

  async get<T = unknown>(
    _query: StorageQuery,
  ): Promise<
    StorageResult<T | undefined>
  > {

    return {

      success: false,

      error:
        CLOUD_NOT_CONFIGURED_MESSAGE,

    };

  }


  /* ========================================================
     GET ALL
========================================================== */

  async getAll<T = unknown>(
    _query: StorageQuery,
  ): Promise<
    StorageResult<T[]>
  > {

    return {

      success: false,

      error:
        CLOUD_NOT_CONFIGURED_MESSAGE,

    };

  }


  /* ========================================================
     SAVE
========================================================== */

  async save<T = unknown>(
    _record: T,
    _options?: StorageWriteOptions,
  ): Promise<
    StorageResult<T>
  > {

    return {

      success: false,

      error:
        CLOUD_NOT_CONFIGURED_MESSAGE,

    };

  }


  /* ========================================================
     UPDATE
========================================================== */

  async update<T = unknown>(
    _record: T,
    _options?: StorageWriteOptions,
  ): Promise<
    StorageResult<T>
  > {

    return {

      success: false,

      error:
        CLOUD_NOT_CONFIGURED_MESSAGE,

    };

  }


  /* ========================================================
     DELETE
========================================================== */

  async delete(
    _query: StorageQuery,
  ): Promise<
    StorageResult<void>
  > {

    return {

      success: false,

      error:
        CLOUD_NOT_CONFIGURED_MESSAGE,

    };

  }


  /* ========================================================
     REPLACE ALL
========================================================== */

  async replaceAll<T = unknown>(
    _records: T[],
    _options?: StorageWriteOptions,
  ): Promise<
    StorageResult<void>
  > {

    return {

      success: false,

      error:
        CLOUD_NOT_CONFIGURED_MESSAGE,

    };

  }


  /* ========================================================
     CLEAR
========================================================== */

  async clear(
    _query: StorageQuery,
  ): Promise<
    StorageResult<void>
  > {

    return {

      success: false,

      error:
        CLOUD_NOT_CONFIGURED_MESSAGE,

    };

  }

}


/* ==========================================================
   SINGLETON
========================================================== */

export const cloudStorageAdapter =
  new CloudStorageAdapter();
