/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER NOMINEE SUMMARY

   RESPONSIBILITY:
   - Nominee summary presentation
   - Linked customer count presentation
   - Verification status presentation

   STYLES:
   NomineeSummaryCard.styles.ts
=========================================================== */

import type { CSSProperties } from "react";

import {
  cardStyle,
  headerStyle,
  titleStyle,
  subtitleStyle,
  dividerStyle,
  statsGridStyle,
  statStyle,
  statLabelStyle,
  statValueStyle,
  footerStyle,
} from "./NomineeSummaryCard.styles";

/* ===========================================================
   TYPES
=========================================================== */

interface NomineeSummaryCardProps {
  totalNominees?: number;

  linkedCustomers?: number;

  pendingVerification?: number;
}

/* ===========================================================
   STAT
=========================================================== */

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={statStyle}>

      <span style={statLabelStyle}>
        {label}
      </span>

      <span style={statValueStyle}>
        {value}
      </span>

    </div>
  );
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function NomineeSummaryCard({
  totalNominees = 0,
  linkedCustomers = 0,
  pendingVerification = 0,
}: NomineeSummaryCardProps) {

  return (
    <section style={cardStyle}>

      {/* =====================================================
         HEADER
      ===================================================== */}

      <div style={headerStyle}>

        <div>

          <h3 style={titleStyle}>
            Nominee Summary
          </h3>

          <p style={subtitleStyle}>
            Nominee relationship status at a glance.
          </p>

        </div>

      </div>

      {/* =====================================================
         DIVIDER
      ===================================================== */}

      <div style={dividerStyle} />

      {/* =====================================================
         SUMMARY STATS
      ===================================================== */}

      <div style={statsGridStyle}>

        <SummaryStat
          label="Total Nominees"
          value={totalNominees}
        />

        <SummaryStat
          label="Linked Customers"
          value={linkedCustomers}
        />

        <SummaryStat
          label="Pending Verification"
          value={pendingVerification}
        />

      </div>

      {/* =====================================================
         FOOTER
      ===================================================== */}

      <div style={footerStyle}>
        Verification and nominee analytics can be expanded in future releases.
      </div>

    </section>
  );
}
