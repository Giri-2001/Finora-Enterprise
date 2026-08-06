/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   BALANCE ADJUSTMENT
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  FormField,
  TextArea,
  TextInput,
} from "../../common";

import {
  useCollectionController,
} from "../controller";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function BalanceAdjustment() {
  const {
    reviewData,
    updateField,
  } = useCollectionController();

  return (
    <SummaryCard title="Balance Adjustment">
      <FormField
        label="Adjustment Amount"
      >
        <TextInput
          type="number"
          value={reviewData.advanceAdjustment}
          placeholder="Enter adjustment amount"
          onChange={(event) =>
            updateField(
              "advanceAdjustment",
              Number(event.target.value),
            )
          }
        />
      </FormField>

      <FormField
        label="Adjustment Reason"
      >
        <TextArea
          value={reviewData.remarks}
          placeholder="Enter adjustment reason"
          onChange={(event) =>
            updateField(
              "remarks",
              event.target.value,
            )
          }
        />
      </FormField>
    </SummaryCard>
  );
}
