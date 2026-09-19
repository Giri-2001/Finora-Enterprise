// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH USB REPLACEMENT IPC
// PHASE : 5.6M-1C2
// ============================================================
//
// Renderer contract deliberately excludes filesystem paths.
//
// Allowed renderer request:
// - password
// - securityCode
// - expectedScope
//
// Main process owns:
// - native SOURCE selection
// - native TARGET selection
// - USB-root validation
// - Portable Auth replacement execution
//
// ============================================================

import {
  ipcMain,
} from "electron";

import type {
  BrowserWindow,
  IpcMainInvokeEvent,
} from "electron";

import type {
  FinoraControlRendererValidator,
} from "./finoraControlIpc.js";

import {
  replaceFinoraPortableBranchAuthUsb,
} from "./finoraPortableBranchAuthUsbReplacementCoordinator.js";

import type {
  FinoraPortableBranchAuthUsbReplacementResult,
  FinoraPortableBranchAuthUsbReplacementScope,
} from "./finoraPortableBranchAuthUsbReplacementCoordinator.js";

import {
  getFinoraPortableBranchAuthUsbReplacementLifecycleV1,
} from "./finoraPortableBranchAuthUsbReplacementLifecycle.js";

import type {
  FinoraPortableBranchAuthUsbReplacementLifecycleV1,
} from "./finoraPortableBranchAuthUsbReplacementLifecycle.js";

import {
  createFinoraUsbReplacementNativeSelectionDependencies,
} from "./finoraPortableBranchAuthUsbReplacementNativeTransport.js";

import type {
  FinoraUsbReplacementRootValidator,
} from "./finoraPortableBranchAuthUsbReplacementNativeTransport.js";

import {
  selectFinoraUsbReplacementRootPair,
} from "./finoraPortableBranchAuthUsbReplacementSelectionAuthority.js";

import type {
  FinoraUsbReplacementRootPairResult,
} from "./finoraPortableBranchAuthUsbReplacementSelectionAuthority.js";

// ============================================================
// CHANNEL
// ============================================================

export const FINORA_USB_REPLACEMENT_IPC_CHANNEL =
  "finora:portable-branch-auth:replace-usb" as const;

// ============================================================
// RENDERER REQUEST
// ============================================================

export interface FinoraPortableBranchAuthUsbReplacementIpcRequest {
  password:
    string;

  securityCode:
    string;

  expectedScope:
    FinoraPortableBranchAuthUsbReplacementScope;
}

export type FinoraPortableBranchAuthUsbReplacementIpcErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_REQUEST"
  | "WINDOW_UNAVAILABLE"
  | "SELECTION_FAILED"
  | "INVALID_USB_ROOT"
  | "SAME_USB_ROOT"
  | "SOURCE_NOT_FOUND"
  | "SOURCE_STORAGE_FAILED"
  | "AUTHENTICATION_FAILED"
  | "CERTIFICATION_AUTHORITY_MISSING"
  | "TARGET_STORAGE_FAILED"
  | "TARGET_VERIFICATION_FAILED"
  | "SOURCE_CHANGED"
  | "SERVICE_FAILURE";

export type FinoraPortableBranchAuthUsbReplacementIpcResult =
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
        result:
          "WRITTEN" |
          "ALREADY_MATCHED";

        ownerId:
          string;

        businessId:
          string;

        branchId:
          string;

        authGeneration:
          number;

        certificationKeyId:
          string;

        lifecycle:
          Readonly<
            FinoraPortableBranchAuthUsbReplacementLifecycleV1
          >;
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
        FinoraPortableBranchAuthUsbReplacementIpcErrorCode;

      error:
        string;
    };

// ============================================================
// EXECUTION DEPENDENCIES
// ============================================================

export interface FinoraPortableBranchAuthUsbReplacementExecutionDependencies {
  selectRootPair:
    () =>
      Promise<
        FinoraUsbReplacementRootPairResult
      >;

  replaceUsb:
    (
      input: {
        sourceUsbRoot:
          string;

        targetUsbRoot:
          string;

        password:
          string;

        securityCode:
          string;

        expectedScope:
          FinoraPortableBranchAuthUsbReplacementScope;
      },
    ) =>
      Promise<
        FinoraPortableBranchAuthUsbReplacementResult
      >;
}

export interface FinoraPortableBranchAuthUsbReplacementHandlerDependencies {
  isTrustedRenderer:
    FinoraControlRendererValidator;

  getParentWindow:
    () =>
      BrowserWindow |
      null;

  validateUsbRoot:
    FinoraUsbReplacementRootValidator;
}

// ============================================================
// INTERNAL VALIDATION
// ============================================================

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {
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

function hasExactKeys(
  value:
    Record<string, unknown>,
  expected:
    readonly string[],
): boolean {
  const keys =
    Object.keys(
      value,
    );

  if (
    keys.length !==
      expected.length
  ) {
    return false;
  }

  return expected.every(
    (
      key,
    ) =>
      Object.prototype.hasOwnProperty.call(
        value,
        key,
      ),
  );
}

function isNonEmptyString(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

export function parseFinoraPortableBranchAuthUsbReplacementIpcRequest(
  value:
    unknown,
): FinoraPortableBranchAuthUsbReplacementIpcRequest | null {
  if (
    !isRecord(
      value,
    ) ||
    !hasExactKeys(
      value,
      [
        "password",
        "securityCode",
        "expectedScope",
      ],
    )
  ) {
    return null;
  }

  if (
    typeof value.password !==
      "string" ||
    typeof value.securityCode !==
      "string"
  ) {
    return null;
  }

  if (
    !isRecord(
      value.expectedScope,
    ) ||
    !hasExactKeys(
      value.expectedScope,
      [
        "ownerId",
        "businessId",
        "branchId",
      ],
    )
  ) {
    return null;
  }

  if (
    !isNonEmptyString(
      value.expectedScope.ownerId,
    ) ||
    !isNonEmptyString(
      value.expectedScope.businessId,
    ) ||
    !isNonEmptyString(
      value.expectedScope.branchId,
    )
  ) {
    return null;
  }

  return {
    password:
      value.password,

    securityCode:
      value.securityCode,

    expectedScope: {
      ownerId:
        value.expectedScope.ownerId,

      businessId:
        value.expectedScope.businessId,

      branchId:
        value.expectedScope.branchId,
    },
  };
}

// ============================================================
// SAFE FAILURE
// ============================================================

function failure(
  errorCode:
    FinoraPortableBranchAuthUsbReplacementIpcErrorCode,
  error:
    string,
): FinoraPortableBranchAuthUsbReplacementIpcResult {
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

// ============================================================
// AUTHORIZED RENDERER
// ============================================================

export function isFinoraUsbReplacementRendererAuthorized(
  event:
    IpcMainInvokeEvent,
  isTrustedRenderer:
    FinoraControlRendererValidator,
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

// ============================================================
// PURE EXECUTION BOUNDARY
// ============================================================

export async function executeFinoraPortableBranchAuthUsbReplacementRequest(
  request:
    unknown,
  dependencies:
    FinoraPortableBranchAuthUsbReplacementExecutionDependencies,
): Promise<
  FinoraPortableBranchAuthUsbReplacementIpcResult
> {
  const parsed =
    parseFinoraPortableBranchAuthUsbReplacementIpcRequest(
      request,
    );

  if (
    parsed ===
      null
  ) {
    return failure(
      "INVALID_REQUEST",
      "Invalid USB replacement request.",
    );
  }

  let selection:
    FinoraUsbReplacementRootPairResult;

  try {
    selection =
      await dependencies.selectRootPair();
  }
  catch {
    return failure(
      "SERVICE_FAILURE",
      "USB replacement service failed.",
    );
  }

  if (
    !selection.success
  ) {
    return failure(
      selection.errorCode,
      selection.error,
    );
  }

  if (
    selection.cancelled
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

  let replacement:
    FinoraPortableBranchAuthUsbReplacementResult;

  try {
    replacement =
      await dependencies.replaceUsb({
        sourceUsbRoot:
          selection.sourceUsbRoot,

        targetUsbRoot:
          selection.targetUsbRoot,

        password:
          parsed.password,

        securityCode:
          parsed.securityCode,

        expectedScope:
          parsed.expectedScope,
      });
  }
  catch {
    return failure(
      "SERVICE_FAILURE",
      "USB replacement service failed.",
    );
  }

  if (
    !replacement.success
  ) {
    return failure(
      replacement.errorCode,
      "USB replacement failed.",
    );
  }

  return {
    success:
      true,

    cancelled:
      false,

    data: {
      result:
        replacement.data.result,

      ownerId:
        replacement.data.ownerId,

      businessId:
        replacement.data.businessId,

      branchId:
        replacement.data.branchId,

      authGeneration:
        replacement.data.authGeneration,

      certificationKeyId:
        replacement.data.certificationKeyId,

      lifecycle:
        getFinoraPortableBranchAuthUsbReplacementLifecycleV1(),
    },

    errorCode:
      null,

    error:
      null,
  };
}

// ============================================================
// REGISTRATION
// ============================================================

let usbReplacementHandlersRegistered =
  false;

export function registerFinoraPortableBranchAuthUsbReplacementHandlers(
  dependencies:
    FinoraPortableBranchAuthUsbReplacementHandlerDependencies,
): void {
  if (
    usbReplacementHandlersRegistered
  ) {
    return;
  }

  usbReplacementHandlersRegistered =
    true;

  ipcMain.handle(
    FINORA_USB_REPLACEMENT_IPC_CHANNEL,
    async (
      event,
      request:
        unknown,
    ) => {
      if (
        !isFinoraUsbReplacementRendererAuthorized(
          event,
          dependencies.isTrustedRenderer,
        )
      ) {
        return failure(
          "UNAUTHORIZED",
          "Unauthorized USB replacement request.",
        );
      }

      const parsed =
        parseFinoraPortableBranchAuthUsbReplacementIpcRequest(
          request,
        );

      if (
        parsed ===
          null
      ) {
        return failure(
          "INVALID_REQUEST",
          "Invalid USB replacement request.",
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
          "FINORA window is unavailable for USB replacement.",
        );
      }

      return executeFinoraPortableBranchAuthUsbReplacementRequest(
        parsed,
        {
          selectRootPair:
            () =>
              selectFinoraUsbReplacementRootPair(
                createFinoraUsbReplacementNativeSelectionDependencies(
                  parentWindow,
                  dependencies.validateUsbRoot,
                ),
              ),

          replaceUsb:
            replaceFinoraPortableBranchAuthUsb,
        },
      );
    },
  );
}