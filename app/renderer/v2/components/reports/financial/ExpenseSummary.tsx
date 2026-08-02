/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   FINANCIAL REPORTS STUDIO
   EXPENSE SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ExpenseSummaryProps {

  operationalExpenses?: number;

  employeeExpenses?: number;

  miscellaneousExpenses?: number;

  totalExpenses?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ExpenseSummary({

  operationalExpenses = 0,

  employeeExpenses = 0,

  miscellaneousExpenses = 0,

  totalExpenses = 0,

}: ExpenseSummaryProps) {

  return (

    <SummaryCard title="Expense Summary">

      <span>

        Operational Expenses :
        <strong> ₹ {operationalExpenses}</strong>

      </span>

      <span>

        Employee Expenses :
        <strong> ₹ {employeeExpenses}</strong>

      </span>

      <span>

        Miscellaneous :
        <strong> ₹ {miscellaneousExpenses}</strong>

      </span>

      <span>

        Total Expenses :
        <strong> ₹ {totalExpenses}</strong>

      </span>

    </SummaryCard>

  );

}
