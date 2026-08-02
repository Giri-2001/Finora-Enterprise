/* ===========================================================
   FINORA ENTERPRISE V2
   BASIC DRAFT STATUS
--------------------------------------------------------------
Reusable Draft Status Component
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface BasicDraftStatusProps {

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

export default function BasicDraftStatus({

  isDraftSaved,

  lastSaved,

}: BasicDraftStatusProps) {

  return (

    <section style={wrapperStyle}>

      <div style={badgeStyle}>

        {isDraftSaved

          ? "✓ Basic Details Saved"

          : "● Draft Pending"}

      </div>

      <div style={infoStyle}>

        {isDraftSaved

          ? "Customer basic information has been saved."

          : "Customer basic information is waiting to be saved."}

      </div>

      {lastSaved && (

        <div
          style={{
            marginTop: "10px",
            color: "#9ca3af",
            fontSize: "12px",
          }}
        >
          Last Saved : {lastSaved}
        </div>

      )}

    </section>

  );

}
