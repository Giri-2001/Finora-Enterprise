/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   SMS & WHATSAPP STUDIO
   SMS DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface SmsDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SmsDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: SmsDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="SMS & WhatsApp Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
