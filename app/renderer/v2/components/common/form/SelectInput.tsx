// ============================================================
// FINORA ENTERPRISE V2
// DESIGN SYSTEM
// SELECT INPUT
//
// RESPONSIBILITY:
// - Shared enterprise select input
// - FINORA Theme Engine compatibility
// - Native browser dropdown
// - Theme follows active FINORA theme
// - Preserve existing SelectInput API
//
// IMPORTANT:
// - Keep this component native.
// - Do NOT create a custom dropdown menu.
// - Do NOT add custom open/close state.
// - Do NOT add dropdown height / scrollbar logic.
// - Theme colours come only from FINORA CSS variables.
// - Native popup receives explicit FINORA option styling.
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  CSSProperties,
  SelectHTMLAttributes,
} from "react";

// ============================================================
// TYPES
// ============================================================

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectInputProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
}

// ============================================================
// FINORA THEME TOKENS
// ============================================================

const THEME = {
  background:
    "var(--finora-theme-background-surface-deep)",

  optionBackground:
    "var(--finora-theme-background-surface-deep)",

  border:
    "var(--finora-theme-border-default)",

  text:
    "var(--finora-theme-text-primary)",

  textSecondary:
    "var(--finora-theme-text-secondary)",
} as const;

// ============================================================
// NATIVE COLOR SCHEME
// ============================================================
//
// FINORA root theme:
//
// data-theme="light" -> native light controls
// everything else    -> native dark controls
//
// This helps the browser choose the correct native control
// rendering mode.
// ============================================================

function getNativeColorScheme(): "light" | "dark" {
  if (typeof document === "undefined") {
    return "dark";
  }

  return document.documentElement.dataset.theme === "light"
    ? "light"
    : "dark";
}

// ============================================================
// OPTION STYLE
// ============================================================
//
// IMPORTANT:
//
// The previous SelectInput styled only the <select> element.
// The native popup is rendered from <option> elements.
//
// Explicit option styling gives the browser a FINORA theme
// background/text to use for the native popup wherever the
// browser supports option styling.
//
// No custom dropdown implementation is introduced.
// ============================================================

const optionStyle: CSSProperties = {
  backgroundColor:
    THEME.optionBackground,

  color:
    THEME.text,

  fontSize: "12px",

  fontWeight: 500,
};

// ============================================================
// WRAPPER
// ============================================================

const wrapperStyle: CSSProperties = {
  position: "relative",

  width: "100%",
  minWidth: 0,

  boxSizing: "border-box",
};

// ============================================================
// SELECT
// ============================================================

const selectStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  height: "38px",

  padding:
    "8px 34px 8px 11px",

  borderRadius: "8px",

  border:
    `1px solid ${THEME.border}`,

  background:
    THEME.background,

  color:
    THEME.text,

  fontSize: "12px",

  fontWeight: 500,

  lineHeight: 1.2,

  fontFamily: "inherit",

  outline: "none",

  boxSizing: "border-box",

  cursor: "pointer",

  WebkitAppearance: "none",

  MozAppearance: "none",

  appearance: "none",

  /*
   * Native browser popup follows the active
   * FINORA light/dark theme where supported.
   */
  colorScheme:
    getNativeColorScheme(),

  transition:
    "border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
};

// ============================================================
// ARROW
// ============================================================

const arrowStyle: CSSProperties = {
  position: "absolute",

  top: "50%",
  right: "12px",

  width: 0,
  height: 0,

  transform:
    "translateY(-25%)",

  borderLeft:
    "5px solid transparent",

  borderRight:
    "5px solid transparent",

  borderTop:
    `6px solid ${THEME.textSecondary}`,

  pointerEvents: "none",

  zIndex: 2,
};

// ============================================================
// COMPONENT
// ============================================================

export default function SelectInput({
  options,
  style,
  ...props
}: SelectInputProps) {

  return (
    <div
      style={wrapperStyle}
    >

      <select
        {...props}

        style={{
          ...selectStyle,

          ...style,

          /*
           * Preserve FINORA native popup behaviour even
           * when the parent passes additional inline styles.
           */
          colorScheme:
            getNativeColorScheme(),
        }}
      >

        {options.map(
          (option) => (
            <option
              key={option.value}
              value={option.value}
              style={optionStyle}
            >
              {option.label}
            </option>
          ),
        )}

      </select>

      <span
        aria-hidden="true"
        style={arrowStyle}
      />

    </div>
  );
}

// ============================================================
// END
// ============================================================