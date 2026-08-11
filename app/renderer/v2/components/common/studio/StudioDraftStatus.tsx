// ============================================================
// FINORA ENTERPRISE V2
//
// STUDIO DRAFT STATUS
//
// RESPONSIBILITY:
// - Display studio draft / completion state
// - Display last updated information
// - Presentation only
//
// IMPORTANT:
// - No business logic
// - No persistence
// - No storage access
// - Existing props API preserved
//
// DESIGN:
// - FINORA Enterprise dark navy
// - Primary Blue accent
// - Premium compact presentation
// - No white-card / white-text contrast issue
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// TYPES
// ============================================================

export interface StudioDraftStatusProps {

  title: string;

  status: "Draft" | "Completed";

  updatedAt?: string;

}

// ============================================================
// COLOR TOKENS
// ============================================================

const COLORS = {

  panel: "#111C2E",

  panelSoft: "#142238",

  border: "rgba(148, 163, 184, 0.20)",

  primary: "#2563EB",

  text: "#FFFFFF",

  textSoft: "#CBD5E1",

  completedBackground: "rgba(34, 197, 94, 0.14)",

  completedText: "#86EFAC",

  draftBackground: "rgba(245, 158, 11, 0.14)",

  draftText: "#FCD34D",

};

// ============================================================
// STYLES
// ============================================================

const wrapperStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "8px",

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  padding: "18px",

  border:
    `1px solid ${COLORS.border}`,

  borderRadius: "16px",

  background:
    `linear-gradient(180deg, ${COLORS.panel}, ${COLORS.panelSoft})`,

  color: COLORS.text,

  boxShadow:
    "0 8px 24px rgba(0, 0, 0, 0.14)",

};

const titleStyle: CSSProperties = {

  paddingLeft: "10px",

  borderLeft:
    `3px solid ${COLORS.primary}`,

  fontSize: "16px",

  fontWeight: 700,

  lineHeight: 1.25,

  color: COLORS.text,

};

const badgeStyle = (
  status: "Draft" | "Completed",
): CSSProperties => ({

  display: "inline-flex",

  alignSelf: "flex-start",

  padding: "6px 12px",

  borderRadius: "999px",

  fontSize: "12px",

  fontWeight: 700,

  background:
    status === "Completed"
      ? COLORS.completedBackground
      : COLORS.draftBackground,

  color:
    status === "Completed"
      ? COLORS.completedText
      : COLORS.draftText,

  border:
    `1px solid ${
      status === "Completed"
        ? "rgba(34, 197, 94, 0.30)"
        : "rgba(245, 158, 11, 0.30)"
    }`,

});

const infoStyle: CSSProperties = {

  fontSize: "13px",

  fontWeight: 500,

  lineHeight: 1.4,

  color: COLORS.textSoft,

};

// ============================================================
// COMPONENT
// ============================================================

export default function StudioDraftStatus({

  title,

  status,

  updatedAt,

}: StudioDraftStatusProps) {

  return (

    <section
      style={wrapperStyle}
    >

      <div
        style={titleStyle}
      >

        {title}

      </div>

      <div
        style={badgeStyle(status)}
      >

        {status}

      </div>

      <div
        style={infoStyle}
      >

        Last Updated: {updatedAt ?? "Not Saved"}

      </div>

    </section>

  );

}

// ============================================================
// END
// ============================================================
