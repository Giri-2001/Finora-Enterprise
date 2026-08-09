/* ==========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 6 — REVIEW

   MODULE  : Customer
   LAYER   : UI / Review
   VERSION : 2.0
   STATUS  : Production

   RESPONSIBILITY:

   - Final customer review orchestration
   - Validation state calculation
   - Customer profile creation
   - Existing customer update
   - Customer Service write
   - Step 2 personal information persistence
   - Step 3 address persistence
   - Step 4 KYC persistence
   - Step 5 nominee persistence
   - Review action coordination

   IMPORTANT:

   - Review components contain presentation only.
   - Persistence goes through CustomerService.
   - No direct localStorage access.
   - No direct repository access.
   - KYC document entry is NOT treated as verified.
   - Nominee data follows CustomerNomineeInformation.
   - Global FINORA header remains the workspace header.
   - ReviewHeader is intentionally not rendered here.
========================================================== */


/* ==========================================================
   IMPORTS
========================================================== */

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


/* ==========================================================
   PROPS
========================================================== */

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


/* ==========================================================
   HELPERS
========================================================== */

function generateCustomerId(): string {

  return (
    `FIN-CUS-${Date.now()}`
  );

}


/* ==========================================================
   SAFE STRING
========================================================== */

function valueOrEmpty(
  value?: string,
): string {

  return value?.trim() ?? "";

}


/* ==========================================================
   NUMBER HELPER
========================================================== */

function toNumber(
  value?: string,
): number | undefined {

  const normalized =
    value?.trim() ?? "";

  if (!normalized) {

    return undefined;
  }

  const parsed =
    Number(
      normalized,
    );

  if (
    !Number.isFinite(parsed)
  ) {

    return undefined;
  }

  return parsed;
}


/* ==========================================================
   GENDER
========================================================== */

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


/* ==========================================================
   MARITAL STATUS
========================================================== */

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


/* ==========================================================
   OCCUPATION
========================================================== */

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


/* ==========================================================
   EDUCATION
========================================================== */

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


/* ==========================================================
   NOMINEE RELATION
========================================================== */

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


/* ==========================================================
   COMPONENT
========================================================== */

export default function Step6Review({

  wizardData,

  resetWizard,

  originalCustomerProfile,

  isEditMode = false,

}: Step6ReviewProps) {


  /* ========================================================
     SAVE STATE
  ======================================================== */

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);


  /* ========================================================
     REVIEW VALUES
  ======================================================== */

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

  const voterId =
  valueOrEmpty(
    wizardData.voterId,
  );

const drivingLicence =
  valueOrEmpty(
    wizardData.drivingLicence,
  );


  /* ========================================================
     VALIDATION
  ======================================================== */

  const identityComplete =
    Boolean(
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
    pan ||
    voterId ||
    drivingLicence,
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


  /* ========================================================
     CHECKLIST
  ======================================================== */

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


  /* ========================================================
     SAVE / UPDATE CUSTOMER
  ======================================================== */

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

        /* ==================================================
           NORMALIZED STEP 2 VALUES
        ================================================== */

        const monthlyIncome =
          toNumber(
            wizardData.monthlyIncome,
          );

        const numberOfFamilyMembers =
          toNumber(
            wizardData.numberOfFamilyMembers,
          );


        /* ==================================================
           EDIT MODE
        ================================================== */

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


          /* ==================================================
             PRESERVE EXISTING NOMINEES

             If Step 5 contains nominee data, update the
             primary nominee. Otherwise preserve existing data.
          ================================================== */

          const existingNominees =
            existingCustomer.nominee.nominees ?? [];

          const shouldUpdateNominee =
            Boolean(
              nomineeName ||
              nomineeCustomerId ||
              nomineePhoneNumber ||
              nomineeRelationship,
            );


          const updatedNominees =
            shouldUpdateNominee
              ? (

                  nomineeName ||
                  nomineeCustomerId
                    ? [

                        {

                          nomineeId:
                            nomineeCustomerId ||
                            existingNominees[0]?.nomineeId ||
                            `NOM-${Date.now()}`,

                          fullName:
                            nomineeName ||
                            existingNominees[0]?.fullName ||
                            "Unknown",

                          relation:
                            toNomineeRelation(
                              nomineeRelationship ||
                              existingNominees[0]?.relation,
                            ),

                          mobileNumber:
                            nomineePhoneNumber ||
                            existingNominees[0]?.mobileNumber ||
                            "",

                          alternateMobileNumber:
                            existingNominees[0]?.alternateMobileNumber,

                          aadhaarNumber:
                            existingNominees[0]?.aadhaarNumber,

                          panNumber:
                            existingNominees[0]?.panNumber,

                          dateOfBirth:
                            existingNominees[0]?.dateOfBirth,

                          occupation:
                            existingNominees[0]?.occupation,

                          address:
                            existingNominees[0]?.address,

                          photoUrl:
                            existingNominees[0]?.photoUrl,

                          signatureUrl:
                            existingNominees[0]?.signatureUrl,

                          sharePercentage:
                            existingNominees[0]?.sharePercentage ??
                            100,

                          isPrimary:
                            existingNominees[0]?.isPrimary ??
                            true,

                          isVerified:
                            existingNominees[0]?.isVerified ??
                            false,

                          remarks:
                            existingNominees[0]?.remarks,

                        },

                        ...existingNominees.slice(1),

                      ]
                    : existingNominees

                )
              : existingNominees;


          /* ==================================================
             UPDATED CUSTOMER PROFILE
          ================================================== */

          const updatedCustomer:
            CustomerProfile = {

            ...existingCustomer,


            /* ================================================
               IDENTITY
            ================================================= */

            identity: {

              ...existingCustomer.identity,

              updatedAt:
                now,

            },


            /* ================================================
               BASIC INFORMATION
            ================================================= */

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

              preferredLanguage:
                wizardData.preferredLanguage ??
                existingCustomer.basic.preferredLanguage,

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


            /* ================================================
               PERSONAL INFORMATION

               THIS IS THE IMPORTANT STEP 2 FIX.

               Previously Edit Mode did not update `personal`
               at all.

               Now all Step 2 persisted fields are updated.
            ================================================= */

            personal: {

              ...existingCustomer.personal,

              dateOfBirth:
                valueOrEmpty(
                  wizardData.dateOfBirth,
                ) ||
                existingCustomer.personal.dateOfBirth,

              maritalStatus:
                wizardData.maritalStatus
                  ? toMaritalStatus(
                      wizardData.maritalStatus,
                    )
                  : existingCustomer.personal.maritalStatus,

              occupation:
                wizardData.occupation
                  ? toOccupation(
                      wizardData.occupation,
                    )
                  : existingCustomer.personal.occupation,

              /*
               * Preserve the exact custom occupation entered by
               * the user when the domain occupation is OTHER.
               *
               * Example:
               *   UI value        = "Finora Occupation"
               *   occupation      = OTHER
               *   occupationOther = "Finora Occupation"
               */
              occupationOther:
                toOccupation(
                  wizardData.occupation,
                ) === Occupation.OTHER
                  ? (
                      valueOrEmpty(
                        wizardData.occupation,
                      ) ||
                      existingCustomer.personal.occupationOther
                    )
                  : undefined,

              education:
                wizardData.education
                  ? toEducation(
                      wizardData.education,
                    )
                  : existingCustomer.personal.education,

              monthlyIncome:
                monthlyIncome ??
                existingCustomer.personal.monthlyIncome,

              workPlace:
                valueOrEmpty(
                  wizardData.workPlace,
                ) ||
                existingCustomer.personal.workPlace,

              experience:
                valueOrEmpty(
                  wizardData.experience,
                ) ||
                existingCustomer.personal.experience,

              numberOfFamilyMembers:
                numberOfFamilyMembers ??
                existingCustomer.personal.numberOfFamilyMembers,

            },


            /* ================================================
               ADDRESS

               STEP 3 PERSISTENCE

               The Step 3 UI uses a flat wizard representation:

               - currentAddress
               - permanentAddress
               - city
               - district
               - state
               - pinCode

               CustomerProfile uses the canonical nested Address
               model, so every Step 3 value must be mapped into
               both currentAddress and permanentAddress.

               Existing address fields not represented by the
               wizard are preserved.
            ================================================= */

            address: {

              ...existingCustomer.address,

              currentAddress: {

                ...existingCustomer.address.currentAddress,

                street:
                  wizardData.currentAddress !== undefined
                    ? valueOrEmpty(
                        wizardData.currentAddress,
                      )
                    : existingCustomer.address.currentAddress.street,

                village:
                  wizardData.city !== undefined
                    ? valueOrEmpty(
                        wizardData.city,
                      )
                    : existingCustomer.address.currentAddress.village,

                city:
                  wizardData.city !== undefined
                    ? valueOrEmpty(
                        wizardData.city,
                      )
                    : existingCustomer.address.currentAddress.city,

                district:
                  wizardData.district !== undefined
                    ? valueOrEmpty(
                        wizardData.district,
                      )
                    : existingCustomer.address.currentAddress.district,

                state:
                  wizardData.state !== undefined
                    ? valueOrEmpty(
                        wizardData.state,
                      )
                    : existingCustomer.address.currentAddress.state,

                pinCode:
                  wizardData.pinCode !== undefined
                    ? valueOrEmpty(
                        wizardData.pinCode,
                      )
                    : existingCustomer.address.currentAddress.pinCode,

              },

              permanentAddress: {

                ...existingCustomer.address.permanentAddress,

                street:
                  wizardData.permanentAddress !== undefined
                    ? valueOrEmpty(
                        wizardData.permanentAddress,
                      )
                    : existingCustomer.address.permanentAddress.street,

                village:
                  wizardData.city !== undefined
                    ? valueOrEmpty(
                        wizardData.city,
                      )
                    : existingCustomer.address.permanentAddress.village,

                city:
                  wizardData.city !== undefined
                    ? valueOrEmpty(
                        wizardData.city,
                      )
                    : existingCustomer.address.permanentAddress.city,

                district:
                  wizardData.district !== undefined
                    ? valueOrEmpty(
                        wizardData.district,
                      )
                    : existingCustomer.address.permanentAddress.district,

                state:
                  wizardData.state !== undefined
                    ? valueOrEmpty(
                        wizardData.state,
                      )
                    : existingCustomer.address.permanentAddress.state,

                pinCode:
                  wizardData.pinCode !== undefined
                    ? valueOrEmpty(
                        wizardData.pinCode,
                      )
                    : existingCustomer.address.permanentAddress.pinCode,

              },

              isPermanentAddressSame:
                wizardData.currentAddress !== undefined ||
                wizardData.permanentAddress !== undefined
                  ? (
                      valueOrEmpty(
                        wizardData.currentAddress,
                      ) ===
                      valueOrEmpty(
                        wizardData.permanentAddress,
                      )
                    )
                  : existingCustomer.address.isPermanentAddressSame,

            },


            /* ================================================
               KYC

               Preserve existing documents.

               New entered values remain PENDING.
            ================================================= */

            kyc: {

              ...existingCustomer.kyc,

              ...(aadhaar
                ? {

                    aadhaar: {

                      ...(existingCustomer.kyc.aadhaar ?? {}),

                      documentNumber:
                        aadhaar,

                      status:
                        existingCustomer.kyc.aadhaar?.status ??
                        KYCStatus.PENDING,

                    },

                  }
                : {}),

              ...(pan
                ? {

                    pan: {

                      ...(existingCustomer.kyc.pan ?? {}),

                      documentNumber:
                        pan,

                      status:
                        existingCustomer.kyc.pan?.status ??
                        KYCStatus.PENDING,

                    },

                  }
                : {}),

                ...(voterId
  ? {

      voterId: {

        ...(existingCustomer.kyc.voterId ?? {}),

        documentNumber:
          voterId,

        status:
          existingCustomer.kyc.voterId?.status ??
          KYCStatus.PENDING,

      },

    }
  : {}),

...(drivingLicence
  ? {

      drivingLicense: {

        ...(existingCustomer.kyc.drivingLicense ?? {}),

        documentNumber:
          drivingLicence,

        status:
          existingCustomer.kyc.drivingLicense?.status ??
          KYCStatus.PENDING,

      },

    }
  : {}),

            },


            /* ================================================
               NOMINEE
            ================================================= */

            nominee: {

              ...existingCustomer.nominee,

              nominees:
                updatedNominees,

            },

          };


          /* ==================================================
             CUSTOMER SERVICE UPDATE
          ================================================== */

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


        /* ==================================================
           NEW CUSTOMER REGISTRATION
        ================================================== */

        const now =
          new Date().toISOString();

        const finalCustomerId =
          customerId ||
          generateCustomerId();


        /* ==================================================
           DIGITAL LOCKER
        ================================================== */

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


        /* ==================================================
           CUSTOMER TIMELINE
        ================================================== */

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


        /* ==================================================
           NOMINEE
        ================================================== */

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


        /* ==================================================
           CUSTOMER PROFILE
        ================================================== */

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


          /* ==================================================
             BASIC INFORMATION
          ================================================== */

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


          /* ==================================================
             PERSONAL INFORMATION

             STEP 2 PERSISTENCE
          ================================================== */

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

            /*
             * Preserve custom occupation text separately when
             * the selected occupation is OTHER.
             *
             * This prevents Edit mode from collapsing the user's
             * entered value back to the generic "Other" label.
             */
            occupationOther:
              toOccupation(
                wizardData.occupation,
              ) === Occupation.OTHER
                ? valueOrEmpty(
                    wizardData.occupation,
                  ) || undefined
                : undefined,

            monthlyIncome:
              monthlyIncome,

            annualIncome:
              monthlyIncome !== undefined
                ? monthlyIncome * 12
                : undefined,

            workPlace:
              valueOrEmpty(
                wizardData.workPlace,
              ) ||
              undefined,

            experience:
              valueOrEmpty(
                wizardData.experience,
              ) ||
              undefined,

            numberOfFamilyMembers:
              numberOfFamilyMembers,

            isDifferentlyAbled:
              false,

          },


          /* ==================================================
             ADDRESS

             STEP 3 PERSISTENCE

             Persist every value collected by AddressForm into
             the canonical CustomerAddressInformation model.

             UI:
               currentAddress
               permanentAddress
               city
               district
               state
               pinCode

             Domain:
               currentAddress: Address
               permanentAddress: Address
          ================================================== */

          address: {

            currentAddress: {

              street:
                valueOrEmpty(
                  wizardData.currentAddress,
                ),

              village:
                valueOrEmpty(
                  wizardData.city,
                ),

              city:
                valueOrEmpty(
                  wizardData.city,
                ),

              district:
                valueOrEmpty(
                  wizardData.district,
                ),

              state:
                valueOrEmpty(
                  wizardData.state,
                ),

              country:
                "India",

              pinCode:
                valueOrEmpty(
                  wizardData.pinCode,
                ),

            },

            permanentAddress: {

              street:
                valueOrEmpty(
                  wizardData.permanentAddress,
                ) ||
                valueOrEmpty(
                  wizardData.currentAddress,
                ),

              village:
                valueOrEmpty(
                  wizardData.city,
                ),

              city:
                valueOrEmpty(
                  wizardData.city,
                ),

              district:
                valueOrEmpty(
                  wizardData.district,
                ),

              state:
                valueOrEmpty(
                  wizardData.state,
                ),

              country:
                "India",

              pinCode:
                valueOrEmpty(
                  wizardData.pinCode,
                ),

            },

            isPermanentAddressSame:
              valueOrEmpty(
                wizardData.permanentAddress,
              ) ===
              valueOrEmpty(
                wizardData.currentAddress,
              ),

          },


          /* ==================================================
             KYC
          ================================================== */

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

              ...(voterId
  ? {

      voterId: {

        documentNumber:
          voterId,

        status:
          KYCStatus.PENDING,

      },

    }
  : {}),

...(drivingLicence
  ? {

      drivingLicense: {

        documentNumber:
          drivingLicence,

        status:
          KYCStatus.PENDING,

      },

    }
  : {}),

            overallStatus:
              KYCStatus.PENDING,

          },


          /* ==================================================
             NOMINEE
          ================================================== */

          nominee: {

            nominees,

          },


          /* ==================================================
             DOCUMENTS
          ================================================== */

          documents,


          /* ==================================================
             INTERNAL
          ================================================== */

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


          /* ==================================================
             TIMELINE
          ================================================== */

          timeline,


          /* ==================================================
             STATISTICS
          ================================================== */

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


        /* ==================================================
           CUSTOMER SERVICE WRITE
        ================================================== */

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


  /* ========================================================
     EDIT
  ======================================================== */

  const handleEdit = (): void => {

    console.info(
      "FINORA REVIEW: Edit requested. Parent wizard navigation is required.",
    );

  };


  /* ========================================================
     CANCEL
  ======================================================== */

  const handleCancel = (): void => {

    resetWizard();

  };


  /* ========================================================
     VIEW
  ======================================================== */

  return (

    <StudioLayout

      showHeader={false}

      allowScroll={false}

    >

      <div style={workspaceStyle}>

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


/* ==========================================================
   END
========================================================== */
