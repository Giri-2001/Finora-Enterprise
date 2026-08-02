/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   CUSTOMER NOTIFICATIONS STUDIO
   NOTIFICATION TIMELINE CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface NotificationTimelineCardProps {

  latestNotificationTime?: string;

  latestNotificationType?: string;

  totalNotificationsToday?: number;

  timelineStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function NotificationTimelineCard({

  latestNotificationTime = "--",

  latestNotificationType = "--",

  totalNotificationsToday = 0,

  timelineStatus = "Up to Date",

}: NotificationTimelineCardProps) {

  return (

    <SummaryCard title="Notification Timeline">

      <span>

        Latest Time :
        <strong> {latestNotificationTime}</strong>

      </span>

      <span>

        Latest Type :
        <strong> {latestNotificationType}</strong>

      </span>

      <span>

        Today's Notifications :
        <strong> {totalNotificationsToday}</strong>

      </span>

      <span>

        Timeline Status :
        <strong> {timelineStatus}</strong>

      </span>

    </SummaryCard>

  );

}
