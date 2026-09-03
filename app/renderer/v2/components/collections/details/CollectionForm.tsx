/* ===========================================================
   FINORA ENTERPRISE V2
   COLLECTION STUDIO
   COLLECTION FORM
=========================================================== */

import type { CSSProperties } from "react";

import { FormField, SelectInput, TextArea, TextInput } from "../../common";

import { useCollectionController } from "../controller";

/* ===========================================================
   STYLES
=========================================================== */

const wrapperStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

/* ===========================================================
   COMPONENT
=========================================================== */
export default function CollectionForm() {
  const {
    reviewData,
    updateCollectionAmount,
    updatePaymentMethod,
    updateRemarks,
  } = useCollectionController();

  void reviewData;

  return (
    <div style={wrapperStyle}>
      <FormField label="Collection Date" required>
        <TextInput
          type="date"
          value={reviewData.receiptDate}
          readOnly
          disabled
          aria-label="Collection Date locked to Login Date"
          title="This date is locked to the active FINORA Login Date."
        />
      </FormField>

      <FormField label="Collection Amount" required>
        <TextInput
          type="number"
          value={reviewData.paymentAmount}
          placeholder="Enter collection amount"
          onChange={(event) =>
            updateCollectionAmount(Number(event.target.value))
          }
        />
      </FormField>

      <FormField label="Payment Mode" required>
        <SelectInput
          value={reviewData.paymentMethod}
          options={[
            { label: "Cash", value: "cash" },
            { label: "UPI", value: "upi" },
            { label: "Bank Transfer", value: "bank" },
            { label: "Cheque", value: "cheque" },
          ]}
          onChange={(event) => updatePaymentMethod(event.target.value)}
        />
      </FormField>

      <FormField label="Remarks">
        <TextArea
          value={reviewData.remarks}
          placeholder="Enter collection remarks"
          onChange={(event) => updateRemarks(event.target.value)}
        />
      </FormField>
    </div>
  );
}
