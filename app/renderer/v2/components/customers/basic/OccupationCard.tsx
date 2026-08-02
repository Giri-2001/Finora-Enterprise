/* ===========================================================
   FINORA ENTERPRISE V2
   OCCUPATION CARD
--------------------------------------------------------------
Customer Occupation Profile
=========================================================== */

import type { CSSProperties } from "react";

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

  value: OccupationData;

  onChange: (
    field: keyof OccupationData,
    value: string,
  ) => void;

}

/* ===========================================================
   STYLES
=========================================================== */

const cardStyle: CSSProperties = {

  padding: "24px",

  borderRadius: "18px",

  border: "1px solid #e5e7eb",

  background: "#ffffff",

};

const headingStyle: CSSProperties = {

  margin: 0,

  marginBottom: "24px",

  fontSize: "22px",

  fontWeight: 700,

};

const labelStyle: CSSProperties = {

  display: "block",

  marginBottom: "8px",

  fontWeight: 600,

};

const inputStyle: CSSProperties = {

  width: "100%",

  padding: "14px",

  borderRadius: "12px",

  border: "1px solid #d1d5db",

  marginBottom: "20px",

  boxSizing: "border-box",

  fontSize: "15px",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function OccupationCard({

  value,

  onChange,

}: OccupationCardProps) {

  return (

    <section style={cardStyle}>

      <h3 style={headingStyle}>
        Occupation Profile
      </h3>

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
        Workplace / Business Name
      </label>

      <input
        style={inputStyle}
        value={value.workPlace}
        placeholder="Enter workplace or business"
        onChange={(event) =>
          onChange(
            "workPlace",
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
        Work Experience
      </label>

      <input
        style={inputStyle}
        value={value.experience}
        placeholder="Years of experience"
        onChange={(event) =>
          onChange(
            "experience",
            event.target.value,
          )
        }
      />

    </section>

  );

}
