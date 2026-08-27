// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// PAYMENT DETAILS + COLLECTION ACTIONS
//
// RESPONSIBILITY
//
// - Capture collection date
// - Capture payment mode
// - Capture reference number
// - Capture remarks
// - Save the current collection
// - Save collection and open a printable receipt
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
// LAYOUT
//
// - Compact 3-column payment details grid.
// - Row 1: Date / Payment Mode / Reference.
// - Row 2: Remarks / Final Collection / Actions.
// - Designed to fit below Collection Entry inside the
//   right-side workspace column.
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { useState } from "react";

import { useCollectionController } from "../controller";

import { updateLoanOutstandingAmount } from "../../../services/loan/loanService";

import { approveCollection } from "../../../services/collection/collectionService";

import { collectionPaymentDetailsStyles } from "./PaymentDetails.styles";

// ============================================================
// HELPERS
// ============================================================

function safeNumber(value: unknown): number {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function formatCurrency(value: number): string {
  return `₹ ${Math.round(safeNumber(value)).toLocaleString("en-IN")}`;
}

function generateReceiptNumber(): string {
  const stamp = Date.now().toString().slice(-8);

  return `RCPT-${stamp}`;
}

// ============================================================
// COMPONENT
// ============================================================

export default function PaymentDetails() {
  const { reviewData, updateField } = useCollectionController();

  const [saving, setSaving] = useState(false);

  // ==========================================================
  // CURRENT COLLECTION VALUES
  // ==========================================================

  const collectionAmount = safeNumber(reviewData.paymentAmount);

  const discountAmount = safeNumber(reviewData.discountAmount);

  const manualPrincipal = safeNumber(reviewData.advanceAdjustment);

  const finalCollection = Math.max(0, collectionAmount);

  // ==========================================================
  // UPDATE FIELD
  // ==========================================================

  function handleDateChange(value: string): void {
    updateField("receiptDate", value);
  }

  function handlePaymentMethodChange(value: string): void {
    updateField("paymentMethod", value);
  }

  function handleReferenceChange(value: string): void {
    updateField("paymentReference", value);
  }

  function handleRemarksChange(value: string): void {
    updateField("remarks", value);
  }

  // ==========================================================
  // VALIDATE
  // ==========================================================

  function validateCollection(): boolean {
    if (!reviewData.loanId) {
      alert("Please select a loan.");

      return false;
    }

    if (collectionAmount <= 0) {
      alert("Please enter or select a collection amount.");

      return false;
    }

    if (collectionAmount > safeNumber(reviewData.outstandingBalance)) {
      alert(
        "Collection amount cannot be greater than the current outstanding balance.",
      );

      return false;
    }

    if (!reviewData.paymentMethod) {
      alert("Please select a payment mode.");

      return false;
    }

    return true;
  }

  // ==========================================================
  // BUILD PERSISTENCE DATA
  // ==========================================================

  function buildSaveData() {
    const now = new Date().toISOString();

    const receiptNumber =
      reviewData.receiptNumber || generateReceiptNumber();

    return {
      ...reviewData,

      paymentAmount: finalCollection,

      discountAmount,

      advanceAdjustment: manualPrincipal,

      receiptNumber,

      receiptDate: reviewData.receiptDate || now.slice(0, 10),

      status: "Approved" as const,

      createdAt: reviewData.createdAt || now,

      updatedAt: now,
    };
  }

  // ==========================================================
  // SAVE COLLECTION
  // ==========================================================

  async function handleSaveCollection(
    printReceipt: boolean,
  ): Promise<void> {
    if (saving) {
      return;
    }

    if (!validateCollection()) {
      return;
    }

    setSaving(true);

    try {
      const saveData = buildSaveData();

      console.info("FINORA COLLECTION SAVE", {
        loanId: saveData.loanId,

        paymentAmount: saveData.paymentAmount,

        manualPrincipal: saveData.advanceAdjustment,

        discountAmount: saveData.discountAmount,

        receiptNumber: saveData.receiptNumber,
      });

      // --------------------------------------------------------
      // UPDATE LOAN OUTSTANDING
      // --------------------------------------------------------

      const updatedLoan = await updateLoanOutstandingAmount(
        saveData.loanId,
        saveData.paymentAmount,
      );

      if (!updatedLoan) {
        throw new Error(
          "Unable to update the selected loan outstanding amount.",
        );
      }

      // --------------------------------------------------------
      // SAVE COLLECTION RECORD
      // --------------------------------------------------------

      const savedCollection = await approveCollection(saveData);

      // --------------------------------------------------------
      // PUSH SAVED VALUES BACK INTO CONTROLLER
      // --------------------------------------------------------

      updateField("receiptNumber", savedCollection.receiptNumber);

      updateField("status", "Approved");

      updateField("updatedAt", savedCollection.updatedAt);

      // --------------------------------------------------------
      // REFRESH LIVE COLLECTION / LOAN VIEWS
      // --------------------------------------------------------

      window.dispatchEvent(new Event("FINORA_LOAN_UPDATED"));

      window.dispatchEvent(new Event("FINORA_COLLECTION_UPDATED"));

      // --------------------------------------------------------
      // OPTIONAL RECEIPT
      // --------------------------------------------------------

      if (printReceipt) {
        printCollectionReceipt(saveData);
      }

      alert(
        printReceipt
          ? "Collection saved successfully. Receipt is ready to print."
          : "Collection saved successfully.",
      );
    } catch (error) {
      console.error("FINORA COLLECTION SAVE ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Collection could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // PRINT RECEIPT
  // ==========================================================

  function printCollectionReceipt(
    data: ReturnType<typeof buildSaveData>,
  ): void {
    const receiptWindow = window.open(
      "",
      "_blank",
      "width=760,height=900",
    );

    if (!receiptWindow) {
      alert(
        "Receipt window was blocked by the browser. Please allow pop-ups for FINORA Enterprise.",
      );

      return;
    }

    const customerName = data.customerName || "--";

    const loanNumber = data.loanNumber || "--";

    const paymentMode = data.paymentMethod || "--";

    const receiptDate = data.receiptDate || "--";

    receiptWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>FINORA Collection Receipt</title>
          <meta charset="utf-8" />
          <style>
            body {
              margin: 0;
              padding: 32px;
              font-family: Arial, sans-serif;
              color: #111827;
              background: #ffffff;
            }

            .receipt {
              max-width: 680px;
              margin: 0 auto;
              border: 1px solid #d5dce5;
              padding: 28px;
            }

            h1 {
              margin: 0 0 6px;
              font-size: 24px;
            }

            .brand {
              color: #a56f00;
              font-weight: 800;
              letter-spacing: .08em;
            }

            .meta {
              margin: 18px 0;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }

            .row {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              padding: 11px 0;
              border-bottom: 1px solid #e5e7eb;
            }

            .final {
              margin-top: 18px;
              padding: 16px;
              border: 1px solid #23865a;
              font-size: 20px;
              font-weight: 800;
              display: flex;
              justify-content: space-between;
            }

            .muted {
              color: #64748b;
              font-size: 12px;
            }

            @media print {
              body {
                padding: 0;
              }

              .receipt {
                border: 0;
              }
            }
          </style>
        </head>

        <body>
          <div class="receipt">
            <div class="brand">FINORA ENTERPRISE</div>

            <h1>COLLECTION RECEIPT</h1>

            <div class="muted">Collection Studio™</div>

            <div class="meta">
              <div>
                <strong>Receipt No</strong><br>
                ${data.receiptNumber}
              </div>

              <div>
                <strong>Date</strong><br>
                ${receiptDate}
              </div>

              <div>
                <strong>Customer</strong><br>
                ${customerName}
              </div>

              <div>
                <strong>Loan</strong><br>
                ${loanNumber}
              </div>

              <div>
                <strong>Payment Mode</strong><br>
                ${paymentMode}
              </div>

              <div>
                <strong>Reference</strong><br>
                ${data.paymentReference || "--"}
              </div>
            </div>

            <div class="row">
              <span>Collection Amount</span>
              <strong>${formatCurrency(data.paymentAmount)}</strong>
            </div>

            <div class="row">
              <span>Manual Principal</span>
              <strong>${formatCurrency(data.advanceAdjustment)}</strong>
            </div>

            <div class="row">
              <span>Discount</span>
              <strong>${formatCurrency(data.discountAmount)}</strong>
            </div>

            <div class="final">
              <span>FINAL COLLECTION</span>
              <span>${formatCurrency(data.paymentAmount)}</span>
            </div>

            <p class="muted">
              This receipt was generated by FINORA Enterprise Collection Studio™.
            </p>
          </div>
        </body>
      </html>
    `);

    receiptWindow.document.close();

    receiptWindow.focus();

    window.setTimeout(() => {
      receiptWindow.print();
    }, 250);
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
        <div style={collectionPaymentDetailsStyles.step}>6</div>

        <div>
          <h2 style={collectionPaymentDetailsStyles.title}>
            PAYMENT DETAILS
          </h2>

          <p style={collectionPaymentDetailsStyles.subtitle}>
            Record the collection payment information.
          </p>
        </div>
      </header>

      {/* ======================================================
          COMPACT PAYMENT GRID
      ====================================================== */}

      <div style={collectionPaymentDetailsStyles.body}>
        {/* ====================================================
            ROW 1 — COLLECTION DATE
        ==================================================== */}

        <div style={collectionPaymentDetailsStyles.field}>
          <label
            htmlFor="finora-collection-date"
            style={collectionPaymentDetailsStyles.label}
          >
            Collection Date *
          </label>

          <input
            id="finora-collection-date"
            type="date"
            value={reviewData.receiptDate || ""}
            onChange={(event) =>
              handleDateChange(event.target.value)
            }
            style={collectionPaymentDetailsStyles.input}
          />
        </div>

        {/* ====================================================
            ROW 1 — PAYMENT MODE
        ==================================================== */}

        <div style={collectionPaymentDetailsStyles.field}>
          <label
            htmlFor="finora-payment-mode"
            style={collectionPaymentDetailsStyles.label}
          >
            Payment Mode *
          </label>

          <select
            id="finora-payment-mode"
            value={reviewData.paymentMethod || "cash"}
            onChange={(event) =>
              handlePaymentMethodChange(event.target.value)
            }
            style={collectionPaymentDetailsStyles.input}
          >
            <option value="cash">Cash</option>

            <option value="upi">UPI</option>

            <option value="bank">Bank Transfer</option>

            <option value="cheque">Cheque</option>
          </select>
        </div>

        {/* ====================================================
            ROW 1 — REFERENCE NUMBER
        ==================================================== */}

        <div style={collectionPaymentDetailsStyles.field}>
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
            onChange={(event) =>
              handleReferenceChange(event.target.value)
            }
            placeholder="Enter reference number"
            style={collectionPaymentDetailsStyles.input}
          />
        </div>

        {/* ====================================================
            ROW 2 — REMARKS
        ==================================================== */}

        <div
          style={collectionPaymentDetailsStyles.remarksField}
        >
          <label
            htmlFor="finora-payment-remarks"
            style={collectionPaymentDetailsStyles.label}
          >
            Remarks
          </label>

          <textarea
            id="finora-payment-remarks"
            value={reviewData.remarks || ""}
            onChange={(event) =>
              handleRemarksChange(event.target.value)
            }
            placeholder="Enter remarks"
            rows={2}
            style={collectionPaymentDetailsStyles.textarea}
          />
        </div>

        {/* ====================================================
            ROW 2 — FINAL COLLECTION
        ==================================================== */}

        <div style={collectionPaymentDetailsStyles.totalBar}>
          <div style={collectionPaymentDetailsStyles.totalContent}>
            <span
              style={collectionPaymentDetailsStyles.totalLabel}
            >
              FINAL COLLECTION
            </span>

            <span
              style={collectionPaymentDetailsStyles.totalHint}
            >
              {reviewData.collectionType === "manual"
                ? "Manual collection"
                : "Selected EMI / collection amount"}
            </span>
          </div>

          <strong
            style={collectionPaymentDetailsStyles.totalValue}
          >
            {formatCurrency(finalCollection)}
          </strong>
        </div>

        {/* ====================================================
            ROW 2 — ACTIONS
        ==================================================== */}

        <div style={collectionPaymentDetailsStyles.actions}>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void handleSaveCollection(false)
            }
            style={collectionPaymentDetailsStyles.saveButton}
          >
            {saving ? "SAVING..." : "SAVE COLLECTION"}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void handleSaveCollection(true)
            }
            style={collectionPaymentDetailsStyles.receiptButton}
          >
            {saving ? "SAVING..." : "SAVE & RECEIPT"}
          </button>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// END
// ============================================================