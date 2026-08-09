// ============================================================
// FINORA ENTERPRISE OS™
// ELECTRON MAIN PROCESS
// V2 USB / PENDRIVE STORAGE IPC
//
// RESPONSIBILITY:
//
// - Create the FINORA desktop window
// - Maintain Electron security boundaries
// - Detect FINORA-compatible removable storage
// - Provide narrow V2 USB storage IPC
// - Keep filesystem access inside Electron main process
// - Persist the FINORA USB storage package safely
//
// IMPORTANT:
//
// - Renderer NEVER receives arbitrary filesystem access.
// - Renderer NEVER receives Node.js APIs.
// - Renderer NEVER chooses arbitrary filesystem paths.
// - USB operations are limited to detected removable storage.
// - Only the FINORA storage directory is accessed.
// - V1 storage is never touched.
//
// VERSION : 2.0
// STATUS  : Production Foundation
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import {
  app,
  BrowserWindow,
  ipcMain,
} from "electron";

import path from "node:path";

import fs from "node:fs/promises";

import {
  execFile,
} from "node:child_process";

import {
  promisify,
} from "node:util";

import {
  randomUUID,
} from "node:crypto";


// ============================================================
// PROMISIFIED SYSTEM COMMAND
// ============================================================

const execFileAsync =
  promisify(execFile);


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

interface PersistedStorageRecord {
  id: string;
  entity: string;
  data: unknown;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  demoId?: string;
}

interface UsbStoragePackage {
  version: "2.0";
  records: PersistedStorageRecord[];
  updatedAt: string;
}


// ============================================================
// CONSTANTS
// ============================================================

const FINORA_DIRECTORY =
  "FINORA";

const FINORA_STORAGE_DIRECTORY =
  "storage";

const FINORA_STORAGE_FILE =
  "finora-storage.json";

const IPC_CHANNELS = {
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
} as const;


// ============================================================
// APPLICATION STATE
// ============================================================

let mainWindow:
  BrowserWindow | null = null;

let handlersRegistered = false;


// ============================================================
// IPC SENDER VALIDATION
// ============================================================

function isTrustedRenderer(
  senderFrame: Electron.WebFrameMain | null,
): boolean {

  // ----------------------------------------------------------
  // Electron can provide null when the sender frame no longer
  // exists. Treat that as untrusted.
  // ----------------------------------------------------------

  if (!senderFrame) {
    return false;
  }


  const frameUrl =
    senderFrame.url;


  if (!frameUrl) {
    return false;
  }


  // ----------------------------------------------------------
  // DEVELOPMENT
  // ----------------------------------------------------------

  if (!app.isPackaged) {

    try {

      const url =
        new URL(frameUrl);

      return (
        url.protocol === "http:" &&
        url.hostname === "localhost" &&
        url.port === "5173"
      );

    } catch {

      return false;
    }
  }


  // ----------------------------------------------------------
  // PRODUCTION
  // ----------------------------------------------------------

  return frameUrl.startsWith(
    "file://",
  );
}


// ============================================================
// RESULT HELPERS
// ============================================================

function success<T>(
  data?: T,
): {
  success: true;
  data?: T;
} {

  return {
    success: true,
    data,
  };
}


function failure(
  error: string,
): {
  success: false;
  error: string;
} {

  return {
    success: false,
    error,
  };
}


// ============================================================
// USB DRIVE DETECTION
// ============================================================

/**
 * Detect Windows removable drives.
 *
 * The renderer does not provide a drive path.
 *
 * This prevents arbitrary filesystem access through IPC.
 *
 * A removable drive is selected using this order:
 *
 * 1. A removable drive containing FINORA\storage
 * 2. Otherwise the first removable drive
 */
async function detectWindowsUsbRoots():
  Promise<string[]> {

  if (process.platform !== "win32") {
    return [];
  }


  try {

    const {
      stdout,
    } =
      await execFileAsync(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          [
            "Get-Volume",
            "| Where-Object { $_.DriveType -eq 'Removable' -and $_.DriveLetter }",
            "| Select-Object -ExpandProperty DriveLetter",
          ].join(" "),
        ],
        {
          windowsHide: true,
          timeout: 5000,
        },
      );


    const driveLetters =
      stdout
        .split(/\r?\n/)
        .map(
          (value) =>
            value.trim(),
        )
        .filter(
          (value) =>
            /^[A-Za-z]$/.test(value),
        );


    return driveLetters.map(
      (letter) =>
        `${letter.toUpperCase()}:\\`,
    );

  } catch {

    return [];
  }
}


// ============================================================
// FINORA USB ROOT
// ============================================================

async function findFinoraUsbRoot():
  Promise<string | null> {

  const roots =
    await detectWindowsUsbRoots();


  if (roots.length === 0) {
    return null;
  }


  // ----------------------------------------------------------
  // PREFER A DRIVE THAT ALREADY CONTAINS FINORA STORAGE
  // ----------------------------------------------------------

  for (const root of roots) {

    const storageDirectory =
      path.join(
        root,
        FINORA_DIRECTORY,
        FINORA_STORAGE_DIRECTORY,
      );


    try {

      await fs.access(
        storageDirectory,
      );

      return root;

    } catch {
      // Continue searching.
    }
  }


  // ----------------------------------------------------------
  // OTHERWISE USE FIRST REMOVABLE DRIVE
  // ----------------------------------------------------------

  return roots[0] ?? null;
}


// ============================================================
// FINORA USB PATHS
// ============================================================

function getFinoraStorageDirectory(
  usbRoot: string,
): string {

  return path.join(
    usbRoot,
    FINORA_DIRECTORY,
    FINORA_STORAGE_DIRECTORY,
  );
}


function getFinoraStorageFile(
  usbRoot: string,
): string {

  return path.join(
    getFinoraStorageDirectory(
      usbRoot,
    ),
    FINORA_STORAGE_FILE,
  );
}


// ============================================================
// STORAGE PACKAGE
// ============================================================

function createEmptyStoragePackage():
  UsbStoragePackage {

  return {
    version: "2.0",

    records: [],

    updatedAt:
      new Date().toISOString(),
  };
}


// ============================================================
// READ STORAGE PACKAGE
// ============================================================

async function readStoragePackage(
  usbRoot: string,
): Promise<UsbStoragePackage> {

  const storageDirectory =
    getFinoraStorageDirectory(
      usbRoot,
    );

  const storageFile =
    getFinoraStorageFile(
      usbRoot,
    );


  await fs.mkdir(
    storageDirectory,
    {
      recursive: true,
    },
  );


  try {

    const raw =
      await fs.readFile(
        storageFile,
        "utf8",
      );


    const parsed:
      unknown =
      JSON.parse(raw);


    if (
      !parsed ||
      typeof parsed !== "object"
    ) {
      throw new Error(
        "Invalid FINORA USB storage package.",
      );
    }


    const candidate =
      parsed as Partial<UsbStoragePackage>;


    if (
      candidate.version !== "2.0" ||
      !Array.isArray(
        candidate.records,
      )
    ) {
      throw new Error(
        "Unsupported FINORA USB storage package.",
      );
    }


    return {
      version: "2.0",

      records:
        candidate.records as PersistedStorageRecord[],

      updatedAt:
        typeof candidate.updatedAt === "string"
          ? candidate.updatedAt
          : new Date().toISOString(),
    };

  } catch (error) {

    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code ===
        "ENOENT"
    ) {

      const emptyPackage =
        createEmptyStoragePackage();


      await writeStoragePackage(
        usbRoot,
        emptyPackage,
      );


      return emptyPackage;
    }


    throw error;
  }
}


// ============================================================
// WRITE STORAGE PACKAGE
// ============================================================

async function writeStoragePackage(
  usbRoot: string,
  storagePackage: UsbStoragePackage,
): Promise<void> {

  const storageDirectory =
    getFinoraStorageDirectory(
      usbRoot,
    );

  const storageFile =
    getFinoraStorageFile(
      usbRoot,
    );

  const temporaryFile =
    `${storageFile}.tmp`;


  await fs.mkdir(
    storageDirectory,
    {
      recursive: true,
    },
  );


  const content =
    JSON.stringify(
      {
        ...storagePackage,

        updatedAt:
          new Date().toISOString(),
      },
      null,
      2,
    );


  await fs.writeFile(
    temporaryFile,
    content,
    "utf8",
  );


  await fs.rename(
    temporaryFile,
    storageFile,
  );
}


// ============================================================
// RECORD VALIDATION
// ============================================================

function validateQuery(
  query: StorageQuery,
): string | null {

  if (
    !query ||
    typeof query !== "object"
  ) {
    return "Storage query is required.";
  }


  if (
    typeof query.entity !== "string" ||
    query.entity.trim().length === 0
  ) {
    return "Storage entity is required.";
  }


  return null;
}


function validateRecord(
  record: unknown,
): record is Record<string, unknown> {

  return (
    typeof record === "object" &&
    record !== null &&
    !Array.isArray(record)
  );
}


// ============================================================
// RECORD MATCHING
// ============================================================

function recordMatchesQuery(
  record: PersistedStorageRecord,
  query: StorageQuery,
): boolean {

  if (
    record.entity !==
    query.entity
  ) {
    return false;
  }


  if (
    query.id !== undefined &&
    record.id !== query.id
  ) {
    return false;
  }


  if (
    query.ownerId !== undefined &&
    record.ownerId !== query.ownerId
  ) {
    return false;
  }


  if (
    query.demoId !== undefined &&
    record.demoId !== query.demoId
  ) {
    return false;
  }


  return true;
}


// ============================================================
// RECORD OUTPUT
// ============================================================

function getRecordData(
  record: PersistedStorageRecord,
): unknown {

  return record.data;
}


// ============================================================
// USB STATUS
// ============================================================

async function getUsbStatus() {

  const usbRoot =
    await findFinoraUsbRoot();


  if (!usbRoot) {

    return {
      availability:
        "DISCONNECTED",

      message:
        "FINORA Pendrive is not connected.",
    };
  }


  try {

    const storageDirectory =
      getFinoraStorageDirectory(
        usbRoot,
      );


    await fs.mkdir(
      storageDirectory,
      {
        recursive: true,
      },
    );


    return {
      availability:
        "READY",

      storageId:
        path.parse(
          usbRoot,
        ).root,

      message:
        "FINORA Pendrive is connected and ready.",
    };

  } catch (error) {

    return {
      availability:
        "ERROR",

      message:
        error instanceof Error
          ? error.message
          : "Unable to access FINORA Pendrive.",
    };
  }
}


// ============================================================
// USB AVAILABILITY
// ============================================================

async function isUsbAvailable():
  Promise<boolean> {

  const status =
    await getUsbStatus();


  return (
    status.availability ===
    "READY"
  );
}


// ============================================================
// IPC: GET
// ============================================================

async function handleUsbGet(
  query: StorageQuery,
) {

  const queryError =
    validateQuery(query);


  if (queryError) {
    return failure(queryError);
  }


  const usbRoot =
    await findFinoraUsbRoot();


  if (!usbRoot) {
    return failure(
      "FINORA Pendrive is disconnected.",
    );
  }


  try {

    const storagePackage =
      await readStoragePackage(
        usbRoot,
      );


    const record =
      storagePackage.records.find(
        (item) =>
          recordMatchesQuery(
            item,
            query,
          ),
      );


    return success(
      record
        ? getRecordData(record)
        : undefined,
    );

  } catch (error) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to read FINORA USB storage.",
    );
  }
}


// ============================================================
// IPC: GET ALL
// ============================================================

async function handleUsbGetAll(
  query: StorageQuery,
) {

  const queryError =
    validateQuery(query);


  if (queryError) {
    return failure(queryError);
  }


  const usbRoot =
    await findFinoraUsbRoot();


  if (!usbRoot) {
    return failure(
      "FINORA Pendrive is disconnected.",
    );
  }


  try {

    const storagePackage =
      await readStoragePackage(
        usbRoot,
      );


    let records =
      storagePackage.records
        .filter(
          (item) =>
            recordMatchesQuery(
              item,
              query,
            ),
        );


    const offset =
      Math.max(
        query.offset ?? 0,
        0,
      );


    const limit =
      query.limit !== undefined
        ? Math.max(
            query.limit,
            0,
          )
        : undefined;


    records =
      limit === undefined
        ? records.slice(offset)
        : records.slice(
            offset,
            offset + limit,
          );


    return success(
      records.map(
        getRecordData,
      ),
    );

  } catch (error) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to read FINORA USB records.",
    );
  }
}


// ============================================================
// IPC: SAVE
// ============================================================

async function handleUsbSave(
  record: unknown,
  options?: StorageWriteOptions,
) {

  if (
    !validateRecord(record)
  ) {
    return failure(
      "A valid storage record is required.",
    );
  }


  const entity =
    typeof record.entity === "string"
      ? record.entity
      : undefined;


  if (!entity) {
    return failure(
      "Storage record entity is required.",
    );
  }


  const usbRoot =
    await findFinoraUsbRoot();


  if (!usbRoot) {
    return failure(
      "FINORA Pendrive is disconnected.",
    );
  }


  try {

    const storagePackage =
      await readStoragePackage(
        usbRoot,
      );


    const now =
      new Date().toISOString();


    const id =
      typeof record.id === "string" &&
      record.id.length > 0
        ? record.id
        : randomUUID();


    const persistedRecord:
      PersistedStorageRecord = {

      id,

      entity,

      data:
        record.data ??
        record,

      createdAt:
        typeof record.createdAt === "string"
          ? record.createdAt
          : now,

      updatedAt:
        now,

      ownerId:
        options?.ownerId,

      demoId:
        options?.demoId,
    };


    const duplicateIndex =
      storagePackage.records.findIndex(
        (item) =>
          item.id === id &&
          item.entity === entity &&
          item.ownerId === options?.ownerId &&
          item.demoId === options?.demoId,
      );


    if (
      duplicateIndex >= 0
    ) {
      return failure(
        "A storage record with the same ID already exists.",
      );
    }


    storagePackage.records.push(
      persistedRecord,
    );


    await writeStoragePackage(
      usbRoot,
      storagePackage,
    );


    return success(
      persistedRecord.data,
    );

  } catch (error) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to save FINORA USB record.",
    );
  }
}


// ============================================================
// IPC: UPDATE
// ============================================================

async function handleUsbUpdate(
  record: unknown,
  options?: StorageWriteOptions,
) {

  if (
    !validateRecord(record)
  ) {
    return failure(
      "A valid storage record is required.",
    );
  }


  const entity =
    typeof record.entity === "string"
      ? record.entity
      : undefined;


  const id =
    typeof record.id === "string"
      ? record.id
      : undefined;


  if (!entity) {
    return failure(
      "Storage record entity is required.",
    );
  }


  if (!id) {
    return failure(
      "Storage record ID is required for update.",
    );
  }


  const usbRoot =
    await findFinoraUsbRoot();


  if (!usbRoot) {
    return failure(
      "FINORA Pendrive is disconnected.",
    );
  }


  try {

    const storagePackage =
      await readStoragePackage(
        usbRoot,
      );


    const index =
      storagePackage.records.findIndex(
        (item) =>
          item.id === id &&
          item.entity === entity &&
          item.ownerId === options?.ownerId &&
          item.demoId === options?.demoId,
      );


    if (index < 0) {
      return failure(
        "FINORA storage record was not found.",
      );
    }


    const existing =
      storagePackage.records[index];


    if (!existing) {
      return failure(
        "FINORA storage record was not found.",
      );
    }


    const updatedRecord:
      PersistedStorageRecord = {

      ...existing,

      data:
        record.data ??
        record,

      updatedAt:
        new Date().toISOString(),
    };


    storagePackage.records[index] =
      updatedRecord;


    await writeStoragePackage(
      usbRoot,
      storagePackage,
    );


    return success(
      updatedRecord.data,
    );

  } catch (error) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to update FINORA USB record.",
    );
  }
}


// ============================================================
// IPC: DELETE
// ============================================================

async function handleUsbDelete(
  query: StorageQuery,
) {

  const queryError =
    validateQuery(query);


  if (queryError) {
    return failure(queryError);
  }


  const usbRoot =
    await findFinoraUsbRoot();


  if (!usbRoot) {
    return failure(
      "FINORA Pendrive is disconnected.",
    );
  }


  try {

    const storagePackage =
      await readStoragePackage(
        usbRoot,
      );


    const originalLength =
      storagePackage.records.length;


    storagePackage.records =
      storagePackage.records.filter(
        (item) =>
          !recordMatchesQuery(
            item,
            query,
          ),
      );


    const deleted =
      storagePackage.records.length !==
      originalLength;


    if (deleted) {

      await writeStoragePackage(
        usbRoot,
        storagePackage,
      );
    }


    return success();

  } catch (error) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to delete FINORA USB record.",
    );
  }
}


// ============================================================
// IPC: REPLACE ALL
// ============================================================

async function handleUsbReplaceAll(
  records: unknown[],
  options?: StorageWriteOptions,
) {

  if (!Array.isArray(records)) {
    return failure(
      "Storage records must be an array.",
    );
  }


  const usbRoot =
    await findFinoraUsbRoot();


  if (!usbRoot) {
    return failure(
      "FINORA Pendrive is disconnected.",
    );
  }


  try {

    const invalidRecord =
      records.find(
        (record) =>
          !validateRecord(record) ||
          typeof record.entity !== "string",
      );


    if (invalidRecord) {
      return failure(
        "Every storage record must contain an entity.",
      );
    }


    const storagePackage =
      await readStoragePackage(
        usbRoot,
      );


    const now =
      new Date().toISOString();


    const preparedRecords:
      PersistedStorageRecord[] =
      records.map(
        (record) => {

          const source =
            record as Record<string, unknown>;


          return {
            id:
              typeof source.id === "string" &&
              source.id.length > 0
                ? source.id
                : randomUUID(),

            entity:
              source.entity as string,

            data:
              source.data ??
              source,

            createdAt:
              typeof source.createdAt === "string"
                ? source.createdAt
                : now,

            updatedAt:
              now,

            ownerId:
              options?.ownerId,

            demoId:
              options?.demoId,
          };
        },
      );


    const preservedRecords =
      storagePackage.records.filter(
        (existing) => {

          return !preparedRecords.some(
            (replacement) =>
              replacement.entity ===
                existing.entity &&
              replacement.ownerId ===
                existing.ownerId &&
              replacement.demoId ===
                existing.demoId,
          );
        },
      );


    storagePackage.records = [
      ...preservedRecords,
      ...preparedRecords,
    ];


    await writeStoragePackage(
      usbRoot,
      storagePackage,
    );


    return success();

  } catch (error) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to replace FINORA USB records.",
    );
  }
}


// ============================================================
// IPC: CLEAR
// ============================================================

async function handleUsbClear(
  query: StorageQuery,
) {

  const queryError =
    validateQuery(query);


  if (queryError) {
    return failure(queryError);
  }


  const usbRoot =
    await findFinoraUsbRoot();


  if (!usbRoot) {
    return failure(
      "FINORA Pendrive is disconnected.",
    );
  }


  try {

    const storagePackage =
      await readStoragePackage(
        usbRoot,
      );


    storagePackage.records =
      storagePackage.records.filter(
        (item) =>
          !recordMatchesQuery(
            item,
            query,
          ),
      );


    await writeStoragePackage(
      usbRoot,
      storagePackage,
    );


    return success();

  } catch (error) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to clear FINORA USB records.",
    );
  }
}


// ============================================================
// REGISTER USB IPC HANDLERS
// ============================================================

function registerUsbStorageHandlers(): void {

  if (handlersRegistered) {
    return;
  }


  handlersRegistered = true;


  // ----------------------------------------------------------
  // AVAILABILITY
  // ----------------------------------------------------------

  ipcMain.handle(
    IPC_CHANNELS.IS_AVAILABLE,
    async (event) => {

      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return false;
      }


      return isUsbAvailable();
    },
  );


  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  ipcMain.handle(
    IPC_CHANNELS.GET_STATUS,
    async (event) => {

      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return {
          availability:
            "ERROR",

          message:
            "Untrusted renderer.",
        };
      }


      return getUsbStatus();
    },
  );


  // ----------------------------------------------------------
  // GET
  // ----------------------------------------------------------

  ipcMain.handle(
    IPC_CHANNELS.GET,
    async (
      event,
      query: StorageQuery,
    ) => {

      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "Untrusted renderer.",
        );
      }


      return handleUsbGet(
        query,
      );
    },
  );


  // ----------------------------------------------------------
  // GET ALL
  // ----------------------------------------------------------

  ipcMain.handle(
    IPC_CHANNELS.GET_ALL,
    async (
      event,
      query: StorageQuery,
    ) => {

      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "Untrusted renderer.",
        );
      }


      return handleUsbGetAll(
        query,
      );
    },
  );


  // ----------------------------------------------------------
  // SAVE
  // ----------------------------------------------------------

  ipcMain.handle(
    IPC_CHANNELS.SAVE,
    async (
      event,
      record: unknown,
      options?: StorageWriteOptions,
    ) => {

      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "Untrusted renderer.",
        );
      }


      return handleUsbSave(
        record,
        options,
      );
    },
  );


  // ----------------------------------------------------------
  // UPDATE
  // ----------------------------------------------------------

  ipcMain.handle(
    IPC_CHANNELS.UPDATE,
    async (
      event,
      record: unknown,
      options?: StorageWriteOptions,
    ) => {

      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "Untrusted renderer.",
        );
      }


      return handleUsbUpdate(
        record,
        options,
      );
    },
  );


  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  ipcMain.handle(
    IPC_CHANNELS.DELETE,
    async (
      event,
      query: StorageQuery,
    ) => {

      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "Untrusted renderer.",
        );
      }


      return handleUsbDelete(
        query,
      );
    },
  );


  // ----------------------------------------------------------
  // REPLACE ALL
  // ----------------------------------------------------------

  ipcMain.handle(
    IPC_CHANNELS.REPLACE_ALL,
    async (
      event,
      records: unknown[],
      options?: StorageWriteOptions,
    ) => {

      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "Untrusted renderer.",
        );
      }


      return handleUsbReplaceAll(
        records,
        options,
      );
    },
  );


  // ----------------------------------------------------------
  // CLEAR
  // ----------------------------------------------------------

  ipcMain.handle(
    IPC_CHANNELS.CLEAR,
    async (
      event,
      query: StorageQuery,
    ) => {

      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "Untrusted renderer.",
        );
      }


      return handleUsbClear(
        query,
      );
    },
  );
}


// ============================================================
// MAIN WINDOW CREATION
// ============================================================

function createMainWindow(): void {

  mainWindow =
    new BrowserWindow({

      width: 1400,

      height: 900,

      minWidth: 1200,

      minHeight: 700,

      title:
        "FINORA Enterprise",

      backgroundColor:
        "#0f172a",

      autoHideMenuBar:
        true,

      webPreferences: {

        preload:
          path.join(
            __dirname,
            "preload.js",
          ),

        contextIsolation:
          true,

        nodeIntegration:
          false,

        sandbox:
          true,
      },
    });


  // ----------------------------------------------------------
  // DEVELOPMENT
  // ----------------------------------------------------------

  if (!app.isPackaged) {

    void mainWindow.loadURL(
      "http://localhost:5173",
    );

    mainWindow.webContents.openDevTools();

  }


  // ----------------------------------------------------------
  // PRODUCTION
  // ----------------------------------------------------------

  else {

    void mainWindow.loadFile(
      path.join(
        __dirname,
        "../dist/index.html",
      ),
    );
  }


  // ----------------------------------------------------------
  // F11 FULLSCREEN
  // ----------------------------------------------------------

  mainWindow.webContents.on(
    "before-input-event",
    (_event, input) => {

      if (
        input.type === "keyDown" &&
        input.key === "F11"
      ) {

        mainWindow?.setFullScreen(
          !mainWindow.isFullScreen(),
        );
      }
    },
  );


  // ----------------------------------------------------------
  // WINDOW CLOSED
  // ----------------------------------------------------------

  mainWindow.on(
    "closed",
    () => {
      mainWindow = null;
    },
  );
}


// ============================================================
// APPLICATION STARTUP
// ============================================================

app.whenReady().then(() => {

  registerUsbStorageHandlers();

  createMainWindow();


  // ----------------------------------------------------------
  // MACOS WINDOW REACTIVATION
  // ----------------------------------------------------------

  app.on(
    "activate",
    () => {

      if (
        BrowserWindow.getAllWindows()
          .length === 0
      ) {

        createMainWindow();
      }
    },
  );
});


// ============================================================
// APPLICATION SHUTDOWN
// ============================================================

app.on(
  "window-all-closed",
  () => {

    if (
      process.platform !==
      "darwin"
    ) {

      app.quit();
    }
  },
);
