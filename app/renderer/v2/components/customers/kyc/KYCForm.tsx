/* ===========================================================
   FINORA ENTERPRISE V2
   KYC FORM
--------------------------------------------------------------
Customer KYC Information
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface KYCFormData {

  aadhaarNumber: string;

  panNumber: string;

  voterId: string;

  drivingLicense: string;

}

interface KYCFormProps {

  value: KYCFormData;

  onChange: (
    field: keyof KYCFormData,
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

const labelStyle: CSSProperties = {

  marginBottom: "6px",

  fontWeight: 600,

};

const inputStyle: CSSProperties = {

  width: "100%",

  padding: "12px",

  border: "1px solid #d1d5db",

  borderRadius: "12px",

  fontSize: "15px",

  boxSizing: "border-box",

};

/* ===========================================================
   FIELD
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

export default function KYCForm({

  value,

  onChange,

}: KYCFormProps) {

  return (

    <div style={wrapperStyle}>

      <Field

        label="Aadhaar Number"

        value={value.aadhaarNumber}

        onChange={(v) => onChange("aadhaarNumber", v)}

      />

      <Field

        label="PAN Number"

        value={value.panNumber}

        onChange={(v) => onChange("panNumber", v)}

      />

      <Field

        label="Voter ID"

        value={value.voterId}

        onChange={(v) => onChange("voterId", v)}

      />

      <Field

        label="Driving Licence"

        value={value.drivingLicense}

        onChange={(v) => onChange("drivingLicense", v)}

      />

    </div>

  );

}
