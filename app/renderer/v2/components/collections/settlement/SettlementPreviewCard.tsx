/* ===========================================================
   FINORA ENTERPRISE V2
   SETTLEMENT STUDIO
   SETTLEMENT PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface SettlementPreviewCardProps {

  customerName?: string;

  totalLoanAmount?: number;

  totalCollected?: number;

  remainingBalance?: number;

  settlementStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SettlementPreviewCard({

  customerName = "--",

  totalLoanAmount = 0,

  totalCollected = 0,

  remainingBalance = 0,

  settlementStatus = "--",

}: SettlementPreviewCardProps) {

  return (

    <SummaryCard title="Settlement Preview">

      <span>

        Customer :
        <strong> {customerName}</strong>

      </span>

      <span>

        Total Loan :
        <strong> ₹ {totalLoanAmount}</strong>

      </span>

      <span>

        Total Collected :
        <strong> ₹ {totalCollected}</strong>

      </span>

      <span>

        Remaining Balance :
        <strong> ₹ {remainingBalance}</strong>

      </span>

      <span>

        Status :
        <strong> {settlementStatus}</strong>

      </span>

    </SummaryCard>

  );

}
