/* ===========================================================
   FINORA ENTERPRISE V2
   LOAN DETAILS STUDIO
   LOAN DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface LoanDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoanDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: LoanDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Loan Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
