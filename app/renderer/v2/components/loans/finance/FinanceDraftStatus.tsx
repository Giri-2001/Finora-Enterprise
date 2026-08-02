/* ===========================================================
   FINORA ENTERPRISE V2
   FINANCE STUDIO
   FINANCE DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface FinanceDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function FinanceDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: FinanceDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Finance Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
