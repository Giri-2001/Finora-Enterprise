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
   - Step 5 LEFT workspace presentation

   IMPORTANT:

   - Customer lookup goes through CustomerService.
   - Presentation components remain business-logic free.
   - No local breakpoint logic.
   - No window.innerWidth.
   - No media queries.
   - Responsive geometry comes from Responsive Engine.
   - Step 6 owns the RIGHT review workspace:
       Validation Status
       Review Checklist
       Customer Review Actions
   - Step 5 intentionally renders ONLY 3 cards:
       Nominee Information
       Nominee Preview
       Customer Summary
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
    nomineeFormStyle,
    nomineePreviewStyle,
    customerSummaryStyle,
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
     UI

     STEP 5 = LEFT 3 CARDS ONLY

       1. Nominee Information
       2. Nominee Preview
       3. Customer Summary

     STEP 6 = RIGHT 3 CARDS

       4. Validation Status
       5. Review Checklist
       6. Customer Review Actions
  ========================================================= */

  return (

    <div
      style={
        containerStyle
      }
    >

      <div
        style={
          leftStyle
        }
      >

        {/* =================================================
            1 — NOMINEE INFORMATION
        ================================================= */}

        <div
          style={
            nomineeFormStyle
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

        </div>


        {/* =================================================
            2 — NOMINEE PREVIEW
        ================================================= */}

        <div
          style={
            nomineePreviewStyle
          }
        >

          <NomineePreviewCard

            value={{

              customerName:
                wizardData.fullName,

              nomineeCustomerId:
                nominee.nomineeCustomerId,

              nomineeName:
                nominee.nomineeName,

              relationship:
                nominee.relationship,

              phoneNumber:
                nominee.phoneNumber,

            }}

            isCustomerLinked={
              isCustomerLinked
            }

          />

        </div>


        {/* =================================================
            3 — CUSTOMER SUMMARY
        ================================================= */}

        <div
          style={
            customerSummaryStyle
          }
        >

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
              false
            }

          />

        </div>

      </div>

    </div>

  );

}


/* ===========================================================
   END
=========================================================== */