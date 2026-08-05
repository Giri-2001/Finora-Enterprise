/* ===========================================================
   FINORA ENTERPRISE V2
   GUARANTOR STUDIO
   GUARANTOR PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface GuarantorPreviewCardProps {

  guarantorName?: string;

  relationship?: string;

  mobileNumber?: string;

  occupation?: string;

  address?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function GuarantorPreviewCard({

  guarantorName = "--",

  relationship = "--",

  mobileNumber = "--",

  occupation = "--",

address = "--",

}: GuarantorPreviewCardProps) {

  return (

    <SummaryCard title="Guarantor Preview">

      <span>

        Guarantor :
        <strong> {guarantorName}</strong>

      </span>

      <span>

        Relationship :
        <strong> {relationship}</strong>

      </span>

      <span>

        Mobile :
        <strong> {mobileNumber}</strong>

      </span>

      <span>

  Address :

  <strong> {address}</strong>

</span>

      <span>

        Occupation :
        <strong> {occupation}</strong>

      </span>

    </SummaryCard>

  );

}
