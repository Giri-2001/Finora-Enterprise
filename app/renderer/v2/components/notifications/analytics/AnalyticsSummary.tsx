/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   NOTIFICATION ANALYTICS STUDIO
   ANALYTICS SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface AnalyticsSummaryProps {

  totalNotifications?: number;

  successfulDeliveries?: number;

  engagementRate?: number;

  generatedAt?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function AnalyticsSummary({

  totalNotifications = 0,

  successfulDeliveries = 0,

  engagementRate = 0,

  generatedAt = "--",

}: AnalyticsSummaryProps) {

  return (

    <SummaryCard title="Analytics Summary">

      <span>

        Total Notifications :
        <strong> {totalNotifications}</strong>

      </span>

      <span>

        Successful Deliveries :
        <strong> {successfulDeliveries}</strong>

      </span>

      <span>

        Engagement Rate :
        <strong> {engagementRate}%</strong>

      </span>

      <span>

        Generated At :
        <strong> {generatedAt}</strong>

      </span>

    </SummaryCard>

  );

}
