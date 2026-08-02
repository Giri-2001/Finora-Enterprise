/* ===========================================================
   FINORA ENTERPRISE V2
   SETTLEMENT STUDIO
   SETTLEMENT SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface SettlementSummaryProps {

  totalLoanAmount?: number;

  totalCollected?: number;

  remainingBalance?: number;

  settlementStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SettlementSummary({

  totalLoanAmount = 0,

  totalCollected = 0,

  remainingBalance = 0,

  settlementStatus = "--",

}: SettlementSummaryProps) {

  return (

    <SummaryCard title="Settlement Summary">

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

        Settlement Status :
        <strong> {settlementStatus}</strong>

      </span>

    </SummaryCard>

  );

}
