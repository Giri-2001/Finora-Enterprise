// FINORA ENTERPRISE OS
// Loan Studio customer workspace.

import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

import DocumentsStudio
  from "../../../../loans/documents/DocumentsStudio";

import type {
  DocumentsStudioItem,
} from "../../../../loans/documents/DocumentsStudio";

import {
  shellStyle,
  contentStyle,
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
  step1WorkspaceStyle,
  step1TopStyle,
  step1BottomStyle,
  step1CustomerStyle,
  step1OverviewStyle,
  step1FormStyle,
  step1PreviewStyle,
  step6FormStyle,
} from "./LoanStudio.styles";

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

import type {
  EMICalculationMode,
} from "../../../../loans/repayment/EMIConfiguration";


import RepaymentSummary
  from "../../../../loans/repayment/RepaymentSummary";

import RepaymentPreviewCard
  from "../../../../loans/repayment/RepaymentPreviewCard";

import LoanScheduleTable
  from "../../../../loans/schedule/LoanScheduleTable";

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

import ReviewHeader
  from "../../../../loans/review/ReviewHeader";

import ValidationChecklist
  from "../../../../loans/review/ValidationChecklist";

import ApprovalActions
  from "../../../../loans/review/ApprovalActions";

import ReviewPreviewCard
  from "../../../../loans/review/ReviewPreviewCard";

import ReviewDraftStatus
  from "../../../../loans/review/ReviewDraftStatus";

import {
  generateSchedule,
} from "../../../../loans/schedule/schedule.helpers";

import {
  buildLoan,
} from "../../../../../services/loan/loanBuilder";

import {
  createLoan,
  fetchLoans,
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

import type {
  LoanReviewData,
} from "../../../../loans/review/types";

const STORAGE_MODE_SESSION_KEY =
  "FINORA_STORAGE_MODE";

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

const normalizeLoanType = (
  value: string,
): "DAILY" | "WEEKLY" | "MONTHLY" | "" => {
  const normalized =
    value
      .trim()
      .toUpperCase()
      .replace(/\s+LOAN$/, "");

  if (
    normalized ===
    "DAILY"
  ) {
    return "DAILY";
  }

  if (
    normalized ===
    "WEEKLY"
  ) {
    return "WEEKLY";
  }

  if (
    normalized ===
    "MONTHLY"
  ) {
    return "MONTHLY";
  }

  return "";
};

const getLoanTypeLabel = (
  value: string,
): string => {
  const normalized =
    normalizeLoanType(
      value,
    );

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

  return `${day}/${month}/${value.getFullYear()}`;
};

interface LoanStudioProps {
  customerName?: string;
  customerId?: string;
  phoneNumber?: string;
}

export default function LoanStudio({
  customerName,
  customerId,
  phoneNumber,
}: LoanStudioProps) {
  const [
    customers,
    setCustomers,
  ] = useState<
    ReturnType<typeof getCustomers>
  >([]);

  useEffect(() => {
    let cancelled = false;

    async function loadLoanCustomers(): Promise<void> {
      try {
        const storageMode =
          getAuthenticatedStorageMode();

        const storageActivated =
          await storageManager.selectStorageMode(
            storageMode,
          );

        if (
          !storageActivated.success
        ) {
          throw new Error(
            storageActivated.error ??
            `Unable to restore FINORA ${storageMode} storage.`,
          );
        }

        if (cancelled) {
          return;
        }

        clearCustomerCache();

        const hydratedCustomers =
          await hydrateCustomersFromStorage();

        if (cancelled) {
          return;
        }

        setCustomers(
          hydratedCustomers,
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

  useEffect(() => {
    if (
      customerId &&
      customerName
    ) {
      const matchingCustomer =
        customers.find(
          (customer) =>
            customer.identity.customerId ===
            customerId,
        );

      setSelectedCustomer({
        customerId,
        customerName,
        phoneNumber,
        photo:
          matchingCustomer?.photo,
      });
    }
  }, [
    customerId,
    customerName,
    phoneNumber,
    customers,
  ]);

  // Step 3 document evidence belongs to the active customer / loan workspace.
  // Changing the customer must never carry another customer's evidence forward.
  const [documents, setDocuments] = useState<DocumentsStudioItem[]>([]);

  useEffect(() => {
    setDocuments([]);
  }, [selectedCustomer?.customerId]);

  const loanCustomerOptions =
    useMemo<LoanCustomerOption[]>(
      () =>
        customers
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
              photo:
                customer.photo,
            }),
          ),
      [customers],
    );

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

  const [
    step,
    setStep,
  ] = useState(1);

  const [
    loanAmount,
    setLoanAmount,
  ] = useState("");

  const [
    interest,
    setInterest,
  ] = useState("");

  const [
    processingFee,
    setProcessingFee,
  ] = useState("");

  const [
    advanceDeduction,
    setAdvanceDeduction,
  ] = useState("");

  const [
    penaltyType,
    setPenaltyType,
  ] = useState(
    "Fixed Amount",
  );

  const [
    penaltyValue,
    setPenaltyValue,
  ] = useState("");

  const [
    lateFee,
    setLateFee,
  ] = useState("");

  const [
    emiCalculation,
    setEMICalculation,
  ] = useState<
    EMICalculationMode
  >("fixed");

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
  // STEP 1 → STEP 2 REPAYMENT SYNC
  //
  // Step 1 is the source of truth for repayment frequency.
  // Duration Unit drives the EMI schedule automatically:
  //
  // days   → DAILY
  // weeks  → WEEKLY
  // months → MONTHLY
  // years  → MONTHLY
  //
  // Years use MONTHLY repayment because the existing schedule
  // engine supports daily, weekly and monthly frequencies.
  // A year duration is converted to 12 monthly installments per year.
  // ==========================================================

  const syncedRepaymentType =
    durationType === "days"
      ? "DAILY"
      : durationType === "weeks"
      ? "WEEKLY"
      : durationType === "months"
      ? "MONTHLY"
      : durationType === "years"
      ? "MONTHLY"
      : "";

  useEffect(() => {
    setRepaymentType(
      syncedRepaymentType,
    );
  }, [
    syncedRepaymentType,
  ]);

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

  const [
  guarantorRelationship,
  setGuarantorRelationship,
] = useState("");

  const [
    purpose,
    setPurpose,
  ] = useState("");

  const [
    remarks,
    setRemarks,
  ] = useState("");

  const [
    loanApproved,
    setLoanApproved,
  ] = useState(false);

  const loanStatus =
    loanApproved
      ? "Approved"
      : "Pending Approval";

  const [
    disbursementDate,
    setDisbursementDate,
  ] = useState("");


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
  ] = useState<
    "Draft" | "Completed"
  >("Draft");

  const [
    disbursementReceiptNumber,
    setDisbursementReceiptNumber,
  ] = useState(
    () =>
      `DIS-${Date.now()}`,
  );

  // ==========================================================
  // LIVE LOAN STATISTICS
  //
  // The previous Loan Studio rendered these values as hard-coded
  // zeroes. The statistics must come from persisted Loan records.
  //
  // Total Disbursed intentionally uses netDisbursement when it is
  // available because FINORA disburses the amount after processing
  // fee and advance deduction.
  // ==========================================================

  const [
    loanStatistics,
    setLoanStatistics,
  ] = useState({
    totalLoans: 0,
    activeLoans: 0,
    totalDisbursed: 0,
  });

  async function refreshLoanStatistics(): Promise<void> {

    try {

      const loans =
        await fetchLoans();

      const totalLoans =
        loans.length;

      const activeLoans =
        loans.filter(
          (loan) => {

            const record =
              loan as unknown as Record<
                string,
                unknown
              >;

            const status =
              String(
                record.status ??
                "",
              )
                .trim()
                .toUpperCase();

            const outstanding =
              Number(
                record.outstanding ??
                0,
              );

            return (
              (
                status === "ACTIVE" ||
                status === "RUNNING"
              ) &&
              outstanding > 0
            );

          },
        ).length;

      const totalDisbursed =
        loans.reduce(
          (
            total,
            loan,
          ) => {

            const record =
              loan as unknown as Record<
                string,
                unknown
              >;

            const netValue =
              Number(
                record.netDisbursement ??
                NaN,
              );

            const amountValue =
              Number(
                record.amount ??
                0,
              );

            const disbursedValue =
              Number.isFinite(
                netValue,
              )
                ? netValue
                : amountValue;

            return (
              total +
              (
                Number.isFinite(
                  disbursedValue,
                )
                  ? disbursedValue
                  : 0
              )
            );

          },
          0,
        );

      setLoanStatistics({
        totalLoans,
        activeLoans,
        totalDisbursed,
      });

    } catch (error) {

      console.error(
        "FINORA LOAN STATISTICS REFRESH ERROR:",
        error,
      );

    }

  }

  // ==========================================================
  // INITIAL / STORAGE-READY STATISTICS LOAD
  // ==========================================================

  useEffect(() => {

    let cancelled = false;

    async function loadInitialLoanStatistics(): Promise<void> {

      try {

        const storageMode =
          getAuthenticatedStorageMode();

        const storageActivated =
          await storageManager.selectStorageMode(
            storageMode,
          );

        if (
          !storageActivated.success
        ) {
          return;
        }

        if (cancelled) {
          return;
        }

        await refreshLoanStatistics();

      } catch (error) {

        console.error(
          "FINORA INITIAL LOAN STATISTICS ERROR:",
          error,
        );

      }

    }

    void loadInitialLoanStatistics();

    return () => {
      cancelled = true;
    };

  }, []);

  const principal =
    parseNumericValue(
      loanAmount,
    );

  const interestRate =
    parseNumericValue(
      interest,
    );

  const durationValue =
    Math.max(
      0,
      parseNumericValue(
        duration,
      ),
    );

  const monthlyInterestAmount =
    (
      principal *
      interestRate
    ) / 100;

  const interestMonths =
    durationType ===
    "years"
      ? durationValue * 12
      : durationType ===
        "months"
      ? durationValue
      : durationType ===
        "weeks"
      ? durationValue / 4.33
      : durationValue / 30;

  /* ==========================================================
     FLAT INTEREST BASELINE

     Fixed EMI and Interest Only continue to use the existing
     FINORA flat-interest calculation. Reducing EMI is calculated
     separately from the generated reducing-balance schedule.
  ========================================================== */

  const flatTotalInterest =
    Math.round(
      monthlyInterestAmount *
      interestMonths,
    );

  const flatTotalPayable =
    Math.round(
      principal +
      flatTotalInterest,
    );

  const durationDays =
    durationType ===
    "years"
      ? durationValue * 365
      : durationType ===
        "months"
      ? durationValue * 30
      : durationType ===
        "weeks"
      ? durationValue * 7
      : durationValue;

  // ==========================================================
  // REPAYMENT FREQUENCY
  //
  // Step 1 owns repayment frequency through Duration Unit.
  // Until a valid Duration Unit exists, there is NO repayment
  // schedule and NO installment count.
  // This prevents an empty frequency from silently becoming
  // Daily and producing an incorrect schedule.
  // ==========================================================

  const normalizedRepaymentType =
    syncedRepaymentType;

  // ==========================================================
  // INSTALLMENT COUNT — DURATION UNIT SOURCE OF TRUTH
  //
  // Years + Monthly must be exact: 1 year = 12 installments.
  // Do not convert years through 365 / 30 because that produces
  // 24.33 for 2 years and incorrectly rounds it up to 25.
  // ==========================================================

  const totalInstallments =
    durationValue <= 0 ||
    !normalizedRepaymentType
      ? 0
      : normalizedRepaymentType ===
        "MONTHLY"
      ? durationType ===
        "years"
        ? durationValue * 12
        : Math.max(
            1,
            Math.ceil(
              durationDays / 30,
            ),
          )
      : normalizedRepaymentType ===
        "WEEKLY"
      ? Math.max(
          1,
          Math.ceil(
            durationDays / 7,
          ),
        )
      : normalizedRepaymentType ===
        "DAILY"
      ? Math.max(
          1,
          Math.ceil(
            durationDays,
          ),
        )
      : 0;

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

  if (maturityDate) {
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
          durationValue * 7,
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


  const schedule =
    totalInstallments > 0 &&
    (normalizedRepaymentType === "DAILY" ||
      normalizedRepaymentType === "WEEKLY" ||
      normalizedRepaymentType === "MONTHLY")
      ? generateSchedule(
          totalInstallments,
          scheduleStartDate,
          normalizedRepaymentType.toLowerCase() as
            | "daily"
            | "weekly"
            | "monthly",
          flatTotalPayable,
          flatTotalInterest,
          emiCalculation,
          parseNumericValue(
            advanceDeduction,
          ),

        )
      : [];

  /* ==========================================================
     FINAL INTEREST / PAYABLE VALUES

     Reducing EMI derives total interest from the generated
     declining-balance schedule itself. This keeps the summary,
     preview, schedule and review data on the same source of truth.
  ========================================================== */

  const totalInterest =
    emiCalculation ===
    "reducing"
      ? schedule.reduce(
          (sum, installment) =>
            sum +
            installment.interestAmount,
          0,
        )
      : flatTotalInterest;

  const totalPayable =
    Math.round(
      principal +
      totalInterest,
    );

  // ==========================================================
  // INSTALLMENT AMOUNT
  //
  // The schedule engine remains the single source of truth.
  // This keeps rounding and the final adjusted installment
  // consistent with the generated schedule.
  // ==========================================================

  const installmentAmount =
    schedule.length > 0
      ? schedule[0].installmentAmount
      : 0;

  const netDisbursement =
    principal -
    parseNumericValue(
      processingFee,
    ) -
    parseNumericValue(
      advanceDeduction,
    );

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
      parseNumericValue(
        loanAmount,
      ),

    loanType:
      normalizedLoanType,

    interestType:
      emiCalculation,

    interestRate:
      parseNumericValue(
        interest,
      ),

    repaymentType,

    duration:
      duration &&
      durationType
        ? `${duration} ${durationType}`
        : "",

    processingFee:
      parseNumericValue(
        processingFee,
      ),

    advanceDeduction:
      parseNumericValue(
        advanceDeduction,
      ),

    netDisbursement,

    penaltyType,

    penaltyValue:
      parseNumericValue(
        penaltyValue,
      ),

    guarantorName,

    guarantorPhone,

    guarantorOccupation,

    totalInstallments,

    installmentAmount,

    paymentMode,

    loanStatus,
  };

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

  async function handleApproveLoan(): Promise<void> {
    if (loanApproved) {
      alert(
        "Loan already created",
      );
      return;
    }

    const normalizedRepaymentType =
      syncedRepaymentType;

    const normalizedLoanTypeValue =
      normalizeLoanType(
        repaymentType,
      );

    if (
      !normalizedLoanTypeValue
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
        "Please select Duration Unit in Step 1",
      );
      return;
    }

    const loanTitle =
      getLoanTypeLabel(
        normalizedLoanTypeValue,
      );

    const alreadyExists =
      await hasExistingLoan(
        activeCustomerId,
        loanTitle,
        principal,
      );

    if (alreadyExists) {

      setLoanApproved(
        true,
      );

      await refreshLoanStatistics();

      alert(
        "Loan already created",
      );

      return;
    }

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
          parseNumericValue(
            processingFee,
          ),

        lateFee:
          parseNumericValue(
            lateFee,
          ),

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
          normalizedLoanTypeValue,

        repaymentType:
          normalizedRepaymentType,

        duration:
          durationValue,

        durationType,

        advanceDeduction:
          parseNumericValue(
            advanceDeduction,
          ),

        netDisbursement,

        purpose,

        remarks,

        schedule,
      });

    const createResult =
      await createLoan(
        loan,
      );

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

    setLoanApproved(
      true,
    );

    await refreshLoanStatistics();

    alert(
      "Loan Created Successfully",
    );
  }

  // ==========================================================
  // RESET COMPLETED LOAN WORKSPACE
  //
  // Finish Review is the boundary between one completed loan
  // workflow and the next new-loan workflow.
  //
  // The persisted Loan is NOT deleted here.
  // Only transient wizard/UI state is cleared.
  // ==========================================================

  function resetLoanWorkspace(): void {

    setStep(1);

    setSelectedCustomer(
      undefined,
    );

    setDocuments([]);

    setLoanAmount("");

    setInterest("");

    setProcessingFee("");

    setAdvanceDeduction("");

    setPenaltyType(
      "Fixed Amount",
    );

    setPenaltyValue("");

    setLateFee("");

    setEMICalculation(
      "fixed",
    );

    setFirstInstallmentDate("");

    setRepaymentType("");

    setDuration("");

    setDurationType("");

    setGuarantorName("");

    setGuarantorPhone("");

    setGuarantorOccupation("");

    setGuarantorAddress("");

    setGuarantorRelationship("");

    setPurpose("");

    setRemarks("");

    setLoanApproved(false);

    setDisbursementDate("");

    setPaymentMode("cash");

    setTransactionStatus("pending");

    setDisbursementSavedAt(
      "Not Saved",
    );

    setDisbursementDraftStatus(
      "Draft",
    );

    setDisbursementReceiptNumber(
      `DIS-${Date.now()}`,
    );

  }

  return (
    <section style={shellStyle}>

      <div style={contentStyle}>

        {step === 1 && (
          <section
            style={step1WorkspaceStyle}
          >

            <div
              style={step1TopStyle}
            >

              <div
                style={step1CustomerStyle}
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
                  photo={
                    selectedCustomer?.photo
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

              </div>

              <div
                style={step1OverviewStyle}
              >

                <LoanStatistics
                  totalLoans={
                    loanStatistics.totalLoans
                  }
                  activeLoans={
                    loanStatistics.activeLoans
                  }
                  totalDisbursed={
                    loanStatistics.totalDisbursed
                  }
                />

              </div>

            </div>

            <div
              style={step1BottomStyle}
            >

              <div
                style={step1FormStyle}
              >

                <LoanForm
                  loanAmount={
                    loanAmount
                  }
                  emiCalculation={
                    emiCalculation
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
                  onEMICalculationChange={
                    setEMICalculation
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

              </div>

              <div
                style={step1PreviewStyle}
              >

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
                  loanStatus="--"
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

        {step === 2 && (
          <section
            style={{
              width: "100%",
              minWidth: 0,
              minHeight: 0,
              boxSizing: "border-box",
              overflow: "auto",
              paddingRight: "2px",
              paddingBottom: "4px",
            }}
          >

            {/* =================================================
                STEP 2 — REPAYMENT STUDIO WORKSPACE

                FINAL LAYOUT:
                - LEFT 55%:
                  - Repayment Summary on top
                  - Repayment Preview + Draft side-by-side below
                - RIGHT 45%:
                  - EMI Schedule from top to bottom

                IMPORTANT:
                - Step 1 already owns EMI Calculation input.
                - Step 2 uses the generated schedule as the
                  single source of truth for preview values.
                - No artificial EMI row limit.
                - Schedule grows naturally.
            ================================================= */}

            <div
              style={{
                width: "100%",
                minWidth: 0,
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 55%) minmax(0, 45%)",
                gap: "8px",
                alignItems: "start",
                boxSizing: "border-box",
              }}
            >

              {/* =================================================
                  LEFT WORKSPACE — 55%
              ================================================= */}

              <div
                style={{
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >

                {/* =================================================
                    REPAYMENT SUMMARY — TOP
                ================================================= */}

                <div
                  style={{
                    width: "100%",
                    minWidth: 0,
                  }}
                >

                  <RepaymentSummary
                    loanAmount={
                      principal
                    }
                    totalInterest={
                      totalInterest
                    }
                    installmentAmount={
                      installmentAmount
                    }
                    totalInstallments={
                      totalInstallments
                    }
                    totalRepayable={
                      totalPayable
                    }
                    repaymentMethod={
                      emiCalculation
                    }
                    repaymentFrequency={
                      repaymentType.toLowerCase()
                    }
                  />

                </div>

                {/* =================================================
                    REPAYMENT PREVIEW + DRAFT

                    FINAL LEFT-WORKSPACE ARRANGEMENT:
                    - Repayment Preview uses the complete 55% width.
                    - Repayment Draft moves underneath the Preview.
                    - The available lower-left whitespace is used naturally.
                    - Draft is intentionally compact so it does not
                      dominate the workspace.
                ================================================= */}

                <div
                  style={{
                    width: "100%",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    alignItems: "stretch",
                    boxSizing: "border-box",
                  }}
                >

                  {/* =============================================
                      REPAYMENT PREVIEW — FULL WIDTH
                  ============================================= */}

                  <div
                    style={{
                      minWidth: 0,
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >

                    <RepaymentPreviewCard
                      frequency={
                        repaymentType
                          ? repaymentType.toUpperCase()
                          : "--"
                      }
                      repaymentMethod={
                        emiCalculation
                      }
                      installmentAmount={
                        installmentAmount
                      }
                      totalInstallments={
                        totalInstallments
                      }
                      totalRepayable={
                        totalPayable
                      }
                      // First installment is derived from the generated
                      // schedule. Step 2 is display-only.
                      firstInstallmentDate={
                        schedule.length > 0
                          ? formatIndianDate(
                              new Date(
                                schedule[0].dueDate,
                              ),
                            )
                          : "--"
                      }
                      lastInstallmentDate={
                        schedule.length > 0
                          ? formatIndianDate(
                              new Date(
                                schedule[
                                  schedule.length - 1
                                ].dueDate,
                              ),
                            )
                          : "--"
                      }
                    />

                  </div>

                  {/* =============================================
                      REPAYMENT DRAFT — FINAL COMPACT CONTAINER

                      FINAL UI RULES:
                      - Single border only.
                      - Compact height to use the empty lower-left space.
                      - "Repayment Draft" remains on the left.
                      - "Draft" badge moves to the top-right.
                      - Last Updated stays below the header.
                      - No other Step 2 UI is changed.
                  ============================================= */}

                  <section
                    aria-label="Repayment Draft"
                    style={{
                      width: "100%",
                      minWidth: 0,
                      height: "92px",
                      minHeight: "92px",
                      boxSizing: "border-box",
                      padding: "12px 14px",
                      border:
                        "1px solid rgba(148, 163, 184, 0.20)",
                      borderRadius: "16px",
                      background:
                        "linear-gradient(180deg, #111C2E, #142238)",
                      color: "#FFFFFF",
                      boxShadow:
                        "0 8px 24px rgba(0, 0, 0, 0.14)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      overflow: "hidden",
                    }}
                  >

                    <div
                      style={{
                        width: "100%",
                        minWidth: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >

                      <div
                        style={{
                          minWidth: 0,
                          paddingLeft: "10px",
                          borderLeft:
                            "3px solid #2563EB",
                          fontSize: "16px",
                          fontWeight: 700,
                          lineHeight: 1.25,
                          color: "#FFFFFF",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        Repayment Draft
                      </div>

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          padding: "5px 11px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 700,
                          lineHeight: 1,
                          background:
                            "rgba(245, 158, 11, 0.14)",
                          color: "#FCD34D",
                          border:
                            "1px solid rgba(245, 158, 11, 0.30)",
                        }}
                      >
                        Draft
                      </span>

                    </div>

                    <div
                      style={{
                        paddingLeft: "13px",
                        color: "#CBD5E1",
                        fontSize: "12px",
                        fontWeight: 500,
                        lineHeight: 1.3,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      Last Updated: Not Saved
                    </div>

                  </section>

                </div>

              </div>

              {/* =================================================
                  RIGHT WORKSPACE — 45%

                  EMI Schedule starts from the top and grows
                  naturally. No fixed 15-row limit.
              ================================================= */}

              <div
                style={{
                  minWidth: 0,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >

                <LoanScheduleTable
                  schedule={
                    schedule
                  }
                />

              </div>

            </div>

          </section>
        )}

        {step === 3 && (
          <section
            style={step1WorkspaceStyle}
          >
            <DocumentsStudio
              customerName={
                activeCustomerName ||
                selectedCustomer?.customerName ||
                customerName ||
                "Customer"
              }
              customerPhoto={
                selectedCustomer?.photo
              }
              items={documents}
              onDocumentsChange={
                setDocuments
              }
            />
          </section>
        )}

        {step === 4 && (
          <section
            style={step1WorkspaceStyle}
          >

            <GuarantorHeader />

            <div
              style={step1BottomStyle}
            >

              <div
                style={step1FormStyle}
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

                <RelationshipCard
                  relationship={
                    guarantorRelationship
                  }
                  onRelationshipChange={
                    setGuarantorRelationship
                }
                />

                <GuarantorVerification />

              </div>

              <div
                style={step1PreviewStyle}
              >

                <GuarantorPreviewCard
                  guarantorName={
                    guarantorName
                  }
                  relationship={
                    guarantorRelationship
                      ? guarantorRelationship
                          .charAt(0)
                          .toUpperCase() +
                        guarantorRelationship.slice(1)
                      : "--"
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
            STEP 5 — REVIEW STUDIO

            RESPONSIBILITY:
            - Review loan information only
            - No Loan Summary card
            - No Approval Actions
            - Approval happens only in Step 6
        ===================================================== */}

        {step === 5 && (
          <section
            style={{
              ...step1WorkspaceStyle,
              overflow: "visible",
            }}
          >

            <ReviewHeader />

            <div
              style={{
                ...step1BottomStyle,
                height: "auto",
                overflow: "visible",
                alignItems: "start",
              }}
            >

              {/* =================================================
                  STEP 5 — VALIDATION CHECKLIST
              ================================================= */}

              <div
                style={{
                  ...step1FormStyle,
                  height: "auto",
                  minHeight: 0,
                  overflow: "visible",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >

                <ValidationChecklist
                  review={
                    reviewData
                  }
                />

              </div>


              {/* =================================================
                  STEP 5 — REVIEW PREVIEW
              ================================================= */}

              <div
                style={{
                  ...step1PreviewStyle,
                  height: "auto",
                  minHeight: 0,
                  overflow: "visible",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
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


        {/* =====================================================
            STEP 6 — DISBURSEMENT STUDIO

            FINAL ORDER:

            LEFT:
            1. Disbursement Mode
            2. Payment Mode
            3. Approval Actions

            RIGHT:
            1. Disbursement Receipt
            2. Disbursement Preview
            3. Draft Status
        ===================================================== */}

        {step === 6 && (
          <section
            style={{
              ...step1WorkspaceStyle,
              overflow: "visible",
            }}
          >

            <DisbursementHeader />

            {/* =================================================
                STEP 6 FINANCIAL SOURCE OF TRUTH

                Net Disbursement is calculated by LoanStudio:
                Principal - Processing Fee - Advance Deduction.

                Step 6 must never create or edit a second
                disbursement amount. DisbursementForm,
                Receipt and Preview all consume this value.
            ================================================= */}

            <div
              style={{
                ...step1BottomStyle,
                height: "auto",
                minHeight: 0,
                overflow: "visible",
                alignItems: "start",
                alignContent: "start",
              }}
            >

              {/* =================================================
                  STEP 6 — LEFT WORKSPACE
              ================================================= */}

              <div
                style={step6FormStyle}
              >

                {/* =================================================
                    1. DISBURSEMENT MODE
                ================================================= */}

                <DisbursementForm
                  disbursementDate={
                    disbursementDate
                  }

                  netDisbursement={
                    netDisbursement
                  }

                  onDisbursementDateChange={
                    setDisbursementDate
                  }
                />

                {/* =================================================
    2. PAYMENT MODE

    RESPONSIBILITY:
    - PaymentModeCard owns payment fields
    - LoanStudio owns only placement/layout
    - Do NOT modify PaymentModeCard.tsx
================================================= */}

<div
  style={{
    width: "100%",
    minWidth: 0,
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
  }}
>
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

        setDisbursementDraftStatus(
          value ===
            "completed"
            ? "Completed"
            : "Draft",
        );

      }
    }
  />
</div>

                {/* =================================================
                    3. APPROVAL ACTIONS

                    IMPORTANT:
                    These buttons belong ONLY to Step 6.
                    They are BELOW Disbursement + Payment Mode.
                ================================================= */}

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


              {/* =================================================
                  STEP 6 — RIGHT PREVIEW
              ================================================= */}

              <div
                style={{
                  ...step1PreviewStyle,
                  height: "auto",
                  minHeight: 0,
                  overflow: "visible",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >

                {/* =================================================
                    DISBURSEMENT RECEIPT
                ================================================= */}

                <DisbursementReceipt
                  receiptNumber={
                    disbursementReceiptNumber
                  }

                  customerName={
                    activeCustomerName ||
                    "--"
                  }

                  amount={
                    Math.max(
                      0,
                      Number.isFinite(
                        netDisbursement,
                      )
                        ? netDisbursement
                        : 0,
                    )
                  }

                  paymentMode={
                    paymentMode
                  }
                />


                {/* =================================================
                    DISBURSEMENT PREVIEW
                ================================================= */}

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
                    Math.max(
                      0,
                      Number.isFinite(
                        netDisbursement,
                      )
                        ? netDisbursement
                        : 0,
                    )
                  }

                  paymentMode={
                    paymentMode
                  }

                  transactionStatus={
                    transactionStatus
                  }
                />


                {/* =================================================
                    DISBURSEMENT DRAFT STATUS
                ================================================= */}

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
      </div>

      <footer
        style={footerStyle}
      >

        <div
          style={stepListStyle}
        >

          {[
            {
              title: "Details",
              subtitle: "Basic Information",
            },
            {
              title: "Repayment",
              subtitle: "Repayment Setup",
            },
            {
              title: "Documents",
              subtitle: "Upload & Verify",
            },
            {
              title: "Guarantor",
              subtitle: "Guarantor Details",
            },
            {
              title: "Review",
              subtitle: "Review & Approve",
            },
            {
              title: "Disbursement",
              subtitle: "Disburse Loan",
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
                  key={
                    item.title
                  }
                  style={
                    stepItemStyle
                  }
                  onClick={() =>
                    setStep(
                      current,
                    )
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
                    style={
                      stepTextStyle
                    }
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
                      {
                        item.title
                      }
                    </span>

                    <span
                      style={
                        stepSubtitleStyle
                      }
                    >
                      {
                        item.subtitle
                      }
                    </span>

                  </div>

                </div>
              );
            },
          )}

        </div>

        <div
          style={
            navigationStyle
          }
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
            onClick={async () => {

              if (
                step < 6
              ) {
                if (
                  step === 5 &&
                  !loanApproved
                ) {
                  alert(
                    "Please Approve Loan before continuing to Disbursement",
                  );

                  return;
                }

                setStep(
                  step + 1,
                );

                return;
              }

              if (
                !loanApproved
              ) {
                alert(
                  "Please Approve Loan before completing Disbursement",
                );

                return;
              }

              await refreshLoanStatistics();

              alert(
                "Loan Disbursement Workflow Completed Successfully",
              );

              resetLoanWorkspace();
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
