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

import {
  useState,
  type CSSProperties,
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

  onExportEnrollmentRequest():
    void | Promise<void>;

  onImportEnrollmentResponse(
    expectedControlCenterPublicKeyFingerprint:
      string,
  ):
    void | Promise<void>;

  onImportControlBundle():
    void | Promise<void>;  retrying?: boolean;

  enrollmentExporting?: boolean;

  enrollmentExportMessage?: string;

  enrollmentImporting?: boolean;

  enrollmentImportMessage?: string;
  controlBundleImporting?: boolean;

  controlBundleImportMessage?: string;
}

// ============================================================
// COMPONENT
// ============================================================

export default function BranchActivationRequired({
  message =
    "This FINORA installation is not currently activated for a registered business branch.",

  onRetry,

  onExportEnrollmentRequest,

  onImportEnrollmentResponse,

  onImportControlBundle,

  retrying = false,

  enrollmentExporting = false,

  enrollmentExportMessage = "",

  enrollmentImporting = false,

  enrollmentImportMessage = "",
  controlBundleImporting = false,

  controlBundleImportMessage = "",
}: BranchActivationRequiredProps) {
  const { theme } =
    useTheme();

  const { tokens } =
    useResponsive();

  const [controlCenterFingerprint, setControlCenterFingerprint] =
    useState<string>(
      "",
    );

  const fingerprintValid =
    /^[0-9a-f]{64}$/.test(
      controlCenterFingerprint.trim(),
    );

  const interactionBusy =
    retrying ||
    enrollmentExporting ||
    enrollmentImporting ||
    controlBundleImporting;

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

  const actionRowStyle: CSSProperties = {
    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    flexWrap:
      "wrap",

    gap:
      `${tokens.spacing.small}px`,
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
      interactionBusy
        ? "default"
        : "pointer",

    fontSize:
      `${tokens.button.fontSize}px`,

    fontWeight: 600,

    boxSizing: "border-box",

    opacity:
      interactionBusy
        ? 0.7
        : 1,
  };

  const fingerprintFieldStyle: CSSProperties = {
    display:
      "grid",

    gap:
      "6px",

    marginBottom:
      `${tokens.spacing.medium}px`,

    textAlign:
      "left",
  };

  const fingerprintLabelStyle: CSSProperties = {
    fontSize:
      `${tokens.typography.body}px`,

    lineHeight:
      tokens.lineHeight.body,

    fontWeight:
      600,

    color:
      theme.colors.text.secondary,
  };

  const fingerprintInputStyle: CSSProperties = {
    width:
      "100%",

    height:
      `${tokens.button.height}px`,

    padding:
      "0 12px",

    boxSizing:
      "border-box",

    borderRadius:
      `${tokens.button.radius}px`,

    border:
      `${tokens.border.width}px solid ${theme.components.card.border}`,

    background:
      theme.colors.background.page,

    color:
      theme.colors.text.primary,

    fontFamily:
      "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize:
      `${tokens.typography.body}px`,

    outline:
      "none",
  };  // ==========================================================
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

        {enrollmentExportMessage ? (
          <p style={noteStyle}>
            {enrollmentExportMessage}
          </p>
        ) : null}

        {enrollmentImportMessage ? (
          <p style={noteStyle}>
            {enrollmentImportMessage}
          </p>
        ) : null}

        {controlBundleImportMessage ? (
          <p style={noteStyle}>
            {controlBundleImportMessage}
          </p>
        ) : null}        <div style={fingerprintFieldStyle}>
          <label
            htmlFor="finora-control-center-fingerprint"
            style={fingerprintLabelStyle}
          >
            FINORA Control Center SHA-256 Fingerprint
          </label>

          <input
            id="finora-control-center-fingerprint"
            type="text"
            value={controlCenterFingerprint}
            onChange={(event) => {
              setControlCenterFingerprint(
                event.target.value,
              );
            }}
            placeholder="64 lowercase hexadecimal characters"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={interactionBusy}
            style={fingerprintInputStyle}
          />

          <span style={noteStyle}>
            Enter the fingerprint supplied independently by FINORA Control Center.
          </span>
        </div>

        <div style={actionRowStyle}>
          <button
            type="button"
            onClick={() => {
              void onExportEnrollmentRequest();
            }}
            disabled={
              interactionBusy
            }
            style={buttonStyle}
          >
            {enrollmentExporting
              ? "Exporting Enrollment..."
              : "Export Enrollment Request"}
          </button>

          <button
            type="button"
            onClick={() => {
              void onImportEnrollmentResponse(
                controlCenterFingerprint.trim(),
              );
            }}
            disabled={
              interactionBusy ||
              !fingerprintValid
            }
            style={buttonStyle}
          >
            {enrollmentImporting
              ? "Importing Enrollment..."
              : "Import Enrollment Response"}
          </button>

          <button
            type="button"
            onClick={() => {
              void onImportControlBundle();
            }}
            disabled={interactionBusy}
            style={buttonStyle}
          >
            {controlBundleImporting
              ? "Importing Control Bundle..."
              : "Import Control Bundle"}
          </button>          <button
            type="button"
            onClick={onRetry}
            disabled={
              interactionBusy
            }
            style={buttonStyle}
          >
            {retrying
              ? "Checking Activation..."
              : "Check Activation"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// END
// ============================================================