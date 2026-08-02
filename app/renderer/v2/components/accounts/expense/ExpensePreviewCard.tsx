/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   EXPENSE MANAGEMENT STUDIO
   EXPENSE PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ExpensePreviewCardProps {

  reportDate?: string;

  totalExpenses?: number;

  approvedExpenses?: number;

  pendingExpenses?: number;

  status?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ExpensePreviewCard({

  reportDate = "--",

  totalExpenses = 0,

  approvedExpenses = 0,

  pendingExpenses = 0,

  status = "--",

}: ExpensePreviewCardProps) {

  return (

    <SummaryCard title="Expense Preview">

      <span>

        Report Date :
        <strong> {reportDate}</strong>

      </span>

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

        Status :
        <strong> {status}</strong>

      </span>

    </SummaryCard>

  );

}
