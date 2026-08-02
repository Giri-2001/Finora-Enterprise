/* ===========================================================
   FINORA ENTERPRISE V2
   VALIDATION STATUS
--------------------------------------------------------------
Customer Validation Status
=========================================================== */

import type { CSSProperties } from "react";

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
   STYLES
=========================================================== */

const cardStyle: CSSProperties = {

  padding: "24px",

  borderRadius: "18px",

  border: "1px solid #e5e7eb",

  background: "#ffffff",

};

const titleStyle: CSSProperties = {

  margin: 0,

  marginBottom: "18px",

  fontSize: "20px",

  fontWeight: 700,

};

const rowStyle: CSSProperties = {

  display: "flex",

  justifyContent: "space-between",

  marginBottom: "12px",

  color: "#374151",

};

function StatusRow({

  label,

  ok,

}: {

  label: string;

  ok?: boolean;

}) {

  return (

    <div style={rowStyle}>

      <span>{label}</span>

      <strong>

        {ok ? "✅ Complete" : "⚠ Pending"}

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

      <h3 style={titleStyle}>

        Validation Status

      </h3>

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
