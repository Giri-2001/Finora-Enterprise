/* ===========================================================
   FINORA ENTERPRISE OS™

   COLLECTION STUDIO™

   LOAN DOCUMENTS / IMAGES STYLES

   RESPONSIBILITY

   - Loan document section geometry
   - Premium Lucide header presentation
   - Live document preview tiles
   - View-all gallery
   - Full image viewer
   - FINORA Theme Engine token consumption

   IMPORTANT

   - No local theme system
   - No local breakpoint system
   - No responsive logic
   - No business logic
   - No second colour palette
=========================================================== */

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// FINORA THEME TOKENS
// ============================================================

const THEME = {
  surface: "var(--finora-theme-surface, var(--surface, #FFFFFF))",

  surfaceSoft:
    "var(--finora-theme-surface-muted, var(--surface-soft, #F5F7FA))",

  surfaceStrong: "var(--finora-theme-surface-strong, #E7EAF0)",

  textPrimary: "var(--finora-theme-text-primary, var(--text, #111827))",

  textSecondary: "var(--finora-theme-text-secondary, #475569)",

  textMuted: "var(--finora-theme-text-muted, var(--text-muted, #6B7280))",

  brand: "var(--finora-theme-brand-primary, var(--accent, #C69214))",

  brandSoft: "var(--finora-theme-brand-accent-soft, rgba(198, 146, 20, 0.10))",

  border: "var(--finora-theme-border-default, var(--border, #D5DCE5))",

  borderStrong: "var(--finora-theme-border-strong, #B8C0CC)",

  overlay: "var(--finora-theme-overlay-backdrop, rgba(15, 23, 42, 0.72))",

  overlayShadow:
    "var(--finora-theme-overlay-shadow, 0 24px 80px rgba(15, 23, 42, 0.30))",
} as const;

// ============================================================
// FONT
// ============================================================

const INTER_FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

// ============================================================
// PUBLIC STYLES
// ============================================================

export const loanDocumentsStyles: Record<string, CSSProperties> = {
  // ==========================================================
  // SECTION
  // ==========================================================

  section: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",

    display: "flex",
    flexDirection: "column",

    gap: "14px",

    padding: "16px",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "14px",

    boxShadow: "0 4px 18px rgba(15, 23, 42, 0.04)",

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    width: "100%",
    minWidth: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "16px",

    paddingBottom: "13px",

    boxSizing: "border-box",

    borderBottom: `1px solid ${THEME.border}`,

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // HEADER LEFT
  //
  // Icon + title/subtitle group.
  // ==========================================================

  headerTitle: {
    minWidth: 0,

    flex: "1 1 auto",

    display: "flex",

    alignItems: "flex-start",

    gap: "11px",

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // LUCIDE HEADER ICON
  // ==========================================================

  headerIcon: {
    width: "23px",

    height: "23px",

    minWidth: "23px",

    flexShrink: 0,

    marginTop: "7px",

    color: THEME.brand,

    strokeWidth: 2,
  },

  // ==========================================================
  // HEADER CONTENT
  // ==========================================================

  headerContent: {
    minWidth: 0,

    flex: "1 1 auto",

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",

    gap: "2px",

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // LEGACY STEP
  //
  // Retained as compatibility style.
  // Current header uses Lucide icon.
  // ==========================================================

  step: {
    flexShrink: 0,

    width: "24px",

    height: "24px",

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    boxSizing: "border-box",

    border: `1px solid ${THEME.brand}`,

    borderRadius: "7px",

    background: THEME.brandSoft,

    color: THEME.brand,

    fontFamily: INTER_FONT,

    fontSize: "11px",

    fontWeight: 800,
  },

  // ==========================================================
  // TITLE
  // ==========================================================

  title: {
    margin: 0,

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "14px",

    fontWeight: 800,

    letterSpacing: "0.015em",

    lineHeight: 1.25,
  },

  // ==========================================================
  // SUBTITLE
  // ==========================================================

  subtitle: {
    margin: "3px 0 0",

    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 500,

    lineHeight: 1.4,
  },

  // ==========================================================
  // VIEW ALL BUTTON
  // ==========================================================

  viewAllButton: {
    flexShrink: 0,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "7px",

    minHeight: "30px",

    padding: "6px 11px",

    boxSizing: "border-box",

    border: `1px solid ${THEME.border}`,

    borderRadius: "8px",

    background: THEME.surfaceSoft,

    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 800,

    letterSpacing: "0.03em",

    cursor: "pointer",
  },

  // ==========================================================
  // ARROW
  // ==========================================================

  arrow: {
    color: THEME.brand,

    fontSize: "13px",

    lineHeight: 1,
  },

  // ==========================================================
  // GRID
  // ==========================================================

  grid: {
    width: "100%",

    minWidth: 0,

    display: "grid",

    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",

    gap: "10px",

    boxSizing: "border-box",
  },

  // ==========================================================
  // DOCUMENT BUTTON
  // ==========================================================

  documentButton: {
    minWidth: 0,

    width: "100%",

    aspectRatio: "1 / 0.72",

    padding: 0,

    overflow: "hidden",

    boxSizing: "border-box",

    border: `1px solid ${THEME.border}`,

    borderRadius: "9px",

    background: THEME.surfaceSoft,

    cursor: "pointer",
  },

  // ==========================================================
  // IMAGE
  // ==========================================================

  image: {
    display: "block",

    width: "100%",

    height: "100%",

    objectFit: "cover",
  },

  // ==========================================================
  // PLACEHOLDER
  // ==========================================================

  placeholder: {
    width: "100%",

    height: "100%",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: "5px",

    background: THEME.surfaceSoft,
  },

  // ==========================================================
  // PLACEHOLDER ICON
  // ==========================================================

  placeholderIcon: {
    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    minWidth: "34px",

    minHeight: "24px",

    padding: "3px 7px",

    boxSizing: "border-box",

    border: `1px solid ${THEME.borderStrong}`,

    borderRadius: "5px",

    color: THEME.brand,

    fontFamily: INTER_FONT,

    fontSize: "8px",

    fontWeight: 800,

    letterSpacing: "0.05em",
  },

  // ==========================================================
  // PLACEHOLDER TEXT
  // ==========================================================

  placeholderText: {
    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "8px",

    fontWeight: 700,

    letterSpacing: "0.05em",

    textAlign: "center",
  },

  // ==========================================================
  // PDF PLACEHOLDER
  // ==========================================================

  pdfPlaceholder: {
    width: "100%",

    height: "100%",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: "5px",

    background: THEME.surfaceSoft,
  },

  pdfIcon: {
    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    minWidth: "34px",

    minHeight: "24px",

    padding: "3px 7px",

    boxSizing: "border-box",

    border: `1px solid ${THEME.borderStrong}`,

    borderRadius: "5px",

    color: THEME.brand,

    fontFamily: INTER_FONT,

    fontSize: "8px",

    fontWeight: 800,

    letterSpacing: "0.05em",
  },

  pdfText: {
    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "8px",

    fontWeight: 700,

    letterSpacing: "0.05em",
  },

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  emptyState: {
    width: "100%",

    minHeight: "84px",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: "5px",

    boxSizing: "border-box",

    border: `1px dashed ${THEME.border}`,

    borderRadius: "9px",

    background: THEME.surfaceSoft,
  },

  emptyStateTitle: {
    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 800,
  },

  emptyStateMessage: {
    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 500,
  },

  // ==========================================================
  // MORE DOCUMENTS
  // ==========================================================

  moreDocumentsButton: {
    alignSelf: "flex-start",

    padding: "0",

    border: "none",

    background: "transparent",

    color: THEME.brand,

    fontFamily: INTER_FONT,

    fontSize: "8px",

    fontWeight: 800,

    letterSpacing: "0.04em",

    cursor: "pointer",
  },

  // ==========================================================
  // VIEWER BACKDROP
  // ==========================================================

  viewerBackdrop: {
    position: "fixed",

    inset: 0,

    zIndex: 1000,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    padding: "28px",

    boxSizing: "border-box",

    background: THEME.overlay,
  },

  // ==========================================================
  // VIEW ALL CONTENT
  // ==========================================================

  viewerContent: {
    width: "min(1120px, 94vw)",

    maxHeight: "90vh",

    display: "flex",

    flexDirection: "column",

    overflow: "hidden",

    boxSizing: "border-box",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "14px",

    boxShadow: THEME.overlayShadow,
  },

  // ==========================================================
  // VIEWER HEADER
  // ==========================================================

  viewerHeader: {
    flexShrink: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "16px",

    padding: "13px 16px",

    boxSizing: "border-box",

    borderBottom: `1px solid ${THEME.border}`,
  },

  viewerTitle: {
    display: "block",

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "12px",

    fontWeight: 800,

    letterSpacing: "0.04em",
  },

  viewerMeta: {
    display: "block",

    marginTop: "3px",

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 500,
  },

  // ==========================================================
  // CLOSE
  // ==========================================================

  viewerClose: {
    flexShrink: 0,

    width: "30px",

    height: "30px",

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    padding: 0,

    border: `1px solid ${THEME.border}`,

    borderRadius: "7px",

    background: THEME.surfaceSoft,

    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "20px",

    lineHeight: 1,

    cursor: "pointer",
  },

  // ==========================================================
  // ALL DOCUMENTS GRID
  // ==========================================================

  allDocumentsGrid: {
    width: "100%",

    display: "grid",

    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",

    gap: "12px",

    padding: "16px",

    overflowY: "auto",

    boxSizing: "border-box",
  },

  // ==========================================================
  // ALL DOCUMENT CARD
  // ==========================================================

  allDocumentCard: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    overflow: "hidden",

    border: `1px solid ${THEME.border}`,

    borderRadius: "10px",

    background: THEME.surfaceSoft,
  },

  allDocumentPreview: {
    width: "100%",

    aspectRatio: "1 / 0.72",

    padding: 0,

    overflow: "hidden",

    border: "none",

    background: THEME.surfaceSoft,

    cursor: "pointer",
  },

  allDocumentInfo: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    gap: "3px",

    padding: "8px 9px",

    boxSizing: "border-box",

    borderTop: `1px solid ${THEME.border}`,
  },

  allDocumentName: {
    overflow: "hidden",

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 700,

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",
  },

  allDocumentType: {
    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "8px",

    fontWeight: 700,

    letterSpacing: "0.04em",
  },

  // ==========================================================
  // FULL IMAGE VIEWER
  // ==========================================================

  imageViewerBackdrop: {
    position: "fixed",

    inset: 0,

    zIndex: 1100,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    padding: "20px",

    boxSizing: "border-box",

    background: THEME.overlay,
  },

  imageViewerContent: {
    width: "min(1200px, 96vw)",

    height: "min(900px, 94vh)",

    display: "flex",

    flexDirection: "column",

    overflow: "hidden",

    boxSizing: "border-box",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "14px",

    boxShadow: THEME.overlayShadow,
  },

  imageViewerHeader: {
    flexShrink: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "14px",

    padding: "11px 14px",

    boxSizing: "border-box",

    borderBottom: `1px solid ${THEME.border}`,
  },

  imageViewerTitle: {
    minWidth: 0,

    overflow: "hidden",

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "11px",

    fontWeight: 800,

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",
  },

  imageViewerBody: {
    flex: 1,

    minHeight: 0,

    minWidth: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    padding: "18px",

    overflow: "auto",

    boxSizing: "border-box",

    background: THEME.surfaceStrong,
  },

  viewerImage: {
    display: "block",

    maxWidth: "100%",

    maxHeight: "100%",

    width: "auto",

    height: "auto",

    objectFit: "contain",

    borderRadius: "6px",
  },

  viewerPlaceholder: {
    width: "100%",

    minHeight: "240px",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: "7px",

    background: THEME.surfaceSoft,

    borderRadius: "8px",
  },
};

// ============================================================
// END
// ============================================================
