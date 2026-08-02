/* ===========================================================
   FINORA ENTERPRISE V2
   RELATIONSHIP SELECTOR
--------------------------------------------------------------
Customer Relationship Selector
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface RelationshipSelectorProps {

  value: string;

  onChange: (value: string) => void;

}

const relationships = [

  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Husband",
  "Wife",
  "Son",
  "Daughter",
  "Friend",
  "Guardian",
  "Other",

];

/* ===========================================================
   STYLES
=========================================================== */

const wrapperStyle: CSSProperties = {

  display: "grid",

  gap: "8px",

};

const labelStyle: CSSProperties = {

  fontWeight: 600,

};

const selectStyle: CSSProperties = {

  padding: "12px",

  borderRadius: "12px",

  border: "1px solid #d1d5db",

  fontSize: "15px",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function RelationshipSelector({

  value,

  onChange,

}: RelationshipSelectorProps) {

  return (

    <div style={wrapperStyle}>

      <label style={labelStyle}>

        Relationship

      </label>

      <select

        style={selectStyle}

        value={value}

        onChange={(e) => onChange(e.target.value)}

      >

        <option value="">

          Select Relationship

        </option>

        {relationships.map((relationship) => (

          <option

            key={relationship}

            value={relationship}

          >

            {relationship}

          </option>

        ))}

      </select>

    </div>

  );

}
