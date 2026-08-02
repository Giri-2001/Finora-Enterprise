/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   PHONEPE INTEGRATION STUDIO
   PHONEPE DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface PhonePeDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PhonePeDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: PhonePeDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="PhonePe Integration Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
