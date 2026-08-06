/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   CASH BOOK STUDIO
   CASH BALANCE CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  formatCurrency,
} from "../../../utils/currency/formatCurrency";

/* ===========================================================
   TYPES
=========================================================== */

interface CashBalanceCardProps {

  currentBalance?: number;

  minimumBalance?: number;

  maximumBalance?: number;

  balanceStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CashBalanceCard({

  currentBalance = 0,

  minimumBalance = 0,

  maximumBalance = 0,

  balanceStatus = "Healthy",

}: CashBalanceCardProps) {

  return (

    <SummaryCard title="Cash Balance">

      <span>

        Current Balance :
        <strong> ₹ {formatCurrency(currentBalance)}</strong>

      </span>

      <span>

        Minimum Balance :
        <strong> ₹ {formatCurrency(minimumBalance)}</strong>

      </span>

      <span>

        Maximum Balance :
        <strong> ₹ {formatCurrency(maximumBalance)}</strong>

      </span>

      <span>

        Status :
        <strong> {balanceStatus}</strong>

      </span>

    </SummaryCard>

  );

}
