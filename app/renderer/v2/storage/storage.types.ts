/* ===========================================================
   FINORA ENTERPRISE OS™

   V2 STORAGE FOUNDATION
   STORAGE CONTRACT

   RESPONSIBILITY:

   - Common storage contract for FINORA V2
   - Storage mode definitions
   - Storage availability states
   - Data context definitions
   - Storage operation result types

   IMPORTANT:

   - This file contains TYPES ONLY.
   - No localStorage access.
   - No filesystem access.
   - No Electron IPC.
   - No cloud API.
   - No business logic.

   Storage implementations must follow this contract.

   VERSION : 2.0
   STATUS  : Production
=========================================================== */


/* ==========================================================
   STORAGE MODE

   Defines where FINORA data is physically persisted.

   LOCAL
   - Device-local storage.
   - Used for development / local operation.

   USB
   - External FINORA storage device.
   - Data is available only while the configured
     storage device is connected.

   CLOUD
   - Online FINORA storage.
   - Data is persisted remotely.

   IMPORTANT:

   DEMO is NOT a storage mode.
   DEMO is a data context and can use any supported
   storage mode.
========================================================== */

export enum StorageMode {
  LOCAL = "LOCAL",

  USB = "USB",

  CLOUD = "CLOUD",
}


/* ==========================================================
   STORAGE AVAILABILITY

   Describes the current state of the selected storage.

   READY
   - Storage is available and usable.

   UNAVAILABLE
   - Storage is temporarily unavailable.

   DISCONNECTED
   - External storage such as USB is not connected.

   ERROR
   - Storage exists but an operation failed.

   NOT_CONFIGURED
   - No storage destination has been configured.
========================================================== */

export enum StorageAvailability {
  READY = "READY",

  UNAVAILABLE = "UNAVAILABLE",

  DISCONNECTED = "DISCONNECTED",

  ERROR = "ERROR",

  NOT_CONFIGURED = "NOT_CONFIGURED",
}


/* ==========================================================
   DATA CONTEXT

   Defines whose data FINORA is currently operating on.

   REAL
   - Production owner/customer data.

   DEMO
   - Demonstration data.
   - Used for FINORA product demonstrations.

   IMPORTANT:

   Demo and Real are data contexts, not storage modes.

   Example:

   DEMO + LOCAL
   DEMO + USB
   DEMO + CLOUD

   REAL + LOCAL
   REAL + USB
   REAL + CLOUD
========================================================== */

export enum DataContext {
  REAL = "REAL",

  DEMO = "DEMO",
}


/* ==========================================================
   STORAGE CONFIGURATION

   Defines the currently selected storage environment.

   storageMode:
   - Physical / logical storage destination.

   dataContext:
   - Real or Demo data environment.

   ownerId:
   - Identifies the owner / tenant whose data is being
     accessed.

   demoId:
   - Identifies the individual Demo environment when
     dataContext is DEMO.

   deviceId:
   - Identifies the trusted FINORA installation/device.

   storageId:
   - Identifies the configured storage destination.
========================================================== */

export interface StorageConfiguration {

  storageMode: StorageMode;

  dataContext: DataContext;

  ownerId?: string;

  demoId?: string;

  deviceId?: string;

  storageId?: string;
}


/* ==========================================================
   STORAGE STATUS

   Runtime status returned by the storage manager.

   This allows the UI to safely display states such as:

   - Cloud Connected
   - Pendrive Connected
   - Pendrive Disconnected
   - Local Storage Ready
   - Storage Error
========================================================== */

export interface StorageStatus {

  mode: StorageMode;

  availability: StorageAvailability;

  dataContext: DataContext;

  ownerId?: string;

  demoId?: string;

  storageId?: string;

  message?: string;

  checkedAt: string;
}


/* ==========================================================
   STORAGE RECORD

   Generic persisted record contract.

   Every FINORA domain repository can later persist
   its own typed records through the common storage layer.

   Examples:

   CUSTOMER
   LOAN
   COLLECTION
   PAYMENT
   NOTIFICATION
   REPORT

   The storage layer does not understand business rules.
========================================================== */

export interface StorageRecord {

  id: string;

  entity: string;

  data: unknown;

  createdAt: string;

  updatedAt: string;
}


/* ==========================================================
   STORAGE QUERY

   Common query contract for future repositories.

   entity:
   - Domain collection/entity name.

   id:
   - Optional single-record lookup.

   ownerId:
   - Owner isolation.

   demoId:
   - Demo environment isolation.

   limit:
   - Optional result limit.

   offset:
   - Optional pagination offset.
========================================================== */

export interface StorageQuery {

  entity: string;

  id?: string;

  ownerId?: string;

  demoId?: string;

  limit?: number;

  offset?: number;
}


/* ==========================================================
   STORAGE WRITE OPTIONS

   Additional metadata required during persistence.

   ownerId / demoId ensure that data cannot accidentally
   cross between different FINORA owners or Demo accounts.
========================================================== */

export interface StorageWriteOptions {

  ownerId?: string;

  demoId?: string;
}


/* ==========================================================
   STORAGE OPERATION RESULT

   Standard result wrapper for storage operations.

   success:
   - Indicates whether the operation completed.

   data:
   - Optional returned data.

   error:
   - Safe error information when an operation fails.
========================================================== */

export interface StorageResult<T = unknown> {

  success: boolean;

  data?: T;

  error?: string;
}


/* ==========================================================
   STORAGE ADAPTER

   Every physical storage implementation must eventually
   satisfy this contract.

   Implementations:

   - LocalStorageAdapter
   - USBStorageAdapter
   - CloudStorageAdapter

   IMPORTANT:

   These methods describe the contract only.

   Actual implementations belong in separate files.
========================================================== */

export interface StorageAdapter {

  readonly mode: StorageMode;

  initialize(
    configuration: StorageConfiguration,
  ): Promise<StorageResult<void>>;

  isAvailable(): Promise<boolean>;

  getStatus(): Promise<StorageStatus>;

  get<T = unknown>(
    query: StorageQuery,
  ): Promise<StorageResult<T | undefined>>;

  getAll<T = unknown>(
    query: StorageQuery,
  ): Promise<StorageResult<T[]>>;

  save<T = unknown>(
    record: T,
    options?: StorageWriteOptions,
  ): Promise<StorageResult<T>>;

  update<T = unknown>(
    record: T,
    options?: StorageWriteOptions,
  ): Promise<StorageResult<T>>;

  delete(
    query: StorageQuery,
  ): Promise<StorageResult<void>>;

  replaceAll<T = unknown>(
    records: T[],
    options?: StorageWriteOptions,
  ): Promise<StorageResult<void>>;

  clear(
    query: StorageQuery,
  ): Promise<StorageResult<void>>;
}


/* ==========================================================
   STORAGE EVENT

   Used later by the Storage Manager to notify the application
   when storage availability changes.

   Particularly important for USB storage:

   USB connected
        ↓
   STORAGE_CONNECTED

   USB removed
        ↓
   STORAGE_DISCONNECTED
========================================================== */

export enum StorageEventType {

  STORAGE_CONNECTED = "STORAGE_CONNECTED",

  STORAGE_DISCONNECTED = "STORAGE_DISCONNECTED",

  STORAGE_READY = "STORAGE_READY",

  STORAGE_ERROR = "STORAGE_ERROR",

  STORAGE_CHANGED = "STORAGE_CHANGED",
}


/* ==========================================================
   STORAGE EVENT PAYLOAD
========================================================== */

export interface StorageEvent {

  type: StorageEventType;

  mode: StorageMode;

  dataContext: DataContext;

  message?: string;

  occurredAt: string;
}
