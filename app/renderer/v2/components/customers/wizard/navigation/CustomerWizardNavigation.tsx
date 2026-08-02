/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER WIZARD NAVIGATION
--------------------------------------------------------------
Reusable navigation for all FINORA wizards.
=========================================================== */

import type { CSSProperties } from "react";

interface CustomerWizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
}

const wrapperStyle: CSSProperties = {
  marginTop: "40px",
  paddingTop: "24px",
  borderTop: "1px solid #e5e7eb",

  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",

  gap: "16px",

  flexWrap: "wrap",
};

const leftStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
};

const rightStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
};

const secondaryButton: CSSProperties = {
  padding: "12px 22px",

  borderRadius: "12px",

  border: "1px solid #d1d5db",

  background: "#ffffff",

  cursor: "pointer",

  fontWeight: 600,

  fontSize: "15px",

  transition: "0.25s",
};

const primaryButton: CSSProperties = {
  padding: "12px 26px",

  borderRadius: "12px",

  border: "none",

  background: "#2563eb",

  color: "#ffffff",

  cursor: "pointer",

  fontWeight: 700,

  fontSize: "15px",

  transition: "0.25s",
};

const infoStyle: CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
};

export default function CustomerWizardNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
}: CustomerWizardNavigationProps) {
  const isFirst = currentStep === 1;

  const isLast = currentStep === totalSteps;

  return (
    <section style={wrapperStyle}>

      <div style={leftStyle}>

        <button
          style={secondaryButton}
          disabled={isFirst}
          onClick={onPrevious}
        >
          ← Previous
        </button>

      </div>

      <div style={infoStyle}>
        Step {currentStep} of {totalSteps}
      </div>

      <div style={rightStyle}>

        <button
          style={primaryButton}
          onClick={onNext}
        >
          {isLast
            ? "Finish"
            : "Continue →"}
        </button>

      </div>

    </section>
  );
}
