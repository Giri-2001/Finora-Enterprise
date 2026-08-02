/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   EXPENSE MANAGEMENT STUDIO
   EXPENSE SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

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
        <strong> ₹ {totalExpenses}</strong>

      </span>

      <span>

        Approved :
        <strong> ₹ {approvedExpenses}</strong>

      </span>

      <span>

        Pending :
        <strong> ₹ {pendingExpenses}</strong>

      </span>

      <span>

        Monthly Budget :
        <strong> ₹ {monthlyBudget}</strong>

      </span>

    </SummaryCard>

  );

}
