/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   UPI PAYMENT STUDIO
   UPI DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface UpiDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function UpiDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: UpiDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="UPI Payment Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
