/* ============================================================
   FINORA ENTERPRISE OS

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

import {
  recoverFinoraPortableBranchAuthPasswordV2,
} from "./finoraPortableBranchAuthPasswordRecoveryCoordinatorV2.js";
import {
  completeFinoraPortableBranchAuthFirstLoginCredentialsV2,
} from "./finoraPortableBranchAuthFirstLoginCredentialCompletionCoordinatorV2.js";

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

  PASSWORD_RECOVERY_V2:
    "finora:credential:password-recovery-v2",

  FIRST_LOGIN_COMPLETION_V2:
    "finora:credential:first-login-completion-v2",

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


  // ----------------------------------------------------------
  // SECURITY-CODE FORGOT PASSWORD V2
  //
  // SECURITY:
  // - trusted ordinary FINORA renderer only
  // - main frame only
  // - old Password is NOT required
  // - Security Code is recovery authority
  // - secrets remain process-memory-only
  // - coordinator owns server-first durable recovery ordering
  // ----------------------------------------------------------

  ipcMain.handle(
    BRANCH_CREDENTIAL_IPC_CHANNELS.PASSWORD_RECOVERY_V2,
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
        const recoveryResult =
          await recoverFinoraPortableBranchAuthPasswordV2({
            request:
              request as Parameters<
                typeof recoverFinoraPortableBranchAuthPasswordV2
              >[0]["request"],

            portableStore:
              portableV2Store,
          });

        if (!recoveryResult.success) {
          return recoveryResult;
        }

        const credential =
          recoveryResult.data.credential;

        return {
          success:
            true,

          data: {
            transactionId:
              recoveryResult.data.transactionId,

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
                credential.demoId ===
                  undefined
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
              recoveryResult.data.authGeneration,

            portableReplaceResult:
              recoveryResult.data.portableReplaceResult,
          },
        };
      }
      catch {
        return serviceFailure();
      }
    },
  );

  // ----------------------------------------------------------
  // FIRST-LOGIN PERMANENT CREDENTIAL COMPLETION V2
  //
  // SECURITY:
  // - trusted ordinary FINORA renderer only
  // - main frame only
  // - secrets remain process-memory-only
  // - server success is required before PREPARED durability
  // ----------------------------------------------------------

  ipcMain.handle(
    BRANCH_CREDENTIAL_IPC_CHANNELS.FIRST_LOGIN_COMPLETION_V2,
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
        const completionResult =
          await completeFinoraPortableBranchAuthFirstLoginCredentialsV2({
            request:
              request as Parameters<
                typeof completeFinoraPortableBranchAuthFirstLoginCredentialsV2
              >[0]["request"],

            portableStore:
              portableV2Store,
          });

        if (!completionResult.success) {
          return completionResult;
        }

        const credential =
          completionResult.data.credential;

        return {
          success:
            true,

          data: {
            transactionId:
              completionResult.data.transactionId,

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
              completionResult.data.authGeneration,

            portableReplaceResult:
              completionResult.data.portableReplaceResult,
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
