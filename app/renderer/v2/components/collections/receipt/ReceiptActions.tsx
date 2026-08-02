/* ===========================================================
   FINORA ENTERPRISE V2
   RECEIPT STUDIO
   RECEIPT ACTIONS
=========================================================== */

import Button from "../../common/buttons/Button";
import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReceiptActions() {

  return (

    <SummaryCard title="Receipt Actions">

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >

        <Button>
          Preview Receipt
        </Button>

        <Button>
          Print Receipt
        </Button>

        <Button>
          Download PDF
        </Button>

      </div>

    </SummaryCard>

  );

}
