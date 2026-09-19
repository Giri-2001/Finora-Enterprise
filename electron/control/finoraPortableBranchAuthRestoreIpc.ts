/* ============================================================
   FINORA ENTERPRISE

   PORTABLE BRANCH AUTH RESTORE IPC

   Phase 5.6O-O3B

   SECURITY BOUNDARY

   Renderer may submit only:
   - username
   - password
   - securityCode

   IPC rejects:
   - subframes
   - untrusted renderer frames
   - unexpected request fields

   Native file selection, Backup bytes, target paths and USB
   roots remain entirely inside privileged main-process code.
   ============================================================ */

import {
  ipcMain,
} from "electron";

import type {
  BrowserWindow,
  IpcMainInvokeEvent,
  WebFrameMain,
} from "electron";

import {
  sanitizeFinoraPortableBranchAuthRestoreCredentialRequest,
} from "./finoraPortableBranchAuthRestoreContract.js";

import type {
  FinoraPortableBranchAuthRestoreCredentialRequest,
} from "./finoraPortableBranchAuthRestoreContract.js";

import {
  restoreFinoraPortableBranchAuthFromNativeBackup,
} from "./finoraPortableBranchAuthRestoreFileTransport.js";

import type {
  FinoraPortableBranchAuthRestoreFileTransportErrorCode,
  FinoraPortableBranchAuthRestoreFileTransportResult,
} from "./finoraPortableBranchAuthRestoreFileTransport.js";

import type {
  FinoraUsbReplacementRootValidator,
} from "./finoraPortableBranchAuthUsbReplacementNativeTransport.js";

// ============================================================
// CHANNEL
// ============================================================

export const
  FINORA_PORTABLE_BRANCH_AUTH_RESTORE_IPC_CHANNEL =
    "finora:portable-branch-auth:restore-backup" as const;

// ============================================================
// REQUEST
// ============================================================

export interface FinoraPortableBranchAuthRestoreIpcRequest {
  username:
    string;

  password:
    string;

  securityCode:
    string;
}

// ============================================================
// RESULT
// ============================================================

export type FinoraPortableBranchAuthRestoreIpcErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_REQUEST"
  | "WINDOW_UNAVAILABLE"
  | "SERVICE_FAILURE"
  | FinoraPortableBranchAuthRestoreFileTransportErrorCode;

export type FinoraPortableBranchAuthRestoreIpcResult =
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

        storageMode:
          "LOCAL" |
          "USB";

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
        FinoraPortableBranchAuthRestoreIpcErrorCode;

      error:
        string;
    };

// ============================================================
// DEPENDENCIES
// ============================================================

export type FinoraPortableBranchAuthRestoreTransportInvoker =
  typeof restoreFinoraPortableBranchAuthFromNativeBackup;

export interface FinoraPortableBranchAuthRestoreHandlerDependencies {
  isTrustedRenderer:
    (
      frame:
        WebFrameMain,
    ) =>
      boolean;

  getParentWindow:
    () =>
      BrowserWindow |
      null;

  resolveLocalRoot:
    () =>
      string |
      null |
      undefined;

  validateUsbRoot:
    FinoraUsbReplacementRootValidator;

  /**
   * Test seam only.
   * Production uses the O3A native transport.
   */
  restoreFromNativeBackup?:
    FinoraPortableBranchAuthRestoreTransportInvoker;
}

// ============================================================
// HELPERS
// ============================================================

function failure(
  errorCode:
    FinoraPortableBranchAuthRestoreIpcErrorCode,
  error:
    string,
): FinoraPortableBranchAuthRestoreIpcResult {
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

function parseFinoraPortableBranchAuthRestoreIpcRequest(
  value:
    unknown,
): FinoraPortableBranchAuthRestoreCredentialRequest | null {
  return sanitizeFinoraPortableBranchAuthRestoreCredentialRequest(
    value,
  );
}

function isFinoraPortableBranchAuthRestoreRendererAuthorized(
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

function mapTransportResult(
  result:
    FinoraPortableBranchAuthRestoreFileTransportResult,
): FinoraPortableBranchAuthRestoreIpcResult {
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

        storageMode:
          result.data.storageMode,

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
    result.error,
  );
}

// ============================================================
// TESTABLE HANDLER
// ============================================================

export async function handleFinoraPortableBranchAuthRestoreIpcRequest(
  event:
    IpcMainInvokeEvent,
  request:
    unknown,
  dependencies:
    FinoraPortableBranchAuthRestoreHandlerDependencies,
): Promise<
  FinoraPortableBranchAuthRestoreIpcResult
> {
  // ----------------------------------------------------------
  // TRUST GATE FIRST
  //
  // Never parse credentials from untrusted/subframe requests.
  // ----------------------------------------------------------

  if (
    !isFinoraPortableBranchAuthRestoreRendererAuthorized(
      event,
      dependencies.isTrustedRenderer,
    )
  ) {
    return failure(
      "UNAUTHORIZED",
      "Unauthorized FINORA Restore request.",
    );
  }

  // ----------------------------------------------------------
  // STRICT CREDENTIAL-ONLY REQUEST
  // ----------------------------------------------------------

  const parsed =
    parseFinoraPortableBranchAuthRestoreIpcRequest(
      request,
    );

  if (!parsed) {
    return failure(
      "INVALID_REQUEST",
      "Invalid FINORA Restore request.",
    );
  }

  // ----------------------------------------------------------
  // PARENT WINDOW AUTHORITY
  // ----------------------------------------------------------

  const parentWindow =
    dependencies.getParentWindow();

  if (
    parentWindow ===
      null ||
    parentWindow.isDestroyed()
  ) {
    return failure(
      "WINDOW_UNAVAILABLE",
      "FINORA Restore window is unavailable.",
    );
  }

  // ----------------------------------------------------------
  // PRIVILEGED NATIVE TRANSPORT
  // ----------------------------------------------------------

  const restoreFromNativeBackup =
    dependencies.restoreFromNativeBackup ??
    restoreFinoraPortableBranchAuthFromNativeBackup;

  try {
    const result =
      await restoreFromNativeBackup(
        parsed,
        {
          parentWindow,

          resolveLocalRoot:
            dependencies.resolveLocalRoot,

          validateUsbRoot:
            dependencies.validateUsbRoot,
        },
      );

    return mapTransportResult(
      result,
    );
  }
  catch {
    return failure(
      "SERVICE_FAILURE",
      "FINORA Restore could not be completed.",
    );
  }
}

// ============================================================
// REGISTRATION
// ============================================================

let restoreHandlersRegistered =
  false;

export function registerFinoraPortableBranchAuthRestoreHandlers(
  dependencies:
    FinoraPortableBranchAuthRestoreHandlerDependencies,
): void {
  if (
    restoreHandlersRegistered
  ) {
    return;
  }

  restoreHandlersRegistered =
    true;

  ipcMain.handle(
    FINORA_PORTABLE_BRANCH_AUTH_RESTORE_IPC_CHANNEL,
    async (
      event,
      request:
        unknown,
    ) =>
      handleFinoraPortableBranchAuthRestoreIpcRequest(
        event,
        request,
        dependencies,
      ),
  );
}

// ============================================================
// END
// ============================================================