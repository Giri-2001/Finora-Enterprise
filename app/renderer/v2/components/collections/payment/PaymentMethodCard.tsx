/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   PAYMENT METHOD CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  FormField,
  SelectInput,
} from "../../common";

import {
  useCollectionController,
} from "../controller";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PaymentMethodCard() {
  const {
    reviewData,
    updatePaymentMethod,
  } = useCollectionController();

  return (
    <SummaryCard title="Payment Method">
      <FormField
        label="Collection Method"
        required
      >
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
            updatePaymentMethod(
              event.target.value,
            )
          }
        />
      </FormField>

      <FormField
        label="Transaction Status"
      >
        <SelectInput
          options={[
            {
              label: "Pending",
              value: "pending",
            },
            {
              label: "Successful",
              value: "successful",
            },
            {
              label: "Failed",
              value: "failed",
            },
          ]}
        />
      </FormField>
    </SummaryCard>
  );
}
