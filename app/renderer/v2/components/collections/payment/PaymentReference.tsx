/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   PAYMENT REFERENCE
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  FormField,
  TextInput,
} from "../../common";

import {
  useCollectionController,
} from "../controller";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PaymentReference() {
  const {
    reviewData,
    updateField,
  } = useCollectionController();

  return (
    <SummaryCard title="Payment Reference">
      <FormField
        label="Reference Number"
      >
        <TextInput
          value={reviewData.paymentReference}
          placeholder="Enter transaction reference"
          onChange={(event) =>
            updateField(
              "paymentReference",
              event.target.value,
            )
          }
        />
      </FormField>

      <FormField
        label="Collected By"
        required
      >
        <TextInput
          placeholder="Enter collector name"
        />
      </FormField>

      <FormField
        label="Receipt Number"
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
    </SummaryCard>
  );
}
