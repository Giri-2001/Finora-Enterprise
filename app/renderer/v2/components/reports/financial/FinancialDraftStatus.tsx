/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   FINANCIAL REPORTS STUDIO
   FINANCIAL DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface FinancialDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function FinancialDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: FinancialDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Financial Report Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
