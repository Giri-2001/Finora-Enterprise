// ============================================================
// FINORA ENTERPRISE OS
// LOAN STUDIO STATE / BUSINESS ENGINE
//
// RESPONSIBILITY:
// - Own all Loan Studio state.
// - Own customer hydration and selection.
// - Own financial calculations.
// - Own repayment schedule generation.
// - Own approval / persistence workflow.
// - Own reset workflow.
//
// IMPORTANT:
// - No JSX.
// - No inline styles.
// - No responsive layout logic.
// - Existing service/store/schedule connections are preserved.
// ============================================================

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  LoanCustomerOption,
} from "../../../../loans/details/LoanCustomerCard";

import type {
  DocumentsStudioItem,
} from "../../../../loans/documents/DocumentsStudio";

import type {
  EMICalculationMode,
} from "../../../../loans/repayment/EMIConfiguration";

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

import type {
  LoanReviewData,
} from "../../../../loans/review/types";

import type {
  LoanStudioProps,
} from "./LoanStudio.types";

import {
  getAuthenticatedStorageMode,
  parseNumericValue,
  normalizeLoanType,
  getLoanTypeLabel,
} from "./LoanStudio.helpers";

export function useLoanStudio({
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

  // ==========================================================
// STEP 6 — DEFAULT DISBURSEMENT DATE
//
// When Step 6 opens, today's date is selected automatically.
// User can still change it manually.
// ==========================================================

useEffect(() => {

  if (
    step === 6 &&
    !disbursementDate
  ) {

    const today =
      new Date();

    const year =
      today.getFullYear();

    const month =
      String(
        today.getMonth() + 1,
      ).padStart(
        2,
        "0",
      );

    const day =
      String(
        today.getDate(),
      ).padStart(
        2,
        "0",
      );

    setDisbursementDate(
      `${year}-${month}-${day}`,
    );

  }

}, [
  step,
  disbursementDate,
]);


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

  return {
    customerName,
    customerId,
    phoneNumber,

    customers,
    selectedCustomer,
    setSelectedCustomer,
    documents,
    setDocuments,
    loanCustomerOptions,

    activeCustomerId,
    activeCustomerName,
    activeCustomerPhone,

    step,
    setStep,

    loanAmount,
    setLoanAmount,
    interest,
    setInterest,
    processingFee,
    setProcessingFee,
    advanceDeduction,
    setAdvanceDeduction,
    penaltyType,
    setPenaltyType,
    penaltyValue,
    setPenaltyValue,
    lateFee,
    setLateFee,
    emiCalculation,
    setEMICalculation,
    firstInstallmentDate,
    setFirstInstallmentDate,
    repaymentType,
    setRepaymentType,
    duration,
    setDuration,
    durationType,
    setDurationType,

    guarantorName,
    setGuarantorName,
    guarantorPhone,
    setGuarantorPhone,
    guarantorOccupation,
    setGuarantorOccupation,
    guarantorAddress,
    setGuarantorAddress,
    guarantorRelationship,
    setGuarantorRelationship,
    purpose,
    setPurpose,
    remarks,
    setRemarks,

    loanApproved,
    setLoanApproved,
    loanStatus,

    disbursementDate,
    setDisbursementDate,
    paymentMode,
    setPaymentMode,
    transactionStatus,
    setTransactionStatus,
    disbursementSavedAt,
    setDisbursementSavedAt,
    disbursementDraftStatus,
    setDisbursementDraftStatus,
    disbursementReceiptNumber,
    setDisbursementReceiptNumber,

    loanStatistics,
    refreshLoanStatistics,

    principal,
    interestRate,
    durationValue,
    syncedRepaymentType,
    normalizedRepaymentType,
    totalInstallments,
    loanDate,
    scheduleStartDate,
    maturityDate,
    schedule,
    flatTotalInterest,
    flatTotalPayable,
    totalInterest,
    totalPayable,
    installmentAmount,
    netDisbursement,
    normalizedLoanType,
    loanTypeLabel,
    reviewData,

    handleSaveDraft,
    handleRejectLoan,
    handleApproveLoan,
    resetLoanWorkspace,
  };
}