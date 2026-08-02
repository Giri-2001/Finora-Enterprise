/* ===========================================================
   FINORA ENTERPRISE V2
   COLLECTION REVIEW STUDIO
   REVIEW PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ReviewPreviewCardProps {

  customerName?: string;

  totalCollected?: number;

  paymentMethod?: string;

  receiptNumber?: string;

  settlementStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReviewPreviewCard({

  customerName = "--",

  totalCollected = 0,

  paymentMethod = "--",

  receiptNumber = "--",

  settlementStatus = "--",

}: ReviewPreviewCardProps) {

  return (

    <SummaryCard title="Collection Review Preview">

      <span>

        Customer :
        <strong> {customerName}</strong>

      </span>

      <span>

        Total Collected :
        <strong> ₹ {totalCollected}</strong>

      </span>

      <span>

        Payment Method :
        <strong> {paymentMethod}</strong>

      </span>

      <span>

        Receipt Number :
        <strong> {receiptNumber}</strong>

      </span>

      <span>

        Settlement Status :
        <strong> {settlementStatus}</strong>

      </span>

    </SummaryCard>

  );

}
