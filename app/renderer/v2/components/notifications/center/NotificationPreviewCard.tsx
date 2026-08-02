/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   NOTIFICATION CENTER STUDIO
   NOTIFICATION PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface NotificationPreviewCardProps {

  title?: string;

  recipient?: string;

  scheduledTime?: string;

  priority?: string;

  status?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function NotificationPreviewCard({

  title = "--",

  recipient = "--",

  scheduledTime = "--",

  priority = "Normal",

  status = "--",

}: NotificationPreviewCardProps) {

  return (

    <SummaryCard title="Notification Preview">

      <span>
        Title :
        <strong> {title}</strong>
      </span>

      <span>
        Recipient :
        <strong> {recipient}</strong>
      </span>

      <span>
        Scheduled :
        <strong> {scheduledTime}</strong>
      </span>

      <span>
        Priority :
        <strong> {priority}</strong>
      </span>

      <span>
        Status :
        <strong> {status}</strong>
      </span>

    </SummaryCard>

  );

}
