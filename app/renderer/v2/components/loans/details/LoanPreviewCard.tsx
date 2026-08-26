// ============================================================
// FINORA ENTERPRISE V2
//
// LOAN DETAILS STUDIO
// LOAN PREVIEW CARD
//
// RESPONSIBILITY:
// - Step 1 loan preview presentation only
// - Clear customer / loan / schedule / disbursement summary
// - No business calculations
// - No persistence
// - No service access
//
// STEP 1 PREVIEW:
// - Customer
// - Loan Details
// - Schedule
// - Disbursement
//
// INTENTIONALLY NOT DISPLAYED IN STEP 1:
// - Loan Status
// - Repayment Type
// - Installment Amount
// - Late Fee
//
// These belong to later Loan Studio stages.
//
// RESPONSIVE BEHAVIOUR:
// - Mobile   → 1 preview field per row
// - Tablet   → 2 preview fields per row
// - Laptop   → 2 preview fields per row
// - Desktop  → 2 preview fields per row
//
// IMPORTANT:
// - Responsive viewport comes from FINORA Responsive Engine.
// - No window.innerWidth.
// - No local breakpoint detection.
// - No media queries.
// - No auto-fit column expansion.
// - Tablet is explicitly locked to 2 fields per row.
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { useResponsive } from "../../../utils/responsive";

import {
  cardStyle,
  contentStyle,
  customerValueStyle,
  financialValueStyle,
  fullWidthRowStyle,
  groupStyle,
  groupTitleStyle,
  highlightRowStyle,
  labelStyle,
  rowStyle,
  valueStyle,
  previewBadgeStyle,
} from "./LoanPreviewCard.styles";

import { formatCurrency } from "../../../utils/currency/formatCurrency";

// ============================================================
// TYPES
// ============================================================

interface LoanPreviewCardProps {
  customerName?: string;

  loanAmount?: number;

  loanType?: string;

  /*
   * Kept for LoanStudio compatibility.
   * Not displayed in Step 1.
   */
  loanStatus?: string;

  interest?: number;

  totalInterest?: number;

  totalPayable?: number;

  /*
   * Kept for LoanStudio compatibility.
   * Installment is finalized in the Repayment stage.
   */
  installmentAmount?: number;

  loanDate?: string;

  maturityDate?: string;

  processingFee?: number;

  advanceDeduction?: number;

  netDisbursement?: number;

  /*
   * Kept for LoanStudio compatibility.
   * Late fee belongs to Finance / Charges.
   */
  lateFee?: number;

  /*
   * Kept for LoanStudio compatibility.
   * Repayment configuration belongs to Repayment stage.
   */
  repaymentType?: string;
}

// ============================================================
// RESPONSIVE PREVIEW GRID
//
// FINAL RESPONSIVE CONTRACT:
//
// Mobile:
//   1 field per row
//
// Tablet:
//   2 fields per row
//
// Laptop:
//   2 fields per row
//
// Desktop:
//   2 fields per row
//
// The viewport itself is resolved by the FINORA Responsive
// Engine through useResponsive().
//
// There is intentionally NO:
// - window.innerWidth
// - matchMedia()
// - media query
// - auto-fit
// - auto-fill
//
// This prevents tablet from expanding into 3 / 4 columns.
// ============================================================

function createPreviewGridStyle(
  viewport: "mobile" | "tablet" | "laptop" | "desktop",
) {
  return {
    display: "grid",

    gridTemplateColumns:
      viewport === "mobile" ? "minmax(0, 1fr)" : "repeat(2, minmax(0, 1fr))",

    gap: "6px 8px",

    width: "100%",

    minWidth: 0,

    boxSizing: "border-box" as const,

    alignItems: "stretch",

    overflow: "hidden",
  };
}

// ============================================================
// COMPONENT
// ============================================================

export default function LoanPreviewCard({
  customerName = "--",

  loanAmount = 0,

  loanType = "--",

  interest = 0,

  totalInterest = 0,

  totalPayable = 0,

  loanDate = "--",

  maturityDate = "--",

  processingFee = 0,

  advanceDeduction = 0,

  netDisbursement = 0,
}: LoanPreviewCardProps) {
  // ==========================================================
  // FINORA RESPONSIVE ENGINE
  // ==========================================================

  const { tokens } = useResponsive();

  // ==========================================================
  // RESPONSIVE PREVIEW GRID
  // ==========================================================

  const previewGridStyle = createPreviewGridStyle(tokens.meta.viewport);

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <section style={cardStyle}>
      {/* ==================================================
          HEADER
      ================================================== */}

      <div
        style={{
          display: "flex",

          alignItems: "center",

          justifyContent: "space-between",

          gap: "12px",

          marginBottom: "14px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "14px",

              fontWeight: 750,

              color: "#FFFFFF",

              lineHeight: 1.2,
            }}
          >
            Loan Preview
          </div>

          <div
            style={{
              marginTop: "3px",

              fontSize: "12px",

              fontWeight: 500,

              color: "#94A3B8",

              lineHeight: 1.2,
            }}
          >
            Live financial summary
          </div>
        </div>

        <span style={previewBadgeStyle}>Preview</span>
      </div>

      {/* ==================================================
          PREVIEW CONTENT
      ================================================== */}

      <div style={contentStyle}>
        {/* ==================================================
            CUSTOMER
        ================================================== */}

        <div style={fullWidthRowStyle}>
          <span style={labelStyle}>Customer</span>

          <strong style={customerValueStyle}>{customerName}</strong>
        </div>

        {/* ==================================================
            LOAN DETAILS
        ================================================== */}

        <div style={groupStyle}>
          <div style={groupTitleStyle}>Loan Details</div>

          <div style={previewGridStyle}>
            {/* LOAN AMOUNT */}

            <div style={highlightRowStyle}>
              <span style={labelStyle}>Loan Amount</span>

              <strong style={financialValueStyle}>
                ₹ {formatCurrency(loanAmount)}
              </strong>
            </div>

            {/* LOAN TYPE */}

            <div style={rowStyle}>
              <span style={labelStyle}>Loan Type</span>

              <strong style={valueStyle}>{loanType}</strong>
            </div>

            {/* INTEREST */}

            <div style={rowStyle}>
              <span style={labelStyle}>Interest</span>

              <strong style={valueStyle}>{interest}%</strong>
            </div>

            {/* TOTAL INTEREST */}

            <div style={rowStyle}>
              <span style={labelStyle}>Total Interest</span>

              <strong style={financialValueStyle}>
                ₹ {formatCurrency(totalInterest)}
              </strong>
            </div>

            {/* TOTAL PAYABLE */}

            <div style={highlightRowStyle}>
              <span style={labelStyle}>Total Payable</span>

              <strong style={financialValueStyle}>
                ₹ {formatCurrency(totalPayable)}
              </strong>
            </div>
          </div>
        </div>

        {/* ==================================================
            SCHEDULE
        ================================================== */}

        <div style={groupStyle}>
          <div style={groupTitleStyle}>Schedule</div>

          <div style={previewGridStyle}>
            {/* LOAN DATE */}

            <div style={rowStyle}>
              <span style={labelStyle}>Loan Date</span>

              <strong style={valueStyle}>{loanDate}</strong>
            </div>

            {/* MATURITY */}

            <div style={rowStyle}>
              <span style={labelStyle}>Maturity</span>

              <strong style={valueStyle}>{maturityDate}</strong>
            </div>
          </div>
        </div>

        {/* ==================================================
            DISBURSEMENT
        ================================================== */}

        <div style={groupStyle}>
          <div style={groupTitleStyle}>Disbursement</div>

          <div style={previewGridStyle}>
            {/* PROCESSING FEE */}

            <div style={rowStyle}>
              <span style={labelStyle}>Processing Fee</span>

              <strong style={valueStyle}>
                ₹ {formatCurrency(processingFee)}
              </strong>
            </div>

            {/* ADVANCE DEDUCTION */}

            <div style={rowStyle}>
              <span style={labelStyle}>Advance Deduction</span>

              <strong style={financialValueStyle}>
                ₹ {formatCurrency(advanceDeduction)}
              </strong>
            </div>

            {/* NET DISBURSEMENT */}

            <div style={highlightRowStyle}>
              <span style={labelStyle}>Net Disbursement</span>

              <strong style={financialValueStyle}>
                ₹ {formatCurrency(netDisbursement)}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// END
// ============================================================
