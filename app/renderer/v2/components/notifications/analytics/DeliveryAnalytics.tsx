/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   NOTIFICATION ANALYTICS STUDIO
   DELIVERY ANALYTICS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface DeliveryAnalyticsProps {

  totalSent?: number;

  successfulDeliveries?: number;

  failedDeliveries?: number;

  deliveryRate?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function DeliveryAnalytics({

  totalSent = 0,

  successfulDeliveries = 0,

  failedDeliveries = 0,

  deliveryRate = 0,

}: DeliveryAnalyticsProps) {

  return (

    <SummaryCard title="Delivery Analytics">

      <span>

        Total Sent :
        <strong> {totalSent}</strong>

      </span>

      <span>

        Successful :
        <strong> {successfulDeliveries}</strong>

      </span>

      <span>

        Failed :
        <strong> {failedDeliveries}</strong>

      </span>

      <span>

        Delivery Rate :
        <strong> {deliveryRate}%</strong>

      </span>

    </SummaryCard>

  );

}
