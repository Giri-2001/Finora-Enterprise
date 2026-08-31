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
// - receiptDate   = today
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
  useEffect,
  useState,
} from "react";

import { WalletCards } from "lucide-react";

import { useCollectionController } from "../controller";

import { updateLoanOutstandingAmount } from "../../../services/loan/loanService";

import { approveCollection } from "../../../services/collection/collectionService";

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
// LOCAL TODAY
// ============================================================
//
// Uses local calendar date instead of UTC date.
//
// This prevents a date shift around local midnight.
//
// ============================================================

function getLocalTodayInputValue(): string {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ============================================================
// CURRENCY
// ============================================================

function formatCurrency(value: number): string {
  return `₹ ${Math.round(safeNumber(value)).toLocaleString("en-IN")}`;
}

// ============================================================
// COMPONENT
// ============================================================

export default function PaymentDetails() {
  const { reviewData, updateField } = useCollectionController();

  // ==========================================================
  // FINORA RESPONSIVE ENGINE
  // ==========================================================

  const { viewport, tokens } = useResponsive();

  const responsiveBodyStyle = {
    ...collectionPaymentDetailsStyles.body,

    ...createPaymentDetailsBodyStyle(tokens, viewport),
  };

  const responsiveFieldStyle = {
    ...collectionPaymentDetailsStyles.field,

    ...createPaymentDetailsFieldStyle(viewport),
  };

  const responsiveRemarksStyle = {
    ...collectionPaymentDetailsStyles.remarksField,

    ...createPaymentDetailsRemarksStyle(viewport),
  };

  const responsiveTotalStyle = {
    ...collectionPaymentDetailsStyles.totalBar,

    ...createPaymentDetailsTotalStyle(viewport),
  };

  const responsiveActionsStyle = {
    ...collectionPaymentDetailsStyles.actions,

    ...createPaymentDetailsActionsStyle(tokens, viewport),
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
    ...collectionPaymentDetailsStyles.saveButton,

    ...createPaymentDetailsButtonStyle(tokens, viewport),
  };

  const responsiveReceiptButtonStyle = {
    ...collectionPaymentDetailsStyles.receiptButton,

    ...createPaymentDetailsButtonStyle(tokens, viewport),
  };

  // ==========================================================
  // SAVING STATE
  // ==========================================================

  const [saving, setSaving] = useState(false);

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

  const manualPrincipal = safeNumber(reviewData.advanceAdjustment);

  // ==========================================================
  // ACTUAL COLLECTION
  // ==========================================================

  const finalCollection = collectionAmount;

  // ==========================================================
  // TOTAL SETTLEMENT REDUCTION
  // ==========================================================

  const settlementReduction = finalCollection + discountAmount;

  // ==========================================================
  // SELECTED EMI STATE
  // ==========================================================

  const selectedEmiNumbers = Array.isArray(reviewData.selectedEmiNumbers)
    ? reviewData.selectedEmiNumbers
    : [];

  const selectedEmiAmount = safeNumber(reviewData.selectedEmiAmount);

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

    updateField("receiptDate", getLocalTodayInputValue());

    // --------------------------------------------------------
    // RESET COLLECTION ENTRY LOCAL UI
    // --------------------------------------------------------

    window.dispatchEvent(new Event("FINORA_COLLECTION_FORM_RESET"));
  }

  // ==========================================================
  // VALIDATE
  // ==========================================================

  function validateCollection(): boolean {
    // --------------------------------------------------------
    // LOAN
    // --------------------------------------------------------

    if (!reviewData.loanId) {
      alert("Please select a loan.");

      return false;
    }

    // --------------------------------------------------------
    // ACTUAL PAYMENT
    // --------------------------------------------------------

    if (finalCollection <= 0) {
      alert("Please enter or select a collection amount.");

      return false;
    }

    // --------------------------------------------------------
    // AUTHORITATIVE OUTSTANDING
    // --------------------------------------------------------

    const currentOutstanding = safeNumber(reviewData.outstandingBalance);

    if (currentOutstanding <= 0) {
      alert("This loan has no outstanding balance.");

      return false;
    }

    // --------------------------------------------------------
    // PAYMENT CANNOT EXCEED OUTSTANDING
    // --------------------------------------------------------

    if (finalCollection > currentOutstanding) {
      alert(
        "Collection amount cannot be greater than the current outstanding balance.",
      );

      return false;
    }

    // --------------------------------------------------------
    // PAYMENT + DISCOUNT CANNOT EXCEED OUTSTANDING
    // --------------------------------------------------------

    if (settlementReduction > currentOutstanding) {
      alert(
        "Collection amount plus discount cannot be greater than the current outstanding balance.",
      );

      return false;
    }

    // --------------------------------------------------------
    // PAYMENT METHOD
    // --------------------------------------------------------

    if (!reviewData.paymentMethod) {
      alert("Please select a payment mode.");

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

      receiptDate: reviewData.receiptDate || getLocalTodayInputValue(),

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

  async function handleSaveCollection(printReceipt: boolean): Promise<void> {
    // --------------------------------------------------------
    // DOUBLE SUBMIT PROTECTION
    // --------------------------------------------------------

    if (saving) {
      return;
    }

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!validateCollection()) {
      return;
    }

    setSaving(true);

    try {
      // ======================================================
      // AUTHORITATIVE COLLECTION / RECEIPT NUMBER RESERVATION
      //
      // Reservation occurs only after validation succeeds and
      // before any Loan or Collection mutation begins.
      //
      // Once reserved, the sequence is never recycled.
      // ======================================================

      const numberingResult =
        await reserveNextCollectionReceiptPair(
          reviewData.customerId,
          reviewData.loanNumber,
        );

      if (
        !numberingResult.success ||
        !numberingResult.data
      ) {
        throw new Error(
          numberingResult.error ??
            "Unable to reserve FINORA Collection / Receipt Numbers.",
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
        );

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

      const updatedLoan = await updateLoanOutstandingAmount(
        saveData.loanId,

        saveData.paymentAmount,

        {
          selectedEmiNumbers: saveData.selectedEmiNumbers,

          receiptNumber: saveData.receiptNumber,

          paidDate: saveData.receiptDate,

          discountAmount: saveData.discountAmount,
        },
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

      const collectionSaveData = {
        ...saveData,

        outstandingBalance: updatedOutstanding,
      };

      // ======================================================
      // SAVE COLLECTION RECORD
      // ======================================================

      const savedCollection = await approveCollection(collectionSaveData);

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

      if (printReceipt) {
        printCollectionReceipt(collectionSaveData);
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

      resetTransactionForm();

      // ======================================================
      // REFRESH LIVE LOAN / COLLECTION VIEWS
      // ======================================================

      window.dispatchEvent(new Event("FINORA_LOAN_UPDATED"));

      window.dispatchEvent(new Event("FINORA_COLLECTION_UPDATED"));

      // ======================================================
      // SUCCESS MESSAGE
      // ======================================================

      const loanClosed = updatedOutstanding === 0;

      alert(
        loanClosed
          ? printReceipt
            ? "Collection saved successfully. Loan closed. Receipt is ready to print."
            : "Collection saved successfully. Loan closed."
          : printReceipt
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
      setNumberingPreviewVersion(
        (current) => current + 1,
      );

      setSaving(false);
    }
  }

  // ==========================================================
  // PRINT RECEIPT
  // ==========================================================

  function printCollectionReceipt(
    data: ReturnType<typeof buildSaveData>,
  ): void {
    const receiptWindow = window.open("", "_blank", "width=760,height=900");

    if (!receiptWindow) {
      alert(
        "Receipt window was blocked by the browser. Please allow pop-ups for FINORA Enterprise.",
      );

      return;
    }

    // ========================================================
    // RECEIPT VALUES
    // ========================================================

    const customerName = data.customerName || "--";

    const loanNumber = data.loanNumber || "--";

    const paymentMode = data.paymentMethod || "--";

    const receiptDate = data.receiptDate || "--";

    const settlementValue =
      safeNumber(data.paymentAmount) + safeNumber(data.discountAmount);

    // ========================================================
    // RECEIPT DOCUMENT
    // ========================================================

    receiptWindow.document.write(`
      <!doctype html>

      <html>

        <head>

          <title>
            FINORA Collection Receipt
          </title>

          <meta
            charset="utf-8"
          />

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

            <div class="brand">
              FINORA ENTERPRISE
            </div>

            <h1>
              COLLECTION RECEIPT
            </h1>

            <div class="muted">
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

          <input
            id="finora-collection-date"
            type="date"
            value={reviewData.receiptDate || ""}
            onChange={(event) => handleDateChange(event.target.value)}
            style={responsiveInputStyle}
          />
        </div>

        {/* ====================================================
            PAYMENT MODE
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
            onChange={(event) => handleReferenceChange(event.target.value)}
            placeholder="Enter reference number"
            style={collectionPaymentDetailsStyles.input}
          />
        </div>

        {/* ====================================================
            REMARKS
        ==================================================== */}

        <div style={responsiveRemarksStyle}>
          <textarea
            id="finora-payment-remarks"
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

        <div style={responsiveActionsStyle}>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSaveCollection(false)}
            style={responsiveSaveButtonStyle}
          >
            {saving ? "SAVING..." : "SAVE COLLECTION"}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSaveCollection(true)}
            style={responsiveReceiptButtonStyle}
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
