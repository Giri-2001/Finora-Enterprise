import type { CSSProperties } from "react";

const C = {
  page: "var(--finora-theme-background-page)",
  surface: "var(--finora-theme-background-surface)",
  mutedSurface:
    "var(--finora-theme-background-surface-muted)",
  text: "var(--finora-theme-text-primary)",
  secondary:
    "var(--finora-theme-text-secondary)",
  muted: "var(--finora-theme-text-muted)",
  border:
    "var(--finora-theme-border-default)",
  borderStrong:
    "var(--finora-theme-border-strong)",
  brand:
    "var(--finora-theme-brand-primary)",
  accentSoft:
    "var(--finora-theme-brand-accent-soft)",
  success:
    "var(--finora-theme-success)",
  successSoft:
    "var(--finora-theme-success-soft)",
};

export const pageStyle: CSSProperties = {
  width: "100%",
  minHeight: "100%",
  boxSizing: "border-box",
  padding: "24px",
  background: C.page,
  color: C.text,
};

export const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "18px",
};

export const headerLeftStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  minWidth: 0,
};

export const backButtonStyle: CSSProperties = {
  minHeight: "34px",
  padding: "0 11px",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: "7px",
  background: C.mutedSurface,
  color: C.secondary,
  fontSize: "10px",
  fontWeight: 700,
  cursor: "pointer",
};

export const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 800,
  color: C.text,
};

export const subtitleStyle: CSSProperties = {
  margin: "5px 0 0",
  fontSize: "11px",
  color: C.muted,
};

export const receiptBadgeStyle: CSSProperties = {
  padding: "6px 10px",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: "999px",
  background: C.accentSoft,
  color: C.brand,
  fontSize: "10px",
  fontWeight: 750,
};

export const contentGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0,1.25fr) minmax(0,0.75fr)",
  gap: "16px",
  alignItems: "start",
};

export const columnStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

export const sectionStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "16px",
  border: `1px solid ${C.border}`,
  borderRadius: "10px",
  background: C.surface,
};

export const sectionTitleStyle: CSSProperties = {
  margin: "0 0 13px",
  color: C.text,
  fontSize: "13px",
  fontWeight: 750,
};

export const infoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2,minmax(0,1fr))",
  gap: "10px",
};

export const infoItemStyle: CSSProperties = {
  minWidth: 0,
  padding: "10px",
  border: `1px solid ${C.border}`,
  borderRadius: "8px",
  background: C.mutedSurface,
};

export const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "5px",
  color: C.muted,
  fontSize: "9px",
  fontWeight: 650,
  textTransform: "uppercase",
};

export const valueStyle: CSSProperties = {
  color: C.text,
  fontSize: "11px",
  fontWeight: 650,
  overflowWrap: "anywhere",
};

export const amountValueStyle: CSSProperties = {
  ...valueStyle,
  fontSize: "15px",
  fontWeight: 800,
};

export const remarksStyle: CSSProperties = {
  minHeight: "70px",
  padding: "12px",
  boxSizing: "border-box",
  border: `1px solid ${C.border}`,
  borderRadius: "8px",
  background: C.mutedSurface,
  color: C.secondary,
  fontSize: "11px",
  lineHeight: 1.55,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

export const statusStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "24px",
  padding: "0 9px",
  border: `1px solid ${C.success}`,
  borderRadius: "999px",
  background: C.successSoft,
  color: C.success,
  fontSize: "9px",
  fontWeight: 750,
};

export const footerStyle: CSSProperties = {
  marginTop: "18px",
  display: "flex",
  justifyContent: "flex-start",
};

export const responsiveCss = `
  @media (max-width: 900px) {
    .finora-view-collection-grid {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 560px) {
    .finora-view-collection-page {
      padding: 14px !important;
    }

    .finora-view-collection-header {
      align-items: flex-start !important;
      flex-direction: column !important;
    }

    .finora-view-collection-info-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;