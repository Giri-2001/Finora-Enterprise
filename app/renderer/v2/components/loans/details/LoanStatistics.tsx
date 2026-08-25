import {
  cardStyle,
  statisticsGridStyle,
  statisticItemStyle,
  statisticLabelStyle,
  statisticValueStyle,
} from "./LoanStatistics.styles";

interface LoanStatisticsProps {
  totalLoans?: number;
  activeLoans?: number;
  totalDisbursed?: number;
}

export default function LoanStatistics({
  totalLoans = 0,
  activeLoans = 0,
  totalDisbursed = 0,
}: LoanStatisticsProps) {
  return (
    <section style={cardStyle}>
      <div style={statisticsGridStyle}>

        {/* ============================================================
            TOTAL LOANS
        ============================================================ */}

        <div style={statisticItemStyle}>
          <span style={statisticLabelStyle}>
            Total Loans
          </span>

          <strong style={statisticValueStyle}>
            {totalLoans}
          </strong>

          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--finora-theme-text-muted, #94A3B8)",
              lineHeight: 1.1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            All loan records
          </span>
        </div>

        {/* ============================================================
            ACTIVE LOANS
        ============================================================ */}

        <div style={statisticItemStyle}>
          <span style={statisticLabelStyle}>
            Active Loans
          </span>

          <strong style={statisticValueStyle}>
            {activeLoans}
          </strong>

          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--finora-theme-text-muted, #94A3B8)",
              lineHeight: 1.1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Currently running
          </span>
        </div>

        {/* ============================================================
            TOTAL DISBURSED
        ============================================================ */}

        <div style={statisticItemStyle}>
          <span style={statisticLabelStyle}>
            Total Disbursed
          </span>

          <strong style={statisticValueStyle}>
            ₹ {totalDisbursed}
          </strong>

          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--finora-theme-text-muted, #94A3B8)",
              lineHeight: 1.1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Disbursed amount
          </span>
        </div>

      </div>
    </section>
  );
}