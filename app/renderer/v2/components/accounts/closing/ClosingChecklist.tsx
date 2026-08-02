/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   FINANCIAL CLOSING STUDIO
   CLOSING CHECKLIST
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ClosingChecklistProps {

  cashVerified?: boolean;

  bankReconciled?: boolean;

  expensesReviewed?: boolean;

  incomeVerified?: boolean;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ClosingChecklist({

  cashVerified = false,

  bankReconciled = false,

  expensesReviewed = false,

  incomeVerified = false,

}: ClosingChecklistProps) {

  return (

    <SummaryCard title="Closing Checklist">

      <span>
        Cash Verified :
        <strong> {cashVerified ? "Yes" : "No"}</strong>
      </span>

      <span>
        Bank Reconciled :
        <strong> {bankReconciled ? "Yes" : "No"}</strong>
      </span>

      <span>
        Expenses Reviewed :
        <strong> {expensesReviewed ? "Yes" : "No"}</strong>
      </span>

      <span>
        Income Verified :
        <strong> {incomeVerified ? "Yes" : "No"}</strong>
      </span>

    </SummaryCard>

  );

}
