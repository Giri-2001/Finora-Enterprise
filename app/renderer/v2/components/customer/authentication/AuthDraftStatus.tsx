/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   CUSTOMER AUTHENTICATION STUDIO
   AUTHENTICATION DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface AuthDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function AuthDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: AuthDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Customer Authentication Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
