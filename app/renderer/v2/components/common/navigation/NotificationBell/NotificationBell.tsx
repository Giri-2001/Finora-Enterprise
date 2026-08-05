/* ===========================================================
   FINORA ENTERPRISE OS™
   NOTIFICATION BELL™

   COMPONENT
=========================================================== */

import type {
  NotificationBellProps,
} from "./types";

import {
  BELL_ICON,
} from "./constants";

import {
  buildUnreadCount,
} from "./helpers";

import {
  containerStyle,
  bellStyle,
  badgeStyle,
} from "./styles";

export default function NotificationBell({

  unreadCount,

  onClick,

}: NotificationBellProps) {

  const count =
    buildUnreadCount(
      unreadCount,
    );

  return (

    <div
      style={containerStyle}
      onClick={onClick}
    >

      <span style={bellStyle}>

        {BELL_ICON}

      </span>

      {

        count > 0 && (

          <span style={badgeStyle}>

            {count}

          </span>

        )

      }

    </div>

  );

}
