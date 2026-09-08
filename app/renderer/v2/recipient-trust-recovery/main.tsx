import {
  StrictMode,
  useState,
} from "react";

import {
  createRoot,
} from "react-dom/client";

import type {
  CSSProperties,
} from "react";

import type {
  FinoraRecipientTrustRecoveryBridge,
} from "../../../../electron/control/finoraRecipientTrustRecoveryPreload";

// ============================================================
// FINORA ENTERPRISE OS™
//
// RECIPIENT TRUST EMERGENCY RECOVERY
// DEDICATED BREAK-GLASS RENDERER
//
// RESPONSIBILITY:
//
// - Mount only the dedicated Recovery UI
// - Offer one zero-argument native Recovery import action
// - Display bounded coordinator result information
//
// SECURITY:
//
// - No filesystem path input.
// - No package-byte input.
// - No operational trusted-key input.
// - No Recovery Authority input.
// - No installation-target input.
// - No replay-sequence input.
// - No direct Electron IPC.
// - No trust-store access.
// - No Recovery Authority store access.
// - No signing authority.
// ============================================================

declare global {
  interface Window {
    finoraRecipientTrustRecovery?:
      FinoraRecipientTrustRecoveryBridge;
  }
}

// ============================================================
// VIEW STATE
// ============================================================

type RecoveryViewState =
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

      fileName:
        string;

      bytesRead:
        number;

      summary:
        Readonly<
          Record<
            string,
            unknown
          >
        >;
    }
  | {
      status:
        "ERROR";

      error:
        string;
    };

// ============================================================
// SUMMARY HELPERS
// ============================================================

function readSummaryText(
  summary:
    Readonly<
      Record<
        string,
        unknown
      >
    >,
  key:
    string,
): string | undefined {
  const value =
    summary[key];

  if (
    typeof value ===
      "string"
  ) {
    return value;
  }

  if (
    typeof value ===
      "number" &&
    Number.isFinite(
      value,
    )
  ) {
    return String(
      value,
    );
  }

  return undefined;
}

// ============================================================
// COMPONENT
// ============================================================

function RecipientTrustRecoveryApp() {
  const [
    viewState,
    setViewState,
  ] =
    useState<RecoveryViewState>({
      status:
        "IDLE",
    });

  const bridge =
    window.finoraRecipientTrustRecovery;

  async function handleImport():
    Promise<void> {
    if (!bridge) {
      setViewState({
        status:
          "ERROR",

        error:
          "Dedicated FINORA Recipient Trust Recovery preload bridge is unavailable.",
      });

      return;
    }

    if (
      viewState.status ===
        "IMPORTING"
    ) {
      return;
    }

    setViewState({
      status:
        "IMPORTING",
    });

    try {
      const result =
        await bridge.importSignedRecovery();

      if (!result.success) {
        setViewState({
          status:
            "ERROR",

          error:
            result.error,
        });

        return;
      }

      if (
        result.cancelled
      ) {
        setViewState({
          status:
            "CANCELLED",
        });

        return;
      }

      setViewState({
        status:
          "SUCCESS",

        fileName:
          result.fileName,

        bytesRead:
          result.bytesRead,

        summary:
          result.applySummary,
      });
    } catch (
      error
    ) {
      setViewState({
        status:
          "ERROR",

        error:
          error instanceof Error
            ? error.message
            : "Recipient Trust Recovery import failed.",
      });
    }
  }

  const importing =
    viewState.status ===
      "IMPORTING";

  return (
    <main
      aria-labelledby="recipient-trust-recovery-title"
      style={styles.page}
    >
      <section
        style={styles.shell}
      >
        <div
          style={styles.badge}
        >
          BREAK-GLASS SECURITY SURFACE
        </div>

        <h1
          id="recipient-trust-recovery-title"
          style={styles.title}
        >
          Recipient Trust Emergency Recovery
        </h1>

        <p
          style={styles.description}
        >
          Use this isolated surface only to import an independently
          authorized FINORA Recipient Trust Recovery package.
        </p>

        <div
          role="alert"
          style={styles.warning}
        >
          A valid recovery package revokes the expected current
          operational ACTIVE signing key and activates the signed
          replacement key. The renderer cannot choose the file path,
          trusted keys, target, authority, or replay sequence.
        </div>

        <button
          type="button"
          onClick={() => {
            void handleImport();
          }}
          disabled={
            importing ||
            !bridge
          }
          style={{
            ...styles.button,

            opacity:
              importing ||
              !bridge
                ? 0.55
                : 1,

            cursor:
              importing ||
              !bridge
                ? "not-allowed"
                : "pointer",
          }}
        >
          {
            importing
              ? "Importing Recovery…"
              : "Import Signed Recovery"
          }
        </button>

        {
          !bridge && (
            <div
              role="alert"
              style={styles.error}
            >
              Dedicated Recovery preload bridge is unavailable.
            </div>
          )
        }

        {
          viewState.status ===
            "CANCELLED" && (
            <div
              role="status"
              style={styles.neutral}
            >
              Recovery import cancelled. No Recovery package was
              applied.
            </div>
          )
        }

        {
          viewState.status ===
            "ERROR" && (
            <div
              role="alert"
              style={styles.error}
            >
              {viewState.error}
            </div>
          )
        }

        {
          viewState.status ===
            "SUCCESS" && (
            <section
              aria-label="Recovery apply result"
              style={styles.success}
            >
              <strong>
                Recipient Trust Recovery applied.
              </strong>

              <dl
                style={styles.summaryGrid}
              >
                <dt>
                  File
                </dt>

                <dd>
                  {viewState.fileName}
                </dd>

                <dt>
                  Bytes
                </dt>

                <dd>
                  {viewState.bytesRead}
                </dd>

                <dt>
                  Package
                </dt>

                <dd>
                  {
                    readSummaryText(
                      viewState.summary,
                      "packageId",
                    ) ??
                    "—"
                  }
                </dd>

                <dt>
                  Revoked key
                </dt>

                <dd>
                  {
                    readSummaryText(
                      viewState.summary,
                      "revokedSigningKeyId",
                    ) ??
                    "—"
                  }
                </dd>

                <dt>
                  Active key
                </dt>

                <dd>
                  {
                    readSummaryText(
                      viewState.summary,
                      "activeSigningKeyId",
                    ) ??
                    "—"
                  }
                </dd>

                <dt>
                  Sequence
                </dt>

                <dd>
                  {
                    readSummaryText(
                      viewState.summary,
                      "sequence",
                    ) ??
                    "—"
                  }
                </dd>

                <dt>
                  Applied at
                </dt>

                <dd>
                  {
                    readSummaryText(
                      viewState.summary,
                      "appliedAt",
                    ) ??
                    "—"
                  }
                </dd>
              </dl>
            </section>
          )
        }

        <p
          style={styles.footer}
        >
          File selection, authoritative wall-clock validation,
          recovery-root verification, target verification, replay
          enforcement and Recipient Trust mutation execute only in
          Electron main.
        </p>
      </section>
    </main>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles:
  Record<
    string,
    CSSProperties
  > = {
    page: {
      minHeight:
        "100vh",

      padding:
        "40px 24px",

      background:
        "#0f172a",

      fontFamily:
        "Inter, ui-sans-serif, system-ui, sans-serif",

      color:
        "#e2e8f0",
    },

    shell: {
      width:
        "100%",

      maxWidth:
        "760px",

      margin:
        "0 auto",

      padding:
        "32px",

      border:
        "1px solid rgba(148, 163, 184, 0.22)",

      borderRadius:
        "18px",

      background:
        "#111827",

      boxShadow:
        "0 24px 70px rgba(0, 0, 0, 0.26)",
    },

    badge: {
      display:
        "inline-block",

      marginBottom:
        "14px",

      padding:
        "6px 10px",

      borderRadius:
        "999px",

      background:
        "rgba(239, 68, 68, 0.14)",

      fontSize:
        "11px",

      fontWeight:
        700,

      letterSpacing:
        "0.08em",

      color:
        "#fca5a5",
    },

    title: {
      margin:
        0,

      fontSize:
        "28px",

      lineHeight:
        1.2,

      fontWeight:
        700,
    },

    description: {
      margin:
        "14px 0 0",

      fontSize:
        "15px",

      lineHeight:
        1.65,

      color:
        "#cbd5e1",
    },

    warning: {
      marginTop:
        "24px",

      padding:
        "16px",

      border:
        "1px solid rgba(248, 113, 113, 0.35)",

      borderRadius:
        "12px",

      background:
        "rgba(127, 29, 29, 0.18)",

      fontSize:
        "14px",

      lineHeight:
        1.6,

      color:
        "#fecaca",
    },

    button: {
      width:
        "100%",

      marginTop:
        "24px",

      padding:
        "13px 18px",

      border:
        0,

      borderRadius:
        "10px",

      background:
        "#dc2626",

      color:
        "#ffffff",

      fontFamily:
        "inherit",

      fontSize:
        "14px",

      fontWeight:
        700,
    },

    neutral: {
      marginTop:
        "18px",

      padding:
        "14px",

      borderRadius:
        "10px",

      background:
        "rgba(148, 163, 184, 0.10)",

      color:
        "#cbd5e1",
    },

    error: {
      marginTop:
        "18px",

      padding:
        "14px",

      border:
        "1px solid rgba(248, 113, 113, 0.35)",

      borderRadius:
        "10px",

      background:
        "rgba(127, 29, 29, 0.18)",

      color:
        "#fecaca",
    },

    success: {
      marginTop:
        "18px",

      padding:
        "18px",

      border:
        "1px solid rgba(74, 222, 128, 0.30)",

      borderRadius:
        "10px",

      background:
        "rgba(20, 83, 45, 0.18)",

      color:
        "#bbf7d0",
    },

    summaryGrid: {
      display:
        "grid",

      gridTemplateColumns:
        "140px minmax(0, 1fr)",

      gap:
        "8px 14px",

      margin:
        "16px 0 0",

      overflowWrap:
        "anywhere",
    },

    footer: {
      margin:
        "24px 0 0",

      fontSize:
        "12px",

      lineHeight:
        1.6,

      color:
        "#94a3b8",
    },
  };

// ============================================================
// MOUNT
// ============================================================

const rootElement =
  document.getElementById(
    "root",
  );

if (!rootElement) {
  throw new Error(
    "FINORA Recipient Trust Recovery: Root element #root was not found.",
  );
}

createRoot(
  rootElement,
).render(
  <StrictMode>
    <RecipientTrustRecoveryApp />
  </StrictMode>,
);