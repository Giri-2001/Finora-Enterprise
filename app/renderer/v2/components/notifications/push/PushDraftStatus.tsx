/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   PUSH NOTIFICATION STUDIO
   PUSH DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface PushDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PushDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: PushDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Push Notification Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
