/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   NOTIFICATION ANALYTICS STUDIO
   ANALYTICS PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface AnalyticsPreviewCardProps {

  reportTitle?: string;

  reportingPeriod?: string;

  totalNotifications?: number;

  overallSuccessRate?: number;

  status?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function AnalyticsPreviewCard({

  reportTitle = "--",

  reportingPeriod = "--",

  totalNotifications = 0,

  overallSuccessRate = 0,

  status = "Draft",

}: AnalyticsPreviewCardProps) {

  return (

    <SummaryCard title="Analytics Preview">

      <span>
        Report :
        <strong> {reportTitle}</strong>
      </span>

      <span>
        Period :
        <strong> {reportingPeriod}</strong>
      </span>

      <span>
        Notifications :
        <strong> {totalNotifications}</strong>
      </span>

      <span>
        Success Rate :
        <strong> {overallSuccessRate}%</strong>
      </span>

      <span>
        Status :
        <strong> {status}</strong>
      </span>

    </SummaryCard>

  );

}
