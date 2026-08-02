/* ===========================================================
   FINORA ENTERPRISE V2
   IDENTITY FORM
--------------------------------------------------------------
Customer Identity Form
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface IdentityFormData {

  customerName: string;

  mobileNumber: string;

  whatsappSame: boolean;

  businessName: string;

  branchName: string;

  customerId: string;

}

interface IdentityFormProps {

  value: IdentityFormData;

  onChange: (
    field: keyof IdentityFormData,
    value: string | boolean,
  ) => void;

}

/* ===========================================================
   STYLES
=========================================================== */

const wrapperStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

};

const labelStyle: CSSProperties = {

  marginBottom: "8px",

  fontWeight: 600,

};

const inputStyle: CSSProperties = {

  width: "100%",

  padding: "14px",

  marginBottom: "20px",

  borderRadius: "12px",

  border: "1px solid #d1d5db",

  boxSizing: "border-box",

  fontSize: "15px",

};

const checkboxStyle: CSSProperties = {

  display: "flex",

  gap: "10px",

  alignItems: "center",

  marginBottom: "20px",

};

export default function IdentityForm({

  value,

  onChange,

}: IdentityFormProps) {

  return (

    <section style={wrapperStyle}>

      <label style={labelStyle}>
        Customer Name
      </label>

      <input
        style={inputStyle}
        value={value.customerName}
        placeholder="Enter customer name"
        onChange={(event) =>
          onChange(
            "customerName",
            event.target.value,
          )
        }
      />

      <label style={labelStyle}>
        Mobile Number
      </label>

      <input
        style={inputStyle}
        value={value.mobileNumber}
        placeholder="Enter mobile number"
        onChange={(event) =>
          onChange(
            "mobileNumber",
            event.target.value,
          )
        }
      />

      <label style={checkboxStyle}>

        <input
          type="checkbox"
          checked={value.whatsappSame}
          onChange={(event) =>
            onChange(
              "whatsappSame",
              event.target.checked,
            )
          }
        />

        WhatsApp uses same number

      </label>

      <label style={labelStyle}>
        Business
      </label>

      <input
        style={inputStyle}
        value={value.businessName}
        readOnly
      />

      <label style={labelStyle}>
        Branch
      </label>

      <input
        style={inputStyle}
        value={value.branchName}
        readOnly
      />

      <label style={labelStyle}>
        FINORA Customer ID
      </label>

      <input
        style={inputStyle}
        value={value.customerId}
        readOnly
      />

    </section>

  );

}
