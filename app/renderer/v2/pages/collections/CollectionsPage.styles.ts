// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTIONS OFFICE™
//
// STYLES
//
// RESPONSIBILITY:
//
// - Collections Office presentation
// - Portfolio statistics
// - Collection filters
// - Collection transaction table
// - Existing Collection Studio entry wrapper
// - Responsive presentation
//
// IMPORTANT:
//
// - No business logic.
// - No repository access.
// - No service access.
// - No persistence.
// - Visual values only.
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

import type {
  CSSProperties,
} from "react";

/* ============================================================
   COLORS
============================================================ */

const COLORS = {
  page:
    "var(--finora-theme-background-page, #0B1220)",

  surface:
    "var(--finora-theme-background-surface, #111C2E)",

  surfaceMuted:
    "var(--finora-theme-background-surface-muted, #142238)",

  surfaceStrong:
    "var(--finora-theme-surface-strong, #182A43)",

  text:
    "var(--finora-theme-text-primary, #FFFFFF)",

  textSecondary:
    "var(--finora-theme-text-secondary, #CBD5E1)",

  textMuted:
    "var(--finora-theme-text-muted, #94A3B8)",

  textInverse:
    "var(--finora-theme-text-inverse, #FFFFFF)",

  border:
    "var(--finora-theme-border-default, rgba(148,163,184,0.18))",

  borderStrong:
    "var(--finora-theme-border-strong, rgba(148,163,184,0.28))",

  borderSubtle:
    "var(--finora-theme-border-subtle, rgba(148,163,184,0.10))",

  brand:
    "var(--finora-theme-brand-primary, #C99700)",

  accent:
    "var(--finora-theme-brand-accent, #C99700)",

  accentSoft:
    "var(--finora-theme-brand-accent-soft, rgba(201,151,0,0.12))",

  success:
    "var(--finora-theme-success, #22C55E)",

  successSoft:
    "var(--finora-theme-success-soft, rgba(34,197,94,0.10))",

  warning:
    "var(--finora-theme-warning, #F59E0B)",

  warningSoft:
    "var(--finora-theme-warning-soft, rgba(245,158,11,0.10))",

  info:
    "var(--finora-theme-info, #60A5FA)",

  infoSoft:
    "var(--finora-theme-info-soft, rgba(96,165,250,0.10))",

  shadow:
    "var(--finora-theme-overlay-shadow, rgba(0,0,0,0.20))",
} as const;

/* ============================================================
   PAGE
============================================================ */

export const pageStyle:
  CSSProperties = {
  width: "100%",

  minWidth: 0,

  minHeight: "100%",

  boxSizing: "border-box",

  padding: "24px",

  display: "flex",

  flexDirection: "column",

  gap: "16px",

  background:
    COLORS.page,

  color:
    COLORS.text,
};

/* ============================================================
   TOP BAR
============================================================ */

export const topBarStyle:
  CSSProperties = {
  width: "100%",

  minWidth: 0,

  display: "flex",

  alignItems: "flex-start",

  justifyContent:
    "space-between",

  gap: "20px",

  boxSizing: "border-box",
};

export const headingGroupStyle:
  CSSProperties = {
  minWidth: 0,

  display: "flex",

  flexDirection: "column",

  gap: "5px",
};

export const pageTitleStyle:
  CSSProperties = {
  margin: 0,

  color:
    COLORS.text,

  fontSize: "24px",

  fontWeight: 800,

  lineHeight: 1.2,
};

export const pageSubtitleStyle:
  CSSProperties = {
  margin: 0,

  color:
    COLORS.textMuted,

  fontSize: "12px",

  fontWeight: 500,

  lineHeight: 1.4,
};

export const createButtonStyle:
  CSSProperties = {
  minHeight: "42px",

  padding:
    "0 18px",

  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  gap: "7px",

  flexShrink: 0,

  border:
    `1px solid ${COLORS.accent}`,

  borderRadius: "9px",

  background:
    COLORS.brand,

  color:
    COLORS.textInverse,

  fontSize: "12px",

  fontWeight: 800,

  cursor: "pointer",

  boxShadow:
    `0 8px 20px ${COLORS.shadow}`,

  whiteSpace: "nowrap",
};

/* ============================================================
   COLLECTION STUDIO WRAPPER
============================================================ */

export const studioWorkspaceStyle:
  CSSProperties = {
  width: "100%",

  minWidth: 0,

  minHeight: "100%",

  boxSizing: "border-box",

  background:
    COLORS.page,

  color:
    COLORS.text,
};

export const studioBackBarStyle:
  CSSProperties = {
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  padding:
    "14px 18px 0",

  display: "flex",

  justifyContent:
    "flex-start",
};

export const studioBackButtonStyle:
  CSSProperties = {
  minHeight: "34px",

  padding:
    "0 12px",

  border:
    `1px solid ${COLORS.borderStrong}`,

  borderRadius: "8px",

  background:
    COLORS.surfaceMuted,

  color:
    COLORS.textSecondary,

  fontSize: "11px",

  fontWeight: 750,

  cursor: "pointer",
};

/* ============================================================
   STATISTICS
============================================================ */

export const statisticsGridStyle:
  CSSProperties = {
  width: "100%",

  minWidth: 0,

  display: "grid",

  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",

  gap: "16px",
};

export const statisticCardStyle:
  CSSProperties = {
  minWidth: 0,

  minHeight: "84px",

  boxSizing: "border-box",

  padding: "16px",

  display: "flex",

  flexDirection: "column",

  justifyContent: "center",

  gap: "8px",

  border:
    `1px solid ${COLORS.border}`,

  borderRadius: "11px",

  background:
    COLORS.surface,

  boxShadow: "none",
};

export const statisticLabelStyle:
  CSSProperties = {
  color:
    COLORS.textMuted,

  fontSize: "11px",

  fontWeight: 650,
};

export const statisticValueStyle:
  CSSProperties = {
  color:
    COLORS.text,

  fontSize: "20px",

  fontWeight: 800,

  lineHeight: 1.1,
};

/* ============================================================
   PORTFOLIO
============================================================ */

export const portfolioStyle:
  CSSProperties = {
  width: "100%",

  minWidth: 0,

  overflow: "hidden",

  border:
    `1px solid ${COLORS.border}`,

  borderRadius: "12px",

  background:
    COLORS.surface,
};

export const portfolioHeaderStyle:
  CSSProperties = {
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  padding:
    "12px 14px",

  display: "flex",

  alignItems: "center",

  justifyContent:
    "space-between",

  gap: "16px",

  borderBottom:
    `1px solid ${COLORS.border}`,

  background:
    COLORS.surface,
};

export const portfolioTitleStyle:
  CSSProperties = {
  minWidth: 0,

  display: "flex",

  alignItems: "center",

  gap: "8px",

  color:
    COLORS.text,

  fontSize: "12px",

  fontWeight: 800,

  whiteSpace: "nowrap",
};

export const portfolioActionsStyle:
  CSSProperties = {
  minWidth: 0,

  display: "flex",

  alignItems: "flex-end",

  justifyContent:
    "flex-end",

  gap: "8px",

  flexWrap: "wrap",
};

/* ============================================================
   FILTERS
============================================================ */

export const filtersStyle:
  CSSProperties = {
  minWidth: 0,

  display: "flex",

  alignItems: "flex-end",

  gap: "8px",

  flexWrap: "wrap",
};

export const filterFieldStyle:
  CSSProperties = {
  minWidth: 0,

  display: "flex",

  alignItems: "center",

  gap: "6px",
};

export const filterLabelStyle:
  CSSProperties = {
  color:
    COLORS.textMuted,

  fontSize: "9px",

  fontWeight: 650,

  whiteSpace: "nowrap",
};

const filterControlBaseStyle:
  CSSProperties = {
  height: "32px",

  boxSizing: "border-box",

  border:
    `1px solid ${COLORS.border}`,

  borderRadius: "7px",

  background:
    COLORS.surface,

  color:
    COLORS.text,

  fontSize: "10px",

  fontWeight: 600,

  outline: "none",
};

export const filterSelectStyle:
  CSSProperties = {
  ...filterControlBaseStyle,

  minWidth: "92px",

  padding:
    "0 28px 0 9px",
};

export const filterDateInputStyle:
  CSSProperties = {
  ...filterControlBaseStyle,

  width: "136px",

  padding:
    "0 8px",
};

export const filterActionsStyle:
  CSSProperties = {
  display: "flex",

  alignItems: "center",

  gap: "6px",
};

export const clearFilterButtonStyle:
  CSSProperties = {
  minHeight: "32px",

  padding:
    "0 10px",

  border:
    `1px solid ${COLORS.border}`,

  borderRadius: "7px",

  background:
    COLORS.surfaceMuted,

  color:
    COLORS.textSecondary,

  fontSize: "10px",

  fontWeight: 700,

  cursor: "pointer",
};

export const applyFilterButtonStyle:
  CSSProperties = {
  minHeight: "32px",

  padding:
    "0 11px",

  border:
    `1px solid ${COLORS.accent}`,

  borderRadius: "7px",

  background:
    COLORS.brand,

  color:
    COLORS.textInverse,

  fontSize: "10px",

  fontWeight: 750,

  cursor: "pointer",
};

export const refreshButtonStyle:
  CSSProperties = {
  minHeight: "32px",

  padding:
    "0 10px",

  border:
    `1px solid ${COLORS.border}`,

  borderRadius: "7px",

  background:
    COLORS.surfaceMuted,

  color:
    COLORS.textSecondary,

  fontSize: "10px",

  fontWeight: 700,

  cursor: "pointer",
};

export const collectionCountStyle:
  CSSProperties = {
  minHeight: "30px",

  padding:
    "0 10px",

  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  border:
    `1px solid ${COLORS.borderStrong}`,

  borderRadius: "999px",

  background:
    COLORS.accentSoft,

  color:
    COLORS.accent,

  fontSize: "9px",

  fontWeight: 750,

  whiteSpace: "nowrap",
};

/* ============================================================
   TABLE
============================================================ */

const tableGrid =
  "56px minmax(145px,1.15fr) minmax(145px,1.15fr) minmax(160px,1.2fr) 90px 115px 120px 105px 90px 70px";

export const tableWrapperStyle:
  CSSProperties = {
  width: "100%",

  minWidth: 0,

  overflowX: "auto",
};

export const tableHeaderStyle:
  CSSProperties = {
  minWidth: "1120px",

  display: "grid",

  gridTemplateColumns:
    tableGrid,

  alignItems: "center",

  padding:
    "9px 12px",

  boxSizing: "border-box",

  borderBottom:
    `1px solid ${COLORS.border}`,

  background:
    COLORS.surfaceMuted,
};

export const tableHeaderCellStyle:
  CSSProperties = {
  minWidth: 0,

  color:
    COLORS.textMuted,

  fontSize: "9px",

  fontWeight: 750,

  textTransform: "uppercase",

  letterSpacing:
    "0.02em",
};

export const tableHeaderCenterStyle:
  CSSProperties = {
  ...tableHeaderCellStyle,

  textAlign: "center",
};

export const tableHeaderRightStyle:
  CSSProperties = {
  ...tableHeaderCellStyle,

  textAlign: "right",
};

export const tableBodyStyle:
  CSSProperties = {
  minWidth: "1120px",
};

export const tableRowStyle:
  CSSProperties = {
  minWidth: "1120px",

  minHeight: "66px",

  display: "grid",

  gridTemplateColumns:
    tableGrid,

  alignItems: "center",

  padding:
    "10px 12px",

  boxSizing: "border-box",

  borderBottom:
    `1px solid ${COLORS.border}`,

  background:
    COLORS.surface,
};

export const tableCellStyle:
  CSSProperties = {
  minWidth: 0,

  color:
    COLORS.textSecondary,

  fontSize: "10px",

  fontWeight: 600,

  overflow: "hidden",
};

export const tableCellCenterStyle:
  CSSProperties = {
  ...tableCellStyle,

  display: "flex",

  alignItems: "center",

  justifyContent:
    "center",

  textAlign: "center",
};

export const tableCellRightStyle:
  CSSProperties = {
  ...tableCellStyle,

  textAlign: "right",
};

export const serialCellStyle:
  CSSProperties = {
  ...tableCellCenterStyle,

  color:
    COLORS.textSecondary,

  fontWeight: 700,
};

/* ============================================================
   RECEIPT
============================================================ */

export const receiptIdentityStyle:
  CSSProperties = {
  minWidth: 0,

  display: "flex",

  flexDirection: "column",

  gap: "3px",
};

export const receiptNumberStyle:
  CSSProperties = {
  minWidth: 0,

  overflow: "hidden",

  textOverflow:
    "ellipsis",

  whiteSpace: "nowrap",

  color:
    COLORS.text,

  fontSize: "10px",

  fontWeight: 750,
};

export const receiptReferenceStyle:
  CSSProperties = {
  minWidth: 0,

  overflow: "hidden",

  textOverflow:
    "ellipsis",

  whiteSpace: "nowrap",

  color:
    COLORS.textMuted,

  fontSize: "9px",

  fontWeight: 500,
};

/* ============================================================
   CUSTOMER
============================================================ */

export const customerIdentityStyle:
  CSSProperties = {
  minWidth: 0,

  display: "flex",

  flexDirection: "column",

  gap: "3px",
};

export const customerNameStyle:
  CSSProperties = {
  minWidth: 0,

  overflow: "hidden",

  textOverflow:
    "ellipsis",

  whiteSpace: "nowrap",

  color:
    COLORS.text,

  fontSize: "10px",

  fontWeight: 750,
};

export const customerPhoneStyle:
  CSSProperties = {
  minWidth: 0,

  color:
    COLORS.textMuted,

  fontSize: "9px",

  fontWeight: 500,
};

/* ============================================================
   LOAN
============================================================ */

export const loanIdentityStyle:
  CSSProperties = {
  minWidth: 0,

  display: "flex",

  flexDirection: "column",

  gap: "3px",
};

export const loanNumberStyle:
  CSSProperties = {
  minWidth: 0,

  overflow: "hidden",

  textOverflow:
    "ellipsis",

  whiteSpace: "nowrap",

  color:
    COLORS.text,

  fontSize: "10px",

  fontWeight: 750,
};

export const loanIdStyle:
  CSSProperties = {
  minWidth: 0,

  overflow: "hidden",

  textOverflow:
    "ellipsis",

  whiteSpace: "nowrap",

  color:
    COLORS.textMuted,

  fontSize: "8px",

  fontWeight: 500,
};

/* ============================================================
   AMOUNT
============================================================ */

export const amountStyle:
  CSSProperties = {
  color:
    COLORS.text,

  fontSize: "10px",

  fontWeight: 800,

  whiteSpace: "nowrap",
};

/* ============================================================
   TYPE BADGE
============================================================ */

export function collectionTypeBadgeStyle(
  type: "EMI" | "MANUAL",
): CSSProperties {
  if (
    type === "EMI"
  ) {
    return {
      display:
        "inline-flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      minWidth:
        "54px",

      padding:
        "4px 8px",

      border:
        `1px solid ${COLORS.info}`,

      borderRadius:
        "999px",

      background:
        COLORS.infoSoft,

      color:
        COLORS.info,

      fontSize:
        "8px",

      fontWeight:
        750,
    };
  }

  return {
    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    minWidth:
      "54px",

    padding:
      "4px 8px",

    border:
      `1px solid ${COLORS.warning}`,

    borderRadius:
      "999px",

    background:
      COLORS.warningSoft,

    color:
      COLORS.warning,

    fontSize:
      "8px",

    fontWeight:
      750,
  };
}

/* ============================================================
   STATUS
============================================================ */

export function statusBadgeStyle(
  status:
    | string
    | undefined,
): CSSProperties {
  const normalized =
    String(
      status ?? "",
    )
      .trim()
      .toUpperCase();

  if (
    normalized ===
    "APPROVED"
  ) {
    return {
      display:
        "inline-flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      minWidth:
        "64px",

      padding:
        "4px 8px",

      border:
        `1px solid ${COLORS.success}`,

      borderRadius:
        "999px",

      background:
        COLORS.successSoft,

      color:
        COLORS.success,

      fontSize:
        "8px",

      fontWeight:
        750,
    };
  }

  return {
    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    minWidth:
      "64px",

    padding:
      "4px 8px",

    border:
      `1px solid ${COLORS.borderStrong}`,

    borderRadius:
      "999px",

    background:
      COLORS.surfaceMuted,

    color:
      COLORS.textMuted,

    fontSize:
      "8px",

    fontWeight:
      750,
  };
}

/* ============================================================
   VIEW BUTTON
============================================================ */

export const viewButtonStyle:
  CSSProperties = {
  minHeight: "28px",

  padding:
    "0 9px",

  border:
    `1px solid ${COLORS.borderStrong}`,

  borderRadius: "6px",

  background:
    COLORS.accentSoft,

  color:
    COLORS.accent,

  fontSize: "9px",

  fontWeight: 750,

  cursor: "pointer",

  whiteSpace: "nowrap",
};

/* ============================================================
   EMPTY
============================================================ */

export const emptyStateStyle:
  CSSProperties = {
  minHeight: "220px",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  flexDirection: "column",

  gap: "8px",

  padding: "30px",

  textAlign: "center",

  background:
    COLORS.surface,
};

export const emptyTitleStyle:
  CSSProperties = {
  color:
    COLORS.text,

  fontSize: "14px",

  fontWeight: 800,
};

export const emptyDescriptionStyle:
  CSSProperties = {
  maxWidth: "520px",

  color:
    COLORS.textMuted,

  fontSize: "11px",

  lineHeight: 1.5,
};

/* ============================================================
   FOOTER
============================================================ */

export const tableFooterStyle:
  CSSProperties = {
  width: "100%",

  minWidth: 0,

  padding:
    "10px 14px",

  boxSizing: "border-box",

  display: "flex",

  justifyContent:
    "flex-end",

  borderTop:
    `1px solid ${COLORS.border}`,

  background:
    COLORS.surface,
};

export const tableShowingStyle:
  CSSProperties = {
  color:
    COLORS.textMuted,

  fontSize: "9px",

  fontWeight: 550,
};

/* ============================================================
   RESPONSIVE
============================================================ */

export const responsiveMediaQuery = `
  @media (max-width: 1180px) {
    .finora-collections-portfolio-header {
      align-items: flex-start !important;
      flex-direction: column !important;
    }

    .finora-collections-portfolio-actions {
      width: 100% !important;
      justify-content: flex-start !important;
    }
  }

  @media (max-width: 900px) {
    .finora-collections-statistics {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    .finora-collections-top-bar {
      flex-direction: column !important;
      align-items: stretch !important;
    }

    .finora-collections-top-bar > button {
      width: 100% !important;
    }

    .finora-collections-filters {
      width: 100% !important;
    }
  }

  @media (max-width: 560px) {
    .finora-collections-office {
      padding: 14px !important;
      gap: 12px !important;
    }

    .finora-collections-statistics {
      grid-template-columns: 1fr !important;
      gap: 10px !important;
    }

    .finora-collections-portfolio-actions {
      align-items: stretch !important;
      flex-direction: column !important;
    }

    .finora-collections-filters {
      align-items: stretch !important;
      flex-direction: column !important;
    }

    .finora-collections-filters > div {
      width: 100% !important;
    }

    .finora-collections-filters select,
    .finora-collections-filters input {
      flex: 1 1 auto !important;
      width: 100% !important;
    }
  }
`;

// ============================================================
// END
// ============================================================