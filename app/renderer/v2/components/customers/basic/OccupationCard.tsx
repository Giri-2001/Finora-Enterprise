/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER OCCUPATION PROFILE™

   Version     : 2.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   Responsibility:

   - Occupation
   - Workplace / Business
   - Monthly Income
   - Work Experience
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface OccupationData {

  occupation: string;

  workPlace: string;

  monthlyIncome: string;

  experience: string;

}

interface OccupationCardProps {

  value:
    OccupationData;

  onChange: (
    field:
      keyof OccupationData,
    value:
      string,
  ) => void;

}

/* ===========================================================
   FULL-WIDTH FIELD GRID
=========================================================== */

const gridStyle: CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  boxSizing:
    "border-box",

  display:
    "grid",

  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",

  gap:
    "14px",

  alignItems:
    "end",

  justifyContent:
    "stretch",

  alignSelf:
    "stretch",

};

/* ===========================================================
   FIELD
=========================================================== */

const fieldStyle: CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  boxSizing:
    "border-box",

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "5px",

};

/* ===========================================================
   LABEL
=========================================================== */

const labelStyle: CSSProperties = {

  display:
    "block",

  width:
    "100%",

  boxSizing:
    "border-box",

  color:
    "rgba(255,255,255,.66)",

  fontSize:
    "10px",

  fontWeight:
    600,

  letterSpacing:
    ".45px",

  lineHeight:
    1.2,

  textTransform:
    "uppercase",

};

/* ===========================================================
   INPUT
=========================================================== */

const inputStyle: CSSProperties = {

  display:
    "block",

  width:
    "100%",

  minWidth:
    0,

  height:
    "38px",

  padding:
    "0 10px",

  boxSizing:
    "border-box",

  borderRadius:
    "8px",

  border:
    "1px solid rgba(214,176,106,.28)",

  outline:
    "none",

  background:
    "rgba(255,255,255,.055)",

  color:
    "#F8FAFC",

  fontSize:
    "11px",

  fontWeight:
    500,

};

/* ===========================================================
   NUMBER INPUT
=========================================================== */

const numberInputStyle: CSSProperties = {

  ...inputStyle,

  fontVariantNumeric:
    "tabular-nums",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function OccupationCard({

  value,

  onChange,

}: OccupationCardProps) {

  return (

    <section
      style={{
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        display: "block",
      }}
    >

      <div
        style={gridStyle}
      >

        {/* =================================================
            OCCUPATION
        ================================================= */}

        <div
          style={fieldStyle}
        >

          <label
            style={labelStyle}
          >

            Occupation

          </label>

          <input

            style={
              inputStyle
            }

            value={
              value.occupation
            }

            placeholder=
              "Enter occupation"

            onChange={(
              event,
            ) =>

              onChange(

                "occupation",

                event.target.value,

              )

            }

            aria-label="Occupation"

          />

        </div>

        {/* =================================================
            WORKPLACE / BUSINESS
        ================================================= */}

        <div
          style={fieldStyle}
        >

          <label
            style={labelStyle}
          >

            Workplace / Business

          </label>

          <input

            style={
              inputStyle
            }

            value={
              value.workPlace
            }

            placeholder=
              "Enter workplace or business"

            onChange={(
              event,
            ) =>

              onChange(

                "workPlace",

                event.target.value,

              )

            }

            aria-label=
              "Workplace or Business"

          />

        </div>

        {/* =================================================
            MONTHLY INCOME
        ================================================= */}

        <div
          style={fieldStyle}
        >

          <label
            style={labelStyle}
          >

            Monthly Income

          </label>

          <input

            style={
              numberInputStyle
            }

            value={
              value.monthlyIncome
            }

            placeholder=
              "Enter monthly income"

            inputMode="numeric"

            onChange={(
              event,
            ) =>

              onChange(

                "monthlyIncome",

                event.target.value,

              )

            }

            aria-label=
              "Monthly Income"

          />

        </div>

        {/* =================================================
            WORK EXPERIENCE
        ================================================= */}

        <div
          style={fieldStyle}
        >

          <label
            style={labelStyle}
          >

            Work Experience

          </label>

          <input

            style={
              numberInputStyle
            }

            value={
              value.experience
            }

            placeholder=
              "Years of experience"

            inputMode="decimal"

            onChange={(
              event,
            ) =>

              onChange(

                "experience",

                event.target.value,

              )

            }

            aria-label=
              "Work Experience"

          />

        </div>

      </div>

    </section>

  );

}
