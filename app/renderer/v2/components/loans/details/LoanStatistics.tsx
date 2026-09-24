import {
  cardStyle,
  statisticsGridStyle,
  statisticItemStyle,
  statisticLabelStyle,
  statisticValueStyle,
} from "./LoanStatistics.styles";

import { formatRupee } from "../../../utils/currency/formatCurrency";

interface LoanStatisticsProps {
  totalLoans?: number;
  activeLoans?: number;
  totalDisbursed?: number;
  singleColumn?: boolean;
}

export default function LoanStatistics({
  totalLoans = 0,
  activeLoans = 0,
  totalDisbursed = 0,
  singleColumn = false,
}: LoanStatisticsProps) {
  return (
    <section
      style={{
        ...cardStyle,
        ...(singleColumn
          ? {
              height: "auto",
              alignItems: "stretch",
            }
          : {}),
      }}
    >
      <div
        style={{
          ...statisticsGridStyle,
          ...(singleColumn
            ? {
                gridTemplateColumns: "minmax(0, 1fr)",
                height: "auto",
                minHeight: 0,
              }
            : {}),
        }}
      >

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
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--finora-theme-text-muted, #94A3B8)",
              lineHeight: 1.25,
              overflow: "visible",
              textOverflow: "clip",
              whiteSpace: "nowrap",
            }}
          >
            All Loan Records
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
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--finora-theme-text-muted, #94A3B8)",
              lineHeight: 1.25,
              overflow: "visible",
              textOverflow: "clip",
              whiteSpace: "nowrap",
            }}
          >
            Currently Running
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
            {formatRupee(totalDisbursed)}
          </strong>

          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--finora-theme-text-muted, #94A3B8)",
              lineHeight: 1.25,
              overflow: "visible",
              textOverflow: "clip",
              whiteSpace: "nowrap",
            }}
          >
            Disbursed Amount
          </span>
        </div>

      </div>
    </section>
  );
}
