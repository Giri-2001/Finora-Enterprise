/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   CUSTOMER NOTIFICATIONS STUDIO
   NOTIFICATIONS SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface NotificationsSummaryProps {

  totalNotifications?: number;

  unreadNotifications?: number;

  readNotifications?: number;

  highPriorityNotifications?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function NotificationsSummary({

  totalNotifications = 0,

  unreadNotifications = 0,

  readNotifications = 0,

  highPriorityNotifications = 0,

}: NotificationsSummaryProps) {

  return (

    <SummaryCard title="Notifications Summary">

      <span>

        Total Notifications :
        <strong> {totalNotifications}</strong>

      </span>

      <span>

        Unread :
        <strong> {unreadNotifications}</strong>

      </span>

      <span>

        Read :
        <strong> {readNotifications}</strong>

      </span>

      <span>

        High Priority :
        <strong> {highPriorityNotifications}</strong>

      </span>

    </SummaryCard>

  );

}
