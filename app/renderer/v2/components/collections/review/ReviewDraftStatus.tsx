/* ===========================================================
   FINORA ENTERPRISE V2
   COLLECTION REVIEW STUDIO
   REVIEW DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface ReviewDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReviewDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: ReviewDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Collection Review Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
