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

import { useEffect, useMemo, useRef, useState } from "react";

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

import {
  createRejectedLoanApplication,
  createRejectedLoanApplicationIdentity,
} from "../../../../../services/loan-applications/rejectedLoanApplicationService";

import {
  archiveRejectedLoanDocuments,
} from "../../../../../services/loan-applications/rejectedLoanDocumentService";

import { buildGoldLoanStorageAllocationRequest } from "../../../../../services/gold-loan/goldLoanService";

import { allocatePersistedGoldStorage } from "../../../../../services/gold-loan/goldCustodyPersistenceService";

import {
  commitLoanDisbursementWalletCharge,
  preflightLoanDisbursementWalletCharge,
} from "../../../../../services/wallet/walletLoanDisbursementChargeService";

import { getSession } from "../../../../../store/authStore";

import {
  resolveBusinessDate,
} from "../../../../../services/business/businessDateService";

import {
  getCustomers,
  hydrateCustomersFromStorage,
  clearCustomerCache,
} from "../../../../../store/customers/customer.store";

import { storageManager } from "../../../../../storage/storageManager";

import type { LoanReviewData } from "../../../../loans/review/types";

import type { LoanStudioProps } from "./LoanStudio.types";

import {
  finoraError,
  finoraSuccess,
  finoraWarning,
} from "../../../../common/dialog/finoraDialog.service";

import {
  startFinoraProcessing,
  stopFinoraProcessing,
} from "../../../../common/feedback/finoraProcessing.service";

import {
  clearLoanWorkspaceDraft,
  loadLoanWorkspaceDraft,
  saveLoanWorkspaceDraft,
  type LoanWorkspaceDraftStep,
} from "./loanWorkspaceDraft";

import {
  clearLoanDocumentDrafts,
  loadLoanDocumentDraft,
  saveLoanDocumentDraft,
} from "./loanDocumentDraftStore";

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
  onGoldStepOneDetails,
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

  const authenticatedSession =
    getSession();

  const activeBusinessDate =
    resolveBusinessDate(
      authenticatedSession
        ?.businessDate,
    ) ?? "";

  const isGoldLoan = entryMode === "GOLD";

  const draftMode =
    isGoldLoan
      ? "GOLD"
      : "STANDARD";

  const initialWorkspaceDraft =
    useMemo(
      () =>
        loadLoanWorkspaceDraft(
          draftMode,
        ),
      [draftMode],
    );

  const initialDraftPayload =
    initialWorkspaceDraft?.payload ?? {};

  function readInitialDraftString(
    key: string,
    fallback = "",
  ): string {
    const value =
      initialDraftPayload[key];

    return typeof value === "string"
      ? value
      : fallback;
  }

  function readInitialDraftCustomer():
    LoanCustomerOption | undefined {
    const value =
      initialDraftPayload.selectedCustomer;

    if (
      typeof value !== "object" ||
      value === null
    ) {
      return undefined;
    }

    const customer =
      value as Record<string, unknown>;

    const restoredCustomerId =
      typeof customer.customerId === "string"
        ? customer.customerId
        : "";

    const restoredCustomerName =
      typeof customer.customerName === "string"
        ? customer.customerName
        : "";

    if (
      !restoredCustomerId ||
      !restoredCustomerName
    ) {
      return undefined;
    }

    return {
      customerId:
        restoredCustomerId,

      customerName:
        restoredCustomerName,

      phoneNumber:
        typeof customer.phoneNumber === "string"
          ? customer.phoneNumber
          : "",

      photo:
        typeof customer.photo === "string"
          ? customer.photo
          : undefined,
    };
  }

  function readInitialDraftDocuments():
    DocumentsStudioItem[] {
    const value =
      initialDraftPayload.documents;

    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter(
        (item): item is DocumentsStudioItem =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as DocumentsStudioItem).id === "string" &&
          typeof (item as DocumentsStudioItem).categoryId === "string" &&
          typeof (item as DocumentsStudioItem).name === "string",
      )
      .map((item) => ({
        ...item,

        url:
          item.dataUrl ||
          (
            typeof item.url === "string" &&
            !item.url.startsWith("blob:")
              ? item.url
              : ""
          ),
      }));
  }

  const initialDraftCustomerRef =
    useRef<LoanCustomerOption | undefined>(
      readInitialDraftCustomer(),
    );

  const initialDraftDocumentsRef =
    useRef<DocumentsStudioItem[]>(
      readInitialDraftDocuments(),
    );

  const initialDraftCustomer =
    initialDraftCustomerRef.current;

  const initialDraftDocuments =
    initialDraftDocumentsRef.current;

  const restoredDocumentsCustomerIdRef =
    useRef(
      initialDraftCustomer?.customerId ?? "",
    );

  const skipInitialGoldPrincipalSyncRef =
    useRef(
      isGoldLoan &&
      initialWorkspaceDraft !== null,
    );

  const suppressNextDraftAutosaveRef =
    useRef(false);

  /*
   * Successful completion / Reject is a terminal workspace
   * boundary. Resetting controlled state must never recreate
   * the just-cleared Loan draft through autosave.
   */
  const suppressLoanWorkspaceAutosaveRef =
    useRef(false);

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
    initialDraftCustomer ??
      (
        customerId && customerName
          ? {
              customerId,
              customerName,
              phoneNumber,
            }
          : undefined
      ),
  );

  useEffect(() => {
    if (initialDraftCustomer) {
      return;
    }

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
  }, [
    customerId,
    customerName,
    phoneNumber,
    customers,
    initialDraftCustomer,
  ]);

  /* ==========================================================
     STEP 3 — DOCUMENT EVIDENCE
  ========================================================== */

  const [documents, setDocuments] =
    useState<DocumentsStudioItem[]>(
      initialDraftDocuments,
    );

  useEffect(() => {
    const restoredCustomerId =
      restoredDocumentsCustomerIdRef.current;

    if (
      restoredCustomerId &&
      restoredCustomerId ===
        selectedCustomer?.customerId
    ) {
      restoredDocumentsCustomerIdRef.current =
        "";

      return;
    }

    setDocuments([]);
  }, [selectedCustomer?.customerId]);

  /*
   * Loan workspace draft keeps document metadata only.
   *
   * Large image / PDF content is restored from IndexedDB.
   */
  useEffect(() => {
    const draftDocuments =
      initialDraftDocumentsRef.current;

    if (draftDocuments.length === 0) {
      return;
    }

    let cancelled =
      false;

    void (async () => {
      const hydratedDocuments =
        await Promise.all(
          draftDocuments.map(
            async (document) => {
              /*
               * Backward compatibility for any older draft
               * that still contains an inline dataUrl.
               */
              if (document.dataUrl) {
                return {
                  ...document,

                  url:
                    document.dataUrl,
                };
              }

              const dataUrl =
                await loadLoanDocumentDraft(
                  draftMode,
                  document.id,
                );

              if (!dataUrl) {
                return document;
              }

              return {
                ...document,

                dataUrl,

                url:
                  dataUrl,
              };
            },
          ),
        );

      if (cancelled) {
        return;
      }

      setDocuments(
        hydratedDocuments,
      );
    })();

    return () => {
      cancelled =
        true;
    };
  }, [draftMode]);

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

  const [step, setStep] = useState<number>(
    initialWorkspaceDraft
      ? (
          isGoldLoan
            ? Math.max(
                2,
                initialWorkspaceDraft.step,
              )
            : initialWorkspaceDraft.step
        )
      : resolvedInitialStep,
  );

  /* ==========================================================
     LOAN DETAILS

     GOLD:
       initialLoanAmount = sanctioned Gold principal.

     STANDARD:
       remains empty unless explicitly supplied.
  ========================================================== */

  const [loanAmount, setLoanAmount] =
    useState(
      () =>
        readInitialDraftString(
          "loanAmount",
          resolvedInitialLoanAmount,
        ),
    );

  useEffect(() => {
    if (!isGoldLoan) {
      return;
    }

    if (
      skipInitialGoldPrincipalSyncRef.current
    ) {
      skipInitialGoldPrincipalSyncRef.current =
        false;

      return;
    }

    setLoanAmount(resolvedInitialLoanAmount);
  }, [isGoldLoan, resolvedInitialLoanAmount]);

  const [interest, setInterest] = useState(() => readInitialDraftString("interest"));

  const [processingFee, setProcessingFee] = useState(() => readInitialDraftString("processingFee"));

  const [advanceDeduction, setAdvanceDeduction] = useState(() => readInitialDraftString("advanceDeduction"));

  const [penaltyType, setPenaltyType] = useState(() => readInitialDraftString("penaltyType", "Fixed Amount"));

  const [penaltyValue, setPenaltyValue] = useState(() => readInitialDraftString("penaltyValue"));

  const [lateFee, setLateFee] = useState(() => readInitialDraftString("lateFee"));

  /* ==========================================================
     REPAYMENT
  ========================================================== */

  const [emiCalculation, setEMICalculation] =
    useState<EMICalculationMode>(
      () =>
        readInitialDraftString(
          "emiCalculation",
          "interestOnly",
        ) as EMICalculationMode,
    );

  const [firstInstallmentDate, setFirstInstallmentDate] = useState(() => readInitialDraftString("firstInstallmentDate"));

  const [repaymentType, setRepaymentType] = useState(() => readInitialDraftString("repaymentType"));

  const [duration, setDuration] = useState(() => readInitialDraftString("duration"));

  const [durationType, setDurationType] = useState(() => readInitialDraftString("durationType", "months"));

  /* ==========================================================
     STEP 1 → STEP 2 REPAYMENT SYNC
  ========================================================== */

  const syncedRepaymentType =
    durationType === "months"
      ? "MONTHLY"
      : durationType === "years"
        ? "YEARLY"
        : "";

  useEffect(() => {
    setRepaymentType(syncedRepaymentType);
  }, [syncedRepaymentType]);

  /* ==========================================================
     GUARANTOR
  ========================================================== */

  const [guarantorName, setGuarantorName] = useState(() => readInitialDraftString("guarantorName"));

  const [guarantorPhone, setGuarantorPhone] = useState(() => readInitialDraftString("guarantorPhone"));

  const [guarantorOccupation, setGuarantorOccupation] = useState(() => readInitialDraftString("guarantorOccupation"));

  const [guarantorAddress, setGuarantorAddress] = useState(() => readInitialDraftString("guarantorAddress"));

  const [guarantorRelationship, setGuarantorRelationship] = useState(() => readInitialDraftString("guarantorRelationship"));

  // ==========================================================
  // GUARANTOR VERIFICATION
  // ==========================================================

  const [guarantorVerificationStatus, setGuarantorVerificationStatus] =
    useState(
      () =>
        readInitialDraftString(
          "guarantorVerificationStatus",
          "pending",
        ),
    );

  const [guarantorIdentityVerification, setGuarantorIdentityVerification] =
    useState(
      () =>
        readInitialDraftString(
          "guarantorIdentityVerification",
          "aadhaar",
        ),
    );

  /* ==========================================================
     NOTES
  ========================================================== */

  const [purpose, setPurpose] = useState(() => readInitialDraftString("purpose"));

  const [remarks, setRemarks] = useState(() => readInitialDraftString("remarks"));

  /* ==========================================================
     APPROVAL
  ========================================================== */

  const [loanApproved, setLoanApproved] = useState(false);

  const [isLoanProcessing, setIsLoanProcessing] =
    useState(false);

  /* ==========================================================
     FINORA GLOBAL LOAN PROCESSING
  ========================================================== */

  useEffect(() => {
    if (!isLoanProcessing) {
      return;
    }

    const processingId =
      startFinoraProcessing(
        "Creating Loan...",
      );

    return () => {
      stopFinoraProcessing(
        processingId,
      );
    };
  }, [isLoanProcessing]);

  const loanStatus = loanApproved ? "Approved" : "Pending Approval";

  /* ==========================================================
     DISBURSEMENT
  ========================================================== */

  /**
   * Disbursement Date is locked to the authenticated ERP
   * Business Date. The Step 6 field remains controlled and
   * cannot override the active session date.
   */
  const disbursementDate =
    activeBusinessDate;


  const [paymentMode, setPaymentMode] = useState(() => readInitialDraftString("paymentMode", "cash"));

  const [transactionStatus, setTransactionStatus] = useState(() => readInitialDraftString("transactionStatus", "pending"));

  const [disbursementSavedAt, setDisbursementSavedAt] = useState(() => readInitialDraftString("disbursementSavedAt", "Not Saved"));

  const [disbursementDraftStatus, setDisbursementDraftStatus] = useState<
    "Draft" | "Completed"
  >(
    () =>
      readInitialDraftString(
        "disbursementDraftStatus",
        "Draft",
      ) as "Draft" | "Completed",
  );

  const [disbursementReceiptNumber, setDisbursementReceiptNumber] = useState(
    () =>
      readInitialDraftString(
        "disbursementReceiptNumber",
        `DIS-${Date.now()}`,
      ),
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
      const normalizedCustomerId = activeCustomerId.trim();

      if (!normalizedCustomerId) {
        setLoanStatistics({
          totalLoans: 0,

          activeLoans: 0,

          totalDisbursed: 0,
        });

        return;
      }

      const loans = await fetchLoans();

      const customerLoans = loans.filter((loan) => {
        const record = loan as unknown as Record<string, unknown>;

        const loanCustomerId = String(record.customerId ?? "").trim();

        return loanCustomerId === normalizedCustomerId;
      });

      const totalLoans = customerLoans.length;

      const activeLoans = customerLoans.filter((loan) => {
        const record = loan as unknown as Record<string, unknown>;

        const status = String(record.status ?? "")
          .trim()
          .toUpperCase();

        const outstanding = Number(record.outstanding ?? 0);

        return (status === "ACTIVE" || status === "RUNNING") && outstanding > 0;
      }).length;

      const totalDisbursed = customerLoans.reduce((total, loan) => {
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
  }, [activeCustomerId]);

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
        : 0;

  const flatTotalInterest = Math.round(monthlyInterestAmount * interestMonths);

  const flatTotalPayable = Math.round(principal + flatTotalInterest);

  const durationDays =
    durationType === "years"
      ? durationValue * 365
      : durationType === "months"
        ? durationValue * 30
        : 0;

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
      : normalizedRepaymentType === "MONTHLY" ||
          normalizedRepaymentType === "YEARLY"
        ? Math.max(1, Math.round(durationValue))
        : 0;

  /* ==========================================================
     LOAN DATES
  ========================================================== */

  const loanDate =
    new Date(
      `${activeBusinessDate}T00:00:00.000Z`,
    );

  const scheduleStartDate = firstInstallmentDate
    ? new Date(`${firstInstallmentDate}T00:00:00`)
    : new Date(loanDate);

  const maturityDate =
    durationValue > 0 && durationType ? new Date(loanDate) : null;

  if (maturityDate) {
    switch (durationType) {
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
    (normalizedRepaymentType === "MONTHLY" ||
      normalizedRepaymentType === "YEARLY")
      ? generateSchedule(
          totalInstallments,

          scheduleStartDate,

          normalizedRepaymentType.toLowerCase() as
            | "monthly"
            | "yearly",

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

  /* ==========================================================
     DURABLE LOAN WORKSPACE DRAFT

     Draft survives:
     - Back to Loans Office
     - Reload
     - Logout / Login
     - App close / reopen

     Draft is cleared only after:
     - explicit Reject
     - successful Loan creation
  ========================================================== */

  async function persistCurrentLoanWorkspaceDraft(
    overrides: {
      disbursementSavedAt?: string;
      disbursementDraftStatus?: "Draft" | "Completed";
    } = {},
  ): Promise<boolean> {
    const existingDraft =
      loadLoanWorkspaceDraft(
        draftMode,
      );

    /*
     * Large document content belongs in IndexedDB.
     *
     * Save binary content before publishing the lightweight
     * Loan workspace metadata snapshot into localStorage.
     */
    const documentSaveResults =
      await Promise.all(
        documents.map(
          async (document) => {
            if (!document.dataUrl) {
              return true;
            }

            return saveLoanDocumentDraft(
              draftMode,
              document.id,
              document.dataUrl,
            );
          },
        ),
      );

    if (
      documentSaveResults.some(
        (saved) => !saved,
      )
    ) {
      console.error(
        "FINORA LOAN DOCUMENT DRAFT AUTOSAVE FAILED",
      );

      return false;
    }

    /*
     * Keep workspace JSON lightweight.
     *
     * Never place dataUrl, blob: URLs or data: URLs
     * inside the localStorage Loan draft.
     */
    const safeDocuments =
      documents.map(
        (document) => {
          const {
            dataUrl: _dataUrl,
            ...metadata
          } = document;

          void _dataUrl;

          return {
            ...metadata,

            url:
              typeof document.url === "string" &&
              !document.url.startsWith("blob:") &&
              !document.url.startsWith("data:")
                ? document.url
                : "",
          };
        },
      );

    const safeStep =
      Math.min(
        6,
        Math.max(
          1,
          Math.round(step),
        ),
      ) as LoanWorkspaceDraftStep;

    /*
     * Do not create a completely empty Standard Loan draft
     * merely because the user opened Loan Studio.
     *
     * Once a draft already exists, empty/cleared field changes
     * must still be persisted so stale values do not return.
     */
    const hasMeaningfulWorkspaceData =
      safeStep > 1 ||
      safeDocuments.length > 0 ||
      Boolean(loanAmount) ||
      Boolean(interest) ||
      Boolean(processingFee) ||
      Boolean(advanceDeduction) ||
      Boolean(penaltyValue) ||
      Boolean(lateFee) ||
      Boolean(firstInstallmentDate) ||
      Boolean(duration) ||
      Boolean(guarantorName) ||
      Boolean(guarantorPhone) ||
      Boolean(guarantorOccupation) ||
      Boolean(guarantorAddress) ||
      Boolean(guarantorRelationship) ||
      Boolean(purpose) ||
      Boolean(remarks) ||
      disbursementSavedAt !== "Not Saved" ||
      disbursementDraftStatus !== "Draft";

    /*
     * Customer selection alone is not a Loan draft.
     *
     * Default repayment frequency is also intentionally excluded
     * because Step 1 synchronizes it automatically.
     *
     * When no real Loan work remains, remove any older stale
     * customer-only/default draft so refresh opens a fresh studio.
     */
    if (
      !hasMeaningfulWorkspaceData
    ) {
      if (existingDraft) {
        clearLoanWorkspaceDraft(
          draftMode,
        );
      }

      return true;
    }

    return saveLoanWorkspaceDraft({
      version: 1,

      mode:
        draftMode,

      step:
        safeStep,

      savedAt:
        new Date().toISOString(),

      payload: {
        /*
         * Preserve fields owned by surrounding Gold workflow
         * or future draft schema extensions.
         */
        ...(existingDraft?.payload ?? {}),

        selectedCustomer,

        documents:
          safeDocuments,

        loanAmount,

        interest,

        processingFee,

        advanceDeduction,

        penaltyType,

        penaltyValue,

        lateFee,

        emiCalculation,

        firstInstallmentDate,

        repaymentType,

        duration,

        durationType,

        guarantorName,

        guarantorPhone,

        guarantorOccupation,

        guarantorAddress,

        guarantorRelationship,

        guarantorVerificationStatus,

        guarantorIdentityVerification,

        purpose,

        remarks,

        paymentMode,

        transactionStatus,

        disbursementSavedAt:
          overrides.disbursementSavedAt ??
          disbursementSavedAt,

        disbursementDraftStatus:
          overrides.disbursementDraftStatus ??
          disbursementDraftStatus,

        disbursementReceiptNumber,
      },
    });
  }

  useEffect(() => {
    if (
      suppressLoanWorkspaceAutosaveRef.current
    ) {
      return;
    }

    if (
      suppressNextDraftAutosaveRef.current
    ) {
      suppressNextDraftAutosaveRef.current =
        false;

      return;
    }

    void persistCurrentLoanWorkspaceDraft();
  }, [
    draftMode,

    step,

    selectedCustomer,

    documents,

    loanAmount,

    interest,

    processingFee,

    advanceDeduction,

    penaltyType,

    penaltyValue,

    lateFee,

    emiCalculation,

    firstInstallmentDate,

    repaymentType,

    duration,

    durationType,

    guarantorName,

    guarantorPhone,

    guarantorOccupation,

    guarantorAddress,

    guarantorRelationship,

    guarantorVerificationStatus,

    guarantorIdentityVerification,

    purpose,

    remarks,

    paymentMode,

    transactionStatus,

    disbursementSavedAt,

    disbursementDraftStatus,

    disbursementReceiptNumber,
  ]);
  async function handleSaveDraft():
    Promise<void> {
    const savedAt =
      new Date().toISOString();

    const saved =
      await persistCurrentLoanWorkspaceDraft({
        disbursementSavedAt:
          savedAt,

        disbursementDraftStatus:
          "Draft",
      });

    console.log("FINORA LOAN SAVE DRAFT", {
      customerId: activeCustomerId,

      entryMode,

      documents: documents.length,

      guarantorVerificationStatus,

      guarantorIdentityVerification,

      savedAt,

      saved,
    });

    if (!saved) {
      await finoraError(
        "Unable to save the Loan Application draft. Please try again.",
        {
          heading:
            "Draft Save Failed",
        },
      );

      return;
    }

    /*
     * State mirrors the exact values already persisted above.
     * Prevent the state update from performing a duplicate save.
     */
    suppressNextDraftAutosaveRef.current =
      true;

    setDisbursementSavedAt(
      savedAt,
    );

    setDisbursementDraftStatus(
      "Draft",
    );

    const savedAtDisplay =
      new Intl.DateTimeFormat(
        "en-IN",
        {
          dateStyle: "medium",

          timeStyle: "short",
        },
      ).format(
        new Date(savedAt),
      );

    /*
     * Publish the premium popup while Loan Studio is still mounted.
     * The global App-level host keeps it alive after navigation.
     */
    const confirmation =
      finoraSuccess(
        `Loan Application draft saved successfully.\n\nSaved at: ${savedAtDisplay}`,
        {
          heading:
            "Draft Saved",
        },
      );

    /*
     * Return to Loans Office immediately after successful save.
     * The draft and its IndexedDB documents are not cleared.
     */
    window.dispatchEvent(
      new CustomEvent(
        "FINORA_V2_LOAN_WORKFLOW_COMPLETED",
      ),
    );

    await confirmation;
  }

  async function handleRejectLoan(
    rejectionReasonInput: string,
  ): Promise<void> {
    const rejectionReason =
      String(
        rejectionReasonInput ?? "",
      ).trim();

    if (!rejectionReason) {
      await finoraWarning(
        "Rejection reason is required.",
      );

      return;
    }

    if (
      transactionStatus !== "pending"
    ) {
      await finoraWarning(
        "Only a Pending Loan transaction can be rejected.",
      );

      return;
    }

    const processingId =
      startFinoraProcessing(
        "Rejecting & Archiving Loan Application...",
      );

    try {
      /* ======================================================
         PUBLISH CURRENT WORKSPACE SNAPSHOT
      ====================================================== */

      const draftSaved =
        await persistCurrentLoanWorkspaceDraft();

      if (!draftSaved) {
        stopFinoraProcessing(
          processingId,
        );

        await finoraError(
          "Unable to preserve the current Loan Application draft.",
        );

        return;
      }

      const snapshot =
        loadLoanWorkspaceDraft(
          draftMode,
        );

      if (!snapshot) {
        stopFinoraProcessing(
          processingId,
        );

        await finoraError(
          "Unable to load the Loan Application snapshot for rejection.",
        );

        return;
      }

      /* ======================================================
         ARCHIVE DOCUMENT CONTENT BEFORE METADATA
      ====================================================== */

      const identity =
        createRejectedLoanApplicationIdentity();

      const documentArchiveResult =
        await archiveRejectedLoanDocuments(
          identity.id,
          draftMode,
          documents,
        );

      if (!documentArchiveResult.success) {
        stopFinoraProcessing(
          processingId,
        );

        await finoraError(
          documentArchiveResult.error ??
            "Unable to preserve rejected Loan documents.",
        );

        return;
      }

      /* ======================================================
         PERSIST REJECTED APPLICATION
      ====================================================== */

      const rejectedResult =
        await createRejectedLoanApplication({
          identity,

          snapshot,

          rejectionReason,

          customerId:
            activeCustomerId,

          customerName:
            activeCustomerName,

          customerPhone:
            activeCustomerPhone,

          requestedAmount:
            parseNumericValue(loanAmount),

          documentIds:
            documents.map(
              (document) => document.id,
            ),
        });

      if (
        !rejectedResult.success ||
        !rejectedResult.data
      ) {
        stopFinoraProcessing(
          processingId,
        );

        await finoraError(
          rejectedResult.error ??
            "Unable to archive the rejected Loan Application.",
        );

        return;
      }

      console.log(
        "FINORA LOAN APPLICATION REJECTED",
        {
          applicationId:
            rejectedResult.data.id,

          applicationReference:
            rejectedResult.data.applicationReference,

          customerId:
            activeCustomerId,

          entryMode,

          documents:
            documents.length,

          rejectionReason,
        },
      );

      /* ======================================================
         TERMINAL ACTIVE WORKSPACE CLEANUP
      ====================================================== */

      await clearLoanDocumentDrafts(
        draftMode,
      );

      suppressLoanWorkspaceAutosaveRef.current =
        true;

      clearLoanWorkspaceDraft(
        draftMode,
      );

      suppressNextDraftAutosaveRef.current =
        true;

      stopFinoraProcessing(
        processingId,
      );

      const rejectionConfirmation =
        finoraSuccess(
          "Loan Application Rejected and Archived." +
            `\nReference: ${rejectedResult.data.applicationReference}`,
        );

      resetLoanWorkspace();

      window.dispatchEvent(
        new CustomEvent(
          "FINORA_V2_LOAN_WORKFLOW_COMPLETED",
        ),
      );

      await rejectionConfirmation;
    } finally {
      stopFinoraProcessing(
        processingId,
      );
    }
  }

  /* ==========================================================
     APPROVE / CREATE LOAN
  ========================================================== */

  async function executeApproveLoan(): Promise<void> {
    /* ========================================================
       ERP BUSINESS DATE SAFETY

       Loan creation must fail closed when the authenticated
       session does not contain a valid Login Business Date.

       No duplicate check, Wallet operation, number reservation
       or Loan persistence may begin without this date.
    ======================================================== */

    if (!activeBusinessDate) {
      await finoraWarning(
        "A valid FINORA Login Date is required. Please logout and login again.",
      );

      return;
    }

    if (loanApproved) {
      await finoraWarning("Loan already created");

      return;
    }

    if (
      transactionStatus.trim().toLowerCase() !==
        "completed"
    ) {
      await finoraWarning(
        "Transaction Status must be Completed before creating the Loan.",
      );

      return;
    }

    const normalizedRepaymentTypeValue = syncedRepaymentType;

    const normalizedLoanTypeValue = normalizeLoanType(repaymentType);

    if (!normalizedLoanTypeValue) {
      await finoraWarning("Please select a valid Loan Type");

      return;
    }

    if (!normalizedRepaymentTypeValue) {
      await finoraWarning("Please select Duration Unit in Step 1");

      return;
    }

    if (!activeCustomerId) {
      await finoraWarning("Please select a customer before approving the loan.");

      return;
    }

    const loanTitle = getLoanTypeLabel(normalizedLoanTypeValue);


    /* ========================================================
       FINORA WALLET CHARGE PREFLIGHT

       The Loan operation must not begin unless the active
       scoped Wallet can cover the configured platform fee.

       This preflight does not mutate Wallet state.
    ======================================================== */

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

      await finoraError(
        walletChargePreflight.error,
      );

      return;
    }

    setIsLoanProcessing(true);

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

      await finoraError("Unable to prepare loan documents. Please try again.");

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

      await finoraError(
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
      interestType: emiCalculation,

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
      await finoraWarning(
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

      await finoraError(createResult.error ?? "Unable to create loan.");

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

          await finoraError(
            "CRITICAL CONSISTENCY ERROR: the Gold Loan was created, but authenticated custody identity was unavailable and automatic Loan rollback failed. Do not create another Gold Loan until this record is reviewed.",
          );

          return;
        }

        await finoraError(
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

          await finoraError(
            "CRITICAL CONSISTENCY ERROR: Gold Loan identity was incomplete after persistence and automatic Loan rollback failed.",
          );

          return;
        }

        await finoraError(
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

          await finoraError(
            "CRITICAL CONSISTENCY ERROR: the Gold Loan was created but physical custody allocation failed, and automatic Loan rollback also failed. Do not create another Gold Loan until this record is reviewed.",
          );

          return;
        }

        await finoraError(
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

      await finoraError(
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
         PREMIUM SUCCESS CONFIRMATION

         Publish the success dialog before closing Loan Studio.

         FinoraDialogHost belongs to the App root and therefore
         remains visible over Loans Office during navigation.

         Failed Loan creation never reaches this cleanup block.
      ======================================================== */

      const loanSuccessMessage =
        persistedDocuments.length > 0
          ? `Loan Created Successfully with ${persistedDocuments.length} document${
              persistedDocuments.length === 1 ? "" : "s"
            }`
          : "Loan Created Successfully";

      const confirmation =
        finoraSuccess(
          `${loanSuccessMessage}

Loan Number: ${finalizedLoanNumber}
FINORA Wallet Fee: ₹${walletChargeResult.data.amount}
Available Balance: ₹${walletChargeResult.data.availableBalance}`,
          {
            heading:
              "Loan Created Successfully",
          },
        );

      /* ========================================================
         TERMINAL LOAN WORKSPACE CLEANUP
      ======================================================== */

      suppressLoanWorkspaceAutosaveRef.current =
        true;

      suppressNextDraftAutosaveRef.current =
        true;

      resetLoanWorkspace();

      void clearLoanDocumentDrafts(
        draftMode,
      ).catch((error) => {
        console.error(
          "FINORA LOAN DOCUMENT DRAFT CLEANUP ERROR:",
          error,
        );
      });

      clearLoanWorkspaceDraft(
        draftMode,
      );

      /*
       * Return both Standard and Gold workflows to Loans Office.
       * Premium success confirmation remains visible above it.
       */
      window.dispatchEvent(
        new CustomEvent(
          "FINORA_V2_LOAN_WORKFLOW_COMPLETED",
        ),
      );

      await confirmation;
  }


  /* ==========================================================
     APPROVE / CREATE LOAN — GLOBAL PROCESSING WRAPPER
  ========================================================== */

  async function handleApproveLoan(): Promise<void> {
    /*
     * Validation failures must not enter the global
     * Creating Loan processing state.
     */
    if (
      transactionStatus.trim().toLowerCase() !==
        "completed"
    ) {
      await finoraWarning(
        "Transaction Status must be Completed before creating the Loan.",
      );

      return;
    }


    try {
      await executeApproveLoan();
    } finally {
      setIsLoanProcessing(false);
    }
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

    setEMICalculation("interestOnly");

    setFirstInstallmentDate("");

    setRepaymentType("MONTHLY");

    setDuration("");

    setDurationType("months");

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

    onGoldStepOneDetails,

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

    isLoanProcessing,

    resetLoanWorkspace,
  };
}
