/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   INCOME MANAGEMENT STUDIO
   INCOME PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  formatCurrency,
} from "../../../utils/currency/formatCurrency";
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
        <strong> ₹ {formatCurrency(totalIncome)}</strong>

      </span>

      <span>

        Verified Income :
        <strong> ₹ {formatCurrency(verifiedIncome)}</strong>

      </span>

      <span>

        Pending Verification :
        <strong> ₹ {formatCurrency(pendingVerification)}</strong>

      </span>

      <span>

        Status :
        <strong> {status}</strong>

      </span>

    </SummaryCard>

  );

}
