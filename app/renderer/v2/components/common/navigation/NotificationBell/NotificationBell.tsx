/* ===========================================================
   FINORA ENTERPRISE OS™
   NOTIFICATION BELL™

   COMPONENT
=========================================================== */

import { Bell } from "lucide-react";

import type {
  NotificationBellProps,
} from "./types";

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
      title="Notifications"
    >

      <Bell
        size={20}
        style={bellStyle}
      />

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
