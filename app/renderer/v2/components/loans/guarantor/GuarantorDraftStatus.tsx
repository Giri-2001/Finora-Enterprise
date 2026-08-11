/* ===========================================================
FINORA ENTERPRISE V2
GUARANTOR STUDIO
GUARANTOR DRAFT STATUS
=========================================================== */

/* ===========================================================
IMPORTS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

import {
  cardStyle,
  statusStyle,
} from "./GuarantorDraftStatus.styles";

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
    <div style={cardStyle}>
      <div style={statusStyle}>
        <StudioDraftStatus
          title="Guarantor Draft"
          status={status}
          updatedAt={savedAt}
        />
      </div>
    </div>
  );
}

/* ===========================================================
END
=========================================================== */
