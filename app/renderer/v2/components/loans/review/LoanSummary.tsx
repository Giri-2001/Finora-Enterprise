/* ===========================================================
FINORA ENTERPRISE V2
REVIEW STUDIO
LOAN SUMMARY
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
  highlightRowStyle,
  labelStyle,
  primaryValueStyle,
  rowStyle,
  summaryGridStyle,
  valueStyle,
} from "./LoanSummary.styles";

/* ===========================================================
TYPES
=========================================================== */

interface LoanSummaryProps {
  review: LoanReviewData;
}

/* ===========================================================
COMPONENT
=========================================================== */

export default function LoanSummary({
  review,
}: LoanSummaryProps) {
  return (
    <div style={cardStyle}>
      <SummaryCard title="Loan Summary">
        <div style={summaryGridStyle}>

          {/* CUSTOMER */}
          <div style={highlightRowStyle}>
            <span style={labelStyle}>
              Customer
            </span>

            <strong style={primaryValueStyle}>
              {review.customerName}
            </strong>
          </div>

          {/* LOAN AMOUNT */}
          <div style={rowStyle}>
            <span style={labelStyle}>
              Loan Amount
            </span>

            <strong style={valueStyle}>
              ₹ {review.loanAmount}
            </strong>
          </div>

          {/* INTEREST */}
          <div style={rowStyle}>
            <span style={labelStyle}>
              Interest
            </span>

            <strong style={valueStyle}>
              {review.interestRate}%
            </strong>
          </div>

          {/* REPAYMENT */}
          <div style={rowStyle}>
            <span style={labelStyle}>
              Repayment
            </span>

            <strong style={valueStyle}>
              {review.repaymentType}
            </strong>
          </div>

          {/* GUARANTOR */}
          <div style={highlightRowStyle}>
            <span style={labelStyle}>
              Guarantor
            </span>

            <strong style={valueStyle}>
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
