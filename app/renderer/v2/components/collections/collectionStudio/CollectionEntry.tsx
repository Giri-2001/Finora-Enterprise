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
// - Display selected EMI amount
// - Allow manual collection amount editing
// - Allow manual principal editing
// - Allow discount editing
// - Keep Step 4 values synchronized with Collection Controller
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
// NOTE
//
// Actual collection persistence / loan balance mutation is NOT
// performed by Step 4. That belongs to the collection workflow
// action/service layer. Step 4 prepares the authoritative values.
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";

import { collectionEntryStyles } from "./CollectionEntry.styles";

import { useCollectionController } from "../controller";

import { fetchLoans } from "../../../services/loan/loanService";

import { formatCurrency } from "../../../utils/currency/formatCurrency";

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

function currency(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;

  return `₹ ${formatCurrency(safeValue)}`;
}

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

function normalizeStatus(status: string): string {
  return String(status ?? "")
    .trim()
    .toLowerCase();
}

function isLockedStatus(status: string): boolean {
  const normalized = normalizeStatus(status);

  return normalized === "paid" || normalized === "preclosed";
}

function getStatusLabel(status: string): string {
  const value = String(status ?? "").trim();

  return value ? value.toUpperCase() : "PENDING";
}

// ============================================================
// COMPONENT
// ============================================================

export default function CollectionEntry() {
  const { reviewData, updateField } = useCollectionController();

  // ==========================================================
  // CONTROLLER VALUES
  // ==========================================================

  const paymentAmount = Number(reviewData.paymentAmount ?? 0);

  const discountAmount = Number(reviewData.discountAmount ?? 0);

  const manualPrincipal = Number(reviewData.advanceAdjustment ?? 0);

  const loanId = String(reviewData.loanId ?? "");

  // ==========================================================
  // COLLECTION MODE
  //
  // Mode is presentation state only.
  // It must not depend on a non-canonical controller field.
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
  //
  // The EMI schedule remains fully available, but is hidden
  // until the user explicitly opens the selector.
  //
  // Selecting an EMI automatically closes the dropdown.
  // ==========================================================

  const [emiDropdownOpen, setEmiDropdownOpen] = useState(false);

  // ==========================================================
  // LOAD REAL EMI SCHEDULE
  // ==========================================================

  const loadSchedule = useCallback(async (): Promise<void> => {
    if (!loanId) {
      setEmiSchedule([]);
      setSelectedEmiNumbers([]);
      setEmiDropdownOpen(false);
      setLoadError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");

    try {
      const loans = await fetchLoans();

      const selectedLoan = loans.find(
        (loan: { id?: string }) => String(loan.id ?? "") === loanId,
      );

      const rawSchedule = Array.isArray(
        (selectedLoan as { schedule?: unknown } | undefined)?.schedule,
      )
        ? ((selectedLoan as { schedule?: unknown } | undefined)
            ?.schedule as EmiRecord[])
        : [];

      const normalizedSchedule = rawSchedule
        .map(
          (installment): EmiRecord => ({
            installmentNumber: Number(installment.installmentNumber) || 0,

            dueDate: String(installment.dueDate ?? ""),

            installmentAmount: Number(installment.installmentAmount) || 0,

            status: String(installment.status ?? "Pending"),

            paidAmount: Number(installment.paidAmount ?? 0) || 0,

            receiptNumber: String(installment.receiptNumber ?? ""),

            paidDate: String(installment.paidDate ?? ""),
          }),
        )
        .filter((installment) => installment.installmentNumber > 0);

      setEmiSchedule(normalizedSchedule);

      setSelectedEmiNumbers((previous) =>
        previous.filter((installmentNumber) =>
          normalizedSchedule.some(
            (installment) =>
              installment.installmentNumber === installmentNumber &&
              !isLockedStatus(installment.status) &&
              installment.installmentAmount > 0,
          ),
        ),
      );
    } catch (error) {
      console.error("FINORA STEP 4 EMI SCHEDULE LOAD ERROR:", error);

      setEmiSchedule([]);
      setSelectedEmiNumbers([]);
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
  // REFRESH AFTER LOAN / COLLECTION UPDATE
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
  // SELECTED EMI AMOUNT
  // ==========================================================

  const selectedEmiAmount = useMemo(
    () =>
      emiSchedule.reduce((total, installment) => {
        if (!selectedEmiNumbers.includes(installment.installmentNumber)) {
          return total;
        }

        return total + Math.max(0, Number(installment.installmentAmount) || 0);
      }, 0),
    [emiSchedule, selectedEmiNumbers],
  );

  // ==========================================================
  // EMI PAYMENT SYNC
  //
  // EMI mode writes the selected EMI total into
  // paymentAmount. Manual mode leaves the typed amount intact.
  // ==========================================================

  useEffect(() => {
    if (isManual) {
      return;
    }

    if (paymentAmount !== selectedEmiAmount) {
      updateField("paymentAmount", selectedEmiAmount);
    }
  }, [isManual, paymentAmount, selectedEmiAmount, updateField]);

  // ==========================================================
  // MODE CHANGE
  // ==========================================================

  function handleModeChange(mode: "emi" | "manual"): void {
    console.log("FINORA STEP 4 MODE:", mode);

    setCollectionMode(mode);

    setSelectedEmiNumbers([]);

    if (mode === "manual") {
      // Start manual entry from a clean collection amount.
      updateField("paymentAmount", 0);
      return;
    }

    // Returning to EMI starts from zero until an EMI is selected.
    updateField("paymentAmount", 0);
  }

  // ==========================================================
  // MANUAL VALUE CHANGE
  // ==========================================================

  function handleManualValueChange(
    field: "paymentAmount" | "advanceAdjustment" | "discountAmount",
    rawValue: string,
  ): void {
    const trimmed = rawValue.trim();

    const value = trimmed === "" ? 0 : Math.max(0, Number(trimmed) || 0);

    console.log("FINORA STEP 4 MANUAL VALUE:", field, value);

    updateField(field, value);
  }

  // ==========================================================
  // EMI SELECTION
  //
  // IMPORTANT:
  //
  // - Real persisted EMI only.
  // - Paid / Preclosed cannot be selected.
  // - Multiple EMI selection remains supported.
  // - Dropdown closes immediately after each selection.
  // - User can reopen it to select another EMI.
  // ==========================================================

  function handleEmiSelection(installment: EmiRecord): void {
    if (isLockedStatus(installment.status)) {
      return;
    }

    if (installment.installmentAmount <= 0) {
      return;
    }

    setSelectedEmiNumbers((previous) => {
      const exists = previous.includes(installment.installmentNumber);

      if (exists) {
        return previous.filter(
          (number) => number !== installment.installmentNumber,
        );
      }

      return [...previous, installment.installmentNumber];
    });

    // --------------------------------------------------------
    // Selection complete → close EMI dropdown.
    // --------------------------------------------------------

    setEmiDropdownOpen(false);

    console.log(
      "FINORA STEP 4 EMI SELECTED:",
      installment.installmentNumber,
      installment.installmentAmount,
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
          {/* ==================================================
        DROPDOWN TRIGGER
    ================================================== */}

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

          {/* ==================================================
        DROPDOWN PANEL
    ================================================== */}

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
            LOADING
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
                  {emiSchedule.map((installment) => {
                    const locked = isLockedStatus(installment.status);

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
                        {/* ==================================
                        EMI
                    ================================== */}

                        <span style={collectionEntryStyles.emiName}>
                          EMI {installment.installmentNumber}
                        </span>

                        {/* ==================================
                        DUE DATE
                    ================================== */}

                        <span style={collectionEntryStyles.scheduleTableCell}>
                          {formatEmiDate(installment.dueDate)}
                        </span>

                        {/* ==================================
                        AMOUNT
                    ================================== */}

                        <strong style={collectionEntryStyles.emiAmount}>
                          {currency(installment.installmentAmount)}
                        </strong>

                        {/* ==================================
                        STATUS
                    ================================== */}

                        <span style={statusStyle}>
                          {getStatusLabel(installment.status)}
                        </span>

                        {/* ==================================
                        CHECKBOX
                    ================================== */}

                        <span style={collectionEntryStyles.selectCell}>
                          <input
                            type="checkbox"
                            checked={locked || selected}
                            disabled={
                              locked || installment.installmentAmount <= 0
                            }
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
            {/* ==============================================
                COLLECTION AMOUNT
            ============================================== */}

            <label style={collectionEntryStyles.manualField}>
              <span style={collectionEntryStyles.manualFieldLabel}>
                COLLECTION AMOUNT
              </span>

              <input
                type="number"
                min="0"
                step="1"
                value={paymentAmount === 0 ? "" : paymentAmount}
                onChange={(event) =>
                  handleManualValueChange("paymentAmount", event.target.value)
                }
                placeholder="₹ 0"
                style={collectionEntryStyles.manualInput}
                aria-label="Manual collection amount"
              />
            </label>

            {/* ==============================================
                MANUAL PRINCIPAL
            ============================================== */}

            <label style={collectionEntryStyles.manualField}>
              <span style={collectionEntryStyles.manualFieldLabel}>
                MANUAL PRINCIPAL
              </span>

              <input
                type="number"
                min="0"
                step="1"
                value={manualPrincipal === 0 ? "" : manualPrincipal}
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

            {/* ==============================================
                DISCOUNT
            ============================================== */}

            <label style={collectionEntryStyles.manualField}>
              <span style={collectionEntryStyles.manualFieldLabel}>
                DISCOUNT
              </span>

              <input
                type="number"
                min="0"
                step="1"
                value={discountAmount === 0 ? "" : discountAmount}
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
        {/* ====================================================
            SELECTED EMI
        ==================================================== */}

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

        {/* ====================================================
            MANUAL PRINCIPAL
        ==================================================== */}

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

        {/* ====================================================
            DISCOUNT
        ==================================================== */}

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
