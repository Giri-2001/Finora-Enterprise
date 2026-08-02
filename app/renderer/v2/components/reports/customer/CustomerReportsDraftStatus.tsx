/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   CUSTOMER REPORTS STUDIO
   CUSTOMER REPORTS DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface CustomerReportsDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerReportsDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: CustomerReportsDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Customer Reports Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
