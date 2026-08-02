/* ===========================================================
   FINORA ENTERPRISE V2
   SETTLEMENT STUDIO
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

        <Button>

          Save Settlement

        </Button>

        <Button>

          Complete Settlement

        </Button>

        <Button>

          Generate Statement

        </Button>

      </div>

    </SummaryCard>

  );

}
