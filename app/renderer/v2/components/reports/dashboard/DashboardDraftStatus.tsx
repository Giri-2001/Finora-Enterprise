/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   DASHBOARD DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface DashboardDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function DashboardDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: DashboardDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Dashboard Report Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
