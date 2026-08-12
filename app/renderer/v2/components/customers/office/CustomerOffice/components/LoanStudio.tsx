// FINORA ENTERPRISE OS
// Loan Studio customer workspace.

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ChangeEvent,
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

import {
  generateSchedule,
} from "../../../../loans/schedule/schedule.helpers";

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

  const [documentPhoto, setDocumentPhoto] = useState<string | undefined>(
    selectedCustomer?.photo,
  );

  const [documentFiles, setDocumentFiles] = useState<
    Array<{
      name: string;
      type: string;
    }>
  >([]);

  useEffect(() => {
    setDocumentPhoto(selectedCustomer?.photo);
  }, [selectedCustomer?.photo]);

  function handleCustomerPhotoUpload(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const photoUrl = URL.createObjectURL(file);
    setDocumentPhoto(photoUrl);

    setSelectedCustomer((current) =>
      current
        ? {
            ...current,
            photo: photoUrl,
          }
        : current,
    );
  }

  function handleDocumentUpload(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setDocumentFiles((current) => [
      ...current,
      {
        name: file.name,
        type: file.type || "Document",
      },
    ]);
  }

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
  ] = useState<
    "Draft" | "Completed"
  >("Draft");

  const [
    disbursementReceiptNumber,
  ] = useState(
    () =>
      `DIS-${Date.now()}`,
  );

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
      alert(
        "Loan already created",
      );

      setLoanApproved(
        true,
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

    alert(
      "Loan Created Successfully",
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
                  totalLoans={0}
                  activeLoans={0}
                  totalDisbursed={0}
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

            <section
              style={{
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                boxSizing: "border-box",
                padding: "18px",
                border: "1px solid rgba(148, 163, 184, 0.16)",
                borderRadius: "13px",
                background: "#111C2E",
                color: "#FFFFFF",
                overflow: "auto",
              }}
            >

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    width: "4px",
                    height: "34px",
                    borderRadius: "4px",
                    background: "#2563EB",
                  }}
                />

                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontWeight: 750,
                    }}
                  >
                    Documents Studio™
                  </h2>

                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#94A3B8",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    Upload customer photo and loan verification documents.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(220px, 280px) minmax(0, 1fr)",
                  gap: "14px",
                  alignItems: "start",
                }}
              >

                <div
                  style={{
                    minWidth: 0,
                    padding: "14px",
                    border:
                      "1px solid rgba(37, 99, 235, 0.42)",
                    borderRadius: "10px",
                    background: "#0F172A",
                  }}
                >

                  <div
                    style={{
                      marginBottom: "8px",
                      color: "#CBD5E1",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    CUSTOMER PHOTO
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "190px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      borderRadius: "9px",
                      border:
                        "1px solid rgba(148, 163, 184, 0.16)",
                      background: "#0A1425",
                    }}
                  >
                    {documentPhoto ? (
                      <img
                        src={documentPhoto}
                        alt="Customer"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          color: "#94A3B8",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        No Photo
                      </div>
                    )}
                  </div>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "34px",
                      marginTop: "10px",
                      borderRadius: "7px",
                      border:
                        "1px solid rgba(37, 99, 235, 0.42)",
                      background:
                        "rgba(37, 99, 235, 0.14)",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 650,
                      cursor: "pointer",
                    }}
                  >
                    Upload / Replace Photo

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleCustomerPhotoUpload
                      }
                      style={{
                        display: "none",
                      }}
                    />
                  </label>

                </div>

                <div
                  style={{
                    minWidth: 0,
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: "10px",
                  }}
                >

                  {[
                    "Identity Proof",
                    "Address Proof",
                    "Income / Business Proof",
                    "Other Document",
                  ].map((label) => (
                    <label
                      key={label}
                      style={{
                        minWidth: 0,
                        minHeight: "92px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "12px",
                        boxSizing: "border-box",
                        border:
                          "1px solid rgba(148, 163, 184, 0.16)",
                        borderRadius: "9px",
                        background: "#0F172A",
                        color: "#CBD5E1",
                        fontSize: "12px",
                        fontWeight: 650,
                        cursor: "pointer",
                      }}
                    >
                      <span>{label}</span>

                      <span
                        style={{
                          color: "#94A3B8",
                          fontSize: "11px",
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {documentFiles[0]?.name ??
                          "Choose document"}
                      </span>

                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={
                          handleDocumentUpload
                        }
                        style={{
                          display: "none",
                        }}
                      />
                    </label>
                  ))}

                </div>

              </div>

            </section>

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

                <RelationshipCard />

                <GuarantorVerification />

              </div>

              <div
                style={step1PreviewStyle}
              >

                <GuarantorPreviewCard
                  guarantorName={
                    guarantorName
                  }
                  relationship="--"
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

        {step === 5 && (
          <section
            style={step1WorkspaceStyle}
          >

            <ReviewHeader />

            <div
              style={step1BottomStyle}
            >

              <div
                style={step1FormStyle}
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
                style={step1PreviewStyle}
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

        {step === 6 && (
          <section
            style={step1WorkspaceStyle}
          >

            <DisbursementHeader />

            <div
              style={step1BottomStyle}
            >

              <div
                style={step1FormStyle}
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

                      setDisbursementDraftStatus(
                        value ===
                          "completed"
                          ? "Completed"
                          : "Draft",
                      );
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
                style={step1PreviewStyle}
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
            onClick={() => {

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

              alert(
                "Loan Disbursement Workflow Completed Successfully",
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
