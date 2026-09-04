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

import { getSession } from "../../../../store/authStore";


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
   NOMINEE CUSTOMER NUMBER
=========================================================== */

function resolveNomineeCustomerNumber(
  value: string,
): string {

  const normalizedValue =
    value.trim();

  if (
    !normalizedValue ||
    normalizedValue.startsWith("NOM-")
  ) {
    return "";
  }

  const match =
    normalizedValue.match(
      /(\d{6})$/,
    );

  return match?.[1] ?? "";
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
      resolveNomineeCustomerNumber(
        wizardData.nomineeCustomerId ??
        "",
      ),

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


  const manualNomineeEntryActive =
    !isCustomerLinked &&
    !nominee.nomineeCustomerId.trim() &&
    Boolean(
      nominee.nomineeName.trim() ||
      nominee.phoneNumber.trim(),
    );


  /* =========================================================
     CUSTOMER LOOKUP
  ========================================================= */

  useEffect(() => {

    const customerNumber =
      nominee.nomineeCustomerId.trim();


    if (
      !/^\d{6}$/.test(
        customerNumber,
      )
    ) {

      setIsCustomerLinked(
        false,
      );

      return;
    }


    const session =
      getSession();

    const activeBusinessId =
      String(
        session?.businessId ??
        "",
      ).trim();

    const activeBranchId =
      String(
        session?.branchId ??
        "",
      ).trim();


    if (
      !activeBusinessId ||
      !activeBranchId
    ) {

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
          await customerService.getAll();


        if (cancelled) {
          return;
        }


        if (
          !result.success ||
          !result.data
        ) {

          setIsCustomerLinked(
            false,
          );

          return;
        }


        const customer =
          result.data.find(
            (candidate) => {

              const identity =
                candidate.identity;

              if (
                identity.businessId !==
                  activeBusinessId ||
                identity.branchId !==
                  activeBranchId ||
                !identity.isActive ||
                identity.isDeleted
              ) {

                return false;
              }


              const candidateNumber =
                resolveNomineeCustomerNumber(
                  identity.customerId,
                );


              return (
                candidateNumber ===
                customerNumber
              );
            },
          );


        if (
          cancelled ||
          !customer
        ) {

          setIsCustomerLinked(
            false,
          );

          return;
        }


        const fullCustomerId =
          customer.identity.customerId;


        // ------------------------------------------------------
        // Customer cannot nominate their own profile.
        // ------------------------------------------------------

        if (
          wizardData.customerId &&
          fullCustomerId ===
            wizardData.customerId
        ) {

          setIsCustomerLinked(
            false,
          );

          updateWizardData({
            nomineeCustomerId:
              "",
          });

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

            nomineeCustomerId:
              customerNumber,

            nomineeName:
              customerName,

            phoneNumber:
              customerPhone,

          }),
        );


        // ------------------------------------------------------
        // UI keeps only the six-digit Customer Number.
        // Wizard data keeps the authoritative full FINORA ID.
        // ------------------------------------------------------

        updateWizardData({

          nomineeCustomerId:
            fullCustomerId,

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


        setIsCustomerLinked(
          false,
        );

      }

    }


    void findExistingCustomer();


    return () => {

      cancelled =
        true;

    };

  }, [
    nominee.nomineeCustomerId,
    wizardData.customerId,
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

      setIsCustomerLinked(
        false,
      );

      setNominee(
        (previous) => ({

          ...previous,

          relationship:
            "",

        }),
      );


      updateWizardData({

        nomineeCustomerId:
          "",

        nomineeRelationship:
          "",

      });

      return;

    }


    if (
      field ===
      "nomineeName"
    ) {

      setNominee(
        (previous) => ({

          ...previous,

          nomineeCustomerId:
            "",

          nomineeName:
            value,


          relationship:
            "",
}),
      );


      updateWizardData({

        nomineeCustomerId:
          "",

        nomineeName:
          value,



        nomineeRelationship:
          "",
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

      setNominee(
        (previous) => ({

          ...previous,

          nomineeCustomerId:
            "",

          phoneNumber:
            value,


          relationship:
            "",
}),
      );


      updateWizardData({

        nomineeCustomerId:
          "",

        nomineePhoneNumber:
          value,



        nomineeRelationship:
          "",
});


      setIsCustomerLinked(
        false,
      );

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

            customerNumberLocked={
              manualNomineeEntryActive
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
            }/>

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
              Boolean(
                wizardData.aadhaar?.trim() &&
                (
                  nominee.nomineeCustomerId.trim() ||
                  nominee.nomineeName.trim()
                )
              )
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