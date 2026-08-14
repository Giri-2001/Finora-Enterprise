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

function hasText(
  value: unknown,
): boolean {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}


function hasPositiveNumber(
  value: unknown,
): boolean {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}


/* ===========================================================
COMPONENT
=========================================================== */

export default function ValidationChecklist({
  review,
}: ValidationChecklistProps) {


  /* ---------------------------------------------------------
  VALIDATION RULES
  --------------------------------------------------------- */

  const customerComplete =
    hasText(review.customerId) &&
    hasText(review.customerName) &&
    hasText(review.phoneNumber);


  const loanAmountComplete =
    hasPositiveNumber(review.loanAmount);


  const repaymentComplete =
    hasText(review.repaymentType) &&
    hasText(review.duration);


  const guarantorComplete =
    hasText(review.guarantorName);


  const finalReviewComplete =
    hasText(review.customerName) &&
    loanAmountComplete &&
    repaymentComplete;


  /* ---------------------------------------------------------
  CHECKLIST
  --------------------------------------------------------- */

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

            <li
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                minHeight: "32px",
                padding: "6px 8px",
                boxSizing: "border-box",
                borderBottom:
                  "1px solid rgba(148, 163, 184, 0.12)",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >

              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  minWidth: 0,
                }}
              >

                <span
                  style={{
                    width: "20px",
                    height: "20px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    background: item.complete
                      ? "rgba(34, 197, 94, 0.12)"
                      : "rgba(245, 158, 11, 0.12)",
                    border: item.complete
                      ? "1px solid rgba(34, 197, 94, 0.28)"
                      : "1px solid rgba(245, 158, 11, 0.28)",
                    color: item.complete
                      ? "#22C55E"
                      : "#F59E0B",
                    fontSize: "12px",
                    fontWeight: 750,
                  }}
                >
                  {item.complete ? "✓" : "!"}
                </span>


                <span>
                  {item.label}
                </span>

              </span>


              <span
                style={{
                  flexShrink: 0,
                  color: item.complete
                    ? "#22C55E"
                    : "#F59E0B",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {item.complete
                  ? "Complete"
                  : "Pending"}
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
