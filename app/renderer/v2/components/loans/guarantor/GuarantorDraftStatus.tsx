/* ===========================================================
   FINORA ENTERPRISE V2
   GUARANTOR STUDIO
   GUARANTOR DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface GuarantorDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function GuarantorDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: GuarantorDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Guarantor Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
