/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   MY LOANS STUDIO
   MY LOANS SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface MyLoansSummaryProps {

  totalLoans?: number;

  activeLoans?: number;

  closedLoans?: number;

  totalOutstanding?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function MyLoansSummary({

  totalLoans = 0,

  activeLoans = 0,

  closedLoans = 0,

  totalOutstanding = 0,

}: MyLoansSummaryProps) {

  return (

    <SummaryCard title="My Loans Summary">

      <span>

        Total Loans :
        <strong> {totalLoans}</strong>

      </span>

      <span>

        Active Loans :
        <strong> {activeLoans}</strong>

      </span>

      <span>

        Closed Loans :
        <strong> {closedLoans}</strong>

      </span>

      <span>

        Outstanding Balance :
        <strong> ₹ {totalOutstanding}</strong>

      </span>

    </SummaryCard>

  );

}
