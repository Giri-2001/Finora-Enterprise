/* ===========================================================
   FINORA ENTERPRISE V2
   RECEIPT STUDIO
   RECEIPT DETAILS
=========================================================== */

import type { CSSProperties } from "react";

import {
  FormField,
  TextArea,
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

export default function ReceiptDetails() {

  return (

    <div style={wrapperStyle}>

      <FormField
        label="Receipt Number"
        required
      >
        <TextInput
          placeholder="Enter receipt number"
        />
      </FormField>

      <FormField
        label="Receipt Date"
        required
      >
        <TextInput
          type="date"
        />
      </FormField>

      <FormField
        label="Issued By"
        required
      >
        <TextInput
          placeholder="Enter collector name"
        />
      </FormField>

      <FormField
        label="Remarks"
      >
        <TextArea
          placeholder="Enter receipt remarks"
        />
      </FormField>

    </div>

  );

}
