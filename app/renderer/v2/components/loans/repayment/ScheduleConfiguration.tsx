/* ===========================================================
   FINORA ENTERPRISE V2
   REPAYMENT STUDIO
   SCHEDULE CONFIGURATION
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

export default function ScheduleConfiguration() {

  return (

    <div style={wrapperStyle}>

      <FormField
        label="Repayment Frequency"
        required
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

      <FormField
        label="Loan Duration"
        required
      >
        <TextInput
          type="number"
          placeholder="Enter duration"
        />
      </FormField>

      <FormField
        label="Duration Unit"
        required
      >
        <SelectInput
          options={[
            {
              label: "Days",
              value: "days",
            },
            {
              label: "Weeks",
              value: "weeks",
            },
            {
              label: "Months",
              value: "months",
            },
          ]}
        />
      </FormField>

    </div>

  );

}
