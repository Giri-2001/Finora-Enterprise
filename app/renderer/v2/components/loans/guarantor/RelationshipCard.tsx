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
TYPES
=========================================================== */


interface RelationshipCardProps {
  relationship?: string;

  onRelationshipChange?: (
    value: string,
  ) => void;
}


/* ===========================================================
COMPONENT
=========================================================== */


export default function RelationshipCard({
  relationship = "",

  onRelationshipChange,

}: RelationshipCardProps) {

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

              value={
                relationship
              }

              onChange={(
                event,
              ) => {

                onRelationshipChange?.(
                  event.target.value,
                );

              }}

              options={[
                {
                  label: "Select Relationship",
                  value: "",
                },

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
