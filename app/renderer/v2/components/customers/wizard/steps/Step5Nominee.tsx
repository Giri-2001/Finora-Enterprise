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
   - customer.store.ts is the single lookup source.
   - Presentation components remain business-logic free.
   - Step 5 local state is synchronized with CustomerWizard.
   - Global FINORA header remains the workspace header.
=========================================================== */

import {
  useEffect,
  useState,
} from "react";

import StudioLayout
  from "../../../common/layout/StudioLayout";

import TwoColumnStudio
  from "../../../common/layout/TwoColumnStudio";

import {
  getCustomer,
} from "../../../../store/customers/customer.store";

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

/* ===========================================================
   PROPS
=========================================================== */

interface Step5NomineeProps {

  wizardData:
    CustomerWizardData;

  updateWizardData: (
    data: Partial<CustomerWizardData>,
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
     LINKED CUSTOMER STATE
  ========================================================= */

  const [
    linkedCustomerName,
    setLinkedCustomerName,
  ] = useState("");

  /* =========================================================
     CUSTOMER LINK STATUS
  ========================================================= */

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

    /* =======================================================
       EMPTY CUSTOMER ID
    ======================================================= */

    if (!customerId) {

      setLinkedCustomerName("");

      setIsCustomerLinked(false);

      setNominee((previous) => ({

        ...previous,

        nomineeName: "",

        phoneNumber: "",

      }));

      return;
    }

    /* =======================================================
       FIND EXISTING CUSTOMER
    ======================================================= */

    const customer =
      getCustomer(customerId);

    /* =======================================================
       CUSTOMER NOT FOUND
    ======================================================= */

    if (!customer) {

      setLinkedCustomerName("");

      setIsCustomerLinked(false);

      setNominee((previous) => ({

        ...previous,

        nomineeName: "",

        phoneNumber: "",

      }));

      return;
    }

    /* =======================================================
       CUSTOMER FOUND
    ======================================================= */

    const customerName =
      customer.basic.fullName || "";

    const customerPhone =
      customer.basic.mobileNumber || "";

    setLinkedCustomerName(
      customerName,
    );

    setIsCustomerLinked(true);

    setNominee((previous) => ({

      ...previous,

      nomineeName:
        customerName,

      phoneNumber:
        customerPhone,

    }));

  }, [
    nominee.nomineeCustomerId,
  ]);

  /* =========================================================
     WIZARD DATA SYNC
  ========================================================= */

  useEffect(() => {

    updateWizardData({

      nomineeCustomerId:
        nominee.nomineeCustomerId,

      nomineeName:
        nominee.nomineeName,

      nomineeRelationship:
        nominee.relationship,

      nomineePhoneNumber:
        nominee.phoneNumber,

    });

  }, [
    nominee,
    updateWizardData,
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

    setNominee((previous) => ({

      ...previous,

      [field]:
        value,

    }));

  };

  /* =========================================================
     RELATIONSHIP CHANGE
  ========================================================= */

  const handleRelationshipChange = (
    value: string,
  ): void => {

    setNominee((previous) => ({

      ...previous,

      relationship:
        value,

    }));

  };

  /* =========================================================
     VIEW
  ========================================================= */

  return (

    <StudioLayout

      /*
       * Customer Workspace already owns
       * the global FINORA header.
       */

      showHeader={false}

      /*
       * Keep the existing Step 4
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
