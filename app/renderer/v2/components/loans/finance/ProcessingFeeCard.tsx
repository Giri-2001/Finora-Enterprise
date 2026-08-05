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
   TYPES
=========================================================== */

interface ProcessingFeeCardProps {

  processingFee: string;

  onProcessingFeeChange: (
    value: string,
  ) => void;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ProcessingFeeCard({

  processingFee,

  onProcessingFeeChange,

}: ProcessingFeeCardProps) {

  return (

    <SummaryCard title="Processing Fee">

      <FormField
        label="Processing Fee (₹)"
      >
        <TextInput
  type="number"
  value={processingFee}
  onChange={(event) =>
    onProcessingFeeChange(
      event.target.value,
    )
  }
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
