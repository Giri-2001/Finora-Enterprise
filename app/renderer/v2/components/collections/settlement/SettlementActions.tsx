/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   SETTLEMENT ACTIONS
=========================================================== */

import Button from "../../common/buttons/Button";
import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SettlementActions() {
  return (
    <SummaryCard title="Settlement Actions">
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <Button
          onClick={() => {
            console.log("Save Settlement");
          }}
        >
          Save Settlement
        </Button>

        <Button
          onClick={() => {
            console.log("Complete Settlement");
          }}
        >
          Complete Settlement
        </Button>

        <Button
          onClick={() => {
            console.log("Generate Statement");
          }}
        >
          Generate Statement
        </Button>
      </div>
    </SummaryCard>
  );
}
