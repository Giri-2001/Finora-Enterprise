/* ===========================================================
FINORA ENTERPRISE V2
REPAYMENT STUDIO
REPAYMENT SUMMARY
=========================================================== */

/* ===========================================================
IMPORTS
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
  installmentAmount?: number;
  totalInstallments?: number;
  totalRepayable?: number;
}

/* ===========================================================
COMPONENT
=========================================================== */

export default function RepaymentSummary({
  installmentAmount = 0,
  totalInstallments = 0,
  totalRepayable = 0,
}: RepaymentSummaryProps) {
  return (
    <div style={cardStyle}>
      <SummaryCard title="Repayment Summary">
        <div style={summaryGridStyle}>

          {/* INSTALLMENT AMOUNT */}
          <div style={rowStyle}>
            <span style={labelStyle}>
              Installment Amount
            </span>

            <strong style={valueStyle}>
              ₹ {installmentAmount}
            </strong>
          </div>

          {/* TOTAL INSTALLMENTS */}
          <div style={rowStyle}>
            <span style={labelStyle}>
              Total Installments
            </span>

            <strong style={valueStyle}>
              {totalInstallments}
            </strong>
          </div>

          {/* TOTAL REPAYABLE */}
          <div style={highlightRowStyle}>
            <span style={labelStyle}>
              Total Repayable
            </span>

            <strong style={valueStyle}>
              ₹ {totalRepayable}
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
