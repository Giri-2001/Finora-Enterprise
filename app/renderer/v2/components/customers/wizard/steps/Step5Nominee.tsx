/* ===========================================================
   FINORA ENTERPRISE V2

   CUSTOMER WIZARD
   STEP 5 — NOMINEE STUDIO

   RESPONSIBILITY:

   - Nominee workflow orchestration
   - Existing FINORA customer lookup
   - Nominee form state
   - Wizard data synchronization
   - Relationship selection
   - Preview / summary / draft presentation

   BUSINESS RULE:

   If a registered FINORA Customer ID is entered,
   the existing customer's name and mobile number are
   automatically linked to the nominee information.

   IMPORTANT:

   - Customer lookup goes through CustomerService.
   - Presentation components remain business-logic free.
   - Step 5 local state is synchronized explicitly.
   - No bidirectional state synchronization effect is used.
   - Failed / unavailable customer lookup must NOT destroy
     existing wizard draft values.

   ARCHITECTURE:

   Step 5
      ↓
   CustomerService
      ↓
   CustomerRepository
      ↓
   StorageManager
      ↓
   Storage Adapter

=========================================================== */


// ===========================================================
// IMPORTS
// ===========================================================

import {
  useEffect,
  useState,
} from "react";

import StudioLayout
  from "../../../common/layout/StudioLayout";

import TwoColumnStudio
  from "../../../common/layout/TwoColumnStudio";

import {
  customerService,
} from "../../../../services/customer/customerService";

import NomineeForm, {
  type NomineeFormData,
} from "../../nominee/NomineeForm";

import RelationshipSelector
  from "../../nominee/RelationshipSelector";

import NomineePreviewCard
  from "../../nominee/NomineePreviewCard";

import NomineeSummaryCard
  from "../../nominee/NomineeSummaryCard";

import NomineeDraftStatus
  from "../../nominee/NomineeDraftStatus";

import type {
  CustomerWizardData,
} from "../CustomerWizard";


// ===========================================================
// PROPS
// ===========================================================

interface Step5NomineeProps {

  wizardData:
    CustomerWizardData;

  updateWizardData: (
    data: Partial<CustomerWizardData>,
  ) => void;

}


// ===========================================================
// COMPONENT
// ===========================================================

export default function Step5Nominee({

  wizardData,

  updateWizardData,

}: Step5NomineeProps) {


  // =========================================================
  // NOMINEE STATE
  //
  // CustomerWizardData is the central wizard source of truth
  // while the customer is being created or edited.
  //
  // Step 5 local state is initialized from that central data.
  // No continuous reverse synchronization effect is used.
  // =========================================================

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


  // =========================================================
  // LINKED CUSTOMER STATE
  //
  // Existing saved nominee name is preserved immediately.
  // =========================================================

  const [
    linkedCustomerName,
    setLinkedCustomerName,
  ] = useState(
    () =>
      wizardData.nomineeName ??
      "",
  );


  // =========================================================
  // CUSTOMER LINK STATUS
  // =========================================================

  const [
    isCustomerLinked,
    setIsCustomerLinked,
  ] = useState(false);


  // =========================================================
  // CUSTOMER LOOKUP
  //
  // Lookup runs only when the FINORA Customer ID changes.
  //
  // IMPORTANT:
  //
  // Lookup success updates both:
  //
  // 1. Local Step 5 state
  // 2. Central CustomerWizardData
  //
  // Lookup failure NEVER clears existing draft values.
  // =========================================================

  useEffect(() => {

    const customerId =
      nominee.nomineeCustomerId.trim();


    // =======================================================
    // EMPTY CUSTOMER ID
    // =======================================================

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


        // ---------------------------------------------------
        // EFFECT WAS CANCELLED
        // ---------------------------------------------------

        if (cancelled) {

          return;

        }


        // ===================================================
        // LOOKUP FAILED
        //
        // Preserve current draft values.
        // ===================================================

        if (!result.success) {

          setLinkedCustomerName(
            nominee.nomineeName,
          );

          setIsCustomerLinked(
            false,
          );

          return;

        }


        // ===================================================
        // CUSTOMER NOT FOUND
        // ===================================================

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


        // ===================================================
        // CUSTOMER FOUND
        // ===================================================

        const customerName =
          customer.basic.fullName ||
          "";

        const customerPhone =
          customer.basic.mobileNumber ||
          "";


        // ---------------------------------------------------
        // Update presentation state.
        // ---------------------------------------------------

        setLinkedCustomerName(
          customerName,
        );

        setIsCustomerLinked(
          true,
        );


        // ---------------------------------------------------
        // Registered customer is authoritative.
        // ---------------------------------------------------

        setNominee(
          (previous) => ({

            ...previous,

            nomineeName:
              customerName,

            phoneNumber:
              customerPhone,

          }),
        );


        // ---------------------------------------------------
        // Explicitly synchronize authoritative customer
        // values with the central wizard state.
        //
        // IMPORTANT:
        // This is NOT inside a nominee synchronization effect.
        // Therefore it cannot create a render loop.
        // ---------------------------------------------------

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


        // ---------------------------------------------------
        // Never destroy existing draft values on lookup error.
        // ---------------------------------------------------

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


  // =========================================================
  // FIELD CHANGE
  //
  // Local state and central wizard state are updated together.
  //
  // This replaces the old bidirectional synchronization
  // useEffect that caused the infinite render loop.
  // =========================================================

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


    // =======================================================
    // EXPLICIT WIZARD SYNCHRONIZATION
    // =======================================================

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


  // =========================================================
  // RELATIONSHIP CHANGE
  //
  // RelationshipSelector persists the FINORA enum value.
  // =========================================================

  const handleRelationshipChange = (
    value: string,
  ): void => {

    setNominee(
      (previous) => ({

        ...previous,

        relationship:
          value,

      }),
    );


    updateWizardData({

      nomineeRelationship:
        value,

    });

  };


  // =========================================================
  // VIEW
  // =========================================================

  return (

    <StudioLayout

      /*
       * Customer Workspace already owns
       * the global FINORA header.
       */

      showHeader={false}


      /*
       * Keep the existing Step 5
       * viewport behavior.
       */

      allowScroll={true}

    >

      {/* =====================================================
         TWO COLUMN WORKSPACE
      ===================================================== */}

      <TwoColumnStudio

        /* ===================================================
           LEFT WORKSPACE
        =================================================== */

        left={

          <>

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


            <RelationshipSelector

              value={
                nominee.relationship
              }

              onChange={
                handleRelationshipChange
              }

            />

          </>

        }


        /* ===================================================
           RIGHT INTELLIGENCE PANEL
        =================================================== */

        right={

          <>

            <NomineePreviewCard

              value={{

                customerName:
                  linkedCustomerName,

                nomineeCustomerId:
                  nominee.nomineeCustomerId,

                nomineeName:
                  nominee.nomineeName,

                relationship:
                  nominee.relationship,

                phoneNumber:
                  nominee.phoneNumber,

              }}

            />


            <NomineeSummaryCard />


            <NomineeDraftStatus

              isDraftSaved={
                false
              }

            />

          </>

        }

      />

    </StudioLayout>

  );

}


// ===========================================================
// END
// ===========================================================
