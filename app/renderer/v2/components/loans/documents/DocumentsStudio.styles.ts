/* ==========================================================
   FINORA ENTERPRISE OS™
   DOCUMENTS STUDIO™ — THEME CONNECTED STYLES

   RESPONSIVE CATEGORY GRID:
   - Mobile  → 1 card per row
   - Tablet  → 2 cards per row
   - Laptop / Desktop → 4 cards per row

   IMPORTANT:
   - Geometry remains in this presentation source.
   - JSX contains no inline style objects.
   - Colours consume the existing FINORA Theme Engine.
   - No JavaScript viewport detection.
   - No window.innerWidth.
   - Grid adapts from available container width.
========================================================== */

const THEME = {
  page: "var(--finora-theme-background-page, var(--finora-theme-page))",
  surface:
    "var(--finora-theme-background-surface, var(--finora-theme-surface))",
  surfaceMuted:
    "var(--finora-theme-background-surface-muted, var(--finora-theme-surface-muted))",
  primary: "var(--finora-theme-brand-primary)",
  primarySoft: "var(--finora-theme-brand-accent-soft)",
  info: "var(--finora-theme-info)",
  textPrimary: "var(--finora-theme-text-primary)",
  textSecondary: "var(--finora-theme-text-secondary)",
  textMuted: "var(--finora-theme-text-muted)",
  textInverse: "var(--finora-theme-text-inverse)",
  border: "var(--finora-theme-border-default)",
  borderStrong: "var(--finora-theme-border-strong)",
  borderSubtle: "var(--finora-theme-border-subtle)",
  danger: "var(--finora-theme-danger)",
  dangerSoft: "var(--finora-theme-danger-soft)",
  overlayShadow: "var(--finora-theme-overlay-shadow)",
  overlayBackdrop: "var(--finora-theme-overlay-backdrop)",
} as const;

const panelBorder = `1px solid ${THEME.border}`;
const strongBorder = `1px solid ${THEME.borderStrong}`;
const subtleBorder = `1px solid ${THEME.borderSubtle}`;

/* ==========================================================
   OUTER / HEADER
========================================================== */

export const sectionStyle = {
  width: "100%",
  minWidth: 0,
  minHeight: 0,
  boxSizing: "border-box" as const,
  padding: "18px 18px 4px",
  border: panelBorder,
  borderRadius: "13px",
  background: THEME.surfaceMuted,
  color: THEME.textInverse,
  overflow: "visible",
};

export const headerStyle = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap" as const,
  gap: "10px",
  marginBottom: "16px",
};

export const headerAccentStyle = {
  width: "4px",
  height: "34px",
  flexShrink: 0,
  borderRadius: "4px",
  background: THEME.primary,
};

export const headerTextStyle = {
  minWidth: 0,
  flex: "1 1 200px",
};

export const headerTitleStyle = {
  margin: 0,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "clamp(17px, 4.5vw, 20px)",
  fontWeight: 750,
  color: THEME.textPrimary,
};

export const headerDescriptionStyle = {
  margin: 0,
  color: THEME.textMuted,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "clamp(11px, 3vw, 14px)",
  fontWeight: 500,
  lineHeight: 1.35,
};

export const headerBadgeWrapStyle = {
  marginLeft: "auto",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

/* ==========================================================
   SECTION TITLES / COMMON CONTROLS
========================================================== */

export const categorySectionTitleStyle = {
  marginBottom: "8px",
  color: THEME.textSecondary,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
};

export const sectionTitleRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap" as const,
  gap: "6px 10px",
  marginTop: "16px",
  marginBottom: "8px",
};

export const sectionTitleStyle = {
  color: THEME.textSecondary,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
};

export const sectionHintStyle = {
  color: THEME.textMuted,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "clamp(10px, 2.8vw, 12px)",
  lineHeight: 1.3,
};

export const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  minHeight: "25px",
  padding: "0 8px",
  borderRadius: "999px",
  border: strongBorder,
  background: THEME.surface,
  color: THEME.textSecondary,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "13px",
  fontWeight: 800,
};

export const addButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "30px",
  padding: "0 10px",
  marginTop: "8px",
  borderRadius: "7px",
  border: strongBorder,
  background: THEME.surface,
  color: THEME.textSecondary,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "11px",
  fontWeight: 750,
  cursor: "pointer",
};

export const backButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "35px",
  padding: "0 10px",
  borderRadius: "7px",
  border: panelBorder,
  background: THEME.surface,
  color: THEME.textSecondary,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

export const viewAllButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "62px",
  minWidth: "62px",
  maxWidth: "62px",
  flexShrink: 0,
  minHeight: "30px",
  padding: "0 8px",
  boxSizing: "border-box" as const,
  borderRadius: "7px",
  border: panelBorder,
  background: THEME.surface,
  color: THEME.textSecondary,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "11px",
  fontWeight: 700,
  lineHeight: 1,
  cursor: "pointer",
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
};

/* ==========================================================
   CATEGORY CARDS
========================================================== */

/*
 * RESPONSIVE GRID
 *
 * The minimum practical card width is intentionally kept at
 * 320px.
 *
 * This produces the desired geometry from the available
 * Documents Studio content width:
 *
 *   Mobile:
 *   < 640px-ish available width
 *   → 1 card
 *
 *   Tablet:
 *   ~640px - ~1050px available width
 *   → 2 cards
 *
 *   Laptop / Desktop:
 *   enough width for four 320px cards
 *   → 4 cards
 *
 * `auto-fit` allows the browser to calculate the number of
 * columns from the actual available container width.
 *
 * No viewport JavaScript.
 * No window.innerWidth.
 * No breakpoint detection in React.
 */
export const categoryGridStyle = {
  display: "grid",

  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",

  gap: "10px",

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box" as const,

  alignItems: "stretch",
};

export const categoryCardStyle = {
  minWidth: 0,
  padding: "11px",
  border: panelBorder,
  borderRadius: "10px",
  background: THEME.surface,
  boxSizing: "border-box" as const,
};

export const categoryHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
  minHeight: "42px",
};

export const categoryHeaderLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
  flex: 1,
};

export const categoryIconStyle = {
  width: "34px",
  height: "34px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  borderRadius: "8px",
  border: strongBorder,
  background: THEME.surface,
  color: THEME.textSecondary,
  boxSizing: "border-box" as const,
};

export const categoryTitleWrapStyle = {
  minWidth: 0,
  flex: 1,
};

export const categoryTitleStyle = {
  minWidth: 0,
  color: THEME.textPrimary,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "14px",
  fontWeight: 750,
  overflow: "visible",
  textOverflow: "clip",
  whiteSpace: "normal" as const,
  wordBreak: "break-word" as const,
};

export const categoryMetaStyle = {
  marginTop: "2px",
  color: THEME.textMuted,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "11px",
  fontWeight: 500,
};

export const categoryPreviewStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  minHeight: "55px",
  marginTop: "9px",
  overflowX: "auto" as const,
  paddingBottom: "2px",
  scrollbarWidth: "none" as const,
  msOverflowStyle: "none" as const,
};

export const categoryPreviewButtonStyle = {
  flex: "0 0 70px",
  padding: 0,
  border: subtleBorder,
  borderRadius: "7px",
  overflow: "hidden",
  background: THEME.surface,
  cursor: "pointer",
};

export const categoryPreviewThumbStyle = {
  width: "70px",
  height: "52px",
  flexShrink: 0,
  display: "block",
  objectFit: "cover" as const,
  background: THEME.surface,
};

/* ==========================================================
   EVIDENCE PREVIEW
========================================================== */

export const evidencePreviewSectionStyle = {
  marginTop: "10px",
  padding: "12px",
  border: strongBorder,
  borderRadius: "10px",
  background: THEME.surface,
};

export const evidencePreviewHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
};

export const evidencePreviewTextStyle = {
  minWidth: 0,
};

export const evidencePreviewTitleStyle = {
  color: THEME.textPrimary,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "15px",
  fontWeight: 750,
};

export const evidencePreviewMetaStyle = {
  marginTop: "5px",
  color: THEME.textSecondary,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "clamp(11px, 3vw, 14px)",
  lineHeight: 1.3,
};

export const evidencePreviewStripStyle = {
  display: "flex",
  gap: "7px",
  overflowX: "auto" as const,
  paddingTop: "10px",
  paddingBottom: "2px",
  scrollbarWidth: "none" as const,
  msOverflowStyle: "none" as const,
};

export const evidencePreviewButtonStyle = {
  flex: "0 0 70px",
  height: "52px",
  padding: 0,
  border: subtleBorder,
  borderRadius: "7px",
  overflow: "hidden",
  background: THEME.surface,
  cursor: "pointer",
};

/* ==========================================================
   EMPTY / INFO / UPLOAD
========================================================== */

export const emptyStateStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "55px",
  width: "100%",
  color: THEME.textMuted,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "13px",
  fontWeight: 600,
  textAlign: "center" as const,
};

export const uploadInputStyle = {
  display: "none",
};

export const uploadLabelStyle = {
  position: "relative" as const,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "31px",
  marginTop: "8px",
  borderRadius: "7px",
  border: strongBorder,
  background: THEME.primarySoft,
  color: THEME.textInverse,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
  overflow: "hidden",
};

/* ==========================================================
   GALLERY
========================================================== */

export const categoryGalleryBackdropStyle = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 1000,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "stretch",
  justifyContent: "flex-start",
  padding: "18px",
  boxSizing: "border-box" as const,
  background: THEME.page,
  color: THEME.textInverse,
};

export const galleryHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  paddingBottom: "10px",
  borderBottom: panelBorder,
};

export const galleryHeaderLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
};

export const galleryTitleWrapStyle = {
  minWidth: 0,
};

export const galleryTitleStyle = {
  color: THEME.textPrimary,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "16px",
  fontWeight: 800,
};

export const galleryMetaStyle = {
  color: THEME.textMuted,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "11px",
  marginTop: "3px",
};

export const galleryViewportStyle = {
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto" as const,
  overflowX: "hidden" as const,
  paddingTop: "12px",
  paddingBottom: "20px",
  boxSizing: "border-box" as const,
};

export const galleryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "10px",
  alignItems: "start",
};

/* ==========================================================
   DOCUMENT TILE
========================================================== */

export const documentTileStyle = {
  minWidth: 0,
  overflow: "hidden",
  border: panelBorder,
  borderRadius: "9px",
  background: THEME.surface,
};

export const documentTileButtonStyle = {
  border: 0,
  padding: 0,
  margin: 0,
  width: "100%",
  background: "transparent",
  cursor: "pointer",
};

export const documentTileImageStyle = {
  width: "100%",
  height: "100%",
  maxWidth: "100%",
  maxHeight: "100%",
  display: "block",
  objectFit: "contain" as const,
  objectPosition: "center" as const,
  background: THEME.surface,
};

export const pdfTileStyle = {
  ...documentTileImageStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: THEME.info,
  fontWeight: 800,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "20px",
};

export const pdfCompactStyle = {
  ...categoryPreviewThumbStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: THEME.info,
  fontWeight: 800,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "11px",
};

export const documentTileFooterStyle = {
  padding: "8px",
};

export const documentTileNameStyle = {
  color: THEME.textPrimary,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "11px",
  fontWeight: 750,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

export const documentTileTypeStyle = {
  marginTop: "2px",
  color: THEME.textMuted,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "9px",
  fontWeight: 600,
};

export const documentTileActionsStyle = {
  display: "flex",
  gap: "6px",
  marginTop: "7px",
};

export const renameButtonStyle = {
  flex: 1,
  minHeight: "25px",
  borderRadius: "6px",
  border: strongBorder,
  background: THEME.primarySoft,
  color: THEME.info,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "9px",
  fontWeight: 700,
  cursor: "pointer",
};

export const itemMenuStyle = {
  width: "25px",
  height: "25px",
  padding: 0,
  borderRadius: "6px",
  border: `1px solid ${THEME.danger}`,
  background: THEME.dangerSoft,
  color: THEME.danger,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "15px",
  lineHeight: 1,
  cursor: "pointer",
};

/* ==========================================================
   RENAME DIALOG
========================================================== */

export const renameDialogStyle = {
  width: "min(420px, 92vw)",
  padding: "18px",
  border: strongBorder,
  borderRadius: "12px",
  background: THEME.surface,
  boxShadow: `0 24px 80px ${THEME.overlayShadow}`,
};

export const renameDialogTitleStyle = {
  color: THEME.textPrimary,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "15px",
  fontWeight: 800,
  marginBottom: "10px",
};

export const renameInputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "10px 11px",
  border: panelBorder,
  borderRadius: "8px",
  background: THEME.surface,
  color: THEME.textPrimary,
  outline: "none",
};

export const renameActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  marginTop: "12px",
};

/* ==========================================================
   VIEWER
========================================================== */

export const viewerBackdropStyle = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 1700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  boxSizing: "border-box" as const,
  background: THEME.overlayBackdrop,
  backdropFilter: "blur(4px)",
};

export const viewerContentStyle = {
  width: "min(1180px, 94vw)",
  height: "min(820px, 92vh)",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  padding: "12px",
  boxSizing: "border-box" as const,
  border: strongBorder,
  borderRadius: "12px",
  background: THEME.surface,
  boxShadow: `0 30px 100px ${THEME.overlayShadow}`,
};

export const viewerTitleStyle = {
  alignSelf: "stretch",
  color: THEME.textPrimary,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "13px",
  fontWeight: 800,
  textAlign: "center" as const,
};

export const viewerImageStyle = {
  maxWidth: "100%",
  maxHeight: "calc(100% - 28px)",
  objectFit: "contain" as const,
  borderRadius: "8px",
};

export const viewerFrameStyle = {
  width: "100%",
  flex: 1,
  minHeight: 0,
  border: 0,
  borderRadius: "8px",
  background: THEME.textInverse,
};

export const viewerCloseStyle = {
  position: "fixed" as const,
  top: "14px",
  right: "16px",
  zIndex: 1710,
  width: "38px",
  height: "38px",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  border: panelBorder,
  background: THEME.surfaceMuted,
  color: THEME.textPrimary,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "24px",
  fontWeight: 700,
  lineHeight: 1,
  cursor: "pointer",
};
/* PAISARULE C144-R21 MOBILE DOCUMENTS POLISH */
const mobileDocumentsPresentationStyle = `
  @media (max-width: 768px) {
    .paisarule-loan-documents-step3 {
      --paisarule-documents-mobile-readable:
        var(--finora-theme-text-primary, #FFFFFF);
    }

    .paisarule-loan-documents-step3 .paisarule-documents-gallery {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 10px !important;
    }

    .paisarule-loan-documents-step3 .paisarule-document-tile-preview {
      height: 82px !important;
      min-height: 82px !important;
      display: block !important;
      overflow: hidden !important;
    }

    .paisarule-loan-documents-step3 .paisarule-document-tile-preview img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-documents-readable-text {
      color:
        var(--finora-theme-text-primary, #FFFFFF) !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-document-name {
      font-size: 12px !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-document-type {
      color:
        var(--finora-theme-text-primary, #FFFFFF) !important;
      font-size: 10px !important;
    }
  }
  /* PAISARULE C144-R57-R2 MOBILE DOCUMENT COMPACT SPACING */
  @media (max-width: 767px) {
    .paisarule-loan-documents-step3
      .paisarule-document-category-card {
      min-height: 0 !important;
      height: auto !important;
      padding-top: 7px !important;
      padding-bottom: 0 !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-category-document-preview {
      min-height: 32px !important;
      margin-top: 4px !important;
    }
  }
    /* PAISARULE C144-R59-R2 MOBILE CATEGORY INNER COMPACT */
  @media (max-width: 767px) {
    .paisarule-loan-documents-step3
      .paisarule-document-category-card > div:nth-of-type(2) {
      min-height: 24px !important;
      margin-top: 2px !important;
      padding-bottom: 0 !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-document-category-card > div:nth-of-type(2) > div {
      min-height: 24px !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-document-category-card
      .paisarule-category-add-document {
      margin-top: 3px !important;
      margin-bottom: 0 !important;
    }
  }

  /* PAISARULE C144-R60-R1 MOBILE ADD DOCUMENT BOTTOM CENTER */
  @media (max-width: 767px) {
    .paisarule-loan-documents-step3
      .paisarule-document-category-card {
      display: flex !important;
      flex-direction: column !important;
      padding-bottom: 7px !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-document-category-card
      .paisarule-category-add-document {
      display: block !important;
      align-self: center !important;
      margin-left: auto !important;
      margin-right: auto !important;
      margin-top: 8px !important;
      margin-bottom: 0 !important;
      flex-shrink: 0 !important;
    }
  }
    /* PAISARULE C144-R62 FINAL MOBILE DOCUMENT CARD GEOMETRY */
  @media (max-width: 767px) {
    .paisarule-loan-documents-step3
      .paisarule-document-category-card {
      min-height: 140px !important;
      height: 140px !important;
      display: flex !important;
      flex-direction: column !important;
      padding-top: 7px !important;
      padding-bottom: 7px !important;
      box-sizing: border-box !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-document-category-card
      > div:nth-of-type(2) {
      min-height: 52px !important;
      height: 52px !important;
      margin-top: 3px !important;
      padding-bottom: 0 !important;
      box-sizing: border-box !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-document-category-card
      > div:nth-of-type(2)
      > div {
      min-height: 52px !important;
      height: 52px !important;
      box-sizing: border-box !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-category-document-preview {
      min-height: 66px !important;
      height: 66px !important;
      margin-top: 0 !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-document-category-card
      .paisarule-category-add-document {
      display: block !important;
      align-self: center !important;
      margin-top: auto !important;
      margin-right: auto !important;
      margin-bottom: 0 !important;
      margin-left: auto !important;
      flex-shrink: 0 !important;
    }
  }
  /* PAISARULE C144-R66-R3 FINAL MOBILE DOCUMENT DOM GEOMETRY */
  @media (max-width: 767px) {
    .paisarule-loan-documents-step3
      .paisarule-category-document-preview {
      flex: 0 0 70px !important;
      width: 70px !important;
      min-width: 70px !important;
      max-width: 70px !important;
      height: 52px !important;
      min-height: 52px !important;
      max-height: 52px !important;
      padding: 0 !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-category-document-preview > img {
      width: 70px !important;
      min-width: 70px !important;
      max-width: 70px !important;
      height: 52px !important;
      min-height: 52px !important;
      max-height: 52px !important;
      display: block !important;
      object-fit: cover !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-documents-gallery {
      grid-template-columns:
        repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
      align-items: start !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-document-tile {
      min-height: 0 !important;
      height: auto !important;
      align-self: start !important;
      overflow: hidden !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-document-tile
      .paisarule-document-tile-preview {
      height: 82px !important;
      min-height: 82px !important;
      max-height: 82px !important;
      display: block !important;
      overflow: hidden !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-document-tile
      .paisarule-document-tile-preview > img {
      width: 100% !important;
      height: 100% !important;
      max-height: 82px !important;
      display: block !important;
      object-fit: contain !important;
    }
  }
  /* PAISARULE C144-R67-R3 ROOT-INDEPENDENT MOBILE DOCUMENTS */
  @media (max-width: 768px) {
    .paisarule-category-preview-grid {
      display: grid !important;
      grid-template-columns:
        repeat(3, minmax(0, 1fr)) !important;
      gap: 6px !important;
      width: 100% !important;
      height: 52px !important;
      min-height: 52px !important;
      max-height: 52px !important;
      overflow: hidden !important;
      align-items: stretch !important;
    }

    .paisarule-category-preview-grid
      .paisarule-category-document-preview {
      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;
      height: 52px !important;
      min-height: 52px !important;
      max-height: 52px !important;
      flex: none !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    .paisarule-category-preview-grid
      .paisarule-category-document-preview
      img {
      display: block !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      height: 52px !important;
      min-height: 52px !important;
      max-height: 52px !important;
      object-fit: contain !important;
    }

    .paisarule-view-all-grid {
      display: grid !important;
      grid-template-columns:
        repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
      width: 100% !important;
      align-items: start !important;
    }

    .paisarule-view-all-grid
      > .paisarule-document-tile {
      width: 100% !important;
      min-width: 0 !important;
      min-height: 0 !important;
      height: auto !important;
      align-self: start !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    .paisarule-view-all-grid
      > .paisarule-document-tile
      > .paisarule-document-tile-preview {
      display: block !important;
      width: 100% !important;
      height: 82px !important;
      min-height: 82px !important;
      max-height: 82px !important;
      padding: 0 !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    .paisarule-view-all-grid
      > .paisarule-document-tile
      > .paisarule-document-tile-preview
      img {
      display: block !important;
      width: 100% !important;
      height: 100% !important;
      max-height: 82px !important;
      object-fit: contain !important;
    }
  }

/* PAISARULE C144-R68-R2 MOBILE MAIN THUMB HEIGHT MATCH */
@media (max-width: 767px) {
  .paisarule-category-preview-grid .paisarule-category-document-preview {
    height: 82px !important;
    min-height: 82px !important;
    max-height: 82px !important;
    overflow: hidden !important;
  }

  .paisarule-category-preview-grid .paisarule-category-document-preview img {
    width: 100% !important;
    height: 82px !important;
    min-height: 82px !important;
    max-height: 82px !important;
    display: block !important;
    object-fit: contain !important;
  }
}
/* PAISARULE C144-R39-R3 EXE FIVE CARDS +30PX */
  @media (min-width: 769px) {
    .paisarule-loan-documents-step3
      .paisarule-document-category-card {
      padding-bottom: 11px !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-evidence-preview-card {
      height: 200px !important;
      min-height: 200px !important;
      padding-bottom: 11px !important;
      box-sizing: border-box !important;
    }
    /* PAISARULE C144-R40-R3 ADD DOCUMENT BOTTOM CENTER */
    .paisarule-loan-documents-step3
      .paisarule-document-category-card {
      display: flex !important;
      flex-direction: column !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-category-add-document {
      display: block !important;
      margin-top: auto !important;
      align-self: center !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }
  }
    /* PAISARULE C144-R44-R1 EXE FINAL DOCUMENT LAYOUT */

    .paisarule-loan-documents-step3
      .paisarule-document-category-card {
      min-height: 200px !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-category-document-preview {
      height: 72px !important;
      min-height: 72px !important;
      overflow: hidden !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-category-document-preview img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-documents-gallery {
      grid-template-columns:
        repeat(4, minmax(0, 1fr)) !important;
      gap: 10px !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-documents-gallery
      .paisarule-document-tile-preview {
      height: 180px !important;
      min-height: 180px !important;
      overflow: hidden !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-documents-gallery
      .paisarule-document-tile-preview img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain !important;
    }
    /* PAISARULE C144-R45-R2 EVIDENCE PREVIEW SIZE */
    .paisarule-loan-documents-step3
      .paisarule-evidence-preview-card button {
      flex-basis: 110px !important;
      width: 110px !important;
      height: 90px !important;
      min-height: 90px !important;
    }

    .paisarule-loan-documents-step3
      .paisarule-evidence-preview-card button img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain !important;
    }

  /* PAISARULE C144-R69-R5 FINAL MOBILE CASCADE */
  @media (max-width: 768px) {
    .paisarule-category-preview-grid {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 6px !important;
      width: 100% !important;

      height: 110px !important;
      min-height: 110px !important;
      max-height: 110px !important;

      overflow: hidden !important;
      align-items: stretch !important;
    }

    .paisarule-category-preview-grid
      > .paisarule-category-document-preview {
      display: block !important;

      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;

      height: 110px !important;
      min-height: 110px !important;
      max-height: 110px !important;

      flex: none !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    .paisarule-category-preview-grid
      > .paisarule-category-document-preview
      > img {
      display: block !important;
      width: 100% !important;

      height: 110px !important;
      min-height: 110px !important;
      max-height: 110px !important;

      object-fit: contain !important;
    }

    .paisarule-documents-gallery.paisarule-view-all-grid {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
      width: 100% !important;
      align-items: start !important;
    }

    .paisarule-documents-gallery.paisarule-view-all-grid
      > .paisarule-document-tile {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;

      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;

      align-self: start !important;
      overflow: hidden !important;
    }

    .paisarule-documents-gallery.paisarule-view-all-grid
      > .paisarule-document-tile
      > .paisarule-document-tile-preview {
      display: block !important;
      width: 100% !important;

      height: 110px !important;
      min-height: 110px !important;
      max-height: 110px !important;

      padding: 0 !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    .paisarule-documents-gallery.paisarule-view-all-grid
      > .paisarule-document-tile
      > .paisarule-document-tile-preview
      > img {
      display: block !important;
      width: 100% !important;

      height: 110px !important;
      min-height: 110px !important;
      max-height: 110px !important;

      object-fit: contain !important;
    }
  }

  /* PAISARULE C144-R71-R2 MAIN PREVIEW PARENT CLIP FIX */
  @media (max-width: 768px) {
    .paisarule-loan-documents-step3
      .paisarule-document-category-card
      > .paisarule-category-preview-grid,
    .paisarule-loan-documents-step3
      .paisarule-document-category-card
      > div:nth-of-type(2).paisarule-category-preview-grid {
      height: 110px !important;
      min-height: 110px !important;
      max-height: 110px !important;
      overflow: hidden !important;
    }
  }`;

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "paisarule-c144-r21-documents-mobile-style",
  )
) {
  const styleElement = document.createElement("style");
  styleElement.id =
    "paisarule-c144-r21-documents-mobile-style";
  styleElement.textContent =
    mobileDocumentsPresentationStyle;
  document.head.appendChild(styleElement);
}
