/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   INCOME MANAGEMENT STUDIO
   INCOME SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface IncomeSummaryProps {

  totalIncome?: number;

  verifiedIncome?: number;

  pendingVerification?: number;

  monthlyTarget?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function IncomeSummary({

  totalIncome = 0,

  verifiedIncome = 0,

  pendingVerification = 0,

  monthlyTarget = 0,

}: IncomeSummaryProps) {

  return (

    <SummaryCard title="Income Summary">

      <span>

        Total Income :
        <strong> ₹ {totalIncome}</strong>

      </span>

      <span>

        Verified Income :
        <strong> ₹ {verifiedIncome}</strong>

      </span>

      <span>

        Pending Verification :
        <strong> ₹ {pendingVerification}</strong>

      </span>

      <span>

        Monthly Target :
        <strong> ₹ {monthlyTarget}</strong>

      </span>

    </SummaryCard>

  );

}
