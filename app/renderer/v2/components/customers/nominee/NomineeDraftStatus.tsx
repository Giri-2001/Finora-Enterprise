/* ===========================================================
   FINORA ENTERPRISE OS™

   REUSABLE NOMINEE DRAFT STATUS

   RESPONSIBILITY:
   - Nominee draft state presentation
   - Saved / pending status
   - Last saved information

   PRESENTATION:
   - FINORA Enterprise brown / gold theme
   - Compact studio card
   - No module layout logic
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface NomineeDraftStatusProps {

  isDraftSaved: boolean;

  lastSaved?: string;
}

/* ===========================================================
   WRAPPER
=========================================================== */

const wrapperStyle: CSSProperties = {

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  padding: "14px 16px",

  borderRadius: "14px",

  border:
    "1px solid rgba(214,176,106,.42)",

  background:
    "linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.015))",

  boxShadow:
    "0 7px 18px rgba(0,0,0,.12)",

  overflow: "hidden",
};

/* ===========================================================
   BADGE
=========================================================== */

const badgeStyle: CSSProperties = {

  display: "inline-flex",

  alignItems: "center",

  gap: "6px",

  padding: "6px 11px",

  borderRadius: "999px",

  border:
    "1px solid rgba(214,176,106,.48)",

  background:
    "rgba(214,176,106,.10)",

  color: "#F0C75E",

  fontSize: "11px",

  lineHeight: 1.2,

  fontWeight: 800,

  letterSpacing: ".15px",

  whiteSpace: "nowrap",
};

/* ===========================================================
   INFO
=========================================================== */

const infoStyle: CSSProperties = {

  margin:
    "9px 0 0",

  color:
    "rgba(255,255,255,.55)",

  fontSize: "10px",

  lineHeight: 1.4,

  fontWeight: 500,
};

/* ===========================================================
   LAST SAVED
=========================================================== */

const lastSavedStyle: CSSProperties = {

  margin:
    "7px 0 0",

  color:
    "rgba(255,255,255,.38)",

  fontSize: "9px",

  lineHeight: 1.35,
};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function NomineeDraftStatus({

  isDraftSaved,

  lastSaved,

}: NomineeDraftStatusProps) {

  return (

    <section style={wrapperStyle}>

      {/* =====================================================
         STATUS BADGE
      ===================================================== */}

      <div style={badgeStyle}>

        {isDraftSaved
          ? "✓ Nominee Saved"
          : "• Draft Pending"}

      </div>

      {/* =====================================================
         STATUS INFORMATION
      ===================================================== */}

      <div style={infoStyle}>

        {isDraftSaved
          ? "Nominee details have been saved."
          : "Nominee details are waiting to be saved."}

      </div>

      {/* =====================================================
         LAST SAVED
      ===================================================== */}

      {lastSaved && (

        <div style={lastSavedStyle}>

          Last Saved : {lastSaved}

        </div>

      )}

    </section>
  );
}
