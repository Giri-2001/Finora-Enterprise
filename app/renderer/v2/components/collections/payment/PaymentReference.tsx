/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT STUDIO
   PAYMENT REFERENCE
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  FormField,
  TextInput,
} from "../../common";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PaymentReference() {

  return (

    <SummaryCard title="Payment Reference">

      <FormField
        label="Reference Number"
      >
        <TextInput
          placeholder="Enter transaction reference"
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
          placeholder="Enter receipt number"
        />
      </FormField>

    </SummaryCard>

  );

}
