/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER WIZARD NAVIGATION

   Navigation:
   ← Customers Hub
   ← Previous
   Step X of 6
   Continue →
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface CustomerWizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onBackToCustomers?: () => void;
}

/* ===========================================================
   FOOTER WRAPPER
=========================================================== */

const wrapperStyle: CSSProperties = {
  width: "100%",

  boxSizing: "border-box",

  marginTop: "0",

  padding: "7px 0 5px",

  borderTop:
    "1px solid rgba(255,255,255,.24)",

  display: "grid",

  gridTemplateColumns:
    "1fr auto 1fr",

  alignItems: "center",

  columnGap: "16px",

  flexShrink: 0,

  minHeight: "62px",

  background:
    "transparent",
};

/* ===========================================================
   LEFT SIDE
=========================================================== */

const leftStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  justifyContent: "flex-start",

  gap: "12px",

  minWidth: 0,

  paddingLeft: "0",
};

/* ===========================================================
   RIGHT SIDE
=========================================================== */

const rightStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  justifyContent: "flex-end",

  gap: "12px",

  minWidth: 0,

  paddingRight: "0",
};

/* ===========================================================
   SECONDARY BUTTON
=========================================================== */

const secondaryButton: CSSProperties = {
  minHeight: "44px",

  padding:
    "0 22px",

  borderRadius: "11px",

  border:
    "1px solid #d6d8dc",

  background:
    "#ffffff",

  color:
    "#17130f",

  cursor:
    "pointer",

  fontWeight:
    750,

  fontSize:
    "14px",

  lineHeight:
    1,

  whiteSpace:
    "nowrap",

  boxShadow:
    "0 3px 8px rgba(0,0,0,.14)",

  transition:
    "transform .18s ease, box-shadow .18s ease, background .18s ease",
};

/* ===========================================================
   PRIMARY BUTTON
=========================================================== */

const primaryButton: CSSProperties = {
  minHeight: "46px",

  padding:
    "0 30px",

  borderRadius: "12px",

  border:
    "1px solid rgba(244,193,68,.95)",

  background:
    "linear-gradient(135deg, #f4c44e 0%, #da9b23 52%, #bd7810 100%)",

  color:
    "#ffffff",

  cursor:
    "pointer",

  fontWeight:
    850,

  fontSize:
    "15px",

  lineHeight:
    1,

  whiteSpace:
    "nowrap",

  boxShadow:
    "0 5px 14px rgba(132,84,10,.30), inset 0 1px 0 rgba(255,255,255,.35)",

  transition:
    "transform .18s ease, box-shadow .18s ease, filter .18s ease",
};

/* ===========================================================
   STEP INFO
=========================================================== */

const infoStyle: CSSProperties = {
  justifySelf:
    "center",

  color:
    "rgba(255,255,255,.72)",

  fontSize:
    "13px",

  fontWeight:
    650,

  whiteSpace:
    "nowrap",

  textAlign:
    "center",
};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerWizardNavigation({
  currentStep,
  totalSteps,
  onBackToCustomers,
  onPrevious,
  onNext,
}: CustomerWizardNavigationProps) {
  const isFirstStep =
    currentStep <= 1;

  const isLastStep =
    currentStep >= totalSteps;

  return (
    <section style={wrapperStyle}>

      {/* =====================================================
          LEFT NAVIGATION
      ===================================================== */}

      <div style={leftStyle}>

        <button
          type="button"
          style={secondaryButton}
          onClick={onBackToCustomers}
        >
          ← Customers Hub
        </button>

        <button
          type="button"
          style={{
            ...secondaryButton,
            opacity: isFirstStep ? 0.45 : 1,
            cursor: isFirstStep
              ? "not-allowed"
              : "pointer",
          }}
          disabled={isFirstStep}
          onClick={onPrevious}
        >
          ← Previous
        </button>

      </div>

      {/* =====================================================
          CENTER
      ===================================================== */}

      <div style={infoStyle}>
        Step {currentStep} of {totalSteps}
      </div>

      {/* =====================================================
          RIGHT NAVIGATION
      ===================================================== */}

      <div style={rightStyle}>

        <button
          type="button"
          style={primaryButton}
          onClick={onNext}
        >
          {isLastStep
            ? "Finish"
            : "Continue →"}
        </button>

      </div>

    </section>
  );
}
