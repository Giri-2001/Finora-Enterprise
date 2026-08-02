/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   EXPENSE MANAGEMENT STUDIO
   EXPENSE CATEGORIES
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ExpenseCategoriesProps {

  operationalExpenses?: number;

  salaryExpenses?: number;

  maintenanceExpenses?: number;

  miscellaneousExpenses?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ExpenseCategories({

  operationalExpenses = 0,

  salaryExpenses = 0,

  maintenanceExpenses = 0,

  miscellaneousExpenses = 0,

}: ExpenseCategoriesProps) {

  return (

    <SummaryCard title="Expense Categories">

      <span>

        Operational :
        <strong> ₹ {operationalExpenses}</strong>

      </span>

      <span>

        Salaries :
        <strong> ₹ {salaryExpenses}</strong>

      </span>

      <span>

        Maintenance :
        <strong> ₹ {maintenanceExpenses}</strong>

      </span>

      <span>

        Miscellaneous :
        <strong> ₹ {miscellaneousExpenses}</strong>

      </span>

    </SummaryCard>

  );

}
