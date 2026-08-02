/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   SMS & WHATSAPP STUDIO
   DELIVERY STATISTICS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface DeliveryStatisticsProps {

  totalSent?: number;

  delivered?: number;

  failed?: number;

  queued?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function DeliveryStatistics({

  totalSent = 0,

  delivered = 0,

  failed = 0,

  queued = 0,

}: DeliveryStatisticsProps) {

  return (

    <SummaryCard title="Delivery Statistics">

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

        Queued :
        <strong> {queued}</strong>

      </span>

    </SummaryCard>

  );

}
