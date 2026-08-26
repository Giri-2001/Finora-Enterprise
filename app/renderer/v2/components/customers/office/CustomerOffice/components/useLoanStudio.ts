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
// - Attach Step 3 documents to the final persisted Loan.
// - Own reset workflow.
//
// IMPORTANT:
// - No JSX.
// - No inline styles.
// - No responsive layout logic.
// - Existing service/store/schedule connections are preserved.
// - Documents remain owned by Loan Studio until approval.
// - On loan creation, document metadata is linked to the
//   created loan + active customer.
// ============================================================

import { useEffect, useMemo, useState } from "react";

import type { LoanCustomerOption } from "../../../../loans/details/LoanCustomerCard";

import type { DocumentsStudioItem } from "../../../../loans/documents/DocumentsStudio";

import type { EMICalculationMode } from "../../../../loans/repayment/EMIConfiguration";

import { generateSchedule } from "../../../../loans/schedule/schedule.helpers";

import { buildLoan } from "../../../../../services/loan/loanBuilder";

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
   DOCUMENT HELPERS
============================================================ */

/**
 * Converts the temporary browser object URL into a persistent
 * data URL when possible.
 *
 * DocumentsStudio creates `URL.createObjectURL(file)` for the
 * live preview. That URL is renderer/session specific and must
 * not be treated as a permanent loan-office reference.
 *
 * If conversion is not possible, the original document metadata
 * is still retained and the document remains linked to the loan.
 */
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

/**
 * Prepare Step 3 evidence for the persistent Loan record.
 *
 * The exact physical storage implementation remains behind
 * FINORA's storage/service layer. This hook only establishes
 * the stable logical relationship:
 *
 *   customerId
 *   loanId
 *   documentId
 *   storageKey
 *
 * This matches the Documents Studio persistence contract.
 *
 * IMPORTANT:
 *
 * Once a document is approved into a Loan workspace, its
 * persistent storage key must belong to that Loan.
 *
 * Therefore the Loan storage key is intentionally regenerated
 * from the newly created loanId instead of preserving any
 * previous customer-level or temporary storage key.
 */
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
}: LoanStudioProps) {
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
        const storageMode = getAuthenticatedStorageMode();

        const storageActivated =
          await storageManager.selectStorageMode(storageMode);

        if (!storageActivated.success) {
          throw new Error(
            storageActivated.error ??
              `Unable to restore FINORA ${storageMode} storage.`,
          );
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
     ----------------------------------------------------------
     Evidence belongs to the currently selected customer.

     It is intentionally cleared when the customer changes so
     evidence from Customer A can never leak into Customer B's
     loan workspace.
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

  const activeCustomerId = selectedCustomer?.customerId ?? customerId ?? "";

  const activeCustomerName =
    selectedCustomer?.customerName ?? customerName ?? "";

  const activeCustomerPhone =
    selectedCustomer?.phoneNumber ?? phoneNumber ?? "";

  /* ==========================================================
     WIZARD
  ========================================================== */

  const [step, setStep] = useState(1);

  /* ==========================================================
     LOAN DETAILS
  ========================================================== */

  const [loanAmount, setLoanAmount] = useState("");

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
        const storageMode = getAuthenticatedStorageMode();

        const storageActivated =
          await storageManager.selectStorageMode(storageMode);

        if (!storageActivated.success) {
          return;
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

  const reviewData: LoanReviewData = {
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

      documents: documents.length,
    });
  }

  function handleRejectLoan(): void {
    console.log("FINORA LOAN REJECT", {
      customerId: activeCustomerId,

      documents: documents.length,
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
       CREATE STABLE LOAN ID FIRST
       --------------------------------------------------------
       Documents need this ID to establish their permanent
       logical relationship with the loan.
    ======================================================== */

    const loanId = crypto.randomUUID();

    /* ========================================================
       PREPARE DOCUMENT EVIDENCE
       --------------------------------------------------------
       Step 3 documents are now explicitly linked to:
       - active customer
       - newly created loan
       - persistent logical storage key
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
       BUILD LOAN
    ======================================================== */

    const loan = buildLoan({
      id: loanId,

      title: loanTitle,

      amount: principal,

      outstanding: totalPayable,

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
       DOCUMENT ATTACHMENT
       --------------------------------------------------------
       The current Loan Builder contract predates the Documents
       Studio persistence fields.

       Preserve the existing Loan Builder contract and attach
       document metadata to the final Loan record through
       object spread.

       This keeps existing loan calculations and builder
       behavior unchanged while allowing Step 3 evidence
       to travel with the persisted loan.
    ======================================================== */

    const loanWithDocuments = {
      ...loan,

      documents: persistedDocuments,

      documentCount: persistedDocuments.length,

      documentsCustomerId: activeCustomerId,

      documentsLinkedAt: new Date().toISOString(),
    };

    /* ========================================================
       CREATE LOAN
    ======================================================== */

    const createResult = await createLoan(loanWithDocuments);

    if (!createResult.success) {
      console.error("LOAN CREATE ERROR:", createResult.error);

      alert(createResult.error ?? "Unable to create loan.");

      return;
    }

    /* ========================================================
       FINALIZE DOCUMENT STATE
       --------------------------------------------------------
       Keep the same evidence visible in the current Loan
       Studio, but now mark it as persisted and linked.
    ======================================================== */

    setDocuments(persistedDocuments);

    setLoanApproved(true);

    await refreshLoanStatistics();

    alert(
      persistedDocuments.length > 0
        ? `Loan Created Successfully with ${persistedDocuments.length} document${
            persistedDocuments.length === 1 ? "" : "s"
          }`
        : "Loan Created Successfully",
    );
  }

  /* ==========================================================
     RESET COMPLETED LOAN WORKSPACE
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
