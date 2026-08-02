/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   INCOME MANAGEMENT STUDIO
   INCOME DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface IncomeDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function IncomeDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: IncomeDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Income Management Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
