// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 STORAGE FOUNDATION
// LOCAL STORAGE ADAPTER
//
// RESPONSIBILITY:
//
// - Local browser/Electron renderer persistence
// - Implement the common StorageAdapter contract
// - Preserve V2 localStorage-backed persistence
// - Provide safe CRUD operations
// - Enforce owner / demo storage isolation
// - Provide FINORA-only data reset
// - Keep business logic outside the storage layer
//
// IMPORTANT:
//
// - No Customer logic.
// - No Loan logic.
// - No Collection logic.
// - No Payment logic.
// - No Report logic.
// - No Electron IPC.
// - No cloud logic.
// - delete() deletes ONE record only.
// - clear() is the explicit full-entity clear operation.
// - resetFinoraData() clears ONLY FINORA-owned entities
//   inside the active REAL / DEMO storage boundary.
//
// COLLECTION FIX:
//
// - Collection records are resolved BEFORE Loan records.
// - Collection identity is based on explicit collection fields.
// - A collection must NEVER be redirected into LOAN storage merely
//   because its workflow payload also contains loan-related fields.
// - The collection repository-generated `id` remains the storage
//   identity.
//
// VERSION : 2.1
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  DataContext,
  StorageAvailability,
  StorageMode,
} from "../storage.types";

import type {
  StorageAdapter,
  StorageConfiguration,
  StorageQuery,
  StorageResult,
  StorageStatus,
  StorageWriteOptions,
} from "../storage.types";

// ============================================================
// STORAGE KEY PREFIX
// ============================================================

const STORAGE_PREFIX = "FINORA_V2";

// ============================================================
// ENTITY NAMES
// ============================================================

const ENTITY_CUSTOMER = "CUSTOMER";

const ENTITY_BUSINESS_IDENTITY = "BUSINESS_IDENTITY";

const ENTITY_BUSINESS_SETTINGS = "BUSINESS_SETTINGS";

const ENTITY_BRANCH_SETTINGS = "BRANCH_SETTINGS";

const ENTITY_BUSINESS_OWNER_PROFILE = "BUSINESS_OWNER_PROFILE";

const ENTITY_LOAN = "LOAN";

const ENTITY_GOLD_STORAGE_SETTINGS = "GOLD_STORAGE_SETTINGS";

const ENTITY_GOLD_CUSTODY_ALLOCATION = "GOLD_CUSTODY_ALLOCATION";

const ENTITY_GOLD_RELOCATION_AUDIT = "GOLD_RELOCATION_AUDIT";

const ENTITY_COLLECTION = "COLLECTION";

const ENTITY_PAYMENT = "PAYMENT";

const ENTITY_NOTIFICATION = "NOTIFICATION";

const ENTITY_REPORT = "REPORT";

const ENTITY_GENERAL = "GENERAL";

// ============================================================
// FINORA RESET ENTITIES
// ============================================================

const FINORA_RESET_ENTITIES: readonly string[] = [
  ENTITY_CUSTOMER,

  ENTITY_BUSINESS_IDENTITY,

  ENTITY_BUSINESS_SETTINGS,

  ENTITY_BRANCH_SETTINGS,

  ENTITY_BUSINESS_OWNER_PROFILE,

  ENTITY_GOLD_STORAGE_SETTINGS,

  ENTITY_GOLD_CUSTODY_ALLOCATION,

  ENTITY_GOLD_RELOCATION_AUDIT,

  ENTITY_LOAN,

  ENTITY_COLLECTION,

  ENTITY_PAYMENT,

  ENTITY_NOTIFICATION,

  ENTITY_REPORT,

  ENTITY_GENERAL,
];

// ============================================================
// LOCAL STORAGE KEY BUILDER
// ============================================================

function buildStorageKey(
  query: StorageQuery,
  options?: StorageWriteOptions,
): string {
  const ownerId = options?.ownerId ?? query.ownerId;

  const demoId = options?.demoId ?? query.demoId;

  const context = demoId
    ? `${DataContext.DEMO}_${demoId}`
    : ownerId
      ? `${DataContext.REAL}_${ownerId}`
      : DataContext.REAL;

  return [STORAGE_PREFIX, context, query.entity].join("_");
}

// ============================================================
// READ ARRAY
// ============================================================

function readArray<T = unknown>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as T[];
  } catch {
    return [];
  }
}

// ============================================================
// WRITE ARRAY
// ============================================================

function writeArray<T = unknown>(
  key: string,
  records: T[],
): StorageResult<T[]> {
  try {
    localStorage.setItem(key, JSON.stringify(records));

    return {
      success: true,
      data: records,
    };
  } catch {
    return {
      success: false,
      error: "Unable to write data to local storage.",
    };
  }
}

// ============================================================
// ID EXTRACTION
// ============================================================
//
// IMPORTANT:
//
// `id` is always preferred.
//
// The other identifiers remain compatibility fallbacks for
// older FINORA V2 records.
//
// ============================================================

function getRecordId(record: unknown): string | undefined {
  if (typeof record !== "object" || record === null) {
    return undefined;
  }

  const value = record as Record<string, unknown>;

  // ----------------------------------------------------------
  // PRIMARY STORAGE ID
  // ----------------------------------------------------------

  if (typeof value.id === "string" && value.id.trim()) {
    return value.id;
  }

  // ----------------------------------------------------------
  // COMPATIBILITY IDENTIFIERS
  // ----------------------------------------------------------

  if (typeof value.customerId === "string" && value.customerId.trim()) {
    return value.customerId;
  }

  if (typeof value.loanId === "string" && value.loanId.trim()) {
    return value.loanId;
  }

  if (typeof value.paymentId === "string" && value.paymentId.trim()) {
    return value.paymentId;
  }

  if (typeof value.collectionId === "string" && value.collectionId.trim()) {
    return value.collectionId;
  }

  if (typeof value.notificationId === "string" && value.notificationId.trim()) {
    return value.notificationId;
  }

  return undefined;
}

// ============================================================
// ENTITY RESOLUTION
// ============================================================
//
// IMPORTANT:
//
// This function is the critical persistence routing boundary.
//
// Collection MUST be checked before Loan.
//
// Why:
//
// CollectionReviewData can carry loan-related workflow data.
//
// If Loan is checked first, a Collection payload containing
// `outstanding` / `loanType` can incorrectly be routed into:
//
//   FINORA_V2_REAL_<OWNER>_LOAN
//
// instead of:
//
//   FINORA_V2_REAL_<OWNER>_COLLECTION
//
// Therefore Collection gets an explicit priority.
//
// ============================================================

function resolveEntity(record: unknown): string {
  if (typeof record !== "object" || record === null) {
    return ENTITY_GENERAL;
  }

  const value = record as Record<string, unknown>;

  // ==========================================================
  // GOLD STORAGE SETTINGS
  // ==========================================================
  //
  // Gold Storage repository supplies an explicit entity marker
  // because the same persisted record must work consistently
  // across:
  //
  // - LOCAL
  // - USB
  // - future CLOUD
  //
  // Keep this rule narrow so existing heuristic routing for
  // Customer / Loan / Collection remains untouched.
  // ==========================================================

  if (value.entity === ENTITY_BUSINESS_IDENTITY) {
    return ENTITY_BUSINESS_IDENTITY;
  }

  if (value.entity === ENTITY_BUSINESS_SETTINGS) {
    return ENTITY_BUSINESS_SETTINGS;
  }

  if (value.entity === ENTITY_GOLD_STORAGE_SETTINGS) {
    return ENTITY_GOLD_STORAGE_SETTINGS;
  }

  if (value.entity === ENTITY_BRANCH_SETTINGS) {
    return ENTITY_BRANCH_SETTINGS;
  }

  if (value.entity === ENTITY_BUSINESS_OWNER_PROFILE) {
    return ENTITY_BUSINESS_OWNER_PROFILE;
  }

  if (value.entity === ENTITY_GOLD_CUSTODY_ALLOCATION) {
    return ENTITY_GOLD_CUSTODY_ALLOCATION;
  }

  if (value.entity === ENTITY_GOLD_RELOCATION_AUDIT) {
    return ENTITY_GOLD_RELOCATION_AUDIT;
  }

  // ==========================================================
  // COLLECTION
  // ==========================================================
  //
  // Collection is identified by the combination of:
  //
  // - loanId
  // - paymentAmount / receiptNumber / selectedEmiNumbers
  //
  // `loanId + status` remains a compatibility signal.
  //
  // IMPORTANT:
  //
  // This block intentionally comes BEFORE Loan.
  //
  // ==========================================================

  const hasLoanId =
    typeof value.loanId === "string" && value.loanId.trim().length > 0;

  const hasPaymentAmount = "paymentAmount" in value;

  const hasReceiptNumber = "receiptNumber" in value;

  const hasSelectedEmiNumbers = "selectedEmiNumbers" in value;

  const hasCollectionStatus =
    "status" in value &&
    (value.status === "Approved" ||
      value.status === "Pending" ||
      value.status === "Rejected" ||
      value.status === "Draft");

  if (
    hasLoanId &&
    (hasPaymentAmount ||
      hasReceiptNumber ||
      hasSelectedEmiNumbers ||
      hasCollectionStatus)
  ) {
    return ENTITY_COLLECTION;
  }

  // ==========================================================
  // PAYMENT
  // ==========================================================

  if ("paymentId" in value) {
    return ENTITY_PAYMENT;
  }

  // ==========================================================
  // NOTIFICATION
  // ==========================================================

  if ("notificationId" in value) {
    return ENTITY_NOTIFICATION;
  }

  // ==========================================================
  // CUSTOMER
  // ==========================================================

  if ("identity" in value) {
    return ENTITY_CUSTOMER;
  }

  // ==========================================================
  // BUSINESS IDENTITY
  // ==========================================================

  if (
    "businessId" in value &&
    "businessName" in value &&
    "branchId" in value &&
    "branchName" in value
  ) {
    return ENTITY_BUSINESS_IDENTITY;
  }

  // ==========================================================
  // BUSINESS SETTINGS
  // ==========================================================

  if ("businessId" in value && "address" in value && "currency" in value) {
    return ENTITY_BUSINESS_SETTINGS;
  }

  // ==========================================================
  // LOAN
  // ==========================================================
  //
  // Loan is evaluated only AFTER Collection.
  //
  // ==========================================================

  if ("outstanding" in value && "loanType" in value) {
    return ENTITY_LOAN;
  }

  // ==========================================================
  // REPORT
  // ==========================================================

  if ("reportId" in value) {
    return ENTITY_REPORT;
  }

  // ==========================================================
  // GENERAL
  // ==========================================================

  return ENTITY_GENERAL;
}

// ============================================================
// LOCAL STORAGE ADAPTER
// ============================================================

export class LocalStorageAdapter implements StorageAdapter {
  // ==========================================================
  // MODE
  // ==========================================================

  readonly mode = StorageMode.LOCAL;

  // ==========================================================
  // CURRENT CONFIGURATION
  // ==========================================================

  private configuration: StorageConfiguration = {
    storageMode: StorageMode.LOCAL,

    dataContext: DataContext.REAL,
  };

  // ==========================================================
  // INITIALIZE
  // ==========================================================

  async initialize(
    configuration: StorageConfiguration,
  ): Promise<StorageResult<void>> {
    try {
      if (typeof localStorage === "undefined") {
        return {
          success: false,

          error: "Local storage is not available.",
        };
      }

      if (configuration.storageMode !== StorageMode.LOCAL) {
        return {
          success: false,

          error: "Local storage adapter received an invalid storage mode.",
        };
      }

      this.configuration = {
        ...configuration,
      };

      return {
        success: true,
      };
    } catch {
      return {
        success: false,

        error: "Unable to initialize local storage.",
      };
    }
  }

  // ==========================================================
  // AVAILABILITY
  // ==========================================================

  async isAvailable(): Promise<boolean> {
    try {
      if (typeof localStorage === "undefined") {
        return false;
      }

      const testKey = `${STORAGE_PREFIX}_AVAILABILITY_TEST`;

      localStorage.setItem(testKey, "1");

      localStorage.removeItem(testKey);

      return true;
    } catch {
      return false;
    }
  }

  // ==========================================================
  // STATUS
  // ==========================================================

  async getStatus(): Promise<StorageStatus> {
    const available = await this.isAvailable();

    return {
      mode: StorageMode.LOCAL,

      availability: available
        ? StorageAvailability.READY
        : StorageAvailability.UNAVAILABLE,

      dataContext: this.configuration.dataContext,

      ownerId: this.configuration.ownerId,

      demoId: this.configuration.demoId,

      storageId: this.configuration.storageId,

      checkedAt: new Date().toISOString(),

      message: available
        ? "Local storage is ready."
        : "Local storage is unavailable.",
    };
  }

  // ==========================================================
  // GET ONE
  // ==========================================================

  async get<T = unknown>(
    query: StorageQuery,
  ): Promise<StorageResult<T | undefined>> {
    try {
      const key = buildStorageKey(query);

      const records = readArray<T>(key);

      if (!query.id) {
        return {
          success: true,

          data: undefined,
        };
      }

      const record = records.find((item) => getRecordId(item) === query.id);

      return {
        success: true,

        data: record,
      };
    } catch {
      return {
        success: false,

        error: "Unable to read local storage.",
      };
    }
  }

  // ==========================================================
  // GET ALL
  // ==========================================================

  async getAll<T = unknown>(query: StorageQuery): Promise<StorageResult<T[]>> {
    try {
      const key = buildStorageKey(query);

      let records = readArray<T>(key);

      if (typeof query.offset === "number") {
        records = records.slice(query.offset);
      }

      if (typeof query.limit === "number") {
        records = records.slice(0, query.limit);
      }

      return {
        success: true,

        data: records,
      };
    } catch {
      return {
        success: false,

        error: "Unable to read local storage.",
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
    try {
      // --------------------------------------------------------
      // RECORD ID
      // --------------------------------------------------------

      const id = getRecordId(record);

      if (!id) {
        return {
          success: false,

          error: "Storage record requires a supported identifier.",
        };
      }

      // --------------------------------------------------------
      // ENTITY RESOLUTION
      // --------------------------------------------------------

      const entity = resolveEntity(record);

      // --------------------------------------------------------
      // STORAGE QUERY
      // --------------------------------------------------------

      const query: StorageQuery = {
        entity,
      };

      // --------------------------------------------------------
      // STORAGE KEY
      // --------------------------------------------------------

      const key = buildStorageKey(query, options);

      // --------------------------------------------------------
      // READ EXISTING RECORDS
      // --------------------------------------------------------

      const records = readArray<T>(key);

      // --------------------------------------------------------
      // DUPLICATE CHECK
      // --------------------------------------------------------

      const existingIndex = records.findIndex(
        (item) => getRecordId(item) === id,
      );

      if (existingIndex !== -1) {
        return {
          success: false,

          error: "A record with the same identifier already exists.",
        };
      }

      // --------------------------------------------------------
      // APPEND
      // --------------------------------------------------------

      records.push(record);

      // --------------------------------------------------------
      // PERSIST
      // --------------------------------------------------------

      const result = writeArray(key, records);

      if (!result.success) {
        return {
          success: false,

          error: result.error ?? "Unable to save record to local storage.",
        };
      }

      // --------------------------------------------------------
      // AUDIT LOG
      // --------------------------------------------------------

      console.info("FINORA LOCAL STORAGE SAVE", {
        entity,

        key,

        id,

        ownerId: options?.ownerId ?? this.configuration.ownerId,

        demoId: options?.demoId ?? this.configuration.demoId,
      });

      return {
        success: true,

        data: record,
      };
    } catch {
      return {
        success: false,

        error: "Unable to save record to local storage.",
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
    try {
      const id = getRecordId(record);

      if (!id) {
        return {
          success: false,

          error: "Storage record requires a supported identifier.",
        };
      }

      const entity = resolveEntity(record);

      const query: StorageQuery = {
        entity,
      };

      const key = buildStorageKey(query, options);

      const records = readArray<T>(key);

      const index = records.findIndex((item) => getRecordId(item) === id);

      if (index === -1) {
        return {
          success: false,

          error: "Storage record was not found.",
        };
      }

      records[index] = record;

      const result = writeArray(key, records);

      if (!result.success) {
        return {
          success: false,

          error: result.error ?? "Unable to update record in local storage.",
        };
      }

      console.info("FINORA LOCAL STORAGE UPDATE", {
        entity,

        key,

        id,
      });

      return {
        success: true,

        data: record,
      };
    } catch {
      return {
        success: false,

        error: "Unable to update record in local storage.",
      };
    }
  }

  // ==========================================================
  // DELETE ONE RECORD
  // ==========================================================

  async delete(query: StorageQuery): Promise<StorageResult<void>> {
    try {
      if (!query.id) {
        return {
          success: false,

          error: "Storage record ID is required for delete.",
        };
      }

      const key = buildStorageKey(query);

      const records = readArray<unknown>(key);

      const existing = records.find((item) => getRecordId(item) === query.id);

      if (!existing) {
        return {
          success: false,

          error: "Storage record was not found.",
        };
      }

      const filtered = records.filter((item) => getRecordId(item) !== query.id);

      const result = writeArray(key, filtered);

      if (!result.success) {
        return {
          success: false,

          error: result.error ?? "Unable to delete local storage record.",
        };
      }

      return {
        success: true,
      };
    } catch {
      return {
        success: false,

        error: "Unable to delete local storage record.",
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
    try {
      if (!records.length) {
        return {
          success: true,
        };
      }

      const firstRecord = records[0];

      const query: StorageQuery = {
        entity: resolveEntity(firstRecord),
      };

      const key = buildStorageKey(query, options);

      const result = writeArray(key, records);

      if (!result.success) {
        return {
          success: false,

          error: result.error ?? "Unable to replace local storage records.",
        };
      }

      return {
        success: true,
      };
    } catch {
      return {
        success: false,

        error: "Unable to replace local storage records.",
      };
    }
  }

  // ==========================================================
  // CLEAR
  // ==========================================================

  async clear(query: StorageQuery): Promise<StorageResult<void>> {
    try {
      const key = buildStorageKey(query);

      localStorage.removeItem(key);

      return {
        success: true,
      };
    } catch {
      return {
        success: false,

        error: "Unable to clear local storage.",
      };
    }
  }

  // ==========================================================
  // RESET FINORA DATA
  // ==========================================================

  async resetFinoraData(): Promise<StorageResult<void>> {
    try {
      if (typeof localStorage === "undefined") {
        return {
          success: false,

          error: "Local storage is not available.",
        };
      }

      // --------------------------------------------------------
      // VALIDATE REAL CONTEXT
      // --------------------------------------------------------

      if (
        this.configuration.dataContext === DataContext.REAL &&
        !this.configuration.ownerId
      ) {
        return {
          success: false,

          error: "A valid owner ID is required to reset REAL FINORA data.",
        };
      }

      // --------------------------------------------------------
      // VALIDATE DEMO CONTEXT
      // --------------------------------------------------------

      if (
        this.configuration.dataContext === DataContext.DEMO &&
        !this.configuration.demoId
      ) {
        return {
          success: false,

          error: "A valid Demo ID is required to reset DEMO FINORA data.",
        };
      }

      // --------------------------------------------------------
      // CONTEXT QUERY
      // --------------------------------------------------------

      const contextQuery: StorageQuery = {
        entity: ENTITY_GENERAL,

        ownerId: this.configuration.ownerId,

        demoId: this.configuration.demoId,
      };

      // --------------------------------------------------------
      // REMOVE FINORA ENTITIES ONLY
      // --------------------------------------------------------

      for (const entity of FINORA_RESET_ENTITIES) {
        localStorage.removeItem(
          buildStorageKey({
            ...contextQuery,

            entity,
          }),
        );
      }

      return {
        success: true,
      };
    } catch {
      return {
        success: false,

        error: "Unable to reset FINORA data from local storage.",
      };
    }
  }
}

// ============================================================
// SINGLETON
// ============================================================

export const localStorageAdapter = new LocalStorageAdapter();

// ============================================================
// END
// ============================================================
