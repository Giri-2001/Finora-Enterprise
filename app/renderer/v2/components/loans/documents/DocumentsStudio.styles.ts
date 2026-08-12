/* ==========================================================
   FINORA ENTERPRISE OS™
   DOCUMENTS STUDIO™ — STYLES
========================================================== */

const panelBorder =
  "1px solid rgba(148, 163, 184, 0.16)";

const blueBorder =
  "1px solid rgba(37, 99, 235, 0.38)";

const navy =
  "#111C2E";

const deepNavy =
  "#0F172A";

const darkerNavy =
  "#0A1425";

const text =
  "#F8FAFC";

const muted =
  "#94A3B8";

const blue =
  "#60A5FA";

export const sectionStyle = {
  width: "100%",
  minWidth: 0,
  minHeight: 0,
  boxSizing: "border-box" as const,
  padding: "18px",
  border: panelBorder,
  borderRadius: "13px",
  background: navy,
  color: "#FFFFFF",
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
  background: "#2563EB",
};

export const headerTextStyle = {
  minWidth: 0,
};

export const headerTitleStyle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 750,
  color: text,
};

export const categorySectionTitleStyle = {
  marginBottom: "8px",
  color: "#CBD5E1",
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
  color: "#CBD5E1",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.08em",
};

export const quickGridStyle = {
  width: "100%",
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: "10px",
};

export const quickCardStyle = {
  minWidth: 0,
  padding: "10px",
  border: blueBorder,
  borderRadius: "10px",
  background: deepNavy,
  boxSizing: "border-box" as const,
};

export const quickTitleStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  marginBottom: "8px",
  color: "#CBD5E1",
  fontSize: "11px",
  fontWeight: 800,
};

export const quickMediaStyle = {
  width: "100%",
  height: "118px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  borderRadius: "8px",
  border: panelBorder,
  background: darkerNavy,
};

export const quickMetaStyle = {
  marginTop: "7px",
  color: muted,
  fontSize: "10px",
};

export const uploadLabelStyle = {
  position: "relative" as const,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "31px",
  marginTop: "8px",
  borderRadius: "7px",
  border: blueBorder,
  background: "rgba(37, 99, 235, 0.12)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
  overflow: "hidden",
};

export const uploadInputStyle = {
  position: "absolute" as const,
  inset: 0,
  opacity: 0,
  cursor: "pointer",
};

export const uploadPlaceholderStyle = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  color: muted,
  fontSize: "10px",
  fontWeight: 600,
  textAlign: "center" as const,
  padding: "8px",
};

export const categoryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",
  gap: "10px",
};

export const categoryCardStyle = {
  minWidth: 0,
  padding: "11px",
  border: panelBorder,
  borderRadius: "10px",
  background: deepNavy,
  boxSizing: "border-box" as const,
};

/*
 * CATEGORY HEADER
 * ----------------------------------------------------------
 * Fixed minimum header height keeps every category card
 * vertically aligned even when a category title wraps to
 * two lines.
 *
 * Example:
 * - Identity Documents       → 1 line
 * - Loan Agreements /        → 2 lines
 *   Promissory Notes
 *
 * Both cards now reserve the same header space, so the
 * preview area and Add Document button stay aligned.
 */
export const categoryHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
  minHeight: "42px",
};

export const categoryIconStyle = {
  width: "30px",
  height: "30px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  borderRadius: "8px",
  border: blueBorder,
  background: "rgba(37, 99, 235, 0.10)",
  color: blue,
  fontSize: "10px",
  fontWeight: 800,
};

export const categoryMetaStyle = {
  marginTop: "2px",
  color: muted,
  fontSize: "10px",
  fontWeight: 500,
};

export const categoryPreviewStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  minHeight: "50px",
  marginTop: "9px",
  overflowX: "auto" as const,
  paddingBottom: "2px",
};

export const categoryPreviewThumbStyle = {
  width: "52px",
  height: "42px",
  flexShrink: 0,
  display: "block",
  objectFit: "cover" as const,
  background: darkerNavy,
};

export const addButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "30px",
  padding: "0 10px",
  marginTop: "8px",
  borderRadius: "7px",
  border: blueBorder,
  background: "rgba(37, 99, 235, 0.12)",
  color: "#93C5FD",
  fontSize: "11px",
  fontWeight: 750,
  cursor: "pointer",
};

export const backButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "30px",
  padding: "0 10px",
  borderRadius: "7px",
  border: panelBorder,
  background: "rgba(15, 23, 42, 0.82)",
  color: "#CBD5E1",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

/* View All button — category cards only. */
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
  background: "rgba(15, 23, 42, 0.82)",
  color: "#CBD5E1",
  fontSize: "11px",
  fontWeight: 700,
  lineHeight: 1,
  cursor: "pointer",
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
};

export const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  minHeight: "22px",
  padding: "0 8px",
  borderRadius: "999px",
  border: "1px solid rgba(37, 99, 235, 0.32)",
  background: "rgba(37, 99, 235, 0.10)",
  color: "#93C5FD",
  fontSize: "10px",
  fontWeight: 800,
};

export const infoBarStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  marginTop: "10px",
  padding: "9px 10px",
  borderRadius: "8px",
  border: "1px solid rgba(37, 99, 235, 0.18)",
  background: "rgba(15, 23, 42, 0.72)",
};

export const infoTextStyle = {
  color: muted,
  fontSize: "10px",
  lineHeight: 1.45,
};

export const emptyStateStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "48px",
  width: "100%",
  color: muted,
  fontSize: "10px",
  fontWeight: 600,
  textAlign: "center" as const,
};

export const fullPageStyle = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 1000,
  display: "flex",
  flexDirection: "column" as const,
  padding: "18px",
  boxSizing: "border-box" as const,
  background: "#07101E",
  color: "#FFFFFF",
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

export const galleryTitleStyle = {
  color: text,
  fontSize: "16px",
  fontWeight: 800,
};

export const galleryViewportStyle = {
  height: "455px",
  maxHeight: "calc(100vh - 110px)",
  minHeight: 0,
  overflowY: "auto" as const,
  paddingTop: "12px",
  paddingBottom: "20px",
  boxSizing: "border-box" as const,
};

export const galleryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(5, minmax(0, 1fr))",
  gap: "10px",
  alignItems: "start",
};

export const documentTileStyle = {
  minWidth: 0,
  overflow: "hidden",
  border: panelBorder,
  borderRadius: "9px",
  background: deepNavy,
};

export const documentTileImageStyle = {
  width: "100%",
  height: "100%",
  maxWidth: "100%",
  maxHeight: "100%",
  display: "block",
  objectFit: "contain" as const,
  objectPosition: "center" as const,
  background: darkerNavy,
};

export const documentTileFooterStyle = {
  padding: "8px",
};

export const documentTileNameStyle = {
  color: "#F8FAFC",
  fontSize: "11px",
  fontWeight: 750,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

export const documentTileTypeStyle = {
  marginTop: "2px",
  color: muted,
  fontSize: "9px",
  fontWeight: 600,
};

export const renameButtonStyle = {
  flex: 1,
  minHeight: "25px",
  borderRadius: "6px",
  border: "1px solid rgba(37, 99, 235, 0.25)",
  background: "rgba(37, 99, 235, 0.08)",
  color: "#93C5FD",
  fontSize: "9px",
  fontWeight: 700,
  cursor: "pointer",
};

export const itemMenuStyle = {
  width: "25px",
  height: "25px",
  padding: 0,
  borderRadius: "6px",
  border: "1px solid rgba(239, 68, 68, 0.22)",
  background: "rgba(239, 68, 68, 0.08)",
  color: "#FCA5A5",
  fontSize: "15px",
  lineHeight: 1,
  cursor: "pointer",
};

export const viewerBackdropStyle = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 1100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  boxSizing: "border-box" as const,
  background: "rgba(2, 8, 23, 0.88)",
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
  border: blueBorder,
  borderRadius: "12px",
  background: "#0A1425",
  boxShadow: "0 30px 100px rgba(0,0,0,0.55)",
};

export const viewerTitleStyle = {
  alignSelf: "stretch",
  color: "#F8FAFC",
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
  background: "#FFFFFF",
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
  border: "1px solid rgba(148, 163, 184, 0.22)",
  background: "#111C2E",
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  cursor: "pointer",
};

export const uploadCardStyle = {
  minWidth: 0,
  border: "1px dashed rgba(37, 99, 235, 0.38)",
  borderRadius: "10px",
  background: "rgba(15, 23, 42, 0.55)",
};

export const uploadCardStyleUnused = uploadCardStyle;

export const quickMetaStyleUnused = quickMetaStyle;
