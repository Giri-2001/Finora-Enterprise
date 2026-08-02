/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT STUDIO
   PAYMENT PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface PaymentPreviewCardProps {

  paymentMethod?: string;

  referenceNumber?: string;

  receiptNumber?: string;

  collectedBy?: string;

  transactionStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PaymentPreviewCard({

  paymentMethod = "--",

  referenceNumber = "--",

  receiptNumber = "--",

  collectedBy = "--",

  transactionStatus = "--",

}: PaymentPreviewCardProps) {

  return (

    <SummaryCard title="Payment Preview">

      <span>

        Payment Method :
        <strong> {paymentMethod}</strong>

      </span>

      <span>

        Reference No :
        <strong> {referenceNumber}</strong>

      </span>

      <span>

        Receipt No :
        <strong> {receiptNumber}</strong>

      </span>

      <span>

        Collected By :
        <strong> {collectedBy}</strong>

      </span>

      <span>

        Status :
        <strong> {transactionStatus}</strong>

      </span>

    </SummaryCard>

  );

}
