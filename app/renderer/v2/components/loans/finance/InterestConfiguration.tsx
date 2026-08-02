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
   COMPONENT
=========================================================== */

export default function InterestConfiguration() {

  return (

    <div style={wrapperStyle}>

      <FormField
        label="Interest Type"
        required
      >
        <SelectInput
          options={[
            {
              label: "Flat Interest",
              value: "flat",
            },
            {
              label: "Reducing Balance",
              value: "reducing",
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
