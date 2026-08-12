/* ===========================================================
   FINORA ENTERPRISE V2
   REPAYMENT STUDIO
   REPAYMENT SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  cardStyle,
  highlightRowStyle,
  labelStyle,
  rowStyle,
  summaryGridStyle,
  valueStyle,
} from "./RepaymentSummary.styles";

/* ===========================================================
   TYPES
=========================================================== */

interface RepaymentSummaryProps {
  loanAmount?: number;
  totalInterest?: number;
  installmentAmount?: number;
  totalInstallments?: number;
  totalRepayable?: number;
  repaymentMethod?: string;
  repaymentFrequency?: string;
}

/* ===========================================================
   HELPERS
=========================================================== */

function formatAmount(
  value: number,
): string {
  return Math.round(value).toLocaleString(
    "en-IN",
  );
}

function formatMethod(
  value?: string,
): string {
  switch (value) {
    case "fixed":
      return "Fixed EMI";

    case "reducing":
      return "Reducing EMI";

    case "interestOnly":
      return "Interest Only";

    default:
      return "—";
  }
}

function formatFrequency(
  value?: string,
): string {
  switch (value) {
    case "daily":
      return "Daily";

    case "weekly":
      return "Weekly";

    case "monthly":
      return "Monthly";

    default:
      return "—";
  }
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function RepaymentSummary({

  loanAmount = 0,
  totalInterest = 0,
  installmentAmount = 0,
  totalInstallments = 0,
  totalRepayable = 0,
  repaymentMethod,
  repaymentFrequency,

}: RepaymentSummaryProps) {

  return (

    <div
      style={cardStyle}
    >

      <SummaryCard
        title="Repayment Summary"
      >

        <div
          style={summaryGridStyle}
        >

          <div style={rowStyle}>
            <span style={labelStyle}>
              Loan Amount
            </span>
            <strong style={valueStyle}>
              ₹ {formatAmount(loanAmount)}
            </strong>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>
              Repayment Method
            </span>
            <strong style={valueStyle}>
              {formatMethod(
                repaymentMethod,
              )}
            </strong>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>
              Repayment Frequency
            </span>
            <strong style={valueStyle}>
              {formatFrequency(
                repaymentFrequency,
              )}
            </strong>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>
              Total Interest
            </span>
            <strong style={valueStyle}>
              ₹ {formatAmount(totalInterest)}
            </strong>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>
              Installment Amount
            </span>
            <strong style={valueStyle}>
              ₹ {formatAmount(installmentAmount)}
            </strong>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>
              Total Installments
            </span>
            <strong style={valueStyle}>
              {Math.round(totalInstallments)}
            </strong>
          </div>

          <div style={highlightRowStyle}>
            <span style={labelStyle}>
              Total Repayable
            </span>
            <strong style={valueStyle}>
              ₹ {formatAmount(totalRepayable)}
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
