/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   SETTLEMENT STUDIO
   SETTLEMENT DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface SettlementDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SettlementDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: SettlementDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Settlement Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
