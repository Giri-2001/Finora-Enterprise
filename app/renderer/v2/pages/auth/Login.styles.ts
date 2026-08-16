// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE LOGIN STYLES
//
// MODULE  : Authentication
// LAYER   : Renderer / Login
// VERSION : 3.0
// STATUS  : Production
//
// RESPONSIBILITY:
//
// - Own all visual styling for Login.tsx
// - Keep Login component free from inline CSS
// - Maintain Login-specific layout, controls and states
// - Adapt Login layout across desktop, tablet and mobile
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  CSSProperties,
} from "react";

import type {
  ResponsiveState,
} from "../../utils/responsive/useResponsive";

// ============================================================
// RESPONSIVE LOGIN STYLES
// ============================================================

export function getLoginStyles(
  responsive: ResponsiveState,
): Record<string, CSSProperties> {

  const {
    isMobile,
    isTablet,
  } = responsive;

  const compact =
    isMobile || isTablet;

  return {

    // ========================================================
    // PAGE
    // ========================================================

    container: {
      width: "100%",
      minHeight: "100vh",

      display: "flex",
      alignItems: "center",
      justifyContent: "center",

      background: "#0f172a",

      color: "#ffffff",

      fontFamily: "Segoe UI, sans-serif",

      boxSizing: "border-box",

      overflowX: "hidden",

      padding: isMobile
        ? "16px"
        : isTablet
          ? "20px"
          : "24px",
    },

    // ========================================================
    // CARD
    // ========================================================

    card: {
      width: isMobile
        ? "100%"
        : isTablet
          ? 400
          : 410,

      maxWidth: "100%",

      padding: isMobile
        ? 20
        : compact
          ? 24
          : 30,

      background: "#111827",

      borderRadius: isMobile
        ? 14
        : 16,

      border: "1px solid #334155",

      boxShadow:
        "0 20px 60px rgba(0,0,0,.35)",

      boxSizing: "border-box",
    },

    // ========================================================
    // HEADER
    // ========================================================

    title: {
      margin: 0,

      textAlign: "center",

      letterSpacing: 1,

      fontSize: isMobile
        ? 26
        : 30,
    },

    subtitle: {
      textAlign: "center",

      opacity: 0.7,

      marginTop: 8,

      marginBottom: isMobile
        ? 20
        : 24,

      fontSize: isMobile
        ? 14
        : 16,
    },

    // ========================================================
    // USB STATUS
    // ========================================================

    usbStatusRow: {
      display: "flex",

      alignItems: "center",

      gap: 10,

      fontWeight: 700,

      fontSize: isMobile
        ? 12
        : 13,
    },

    usbMessage: {
      marginTop: 7,

      fontSize: isMobile
        ? 11
        : 12,

      color: "#94a3b8",

      lineHeight: 1.5,

      overflowWrap: "anywhere",
    },

    startupMessage: {
      fontSize: 12,

      color: "#64748b",

      textAlign: "center",

      paddingTop: 4,
    },

    // ========================================================
    // BUTTONS
    // ========================================================

    usbLoginButton: {
      width: "100%",

      padding: isMobile
        ? "12px"
        : "13px 14px",

      minHeight: isMobile
        ? 46
        : 44,

      borderRadius: 10,

      color: "#ffffff",

      cursor: "pointer",

      fontWeight: 800,

      marginBottom: 12,

      boxSizing: "border-box",
    },

    enabledButton: {
      border:
        "1px solid rgba(34,197,94,.55)",

      background: "#14532d",

      opacity: 1,
    },

    disabledButton: {
      border: "1px solid #334155",

      background: "#1e293b",

      cursor: "not-allowed",

      opacity: 0.65,
    },

    normalLoginButton: {
      width: "100%",

      padding: isMobile
        ? "12px"
        : "13px 14px",

      minHeight: isMobile
        ? 46
        : 44,

      borderRadius: 10,

      border: "1px solid #475569",

      background: "#1e293b",

      color: "#ffffff",

      cursor: "pointer",

      fontWeight: 800,

      marginBottom: 12,

      boxSizing: "border-box",
    },

    primaryButton: {
      width: "100%",

      padding: isMobile
        ? "12px"
        : "12px",

      minHeight: isMobile
        ? 46
        : 44,

      marginTop: 16,

      borderRadius: 9,

      border: "none",

      background: "#2563eb",

      color: "#ffffff",

      cursor: "pointer",

      fontWeight: 700,

      boxSizing: "border-box",
    },

    secondaryButton: {
      width: "100%",

      padding: isMobile
        ? "11px"
        : "10px",

      minHeight: isMobile
        ? 44
        : 42,

      marginTop: 10,

      borderRadius: 9,

      border: "1px solid #334155",

      background: "transparent",

      color: "#94a3b8",

      cursor: "pointer",

      fontWeight: 600,

      boxSizing: "border-box",
    },

    // ========================================================
    // HELPER TEXT
    // ========================================================

    helperText: {
      textAlign: "center",

      fontSize: 11,

      color: "#64748b",

      lineHeight: 1.5,
    },

    helperTextWithMargin: {
      textAlign: "center",

      fontSize: 11,

      color: "#64748b",

      marginBottom: 14,

      lineHeight: 1.5,
    },

    // ========================================================
    // LOGIN MODE PANELS
    // ========================================================

    loginModePanelUsb: {
      padding: isMobile
        ? 10
        : 12,

      marginBottom: 14,

      borderRadius: 10,

      background:
        "rgba(22,101,52,.18)",

      border:
        "1px solid rgba(34,197,94,.35)",

      fontSize: isMobile
        ? 11
        : 12,

      color: "#bbf7d0",

      fontWeight: 700,

      lineHeight: 1.5,

      overflowWrap: "anywhere",
    },

    loginModePanelNormal: {
      padding: isMobile
        ? 10
        : 12,

      marginBottom: 14,

      borderRadius: 10,

      background: "#0f172a",

      border: "1px solid #334155",

      fontSize: isMobile
        ? 11
        : 12,

      color: "#cbd5e1",

      fontWeight: 700,

      lineHeight: 1.5,

      overflowWrap: "anywhere",
    },

    loginModePanelSubtext: {
      marginTop: 4,

      color: "#94a3b8",

      fontWeight: 500,

      overflowWrap: "anywhere",
    },

    // ========================================================
    // FORM
    // ========================================================

    input: {
      width: "100%",

      padding: isMobile
        ? "12px"
        : "11px",

      minHeight: isMobile
        ? 44
        : 42,

      marginTop: 12,

      borderRadius: 8,

      border: "1px solid #334155",

      background: "#1e293b",

      color: "#ffffff",

      boxSizing: "border-box",

      outline: "none",

      fontSize: 14,
    },

    // ========================================================
    // ERROR
    // ========================================================

    error: {
      color: "#f87171",

      fontSize: 13,

      lineHeight: 1.5,

      marginTop: 12,

      marginBottom: 0,

      overflowWrap: "anywhere",
    },

    chooserError: {
      color: "#f87171",

      fontSize: 13,

      lineHeight: 1.5,

      marginTop: 14,

      marginBottom: 0,

      textAlign: "center",

      overflowWrap: "anywhere",
    },

    // ========================================================
    // DEVELOPMENT ACCOUNT
    // ========================================================

    developmentAccount: {
      marginTop: isMobile
        ? 16
        : 20,

      marginBottom: 0,

      fontSize: 12,

      opacity: 0.6,

      lineHeight: 1.5,

      textAlign: "center",
    },
  };
}

// ============================================================
// DEFAULT LOGIN STYLES
//
// Kept for compatibility with existing consumers.
// Login.tsx will use getLoginStyles() for responsive styling.
// ============================================================


// ============================================================
// USB STATUS STYLE HELPERS
// ============================================================

export function getUsbStatusStyle(
  usbAvailable: boolean,
): CSSProperties {
  return {
    marginBottom: 20,

    padding: 14,

    borderRadius: 12,

    border:
      usbAvailable
        ? "1px solid rgba(34,197,94,.45)"
        : "1px solid #334155",

    background:
      usbAvailable
        ? "rgba(22,101,52,.18)"
        : "#0f172a",

    boxSizing: "border-box",
  };
}

export function getUsbStatusIndicatorStyle(
  usbChecking: boolean,
  usbAvailable: boolean,
): CSSProperties {
  return {
    width: 9,

    height: 9,

    borderRadius: "50%",

    background:
      usbChecking
        ? "#f59e0b"
        : usbAvailable
          ? "#22c55e"
          : "#64748b",

    flexShrink: 0,
  };
}

// ============================================================
// END
// ============================================================