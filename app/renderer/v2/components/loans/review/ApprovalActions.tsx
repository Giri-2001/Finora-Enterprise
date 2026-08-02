/* ===========================================================
   FINORA ENTERPRISE V2
   REVIEW STUDIO
   APPROVAL ACTIONS
=========================================================== */

import Button from "../../common/buttons/Button";

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ApprovalActions() {

  return (

    <SummaryCard title="Approval Actions">

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >

        <Button>

          Save Draft

        </Button>

        <Button>

          Approve Loan

        </Button>

        <Button>

          Reject Loan

        </Button>

      </div>

    </SummaryCard>

  );

}
