/* ===========================================================
   FINORA ENTERPRISE V2
   COLLECTION STUDIO
   COLLECTION FORM
=========================================================== */

import type { CSSProperties } from "react";

import {
  FormField,
  SelectInput,
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

export default function CollectionForm() {

  return (

    <div style={wrapperStyle}>

      <FormField
        label="Collection Date"
        required
      >
        <TextInput
          type="date"
        />
      </FormField>

      <FormField
        label="Collection Amount"
        required
      >
        <TextInput
          type="number"
          placeholder="Enter collection amount"
        />
      </FormField>

      <FormField
        label="Payment Mode"
        required
      >
        <SelectInput
          options={[
            { label: "Cash", value: "cash" },
            { label: "UPI", value: "upi" },
            { label: "Bank Transfer", value: "bank" },
            { label: "Cheque", value: "cheque" },
          ]}
        />
      </FormField>

      <FormField
        label="Remarks"
      >
        <TextArea
          placeholder="Enter collection remarks"
        />
      </FormField>

    </div>

  );

}
