/* ===========================================================
FINORA ENTERPRISE V2
REVIEW STUDIO
VALIDATION CHECKLIST
=========================================================== */

/* ===========================================================
IMPORTS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import type {
  LoanReviewData,
} from "./types";

import {
  cardStyle,
  checklistStyle,
  emptyStateStyle,
} from "./ValidationChecklist.styles";

/* ===========================================================
TYPES
=========================================================== */

interface ValidationChecklistProps {
  review: LoanReviewData;
}

/* ===========================================================
COMPONENT
=========================================================== */

export default function ValidationChecklist({
  review,
}: ValidationChecklistProps) {
  return (
    <div style={cardStyle}>
      <SummaryCard title="Validation Checklist">
        <ul style={checklistStyle}>

          {/* VALIDATION RULES WILL BE RENDERED HERE */}

          <li style={emptyStateStyle}>
            Validation checklist is pending configuration.
          </li>

        </ul>
      </SummaryCard>
    </div>
  );
}

/* ===========================================================
END
=========================================================== */
