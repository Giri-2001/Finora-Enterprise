import { Buffer } from "node:buffer";
import path from "node:path";

import type {
  PaisaruleStorageBackupV1Scope,
} from "./paisaruleStorageBackupV1Crypto.js";

import {
  encryptPaisaruleStorageBackupV1,
} from "./paisaruleStorageBackupV1Crypto.js";

import {
  getPaisaruleBackupSessionKey,
} from "./paisaruleStorageBackupV1SessionKeyAuthority.js";

import {
  createPaisaruleStorageBackupV1Payload,
} from "./paisaruleStorageBackupV1Payload.js";

import {
  createPaisaruleStorageBackupV1Export,
} from "./paisaruleStorageBackupV1Export.js";

// PAISARULE_C117_R147
import {
  countPaisaruleStorageBackupV1Entities,
} from "./paisaruleStorageBackupV1EntityCounts.js";
import type {
  PaisaruleV1EntityCounts,
} from "./paisaruleStorageBackupV1EntityCounts.js";

const STORAGE_DIRECTORY = "storage";

const PRIMARY_FILE = "finora-storage.json";
const SECONDARY_FILE = "finora-storage.backup.json";

const MAX_FILE_BYTES = 32 * 1024 * 1024;

interface FileStatLike {
  isFile(): boolean;
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
  size: number;
}

export interface PaisaruleStorageBackupV1FileTransportDependencies {
  resolveUsbRoot(): Promise<string | null>;
  realpath(filePath: string): Promise<string>;
  lstat(filePath: string): Promise<FileStatLike>;
  readFile(filePath: string): Promise<Buffer>;

  showSaveDialog(
    parentWindow: object,
    options: {
      title: string;
      buttonLabel: string;
      defaultPath: string;
      filters: Array<{
        name: string;
        extensions: string[];
      }>;
    },
  ): Promise<{
    canceled: boolean;
    filePath?: string;
  }>;

  writeFile(
    filePath: string,
    contents: string,
    encoding: "utf8",
  ): Promise<void>;

  getDownloadsPath(): string;

  getSessionKey?(
    sender: object,
    generation: number,
    scope: PaisaruleStorageBackupV1Scope,
  ): Buffer | null;
}

export interface PaisaruleStorageBackupV1FileTransportInput {
  parentWindow: object | null;
  sender: object;
  generation: number;
  scope: PaisaruleStorageBackupV1Scope;
  businessName: string;
  branchName: string;
  isCurrent(): boolean;
}

export type PaisaruleStorageBackupV1FileTransportResult =
  | {
      success: true;
      cancelled: true;
      data: null;
      errorCode: null;
    }
  | {
      success: true;
      cancelled: false;
      data: {
        fileName: string;
        bytesWritten: number;
        createdAt: string;
        entityCounts: PaisaruleV1EntityCounts;
      };
      errorCode: null;
    }
  | {
      success: false;
      cancelled: false;
      data: null;
      errorCode: string;
    };

function failure(
  errorCode: string,
): PaisaruleStorageBackupV1FileTransportResult {
  return {
    success: false,
    cancelled: false,
    data: null,
    errorCode,
  };
}

function withinDirectory(
  root: string,
  candidate: string,
): boolean {
  const relative = path.relative(root, candidate);

  return (
    relative.length > 0 &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

export async function exportPaisaruleStorageBackupV1FromUsb(
  input: PaisaruleStorageBackupV1FileTransportInput,
  dependencies: PaisaruleStorageBackupV1FileTransportDependencies,
): Promise<PaisaruleStorageBackupV1FileTransportResult> {
  if (
    !input ||
    !input.parentWindow ||
    !input.sender ||
    !Number.isSafeInteger(input.generation) ||
    input.generation <= 0 ||
    typeof input.isCurrent !== "function" ||
    !input.isCurrent()
  ) {
    return failure("BACKUP_SESSION_INVALID");
  }

  let storageBytes: Buffer | null = null;
  let backupBytes: Buffer | null = null;
  let key: Buffer | null = null;
  let diagnosticStage = "START";

  try {
    diagnosticStage = "USB_ROOT";
    const root = await dependencies.resolveUsbRoot();

    if (!root) {
      return failure("USB_DISCONNECTED");
    }

    if (!input.isCurrent()) {
      return failure("BACKUP_LOGIN_CHANGED");
    }

    diagnosticStage = "USB_ROOT_REALPATH";
    const realRoot = await dependencies.realpath(root);

    const storageDirectory = path.join(
      realRoot,
      "FINORA",
      STORAGE_DIRECTORY,
    );

    diagnosticStage = "STORAGE_DIRECTORY";
    const realStorageDirectory =
      await dependencies.realpath(storageDirectory);

    if (!withinDirectory(realRoot, realStorageDirectory)) {
      return failure("BACKUP_STORAGE_PATH_INVALID");
    }

    diagnosticStage = "STORAGE_DIRECTORY_STAT";
    const directoryStat =
      await dependencies.lstat(realStorageDirectory);

    if (
      directoryStat.isSymbolicLink() ||
      !directoryStat.isDirectory()
    ) {
      return failure("BACKUP_STORAGE_DIRECTORY_INVALID");
    }

    const primaryPath = path.join(
      realStorageDirectory,
      PRIMARY_FILE,
    );

    const secondaryPath = path.join(
      realStorageDirectory,
      SECONDARY_FILE,
    );

    diagnosticStage = "PRIMARY_REALPATH";
    const primaryRealPath =
      await dependencies.realpath(primaryPath);

    diagnosticStage = "SECONDARY_REALPATH";
    const secondaryRealPath =
      await dependencies.realpath(secondaryPath);

    if (
      path.resolve(primaryRealPath).toLowerCase() !==
        path.resolve(primaryPath).toLowerCase() ||
      path.resolve(secondaryRealPath).toLowerCase() !==
        path.resolve(secondaryPath).toLowerCase() ||
      !withinDirectory(realStorageDirectory, primaryRealPath) ||
      !withinDirectory(realStorageDirectory, secondaryRealPath)
    ) {
      return failure("BACKUP_STORAGE_PATH_INVALID");
    }

    diagnosticStage = "PRIMARY_STAT";
    const primaryStat = await dependencies.lstat(primaryRealPath);
    diagnosticStage = "SECONDARY_STAT";
    const secondaryStat = await dependencies.lstat(secondaryRealPath);

    for (const stat of [primaryStat, secondaryStat]) {
      if (
        stat.isSymbolicLink() ||
        !stat.isFile() ||
        !Number.isSafeInteger(stat.size) ||
        stat.size <= 0 ||
        stat.size > MAX_FILE_BYTES
      ) {
        return failure("BACKUP_STORAGE_FILE_INVALID");
      }
    }

    if (!input.isCurrent()) {
      return failure("BACKUP_LOGIN_CHANGED");
    }

    diagnosticStage = "PRIMARY_READ";
    storageBytes = await dependencies.readFile(primaryRealPath);
    diagnosticStage = "SECONDARY_READ";
    backupBytes = await dependencies.readFile(secondaryRealPath);

    if (
      storageBytes.length !== primaryStat.size ||
      backupBytes.length !== secondaryStat.size
    ) {
      return failure("BACKUP_STORAGE_READ_INCOMPLETE");
    }

    if (!input.isCurrent()) {
      return failure("BACKUP_LOGIN_CHANGED");
    }

    // PAISARULE_C117_R147: primary snapshot counts.
    // Fail closed before encryption or Save dialog.
    diagnosticStage = "ENTITY_COUNTS";
    const entityCounts =
      countPaisaruleStorageBackupV1Entities(
        storageBytes,
        input.scope,
      );

    if (!input.isCurrent()) {
      return failure("BACKUP_LOGIN_CHANGED");
    }

    const getSessionKey =
      dependencies.getSessionKey ??
      getPaisaruleBackupSessionKey;

    diagnosticStage = "SESSION_KEY";
    key = getSessionKey(
      input.sender,
      input.generation,
      input.scope,
    );

    if (!key) {
      return failure("BACKUP_SESSION_KEY_UNAVAILABLE");
    }

    const createdAt = new Date().toISOString();

    diagnosticStage = "PAYLOAD_ENCRYPTION";
    const result = createPaisaruleStorageBackupV1Export(
      storageBytes,
      backupBytes,
      input.scope,
      key,
      {
        createPayload: createPaisaruleStorageBackupV1Payload,
        encryptPayload: encryptPaisaruleStorageBackupV1,
      },
      input.businessName,
      input.branchName,
      createdAt,
    );

    // The Export coordinator zeroes this key copy.
    key = null;

    if (!input.isCurrent()) {
      return failure("BACKUP_LOGIN_CHANGED");
    }

    diagnosticStage = "DOWNLOADS";
    const downloadsPath = dependencies.getDownloadsPath();

    if (
      typeof downloadsPath !== "string" ||
      downloadsPath.length === 0
    ) {
      return failure("BACKUP_DOWNLOADS_UNAVAILABLE");
    }

    diagnosticStage = "SAVE_DIALOG";
    const saveResult = await dependencies.showSaveDialog(
      input.parentWindow,
      {
        title: "Save PAISARULE Business Backup",
        buttonLabel: "Save Backup",
        defaultPath: path.join(
          downloadsPath,
          result.fileName,
        ),
        filters: [{
          name: "PAISARULE Backup",
          extensions: ["paisarule"],
        }],
      },
    );

    if (saveResult.canceled || !saveResult.filePath) {
      return {
        success: true,
        cancelled: true,
        data: null,
        errorCode: null,
      };
    }

    if (
      path.extname(saveResult.filePath).toLowerCase() !==
      ".paisarule"
    ) {
      return failure("BACKUP_EXTENSION_INVALID");
    }

    if (!input.isCurrent()) {
      return failure("BACKUP_LOGIN_CHANGED");
    }

    diagnosticStage = "FILE_WRITE";
    await dependencies.writeFile(
      saveResult.filePath,
      result.fileContents,
      "utf8",
    );

    if (!input.isCurrent()) {
      return failure("BACKUP_COMPLETED_LOGIN_CHANGED");
    }

    return {
      success: true,
      cancelled: false,
      data: {
        fileName: path.basename(saveResult.filePath),
        bytesWritten: Buffer.byteLength(
          result.fileContents,
          "utf8",
        ),
        createdAt: result.createdAt,
        entityCounts,
      },
      errorCode: null,
    };
  } catch (error) {
    const caught =
      error as { code?: unknown; name?: unknown } | null;

    const code =
      caught && typeof caught.code === "string"
        ? caught.code
        : "";

    const name =
      caught && typeof caught.name === "string"
        ? caught.name
        : "";

    const allowedCodes = [
      "ENOENT",
      "EACCES",
      "EPERM",
      "EIO",
      "ENOTDIR",
      "EISDIR",
      "EBUSY",
      "ENOSPC",
      "ERR_INVALID_ARG_TYPE",
      "ERR_INVALID_ARG_VALUE",
    ];

    const safeCategory =
      allowedCodes.includes(code)
        ? code
        : name === "TypeError"
          ? "TYPEERROR"
          : name === "ReferenceError"
            ? "REFERENCEERROR"
            : name === "SyntaxError"
              ? "SYNTAXERROR"
              : "ERROR";

    return failure(
      "BACKUP_DIAGNOSTIC_" +
      diagnosticStage +
      "_" +
      safeCategory,
    );
  } finally {
    storageBytes?.fill(0);
    backupBytes?.fill(0);
    key?.fill(0);
  }
}