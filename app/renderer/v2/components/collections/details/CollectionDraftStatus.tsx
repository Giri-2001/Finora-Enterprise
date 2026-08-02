/* ===========================================================
   FINORA ENTERPRISE V2
   COLLECTION STUDIO
   COLLECTION DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface CollectionDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CollectionDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: CollectionDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Collection Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
