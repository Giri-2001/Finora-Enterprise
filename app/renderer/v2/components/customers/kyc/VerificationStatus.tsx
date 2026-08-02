/* ===========================================================
   FINORA ENTERPRISE V2
   VERIFICATION STATUS
--------------------------------------------------------------
Customer KYC Verification Status
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface VerificationStatusProps {

  verified?: boolean;

  verifiedBy?: string;

  verifiedOn?: string;

}

/* ===========================================================
   STYLES
=========================================================== */

const cardStyle: CSSProperties = {

  padding: "24px",

  border: "1px solid #e5e7eb",

  borderRadius: "18px",

  background: "#ffffff",

};

const headingStyle: CSSProperties = {

  margin: 0,

  marginBottom: "16px",

  fontSize: "20px",

  fontWeight: 700,

};

const statusStyle: CSSProperties = {

  fontWeight: 600,

  color: "#16a34a",

};

const infoStyle: CSSProperties = {

  marginTop: "10px",

  color: "#6b7280",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function VerificationStatus({

  verified,

  verifiedBy,

  verifiedOn,

}: VerificationStatusProps) {

  return (

    <section style={cardStyle}>

      <h3 style={headingStyle}>

        Verification Status

      </h3>

      <div style={statusStyle}>

        {verified ? "✅ Verified" : "⏳ Pending Verification"}

      </div>

      <div style={infoStyle}>

        Verified By : {verifiedBy || "--"}

      </div>

      <div style={infoStyle}>

        Verified On : {verifiedOn || "--"}

      </div>

    </section>

  );

}
