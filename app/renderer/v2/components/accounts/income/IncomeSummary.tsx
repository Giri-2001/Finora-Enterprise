/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   INCOME MANAGEMENT STUDIO
   INCOME SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  formatCurrency,
} from "../../../utils/currency/formatCurrency";
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

        Monthly Target :
        <strong> ₹ {formatCurrency(monthlyTarget)}</strong>

      </span>

    </SummaryCard>

  );

}
