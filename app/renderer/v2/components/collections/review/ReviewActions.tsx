/* ===========================================================
   FINORA ENTERPRISE V2
   COLLECTION REVIEW STUDIO
   REVIEW ACTIONS
=========================================================== */

import Button from "../../common/buttons/Button";
import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReviewActions() {

  return (

    <SummaryCard title="Review Actions">

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

          Complete Collection

        </Button>

        <Button>

          Generate Report

        </Button>

      </div>

    </SummaryCard>

  );

}
