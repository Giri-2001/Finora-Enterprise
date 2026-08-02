/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   RAZORPAY GATEWAY STUDIO
   RAZORPAY DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface RazorpayDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function RazorpayDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: RazorpayDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Razorpay Gateway Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
