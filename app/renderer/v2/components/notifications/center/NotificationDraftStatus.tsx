/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   NOTIFICATION CENTER STUDIO
   NOTIFICATION DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface NotificationDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function NotificationDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: NotificationDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Notification Center Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
