/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   EMI SCHEDULE STUDIO
   EMI DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface EmiDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function EmiDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: EmiDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="EMI Schedule Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
