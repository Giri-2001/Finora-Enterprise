/* ===========================================================
   FINORA ENTERPRISE V2
   REPAYMENT STUDIO
   EMI CONFIGURATION
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  FormField,
  SelectInput,
  TextInput,
} from "../../common";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function EMIConfiguration() {

  return (

    <SummaryCard title="EMI Configuration">

      <FormField
        label="EMI Calculation"
        required
      >
        <SelectInput
          options={[
            {
              label: "Fixed EMI",
              value: "fixed",
            },
            {
              label: "Variable EMI",
              value: "variable",
            },
          ]}
        />
      </FormField>

      <FormField
        label="Installment Amount (₹)"
      >
        <TextInput
          type="number"
          placeholder="Auto or Manual"
        />
      </FormField>

      <FormField
        label="First Installment Date"
      >
        <TextInput
          type="date"
        />
      </FormField>

    </SummaryCard>

  );

}
