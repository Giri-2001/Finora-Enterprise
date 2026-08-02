/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   LEDGER & RECONCILIATION STUDIO
   LEDGER DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface LedgerDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LedgerDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: LedgerDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Ledger & Reconciliation Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
