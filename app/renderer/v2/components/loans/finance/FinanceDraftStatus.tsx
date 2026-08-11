/* ===========================================================
FINORA ENTERPRISE V2
FINANCE STUDIO
FINANCE DRAFT STATUS
=========================================================== */

/* ===========================================================
IMPORTS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

import {
  cardStyle,
  statusStyle,
} from "./FinanceDraftStatus.styles";

/* ===========================================================
TYPES
=========================================================== */

interface FinanceDraftStatusProps {
  savedAt?: string;
  status?: "Draft" | "Completed";
}

/* ===========================================================
COMPONENT
=========================================================== */

export default function FinanceDraftStatus({
  savedAt = "Not Saved",
  status = "Draft",
}: FinanceDraftStatusProps) {
  return (
    <div style={cardStyle}>
      <div style={statusStyle}>
        <StudioDraftStatus
          title="Finance Draft"
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
