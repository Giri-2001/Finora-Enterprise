/* ============================================================
   FINORA ENTERPRISE OS

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

import type {
  FinoraPortableBranchAuthV2Store,
} from "./finoraPortableBranchAuthV2Store.js";

import {
  createFinoraBranchLoginSession,
  invalidateFinoraBranchLoginSession,
  touchFinoraBranchLoginSession,
  validateFinoraBranchLoginSession,
} from "./finoraBranchLoginSessionAuthority.js";
import {
  invalidateFinoraServerWalletForBusinessTransition,
} from "./finoraServerWalletBusinessLifecycle.js";

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

  recoverFreshDevice?:
    Parameters<
      typeof createFinoraBranchLoginSession
    >[2],

  resolvePortableV2Store?:
    (
      request:
        unknown,
    ) =>
      Promise<
        FinoraPortableBranchAuthV2Store | undefined
      >,
  // FINORA_P566E2_HANDOFF
  // Main-process dependency only; not an IPC request parameter.
  onVerifiedOwnerLogin?:
    (session: {
      sessionId: string;
      userId: string;
      ownerId: string;
      businessId: string;
      branchId: string;
    }) => Promise<void>,
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

  // FINORA_P566G3_RACE_GUARD
  // Never exposed to the renderer.
  const finoraLoginGenerationBySender =
    new WeakMap<object, number>();

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
      }      // FINORA_P566G3_RACE_GUARD
      // This generation belongs to the trusted IPC sender.
      const loginGeneration =
        (finoraLoginGenerationBySender.get(event.sender) ?? 0) + 1;

      finoraLoginGenerationBySender.set(
        event.sender,
        loginGeneration,
      );

      let loginResult:
        Awaited<ReturnType<typeof createFinoraBranchLoginSession>>
        | null = null;

      try {
        // FINORA_P550C: only the authorized sender's wallet is cleared.
        invalidateFinoraServerWalletForBusinessTransition(event.sender);
        const requestScopedPortableV2Store =
          resolvePortableV2Store
            ? await resolvePortableV2Store(
                request,
              )
            : undefined;

        loginResult = await createFinoraBranchLoginSession(
          request,
          portableStore,
          recoverFreshDevice,
          requestScopedPortableV2Store,
        );
      }
      catch {
        return serviceFailure();
      }
      finally {
        // Suppress wallet work started while the business transition awaited.
        if (
          finoraLoginGenerationBySender.get(event.sender) ===
          loginGeneration
        ) {
          invalidateFinoraServerWalletForBusinessTransition(event.sender);
        }
      }

      // FINORA_P566E2_HANDOFF
      // Only a verified, active Owner session qualifies.
      // Wallet authority must still be verified independently by server.
      if (
        finoraLoginGenerationBySender.get(event.sender) ===
          loginGeneration &&
        !event.sender.isDestroyed() &&
        loginResult?.success === true &&
        loginResult.data.role === "OWNER" &&
        loginResult.data.accessMode === "ACTIVE" &&
        onVerifiedOwnerLogin
      ) {
        try {
          await onVerifiedOwnerLogin({
            sessionId: loginResult.data.sessionId,
            userId: loginResult.data.userId,
            ownerId: loginResult.data.ownerId,
            businessId: loginResult.data.businessId,
            branchId: loginResult.data.branchId,
          });
        } catch {
          // Keep Main Login result; Wallet remains inaccessible
          // unless its separate server authorization succeeds.
        }
      }

      return loginResult ?? serviceFailure();
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
        // FINORA_P550C: only the authorized sender's wallet is cleared.
        invalidateFinoraServerWalletForBusinessTransition(event.sender);
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
      finally {
        // Suppress wallet work started while the business transition awaited.
        invalidateFinoraServerWalletForBusinessTransition(event.sender);
      }
    },
  );
}

// ============================================================
// END
// ============================================================
