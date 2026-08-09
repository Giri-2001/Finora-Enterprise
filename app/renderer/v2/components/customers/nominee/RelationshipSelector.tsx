/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER RELATIONSHIP SELECTOR

   RESPONSIBILITY:
   - Nominee relationship selection
   - Relationship change events

   STYLES:
   RelationshipSelector.styles.ts
=========================================================== */

import {
  wrapperStyle,
  labelStyle,
  selectStyle,
  optionStyle,
  helperStyle,
} from "./RelationshipSelector.styles";

/* ===========================================================
   RELATIONSHIPS
=========================================================== */

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
   TYPES
=========================================================== */

interface RelationshipSelectorProps {
  value: string;

  onChange: (
    value: string,
  ) => void;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function RelationshipSelector({
  value,
  onChange,
}: RelationshipSelectorProps) {
  return (
    <div style={wrapperStyle}>

      {/* =====================================================
         LABEL
      ===================================================== */}

      <label
        htmlFor="nominee-relationship"
        style={labelStyle}
      >
        Relationship
      </label>

      {/* =====================================================
         SELECT
      ===================================================== */}

      <select
        id="nominee-relationship"
        value={value}
        style={selectStyle}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
      >
        <option
          value=""
          style={optionStyle}
        >
          Select Relationship
        </option>

        {relationships.map(
          (relationship) => (
            <option
              key={relationship}
              value={relationship}
              style={optionStyle}
            >
              {relationship}
            </option>
          ),
        )}
      </select>

      {/* =====================================================
         HELPER
      ===================================================== */}

      <div style={helperStyle}>
        Select the nominee's relationship with the customer.
      </div>

    </div>
  );
}
