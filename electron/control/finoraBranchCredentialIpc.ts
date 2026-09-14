/* ============================================================
   FINORA ENTERPRISE OS™

   ELECTRON CONTROL
   BRANCH CREDENTIAL IPC

   RESPONSIBILITY:

   - Expose exactly two recipient credential operations:
     1. one-time local credential enrollment
     2. local credential authentication
   - Enforce ordinary FINORA trusted-renderer validation
   - Enforce main-frame-only invocation
   - Delegate all credential authority to main-process services

   SECURITY:

   - Separate from read/check-only finoraControlIpc.ts.
   - Renderer never receives Control Store records.
   - Renderer never receives credential verifier material.
   - Renderer never receives salt or derived key.
   - Renderer cannot supply user/scope/role/storage authority.
   - No session creation.
   - No Branch Access grant mutation.
   - No Business Date.

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

import {
  enrollFinoraBranchCredentialWithPortableStore,
} from "./finoraBranchCredentialEnrollmentService.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

// ============================================================
// CHANNELS
// ============================================================

const BRANCH_CREDENTIAL_IPC_CHANNELS = {
  ENROLL:
    "finora:credential:enroll",

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
      "CREDENTIAL_SERVICE_FAILED" as const,

    error:
      "FINORA credential service failed.",
  };
}

// ============================================================
// RENDERER AUTHORITY
//
// Credential material may be submitted only from the ordinary
// FINORA application's trusted MAIN frame.
//
// A trusted file:// subframe is not sufficient.
// ============================================================

function isAuthorizedCredentialRenderer(
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

let credentialHandlersRegistered =
  false;

export function registerFinoraBranchCredentialHandlers(
  isTrustedRenderer:
    FinoraControlRendererValidator,

  portableStore:
    FinoraPortableBranchAuthStore,
): void {
  if (
    credentialHandlersRegistered
  ) {
    return;
  }

  credentialHandlersRegistered =
    true;

  // ----------------------------------------------------------
  // ONE-TIME LOCAL ENROLLMENT
  // ----------------------------------------------------------

  ipcMain.handle(
    BRANCH_CREDENTIAL_IPC_CHANNELS.ENROLL,
    async (
      event,
      request:
        unknown,
    ) => {
      if (
        !isAuthorizedCredentialRenderer(
          event,
          isTrustedRenderer,
        )
      ) {
        return unauthorized();
      }

      try {
        return await enrollFinoraBranchCredentialWithPortableStore(
          request,
          portableStore,
        );
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