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

  repaymentMethod?: string;

  installmentAmount?: number;

  totalInstallments?: number;

  totalRepayable?: number;

  firstInstallmentDate?: string;

  lastInstallmentDate?: string;

}


/* ===========================================================
HELPERS
=========================================================== */

function formatAmount(
  value: number,
): string {

  return Math.round(
    value,
  ).toLocaleString(
    "en-IN",
  );

}

function formatRepaymentMethod(
  value?: string,
): string {

  switch (value) {

    case "fixed":
      return "Fixed EMI";

    case "variable":
      return "Variable EMI";

    case "interestOnly":
      return "Interest Only";

    default:
      return "--";
  }

}


function formatFrequency(
  value?: string,
): string {

  switch (value?.toLowerCase()) {

    case "daily":
      return "Daily";

    case "weekly":
      return "Weekly";

    case "monthly":
      return "Monthly";

    default:
      return "--";
  }

}


/* ===========================================================
COMPONENT
=========================================================== */

export default function RepaymentPreviewCard({

  frequency = "--",

  repaymentMethod,

  installmentAmount = 0,

  totalInstallments = 0,

  totalRepayable = 0,

  firstInstallmentDate = "--",

  lastInstallmentDate = "--",

}: RepaymentPreviewCardProps) {

  return (

    <div
      style={cardStyle}
    >

      <SummaryCard
        title="Repayment Preview"
      >

        <div
          style={previewGridStyle}
        >

          {/* =================================================
              REPAYMENT METHOD
          ================================================= */}

          <div
            style={highlightRowStyle}
          >

            <span
              style={labelStyle}
            >
              EMI Calculation
            </span>

            <strong
              style={primaryValueStyle}
            >
              {formatRepaymentMethod(
                repaymentMethod,
              )}
            </strong>

          </div>


          {/* =================================================
              FREQUENCY
          ================================================= */}

          <div
            style={rowStyle}
          >

            <span
              style={labelStyle}
            >
              Repayment Frequency
            </span>

            <strong
              style={valueStyle}
            >
              {formatFrequency(
                frequency,
              )}
            </strong>

          </div>


          {/* =================================================
              INSTALLMENT
          ================================================= */}

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
              {installmentAmount > 0
                ? `₹ ${formatAmount(
                    installmentAmount,
                  )}`
                : "--"}
            </strong>

          </div>


          {/* =================================================
              TOTAL INSTALLMENTS
          ================================================= */}

          <div
            style={rowStyle}
          >

            <span
              style={labelStyle}
            >
              Total Installments
            </span>

            <strong
              style={valueStyle}
            >
              {totalInstallments > 0
                ? Math.round(
                    totalInstallments,
                  )
                : "--"}
            </strong>

          </div>


          {/* =================================================
              TOTAL REPAYABLE
          ================================================= */}

          <div
            style={highlightRowStyle}
          >

            <span
              style={labelStyle}
            >
              Total Repayable
            </span>

            <strong
              style={primaryValueStyle}
            >
              ₹ {formatAmount(
                totalRepayable,
              )}
            </strong>

          </div>


          {/* =================================================
              FIRST INSTALLMENT
          ================================================= */}

          <div
            style={rowStyle}
          >

            <span
              style={labelStyle}
            >
              First Installment
            </span>

            <strong
              style={valueStyle}
            >
              {firstInstallmentDate}
            </strong>

          </div>


          {/* =================================================
              LAST INSTALLMENT
          ================================================= */}

          <div
            style={fullWidthRowStyle}
          >

            <span
              style={labelStyle}
            >
              Last Installment
            </span>

            <strong
              style={valueStyle}
            >
              {lastInstallmentDate}
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
