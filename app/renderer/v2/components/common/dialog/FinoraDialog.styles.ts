// ============================================================
// FINORA ENTERPRISE OS™
//
// GLOBAL PREMIUM DIALOG STYLES
//
// ============================================================

import type {
  CSSProperties,
} from "react";

import type {
  FinoraDialogKind,
} from "./finoraDialog.service";

const THEME = {
  surface:
    "var(--finora-theme-surface, #FFFFFF)",

  surfaceMuted:
    "var(--finora-theme-surface-muted, #F8FAFC)",

  textPrimary:
    "var(--finora-theme-text-primary, #0F172A)",

  textSecondary:
    "var(--finora-theme-text-secondary, #475569)",

  border:
    "var(--finora-theme-border-default, #D7DEE8)",

  primary:
    "var(--finora-theme-brand-primary, #C58A00)",

  primaryText:
    "var(--finora-theme-brand-on-primary, #FFFFFF)",

  success:
    "var(--finora-theme-status-success, #16A34A)",

  danger:
    "var(--finora-theme-status-danger, #DC2626)",

  warning:
    "var(--finora-theme-status-warning, #D38B00)",

  info:
    "var(--finora-theme-status-info, #2563EB)",

  overlay:
    "var(--finora-theme-overlay-backdrop, rgba(15,23,42,.64))",

  shadow:
    "var(--finora-theme-overlay-shadow, rgba(15,23,42,.28))",
} as const;

export const dialogAnimationCss = `
  @keyframes finora-dialog-backdrop-in {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @keyframes finora-dialog-card-in {
    from {
      opacity: 0;
      transform: translateY(16px) scale(.94);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes finora-dialog-icon-in {
    0% {
      opacity: 0;
      transform: scale(.35);
    }

    68% {
      opacity: 1;
      transform: scale(1.12);
    }

    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes finora-dialog-check-in {
    0% {
      opacity: 0;
      transform: rotate(-12deg) scale(.4);
    }

    100% {
      opacity: 1;
      transform: rotate(0) scale(1);
    }
  }

  .finora-dialog-backdrop {
    animation:
      finora-dialog-backdrop-in
      160ms
      ease-out
      both;
  }

  .finora-dialog-card {
    animation:
      finora-dialog-card-in
      240ms
      cubic-bezier(.2,.9,.24,1.08)
      both;
  }

  .finora-dialog-icon {
    animation:
      finora-dialog-icon-in
      420ms
      cubic-bezier(.2,.9,.24,1.15)
      both;
  }

  .finora-dialog-icon-mark {
    animation:
      finora-dialog-check-in
      260ms
      150ms
      ease-out
      both;
  }

  .finora-dialog-button {
    transition:
      transform 120ms ease,
      box-shadow 120ms ease,
      filter 120ms ease;
  }

  .finora-dialog-button:hover {
    filter: brightness(1.035);
    transform: translateY(-1px);
  }

  .finora-dialog-button:active {
    transform: translateY(0);
  }

  .finora-dialog-button:focus-visible {
    outline: 3px solid rgba(37,99,235,.24);
    outline-offset: 2px;
  }
`;

export const backdropStyle:
  CSSProperties = {
    position: "fixed",

    inset: 0,

    zIndex: 5000,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    padding: "16px",

    boxSizing: "border-box",

    background: THEME.overlay,

    backdropFilter: "blur(5px)",
  };

export const cardStyle:
  CSSProperties = {
    width:
      "min(440px, calc(100vw - 32px))",

    maxHeight:
      "min(680px, calc(100vh - 32px))",

    overflowY: "auto",

    boxSizing: "border-box",

    padding: "22px 24px 20px",

    border:
      `1px solid ${THEME.border}`,

    borderRadius: "20px",

    background: `
      linear-gradient(
        180deg,
        ${THEME.surface},
        ${THEME.surfaceMuted}
      )
    `,

    boxShadow:
      `0 28px 90px ${THEME.shadow}`,

    fontFamily:
      "Inter, ui-sans-serif, system-ui, sans-serif",

    color: THEME.textPrimary,
  };

export const brandTitleStyle:
  CSSProperties = {
    margin: 0,

    color: THEME.primary,

    fontSize: "13px",

    fontWeight: 850,

    lineHeight: 1.2,

    letterSpacing: "1.8px",

    textAlign: "center",
  };

export const titleDividerStyle:
  CSSProperties = {
    width: "44px",

    height: "3px",

    margin: "10px auto 18px",

    borderRadius: "999px",

    background: THEME.primary,
  };

function resolveKindColour(
  kind: FinoraDialogKind,
): string {
  switch (kind) {
    case "success":
      return THEME.success;

    case "error":
      return THEME.danger;

    case "warning":
      return THEME.warning;

    case "info":
      return THEME.info;

    case "confirm":
      return THEME.primary;
  }
}

export function createIconStyle(
  kind: FinoraDialogKind,
): CSSProperties {
  const colour =
    resolveKindColour(kind);

  return {
    width: "72px",

    height: "72px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    margin: "0 auto 16px",

    boxSizing: "border-box",

    border:
      `3px solid ${colour}`,

    borderRadius: "999px",

    background: THEME.surface,

    color: colour,

    boxShadow:
      `0 10px 28px color-mix(in srgb, ${colour} 25%, transparent)`,

    fontSize: "38px",

    fontWeight: 900,

    lineHeight: 1,
  };
}

export const headingStyle:
  CSSProperties = {
    margin: 0,

    color: THEME.textPrimary,

    fontSize: "21px",

    fontWeight: 850,

    lineHeight: 1.3,

    textAlign: "center",
  };

export const messageStyle:
  CSSProperties = {
    margin: "10px 0 0",

    maxHeight: "300px",

    overflowY: "auto",

    color: THEME.textSecondary,

    fontSize: "15px",

    fontWeight: 550,

    lineHeight: 1.6,

    textAlign: "center",

    whiteSpace: "pre-wrap",

    overflowWrap: "anywhere",
  };

export const actionRowStyle:
  CSSProperties = {
    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "10px",

    marginTop: "22px",

    flexWrap: "wrap",
  };

const sharedButtonStyle:
  CSSProperties = {
    minWidth: "104px",

    minHeight: "44px",

    padding: "10px 18px",

    boxSizing: "border-box",

    borderRadius: "11px",

    fontFamily:
      "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "14px",

    fontWeight: 800,

    lineHeight: 1.2,

    cursor: "pointer",
  };

export const cancelButtonStyle:
  CSSProperties = {
    ...sharedButtonStyle,

    border:
      `1px solid ${THEME.border}`,

    background: THEME.surfaceMuted,

    color: THEME.textPrimary,

    boxShadow:
      "0 4px 12px rgba(15,23,42,.08)",
  };

export function createConfirmButtonStyle(
  kind: FinoraDialogKind,
): CSSProperties {
  const background =
    kind === "error"
      ? THEME.danger
      : kind === "success"
        ? THEME.success
        : THEME.primary;

  return {
    ...sharedButtonStyle,

    border: "1px solid transparent",

    background,

    color: THEME.primaryText,

    boxShadow:
      `0 8px 20px color-mix(in srgb, ${background} 28%, transparent)`,
  };
}

// ============================================================
// END
// ============================================================
