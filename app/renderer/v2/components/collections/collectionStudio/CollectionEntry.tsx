// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// COLLECTION ENTRY
//
// RESPONSIBILITY
//
// - Render collection entry section
// - Switch between EMI and Manual Collection
// - Display EMI schedule
// - Allow eligible EMI selection
// - Display selected EMI amount
// - Display manual principal amount
// - Display discount amount
//
// IMPORTANT
//
// - No financial calculation engine
// - Controller remains the source of truth
// - No local theme system
// - No local responsive system
// - No inline colour palette
// - Geometry belongs to dedicated styles
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { collectionEntryStyles } from "./CollectionEntry.styles";

import { useCollectionController } from "../controller";

import { formatCurrency } from "../../../utils/currency/formatCurrency";

// ============================================================
// TYPES
// ============================================================

interface EmiRecord {
  id: string;

  emiNumber: string;

  dueDate: string;

  amount: number;

  status: string;

  selected?: boolean;
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

  // ==========================================================
  // EMI DATA
  //
  // The current controller contract does not expose a
  // dedicated EMI schedule collection.
  //
  // Keep this presentation boundary ready for the real
  // schedule source without introducing business logic here.
  // ==========================================================

  const emiSchedule: EmiRecord[] = [];

  // ==========================================================
  // CURRENCY
  // ==========================================================

  function currency(value: number): string {
    return `₹ ${formatCurrency(value)}`;
  }

  // ==========================================================
  // COLLECTION MODE
  // ==========================================================

  const collectionMode = String(
    reviewData.collectionType ?? "emi",
  ).toLowerCase();

  const isManual = collectionMode === "manual";

  // ==========================================================
  // MODE CHANGE
  // ==========================================================

  function handleModeChange(mode: "emi" | "manual"): void {
    updateField("collectionType", mode);
  }

  // ==========================================================
  // EMI SELECTION
  // ==========================================================

  function handleEmiSelection(emi: EmiRecord): void {
    if (emi.status.toLowerCase() === "paid") {
      return;
    }

    updateField("paymentAmount", emi.amount);
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
          style={{
            ...collectionEntryStyles.radioOption,
            ...(isManual ? {} : collectionEntryStyles.radioOptionActive),
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
          EMI SCHEDULE
      ====================================================== */}

      {!isManual && (
        <div style={collectionEntryStyles.schedule}>
          {/* ==================================================
              SCHEDULE HEADER
          ================================================== */}

          <div style={collectionEntryStyles.scheduleHeader}>EMI SCHEDULE</div>

          {/* ==================================================
              SCHEDULE CONTENT
          ================================================== */}

          {emiSchedule.length === 0 ? (
            <div style={collectionEntryStyles.emptySchedule}>
              EMI schedule will appear here for the selected loan.
            </div>
          ) : (
            <div style={collectionEntryStyles.scheduleTable}>
              {/* ==============================================
                  TABLE HEADER
              ============================================== */}

              <div style={collectionEntryStyles.scheduleTableHeader}>
                <span>EMI</span>

                <span>DUE DATE</span>

                <span>EMI AMOUNT</span>

                <span>STATUS</span>

                <span>SELECT</span>
              </div>

              {/* ==============================================
                  TABLE ROWS
              ============================================== */}

              {emiSchedule.map((emi) => {
                const isPaid = emi.status.toLowerCase() === "paid";

                const rowStyle = {
                  ...collectionEntryStyles.scheduleTableRow,

                  ...(emi.selected ? collectionEntryStyles.selectedRow : {}),

                  ...(isPaid ? collectionEntryStyles.lockedRow : {}),
                };

                const statusStyle = {
                  ...collectionEntryStyles.status,

                  ...(isPaid
                    ? collectionEntryStyles.statusPaid
                    : collectionEntryStyles.statusPending),
                };

                return (
                  <div key={emi.id} style={rowStyle}>
                    <span style={collectionEntryStyles.emiName}>
                      {emi.emiNumber}
                    </span>

                    <span style={collectionEntryStyles.scheduleTableCell}>
                      {emi.dueDate}
                    </span>

                    <strong style={collectionEntryStyles.emiAmount}>
                      {currency(emi.amount)}
                    </strong>

                    <span style={statusStyle}>{emi.status}</span>

                    <input
                      type="checkbox"
                      checked={Boolean(emi.selected)}
                      disabled={isPaid}
                      onChange={() => handleEmiSelection(emi)}
                      aria-label={`Select ${emi.emiNumber}`}
                      style={collectionEntryStyles.selectControl}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================
          MANUAL COLLECTION AREA
      ====================================================== */}

      {isManual && (
        <div style={collectionEntryStyles.manualSection}>
          <div style={collectionEntryStyles.manualMessage}>
            Manual collection entry is controlled by the Collection Controller.
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
            {currency(paymentAmount)}
          </strong>

          {!isManual && (
            <span style={collectionEntryStyles.valueHint}>
              Based on selected EMI schedule
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
