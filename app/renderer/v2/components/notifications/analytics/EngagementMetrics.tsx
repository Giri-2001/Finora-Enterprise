/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   NOTIFICATION ANALYTICS STUDIO
   ENGAGEMENT METRICS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface EngagementMetricsProps {

  openedNotifications?: number;

  clickedNotifications?: number;

  actionCompleted?: number;

  engagementRate?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function EngagementMetrics({

  openedNotifications = 0,

  clickedNotifications = 0,

  actionCompleted = 0,

  engagementRate = 0,

}: EngagementMetricsProps) {

  return (

    <SummaryCard title="Engagement Metrics">

      <span>

        Opened :
        <strong> {openedNotifications}</strong>

      </span>

      <span>

        Clicked :
        <strong> {clickedNotifications}</strong>

      </span>

      <span>

        Actions Completed :
        <strong> {actionCompleted}</strong>

      </span>

      <span>

        Engagement Rate :
        <strong> {engagementRate}%</strong>

      </span>

    </SummaryCard>

  );

}
