/* ===========================================================
   FINORA ENTERPRISE V2
   ADDRESS FORM
--------------------------------------------------------------
Customer Address Information
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface AddressFormData {

  currentAddress: string;

  permanentAddress: string;

  city: string;

  district: string;

  state: string;

  pinCode: string;

}

interface AddressFormProps {

  value: AddressFormData;

  onChange: (
    field: keyof AddressFormData,
    value: string,
  ) => void;

}

/* ===========================================================
   STYLES
=========================================================== */

const wrapperStyle: CSSProperties = {

  display: "grid",

  gap: "18px",

};

const inputStyle: CSSProperties = {

  width: "100%",

  padding: "12px",

  border: "1px solid #d1d5db",

  borderRadius: "12px",

  fontSize: "15px",

  boxSizing: "border-box",

};

const labelStyle: CSSProperties = {

  marginBottom: "6px",

  fontWeight: 600,

};

/* ===========================================================
   HELPER
=========================================================== */

function Field({

  label,

  value,

  onChange,

}: {

  label: string;

  value: string;

  onChange: (value: string) => void;

}) {

  return (

    <div>

      <div style={labelStyle}>{label}</div>

      <input

        style={inputStyle}

        value={value}

        onChange={(e) => onChange(e.target.value)}

      />

    </div>

  );

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function AddressForm({

  value,

  onChange,

}: AddressFormProps) {

  return (

    <div style={wrapperStyle}>

      <Field

        label="Current Address"

        value={value.currentAddress}

        onChange={(v) => onChange("currentAddress", v)}

      />

      <Field

        label="Permanent Address"

        value={value.permanentAddress}

        onChange={(v) => onChange("permanentAddress", v)}

      />

      <Field

        label="City / Village"

        value={value.city}

        onChange={(v) => onChange("city", v)}

      />

      <Field

        label="District"

        value={value.district}

        onChange={(v) => onChange("district", v)}

      />

      <Field

        label="State"

        value={value.state}

        onChange={(v) => onChange("state", v)}

      />

      <Field

        label="PIN Code"

        value={value.pinCode}

        onChange={(v) => onChange("pinCode", v)}

      />

    </div>

  );

}
