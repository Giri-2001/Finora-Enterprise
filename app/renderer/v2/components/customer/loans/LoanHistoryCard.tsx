/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   MY LOANS STUDIO
   LOAN HISTORY CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface LoanHistoryCardProps {

  completedLoans?: number;

  activeLoans?: number;

  totalBorrowed?: number;

  totalRepaid?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoanHistoryCard({

  completedLoans = 0,

  activeLoans = 0,

  totalBorrowed = 0,

  totalRepaid = 0,

}: LoanHistoryCardProps) {

  return (

    <SummaryCard title="Loan History">

      <span>

        Completed Loans :
        <strong> {completedLoans}</strong>

      </span>

      <span>

        Active Loans :
        <strong> {activeLoans}</strong>

      </span>

      <span>

        Total Borrowed :
        <strong> ₹ {totalBorrowed}</strong>

      </span>

      <span>

        Total Repaid :
        <strong> ₹ {totalRepaid}</strong>

      </span>

    </SummaryCard>

  );

}
