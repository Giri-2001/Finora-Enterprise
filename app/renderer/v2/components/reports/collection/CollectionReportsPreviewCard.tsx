/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   COLLECTION REPORTS STUDIO
   COLLECTION REPORTS PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface CollectionReportsPreviewCardProps {

  reportTitle?: string;

  reportingPeriod?: string;

  generatedAt?: string;

  totalRecovered?: number;

  reportStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CollectionReportsPreviewCard({

  reportTitle = "--",

  reportingPeriod = "--",

  generatedAt = "--",

  totalRecovered = 0,

  reportStatus = "--",

}: CollectionReportsPreviewCardProps) {

  return (

    <SummaryCard title="Collection Report Preview">

      <span>

        Report :
        <strong> {reportTitle}</strong>

      </span>

      <span>

        Period :
        <strong> {reportingPeriod}</strong>

      </span>

      <span>

        Generated :
        <strong> {generatedAt}</strong>

      </span>

      <span>

        Total Recovered :
        <strong> ₹ {totalRecovered}</strong>

      </span>

      <span>

        Status :
        <strong> {reportStatus}</strong>

      </span>

    </SummaryCard>

  );

}
