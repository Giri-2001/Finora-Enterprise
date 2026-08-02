/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   EXPORT & ANALYTICS STUDIO
   ANALYTICS SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface AnalyticsSummaryProps {

  reportsGenerated?: number;

  exportsCompleted?: number;

  scheduledReports?: number;

  lastExport?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function AnalyticsSummary({

  reportsGenerated = 0,

  exportsCompleted = 0,

  scheduledReports = 0,

  lastExport = "--",

}: AnalyticsSummaryProps) {

  return (

    <SummaryCard title="Analytics Summary">

      <span>

        Reports Generated :
        <strong> {reportsGenerated}</strong>

      </span>

      <span>

        Exports Completed :
        <strong> {exportsCompleted}</strong>

      </span>

      <span>

        Scheduled Reports :
        <strong> {scheduledReports}</strong>

      </span>

      <span>

        Last Export :
        <strong> {lastExport}</strong>

      </span>

    </SummaryCard>

  );

}
