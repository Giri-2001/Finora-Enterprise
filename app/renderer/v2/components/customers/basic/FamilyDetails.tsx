/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER FAMILY & EMERGENCY™

   Version     : 2.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   Responsibility:

   - Family member count
   - Emergency contact name
   - Emergency contact mobile
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface FamilyDetailsData {

  numberOfFamilyMembers: string;

  emergencyContactName: string;

  emergencyContactMobile: string;

}

interface FamilyDetailsProps {

  value:
    FamilyDetailsData;

  onChange: (
    field:
      keyof FamilyDetailsData,
    value:
      string,
  ) => void;

}

/* ===========================================================
   FULL-WIDTH FAMILY GRID
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
    "repeat(3, minmax(0, 1fr))",

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
   NUMBER / MOBILE INPUT
=========================================================== */

const numberInputStyle: CSSProperties = {

  ...inputStyle,

  fontVariantNumeric:
    "tabular-nums",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function FamilyDetails({

  value,

  onChange,

}: FamilyDetailsProps) {

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
            NUMBER OF FAMILY MEMBERS
        ================================================= */}

        <div
          style={fieldStyle}
        >

          <label
            style={labelStyle}
          >

            Number of Family Members

          </label>

          <input

            style={
              numberInputStyle
            }

            value={
              value.numberOfFamilyMembers
            }

            placeholder=
              "Enter family members"

            inputMode="numeric"

            onChange={(
              event,
            ) =>

              onChange(

                "numberOfFamilyMembers",

                event.target.value,

              )

            }

            aria-label=
              "Number of Family Members"

          />

        </div>

        {/* =================================================
            EMERGENCY CONTACT NAME
        ================================================= */}

        <div
          style={fieldStyle}
        >

          <label
            style={labelStyle}
          >

            Emergency Contact Name

          </label>

          <input

            style={
              inputStyle
            }

            value={
              value.emergencyContactName
            }

            placeholder=
              "Enter emergency contact"

            onChange={(
              event,
            ) =>

              onChange(

                "emergencyContactName",

                event.target.value,

              )

            }

            aria-label=
              "Emergency Contact Name"

          />

        </div>

        {/* =================================================
            EMERGENCY CONTACT MOBILE
        ================================================= */}

        <div
          style={fieldStyle}
        >

          <label
            style={labelStyle}
          >

            Emergency Contact Mobile

          </label>

          <input

            style={
              numberInputStyle
            }

            value={
              value.emergencyContactMobile
            }

            placeholder=
              "Enter mobile number"

            inputMode="tel"

            onChange={(
              event,
            ) =>

              onChange(

                "emergencyContactMobile",

                event.target.value,

              )

            }

            aria-label=
              "Emergency Contact Mobile"

          />

        </div>

      </div>

    </section>

  );

}
