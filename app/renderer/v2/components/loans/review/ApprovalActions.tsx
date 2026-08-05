/* ===========================================================
   FINORA ENTERPRISE V2
   REVIEW STUDIO
   APPROVAL ACTIONS
=========================================================== */

import Button from "../../common/buttons/Button";

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ApprovalActionsProps {

  onSaveDraft: () => void;

  onApproveLoan: () => void;

  onRejectLoan: () => void;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ApprovalActions({

  onSaveDraft,

  onApproveLoan,

  onRejectLoan,

}: ApprovalActionsProps) {

  return (

    <SummaryCard title="Approval Actions">

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >

        <Button
  onClick={onSaveDraft}
>

  Save Draft

</Button>

        <Button
  onClick={onApproveLoan}
>

  Approve Loan

</Button>

        <Button
  onClick={onRejectLoan}
>

  Reject Loan

</Button>

      </div>

    </SummaryCard>

  );

}
