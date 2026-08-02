/* ===========================================================
   FINORA ENTERPRISE V2
   RECEIPT STUDIO
   RECEIPT PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ReceiptPreviewCardProps {

  receiptNumber?: string;

  customerName?: string;

  collectionAmount?: number;

  paymentMethod?: string;

  receiptDate?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReceiptPreviewCard({

  receiptNumber = "--",

  customerName = "--",

  collectionAmount = 0,

  paymentMethod = "--",

  receiptDate = "--",

}: ReceiptPreviewCardProps) {

  return (

    <SummaryCard title="Receipt Preview">

      <span>

        Receipt No :
        <strong> {receiptNumber}</strong>

      </span>

      <span>

        Customer :
        <strong> {customerName}</strong>

      </span>

      <span>

        Amount :
        <strong> ₹ {collectionAmount}</strong>

      </span>

      <span>

        Payment Method :
        <strong> {paymentMethod}</strong>

      </span>

      <span>

        Receipt Date :
        <strong> {receiptDate}</strong>

      </span>

    </SummaryCard>

  );

}
