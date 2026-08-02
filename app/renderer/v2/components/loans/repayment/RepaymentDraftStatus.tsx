/* ===========================================================
   FINORA ENTERPRISE V2
   REPAYMENT STUDIO
   REPAYMENT DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface RepaymentDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function RepaymentDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: RepaymentDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Repayment Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
