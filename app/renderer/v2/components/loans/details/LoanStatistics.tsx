/* ===========================================================
   FINORA ENTERPRISE V2
   LOAN DETAILS STUDIO
   LOAN STATISTICS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface LoanStatisticsProps {

  totalLoans?: number;

  activeLoans?: number;

  totalDisbursed?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoanStatistics({

  totalLoans = 0,

  activeLoans = 0,

  totalDisbursed = 0,

}: LoanStatisticsProps) {

  return (

    <SummaryCard title="Loan Statistics">

      <span>Total Loans : {totalLoans}</span>

      <span>Active Loans : {activeLoans}</span>

      <span>Total Disbursed : ₹ {totalDisbursed}</span>

    </SummaryCard>

  );

}
