/* ===========================================================
   FINORA ENTERPRISE V2
   FINANCE STUDIO
   PROCESSING FEE CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  FormField,
  TextInput,
} from "../../common";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ProcessingFeeCard() {

  return (

    <SummaryCard title="Processing Fee">

      <FormField
        label="Processing Fee (₹)"
      >
        <TextInput
          type="number"
          placeholder="Enter processing fee"
        />
      </FormField>

      <FormField
        label="Documentation Charges (₹)"
      >
        <TextInput
          type="number"
          placeholder="Enter documentation charges"
        />
      </FormField>

    </SummaryCard>

  );

}
