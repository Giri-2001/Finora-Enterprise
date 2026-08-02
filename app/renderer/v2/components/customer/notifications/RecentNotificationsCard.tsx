/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   CUSTOMER NOTIFICATIONS STUDIO
   RECENT NOTIFICATIONS CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface RecentNotificationsCardProps {

  unreadNotifications?: number;

  latestNotification?: string;

  notificationDate?: string;

  notificationType?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function RecentNotificationsCard({

  unreadNotifications = 0,

  latestNotification = "--",

  notificationDate = "--",

  notificationType = "--",

}: RecentNotificationsCardProps) {

  return (

    <SummaryCard title="Recent Notifications">

      <span>

        Unread :
        <strong> {unreadNotifications}</strong>

      </span>

      <span>

        Latest :
        <strong> {latestNotification}</strong>

      </span>

      <span>

        Date :
        <strong> {notificationDate}</strong>

      </span>

      <span>

        Type :
        <strong> {notificationType}</strong>

      </span>

    </SummaryCard>

  );

}
