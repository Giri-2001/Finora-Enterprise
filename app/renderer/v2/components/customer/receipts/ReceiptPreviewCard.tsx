/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   DIGITAL RECEIPTS STUDIO
   RECEIPT PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ReceiptPreviewCardProps {

  receiptNumber?: string;

  paymentDate?: string;

  amountPaid?: number;

  paymentMethod?: string;

  receiptStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReceiptPreviewCard({

  receiptNumber = "--",

  paymentDate = "--",

  amountPaid = 0,

  paymentMethod = "--",

  receiptStatus = "Available",

}: ReceiptPreviewCardProps) {

  return (

    <SummaryCard title="Receipt Preview">

      <span>

        Receipt No :
        <strong> {receiptNumber}</strong>

      </span>

      <span>

        Payment Date :
        <strong> {paymentDate}</strong>

      </span>

      <span>

        Amount Paid :
        <strong> ₹ {amountPaid}</strong>

      </span>

      <span>

        Payment Method :
        <strong> {paymentMethod}</strong>

      </span>

      <span>

        Status :
        <strong> {receiptStatus}</strong>

      </span>

    </SummaryCard>

  );

}
