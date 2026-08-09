/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER BASIC INFORMATION™

   STEP 2 — PERSONAL INFORMATION

   Version     : 2.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface BasicFormData {

  fatherOrSpouseName: string;

  education: string;

  maritalStatus: string;

  spouseName: string;

}

interface BasicFormProps {

  value:
    BasicFormData;

  onChange: (
    field:
      keyof BasicFormData,
    value:
      string,
  ) => void;

}

/* ===========================================================
   STYLES
=========================================================== */

const gridStyle: CSSProperties = {

  width: "100%",

  display: "grid",

  gridTemplateColumns:
    "repeat(4,minmax(0,1fr))",

  gap: "14px",

};

const fieldStyle: CSSProperties = {

  minWidth: 0,

  display: "flex",

  flexDirection: "column",

  gap: "5px",

};

const labelStyle: CSSProperties = {

  color:
    "rgba(255,255,255,.68)",

  fontSize: "10px",

  fontWeight: 600,

  letterSpacing: ".45px",

  textTransform: "uppercase",

};

const requiredStyle: CSSProperties = {

  color: "#D4AF37",

  marginLeft: "2px",

};

const inputStyle: CSSProperties = {

  width: "100%",

  height: "38px",

  padding:
    "0 10px",

  boxSizing: "border-box",

  borderRadius: "8px",

  border:
    "1px solid rgba(214,176,106,.22)",

  outline: "none",

  background:
    "rgba(255,255,255,.055)",

  color: "#F8FAFC",

  fontSize: "11px",

  fontWeight: 500,

};

const selectStyle: CSSProperties = {

  ...inputStyle,

  cursor: "pointer",

};

/* ===========================================================
   LABEL
=========================================================== */

function FieldLabel({

  children,

  required = false,

}: {

  children: string;

  required?: boolean;

}) {

  return (

    <label
      style={labelStyle}
    >

      {children}

      {required && (

        <span
          style={requiredStyle}
        >

          *

        </span>

      )}

    </label>

  );

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function BasicForm({

  value,

  onChange,

}: BasicFormProps) {

  return (

    <div
      style={gridStyle}
    >

      {/* =================================================
          FATHER / SPOUSE
      ================================================= */}

      <div
        style={fieldStyle}
      >

        <FieldLabel required>

          Father / Spouse Name

        </FieldLabel>

        <input

          style={inputStyle}

          value={
            value.fatherOrSpouseName
          }

          placeholder=
            "Enter father or spouse name"

          onChange={(event) =>

            onChange(

              "fatherOrSpouseName",

              event.target.value,

            )

          }

          aria-label=
            "Father or Spouse Name"

        />

      </div>

      {/* =================================================
          EDUCATION
      ================================================= */}

      <div
        style={fieldStyle}
      >

        <FieldLabel>

          Education

        </FieldLabel>

        <select

          style={selectStyle}

          value={
            value.education
          }

          onChange={(event) =>

            onChange(

              "education",

              event.target.value,

            )

          }

          aria-label="Education"

        >

          <option value="">

            Select education

          </option>

          <option value="No Formal Education">

            No Formal Education

          </option>

          <option value="Primary">

            Primary

          </option>

          <option value="Secondary">

            Secondary

          </option>

          <option value="Intermediate">

            Intermediate

          </option>

          <option value="Diploma">

            Diploma

          </option>

          <option value="Graduate">

            Graduate

          </option>

          <option value="Post Graduate">

            Post Graduate

          </option>

          <option value="Doctorate">

            Doctorate

          </option>

          <option value="Other">

            Other

          </option>

        </select>

      </div>

      {/* =================================================
          MARITAL STATUS
      ================================================= */}

      <div
        style={fieldStyle}
      >

        <FieldLabel>

          Marital Status

        </FieldLabel>

        <select

          style={selectStyle}

          value={
            value.maritalStatus
          }

          onChange={(event) =>

            onChange(

              "maritalStatus",

              event.target.value,

            )

          }

          aria-label=
            "Marital Status"

        >

          <option value="">

            Select marital status

          </option>

          <option value="Single">

            Single

          </option>

          <option value="Married">

            Married

          </option>

          <option value="Widowed">

            Widowed

          </option>

          <option value="Divorced">

            Divorced

          </option>

          <option value="Separated">

            Separated

          </option>

        </select>

      </div>

      {/* =================================================
          SPOUSE NAME
      ================================================= */}

      <div
        style={fieldStyle}
      >

        <FieldLabel>

          Spouse Name

        </FieldLabel>

        <input

          style={inputStyle}

          value={
            value.spouseName
          }

          placeholder=
            "Enter spouse name"

          onChange={(event) =>

            onChange(

              "spouseName",

              event.target.value,

            )

          }

          aria-label="Spouse Name"

        />

      </div>

    </div>

  );

}
