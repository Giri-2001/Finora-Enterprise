import React, {
  useState,
} from "react";

import {
  createRoot,
} from "react-dom/client";

import type {
  FinoraRecipientTrustMaintenanceBridge,
} from "../../../../electron/control/finoraRecipientTrustMaintenancePreload";

/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST MAINTENANCE
   DEDICATED RENDERER ENTRY

   RESPONSIBILITY:

   - Mount only the dedicated Recipient Trust Maintenance UI
   - Trigger signed trust-transition import through the narrow
     dedicated preload bridge
   - Display only cancelled / success / error outcomes
   - Remain separate from the operational FINORA application
   - Remain separate from the issuer-side Control Center

   SECURITY:

   - No filesystem path input
   - No signed package editor
   - No trusted-key editor
   - No installation-target editor
   - No replay-sequence control
   - No trust-store editor
   - No bootstrap control
   - No signing controls
=========================================================== */

declare global {
  interface Window {
    finoraRecipientTrustMaintenance?:
      FinoraRecipientTrustMaintenanceBridge;
  }
}

type ImportState =
  | {
      status:
        "IDLE";
    }
  | {
      status:
        "IMPORTING";
    }
  | {
      status:
        "CANCELLED";
    }
  | {
      status:
        "SUCCESS";

      message:
        string;
    }
  | {
      status:
        "ERROR";

      message:
        string;
    };

function RecipientTrustMaintenanceApp() {
  const [
    importState,
    setImportState,
  ] =
    useState<ImportState>({
      status:
        "IDLE",
    });

  async function handleImport():
    Promise<void> {
    if (
      importState.status ===
        "IMPORTING"
    ) {
      return;
    }

    const bridge =
      window.finoraRecipientTrustMaintenance;

    if (!bridge) {
      setImportState({
        status:
          "ERROR",

        message:
          "Dedicated FINORA Recipient Trust Maintenance preload bridge is unavailable.",
      });

      return;
    }

    setImportState({
      status:
        "IMPORTING",
    });

    try {
      const result =
        await bridge.importSignedTrustTransition();

      if (!result.success) {
        setImportState({
          status:
            "ERROR",

          message:
            result.error,
        });

        return;
      }

      if (result.cancelled) {
        setImportState({
          status:
            "CANCELLED",
        });

        return;
      }

      setImportState({
        status:
          "SUCCESS",

        message:
          `Applied signed trust transition from ${result.fileName} (${result.bytesRead} bytes).`,
      });
    } catch (
      error
    ) {
      setImportState({
        status:
          "ERROR",

        message:
          error instanceof Error
            ? error.message
            : "Unable to import the signed FINORA Recipient Trust Transition.",
      });
    }
  }

  const resultText =
    importState.status ===
      "IDLE"
      ? "Select a signed Recipient Trust Transition package when maintenance is required."
      : importState.status ===
          "IMPORTING"
        ? "Opening signed trust-transition package..."
        : importState.status ===
            "CANCELLED"
          ? "Import cancelled. No trust transition was applied."
          : importState.message;

  const resultLabel =
    importState.status ===
      "SUCCESS"
      ? "Success"
      : importState.status ===
          "ERROR"
        ? "Error"
        : importState.status ===
            "CANCELLED"
          ? "Cancelled"
          : importState.status ===
              "IMPORTING"
            ? "Importing"
            : "Ready";

  return (
    <main
      style={{
        width:
          "100%",
        minHeight:
          "100vh",
        boxSizing:
          "border-box",
        display:
          "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        padding:
          "32px",
        background:
          "#0f172a",
        color:
          "#e2e8f0",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <section
        aria-labelledby="recipient-trust-maintenance-title"
        style={{
          width:
            "100%",
          maxWidth:
            "620px",
          boxSizing:
            "border-box",
          padding:
            "28px",
          border:
            "1px solid rgba(148, 163, 184, 0.24)",
          borderRadius:
            "16px",
          background:
            "rgba(15, 23, 42, 0.92)",
        }}
      >
        <p
          style={{
            margin:
              "0 0 8px",
            fontSize:
              "12px",
            fontWeight:
              700,
            letterSpacing:
              "0.12em",
            textTransform:
              "uppercase",
            color:
              "#94a3b8",
          }}
        >
          FINORA Enterprise OS™
        </p>

        <h1
          id="recipient-trust-maintenance-title"
          style={{
            margin:
              0,
            fontSize:
              "26px",
            lineHeight:
              1.2,
            fontWeight:
              700,
          }}
        >
          Recipient Trust Maintenance
        </h1>

        <p
          style={{
            margin:
              "14px 0 24px",
            fontSize:
              "14px",
            lineHeight:
              1.6,
            color:
              "#cbd5e1",
          }}
        >
          Import an authorized signed Recipient Trust Transition
          package through the dedicated native maintenance boundary.
        </p>

        <button
          type="button"
          disabled={
            importState.status ===
              "IMPORTING"
          }
          onClick={() => {
            void handleImport();
          }}
          style={{
            width:
              "100%",
            minHeight:
              "44px",
            padding:
              "10px 16px",
            border:
              0,
            borderRadius:
              "10px",
            cursor:
              importState.status ===
                "IMPORTING"
                ? "default"
                : "pointer",
            font:
              "inherit",
            fontWeight:
              650,
            background:
              importState.status ===
                "IMPORTING"
                ? "#334155"
                : "#e2e8f0",
            color:
              importState.status ===
                "IMPORTING"
                ? "#94a3b8"
                : "#0f172a",
          }}
        >
          {importState.status ===
          "IMPORTING"
            ? "Importing..."
            : "Import Signed Trust Transition"}
        </button>

        <section
          aria-live="polite"
          style={{
            marginTop:
              "20px",
            padding:
              "16px",
            border:
              "1px solid rgba(148, 163, 184, 0.18)",
            borderRadius:
              "10px",
            background:
              "rgba(30, 41, 59, 0.65)",
          }}
        >
          <strong
            style={{
              display:
                "block",
              marginBottom:
                "6px",
              fontSize:
                "13px",
            }}
          >
            {resultLabel}
          </strong>

          <p
            style={{
              margin:
                0,
              fontSize:
                "13px",
              lineHeight:
                1.55,
              color:
                "#cbd5e1",
              overflowWrap:
                "anywhere",
            }}
          >
            {resultText}
          </p>
        </section>
      </section>
    </main>
  );
}

const rootElement =
  document.getElementById(
    "root",
  );

if (!rootElement) {
  throw new Error(
    "FINORA Recipient Trust Maintenance: Root element #root was not found.",
  );
}

rootElement.setAttribute(
  "spellcheck",
  "false",
);

createRoot(
  rootElement,
).render(
  <React.StrictMode>
    <RecipientTrustMaintenanceApp />
  </React.StrictMode>,
);