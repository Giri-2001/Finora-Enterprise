/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   FINANCIAL REPORTS STUDIO
   FINANCIAL PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface FinancialPreviewCardProps {

  reportTitle?: string;

  reportingPeriod?: string;

  generatedAt?: string;

  netProfit?: number;

  reportStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function FinancialPreviewCard({

  reportTitle = "--",

  reportingPeriod = "--",

  generatedAt = "--",

  netProfit = 0,

  reportStatus = "--",

}: FinancialPreviewCardProps) {

  return (

    <SummaryCard title="Financial Report Preview">

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

        Net Profit :
        <strong> ₹ {netProfit}</strong>

      </span>

      <span>

        Status :
        <strong> {reportStatus}</strong>

      </span>

    </SummaryCard>

  );

}
