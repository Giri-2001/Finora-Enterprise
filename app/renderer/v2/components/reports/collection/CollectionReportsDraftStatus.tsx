/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   COLLECTION REPORTS STUDIO
   COLLECTION REPORTS DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface CollectionReportsDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CollectionReportsDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: CollectionReportsDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Collection Reports Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
