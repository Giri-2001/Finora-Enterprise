/* ===========================================================
   FINORA ENTERPRISE OS™

   NOTIFICATION BELL™

   COMPONENT

   RESPONSIBILITY:
   - Render global notification bell
   - Receive unread count from application state
   - Preserve notification click behavior
   - Consume Responsive Engine
   - Consume Theme Engine

   IMPORTANT:
   - No dummy unread count.
   - No hardcoded icon size.
   - No local theme values.
   - No local responsive geometry.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  Bell,
} from "lucide-react";


import type {
  NotificationBellProps,
} from "./types";


import {
  buildUnreadCount,
} from "./helpers";


import {
  useResponsive,
} from "../../../../utils/responsive";


import {
  useTheme,
} from "../../../../themes/provider";


import {
  createNotificationBellStyles,
} from "./styles";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function NotificationBell({

  unreadCount,

  onClick,

}: NotificationBellProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } =
    useResponsive();


  /* =========================================================
     THEME ENGINE
  ========================================================= */

  const {
    theme,
  } =
    useTheme();


  /* =========================================================
     NORMALIZED COUNT
  ========================================================= */

  const count =
    buildUnreadCount(
      unreadCount,
    );


  /* =========================================================
     RESOLVED STYLES
  ========================================================= */

  const {

    containerStyle,

    bellStyle,

    badgeStyle,

  } =
    createNotificationBellStyles(

      tokens,

      theme,

    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div

      style={
        containerStyle
      }

      onClick={
        onClick
      }

      title="Notifications"

      role="button"

      tabIndex={0}

      aria-label="Notifications"

    >

      <Bell

        style={
          bellStyle
        }

        aria-hidden="true"

      />


      {
        count > 0 && (

          <span

            style={
              badgeStyle
            }

            aria-label={
              `${count} unread notifications`
            }

          >

            {count}

          </span>

        )
      }

    </div>

  );

}


/* ===========================================================
   END
=========================================================== */