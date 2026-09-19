// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH BACKUP PRIVILEGED IPC
// PHASE : 5.6N-N3B
// ============================================================
//
// SECURITY BOUNDARY:
//
// - Only FINORA trusted MAIN frame may invoke backup export.
// - Renderer request is exact:
//     sessionId + Password + Security Code
// - Renderer cannot provide branch scope, storage mode,
//   generation, filesystem path or serialized backup bytes.
// - Native file transport owns destination selection/write.
// - Public IPC result contains non-secret export metadata only.
// ============================================================

import {
  ipcMain,
} from "electron";

import type {
  BrowserWindow,
  IpcMainInvokeEvent,
  WebFrameMain,
} from "electron";

import {
  exportFinoraPortableBranchAuthBackupFromNativeDialog,
} from "./finoraPortableBranchAuthBackupFileTransport.js";

import type {
  FinoraPortableBranchAuthBackupExportErrorCode,
  FinoraPortableBranchAuthBackupExportResult,
} from "./finoraPortableBranchAuthBackupFileTransport.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

// ============================================================
// CHANNEL
// ============================================================

export const FINORA_PORTABLE_BRANCH_AUTH_BACKUP_IPC_CHANNEL =
  "finora:portable-branch-auth:export-backup" as const;

// ============================================================
// REQUEST
// ============================================================

export interface FinoraPortableBranchAuthBackupIpcRequest {
  sessionId:
    string;

  password:
    string;

  securityCode:
    string;
}

// ============================================================
// RESULT
// ============================================================

export type FinoraPortableBranchAuthBackupIpcErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_REQUEST"
  | "WINDOW_UNAVAILABLE"
  | "SERVICE_FAILURE"
  | FinoraPortableBranchAuthBackupExportErrorCode;

export type FinoraPortableBranchAuthBackupIpcResult =
  | {
      success:
        true;

      cancelled:
        true;

      data:
        null;

      errorCode:
        null;

      error:
        null;
    }
  | {
      success:
        true;

      cancelled:
        false;

      data: {
        backupId:
          string;

        fileName:
          string;

        bytesWritten:
          number;

        sourceStorageMode:
          "LOCAL" | "USB";

        authGeneration:
          number;
      };

      errorCode:
        null;

      error:
        null;
    }
  | {
      success:
        false;

      cancelled:
        false;

      data:
        null;

      errorCode:
        FinoraPortableBranchAuthBackupIpcErrorCode;

      error:
        string;
    };

// ============================================================
// DEPENDENCIES
// ============================================================

export interface FinoraPortableBranchAuthBackupIpcDependencies {
  isTrustedRenderer:
    (
      frame:
        WebFrameMain,
    ) =>
      boolean;

  getParentWindow:
    () =>
      BrowserWindow | null;

  portableStore:
    Pick<
      FinoraPortableBranchAuthStore,
      "read"
    >;

  exportBackup?:
    typeof exportFinoraPortableBranchAuthBackupFromNativeDialog;
}

// ============================================================
// HELPERS
// ============================================================

type UnknownObject =
  Record<string, unknown>;

function isObject(
  value:
    unknown,
): value is UnknownObject {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function failure(
  errorCode:
    FinoraPortableBranchAuthBackupIpcErrorCode,
  error:
    string,
): FinoraPortableBranchAuthBackupIpcResult {
  return {
    success:
      false,

    cancelled:
      false,

    data:
      null,

    errorCode,

    error,
  };
}

export function parseFinoraPortableBranchAuthBackupIpcRequest(
  value:
    unknown,
): FinoraPortableBranchAuthBackupIpcRequest | null {
  if (
    !isObject(
      value,
    )
  ) {
    return null;
  }

  const actualKeys =
    Object.keys(
      value,
    ).sort();

  const expectedKeys =
    [
      "password",
      "securityCode",
      "sessionId",
    ].sort();

  if (
    actualKeys.length !==
      expectedKeys.length ||
    actualKeys.some(
      (
        key,
        index,
      ) =>
        key !==
          expectedKeys[index],
    )
  ) {
    return null;
  }

  if (
    typeof value.sessionId !==
      "string" ||
    value.sessionId.length ===
      0 ||
    value.sessionId.length >
      512 ||
    value.sessionId !==
      value.sessionId.trim() ||
    typeof value.password !==
      "string" ||
    typeof value.securityCode !==
      "string"
  ) {
    return null;
  }

  return {
    sessionId:
      value.sessionId,

    password:
      value.password,

    securityCode:
      value.securityCode,
  };
}

function isFinoraPortableBranchAuthBackupRendererAuthorized(
  event:
    IpcMainInvokeEvent,

  isTrustedRenderer:
    (
      frame:
        WebFrameMain,
    ) =>
      boolean,
): boolean {
  const senderFrame =
    event.senderFrame;

  return (
    senderFrame !==
      null &&
    senderFrame ===
      event.sender.mainFrame &&
    isTrustedRenderer(
      senderFrame,
    )
  );
}

function mapExportResult(
  result:
    FinoraPortableBranchAuthBackupExportResult,
): FinoraPortableBranchAuthBackupIpcResult {
  if (
    result.success
  ) {
    if (
      result.cancelled
    ) {
      return {
        success:
          true,

        cancelled:
          true,

        data:
          null,

        errorCode:
          null,

        error:
          null,
      };
    }

    return {
      success:
        true,

      cancelled:
        false,

      data: {
        backupId:
          result.data.backupId,

        fileName:
          result.data.fileName,

        bytesWritten:
          result.data.bytesWritten,

        sourceStorageMode:
          result.data.sourceStorageMode,

        authGeneration:
          result.data.authGeneration,
      },

      errorCode:
        null,

      error:
        null,
    };
  }

  return failure(
    result.errorCode,
    "FINORA Portable Branch Auth backup export failed.",
  );
}

// ============================================================
// HANDLER CREATION
// ============================================================

export function createFinoraPortableBranchAuthBackupIpcHandler(
  dependencies:
    FinoraPortableBranchAuthBackupIpcDependencies,
): (
  event:
    IpcMainInvokeEvent,
  request:
    unknown,
) =>
  Promise<
    FinoraPortableBranchAuthBackupIpcResult
  > {
  const exportBackup =
    dependencies.exportBackup ??
    exportFinoraPortableBranchAuthBackupFromNativeDialog;

  return async (
    event,
    request,
  ) => {
    if (
      !isFinoraPortableBranchAuthBackupRendererAuthorized(
        event,
        dependencies.isTrustedRenderer,
      )
    ) {
      return failure(
        "UNAUTHORIZED",
        "Unauthorized FINORA backup request.",
      );
    }

    const parsed =
      parseFinoraPortableBranchAuthBackupIpcRequest(
        request,
      );

    if (
      parsed ===
        null
    ) {
      return failure(
        "INVALID_REQUEST",
        "Invalid FINORA backup request.",
      );
    }

    const parentWindow =
      dependencies.getParentWindow();

    if (
      parentWindow ===
        null ||
      parentWindow.isDestroyed()
    ) {
      return failure(
        "WINDOW_UNAVAILABLE",
        "FINORA window is unavailable for backup export.",
      );
    }

    try {
      const exportResult =
        await exportBackup(
          parentWindow,
          parsed,
          dependencies.portableStore,
        );

      return mapExportResult(
        exportResult,
      );
    }
    catch {
      return failure(
        "SERVICE_FAILURE",
        "FINORA Portable Branch Auth backup service failed.",
      );
    }
  };
}

// ============================================================
// REGISTRATION
// ============================================================

let backupHandlersRegistered =
  false;

export function registerFinoraPortableBranchAuthBackupHandlers(
  dependencies:
    FinoraPortableBranchAuthBackupIpcDependencies,
): void {
  if (
    backupHandlersRegistered
  ) {
    return;
  }

  backupHandlersRegistered =
    true;

  ipcMain.handle(
    FINORA_PORTABLE_BRANCH_AUTH_BACKUP_IPC_CHANNEL,
    createFinoraPortableBranchAuthBackupIpcHandler(
      dependencies,
    ),
  );
}