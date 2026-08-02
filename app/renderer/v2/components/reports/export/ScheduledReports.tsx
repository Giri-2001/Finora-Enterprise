/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   EXPORT & ANALYTICS STUDIO
   SCHEDULED REPORTS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ScheduledReportsProps {

  dailyReports?: number;

  weeklyReports?: number;

  monthlyReports?: number;

  nextScheduledRun?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ScheduledReports({

  dailyReports = 0,

  weeklyReports = 0,

  monthlyReports = 0,

  nextScheduledRun = "--",

}: ScheduledReportsProps) {

  return (

    <SummaryCard title="Scheduled Reports">

      <span>

        Daily Reports :
        <strong> {dailyReports}</strong>

      </span>

      <span>

        Weekly Reports :
        <strong> {weeklyReports}</strong>

      </span>

      <span>

        Monthly Reports :
        <strong> {monthlyReports}</strong>

      </span>

      <span>

        Next Scheduled Run :
        <strong> {nextScheduledRun}</strong>

      </span>

    </SummaryCard>

  );

}
