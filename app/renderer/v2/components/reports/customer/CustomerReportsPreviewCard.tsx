/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   CUSTOMER REPORTS STUDIO
   CUSTOMER REPORTS PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface CustomerReportsPreviewCardProps {

  reportTitle?: string;

  generatedAt?: string;

  reportingPeriod?: string;

  customerCount?: number;

  reportStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerReportsPreviewCard({

  reportTitle = "--",

  generatedAt = "--",

  reportingPeriod = "--",

  customerCount = 0,

  reportStatus = "--",

}: CustomerReportsPreviewCardProps) {

  return (

    <SummaryCard title="Customer Report Preview">

      <span>

        Report :
        <strong> {reportTitle}</strong>

      </span>

      <span>

        Generated :
        <strong> {generatedAt}</strong>

      </span>

      <span>

        Period :
        <strong> {reportingPeriod}</strong>

      </span>

      <span>

        Customers :
        <strong> {customerCount}</strong>

      </span>

      <span>

        Status :
        <strong> {reportStatus}</strong>

      </span>

    </SummaryCard>

  );

}
