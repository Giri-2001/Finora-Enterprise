/* ===========================================================
   FINORA ENTERPRISE V2
   GUARANTOR STUDIO
   GUARANTOR VERIFICATION
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  FormField,
  SelectInput,
} from "../../common";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function GuarantorVerification() {

  return (

    <SummaryCard title="Guarantor Verification">

      <FormField
        label="Verification Status"
        required
      >
        <SelectInput
          options={[
            {
              label: "Pending",
              value: "pending",
            },
            {
              label: "Verified",
              value: "verified",
            },
            {
              label: "Rejected",
              value: "rejected",
            },
          ]}
        />
      </FormField>

      <FormField
        label="Identity Verification"
      >
        <SelectInput
          options={[
            {
              label: "Aadhaar",
              value: "aadhaar",
            },
            {
              label: "PAN",
              value: "pan",
            },
            {
              label: "Driving Licence",
              value: "dl",
            },
            {
              label: "Voter ID",
              value: "voter",
            },
          ]}
        />
      </FormField>

    </SummaryCard>

  );

}
