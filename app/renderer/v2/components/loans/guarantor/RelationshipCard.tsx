/* ===========================================================
   FINORA ENTERPRISE V2
   GUARANTOR STUDIO
   RELATIONSHIP CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  FormField,
  SelectInput,
} from "../../common";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function RelationshipCard() {

  return (

    <SummaryCard title="Relationship Information">

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

    </SummaryCard>

  );

}
