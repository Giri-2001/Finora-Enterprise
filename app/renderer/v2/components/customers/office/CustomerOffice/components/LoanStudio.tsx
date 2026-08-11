// ============================================================
// FINORA ENTERPRISE OS™
//
// LOAN STUDIO™
//
// CUSTOMER WORKSPACE
//
// MODULE  : Loan
// LAYER   : UI / Customer Office
// VERSION : 2.0
// STATUS  : Production
//
// RESPONSIBILITY:
//
// - Render the complete Loan Studio workflow
// - Collect Loan configuration
// - Calculate finance values
// - Generate repayment schedule
// - Build Loan domain record
// - Delegate Loan persistence to LoanService
// - Prevent duplicate Loan creation through LoanService
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - No direct LoanRepository access.
// - Loan persistence remains below the Service layer.
// - Existing Loan workflow and calculations are preserved.
//
// ============================================================


// ============================================================
// LOAN DETAILS
// ============================================================

import LoanForm
  from "../../../../loans/details/LoanForm";

import LoanCustomerCard
  from "../../../../loans/details/LoanCustomerCard";

import type {
  LoanCustomerOption,
} from "../../../../loans/details/LoanCustomerCard";

import LoanPreviewCard
  from "../../../../loans/details/LoanPreviewCard";

import LoanStatistics
  from "../../../../loans/details/LoanStatistics";

import {
  shellStyle,
  footerStyle,
  stepListStyle,
  stepItemStyle,
  activeStepNumberStyle,
  activeStepTitleStyle,
  completedStepNumberStyle,
  completedStepTitleStyle,
  pendingStepNumberStyle,
  pendingStepTitleStyle,
  stepSubtitleStyle,
  stepTextStyle,
  navigationStyle,
  navigationButtonStyle,
  disabledNavigationButtonStyle,
  primaryNavigationButtonStyle,
} from "./LoanStudio.styles";


// ============================================================
// FINANCE
// ============================================================

import FinanceHeader
  from "../../../../loans/finance/FinanceHeader";

import InterestConfiguration
  from "../../../../loans/finance/InterestConfiguration";

import ProcessingFeeCard
  from "../../../../loans/finance/ProcessingFeeCard";

import PenaltyConfiguration
  from "../../../../loans/finance/PenaltyConfiguration";

import FinancePreviewCard
  from "../../../../loans/finance/FinancePreviewCard";

import FinanceDraftStatus
  from "../../../../loans/finance/FinanceDraftStatus";


// ============================================================
// GUARANTOR
// ============================================================

import GuarantorHeader
  from "../../../../loans/guarantor/GuarantorHeader";

import GuarantorForm
  from "../../../../loans/guarantor/GuarantorForm";

import RelationshipCard
  from "../../../../loans/guarantor/RelationshipCard";

import GuarantorVerification
  from "../../../../loans/guarantor/GuarantorVerification";

import GuarantorPreviewCard
  from "../../../../loans/guarantor/GuarantorPreviewCard";

import GuarantorDraftStatus
  from "../../../../loans/guarantor/GuarantorDraftStatus";


// ============================================================
// REPAYMENT
// ============================================================

import RepaymentHeader
  from "../../../../loans/repayment/RepaymentHeader";

import EMIConfiguration
  from "../../../../loans/repayment/EMIConfiguration";

import ScheduleConfiguration
  from "../../../../loans/repayment/ScheduleConfiguration";

import RepaymentSummary
  from "../../../../loans/repayment/RepaymentSummary";

import RepaymentPreviewCard
  from "../../../../loans/repayment/RepaymentPreviewCard";

import RepaymentDraftStatus
  from "../../../../loans/repayment/RepaymentDraftStatus";


// ============================================================
// SCHEDULE
// ============================================================

import LoanScheduleTable
  from "../../../../loans/schedule/LoanScheduleTable";


// ============================================================
// DISBURSEMENT
// ============================================================

import DisbursementHeader
  from "../../../../loans/disbursement/DisbursementHeader";

import DisbursementForm
  from "../../../../loans/disbursement/DisbursementForm";

import PaymentModeCard
  from "../../../../loans/disbursement/PaymentModeCard";

import DisbursementReceipt
  from "../../../../loans/disbursement/DisbursementReceipt";

import DisbursementPreviewCard
  from "../../../../loans/disbursement/DisbursementPreviewCard";

import DisbursementDraftStatus
  from "../../../../loans/disbursement/DisbursementDraftStatus";


// ============================================================
// REVIEW
// ============================================================

import ReviewHeader
  from "../../../../loans/review/ReviewHeader";

import LoanSummary
  from "../../../../loans/review/LoanSummary";

import ValidationChecklist
  from "../../../../loans/review/ValidationChecklist";

import ApprovalActions
  from "../../../../loans/review/ApprovalActions";

import ReviewPreviewCard
  from "../../../../loans/review/ReviewPreviewCard";

import ReviewDraftStatus
  from "../../../../loans/review/ReviewDraftStatus";


// ============================================================
// SCHEDULE ENGINE
// ============================================================

import {
  generateSchedule,
} from "../../../../loans/schedule/schedule.helpers";


// ============================================================
// LOAN SERVICES
// ============================================================

import {
  buildLoan,
} from "../../../../../services/loan/loanBuilder";

import {
  createLoan,
  hasExistingLoan,
} from "../../../../../services/loan/loanService";

import {
  getCustomers,
  hydrateCustomersFromStorage,
  clearCustomerCache,
} from "../../../../../store/customers/customer.store";

import {
  storageManager,
} from "../../../../../storage/storageManager";

import {
  StorageMode,
} from "../../../../../storage/storage.types";


// ============================================================
// TYPES
// ============================================================

import type {
  LoanReviewData,
} from "../../../../loans/review/types";


// ============================================================
// REACT
// ============================================================

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CSSProperties,
} from "react";


// ============================================================
// PREMIUM WORKSPACE LAYOUT
//
// RESPONSIBILITY:
// - Keep Loan Studio inside the application viewport
// - Prevent outer page scrolling
// - Keep wizard footer anchored inside the shell
// - Compact all six workflow stages consistently
//
// ============================================================

const studioShellStyle: CSSProperties = {
  ...shellStyle,

  width: "100%",
  height: "calc(100vh - 112px)",
  minHeight: 0,

  boxSizing: "border-box",

  padding: "14px",

  gap: "10px",

  overflow: "hidden",
};


const studioContentStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: 0,

  flex: 1,

  boxSizing: "border-box",

  overflow: "auto",

  scrollbarWidth: "none",
};


const studioStepStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: 0,

  boxSizing: "border-box",

  display: "flex",
  flexDirection: "column",

  gap: "10px",

  overflow: "visible",
};


const studioGridStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,

  display: "grid",

  gridTemplateColumns:
    "minmax(0, 2fr) minmax(270px, 1fr)",

  gap: "12px",

  alignItems: "start",

  boxSizing: "border-box",
};


const studioColumnStyle: CSSProperties = {
  minWidth: 0,

  display: "flex",
  flexDirection: "column",

  gap: "10px",

  boxSizing: "border-box",
};


const STORAGE_MODE_SESSION_KEY =
  "FINORA_STORAGE_MODE";


// ============================================================
// AUTHENTICATED STORAGE MODE
// ============================================================

function getAuthenticatedStorageMode():
  StorageMode {

  try {

    const storedMode =
      window.sessionStorage.getItem(
        STORAGE_MODE_SESSION_KEY,
      );

    if (
      storedMode ===
      StorageMode.USB
    ) {

      return StorageMode.USB;
    }

    if (
      storedMode ===
      StorageMode.CLOUD
    ) {

      return StorageMode.CLOUD;
    }

    return StorageMode.LOCAL;

  } catch {

    return StorageMode.LOCAL;

  }
}


const studioFooterStyle: CSSProperties = {
  ...footerStyle,

  position: "relative",

  bottom: "auto",

  flexShrink: 0,

  width: "100%",

  padding: "9px 11px",

  gap: "12px",

  borderRadius: "12px",
};


// ============================================================
// DISPLAY / INPUT HELPERS
// ============================================================

const parseNumericValue = (
  value: string,
): number => {

  const normalized =
    value
      .replace(/,/g, "")
      .trim();

  if (!normalized) {
    return 0;
  }

  const parsed =
    Number(normalized);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
};


// ============================================================
// LOAN TYPE NORMALIZATION
//
// LoanForm may return values such as:
// - DAILY
// - Daily Loan
// - daily
// - WEEKLY
// - Weekly Loan
// - weekly
// - MONTHLY
// - Monthly Loan
// - monthly
//
// Loan Studio keeps one canonical internal representation so
// the Preview, Review, duplicate check and LoanService payload
// all receive the same Loan Type.
// ============================================================

const normalizeLoanType = (
  value: string,
): "DAILY" | "WEEKLY" | "MONTHLY" | "" => {

  const normalized =
    value
      .trim()
      .toUpperCase()
      .replace(/\s+LOAN$/, "");

  if (
    normalized === "DAILY"
  ) {
    return "DAILY";
  }

  if (
    normalized === "WEEKLY"
  ) {
    return "WEEKLY";
  }

  if (
    normalized === "MONTHLY"
  ) {
    return "MONTHLY";
  }

  return "";
};


const getLoanTypeLabel = (
  value: string,
): string => {

  const normalized =
    normalizeLoanType(value);

  switch (normalized) {

    case "DAILY":
      return "Daily Loan";

    case "WEEKLY":
      return "Weekly Loan";

    case "MONTHLY":
      return "Monthly Loan";

    default:
      return "--";

  }
};


const formatIndianNumber = (
  value: number,
): string => {

  if (
    !Number.isFinite(value)
  ) {
    return "0";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 0,
    },
  ).format(value);
};


const formatIndianDate = (
  value: Date | null,
): string => {

  if (!value) {
    return "--";
  }

  const day =
    String(
      value.getDate(),
    ).padStart(
      2,
      "0",
    );

  const month =
    String(
      value.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const year =
    value.getFullYear();

  return `${day}/${month}/${year}`;
};


// ============================================================
// PROPS
// ============================================================

interface LoanStudioProps {

  customerName?: string;

  customerId?: string;

  phoneNumber?: string;

}


// ============================================================
// COMPONENT
// ============================================================

export default function LoanStudio({

  customerName,

  customerId,

  phoneNumber,

}: LoanStudioProps) {


  // ==========================================================
  // CUSTOMER DATA
  //
  // Customer Department already hydrates the authoritative
  // Customer Store before Loan Studio is opened.
  //
  // Loan Studio therefore reads the SAME hydrated in-memory
  // Customer Store instead of starting a second independent
  // CustomerService load.
  //
  // This preserves:
  // UI
  //   ↓
  // Customer Store
  //   ↓
  // CustomerService
  //   ↓
  // CustomerRepository
  //   ↓
  // StorageManager
  //
  // No hard-coded customers.
  // No localStorage access.
  // No direct repository access.
  // ==========================================================

  const [
    customers,
    setCustomers,
  ] = useState<
    ReturnType<typeof getCustomers>
  >([]);


  // ==========================================================
  // CUSTOMER DATA HYDRATION
  //
  // CustomerDepartment owns the main Customer Office load,
  // but Loan Studio is a nested wizard and can mount before
  // the synchronous Customer Store snapshot is available.
  //
  // Therefore Loan Studio performs an authoritative Store
  // hydration check on mount. This does NOT bypass the FINORA
  // architecture: hydration still flows through:
  //
  // Customer Store
  //      ↓
  // CustomerService
  //      ↓
  // CustomerRepository
  //      ↓
  // StorageManager
  //      ↓
  // Active FINORA Storage
  //
  // No localStorage. No hard-coded customers.
  // ==========================================================

  useEffect(() => {

    let cancelled = false;

    async function loadLoanCustomers(): Promise<void> {

      try {

        // ------------------------------------------------------
        // RESTORE THE SAME AUTHENTICATED STORAGE CONTEXT
        // USED BY CUSTOMER OFFICE.
        // ------------------------------------------------------

        const storageMode =
          getAuthenticatedStorageMode();

        const storageActivated =
          await storageManager.selectStorageMode(
            storageMode,
          );

        if (!storageActivated.success) {

          throw new Error(
            storageActivated.error ??
            `Unable to restore FINORA ${storageMode} storage.`,
          );
        }

        if (cancelled) {

          return;

        }

        // ------------------------------------------------------
        // CLEAR ONLY THE IN-MEMORY CUSTOMER CACHE.
        // PERSISTED CUSTOMER RECORDS ARE NOT DELETED.
        // ------------------------------------------------------

        clearCustomerCache();

        // ------------------------------------------------------
        // HYDRATE FROM THE ACTIVE FINORA STORAGE.
        // ------------------------------------------------------

        const hydratedCustomers =
          await hydrateCustomersFromStorage();

        if (cancelled) {

          return;

        }

        setCustomers(
          hydratedCustomers,
        );

        console.log(
          "FINORA LOAN CUSTOMER COUNT:",
          hydratedCustomers.length,
        );

      } catch (error) {

        console.error(
          "FINORA LOAN CUSTOMER HYDRATION ERROR:",
          error,
        );

        if (!cancelled) {

          setCustomers([]);

        }

      }

    }

    void loadLoanCustomers();

    return () => {

      cancelled = true;

    };

  }, []);


  // ==========================================================
  // SELECTED LOAN CUSTOMER
  // ==========================================================

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState<
    LoanCustomerOption | undefined
  >(
    customerId && customerName
      ? {
          customerId,
          customerName,
          phoneNumber,
        }
      : undefined,
  );


  // ==========================================================
  // SYNC EXTERNALLY PROVIDED CUSTOMER
  //
  // If Customer Office opens Loan Studio with a customer
  // already selected, keep that customer as the active
  // Loan Studio customer.
  // ==========================================================

  useEffect(() => {

    if (
      customerId &&
      customerName
    ) {

      setSelectedCustomer({
        customerId,
        customerName,
        phoneNumber,
      });

    }

  }, [
    customerId,
    customerName,
    phoneNumber,
  ]);


  // ==========================================================
  // LOAN CUSTOMER OPTIONS
  //
  // Only active / non-deleted customers can receive a new loan.
  // ==========================================================

  const loanCustomerOptions =
    useMemo<LoanCustomerOption[]>(
      () => {

        return customers
          .filter(
            (customer) =>
              customer.identity.isDeleted !== true &&
              customer.internal.isArchived !== true,
          )
          .map(
            (customer) => ({

              customerId:
                customer.identity.customerId,

              customerName:
                customer.basic.fullName,

              phoneNumber:
                customer.basic.mobileNumber,

            }),
          );

      },
      [
        customers,
      ],
    );


  // ==========================================================
  // ACTIVE CUSTOMER VALUES
  //
  // These values become the single customer source for all
  // Loan Studio steps and final Loan persistence.
  // ==========================================================

  const activeCustomerId =
    selectedCustomer?.customerId ??
    customerId ??
    "";

  const activeCustomerName =
    selectedCustomer?.customerName ??
    customerName ??
    "";

  const activeCustomerPhone =
    selectedCustomer?.phoneNumber ??
    phoneNumber ??
    "";


  // ==========================================================
  // WIZARD
  // ==========================================================

  const [
    step,
    setStep,
  ] = useState(1);


  // ==========================================================
  // LOAN
  // ==========================================================

  const [
    loanAmount,
    setLoanAmount,
  ] = useState("");

  // ==========================================================
  // FINANCE
  // ==========================================================

  const [
    interest,
    setInterest,
  ] = useState("");

  const [
    interestType,
    setInterestType,
  ] = useState("Flat Interest");

  const [
    processingFee,
    setProcessingFee,
  ] = useState("");

  const [
    advanceDeduction,
    setAdvanceDeduction,
  ] = useState("");


  // ==========================================================
  // PENALTY
  // ==========================================================

  const [
    penaltyType,
    setPenaltyType,
  ] = useState("Fixed Amount");

  const [
    penaltyValue,
    setPenaltyValue,
  ] = useState("");

  const [
    lateFee,
    setLateFee,
  ] = useState("");


  // ==========================================================
  // REPAYMENT
  // ==========================================================

  const [
    emiCalculation,
    setEMICalculation,
  ] = useState<"fixed" | "variable">(
    "fixed",
  );

  const [
    firstInstallmentDate,
    setFirstInstallmentDate,
  ] = useState("");

  const [
    repaymentType,
    setRepaymentType,
  ] = useState("");

  const [
    duration,
    setDuration,
  ] = useState("");

  const [
    durationType,
    setDurationType,
  ] = useState("");


  // ==========================================================
  // GUARANTOR
  // ==========================================================

  const [
    guarantorName,
    setGuarantorName,
  ] = useState("");

  const [
    guarantorPhone,
    setGuarantorPhone,
  ] = useState("");

  const [
    guarantorOccupation,
    setGuarantorOccupation,
  ] = useState("");

  const [
    guarantorAddress,
    setGuarantorAddress,
  ] = useState("");


  // ==========================================================
  // NOTES
  // ==========================================================

  const [
    purpose,
    setPurpose,
  ] = useState("");

  const [
    remarks,
    setRemarks,
  ] = useState("");


  // ==========================================================
  // APPROVAL
  // ==========================================================

  const [
    loanApproved,
    setLoanApproved,
  ] = useState(false);


  // ==========================================================
  // LOAN WORKFLOW STATUS
  //
  // Status is controlled by the workflow.
  // It is not selected manually in Step 1.
  // ==========================================================

  const loanStatus =
    loanApproved
      ? "Approved"
      : "Pending Approval";


  // ==========================================================
  // DISBURSEMENT
  // ==========================================================

  const [
    disbursementDate,
    setDisbursementDate,
  ] = useState("");

  const [
    disbursementAmount,
    setDisbursementAmount,
  ] = useState("0");

  const [
    paymentMode,
    setPaymentMode,
  ] = useState("cash");

  const [
    transactionStatus,
    setTransactionStatus,
  ] = useState("pending");

  const [
    disbursementSavedAt,
    setDisbursementSavedAt,
  ] = useState("Not Saved");

  const [
    disbursementDraftStatus,
    setDisbursementDraftStatus,
  ] = useState<"Draft" | "Completed">(
    "Draft",
  );

  const [
    disbursementReceiptNumber,
  ] = useState(
    () =>
      `DIS-${Date.now()}`,
  );


  // ==========================================================
  // FINANCE CALCULATIONS
  // ==========================================================

  const principal =
    parseNumericValue(loanAmount);

  const interestRate =
    parseNumericValue(interest);

  const durationValue =
    Math.max(
      0,
      parseNumericValue(duration),
    );


  // ==========================================================
  // INTEREST ENGINE
  //
  // FINORA RULE:
  //
  // Interest rate is monthly-basis flat interest.
  // Therefore the interest period is derived from the
  // configured loan duration unit, not repayment frequency.
  //
  // Examples:
  // - 12 months  -> 12 interest months
  // - 12 weeks   -> 12 / 4.33 interest months
  // - 12 days    -> 12 / 30 interest months
  //
  // Repayment frequency controls installment COUNT only.
  //
  // ==========================================================

  const monthlyInterestAmount =
    (
      principal *
      interestRate
    ) / 100;


  const interestMonths =
    durationType === "years"

      ? durationValue * 12

      : durationType === "months"

      ? durationValue

      : durationType === "weeks"

      ? durationValue / 4.33

      : durationValue / 30;


  const totalInterest =
    Math.round(
      monthlyInterestAmount *
      interestMonths,
    );


  const totalPayable =
    Math.round(
      principal +
      totalInterest,
    );


  // ==========================================================
  // INSTALLMENT COUNT
  //
  // Duration and repayment frequency are separate concepts.
  //
  // Example:
  // 12 Months + Daily   -> approximately 360 installments
  // 12 Months + Weekly  -> approximately 53 installments
  // 12 Months + Monthly -> 12 installments
  //
  // ==========================================================

  const durationDays =
    durationType === "years"

      ? durationValue * 365

      : durationType === "months"

      ? durationValue * 30

      : durationType === "weeks"

      ? durationValue * 7

      : durationValue;


  const totalInstallments =
    durationValue <= 0

      ? 0

      : repaymentType.toUpperCase() ===
        "MONTHLY"

      ? Math.max(
          1,
          Math.ceil(
            durationDays / 30,
          ),
        )

      : repaymentType.toUpperCase() ===
        "WEEKLY"

      ? Math.max(
          1,
          Math.ceil(
            durationDays / 7,
          ),
        )

      : Math.max(
          1,
          Math.ceil(
            durationDays,
          ),
        );


  // ==========================================================
  // STEP 1 INSTALLMENT PREVIEW
  //
  // Repayment frequency belongs to Step 4 — Repayment Studio.
  // Step 1 must therefore NOT assume Daily repayment merely
  // because a duration was entered.
  //
  // This prevents the old incorrect case:
  // ₹10,600 / 90 daily installments = ₹118
  //
  // Until Step 4 selects Daily / Weekly / Monthly, the
  // installment remains unavailable.
  // ==========================================================

  const installmentAmount =
    repaymentType &&
    totalInstallments > 0

      ? Math.round(
          totalPayable /
          totalInstallments,
        )

      : 0;


  // ==========================================================
  // DATES
  // ==========================================================

  const loanDate =
    new Date();


  const scheduleStartDate =
    firstInstallmentDate

      ? new Date(
          `${firstInstallmentDate}T00:00:00`,
        )

      : new Date(
          loanDate,
        );


  const maturityDate =
    durationValue > 0 &&
    durationType

      ? new Date(
          loanDate,
        )

      : null;


  // ==========================================================
  // REPAYMENT SCHEDULE
  //
  // Schedule remains part of the Loan domain calculation.
  // It is consumed by Review / persistence.
  //
  // IMPORTANT:
  // - Step 4 owns the visible schedule.
  // - Installment count is derived from duration + frequency.
  // - First installment date is respected when supplied.
  //
  // ==========================================================

  const schedule =
    totalInstallments > 0 &&
    repaymentType

      ? generateSchedule(

          totalInstallments,

          scheduleStartDate,

          repaymentType.toLowerCase() as
            | "daily"
            | "weekly"
            | "monthly",

          totalPayable,

          totalInterest,

        )

      : [];


  // ==========================================================
  // MATURITY DATE
  // ==========================================================

  if (
    maturityDate
  ) {

    switch (
      durationType
    ) {

      case "days":

        maturityDate.setDate(

          maturityDate.getDate() +
          durationValue,

        );

        break;


      case "weeks":

        maturityDate.setDate(

          maturityDate.getDate() +
          (
            durationValue *
            7
          ),

        );

        break;


      case "months":

        maturityDate.setMonth(

          maturityDate.getMonth() +
          durationValue,

        );

        break;


      case "years":

        maturityDate.setFullYear(

          maturityDate.getFullYear() +
          durationValue,

        );

        break;

    }

  }


  // ==========================================================
  // NET DISBURSEMENT
  // ==========================================================

  const netDisbursement =
    principal -
    parseNumericValue(processingFee) -
    parseNumericValue(advanceDeduction);


  // ==========================================================
  // REVIEW DATA
  // ==========================================================

  const normalizedLoanType =
    normalizeLoanType(
      repaymentType,
    );


  const loanTypeLabel =
    getLoanTypeLabel(
      repaymentType,
    );


  const reviewData:
    LoanReviewData = {

    customerId:
      activeCustomerId,

    customerName:
      activeCustomerName ||
      "--",

    phoneNumber:
      activeCustomerPhone,

    loanAmount:
      parseNumericValue(loanAmount),

    loanType:
      normalizedLoanType,

    interestType,

    interestRate:
      parseNumericValue(interest),

    repaymentType,

    duration:
      duration && durationType
        ? `${duration} ${durationType}`
        : "",

    processingFee:
      parseNumericValue(processingFee),

    advanceDeduction:
      parseNumericValue(advanceDeduction),

    netDisbursement,

    penaltyType,

    penaltyValue:
      parseNumericValue(penaltyValue),

    guarantorName,

    guarantorPhone,

    guarantorOccupation,

    totalInstallments:
      totalInstallments,

    paymentMode,

    loanStatus,

  };


  // ==========================================================
  // APPROVAL WORKFLOW
  // ==========================================================

  function handleSaveDraft(): void {

    console.log(
      "Save Draft",
    );

  }


  function handleRejectLoan(): void {

    console.log(
      "Reject Loan",
    );

  }


  // ==========================================================
  // APPROVE LOAN
  // ==========================================================

  async function handleApproveLoan(): Promise<void> {

    // --------------------------------------------------------
    // ALREADY APPROVED
    // --------------------------------------------------------

    if (
      loanApproved
    ) {

      alert(
        "Loan already created",
      );

      return;

    }


    // --------------------------------------------------------
    // NORMALIZE LOAN VALUES
    //
    // Loan Type is now derived from Repayment Studio.
    // Step 1 no longer asks for Daily / Weekly / Monthly.
    // --------------------------------------------------------

    const normalizedRepaymentType =
      repaymentType.trim().toUpperCase();


    const normalizedLoanType =
      normalizeLoanType(
        repaymentType,
      );


    if (
      !normalizedLoanType
    ) {

      alert(
        "Please select a valid Loan Type",
      );

      return;

    }


    if (
      !normalizedRepaymentType
    ) {

      alert(
        "Please configure Repayment Type in Step 4",
      );

      return;

    }


    // --------------------------------------------------------
    // BUILD PERSISTENT LOAN TITLE
    // --------------------------------------------------------

    const loanTitle =
      getLoanTypeLabel(
        normalizedLoanType,
      );


    // --------------------------------------------------------
    // DUPLICATE LOAN CHECK
    //
    // Persistence lookup is delegated to LoanService.
    // No direct localStorage access is allowed here.
    // --------------------------------------------------------

    const alreadyExists =
      await hasExistingLoan(
        activeCustomerId,
        loanTitle,
        principal,
      );


    if (
      alreadyExists
    ) {

      alert(
        "Loan already created",
      );

      setLoanApproved(
        true,
      );

      return;

    }


    // --------------------------------------------------------
    // DEBUG VALUES
    // --------------------------------------------------------

    console.log(
      "APPROVE LOAN VALUES",
      {
        principal,
        totalPayable,
        interestRate,
        durationValue,
        loanType: normalizedLoanType,
        schedule,
      },
    );


    // --------------------------------------------------------
    // BUILD LOAN
    // --------------------------------------------------------

    const loan =
      buildLoan({

        id:
          crypto.randomUUID(),

        title:
          loanTitle,

        amount:
          principal,

        outstanding:
          totalPayable,

        interest:
          interestRate,

        processingFee:
          parseNumericValue(processingFee),

        lateFee:
          parseNumericValue(lateFee),

        loanDate:
          loanDate.toISOString(),

        dueDate:
          maturityDate
            ? maturityDate.toISOString()
            : "",

        guarantor:
          guarantorName,

        customerId:
          activeCustomerId,

        customerName:
          activeCustomerName,

        phoneNumber:
          activeCustomerPhone,

        loanType:
          normalizedLoanType,

        repaymentType:
          normalizedRepaymentType,

        duration:
          durationValue,

        durationType,

        advanceDeduction:
          parseNumericValue(advanceDeduction),

        netDisbursement,

        purpose,

        remarks,

        schedule,

      });


    // --------------------------------------------------------
    // CREATE LOAN
    //
    // Loan persistence remains behind LoanService.
    // --------------------------------------------------------

    const createResult =
      await createLoan(
        loan,
      );


    // --------------------------------------------------------
    // PERSISTENCE RESULT
    // --------------------------------------------------------

    if (
      !createResult.success
    ) {

      console.error(
        "LOAN CREATE ERROR:",
        createResult.error,
      );

      alert(
        createResult.error ??
        "Unable to create loan.",
      );

      return;

    }


    // --------------------------------------------------------
    // APPROVAL STATE
    // --------------------------------------------------------

    setLoanApproved(
      true,
    );


    alert(
      "Loan Created Successfully",
    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <section style={studioShellStyle}>

      <div style={studioContentStyle}>


        {/* =====================================================
            STEP 1 — LOAN DETAILS
            =====================================================
            Loan Overview starts the workflow.
            Interest Type is configured in Step 1.
            Repayment frequency is configured in Step 4.
            ===================================================== */}

        {step === 1 && (

          <section
            style={studioStepStyle}
          >

            <LoanStatistics

              totalLoans={
                0
              }

              activeLoans={
                0
              }

              totalDisbursed={
                0
              }

            />


            <div
              style={studioGridStyle}
            >

              <LoanForm

                loanAmount={
                  loanAmount
                }

                interestType={
                  interestType
                }

                interest={
                  interest
                }

                processingFee={
                  processingFee
                }

                advanceDeduction={
                  advanceDeduction
                }

                lateFee={
                  lateFee
                }

                repaymentType={
                  repaymentType
                }

                duration={
                  duration
                }

                durationType={
                  durationType
                }

                purpose={
                  purpose
                }

                remarks={
                  remarks
                }

                onLoanAmountChange={
                  setLoanAmount
                }

                onInterestTypeChange={
                  setInterestType
                }

                onInterestChange={
                  setInterest
                }

                onProcessingFeeChange={
                  setProcessingFee
                }

                onAdvanceDeductionChange={
                  setAdvanceDeduction
                }

                onLateFeeChange={
                  setLateFee
                }

                onRepaymentTypeChange={
                  setRepaymentType
                }

                onDurationChange={
                  setDuration
                }

                onDurationTypeChange={
                  setDurationType
                }

                onPurposeChange={
                  setPurpose
                }

                onRemarksChange={
                  setRemarks
                }

              />


              <div
                style={studioColumnStyle}
              >

                <LoanCustomerCard

                  customerName={
                    activeCustomerName
                  }

                  customerId={
                    activeCustomerId
                  }

                  phoneNumber={
                    activeCustomerPhone
                  }

                  customers={
                    loanCustomerOptions
                  }

                  onCustomerSelect={
                    (customer) => {

                      setSelectedCustomer(
                        customer,
                      );

                    }
                  }

                />


                <LoanPreviewCard

                  customerName={
                    activeCustomerName
                  }

                  loanAmount={
                    Number(
                      loanAmount ||
                      0,
                    )
                  }

                  loanType={
                    loanTypeLabel
                  }

                  loanStatus={
                    "--"
                  }

                  interest={
                    Number(
                      interest ||
                      0,
                    )
                  }

                  totalInterest={
                    totalInterest
                  }

                  totalPayable={
                    totalPayable
                  }

                  installmentAmount={
                    installmentAmount
                  }

                  loanDate={
                    formatIndianDate(
                      loanDate,
                    )
                  }

                  maturityDate={
                    formatIndianDate(
                      maturityDate,
                    )
                  }

                  processingFee={
                    Number(
                      processingFee ||
                      0,
                    )
                  }

                  advanceDeduction={
                    Number(
                      advanceDeduction ||
                      0,
                    )
                  }

                  netDisbursement={

                    Number(
                      loanAmount ||
                      0,
                    ) -

                    Number(
                      processingFee ||
                      0,
                    ) -

                    Number(
                      advanceDeduction ||
                      0,
                    )

                  }

                  lateFee={
                    Number(
                      lateFee ||
                      0,
                    )
                  }

                  repaymentType={
                    repaymentType
                      ? repaymentType.toUpperCase()
                      : "--"
                  }

                />

              </div>

            </div>

          </section>

        )}


        {/* =====================================================
    STEP 2 — FINANCE STUDIO
    ===================================================== */}

{step === 2 && (

  <section
    style={studioStepStyle}
  >

    <FinanceHeader />


    <div
      style={studioGridStyle}
    >

      {/* ==================================================
          FINANCE CONFIGURATION
      ================================================== */}

      <div
        style={studioColumnStyle}
      >

        <InterestConfiguration

          interestType={
            interestType
          }

          interestRate={
            interest
          }

          interestCalculation={
            "monthly"
          }

          onInterestTypeChange={
            setInterestType
          }

          onInterestRateChange={
            setInterest
          }

        />


        <ProcessingFeeCard

          processingFee={
            processingFee
          }

          onProcessingFeeChange={
            setProcessingFee
          }

        />


        <PenaltyConfiguration

          penaltyType={
            penaltyType
          }

          penaltyValue={
            penaltyValue
          }

          onPenaltyTypeChange={
            setPenaltyType
          }

          onPenaltyValueChange={
            setPenaltyValue
          }

        />

      </div>


      {/* ==================================================
          FINANCE PREVIEW
      ================================================== */}

      <div
        style={studioColumnStyle}
      >

        <FinancePreviewCard

          interestType={
            interestType
          }

          interestRate={
            Number(
              interest ||
              0,
            )
          }

          interestCalculation={
            "Monthly"
          }

          totalInterest={
            totalInterest
          }

          totalPayable={
            totalPayable
          }

          processingFee={
            Number(
              processingFee ||
              0,
            )
          }

          penaltyValue={
            Number(
              penaltyValue ||
              0,
            )
          }

        />


        <FinanceDraftStatus />

      </div>

    </div>

  </section>

)}


        {/* =====================================================
            STEP 3 — GUARANTOR STUDIO
            ===================================================== */}

        {step === 3 && (

          <section
            style={studioStepStyle}
          >

            <GuarantorHeader />


            <div
              style={studioGridStyle}
            >

              <div
                style={studioColumnStyle}
              >

                <GuarantorForm

                  guarantorName={
                    guarantorName
                  }

                  guarantorPhone={
                    guarantorPhone
                  }

                  occupation={
                    guarantorOccupation
                  }

                  address={
                    guarantorAddress
                  }

                  onGuarantorNameChange={
                    setGuarantorName
                  }

                  onGuarantorPhoneChange={
                    setGuarantorPhone
                  }

                  onOccupationChange={
                    setGuarantorOccupation
                  }

                  onAddressChange={
                    setGuarantorAddress
                  }

                />


                <RelationshipCard />


                <GuarantorVerification />

              </div>


              <div
                style={studioColumnStyle}
              >

                <GuarantorPreviewCard

                  guarantorName={
                    guarantorName
                  }

                  relationship={
                    "--"
                  }

                  mobileNumber={
                    guarantorPhone
                  }

                  occupation={
                    guarantorOccupation
                  }

                  address={
                    guarantorAddress
                  }

                />


                <GuarantorDraftStatus />

              </div>

            </div>

          </section>

        )}


        {/* =====================================================
            STEP 4 — REPAYMENT STUDIO
            ===================================================== */}

        {step === 4 && (

          <section
            style={studioStepStyle}
          >

            <RepaymentHeader />


            <div
              style={studioGridStyle}
            >

              <div
                style={studioColumnStyle}
              >

                <EMIConfiguration

                  emiCalculation={
                    emiCalculation
                  }

                  installmentAmount={
                    String(
                      installmentAmount,
                    )
                  }

                  firstInstallmentDate={
                    firstInstallmentDate
                  }

                  onEMICalculationChange={
                    setEMICalculation
                  }

                  onFirstInstallmentDateChange={
                    setFirstInstallmentDate
                  }

                />

                <ScheduleConfiguration

                  repaymentType={
                    repaymentType.toLowerCase()
                  }

                  duration={
                    duration
                  }

                  durationType={
                    durationType
                  }

                  onRepaymentTypeChange={
                    (value) =>
                      setRepaymentType(
                        value.toUpperCase(),
                      )
                  }

                  onDurationChange={
                    setDuration
                  }

                  onDurationTypeChange={
                    setDurationType
                  }

                />

                {/* ==================================================
                    GENERATED EMI SCHEDULE
                    Existing schedule engine output is rendered here.
                    ================================================== */}

                <LoanScheduleTable
                  schedule={
                    schedule
                  }
                />

                <RepaymentSummary

                  installmentAmount={
                    installmentAmount
                  }

                  totalInstallments={
                    totalInstallments
                  }

                  totalRepayable={
                    totalPayable
                  }

                />

              </div>


              <div
                style={studioColumnStyle}
              >

                <RepaymentPreviewCard

                  frequency={
                    repaymentType
                  }

                  installmentAmount={
                    installmentAmount
                  }

                  totalInstallments={
                    totalInstallments
                  }

                  firstInstallmentDate={

                    firstInstallmentDate
                      ? formatIndianDate(
                          new Date(
                            `${firstInstallmentDate}T00:00:00`,
                          ),
                        )
                      : "--"

                  }

                />

                <RepaymentDraftStatus />

              </div>

            </div>

          </section>

        )}


        {/* =====================================================
            STEP 5 — DISBURSEMENT STUDIO
            ===================================================== */}

        {step === 5 && (

          <section
            style={studioStepStyle}
          >

            <DisbursementHeader />


            <div
              style={studioGridStyle}
            >

              <div
                style={studioColumnStyle}
              >

                <DisbursementForm

                  disbursementDate={
                    disbursementDate
                  }

                  disbursementAmount={
                    disbursementAmount
                  }

                  paymentMode={
                    paymentMode
                  }

                  onDisbursementDateChange={
                    setDisbursementDate
                  }

                  onDisbursementAmountChange={
                    setDisbursementAmount
                  }

                  onPaymentModeChange={
                    setPaymentMode
                  }

                />

                <PaymentModeCard

                  paymentMode={
                    paymentMode
                  }

                  transactionStatus={
                    transactionStatus
                  }

                  onPaymentModeChange={
                    setPaymentMode
                  }

                  onTransactionStatusChange={
                    (value) => {

                      setTransactionStatus(
                        value,
                      );

                      if (
                        value ===
                        "completed"
                      ) {

                        setDisbursementDraftStatus(
                          "Completed",
                        );

                      } else {

                        setDisbursementDraftStatus(
                          "Draft",
                        );

                      }

                    }
                  }

                />

                <DisbursementReceipt

                  receiptNumber={
                    disbursementReceiptNumber
                  }

                  customerName={
                    activeCustomerName ||
                    "--"
                  }

                  amount={
                    Number(
                      disbursementAmount ||
                      0,
                    )
                  }

                  paymentMode={
                    paymentMode
                  }

                />

              </div>


              <div
                style={studioColumnStyle}
              >

                <DisbursementPreviewCard

                  disbursementDate={

                    disbursementDate
                      ? formatIndianDate(
                          new Date(
                            `${disbursementDate}T00:00:00`,
                          ),
                        )
                      : "--"

                  }

                  amount={
                    Number(
                      disbursementAmount ||
                      0,
                    )
                  }

                  paymentMode={
                    paymentMode
                  }

                  transactionStatus={
                    transactionStatus
                  }

                />

                <DisbursementDraftStatus

                  savedAt={
                    disbursementSavedAt
                  }

                  status={
                    disbursementDraftStatus
                  }

                />

              </div>

            </div>

          </section>

        )}


        {/* =====================================================
            STEP 6 — REVIEW STUDIO
            ===================================================== */}

        {step === 6 && (

          <section
            style={studioStepStyle}
          >

            <ReviewHeader />


            <div
              style={studioGridStyle}
            >

              <div
                style={studioColumnStyle}
              >

                <LoanSummary

                  review={
                    reviewData
                  }

                />


                <ValidationChecklist

                  review={
                    reviewData
                  }

                />


                <ApprovalActions

                  onSaveDraft={
                    handleSaveDraft
                  }

                  onApproveLoan={
                    handleApproveLoan
                  }

                  onRejectLoan={
                    handleRejectLoan
                  }

                />

              </div>


              <div
                style={studioColumnStyle}
              >

                <ReviewPreviewCard

                  review={
                    reviewData
                  }

                />


                <ReviewDraftStatus />

              </div>

            </div>

          </section>

        )}

      </div>


      {/* =====================================================
          WIZARD NAVIGATION
          ===================================================== */}

      <footer
        style={studioFooterStyle}
      >

        {/* ===================================================
            SIX STEP LIST
            =================================================== */}

        <div
          style={stepListStyle}
        >

          {[
            {
              title: "Details",
              subtitle: "Basic Information",
            },
            {
              title: "Finance",
              subtitle: "Fees & Charges",
            },
            {
              title: "Guarantor",
              subtitle: "Guarantor Details",
            },
            {
              title: "Repayment",
              subtitle: "Repayment Setup",
            },
            {
              title: "Disbursement",
              subtitle: "Disburse Loan",
            },
            {
              title: "Review",
              subtitle: "Review & Approve",
            },
          ].map(
            (
              item,
              index,
            ) => {

              const current =
                index + 1;

              const active =
                current === step;

              const completed =
                current < step;

              return (

                <div
                  key={item.title}
                  style={stepItemStyle}
                  onClick={() =>
                    setStep(current)
                  }
                >

                  <div
                    style={
                      active
                        ? activeStepNumberStyle
                        : completed
                          ? completedStepNumberStyle
                          : pendingStepNumberStyle
                    }
                  >
                    {current}
                  </div>


                  <div
                    style={stepTextStyle}
                  >

                    <span
                      style={
                        active
                          ? activeStepTitleStyle
                          : completed
                            ? completedStepTitleStyle
                            : pendingStepTitleStyle
                      }
                    >
                      {item.title}
                    </span>


                    <span
                      style={stepSubtitleStyle}
                    >
                      {item.subtitle}
                    </span>

                  </div>

                </div>

              );

            },
          )}

        </div>


        {/* ===================================================
            NAVIGATION
            =================================================== */}

        <div
          style={navigationStyle}
        >

          <button
            type="button"
            disabled={
              step === 1
            }
            onClick={() => {

              if (
                step > 1
              ) {

                setStep(
                  step - 1,
                );

              }

            }}
            style={
              step === 1
                ? disabledNavigationButtonStyle
                : navigationButtonStyle
            }
          >
            ← Previous
          </button>


          <button
            type="button"
            onClick={() => {

              if (
                step < 6
              ) {

                setStep(
                  step + 1,
                );

                return;

              }


              if (
                !loanApproved
              ) {

                alert(
                  "Please Approve Loan before finishing review",
                );

                return;

              }


              alert(
                "Loan Review Completed Successfully",
              );


              setStep(
                1,
              );

            }}
            style={
              primaryNavigationButtonStyle
            }
          >
            {
              step === 6
                ? "Finish Review"
                : "Next →"
            }
          </button>

        </div>

      </footer>

    </section>

  );

}


// ============================================================
// END
// ============================================================
