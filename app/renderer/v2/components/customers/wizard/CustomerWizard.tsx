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
  ========================================================= */

  fatherOrSpouseName?: string;

  occupation?: string;

  /*
   * Preserves custom occupation text when the domain
   * occupation is OTHER.
   */
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
  6;

const STORAGE_KEY =
  "finora_customer_draft";

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
   UI VALUE MAPPERS
=========================================================== */

/*
 * Persisted CustomerProfile values use domain enum values.
 *
 * Step 2 UI uses human-readable values.
 *
 * Example:
 *
 * SINGLE   -> Single
 * MARRIED  -> Married
 * WIDOW    -> Widowed
 * DIVORCED -> Divorced
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
 * Domain occupation values are restored to the
 * human-readable value expected by the Step 2 UI.
 *
 * For OTHER:
 *
 * occupation      = OTHER
 * occupationOther = "Finora Occupation"
 *
 * The custom text is restored instead of showing
 * "OTHER" to the user.
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

  return occupation ??
    "";
}


/* ===========================================================
   EDIT PROFILE → WIZARD DATA

   Converts persisted CustomerProfile data into the
   temporary wizard representation.

   IMPORTANT:

   This mapper MUST restore every Customer field that
   Step 2 can display.

   The mapper also converts domain enum values back into
   UI-friendly values.
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
       STEP 2 — BASIC INFORMATION
    ======================================================= */

    fatherOrSpouseName:
      customer.basic.fatherName,

    spouseName:
      customer.basic.spouseName,

    education:
      customer.personal.education,

    /*
     * Convert domain enum to Step 2 UI value.
     */
    maritalStatus:
      maritalStatusToWizardValue(
        customer.personal.maritalStatus,
      ),

    /*
     * Restore normal occupation values.
     *
     * If occupation is OTHER, restore the exact custom
     * occupation text when available.
     */
    occupation:
      occupationToWizardValue(
        customer.personal.occupation,
        customer.personal.occupationOther,
      ),

    /*
     * Preserve the custom occupation independently.
     *
     * Step 6 can use this when rebuilding the CustomerProfile.
     */
    occupationOther:
      customer.personal.occupationOther,

    monthlyIncome:
      typeof customer.personal.monthlyIncome ===
      "number"
        ? String(
            customer.personal.monthlyIncome,
          )
        : "",

    /*
     * These three fields already exist in the current
     * CustomerPersonalInformation domain model.
     */
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
       STEP 2 — EMERGENCY
    ======================================================= */

    emergencyContactName:
      customer.basic.emergencyContactName,

    emergencyContactMobile:
      customer.basic.emergencyContactNumber,


    /* =======================================================
       STEP 3 — ADDRESS
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
       STEP 4 — KYC
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
       STEP 5 — NOMINEE
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

     Customer master reads go through CustomerService.

     No repository or storage access is performed here.
  ========================================================= */

  useEffect(() => {

    const customerId =
      editCustomer?.id ??
      "";

    /* -------------------------------------------------------
       NEW CUSTOMER MODE
    ------------------------------------------------------- */

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


        /* ---------------------------------------------------
           COMPONENT UNMOUNT / EFFECT CHANGE
        --------------------------------------------------- */

        if (cancelled) {

          return;

        }


        /* ---------------------------------------------------
           SERVICE FAILURE
        --------------------------------------------------- */

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


        /* ---------------------------------------------------
           CUSTOMER NOT FOUND
        --------------------------------------------------- */

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


        /* ---------------------------------------------------
           STORE ORIGINAL PROFILE
        --------------------------------------------------- */

        setOriginalCustomerProfile(
          existingCustomer,
        );


        /* ---------------------------------------------------
           POPULATE WIZARD
        --------------------------------------------------- */

        setWizardData(
          buildEditWizardData(
            existingCustomer,
          ),
        );


        /* ---------------------------------------------------
           EDIT ALWAYS STARTS FROM STEP 1
        --------------------------------------------------- */

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

     NEW CUSTOMER MODE ONLY.

     This is temporary wizard state.
     It is NOT Customer master persistence.
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


        /* ---------------------------------------------------
           RESTORE STEP
        --------------------------------------------------- */

        if (
          typeof draft.currentStep ===
          "number"
        ) {

          if (
            draft.currentStep >=
              1
            &&
            draft.currentStep <=
              TOTAL_STEPS
          ) {

            setCurrentStep(
              draft.currentStep,
            );

          }

        }


        /* ---------------------------------------------------
           RESTORE DATA
        --------------------------------------------------- */

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

     NEW CUSTOMER MODE:
     Load temporary draft.

     EDIT MODE:
     Load CustomerService profile instead.
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
        --------------------------------------------------- */

        case 2:

          return (

            <Step2Basic

              wizardData={
                wizardData
              }

              updateWizardData={
                updateWizardData
              }

            />

          );


        /* ---------------------------------------------------
           STEP 3
        --------------------------------------------------- */

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


        /* ---------------------------------------------------
           STEP 4
        --------------------------------------------------- */

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


        /* ---------------------------------------------------
           STEP 5
        --------------------------------------------------- */

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


        /* ---------------------------------------------------
           STEP 6
        --------------------------------------------------- */

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


/* ===========================================================
   END
=========================================================== */
