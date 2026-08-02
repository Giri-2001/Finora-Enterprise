/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   FINANCIAL REPORTS STUDIO
   REVENUE SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface RevenueSummaryProps {

  totalRevenue?: number;

  interestIncome?: number;

  processingFees?: number;

  otherIncome?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function RevenueSummary({

  totalRevenue = 0,

  interestIncome = 0,

  processingFees = 0,

  otherIncome = 0,

}: RevenueSummaryProps) {

  return (

    <SummaryCard title="Revenue Summary">

      <span>

        Total Revenue :
        <strong> ₹ {totalRevenue}</strong>

      </span>

      <span>

        Interest Income :
        <strong> ₹ {interestIncome}</strong>

      </span>

      <span>

        Processing Fees :
        <strong> ₹ {processingFees}</strong>

      </span>

      <span>

        Other Income :
        <strong> ₹ {otherIncome}</strong>

      </span>

    </SummaryCard>

  );

}
