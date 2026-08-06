/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   INCOME MANAGEMENT STUDIO
   INCOME SOURCES
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  formatCurrency,
} from "../../../utils/currency/formatCurrency";
/* ===========================================================
   TYPES
=========================================================== */

interface IncomeSourcesProps {

  loanCollections?: number;

  processingFees?: number;

  penaltyCharges?: number;

  otherIncome?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function IncomeSources({

  loanCollections = 0,

  processingFees = 0,

  penaltyCharges = 0,

  otherIncome = 0,

}: IncomeSourcesProps) {

  return (

    <SummaryCard title="Income Sources">

      <span>

        Loan Collections :
        <strong> ₹ {formatCurrency(loanCollections)}</strong>

      </span>

      <span>

        Processing Fees :
        <strong> ₹ {formatCurrency(processingFees)}</strong>

      </span>

      <span>

        Penalty Charges :
        <strong> ₹ {formatCurrency(penaltyCharges)}</strong>

      </span>

      <span>

        Other Income :
        <strong> ₹ {formatCurrency(otherIncome)}</strong>

      </span>

    </SummaryCard>

  );

}
