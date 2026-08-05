/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER WIZARD
   STEP 6 - REVIEW STUDIO
=========================================================== */

import StudioLayout from "../../../common/layout/StudioLayout";
import TwoColumnStudio from "../../../common/layout/TwoColumnStudio";

import ReviewHeader from "../../review/ReviewHeader";
import CustomerSummary from "../../review/CustomerSummary";
import ValidationStatus from "../../review/ValidationStatus";
import ReviewChecklist from "../../review/ReviewChecklist";
import ReviewActions from "../../review/ReviewActions";
import ReviewDraftStatus from "../../review/ReviewDraftStatus";

import {
  addCustomer,
} from "../../../../store/customers/customer.store";

import type {
  CustomerWizardData,
} from "../CustomerWizard";

import {
  CustomerStatus,
  CustomerRisk,
} from "../../../../types/customers/customer.enums";

interface Step6ReviewProps {

  wizardData: CustomerWizardData;

  resetWizard: () => void;

}


export default function Step6Review({

  wizardData,

  resetWizard,

}: Step6ReviewProps) {

  const handleSave = () => {

    console.log("SAVE DATA:", wizardData);

    console.log("Wizard Data", wizardData);

  addCustomer({

    identity: {
      id: Date.now(),
      customerId:
        wizardData.customerId ??
        `FIN-CUS-${Date.now()}`,
      branchId: "BR-001",
      businessId: "FINORA-HYD-01",
      businessName: "FINORA Enterprise",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "Girish",
      isActive: true,
      isDeleted: false,
    },

    basic: {

  fullName:
    wizardData.fullName ?? "Unknown",

  mobileNumber:
    wizardData.mobileNumber ?? "",

  displayName:
    wizardData.fullName ?? "Unknown",

  fatherName: "",

  preferredLanguage: "English",

},

    personal: {
      gender: "",
      dateOfBirth: "",
      maritalStatus: "",
      religion: "",
      caste: "",
      education: "",
      occupation: "",
      annualIncome: 0,
      aadhaarNumber: "",
      panNumber: "",
    },

    address: {
      currentAddress: {
        line1: "",
        line2: "",
        city: "",
        district: "",
        state: "",
        pincode: "",
        country: "India",
      },
      permanentAddress: {
        line1: "",
        line2: "",
        city: "",
        district: "",
        state: "",
        pincode: "",
        country: "India",
      },
      isCurrentSameAsPermanent: true,
    },

    kyc: {
      isKycVerified: false,
      verificationStatus: "pending",
      aadhaarVerified: false,
      panVerified: false,
      documentIds: [],
    },

    nominee: {
      name: "",
      relationship: "",
      mobileNumber: "",
      address: "",
      isPrimary: true,
    },

    internal: {
      status: CustomerStatus.ACTIVE,
      risk: CustomerRisk.LOW,
      tags: [],
      rating: 5,
      branchId: "BR-001",
      customerSince:
        new Date().toISOString(),
      totalLoans: 0,
      activeLoans: 0,
      closedLoans: 0,
      totalCollections: 0,
      outstandingAmount: 0,
      isDeleted: false,
      isArchived: false,
    },

    statistics: {
      totalLoans: 0,
      activeLoans: 0,
      closedLoans: 0,
      rejectedLoans: 0,
      totalBorrowedAmount: 0,
      totalInterestPaid: 0,
      totalCollections: 0,
      outstandingAmount: 0,
      averagePaymentDelayDays: 0,
      largestLoanAmount: 0,
      smallestLoanAmount: 0,
      lastLoanAmount: 0,
      totalGoldWeight: 0,
      estimatedGoldValue: 0,
      totalDocuments: 0,
      totalTimelineEvents: 0,
      profileCompletion: 100,
      customerScore: 100,
    },

  } as any);


  resetWizard();

};

  return (

    <StudioLayout>

      <ReviewHeader />

      <TwoColumnStudio

        left={

          <>

            <CustomerSummary

  customerId={
    wizardData.customerId ?? "--"
  }

  customerName={
    wizardData.fullName ?? "--"
  }

  phoneNumber={
    wizardData.mobileNumber ?? "--"
  }

  kycVerified={
    Boolean(wizardData.aadhaar)
  }

/>

            <ValidationStatus

              identityComplete={false}

              addressComplete={false}

              kycVerified={false}

              nomineeAdded={false}

            />

            <ReviewChecklist />

          </>

        }

        right={

          <>

            <ReviewActions

              onSave={handleSave}


              onEdit={() => {}}

              onCancel={() => {}}

            />

            <ReviewDraftStatus

              isDraftSaved={false}

            />

          </>

        }

      />

    </StudioLayout>

  );

}
