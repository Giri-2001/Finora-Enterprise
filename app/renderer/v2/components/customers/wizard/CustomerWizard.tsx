/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD CONTROLLER™

   Version     : 2.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Control the six-step Customer Wizard
   - Manage wizard state
   - Manage temporary wizard draft
   - Load existing CustomerProfile through CustomerService
   - Populate every currently persisted Customer field
   - Preserve UI-friendly values during Edit mode
   - Pass CustomerProfile to Step 6 Review
   - Preserve existing Customer Add / Edit flow

   IMPORTANT:

   - No direct Customer repository access.
   - No direct Customer storage access.
   - Customer master reads go through CustomerService.
   - Temporary wizard draft remains isolated.
   - Step 1 contains Identity + Basic Details presentation.
   - Step 2 presents the EXISTING Address + KYC screens
     together in one 50 / 50 workspace.
   - No new Address or KYC form logic is introduced here.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

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


import Step1IdentityAndBasic
  from "./steps/Step1IdentityAndBasic";


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


import {
  MaritalStatus,
  Occupation,
} from "../../../types/customers/customer.enums";


/* ===========================================================
   TYPES
=========================================================== */

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

     These fields remain part of wizard data because
     Basic Details is already presented together with
     Identity on Step 1.
  ========================================================= */

  fatherOrSpouseName?: string;

  occupation?: string;

  occupationOther?: string;

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

  currentAddress?: string;

  permanentAddress?: string;

  city?: string;

  district?: string;

  state?: string;

  pinCode?: string;


  /* =========================================================
     STEP 4 — KYC
  ========================================================= */

  aadhaar?: string;

  pan?: string;

  voterId?: string;

  drivingLicence?: string;


  /* =========================================================
     STEP 5 — NOMINEE
  ========================================================= */

  nomineeCustomerId?: string;

  nomineeName?: string;

  nomineeRelationship?: string;

  nomineePhoneNumber?: string;
}


/* ===========================================================
   WIZARD STEP
=========================================================== */

export interface WizardStep {

  id: number;

  title: string;

  subtitle: string;
}


/* ===========================================================
   CUSTOMER WIZARD PROPS
=========================================================== */

interface CustomerWizardProps {

  editCustomer?: OfficeCustomer;

  onBackToCustomersHub?: () => void;
}


/* ===========================================================
   CONSTANTS
=========================================================== */

const TOTAL_STEPS =
  4;


const STORAGE_KEY =
  "finora_customer_draft";


/*
 * Wizard progress contract remains six steps.
 *
 * Step 1:
 *   Identity + Basic Details
 *
 * Step 2:
 *   Address + KYC
 *
 * Step 3:
 *   Nominee
 *
 * Step 4:
 *   Review
 *
 * Step 5:
 *   Completion
 *
 * Existing step IDs are preserved so draft state,
 * progress, navigation and persisted workflow remain stable.
 */
const STEPS: WizardStep[] = [

  {
    id: 1,
    title: "Identity",
    subtitle: "Customer ID & Basic Details",
  },

  {
    id: 2,
    title: "Address & KYC",
    subtitle: "Customer Address & Identity Verification",
  },

  {
    id: 3,
    title: "Nominee",
    subtitle: "Family Information",
  },

  {
    id: 4,
    title: "Review",
    subtitle: "Verify Everything",
  },

];


/* ===========================================================
   UI VALUE MAPPERS
=========================================================== */

/*
 * Persisted CustomerProfile values use domain enum values.
 *
 * Step UI uses human-readable values.
 */

function maritalStatusToWizardValue(
  value:
    MaritalStatus |
    string |
    undefined,
): string {

  switch (value) {

    case MaritalStatus.SINGLE:
      return "Single";

    case MaritalStatus.MARRIED:
      return "Married";

    case MaritalStatus.WIDOW:
      return "Widowed";

    case MaritalStatus.DIVORCED:
      return "Divorced";

    default:
      return "";
  }

}


/*
 * Restore occupation values for the UI.
 */

function occupationToWizardValue(
  occupation:
    Occupation |
    string |
    undefined,
  occupationOther?:
    string,
): string {

  if (
    occupation ===
    Occupation.OTHER
  ) {

    return (
      occupationOther ??
      "Other"
    );

  }

  return (
    occupation ??
    ""
  );

}


/* ===========================================================
   EDIT PROFILE → WIZARD DATA
=========================================================== */

function buildEditWizardData(
  customer: CustomerProfile,
): CustomerWizardData {

  const nominee =
    customer.nominee.nominees?.[0];


  return {

    /* =======================================================
       STEP 1 — IDENTITY
    ======================================================= */

    customerId:
      customer.identity.customerId,

    photo:
      customer.photo,

    fullName:
      customer.basic.fullName,

    mobileNumber:
      customer.basic.mobileNumber,

    whatsapp:
      customer.basic.whatsappNumber,

    email:
      customer.basic.email,

    dateOfBirth:
      customer.personal.dateOfBirth,

    preferredLanguage:
      customer.basic.preferredLanguage,


    /* =======================================================
       BASIC INFORMATION
    ======================================================= */

    fatherOrSpouseName:
      customer.basic.fatherName,

    spouseName:
      customer.basic.spouseName,

    education:
      customer.personal.education,

    maritalStatus:
      maritalStatusToWizardValue(
        customer.personal.maritalStatus,
      ),

    occupation:
      occupationToWizardValue(
        customer.personal.occupation,
        customer.personal.occupationOther,
      ),

    occupationOther:
      customer.personal.occupationOther,

    monthlyIncome:
      typeof customer.personal.monthlyIncome ===
      "number"
        ? String(
            customer.personal.monthlyIncome,
          )
        : "",

    workPlace:
      customer.personal.workPlace,

    experience:
      customer.personal.experience,

    numberOfFamilyMembers:
      typeof customer.personal.numberOfFamilyMembers ===
      "number"
        ? String(
            customer.personal.numberOfFamilyMembers,
          )
        : "",


    /* =======================================================
       BASIC — EMERGENCY
    ======================================================= */

    emergencyContactName:
      customer.basic.emergencyContactName,

    emergencyContactMobile:
      customer.basic.emergencyContactNumber,


    /* =======================================================
       ADDRESS
    ======================================================= */

    address:
      customer.address.currentAddress.street ??
      "",

    currentAddress:
      customer.address.currentAddress.street ??
      "",

    permanentAddress:
      customer.address.permanentAddress.street ??
      "",

    city:
      customer.address.currentAddress.city ??
      "",

    district:
      customer.address.currentAddress.district ??
      "",

    state:
      customer.address.currentAddress.state ??
      "",

    pinCode:
      customer.address.currentAddress.pinCode ??
      "",


    /* =======================================================
       KYC
    ======================================================= */

    aadhaar:
      customer.kyc.aadhaar?.documentNumber,

    pan:
      customer.kyc.pan?.documentNumber,

    voterId:
      customer.kyc.voterId?.documentNumber,

    drivingLicence:
      customer.kyc.drivingLicense?.documentNumber,


    /* =======================================================
       NOMINEE
    ======================================================= */

    nomineeCustomerId:
      nominee?.nomineeId,

    nomineeName:
      nominee?.fullName,

    nomineeRelationship:
      nominee?.relation,

    nomineePhoneNumber:
      nominee?.mobileNumber,

  };

}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerWizard({

  editCustomer,

  onBackToCustomersHub,

}: CustomerWizardProps) {


  /* =========================================================
     MODE
  ========================================================= */

  const isEditMode =
    Boolean(
      editCustomer,
    );


  /* =========================================================
     STATE
  ========================================================= */

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
  ] = useState<CustomerWizardData>(
    {},
  );


  const [
    originalCustomerProfile,
    setOriginalCustomerProfile,
  ] = useState<
    CustomerProfile | undefined
  >(
    undefined,
  );


  /* =========================================================
     CURRENT STEP INFORMATION
  ========================================================= */

  const currentStepInfo =
    useMemo(() => {

      return (
        STEPS.find(
          (step) =>
            step.id ===
            currentStep,
        )
        ??
        STEPS[0]
      );

    }, [
      currentStep,
    ]);


  /* =========================================================
     PROGRESS
  ========================================================= */

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


  /* =========================================================
     LOAD EXISTING CUSTOMER FOR EDIT
  ========================================================= */

  useEffect(() => {

    const customerId =
      editCustomer?.id ??
      "";


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


        if (cancelled) {

          return;

        }


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


        setOriginalCustomerProfile(
          existingCustomer,
        );


        setWizardData(
          buildEditWizardData(
            existingCustomer,
          ),
        );


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


  /* =========================================================
     AUTO DRAFT
  ========================================================= */

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


  /* =========================================================
     LOAD DRAFT
  ========================================================= */

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


        if (
          typeof draft.currentStep ===
          "number"
        ) {

          if (
            draft.currentStep >= 1 &&
            draft.currentStep <= TOTAL_STEPS
          ) {

            setCurrentStep(
              draft.currentStep,
            );

          }

        }


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


  /* =========================================================
     CLEAR DRAFT
  ========================================================= */

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


  /* =========================================================
     LIFECYCLE
  ========================================================= */

  useEffect(() => {

    if (isEditMode) {

      return;

    }


    loadDraft();

  }, [
    isEditMode,
    loadDraft,
  ]);


  /* =========================================================
     AUTO SAVE TEMPORARY DRAFT
  ========================================================= */

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


  /* =========================================================
     UPDATE WIZARD DATA
  ========================================================= */

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


  /* =========================================================
     NAVIGATION — NEXT
  ========================================================= */

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


  /* =========================================================
     NAVIGATION — PREVIOUS
  ========================================================= */

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


  /* =========================================================
     NAVIGATION — DIRECT STEP
  ========================================================= */

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


  /* =========================================================
     RESET WIZARD
  ========================================================= */

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


  /* =========================================================
     CURRENT STEP COMPONENT
  ========================================================= */

  const currentStepComponent =
    useMemo(() => {

      switch (currentStep) {

        /* ---------------------------------------------------
           STEP 1

           Existing Identity + Basic Details presentation.
        --------------------------------------------------- */

        case 1:

          return (

            <Step1IdentityAndBasic

              wizardData={
                wizardData
              }

              updateWizardData={
                updateWizardData
              }

            />

          );

        /* ---------------------------------------------------
           STEP 2

           ADDRESS + KYC

           IMPORTANT:

           Both existing production components are rendered
           together here.

           Desktop / Laptop:
             Address + KYC side-by-side.

           Narrow viewport:
             Address
             KYC

           No duplicate form logic is created.

           The two components remain responsible for their
           own forms, state, styles, responsive engine and
           theme connections.

           This controller only creates the presentation
           workspace.
        --------------------------------------------------- */

        case 2:

          return (

            <div
              style={{
                width: "100%",
                minWidth: 0,
                minHeight: 0,

                height: "100%",

                display: "grid",

                /*
                 * Automatically use two equal columns when
                 * there is enough workspace.
                 *
                 * On narrow/mobile workspace the columns
                 * collapse to a single column.
                 */
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 480px), 1fr))",

                columnGap:
                  "5px",

                rowGap:
                  "5px",

                alignItems:
                  "stretch",

                justifyContent:
                  "stretch",

                boxSizing:
                  "border-box",

                overflow:
                  "auto",

                borderRadius:
                  0,

                clipPath:
                  "none",

                boxShadow:
                  "none",

                background:
                  "transparent",
              }}
            >

              {/* =========================================
                  LEFT — EXISTING ADDRESS STUDIO
              ========================================= */}

              <div
                style={{
                  width: "100%",
                  minWidth: 0,
                  minHeight: 0,

                  height: "100%",

                  overflow: "visible",

                  boxSizing:
                    "border-box",

                  borderRadius:
                    0,

                  clipPath:
                    "none",

                  boxShadow:
                    "none",

                  background:
                    "transparent",
                }}
              >

                <Step3Address

                  updateWizardData={
                    updateWizardData
                  }

                  wizardData={
                    wizardData
                  }

                />

              </div>


              {/* =========================================
                  RIGHT — EXISTING KYC STUDIO
              ========================================= */}

              <div
                style={{
                  width: "100%",
                  minWidth: 0,
                  minHeight: 0,

                  height: "100%",

                  overflow: "visible",

                  boxSizing:
                    "border-box",

                  borderRadius:
                    0,

                  clipPath:
                    "none",

                  boxShadow:
                    "none",

                  background:
                    "transparent",
                }}
              >

                <Step4KYC

                  wizardData={
                    wizardData
                  }

                  updateWizardData={
                    updateWizardData
                  }

                />

              </div>

            </div>

          );

        /* ---------------------------------------------------
           STEP 3

           Existing KYC continuation.
        --------------------------------------------------- */

case 3:

  return (

    <div
      style={{
        width: "100%",
        minWidth: 0,
        minHeight: 0,

        display: "grid",

        gridTemplateColumns:
          "repeat(auto-fit, minmax(min(100%, 480px), 1fr))",

        gap: "5px",

        boxSizing: "border-box",

        overflow: "auto",

        background: "transparent",
      }}
    >

      {/* =========================================
          LEFT — NOMINEE STUDIO
      ========================================= */}

      <div
        style={{
          width: "100%",
          minWidth: 0,
          minHeight: 0,

          boxSizing: "border-box",

          overflow: "visible",

          background: "transparent",
        }}
      >

        <Step5Nominee

          wizardData={
            wizardData
          }

          updateWizardData={
            updateWizardData
          }

        />

      </div>


      {/* =========================================
          RIGHT — FINAL REVIEW STUDIO
      ========================================= */}

      <div
        style={{
          width: "100%",
          minWidth: 0,
          minHeight: 0,

          boxSizing: "border-box",

          overflow: "visible",

          background: "transparent",
        }}
      >

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

      </div>

    </div>

  );

        /* ---------------------------------------------------
           FALLBACK
        --------------------------------------------------- */

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


  /* =========================================================
     LOADING
  ========================================================= */

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


  /* =========================================================
     UI
  ========================================================= */

  return (

    <CustomerWizardLayout

  progress={

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

  }


  navigation={

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

    />

  }

>

  {currentStepComponent}

</CustomerWizardLayout>

  );

}


/* ===========================================================
   END
=========================================================== */