/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   EXPENSE MANAGEMENT STUDIO
   EXPENSE DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface ExpenseDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ExpenseDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: ExpenseDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Expense Management Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
