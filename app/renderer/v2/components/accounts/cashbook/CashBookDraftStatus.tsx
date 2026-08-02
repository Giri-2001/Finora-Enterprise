/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   CASH BOOK STUDIO
   CASH BOOK DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface CashBookDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CashBookDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: CashBookDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Cash Book Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
