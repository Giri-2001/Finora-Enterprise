/* ==========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 6 — REVIEW ACTION WORKSPACE

   VERSION : 4.4
   STATUS  : Production

   RESPONSIBILITY:
   - Review checklist presentation
   - Customer review actions
   - Existing CustomerService persistence
   - New customer creation
   - Existing customer update

   IMPORTANT:
   - Step 5 already owns:
       Nominee Information
       Nominee Preview
       Customer Summary
       Validation Status
   - Step 6 MUST NOT render:
       Nominee Information
       Nominee Preview
       Customer Summary
   - Step 6 owns the RIGHT 3 review cards:
       Validation Status
       Review Checklist
       Customer Review Actions
   - Persistence remains unchanged.
   - No direct localStorage access.
   - No direct repository access.
   - No local breakpoint logic.
========================================================== */


/* ==========================================================
   IMPORTS
========================================================== */

import {
  useEffect,
  useState,
} from "react";


/* ==========================================================
   RESPONSIVE ENGINE
========================================================== */

import {
  useResponsive,
} from "../../../../utils/responsive";


import {
  getReviewResponsiveTokens,
} from "../../../../utils/responsive/customers/review/review.tokens";


import {
  createStep6ReviewStyles,
} from "./Step6Review.styles";


/* ==========================================================
   LAYOUT
========================================================== */

import StudioLayout
  from "../../../common/layout/StudioLayout";


/* ==========================================================
   REVIEW
========================================================== */

import ValidationStatus
  from "../../review/ValidationStatus";


import ReviewChecklist
  from "../../review/ReviewChecklist";


import ReviewActions
  from "../../review/ReviewActions";


/* ==========================================================
   SERVICE
========================================================== */

import {
  customerService,
} from "../../../../services/customer/customerService";


import {
  reserveNextCustomerNumber,
} from "../../../../services/numbering/customerSeriesService";


import {
  requireBusinessContext,
} from "../../../../services/business/businessContextService";

import {
  storageManager,
} from "../../../../storage/storageManager";

import {
  StorageMode,
} from "../../../../storage/storage.types";


import {
  loadBusinessIdentity,
} from "../../../../services/business/businessService";

import {
  customerCreatedNotificationGenerator,
} from "../../../../services/notifications/generation/customerCreatedNotificationGenerator";

import {
  useCustomerIdCardCapture,
} from "../../hub/cards/CustomerIdCardCapture/useCustomerIdCardCapture";

import {
  notificationArtifactService,
} from "../../../../services/notifications/artifacts/notificationArtifactService";

import {
  buildCustomerCreatedNotificationArtifactId,
} from "../../../../services/notifications/generation/notificationGenerationIdentity";


/* ==========================================================
   TYPES
========================================================== */

import type {
  CustomerProfile,
} from "../../../../types/customers";

import type {
  BusinessIdentity,
} from "../../../../types/business/business.identity.types";


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

  return Number.isFinite(parsed)
    ? parsed
    : undefined;

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
     RESPONSIVE ENGINE
  ======================================================== */

  const {
    tokens,
  } =
    useResponsive();


  const reviewTokens =
    getReviewResponsiveTokens(
      tokens.meta.viewport,
    );

  /* ========================================================
     CUSTOMER ID CARD CAPTURE
  ======================================================== */

  const {
    capture:
      captureCustomerIdCard,
    captureNode:
      captureCustomerIdCardNode,
  } = useCustomerIdCardCapture({
    companyName:
      "",
  });


  const {
    workspaceStyle,
    actionPanelStyle,
    actionAreaStyle,
  } =
    createStep6ReviewStyles(
      reviewTokens,
    );


  /* ========================================================
     SAVE STATE
  ======================================================== */

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  /* ========================================================
     CUSTOMER ID CARD CAPTURE STATE
     ======================================================== */

  const [
    customerCaptureProfile,
    setCustomerCaptureProfile,
  ] = useState<
    CustomerProfile | undefined
  >(
    undefined,
  );

  /* ========================================================
     PENDING CUSTOMER NOTIFICATION IDENTITY
     ======================================================== */

  const [
    pendingNotificationBusinessIdentity,
    setPendingNotificationBusinessIdentity,
  ] = useState<
    BusinessIdentity | undefined
  >(
    undefined,
  );

  /* ========================================================
     CUSTOMER CREATED NOTIFICATION EFFECT
  ======================================================== */

  useEffect(() => {
    if (
      !customerCaptureProfile ||
      !pendingNotificationBusinessIdentity
    ) {
      return;
    }

    let cancelled = false;

    async function processCustomerCreatedNotification(): Promise<void> {
      const currentCustomer =
        customerCaptureProfile;

      const currentBusinessIdentity =
        pendingNotificationBusinessIdentity;

      if (
        !currentCustomer ||
        !currentBusinessIdentity
      ) {
        return;
      }

      try {
        const activeStorageMode =
          storageManager.getStorageMode();

        let mediaArtifactResult:
          Awaited<
            ReturnType<
              typeof notificationArtifactService.save
            >
          > | undefined;

        if (
          activeStorageMode === StorageMode.LOCAL ||
          activeStorageMode === StorageMode.USB
        ) {
          const artifactIdResult =
            buildCustomerCreatedNotificationArtifactId({
              ownerId:
                currentBusinessIdentity.ownerId,
              businessId:
                currentBusinessIdentity.businessId,
              branchId:
                currentBusinessIdentity.branchId,
              customerId:
                currentCustomer.identity.customerId,
            });

          if (!artifactIdResult.success) {
            console.error(
              "FINORA CUSTOMER CREATED ARTIFACT ID FAILED:",
              artifactIdResult.error,
            );
          } else {
            const captureResult =
              await captureCustomerIdCard(
                currentCustomer,
              );

            if (!captureResult.success) {
              console.error(
                "FINORA CUSTOMER ID CARD CAPTURE FAILED:",
                captureResult.error,
              );
            } else {
              mediaArtifactResult =
                await notificationArtifactService.save({
                  artifactId:
                    artifactIdResult.id,
                  kind:
                    "CUSTOMER_ID_CARD",
                  storageMode:
                    activeStorageMode,
                  mimeType:
                    "image/png",
                  fileName:
                    `${currentCustomer.identity.customerId}.png`,
                  contentBase64:
                    captureResult.contentBase64,
                  scope: {
                    ownerId:
                      currentBusinessIdentity.ownerId,
                    businessId:
                      currentBusinessIdentity.businessId,
                    branchId:
                      currentBusinessIdentity.branchId,
                  },
                });

              if (!mediaArtifactResult.success) {
                console.error(
                  "FINORA CUSTOMER CREATED ARTIFACT SAVE FAILED:",
                  mediaArtifactResult.error,
                );
              }
            }
          }
        } else {
          console.warn(
            "FINORA CUSTOMER CREATED ARTIFACT SKIPPED:",
            `Unsupported storage mode ${activeStorageMode}.`,
          );
        }
          if (
            !mediaArtifactResult ||
            !mediaArtifactResult.success
          ) {
            console.error(
              "FINORA CUSTOMER CREATED NOTIFICATION BLOCKED:",
              "A durable Customer ID Card artifact is required before Notification generation.",
            );

            return;
          }

          const generatedAt =
            new Date().toISOString();

          const notificationResult =
            await customerCreatedNotificationGenerator.generate({
              customer:
                currentCustomer,

              businessIdentity:
                currentBusinessIdentity,

              generatedAt,

              mediaArtifact:
                mediaArtifactResult.data,
            });

          if (!notificationResult.success) {
          console.error(
            "FINORA CUSTOMER CREATED NOTIFICATION GENERATION FAILED:",
            notificationResult.error,
          );

          return;
        }

        setCustomerCaptureProfile(undefined);

        setPendingNotificationBusinessIdentity(undefined);

        resetWizard();

      } catch (error) {
        console.error(
          "FINORA CUSTOMER CREATED NOTIFICATION EFFECT FAILED:",
          error,
        );
      }
    }

    void processCustomerCreatedNotification();

    return () => {
      cancelled = true;
    };
  }, [
    captureCustomerIdCard,
    customerCaptureProfile,
    pendingNotificationBusinessIdentity,
    resetWizard,
  ]);


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
      wizardData.address ||
      wizardData.currentAddress,
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
     NOMINEE VALUES

     Step 5 owns the editable nominee workspace.
     Step 6 reads the synchronized wizard values only.
  ======================================================== */

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

        let activeBusinessId:
          string;

        let activeBranchId:
          string;


        try {

          const businessContext =
            requireBusinessContext();


          activeBusinessId =
            businessContext.businessId?.trim() ??
            "";

          activeBranchId =
            businessContext.branchId?.trim() ??
            "";


          if (!activeBusinessId) {
            throw new Error(
              "Active FINORA Business ID is unavailable.",
            );
          }


          if (!activeBranchId) {
            throw new Error(
              "Active FINORA Branch ID is unavailable.",
            );
          }

        } catch (error) {

          console.error(
            "FINORA CUSTOMER BUSINESS CONTEXT FAILED:",
            error,
          );

          return;

        }


        const businessIdentityResult =
          await loadBusinessIdentity(
            activeBusinessId,
          );


        if (
          !businessIdentityResult.success ||
          !businessIdentityResult.data
        ) {

          console.error(
            "FINORA CUSTOMER BUSINESS IDENTITY FAILED:",
            businessIdentityResult.error ??
              "Business Identity is unavailable.",
          );

          return;

        }


        const activeBusinessName =
          businessIdentityResult.data.businessName.trim();


        if (!activeBusinessName) {

          console.error(
            "FINORA CUSTOMER BUSINESS NAME FAILED:",
            "Registered Business Name is unavailable.",
          );

          return;

        }


        const now =
          new Date().toISOString();


        const reservationResult =
          await reserveNextCustomerNumber();


        if (
          !reservationResult.success ||
          !reservationResult.data
        ) {

          console.error(
            "FINORA CUSTOMER NUMBER RESERVATION FAILED:",
            reservationResult.error,
          );

          return;

        }


        const finalCustomerId =
          reservationResult.data.customerId;


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
              activeBranchId,

            businessId:
              activeBusinessId,

            businessName:
              activeBusinessName,

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
              activeBranchId,

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


        /* ==================================================
           CUSTOMER CREATED NOTIFICATION

           Customer persistence is already successful.
           Notification failure must never roll back or fake-fail
           the persisted Customer.
        ================================================== */

        if (result.data) {

            /* ==================================================
               PREPARE CUSTOMER ID CARD CAPTURE
            ================================================== */

            setCustomerCaptureProfile(
              result.data,
            );

            setPendingNotificationBusinessIdentity(
              businessIdentityResult.data,
            );

          } else {

          console.error(
            "FINORA CUSTOMER CREATED NOTIFICATION GENERATION SKIPPED:",
            "Customer persistence returned no persisted Customer record.",
          );
        }


        

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

     Step 5 already renders the four customer/nominee cards.
     Step 6 intentionally renders only the final review controls.

     RIGHT WORKSPACE:
       Validation Status
       Review Checklist
       Customer Review Actions
  ======================================================== */

  return (

    <StudioLayout

      showHeader={false}

      allowScroll={false}

    >

      <div
        style={
          workspaceStyle
        }
      >

        {/* =================================================
            4 — VALIDATION STATUS
        ================================================= */}

        <div>

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


        {/* =================================================
            5 — REVIEW CHECKLIST
        ================================================= */}

        <div>

          <ReviewChecklist

            items={
              checklistItems
            }

          />

        </div>


        {/* =================================================
            6 — CUSTOMER REVIEW ACTIONS
        ================================================= */}

        <div
          style={
            actionPanelStyle
          }
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
              }            />

          </div>

        </div>

      </div>

      {/* ==================================================
          OFFSCREEN CUSTOMER ID CARD CAPTURE
      ================================================== */}

      {customerCaptureProfile
        ? captureCustomerIdCardNode(
            customerCaptureProfile,
          )
        : null}

    </StudioLayout>

  );

}


/* ==========================================================
   END
========================================================== */

















