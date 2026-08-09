/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER VALIDATION STATUS

   RESPONSIBILITY:
   - Customer validation status presentation
   - Identity status
   - Address status
   - KYC status
   - Nominee status

   BUSINESS LOGIC:
   - NONE

   STYLES:
   ValidationStatus.styles.ts
=========================================================== */

import {
  cardStyle,
  headerStyle,
  titleStyle,
  subtitleStyle,
  dividerStyle,
  rowStyle,
  labelStyle,
  statusCompleteStyle,
  statusPendingStyle,
} from "./ValidationStatus.styles";

/* ===========================================================
   TYPES
=========================================================== */

interface ValidationStatusProps {

  identityComplete?: boolean;

  addressComplete?: boolean;

  kycVerified?: boolean;

  nomineeAdded?: boolean;
}

/* ===========================================================
   STATUS ROW
=========================================================== */

function StatusRow({

  label,

  ok,

}: {

  label: string;

  ok?: boolean;

}) {

  return (

    <div style={rowStyle}>

      <span style={labelStyle}>
        {label}
      </span>

      <strong
        style={
          ok
            ? statusCompleteStyle
            : statusPendingStyle
        }
      >
        {ok
          ? "✓ Complete"
          : "● Pending"}
      </strong>

    </div>

  );

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ValidationStatus({

  identityComplete,

  addressComplete,

  kycVerified,

  nomineeAdded,

}: ValidationStatusProps) {

  return (

    <section style={cardStyle}>

      {/* =====================================================
         HEADER
      ===================================================== */}

      <div style={headerStyle}>

        <div>

          <h3 style={titleStyle}>
            Validation Status
          </h3>

          <p style={subtitleStyle}>
            Customer profile readiness before final confirmation.
          </p>

        </div>

      </div>

      {/* =====================================================
         DIVIDER
      ===================================================== */}

      <div style={dividerStyle} />

      {/* =====================================================
         VALIDATION ROWS
      ===================================================== */}

      <StatusRow
        label="Identity"
        ok={identityComplete}
      />

      <StatusRow
        label="Address"
        ok={addressComplete}
      />

      <StatusRow
        label="KYC"
        ok={kycVerified}
      />

      <StatusRow
        label="Nominee"
        ok={nomineeAdded}
      />

    </section>

  );

}
