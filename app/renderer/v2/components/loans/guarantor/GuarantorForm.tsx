/* ===========================================================
   FINORA ENTERPRISE V2
   GUARANTOR STUDIO
   GUARANTOR FORM
=========================================================== */

import type { CSSProperties } from "react";

import {
  FormField,
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

export default function GuarantorForm() {

  return (

    <div style={wrapperStyle}>

      <FormField
        label="Guarantor Name"
        required
      >
        <TextInput
          placeholder="Enter guarantor name"
        />
      </FormField>

      <FormField
        label="Mobile Number"
        required
      >
        <TextInput
          placeholder="Enter mobile number"
        />
      </FormField>

      <FormField
        label="Occupation"
      >
        <TextInput
          placeholder="Enter occupation"
        />
      </FormField>

      <FormField
        label="Address"
      >
        <TextInput
          placeholder="Enter address"
        />
      </FormField>

    </div>

  );

}
