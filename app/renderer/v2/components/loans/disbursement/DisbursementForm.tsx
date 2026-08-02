/* ===========================================================
   FINORA ENTERPRISE V2
   DISBURSEMENT STUDIO
   DISBURSEMENT FORM
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

export default function DisbursementForm() {

  return (

    <div style={wrapperStyle}>

      <FormField
        label="Disbursement Date"
        required
      >
        <TextInput
          type="date"
        />
      </FormField>

      <FormField
        label="Disbursement Amount"
        required
      >
        <TextInput
          type="number"
          placeholder="Enter amount"
        />
      </FormField>

      <FormField
        label="Payment Mode"
        required
      >
        <SelectInput
          options={[
            {
              label: "Cash",
              value: "cash",
            },
            {
              label: "Bank Transfer",
              value: "bank",
            },
            {
              label: "UPI",
              value: "upi",
            },
            {
              label: "Cheque",
              value: "cheque",
            },
          ]}
        />
      </FormField>

    </div>

  );

}
