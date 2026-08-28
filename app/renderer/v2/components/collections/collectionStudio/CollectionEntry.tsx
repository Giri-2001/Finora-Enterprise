// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// COLLECTION ENTRY — STEP 4
//
// RESPONSIBILITY
//
// - Render Collection Entry section
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
// - No hardcoded EMI schedule
// - No dummy schedule
// - No schedule generation here
// - No repository access
// - LoanService remains the Loan boundary
// - Controller remains the collection-state source of truth
// - Collection mode is local presentation state
// - No local theme system
// - No local responsive system
// - No inline colour palette
// - Geometry belongs to dedicated styles
//
// MANUAL INPUT RULE
//
// Manual Collection uses FINORA TextInput.
//
// Native:
//
//   <input type="number">
//
// is intentionally NOT used.
//
// Reason:
//
// - No browser spinner arrows
// - FINORA visual language remains consistent
// - Numeric input remains supported through inputMode
// - Invalid characters are sanitized before controller update
//
// EMI BALANCE RULE
//
// Individual EMI rows:
//
// installmentAmount
//   = original contractual EMI amount.
//
// paidAmount
//   = amount already collected against that EMI.
//
// remaining EMI amount
//   = installmentAmount - paidAmount.
//
// Paid / Preclosed EMI
//   = remaining collectible amount is always zero.
//
// Partial EMI
//   = only its remaining amount may be selected.
//
// IMPORTANT:
//
// Original installmentAmount is NEVER mutated here.
//
// TOTAL EMI BALANCE:
//
// reviewData.outstandingBalance
//
// is the authoritative current collectible Loan balance.
//
// The remaining schedule total is retained only as a defensive
// fallback when no authoritative outstanding value exists.
//
// CRITICAL LOOP FIX
//
// - Step 4 does NOT synchronize controller values from useEffect.
// - Controller writes happen only from explicit user actions or
//   the single loan-load boundary.
// - No effect depends on controller values while also writing
//   those same controller values.
// - This prevents the React "Maximum update depth exceeded" loop.
//
// EMI DROPDOWN BEHAVIOUR
//
// - Opening the EMI selector keeps the full schedule visible.
// - Individual EMI selection does NOT close the dropdown.
// - Multiple EMIs can therefore be selected continuously.
// - Select All / Deselect All keeps the dropdown open.
// - The dropdown closes only when the user explicitly clicks
//   the EMI selector trigger again.
// - Paid / Preclosed EMIs remain locked.
//
// POST-SAVE RESET
//
// PaymentDetails dispatches:
//
//   FINORA_COLLECTION_FORM_RESET
//
// after a successful collection.
//
// CollectionEntry then resets local presentation state:
//
// - Mode -> EMI Collection
// - Selected EMI list -> empty
// - EMI dropdown -> closed
//
// Controller financial fields are reset by PaymentDetails.
//
// VERSION : 2.4
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { collectionEntryStyles } from "./CollectionEntry.styles";

import { useCollectionController } from "../controller";

import { fetchLoans } from "../../../services/loan/loanService";

import { formatCurrency } from "../../../utils/currency/formatCurrency";

import TextInput from "../../common/form/TextInput";

// ============================================================
// TYPES
// ============================================================

interface EmiRecord {
  installmentNumber: number;

  dueDate: string;

  installmentAmount: number;

  status: string;

  paidAmount?: number;

  receiptNumber?: string;

  paidDate?: string;
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

// ------------------------------------------------------------
// AUTHORITATIVE NUMBER CHECK
// ------------------------------------------------------------
//
// Zero is a valid authoritative value.
//
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

  return normalized === "paid" || normalized === "preclosed";
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

  const installmentAmount = safeNumber(installment.installmentAmount);

  const paidAmount = safeNumber(installment.paidAmount);

  return Math.max(
    0,

    installmentAmount - paidAmount,
  );
}

// ------------------------------------------------------------
// SANITIZE MANUAL MONEY INPUT
// ------------------------------------------------------------
//
// TextInput uses type="text" so native number arrows never
// appear.
//
// Allowed:
//
//   0-9
//   one decimal point
//   maximum 2 decimal places
//
// Examples:
//
//   9100
//   150
//   9100.50
//
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

export default function CollectionEntry() {
  const { reviewData, updateField } = useCollectionController();

  // ==========================================================
  // STABLE CONTROLLER WRITER
  // ==========================================================

  const updateFieldRef = useRef(updateField);

  updateFieldRef.current = updateField;

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

  // ==========================================================
  // EMI STATE
  // ==========================================================

  const [emiSchedule, setEmiSchedule] = useState<EmiRecord[]>([]);

  const [loading, setLoading] = useState(false);

  const [loadError, setLoadError] = useState("");

  const [selectedEmiNumbers, setSelectedEmiNumbers] = useState<number[]>([]);

  // ==========================================================
  // EMI DROPDOWN STATE
  // ==========================================================

  const [emiDropdownOpen, setEmiDropdownOpen] = useState(false);

  // ==========================================================
  // SELECT ALL CHECKBOX REF
  // ==========================================================

  const selectAllCheckboxRef = useRef<HTMLInputElement | null>(null);

  // ==========================================================
  // LOAD REAL EMI SCHEDULE
  // ==========================================================

  const loadSchedule = useCallback(async (): Promise<void> => {
    // ----------------------------------------------------
    // NO SELECTED LOAN
    // ----------------------------------------------------

    if (!loanId) {
      setEmiSchedule([]);

      setSelectedEmiNumbers([]);

      setEmiDropdownOpen(false);

      setLoadError("");

      setLoading(false);

      updateFieldRef.current("selectedEmiNumbers", []);

      updateFieldRef.current("selectedEmiAmount", 0);

      return;
    }

    setLoading(true);

    setLoadError("");

    setEmiDropdownOpen(false);

    try {
      // --------------------------------------------------
      // LOAD AUTHORITATIVE LOAN DATA
      // --------------------------------------------------

      const loans = await fetchLoans();

      const selectedLoan = loans.find(
        (loan: { id?: string }) => String(loan.id ?? "") === loanId,
      );

      // --------------------------------------------------
      // READ PERSISTED EMI SCHEDULE
      // --------------------------------------------------

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

      // --------------------------------------------------
      // NORMALIZE SCHEDULE
      // --------------------------------------------------

      const normalizedSchedule = rawSchedule
        .map(
          (installment): EmiRecord => ({
            installmentNumber: Number(installment.installmentNumber) || 0,

            dueDate: String(installment.dueDate ?? ""),

            installmentAmount: safeNumber(installment.installmentAmount),

            status: String(installment.status ?? "Pending"),

            paidAmount: safeNumber(installment.paidAmount),

            receiptNumber: String(installment.receiptNumber ?? ""),

            paidDate: String(installment.paidDate ?? ""),
          }),
        )
        .filter((installment) => installment.installmentNumber > 0);

      // --------------------------------------------------
      // NEW LOAN LOAD = CLEAR SELECTION
      // --------------------------------------------------

      setEmiSchedule(normalizedSchedule);

      setSelectedEmiNumbers([]);

      updateFieldRef.current("selectedEmiNumbers", []);

      updateFieldRef.current("selectedEmiAmount", 0);

      updateFieldRef.current("paymentAmount", 0);
    } catch (error) {
      console.error("FINORA STEP 4 EMI SCHEDULE LOAD ERROR:", error);

      setEmiSchedule([]);

      setSelectedEmiNumbers([]);

      setEmiDropdownOpen(false);

      updateFieldRef.current("selectedEmiNumbers", []);

      updateFieldRef.current("selectedEmiAmount", 0);

      updateFieldRef.current("paymentAmount", 0);

      setLoadError("Unable to load the selected loan EMI schedule.");
    } finally {
      setLoading(false);
    }
  }, [loanId]);

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
      void loadSchedule();
    }

    window.addEventListener("FINORA_LOAN_UPDATED", handleLoanUpdated);

    return () => {
      window.removeEventListener("FINORA_LOAN_UPDATED", handleLoanUpdated);
    };
  }, [loadSchedule]);

  // ==========================================================
  // POST-SAVE LOCAL FORM RESET
  // ==========================================================
  //
  // PaymentDetails resets controller transaction values.
  //
  // This listener resets CollectionEntry presentation state:
  //
  // - EMI mode
  // - no selected EMI
  // - dropdown closed
  //
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

  const totalRemainingEmiAmount = hasAuthoritativeNumber(
    reviewData.outstandingBalance,
  )
    ? safeNumber(reviewData.outstandingBalance)
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

  const allEligibleSelected =
    eligibleEmis.length > 0 &&
    eligibleEmis.every((installment) =>
      selectedEmiNumbers.includes(installment.installmentNumber),
    );

  const someEligibleSelected = eligibleEmis.some((installment) =>
    selectedEmiNumbers.includes(installment.installmentNumber),
  );

  // ==========================================================
  // SELECT ALL INDETERMINATE PRESENTATION
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

    setSelectedEmiNumbers([]);

    setEmiDropdownOpen(false);

    updateField("selectedEmiNumbers", []);

    updateField("selectedEmiAmount", 0);

    updateField("paymentAmount", 0);

    // --------------------------------------------------------
    // SWITCHING BACK TO EMI MODE
    // --------------------------------------------------------
    //
    // Manual-only adjustment values must not remain silently
    // attached to an EMI transaction.
    //
    // --------------------------------------------------------

    if (mode === "emi") {
      updateField("advanceAdjustment", 0);

      updateField("discountAmount", 0);
    }
  }

  // ==========================================================
  // MANUAL VALUE CHANGE
  // ==========================================================

  function handleManualValueChange(
    field: "paymentAmount" | "advanceAdjustment" | "discountAmount",
    rawValue: string,
  ): void {
    const sanitized = sanitizeMoneyInput(rawValue);

    if (sanitized === "" || sanitized === ".") {
      updateField(field, 0);

      return;
    }

    const value = safeNumber(sanitized);

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

    setSelectedEmiNumbers(nextSelection);

    updateField("selectedEmiNumbers", nextSelection);

    updateField("selectedEmiAmount", nextAmount);

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

    setSelectedEmiNumbers(nextSelection);

    updateField("selectedEmiNumbers", nextSelection);

    updateField("selectedEmiAmount", nextAmount);

    updateField("paymentAmount", nextAmount);

    console.log(
      allEligibleSelected
        ? "FINORA STEP 4 ALL ELIGIBLE EMIS DESELECTED"
        : "FINORA STEP 4 ALL ELIGIBLE EMIS SELECTED",
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section style={collectionEntryStyles.panel}>
      {/* ======================================================
          STEP HEADER
      ====================================================== */}

      <header style={collectionEntryStyles.header}>
        <span style={collectionEntryStyles.step}>4.</span>

        <div style={collectionEntryStyles.titleGroup}>
          <h2 style={collectionEntryStyles.title}>COLLECTION ENTRY</h2>

          <span style={collectionEntryStyles.subtitle}>
            Select EMI collection or enter a manual collection.
          </span>
        </div>
      </header>

      {/* ======================================================
          COLLECTION MODE
      ====================================================== */}

      <div style={collectionEntryStyles.modeRow}>
        <label
          onClick={() => handleModeChange("emi")}
          style={{
            ...collectionEntryStyles.radioOption,

            ...(!isManual ? collectionEntryStyles.radioOptionActive : {}),
          }}
        >
          <input
            type="radio"
            name="collection-mode"
            checked={!isManual}
            onChange={() => handleModeChange("emi")}
            style={collectionEntryStyles.modeRadio}
          />

          <span>EMI COLLECTION</span>
        </label>

        <label
          onClick={() => handleModeChange("manual")}
          style={{
            ...collectionEntryStyles.radioOption,

            ...(isManual ? collectionEntryStyles.radioOptionActive : {}),
          }}
        >
          <input
            type="radio"
            name="collection-mode"
            checked={isManual}
            onChange={() => handleModeChange("manual")}
            style={collectionEntryStyles.modeRadio}
          />

          <span>MANUAL COLLECTION</span>
        </label>
      </div>

      {/* ======================================================
          EMI DROPDOWN SELECTOR
      ====================================================== */}

      {!isManual && (
        <div style={collectionEntryStyles.emiDropdown}>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={emiDropdownOpen}
            onClick={() => setEmiDropdownOpen((previous) => !previous)}
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

          {emiDropdownOpen && (
            <div
              role="listbox"
              aria-label="EMI schedule"
              style={collectionEntryStyles.emiDropdownPanel}
            >
              {/* ==============================================
                  DROPDOWN HEADER
              ============================================== */}

              <div style={collectionEntryStyles.emiDropdownHeader}>
                <span style={collectionEntryStyles.scheduleHeader}>
                  EMI SCHEDULE
                </span>

                <span style={collectionEntryStyles.scheduleCount}>
                  {emiSchedule.length}{" "}
                  {emiSchedule.length === 1 ? "INSTALLMENT" : "INSTALLMENTS"}
                </span>
              </div>

              {/* ==============================================
                  CONTENT
              ============================================== */}

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
                <div style={collectionEntryStyles.emiDropdownList}>
                  {/* ==========================================
                      EMI ROWS
                  ========================================== */}

                  {emiSchedule.map((installment) => {
                    const locked = isLockedStatus(installment.status);

                    const remainingAmount = getRemainingEmiAmount(installment);

                    const selected = selectedEmiNumbers.includes(
                      installment.installmentNumber,
                    );

                    const normalizedStatus = normalizeStatus(
                      installment.status,
                    );

                    const statusStyle = {
                      ...collectionEntryStyles.status,

                      ...(normalizedStatus === "paid"
                        ? collectionEntryStyles.statusPaid
                        : normalizedStatus === "preclosed"
                          ? collectionEntryStyles.statusPreclosed
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

                          ...(locked ? collectionEntryStyles.lockedRow : {}),
                        }}
                      >
                        <span style={collectionEntryStyles.emiName}>
                          EMI {installment.installmentNumber}
                        </span>

                        <span style={collectionEntryStyles.scheduleTableCell}>
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
                          {currency(installment.installmentAmount)}
                        </strong>

                        <span style={statusStyle}>
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

                  {/* ==========================================
                      AUTHORITATIVE REMAINING BALANCE
                  ========================================== */}

                  <div style={collectionEntryStyles.emiTotalRow}>
                    <strong style={collectionEntryStyles.emiTotalLabel}>
                      TOTAL EMI BALANCE
                    </strong>

                    <span style={collectionEntryStyles.emiTotalSpacer} />

                    <strong style={collectionEntryStyles.emiTotalAmount}>
                      {currency(totalRemainingEmiAmount)}
                    </strong>

                    <span style={collectionEntryStyles.emiTotalStatus}>
                      BALANCE
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
      )}

      {/* ======================================================
          MANUAL COLLECTION AREA
      ====================================================== */}

      {isManual && (
        <div style={collectionEntryStyles.manualSection}>
          <div style={collectionEntryStyles.manualHeader}>
            <div style={collectionEntryStyles.manualTitle}>
              MANUAL COLLECTION
            </div>

            <div style={collectionEntryStyles.manualHint}>
              Enter the collection amount and settlement adjustments.
            </div>
          </div>

          <div style={collectionEntryStyles.manualInputGrid}>
            {/* ================================================
                COLLECTION AMOUNT
            ================================================ */}

            <label style={collectionEntryStyles.manualField}>
              <span style={collectionEntryStyles.manualFieldLabel}>
                COLLECTION AMOUNT
              </span>

              <TextInput
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={paymentAmount === 0 ? "" : String(paymentAmount)}
                onChange={(event) =>
                  handleManualValueChange("paymentAmount", event.target.value)
                }
                placeholder="₹ 0"
                style={collectionEntryStyles.manualInput}
                aria-label="Manual collection amount"
              />
            </label>

            {/* ================================================
                MANUAL PRINCIPAL
            ================================================ */}

            <label style={collectionEntryStyles.manualField}>
              <span style={collectionEntryStyles.manualFieldLabel}>
                MANUAL PRINCIPAL
              </span>

              <TextInput
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={manualPrincipal === 0 ? "" : String(manualPrincipal)}
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

            {/* ================================================
                DISCOUNT
            ================================================ */}

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
                  handleManualValueChange("discountAmount", event.target.value)
                }
                placeholder="₹ 0"
                style={collectionEntryStyles.manualInput}
                aria-label="Discount"
              />
            </label>
          </div>
        </div>
      )}

      {/* ======================================================
          COLLECTION VALUES
      ====================================================== */}

      <div style={collectionEntryStyles.valueGrid}>
        <div
          style={{
            ...collectionEntryStyles.valueCard,

            ...(!isManual ? collectionEntryStyles.valueCardActive : {}),
          }}
        >
          <span style={collectionEntryStyles.valueLabel}>
            Selected EMI Amount
          </span>

          <strong style={collectionEntryStyles.value}>
            {currency(isManual ? 0 : selectedEmiAmount)}
          </strong>

          {!isManual && (
            <span style={collectionEntryStyles.valueHint}>
              {selectedEmiNumbers.length}{" "}
              {selectedEmiNumbers.length === 1
                ? "EMI selected"
                : "EMIs selected"}
            </span>
          )}
        </div>

        <div
          style={{
            ...collectionEntryStyles.valueCard,

            ...(isManual ? collectionEntryStyles.valueCardActive : {}),
          }}
        >
          <span style={collectionEntryStyles.valueLabel}>Manual Principal</span>

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
    </section>
  );
}

// ============================================================
// END
// ============================================================
