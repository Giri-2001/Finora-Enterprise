/* ===========================================================
   FINORA ENTERPRISE V2
   NOMINEE DRAFT STATUS
--------------------------------------------------------------
Reusable Nominee Draft Status
=========================================================== */

import type { CSSProperties } from "react";

interface NomineeDraftStatusProps {

  isDraftSaved: boolean;

  lastSaved?: string;

}

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

  background: "#f3e8ff",

  color: "#7e22ce",

  fontWeight: 600,

};

const infoStyle: CSSProperties = {

  marginTop: "12px",

  color: "#6b7280",

  fontSize: "13px",

};

export default function NomineeDraftStatus({

  isDraftSaved,

  lastSaved,

}: NomineeDraftStatusProps) {

  return (

    <section style={wrapperStyle}>

      <div style={badgeStyle}>

        {isDraftSaved

          ? "✓ Nominee Saved"

          : "● Draft Pending"}

      </div>

      <div style={infoStyle}>

        {isDraftSaved

          ? "Nominee details have been saved."

          : "Nominee details are waiting to be saved."}

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
