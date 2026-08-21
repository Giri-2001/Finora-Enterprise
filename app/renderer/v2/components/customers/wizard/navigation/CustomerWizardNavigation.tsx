/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD NAVIGATION™

   RESPONSIBILITY:
   - Wizard navigation behavior only
   - No visual styling
   - No responsive calculations
   - No inline CSS
   - Presentation styles delegated to
     CustomerWizardNavigation.styles.ts
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useCustomerResponsiveTokens,
} from "../../../../utils/responsive/customers/customers.index";

import {
  getCustomerWizardNavigationStyles,
} from "./CustomerWizardNavigation.styles";


/* ===========================================================
   TYPES
=========================================================== */

interface CustomerWizardNavigationProps {

  currentStep:
    number;

  totalSteps:
    number;

  onPrevious:
    () => void;

  onNext:
    () => void;

}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerWizardNavigation({

  currentStep,

  totalSteps,

  onPrevious,

  onNext,

}: CustomerWizardNavigationProps) {


  /* =========================================================
     RESPONSIVE TOKENS
  ========================================================= */

  const tokens =
    useCustomerResponsiveTokens();


  /* =========================================================
     RESPONSIVE STYLES
  ========================================================= */

  const styles =
    getCustomerWizardNavigationStyles(
      tokens,
    );


  /* =========================================================
     STEP STATE
  ========================================================= */

  const isFirstStep =
    currentStep <= 1;

  const isLastStep =
    currentStep >= totalSteps;


  /* =========================================================
     UI
  ========================================================= */

  return (

    <section
      style={
        styles.wrapper
      }
    >

      {/* =====================================================
          LEFT NAVIGATION
      ===================================================== */}

      <div
        style={
          styles.left
        }
      >

        <button
          type="button"
          style={
            isFirstStep
              ? styles.secondaryButtonDisabled
              : styles.secondaryButton
          }
          disabled={
            isFirstStep
          }
          onClick={
            onPrevious
          }
        >

          ← Previous

        </button>

      </div>


      {/* =====================================================
          CENTER
      ===================================================== */}

      <div
        style={
          styles.info
        }
      >

        Step{" "}
        {currentStep}{" "}
        of{" "}
        {totalSteps}

      </div>


      {/* =====================================================
          RIGHT NAVIGATION
      ===================================================== */}

      <div
        style={
          styles.right
        }
      >

        <button
          type="button"
          style={
            styles.primaryButton
          }
          onClick={
            onNext
          }
        >

          {
            isLastStep
              ? "Finish"
              : "Continue →"
          }

        </button>

      </div>

    </section>

  );

}


/* ===========================================================
   END
=========================================================== */