import { useEffect } from "react";

import {
  getSession,
  logout,
  updateSessionActivity,
} from "../../store/authStore";

import { isSessionExpired } from "../../utils/security";

type SessionGuardProps = {
  children: React.ReactNode;
};

export default function SessionGuard({ children }: SessionGuardProps) {
  useEffect(() => {
    const activityEvents = ["click", "keydown", "mousemove", "scroll"];

    function handleActivity() {
      updateSessionActivity();
    }

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    const interval = setInterval(
      () => {
        const session = getSession();

        if (session && isSessionExpired(session.lastActivity, 30)) {
          logout();

          window.location.reload();
        }
      },

      60000,
    );

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      clearInterval(interval);
    };
  }, []);

  return <>{children}</>;
}
