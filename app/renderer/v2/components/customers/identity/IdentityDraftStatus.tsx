/* ===========================================================
   FINORA ENTERPRISE V2
   IDENTITY DRAFT STATUS
--------------------------------------------------------------
Reusable Draft Status Component
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface IdentityDraftStatusProps {

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

  gap: "8px",

  padding: "8px 14px",

  borderRadius: "999px",

  background: "#dcfce7",

  color: "#166534",

  fontWeight: 600,

  fontSize: "14px",

};

const infoStyle: CSSProperties = {

  marginTop: "12px",

  color: "#6b7280",

  fontSize: "13px",

  lineHeight: 1.6,

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function IdentityDraftStatus({

  isDraftSaved,

  lastSaved,

}: IdentityDraftStatusProps) {

  return (

    <section style={wrapperStyle}>

      <div style={badgeStyle}>

        {isDraftSaved
          ? "✓ Draft Saved"
          : "● Draft Pending"}

      </div>

      <div style={infoStyle}>

        {isDraftSaved
          ? "Customer draft has been saved successfully."
          : "Changes are waiting to be saved."}

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
