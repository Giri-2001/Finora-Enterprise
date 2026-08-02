/* ===========================================================
   FINORA ENTERPRISE V2
   STUDIO DRAFT STATUS
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface StudioDraftStatusProps {

  title: string;

  status: "Draft" | "Completed";

  updatedAt?: string;

}

/* ===========================================================
   STYLES
=========================================================== */

const wrapperStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "8px",

  padding: "18px",

  border: "1px solid #e5e7eb",

  borderRadius: "16px",

  background: "#ffffff",

};

const titleStyle: CSSProperties = {

  fontSize: "16px",

  fontWeight: 700,

  color: "#111827",

};

const badgeStyle = (status: "Draft" | "Completed"): CSSProperties => ({

  display: "inline-flex",

  alignSelf: "flex-start",

  padding: "6px 12px",

  borderRadius: "999px",

  fontSize: "12px",

  fontWeight: 600,

  background:

    status === "Completed"

      ? "#dcfce7"

      : "#fef3c7",

  color:

    status === "Completed"

      ? "#166534"

      : "#92400e",

});

const infoStyle: CSSProperties = {

  fontSize: "13px",

  color: "#6b7280",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function StudioDraftStatus({

  title,

  status,

  updatedAt,

}: StudioDraftStatusProps) {

  return (

    <section style={wrapperStyle}>

      <div style={titleStyle}>

        {title}

      </div>

      <div style={badgeStyle(status)}>

        {status}

      </div>

      <div style={infoStyle}>

        Last Updated: {updatedAt ?? "Not Saved"}

      </div>

    </section>

  );

}
