/* ===========================================================
   FINORA ENTERPRISE OS™

   GLOBAL LOADING OVERLAY™

   RESPONSIBILITY:
   - Display a clear, non-blurred global processing state
   - Block user interaction while an operation is running
   - Preserve complete visibility of the underlying FINORA page
   - Provide one reusable loading surface across V2 modules

   IMPORTANT:
   - No blur
   - No opaque page replacement
   - No business logic
   - No async logic
   - Presentation only
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   PROPS
=========================================================== */

export interface GlobalLoadingOverlayProps {
  message?: string;
}

/* ===========================================================
   STYLES
=========================================================== */

const overlayStyle: CSSProperties = {
  position: "fixed",

  inset: 0,

  zIndex: 99999,

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  backgroundColor: "rgba(255, 255, 255, 0.08)",

  pointerEvents: "auto",

  cursor: "wait",

  boxSizing: "border-box",
};

const contentStyle: CSSProperties = {
  display: "flex",

  flexDirection: "column",

  alignItems: "center",

  justifyContent: "center",

  gap: "12px",

  padding: "18px 22px",

  boxSizing: "border-box",

};

const spinnerStyle: CSSProperties = {
  width: "54px",

  height: "54px",

  display: "block",
};

const textStyle: CSSProperties = {
  margin: 0,

  color: "#1f2937",

  fontSize: "14px",

  fontWeight: 600,

  lineHeight: 1.4,

  textAlign: "center",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function GlobalLoadingOverlay({
  message = "Loading...",
}: GlobalLoadingOverlayProps) {
  return (
    <div
      style={overlayStyle}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div style={contentStyle}>
        <svg
          width="54"
          height="54"
          viewBox="0 0 54 54"
          fill="none"
          aria-hidden="true"
          style={spinnerStyle}
        >
          <circle
            cx="27"
            cy="27"
            r="21"
            stroke="#d1d5db"
            strokeWidth="5"
          />

          <circle
            cx="27"
            cy="27"
            r="21"
            stroke="#c99200"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="38 94"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 27 27"
              to="360 27 27"
              dur="0.9s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>

        <p style={textStyle}>
          {message}
        </p>
      </div>
    </div>
  );
}

/* ===========================================================
   END
=========================================================== */