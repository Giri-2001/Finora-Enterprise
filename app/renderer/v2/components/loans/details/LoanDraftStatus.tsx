/* ===========================================================
FINORA ENTERPRISE V2
LOAN DETAILS STUDIO
LOAN DRAFT STATUS
=========================================================== */

/* ===========================================================
IMPORTS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

import {
  cardStyle,
  statusStyle,
} from "./LoanDraftStatus.styles";

/* ===========================================================
TYPES
=========================================================== */

interface LoanDraftStatusProps {
  savedAt?: string;
  status?: "Draft" | "Completed";
}

/* ===========================================================
COMPONENT
=========================================================== */

export default function LoanDraftStatus({
  savedAt = "Not Saved",
  status = "Draft",
}: LoanDraftStatusProps) {
  return (
    <div style={cardStyle}>
      <div style={statusStyle}>
        <StudioDraftStatus
          title="Loan Draft"
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
