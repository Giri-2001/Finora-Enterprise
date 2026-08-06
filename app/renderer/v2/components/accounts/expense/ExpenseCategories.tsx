/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   EXPENSE MANAGEMENT STUDIO
   EXPENSE CATEGORIES
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  formatCurrency,
} from "../../../utils/currency/formatCurrency";

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
        <strong> ₹ {formatCurrency(operationalExpenses)}</strong>

      </span>

      <span>

        Salaries :
        <strong> ₹ {formatCurrency(salaryExpenses)}</strong>

      </span>

      <span>

        Maintenance :
        <strong> ₹ {formatCurrency(maintenanceExpenses)}</strong>

      </span>

      <span>

        Miscellaneous :
        <strong> ₹ {formatCurrency(miscellaneousExpenses)}</strong>

      </span>

    </SummaryCard>

  );

}
