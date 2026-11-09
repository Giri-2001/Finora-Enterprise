import { useRef as useCollectionSaveRef } from "react";
import {
  previewManualCollectionSettlement,
  getUnnormalizedLoanForAtomicPreflight,
  prepareManualLoanForAtomicSettlement,
} from "../../../repositories/loan/loanRepository";
import {
  projectManualPenaltyScheduleSettlement,
} from "../../../repositories/loan/manualPenaltyScheduleSettlement";
import {
  prepareManualAtomicSettlementRequest,
} from "../../../storage/manualAtomicSettlementRequest";
import {
  prepareSelectedEmiWaiverAtomicRequest,
} from "../../../storage/selectedEmiWaiverAtomicRequest";
import {
  projectSelectedEmiWaiverLoan,
} from "../../../repositories/loan/selectedEmiWaiverLoanProjection";
import {
  prepareCollectionRecordForSettlement,
} from "../../../repositories/collection/collectionRepository";
import {
  prepareApprovedCollectionForSettlement,
} from "../../../services/collection/collectionService";
import {
  submitPaisaruleAtomicCollection,
} from "../../../storage/usbBridge";
import {
  consumeFinoraPostCollectionOperationStage,
} from "../../../services/activation/finoraCommercialWriteOperation";
// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// PAYMENT DETAILS + COLLECTION ACTIONS
//
// RESPONSIBILITY
//
// - Display the session-locked Collection Business Date
// - Capture payment mode
// - Capture reference number
// - Capture remarks
// - Save the current collection
// - Apply approved discount / waiver to Loan settlement
// - Generate a unique receipt for every transaction
// - Save collection and open a printable receipt
// - Reset transaction-entry fields after successful save
//
// IMPORTANT
//
// - Controller remains the source of truth.
// - Persistence remains behind LoanService / CollectionService.
// - No direct repository access.
// - No localStorage access.
// - No financial calculation engine here.
// - Collection amount comes from Step 4 / controller.
// - Discount and manual principal remain editable in Step 4.
//
// SETTLEMENT CONTRACT
//
// Actual Payment:
//
//   reviewData.paymentAmount
//
// Discount:
//
//   reviewData.discountAmount
//
// Total Liability Reduction:
//
//   paymentAmount + discountAmount
//
// Example:
//
//   Current outstanding = ₹9,250
//   Customer pays       = ₹9,100
//   Discount            = ₹  150
//
//   Settlement reduction = ₹9,250
//   Final outstanding    = ₹0
//
// IMPORTANT:
//
// - Collection History records ₹9,100 as Collected.
// - ₹150 is a discount / waiver, NOT received cash.
// - LoanRepository receives discount separately.
// - EMI paidAmount receives actual payment only.
// - Discount never becomes fake EMI payment.
// - If payment + discount closes the Loan, repository finalizes
//   the remaining contractual EMI liability as Preclosed.
//
// RECEIPT RULE
//
// Every new collection gets:
//
// - Fresh receipt number
// - Fresh createdAt
// - Fresh updatedAt
//
// Previous receipt numbers are never reused.
//
// POST-SAVE RESET
//
// A successful collection starts a fresh transaction form.
//
// Reset:
//
// - paymentAmount
// - advanceAdjustment
// - discountAmount
// - selectedEmiNumbers
// - selectedEmiAmount
// - paymentReference
// - remarks
// - collectionNumber
// - receiptNumber
//
// Defaults:
//
// - receiptDate   = active Login Business Date
// - paymentMethod = cash
//
// CollectionEntry receives:
//
//   FINORA_COLLECTION_FORM_RESET
//
// and resets local presentation state:
//
// - mode -> EMI COLLECTION
// - EMI selection -> empty
// - dropdown -> closed
//
// Customer / Loan identity is NOT manually cleared here.
//
// VERSION : 2.6
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  beginFinoraPostCollectionOperation,
} from "../../../services/activation/finoraCommercialWriteOperation";

import {
  finoraError,
  finoraWarning,
} from "../../common/dialog/finoraDialog.service";

import { FinoraCalendar } from "../../common/calendar";

import {
  useEffect,
  useState,
} from "react";

import { WalletCards } from "lucide-react";

import { useCollectionController } from "../controller";

import {
  startFinoraProcessing,
  stopFinoraProcessing,
} from "../../common/feedback/finoraProcessing.service";

import { updateLoanOutstandingAmount } from "../../../services/loan/loanService";

import {
  approveCollection,
  loadCollections,
} from "../../../services/collection/collectionService";

import {
  resolveMinimumCollectionDate,
  resolveOperationalDate,
  validateCollectionDate,
} from "../../../services/collection/collectionDateService";

import {
  getSession,
  updateSessionBusinessDate,
} from "../../../store/authStore";

import {
  getBusinessContext,
} from "../../../services/business/businessContextService";



import {
  getCurrentLocalBusinessDate,
  resolveBusinessDate,
} from "../../../services/business/businessDateService";

import {
  previewNextCollectionReceiptPair,
  reserveNextCollectionReceiptPair,
} from "../../../services/numbering/collectionSequenceService";

import { collectionPaymentDetailsStyles } from "./PaymentDetails.styles";

import { useResponsive } from "../../../utils/responsive";

import {
  createPaymentDetailsBodyStyle,
  createPaymentDetailsFieldStyle,
  createPaymentDetailsRemarksStyle,
  createPaymentDetailsTotalStyle,
  createPaymentDetailsActionsStyle,
  createPaymentDetailsInputStyle,
  createPaymentDetailsTextareaStyle,
  createPaymentDetailsButtonStyle,
} from "../../../utils/responsive/collections/collectionStudio.layout";

// ============================================================
// HELPERS
// ============================================================

function safeNumber(value: unknown): number {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}


// ============================================================
// CURRENCY
// ============================================================

function formatCurrency(value: number): string {
  return `₹ ${Math.round(safeNumber(value)).toLocaleString("en-IN")}`;
}

function escapeReceiptHtml(
  value:
    unknown,
): string {

  return String(
    value ??
    "",
  )
    .replace(
      /&/g,
      "&amp;",
    )
    .replace(
      /</g,
      "&lt;",
    )
    .replace(
      />/g,
      "&gt;",
    )
    .replace(
      /"/g,
      "&quot;",
    )
    .replace(
      /'/g,
      "&#039;",
    );
}

// ============================================================
// COMPONENT
// ============================================================

export default function PaymentDetails({ refreshReady }: { refreshReady: boolean }) {
  const { reviewData, updateField } = useCollectionController();

  // ==========================================================
  // ERP BUSINESS DATE
  // ==========================================================

  const authenticatedSession =
    getSession();

  const activeBusinessDate =
    resolveBusinessDate(
      authenticatedSession
        ?.businessDate,
    ) ?? "";

  function handleCollectionBusinessDateChange(
    nextDate: string,
  ): void {
    const resolvedDate =
      resolveBusinessDate(nextDate);

    if (!resolvedDate) {
      return;
    }

    const currentLocalBusinessDate =
      getCurrentLocalBusinessDate();

    if (resolvedDate > currentLocalBusinessDate) {
      void finoraWarning(
        "Collection Date cannot be later than today.",
      );

      return;
    }

    const updatedSession =
      updateSessionBusinessDate(resolvedDate);

    if (!updatedSession) {
      return;
    }

    updateField(
      "receiptDate",
      resolvedDate,
    );
  }
  useEffect(() => {
    if (
      activeBusinessDate &&
      !reviewData.receiptDate
    ) {
      updateField(
        "receiptDate",
        activeBusinessDate,
      );
    }
  }, [
    activeBusinessDate,
    reviewData.receiptDate,
  ]);

  // ==========================================================
  // FINORA RESPONSIVE ENGINE
  // ==========================================================

  const { viewport, tokens } = useResponsive();

  const responsiveBodyStyle = {
    ...collectionPaymentDetailsStyles.body,
    ...createPaymentDetailsBodyStyle(tokens, viewport),
    display: "grid" as const,
    gridTemplateColumns:
      viewport === "mobile"
        ? "minmax(0, 1fr)"
        : viewport === "tablet"
          ? "repeat(3, minmax(0, 1fr))"
          : "repeat(4, minmax(0, 1fr))",
    gap: "10px",
    alignItems: "end",
  };

  const responsiveFieldStyle = {
    ...collectionPaymentDetailsStyles.field,
    ...createPaymentDetailsFieldStyle(viewport),
    gridColumn: "auto",
    gridRow: "auto",
    minWidth: 0,
  };

  const responsiveRemarksStyle = {
    ...collectionPaymentDetailsStyles.remarksField,
    ...createPaymentDetailsRemarksStyle(viewport),
    gridColumn: "auto",
    gridRow: "auto",
    minWidth: 0,
  };

  const responsiveTotalStyle = {
    ...collectionPaymentDetailsStyles.totalBar,
    ...createPaymentDetailsTotalStyle(viewport),
    gridColumn: "auto",
    gridRow: "auto",
    minWidth: 0,
    width: "100%",
  };

  const responsiveActionsStyle = {
    ...collectionPaymentDetailsStyles.actions,
    display: "contents" as const,
  };

  const responsiveInputStyle = {
    ...collectionPaymentDetailsStyles.input,

    ...createPaymentDetailsInputStyle(tokens, viewport),
  };

  const responsiveTextareaStyle = {
    ...collectionPaymentDetailsStyles.textarea,

    ...createPaymentDetailsTextareaStyle(tokens, viewport),
  };

  const responsiveSaveButtonStyle = {
    ...collectionPaymentDetailsStyles.receiptButton,
    ...createPaymentDetailsButtonStyle(tokens, viewport),
    gridColumn: "auto",
    gridRow: "auto",
    width: "100%",
    minWidth: 0,
  };

  // ==========================================================
  // SAVING STATE
  // ==========================================================

  const [saving, setSaving] = useState(false);
  const [savedCollectionPopup, setSavedCollectionPopup] = useState<{
    amount: number;
    penalty: number;
    discount: number;
    customer: string;
    number: string;
    paymentMode: string;
    closed: boolean;
    nextEmiAdjustment?: {
      emiNumber: number;
      amount: number;
    };
  } | null>(null);


  // ==========================================================
  // COLLECTION DATE LEDGER BOUNDARY
  // ==========================================================
  //
  // First Collection:
  //   Loan Date (same day allowed)
  //
  // Later Collections:
  //   Latest saved Collection Date
  //
  // Multiple Collections on the same operational date remain
  // valid. A new Collection cannot move the ledger backwards.
  // ==========================================================

  const [
    latestCollectionDate,
    setLatestCollectionDate,
  ] = useState("");

  const [
    collectionDateLedgerReady,
    setCollectionDateLedgerReady,
  ] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loanId =
      String(
        reviewData.loanId ?? "",
      ).trim();

    setLatestCollectionDate("");
    setCollectionDateLedgerReady(false);

    if (!loanId) {
      setCollectionDateLedgerReady(true);

      return () => {
        cancelled = true;
      };
    }

    async function loadCollectionDateBoundary(): Promise<void> {
      try {
        const savedCollections =
          await loadCollections();

        if (cancelled) {
          return;
        }

        const savedDates =
          savedCollections
            .filter(
              (collection) =>
                String(
                  collection.loanId ?? "",
                ).trim() === loanId,
            )
            .map(
              (collection) =>
                resolveOperationalDate(
                  collection.receiptDate,
                ),
            )
            .filter(
              (value): value is string =>
                Boolean(value),
            )
            .sort();

        const latestDate =
          savedDates.length > 0
            ? savedDates[
                savedDates.length - 1
              ]
            : "";

        setLatestCollectionDate(
          latestDate,
        );

        setCollectionDateLedgerReady(
          true,
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "FINORA COLLECTION DATE LEDGER ERROR:",
          error,
        );

        setLatestCollectionDate("");
        setCollectionDateLedgerReady(false);
      }
    }

    void loadCollectionDateBoundary();

    return () => {
      cancelled = true;
    };
  }, [
    reviewData.loanId,
  ]);

  const minimumCollectionDate =
    resolveMinimumCollectionDate(
      reviewData.loanDate,
      latestCollectionDate,
    ) ?? "";

  // ==========================================================
  // COLLECTION / RECEIPT NUMBER PREVIEW
  //
  // Preview is non-consuming.
  //
  // Final authoritative reservation still occurs only inside
  // handleSaveCollection() after validation succeeds.
  // ==========================================================

  const [
    numberingPreview,
    setNumberingPreview,
  ] = useState({
    collectionNumber: "",
    receiptNumber: "",
  });

  const [
    numberingPreviewVersion,
    setNumberingPreviewVersion,
  ] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const customerId =
      reviewData.customerId.trim();

    const loanNumber =
      reviewData.loanNumber.trim();

    if (!customerId || !loanNumber) {
      setNumberingPreview({
        collectionNumber: "",
        receiptNumber: "",
      });

      return () => {
        cancelled = true;
      };
    }

    async function loadNumberingPreview(): Promise<void> {
      const result =
        await previewNextCollectionReceiptPair(
          customerId,
          loanNumber,
        );

      if (cancelled) {
        return;
      }

      if (
        !result.success ||
        !result.data
      ) {
        console.error(
          "FINORA COLLECTION NUMBER PREVIEW ERROR:",
          result.error ??
            "Unable to preview Collection / Receipt Numbers.",
        );

        setNumberingPreview({
          collectionNumber: "",
          receiptNumber: "",
        });

        return;
      }

      setNumberingPreview({
        collectionNumber:
          result.data.collectionNumber,

        receiptNumber:
          result.data.receiptNumber,
      });
    }

    void loadNumberingPreview();

    return () => {
      cancelled = true;
    };
  }, [
    reviewData.customerId,
    reviewData.loanNumber,
    numberingPreviewVersion,
  ]);

  // ==========================================================
  // CURRENT COLLECTION VALUES
  // ==========================================================

  const collectionAmount = safeNumber(reviewData.paymentAmount);

  const discountAmount = safeNumber(reviewData.discountAmount);
  const penaltyAmount = safeNumber(reviewData.penaltyAmount);

  const manualPrincipal = safeNumber(reviewData.advanceAdjustment);

  // ==========================================================
  // ACTUAL COLLECTION
  // ==========================================================

  const finalCollection = collectionAmount;

  // ==========================================================
  // TOTAL SETTLEMENT REDUCTION
  // ==========================================================

  const currentOutstanding =
    safeNumber(reviewData.outstandingBalance);

  // ==========================================================
  // FINAL SETTLEMENT EXCESS -> OVERDUE
  // ==========================================================

  // PAISARULE_C125_R231
  // Cash above contractual outstanding is NOT evidence of
  // an assessed or received overdue penalty.
  // Never fabricate penalty income from excess cash.
  const effectivePenaltyAmount = penaltyAmount;

  const debtPaymentAmount =
    Math.max(
      0,
      finalCollection - effectivePenaltyAmount,
    );

  const settlementReduction =
    debtPaymentAmount + discountAmount;

  // ==========================================================
  // SELECTED EMI STATE
  // ==========================================================

  const selectedEmiNumbers = Array.isArray(reviewData.selectedEmiNumbers)
    ? reviewData.selectedEmiNumbers
    : [];

  const selectedEmiAmount = safeNumber(reviewData.selectedEmiAmount);

  // PAISARULE R89-R1:
  // Manual Save button minimum validation.
  // No financial writes are performed by this effect.
  // R85 authoritative Save guard remains unchanged.

  const manualMinimumKey =
    String(reviewData.loanId ?? "") +
    "|" +
    String(reviewData.receiptDate ?? "");

  const [manualMinimum, setManualMinimum] = useState<{
    key: string;
    amount: number | null;
  }>({
    key: "",
    amount: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadManualMinimum(): Promise<void> {
      const key = manualMinimumKey;

      if (!reviewData.loanId || !reviewData.receiptDate) {
        if (!cancelled) {
          setManualMinimum({
            key,
            amount: null,
          });
        }
        return;
      }

      try {
        const loan =
          await getUnnormalizedLoanForAtomicPreflight(
            reviewData.loanId,
          );

        if (!loan || !Array.isArray(loan.schedule)) {
          throw new Error(
            "MANUAL_MINIMUM_SCHEDULE_MISSING",
          );
        }

        const lateFee = Number(
          loan.lateFee ?? 0,
        );

        if (
          !Number.isFinite(lateFee) ||
          lateFee < 0
        ) {
          throw new Error(
            "MANUAL_MINIMUM_LATE_FEE_INVALID",
          );
        }

        const date = String(
          reviewData.receiptDate,
        ).slice(0, 10);

        // R89-R1 TYPE FIX:
        // Explicitly convert LoanInstallment through unknown.
        const rows = [...loan.schedule]
          .map(
            (item) =>
              item as unknown as Record<string, unknown>,
          )
          .sort(
            (a, b) =>
              Number(a.installmentNumber) -
              Number(b.installmentNumber),
          );

        let minimum: number | null = null;

        for (const row of rows) {
          const number = Number(
            row.installmentNumber,
          );

          const amount = Number(
            row.installmentAmount,
          );

          const paid = Number(
            row.paidAmount ?? 0,
          );

          const waived = Number(
            row.waivedAmount ?? 0,
          );

          const assessed = Number(
            row.penaltyAmount ?? 0,
          );

          const feePaid = Number(
            row.penaltyPaidAmount ?? 0,
          );

          const feeWaived = Number(
            row.penaltyWaivedAmount ?? 0,
          );

          const values = [
            number,
            amount,
            paid,
            waived,
            assessed,
            feePaid,
            feeWaived,
          ];

          if (
            !Number.isSafeInteger(number) ||
            number <= 0 ||
            values.some(
              (value) =>
                !Number.isFinite(value) ||
                value < 0,
            ) ||
            paid + waived > amount + 0.005 ||
            feePaid + feeWaived > assessed + 0.005
          ) {
            throw new Error(
              "MANUAL_MINIMUM_ROW_INVALID",
            );
          }

          const status = String(
            row.status ?? "",
          )
            .trim()
            .toLowerCase();

          if (
            status === "paid" ||
            status === "overdue paid" ||
            status === "preclosed"
          ) {
            continue;
          }

          const emiRemaining = Math.max(
            0,
            amount - paid - waived,
          );

          const dueDate = String(
            row.dueDate ?? "",
          ).slice(0, 10);

          const overdue =
            /^\d{4}-\d{2}-\d{2}$/.test(dueDate) &&
            dueDate < date;

          const applicableFee = overdue
            ? assessed > 0
              ? assessed
              : emiRemaining > 0.005
                ? lateFee
                : 0
            : 0;

          const feeRemaining = Math.max(
            0,
            applicableFee -
              feePaid -
              feeWaived,
          );

          const total =
            emiRemaining + feeRemaining;

          if (total > 0.005) {
            minimum = total;
            break;
          }
        }

        if (!cancelled) {
          setManualMinimum({
            key,
            amount: minimum,
          });
        }
      } catch {
        if (!cancelled) {
          setManualMinimum({
            key,
            amount: null,
          });
        }
      }
    }

    void loadManualMinimum();

    return () => {
      cancelled = true;
    };
  }, [
    manualMinimumKey,
    reviewData.loanId,
    reviewData.receiptDate,
  ]);

  // Manual only. EMI checkbox collection is unaffected.
  // Fail closed until the matching Loan/Date is verified.
  const manualMinimumBlocked =
    selectedEmiNumbers.length === 0 &&
    (
      manualMinimum.key !== manualMinimumKey ||
      manualMinimum.amount === null ||
      discountAmount > manualMinimum.amount ||
      !Number.isFinite(collectionAmount) ||
      Math.round(collectionAmount * 100) <
        Math.round(
          Math.max(0, manualMinimum.amount - discountAmount) * 100,
        )
    );

  // ==========================================================
  // UPDATE FIELD
  // ==========================================================

  function handlePaymentMethodChange(value: string): void {
    updateField("paymentMethod", value);
  }

  function handleReferenceChange(value: string): void {
    updateField("paymentReference", value);
  }

    // PAISARULE_C137_R31_R2_REMARKS
  const [precloseRemarksLocked, setPrecloseRemarksLocked] =
    useState(false);

  useEffect(() => {
    function receivePrecloseRemarks(event: Event): void {
      const detail = (
        event as CustomEvent<{
          stage?: string;
          reason?: string;
          clear?: boolean;
        }>
      ).detail;

      if (detail?.stage === "off") {
        // PAISARULE_C137_R39_CLEAR_REMARKS
        if (detail.clear === true) {
          updateField("remarks", "");
        }
        setPrecloseRemarksLocked(false);
        return;
      }

      if (
        detail?.stage === "confirmed" &&
        typeof detail.reason === "string" &&
        detail.reason.replace(/\s/g, "").length >= 10
      ) {
        updateField("remarks", detail.reason.trim());
        setPrecloseRemarksLocked(true);
      }
    }

    window.addEventListener(
      "PAISARULE_PRECLOSE_REMARKS",
      receivePrecloseRemarks,
    );

    return () => {
      window.removeEventListener(
        "PAISARULE_PRECLOSE_REMARKS",
        receivePrecloseRemarks,
      );
    };
  }, [updateField]);

  useEffect(() => {
    setPrecloseRemarksLocked(false);
  }, [reviewData.loanId, reviewData.receiptDate]);
function handleRemarksChange(value: string): void {
    updateField("remarks", value);
  }

  // ==========================================================
  // RESET TRANSACTION FORM
  // ==========================================================
  //
  // Called ONLY after:
  //
  // 1. Loan update succeeds.
  // 2. Collection record persistence succeeds.
  //
  // Therefore a failed transaction never destroys the user's
  // entered values.
  //
  // ==========================================================

  function resetTransactionForm(): void {
    // --------------------------------------------------------
    // COLLECTION VALUES
    // --------------------------------------------------------

    updateField("paymentAmount", 0);

    updateField("advanceAdjustment", 0);

    updateField("discountAmount", 0);
    updateField("penaltyAmount", 0);

    // --------------------------------------------------------
    // EMI SELECTION
    // --------------------------------------------------------

    updateField("selectedEmiNumbers", []);

    updateField("selectedEmiAmount", 0);

    // --------------------------------------------------------
    // PAYMENT DETAILS
    // --------------------------------------------------------

    updateField("paymentReference", "");

    updateField("remarks", "");

    // --------------------------------------------------------
    // PREVIOUS TRANSACTION IDENTITY
    // --------------------------------------------------------

    updateField("collectionNumber", "");

    updateField("receiptNumber", "");

    // --------------------------------------------------------
    // NEW TRANSACTION DEFAULTS
    // --------------------------------------------------------

    updateField("paymentMethod", "cash");

    updateField("receiptDate", activeBusinessDate);

    // --------------------------------------------------------
    // RESET COLLECTION ENTRY LOCAL UI
    // --------------------------------------------------------

    window.dispatchEvent(new Event("FINORA_COLLECTION_FORM_RESET"));
  }

  // ==========================================================
  // VALIDATE
  // ==========================================================

  function validateCollection(
    penaltyOverride?: number,
  ): boolean {
    // PAISARULE_C125_R235
    // Validate against USB schedule-derived Manual penalty.
    const verifiedDebtPayment =
      finalCollection - (penaltyOverride ?? effectivePenaltyAmount);

    const verifiedSettlementReduction =
      verifiedDebtPayment + discountAmount;

    if (
      !Number.isFinite(verifiedDebtPayment) ||
      verifiedDebtPayment < 0
    ) {
      void finoraWarning("Invalid penalty settlement amount.");
      return false;
    }
    // --------------------------------------------------------
    // LOAN
    // --------------------------------------------------------

    if (!reviewData.loanId) {
      void finoraWarning("Please select a loan.");

      return false;
    }

    // --------------------------------------------------------
    // ACTUAL PAYMENT
    // --------------------------------------------------------

    if (finalCollection <= 0) {
      void finoraWarning("Please enter or select a collection amount.");

      return false;
    }

    // --------------------------------------------------------
    // AUTHORITATIVE OUTSTANDING
    // --------------------------------------------------------

    if (currentOutstanding <= 0) {
      void finoraWarning("This loan has no outstanding balance.");

      return false;
    }

    // --------------------------------------------------------
    // PAYMENT CANNOT EXCEED OUTSTANDING
    // --------------------------------------------------------

    // PAISARULE_C145_R5_MANUAL_OVERDUE_EXCESS_PREFLIGHT
    // Selected-EMI collections retain the strict outstanding ceiling.
    // Manual collections defer excess-cash authority to the existing
    // schedule preview + repository + native atomic verification.
    if (
      verifiedDebtPayment > currentOutstanding &&
      selectedEmiNumbers.length > 0
    ) {
      void finoraWarning(
        "Collection amount cannot be greater than the current outstanding balance.",
      );

      return false;
    }

    // --------------------------------------------------------
    // MANUAL PRINCIPAL MUST BE PART OF ACTUAL DEBT CASH
    // --------------------------------------------------------

    if (manualPrincipal > verifiedDebtPayment) {
      void finoraWarning(
        "Manual Principal cannot be greater than the collection amount available for loan repayment.",
      );

      return false;
    }

    // --------------------------------------------------------
    // PAYMENT + DISCOUNT CANNOT EXCEED OUTSTANDING
    // --------------------------------------------------------

    if (
      verifiedSettlementReduction > currentOutstanding &&
      selectedEmiNumbers.length > 0
    ) {
      void finoraWarning(
        "Collection amount plus discount cannot be greater than the current outstanding balance.",
      );

      return false;
    }

    // --------------------------------------------------------
    // PAYMENT METHOD
    // --------------------------------------------------------

    if (!reviewData.paymentMethod) {
      void finoraWarning("Please select a payment mode.");

      return false;
    }

    return true;
  }

  // ==========================================================
  // BUILD PERSISTENCE DATA
  // ==========================================================
  //
  // Every save is a NEW Collection transaction.
  //
  // ==========================================================

  function buildSaveData(
    collectionNumber: string,
    receiptNumber: string,
    verifiedPenalty?: number,
  ) {
    const now = new Date().toISOString();

    return {
      ...reviewData,

      // ------------------------------------------------------
      // ACTUAL CUSTOMER PAYMENT
      // ------------------------------------------------------

      paymentAmount: finalCollection,

      // ------------------------------------------------------
      // EMI METADATA
      // ------------------------------------------------------

      selectedEmiNumbers,

      selectedEmiAmount,

      // ------------------------------------------------------
      // DISCOUNT / WAIVER
      // ------------------------------------------------------

      discountAmount,

      // ------------------------------------------------------
        // OVERDUE / PENALTY
        // ------------------------------------------------------

        penaltyAmount: verifiedPenalty ?? effectivePenaltyAmount,

        // ------------------------------------------------------
        // ------------------------------------------------------
      // MANUAL PRINCIPAL METADATA
      // ------------------------------------------------------

      advanceAdjustment: manualPrincipal,

      // ------------------------------------------------------
      // AUTHORITATIVE COLLECTION / RECEIPT IDENTITY
      // ------------------------------------------------------

      collectionNumber,

      receiptNumber,

      // ------------------------------------------------------
      // COLLECTION DATE
      // ------------------------------------------------------

      receiptDate: reviewData.receiptDate,

      // ------------------------------------------------------
      // STATUS
      // ------------------------------------------------------

      status: "Approved" as const,

      // ------------------------------------------------------
      // TRANSACTION TIMESTAMPS
      // ------------------------------------------------------

      createdAt: now,

      updatedAt: now,
    };
  }

  // ==========================================================
  // SAVE COLLECTION
  // ==========================================================

  const collectionSaveLock = useCollectionSaveRef(false);

  async function handleSaveCollection(printReceipt: boolean): Promise<void> {
    // PAISARULE_C137_R31_R2_SAVE_GUARD
    // UI confirmation does not authorize Preclose settlement.
    const precloseElement = document.querySelector(
      '[data-paisarule-preclose-state]',
    );

    if (!precloseElement) {
      void finoraWarning(
        "Preclose state unavailable. Collection Save blocked.",
      );
      return;
    }

    const precloseState = precloseElement.getAttribute(
      "data-paisarule-preclose-state",
    );

    const isConfirmedPreclose =
      precloseState === "confirmed";

    if (precloseState !== "off" && !isConfirmedPreclose) {
      void finoraWarning(
        "Complete Preclose confirmation before saving.",
      );
      return;
    }

    // --------------------------------------------------------
    // DOUBLE SUBMIT PROTECTION
    // --------------------------------------------------------

    if (saving || collectionSaveLock.current) {
      return;
    }

    // PAISARULE_C129_R10_SAVE_READINESS_GUARD
    if (!refreshReady) {
      void finoraWarning(
        "EMI calculations are refreshing. Save is unavailable until the latest Loan and Date are verified.",
      );
      return;
    }

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!collectionDateLedgerReady) {
      void finoraWarning(
        "Collection Date ledger is still loading. Please try again.",
      );

      return;
    }

    try {
      validateCollectionDate({
        collectionDate:
          reviewData.receiptDate,

        loanDate:
          reviewData.loanDate,

        activeBusinessDate,

        latestCollectionDate:
          latestCollectionDate || undefined,
      });
    } catch (error) {
      void finoraWarning(
        error instanceof Error
          ? error.message
          : "Please select a valid Collection Date.",
      );

      return;
    }

    // PAISARULE_R117_IMMEDIATE_PROCESSING
    // Start before the first asynchronous Loan preflight.
    // The outer finally covers every subsequent early return.
    collectionSaveLock.current = true;
    setSaving(true);

    const processingId = startFinoraProcessing(
      printReceipt
        ? "Validating Collection & Preparing Receipt..."
        : "Validating Collection...",
    );

    try {
    // PAISARULE R85: Validate the first unsettled EMI minimum
    // against the authoritative Loan schedule BEFORE any
    // collection/receipt number reservation or financial write.
    if (selectedEmiNumbers.length === 0) {
      const minimumLoan =
        await getUnnormalizedLoanForAtomicPreflight(
          reviewData.loanId,
        );

      if (
        !minimumLoan ||
        !Array.isArray(minimumLoan.schedule)
      ) {
        void finoraWarning(
          "Manual Collection blocked: authoritative EMI schedule unavailable.",
        );
        return;
      }

      const date = String(reviewData.receiptDate ?? "").slice(0, 10);
      const loanLateFee = Number(minimumLoan.lateFee ?? 0);

      if (
        !Number.isFinite(loanLateFee) ||
        loanLateFee < 0
      ) {
        void finoraWarning(
          "Manual Collection blocked: invalid Loan Late Fee.",
        );
        return;
      }

      const rows = minimumLoan.schedule
        .map(
          (item: unknown) =>
            item as Record<string, unknown>,
        )
        .sort(
          (a, b) =>
            Number(a.installmentNumber) -
            Number(b.installmentNumber),
        );

      let minimum:
        | { number: number; amount: number }
        | undefined;

      let invalidSchedule = false;

      for (const row of rows) {
        const number = Number(row.installmentNumber);
        const amount = Number(row.installmentAmount);
        const paid = Number(row.paidAmount ?? 0);
        const waived = Number(row.waivedAmount ?? 0);
        const assessed = Number(row.penaltyAmount ?? 0);
        const feePaid = Number(row.penaltyPaidAmount ?? 0);
        const feeWaived = Number(row.penaltyWaivedAmount ?? 0);

        const values = [
          number, amount, paid, waived,
          assessed, feePaid, feeWaived,
        ];

        if (
          !Number.isSafeInteger(number) ||
          number <= 0 ||
          values.some((value) =>
            !Number.isFinite(value) || value < 0
          ) ||
          paid + waived > amount + 0.005 ||
          feePaid + feeWaived > assessed + 0.005
        ) {
          invalidSchedule = true;
          break;
        }

        const status = String(row.status ?? "")
          .trim()
          .toLowerCase();

        if (
          status === "paid" ||
          status === "overdue paid" ||
          status === "preclosed"
        ) {
          continue;
        }

        const emiRemaining = Math.max(
          0,
          amount - paid - waived,
        );

        const dueDate = String(row.dueDate ?? "").slice(0, 10);
        const overdue =
          /^\d{4}-\d{2}-\d{2}$/.test(dueDate) &&
          dueDate < date;

        const applicableFee = overdue
          ? assessed > 0
            ? assessed
            : emiRemaining > 0.005
              ? loanLateFee
              : 0
          : 0;

        const feeRemaining = Math.max(
          0,
          applicableFee - feePaid - feeWaived,
        );

        const total = emiRemaining + feeRemaining;

        if (total > 0.005) {
          minimum = { number, amount: total };
          break;
        }
      }

      if (invalidSchedule || !minimum) {
        void finoraWarning(
          "Manual Collection blocked: minimum EMI cannot be verified.",
        );
        return;
      }

      if (discountAmount > minimum.amount) {
        void finoraWarning(
          "Discount cannot exceed the verified EMI minimum.",
        );
        return;
      }

      // PAISARULE_C145_R5_EXACT_OUTSTANDING_CLOSE
      // Legacy schedule/outstanding parity may differ after a prior
      // verified discount. Exact authoritative outstanding payment
      // is therefore a valid manual full-close candidate.
      const exactOutstandingClosure =
        Number.isFinite(finalCollection) &&
        Math.round(finalCollection * 100) ===
          Math.round(currentOutstanding * 100) &&
        Math.round(discountAmount * 100) === 0;

      if (
        !exactOutstandingClosure &&
        (
          !Number.isFinite(finalCollection) ||
          Math.round(finalCollection * 100) <
            Math.round(
              Math.max(0, minimum.amount - discountAmount) * 100,
            )
        )
      ) {
        void finoraWarning(
          `Minimum Collection Amount is ₹${Math.max(0, minimum.amount - discountAmount).toLocaleString("en-IN", {
            maximumFractionDigits: 2,
          })} (EMI ${String(minimum.number).padStart(2, "0")}).`,
        );
        return;
      }
    }

    // PAISARULE_C125_R235
    // Resolve penalty from the authoritative USB schedule
    // before validating or reserving a receipt.
    let verifiedManualPenalty: number | undefined;

    if (selectedEmiNumbers.length === 0) {
      const preview = await previewManualCollectionSettlement(
        reviewData.loanId,
        finalCollection,
        manualPrincipal,
        "PREFLIGHT-ONLY-R235",
        reviewData.receiptDate,
      );

      if (!preview.success) {
        void finoraWarning(
          "Manual Collection blocked: " + preview.error,
        );
        return;
      }

      verifiedManualPenalty = preview.plan.penaltyReceived;
    }

    if (!validateCollection(verifiedManualPenalty)) {
      return;
    }
    // PAISARULE_C126_R129_MANUAL_ATOMIC_ROUTE
    // Manual mode must never enter the legacy two-write path.


    let receiptWindow: Window | null = null;

    let receiptRendered = false;

    if (printReceipt) {
      receiptWindow = window.open(
        "about:blank#finora-collection-receipt",
        "_blank",
        "width=760,height=900",
      );

      if (!receiptWindow) {
        void finoraWarning(
          "Receipt window was blocked. Please allow pop-ups for PAISARULE. No collection was saved.",
        );

        return;
      }

      receiptWindow.document.open();

      receiptWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>Preparing PAISARULE Receipt</title>
            <meta charset="utf-8" />
            <style>
              body {
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f8fafc;
                color: #0f172a;
                font-family: Arial, sans-serif;
              }

              .preparing {
                padding: 24px 32px;
                border: 1px solid #d9dee8;
                border-radius: 12px;
                background: #ffffff;
                box-shadow: 0 12px 30px rgba(15, 23, 42, .10);
                text-align: center;
              }

              strong {
                display: block;
                margin-bottom: 8px;
                color: #a56f00;
                font-size: 18px;
              }
            </style>
          </head>
          <body>
            <div class="preparing">
              <strong>PAISARULE</strong>
              Saving collection and preparing receipt...
            </div>
          </body>
        </html>
      `);

      receiptWindow.document.close();

      receiptWindow.focus();
    }

    try {
      // ======================================================
      // FRESH COMMERCIAL TRANSACTION AUTHORIZATION
      // ======================================================

      // PAISARULE_C137_R107_DISCOUNT_EARLY_GUARD
      // Reject unsupported waiver before commercial
      // authorization and receipt-number reservation.
      // Replace only after verified atomic EMI support.
      if (
        safeNumber(reviewData.discountAmount) > 0 &&
        selectedEmiNumbers.length !== 1 &&
        !isConfirmedPreclose
      ) {
        throw new Error(
          "OVERDUE_WAIVER_ATOMIC_SAVE_PENDING",
        );
      }

        // PAISARULE_C138_R11A_EARLY_WAIVER_PREFLIGHT
        // Validate authoritative Loan evidence before commercial
        // authorization or receipt number reservation.
        // No storage write, no Wallet debit, no receipt reservation.
        if (
          selectedEmiNumbers.length === 1 &&
          safeNumber(reviewData.discountAmount) > 0
        ) {
          const preflightLoan =
            await getUnnormalizedLoanForAtomicPreflight(
              reviewData.loanId,
            );

          if (!preflightLoan || !Array.isArray(preflightLoan.schedule)) {
            throw new Error("WAIVER_PREFLIGHT_LOAN_UNAVAILABLE");
          }

          const selectedRow = preflightLoan.schedule.find(
            (row) =>
              Number(row.installmentNumber) === selectedEmiNumbers[0],
          );

          const dueEvidence =
            String(selectedRow?.dueDate ?? "").trim();

          const dateEvidence =
            String(reviewData.receiptDate ?? "").trim();

          try {
            const verifiedWaiverPreflight = projectSelectedEmiWaiverLoan({
              outstanding: preflightLoan.outstanding,
              schedule: preflightLoan.schedule,
              selectedEmiNumbers,
              cashReceived: collectionAmount,
              discountAmount: safeNumber(reviewData.discountAmount),
              configuredLateFee: Number(preflightLoan.lateFee ?? 0),
              collectionDate: dateEvidence,
              receiptNumber: "PREFLIGHT-ONLY-NOT-RESERVED",
            });

            // PAISARULE_C138_R18_PENALTY_CASH
            // Collection penaltyAmount = cash actually received.
            // Loan schedule preserves assessed and waived penalty.
            verifiedManualPenalty = verifiedWaiverPreflight.penaltyReceived;
          } catch (error) {
            // Evidence flags only. No personal details or dates.
            console.warn("[PAISARULE C138 WAIVER PREFLIGHT]", {
              dueDatePresent: dueEvidence.length > 0,
              dueDateIsoPrefix:
                /^\d{4}-\d{2}-\d{2}/.test(dueEvidence),
              collectionDatePresent: dateEvidence.length > 0,
              collectionDateIsoPrefix:
                /^\d{4}-\d{2}-\d{2}/.test(dateEvidence),
              datesOrdered:
                dueEvidence.length >= 10 &&
                dateEvidence.length >= 10 &&
                dateEvidence.slice(0, 10) >
                  dueEvidence.slice(0, 10),
              selectedRowPresent: Boolean(selectedRow),
            });

            throw error;
          }
        }
      const operationResult =
        await beginFinoraPostCollectionOperation();

      if (!operationResult.success) {
        throw new Error(
          operationResult.error,
        );
      }

      const commercialWriteAuthorization =
        operationResult.authorization;

      // ======================================================
      // AUTHORITATIVE COLLECTION / RECEIPT NUMBER RESERVATION
      //
      // Reservation occurs only after validation succeeds and
      // before any Loan or Collection mutation begins.
      //
      // Once reserved, the sequence is never recycled.
      // ======================================================

      // PAISARULE_C138_R48_WAIVER_ATOMIC_NUMBER_PREVIEW
      // No precommit number consumption for selected EMI waiver.
      // PAISARULE_C145_R12R3_SUCCESS_ONLY_NUMBER_CONSUMPTION
      // Manual atomic saves use preview numbering only.
      // Sequence persistence occurs only with successful native commit.
      const isAtomicWaiverNumbering =
        selectedEmiNumbers.length === 0 ||
        isConfirmedPreclose ||
        (
          selectedEmiNumbers.length === 1 &&
          safeNumber(reviewData.discountAmount) > 0
        );

      const numberingResult = isAtomicWaiverNumbering
        ? await previewNextCollectionReceiptPair(
            reviewData.customerId,
            reviewData.loanNumber,
          )
        : await reserveNextCollectionReceiptPair(
            reviewData.customerId,
            reviewData.loanNumber,
            commercialWriteAuthorization,
          );

      if (
        !numberingResult.success ||
        !numberingResult.data
      ) {
        throw new Error(
          numberingResult.error ??
            "Unable to reserve PAISARULE Collection / Receipt Numbers.",
        );
      }

      const numbering =
        numberingResult.data;

      // ======================================================
      // NEW TRANSACTION DATA
      // ======================================================

      const saveData =
        buildSaveData(
          numbering.collectionNumber,
          numbering.receiptNumber,
          verifiedManualPenalty,
        );

      // Subscription-only: no Collection Wallet preflight.

      console.info("FINORA COLLECTION SAVE", {
        loanId: saveData.loanId,

        collectionNumber: saveData.collectionNumber,

        paymentAmount: saveData.paymentAmount,

        discountAmount: saveData.discountAmount,

        settlementReduction: saveData.paymentAmount + saveData.discountAmount,

        manualPrincipal: saveData.advanceAdjustment,

        receiptNumber: saveData.receiptNumber,

        selectedEmiNumbers: saveData.selectedEmiNumbers,

        selectedEmiAmount: saveData.selectedEmiAmount,

        createdAt: saveData.createdAt,
      });

      // ======================================================
      // UPDATE AUTHORITATIVE LOAN
      // ======================================================

      // PAISARULE_C126_R129_MANUAL_LOAN_PROJECTION
      // Projection is in memory. No Loan write here.
      const isManualAtomic =
        selectedEmiNumbers.length === 0;

      // PAISARULE_C137_R120_R1_SELECTED_WAIVER_PROJECTION
      // Selected EMI with overdue penalty waiver must never
      // use the legacy persistent Loan update.
      const isSelectedWaiverAtomic =
        selectedEmiNumbers.length === 1 &&
        safeNumber(saveData.discountAmount) > 0;

      let rawManualLoan:
        Awaited<ReturnType<
          typeof getUnnormalizedLoanForAtomicPreflight
        >>;

      let manualCashSchedule: unknown;

      const updatedLoan = isManualAtomic
        ? await (async () => {
            const rawLoan =
              await getUnnormalizedLoanForAtomicPreflight(
                saveData.loanId,
              );

            if (
              !rawLoan ||
              !Array.isArray(rawLoan.schedule)
            ) {
              throw new Error(
                "AUTHORITATIVE_USB_LOAN_SCHEDULE_REQUIRED",
              );
            }

            // PAISARULE_C145_R10_SAVE_PREFLIGHT_DEBT_CEILING
            // Use the same authoritative Loan outstanding ceiling
            // as the earlier Manual preview.
            const cashProjection =
              projectManualPenaltyScheduleSettlement(
                rawLoan.schedule,
                saveData.paymentAmount,
                safeNumber(saveData.advanceAdjustment),
                saveData.receiptNumber,
                saveData.receiptDate,
                Number(rawLoan.lateFee ?? 0),
                Number(rawLoan.outstanding),
              );

            if (
              Math.abs(
                cashProjection.penaltyReceived -
                  safeNumber(saveData.penaltyAmount),
              ) > 0.000001
            ) {
              throw new Error(
                "MANUAL_PENALTY_PREFLIGHT_MISMATCH",
              );
            }

            const projectedLoan =
              prepareManualLoanForAtomicSettlement(
                rawLoan,
                saveData.paymentAmount,
                {
                  selectedEmiNumbers: [],
                  receiptNumber: saveData.receiptNumber,
                  paidDate: saveData.receiptDate,
                  discountAmount: saveData.discountAmount,
                  allowPrecloseDiscount: isConfirmedPreclose,
                  manualPrincipalAmount:
                    safeNumber(saveData.advanceAdjustment),
                  penaltyAmount:
                    safeNumber(saveData.penaltyAmount),
                },
              );

            if (!projectedLoan) {
              throw new Error(
                "MANUAL_LOAN_PROJECTION_FAILED",
              );
            }

            rawManualLoan = rawLoan;
            manualCashSchedule =
              cashProjection.schedule;

            return projectedLoan;
          })()
        : isSelectedWaiverAtomic
          ? await (async () => {
              const rawLoan =
                await getUnnormalizedLoanForAtomicPreflight(
                  saveData.loanId,
                );

              if (
                !rawLoan ||
                !Array.isArray(rawLoan.schedule)
              ) {
                throw new Error(
                  "WAIVER_AUTHORITATIVE_USB_LOAN_REQUIRED",
                );
              }

              const projection =
                projectSelectedEmiWaiverLoan({
                  outstanding: rawLoan.outstanding,
                  schedule: rawLoan.schedule,
                  selectedEmiNumbers: saveData.selectedEmiNumbers,
                  cashReceived: saveData.paymentAmount,
                  discountAmount: saveData.discountAmount,
                  configuredLateFee: Number(rawLoan.lateFee ?? 0),
                  collectionDate: saveData.receiptDate,
                  receiptNumber: saveData.receiptNumber,
                });

              if (
                Math.abs(
                  projection.penaltyReceived -
                    safeNumber(saveData.penaltyAmount),
                ) > 0.000001
              ) {
                throw new Error(
                  "WAIVER_PENALTY_CASH_MISMATCH",
                );
              }

              // PAISARULE_C137_R120_R2_EXPECTED_LOAN
              // Native must compare this original Loan against
              // the authoritative USB Loan before committing.
              rawManualLoan = rawLoan;

              // In-memory only. No Loan or Collection write.
              return {
                ...rawLoan,
                outstanding: projection.outstanding,
                schedule: projection.schedule,
                status: projection.status,
                updatedAt: new Date().toISOString(),
              };
            })()        : await updateLoanOutstandingAmount(
        saveData.loanId,

        saveData.paymentAmount,

        {
          selectedEmiNumbers: saveData.selectedEmiNumbers,

          receiptNumber: saveData.receiptNumber,

          paidDate: saveData.receiptDate,

          discountAmount: saveData.discountAmount,

          manualPrincipalAmount: safeNumber(
            saveData.advanceAdjustment,
          ),
          penaltyAmount: safeNumber(saveData.penaltyAmount),
        },
        commercialWriteAuthorization,
      );

      if (!updatedLoan) {
        throw new Error(
          "Unable to update the selected loan outstanding amount.",
        );
      }

      // ======================================================
      // AUTHORITATIVE POST-SETTLEMENT BALANCE
      // ======================================================

      const updatedOutstanding = safeNumber(
        (
          updatedLoan as {
            outstanding?: unknown;
          }
        ).outstanding,
      );

      // ======================================================
      // FINAL COLLECTION RECORD
      // ======================================================

      // FINORA_R162_R4_IMMUTABLE_SNAPSHOT
      // Capture the schedule returned by the authoritative Loan update.
      // This data is frozen inside the Collection transaction.

      const finoraSnapshotLoan =
        updatedLoan as unknown as {
          schedule?: unknown;
        };

      const finoraRawSchedule =
        Array.isArray(finoraSnapshotLoan.schedule)
          ? finoraSnapshotLoan.schedule
          : null;

      const finoraSnapshotRows: Array<{
        number: number;
        dueDate: string;
        amount: number;
        paidAmount: number;
        waivedAmount: number;
        penaltyAmount: number;
        // PAISARULE_C125_R208_R1
        penaltyPaidAmount?: number;
        penaltyWaivedAmount?: number;
        status: string;
      }> = [];

      let finoraSnapshotValid =
        finoraRawSchedule !== null &&
        finoraRawSchedule.length > 0;

      if (finoraRawSchedule !== null) {
        for (const raw of finoraRawSchedule) {
          if (
            raw === null ||
            typeof raw !== "object" ||
            Array.isArray(raw)
          ) {
            finoraSnapshotValid = false;
            break;
          }

          const row = raw as Record<string, unknown>;

          const number = Number(row.installmentNumber);
          const dueDate =
            typeof row.dueDate === "string"
              ? row.dueDate.trim()
              : "";

          const status =
            typeof row.status === "string"
              ? row.status.trim()
              : "";

          const amount = Number(row.installmentAmount);
          const paidAmount = Number(row.paidAmount ?? 0);
          const waivedAmount = Number(row.waivedAmount ?? 0);
          const penaltyAmount = Number(row.penaltyAmount ?? 0);
          const penaltyPaidAmount =
            row.penaltyPaidAmount === undefined
              ? undefined
              : Number(row.penaltyPaidAmount);
          const penaltyWaivedAmount =
            row.penaltyWaivedAmount === undefined
              ? undefined
              : Number(row.penaltyWaivedAmount);
          if (
            !Number.isSafeInteger(number) ||
            number <= 0 ||
            !dueDate ||
            !status ||
            !Number.isFinite(amount) ||
            amount < 0 ||
            !Number.isFinite(paidAmount) ||
            paidAmount < 0 ||
            !Number.isFinite(waivedAmount) ||
            waivedAmount < 0 ||
            !Number.isFinite(penaltyAmount) ||
            penaltyAmount < 0 ||
            (penaltyPaidAmount !== undefined &&
              (!Number.isFinite(penaltyPaidAmount) ||
                penaltyPaidAmount < 0)) ||
            (penaltyWaivedAmount !== undefined &&
              (!Number.isFinite(penaltyWaivedAmount) ||
                penaltyWaivedAmount < 0)) ||
            (penaltyPaidAmount !== undefined &&
              penaltyWaivedAmount !== undefined &&
              penaltyPaidAmount + penaltyWaivedAmount >
                penaltyAmount + 0.005)
          ) {
            finoraSnapshotValid = false;
            break;
          }

          finoraSnapshotRows.push({
            number,
            dueDate,
            amount,
            paidAmount,
            waivedAmount,
            penaltyAmount,
            ...(penaltyPaidAmount === undefined
              ? {}
              : { penaltyPaidAmount }),
            ...(penaltyWaivedAmount === undefined
              ? {}
              : { penaltyWaivedAmount }),
            status,
          });
        }
      }

      finoraSnapshotRows.sort(
        (left, right) => left.number - right.number,
      );

      if (
        new Set(finoraSnapshotRows.map((row) => row.number))
          .size !== finoraSnapshotRows.length
      ) {
        finoraSnapshotValid = false;
      }

      const finoraPaidStatuses = new Set([
        "paid",
        "overdue paid",
        "preclosed",
      ]);

      const receiptSnapshot = {
        version: 1 as const,
        capturedAt: new Date().toISOString(),
        previousOutstanding: currentOutstanding,
        amountReceived: safeNumber(saveData.paymentAmount),
        penaltyReceived: safeNumber(saveData.penaltyAmount),
        discountAmount: safeNumber(saveData.discountAmount),
        remainingOutstanding: updatedOutstanding,
        selectedEmiNumbers: [
          ...(saveData.selectedEmiNumbers ?? []),
        ],
        scheduleAvailable: finoraSnapshotValid,
        totalEmis: finoraSnapshotValid
          ? finoraSnapshotRows.length
          : null,
        remainingEmis: finoraSnapshotValid
          ? finoraSnapshotRows.filter(
              (row) =>
                !finoraPaidStatuses.has(
                  row.status.toLowerCase(),
                ),
            ).length
          : null,
        installments: finoraSnapshotValid
          ? finoraSnapshotRows
          : [],
      };

      const collectionSaveData = {
        ...saveData,

        outstandingBalance: updatedOutstanding,

        receiptSnapshot,
      };

      // ======================================================
      // SAVE COLLECTION RECORD
      // ======================================================

      // PAISARULE_C126_R129_SINGLE_ATOMIC_COMMIT
      // Manual: one Native Loan+Collection commit.
      // Selected EMI: existing legacy workflow unchanged.

      // PAISARULE_C137_R120_R2_ATOMIC_SAVE_ROUTING
      const savedCollection =
        (isManualAtomic || isSelectedWaiverAtomic)
        ? await (async () => {
            if (!rawManualLoan) {
              throw new Error(
                "MANUAL_ORIGINAL_LOAN_MISSING",
              );
            }

            const preparedCollection =
              await prepareApprovedCollectionForSettlement(
                collectionSaveData,
              );

            const collectionRecord =
              prepareCollectionRecordForSettlement(
                preparedCollection,
              );

            // PAISARULE_C137_R120_R2_REQUEST_SELECTION
            const request = isSelectedWaiverAtomic
              ? prepareSelectedEmiWaiverAtomicRequest(
                  rawManualLoan,
                  updatedLoan,
                  collectionRecord,
                )
              : prepareManualAtomicSettlementRequest(
                rawManualLoan,
                updatedLoan,
                collectionRecord,
                safeNumber(saveData.advanceAdjustment) > 0
                  ? {
                      cashAllocatedSchedule:
                        manualCashSchedule,
                    }
                  : undefined,
              );

            const sessionId = String(
              getSession()?.sessionId ?? "",
            ).trim();

            if (!sessionId) {
              throw new Error(
                "AUTHENTICATED_OWNER_SESSION_REQUIRED",
              );
            }

            const nativeUnknown =
              await submitPaisaruleAtomicCollection(
                request,
                sessionId,
              );

            const nativeResult = nativeUnknown as
              | {
                  success?: boolean;
                  error?: string;
                  data?: {
                    committed?: boolean;
                    alreadyCommitted?: boolean;
                  };
                }
              | null;

            if (
              nativeResult?.success !== true ||
              nativeResult.data?.committed !== true
            ) {
              throw new Error(
                nativeResult?.error ??
                  "ATOMIC_COLLECTION_COMMIT_NOT_CONFIRMED",
              );
            }

            // Atomic Native commit already persisted Loan + Collection.
            // Record both commercial stages only after commit proof.
            consumeFinoraPostCollectionOperationStage(
              commercialWriteAuthorization,
              "LOAN_UPDATED",
            );

            consumeFinoraPostCollectionOperationStage(
              commercialWriteAuthorization,
              "COLLECTION_SAVED",
            );

            return preparedCollection;
          })()
        : await approveCollection(
            collectionSaveData,
            commercialWriteAuthorization,
          );

      // Subscription-only: Collection saved without Wallet debit.

      const savedCollectionDate =
        resolveOperationalDate(
          savedCollection.receiptDate,
        );

      if (savedCollectionDate) {
        setLatestCollectionDate(
          (currentDate) =>
            !currentDate ||
            savedCollectionDate >
              currentDate
              ? savedCollectionDate
              : currentDate,
        );
      }

      // ======================================================
      // PUSH AUTHORITATIVE LOAN BALANCE INTO CONTROLLER
      // ======================================================

      updateField(
        "outstandingBalance",
        safeNumber(savedCollection.outstandingBalance),
      );

      // ======================================================
      // OPTIONAL PRINT RECEIPT
      // ======================================================
      //
      // Uses immutable transaction data captured before the
      // form is reset.
      //
      // ======================================================

      if (printReceipt && receiptWindow) {
        printCollectionReceipt(
          collectionSaveData,
          receiptWindow,
        );

        receiptRendered = true;
      }

      // ======================================================
      // RESET CURRENT TRANSACTION FORM
      // ======================================================
      //
      // This happens only after persistence is fully successful.
      //
      // EMI or Manual mode both return to a clean fresh form.
      //
      // ======================================================

      // PAISARULE_C142_R2_OWNER_ACK_AUTHORITY
      // Successful persistence is complete, but the visible
      // transaction remains intact until Owner acknowledges
      // the success popup with OK.

      // ======================================================
      // SUCCESS MESSAGE
      // ======================================================

      const loanClosed = updatedOutstanding === 0;

      if (!printReceipt) {
        // R64: Compare the Loan schedules captured before and
        // after the successful collection commit.
        const nextEmiAdjustment = (() => {
          if (!isManualAtomic || !rawManualLoan) {
            return undefined;
          }

          const beforeSchedule = (
            rawManualLoan as unknown as {
              schedule?: unknown;
            }
          ).schedule;

          if (
            !Array.isArray(beforeSchedule) ||
            !Array.isArray(finoraRawSchedule)
          ) {
            return undefined;
          }

          type PopupEmiRow = {
            installmentNumber?: unknown;
            installmentAmount?: unknown;
            paidAmount?: unknown;
            waivedAmount?: unknown;
            penaltyAmount?: unknown;
            penaltyPaidAmount?: unknown;
            penaltyWaivedAmount?: unknown;
          };

          const previousByNumber = new Map<number, PopupEmiRow>();

          for (const item of beforeSchedule) {
            if (!item || typeof item !== "object") {
              return undefined;
            }

            const row = item as PopupEmiRow;
            const number = Number(row.installmentNumber);

            if (!Number.isSafeInteger(number) || number <= 0) {
              return undefined;
            }

            if (previousByNumber.has(number)) {
              return undefined;
            }

            previousByNumber.set(number, row);
          }

          const changed: {
            number: number;
            amount: number;
            after: PopupEmiRow;
          }[] = [];

          for (const item of finoraRawSchedule) {
            if (!item || typeof item !== "object") {
              return undefined;
            }

            const row = item as PopupEmiRow;
            const number = Number(row.installmentNumber);
            const before = previousByNumber.get(number);

            if (!before) {
              return undefined;
            }

            const oldPaid = Number(before.paidAmount ?? 0);
            const newPaid = Number(row.paidAmount ?? 0);
            const delta = Math.round((newPaid - oldPaid) * 100);

            if (
              !Number.isFinite(oldPaid) ||
              !Number.isFinite(newPaid) ||
              !Number.isSafeInteger(delta) ||
              delta < 0
            ) {
              return undefined;
            }

            if (delta > 0) {
              changed.push({
                number,
                amount: delta,
                after: row,
              });
            }
          }

          // This label is for an exactly verified rollover
          // from a completed EMI to the next partial EMI.
          if (changed.length !== 2) {
            return undefined;
          }

          changed.sort((a, b) => a.number - b.number);

          const previous = changed[0];
          const next = changed[1];

          if (next.number !== previous.number + 1) {
            return undefined;
          }

          const previousPaid = Number(
            previous.after.paidAmount ?? 0,
          );

          const previousWaived = Number(
            previous.after.waivedAmount ?? 0,
          );

          const previousRequired = Number(
            previous.after.installmentAmount ?? 0,
          );

          const previousPenalty = Number(
            previous.after.penaltyAmount ?? 0,
          );

          const previousPenaltyPaid = Number(
            previous.after.penaltyPaidAmount ?? 0,
          );

          const previousPenaltyWaived = Number(
            previous.after.penaltyWaivedAmount ?? 0,
          );

          const nextPaid = Number(next.after.paidAmount ?? 0);
          const nextRequired = Number(
            next.after.installmentAmount ?? 0,
          );

          const previousEmiClosed =
            Number.isFinite(previousRequired) &&
            previousRequired > 0 &&
            Math.round(
              (previousPaid + previousWaived) * 100,
            ) === Math.round(previousRequired * 100);

          const previousPenaltyClosed =
            Number.isFinite(previousPenalty) &&
            Math.round(
              (previousPenaltyPaid + previousPenaltyWaived) * 100,
            ) === Math.round(previousPenalty * 100);

          const nextIsPartial =
            Number.isFinite(nextRequired) &&
            nextRequired > 0 &&
            Number.isFinite(nextPaid) &&
            nextPaid > 0 &&
            nextPaid < nextRequired;

          if (
            !previousEmiClosed ||
            !previousPenaltyClosed ||
            !nextIsPartial
          ) {
            return undefined;
          }

          return {
            emiNumber: next.number,
            amount: next.amount / 100,
          };
        })();

        setSavedCollectionPopup({
          nextEmiAdjustment,
          amount: safeNumber(savedCollection.paymentAmount),
          penalty: safeNumber(savedCollection.penaltyAmount),
          discount: safeNumber(savedCollection.discountAmount),
          customer: String(saveData.customerName || "--"),
          number: String(savedCollection.collectionNumber),
          paymentMode: String(saveData.paymentMethod || "cash"),
          closed: loanClosed,
        });
      }
    } catch (error) {
      if (
        receiptWindow &&
        !receiptRendered &&
        !receiptWindow.closed
      ) {
        receiptWindow.close();
      }

      console.error("PAISARULE COLLECTION SAVE ERROR:", error);

      void finoraError(
        error instanceof Error
          ? error.message
          : "Collection could not be saved.",
      );
    } finally {
      setNumberingPreviewVersion(
        (current) => current + 1,
      );

    }
    } catch (preflightError) {
      console.error(
        "PAISARULE COLLECTION PREFLIGHT ERROR:",
        preflightError,
      );

      void finoraError(
        preflightError instanceof Error
          ? preflightError.message
          : "Collection validation could not be completed.",
      );
    } finally {
      stopFinoraProcessing(processingId);
      setSaving(false);
      collectionSaveLock.current = false;
    }
  }

  // ==========================================================
  // PRINT RECEIPT
  // ==========================================================

  function printCollectionReceipt(
    data: ReturnType<typeof buildSaveData>,
    receiptWindow: Window,
  ): void {

    // ========================================================
    // RECEIPT VALUES
    // ========================================================

    const customerName = data.customerName || "--";

    const loanNumber = data.loanNumber || "--";

    const paymentMode = data.paymentMethod || "--";

    const receiptDate = data.receiptDate || "--";

    const receiptBusinessName =
      escapeReceiptHtml(
        String(
          getBusinessContext()
            ?.businessProfile
            ?.businessName ??
          "",
        ).trim() ||
        "PAISARULE",
      );

    const settlementValue =
      safeNumber(data.paymentAmount) + safeNumber(data.discountAmount);

    // ========================================================
    // RECEIPT DOCUMENT
    // ========================================================

    receiptWindow.document.open();

    receiptWindow.document.write(`
      <!doctype html>

      <html>

        <head>

          <title>
            PAISARULE Collection Receipt
          </title>

          <meta
            charset="utf-8"
          />

          <style>

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 32px;
              background: #f8fafc;
              color: #111827;
              font-family: Inter, ui-sans-serif, system-ui, sans-serif;
              line-height: 1.5;
            }

            .receipt-actions {
              max-width: 720px;
              margin: 0 auto 14px;
              display: flex;
              justify-content: flex-end;
            }

            .print-button {
              min-height: 40px;
              padding: 9px 16px;
              border: 1px solid #a56f00;
              border-radius: 9px;
              background: #a56f00;
              color: #ffffff;
              font: inherit;
              font-size: 12px;
              font-weight: 800;
              letter-spacing: .04em;
              cursor: pointer;
            }

            .receipt {
              max-width: 720px;
              margin: 0 auto;
              padding: 32px 34px;
              border: 1px solid #d8dee8;
              border-radius: 16px;
              background: #ffffff;
              box-shadow: 0 16px 42px rgba(15, 23, 42, .08);
            }

            .brand {
              color: #a56f00;
              font-size: 11px;
              font-weight: 850;
              line-height: 1.4;
              letter-spacing: .16em;
              text-transform: uppercase;
            }

            .business-name {
              margin-top: 7px;
              color: #111827;
              font-size: 18px;
              font-weight: 800;
              line-height: 1.35;
              letter-spacing: -.01em;
            }

            h1 {
              margin: 20px 0 5px;
              color: #111827;
              font-size: 24px;
              font-weight: 850;
              line-height: 1.2;
              letter-spacing: -.02em;
            }

            .receipt-subtitle {
              margin-top: 0;
            }

            .meta {
              margin: 24px 0 20px;
              padding: 18px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px 24px;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              background: #f8fafc;
            }

            .meta > div {
              min-width: 0;
              color: #334155;
              font-size: 13px;
              line-height: 1.55;
              overflow-wrap: anywhere;
            }

            .meta strong {
              display: inline-block;
              margin-bottom: 4px;
              color: #64748b;
              font-size: 10.5px;
              font-weight: 800;
              line-height: 1.4;
              letter-spacing: .055em;
              text-transform: uppercase;
            }

            .row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 24px;
              padding: 12px 2px;
              border-bottom: 1px solid #e5e7eb;
              color: #334155;
              font-size: 13px;
              line-height: 1.5;
            }

            .row strong {
              flex-shrink: 0;
              color: #111827;
              font-size: 13.5px;
              font-weight: 800;
            }

            .final {
              margin-top: 20px;
              padding: 17px 16px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 20px;
              border: 1px solid #23865a;
              border-radius: 11px;
              background: #f0fdf4;
              color: #166534;
              font-size: 18px;
              font-weight: 850;
              line-height: 1.3;
            }

            .muted {
              margin: 14px 0 0;
              color: #64748b;
              font-size: 12px;
              line-height: 1.65;
            }

            @media (max-width: 620px) {

              body {
                padding: 16px;
              }

              .receipt {
                padding: 24px 20px;
              }

              .meta {
                grid-template-columns: 1fr;
              }

            }

            @media print {

              body {
                padding: 0;
                background: #ffffff;
              }

              .receipt-actions {
                display: none;
              }

              .receipt {
                max-width: none;
                border: 0;
                border-radius: 0;
                box-shadow: none;
              }

            }

          </style>

        </head>

        <body>

          <div class="receipt-actions">
            <button
              type="button"
              class="print-button"
              onclick="window.print()"
            >
              PRINT RECEIPT
            </button>
          </div>

          <div class="receipt">

            <div class="brand">
              PAISARULE
            </div>

            <div class="business-name">
              ${receiptBusinessName}
            </div>

            <h1>
              COLLECTION RECEIPT
            </h1>

            <div class="muted receipt-subtitle">
              Collection Studio™
            </div>

            <div class="meta">

              <div>
                <strong>
                  Receipt No
                </strong>

                <br>

                ${data.receiptNumber}
              </div>

              <div>
                <strong>
                  Date
                </strong>

                <br>

                ${receiptDate}
              </div>

              <div>
                <strong>
                  Customer
                </strong>

                <br>

                ${customerName}
              </div>

              <div>
                <strong>
                  Loan
                </strong>

                <br>

                ${loanNumber}
              </div>

              <div>
                <strong>
                  Payment Mode
                </strong>

                <br>

                ${paymentMode}
              </div>

              <div>
                <strong>
                  Reference
                </strong>

                <br>

                ${data.paymentReference || "--"}
              </div>

            </div>

            <div class="row">

              <span>
                Collection Amount
              </span>

              <strong>
                ${formatCurrency(data.paymentAmount)}
              </strong>

            </div>

            <div class="row">

              <span>
                Discount / Waiver
              </span>

              <strong>
                ${formatCurrency(data.discountAmount)}
              </strong>

            </div>

            <div class="row">

              <span>
                Manual Principal
              </span>

              <strong>
                ${formatCurrency(data.advanceAdjustment)}
              </strong>

            </div>

            <div class="final">

              <span>
                TOTAL SETTLEMENT
              </span>

              <span>
                ${formatCurrency(settlementValue)}
              </span>

            </div>

            <p class="muted">
              Actual amount received: ${formatCurrency(
                data.paymentAmount,
              )}. Discount / waiver is not treated as customer payment.
            </p>

            <p class="muted">
              This receipt was generated by PAISARULE Collection Studio™.
            </p>

          </div>

        </body>

      </html>
    `);

    receiptWindow.document.close();

    receiptWindow.focus();
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section
      aria-label="Payment Details"
      style={collectionPaymentDetailsStyles.section}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header style={collectionPaymentDetailsStyles.header}>
        <WalletCards
          aria-hidden="true"
          style={collectionPaymentDetailsStyles.headerIcon}
        />

        <div style={collectionPaymentDetailsStyles.headerContent}>
          <h2 style={collectionPaymentDetailsStyles.title}>PAYMENT DETAILS</h2>

          <p style={collectionPaymentDetailsStyles.subtitle}>
            Record the collection payment information.
          </p>
        </div>
      </header>

      {/* ======================================================
          COMPACT PAYMENT GRID
      ====================================================== */}

      <div style={responsiveBodyStyle}>
        {/* ====================================================
            COLLECTION NUMBER
        ==================================================== */}

        <div style={responsiveFieldStyle}>
          <label
            htmlFor="finora-collection-number"
            style={collectionPaymentDetailsStyles.label}
          >
            Collection Number
          </label>

          <input
            id="finora-collection-number"
            type="text"
            value={
              numberingPreview.collectionNumber ||
              "Auto Generated"
            }
            readOnly
            style={responsiveInputStyle}
          />
        </div>

        {/* ====================================================
            RECEIPT NUMBER
        ==================================================== */}

        <div style={responsiveFieldStyle}>
          <label
            htmlFor="finora-receipt-number"
            style={collectionPaymentDetailsStyles.label}
          >
            Receipt Number
          </label>

          <input
            id="finora-receipt-number"
            type="text"
            value={
              numberingPreview.receiptNumber ||
              "Auto Generated"
            }
            readOnly
            style={responsiveInputStyle}
          />
        </div>

        {/* ====================================================
            COLLECTION DATE
        ==================================================== */}

        <div style={responsiveFieldStyle}>
          <label
            htmlFor="finora-collection-date"
            style={collectionPaymentDetailsStyles.label}
          >
            Collection Date *
          </label>

          <FinoraCalendar   value={reviewData.receiptDate}   onChange={handleCollectionBusinessDateChange}   min={minimumCollectionDate || undefined}   max={getCurrentLocalBusinessDate()}   allowClear={false}   showRelativeDay   placeholder="DD/MM/YYYY"   ariaLabel="Collection Date" />
        </div>

        {/* ====================================================
            PAYMENT MODE
        ==================================================== */}

        <div style={responsiveFieldStyle}>
          <label
            htmlFor="finora-payment-mode"
            style={collectionPaymentDetailsStyles.label}
          >
            Payment Mode *
          </label>

          <select
            id="finora-payment-mode"
            value={reviewData.paymentMethod || "cash"}
            onChange={(event) => handlePaymentMethodChange(event.target.value)}
            style={collectionPaymentDetailsStyles.input}
          >
            <option value="cash">Cash</option>

            <option value="upi">UPI</option>

            <option value="bank">Bank Transfer</option>

            <option value="cheque">Cheque</option>
          </select>
        </div>

        {/* ====================================================
            REFERENCE NUMBER
        ==================================================== */}

        <div style={responsiveFieldStyle}>
          <label
            htmlFor="finora-payment-reference"
            style={collectionPaymentDetailsStyles.label}
          >
            Reference No
          </label>

          <input
            id="finora-payment-reference"
            type="text"
            value={reviewData.paymentReference || ""}
            onChange={(event) => handleReferenceChange(event.target.value)}
            placeholder="Enter reference number"
            style={collectionPaymentDetailsStyles.input}
          />
        </div>

        {/* ====================================================
            REMARKS
        ==================================================== */}

                {/* PAISARULE_C135_R14_PLACEHOLDERS */}
        <style>{`
          #finora-payment-reference::placeholder,
          #finora-payment-remarks::placeholder {
            color: var(
              --finora-theme-text-primary,
              var(--text, #111827)
            ) !important;
            opacity: 1;
          }
        `}</style>
        <div style={responsiveRemarksStyle}>
          <textarea
            id="finora-payment-remarks"
            readOnly={precloseRemarksLocked}
            value={reviewData.remarks || ""}
            onChange={(event) => handleRemarksChange(event.target.value)}
            placeholder="Enter remarks"
            rows={2}
            style={responsiveTextareaStyle}
          />
        </div>

        {/* ====================================================
            FINAL COLLECTION
        ==================================================== */}

        <div style={responsiveTotalStyle}>
          <div style={collectionPaymentDetailsStyles.totalContent}>
            <span style={collectionPaymentDetailsStyles.totalLabel}>
              FINAL COLLECTION
            </span>
          </div>

          <strong style={collectionPaymentDetailsStyles.totalValue}>
            {formatCurrency(finalCollection)}
          </strong>
        </div>

        {/* ====================================================
            ACTIONS
        ==================================================== */}

                {savedCollectionPopup && (
          <div
            role="presentation"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2147483000,
              background: "rgba(4, 12, 27, 0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Collection Received Successfully"
              style={{
                width: "100%",
                maxWidth: 410,
                maxHeight: "calc(100vh - 32px)",
                overflowY: "auto",
                boxSizing: "border-box",
                background: "#ffffff",
                color: "#192334",
                borderRadius: 20,
                padding: 24,
                boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 13,
              }}
            >
              <div style={{
                color: "#b8860b",
                fontSize: 13,
                fontWeight: 750,
                letterSpacing: 3,
              }}>
                PAISARULE
              </div>

              <div style={{
                width: 48,
                height: 2,
                borderRadius: 2,
                background: "#b8860b",
              }} />

              <div style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                border: "2px solid #16a34a",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 35,
                fontWeight: 700,
              }}>
                {"\u2713"}
              </div>

              <h2 style={{
                margin: 0,
                fontSize: 21,
                fontWeight: 700,
                textAlign: "center",
              }}>
                Collection Received Successfully
              </h2>

              <div style={{
                color: "#667085",
                fontSize: 13,
                textAlign: "center",
              }}>
                Payment recorded successfully
              </div>

              <div style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 16,
                borderRadius: 12,
                background: "#f2f5f8",
                textAlign: "center",
              }}>
                <div style={{
                  color: "#667085",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                }}>
                  AMOUNT RECEIVED
                </div>

                <div style={{
                  color: "#16a34a",
                  fontSize: 30,
                  fontWeight: 750,
                  marginTop: 5,
                }}>
                  {formatCurrency(savedCollectionPopup.amount)}
                </div>

                {savedCollectionPopup.nextEmiAdjustment && (
                  <div style={{
                    color: "#15803d",
                    fontSize: 12,
                    fontWeight: 700,
                    marginTop: 5,
                  }}>
                    {formatCurrency(
                      savedCollectionPopup.nextEmiAdjustment.amount,
                    )}{" "}
                    Adjusted to Next EMI{" "}
                    {String(
                      savedCollectionPopup.nextEmiAdjustment.emiNumber,
                    ).padStart(2, "0")}
                  </div>
                )}

                {savedCollectionPopup.penalty > 0 && (
                  <div style={{
                    color: "#667085",
                    fontSize: 12,
                    marginTop: 5,
                  }}>
                    Recorded Late Fee:{" "}
                    {formatCurrency(savedCollectionPopup.penalty)}
                  </div>
                )}

                {/* PAISARULE_C137_R99_SAVED_DISCOUNT */}
                {savedCollectionPopup.discount > 0 && (
                  <div style={{
                    color: "#15803d",
                    fontSize: 13,
                    fontWeight: 700,
                    marginTop: 7,
                  }}>
                    Discount Applied:{" "}
                    {formatCurrency(savedCollectionPopup.discount)}
                  </div>
                )}
              </div>

              <div style={{
                display: "grid",
                width: "100%",
                gap: 12,
                fontSize: 13,
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}>
                  <span style={{ color: "#667085" }}>Customer</span>
                  <strong>{savedCollectionPopup.customer}</strong>
                </div>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}>
                  <span style={{ color: "#667085" }}>
                    Collection Number
                  </span>
                  <strong style={{ overflowWrap: "anywhere", textAlign: "right", minWidth: 0 }}>
                    {String(savedCollectionPopup.number ?? "").replace(
                      /^FIN-COL-/i,
                      "PAISA-COL-",
                    )}
                  </strong>
                </div>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}>
                  <span style={{ color: "#667085" }}>
                    Payment Mode
                  </span>
                  <strong style={{ textTransform: "capitalize" }}>
                    {savedCollectionPopup.paymentMode}
                  </strong>
                </div>
              </div>

              {savedCollectionPopup.closed && (
                <div style={{
                  fontSize: 12,
                  color: "#15803d",
                  fontWeight: 700,
                }}>
                  Loan Closed Successfully
                </div>
              )}

              <button
                type="button"
                autoFocus
                onClick={() => {
                  // PAISARULE_C142_R2_OWNER_OK
                  // Owner acknowledgement is the UI boundary.
                  setSavedCollectionPopup(null);
                  resetTransactionForm();
                  window.dispatchEvent(
                    new Event("FINORA_LOAN_UPDATED"),
                  );
                  window.dispatchEvent(
                    new Event("FINORA_COLLECTION_UPDATED"),
                  );
                }}
                style={{
                  width: "100%",
                  minHeight: 46,
                  border: 0,
                  borderRadius: 11,
                  background: "#b8860b",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                OK
              </button>
            </div>
          </div>
        )}
        <div style={responsiveActionsStyle}>
          <button
            type="button"
            disabled={saving || manualMinimumBlocked || !refreshReady}
            aria-disabled={saving || manualMinimumBlocked || !refreshReady}
            title={
              manualMinimumBlocked
                ? "Minimum Collection Amount required"
                : undefined
            }
            onClick={() => void handleSaveCollection(false)}
            style={{
              ...responsiveSaveButtonStyle,
              ...(manualMinimumBlocked
                ? {
                    opacity: 1,
                    cursor: "not-allowed",
                  }
                : {}),
            }}
          >
            {saving ? "SAVING..." : !refreshReady ? "REFRESHING..." : "SAVE COLLECTION"}
          </button>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// END
// ============================================================
