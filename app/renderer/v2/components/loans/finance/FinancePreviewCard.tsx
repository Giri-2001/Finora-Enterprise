// ============================================================
// FINORA ENTERPRISE V2
//
// FINANCE STUDIO
// FINANCE PREVIEW CARD
//
// RESPONSIBILITY:
// - Finance summary presentation only
// - No business calculations
// - No persistence
// - No service access
// - No loan state ownership
//
// DISPLAY:
// - Interest Type
// - Interest Rate
// - Interest Basis
// - Total Interest
// - Total Payable
// - Processing Fee
// - Penalty
//
// IMPORTANT:
// - Advance Deduction is intentionally NOT displayed here.
// - Advance Deduction belongs to Loan Details / Disbursement.
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import {
  cardStyle,
  fullWidthRowStyle,
  highlightRowStyle,
  labelStyle,
  previewGridStyle,
  primaryValueStyle,
  rowStyle,
  valueStyle,
} from "./FinancePreviewCard.styles";


import {
  formatCurrency,
} from "../../../utils/currency/formatCurrency";


// ============================================================
// TYPES
// ============================================================

interface FinancePreviewCardProps {

  interestType?: string;

  interestRate?: number;

  interestCalculation?: string;

  totalInterest?: number;

  totalPayable?: number;

  processingFee?: number;

  penaltyValue?: number;

}


// ============================================================
// COMPONENT
// ============================================================

export default function FinancePreviewCard({

  interestType = "--",

  interestRate = 0,

  interestCalculation = "Monthly",

  totalInterest = 0,

  totalPayable = 0,

  processingFee = 0,

  penaltyValue = 0,

}: FinancePreviewCardProps) {

  return (

    <section
      style={
        cardStyle
      }
    >

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
            Finance Preview
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
            Live finance summary
          </div>

        </div>


        <span
          style={{
            padding: "5px 9px",
            borderRadius: "6px",
            border:
              "1px solid rgba(37, 99, 235, 0.35)",
            background:
              "rgba(37, 99, 235, 0.10)",
            color: "#93C5FD",
            fontSize: "12px",
            fontWeight: 650,
            whiteSpace: "nowrap",
          }}
        >
          Preview
        </span>

      </div>


      {/* ==================================================
          PREVIEW GRID
      ================================================== */}

      <div
        style={
          previewGridStyle
        }
      >

        {/* ==================================================
            INTEREST TYPE
        ================================================== */}

        <div
          style={
            fullWidthRowStyle
          }
        >

          <span
            style={
              labelStyle
            }
          >
            Interest Type
          </span>


          <strong
            style={
              primaryValueStyle
            }
          >
            {interestType}
          </strong>

        </div>


        {/* ==================================================
            INTEREST RATE
        ================================================== */}

        <div
          style={
            highlightRowStyle
          }
        >

          <span
            style={
              labelStyle
            }
          >
            Interest Rate
          </span>


          <strong
            style={
              primaryValueStyle
            }
          >
            {interestRate}%
          </strong>

        </div>


        {/* ==================================================
            INTEREST BASIS
        ================================================== */}

        <div
          style={
            rowStyle
          }
        >

          <span
            style={
              labelStyle
            }
          >
            Interest Basis
          </span>


          <strong
            style={
              valueStyle
            }
          >
            {interestCalculation}
          </strong>

        </div>


        {/* ==================================================
            TOTAL INTEREST
        ================================================== */}

        <div
          style={
            rowStyle
          }
        >

          <span
            style={
              labelStyle
            }
          >
            Total Interest
          </span>


          <strong
            style={
              valueStyle
            }
          >
            ₹ {formatCurrency(totalInterest)}
          </strong>

        </div>


        {/* ==================================================
            TOTAL PAYABLE
        ================================================== */}

        <div
          style={
            highlightRowStyle
          }
        >

          <span
            style={
              labelStyle
            }
          >
            Total Payable
          </span>


          <strong
            style={
              primaryValueStyle
            }
          >
            ₹ {formatCurrency(totalPayable)}
          </strong>

        </div>


        {/* ==================================================
            PROCESSING FEE
        ================================================== */}

        <div
          style={
            rowStyle
          }
        >

          <span
            style={
              labelStyle
            }
          >
            Processing Fee
          </span>


          <strong
            style={
              valueStyle
            }
          >
            ₹ {formatCurrency(processingFee)}
          </strong>

        </div>


        {/* ==================================================
            PENALTY
        ================================================== */}

        <div
          style={
            rowStyle
          }
        >

          <span
            style={
              labelStyle
            }
          >
            Penalty
          </span>


          <strong
            style={
              valueStyle
            }
          >
            ₹ {formatCurrency(penaltyValue)}
          </strong>

        </div>

      </div>

    </section>
  );
}


// ============================================================
// END
// ============================================================
