/* ===========================================================
   FINORA ENTERPRISE V2
   KYC DRAFT STATUS
--------------------------------------------------------------
Reusable KYC Draft Status
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface KYCDraftStatusProps {

  isDraftSaved: boolean;

  lastSaved?: string;

}

/* ===========================================================
   STYLES
=========================================================== */

const wrapperStyle: CSSProperties = {

  marginTop: "24px",

  padding: "18px",

  borderRadius: "14px",

  border: "1px solid #d1d5db",

  background: "#f9fafb",

};

const badgeStyle: CSSProperties = {

  display: "inline-flex",

  alignItems: "center",

  padding: "8px 14px",

  borderRadius: "999px",

  background: "#dbeafe",

  color: "#1d4ed8",

  fontWeight: 600,

};

const infoStyle: CSSProperties = {

  marginTop: "12px",

  color: "#6b7280",

  fontSize: "13px",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function KYCDraftStatus({

  isDraftSaved,

  lastSaved,

}: KYCDraftStatusProps) {

  return (

    <section style={wrapperStyle}>

      <div style={badgeStyle}>

        {isDraftSaved
          ? "✓ KYC Saved"
          : "● Draft Pending"}

      </div>

      <div style={infoStyle}>

        {isDraftSaved
          ? "Customer KYC details have been saved."
          : "Customer KYC details are waiting to be saved."}

      </div>

      {lastSaved && (

        <div
          style={{
            marginTop: "10px",
            fontSize: "12px",
            color: "#9ca3af",
          }}
        >
          Last Saved : {lastSaved}
        </div>

      )}

    </section>

  );

}
