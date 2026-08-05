/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER WIZARD
   -----------------------------------------------------------
   Module      : Customer
   Layer       : Wizard Controller
   Version     : 2.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production
=========================================================== */

import { useCallback, useEffect, useMemo, useState } from "react";

import CustomerWizardLayout from "./layout/CustomerWizardLayout";
import CustomerWizardNavigation from "./navigation/CustomerWizardNavigation";
import CustomerWizardProgress from "./progress/CustomerWizardProgress";

import Step1Identity from "./steps/Step1Identity";
import Step2Basic from "./steps/Step2Basic";
import Step3Address from "./steps/Step3Address";
import Step4KYC from "./steps/Step4KYC";
import Step5Nominee from "./steps/Step5Nominee";
import Step6Review from "./steps/Step6Review";

/* ===========================================================
   TYPES
=========================================================== */

export interface CustomerWizardData {

  customerId?: string;

  photo?: string;

  fullName?: string;

mobileNumber?: string;

  whatsapp?: string;

  email?: string;

  address?: string;

  aadhaar?: string;

  pan?: string;

  nominee?: string;

}

export interface WizardStep {

  id: number;

  title: string;

  subtitle: string;

}

/* ===========================================================
   CONSTANTS
=========================================================== */

const TOTAL_STEPS = 6;

const STORAGE_KEY = "finora_customer_draft";

const STEPS: WizardStep[] = [

  {
    id: 1,
    title: "Identity",
    subtitle: "Customer ID & Photo",
  },

  {
    id: 2,
    title: "Basic Details",
    subtitle: "Personal Information",
  },

  {
    id: 3,
    title: "Address",
    subtitle: "Customer Address",
  },

  {
    id: 4,
    title: "KYC",
    subtitle: "Identity Verification",
  },

  {
    id: 5,
    title: "Nominee",
    subtitle: "Family Information",
  },

  {
    id: 6,
    title: "Review",
    subtitle: "Verify Everything",
  },

];

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerWizard() {

  /* ===========================================================
     STATE
  =========================================================== */

  const [currentStep, setCurrentStep] = useState(1);

  const [loadingDraft, setLoadingDraft] = useState(true);

  const [wizardData, setWizardData] =
    useState<CustomerWizardData>({});

  /* ===========================================================
     CURRENT STEP
  =========================================================== */

  const currentStepInfo = useMemo(() => {

    return (
      STEPS.find(
        (step) => step.id === currentStep,
      ) ?? STEPS[0]
    );

  }, [currentStep]);

  /* ===========================================================
     PROGRESS
  =========================================================== */

  const progress = useMemo(() => {

    return Math.round(
      (currentStep / TOTAL_STEPS) * 100,
    );

  }, [currentStep]);

  /* ===========================================================
     AUTO DRAFT
     (Phase 2 Foundation)
  =========================================================== */

  const saveDraft = useCallback(() => {

    try {

      localStorage.setItem(
        STORAGE_KEY,

        JSON.stringify({

          currentStep,

          wizardData,

        }),
      );

    } catch {

      // Ignore Draft Errors

    }

  }, [currentStep, wizardData]);

  const loadDraft = useCallback(() => {

    try {

      const raw =
        localStorage.getItem(STORAGE_KEY);

      if (!raw) {

        return;

      }

      const draft = JSON.parse(raw);

      if (draft.currentStep) {

        setCurrentStep(draft.currentStep);

      }

      if (draft.wizardData) {

        setWizardData(draft.wizardData);

      }

    } catch {

      // Ignore Draft Errors

    } finally {

      setLoadingDraft(false);

    }

  }, []);

  const clearDraft = useCallback(() => {

    localStorage.removeItem(STORAGE_KEY);

  }, []);

    /* ===========================================================
     LIFECYCLE
  =========================================================== */

  useEffect(() => {

    loadDraft();

  }, [loadDraft]);

  useEffect(() => {

    if (loadingDraft) {

      return;

    }

    saveDraft();

  }, [
    currentStep,
    wizardData,
    loadingDraft,
    saveDraft,
  ]);

  /* ===========================================================
     UPDATE DATA
  =========================================================== */

  const updateWizardData = useCallback(

  (
    data: Partial<CustomerWizardData>,
  ) => {

    console.log(
      "UPDATE WIZARD DATA:",
      data
    );

    setWizardData((previous) => ({

      ...previous,

      ...data,

    }));

  },

  [],
);

  /* ===========================================================
     NAVIGATION
  =========================================================== */

  const nextStep = useCallback(() => {

    setCurrentStep((previous) =>

      Math.min(
        previous + 1,

        TOTAL_STEPS,
      ),
    );

  }, []);

  const previousStep = useCallback(() => {

    setCurrentStep((previous) =>

      Math.max(previous - 1, 1),
    );

  }, []);

  const goToStep = useCallback(

    (step: number) => {

      if (step < 1) {

        return;

      }

      if (step > TOTAL_STEPS) {

        return;

      }

      setCurrentStep(step);

    },

    [],
  );

  /* ===========================================================
     RESET
  =========================================================== */

  const resetWizard = useCallback(() => {

    clearDraft();

    setCurrentStep(1);

    setWizardData({});

  }, [clearDraft]);

  /* ===========================================================
     CURRENT STEP COMPONENT
  =========================================================== */

  const currentStepComponent = useMemo(() => {

    switch (currentStep) {

      case 1:

  return (

    <Step1Identity

      updateWizardData={
        updateWizardData
      }

    />

  );

      case 2:

return (

  <Step2Basic

    updateWizardData={
      updateWizardData
    }

  />

);

      case 3:

        return (

          <Step3Address />

        );

      case 4:

        return (

          <Step4KYC />

        );

      case 5:

        return (

          <Step5Nominee />

        );

      default:

return (

  <Step6Review

    wizardData={wizardData}

    resetWizard={resetWizard}

  />

);

    }

  }, [currentStep]);

    /* ===========================================================
     LOADING
  =========================================================== */

  if (loadingDraft) {

    return (

      <div
        style={{
          padding: 40,
          textAlign: "center",
        }}
      >
        Loading Customer Wizard...
      </div>

    );

  }

  /* ===========================================================
     UI
  =========================================================== */

  return (

    <CustomerWizardLayout>

      <CustomerWizardProgress
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        progress={progress}
        title={currentStepInfo.title}
        subtitle={currentStepInfo.subtitle}
      />

      {currentStepComponent}

      <CustomerWizardNavigation
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onPrevious={previousStep}
        onNext={nextStep}
      />

      {/* =======================================================
          FUTURE MODULES
          -------------------------------------------------------
          Phase 2
          ✓ Draft Banner
          ✓ Validation Summary
          ✓ Estimate Preview
          ✓ Customer ID Preview
          ✓ Save Confirmation

          Phase 3
          ✓ 3D Animations
          ✓ Hanger Cards
          ✓ Profile Launcher

          Phase 4
          ✓ Loan Creation Flow
          ✓ Digital Locker
          ✓ Reports
      ======================================================= */}

    </CustomerWizardLayout>

  );

}
