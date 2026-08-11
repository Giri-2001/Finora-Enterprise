/* ===========================================================
FINORA ENTERPRISE V2
REPAYMENT STUDIO
REPAYMENT DRAFT STATUS
=========================================================== */

/* ===========================================================
IMPORTS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

import {
  cardStyle,
  statusStyle,
} from "./RepaymentDraftStatus.styles";

/* ===========================================================
TYPES
=========================================================== */

interface RepaymentDraftStatusProps {
  savedAt?: string;
  status?: "Draft" | "Completed";
}

/* ===========================================================
COMPONENT
=========================================================== */

export default function RepaymentDraftStatus({
  savedAt = "Not Saved",
  status = "Draft",
}: RepaymentDraftStatusProps) {
  return (
    <div style={cardStyle}>
      <div style={statusStyle}>
        <StudioDraftStatus
          title="Repayment Draft"
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
