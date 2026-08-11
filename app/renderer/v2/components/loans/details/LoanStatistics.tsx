// ============================================================
// FINORA ENTERPRISE V2
//
// LOAN DETAILS STUDIO
// LOAN STATISTICS
//
// RESPONSIBILITY:
// - Loan KPI presentation only
// - Premium loan overview presentation
// - No business logic
// - No persistence
// - No common component styling changes
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  cardStyle,
  statisticsGridStyle,
  statisticItemStyle,
  primaryStatisticItemStyle,
  statisticLabelStyle,
  statisticValueStyle,
  primaryValueStyle,
} from "./LoanStatistics.styles";

// ============================================================
// TYPES
// ============================================================

interface LoanStatisticsProps {

  totalLoans?: number;

  activeLoans?: number;

  totalDisbursed?: number;
}

// ============================================================
// COMPONENT
// ============================================================

export default function LoanStatistics({

  totalLoans = 0,

  activeLoans = 0,

  totalDisbursed = 0,

}: LoanStatisticsProps) {

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
          marginBottom: "14px",
          gap: "12px",
        }}
      >

        <div>

          <div
            style={{
              fontSize: "13px",
              fontWeight: 750,
              color: "#FFFFFF",
              lineHeight: 1.2,
            }}
          >
            Loan Overview
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
            Current loan portfolio summary
          </div>

        </div>

      </div>

      {/* ==================================================
          KPI GRID
      ================================================== */}

      <div style={statisticsGridStyle}>

        {/* ==================================================
            TOTAL LOANS
        ================================================== */}

        <div
          style={primaryStatisticItemStyle}
        >

          <span
            style={statisticLabelStyle}
          >
            Total Loans
          </span>

          <strong
            style={primaryValueStyle}
          >
            {totalLoans}
          </strong>

          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#94A3B8",
            }}
          >
            All loan records
          </span>

        </div>

        {/* ==================================================
            ACTIVE LOANS
        ================================================== */}

        <div
          style={statisticItemStyle}
        >

          <span
            style={statisticLabelStyle}
          >
            Active Loans
          </span>

          <strong
            style={statisticValueStyle}
          >
            {activeLoans}
          </strong>

          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#94A3B8",
            }}
          >
            Currently running
          </span>

        </div>

        {/* ==================================================
            TOTAL DISBURSED
        ================================================== */}

        <div
          style={statisticItemStyle}
        >

          <span
            style={statisticLabelStyle}
          >
            Total Disbursed
          </span>

          <strong
            style={statisticValueStyle}
          >
            ₹ {totalDisbursed}
          </strong>

          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#94A3B8",
            }}
          >
            Disbursed amount
          </span>

        </div>

      </div>

    </section>

  );
}

// ============================================================
// END
// ============================================================
