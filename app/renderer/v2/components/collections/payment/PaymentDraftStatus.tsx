/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT STUDIO
   PAYMENT DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface PaymentDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PaymentDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: PaymentDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Payment Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
