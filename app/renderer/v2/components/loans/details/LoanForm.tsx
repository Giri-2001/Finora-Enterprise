/* ===========================================================
   FINORA ENTERPRISE V2
   LOAN DETAILS STUDIO
   LOAN FORM
=========================================================== */

import { CSSProperties } from "react";

import {
  FormField,
  TextInput,
  SelectInput,
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

export default function LoanForm() {

  return (

    <div style={wrapperStyle}>

      <FormField

        label="Loan Number"

        required

      >

        <TextInput

          placeholder="Auto Generated"

        />

      </FormField>

      <FormField

        label="Loan Amount"

        required

      >

        <TextInput

          type="number"

          placeholder="Enter loan amount"

        />

      </FormField>

      <FormField

        label="Loan Type"

        required

      >

        <SelectInput

          options={[

            {

              label: "Daily Loan",

              value: "daily",

            },

            {

              label: "Weekly Loan",

              value: "weekly",

            },

            {

              label: "Monthly Loan",

              value: "monthly",

            },

          ]}

        />

      </FormField>

    </div>

  );

}
