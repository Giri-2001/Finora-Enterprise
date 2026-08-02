/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   PAYMENT HISTORY STUDIO
   PAYMENT HISTORY DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface PaymentHistoryDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PaymentHistoryDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: PaymentHistoryDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Payment History Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
