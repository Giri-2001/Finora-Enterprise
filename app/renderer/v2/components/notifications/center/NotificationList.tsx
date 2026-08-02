/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   NOTIFICATION CENTER STUDIO
   NOTIFICATION LIST
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface NotificationListProps {

  totalNotifications?: number;

  unreadNotifications?: number;

  highPriorityNotifications?: number;

  lastNotificationTime?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function NotificationList({

  totalNotifications = 0,

  unreadNotifications = 0,

  highPriorityNotifications = 0,

  lastNotificationTime = "--",

}: NotificationListProps) {

  return (

    <SummaryCard title="Notification List">

      <span>

        Total Notifications :
        <strong> {totalNotifications}</strong>

      </span>

      <span>

        Unread :
        <strong> {unreadNotifications}</strong>

      </span>

      <span>

        High Priority :
        <strong> {highPriorityNotifications}</strong>

      </span>

      <span>

        Last Notification :
        <strong> {lastNotificationTime}</strong>

      </span>

    </SummaryCard>

  );

}
