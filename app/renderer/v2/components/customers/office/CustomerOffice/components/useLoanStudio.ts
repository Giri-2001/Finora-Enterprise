// ============================================================
// FINORA ENTERPRISE OS™
// LOAN STUDIO STATE / BUSINESS ENGINE
//
// RESPONSIBILITY:
// - Own all Loan Studio state.
// - Own customer hydration and selection.
// - Own financial calculations.
// - Own repayment schedule generation.
// - Own approval / persistence workflow.
// - Own Step 3 document evidence state.
// - Own Step 4 guarantor verification state.
// - Attach Step 3 documents to the final persisted Loan.
// - Persist guarantor verification metadata.
// - Own reset workflow.
// - Accept Standard / Gold Loan launch context.
// - Allow Gold Loan to enter shared workflow at Step 2.
// - Preload Gold sanctioned principal into existing loanAmount.
//
// IMPORTANT:
// - No JSX.
// - No inline styles.
// - No responsive layout logic.
// - Existing service/store/schedule connections are preserved.
// - Documents remain owned by Loan Studio until approval.
// - On loan creation, document metadata is linked to the
//   created loan + active customer.
// - STANDARD Loan behaviour remains backward compatible.
// - GOLD entry only changes INITIAL launch state.
// - Existing Steps 2–6 remain authoritative.
//
// FINANCIAL PERSISTENCE RULE:
//
// - totalPayable is the gross contractual payable.
// - advanceDeduction is applied by the schedule engine.
// - The persisted Loan.outstanding MUST represent the amount
//   that is actually collectible through the persisted schedule.
// - Therefore the persisted schedule total is authoritative.
// - Collection outstanding and EMI schedule must always remain
//   mathematically aligned.
//
// GUARANTOR VERIFICATION RULE:
//
// - Verification Status default = pending.
// - Identity Verification default = aadhaar.
// - Both values are controlled by Loan Studio.
// - Step navigation must preserve the selected values.
// - Approved Loan records persist both values.
// - Workspace reset restores both defaults.
//
// GOLD ENTRY RULE:
//
// STANDARD:
//
// <LoanStudio />
//
// → Step 1
// → empty principal
// → existing workflow unchanged
//
// GOLD:
//
// <LoanStudio
//   entryMode="GOLD"
//   initialStep={2}
//   initialLoanAmount={sanctionedAmount}
//   goldStepOne={preparedGoldStepOne}
// />
//
// → Step 2
// → sanctioned Gold principal preloaded
// → Gold Step-1 snapshot remains available to shared workflow
//
// VERSION : 2.6
// STATUS  : Production + Gold Entry Foundation
// ============================================================

import { useEffect, useMemo, useState } from "react";

import type { LoanCustomerOption } from "../../../../loans/details/LoanCustomerCard";

import type { DocumentsStudioItem } from "../../../../loans/documents/DocumentsStudio";

import type { EMICalculationMode } from "../../../../loans/repayment/EMIConfiguration";

import { generateSchedule } from "../../../../loans/schedule/schedule.helpers";

import { buildLoan } from "../../../../../services/loan/loanBuilder";

import {
  previewNextLoanNumber,
  reserveNextLoanNumber,
} from "../../../../../services/numbering/loanSequenceService";

import {
  createLoan,
  fetchLoans,
  hasExistingLoan,
  rollbackCreatedLoan,
} from "../../../../../services/loan/loanService";

import { buildGoldLoanStorageAllocationRequest } from "../../../../../services/gold-loan/goldLoanService";

import { allocatePersistedGoldStorage } from "../../../../../services/gold-loan/goldCustodyPersistenceService";

import {
  commitLoanDisbursementWalletCharge,
  preflightLoanDisbursementWalletCharge,
} from "../../../../../services/wallet/walletLoanDisbursementChargeService";

import { getSession } from "../../../../../store/authStore";

import {
  getCustomers,
  hydrateCustomersFromStorage,
  clearCustomerCache,
} from "../../../../../store/customers/customer.store";

import { storageManager } from "../../../../../storage/storageManager";

import type { LoanReviewData } from "../../../../loans/review/types";

import type { LoanStudioProps } from "./LoanStudio.types";

import {
  getAuthenticatedStorageMode,
  parseNumericValue,
  normalizeLoanType,
  getLoanTypeLabel,
} from "./LoanStudio.helpers";

/* ============================================================
   INITIAL LOAN AMOUNT
============================================================ */

function resolveInitialLoanAmount(value?: number): string {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return "";
  }

  return String(value);
}

/* ============================================================
   DOCUMENT HELPERS
============================================================ */

async function resolveDocumentDataUrl(
  item: DocumentsStudioItem,
): Promise<string | undefined> {
  if (item.dataUrl) {
    return item.dataUrl;
  }

  if (!item.url) {
    return undefined;
  }

  try {
    const response = await fetch(item.url);

    if (!response.ok) {
      return undefined;
    }

    const blob = await response.blob();

    return await new Promise<string | undefined>((resolve) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result;

        resolve(typeof result === "string" ? result : undefined);
      };

      reader.onerror = () => {
        resolve(undefined);
      };

      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("FINORA DOCUMENT DATA URL RESOLUTION ERROR:", error);

    return undefined;
  }
}

async function prepareLoanDocuments(
  documents: DocumentsStudioItem[],
  customerId: string,
  loanId: string,
): Promise<DocumentsStudioItem[]> {
  if (documents.length === 0) {
    return [];
  }

  const storageMode = getAuthenticatedStorageMode();

  const persistenceMode =
    storageMode === "USB" ? "usb" : storageMode === "CLOUD" ? "cloud" : "local";

  return Promise.all(
    documents.map(async (document) => {
      const dataUrl = await resolveDocumentDataUrl(document);

      return {
        ...document,

        customerId,

        loanId,

        storageKey: `FINORA/loans/${loanId}/documents/${document.id}`,

        dataUrl,

        persistenceMode,

        persisted: true,
      };
    }),
  );
}

/* ============================================================
   HOOK
============================================================ */

export function useLoanStudio({
  customerName,
  customerId,
  phoneNumber,
  entryMode = "STANDARD",
  initialStep,
  initialLoanAmount,
  goldStepOne,
}: LoanStudioProps) {
  /* ==========================================================
     INITIAL LAUNCH CONTEXT

     STANDARD:
       default Step = 1

     GOLD:
       default Step = 2

     Explicit initialStep always wins.
  ========================================================== */

  const resolvedInitialStep = initialStep ?? (entryMode === "GOLD" ? 2 : 1);

  const resolvedInitialLoanAmount = resolveInitialLoanAmount(initialLoanAmount);

  const isGoldLoan = entryMode === "GOLD";

  /* ==========================================================
     CUSTOMER HYDRATION
  ========================================================== */

  const [customers, setCustomers] = useState<ReturnType<typeof getCustomers>>(
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadLoanCustomers(): Promise<void> {
      try {
        if (!storageManager.isInitialized()) {
          const storageMode = getAuthenticatedStorageMode();

          const storageActivated =
            await storageManager.selectStorageMode(storageMode);

          if (!storageActivated.success) {
            throw new Error(
              storageActivated.error ??
                `Unable to restore FINORA ${storageMode} storage.`,
            );
          }
        }

        if (cancelled) {
          return;
        }

        clearCustomerCache();

        const hydratedCustomers = await hydrateCustomersFromStorage();

        if (cancelled) {
          return;
        }

        setCustomers(hydratedCustomers);
      } catch (error) {
        console.error("FINORA LOAN CUSTOMER HYDRATION ERROR:", error);

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

  /* ==========================================================
     CUSTOMER SELECTION
  ========================================================== */

  const [selectedCustomer, setSelectedCustomer] = useState<
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
    if (customerId && customerName) {
      const matchingCustomer = customers.find(
        (customer) => customer.identity.customerId === customerId,
      );

      setSelectedCustomer({
        customerId,

        customerName,

        phoneNumber,

        photo: matchingCustomer?.photo,
      });
    }
  }, [customerId, customerName, phoneNumber, customers]);

  /* ==========================================================
     STEP 3 — DOCUMENT EVIDENCE
  ========================================================== */

  const [documents, setDocuments] = useState<DocumentsStudioItem[]>([]);

  useEffect(() => {
    setDocuments([]);
  }, [selectedCustomer?.customerId]);

  /* ==========================================================
     CUSTOMER OPTIONS
  ========================================================== */

  const loanCustomerOptions = useMemo<LoanCustomerOption[]>(
    () =>
      customers
        .filter(
          (customer) =>
            customer.identity.isDeleted !== true &&
            customer.internal.isArchived !== true,
        )
        .map((customer) => ({
          customerId: customer.identity.customerId,

          customerName: customer.basic.fullName,

          phoneNumber: customer.basic.mobileNumber,

          photo: customer.photo,
        })),
    [customers],
  );

  /* ==========================================================
     ACTIVE CUSTOMER
  ========================================================== */

  const activeCustomerId = selectedCustomer?.customerId ?? "";

  const activeCustomerName = selectedCustomer?.customerName ?? "";

  const activeCustomerPhone = selectedCustomer?.phoneNumber ?? "";

  /* ==========================================================
     LOAN NUMBER PREVIEW

     IMPORTANT:

     - Preview never consumes the per-Customer Loan sequence.
     - Changing Customer reloads the appropriate preview.
     - Final approval still uses reserveNextLoanNumber().
     - Final reserved number remains authoritative.
  ========================================================== */

  const [
    loanNumberPreview,
    setLoanNumberPreview,
  ] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLoanNumberPreview(): Promise<void> {
      if (!activeCustomerId) {
        setLoanNumberPreview("");

        return;
      }

      const result =
        await previewNextLoanNumber(
          activeCustomerId,
        );

      if (cancelled) {
        return;
      }

      if (
        !result.success ||
        !result.data
      ) {
        console.error(
          "FINORA LOAN NUMBER PREVIEW ERROR:",
          result.error,
        );

        setLoanNumberPreview("");

        return;
      }

      setLoanNumberPreview(
        result.data.loanNumber,
      );
    }

    void loadLoanNumberPreview();

    return () => {
      cancelled = true;
    };
  }, [activeCustomerId]);

  /* ==========================================================
     WIZARD

     IMPORTANT:

     This is an INITIAL value only.

     We deliberately do NOT run an effect that repeatedly forces
     Step 2 for Gold loans.

     Therefore normal Step navigation and reset behaviour remain
     under Loan Studio control after mount.
  ========================================================== */

  const [step, setStep] = useState<number>(resolvedInitialStep);

  /* ==========================================================
     LOAN DETAILS

     GOLD:
       initialLoanAmount = sanctioned Gold principal.

     STANDARD:
       remains empty unless explicitly supplied.
  ========================================================== */

  const [loanAmount, setLoanAmount] = useState(resolvedInitialLoanAmount);

  const [interest, setInterest] = useState("");

  const [processingFee, setProcessingFee] = useState("");

  const [advanceDeduction, setAdvanceDeduction] = useState("");

  const [penaltyType, setPenaltyType] = useState("Fixed Amount");

  const [penaltyValue, setPenaltyValue] = useState("");

  const [lateFee, setLateFee] = useState("");

  /* ==========================================================
     REPAYMENT
  ========================================================== */

  const [emiCalculation, setEMICalculation] =
    useState<EMICalculationMode>("fixed");

  const [firstInstallmentDate, setFirstInstallmentDate] = useState("");

  const [repaymentType, setRepaymentType] = useState("");

  const [duration, setDuration] = useState("");

  const [durationType, setDurationType] = useState("");

  /* ==========================================================
     STEP 1 → STEP 2 REPAYMENT SYNC
  ========================================================== */

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
    setRepaymentType(syncedRepaymentType);
  }, [syncedRepaymentType]);

  /* ==========================================================
     GUARANTOR
  ========================================================== */

  const [guarantorName, setGuarantorName] = useState("");

  const [guarantorPhone, setGuarantorPhone] = useState("");

  const [guarantorOccupation, setGuarantorOccupation] = useState("");

  const [guarantorAddress, setGuarantorAddress] = useState("");

  const [guarantorRelationship, setGuarantorRelationship] = useState("");

  // ==========================================================
  // GUARANTOR VERIFICATION
  // ==========================================================

  const [guarantorVerificationStatus, setGuarantorVerificationStatus] =
    useState("pending");

  const [guarantorIdentityVerification, setGuarantorIdentityVerification] =
    useState("aadhaar");

  /* ==========================================================
     NOTES
  ========================================================== */

  const [purpose, setPurpose] = useState("");

  const [remarks, setRemarks] = useState("");

  /* ==========================================================
     APPROVAL
  ========================================================== */

  const [loanApproved, setLoanApproved] = useState(false);

  const loanStatus = loanApproved ? "Approved" : "Pending Approval";

  /* ==========================================================
     DISBURSEMENT
  ========================================================== */

  const [disbursementDate, setDisbursementDate] = useState("");

  useEffect(() => {
    if (step === 6 && !disbursementDate) {
      const today = new Date();

      const year = today.getFullYear();

      const month = String(today.getMonth() + 1).padStart(2, "0");

      const day = String(today.getDate()).padStart(2, "0");

      setDisbursementDate(`${year}-${month}-${day}`);
    }
  }, [step, disbursementDate]);

  const [paymentMode, setPaymentMode] = useState("cash");

  const [transactionStatus, setTransactionStatus] = useState("pending");

  const [disbursementSavedAt, setDisbursementSavedAt] = useState("Not Saved");

  const [disbursementDraftStatus, setDisbursementDraftStatus] = useState<
    "Draft" | "Completed"
  >("Draft");

  const [disbursementReceiptNumber, setDisbursementReceiptNumber] = useState(
    () => `DIS-${Date.now()}`,
  );

  /* ==========================================================
     LOAN STATISTICS
  ========================================================== */

  const [loanStatistics, setLoanStatistics] = useState({
    totalLoans: 0,

    activeLoans: 0,

    totalDisbursed: 0,
  });

  async function refreshLoanStatistics(): Promise<void> {
    try {
      const loans = await fetchLoans();

      const totalLoans = loans.length;

      const activeLoans = loans.filter((loan) => {
        const record = loan as unknown as Record<string, unknown>;

        const status = String(record.status ?? "")
          .trim()
          .toUpperCase();

        const outstanding = Number(record.outstanding ?? 0);

        return (status === "ACTIVE" || status === "RUNNING") && outstanding > 0;
      }).length;

      const totalDisbursed = loans.reduce((total, loan) => {
        const record = loan as unknown as Record<string, unknown>;

        const netValue = Number(record.netDisbursement ?? NaN);

        const amountValue = Number(record.amount ?? 0);

        const disbursedValue = Number.isFinite(netValue)
          ? netValue
          : amountValue;

        return total + (Number.isFinite(disbursedValue) ? disbursedValue : 0);
      }, 0);

      setLoanStatistics({
        totalLoans,

        activeLoans,

        totalDisbursed,
      });
    } catch (error) {
      console.error("FINORA LOAN STATISTICS REFRESH ERROR:", error);
    }
  }

  /* ==========================================================
     INITIAL STATISTICS LOAD
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadInitialLoanStatistics(): Promise<void> {
      try {
        if (!storageManager.isInitialized()) {
          const storageMode = getAuthenticatedStorageMode();

          const storageActivated =
            await storageManager.selectStorageMode(storageMode);

          if (!storageActivated.success) {
            return;
          }
        }

        if (cancelled) {
          return;
        }

        await refreshLoanStatistics();
      } catch (error) {
        console.error("FINORA INITIAL LOAN STATISTICS ERROR:", error);
      }
    }

    void loadInitialLoanStatistics();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     FINANCIAL CALCULATIONS
  ========================================================== */

  const principal = parseNumericValue(loanAmount);

  const interestRate = parseNumericValue(interest);

  const durationValue = Math.max(0, parseNumericValue(duration));

  const monthlyInterestAmount = (principal * interestRate) / 100;

  const interestMonths =
    durationType === "years"
      ? durationValue * 12
      : durationType === "months"
        ? durationValue
        : durationType === "weeks"
          ? durationValue / 4.33
          : durationValue / 30;

  const flatTotalInterest = Math.round(monthlyInterestAmount * interestMonths);

  const flatTotalPayable = Math.round(principal + flatTotalInterest);

  const durationDays =
    durationType === "years"
      ? durationValue * 365
      : durationType === "months"
        ? durationValue * 30
        : durationType === "weeks"
          ? durationValue * 7
          : durationValue;

  /* ==========================================================
     REPAYMENT FREQUENCY
  ========================================================== */

  const normalizedRepaymentType = syncedRepaymentType;

  /* ==========================================================
     INSTALLMENT COUNT
  ========================================================== */

  const totalInstallments =
    durationValue <= 0 || !normalizedRepaymentType
      ? 0
      : normalizedRepaymentType === "MONTHLY"
        ? durationType === "years"
          ? durationValue * 12
          : Math.max(1, Math.ceil(durationDays / 30))
        : normalizedRepaymentType === "WEEKLY"
          ? Math.max(1, Math.ceil(durationDays / 7))
          : normalizedRepaymentType === "DAILY"
            ? Math.max(1, Math.ceil(durationDays))
            : 0;

  /* ==========================================================
     LOAN DATES
  ========================================================== */

  const loanDate = new Date();

  const scheduleStartDate = firstInstallmentDate
    ? new Date(`${firstInstallmentDate}T00:00:00`)
    : new Date(loanDate);

  const maturityDate =
    durationValue > 0 && durationType ? new Date(loanDate) : null;

  if (maturityDate) {
    switch (durationType) {
      case "days":
        maturityDate.setDate(maturityDate.getDate() + durationValue);

        break;

      case "weeks":
        maturityDate.setDate(maturityDate.getDate() + durationValue * 7);

        break;

      case "months":
        maturityDate.setMonth(maturityDate.getMonth() + durationValue);

        break;

      case "years":
        maturityDate.setFullYear(maturityDate.getFullYear() + durationValue);

        break;
    }
  }

  /* ==========================================================
     REPAYMENT SCHEDULE
  ========================================================== */

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

          parseNumericValue(advanceDeduction),
        )
      : [];

  /* ==========================================================
     FINAL INTEREST / PAYABLE
  ========================================================== */

  const totalInterest =
    emiCalculation === "reducing"
      ? schedule.reduce(
          (sum, installment) => sum + installment.interestAmount,
          0,
        )
      : flatTotalInterest;

  const totalPayable = Math.round(principal + totalInterest);

  /* ==========================================================
     COLLECTIBLE OUTSTANDING
  ========================================================== */

  const scheduleCollectionTotal =
    schedule.length > 0
      ? Math.round(
          schedule.reduce(
            (sum, installment) =>
              sum + Math.max(0, Number(installment.installmentAmount ?? 0)),
            0,
          ),
        )
      : 0;

  const fallbackCollectibleOutstanding = Math.max(
    0,
    Math.round(totalPayable - parseNumericValue(advanceDeduction)),
  );

  const collectibleOutstanding =
    schedule.length > 0
      ? scheduleCollectionTotal
      : fallbackCollectibleOutstanding;

  /* ==========================================================
     INSTALLMENT AMOUNT
  ========================================================== */

  const installmentAmount =
    schedule.length > 0 ? schedule[0].installmentAmount : 0;

  /* ==========================================================
     NET DISBURSEMENT
  ========================================================== */

  const netDisbursement =
    principal -
    parseNumericValue(processingFee) -
    parseNumericValue(advanceDeduction);

  /* ==========================================================
     LOAN TYPE
  ========================================================== */

  const normalizedLoanType = normalizeLoanType(repaymentType);

  const loanTypeLabel = getLoanTypeLabel(repaymentType);

  /* ==========================================================
     REVIEW DATA
  ========================================================== */

  const reviewData: LoanReviewData & {
    guarantorVerificationStatus: string;

    guarantorIdentityVerification: string;
  } = {
    customerId: activeCustomerId,

    customerName: activeCustomerName || "--",

    phoneNumber: activeCustomerPhone,

    loanAmount: parseNumericValue(loanAmount),

    loanType: normalizedLoanType,

    interestType: emiCalculation,

    interestRate: parseNumericValue(interest),

    repaymentType,

    duration: duration && durationType ? `${duration} ${durationType}` : "",

    processingFee: parseNumericValue(processingFee),

    advanceDeduction: parseNumericValue(advanceDeduction),

    netDisbursement,

    penaltyType,

    penaltyValue: parseNumericValue(penaltyValue),

    guarantorName,

    guarantorPhone,

    guarantorOccupation,

    guarantorVerificationStatus,

    guarantorIdentityVerification,

    totalInstallments,

    installmentAmount,

    paymentMode,

    loanStatus,
  };

  /* ==========================================================
     DRAFT / REJECT
  ========================================================== */

  function handleSaveDraft(): void {
    console.log("FINORA LOAN SAVE DRAFT", {
      customerId: activeCustomerId,

      entryMode,

      documents: documents.length,

      guarantorVerificationStatus,

      guarantorIdentityVerification,
    });
  }

  function handleRejectLoan(): void {
    console.log("FINORA LOAN REJECT", {
      customerId: activeCustomerId,

      entryMode,

      documents: documents.length,

      guarantorVerificationStatus,

      guarantorIdentityVerification,
    });
  }

  /* ==========================================================
     APPROVE / CREATE LOAN
  ========================================================== */

  async function handleApproveLoan(): Promise<void> {
    if (loanApproved) {
      alert("Loan already created");

      return;
    }

    const normalizedRepaymentTypeValue = syncedRepaymentType;

    const normalizedLoanTypeValue = normalizeLoanType(repaymentType);

    if (!normalizedLoanTypeValue) {
      alert("Please select a valid Loan Type");

      return;
    }

    if (!normalizedRepaymentTypeValue) {
      alert("Please select Duration Unit in Step 1");

      return;
    }

    if (!activeCustomerId) {
      alert("Please select a customer before approving the loan.");

      return;
    }

    const loanTitle = getLoanTypeLabel(normalizedLoanTypeValue);

    /* ========================================================
       DUPLICATE LOAN CHECK
    ======================================================== */

    const alreadyExists = await hasExistingLoan(
      activeCustomerId,

      loanTitle,

      principal,
    );

    if (alreadyExists) {
      setLoanApproved(true);

      await refreshLoanStatistics();

      alert("Loan already created");

      return;
    }

    /* ========================================================
       FINORA WALLET CHARGE PREFLIGHT

       The Loan operation must not begin unless the active
       scoped Wallet can cover the configured platform fee.

       This preflight does not mutate Wallet state.
    ======================================================== */

    const authenticatedSession =
      getSession();

    const walletScope = {
      ownerId:
        String(authenticatedSession?.ownerId ?? "").trim(),

      businessId:
        String(authenticatedSession?.businessId ?? "").trim(),

      branchId:
        String(authenticatedSession?.branchId ?? "").trim(),
    };

    const walletChargePreflight =
      await preflightLoanDisbursementWalletCharge(
        walletScope,
      );

    if (!walletChargePreflight.success) {
      console.error(
        "FINORA LOAN WALLET CHARGE PREFLIGHT ERROR:",
        walletChargePreflight.error,
      );

      alert(
        walletChargePreflight.error,
      );

      return;
    }

    /* ========================================================
       CREATE STABLE LOAN ID
    ======================================================== */

    const loanId = crypto.randomUUID();

    /* ========================================================
       PREPARE DOCUMENT EVIDENCE
    ======================================================== */

    let persistedDocuments: DocumentsStudioItem[] = [];

    try {
      persistedDocuments = await prepareLoanDocuments(
        documents,

        activeCustomerId,

        loanId,
      );
    } catch (error) {
      console.error("FINORA LOAN DOCUMENT PREPARATION ERROR:", error);

      alert("Unable to prepare loan documents. Please try again.");

      return;
    }

    /* ========================================================
       RESERVE AUTHORITATIVE LOAN NUMBER

       IMPORTANT:

       - Reservation permanently consumes the per-Customer
         Loan sequence.
       - It occurs only after document preparation succeeds.
       - A downstream Loan persistence failure may create a
         numbering gap.
       - Reserved Loan numbers are never rolled back or reused.
    ======================================================== */

    const loanNumberResult =
      await reserveNextLoanNumber(
        activeCustomerId,
      );

    if (
      !loanNumberResult.success ||
      !loanNumberResult.data
    ) {
      console.error(
        "FINORA LOAN NUMBER RESERVATION ERROR:",
        loanNumberResult.error,
      );

      alert(
        loanNumberResult.error ??
          "Unable to reserve the Loan Number. Please try again.",
      );

      return;
    }

    const authoritativeLoanNumber =
      loanNumberResult.data.loanNumber;

    /* ========================================================
       BUILD LOAN
    ======================================================== */

    const loan = buildLoan({
      id: loanId,

      loanNumber:
        authoritativeLoanNumber,

      title: loanTitle,

      amount: principal,

      outstanding: collectibleOutstanding,

      interest: interestRate,

      processingFee: parseNumericValue(processingFee),

      lateFee: parseNumericValue(lateFee),

      loanDate: loanDate.toISOString(),

      dueDate: maturityDate ? maturityDate.toISOString() : "",

      guarantor: guarantorName,

      customerId: activeCustomerId,

      customerName: activeCustomerName,

      phoneNumber: activeCustomerPhone,

      loanType: normalizedLoanTypeValue,

      repaymentType: normalizedRepaymentTypeValue,

      duration: durationValue,

      durationType,

      advanceDeduction: parseNumericValue(advanceDeduction),

      netDisbursement,

      purpose,

      remarks,

      schedule,
    });

    /* ========================================================
       ATTACH EXTENDED LOAN METADATA
    ======================================================== */

    const loanWithDocuments = {
      ...loan,

      // ------------------------------------------------------
      // ENTRY MODE
      //
      // Existing consumers can ignore these fields.
      // ------------------------------------------------------

      entryMode,

      isGoldLoan,

      goldStepOne: isGoldLoan ? goldStepOne : undefined,

      // ------------------------------------------------------
      // DOCUMENTS
      // ------------------------------------------------------

      documents: persistedDocuments,

      documentCount: persistedDocuments.length,

      documentsCustomerId: activeCustomerId,

      documentsLinkedAt: new Date().toISOString(),

      // ------------------------------------------------------
      // GUARANTOR DETAILS
      // ------------------------------------------------------

      guarantorName,

      guarantorPhone,

      guarantorOccupation,

      guarantorAddress,

      guarantorRelationship,

      // ------------------------------------------------------
      // GUARANTOR VERIFICATION
      // ------------------------------------------------------

      guarantorVerificationStatus,

      guarantorIdentityVerification,
    };

    /* =========================================================
   GOLD CUSTODY PRECONDITION

   Gold Loan must still carry its prepared Step-1 snapshot
   before any Loan record is persisted.
========================================================= */

    if (isGoldLoan && !goldStepOne) {
      alert(
        "Gold Loan custody details are unavailable. Return to Gold Step 1 and try again.",
      );

      return;
    }

    /* =========================================================
   CREATE LOAN
========================================================= */

    const createResult = await createLoan(loanWithDocuments);

    if (!createResult.success) {
      console.error("LOAN CREATE ERROR:", createResult.error);

      alert(createResult.error ?? "Unable to create loan.");

      return;
    }

    /* =========================================================
   GOLD PHYSICAL CUSTODY COMMIT

   STANDARD loans skip this block completely.

   GOLD flow:

   Loan persisted
        ↓
   Build physical custody request
        ↓
   Re-load latest Gold Storage state
        ↓
   Re-check Rack capacity
        ↓
   Persist OCCUPIED custody allocation

   If custody fails, the just-created Loan is removed through
   the controlled compensation path before success is shown.
========================================================= */

    if (isGoldLoan && goldStepOne) {
      const session = getSession();

      const allocatedBy = String(session?.username ?? "").trim();

      const persistedLoanId = String(
        createResult.data?.id ?? loan.id ?? loanId,
      ).trim();

      const persistedLoanNumber = String(
        createResult.data?.loanNumber ?? loan.loanNumber ?? "",
      ).trim();

      /* --------------------------------------------------------
     AUTHENTICATED USER IS REQUIRED
  -------------------------------------------------------- */

      if (!allocatedBy) {
        const rollbackResult = await rollbackCreatedLoan(
          persistedLoanId || loanId,
        );

        if (!rollbackResult.success) {
          console.error(
            "CRITICAL GOLD LOAN ROLLBACK ERROR:",
            rollbackResult.error,
          );

          alert(
            "CRITICAL CONSISTENCY ERROR: the Gold Loan was created, but authenticated custody identity was unavailable and automatic Loan rollback failed. Do not create another Gold Loan until this record is reviewed.",
          );

          return;
        }

        alert(
          "Gold Loan was not created because the authenticated custody user could not be resolved.",
        );

        return;
      }

      /* --------------------------------------------------------
     PERSISTED LOAN IDENTITY IS REQUIRED
  -------------------------------------------------------- */

      if (!persistedLoanId || !persistedLoanNumber) {
        const rollbackResult = await rollbackCreatedLoan(
          persistedLoanId || loanId,
        );

        if (!rollbackResult.success) {
          console.error(
            "CRITICAL GOLD LOAN IDENTITY ROLLBACK ERROR:",
            rollbackResult.error,
          );

          alert(
            "CRITICAL CONSISTENCY ERROR: Gold Loan identity was incomplete after persistence and automatic Loan rollback failed.",
          );

          return;
        }

        alert(
          "Gold Loan identity could not be finalized. The incomplete Loan record was rolled back.",
        );

        return;
      }

      /* --------------------------------------------------------
     BUILD AUTHORITATIVE STORAGE REQUEST
  -------------------------------------------------------- */

      const custodyRequest = buildGoldLoanStorageAllocationRequest(
        goldStepOne,

        {
          loanId: persistedLoanId,

          loanNumber: persistedLoanNumber,

          allocatedBy,
        },
      );

      /* --------------------------------------------------------
     ALLOCATE + PERSIST

     allocatePersistedGoldStorage() loads fresh persisted
     settings + allocations before calling allocateGoldStorage,
     therefore Rack capacity is re-checked at save time.
  -------------------------------------------------------- */

      const custodyResult = await allocatePersistedGoldStorage(custodyRequest);

      if (!custodyResult.success) {
        console.error("FINORA GOLD CUSTODY COMMIT ERROR:", custodyResult.error);

        /* ------------------------------------------------------
       COMPENSATE LOAN CREATE

       Custody allocation did not persist, so remove the Loan
       that was created immediately before it.
    ------------------------------------------------------ */

        const rollbackResult = await rollbackCreatedLoan(persistedLoanId);

        if (!rollbackResult.success) {
          console.error(
            "CRITICAL GOLD LOAN ROLLBACK ERROR:",
            rollbackResult.error,
          );

          alert(
            "CRITICAL CONSISTENCY ERROR: the Gold Loan was created but physical custody allocation failed, and automatic Loan rollback also failed. Do not create another Gold Loan until this record is reviewed.",
          );

          return;
        }

        alert(
          custodyResult.error ??
            "Gold physical custody allocation failed. The Loan record was rolled back.",
        );

        return;
      }
    }

    /* ========================================================
       COMMIT FINORA WALLET LOAN PLATFORM FEE

       Reaching this boundary means:
       - Standard Loan persistence succeeded.
       - Required Gold custody persistence also succeeded.

       The generated Loan Number is the deterministic,
       owner-facing Wallet transaction reference.
    ======================================================== */

    const finalizedLoanId =
      String(
        createResult.data?.id ??
        loan.id ??
        loanId,
      ).trim();

    const finalizedLoanNumber =
      String(
        createResult.data?.loanNumber ??
        loan.loanNumber ??
        authoritativeLoanNumber,
      ).trim();

    const walletChargeResult =
      await commitLoanDisbursementWalletCharge({
        walletId:
          walletChargePreflight.data.walletId,

        ownerId:
          walletScope.ownerId,

        businessId:
          walletScope.businessId,

        branchId:
          walletScope.branchId,

        loanId:
          finalizedLoanId,

        loanNumber:
          finalizedLoanNumber,
      });

    if (!walletChargeResult.success) {
      console.error(
        "FINORA LOAN WALLET CHARGE COMMIT ERROR:",
        walletChargeResult.error,
      );

      setDocuments(
        persistedDocuments,
      );

      setLoanApproved(
        true,
      );

      await refreshLoanStatistics();

      alert(
        "Loan was created successfully, but the FINORA Wallet platform fee could not be completed. " +
          walletChargeResult.error +
          " Do not create another Loan until this charge is reviewed.",
      );

      return;
    }

    /* ========================================================
       FINALIZE SUCCESSFUL LOAN CREATION
    ======================================================== */

    setDocuments(persistedDocuments);

    setLoanApproved(true);

    await refreshLoanStatistics();

    /* ========================================================
       SUCCESS CONFIRMATION

       alert() is blocking.

       Therefore resetLoanWorkspace() runs only AFTER the user
       presses OK on the success popup.

       Failed Loan creation never clears entered form data.
    ======================================================== */

    const loanSuccessMessage =
      persistedDocuments.length > 0
        ? `Loan Created Successfully with ${persistedDocuments.length} document${
            persistedDocuments.length === 1 ? "" : "s"
          }`
        : "Loan Created Successfully";

    alert(
      `${loanSuccessMessage}

Loan Number: ${finalizedLoanNumber}
FINORA Wallet Fee: ₹${walletChargeResult.data.amount}
Available Balance: ₹${walletChargeResult.data.availableBalance}`,
    );

    /* ========================================================
       START FRESH LOAN WORKSPACE
    ======================================================== */

    resetLoanWorkspace();
  }

  /* ==========================================================
     RESET COMPLETED LOAN WORKSPACE

     Reset deliberately returns to Step 1 and clears principal.

     This preserves existing post-success Loan Studio behaviour.

     We do NOT repeatedly force Gold initialStep / principal
     after mount.
  ========================================================== */

  function resetLoanWorkspace(): void {
    setStep(1);

    setSelectedCustomer(undefined);

    setDocuments([]);

    setLoanAmount("");

    setInterest("");

    setProcessingFee("");

    setAdvanceDeduction("");

    setPenaltyType("Fixed Amount");

    setPenaltyValue("");

    setLateFee("");

    setEMICalculation("fixed");

    setFirstInstallmentDate("");

    setRepaymentType("");

    setDuration("");

    setDurationType("");

    setGuarantorName("");

    setGuarantorPhone("");

    setGuarantorOccupation("");

    setGuarantorAddress("");

    setGuarantorRelationship("");

    // --------------------------------------------------------
    // GUARANTOR VERIFICATION DEFAULTS
    // --------------------------------------------------------

    setGuarantorVerificationStatus("pending");

    setGuarantorIdentityVerification("aadhaar");

    setPurpose("");

    setRemarks("");

    setLoanApproved(false);

    setDisbursementDate("");

    setPaymentMode("cash");

    setTransactionStatus("pending");

    setDisbursementSavedAt("Not Saved");

    setDisbursementDraftStatus("Draft");

    setDisbursementReceiptNumber(`DIS-${Date.now()}`);
  }

  /* ==========================================================
     RETURN API
  ========================================================== */

  return {
    /* ========================================================
       LAUNCH CONTEXT
    ======================================================== */

    entryMode,

    isGoldLoan,

    initialStep: resolvedInitialStep,

    initialLoanAmount,

    goldStepOne,

    /* ========================================================
       EXISTING CUSTOMER CONTEXT
    ======================================================== */

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

    loanNumberPreview,

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

    guarantorVerificationStatus,
    setGuarantorVerificationStatus,

    guarantorIdentityVerification,
    setGuarantorIdentityVerification,

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

    scheduleCollectionTotal,

    collectibleOutstanding,

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
