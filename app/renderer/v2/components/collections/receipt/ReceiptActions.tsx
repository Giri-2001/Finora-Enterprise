/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

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
        <Button
          onClick={() => {
            console.log("Preview Receipt");
          }}
        >
          Preview Receipt
        </Button>

        <Button
          onClick={() => {
            console.log("Print Receipt");
          }}
        >
          Print Receipt
        </Button>

        <Button
          onClick={() => {
            console.log("Download PDF");
          }}
        >
          Download PDF
        </Button>
      </div>
    </SummaryCard>
  );
}
