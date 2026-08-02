/* ===========================================================
   FINORA ENTERPRISE V2
   FINANCE STUDIO
   PENALTY CONFIGURATION
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

export default function PenaltyConfiguration() {

  return (

    <SummaryCard title="Penalty Configuration">

      <FormField
        label="Penalty Type"
      >
        <SelectInput
          options={[
            {
              label: "Fixed Amount",
              value: "fixed",
            },
            {
              label: "Percentage",
              value: "percentage",
            },
          ]}
        />
      </FormField>

      <FormField
        label="Penalty Value"
      >
        <TextInput
          type="number"
          placeholder="Enter penalty value"
        />
      </FormField>

      <FormField
        label="Grace Period (Days)"
      >
        <TextInput
          type="number"
          placeholder="Enter grace period"
        />
      </FormField>

    </SummaryCard>

  );

}
