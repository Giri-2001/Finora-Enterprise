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
  padding: "18px",
  border: panelBorder,
  borderRadius: "13px",
  background: THEME.surfaceMuted,
  color: THEME.textInverse,
  overflow: "visible",
};

export const headerStyle = {
  display: "flex",
  alignItems: "center",
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
};

export const headerTitleStyle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 750,
  color: THEME.textPrimary,
};

export const headerDescriptionStyle = {
  margin: 0,
  color: THEME.textMuted,
  fontSize: "12px",
  fontWeight: 500,
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
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.08em",
};

export const sectionTitleRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  marginTop: "16px",
  marginBottom: "8px",
};

export const sectionTitleStyle = {
  color: THEME.textSecondary,
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.08em",
};

export const sectionHintStyle = {
  color: THEME.textMuted,
  fontSize: "11px",
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
  fontSize: "13px",
  fontWeight: 750,
  overflow: "visible",
  textOverflow: "clip",
  whiteSpace: "normal" as const,
  wordBreak: "break-word" as const,
};

export const categoryMetaStyle = {
  marginTop: "2px",
  color: THEME.textMuted,
  fontSize: "10px",
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
  flex: "0 0 64px",
  padding: 0,
  border: subtleBorder,
  borderRadius: "7px",
  overflow: "hidden",
  background: THEME.surface,
  cursor: "pointer",
};

export const categoryPreviewThumbStyle = {
  width: "52px",
  height: "42px",
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
  fontSize: "14px",
  fontWeight: 750,
};

export const evidencePreviewMetaStyle = {
  marginTop: "5px",
  color: THEME.textSecondary,
  fontSize: "13px",
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
  fontSize: "12px",
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
  fontSize: "16px",
  fontWeight: 800,
};

export const galleryMetaStyle = {
  color: THEME.textMuted,
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
  fontSize: "20px",
};

export const pdfCompactStyle = {
  ...categoryPreviewThumbStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: THEME.info,
  fontWeight: 800,
  fontSize: "11px",
};

export const documentTileFooterStyle = {
  padding: "8px",
};

export const documentTileNameStyle = {
  color: THEME.textPrimary,
  fontSize: "11px",
  fontWeight: 750,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

export const documentTileTypeStyle = {
  marginTop: "2px",
  color: THEME.textMuted,
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
  zIndex: 1100,
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
  zIndex: 1110,
  width: "36px",
  height: "36px",
  padding: 0,
  borderRadius: "999px",
  border: panelBorder,
  background: THEME.surface,
  color: THEME.textInverse,
  fontSize: "22px",
  lineHeight: 1,
  cursor: "pointer",
};
