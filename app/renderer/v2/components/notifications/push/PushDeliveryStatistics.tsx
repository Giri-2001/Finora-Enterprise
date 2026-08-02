/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   PUSH NOTIFICATION STUDIO
   PUSH DELIVERY STATISTICS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface PushDeliveryStatisticsProps {

  totalSent?: number;

  delivered?: number;

  failed?: number;

  pending?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PushDeliveryStatistics({

  totalSent = 0,

  delivered = 0,

  failed = 0,

  pending = 0,

}: PushDeliveryStatisticsProps) {

  return (

    <SummaryCard title="Push Delivery Statistics">

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
