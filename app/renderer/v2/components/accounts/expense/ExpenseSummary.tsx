/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   EXPENSE MANAGEMENT STUDIO
   EXPENSE SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  formatCurrency,
} from "../../../utils/currency/formatCurrency";
/* ===========================================================
   TYPES
=========================================================== */

interface ExpenseSummaryProps {

  totalExpenses?: number;

  approvedExpenses?: number;

  pendingExpenses?: number;

  monthlyBudget?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ExpenseSummary({

  totalExpenses = 0,

  approvedExpenses = 0,

  pendingExpenses = 0,

  monthlyBudget = 0,

}: ExpenseSummaryProps) {

  return (

    <SummaryCard title="Expense Summary">

      <span>

        Total Expenses :
        <strong> ₹ {formatCurrency(totalExpenses)}</strong>

      </span>

      <span>

        Approved :
        <strong> ₹ {formatCurrency(approvedExpenses)}</strong>

      </span>

      <span>

        Pending :
        <strong> ₹ {formatCurrency(pendingExpenses)}</strong>

      </span>

      <span>

        Monthly Budget :
        <strong> ₹ {formatCurrency(monthlyBudget)}</strong>

      </span>

    </SummaryCard>

  );

}
