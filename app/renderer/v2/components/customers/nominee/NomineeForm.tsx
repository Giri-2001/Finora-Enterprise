/* ===========================================================
   FINORA ENTERPRISE V2
   NOMINEE FORM
--------------------------------------------------------------
Customer Nominee Information
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface NomineeFormData {

  nomineeCustomerId: string;

  nomineeName: string;

  relationship: string;

  phoneNumber: string;

}

interface NomineeFormProps {

  value: NomineeFormData;

  onChange: (

    field: keyof NomineeFormData,

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

export default function NomineeForm({

  value,

  onChange,

}: NomineeFormProps) {

  return (

    <div style={wrapperStyle}>

      <Field

        label="FINORA Customer ID"

        value={value.nomineeCustomerId}

        onChange={(v) => onChange("nomineeCustomerId", v)}

      />

      <Field

        label="Nominee Name"

        value={value.nomineeName}

        onChange={(v) => onChange("nomineeName", v)}

      />

      <Field

        label="Relationship"

        value={value.relationship}

        onChange={(v) => onChange("relationship", v)}

      />

      <Field

        label="Phone Number"

        value={value.phoneNumber}

        onChange={(v) => onChange("phoneNumber", v)}

      />

    </div>

  );

}
