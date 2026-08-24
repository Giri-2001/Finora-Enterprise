/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 5 — NOMINEE STUDIO™

   Version     : 4.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Nominee workflow orchestration
   - Existing FINORA customer lookup
   - Nominee form state
   - Wizard data synchronization
   - Customer information presentation
   - Validation status presentation
   - Step 5 left/right workspace presentation

   IMPORTANT:

   - Customer lookup goes through CustomerService.
   - Presentation components remain business-logic free.
   - No local breakpoint logic.
   - No window.innerWidth.
   - No media queries.
   - Responsive geometry comes from Responsive Engine.
   - Step 6 save/update business logic remains in Step6Review.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useEffect,
  useState,
} from "react";


/* ===========================================================
   CUSTOMER SERVICE
=========================================================== */

import {
  customerService,
} from "../../../../services/customer/customerService";


/* ===========================================================
   NOMINEE PRESENTATION
=========================================================== */

import NomineeForm, {
  type NomineeFormData,
} from "../../nominee/NomineeForm";


import NomineePreviewCard
  from "../../nominee/NomineePreviewCard";


/* ===========================================================
   REVIEW PRESENTATION
=========================================================== */

import CustomerSummary
  from "../../review/CustomerSummary";


import ValidationStatus
  from "../../review/ValidationStatus";


import ReviewChecklist
  from "../../review/ReviewChecklist";


/* ===========================================================
   WIZARD TYPES
=========================================================== */

import type {
  CustomerWizardData,
} from "../CustomerWizard";


/* ===========================================================
   RESPONSIVE ENGINE
=========================================================== */

import {
  useResponsive,
} from "../../../../utils/responsive";


import {
  getNomineeResponsiveTokens,
} from "../../../../utils/responsive/customers/nominee/nominee.tokens";


import {
  createStep5NomineeStyles,
} from "../../../../utils/responsive/customers/nominee/nominee.layout";


/* ===========================================================
   PROPS
=========================================================== */

interface Step5NomineeProps {

  wizardData:
    CustomerWizardData;

  updateWizardData: (
    data:
      Partial<CustomerWizardData>,
  ) => void;

}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function Step5Nominee({

  wizardData,

  updateWizardData,

}: Step5NomineeProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } =
    useResponsive();


  const nomineeTokens =
    getNomineeResponsiveTokens(
      tokens.meta.viewport,
    );


  const {
    containerStyle,
    leftStyle,
    rightStyle,
  } =
    createStep5NomineeStyles(
      nomineeTokens,
    );


  /* =========================================================
     NOMINEE STATE
  ========================================================= */

  const [
    nominee,
    setNominee,
  ] = useState<NomineeFormData>(() => ({

    nomineeCustomerId:
      wizardData.nomineeCustomerId ??
      "",

    nomineeName:
      wizardData.nomineeName ??
      "",

    relationship:
      wizardData.nomineeRelationship ??
      "",

    phoneNumber:
      wizardData.nomineePhoneNumber ??
      "",

  }));


  /* =========================================================
     LINKED CUSTOMER
  ========================================================= */

  const [
    linkedCustomerName,
    setLinkedCustomerName,
  ] = useState(
    () =>
      wizardData.nomineeName ??
      "",
  );


  const [
    isCustomerLinked,
    setIsCustomerLinked,
  ] = useState(false);


  /* =========================================================
     CUSTOMER LOOKUP
  ========================================================= */

  useEffect(() => {

    const customerId =
      nominee.nomineeCustomerId.trim();


    if (!customerId) {

      setLinkedCustomerName(
        nominee.nomineeName,
      );

      setIsCustomerLinked(
        false,
      );

      return;

    }


    let cancelled =
      false;


    async function findExistingCustomer():
      Promise<void> {

      try {

        const result =
          await customerService.getById(
            customerId,
          );


        if (cancelled) {

          return;

        }


        if (!result.success) {

          setLinkedCustomerName(
            nominee.nomineeName,
          );

          setIsCustomerLinked(
            false,
          );

          return;

        }


        const customer =
          result.data;


        if (!customer) {

          setLinkedCustomerName(
            nominee.nomineeName,
          );

          setIsCustomerLinked(
            false,
          );

          return;

        }


        const customerName =
          customer.basic.fullName ||
          "";


        const customerPhone =
          customer.basic.mobileNumber ||
          "";


        setLinkedCustomerName(
          customerName,
        );


        setIsCustomerLinked(
          true,
        );


        setNominee(
          (previous) => ({

            ...previous,

            nomineeName:
              customerName,

            phoneNumber:
              customerPhone,

          }),
        );


        updateWizardData({

          nomineeCustomerId:
            customerId,

          nomineeName:
            customerName,

          nomineePhoneNumber:
            customerPhone,

        });

      } catch (error) {

        if (cancelled) {

          return;

        }


        console.error(
          "FINORA NOMINEE CUSTOMER LOOKUP ERROR:",
          error,
        );


        setLinkedCustomerName(
          nominee.nomineeName,
        );


        setIsCustomerLinked(
          false,
        );

      }

    }


    void findExistingCustomer();


    return () => {

      cancelled = true;

    };

  }, [
    nominee.nomineeCustomerId,
  ]);


  /* =========================================================
     FIELD CHANGE
  ========================================================= */

  const handleChange = (

    field:
      keyof NomineeFormData,

    value:
      string,

  ): void => {

    setNominee(
      (previous) => ({

        ...previous,

        [field]:
          value,

      }),
    );


    if (
      field ===
      "nomineeCustomerId"
    ) {

      updateWizardData({

        nomineeCustomerId:
          value,

      });

      return;

    }


    if (
      field ===
      "nomineeName"
    ) {

      updateWizardData({

        nomineeName:
          value,

      });


      setLinkedCustomerName(
        value,
      );


      setIsCustomerLinked(
        false,
      );


      return;

    }


    if (
      field ===
      "phoneNumber"
    ) {

      updateWizardData({

        nomineePhoneNumber:
          value,

      });

      return;

    }


    if (
      field ===
      "relationship"
    ) {

      updateWizardData({

        nomineeRelationship:
          value,

      });

    }

  };


  /* =========================================================
     REVIEW STATE
  ========================================================= */

  const identityComplete =
    Boolean(
      wizardData.fullName?.trim() &&
      wizardData.mobileNumber?.trim(),
    );


  const addressComplete =
    Boolean(
      wizardData.currentAddress?.trim() ||
      wizardData.address?.trim(),
    );


  const kycVerified =
    false;


  const nomineeAdded =
    Boolean(
      nominee.nomineeName.trim() ||
      nominee.nomineeCustomerId.trim(),
    );


  /* =========================================================
     CHECKLIST
  ========================================================= */

  const checklistItems = [

    {
      label:
        "Identity Completed",

      completed:
        identityComplete,
    },

    {
      label:
        "Basic Details Completed",

      completed:
        Boolean(
          wizardData.fullName?.trim() &&
          wizardData.mobileNumber?.trim(),
        ),
    },

    {
      label:
        "Address Completed",

      completed:
        addressComplete,
    },

    {
      label:
        "KYC Submitted — Verification Pending",

      completed:
        kycVerified,
    },

    {
      label:
        "Nominee Added",

      completed:
        nomineeAdded,
    },

  ];


  /* =========================================================
     UI
  ========================================================= */

  return (

    <div
      style={
        containerStyle
      }
    >

      {/* =====================================================
          LEFT 50%

          1. Nominee Information
          2. Customer Information
          3. Validation Status
      ===================================================== */}

      <div
        style={
          leftStyle
        }
      >

        <NomineeForm

          value={
            nominee
          }

          onChange={
            handleChange
          }

          isCustomerLinked={
            isCustomerLinked
          }

        />


        <CustomerSummary

          customerId={
            wizardData.customerId ||
            "AUTO-GENERATED"
          }

          customerName={
            wizardData.fullName ||
            "--"
          }

          phoneNumber={
            wizardData.mobileNumber ||
            "--"
          }

          kycVerified={
            kycVerified
          }

        />


        <ValidationStatus

          identityComplete={
            identityComplete
          }

          addressComplete={
            addressComplete
          }

          kycVerified={
            kycVerified
          }

          nomineeAdded={
            nomineeAdded
          }

        />

      </div>

    </div>

  );

}


/* ===========================================================
   END
=========================================================== */