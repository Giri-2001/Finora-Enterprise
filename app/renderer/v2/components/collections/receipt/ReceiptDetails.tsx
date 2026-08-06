/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   RECEIPT DETAILS
=========================================================== */

import type { CSSProperties } from "react";

import {
  FormField,
  TextArea,
  TextInput,
} from "../../common";

import {
  useCollectionController,
} from "../controller";

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

export default function ReceiptDetails() {
  const {
    reviewData,
    updateField,
  } = useCollectionController();

  return (
    <div style={wrapperStyle}>
      <FormField
        label="Receipt Number"
        required
      >
        <TextInput
          value={reviewData.receiptNumber}
          placeholder="Enter receipt number"
          onChange={(event) =>
            updateField(
              "receiptNumber",
              event.target.value,
            )
          }
        />
      </FormField>

      <FormField
        label="Receipt Date"
        required
      >
        <TextInput
          type="date"
          value={reviewData.receiptDate}
          onChange={(event) =>
            updateField(
              "receiptDate",
              event.target.value,
            )
          }
        />
      </FormField>

      <FormField
        label="Issued By"
        required
      >
        <TextInput
          placeholder="Enter collector name"
        />
      </FormField>

      <FormField
        label="Remarks"
      >
        <TextArea
          value={reviewData.remarks}
          placeholder="Enter receipt remarks"
          onChange={(event) =>
            updateField(
              "remarks",
              event.target.value,
            )
          }
        />
      </FormField>
    </div>
  );
}
