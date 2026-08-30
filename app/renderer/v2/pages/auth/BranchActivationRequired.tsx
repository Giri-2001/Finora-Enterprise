// ============================================================
// FINORA ENTERPRISE OS™
//
// BRANCH ACTIVATION REQUIRED
//
// RESPONSIBILITY:
//
// - Block normal FINORA login on an unprovisioned installation
// - Block normal FINORA login when branch activation is not ACTIVE
// - Provide a safe retry after trusted provisioning completes
//
// IMPORTANT:
//
// - This screen does NOT activate a branch.
// - This screen does NOT grant LOCAL / USB entitlement.
// - This screen does NOT contain pricing.
// - This screen does NOT access native bridges directly.
// - This screen does NOT access storage.
// - This screen does NOT access authentication state.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  CSSProperties,
} from "react";

import {
  useTheme,
} from "../../themes/provider";

import {
  useResponsive,
} from "../../utils/responsive";

// ============================================================
// PROPS
// ============================================================

interface BranchActivationRequiredProps {
  message?: string;

  onRetry(): void;

  retrying?: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

export default function BranchActivationRequired({
  message =
    "This FINORA installation is not currently activated for a registered business branch.",

  onRetry,

  retrying = false,
}: BranchActivationRequiredProps) {
  const { theme } =
    useTheme();

  const { tokens } =
    useResponsive();

  // ==========================================================
  // STYLES
  // ==========================================================

  const rootStyle: CSSProperties = {
    width: "100%",

    height: "100%",

    minWidth: 0,

    minHeight: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    padding:
      `${tokens.spacing.page}px`,

    boxSizing: "border-box",

    background:
      theme.colors.background.page,

    color:
      theme.colors.text.primary,

    fontFamily:
      "Segoe UI, sans-serif",
  };

  const cardStyle: CSSProperties = {
    width: "100%",

    maxWidth:
      `${tokens.card.maxWidth}px`,

    padding:
      `${tokens.card.padding}px`,

    borderRadius:
      `${tokens.card.radius}px`,

    background:
      theme.components.card.background,

    border:
      `${tokens.border.width}px solid ${theme.components.card.border}`,

    boxShadow:
      theme.components.card.shadow,

    boxSizing: "border-box",

    textAlign: "center",
  };

  const eyebrowStyle: CSSProperties = {
    margin: 0,

    marginBottom:
      `${tokens.spacing.small}px`,

    fontSize:
      `${tokens.typography.body}px`,

    lineHeight:
      tokens.lineHeight.body,

    fontWeight: 700,

    letterSpacing: "0.08em",

    color:
      theme.colors.text.secondary,
  };

  const titleStyle: CSSProperties = {
    margin: 0,

    marginBottom:
      `${tokens.spacing.medium}px`,

    fontSize:
      `${tokens.typography.heading}px`,

    lineHeight:
      tokens.lineHeight.heading,

    fontWeight: 700,

    color:
      theme.typography.heading,
  };

  const messageStyle: CSSProperties = {
    margin: 0,

    marginBottom:
      `${tokens.spacing.medium}px`,

    fontSize:
      `${tokens.typography.body}px`,

    lineHeight:
      tokens.lineHeight.body,

    color:
      theme.typography.body,
  };

  const noteStyle: CSSProperties = {
    margin: 0,

    marginBottom:
      `${tokens.spacing.medium}px`,

    fontSize:
      `${tokens.typography.body}px`,

    lineHeight:
      tokens.lineHeight.body,

    color:
      theme.colors.text.secondary,
  };

  const buttonStyle: CSSProperties = {
    minWidth:
      `${tokens.button.minHeight}px`,

    height:
      `${tokens.button.height}px`,

    padding:
      `0 ${tokens.button.paddingX}px`,

    borderRadius:
      `${tokens.button.radius}px`,

    border:
      `${tokens.border.width}px solid ${theme.components.button.primaryBackground}`,

    background:
      theme.components.button.primaryBackground,

    color:
      theme.components.button.primaryText,

    cursor:
      retrying
        ? "default"
        : "pointer",

    fontSize:
      `${tokens.button.fontSize}px`,

    fontWeight: 600,

    boxSizing: "border-box",

    opacity:
      retrying
        ? 0.7
        : 1,
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div style={rootStyle}>
      <div style={cardStyle}>
        <div style={eyebrowStyle}>
          FINORA ENTERPRISE
        </div>

        <h1 style={titleStyle}>
          FINORA Branch Activation Required
        </h1>

        <p style={messageStyle}>
          {message}
        </p>

        <p style={noteStyle}>
          Complete trusted FINORA branch provisioning before signing in.
        </p>

        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          style={buttonStyle}
        >
          {retrying
            ? "Checking Activation..."
            : "Check Activation"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// END
// ============================================================