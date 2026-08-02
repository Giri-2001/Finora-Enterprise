/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT STUDIO
   PAYMENT METHOD CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  FormField,
  SelectInput,
} from "../../common";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PaymentMethodCard() {

  return (

    <SummaryCard title="Payment Method">

      <FormField
        label="Collection Method"
        required
      >
        <SelectInput
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
