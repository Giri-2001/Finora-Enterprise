import { clearFinoraSenderWallet } from "./finoraSenderWalletSession.js";
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
      oneTimeCredentials: {
        username: string;
        password: string;
        securityCode: string;
      };
    }) => Promise<void>,
  // FINORA_P1_702O_SERVER_GUARD_CALLBACK
  // Trusted Main-process dependency, never renderer input.
  verifyServerBoundSession?:
    (
      sender: object,
      session: {
        sessionId: string;
        userId: string;
        ownerId: string;
        businessId: string;
        branchId: string;
        storageMode: "LOCAL" | "USB";
      },
    ) => Promise<boolean>,
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
        // FINORA_P1_700S_ISOLATED_HANDOFF_BOUNDARY
        // Ordinary Local Login intentionally invalidates earlier Wallet access.
        // Server-first handoff must use a separately authorized main-process path.
        // Do not relax this behavior for renderer-supplied requests.
        invalidateFinoraServerWalletForBusinessTransition(event.sender);
        const requestScopedPortableV2Store =
          resolvePortableV2Store
            ? await resolvePortableV2Store(
                request,
              )
            : undefined;

        // FINORA_P1_578AL2_STRICT_REQUEST
        // Exclude the Wallet-only field from strict local authentication.
        const localLoginRequest =
          request && typeof request === "object" && !Array.isArray(request)
            ? Object.fromEntries(
                Object.entries(request).filter(
                  ([key]) => key !== "walletSecurityCode",
                ),
              )
            : request;

        loginResult = await createFinoraBranchLoginSession(
          localLoginRequest,
          portableStore,
          recoverFreshDevice,
          requestScopedPortableV2Store,
        );

        // FINORA_P576N2_ACTUAL_PROVENANCE
        // Diagnostics only. No secrets, identifiers or signed packages logged.
        if (
          process.env.FINORA_WALLET_DIAGNOSTICS === "1" &&
          loginResult?.success === true
        ) {
          const diagnostic = {
            stage: "LOCAL_AUTH_PROVENANCE",
            storeAvailable: Boolean(requestScopedPortableV2Store),
            envelopePresent: false,
            decrypted: false,
            provenanceType: "UNAVAILABLE",
            evidenceValidated: false,
            localScopeMatchesLogin: false,
          };

          // FINORA_P576P2_STAGE
          let failureStep = "PRECHECK";
          try {
            const candidate =
              request &&
              typeof request === "object" &&
              !Array.isArray(request)
                ? request as Record<string, unknown>
                : null;

            const mode = candidate?.storageMode;
            const password = candidate?.password;

            if (
              requestScopedPortableV2Store &&
              (mode === "LOCAL" || mode === "USB") &&
              typeof password === "string" &&
              password.length > 0
            ) {
              failureStep = "READ_ENVELOPE";
              const envelope =
                await requestScopedPortableV2Store.read(mode);

              diagnostic.envelopePresent = Boolean(envelope);

              if (envelope) {
                failureStep = "LOAD_CRYPTO";
                const crypto =
                  await import("./finoraPortableBranchAuthV2Crypto.js");

                const contract:
                  typeof import("./finoraPortableBranchAuthContract.js") =
                    await import("./finoraPortableBranchAuthContract.js");

                failureStep = "DECRYPT_ENVELOPE";
                const payload =
                  await crypto.decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
                    envelope,
                    password,
                  );

                diagnostic.decrypted = true;

                const evidence =
                  payload.sourceAuthorizationVerificationEvidence;

                diagnostic.provenanceType =
                  "provenanceType" in evidence
                    ? String(evidence.provenanceType)
                    : "CONTROL_SIGNED_ENROLLMENT";

                failureStep = "VALIDATE_SIGNED_EVIDENCE";
                contract.validateFinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1(
                  evidence,
                );

                diagnostic.evidenceValidated = true;

                diagnostic.localScopeMatchesLogin =
                  payload.userId === loginResult.data.userId &&
                  payload.ownerId === loginResult.data.ownerId &&
                  payload.businessId === loginResult.data.businessId &&
                  payload.branchId === loginResult.data.branchId;
              }
            }
          } catch (error) {
            // FINORA_P1_578BD_SAFE_ERROR_CLASSIFICATION
            // Never log exception messages, credentials or payloads.
            const errorClass =
              error instanceof Error
                ? error.name
                : "UNKNOWN";

            diagnostic.stage =
              "LOCAL_AUTH_PROVENANCE_CHECK_FAILED_" + failureStep;

            if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
              console.info("[FINORA PROVENANCE FAILURE CLASS]", JSON.stringify({
                failureStep,
                errorClass: [
                  "Error",
                  "TypeError",
                  "RangeError",
                  "SyntaxError"
                ].includes(errorClass) ? errorClass : "OTHER"
              }));
            }
          }

          console.info(
            "[FINORA WALLET PROVENANCE]",
            JSON.stringify(diagnostic),
          );
        }

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

      // FINORA_P572P_UNIFIED_WALLET_HANDOFF
      // FINORA_P573F3_MAIN_GATE
      if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
        console.info("[FINORA WALLET MAIN GATE]", JSON.stringify({
          mainLoginSuccess: loginResult?.success === true,
          ownerRole: loginResult?.success === true &&
            loginResult.data.role === "OWNER",
          activeAccess: loginResult?.success === true &&
            loginResult.data.accessMode === "ACTIVE",
          callbackInstalled: typeof onVerifiedOwnerLogin === "function",
        }));
      }
      // Only a verified, active Owner session qualifies.
      // The session callback is an Electron-main-process dependency.
      // It must independently obtain server Wallet authorization.
      // A Main Login session is NOT a Wallet bearer token.
      // No renderer-selected Owner, Business or Branch scope is trusted.
      if (
        finoraLoginGenerationBySender.get(event.sender) ===
          loginGeneration &&
        !event.sender.isDestroyed() &&
        loginResult?.success === true &&
        loginResult.data.role === "OWNER" &&
        (
          loginResult.data.accessMode === "ACTIVE" ||
          loginResult.data.accessMode === "REGISTERED_EXPIRED_READ_ONLY"
        ) &&
        loginResult.data.dataContext === "REAL" &&
        onVerifiedOwnerLogin
      ) {
        try {
          // FINORA P1-572R: Internal one-time credentials.
          // Main Login success alone never authorizes Wallet access.
          // The future handoff must independently verify server scope.
          const candidate =
            request &&
            typeof request === "object" &&
            !Array.isArray(request)
              ? request as Record<string, unknown>
              : null;

          const username =
            typeof candidate?.username === "string"
              ? candidate.username
              : "";

          const password =
            typeof candidate?.password === "string"
              ? candidate.password
              : "";

          const securityCode =
            typeof candidate?.walletSecurityCode === "string" &&
            candidate.walletSecurityCode.length > 0
              ? candidate.walletSecurityCode
              : typeof candidate?.securityCode === "string"
                ? candidate.securityCode
                : "";

          // FINORA_P573F3_CREDENTIAL_GATE
          if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
            console.info("[FINORA WALLET CREDENTIAL GATE]", JSON.stringify({
              usernamePresent: username.length > 0,
              usernameMatches:
                username.trim().normalize("NFKC").toLowerCase() ===
                loginResult.data.username.trim().normalize("NFKC").toLowerCase(),
              passwordPresent: password.length > 0,
              securityCodePresent: securityCode.length > 0,
            }));
          }
          if (
            username.length > 0 &&
            username.length <= 128 &&
            username.trim().normalize("NFKC").toLowerCase() ===
              loginResult.data.username.trim().normalize("NFKC").toLowerCase() &&
            password.length > 0 &&
            password.length <= 128 &&
            // FINORA_P573X_PASSWORD_HANDOFF
            // Signed proof uses password + enrolled server key.
            // Initial Main Login security requirements are unchanged.
            securityCode.length <= 128 &&
            finoraLoginGenerationBySender.get(event.sender) ===
              loginGeneration &&
            !event.sender.isDestroyed()
          ) {
            await onVerifiedOwnerLogin({
              sessionId: loginResult.data.sessionId,
              userId: loginResult.data.userId,
              ownerId: loginResult.data.ownerId,
              businessId: loginResult.data.businessId,
              branchId: loginResult.data.branchId,
              oneTimeCredentials: {
                username,
                password,
                securityCode,
              },
            });
          }
        } catch {
          // Main Login remains independent of Wallet authorization.
          // No successful Wallet access is implied by this callback.
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
                // FINORA_P1_702P_SERVER_BOUND_VALIDATE
        const local = await validateFinoraBranchLoginSession(
          request,
        );

        if (!local.success) {
          return local;
        }

        // Server verification is mandatory whenever this
        // trusted Main-process callback is installed.
        // FINORA_P1_702S_MANDATORY_SERVER_GUARD
        // Missing server verifier must never authorize a local session.
        if (!verifyServerBoundSession) {
          // FINORA_P1_702Y_MISSING_VERIFIER_CLEANUP
          // Reject access and discard the local session.
          invalidateFinoraBranchLoginSession({
            sessionId: local.data.sessionId,
          });

return {
            success: false,
            errorCode: "SERVER_SESSION_AUTHORIZATION_DENIED",
            error: "Mandatory server session verifier unavailable.",
          };
        }

        if (verifyServerBoundSession) {
          let serverAuthorized = false;

          try {
            serverAuthorized = await verifyServerBoundSession(
              event.sender,
              {
                sessionId: local.data.sessionId,
                userId: local.data.userId,
                ownerId: local.data.ownerId,
                businessId: local.data.businessId,
                branchId: local.data.branchId,
                storageMode: local.data.storageMode,
              },
            );
          } catch {
            serverAuthorized = false;
          }

          if (!serverAuthorized) {
            invalidateFinoraBranchLoginSession({
              sessionId: local.data.sessionId,
            });

            return {
              success: false,
              errorCode: "SERVER_SESSION_AUTHORIZATION_DENIED",
              error: "Server-bound session verification failed.",
            };
          }
        }

        return local;
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
                // FINORA_P1_702R_SERVER_BOUND_TOUCH
        // Validate local identity before refreshing activity.
        const local = await validateFinoraBranchLoginSession(
          request,
        );

        if (!local.success) {
          return local;
        }

        // FINORA_P1_702S_MANDATORY_SERVER_GUARD
        // Missing server verifier must never authorize a local session.
        if (!verifyServerBoundSession) {
          // FINORA_P1_702Y_MISSING_VERIFIER_CLEANUP
          // Reject access and discard the local session.
          invalidateFinoraBranchLoginSession({
            sessionId: local.data.sessionId,
          });

return {
            success: false,
            errorCode: "SERVER_SESSION_AUTHORIZATION_DENIED",
            error: "Mandatory server session verifier unavailable.",
          };
        }

        if (verifyServerBoundSession) {
          let serverAuthorized = false;

          try {
            serverAuthorized = await verifyServerBoundSession(
              event.sender,
              {
                sessionId: local.data.sessionId,
                userId: local.data.userId,
                ownerId: local.data.ownerId,
                businessId: local.data.businessId,
                branchId: local.data.branchId,
                storageMode: local.data.storageMode,
              },
            );
          } catch {
            serverAuthorized = false;
          }

          if (!serverAuthorized) {
            invalidateFinoraBranchLoginSession({
              sessionId: local.data.sessionId,
            });

            return {
              success: false,
              errorCode: "SERVER_SESSION_AUTHORIZATION_DENIED",
              error: "Server-bound session verification failed.",
            };
          }
        }

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
        // FINORA_P1_697G_SENDER_LOGOUT
        clearFinoraSenderWallet(event.sender);
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
        // FINORA_P1_697G_SENDER_LOGOUT
        clearFinoraSenderWallet(event.sender);
        invalidateFinoraServerWalletForBusinessTransition(event.sender);
      }
    },
  );
}

// ============================================================
// END
// ============================================================
