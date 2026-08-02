/* ===========================================================
   FINORA ENTERPRISE V2
   RECEIPT STUDIO
   RECEIPT DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface ReceiptDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReceiptDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: ReceiptDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Receipt Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
