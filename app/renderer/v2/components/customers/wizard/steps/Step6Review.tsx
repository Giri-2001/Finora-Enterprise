/* ==========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 6 — REVIEW

   MODULE  : Customer
   LAYER   : UI / Review
   VERSION : 4.0
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
   - Step 6 now represents the RIGHT review workspace:
       Nominee Preview
       Review Checklist
       Customer Review Actions
========================================================== */


/* ==========================================================
   IMPORTS
========================================================== */

import {
  useState,
} from "react";


import StudioLayout
  from "../../../common/layout/StudioLayout";


import NomineePreviewCard
  from "../../nominee/NomineePreviewCard";


import ReviewChecklist
  from "../../review/ReviewChecklist";


import ReviewActions
  from "../../review/ReviewActions";


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
  rightColumnStyle,
  actionPanelStyle,
  actionAreaStyle,
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


function valueOrEmpty(
  value?: string,
): string {

  return value?.trim() ?? "";

}


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
      wizardData.address?.trim() ||
      wizardData.currentAddress?.trim(),
    );


  const kycDocumentsProvided =
    Boolean(
      aadhaar ||
      pan ||
      voterId ||
      drivingLicence,
    );


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


          const updatedCustomer:
            CustomerProfile = {

            ...existingCustomer,

            photo:
              wizardData.photo !== undefined
                ? valueOrEmpty(
                    wizardData.photo,
                  )
                : existingCustomer.photo,

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

            nominee: {

              ...existingCustomer.nominee,

              nominees:
                updatedNominees,

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


        /* ==================================================
           NEW CUSTOMER
        ================================================== */

        const now =
          new Date().toISOString();


        const finalCustomerId =
          customerId ||
          generateCustomerId();


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


        const newCustomer:
          CustomerProfile = {

          photo:
            valueOrEmpty(
              wizardData.photo,
            ),

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
     NOMINEE PREVIEW
  ======================================================== */

  const nomineePreview = {

    customerName:
      customerName,

    nomineeCustomerId:
      nomineeCustomerId,

    nomineeName:
      nomineeName,

    relationship:
      nomineeRelationship,

    phoneNumber:
      nomineePhoneNumber,

  };


  /* ========================================================
     VIEW

     IMPORTANT:

     Step6Review is intentionally a RIGHT-SIDE review
     workspace.

     CustomerSummary + ValidationStatus are rendered by
     Step5Nominee on the LEFT.

     Step6 renders:

       1. Nominee Preview
       2. Review Checklist
       3. Review Actions
  ======================================================== */

  return (

    <StudioLayout

      showHeader={false}

      allowScroll={false}

    >

      <div
        style={{
          ...workspaceStyle,
          width: "100%",
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          overflow: "visible",
          boxSizing: "border-box",
        }}
      >

        {/* =================================================
            NOMINEE PREVIEW
        ================================================= */}

        <NomineePreviewCard

          value={
            nomineePreview
          }

        />


        {/* =================================================
            REVIEW CHECKLIST
        ================================================= */}

        <ReviewChecklist

          items={
            checklistItems
          }

        />


        {/* =================================================
            REVIEW ACTIONS
        ================================================= */}

        <div
          style={{
            ...actionPanelStyle,
            width: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >

          <div
            style={
              actionAreaStyle
            }
          >

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

    </StudioLayout>

  );

}


/* ==========================================================
   END
========================================================== */