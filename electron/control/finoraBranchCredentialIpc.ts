/* ============================================================
   FINORA ENTERPRISE OSâ„¢

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

import {
  rotateFinoraPortableBranchAuthCredentialV2,
} from "./finoraPortableBranchAuthCredentialRotationCoordinatorV2.js";

import type {
  FinoraPortableBranchAuthV2Store,
} from "./finoraPortableBranchAuthV2Store.js";

// ============================================================
// CHANNELS
// ============================================================

const BRANCH_CREDENTIAL_IPC_CHANNELS = {
  ENROLL:
    "finora:credential:enroll",

  ROTATE_V2:
    "finora:credential:rotate-v2",

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

  portableV2Store:
    FinoraPortableBranchAuthV2Store,
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
          portableV2Store,
        );
      }
      catch {
        return serviceFailure();
      }
    },
  );

  // ----------------------------------------------------------
  // PORTABLE BRANCH AUTH V2 CREDENTIAL ROTATION
  //
  // SECURITY:
  // - trusted ordinary FINORA renderer only
  // - main frame only
  // - renderer supplies no user/scope/role/storage authority
  // - Password / Security Code remain process-memory-only
  // - V2 coordinator owns validation, authentication,
  //   durable recovery and request-level idempotency
  // ----------------------------------------------------------

  ipcMain.handle(
    BRANCH_CREDENTIAL_IPC_CHANNELS.ROTATE_V2,
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
        const rotationResult =
          await rotateFinoraPortableBranchAuthCredentialV2({
            request:
              request as Parameters<
                typeof rotateFinoraPortableBranchAuthCredentialV2
              >[0]["request"],

            portableStore:
              portableV2Store,
          });

        if (!rotationResult.success) {
          return rotationResult;
        }

        const credential =
          rotationResult.data.credential;

        return {
          success:
            true,

          data: {
            transactionId:
              rotationResult.data.transactionId,

            credential: {
              credentialId:
                credential.credentialId,

              userId:
                credential.userId,

              username:
                credential.username,

              fullName:
                credential.fullName,

              role:
                credential.role,

              ownerId:
                credential.ownerId,

              businessId:
                credential.businessId,

              branchId:
                credential.branchId,

              storageMode:
                credential.storageMode,

              dataContext:
                credential.dataContext,

              ...(
                credential.demoId === undefined
                  ? {}
                  : {
                      demoId:
                        credential.demoId,
                    }
              ),

              enrolledAt:
                credential.updatedAt,
            },

            authGeneration:
              rotationResult.data.authGeneration,

            portableReplaceResult:
              rotationResult.data.portableReplaceResult,
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


