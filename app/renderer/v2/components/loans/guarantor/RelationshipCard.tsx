/* ===========================================================
FINORA ENTERPRISE V2
GUARANTOR STUDIO
RELATIONSHIP CARD
=========================================================== */

/* ===========================================================
IMPORTS
=========================================================== */

import {
  FormField,
  SelectInput,
} from "../../common";

import {
  accentStyle,
  fieldContentStyle,
  fieldStyle,
  headerStyle,
  wrapperStyle,
} from "./RelationshipCard.styles";

/* ===========================================================
COMPONENT
=========================================================== */

export default function RelationshipCard() {
  return (
    <div style={wrapperStyle}>

      {/* HEADER */}
      <div style={headerStyle}>
        <span style={accentStyle} />

        <span>
          Relationship Information
        </span>
      </div>

      {/* RELATIONSHIP */}
      <div style={fieldStyle}>
        <div style={fieldContentStyle}>
          <FormField
            label="Relationship with Customer"
            required
          >
            <SelectInput
              options={[
                {
                  label: "Father",
                  value: "father",
                },
                {
                  label: "Mother",
                  value: "mother",
                },
                {
                  label: "Spouse",
                  value: "spouse",
                },
                {
                  label: "Brother",
                  value: "brother",
                },
                {
                  label: "Sister",
                  value: "sister",
                },
                {
                  label: "Friend",
                  value: "friend",
                },
                {
                  label: "Relative",
                  value: "relative",
                },
                {
                  label: "Other",
                  value: "other",
                },
              ]}
            />
          </FormField>
        </div>
      </div>

    </div>
  );
}

/* ===========================================================
END
=========================================================== */
