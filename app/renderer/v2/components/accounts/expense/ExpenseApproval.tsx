/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   EXPENSE MANAGEMENT STUDIO
   EXPENSE APPROVAL
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ExpenseApprovalProps {

  pendingApprovals?: number;

  approvedToday?: number;

  rejectedToday?: number;

  approvalStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ExpenseApproval({

  pendingApprovals = 0,

  approvedToday = 0,

  rejectedToday = 0,

  approvalStatus = "Normal",

}: ExpenseApprovalProps) {

  return (

    <SummaryCard title="Expense Approval">

      <span>
        Pending :
        <strong> {pendingApprovals}</strong>
      </span>

      <span>
        Approved Today :
        <strong> {approvedToday}</strong>
      </span>

      <span>
        Rejected Today :
        <strong> {rejectedToday}</strong>
      </span>

      <span>
        Status :
        <strong> {approvalStatus}</strong>
      </span>

    </SummaryCard>

  );

}
