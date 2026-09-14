/* ============================================================
   FINORA ENTERPRISE OS™

   ELECTRON CONTROL
   BRANCH LOGIN SESSION IPC

   RESPONSIBILITY:

   - Expose exactly four secure login-session operations:
     1. login
     2. validate
     3. touch
     4. invalidate
   - Restrict every operation to the trusted ordinary FINORA
     application MAIN frame
   - Delegate all authentication/session authority to the
     dedicated main-process session authority

   SECURITY:

   - No direct Control Store access.
   - No password persistence.
   - No credential verifier exposure.
   - No identity/scope/role authority accepted from renderer.
   - Renderer can select only login storage mode.
   - sessionId is an opaque main-process-issued bearer token.
   - No Business Date.
   - No renderer session persistence in this module.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

import {
  ipcMain,
} from "electron";

import type {
  IpcMainInvokeEvent,
} from "electron";

import type {
  FinoraControlRendererValidator,
} from "./finoraControlIpc.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import {
  createFinoraBranchLoginSession,
  invalidateFinoraBranchLoginSession,
  touchFinoraBranchLoginSession,
  validateFinoraBranchLoginSession,
} from "./finoraBranchLoginSessionAuthority.js";

// ============================================================
// CHANNELS
// ============================================================

const BRANCH_LOGIN_SESSION_IPC_CHANNELS = {
  LOGIN:
    "finora:login-session:login",

  VALIDATE:
    "finora:login-session:validate",

  TOUCH:
    "finora:login-session:touch",

  INVALIDATE:
    "finora:login-session:invalidate",
} as const;

// ============================================================
// RESULT HELPERS
// ============================================================

function unauthorized() {
  return {
    success:
      false,

    errorCode:
      "UNTRUSTED_RENDERER" as const,

    error:
      "Untrusted renderer.",
  };
}

function serviceFailure() {
  return {
    success:
      false,

    errorCode:
      "LOGIN_SESSION_SERVICE_FAILED" as const,

    error:
      "FINORA login session service failed.",
  };
}

// ============================================================
// RENDERER AUTHORITY
//
// Login/session operations may originate only from the ordinary
// FINORA application's trusted MAIN frame.
//
// A trusted file:// subframe is not sufficient.
// ============================================================

function isAuthorizedLoginSessionRenderer(
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
// REGISTRATION
// ============================================================

let loginSessionHandlersRegistered =
  false;

export function registerFinoraBranchLoginSessionHandlers(
  isTrustedRenderer:
    FinoraControlRendererValidator,

  portableStore:
    FinoraPortableBranchAuthStore,
): void {
  if (
    loginSessionHandlersRegistered
  ) {
    return;
  }

  loginSessionHandlersRegistered =
    true;

  // ----------------------------------------------------------
  // SECURE LOGIN
  // ----------------------------------------------------------

  ipcMain.handle(
    BRANCH_LOGIN_SESSION_IPC_CHANNELS.LOGIN,
    async (
      event,
      request:
        unknown,
    ) => {
      if (
        !isAuthorizedLoginSessionRenderer(
          event,
          isTrustedRenderer,
        )
      ) {
        return unauthorized();
      }

      try {
        return await createFinoraBranchLoginSession(
          request,
          portableStore,
        );
      }
      catch {
        return serviceFailure();
      }
    },
  );

  // ----------------------------------------------------------
  // AUTHORITATIVE SESSION VALIDATION
  // ----------------------------------------------------------

  ipcMain.handle(
    BRANCH_LOGIN_SESSION_IPC_CHANNELS.VALIDATE,
    async (
      event,
      request:
        unknown,
    ) => {
      if (
        !isAuthorizedLoginSessionRenderer(
          event,
          isTrustedRenderer,
        )
      ) {
        return unauthorized();
      }

      try {
        return await validateFinoraBranchLoginSession(
          request,
        );
      }
      catch {
        return serviceFailure();
      }
    },
  );

  // ----------------------------------------------------------
  // SESSION ACTIVITY
  // ----------------------------------------------------------

  ipcMain.handle(
    BRANCH_LOGIN_SESSION_IPC_CHANNELS.TOUCH,
    async (
      event,
      request:
        unknown,
    ) => {
      if (
        !isAuthorizedLoginSessionRenderer(
          event,
          isTrustedRenderer,
        )
      ) {
        return unauthorized();
      }

      try {
        return touchFinoraBranchLoginSession(
          request,
        );
      }
      catch {
        return serviceFailure();
      }
    },
  );

  // ----------------------------------------------------------
  // SESSION INVALIDATION
  // ----------------------------------------------------------

  ipcMain.handle(
    BRANCH_LOGIN_SESSION_IPC_CHANNELS.INVALIDATE,
    async (
      event,
      request:
        unknown,
    ) => {
      if (
        !isAuthorizedLoginSessionRenderer(
          event,
          isTrustedRenderer,
        )
      ) {
        return unauthorized();
      }

      try {
        return {
          success:
            true,

          data: {
            invalidated:
              invalidateFinoraBranchLoginSession(
                request,
              ),
          },
        };
      }
      catch {
        return serviceFailure();
      }
    },
  );
}

// ============================================================
// END
// ============================================================