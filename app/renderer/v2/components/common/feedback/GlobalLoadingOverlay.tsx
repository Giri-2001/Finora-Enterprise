/* ===========================================================
   FINORA ENTERPRISE OS™

   GLOBAL PREMIUM LOADING OVERLAY™

   RESPONSIBILITY:
   - Display the canonical FINORA processing state
   - Block interaction while an operation is running
   - Match the FINORA Premium Dialog visual language
   - Remain below FINORA dialogs in the overlay stack
   - Render through document.body for reliable global coverage
   - Provide one reusable processing surface across V2 modules

   IMPORTANT:
   - Presentation only
   - No business logic
   - No async logic
   - No persistence
   - No module-specific styling
   - FINORA Dialogs must remain visually above this loader
=========================================================== */

import type {
  CSSProperties,
} from "react";

import {
  createPortal,
} from "react-dom";

/* ===========================================================
   PROPS
=========================================================== */

export interface GlobalLoadingOverlayProps {
  message?: string;
}

/* ===========================================================
   THEME CONTRACT

   Uses the same semantic CSS variables as FINORA Dialogs.
=========================================================== */

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

  overlay:
    "var(--finora-theme-overlay-backdrop, rgba(15,23,42,.64))",

  shadow:
    "var(--finora-theme-overlay-shadow, rgba(15,23,42,.28))",
} as const;

/* ===========================================================
   ANIMATION
=========================================================== */

const loadingAnimationCss = `
  @keyframes finora-loading-backdrop-in {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @keyframes finora-loading-card-in {
    from {
      opacity: 0;
      transform: translateY(14px) scale(.95);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes finora-loading-spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  @keyframes finora-loading-pulse {
    0%,
    100% {
      opacity: .45;
      transform: scale(.82);
    }

    50% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes finora-loading-glow {
    0%,
    100% {
      box-shadow:
        0 10px 30px
        color-mix(
          in srgb,
          var(--finora-theme-brand-primary, #C58A00)
          16%,
          transparent
        );
    }

    50% {
      box-shadow:
        0 12px 38px
        color-mix(
          in srgb,
          var(--finora-theme-brand-primary, #C58A00)
          30%,
          transparent
        );
    }
  }

  .finora-loading-backdrop {
    animation:
      finora-loading-backdrop-in
      160ms
      ease-out
      both;
  }

  .finora-loading-card {
    animation:
      finora-loading-card-in
      240ms
      cubic-bezier(.2,.9,.24,1.08)
      both;
  }

  .finora-loading-spinner {
    animation:
      finora-loading-spin
      .82s
      linear
      infinite;
    transform-origin: 50% 50%;
  }

  .finora-loading-spinner-shell {
    animation:
      finora-loading-glow
      1.8s
      ease-in-out
      infinite;
  }

  .finora-loading-core {
    transform-box: fill-box;
    transform-origin: center;
    animation:
      finora-loading-pulse
      1.15s
      ease-in-out
      infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .finora-loading-backdrop,
    .finora-loading-card,
    .finora-loading-spinner-shell,
    .finora-loading-core {
      animation-duration: 1ms;
      animation-iteration-count: 1;
    }

    .finora-loading-spinner {
      animation-duration: 1.8s;
    }
  }
`;

/* ===========================================================
   STYLES
=========================================================== */

const overlayStyle:
  CSSProperties = {
    position: "fixed",

    inset: 0,

    /*
     * FINORA DialogHost uses z-index 5000.
     *
     * Processing remains below dialogs so an error / warning /
     * confirmation can always appear above an active loader.
     */
    zIndex: 4900,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    padding: "16px",

    boxSizing: "border-box",

    background: THEME.overlay,

    backdropFilter: "blur(5px)",

    pointerEvents: "auto",

    cursor: "wait",
  };

const cardStyle:
  CSSProperties = {
    width:
      "min(390px, calc(100vw - 32px))",

    boxSizing: "border-box",

    padding: "22px 24px 24px",

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

    textAlign: "center",
  };

const brandTitleStyle:
  CSSProperties = {
    margin: 0,

    color: THEME.primary,

    fontSize: "13px",

    fontWeight: 850,

    lineHeight: 1.2,

    letterSpacing: "1.8px",

    textAlign: "center",
  };

const titleDividerStyle:
  CSSProperties = {
    width: "44px",

    height: "3px",

    margin: "10px auto 18px",

    borderRadius: "999px",

    background: THEME.primary,
  };

const spinnerShellStyle:
  CSSProperties = {
    width: "78px",

    height: "78px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    margin: "0 auto 17px",

    boxSizing: "border-box",

    border:
      `1px solid ${THEME.border}`,

    borderRadius: "999px",

    background: THEME.surface,
  };

const spinnerStyle:
  CSSProperties = {
    width: "58px",

    height: "58px",

    display: "block",
  };

const headingStyle:
  CSSProperties = {
    margin: 0,

    color: THEME.textPrimary,

    fontSize: "20px",

    fontWeight: 850,

    lineHeight: 1.3,

    textAlign: "center",
  };

const messageStyle:
  CSSProperties = {
    margin: "8px 0 0",

    color: THEME.textSecondary,

    fontSize: "15px",

    fontWeight: 550,

    lineHeight: 1.55,

    textAlign: "center",

    whiteSpace: "pre-wrap",

    overflowWrap: "anywhere",
  };

const waitTextStyle:
  CSSProperties = {
    margin: "10px 0 0",

    color: THEME.textSecondary,

    fontSize: "12px",

    fontWeight: 500,

    lineHeight: 1.4,

    opacity: 0.78,

    textAlign: "center",
  };

/* ===========================================================
   COMPONENT
=========================================================== */

export default function GlobalLoadingOverlay({
  message = "Processing...",
}: GlobalLoadingOverlayProps) {
  if (
    typeof document === "undefined"
  ) {
    return null;
  }

  return createPortal(
    <>
      <style>
        {loadingAnimationCss}
      </style>

      <div
        className="finora-loading-backdrop"
        style={overlayStyle}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={message}
      >
        <section
          className="finora-loading-card"
          style={cardStyle}
          aria-modal="true"
        >
          <div style={brandTitleStyle}>
            FINORA
          </div>

          <div style={titleDividerStyle} />

          <div
            className="finora-loading-spinner-shell"
            style={spinnerShellStyle}
            aria-hidden="true"
          >
            <svg
              width="58"
              height="58"
              viewBox="0 0 58 58"
              fill="none"
              style={spinnerStyle}
            >
              <circle
                cx="29"
                cy="29"
                r="22"
                stroke={THEME.border}
                strokeWidth="4"
              />

              <g className="finora-loading-spinner">
                <circle
                  cx="29"
                  cy="29"
                  r="22"
                  stroke={THEME.primary}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="44 94"
                />
              </g>

              <circle
                className="finora-loading-core"
                cx="29"
                cy="29"
                r="5"
                fill={THEME.primary}
              />
            </svg>
          </div>

          <h2 style={headingStyle}>
            Processing
          </h2>

          <p style={messageStyle}>
            {message}
          </p>

          <p style={waitTextStyle}>
            Please wait while FINORA completes this action.
          </p>
        </section>
      </div>
    </>,
    document.body,
  );
}

/* ===========================================================
   END
=========================================================== */
