/* ===========================================================
   FINORA ENTERPRISE OS™

   V2 STORAGE FOUNDATION
   LOCAL STORAGE ADAPTER

   RESPONSIBILITY:

   - Local browser/Electron renderer persistence
   - Implement the common StorageAdapter contract
   - Preserve existing localStorage-backed V2 data
   - Provide safe CRUD operations
   - Keep business logic outside the storage layer

   IMPORTANT:

   - No Customer logic
   - No Loan logic
   - No Collection logic
   - No Payment logic
   - No Report logic
   - No Electron IPC
   - No cloud logic

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
   STORAGE KEY PREFIX
========================================================== */

const STORAGE_PREFIX =
  "FINORA_V2";


/* ==========================================================
   ENTITY KEY BUILDER

   Keeps each entity isolated.

   Examples:

   FINORA_V2_REAL_CUSTOMER
   FINORA_V2_REAL_LOAN

   FINORA_V2_DEMO_DEMO-000001_CUSTOMER

   The actual domain repositories can continue using their
   existing keys during migration. This adapter provides the
   new common storage namespace.
========================================================== */

function buildStorageKey(
  query: StorageQuery,
  options?: StorageWriteOptions,
): string {

  const ownerId =
    options?.ownerId ??
    query.ownerId;

  const demoId =
    options?.demoId ??
    query.demoId;

  const context =
    demoId
      ? `${DataContext.DEMO}_${demoId}`
      : ownerId
        ? `${DataContext.REAL}_${ownerId}`
        : DataContext.REAL;

  return [
    STORAGE_PREFIX,
    context,
    query.entity,
  ].join("_");
}


/* ==========================================================
   NORMALIZE ARRAY

   Storage records are persisted as arrays so that the
   existing V2 localStorage model remains simple and
   predictable.
========================================================== */

function readArray<T>(
  key: string,
): T[] {

  try {

    const raw =
      localStorage.getItem(key);

    if (!raw) {

      return [];

    }

    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {

      return [];

    }

    return parsed as T[];

  } catch {

    return [];

  }
}


/* ==========================================================
   WRITE ARRAY
========================================================== */

function writeArray<T>(
  key: string,
  records: T[],
): StorageResult<void> {

  try {

    localStorage.setItem(
      key,
      JSON.stringify(records),
    );

    return {
      success: true,
    };

  } catch {

    return {
      success: false,
      error:
        "Unable to write data to local storage.",
    };

  }
}


/* ==========================================================
   ID EXTRACTION

   Generic storage cannot assume every domain uses the same
   property name.

   FINORA currently uses different identifiers across
   existing modules, so this helper supports the common
   identifier forms without adding domain-specific logic.
========================================================== */

function getRecordId(
  record: unknown,
): string | undefined {

  if (
    typeof record !== "object" ||
    record === null
  ) {

    return undefined;

  }

  const value =
    record as Record<string, unknown>;

  if (
    typeof value.id === "string"
  ) {

    return value.id;

  }

  if (
    typeof value.customerId === "string"
  ) {

    return value.customerId;

  }

  if (
    typeof value.loanId === "string"
  ) {

    return value.loanId;

  }

  if (
    typeof value.paymentId === "string"
  ) {

    return value.paymentId;

  }

  if (
    typeof value.collectionId === "string"
  ) {

    return value.collectionId;

  }

  if (
    typeof value.notificationId === "string"
  ) {

    return value.notificationId;

  }

  return undefined;
}


/* ==========================================================
   LOCAL STORAGE ADAPTER
========================================================== */

export class LocalStorageAdapter
  implements StorageAdapter {

  /* ========================================================
     MODE
  ======================================================== */

  readonly mode =
    StorageMode.LOCAL;


  /* ========================================================
     INITIALIZE
  ======================================================== */

  async initialize(
    _configuration: StorageConfiguration,
  ): Promise<StorageResult<void>> {

    try {

      if (
        typeof localStorage ===
        "undefined"
      ) {

        return {
          success: false,
          error:
            "Local storage is not available.",
        };

      }

      return {
        success: true,
      };

    } catch {

      return {
        success: false,
        error:
          "Unable to initialize local storage.",
      };

    }

  }


  /* ========================================================
     AVAILABILITY
  ======================================================== */

  async isAvailable():
    Promise<boolean> {

    try {

      if (
        typeof localStorage ===
        "undefined"
      ) {

        return false;

      }

      const testKey =
        `${STORAGE_PREFIX}_AVAILABILITY_TEST`;

      localStorage.setItem(
        testKey,
        "1",
      );

      localStorage.removeItem(
        testKey,
      );

      return true;

    } catch {

      return false;

    }

  }


  /* ========================================================
     STATUS
  ======================================================== */

  async getStatus():
    Promise<StorageStatus> {

    const available =
      await this.isAvailable();

    return {

      mode:
        StorageMode.LOCAL,

      availability:
        available
          ? StorageAvailability.READY
          : StorageAvailability.UNAVAILABLE,

      dataContext:
        DataContext.REAL,

      checkedAt:
        new Date().toISOString(),

      message:
        available
          ? "Local storage is ready."
          : "Local storage is unavailable.",
    };

  }


  /* ========================================================
     GET ONE
  ======================================================== */

  async get<T = unknown>(
    query: StorageQuery,
  ): Promise<
    StorageResult<T | undefined>
  > {

    try {

      const key =
        buildStorageKey(query);

      const records =
        readArray<T>(key);

      if (!query.id) {

        return {
          success: true,
          data: undefined,
        };

      }

      const record =
        records.find(
          (item) =>
            getRecordId(item) ===
            query.id,
        );

      return {
        success: true,
        data: record,
      };

    } catch {

      return {
        success: false,
        error:
          "Unable to read local storage.",
      };

    }

  }


  /* ========================================================
     GET ALL
  ======================================================== */

  async getAll<T = unknown>(
    query: StorageQuery,
  ): Promise<
    StorageResult<T[]>
  > {

    try {

      const key =
        buildStorageKey(query);

      let records =
        readArray<T>(key);

      if (
        typeof query.offset ===
        "number"
      ) {

        records =
          records.slice(
            query.offset,
          );

      }

      if (
        typeof query.limit ===
        "number"
      ) {

        records =
          records.slice(
            0,
            query.limit,
          );

      }

      return {
        success: true,
        data: records,
      };

    } catch {

      return {
        success: false,
        error:
          "Unable to read local storage.",
      };

    }

  }


  /* ========================================================
     SAVE
  ======================================================== */

  async save<T = unknown>(
    record: T,
    options?: StorageWriteOptions,
  ): Promise<
    StorageResult<T>
  > {

    try {

      const id =
        getRecordId(record);

      if (!id) {

        return {
          success: false,
          error:
            "Storage record requires a supported identifier.",
        };

      }

      const query: StorageQuery = {

        entity:
          this.resolveEntity(record),

      };

      const key =
        buildStorageKey(
          query,
          options,
        );

      const records =
        readArray<T>(key);

      const existingIndex =
        records.findIndex(
          (item) =>
            getRecordId(item) ===
            id,
        );

      if (
        existingIndex !== -1
      ) {

        return {
          success: false,
          error:
            "A record with the same identifier already exists.",
        };

      }

      records.push(record);

      const result =
        writeArray(
          key,
          records,
        );

      if (!result.success) {

        return {
          success: false,
          error:
            result.error,
        };

      }

      return {
        success: true,
        data: record,
      };

    } catch {

      return {
        success: false,
        error:
          "Unable to save record to local storage.",
      };

    }

  }


  /* ========================================================
     UPDATE
  ======================================================== */

  async update<T = unknown>(
    record: T,
    options?: StorageWriteOptions,
  ): Promise<
    StorageResult<T>
  > {

    try {

      const id =
        getRecordId(record);

      if (!id) {

        return {
          success: false,
          error:
            "Storage record requires a supported identifier.",
        };

      }

      const query: StorageQuery = {

        entity:
          this.resolveEntity(record),

      };

      const key =
        buildStorageKey(
          query,
          options,
        );

      const records =
        readArray<T>(key);

      const index =
        records.findIndex(
          (item) =>
            getRecordId(item) ===
            id,
        );

      if (index === -1) {

        return {
          success: false,
          error:
            "Storage record was not found.",
        };

      }

      records[index] =
        record;

      const result =
        writeArray(
          key,
          records,
        );

      if (!result.success) {

        return {
          success: false,
          error:
            result.error,
        };

      }

      return {
        success: true,
        data: record,
      };

    } catch {

      return {
        success: false,
        error:
          "Unable to update record in local storage.",
      };

    }

  }


  /* ========================================================
     DELETE
  ======================================================== */

  async delete(
    query: StorageQuery,
  ): Promise<
    StorageResult<void>
  > {

    try {

      const key =
        buildStorageKey(query);

      const records =
        readArray<unknown>(key);

      const filtered =
        query.id
          ? records.filter(
              (item) =>
                getRecordId(item) !==
                query.id,
            )
          : [];

      const result =
        writeArray(
          key,
          filtered,
        );

      return result;

    } catch {

      return {
        success: false,
        error:
          "Unable to delete local storage record.",
      };

    }

  }


  /* ========================================================
     REPLACE ALL
  ======================================================== */

  async replaceAll<T = unknown>(
    records: T[],
    options?: StorageWriteOptions,
  ): Promise<
    StorageResult<void>
  > {

    try {

      if (!records.length) {

        return {
          success: true,
        };

      }

      const firstRecord =
        records[0];

      const query: StorageQuery = {

        entity:
          this.resolveEntity(
            firstRecord,
          ),

      };

      const key =
        buildStorageKey(
          query,
          options,
        );

      return writeArray(
        key,
        records,
      );

    } catch {

      return {
        success: false,
        error:
          "Unable to replace local storage records.",
      };

    }

  }


  /* ========================================================
     CLEAR
  ======================================================== */

  async clear(
    query: StorageQuery,
  ): Promise<
    StorageResult<void>
  > {

    try {

      const key =
        buildStorageKey(query);

      localStorage.removeItem(key);

      return {
        success: true,
      };

    } catch {

      return {
        success: false,
        error:
          "Unable to clear local storage.",
      };

    }

  }


  /* ========================================================
     ENTITY RESOLUTION
  ======================================================== */

  private resolveEntity(
    record: unknown,
  ): string {

    if (
      typeof record !== "object" ||
      record === null
    ) {

      return "UNKNOWN";

    }

    const value =
      record as Record<string, unknown>;

    if (
      "identity" in value
    ) {

      return "CUSTOMER";

    }

    if (
      "outstanding" in value &&
      "loanType" in value
    ) {

      return "LOAN";

    }

    if (
      "loanId" in value &&
      "status" in value
    ) {

      return "COLLECTION";

    }

    if (
      "paymentId" in value
    ) {

      return "PAYMENT";

    }

    if (
      "notificationId" in value
    ) {

      return "NOTIFICATION";

    }

    return "GENERAL";

  }

}


/* ==========================================================
   SINGLETON
========================================================== */

export const localStorageAdapter =
  new LocalStorageAdapter();
