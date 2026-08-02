/* ===========================================================
   FINORA ENTERPRISE V2
   SETTLEMENT STUDIO
   BALANCE ADJUSTMENT
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  FormField,
  TextArea,
  TextInput,
} from "../../common";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function BalanceAdjustment() {

  return (

    <SummaryCard title="Balance Adjustment">

      <FormField
        label="Adjustment Amount"
      >
        <TextInput
          type="number"
          placeholder="Enter adjustment amount"
        />
      </FormField>

      <FormField
        label="Adjustment Reason"
      >
        <TextArea
          placeholder="Enter adjustment reason"
        />
      </FormField>

    </SummaryCard>

  );

}
