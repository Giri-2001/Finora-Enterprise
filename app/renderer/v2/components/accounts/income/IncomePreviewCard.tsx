/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   INCOME MANAGEMENT STUDIO
   INCOME PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface IncomePreviewCardProps {

  reportDate?: string;

  totalIncome?: number;

  verifiedIncome?: number;

  pendingVerification?: number;

  status?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function IncomePreviewCard({

  reportDate = "--",

  totalIncome = 0,

  verifiedIncome = 0,

  pendingVerification = 0,

  status = "--",

}: IncomePreviewCardProps) {

  return (

    <SummaryCard title="Income Preview">

      <span>

        Report Date :
        <strong> {reportDate}</strong>

      </span>

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

        Status :
        <strong> {status}</strong>

      </span>

    </SummaryCard>

  );

}
