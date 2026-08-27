/* ===========================================================
   FINORA ENTERPRISE OS™

   COLLECTION STUDIO™

   PAYMENT DETAILS

   RESPONSIBILITY

   - Collection date
   - Payment mode
   - Optional payment reference
   - Optional collection remarks
   - Controller-driven state updates
   - Presentation only

   IMPORTANT

   - No business calculations
   - No persistence
   - No direct storage access
   - No local theme system
   - No responsive logic
   - Geometry belongs to styles / Responsive Engine
=========================================================== */

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

import { FormField, SelectInput, TextArea, TextInput } from "../../common";

import { useCollectionController } from "../controller";

import { paymentDetailsStyles } from "./PaymentDetails.styles";

// ============================================================
// COMPONENT
// ============================================================

export default function PaymentDetails() {
  // ==========================================================
  // COLLECTION CONTROLLER
  // ==========================================================

  const { reviewData, updateCollectionDate, updateField } =
    useCollectionController();

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section aria-label="Payment Details" style={paymentDetailsStyles.section}>
      {/* ======================================================
          SECTION HEADER
      ====================================================== */}

      <header style={paymentDetailsStyles.header}>
        <div style={paymentDetailsStyles.headerContent}>
          <span style={paymentDetailsStyles.step}>6</span>

          <div>
            <h2 style={paymentDetailsStyles.title}>PAYMENT DETAILS</h2>

            <p style={paymentDetailsStyles.subtitle}>
              Record the collection payment information.
            </p>
          </div>
        </div>
      </header>

      {/* ======================================================
          PAYMENT FORM
      ====================================================== */}

      <div style={paymentDetailsStyles.form}>
        {/* ====================================================
            COLLECTION DATE
        ==================================================== */}

        <div style={paymentDetailsStyles.field}>
          <FormField label="Collection Date" required>
            <TextInput
              type="date"
              value={reviewData.receiptDate}
              onChange={(event) => updateCollectionDate(event.target.value)}
            />
          </FormField>
        </div>

        {/* ====================================================
            PAYMENT MODE
        ==================================================== */}

        <div style={paymentDetailsStyles.field}>
          <FormField label="Payment Mode" required>
            <SelectInput
              value={reviewData.paymentMethod}
              options={[
                {
                  label: "Cash",
                  value: "cash",
                },
                {
                  label: "UPI",
                  value: "upi",
                },
                {
                  label: "Bank Transfer",
                  value: "bank",
                },
                {
                  label: "Cheque",
                  value: "cheque",
                },
              ]}
              onChange={(event) =>
                updateField("paymentMethod", event.target.value)
              }
            />
          </FormField>
        </div>

        {/* ====================================================
            REFERENCE NUMBER
        ==================================================== */}

        <div style={paymentDetailsStyles.field}>
          <FormField label="Reference No">
            <TextInput
              value={reviewData.paymentReference}
              placeholder="Enter reference number"
              onChange={(event) =>
                updateField("paymentReference", event.target.value)
              }
            />
          </FormField>
        </div>

        {/* ====================================================
            REMARKS
        ==================================================== */}

        <div style={paymentDetailsStyles.field}>
          <FormField label="Remarks">
            <TextArea
              value={reviewData.remarks}
              placeholder="Enter remarks"
              onChange={(event) => updateField("remarks", event.target.value)}
            />
          </FormField>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// END
// ============================================================
