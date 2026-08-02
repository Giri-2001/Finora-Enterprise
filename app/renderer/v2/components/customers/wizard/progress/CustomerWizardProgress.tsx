/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER WIZARD PROGRESS
--------------------------------------------------------------
Shows current wizard progress.
=========================================================== */

import type { CSSProperties } from "react";

interface CustomerWizardProgressProps {
  currentStep: number;
  totalSteps: number;
  progress: number;
  title: string;
  subtitle: string;
}

const wrapperStyle: CSSProperties = {
  marginBottom: "32px",
};

const topRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
};

const badgeStyle: CSSProperties = {
  padding: "8px 14px",
  borderRadius: "999px",
  background: "#eef2ff",
  color: "#3730a3",
  fontWeight: 600,
  fontSize: "13px",
};

const titleStyle: CSSProperties = {
  margin: "14px 0 4px",
  fontSize: "28px",
  fontWeight: 700,
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  color: "#6b7280",
  fontSize: "15px",
};

const trackStyle: CSSProperties = {
  width: "100%",
  height: "12px",
  marginTop: "24px",
  background: "#e5e7eb",
  borderRadius: "999px",
  overflow: "hidden",
};

const percentageTextStyle: CSSProperties = {
  marginTop: "10px",
  textAlign: "right",
  color: "#6b7280",
  fontSize: "13px",
};

export default function CustomerWizardProgress({
  currentStep,
  totalSteps,
  progress,
  title,
  subtitle,
}: CustomerWizardProgressProps) {
  const fillStyle: CSSProperties = {
    width: `${progress}%`,
    height: "100%",
    background: "linear-gradient(90deg,#2563eb,#3b82f6)",
    transition: "width 250ms ease",
  };

  return (
    <section style={wrapperStyle}>

      <div style={topRowStyle}>

        <div>

          <div style={badgeStyle}>
            STEP {currentStep} OF {totalSteps}
          </div>

          <h2 style={titleStyle}>
            {title}
          </h2>

          <p style={subtitleStyle}>
            {subtitle}
          </p>

        </div>

      </div>

      <div style={trackStyle}>

        <div style={fillStyle} />

      </div>

      <div style={percentageTextStyle}>
        {progress}% Completed
      </div>

    </section>
  );
}
