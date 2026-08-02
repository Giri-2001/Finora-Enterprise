/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   TRANSACTION ANALYTICS STUDIO
   ANALYTICS PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface AnalyticsPreviewCardProps {

  reportName?: string;

  reportingPeriod?: string;

  totalTransactions?: number;

  totalVolume?: number;

  generatedAt?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function AnalyticsPreviewCard({

  reportName = "--",

  reportingPeriod = "--",

  totalTransactions = 0,

  totalVolume = 0,

  generatedAt = "--",

}: AnalyticsPreviewCardProps) {

  return (

    <SummaryCard title="Analytics Preview">

      <span>

        Report :
        <strong> {reportName}</strong>

      </span>

      <span>

        Period :
        <strong> {reportingPeriod}</strong>

      </span>

      <span>

        Transactions :
        <strong> {totalTransactions}</strong>

      </span>

      <span>

        Volume :
        <strong> ₹ {totalVolume}</strong>

      </span>

      <span>

        Generated :
        <strong> {generatedAt}</strong>

      </span>

    </SummaryCard>

  );

}
