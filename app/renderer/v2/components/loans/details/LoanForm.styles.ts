// ============================================================
// FINORA ENTERPRISE V2
//
// LOAN DETAILS STUDIO
// LOAN FORM STYLES
//
// RESPONSIBILITY:
// - LoanForm presentation only.
// - Theme-driven visual appearance.
// - Responsive form geometry is supplied by
//   Step 1 Responsive Tokens.
//
// IMPORTANT:
// - No viewport detection.
// - No window.innerWidth.
// - No media queries.
// - No business logic.
// - No local breakpoint definitions.
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type { CSSProperties } from "react";

/* ============================================================
   STEP 1 RESPONSIVE TOKENS
============================================================ */

import type { Step1DetailsResponsiveTokens } from "../../../utils/responsive/step1Details/step1Details.types";

/* ============================================================
   THEME VARIABLES
============================================================ */

const COLORS = {
  background: "var(--finora-theme-surface)",

  panel: "var(--finora-theme-surface)",

  panelSoft: "var(--finora-theme-surface-muted)",

  input: "var(--finora-theme-surface-muted)",

  border: "var(--finora-theme-border-default)",

  primary: "var(--finora-theme-brand-primary)",

  primarySoft:
    "var(--finora-theme-brand-primary-soft, color-mix(in srgb, var(--finora-theme-brand-primary) 14%, var(--finora-theme-surface)))",

  text: "var(--finora-theme-text-primary)",

  textSecondary: "var(--finora-theme-text-secondary)",

  textMuted: "var(--finora-theme-text-muted)",

  required: "var(--finora-theme-brand-accent)",
};

const FORM_FONT_FAMILY =
  "Inter, ui-sans-serif, system-ui, sans-serif";

/* ============================================================
   SECTION
============================================================ */

export const sectionStyle: CSSProperties = {
  fontFamily: FORM_FONT_FAMILY,
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  padding: "10px 10px",

  marginBottom: "5px",

  border: `1px solid ${COLORS.border}`,

  borderRadius: "9px",

  background: COLORS.panel,

  boxShadow: "none",
};

/* ============================================================
   SECTION TITLE
============================================================ */

export const sectionTitleStyle: CSSProperties = {
  fontFamily: FORM_FONT_FAMILY,
  marginBottom: "6px",

  color: COLORS.text,

  fontSize: "14px",

  fontWeight: 650,

  lineHeight: 1.4,

  letterSpacing: "0.01em",

  minHeight: "19px",
};

/* ============================================================
   RESPONSIVE FORM GRID
============================================================ */

/*
   Central contract:

   Mobile
     1 column

   Tablet
     2 columns

   Laptop
     4 columns

   Desktop
     4 columns

   The number comes exclusively from
   Step1DetailsResponsiveTokens.formColumns.
*/

export function createLoanFormGridStyle(
  tokens: Step1DetailsResponsiveTokens,
): CSSProperties {
  return {
    fontFamily: FORM_FONT_FAMILY,
    display: "grid",

    gridTemplateColumns: `repeat(
        ${tokens.formColumns},
        minmax(0, 1fr)
      )`,

    columnGap: `${tokens.formColumnGap}px`,

    rowGap: `${tokens.formRowGap}px`,

    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    alignItems: "start",
  };
}

/* ============================================================
   LEGACY COMPATIBILITY GRID
============================================================ */

/*
   Existing consumers that still import formGridStyle
   remain supported.

   Laptop is the legacy/default presentation.
*/

export const formGridStyle: CSSProperties = {
  fontFamily: FORM_FONT_FAMILY,
  display: "grid",

  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",

  gap: "7px 8px",

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  alignItems: "start",
};

/* ============================================================
   FIELD GROUP
============================================================ */

export const fieldGroupStyle: CSSProperties = {
  fontFamily: FORM_FONT_FAMILY,
  display: "flex",

  flexDirection: "column",

  gap: "8px",

  minWidth: 0,

  width: "100%",

  boxSizing: "border-box",
};

/* ============================================================
   FIELD LABEL
============================================================ */

export const fieldLabelStyle: CSSProperties = {
  fontFamily: FORM_FONT_FAMILY,
  display: "flex",

  alignItems: "center",

  gap: "3px",

  minHeight: "19px",

  color: COLORS.textSecondary,

  fontSize: "14px",

  fontWeight: 600,

  lineHeight: 1.35,

  whiteSpace: "nowrap",

  overflow: "hidden",

  textOverflow: "ellipsis",
};

/* ============================================================
   REQUIRED MARK
============================================================ */

export const requiredMarkStyle: CSSProperties = {
  fontFamily: FORM_FONT_FAMILY,
  color: COLORS.required,

  fontSize: "18px",

  fontWeight: 700,
};

/* ============================================================
   INPUT
============================================================ */

export const inputStyle: CSSProperties = {
  fontFamily: FORM_FONT_FAMILY,
  width: "100%",

  minWidth: 0,

  height: "39px",

  minHeight: "39px",

  padding: "0 9px",

  boxSizing: "border-box",

  border: `1px solid ${COLORS.border}`,

  borderRadius: "6px",

  outline: "none",

  background: COLORS.input,

  color: COLORS.text,

  fontSize: "14px",

  fontWeight: 550,

  lineHeight: "39px",

  transition: "border-color 0.16s ease, box-shadow 0.16s ease",
};

/* ============================================================
   SELECT
============================================================ */

export const selectStyle: CSSProperties = {
  ...inputStyle,

  cursor: "pointer",

  appearance: "auto",
};

/* ============================================================
   TEXTAREA
============================================================ */

export const textareaStyle: CSSProperties = {
  fontFamily: FORM_FONT_FAMILY,
  width: "100%",

  minWidth: 0,

  height: "42px",

  minHeight: "40px",

  padding: "6px 9px",

  boxSizing: "border-box",

  resize: "none",

  border: `1px solid ${COLORS.border}`,

  borderRadius: "6px",

  outline: "none",

  background: COLORS.input,

  color: COLORS.text,

  fontSize: "14px",

  fontWeight: 550,

  lineHeight: 1.25,
};

/* ============================================================
   DURATION GROUP
============================================================ */

export const durationGroupStyle: CSSProperties = {
  fontFamily: FORM_FONT_FAMILY,
  display: "grid",

  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",

  alignItems: "center",

  gap: "5px",

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",
};

/* ============================================================
   END
============================================================ */
