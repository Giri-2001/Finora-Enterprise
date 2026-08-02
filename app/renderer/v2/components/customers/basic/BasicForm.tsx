/* ===========================================================
   FINORA ENTERPRISE V2
   BASIC FORM
--------------------------------------------------------------
Customer Basic Information Form
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface BasicFormData {

  fatherOrSpouseName: string;

  occupation: string;

  monthlyIncome: string;

  education: string;

  maritalStatus: string;

}

interface BasicFormProps {

  value: BasicFormData;

  onChange: (
    field: keyof BasicFormData,
    value: string,
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

/* ===========================================================
   COMPONENT
=========================================================== */

export default function BasicForm({

  value,

  onChange,

}: BasicFormProps) {

  return (

    <section style={wrapperStyle}>

      <label style={labelStyle}>
        Father / Spouse Name
      </label>

      <input
        style={inputStyle}
        value={value.fatherOrSpouseName}
        placeholder="Enter father or spouse name"
        onChange={(event) =>
          onChange(
            "fatherOrSpouseName",
            event.target.value,
          )
        }
      />

      <label style={labelStyle}>
        Occupation
      </label>

      <input
        style={inputStyle}
        value={value.occupation}
        placeholder="Enter occupation"
        onChange={(event) =>
          onChange(
            "occupation",
            event.target.value,
          )
        }
      />

      <label style={labelStyle}>
        Monthly Income
      </label>

      <input
        style={inputStyle}
        value={value.monthlyIncome}
        placeholder="Enter monthly income"
        onChange={(event) =>
          onChange(
            "monthlyIncome",
            event.target.value,
          )
        }
      />

      <label style={labelStyle}>
        Education
      </label>

      <input
        style={inputStyle}
        value={value.education}
        placeholder="Enter education"
        onChange={(event) =>
          onChange(
            "education",
            event.target.value,
          )
        }
      />

      <label style={labelStyle}>
        Marital Status
      </label>

      <input
        style={inputStyle}
        value={value.maritalStatus}
        placeholder="Enter marital status"
        onChange={(event) =>
          onChange(
            "maritalStatus",
            event.target.value,
          )
        }
      />

    </section>

  );

}
