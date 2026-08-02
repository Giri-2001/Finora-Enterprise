/* ===========================================================
   FINORA ENTERPRISE V2
   COLLECTION STUDIO
   COLLECTION PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface CollectionPreviewCardProps {

  customerName?: string;

  collectionDate?: string;

  collectionAmount?: number;

  paymentMode?: string;

  remarks?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CollectionPreviewCard({

  customerName = "--",

  collectionDate = "--",

  collectionAmount = 0,

  paymentMode = "--",

  remarks = "--",

}: CollectionPreviewCardProps) {

  return (

    <SummaryCard title="Collection Preview">

      <span>

        Customer :
        <strong> {customerName}</strong>

      </span>

      <span>

        Collection Date :
        <strong> {collectionDate}</strong>

      </span>

      <span>

        Amount :
        <strong> ₹ {collectionAmount}</strong>

      </span>

      <span>

        Payment Mode :
        <strong> {paymentMode}</strong>

      </span>

      <span>

        Remarks :
        <strong> {remarks}</strong>

      </span>

    </SummaryCard>

  );

}
