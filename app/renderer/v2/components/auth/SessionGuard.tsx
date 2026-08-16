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
  logout,
  updateSessionActivity,
} from "../../../store/authStore";

import {
  isSessionExpired,
} from "../../../utils/security";

// ============================================================
// TYPES
// ============================================================

type SessionGuardProps = {
  children: React.ReactNode;
};

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

    // --------------------------------------------------------
    // USER ACTIVITY
    // --------------------------------------------------------

    function handleActivity(): void {

      updateSessionActivity();

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
    // SESSION EXPIRATION CHECK
    //
    // Existing behavior:
    // - Check every 60 seconds.
    // - Session timeout is 30 minutes.
    // - Expired session is logged out.
    // - Renderer is reloaded after logout.
    // --------------------------------------------------------

    const interval = setInterval(
      () => {

        const session =
          getSession();

        if (
          session &&
          isSessionExpired(
            session.lastActivity,
            30,
          )
        ) {

          logout();

          window.location.reload();

        }

      },
      60000,
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

      clearInterval(
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