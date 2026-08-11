/* ===========================================================
FINORA ENTERPRISE V2
REVIEW STUDIO
REVIEW DRAFT STATUS
=========================================================== */

/* ===========================================================
IMPORTS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

import {
  cardStyle,
  statusStyle,
} from "./ReviewDraftStatus.styles";

/* ===========================================================
TYPES
=========================================================== */

interface ReviewDraftStatusProps {
  savedAt?: string;
  status?: "Draft" | "Completed";
}

/* ===========================================================
COMPONENT
=========================================================== */

export default function ReviewDraftStatus({
  savedAt = "Not Saved",
  status = "Draft",
}: ReviewDraftStatusProps) {
  return (
    <div style={cardStyle}>
      <div style={statusStyle}>
        <StudioDraftStatus
          title="Review Draft"
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
