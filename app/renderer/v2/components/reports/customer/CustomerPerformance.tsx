/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   CUSTOMER REPORTS STUDIO
   CUSTOMER PERFORMANCE
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface CustomerPerformanceProps {

  topCustomer?: string;

  highestLoanAmount?: number;

  totalCollections?: number;

  repaymentRate?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerPerformance({

  topCustomer = "--",

  highestLoanAmount = 0,

  totalCollections = 0,

  repaymentRate = 0,

}: CustomerPerformanceProps) {

  return (

    <SummaryCard title="Customer Performance">

      <span>

        Top Customer :
        <strong> {topCustomer}</strong>

      </span>

      <span>

        Highest Loan :
        <strong> ₹ {highestLoanAmount}</strong>

      </span>

      <span>

        Total Collections :
        <strong> ₹ {totalCollections}</strong>

      </span>

      <span>

        Repayment Rate :
        <strong> {repaymentRate}%</strong>

      </span>

    </SummaryCard>

  );

}
