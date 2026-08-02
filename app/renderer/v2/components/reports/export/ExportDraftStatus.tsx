/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   EXPORT & ANALYTICS STUDIO
   EXPORT DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface ExportDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ExportDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: ExportDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Export & Analytics Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
