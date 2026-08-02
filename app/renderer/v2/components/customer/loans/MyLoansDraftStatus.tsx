/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   MY LOANS STUDIO
   MY LOANS DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface MyLoansDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function MyLoansDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: MyLoansDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="My Loans Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
