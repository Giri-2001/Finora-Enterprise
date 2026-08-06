/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   CASH BOOK STUDIO
   CASH BOOK SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  formatCurrency,
} from "../../../utils/currency/formatCurrency";

/* ===========================================================
   TYPES
=========================================================== */

interface CashBookSummaryProps {

  openingBalance?: number;

  cashIn?: number;

  cashOut?: number;

  closingBalance?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CashBookSummary({

  openingBalance = 0,

  cashIn = 0,

  cashOut = 0,

  closingBalance = 0,

}: CashBookSummaryProps) {

  return (

    <SummaryCard title="Cash Book Summary">

      <span>

        Opening Balance :
        <strong> ₹ {formatCurrency(openingBalance)}</strong>

      </span>

      <span>

        Cash In :
        <strong> ₹ {formatCurrency(cashIn)}</strong>

      </span>

      <span>

        Cash Out :
        <strong> ₹ {formatCurrency(cashOut)}</strong>

      </span>

      <span>

        Closing Balance :
        <strong> ₹ {formatCurrency(closingBalance)}</strong>

      </span>

    </SummaryCard>

  );

}
