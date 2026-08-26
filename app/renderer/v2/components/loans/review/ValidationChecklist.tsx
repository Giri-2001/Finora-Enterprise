/* ===========================================================
   FINORA ENTERPRISE OS™
   LOAN STUDIO™
   REVIEW STUDIO
   VALIDATION CHECKLIST

   RESPONSIBILITY:
   - Render validation checklist only.
   - Consume LoanReviewData.
   - Consume FINORA Theme Engine presentation styles.
   - Responsive presentation handled by styles file.
   - No business calculations.
   - No inline styles.
   - No local colour palette.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import type { LoanReviewData } from "./types";

import {
  cardStyle,
  checklistStyle,
  itemStyle,
  itemContentStyle,
  statusMarkCompleteStyle,
  statusMarkPendingStyle,
  itemTextStyle,
  statusTextCompleteStyle,
  statusTextPendingStyle,
} from "./ValidationChecklist.styles";

/* ===========================================================
   TYPES
=========================================================== */

interface ValidationChecklistProps {
  review: LoanReviewData;
}

/* ===========================================================
   HELPERS
=========================================================== */

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasPositiveNumber(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ValidationChecklist({
  review,
}: ValidationChecklistProps) {
  /* =========================================================
     VALIDATION RULES
  ========================================================= */

  const customerComplete =
    hasText(review.customerId) &&
    hasText(review.customerName) &&
    hasText(review.phoneNumber);

  const loanAmountComplete = hasPositiveNumber(review.loanAmount);

  const repaymentComplete =
    hasText(review.repaymentType) && hasText(review.duration);

  const guarantorComplete = hasText(review.guarantorName);

  const finalReviewComplete =
    hasText(review.customerName) && loanAmountComplete && repaymentComplete;

  /* =========================================================
     CHECKLIST DATA
  ========================================================= */

  const checklist = [
    {
      label: "Customer Details",

      complete: customerComplete,
    },

    {
      label: "Loan Amount",

      complete: loanAmountComplete,
    },

    {
      label: "Repayment Setup",

      complete: repaymentComplete,
    },

    {
      label: "Guarantor Details",

      complete: guarantorComplete,
    },

    {
      label: "Final Review Data",

      complete: finalReviewComplete,
    },
  ];

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div style={cardStyle}>
      <SummaryCard title="Validation Checklist">
        <ul style={checklistStyle}>
          {checklist.map((item) => (
            <li key={item.label} style={itemStyle}>
              <span style={itemContentStyle}>
                <span
                  style={
                    item.complete
                      ? statusMarkCompleteStyle
                      : statusMarkPendingStyle
                  }
                >
                  {item.complete ? "✓" : "!"}
                </span>

                <span style={itemTextStyle}>{item.label}</span>
              </span>

              <span
                style={
                  item.complete
                    ? statusTextCompleteStyle
                    : statusTextPendingStyle
                }
              >
                {item.complete ? "Complete" : "Pending"}
              </span>
            </li>
          ))}
        </ul>
      </SummaryCard>
    </div>
  );
}

/* ===========================================================
   END
=========================================================== */
