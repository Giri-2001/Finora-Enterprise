/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   DASHBOARD PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface DashboardPreviewCardProps {

  reportName?: string;

  generatedOn?: string;

  reportPeriod?: string;

  totalRecords?: number;

  reportStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function DashboardPreviewCard({

  reportName = "--",

  generatedOn = "--",

  reportPeriod = "--",

  totalRecords = 0,

  reportStatus = "--",

}: DashboardPreviewCardProps) {

  return (

    <SummaryCard title="Dashboard Report Preview">

      <span>

        Report :
        <strong> {reportName}</strong>

      </span>

      <span>

        Generated :
        <strong> {generatedOn}</strong>

      </span>

      <span>

        Period :
        <strong> {reportPeriod}</strong>

      </span>

      <span>

        Records :
        <strong> {totalRecords}</strong>

      </span>

      <span>

        Status :
        <strong> {reportStatus}</strong>

      </span>

    </SummaryCard>

  );

}
