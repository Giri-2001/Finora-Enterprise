/* ===========================================================
FINORA ENTERPRISE V2
REVIEW STUDIO
REVIEW PREVIEW CARD
=========================================================== */

/* ===========================================================
IMPORTS
=========================================================== */

import SummaryCard
  from "../../common/cards/SummaryCard";

import type {
  LoanReviewData,
} from "./types";

import {
  cardStyle,
  fullWidthRowStyle,
  highlightRowStyle,
  labelStyle,
  previewGridStyle,
  primaryValueStyle,
  rowStyle,
  valueStyle,
} from "./ReviewPreviewCard.styles";

/* ===========================================================
TYPES
=========================================================== */

interface ReviewPreviewCardProps {

  review: LoanReviewData;

}

/* ===========================================================
COMPONENT
=========================================================== */

export default function ReviewPreviewCard({

  review,

}: ReviewPreviewCardProps) {

  return (

    <div
      style={cardStyle}
    >

      <SummaryCard
        title="Final Loan Preview"
      >

        <div
          style={previewGridStyle}
        >

          {/* CUSTOMER */}

          <div
            style={highlightRowStyle}
          >

            <span
              style={labelStyle}
            >
              Customer
            </span>

            <strong
              style={primaryValueStyle}
            >
              {review.customerName}
            </strong>

          </div>


          {/* LOAN AMOUNT */}

          <div
            style={rowStyle}
          >

            <span
              style={labelStyle}
            >
              Loan Amount
            </span>

            <strong
              style={valueStyle}
            >
              ₹ {review.loanAmount}
            </strong>

          </div>


          {/* INTEREST */}

          <div
            style={rowStyle}
          >

            <span
              style={labelStyle}
            >
              Interest
            </span>

            <strong
              style={valueStyle}
            >
              {review.interestRate}%
            </strong>

          </div>


          {/* REPAYMENT */}

          <div
            style={rowStyle}
          >

            <span
              style={labelStyle}
            >
              Repayment
            </span>

            <strong
              style={valueStyle}
            >
              {review.repaymentType}
            </strong>

          </div>

          {/* TENURE */}

<div
  style={rowStyle}
>
  <span
    style={labelStyle}
  >
    Tenure
  </span>

  <strong
    style={valueStyle}
  >
    {review.duration || "--"}
  </strong>
</div>

{/* INSTALLMENT */}

<div
  style={rowStyle}
>
  <span
    style={labelStyle}
  >
    Installment
  </span>

  <strong
    style={valueStyle}
  >
    {review.installmentAmount > 0
      ? `₹ ${review.installmentAmount.toLocaleString("en-IN")}`
      : "--"}
  </strong>
</div>

          {/* GUARANTOR */}

          <div
            style={fullWidthRowStyle}
          >

            <span
              style={labelStyle}
            >
              Guarantor
            </span>

            <strong
              style={valueStyle}
            >
              {review.guarantorName}
            </strong>

          </div>

        </div>

      </SummaryCard>

    </div>

  );

}

/* ===========================================================
END
=========================================================== */
