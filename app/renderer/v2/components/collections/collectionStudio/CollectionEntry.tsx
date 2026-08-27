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
// - Display total EMI schedule amount
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
// VERSION : 2.0
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

import { ReceiptText } from "lucide-react";

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
  // The schedule remains available while the selector is open.
  //
  // IMPORTANT:
  //
  // Individual EMI selection NEVER closes this dropdown.
  // This allows multiple EMI selection without repeatedly
  // reopening the selector.
  //
  // The user explicitly closes the dropdown by clicking the
  // selector trigger again.
  // ==========================================================

  const [emiDropdownOpen, setEmiDropdownOpen] = useState(false);

  // ==========================================================
  // SELECT ALL CHECKBOX REF
  //
  // Used only for native checkbox indeterminate presentation.
  // ==========================================================

  const selectAllCheckboxRef = useRef<HTMLInputElement | null>(null);

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
  // TOTAL EMI SCHEDULE AMOUNT
  //
  // This is the total amount of every persisted EMI in the
  // selected loan schedule.
  //
  // It is independent of the currently selected EMI amount.
  // ==========================================================

  const totalEmiAmount = useMemo(
    () =>
      emiSchedule.reduce(
        (total, installment) =>
          total + Math.max(0, Number(installment.installmentAmount) || 0),
        0,
      ),
    [emiSchedule],
  );

  // ==========================================================
  // ELIGIBLE EMI LIST
  //
  // Paid / Preclosed installments remain locked and therefore
  // are not included in Select All.
  // ==========================================================

  const eligibleEmis = useMemo(
    () =>
      emiSchedule.filter(
        (installment) =>
          !isLockedStatus(installment.status) &&
          installment.installmentAmount > 0,
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

        return total + Math.max(0, Number(installment.installmentAmount) || 0);
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
  // SYNC SELECT ALL INDETERMINATE STATE
  // ==========================================================

  useEffect(() => {
    if (!selectAllCheckboxRef.current) {
      return;
    }

    selectAllCheckboxRef.current.indeterminate =
      someEligibleSelected && !allEligibleSelected;
  }, [someEligibleSelected, allEligibleSelected]);

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

    // Changing collection mode should also close the EMI
    // selector so the presentation state starts clean.
    setEmiDropdownOpen(false);

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
  // - Dropdown intentionally STAYS OPEN after selection.
  // - User can select EMI 1, EMI 2, EMI 3, etc. without
  //   reopening the dropdown each time.
  // - Dropdown closes only from the selector trigger.
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
    // IMPORTANT:
    //
    // DO NOT close the dropdown here.
    //
    // The user must be able to select multiple EMIs
    // continuously. The dropdown is closed explicitly by
    // clicking the selector trigger again.
    // --------------------------------------------------------

    console.log(
      "FINORA STEP 4 EMI SELECTED:",
      installment.installmentNumber,
      installment.installmentAmount,
    );
  }

  // ==========================================================
  // SELECT ALL / DESELECT ALL
  //
  // Only eligible EMI installments are affected.
  //
  // Paid / Preclosed installments remain locked.
  //
  // IMPORTANT:
  //
  // Dropdown remains open after Select All / Deselect All.
  // ==========================================================

  function handleSelectAllEmis(): void {
    if (eligibleEmis.length === 0) {
      return;
    }

    if (allEligibleSelected) {
      setSelectedEmiNumbers((previous) =>
        previous.filter(
          (number) =>
            !eligibleEmis.some(
              (installment) => installment.installmentNumber === number,
            ),
        ),
      );

      console.log("FINORA STEP 4 ALL ELIGIBLE EMIS DESELECTED");

      return;
    }

    setSelectedEmiNumbers((previous) => {
      const selected = new Set(previous);

      eligibleEmis.forEach((installment) => {
        selected.add(installment.installmentNumber);
      });

      return Array.from(selected);
    });

    console.log("FINORA STEP 4 ALL ELIGIBLE EMIS SELECTED");
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
        <span style={collectionEntryStyles.step}>
          <ReceiptText size={26} strokeWidth={2} />
        </span>

        <div style={collectionEntryStyles.titleGroup}>
          <h2 style={collectionEntryStyles.title}>Collection Entry</h2>
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
                  {/* ==========================================
                      EMI ROWS
                  ========================================== */}

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
                        {/* ==============================
                              EMI
                          ============================== */}

                        <span style={collectionEntryStyles.emiName}>
                          EMI {installment.installmentNumber}
                        </span>

                        {/* ==============================
                              DUE DATE
                          ============================== */}

                        <span style={collectionEntryStyles.scheduleTableCell}>
                          {formatEmiDate(installment.dueDate)}
                        </span>

                        {/* ==============================
                              AMOUNT
                          ============================== */}

                        <strong style={collectionEntryStyles.emiAmount}>
                          {currency(installment.installmentAmount)}
                        </strong>

                        {/* ==============================
                              STATUS
                          ============================== */}

                        <span style={statusStyle}>
                          {getStatusLabel(installment.status)}
                        </span>

                        {/* ==============================
                              CHECKBOX
                          ============================== */}

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

                  {/* ==========================================
                      TOTAL EMI ROW
                  ========================================== */}

                  <div style={collectionEntryStyles.emiTotalRow}>
                    {/* ========================================
                        TOTAL LABEL
                    ======================================== */}

                    <strong style={collectionEntryStyles.emiTotalLabel}>
                      TOTAL EMIs
                    </strong>

                    {/* ========================================
                        EMPTY DATE COLUMN
                    ======================================== */}

                    <span style={collectionEntryStyles.emiTotalSpacer} />

                    {/* ========================================
                        TOTAL AMOUNT
                    ======================================== */}

                    <strong style={collectionEntryStyles.emiTotalAmount}>
                      {currency(totalEmiAmount)}
                    </strong>

                    {/* ========================================
                        TOTAL LABEL
                    ======================================== */}

                    <span style={collectionEntryStyles.emiTotalStatus}>
                      SELECT ALL
                    </span>

                    {/* ========================================
                        SELECT ALL CHECKBOX
                    ======================================== */}

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
