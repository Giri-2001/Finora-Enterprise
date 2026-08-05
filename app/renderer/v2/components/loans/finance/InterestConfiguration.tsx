/* ===========================================================
   FINORA ENTERPRISE V2
   FINANCE STUDIO
   INTEREST CONFIGURATION
=========================================================== */

import type { CSSProperties } from "react";

import {
  FormField,
  SelectInput,
  TextInput,
} from "../../common";

/* ===========================================================
   STYLES
=========================================================== */

const wrapperStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "20px",

};

/* ===========================================================
   TYPES
=========================================================== */

interface InterestConfigurationProps {

  interestType: string;

  interestRate: string;

  onInterestTypeChange: (
    value: string,
  ) => void;

  onInterestRateChange: (
    value: string,
  ) => void;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function InterestConfiguration({

  interestType,

  interestRate,

  onInterestTypeChange,

  onInterestRateChange,

}: InterestConfigurationProps) {

  return (

    <div style={wrapperStyle}>

      <FormField
        label="Interest Type"
        required
      >
        <SelectInput
  value={interestType}
  onChange={(event) =>
    onInterestTypeChange(
      event.target.value,
    )
  }
  options={[
    {
      label: "Flat Interest",
      value: "Flat Interest",
    },
    {
      label: "Reducing Balance",
      value: "Reducing Balance",
    },
  ]}
/>
      </FormField>

      <FormField
        label="Interest Rate (%)"
        required
      >
        <TextInput
  type="number"
  value={interestRate}
  onChange={(event) =>
    onInterestRateChange(
      event.target.value,
    )
  }
  placeholder="Enter interest rate"
/>
      </FormField>

      <FormField
        label="Interest Calculation"
      >
        <SelectInput
          options={[
            {
              label: "Daily",
              value: "daily",
            },
            {
              label: "Weekly",
              value: "weekly",
            },
            {
              label: "Monthly",
              value: "monthly",
            },
          ]}
        />
      </FormField>

    </div>

  );

}
