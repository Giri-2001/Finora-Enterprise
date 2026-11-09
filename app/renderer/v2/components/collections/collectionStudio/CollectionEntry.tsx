// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// COLLECTION ENTRY — STEP 4
//
// RESPONSIBILITY
//
// - Render premium EMI Collection workspace
// - Render premium Manual Collection workspace
// - Provide middle presentation slot for System Generated
// - Switch between EMI and Manual Collection
// - Load the selected Loan's persisted EMI schedule
// - Allow eligible EMI selection
// - Allow Select All EMI selection
// - Display authoritative remaining loan / EMI balance
// - Display selected EMI amount
// - Allow manual collection amount editing
// - Allow manual principal editing
// - Allow discount editing
// - Write Step 4 changes directly to the Collection Controller
// - Reset local collection-entry presentation after save
//
// IMPORTANT
//
// - Business logic remains unchanged
// - Persistence flow remains unchanged
// - No financial calculations moved
// - System Generated remains its own component
// - middleSlot is presentation composition only
// - No hardcoded EMI schedule
// - No dummy schedule
// - No schedule generation here
// - No repository access
// - LoanService remains the Loan boundary
// - Controller remains the collection-state source of truth
// - No local theme system
// - No local responsive system
// - Geometry belongs to dedicated styles
//
// PREMIUM WORKSPACE CONTRACT
//
// LEFT
//   EMI COLLECTION
//
// CENTER
//   SYSTEM GENERATED
//
// RIGHT
//   MANUAL COLLECTION
//
// VERSION : 2.7
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { Capacitor } from "@capacitor/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { ReactNode } from "react";

import { CalendarCheck2, HandCoins } from "lucide-react";

import { collectionEntryStyles } from "./CollectionEntry.styles";

import { useCollectionController } from "../controller";

import { fetchLoans } from "../../../services/loan/loanService";
import { getSession } from "../../../store/authStore";

import {
  resolveBusinessDate,
} from "../../../services/business/businessDateService";

import { formatCurrency } from "../../../utils/currency/formatCurrency";

import TextInput from "../../common/form/TextInput";

import { useResponsive } from "../../../utils/responsive";

import {
  createCollectionEntryModeWorkspaceStyle,
  createCollectionEntryEmiCardStyle,
  createCollectionEntryMiddleSlotStyle,
  createCollectionEntryManualCardStyle,
  createCollectionEntryManualInputGridStyle,
  createCollectionEntryValueGridStyle,
} from "../../../utils/responsive/collections/collectionStudio.layout";

// ============================================================
// TYPES
// ============================================================

interface EmiRecord {
  installmentNumber: number;

  dueDate: string;

  installmentAmount: number;

  status: string;

  paidAmount?: number;

  penaltyAmount?: number;
  penaltyPaidAmount?: number;
  penaltyWaivedAmount?: number;
  receiptNumber?: string;

  paidDate?: string;
}

// ============================================================
// PROPS
// ============================================================
//
// Presentation-only composition slot.
//
// CollectionStudioPage owns the System Generated component and
// injects it here so the final workspace can render:
//
// EMI | SYSTEM GENERATED | MANUAL
//
// No financial or persistence responsibility is transferred.
// ============================================================

interface CollectionEntryProps {
  middleSlot?: ReactNode;
  onRefreshReadyChange?: (key: string, ready: boolean) => void;
}

// ============================================================
// HELPERS
// ============================================================

// ------------------------------------------------------------
// SAFE NUMBER
// ------------------------------------------------------------

function safeNumber(value: unknown): number {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, parsed);
}

// ============================================================
// COLLECTION BUSINESS DATE
// ============================================================

function getCollectionBusinessDate(): string {
  const session = getSession();

  return String(
    resolveBusinessDate(
      session?.businessDate,
    ) ?? "",
  ).trim();
}

// ============================================================
// OVERDUE CHECK
// ============================================================

function isOverdueInstallment(
  dueDate: string,
  businessDate: string,
): boolean {
  const normalizedDueDate =
    String(dueDate ?? "").trim().slice(0, 10);

  const normalizedBusinessDate =
    String(businessDate ?? "").trim().slice(0, 10);

  if (
    !normalizedDueDate ||
    !normalizedBusinessDate
  ) {
    return false;
  }

  const dueTime =
    new Date(
      normalizedDueDate + "T00:00:00",
    ).getTime();

  const businessTime =
    new Date(
      normalizedBusinessDate + "T00:00:00",
    ).getTime();

  if (
    Number.isNaN(dueTime) ||
    Number.isNaN(businessTime)
  ) {
    return false;
  }

  return dueTime < businessTime;
}


// ------------------------------------------------------------
// AUTHORITATIVE NUMBER CHECK
// ------------------------------------------------------------

function hasAuthoritativeNumber(value: unknown): boolean {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0;
}

// ------------------------------------------------------------
// CURRENCY
// ------------------------------------------------------------

function currency(value: number): string {
  const safeValue = Math.round(safeNumber(value));

  return `₹ ${formatCurrency(safeValue)}`;
}

// ------------------------------------------------------------
// DATE
// ------------------------------------------------------------

function formatEmiDate(value: string): string {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getDate()).padStart(2, "0");

  const month = date.toLocaleDateString("en-IN", {
    month: "short",
  });

  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

// ------------------------------------------------------------
// STATUS
// ------------------------------------------------------------

function normalizeStatus(status: string): string {
  return String(status ?? "")
    .trim()
    .toLowerCase();
}

// ------------------------------------------------------------
// LOCKED STATUS
// ------------------------------------------------------------

function isLockedStatus(status: string): boolean {
  const normalized = normalizeStatus(status);

  return (
    normalized === "paid" ||
    normalized === "preclosed" ||
    normalized === "overdue paid"
  );
}

// ------------------------------------------------------------
// DISPLAY STATUS
// ------------------------------------------------------------

function getStatusLabel(status: string): string {
  const value = String(status ?? "").trim();

  return value ? value.toUpperCase() : "PENDING";
}

// ------------------------------------------------------------
// REMAINING EMI AMOUNT
// ------------------------------------------------------------

function getRemainingEmiAmount(installment: EmiRecord): number {
  if (isLockedStatus(installment.status)) {
    return 0;
  }

  const installmentAmount =
    safeNumber(
      installment.installmentAmount,
    );

  const paidAmount =
    safeNumber(
      installment.paidAmount,
    );

  const remainingInstallmentAmount =
    Math.max(
      0,
      installmentAmount - paidAmount,
    );

  const penaltyAmount =
    safeNumber(
      installment.penaltyAmount,
    );

  return Math.max(
    0,
    remainingInstallmentAmount + penaltyAmount,
  );
}

// ------------------------------------------------------------
// SANITIZE MANUAL MONEY INPUT
// ------------------------------------------------------------

function sanitizeMoneyInput(rawValue: string): string {
  let sanitized = rawValue.replace(/[^0-9.]/g, "");

  const firstDecimalIndex = sanitized.indexOf(".");

  if (firstDecimalIndex >= 0) {
    const integerPart = sanitized.slice(0, firstDecimalIndex);

    const decimalPart = sanitized
      .slice(firstDecimalIndex + 1)
      .replace(/\./g, "")
      .slice(0, 2);

    sanitized = `${integerPart}.${decimalPart}`;
  }

  return sanitized;
}

// ============================================================
// COMPONENT
// ============================================================

export default function CollectionEntry({ middleSlot, onRefreshReadyChange }: CollectionEntryProps) {
  const { reviewData, updateField } = useCollectionController();

  // ==========================================================
  // FINORA RESPONSIVE ENGINE
  // ==========================================================

  const { viewport, tokens } = useResponsive();

  const responsiveModeWorkspaceStyle = {
    ...collectionEntryStyles.modeWorkspace,

    ...createCollectionEntryModeWorkspaceStyle(tokens, viewport),
  };

  const responsiveMiddleSlotStyle = {
    ...collectionEntryStyles.middleSlot,

    ...createCollectionEntryMiddleSlotStyle(viewport),
  };

  const responsiveManualInputGridStyle = {
    ...collectionEntryStyles.manualInputGrid,

    ...createCollectionEntryManualInputGridStyle(tokens, viewport),
  };

  const responsiveValueGridStyle = {
    ...collectionEntryStyles.valueGrid,

    ...createCollectionEntryValueGridStyle(tokens, viewport),
  };

  // ==========================================================
  // STABLE CONTROLLER WRITER
  // ==========================================================

  const updateFieldRef = useRef(updateField);

  updateFieldRef.current = updateField;

  // PAISARULE_C129_R10_REFRESH_READY
  const refreshReadyCallbackRef = useRef(onRefreshReadyChange);
  refreshReadyCallbackRef.current = onRefreshReadyChange;

  // ==========================================================
  // CONTROLLER VALUES
  // ==========================================================

  const paymentAmount = safeNumber(reviewData.paymentAmount);

  const discountAmount = safeNumber(reviewData.discountAmount);

  const manualPrincipal = safeNumber(reviewData.advanceAdjustment);

  const loanId = String(reviewData.loanId ?? "");

  // ==========================================================
  // COLLECTION MODE
  // ==========================================================

  const [collectionMode, setCollectionMode] = useState<"emi" | "manual">("emi");

  const isManual = collectionMode === "manual";

  const [discountLimitWarning, setDiscountLimitWarning] = useState(false);
  // PAISARULE_C137_R89_DISCOUNT_FOCUS
  const [discountInputFocused, setDiscountInputFocused] = useState(false);

  // PAISARULE_C132_R57_QUOTE_RECEIVER
  // UI-only quote: never grants financial Save authorization.
  // PAISARULE_C137_R10_AMOUNT_WORDS
  // Read-only presentation of the same collection cash amount.
  function collectionAmountInWords(value: number): string {
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      !Number.isSafeInteger(Math.round(value * 100))
    ) {
      return "Amount unavailable";
    }

    const totalPaise = Math.round(value * 100);
    const rupees = Math.floor(totalPaise / 100);
    const paise = totalPaise % 100;

    const ones = [
      "Zero", "One", "Two", "Three", "Four",
      "Five", "Six", "Seven", "Eight", "Nine",
      "Ten", "Eleven", "Twelve", "Thirteen",
      "Fourteen", "Fifteen", "Sixteen",
      "Seventeen", "Eighteen", "Nineteen",
    ];

    const tens = [
      "", "", "Twenty", "Thirty", "Forty",
      "Fifty", "Sixty", "Seventy", "Eighty",
      "Ninety",
    ];

    function belowThousand(n: number): string {
      if (n < 20) {
        return ones[n];
      }

      if (n < 100) {
        return (
          tens[Math.floor(n / 10)] +
          (n % 10 ? " " + ones[n % 10] : "")
        );
      }

      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + belowThousand(n % 100) : "")
      );
    }

    function spellInteger(n: number): string {
      if (n < 1000) {
        return belowThousand(n);
      }

      const groups: Array<[number, string]> = [
        [10000000, "Crore"],
        [100000, "Lakh"],
        [1000, "Thousand"],
      ];

      for (const [unit, label] of groups) {
        if (n >= unit) {
          const quotient = Math.floor(n / unit);
          const remainder = n % unit;

          return (
            spellInteger(quotient) +
            " " + label +
            (remainder ? " " + spellInteger(remainder) : "")
          );
        }
      }

      return belowThousand(n);
    }

    const rupeeWords = spellInteger(rupees) + " Rupees";

    if (paise === 0) {
      return rupeeWords + " Only";
    }

    return (
      rupeeWords +
      " and " +
      spellInteger(paise) +
      " Paise Only"
    );
  }
  // PAISARULE_C137_R26_PRECLOSE_PREVIEW
  // UI preview only. No settlement or save authorization.
  const [precloseStage, setPrecloseStage] =
    useState<"off" | "pending" | "confirmed">("off");

  const [precloseDialogOpen, setPrecloseDialogOpen] =
    useState(false);

  const [precloseReason, setPrecloseReason] = useState("");
  // PAISARULE_C137_R38_AUTOFILL
  // UI values only; not an authorization to save Preclosure.
  const preclosePreviousValuesRef = useRef<{
    loanId: string;
    receiptDate: string;
    paymentAmount: number;
    discountAmount: number;
    advanceAdjustment: number;
  } | null>(null);

  const [precloseAcknowledged, setPrecloseAcknowledged] =
    useState(false);

  // PAISARULE_C137_R31_R2_STATE
  useEffect(() => {
    setPrecloseStage("off");
    setPrecloseDialogOpen(false);
    setPrecloseAcknowledged(false);
    setPrecloseReason("");

    window.dispatchEvent(
      new CustomEvent("PAISARULE_PRECLOSE_REMARKS", {
        detail: { stage: "off" },
      }),
    );
  }, [loanId, reviewData.receiptDate]);

  // PAISARULE_C137_R35_R2_THEME
  // Read active theme from the existing Preclose field.
  function resolvePreclosePopupTheme() {
    const amountField = document.getElementById(
      "paisarule-preclose-loan-amount",
    );

    const remarksField = document.getElementById(
      "finora-payment-remarks",
    );

    const amountStyle = amountField
      ? window.getComputedStyle(amountField)
      : null;

    const remarksStyle = remarksField
      ? window.getComputedStyle(remarksField)
      : null;

    const surface =
      amountStyle?.backgroundColor ?? "rgb(20, 20, 20)";

    const text =
      amountStyle?.color ?? "#FFFFFF";

    const border =
      amountStyle?.borderColor ?? "#64748B";

    const inputSurface =
      remarksStyle?.backgroundColor ?? surface;

    const font =
      amountStyle?.fontFamily ?? "Arial, sans-serif";

    return {
      surface,
      text,
      border,
      inputSurface,
      font,
    };
  }
  const [precloseQuote, setPrecloseQuote] = useState<{
    loanId: string;
    receiptDate: string;
    amount: number;
    penaltyIncluded: number;
  } | null>(null);

  useEffect(() => {
    const activeLoanId = String(loanId).trim();
    const activeDate = String(reviewData.receiptDate ?? "").trim();

    setPrecloseQuote(null);

    function receivePrecloseQuote(event: Event): void {
      const detail = (event as CustomEvent<unknown>).detail;

      if (!detail || typeof detail !== "object") {
        return;
      }

      const quote = detail as Record<string, unknown>;
      const incomingLoanId = String(quote.loanId ?? "").trim();
      const incomingDate = String(quote.receiptDate ?? "").trim();
      const amount = quote.amount;
      const penaltyIncluded = quote.penaltyIncluded;

      if (
        !activeLoanId ||
        !activeDate ||
        incomingLoanId !== activeLoanId ||
        incomingDate !== activeDate ||
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        // PAISARULE_C137_R55_PENALTY_AWARE
        typeof penaltyIncluded !== "number" ||
        !Number.isFinite(penaltyIncluded) ||
        penaltyIncluded < 0 ||
        penaltyIncluded > amount ||
        !Number.isSafeInteger(Math.round(penaltyIncluded * 100)) ||
        Math.abs(
          penaltyIncluded * 100 -
          Math.round(penaltyIncluded * 100)
        ) > 0.000001 ||
        !Number.isSafeInteger(Math.round(amount * 100)) ||
        Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001
      ) {
        setPrecloseQuote(null);
        return;
      }

      setPrecloseQuote({
        loanId: incomingLoanId,
        receiptDate: incomingDate,
        amount,
        penaltyIncluded,
      });
    }

    window.addEventListener(
      "PAISARULE_PRECLOSE_CYCLE_QUOTE",
      receivePrecloseQuote,
    );

    // Request replay so mount order cannot silently lose the quote.
    window.dispatchEvent(
      new CustomEvent("PAISARULE_PRECLOSE_CYCLE_QUOTE_REQUEST", {
        detail: {
          loanId: activeLoanId,
          receiptDate: activeDate,
        },
      }),
    );

    return () => {
      window.removeEventListener(
        "PAISARULE_PRECLOSE_CYCLE_QUOTE",
        receivePrecloseQuote,
      );
    };
  }, [loanId, reviewData.receiptDate]);

  const visiblePrecloseAmount =
    precloseQuote?.loanId === String(loanId).trim() &&
    precloseQuote?.receiptDate === String(reviewData.receiptDate ?? "").trim()
      ? precloseQuote.amount
      : null;

  const visiblePreclosePenalty =
    precloseQuote?.loanId === String(loanId).trim() &&
    precloseQuote?.receiptDate === String(reviewData.receiptDate ?? "").trim()
      ? precloseQuote.penaltyIncluded
      : null;

  // ==========================================================
  // EMI STATE
  // ==========================================================

  const [emiSchedule, setEmiSchedule] = useState<EmiRecord[]>([]);

  const [loading, setLoading] = useState(false);

  const [loadError, setLoadError] = useState("");

  const [selectedEmiNumbers, setSelectedEmiNumbers] = useState<number[]>([]);

  // PAISARULE_C129_R21_BRAND_EMI_PRESERVE
  const brandSelectedEmisRef = useRef(selectedEmiNumbers);
  brandSelectedEmisRef.current = selectedEmiNumbers;

  const brandCollectionModeRef = useRef(collectionMode);
  brandCollectionModeRef.current = collectionMode;

  // ==========================================================
  // EMI DROPDOWN STATE
  // ==========================================================

  const [emiDropdownOpen, setEmiDropdownOpen] = useState(true);

  // FINORA_AP03_R014_EMI_HEADER_WIDTH
  // Header and EMI rows share the same Android scroll width.
  const isAndroidMobileEmi =
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android" &&
    viewport === "mobile";

  // ==========================================================
  // SELECT ALL CHECKBOX REF
  // ==========================================================

  const selectAllCheckboxRef = useRef<HTMLInputElement | null>(null);

  // ==========================================================
  // LOAD REAL EMI SCHEDULE
  // ==========================================================

  // PAISARULE_C129_R5_LATEST_DATE_GUARD
  // The active Loan/Date is authoritative for UI refresh.
  // Older asynchronous reads must never overwrite new state.
  const scheduleLoadEpochRef = useRef(0);
  const scheduleAuthorityKeyRef = useRef("");

  scheduleAuthorityKeyRef.current =
    loanId + "|" + String(reviewData.receiptDate ?? "");

  const loadSchedule = useCallback(
    async (resetSharedTransactionState = true, preserveBrandSelection = false): Promise<void> => {
      const requestKey =
        loanId + "|" + String(reviewData.receiptDate ?? "");

      // A callback from an obsolete render cannot supersede
      // the active Loan/Date request.
      if (scheduleAuthorityKeyRef.current !== requestKey) {
        return;
      }

      const requestEpoch = ++scheduleLoadEpochRef.current;

      refreshReadyCallbackRef.current?.(requestKey, false);

      const isCurrentRequest = (): boolean =>
        requestEpoch === scheduleLoadEpochRef.current &&
        requestKey === scheduleAuthorityKeyRef.current;

      if (!loanId) {
        setEmiSchedule([]);

        setSelectedEmiNumbers([]);

        setEmiDropdownOpen(false);

        setLoadError("");

        setLoading(false);

        if (resetSharedTransactionState) {
          updateFieldRef.current("selectedEmiNumbers", []);

          updateFieldRef.current("selectedEmiAmount", 0);
        }

        return;
      }

      setLoading(true);

      setLoadError("");

      setEmiDropdownOpen(true);

      try {
        const loans = await fetchLoans();

        if (!isCurrentRequest()) {
          return;
        }

        const selectedLoan = loans.find(
          (loan: { id?: string }) => String(loan.id ?? "") === loanId,
        );

        const selectedLoanLateFee =
          safeNumber(
            (
              selectedLoan as
                | {
                    lateFee?: unknown;
                  }
                | undefined
            )?.lateFee,
          );

        const collectionBusinessDate =
          reviewData.receiptDate || getCollectionBusinessDate();


        const rawSchedule = Array.isArray(
          (
            selectedLoan as
              | {
                  schedule?: unknown;
                }
              | undefined
          )?.schedule,
        )
          ? ((
              selectedLoan as
                | {
                    schedule?: unknown;
                  }
                | undefined
            )?.schedule as EmiRecord[])
          : [];

        const normalizedSchedule = rawSchedule
          .map(
            (installment): EmiRecord => {
              const installmentNumber =
                Number(
                  installment.installmentNumber,
                ) || 0;

              const dueDate =
                String(
                  installment.dueDate ?? "",
                );

              const installmentAmount =
                safeNumber(
                  installment.installmentAmount,
                );

              const paidAmount =
                safeNumber(
                  installment.paidAmount,
                );

              const existingStatus =
                String(
                  installment.status ?? "Pending",
                );

              const existingPenaltyAmount =
                safeNumber(
                  (
                    installment as
                      | {
                          penaltyAmount?: unknown;
                        }
                      | undefined
                  )?.penaltyAmount,
                );

              const normalizedStatus =
                normalizeStatus(
                  existingStatus,
                );

              const finalStatus =
                normalizedStatus === "paid" ||
                normalizedStatus === "overdue paid" ||
                normalizedStatus === "preclosed";

              const fullyPaid =
                installmentAmount > 0 &&
                paidAmount >= installmentAmount;

              const overdue =
                !finalStatus &&
                !fullyPaid &&
                isOverdueInstallment(
                  dueDate,
                  collectionBusinessDate,
                );

              const penaltyAmount =
                overdue
                  ? (
                      existingPenaltyAmount > 0
                        ? existingPenaltyAmount
                        : selectedLoanLateFee
                    )
                  : existingPenaltyAmount;

              const status =
                normalizedStatus === "overdue paid"
                  ? "Overdue Paid"
                  : overdue
                    ? "Overdue"
                    : fullyPaid
                      ? "Paid"
                      : existingStatus;

              return {
                installmentNumber,

                dueDate,

                installmentAmount,

                status,

                paidAmount,

                penaltyAmount,

                // PAISARULE_C132_R53_OVERDUE_EVIDENCE
                // Assessed, collected and waived are distinct.
                penaltyPaidAmount: safeNumber(
                  installment.penaltyPaidAmount,
                ),

                penaltyWaivedAmount: safeNumber(
                  installment.penaltyWaivedAmount,
                ),

                receiptNumber:
                  String(
                    installment.receiptNumber ?? "",
                  ),

                paidDate:
                  String(
                    installment.paidDate ?? "",
                  ),
              };
            },
          )
          .filter(
            (installment) =>
              installment.installmentNumber > 0,
          );

        if (!isCurrentRequest()) {
          return;
        }

        if (!selectedLoan || normalizedSchedule.length === 0) {
          setEmiSchedule([]);
          setLoadError("Authoritative EMI schedule unavailable.");
          return;
        }

        setEmiSchedule(normalizedSchedule);

        const overduePenaltyTotal = normalizedSchedule.reduce(
          (total, installment) =>
            normalizeStatus(installment.status) === "overdue"
              ? total + safeNumber(installment.penaltyAmount)
              : total,
          0,
        );

        if (preserveBrandSelection) {
          // Reconcile the currently selected EMI against latest data.
          // Manual payment fields remain untouched.
          const previousNumbers = brandSelectedEmisRef.current;

          const validNumbers =
            brandCollectionModeRef.current === "emi"
              ? previousNumbers.filter((number) =>
                  normalizedSchedule.some(
                    (item) =>
                      item.installmentNumber === number &&
                      !isLockedStatus(item.status) &&
                      getRemainingEmiAmount(item) > 0,
                  ),
                )
              : [];

          if (brandCollectionModeRef.current === "emi") {
            const refreshedEmiAmount = normalizedSchedule.reduce(
              (total, item) =>
                validNumbers.includes(item.installmentNumber)
                  ? total + getRemainingEmiAmount(item)
                  : total,
              0,
            );

            const refreshedSelectedPenalty = normalizedSchedule.reduce(
              (total, item) =>
                validNumbers.includes(item.installmentNumber) &&
                normalizeStatus(item.status) === "overdue"
                  ? total + safeNumber(item.penaltyAmount)
                  : total,
              0,
            );

            setSelectedEmiNumbers(validNumbers);
            updateFieldRef.current("selectedEmiNumbers", validNumbers);
            updateFieldRef.current("selectedEmiAmount", refreshedEmiAmount);

            if (previousNumbers.length > 0) {
              updateFieldRef.current("paymentAmount", refreshedEmiAmount);
            }

            updateFieldRef.current(
              "penaltyAmount",
              validNumbers.length > 0
                ? refreshedSelectedPenalty
                : overduePenaltyTotal,
            );
          } else {
            updateFieldRef.current("penaltyAmount", overduePenaltyTotal);
          }
        } else {
          updateFieldRef.current("penaltyAmount", overduePenaltyTotal);

          setSelectedEmiNumbers([]);

          if (resetSharedTransactionState) {
            updateFieldRef.current("selectedEmiNumbers", []);
            updateFieldRef.current("selectedEmiAmount", 0);
            updateFieldRef.current("paymentAmount", 0);
          }
        }

        refreshReadyCallbackRef.current?.(requestKey, true);
      } catch (error) {
        if (!isCurrentRequest()) {
          return;
        }
        console.error("FINORA STEP 4 EMI SCHEDULE LOAD ERROR:", error);

        setEmiSchedule([]);

        setSelectedEmiNumbers([]);

        setEmiDropdownOpen(false);

        if (resetSharedTransactionState) {
          updateFieldRef.current("selectedEmiNumbers", []);

          updateFieldRef.current("selectedEmiAmount", 0);

          updateFieldRef.current("paymentAmount", 0);
        }

        setLoadError("Unable to load the selected loan EMI schedule.");
      } finally {
        if (isCurrentRequest()) {
          setLoading(false);
        }
      }
    },
    [loanId, reviewData.receiptDate],
  );

  // ==========================================================
  // LOAD WHEN LOAN CHANGES
  // ==========================================================

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  // ==========================================================
  // REFRESH AFTER LOAN UPDATE
  // ==========================================================

  useEffect(() => {
    function handleLoanUpdated(): void {
      /*
       * Refresh the persisted EMI schedule only.
       *
       * PaymentDetails already resets the shared Collection
       * transaction state after successful persistence.
       *
       * Avoid writing shared controller fields here because this
       * hook instance may still hold the pre-save review snapshot.
       */
      void loadSchedule(false);
    }

    window.addEventListener("FINORA_LOAN_UPDATED", handleLoanUpdated);

    return () => {
      window.removeEventListener("FINORA_LOAN_UPDATED", handleLoanUpdated);
    };
  }, [loadSchedule]);

  // PAISARULE_C129_R21_BRAND_EVENT_LISTENER
  useEffect(() => {
    function handleBrandRefresh(): void {
      void loadSchedule(false, true);
    }

    window.addEventListener(
      "PAISARULE_COLLECTION_BRAND_REFRESH",
      handleBrandRefresh,
    );

    return () => {
      window.removeEventListener(
        "PAISARULE_COLLECTION_BRAND_REFRESH",
        handleBrandRefresh,
      );
    };
  }, [loadSchedule]);

  // ==========================================================
  // POST-SAVE LOCAL FORM RESET
  // ==========================================================

  useEffect(() => {
    function handleCollectionFormReset(): void {
      setCollectionMode("emi");

      setSelectedEmiNumbers([]);

      setEmiDropdownOpen(false);
    }

    window.addEventListener(
      "FINORA_COLLECTION_FORM_RESET",
      handleCollectionFormReset,
    );

    return () => {
      window.removeEventListener(
        "FINORA_COLLECTION_FORM_RESET",
        handleCollectionFormReset,
      );
    };
  }, []);

  // ==========================================================
  // SCHEDULE REMAINING AMOUNT
  // ==========================================================

  const scheduleRemainingAmount = useMemo(
    () =>
      emiSchedule.reduce(
        (total, installment) => total + getRemainingEmiAmount(installment),
        0,
      ),
    [emiSchedule],
  );

  // ==========================================================
  // AUTHORITATIVE TOTAL EMI / LOAN BALANCE
  // ==========================================================

  // PAISARULE_C142_R3_AUTHORITATIVE_ZERO_BALANCE
  // Zero is a valid authoritative outstanding value.
  // Do not fall back to schedule residuals for a CLOSED loan.
  const rawAuthoritativeOutstanding =
    reviewData.outstandingBalance;

  const authoritativeOutstandingNumber =
    Number(rawAuthoritativeOutstanding);

  const hasExplicitAuthoritativeOutstanding =
    rawAuthoritativeOutstanding !== null &&
    rawAuthoritativeOutstanding !== undefined &&
    String(rawAuthoritativeOutstanding).trim() !== "" &&
    Number.isFinite(authoritativeOutstandingNumber) &&
    authoritativeOutstandingNumber >= 0;

  const totalRemainingEmiAmount =
    hasExplicitAuthoritativeOutstanding
      ? authoritativeOutstandingNumber
      : scheduleRemainingAmount;

  // ==========================================================
  // ELIGIBLE EMI LIST
  // ==========================================================

  const eligibleEmis = useMemo(
    () =>
      emiSchedule.filter(
        (installment) =>
          !isLockedStatus(installment.status) &&
          getRemainingEmiAmount(installment) > 0,
      ),
    [emiSchedule],
  );

  // PAISARULE R85: First unsettled EMI is mandatory in Manual mode.
  // Reuse the EMI table's date-sensitive remaining amount.
  const manualMinimumEmi = useMemo(
    () =>
      [...eligibleEmis].sort(
        (a, b) => a.installmentNumber - b.installmentNumber,
      )[0],
    [eligibleEmis],
  );

  const manualGrossMinimum = manualMinimumEmi
    ? getRemainingEmiAmount(manualMinimumEmi)
    : 0;

  const manualMinimumAmount = Math.max(
    0,
    manualGrossMinimum - discountAmount,
  );

  const manualAmountBelowMinimum =
    isManual &&
    paymentAmount > 0 &&
    manualMinimumAmount > 0 &&
    Math.round(paymentAmount * 100) <
      Math.round(manualMinimumAmount * 100);

  // ==========================================================
  // SELECTED EMI AMOUNT
  // ==========================================================

  const selectedEmiAmount = useMemo(
    () =>
      emiSchedule.reduce((total, installment) => {
        if (!selectedEmiNumbers.includes(installment.installmentNumber)) {
          return total;
        }

        return total + getRemainingEmiAmount(installment);
      }, 0),
    [emiSchedule, selectedEmiNumbers],
  );

  // ==========================================================
  // SELECT ALL STATE
  // ==========================================================

  // C132: Discount is allowed only against unpaid overdue.
  // Save must independently verify against authoritative records.
  const eligibleOverdueDiscount = useMemo(() => {
    const rows =
      selectedEmiNumbers.length > 0
        ? emiSchedule.filter(
            (installment) =>
              selectedEmiNumbers.includes(installment.installmentNumber) &&
              !isLockedStatus(installment.status),
          )
        : manualMinimumEmi
          ? [manualMinimumEmi]
          : [];

    const cents = rows.reduce((total, installment) => {
      const penalty = safeNumber(installment.penaltyAmount);

      const penaltyPaid = safeNumber(
        (installment as EmiRecord & {
          penaltyPaidAmount?: number;
        }).penaltyPaidAmount,
      );

      const penaltyWaived = safeNumber(
        (installment as EmiRecord & {
          penaltyWaivedAmount?: number;
        }).penaltyWaivedAmount,
      );

      return total + Math.max(
        0,
        Math.round(penalty * 100) -
          Math.round(penaltyPaid * 100) -
          Math.round(penaltyWaived * 100),
      );
    }, 0);

    return cents / 100;
  }, [emiSchedule, selectedEmiNumbers, manualMinimumEmi]);
  const allEligibleSelected =
    eligibleEmis.length > 0 &&
    eligibleEmis.every((installment) =>
      selectedEmiNumbers.includes(installment.installmentNumber),
    );

  const someEligibleSelected = eligibleEmis.some((installment) =>
    selectedEmiNumbers.includes(installment.installmentNumber),
  );

  // ==========================================================
  // SELECT ALL INDETERMINATE
  // ==========================================================

  useEffect(() => {
    if (!selectAllCheckboxRef.current) {
      return;
    }

    selectAllCheckboxRef.current.indeterminate =
      someEligibleSelected && !allEligibleSelected;
  }, [someEligibleSelected, allEligibleSelected]);

  // ==========================================================
  // MODE CHANGE
  // ==========================================================

  function handleModeChange(mode: "emi" | "manual"): void {
    console.log("FINORA STEP 4 MODE:", mode);

    setCollectionMode(mode);
    updateField("penaltyAmount", 0);

    setSelectedEmiNumbers([]);

    setEmiDropdownOpen(true);

    updateField("selectedEmiNumbers", []);

    updateField("selectedEmiAmount", 0);

    updateField("paymentAmount", 0);

    if (mode === "emi") {
      updateField("advanceAdjustment", 0);

      updateField("discountAmount", 0);
    }

    // PAISARULE_C129_R6_MODE_REFRESH
    // Re-evaluate penalty for the active Loan and Date.
    // R5 rejects obsolete asynchronous responses.
    void loadSchedule(false);
  }

  // ==========================================================
  // MANUAL VALUE CHANGE
  // ==========================================================

  function handleManualValueChange(
    field: "paymentAmount" | "advanceAdjustment" | "discountAmount",

    rawValue: string,
  ): void {
    const sanitized = sanitizeMoneyInput(rawValue);

    const value =
      sanitized === "" || sanitized === "."
        ? 0
        : safeNumber(sanitized);

    if (field === "discountAmount") {
      if (
        !Number.isFinite(value) ||
        value < 0 ||
        Math.round(value * 100) >
          Math.round(eligibleOverdueDiscount * 100)
      ) {
        setDiscountLimitWarning(true);
        return;
      }

      setDiscountLimitWarning(false);

      const grossAmount =
        selectedEmiNumbers.length > 0
          ? selectedEmiAmount
          : paymentAmount + discountAmount;

      const nextCashAmount =
        Math.max(
          0,
          Math.round((grossAmount - value) * 100) / 100,
        );

      updateField("discountAmount", value);
      updateField("paymentAmount", nextCashAmount);

      return;
    }

    updateField(field, value);
  }

  // ==========================================================
  // EMI SELECTION
  // ==========================================================

  function handleEmiSelection(installment: EmiRecord): void {
    if (isLockedStatus(installment.status)) {
      return;
    }

    const remainingAmount = getRemainingEmiAmount(installment);

    if (remainingAmount <= 0) {
      return;
    }

    const exists = selectedEmiNumbers.includes(installment.installmentNumber);

    const nextSelection = exists
      ? selectedEmiNumbers.filter(
          (number) => number !== installment.installmentNumber,
        )
      : [...selectedEmiNumbers, installment.installmentNumber];

    const nextAmount = emiSchedule.reduce((total, currentInstallment) => {
      if (!nextSelection.includes(currentInstallment.installmentNumber)) {
        return total;
      }

      return total + getRemainingEmiAmount(currentInstallment);
    }, 0);

    const nextPenaltyAmount = emiSchedule.reduce(
      (total, currentInstallment) => {
        if (!nextSelection.includes(currentInstallment.installmentNumber)) {
          return total;
        }

        return (
          total +
          (normalizeStatus(currentInstallment.status) === "overdue"
            ? safeNumber(currentInstallment.penaltyAmount)
            : 0)
        );
      },
      0,
    );

    setSelectedEmiNumbers(nextSelection);

    updateField("selectedEmiNumbers", nextSelection);

    updateField("selectedEmiAmount", nextAmount);
    updateField("penaltyAmount", nextPenaltyAmount);

    updateField("discountAmount", 0);
    setDiscountLimitWarning(false);
    updateField("paymentAmount", nextAmount);

console.log(
      "FINORA STEP 4 EMI SELECTED:",
      installment.installmentNumber,
      remainingAmount,
    );
  }

  // ==========================================================
  // SELECT ALL / DESELECT ALL
  // ==========================================================

  function handleSelectAllEmis(): void {
    if (eligibleEmis.length === 0) {
      return;
    }

    const nextSelection = allEligibleSelected
      ? selectedEmiNumbers.filter(
          (number) =>
            !eligibleEmis.some(
              (installment) => installment.installmentNumber === number,
            ),
        )
      : Array.from(
          new Set([
            ...selectedEmiNumbers,

            ...eligibleEmis.map((installment) => installment.installmentNumber),
          ]),
        );

    const nextAmount = emiSchedule.reduce((total, installment) => {
      if (!nextSelection.includes(installment.installmentNumber)) {
        return total;
      }

      return total + getRemainingEmiAmount(installment);
    }, 0);

    const nextPenaltyAmount = emiSchedule.reduce(
      (total, installment) => {
        if (!nextSelection.includes(installment.installmentNumber)) {
          return total;
        }

        return (
          total +
          (normalizeStatus(installment.status) === "overdue"
            ? safeNumber(installment.penaltyAmount)
            : 0)
        );
      },
      0,
    );

    setSelectedEmiNumbers(nextSelection);

    updateField("selectedEmiNumbers", nextSelection);

    updateField("selectedEmiAmount", nextAmount);
    updateField("penaltyAmount", nextPenaltyAmount);

    updateField("discountAmount", 0);
    setDiscountLimitWarning(false);
    updateField("paymentAmount", nextAmount);

console.log(
      allEligibleSelected
        ? "FINORA STEP 4 ALL ELIGIBLE EMIS DESELECTED"
        : "PAISARULE STEP 4 ALL ELIGIBLE EMIS SELECTED",
    );
  }

  // ==========================================================
  // ACTIVATE EMI + TOGGLE SELECTOR
  // ==========================================================

  function handleEmiTriggerClick(): void {
    if (isManual) {
      handleModeChange("emi");

      setEmiDropdownOpen(true);

      return;
    }

    setEmiDropdownOpen((previous) => !previous);
  }

  // ==========================================================
  // ACTIVATE MANUAL FROM FIELD
  // ==========================================================

  function ensureManualMode(): void {
    if (!isManual) {
      handleModeChange("manual");
    }
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section style={collectionEntryStyles.panel}>
        {/* PAISARULE_C135_R10_MANUAL_PLACEHOLDER_CONTRAST */}
        <style>{`
          /* PAISARULE_C137_R20_COLLECTION_BORDER */
          input[aria-label="Manual collection amount"] {
            border: 1px solid rgba(220, 235, 255, 0.95) !important;
            border-right: 1px solid rgba(220, 235, 255, 0.95) !important;
            box-sizing: border-box !important;
            background-clip: padding-box;
          }

          input[aria-label="Manual collection amount"][aria-invalid="true"] {
            border: 1px solid var(--finora-danger, #dc2626) !important;
            border-right: 1px solid var(--finora-danger, #dc2626) !important;
          }
          input[aria-label="Manual collection amount"]::placeholder,
          input[aria-label="Manual principal"]::placeholder,
          input[aria-label="Discount"]::placeholder {
            color: var(
              --finora-theme-text-primary,
              var(--text, #111827)
            ) !important;
            opacity: 1;
          }
        `}</style>
      <div style={responsiveModeWorkspaceStyle}>
        {/* ==================================================
            LEFT — EMI COLLECTION
        ================================================== */}

        <section
          style={{
            ...collectionEntryStyles.modeCard,

            ...createCollectionEntryEmiCardStyle(viewport),

            ...(!isManual
              ? collectionEntryStyles.modeCardActive
              : collectionEntryStyles.modeCardInactive),
          }}
        >
          {/* ================================================
              EMI HEADER
          ================================================ */}

          <header style={collectionEntryStyles.modeCardHeader}>
            <div style={collectionEntryStyles.modeCardHeaderMain}>
              <CalendarCheck2
                aria-hidden="true"
                style={collectionEntryStyles.modeCardIcon}
              />

              <div style={collectionEntryStyles.modeCardHeadingGroup}>
                <h2 style={collectionEntryStyles.modeCardTitle}>
                  EMI COLLECTION
                </h2>

                <p style={collectionEntryStyles.modeCardSubtitle}>
                  Select one or more eligible EMI installments.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Use EMI collection"
              aria-pressed={!isManual}
              onClick={() => handleModeChange("emi")}
              style={{
                ...collectionEntryStyles.modeCardSelector,

                ...(!isManual
                  ? collectionEntryStyles.modeCardSelectorActive
                  : {}),
              }}
            >
              {!isManual ? "✓" : ""}
            </button>
          </header>

          {/* ================================================
              EMI BODY
          ================================================ */}

          <div style={collectionEntryStyles.modeCardBody}>
            {/* ==============================================
                EMI SELECTOR
            ============================================== */}

            <div style={collectionEntryStyles.emiDropdown}>
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={emiDropdownOpen}
                onClick={handleEmiTriggerClick}
                style={collectionEntryStyles.emiDropdownTrigger}
              >
                <span style={collectionEntryStyles.emiDropdownTriggerText}>
                  {selectedEmiNumbers.length > 0
                    ? `${selectedEmiNumbers.length} EMI${
                        selectedEmiNumbers.length === 1 ? "" : "s"
                      } selected`
                    : "Select EMI(s)"}
                </span>

                <span
                  aria-hidden="true"
                  style={collectionEntryStyles.emiDropdownArrow}
                >
                  {emiDropdownOpen ? "▴" : "▾"}
                </span>
              </button>

              {/* ============================================
                  EMI DROPDOWN
              ============================================ */}

              {emiDropdownOpen && (
                <div
                  role="listbox"
                  aria-label="EMI schedule"
                  style={{
                    ...collectionEntryStyles.emiDropdownPanel,

                    ...(viewport === "mobile"
                      ? {
                          width: "100%",
                          maxWidth: "100%",
                          minWidth: 0,
                          overflowX: "auto",
                          overflowY: "auto",
                          WebkitOverflowScrolling: "touch",
                        }
                      : {}),
                  }}
                >
                  <div
                    style={{
                      ...collectionEntryStyles.emiDropdownHeader,
                      ...(viewport === "mobile"
                        ? {
                            width: "430px",
                            minWidth: "430px",
                            maxWidth: "none",
                            boxSizing: "border-box",
                            justifyContent: "space-between",
                            position: "relative" as const,
                          }
                        : {}),
                    }}
                  >
                    <span style={collectionEntryStyles.scheduleHeader}>
                      EMI SCHEDULE
                    </span>

                    <span
                      style={{
                        ...collectionEntryStyles.scheduleCount,
                        ...(viewport === "mobile"
                          ? {
                              marginLeft: "auto",
                              textAlign: "right" as const,
                              flexShrink: 0,
                            }
                          : {}),
                      }}
                    >
                      {emiSchedule.length}{" "}
                      {emiSchedule.length === 1
                        ? "INSTALLMENT"
                        : "INSTALLMENTS"}
                    </span>
                  </div>

                  {loading ? (
                    <div style={collectionEntryStyles.loadingSchedule}>
                      Loading EMI schedule...
                    </div>
                  ) : loadError ? (
                    <div style={collectionEntryStyles.errorSchedule}>
                      {loadError}
                    </div>
                  ) : emiSchedule.length === 0 ? (
                    <div style={collectionEntryStyles.emptySchedule}>
                      No EMI schedule is stored for the selected loan.
                    </div>
                  ) : (
                    <div
                      style={{
                        ...collectionEntryStyles.emiDropdownList,

                        ...(isAndroidMobileEmi
                          ? {
                              width: "430px",
                              minWidth: "430px",
                              maxWidth: "none",
                            }
                          : viewport === "mobile"
                            ? {
                                width: "max-content",
                                minWidth: "430px",
                              }
                            : {}),
                      }}
                    >
                      {emiSchedule.map((installment) => {
                        const locked = isLockedStatus(installment.status);

                        const remainingAmount =
                          getRemainingEmiAmount(installment);

                        const selected = selectedEmiNumbers.includes(
                          installment.installmentNumber,
                        );

                        const normalizedStatus = normalizeStatus(
                          installment.status,
                        );

                        const statusStyle = {
                          ...collectionEntryStyles.status,

                          ...((normalizedStatus === "paid" ||
                              normalizedStatus === "overdue paid")
                            ? collectionEntryStyles.statusPaid
                            : normalizedStatus === "preclosed"
                              ? collectionEntryStyles.statusPreclosed
                              : normalizedStatus === "overdue"
                                  ? collectionEntryStyles.statusOverdue
                                  : collectionEntryStyles.statusPending),
                        };

                        return (
                          <label
                            key={installment.installmentNumber}
                            style={{
                              ...collectionEntryStyles.emiDropdownRow,

                              ...(selected
                                ? collectionEntryStyles.selectedRow
                                : {}),

                              ...(locked
                                ? collectionEntryStyles.lockedRow
                                : {}),
                            }}
                          >
                            <span style={collectionEntryStyles.emiName}>
                              EMI {installment.installmentNumber}
                            </span>

                            <span
                              style={collectionEntryStyles.scheduleTableCell}
                            >
                              {formatEmiDate(installment.dueDate)}
                            </span>

                            <strong
                              style={collectionEntryStyles.emiAmount}
                              title={
                                locked
                                  ? "Remaining ₹0"
                                  : `Remaining ${currency(remainingAmount)}`
                              }
                            >
                                {safeNumber(installment.penaltyAmount) > 0                                   ? `${currency(                                       normalizedStatus === "overdue paid"                                         ? safeNumber(installment.installmentAmount)                                         : Math.max(                                             0,                                             safeNumber(installment.installmentAmount) -                                               safeNumber(installment.paidAmount),                                           ),                                     )} + ${currency(                                       safeNumber(installment.penaltyAmount),                                     )}`
                                : normalizedStatus === "partial"
                                  ? `${currency(safeNumber(installment.installmentAmount))} - ${currency(safeNumber(installment.paidAmount))}`
                                  : currency(installment.installmentAmount)}
                            </strong>

                            <span
                              style={{
                                ...statusStyle,
                                ...(viewport === "mobile"
                                  ? {
                                      width: "max-content",
                                      maxWidth: "none",
                                      minWidth: "max-content",
                                      marginLeft: "-32px",
                                      position: "relative" as const,
                                      zIndex: 1,
                                      whiteSpace: "nowrap" as const,
                                      flexShrink: 0,
                                    }
                                  : {}),
                              }}
                            >
                              {getStatusLabel(installment.status)}
                            </span>

                            <span style={collectionEntryStyles.selectCell}>
                              <input
                                type="checkbox"
                                checked={locked || selected}
                                disabled={locked || remainingAmount <= 0}
                                onChange={() => handleEmiSelection(installment)}
                                aria-label={
                                  locked
                                    ? `EMI ${installment.installmentNumber} is locked`
                                    : `Select EMI ${installment.installmentNumber}`
                                }
                                style={collectionEntryStyles.selectControl}
                              />

                              {locked && (
                                <span
                                  style={collectionEntryStyles.lockIcon}
                                  title="Completed installment"
                                  aria-hidden="true"
                                >
                                  🔒
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}

                      <div
                        style={{
                          ...collectionEntryStyles.emiTotalRow,
                          ...(viewport === "mobile"
                            ? {
                                gridTemplateColumns:
                                  "minmax(115px, 1fr) minmax(90px, 1fr) minmax(75px, 0.8fr) 36px",
                              }
                            : {}),
                        }}
                      >
                        <strong
                          style={{
                            ...collectionEntryStyles.emiTotalLabel,
                            ...(viewport === "mobile"
                              ? { gridColumn: "1" }
                              : {}),
                          }}
                        >
                          TOTAL BALANCE
                        </strong>

                        <span
                          style={{
                            ...collectionEntryStyles.emiTotalSpacer,
                            ...(viewport === "mobile"
                              ? { display: "none" }
                              : {}),
                          }}
                        />

                        <strong
                          style={{
                            ...collectionEntryStyles.emiTotalAmount,
                            ...(viewport === "mobile"
                              ? { transform: "translateX(14px)" }
                              : {}),
                          }}
                        >
                          {currency(totalRemainingEmiAmount)}
                        </strong>

                        <span style={collectionEntryStyles.emiTotalStatus}>
                          SELECT ALL
                        </span>

                        <span style={collectionEntryStyles.selectCell}>
                          <input
                            ref={selectAllCheckboxRef}
                            type="checkbox"
                            checked={allEligibleSelected}
                            disabled={eligibleEmis.length === 0}
                            onChange={handleSelectAllEmis}
                            aria-label={
                              allEligibleSelected
                                ? "Deselect all eligible EMIs"
                                : "Select all eligible EMIs"
                            }
                            title={
                              allEligibleSelected
                                ? "Deselect all EMIs"
                                : "Select all EMIs"
                            }
                            style={collectionEntryStyles.selectControl}
                          />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ==============================================
                SELECTED EMI VALUE
            ============================================== */}

            <div
              style={{
                ...collectionEntryStyles.compactValueCard,

                ...(!isManual
                  ? collectionEntryStyles.compactValueCardActive
                  : {}),
              }}
            >
              <div style={collectionEntryStyles.compactValueContent}>
                <span style={collectionEntryStyles.compactValueLabel}>
                  SELECTED EMI AMOUNT
                </span>

                <strong style={collectionEntryStyles.compactValueValue}>
                  {currency(isManual ? 0 : selectedEmiAmount)}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            CENTER — SYSTEM GENERATED SLOT
        ================================================== */}

        <div style={responsiveMiddleSlotStyle}>{middleSlot}</div>

        {/* ==================================================
            RIGHT — MANUAL COLLECTION
        ================================================== */}

        <section
          style={{
            ...collectionEntryStyles.modeCard,

            ...createCollectionEntryManualCardStyle(viewport),

            ...(isManual
              ? collectionEntryStyles.modeCardActive
              : collectionEntryStyles.modeCardInactive),
          }}
        >
          {/* ================================================
              MANUAL HEADER
          ================================================ */}

          <header style={collectionEntryStyles.modeCardHeader}>
            <div style={collectionEntryStyles.modeCardHeaderMain}>
              <HandCoins
                aria-hidden="true"
                style={collectionEntryStyles.modeCardIcon}
              />

              <div style={collectionEntryStyles.modeCardHeadingGroup}>
                <h2 style={collectionEntryStyles.modeCardTitle}>
                  MANUAL COLLECTION
                </h2>

                <p style={collectionEntryStyles.modeCardSubtitle}>
                  Enter collection amount and settlement adjustments.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Use manual collection"
              aria-pressed={isManual}
              onClick={() => handleModeChange("manual")}
              style={{
                ...collectionEntryStyles.modeCardSelector,

                ...(isManual
                  ? collectionEntryStyles.modeCardSelectorActive
                  : {}),
              }}
            >
              {isManual ? "✓" : ""}
            </button>
          </header>

          {/* ================================================
              MANUAL BODY
          ================================================ */}

          <div style={collectionEntryStyles.modeCardBody}>
            <div style={collectionEntryStyles.manualSection}>
              <div style={collectionEntryStyles.manualHeader}>
                <div style={collectionEntryStyles.manualTitle}>
                  SETTLEMENT ENTRY
                </div>
              </div>

              <div style={responsiveManualInputGridStyle}>
                {/* ========================================
                    COLLECTION AMOUNT
                ======================================== */}

                <label style={collectionEntryStyles.manualField}>
                  <span style={collectionEntryStyles.manualFieldLabel}>
                    COLLECTION AMOUNT
                  </span>

                  <TextInput
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={paymentAmount === 0 ? "" : String(paymentAmount)}
                    onFocus={ensureManualMode}
                    onChange={(event) =>
                      handleManualValueChange(
                        "paymentAmount",
                        event.target.value,
                      )
                    }
                    placeholder="₹ 0"
                    style={{
                      ...collectionEntryStyles.manualInput,
                      border: manualAmountBelowMinimum
                         ? "1px solid var(--finora-danger, #dc2626)"
                         : "1px solid rgba(220, 235, 255, 0.78)",
                      boxSizing: "border-box",

                      ...(manualAmountBelowMinimum
                        ? {
                            // Color is included in conditional border.
                            outline: "1px solid var(--finora-danger, #dc2626)",
                          }
                        : {}),
                    }}
                    aria-invalid={manualAmountBelowMinimum}
                    aria-describedby={
                      manualAmountBelowMinimum
                        ? "paisarule-manual-minimum-error"
                        : undefined
                    }
                    aria-label="Manual collection amount"
                  />

                </label>

                {/* ========================================
                    MANUAL PRINCIPAL
                ======================================== */}

                <label style={collectionEntryStyles.manualField}>
                  <span style={collectionEntryStyles.manualFieldLabel}>
                    MANUAL PRINCIPAL
                  </span>

                  <TextInput
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={manualPrincipal === 0 ? "" : String(manualPrincipal)}
                    onFocus={ensureManualMode}
                    onChange={(event) =>
                      handleManualValueChange(
                        "advanceAdjustment",
                        event.target.value,
                      )
                    }
                    placeholder="₹ 0"
                    style={collectionEntryStyles.manualInput}
                    aria-label="Manual principal"
                  />
                </label>

                {/* ========================================
                    DISCOUNT
                ======================================== */}

                <label style={collectionEntryStyles.manualField}>
                  <span style={collectionEntryStyles.manualFieldLabel}>
                    DISCOUNT
                  </span>

                  <TextInput
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={discountAmount === 0 ? "" : String(discountAmount)}
                    onChange={(event) =>
                      handleManualValueChange(
                        "discountAmount",
                        event.target.value,
                      )
                    }
                    placeholder="₹ 0"
                    style={collectionEntryStyles.manualInput}
                    aria-label="Discount"
                    onFocus={() => setDiscountInputFocused(true)}
                    onBlur={() => setDiscountInputFocused(false)}
                    disabled={eligibleOverdueDiscount <= 0}
                  />

                </label>
              </div>

              {/* PAISARULE_C132_R48_DISCOUNT_MESSAGE
                  Show only after Discount entry or invalid attempt.
                  Full width, outside the three-column input grid.
              */}
              {(discountInputFocused || discountLimitWarning) && (
                <div
                  role={discountLimitWarning ? "alert" : "status"}
                  style={{
                    display: "block",
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    marginTop: 8,
                    padding: "8px 12px",
                    borderRadius: 8,
                    color: discountLimitWarning ? "#FEE2E2" : "var(--finora-theme-text-primary, #111827)",
                    background: discountLimitWarning ? "linear-gradient(135deg, rgba(127, 29, 29, 0.96) 0%, rgba(153, 27, 27, 0.92) 100%)" : "var(--finora-theme-surface-muted, #F3F6FA)",
                    border: discountLimitWarning ? "1px solid rgba(248, 113, 113, 0.95)" : "1px solid var(--finora-theme-border-default, #D5DCE5)",
                    fontWeight: 700,
                    fontSize: 12,
                    lineHeight: 1.5,
                    overflowWrap: "anywhere",
                  }}
                >
                  <span
                      aria-hidden="true"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 17,
                        height: 17,
                        borderRadius: "50%",
                        border: "1.5px solid currentColor",
                        fontSize: 11,
                        fontWeight: 800,
                        lineHeight: 1,
                        marginRight: 6,
                        verticalAlign: "middle",
                        flexShrink: 0,
                      }}
                    >
                      {discountLimitWarning ? "!" : "i"}
                    </span>
                  <span>
                    {discountLimitWarning
                      ? "Discount Exceeds Eligible Limit. Maximum: "
                      : "Maximum Eligible Discount: "}
                    {currency(eligibleOverdueDiscount)} (Overdue Only)
                  </span>
                </div>
              )}

              {/* R86: Full-width Manual minimum error below all inputs. */}
              {manualAmountBelowMinimum && manualMinimumEmi && (
                <div
                  id="paisarule-manual-minimum-error"
                  role="alert"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    marginTop: 10,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(248, 113, 113, 0.95)",
                    color: "#FEE2E2",
                    background: "linear-gradient(135deg, rgba(127, 29, 29, 0.96) 0%, rgba(153, 27, 27, 0.92) 100%)",
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1.5,
                    whiteSpace: "nowrap",
                    overflowX: "auto",
                  }}
                >
                  <span aria-hidden="true">⚠</span>
                  <span>
                    Minimum Collection Amount is{" "}
                    {currency(manualMinimumAmount)}{" "}
                    (EMI{" "}
                    {String(
                      manualMinimumEmi.installmentNumber,
                    ).padStart(2, "0")})
                  </span>
                </div>
              )}
            </div>

            {/* PAISARULE_C132_R47_PRECLOSE_UI
                Full-width Preclose Loan entry.
                Temporarily disabled until authoritative
                cycle calculation and atomic Save are ready.
            */}
            <div
              style={{
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                marginTop: 12,
                padding: "12px 14px",
                border: "1px solid var(--finora-border, #d5dce5)",
                borderRadius: 12,
                background: "var(--finora-surface, transparent)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* PAISARULE_C137_R5_PRECLOSE_THREE_COLUMNS */}
              <strong
                style={{
                  color: "var(--finora-theme-text-primary, var(--text, #111827))",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                PRECLOSE LOAN
              </strong>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, minmax(0, 1fr))",
                  gap: 10,
                  width: "100%",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <label
                    htmlFor="paisarule-preclose-loan-amount"
                    style={collectionEntryStyles.manualFieldLabel}
                  >
                    PRECLOSE AMOUNT
                  </label>
                  <TextInput
                    id="paisarule-preclose-loan-amount"
                    type="text"
                    value={
                      visiblePrecloseAmount === null
                        ? ""
                        : currency(visiblePrecloseAmount)
                    }
                    placeholder="Quote unavailable"
                    style={{
                      ...collectionEntryStyles.manualInput,
                      width: "100%",
                      boxSizing: "border-box",
                      opacity: 1,
                    }}
                    aria-label="Preclose Loan amount"
                    disabled
                  />
                </div>

                <div
                  style={{
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <label
                    htmlFor="paisarule-preclose-saved-interest"
                    style={collectionEntryStyles.manualFieldLabel}
                  >
                    SAVED INTEREST
                  </label>
                  <TextInput
                    id="paisarule-preclose-saved-interest"
                    type="text"
                    value={(() => {
                      const outstanding = Number(
                        reviewData.outstandingBalance,
                      );
                      if (
                        visiblePrecloseAmount === null || visiblePreclosePenalty === null ||
                        !Number.isFinite(outstanding) ||
                        outstanding < visiblePrecloseAmount ||
                        !Number.isSafeInteger(
                          Math.round(outstanding * 100),
                        )
                      ) {
                        return "";
                      }

                      return currency(
                        Math.round(
                          (outstanding - visiblePrecloseAmount + visiblePreclosePenalty) * 100,
                        ) / 100,
                      );
                    })()}
                    placeholder="Not calculated"
                    style={{
                      ...collectionEntryStyles.manualInput,
                      width: "100%",
                      boxSizing: "border-box",
                      opacity: 1,
                    }}
                    aria-label="Estimated saved interest"
                    disabled
                  />
                </div>

                <div
                  style={{
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <span style={collectionEntryStyles.manualFieldLabel}>
                    PRECLOSE MODE
                  </span>
                  {/* PAISARULE_C137_R31_R2_TRAFFIC_LIGHT */}
                  <button
                    type="button"
                    aria-label="Preclose mode"
                    aria-pressed={precloseStage === "confirmed"}
                    data-paisarule-preclose-state={precloseStage}
                    onClick={() => {
                      if (precloseStage === "confirmed") {
                                                // PAISARULE_C137_R39_CLEAR_OFF
                        // Explicit OFF clears only entry-form values.
                        // No Loan, Collection, DB or Wallet write.
                        updateField("paymentAmount", 0);
                        updateField("discountAmount", 0);
                        updateField("advanceAdjustment", 0);
                        // PAISARULE_C137_R68_ATOMIC_UI_RESET
                        updateField("remarks", "");
                        preclosePreviousValuesRef.current = null;
                        setPrecloseReason("");

                        setPrecloseStage("off");
                        setPrecloseDialogOpen(false);
                        setPrecloseAcknowledged(false);
                        window.dispatchEvent(
                          new CustomEvent("PAISARULE_PRECLOSE_REMARKS", {
                            detail: { stage: "off" },
                          }),
                        );
                      } else {
                        setPrecloseReason("");
                        setPrecloseAcknowledged(false);
                        setPrecloseStage("pending");
                        setPrecloseDialogOpen(true);
                      }
                    }}
                    style={{
                      position: "relative",
                      width: "100%",
                      height: 45,
                      boxSizing: "border-box",
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.4)",
                      background:
                        precloseStage === "off"
                          ? "#991B1B"
                          : precloseStage === "pending"
                            ? "#B45309"
                            : "#15803D",
                      color: "#FFFFFF",
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: "pointer",
                      transition: "background 250ms ease",
                    }}
                  >

                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left:
                          precloseStage === "off"
                            ? 5
                            : precloseStage === "pending"
                              ? "calc(50% - 13px)"
                              : "calc(100% - 31px)",
                        transform: "translateY(-50%)",
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "#FFFFFF",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        transition:
                          "left 300ms cubic-bezier(0.22,1,0.36,1)",
                      }}
                    />
                  </button>

                  {/* PAISARULE_C137_R34_PORTAL */}
                  {precloseDialogOpen && createPortal((
                    <div
                      role="presentation"
                      style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 2147483000,
                        background: "rgba(2, 6, 23, 0.10)",
                        backdropFilter: "blur(1px)",
                        WebkitBackdropFilter: "blur(1px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Confirm Loan Preclosure"
                        style={{
                          width: "100%",
                          maxWidth: 460,
                          fontFamily: resolvePreclosePopupTheme().font,
                          maxHeight: "90vh",
                          overflowY: "auto",
                          display: "grid",
                          gap: 14,
                          padding: 20,
                          boxSizing: "border-box",
                          borderRadius: 16,
                          border:
                            "1px solid var(--finora-border, #64748b)",
                          background: resolvePreclosePopupTheme().surface,
                          colorScheme: "normal",
                          color: resolvePreclosePopupTheme().text,
                          boxShadow:
                            "0 24px 80px rgba(0,0,0,0.45)",
                        }}
                      >
                        <strong style={{ fontSize: 17 }}>
                          CONFIRM LOAN PRECLOSURE
                        </strong>

                        <span style={{ fontSize: 13 }}>
                          Preclose Amount:{" "}
                          <strong>
                            {visiblePrecloseAmount === null
                              ? "Quote unavailable"
                              : currency(visiblePrecloseAmount)}
                          </strong>
                        </span>

                        <label
                          htmlFor="paisarule-preclose-reason"
                          style={{ fontWeight: 750, fontSize: 12 }}
                        >
                          REASON FOR PRECLOSURE *
                        </label>

                        {/* PAISARULE_C137_R36_PRIMARY_TEXT */}
                        <style>{`
                          #paisarule-preclose-reason::placeholder {
                            color: inherit !important;
                            opacity: 1 !important;
                          }
                        `}</style>
                        <textarea
                          id="paisarule-preclose-reason"
                          autoFocus
                          rows={3}
                          value={precloseReason}
                          onChange={(event) =>
                            setPrecloseReason(event.target.value)
                          }
                          placeholder="Enter customer preclosure reason"
                          style={{
                            width: "100%",
                            minWidth: 0,
                            padding: 12,
                            boxSizing: "border-box",
                            borderRadius: 10,
                            border:
                              "1px solid var(--finora-border, #64748b)",
                            background: resolvePreclosePopupTheme().inputSurface,
                            color: resolvePreclosePopupTheme().text,
                            fontFamily: resolvePreclosePopupTheme().font,
                            resize: "vertical",
                          }}
                        />

                        <span style={{ fontSize: 11 }}>
                          Minimum 10 non-whitespace characters:{" "}
                          {precloseReason.replace(/\s/g, "").length}
                        </span>

                        <label
                          style={{
                            display: "flex",
                            gap: 9,
                            alignItems: "flex-start",
                            fontSize: 12,
                            lineHeight: 1.5,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={precloseAcknowledged}
                            onChange={(event) =>
                              setPrecloseAcknowledged(
                                event.target.checked
                              )
                            }
                          />
                          I verified the customer request and
                          reviewed the preclosure quote.
                        </label>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 10,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setPrecloseStage("off");
                              setPrecloseDialogOpen(false);
                              setPrecloseAcknowledged(false);
                            }}
                            style={{
                              minHeight: 44,
                              borderRadius: 10,
                              border:
                                "1px solid var(--finora-border, #64748b)",
                              background: "transparent",
                              color: "inherit",
                              fontWeight: 750,
                              cursor: "pointer",
                            }}
                          >
                            CANCEL
                          </button>

                          <button
                            type="button"
                            disabled={
                              !precloseAcknowledged ||
                              visiblePrecloseAmount === null ||
                              precloseReason.replace(/\s/g, "").length < 10
                            }
                            onClick={() => {
                              const reason = precloseReason.trim();

                              if (
                                !precloseAcknowledged ||
                                visiblePrecloseAmount === null ||
                                reason.replace(/\s/g, "").length < 10
                              ) {
                                return;
                              }

                              window.dispatchEvent(
                                new CustomEvent(
                                  "PAISARULE_PRECLOSE_REMARKS",
                                  {
                                    detail: {
                                      stage: "confirmed",
                                      reason,
                                    },
                                  },
                                ),
                              );

                              // PAISARULE_C137_R38_AUTOFILL_CONFIRM
                              const outstanding = Number(
                                reviewData.outstandingBalance,
                              );

                              const quote = visiblePrecloseAmount;

                              if (
                                quote === null || visiblePreclosePenalty === null ||
                                !Number.isFinite(quote) ||
                                quote <= 0 ||
                                !Number.isFinite(outstanding) ||
                                outstanding < quote
                              ) {
                                setPrecloseStage("off");
                                setPrecloseDialogOpen(false);
                                setPrecloseAcknowledged(false);
                                return;
                              }

                              const futureInterestWaiver =
                                Math.round(
                                  (outstanding - quote + visiblePreclosePenalty) * 100,
                                ) / 100;

                              preclosePreviousValuesRef.current = {
                                loanId: String(reviewData.loanId ?? ""),
                                receiptDate: String(
                                  reviewData.receiptDate ?? "",
                                ),
                                paymentAmount: safeNumber(
                                  reviewData.paymentAmount,
                                ),
                                discountAmount: safeNumber(
                                  reviewData.discountAmount,
                                ),
                                advanceAdjustment: safeNumber(
                                  reviewData.advanceAdjustment,
                                ),
                              };

                              // Select existing Manual Collection mode.
                              handleModeChange("manual");

                              // Populate the same controller fields as
                              // Settlement Entry's existing inputs.
                              updateField("paymentAmount", quote);
                              updateField(
                                "discountAmount",
                                futureInterestWaiver,
                              );
                              updateField("advanceAdjustment", 0);
                              // PAISARULE_C137_R64_DIRECT_REMARKS_AUTOFILL
                              updateField("remarks", reason);
                              setPrecloseStage("confirmed");
                              setPrecloseDialogOpen(false);
                            }}
                            style={{
                              minHeight: 44,
                              borderRadius: 10,
                              border: 0,
                              background:
                                precloseAcknowledged &&
                                visiblePrecloseAmount !== null &&
                                precloseReason.replace(/\s/g, "").length >= 10
                                  ? "#15803D"
                                  : "#475569",
                              color: "#FFFFFF",
                              fontWeight: 800,
                              cursor: "pointer",
                              opacity: 1,
                            }}
                          >
                            CONFIRM PRECLOSE
                          </button>
                        </div>
                      </div>
                    </div>
                  ), document.body)}
                </div>
              </div>

              <span
                id="paisarule-preclose-pending"
                style={{
                  color:
                    "var(--finora-theme-text-primary, var(--text, #111827))",
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                {precloseStage === "confirmed"
                  ? "PRECLOSE CONFIRMED — Atomic Preclose Save integration is pending."
                  : precloseStage === "pending"
                    ? "PRECLOSE PENDING — Owner confirmation required."
                    : "PRECLOSE OFF — Normal Collection mode."}
              </span>
            </div>

            {/* ==============================================
                MANUAL VALUES
            ============================================== */}

            <div style={{ ...responsiveValueGridStyle, marginTop: 12 }}>
              <div
                style={{
                  ...collectionEntryStyles.valueCard,

                  ...(isManual ? collectionEntryStyles.valueCardActive : {}),
                }}
              >
                <span style={collectionEntryStyles.valueLabel}>Collection</span>

                <strong style={collectionEntryStyles.value}>
                  {currency(paymentAmount)}
                </strong>
              </div>

              <div
                style={{
                  ...collectionEntryStyles.valueCard,

                  ...(isManual ? collectionEntryStyles.valueCardActive : {}),
                }}
              >
                <span style={collectionEntryStyles.valueLabel}>Principal</span>

                <strong style={collectionEntryStyles.value}>
                  {currency(manualPrincipal)}
                </strong>
              </div>

              <div style={collectionEntryStyles.valueCard}>
                <span style={collectionEntryStyles.valueLabel}>Discount</span>

                <strong style={collectionEntryStyles.value}>
                  {currency(discountAmount)}
                </strong>
              </div>
            </div>
            {/* PAISARULE_C137_R10_FULL_WIDTH_AMOUNT_WORDS */}
            <div
              aria-label="Amount in Words"
              style={{
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                marginTop: 12,
                padding: "12px 14px",
                border:
                  "1px solid var(--finora-border, #d5dce5)",
                borderRadius: 10,
                background:
                  "var(--finora-surface, transparent)",
                display: "flex",
                flexDirection: "column",
                gap: 7,
              }}
            >
              <span
                style={{
                  color:
                    "var(--finora-theme-text-primary, var(--text, #111827))",
                  fontSize: 11,
                  fontWeight: 750,
                  letterSpacing: "0.03em",
                }}
              >
                AMOUNT IN WORDS
              </span>
              <strong
                aria-live="polite"
                style={{
                  color:
                    "var(--finora-theme-text-primary, var(--text, #111827))",
                  fontSize: 13,
                  fontWeight: 750,
                  lineHeight: 1.5,
                  overflowWrap: "anywhere",
                }}
              >
                {collectionAmountInWords(
                  Number(reviewData.paymentAmount),
                )}
              </strong>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

// ============================================================
// END
// ============================================================
