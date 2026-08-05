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
   TYPES
=========================================================== */

interface PenaltyConfigurationProps {

  penaltyType: string;

  penaltyValue: string;

  onPenaltyTypeChange: (
    value: string,
  ) => void;

  onPenaltyValueChange: (
    value: string,
  ) => void;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PenaltyConfiguration({

  penaltyType,

  penaltyValue,

  onPenaltyTypeChange,

  onPenaltyValueChange,

}: PenaltyConfigurationProps) {

  return (

    <SummaryCard title="Penalty Configuration">

      <FormField
        label="Penalty Type"
      >
        <SelectInput
  value={penaltyType}
  onChange={(event) =>
    onPenaltyTypeChange(
      event.target.value,
    )
  }
  options={[
    {
      label: "Fixed Amount",
      value: "Fixed Amount",
    },
    {
      label: "Percentage",
      value: "Percentage",
    },
  ]}
/>
      </FormField>

      <FormField
        label="Penalty Value"
      >
        <TextInput
  type="number"
  value={penaltyValue}
  onChange={(event) =>
    onPenaltyValueChange(
      event.target.value,
    )
  }
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
