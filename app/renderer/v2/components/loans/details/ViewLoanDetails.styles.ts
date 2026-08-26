// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 LOANS OFFICE™
// VIEW LOAN DETAILS
//
// STYLES
//
// RESPONSIBILITY:
// - View Loan Details presentation styling
// - Read-only enterprise loan workspace
// - Loan document evidence gallery
// - Loan document viewer
//
// IMPORTANT:
// - No business logic
// - No calculations
// - No persistence
// - No repository access
// - No Loan Studio styling modification
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// COLORS
// ============================================================

export const COLORS = {
  background:
    "var(--finora-theme-background-page, #0B1220)",

  panel:
    "var(--finora-theme-background-surface, #111C2E)",

  panelSoft:
    "var(--finora-theme-background-surface-muted, #142238)",

  panelHover:
    "var(--finora-theme-surface-strong, #182A43)",

  border:
    "var(--finora-theme-border-default, rgba(148,163,184,0.18))",

  borderStrong:
    "var(--finora-theme-border-strong, rgba(148,163,184,0.28))",

  primary:
    "var(--finora-theme-brand-primary, #2563EB)",

  primarySoft:
    "var(--finora-theme-brand-accent-soft, rgba(37,99,235,0.12))",

  primaryBorder:
    "var(--finora-theme-border-strong, rgba(37,99,235,0.35))",

  text:
    "var(--finora-theme-text-primary, #FFFFFF)",

  textSecondary:
    "var(--finora-theme-text-secondary, #CBD5E1)",

  textMuted:
    "var(--finora-theme-text-muted, #94A3B8)",

  textDim:
    "var(--finora-theme-text-muted, #64748B)",

  success:
    "var(--finora-theme-success, #22C55E)",

  successSoft:
    "var(--finora-theme-success-soft, rgba(34,197,94,0.10))",

  warning:
    "var(--finora-theme-warning, #F59E0B)",

  warningSoft:
    "var(--finora-theme-warning-soft, rgba(245,158,11,0.10))",

  danger:
    "var(--finora-theme-danger, #EF4444)",

  dangerSoft:
    "var(--finora-theme-danger-soft, rgba(239,68,68,0.10))",

  info:
    "var(--finora-theme-info, #60A5FA)",

  infoSoft:
    "var(--finora-theme-info-soft, rgba(96,165,250,0.10))",

  overlayShadow:
    "var(--finora-theme-overlay-shadow, rgba(0,0,0,0.24))",

  overlayBackdrop:
    "var(--finora-theme-overlay-backdrop, rgba(2,6,23,0.84))",
} as const;

// ============================================================
// PAGE
// ============================================================

export const pageStyle: CSSProperties = {
  width: "100%",

  minHeight: "100%",

  boxSizing: "border-box",

  padding: "20px",

  background: COLORS.background,

  color: COLORS.text,

  display: "flex",

  flexDirection: "column",

  gap: "16px",
};

// ============================================================
// HEADER
// ============================================================

export const headerStyle: CSSProperties = {
  width: "100%",

  minHeight: "68px",

  boxSizing: "border-box",

  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  gap: "16px",

  padding: "14px 18px",

  border: `1px solid ${COLORS.border}`,

  borderRadius: "14px",

  background: `linear-gradient(180deg, ${COLORS.panel}, ${COLORS.panelSoft})`,

  boxShadow: `0 8px 24px ${COLORS.overlayShadow}`,
};

export const headerLeftStyle: CSSProperties = {
  minWidth: 0,

  display: "flex",

  alignItems: "center",

  gap: "12px",
};

export const backButtonStyle: CSSProperties = {
  minWidth: "78px",

  height: "34px",

  padding: "0 12px",

  border: `1px solid ${COLORS.borderStrong}`,

  borderRadius: "8px",

  background: COLORS.panelSoft,

  color: COLORS.textSecondary,

  fontSize: "12px",

  fontWeight: 700,

  cursor: "pointer",
};

export const headerAccentStyle: CSSProperties = {
  width: "3px",

  height: "38px",

  flexShrink: 0,

  borderRadius: "3px",

  background: COLORS.primary,

  boxShadow: `0 0 12px ${COLORS.primary}`,
};

export const titleGroupStyle: CSSProperties = {
  minWidth: 0,

  display: "flex",

  flexDirection: "column",

  gap: "3px",
};

export const titleStyle: CSSProperties = {
  margin: 0,

  color: COLORS.text,

  fontSize: "18px",

  fontWeight: 800,

  lineHeight: 1.2,
};

export const subtitleStyle: CSSProperties = {
  margin: 0,

  color: COLORS.textMuted,

  fontSize: "11px",

  fontWeight: 500,

  lineHeight: 1.3,
};

export const headerMetaStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  gap: "8px",

  flexShrink: 0,
};

export const loanNumberBadgeStyle: CSSProperties = {
  padding: "7px 10px",

  border: `1px solid var(--finora-theme-brand-primary)`,

  borderRadius: "7px",

  background: COLORS.panelSoft,

  color: COLORS.textSecondary,

  fontSize: "11px",

  fontWeight: 750,

  whiteSpace: "nowrap",
};

// ============================================================
// STATUS
// ============================================================

export function statusBadgeStyle(status: string): CSSProperties {
  const normalized = status.trim().toUpperCase();

  if (normalized === "CLOSED") {
    return {
      padding: "6px 10px",

      border: "1px solid var(--finora-theme-success)",

      borderRadius: "999px",

      background: COLORS.panelSoft,

  color: COLORS.textSecondary,

      fontSize: "11px",

      fontWeight: 750,

      whiteSpace: "nowrap",
    };
  }

  if (normalized === "ACTIVE" || normalized === "RUNNING") {
    return {
      padding: "6px 10px",

      border: "1px solid var(--finora-theme-brand-primary)",

      borderRadius: "999px",

      background: COLORS.panelSoft,

  color: COLORS.textSecondary,

      fontSize: "11px",

      fontWeight: 750,

      whiteSpace: "nowrap",
    };
  }

  return {
    padding: "6px 10px",

    border: "1px solid var(--finora-theme-warning)",

    borderRadius: "999px",

    background: "var(--finora-theme-warning-soft)",

    color: "var(--finora-theme-warning)",

    fontSize: "11px",

    fontWeight: 750,

    whiteSpace: "nowrap",
  };
}
// ============================================================
// GRID
// ============================================================

export const contentGridStyle: CSSProperties = {
  width: "100%",

  display: "grid",

  gridTemplateColumns: "minmax(0, 1.35fr) minmax(320px, 0.65fr)",

  gap: "16px",

  alignItems: "start",
};

// ============================================================
// SECTION
// ============================================================

export const sectionStyle: CSSProperties = {
  minWidth: 0,

  boxSizing: "border-box",

  padding: "16px",

  border: `1px solid ${COLORS.border}`,

  borderRadius: "14px",

  background: `linear-gradient(180deg, ${COLORS.panel}, ${COLORS.panelSoft})`,

  boxShadow: `0 7px 20px ${COLORS.overlayShadow}`,
};

export const fullWidthSectionStyle: CSSProperties = {
  ...sectionStyle,

  width: "100%",
};

export const sectionHeaderStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  gap: "12px",

  marginBottom: "12px",
};

export const sectionTitleStyle: CSSProperties = {
  margin: 0,

  color: COLORS.text,

  fontSize: "13px",

  fontWeight: 750,
};

export const sectionSubtitleStyle: CSSProperties = {
  margin: "3px 0 0",

  color: COLORS.textMuted,

  fontSize: "10px",

  fontWeight: 500,
};

// ============================================================
// INFORMATION GRID
// ============================================================

export const infoGridStyle: CSSProperties = {
  display: "grid",

  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

  gap: "8px",
};

export const infoItemStyle: CSSProperties = {
  minWidth: 0,

  padding: "10px",

  border: `1px solid ${COLORS.border}`,

  borderRadius: "9px",

  background: COLORS.panelSoft,
};

export const infoLabelStyle: CSSProperties = {
  display: "block",

  marginBottom: "4px",

  color: COLORS.textMuted,

  fontSize: "10px",

  fontWeight: 550,
};

export const infoValueStyle: CSSProperties = {
  display: "block",

  color: COLORS.textSecondary,

  fontSize: "12px",

  fontWeight: 700,

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",
};

export const customerNameValueStyle: CSSProperties = {
  ...infoValueStyle,

  color: COLORS.text,

  fontSize: "13px",
};

// ============================================================
// FINANCIAL
// ============================================================

export const financialGridStyle: CSSProperties = {
  display: "grid",

  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

  gap: "8px",
};

export const financialCardStyle: CSSProperties = {
  minWidth: 0,

  padding: "12px",

  border: `1px solid ${COLORS.border}`,

  borderRadius: "9px",

  background: COLORS.panelSoft,
};

export const financialLabelStyle: CSSProperties = {
  display: "block",

  marginBottom: "5px",

  color: COLORS.textMuted,

  fontSize: "10px",

  fontWeight: 550,
};

export const financialValueStyle: CSSProperties = {
  display: "block",

  color: COLORS.text,

  fontSize: "14px",

  fontWeight: 800,
};

export const primaryFinancialCardStyle: CSSProperties = {
  ...financialCardStyle,

  border: `1px solid ${COLORS.primaryBorder}`,

  background: COLORS.primarySoft,
};

export const outstandingFinancialCardStyle: CSSProperties = {
  ...financialCardStyle,

  border: `1px solid ${COLORS.warning}`,

  background: COLORS.panelSoft,
};

// ============================================================
// TEXT BLOCKS
// ============================================================

export const textBlockStyle: CSSProperties = {
  minHeight: "54px",

  padding: "10px",

  border: `1px solid ${COLORS.border}`,

  borderRadius: "9px",

  background: COLORS.panelSoft,

  color: COLORS.textSecondary,

  fontSize: "11px",

  fontWeight: 500,

  lineHeight: 1.5,

  whiteSpace: "pre-wrap",

  overflowWrap: "anywhere",
};

// ============================================================
// DOCUMENT GALLERY
// ============================================================

export const documentGalleryGridStyle: CSSProperties = {
  display: "grid",

  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

  gap: "10px",

  width: "100%",
};

export const documentCardStyle: CSSProperties = {
  minWidth: 0,

  overflow: "hidden",

  border: `1px solid ${COLORS.border}`,

  borderRadius: "10px",

  background: COLORS.panelSoft,

  transition: "border-color 160ms ease, background 160ms ease",
};

export const documentPreviewStyle: CSSProperties = {
  width: "100%",

  height: "150px",

  padding: 0,

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  border: "none",

  background: COLORS.panelSoft,

  cursor: "pointer",

  overflow: "hidden",
};

export const documentImageStyle: CSSProperties = {
  width: "100%",

  height: "100%",

  display: "block",

  objectFit: "cover",
};

export const documentPdfPreviewStyle: CSSProperties = {
  width: "100%",

  height: "100%",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  background:
    `linear-gradient(145deg, ${COLORS.primarySoft}, ${COLORS.panel})`,
};

export const documentPdfIconStyle: CSSProperties = {
  width: "54px",

  height: "54px",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  border: `1px solid ${COLORS.info}`,

  borderRadius: "12px",

  background: COLORS.primarySoft,

  color: COLORS.info,

  fontSize: "12px",

  fontWeight: 800,

  letterSpacing: "0.04em",
};

export const documentInfoStyle: CSSProperties = {
  minWidth: 0,

  padding: "9px",

  display: "grid",

  gridTemplateColumns: "minmax(0, 1fr) auto",

  gap: "3px 8px",

  alignItems: "center",
};

export const documentNameStyle: CSSProperties = {
  minWidth: 0,

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

  color: COLORS.text,

  fontSize: "11px",

  fontWeight: 700,
};

export const documentTypeStyle: CSSProperties = {
  color: COLORS.textMuted,

  fontSize: "9px",

  fontWeight: 600,

  textTransform: "uppercase",

  letterSpacing: "0.04em",
};

export const documentEmptyStyle: CSSProperties = {
  minHeight: "90px",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  padding: "18px",

  border: `1px dashed ${COLORS.border}`,

  borderRadius: "10px",

  background: COLORS.panelSoft,

  color: COLORS.textMuted,

  fontSize: "11px",

  textAlign: "center",
};

export const documentOpenButtonStyle: CSSProperties = {
  gridColumn: "2",

  gridRow: "1 / span 2",

  minHeight: "28px",

  padding: "0 9px",

  border: `1px solid ${COLORS.primaryBorder}`,

  borderRadius: "6px",

  background: COLORS.primarySoft,

  color: COLORS.info,

  fontSize: "9px",

  fontWeight: 750,

  cursor: "pointer",

  whiteSpace: "nowrap",
};

export const documentCountBadgeStyle: CSSProperties = {
  flexShrink: 0,

  padding: "5px 8px",

  border: `1px solid ${COLORS.primaryBorder}`,

  borderRadius: "999px",

  background: COLORS.primarySoft,

  color: COLORS.info,

  fontSize: "9px",

  fontWeight: 750,

  whiteSpace: "nowrap",
};

// ============================================================
// DOCUMENT VIEWER
// ============================================================

export const documentViewerBackdropStyle: CSSProperties = {
  position: "fixed",

  inset: 0,

  zIndex: 9999,

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  padding: "24px",

  background: COLORS.overlayBackdrop,

  backdropFilter: "blur(6px)",
};

export const documentViewerStyle: CSSProperties = {
  width: "min(1100px, 100%)",

  height: "min(820px, 92vh)",

  display: "flex",

  flexDirection: "column",

  overflow: "hidden",

  border: `1px solid ${COLORS.borderStrong}`,

  borderRadius: "14px",

  background: COLORS.panel,

  boxShadow: `0 24px 70px ${COLORS.overlayShadow}`,
};

export const documentViewerHeaderStyle: CSSProperties = {
  minHeight: "52px",

  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  gap: "12px",

  padding: "0 14px",

  borderBottom: `1px solid ${COLORS.border}`,

  background: COLORS.panelSoft,
};

export const documentViewerTitleStyle: CSSProperties = {
  minWidth: 0,

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

  color: COLORS.text,

  fontSize: "12px",

  fontWeight: 750,
};

export const documentViewerCloseStyle: CSSProperties = {
  width: "32px",

  height: "32px",

  flexShrink: 0,

  border: `1px solid ${COLORS.borderStrong}`,

  borderRadius: "8px",

  background: COLORS.panelSoft,

  color: COLORS.textSecondary,

  fontSize: "22px",

  lineHeight: 1,

  cursor: "pointer",
};

export const documentViewerBodyStyle: CSSProperties = {
  flex: 1,

  minHeight: 0,

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  overflow: "auto",

  padding: "18px",

  background: COLORS.background,
};

export const documentViewerImageStyle: CSSProperties = {
  maxWidth: "100%",

  maxHeight: "100%",

  width: "auto",

  height: "auto",

  objectFit: "contain",

  display: "block",

  borderRadius: "6px",

  boxShadow: `0 12px 40px ${COLORS.overlayShadow}`,
};

export const documentViewerPdfStyle: CSSProperties = {
  color: COLORS.textMuted,

  fontSize: "12px",

  textAlign: "center",
};

// ============================================================
// SCHEDULE
// ============================================================

export const scheduleWrapperStyle: CSSProperties = {
  width: "100%",

  overflowX: "auto",

  border: `1px solid ${COLORS.border}`,

  borderRadius: "9px",
};

export const scheduleHeaderStyle: CSSProperties = {
  display: "grid",

  gridTemplateColumns: "70px minmax(130px, 1fr) repeat(4, minmax(110px, 1fr))",

  minWidth: "720px",

  padding: "9px 10px",

  borderBottom: `1px solid ${COLORS.border}`,

  background: COLORS.panelSoft,
};

export const scheduleHeaderCellStyle: CSSProperties = {
  color: COLORS.textMuted,

  fontSize: "9px",

  fontWeight: 700,

  textTransform: "uppercase",

  letterSpacing: "0.03em",
};

export const scheduleRowStyle: CSSProperties = {
  display: "grid",

  gridTemplateColumns: "70px minmax(130px, 1fr) repeat(4, minmax(110px, 1fr))",

  minWidth: "720px",

  padding: "9px 10px",

  borderBottom: `1px solid ${COLORS.border}`,
};

export const scheduleCellStyle: CSSProperties = {
  color: COLORS.textSecondary,

  fontSize: "10px",

  fontWeight: 600,
};

export const scheduleEmptyStyle: CSSProperties = {
  padding: "18px",

  textAlign: "center",

  color: COLORS.textMuted,

  fontSize: "11px",
};

// ============================================================
// FOOTER
// ============================================================

export const footerStyle: CSSProperties = {
  display: "flex",

  justifyContent: "flex-end",

  alignItems: "center",

  padding: "4px 0",
};

export const footerBackButtonStyle: CSSProperties = {
  minHeight: "36px",

  padding: "0 16px",

  border: `1px solid ${COLORS.primaryBorder}`,

  borderRadius: "8px",

  background: COLORS.panelSoft,

  color: COLORS.textSecondary,

  fontSize: "12px",

  fontWeight: 750,

  cursor: "pointer",

};

// ============================================================
// RESPONSIVE
// ============================================================

export const responsiveMediaQuery = `
  .finora-view-loan-column {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .finora-view-loan-text-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  @media (max-width: 1100px) {
    .finora-view-loan-content-grid {
      grid-template-columns: 1fr !important;
    }

    .finora-loan-document-gallery {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .finora-view-loan-content-grid {
      gap: 12px !important;
    }

    .finora-view-loan-text-grid {
      grid-template-columns: 1fr;
    }

    .finora-view-loan-info-grid {
      grid-template-columns: 1fr !important;
    }

    .finora-view-loan-financial-grid {
      grid-template-columns: 1fr !important;
    }

    .finora-loan-document-gallery {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .finora-view-loan-header-meta {
      flex-wrap: wrap;
      justify-content: flex-end;
    }
  }

  @media (max-width: 480px) {
    .finora-loan-document-gallery {
      grid-template-columns: 1fr;
    }
  }
`;

// ============================================================
// END
// ============================================================