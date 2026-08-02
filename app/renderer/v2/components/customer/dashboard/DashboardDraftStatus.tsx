/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   CUSTOMER DASHBOARD STUDIO
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

      title="Customer Dashboard Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
