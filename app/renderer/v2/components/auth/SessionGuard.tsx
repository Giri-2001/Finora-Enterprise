import {
  touchFinoraServerGuardSession,
  validateFinoraServerGuardSession,
} from "../../services/auth/finoraServerReceptionGuardLifecycle";

import { storageManager } from "../../storage/storageManager";
import { invalidateFinoraServerGuardSession } from "../../services/auth/finoraServerReceptionGuardLifecycle";

import { getFinoraLoginSessionBridge } from "../../services/auth/loginSessionBridge";
// ============================================================
// LAYER   : Renderer / V2 Authentication
// VERSION : 2.0
// STATUS  : Production
//
// RESPONSIBILITY:
//
// - Protect the active FINORA V2 application session
// - Track authenticated user activity
// - Detect session expiration
// - Logout expired sessions
// - Reload the renderer after forced logout
//
// ARCHITECTURE:
//
// V2 App
//   ↓
// V2 SessionGuard
//   ↓
// Authentication Foundation
//
// NOTE:
//
// The authentication foundation is still being migrated from
// the root renderer infrastructure. This component intentionally
// preserves the existing production behavior while moving the
// SessionGuard ownership into V2.
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  useEffect,
} from "react";

import {
  getSession,
  invalidateSession,
  persistRevalidatedSessionSnapshot,
} from "../../store/authStore";


// ============================================================
// TYPES
// ============================================================

type SessionGuardProps = {
  children: React.ReactNode;
};

const FINORA_MAIN_SESSION_TOUCH_THROTTLE_MS =
  30_000;

const FINORA_MAIN_SESSION_VALIDATE_INTERVAL_MS =
  60_000;

// ============================================================
// COMPONENT
// ============================================================

export default function SessionGuard({
  children,
}: SessionGuardProps) {

  // ==========================================================
  // SESSION ACTIVITY / EXPIRATION MONITOR
  // ==========================================================

  useEffect(() => {
    const activityEvents = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
    ];

    let lastMainTouchAt =
      performance.now();

    let touchInFlight =
      false;

    let validationInFlight =
      false;

    let forcedExit =
      false;

    // --------------------------------------------------------
    // FORCED SECURITY EXIT
    //
    // Main-process rejection / expiry is a security
    // invalidation, not an explicit user Logout.
    //
    // Therefore no renderer LOGOUT audit is generated here.
    // --------------------------------------------------------

    function forceSessionExit(): void {
      if (forcedExit) {
        return;
      }

      forcedExit =
        true;

      // FINORA_P1_707I_SECURE_SESSION_EXIT
      // Clear the renderer USB authority before removing the session.
      storageManager.setAuthenticatedSessionId(undefined);

      // Best-effort Main Process invalidation of the opaque Reception
      // session. Never rely on this asynchronous call for USB denial.
      const exitingSession = getSession();
      if (exitingSession && /^[a-f0-9]{64}$/.test(exitingSession.sessionId)) {
        void invalidateFinoraServerGuardSession(
          exitingSession.sessionId
        ).catch(() => undefined);
      }

      // FINORA_P1_709Q_GUARD_TRACE
      window.alert("FINORA SESSION GUARD REJECTED THE RECEPTION SESSION.");
      invalidateSession();
      window.location.reload();
    }

    // --------------------------------------------------------
    // AUTHORITATIVE MAIN-PROCESS ACTIVITY TOUCH
    //
    // Renderer activity events can be extremely frequent.
    // Main IPC is therefore throttled to at most once every
    // 30 seconds.
    //
    // Main uses its own monotonic clock for the real idle timer.
    // --------------------------------------------------------

    async function touchMainSession():
      Promise<void> {
      if (
        forcedExit ||
        touchInFlight
      ) {
        return;
      }

      const now =
        performance.now();

      if (
        now -
          lastMainTouchAt <
        FINORA_MAIN_SESSION_TOUCH_THROTTLE_MS
      ) {
        return;
      }

      const session =
        getSession();

      if (
        !session ||
        !session.sessionId
      ) {
        forceSessionExit();

        return;
      }

      // FINORA_P1_707L_SERVER_GUARD_ROUTING
      // A server-format session must NEVER fall back to legacy auth.
      if (/^[a-f0-9]{64}$/.test(session.sessionId)) {
        touchInFlight = true;
        lastMainTouchAt = now;
        try {
          const result = await touchFinoraServerGuardSession(session.sessionId);
          if (!result.success || result.sessionId !== session.sessionId ||
              getSession()?.sessionId !== session.sessionId) {
            forceSessionExit();
          }
        } catch {
          forceSessionExit();
        } finally {
          touchInFlight = false;
        }
        return;
      }

      const touchLoginSession =
        getFinoraLoginSessionBridge()
          ?.touch;

      if (
        typeof touchLoginSession !==
          "function"
      ) {
        forceSessionExit();

        return;
      }

      touchInFlight =
        true;

      lastMainTouchAt =
        now;

      try {
        const result =
          await touchLoginSession({
            sessionId:
              session.sessionId,
          });

        if (
          !result.success ||
          result.data.sessionId !==
            session.sessionId
        ) {
          forceSessionExit();
        }
      }
      catch {
        forceSessionExit();
      }
      finally {
        touchInFlight =
          false;
      }
    }

    // --------------------------------------------------------
    // AUTHORITATIVE PERIODIC VALIDATION
    //
    // Every 60 seconds main process:
    //
    // - verifies the opaque session still exists
    // - enforces monotonic 30-minute idle expiry
    // - re-reads protected credential state
    // - re-evaluates Branch Access / activation / entitlement
    //
    // Successful validation also repairs the persisted renderer
    // snapshot from authoritative identity / role / scope data.
    // --------------------------------------------------------

    async function validateMainSession():
      Promise<void> {
      if (
        forcedExit ||
        validationInFlight
      ) {
        return;
      }

      const session =
        getSession();

      if (
        !session ||
        !session.sessionId
      ) {
        forceSessionExit();

        return;
      }

      // FINORA_P1_707L_SERVER_VALIDATION
      // Identity is independently checked in Electron Main.
      if (/^[a-f0-9]{64}$/.test(session.sessionId)) {
        validationInFlight = true;
        try {
          const result = await validateFinoraServerGuardSession(session.sessionId);
          if (!result.success) {
            forceSessionExit();
            return;
          }

          const verified = result.data;
          const current = getSession();
          if (!current || current.sessionId !== session.sessionId ||
              verified.sessionId !== session.sessionId ||
              verified.userId !== session.userId ||
              verified.username !== session.username ||
              verified.role !== session.role ||
              verified.ownerId !== session.ownerId ||
              verified.businessId !== session.businessId ||
              verified.branchId !== session.branchId ||
              verified.dataContext !== "REAL") {
            forceSessionExit();
            return;
          }

          const persisted = persistRevalidatedSessionSnapshot({
            ...session,
            userId: verified.userId,
            username: verified.username,
            fullName: verified.fullName,
            role: verified.role,
            sessionId: verified.sessionId,
            loginTime: verified.loginTime,
            lastActivity: verified.lastActivity,
            ownerId: verified.ownerId,
            businessId: verified.businessId,
            branchId: verified.branchId,
            dataContext: "REAL",
            businessDate: session.businessDate,
          });

          if (!persisted) forceSessionExit();
        } catch {
          forceSessionExit();
        } finally {
          validationInFlight = false;
        }
        return;
      }

      const validateLoginSession =
        getFinoraLoginSessionBridge()
          ?.validate;

      if (
        typeof validateLoginSession !==
          "function"
      ) {
        forceSessionExit();

        return;
      }

      validationInFlight =
        true;

      try {
        const result =
          await validateLoginSession({
            sessionId:
              session.sessionId,
          });

        if (
          !result.success ||
          result.data.sessionId !==
            session.sessionId
        ) {
          forceSessionExit();

          return;
        }

        const authoritativeSession =
          result.data;

        const persisted =
          persistRevalidatedSessionSnapshot({
            userId:
              authoritativeSession.userId,

            username:
              authoritativeSession.username,

            fullName:
              authoritativeSession.fullName,

            role:
              authoritativeSession.role,

            loginTime:
              authoritativeSession.loginTime,

            businessDate:
              session.businessDate,

            sessionId:
              authoritativeSession.sessionId,

            lastActivity:
              authoritativeSession.lastActivity,

            ownerId:
              authoritativeSession.ownerId,

            businessId:
              authoritativeSession.businessId,

            branchId:
              authoritativeSession.branchId,

            dataContext:
              authoritativeSession.dataContext,

            ...(
              authoritativeSession.demoId ===
                undefined
                ? {}
                : {
                    demoId:
                      authoritativeSession.demoId,
                  }
            ),
          });

        if (!persisted) {
          forceSessionExit();
        }
      }
      catch {
        forceSessionExit();
      }
      finally {
        validationInFlight =
          false;
      }
    }

    // --------------------------------------------------------
    // USER ACTIVITY
    // --------------------------------------------------------

    function handleActivity(): void {
      void touchMainSession();
    }

    // --------------------------------------------------------
    // REGISTER ACTIVITY LISTENERS
    // --------------------------------------------------------

    activityEvents.forEach(
      (event) => {
        window.addEventListener(
          event,
          handleActivity,
        );
      },
    );

    // --------------------------------------------------------
    // PERIODIC AUTHORITATIVE SESSION CHECK
    // --------------------------------------------------------

    const interval =
      window.setInterval(
        () => {
          void validateMainSession();
        },
        FINORA_MAIN_SESSION_VALIDATE_INTERVAL_MS,
      );

    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------

    return () => {
      activityEvents.forEach(
        (event) => {
          window.removeEventListener(
            event,
            handleActivity,
          );
        },
      );

      window.clearInterval(
        interval,
      );
    };
  }, []);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {children}
    </>
  );

}
