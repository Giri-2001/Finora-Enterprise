/* ===========================================================
   FINORA ENTERPRISE V2
   REVIEW STUDIO

   APPROVAL ACTIONS
=========================================================== */

import {
  useState,
} from "react";


import Button
  from "../../common/buttons/Button";


import SummaryCard
  from "../../common/cards/SummaryCard";



/* ===========================================================
   TYPES
=========================================================== */

interface ApprovalActionsProps {

  onSaveDraft: () => void;

  onApproveLoan: () => void | Promise<void>;

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


  const [
    isApproving,
    setIsApproving,
  ] = useState(false);



  /* ===========================================================
     APPROVE LOCK
  =========================================================== */

  const handleApproveLoan = async () => {


    if (isApproving) {

      return;

    }


    setIsApproving(true);



    try {


      await onApproveLoan();



    } finally {


      setIsApproving(false);


    }


  };



  return (

    <SummaryCard
      title="Approval Actions"
    >


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

          onClick={handleApproveLoan}

          disabled={isApproving}

        >

          {isApproving

            ? "Approving..."

            : "Approve Loan"

          }


        </Button>





        <Button

          onClick={onRejectLoan}

          disabled={isApproving}

        >

          Reject Loan


        </Button>



      </div>


    </SummaryCard>

  );

}
