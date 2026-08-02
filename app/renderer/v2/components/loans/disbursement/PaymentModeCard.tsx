/* ===========================================================
   FINORA ENTERPRISE V2
   DISBURSEMENT STUDIO
   PAYMENT MODE CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  FormField,
  SelectInput,
} from "../../common";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PaymentModeCard() {

  return (

    <SummaryCard title="Payment Mode">

      <FormField
        label="Primary Payment Mode"
        required
      >
        <SelectInput
          options={[
            {
              label: "Cash",
              value: "cash",
            },
            {
              label: "Bank Transfer",
              value: "bank",
            },
            {
              label: "UPI",
              value: "upi",
            },
            {
              label: "Cheque",
              value: "cheque",
            },
          ]}
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
              label: "Completed",
              value: "completed",
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
