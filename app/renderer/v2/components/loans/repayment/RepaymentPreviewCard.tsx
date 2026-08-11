/* ===========================================================
FINORA ENTERPRISE V2
REPAYMENT STUDIO
REPAYMENT PREVIEW CARD
=========================================================== */

/* ===========================================================
IMPORTS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  cardStyle,
  fullWidthRowStyle,
  highlightRowStyle,
  labelStyle,
  previewGridStyle,
  primaryValueStyle,
  rowStyle,
  valueStyle,
} from "./RepaymentPreviewCard.styles";

/* ===========================================================
TYPES
=========================================================== */

interface RepaymentPreviewCardProps {
  frequency?: string;
  installmentAmount?: number;
  totalInstallments?: number;
  firstInstallmentDate?: string;
}

/* ===========================================================
COMPONENT
=========================================================== */

export default function RepaymentPreviewCard({
  frequency = "--",
  installmentAmount = 0,
  totalInstallments = 0,
  firstInstallmentDate = "--",
}: RepaymentPreviewCardProps) {
  return (
    <div style={cardStyle}>
      <SummaryCard title="Repayment Preview">
        <div style={previewGridStyle}>

          {/* FREQUENCY */}
          <div style={highlightRowStyle}>
            <span style={labelStyle}>
              Frequency
            </span>

            <strong style={primaryValueStyle}>
              {frequency}
            </strong>
          </div>

          {/* INSTALLMENT */}
          <div style={rowStyle}>
            <span style={labelStyle}>
              Installment
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

          {/* FIRST INSTALLMENT */}
          <div style={fullWidthRowStyle}>
            <span style={labelStyle}>
              First Installment
            </span>

            <strong style={valueStyle}>
              {firstInstallmentDate}
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
