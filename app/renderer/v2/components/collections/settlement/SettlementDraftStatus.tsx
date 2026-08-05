/* ===========================================================
   FINORA ENTERPRISE V2
   COLLECTION STUDIO
   SETTLEMENT DRAFT STATUS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SettlementDraftStatus() {

  return (

    <SummaryCard title="Settlement Draft Status">

      <span>
        Draft Status :
        <strong> Draft</strong>
      </span>

      <span>
        Settlement :
        <strong> Pending</strong>
      </span>

      <span>
        Updated :
        <strong> Just Now</strong>
      </span>

    </SummaryCard>

  );

}
