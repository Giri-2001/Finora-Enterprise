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
   - Consume active FINORA Theme Engine
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useCustomerResponsiveTokens,
} from "../../../../utils/responsive/customers/customers.index";


import {
  useTheme,
} from "../../../../themes/provider";


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

     Responsive geometry remains exclusively controlled by
     the Customer Responsive Engine.
  ========================================================= */

  const tokens =
    useCustomerResponsiveTokens();


  /* =========================================================
     FINORA THEME ENGINE

     Active application theme:

       ThemeProvider
           ↓
       FINORA Theme Registry
           ↓
       useTheme()
           ↓
       Customer Wizard Navigation

     Navigation does NOT own a local theme palette.
  ========================================================= */

  const {
    theme,
  } =
    useTheme();


  /* =========================================================
     RESPONSIVE + THEME STYLES
  ========================================================= */

  const styles =
    getCustomerWizardNavigationStyles(
      tokens,
      theme,
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
          PREVIOUS NAVIGATION
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
          CENTER STEP INFORMATION
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
          NEXT / FINISH NAVIGATION
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