/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   NOTIFICATION CENTER STUDIO
   NOTIFICATION STATISTICS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface NotificationStatisticsProps {

  totalSent?: number;

  delivered?: number;

  failed?: number;

  pending?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function NotificationStatistics({

  totalSent = 0,

  delivered = 0,

  failed = 0,

  pending = 0,

}: NotificationStatisticsProps) {

  return (

    <SummaryCard title="Notification Statistics">

      <span>
        Total Sent :
        <strong> {totalSent}</strong>
      </span>

      <span>
        Delivered :
        <strong> {delivered}</strong>
      </span>

      <span>
        Failed :
        <strong> {failed}</strong>
      </span>

      <span>
        Pending :
        <strong> {pending}</strong>
      </span>

    </SummaryCard>

  );

}
