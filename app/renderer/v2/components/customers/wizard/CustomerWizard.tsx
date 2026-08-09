/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD CONTROLLER™

   Version : 2.0
   Phase   : Phase 2
   Architecture: Enterprise

   RESPONSIBILITY:

   - Control the six-step Customer Wizard
   - Manage wizard state
   - Manage temporary wizard draft
   - Load existing CustomerProfile through CustomerService
   - Pass CustomerProfile to Step 6 Review
   - Preserve existing Customer Add / Edit flow

   IMPORTANT:

   - No direct Customer repository access.
   - No direct Customer storage access.
   - Customer master reads go through CustomerService.
   - Temporary wizard draft remains isolated.
=========================================================== */


// ===========================================================
// IMPORTS
// ===========================================================

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";


import CustomerWizardLayout
  from "./layout/CustomerWizardLayout";


import CustomerWizardNavigation
  from "./navigation/CustomerWizardNavigation";


import CustomerWizardProgress
  from "./progress/CustomerWizardProgress";


import Step1Identity
  from "./steps/Step1Identity";


import Step2Basic
  from "./steps/Step2Basic";


import Step3Address
  from "./steps/Step3Address";


import Step4KYC
  from "./steps/Step4KYC";


import Step5Nominee
  from "./steps/Step5Nominee";


import Step6Review
  from "./steps/Step6Review";


import {
  customerService,
} from "../../../services/customer/customerService";


import type {
  OfficeCustomer,
} from "../office/CustomerOffice/types";


import type {
  CustomerProfile,
} from "../../../types/customers";


// ===========================================================
// TYPES
// ===========================================================

export interface CustomerWizardData {


  /* =========================================================
     STEP 1 — IDENTITY
  ========================================================= */

  customerId?: string;

  photo?: string;

  fullName?: string;

  mobileNumber?: string;

  whatsapp?: string;

  email?: string;

  dateOfBirth?: string;

  preferredLanguage?:
    | "Telugu"
    | "English"
    | "Hindi"
    | "Tamil"
    | "Kannada"
    | "Marathi"
    | "Other";


  /* =========================================================
     STEP 2 — BASIC DETAILS
  ========================================================= */

  fatherOrSpouseName?: string;

  occupation?: string;

  monthlyIncome?: string;

  education?: string;

  maritalStatus?: string;

  workPlace?: string;

  experience?: string;

  spouseName?: string;

  numberOfFamilyMembers?: string;

  emergencyContactName?: string;

  emergencyContactMobile?: string;


  /* =========================================================
     STEP 3 — ADDRESS
  ========================================================= */

  address?: string;


  /* =========================================================
     STEP 4 — KYC
  ========================================================= */

  aadhaar?: string;

  pan?: string;


  /* =========================================================
     STEP 5 — NOMINEE
  ========================================================= */

  nomineeCustomerId?: string;

  nomineeName?: string;

  nomineeRelationship?: string;

  nomineePhoneNumber?: string;

}


// ===========================================================
// WIZARD STEP
// ===========================================================

export interface WizardStep {

  id: number;

  title: string;

  subtitle: string;

}


// ===========================================================
// CUSTOMER WIZARD PROPS
// ===========================================================

interface CustomerWizardProps {

  editCustomer?: OfficeCustomer;

  onBackToCustomersHub?: () => void;

}


// ===========================================================
// CONSTANTS
// ===========================================================

const TOTAL_STEPS =
  6;


const STORAGE_KEY =
  "finora_customer_draft";


const STEPS: WizardStep[] = [

  {
    id: 1,

    title:
      "Identity",

    subtitle:
      "Customer ID & Photo",
  },


  {
    id: 2,

    title:
      "Basic Details",

    subtitle:
      "Personal Information",
  },


  {
    id: 3,

    title:
      "Address",

    subtitle:
      "Customer Address",
  },


  {
    id: 4,

    title:
      "KYC",

    subtitle:
      "Identity Verification",
  },


  {
    id: 5,

    title:
      "Nominee",

    subtitle:
      "Family Information",
  },


  {
    id: 6,

    title:
      "Review",

    subtitle:
      "Verify Everything",
  },

];


// ===========================================================
// EDIT PROFILE → WIZARD DATA
// ===========================================================

function buildEditWizardData(
  customer: CustomerProfile,
): CustomerWizardData {

  return {

    customerId:
      customer.identity.customerId,

    fullName:
      customer.basic.fullName,

    mobileNumber:
      customer.basic.mobileNumber,

    whatsapp:
      customer.basic.whatsappNumber,

    email:
      customer.basic.email,

  };

}


// ===========================================================
// COMPONENT
// ===========================================================

export default function CustomerWizard({

  editCustomer,

  onBackToCustomersHub,

}: CustomerWizardProps) {


  // =========================================================
  // MODE
  // =========================================================

  const isEditMode =
    Boolean(editCustomer);


  // =========================================================
  // STATE
  // =========================================================

  const [
    currentStep,
    setCurrentStep,
  ] = useState(1);


  const [
    loadingDraft,
    setLoadingDraft,
  ] = useState(true);


  const [
    wizardData,
    setWizardData,
  ] = useState<CustomerWizardData>({});


  const [
    originalCustomerProfile,
    setOriginalCustomerProfile,
  ] = useState<
    CustomerProfile | undefined
  >(
    undefined,
  );


  // =========================================================
  // CURRENT STEP INFORMATION
  // =========================================================

  const currentStepInfo =
    useMemo(() => {

      return (

        STEPS.find(
          (step) =>
            step.id === currentStep,
        )

        ??

        STEPS[0]

      );

    }, [
      currentStep,
    ]);


  // =========================================================
  // PROGRESS
  // =========================================================

  const progress =
    useMemo(() => {

      return Math.round(
        (
          currentStep /
          TOTAL_STEPS
        ) *
        100,
      );

    }, [
      currentStep,
    ]);


  // =========================================================
  // LOAD EXISTING CUSTOMER FOR EDIT
  //
  // IMPORTANT:
  //
  // Customer master data is loaded through CustomerService.
  //
  // This prevents the UI from knowing about:
  //
  // Repository
  // StorageManager
  // localStorage
  // USB
  // Cloud
  //
  // =========================================================

  useEffect(() => {

    const customerId: string =
  editCustomer?.id ?? "";


    // -------------------------------------------------------
    // NEW CUSTOMER MODE
    // -------------------------------------------------------

    if (!customerId) {
  return;
}


    let cancelled =
      false;


    async function loadExistingCustomer():
      Promise<void> {

      setLoadingDraft(
        true,
      );


      try {

        const result =
          await customerService.getById(
            customerId,
          );


        // ---------------------------------------------------
        // COMPONENT UNMOUNT / EFFECT CHANGE
        // ---------------------------------------------------

        if (cancelled) {

          return;

        }


        // ---------------------------------------------------
        // SERVICE FAILURE
        // ---------------------------------------------------

        if (!result.success) {

          console.error(
            "FINORA EDIT CUSTOMER LOAD FAILED:",
            result.error,
          );


          setOriginalCustomerProfile(
            undefined,
          );


          return;

        }


        // ---------------------------------------------------
        // CUSTOMER NOT FOUND
        // ---------------------------------------------------

        const existingCustomer =
          result.data;


        if (!existingCustomer) {

          console.error(
            "FINORA EDIT CUSTOMER NOT FOUND:",
            customerId,
          );


          setOriginalCustomerProfile(
            undefined,
          );


          return;

        }


        // ---------------------------------------------------
        // STORE ORIGINAL PROFILE
        // ---------------------------------------------------

        setOriginalCustomerProfile(
          existingCustomer,
        );


        // ---------------------------------------------------
        // POPULATE WIZARD
        // ---------------------------------------------------

        setWizardData(
          buildEditWizardData(
            existingCustomer,
          ),
        );


        // ---------------------------------------------------
        // EDIT ALWAYS STARTS FROM STEP 1
        // ---------------------------------------------------

        setCurrentStep(
          1,
        );

      } catch (error) {

        if (cancelled) {

          return;

        }


        console.error(
          "FINORA EDIT CUSTOMER LOAD ERROR:",
          error,
        );


        setOriginalCustomerProfile(
          undefined,
        );

      } finally {

        if (!cancelled) {

          setLoadingDraft(
            false,
          );

        }

      }

    }


    void loadExistingCustomer();


    return () => {

      cancelled = true;

    };

  }, [
    editCustomer,
  ]);


  // =========================================================
  // AUTO DRAFT
  //
  // NEW CUSTOMER MODE ONLY
  //
  // This is temporary wizard state.
  // It is NOT Customer master persistence.
  // =========================================================

  const saveDraft =
    useCallback(() => {

      if (isEditMode) {

        return;

      }


      try {

        localStorage.setItem(

          STORAGE_KEY,

          JSON.stringify({

            currentStep,

            wizardData,

          }),

        );

      } catch {

        // Ignore Draft Errors.

      }

    }, [
      currentStep,
      wizardData,
      isEditMode,
    ]);


  // =========================================================
  // LOAD DRAFT
  // =========================================================

  const loadDraft =
    useCallback(() => {

      try {

        const raw =
          localStorage.getItem(
            STORAGE_KEY,
          );


        if (!raw) {

          return;

        }


        const draft =
          JSON.parse(raw) as {

            currentStep?:
              number;

            wizardData?:
              CustomerWizardData;

          };


        // ---------------------------------------------------
        // RESTORE STEP
        // ---------------------------------------------------

        if (
          typeof draft.currentStep ===
          "number"
        ) {

          if (
            draft.currentStep >= 1 &&
            draft.currentStep <=
              TOTAL_STEPS
          ) {

            setCurrentStep(
              draft.currentStep,
            );

          }

        }


        // ---------------------------------------------------
        // RESTORE DATA
        // ---------------------------------------------------

        if (
          draft.wizardData
        ) {

          setWizardData(
            draft.wizardData,
          );

        }

      } catch {

        // Ignore malformed draft data.

      } finally {

        setLoadingDraft(
          false,
        );

      }

    }, []);


  // =========================================================
  // CLEAR DRAFT
  // =========================================================

  const clearDraft =
    useCallback(() => {

      try {

        localStorage.removeItem(
          STORAGE_KEY,
        );

      } catch {

        // Ignore Draft Errors.

      }

    }, []);


  // =========================================================
  // LIFECYCLE
  //
  // NEW CUSTOMER MODE:
  // Load temporary draft.
  //
  // EDIT MODE:
  // Load CustomerService profile instead.
  // =========================================================

  useEffect(() => {

    if (isEditMode) {

      return;

    }


    loadDraft();

  }, [
    isEditMode,
    loadDraft,
  ]);


  // =========================================================
  // AUTO SAVE TEMPORARY DRAFT
  // =========================================================

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


  // =========================================================
  // UPDATE WIZARD DATA
  // =========================================================

  const updateWizardData =
    useCallback(

      (
        data:
          Partial<CustomerWizardData>,
      ) => {

        console.log(
          "UPDATE WIZARD DATA:",
          data,
        );


        setWizardData(
          (previous) => ({

            ...previous,

            ...data,

          }),
        );

      },

      [],
    );


  // =========================================================
  // NAVIGATION — NEXT
  // =========================================================

  const nextStep =
    useCallback(() => {

      setCurrentStep(
        (previous) =>
          Math.min(
            previous + 1,
            TOTAL_STEPS,
          ),
      );

    }, []);


  // =========================================================
  // NAVIGATION — PREVIOUS
  // =========================================================

  const previousStep =
    useCallback(() => {

      setCurrentStep(
        (previous) =>
          Math.max(
            previous - 1,
            1,
          ),
      );

    }, []);


  // =========================================================
  // NAVIGATION — DIRECT STEP
  // =========================================================

  const goToStep =
    useCallback(

      (
        step: number,
      ) => {

        if (
          step < 1
        ) {

          return;

        }


        if (
          step > TOTAL_STEPS
        ) {

          return;

        }


        setCurrentStep(
          step,
        );

      },

      [],
    );


  // =========================================================
  // RESET WIZARD
  // =========================================================

  const resetWizard =
    useCallback(() => {

      clearDraft();


      setCurrentStep(
        1,
      );


      setWizardData(
        {},
      );


      setOriginalCustomerProfile(
        undefined,
      );

    }, [
      clearDraft,
    ]);


  // =========================================================
  // CURRENT STEP COMPONENT
  // =========================================================

  const currentStepComponent =
    useMemo(() => {

      switch (currentStep) {

        // ---------------------------------------------------
        // STEP 1
        // ---------------------------------------------------

        case 1:

          return (

            <Step1Identity

              initialData={
                wizardData
              }

              updateWizardData={
                updateWizardData
              }

            />

          );


        // ---------------------------------------------------
        // STEP 2
        // ---------------------------------------------------

        case 2:

          return (

            <Step2Basic

              updateWizardData={
                updateWizardData
              }

            />

          );


        // ---------------------------------------------------
        // STEP 3
        // ---------------------------------------------------

        case 3:

          return (

            <Step3Address

              updateWizardData={
                updateWizardData
              }

              wizardData={
                wizardData
              }

            />

          );


        // ---------------------------------------------------
        // STEP 4
        // ---------------------------------------------------

        case 4:

          return (

            <Step4KYC

              wizardData={
                wizardData
              }

              updateWizardData={
                updateWizardData
              }

            />

          );


        // ---------------------------------------------------
        // STEP 5
        // ---------------------------------------------------

        case 5:

          return (

            <Step5Nominee

              wizardData={
                wizardData
              }

              updateWizardData={
                updateWizardData
              }

            />

          );


        // ---------------------------------------------------
        // STEP 6
        // ---------------------------------------------------

        case 6:

          return (

            <Step6Review

              wizardData={
                wizardData
              }

              resetWizard={
                resetWizard
              }

              originalCustomerProfile={
                originalCustomerProfile
              }

              isEditMode={
                isEditMode
              }

            />

          );


        // ---------------------------------------------------
        // FALLBACK
        // ---------------------------------------------------

        default:

          return null;

      }

    }, [
      currentStep,
      updateWizardData,
      wizardData,
      resetWizard,
      originalCustomerProfile,
      isEditMode,
    ]);


  // =========================================================
  // LOADING
  // =========================================================

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


  // =========================================================
  // UI
  // =========================================================

  return (

    <CustomerWizardLayout>


      {/* ===================================================
          PROGRESS
      =================================================== */}

      <CustomerWizardProgress

        currentStep={
          currentStep
        }

        totalSteps={
          TOTAL_STEPS
        }

        progress={
          progress
        }

        title={
          currentStepInfo.title
        }

        subtitle={
          currentStepInfo.subtitle
        }

      />


      {/* ===================================================
          CURRENT STEP
      =================================================== */}

      {currentStepComponent}


      {/* ===================================================
          NAVIGATION
      =================================================== */}

      <CustomerWizardNavigation

        currentStep={
          currentStep
        }

        totalSteps={
          TOTAL_STEPS
        }

        onPrevious={
          previousStep
        }

        onNext={
          nextStep
        }

        onBackToCustomers={
          onBackToCustomersHub
        }

      />


      {/* ===================================================
          FUTURE MODULES

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
      =================================================== */}

    </CustomerWizardLayout>

  );

}


// ===========================================================
// END
// ===========================================================
