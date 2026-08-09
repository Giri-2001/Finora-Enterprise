// ============================================================
// FINORA ENTERPRISE OS™
//
// CUSTOMER WIZARD
// STEP 6 — REVIEW
//
// MODULE  : Customer
// LAYER   : UI / Review
// VERSION : 2.0
// STATUS  : Production
//
// RESPONSIBILITY:
//
// - Final customer review orchestration
// - Validation state calculation
// - Customer profile creation
// - Existing customer update
// - Customer Service write
// - Review action coordination
//
// IMPORTANT:
//
// - Review components contain presentation only.
// - Persistence goes through CustomerService.
// - No direct localStorage access.
// - No direct repository access.
// - KYC document entry is NOT treated as verified.
// - Nominee data follows CustomerNomineeInformation.
// - Global FINORA header remains the workspace header.
// - ReviewHeader is intentionally not rendered here.
//
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import {
  useState,
} from "react";

import StudioLayout
  from "../../../common/layout/StudioLayout";

import CustomerSummary
  from "../../review/CustomerSummary";

import ValidationStatus
  from "../../review/ValidationStatus";

import ReviewChecklist
  from "../../review/ReviewChecklist";

import ReviewActions
  from "../../review/ReviewActions";

import ReviewDraftStatus
  from "../../review/ReviewDraftStatus";

import {
  customerService,
} from "../../../../services/customer/customerService";

import type {
  CustomerProfile,
} from "../../../../types/customers";

import type {
  CustomerWizardData,
} from "../CustomerWizard";

import {
  CustomerStatus,
  CustomerRisk,
  CustomerGender,
  MaritalStatus,
  Occupation,
  KYCStatus,
  NomineeRelation,
} from "../../../../types/customers/customer.enums";

import type {
  Education,
} from "../../../../types/customers/customer.personal.types";

import {
  CustomerTimelineEventType,
  CustomerTimelinePriority,
} from "../../../../types/customers/customer.timeline.types";

import {
  workspaceStyle,
  leftColumnStyle,
  rightColumnStyle,
  actionPanelStyle,
  actionAreaStyle,
  draftAreaStyle,
} from "./Step6Review.styles";


// ============================================================
// PROPS
// ============================================================

interface Step6ReviewProps {

  wizardData:
    CustomerWizardData;

  resetWizard:
    () => void;

  originalCustomerProfile?:
    CustomerProfile;

  isEditMode?:
    boolean;
}


// ============================================================
// HELPERS
// ============================================================

function generateCustomerId(): string {

  return (
    `FIN-CUS-${Date.now()}`
  );

}


// ============================================================
// SAFE STRING
// ============================================================

function valueOrEmpty(
  value?: string,
): string {

  return value?.trim() ?? "";

}


// ============================================================
// ENUM HELPERS
// ============================================================

function toGender(
  value?: string,
): CustomerGender {

  const normalized =
    value?.trim().toUpperCase();

  if (
    normalized ===
    CustomerGender.MALE
  ) {

    return CustomerGender.MALE;

  }

  if (
    normalized ===
    CustomerGender.FEMALE
  ) {

    return CustomerGender.FEMALE;

  }

  return CustomerGender.OTHER;
}


// ============================================================
// MARITAL STATUS
// ============================================================

function toMaritalStatus(
  value?: string,
): MaritalStatus {

  const normalized =
    value?.trim().toUpperCase();

  if (
    normalized ===
    MaritalStatus.MARRIED
  ) {

    return MaritalStatus.MARRIED;

  }

  if (
    normalized ===
    MaritalStatus.WIDOW
  ) {

    return MaritalStatus.WIDOW;

  }

  if (
    normalized ===
    MaritalStatus.DIVORCED
  ) {

    return MaritalStatus.DIVORCED;

  }

  return MaritalStatus.SINGLE;
}


// ============================================================
// OCCUPATION
// ============================================================

function toOccupation(
  value?: string,
): Occupation {

  const normalized =
    value?.trim().toUpperCase();

  switch (normalized) {

    case Occupation.FARMER:
      return Occupation.FARMER;

    case Occupation.BUSINESS:
      return Occupation.BUSINESS;

    case Occupation.EMPLOYEE:
      return Occupation.EMPLOYEE;

    case Occupation.DRIVER:
      return Occupation.DRIVER;

    case Occupation.LABOUR:
      return Occupation.LABOUR;

    case Occupation.HOUSEWIFE:
      return Occupation.HOUSEWIFE;

    case Occupation.STUDENT:
      return Occupation.STUDENT;

    case Occupation.RETIRED:
      return Occupation.RETIRED;

    default:
      return Occupation.OTHER;
  }
}


// ============================================================
// EDUCATION
// ============================================================

function toEducation(
  value?: string,
): Education | undefined {

  const normalized =
    value?.trim();

  if (!normalized) {

    return undefined;
  }

  const validValues: Education[] = [

    "No Formal Education",

    "Primary",

    "Secondary",

    "Intermediate",

    "Diploma",

    "Graduate",

    "Post Graduate",

    "Doctorate",

    "Other",

  ];

  return validValues.find(
    (item) =>
      item.toLowerCase() ===
      normalized.toLowerCase(),
  );
}


// ============================================================
// NOMINEE RELATION
// ============================================================

function toNomineeRelation(
  value?: string,
): NomineeRelation {

  const normalized =
    value?.trim().toUpperCase();

  switch (normalized) {

    case NomineeRelation.FATHER:
      return NomineeRelation.FATHER;

    case NomineeRelation.MOTHER:
      return NomineeRelation.MOTHER;

    case NomineeRelation.HUSBAND:
      return NomineeRelation.HUSBAND;

    case NomineeRelation.WIFE:
      return NomineeRelation.WIFE;

    case NomineeRelation.SON:
      return NomineeRelation.SON;

    case NomineeRelation.DAUGHTER:
      return NomineeRelation.DAUGHTER;

    case NomineeRelation.BROTHER:
      return NomineeRelation.BROTHER;

    case NomineeRelation.SISTER:
      return NomineeRelation.SISTER;

    case NomineeRelation.UNCLE:
      return NomineeRelation.UNCLE;

    case NomineeRelation.AUNT:
      return NomineeRelation.AUNT;

    case NomineeRelation.FRIEND:
      return NomineeRelation.FRIEND;

    default:
      return NomineeRelation.OTHER;
  }
}


// ============================================================
// COMPONENT
// ============================================================

export default function Step6Review({

  wizardData,

  resetWizard,

  originalCustomerProfile,

  isEditMode = false,

}: Step6ReviewProps) {


  // ==========================================================
  // SAVE STATE
  // ==========================================================

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);


  // ==========================================================
  // REVIEW VALUES
  // ==========================================================

  const customerId =
    valueOrEmpty(
      wizardData.customerId,
    );

  const customerName =
    valueOrEmpty(
      wizardData.fullName,
    );

  const mobileNumber =
    valueOrEmpty(
      wizardData.mobileNumber,
    );

  const address =
    valueOrEmpty(
      wizardData.address,
    );

  const nomineeCustomerId =
    valueOrEmpty(
      wizardData.nomineeCustomerId,
    );

  const nomineeName =
    valueOrEmpty(
      wizardData.nomineeName,
    );

  const nomineeRelationship =
    valueOrEmpty(
      wizardData.nomineeRelationship,
    );

  const nomineePhoneNumber =
    valueOrEmpty(
      wizardData.nomineePhoneNumber,
    );

  const aadhaar =
    valueOrEmpty(
      wizardData.aadhaar,
    );

  const pan =
    valueOrEmpty(
      wizardData.pan,
    );


  // ==========================================================
  // VALIDATION STATE
  // ==========================================================

  const identityComplete =
    Boolean(
      customerId &&
      customerName &&
      mobileNumber,
    );

  const addressComplete =
    Boolean(
      address,
    );

  const kycDocumentsProvided =
    Boolean(
      aadhaar ||
      pan,
    );


  /*
   * Entered KYC documents are never automatically verified.
   */

  const kycVerified =
    false;

  const nomineeAdded =
    Boolean(
      nomineeName ||
      nomineeCustomerId,
    );


  // ==========================================================
  // CHECKLIST
  // ==========================================================

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
          customerName &&
          mobileNumber,
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
        kycDocumentsProvided
          ? "KYC Submitted — Verification Pending"
          : "KYC Information Required",

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


  // ==========================================================
  // SAVE / UPDATE CUSTOMER
  // ==========================================================

  const handleSave =
    async (): Promise<void> => {

      if (isSaving) {

        return;
      }


      if (!identityComplete) {

        console.warn(
          "FINORA REVIEW: Identity information is incomplete.",
        );

        return;
      }


      if (!addressComplete) {

        console.warn(
          "FINORA REVIEW: Address information is incomplete.",
        );

        return;
      }


      if (!nomineeAdded) {

        console.warn(
          "FINORA REVIEW: Nominee information is incomplete.",
        );

        return;
      }


      setIsSaving(true);


      try {

        // ====================================================
        // EDIT MODE
        // ====================================================

        if (isEditMode) {

          if (!originalCustomerProfile) {

            console.error(
              "FINORA EDIT ERROR: Original customer profile not found.",
            );

            return;
          }


          const existingCustomer =
            originalCustomerProfile;

          const now =
            new Date().toISOString();


          const updatedCustomer:
            CustomerProfile = {

            ...existingCustomer,

            identity: {

              ...existingCustomer.identity,

              updatedAt:
                now,

            },

            basic: {

              ...existingCustomer.basic,

              fullName:
                customerName ||
                existingCustomer.basic.fullName,

              mobileNumber:
                mobileNumber ||
                existingCustomer.basic.mobileNumber,

              displayName:
                customerName ||
                existingCustomer.basic.displayName,

              whatsappNumber:
                valueOrEmpty(
                  wizardData.whatsapp,
                ) ||
                existingCustomer.basic.whatsappNumber,

              email:
                valueOrEmpty(
                  wizardData.email,
                ) ||
                existingCustomer.basic.email,

              fatherName:
                valueOrEmpty(
                  wizardData.fatherOrSpouseName,
                ) ||
                existingCustomer.basic.fatherName,

              spouseName:
                valueOrEmpty(
                  wizardData.spouseName,
                ) ||
                existingCustomer.basic.spouseName,

              emergencyContactName:
                valueOrEmpty(
                  wizardData.emergencyContactName,
                ) ||
                existingCustomer.basic.emergencyContactName,

              emergencyContactNumber:
                valueOrEmpty(
                  wizardData.emergencyContactMobile,
                ) ||
                existingCustomer.basic.emergencyContactNumber,

            },

          };


          const result =
            await customerService.update(
              updatedCustomer,
            );


          if (!result.success) {

            console.error(
              "FINORA CUSTOMER UPDATE FAILED:",
              result.error,
            );

            return;
          }


          console.info(
            "FINORA CUSTOMER UPDATED:",
            updatedCustomer.identity.customerId,
          );


          resetWizard();

          return;
        }


        // ====================================================
        // NEW CUSTOMER REGISTRATION
        // ====================================================

        const now =
          new Date().toISOString();

        const finalCustomerId =
          customerId ||
          generateCustomerId();


        // ====================================================
        // DIGITAL LOCKER
        // ====================================================

        const documents = {

          folderName:
            `Customer Documents - ${finalCustomerId}`,

          documents:
            [],

          totalDocuments:
            0,

          updatedAt:
            now,

        };


        // ====================================================
        // CUSTOMER TIMELINE
        // ====================================================

        const timeline = {

          events: [

            {

              id:
                `TIMELINE-${Date.now()}`,

              type:
                CustomerTimelineEventType.CUSTOMER_CREATED,

              title:
                "Customer Created",

              description:
                "Customer profile created through FINORA Customer Wizard.",

              priority:
                CustomerTimelinePriority.MEDIUM,

              occurredAt:
                now,

              performedBy:
                "Girish",

              referenceId:
                finalCustomerId,

            },

          ],

          updatedAt:
            now,

        };


        // ====================================================
        // NOMINEE
        // ====================================================

        const nominees =
          nomineeName ||
          nomineeCustomerId
            ? [

                {

                  nomineeId:
                    nomineeCustomerId ||
                    `NOM-${Date.now()}`,

                  fullName:
                    nomineeName ||
                    "Unknown",

                  relation:
                    toNomineeRelation(
                      nomineeRelationship,
                    ),

                  mobileNumber:
                    nomineePhoneNumber,

                  sharePercentage:
                    100,

                  isPrimary:
                    true,

                  isVerified:
                    false,

                },

              ]
            : [];


        // ====================================================
        // CUSTOMER PROFILE
        // ====================================================

        const newCustomer:
          CustomerProfile = {

          identity: {

            id:
              Date.now(),

            customerId:
              finalCustomerId,

            branchId:
              "BR-001",

            businessId:
              "FINORA-HYD-01",

            businessName:
              "FINORA Enterprise",

            createdAt:
              now,

            updatedAt:
              now,

            createdBy:
              "Girish",

            isActive:
              true,

            isDeleted:
              false,

          },

          basic: {

            fullName:
              customerName ||
              "Unknown",

            mobileNumber:
              mobileNumber,

            displayName:
              customerName ||
              "Unknown",

            fatherName:
              valueOrEmpty(
                wizardData.fatherOrSpouseName,
              ),

            motherName:
              "",

            spouseName:
              valueOrEmpty(
                wizardData.spouseName,
              ),

            whatsappNumber:
              valueOrEmpty(
                wizardData.whatsapp,
              ) ||
              mobileNumber,

            email:
              valueOrEmpty(
                wizardData.email,
              ),

            preferredLanguage:
              wizardData.preferredLanguage ??
              "English",

            emergencyContactName:
              valueOrEmpty(
                wizardData.emergencyContactName,
              ),

            emergencyContactNumber:
              valueOrEmpty(
                wizardData.emergencyContactMobile,
              ),

          },

          personal: {

            gender:
              toGender(
                undefined,
              ),

            dateOfBirth:
              valueOrEmpty(
                wizardData.dateOfBirth,
              ),

            maritalStatus:
              toMaritalStatus(
                wizardData.maritalStatus,
              ),

            education:
              toEducation(
                wizardData.education,
              ),

            occupation:
              toOccupation(
                wizardData.occupation,
              ),

            monthlyIncome:
              Number(
                wizardData.monthlyIncome ??
                0,
              ),

            annualIncome:
              Number(
                wizardData.monthlyIncome ??
                0,
              ) * 12,

            isDifferentlyAbled:
              false,

          },

          address: {

            currentAddress: {

              street:
                address,

              village:
                "",

              district:
                "",

              state:
                "",

              country:
                "India",

            },

            permanentAddress: {

              street:
                address,

              village:
                "",

              district:
                "",

              state:
                "",

              country:
                "India",

            },

            isPermanentAddressSame:
              true,

          },

          kyc: {

            ...(aadhaar
              ? {

                  aadhaar: {

                    documentNumber:
                      aadhaar,

                    status:
                      KYCStatus.PENDING,

                  },

                }
              : {}),

            ...(pan
              ? {

                  pan: {

                    documentNumber:
                      pan,

                    status:
                      KYCStatus.PENDING,

                  },

                }
              : {}),

            overallStatus:
              KYCStatus.PENDING,

          },

          nominee: {

            nominees,

          },

          documents,

          internal: {

            status:
              CustomerStatus.ACTIVE,

            risk:
              CustomerRisk.LOW,

            tags:
              [],

            rating:
              5,

            branchId:
              "BR-001",

            customerSince:
              now,

            totalLoans:
              0,

            activeLoans:
              0,

            closedLoans:
              0,

            totalCollections:
              0,

            outstandingAmount:
              0,

            isDeleted:
              false,

            isArchived:
              false,

          },

          timeline,

          statistics: {

            totalLoans:
              0,

            activeLoans:
              0,

            closedLoans:
              0,

            rejectedLoans:
              0,

            totalBorrowedAmount:
              0,

            totalInterestPaid:
              0,

            totalCollections:
              0,

            outstandingAmount:
              0,

            averagePaymentDelayDays:
              0,

            largestLoanAmount:
              0,

            smallestLoanAmount:
              0,

            lastLoanAmount:
              0,

            totalGoldWeight:
              0,

            estimatedGoldValue:
              0,

            totalDocuments:
              0,

            totalTimelineEvents:
              1,

            profileCompletion:
              100,

            customerScore:
              100,

          },

        };


        // ====================================================
        // CUSTOMER SERVICE WRITE
        // ====================================================

        const result =
          await customerService.create(
            newCustomer,
          );


        if (!result.success) {

          console.error(
            "FINORA CUSTOMER CREATION FAILED:",
            result.error,
          );

          return;
        }


        console.info(
          "FINORA CUSTOMER CREATED:",
          finalCustomerId,
        );


        resetWizard();

      } finally {

        setIsSaving(false);

      }

    };


  // ==========================================================
  // EDIT
  // ==========================================================

  const handleEdit = (): void => {

    console.info(
      "FINORA REVIEW: Edit requested. Parent wizard navigation is required.",
    );

  };


  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = (): void => {

    resetWizard();

  };


  // ==========================================================
  // VIEW
  // ==========================================================

  return (

    <StudioLayout

      showHeader={false}

      allowScroll={false}

    >

      {/* ====================================================
         STEP 6 REVIEW WORKSPACE

         Row 1:
         Summary | Validation

         Row 2:
         Checklist | Actions
      ==================================================== */}

      <div style={workspaceStyle}>

        {/* ==================================================
           LEFT COLUMN
        ================================================== */}

        <div style={leftColumnStyle}>

          <CustomerSummary

            customerId={
              customerId ||
              "AUTO-GENERATED ON SAVE"
            }

            customerName={
              customerName ||
              "--"
            }

            phoneNumber={
              mobileNumber ||
              "--"
            }

            kycVerified={
              kycVerified
            }

          />


          <ReviewChecklist

            items={
              checklistItems
            }

          />

        </div>


        {/* ==================================================
           RIGHT COLUMN
        ================================================== */}

        <div style={rightColumnStyle}>

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


          <div style={actionPanelStyle}>

            <div style={draftAreaStyle}>

              <ReviewDraftStatus

                isDraftSaved={
                  false
                }

              />

            </div>


            <div style={actionAreaStyle}>

              <ReviewActions

                onSave={
                  handleSave
                }

                onEdit={
                  handleEdit
                }

                onCancel={
                  handleCancel
                }

              />

            </div>

          </div>

        </div>

      </div>

    </StudioLayout>

  );
}


// ============================================================
// END
// ============================================================
