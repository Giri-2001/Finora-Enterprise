/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT STUDIO
   PAYMENT SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface PaymentSummaryProps {

  totalAmount?: number;

  paymentMethod?: string;

  collectedBy?: string;

  transactionStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PaymentSummary({

  totalAmount = 0,

  paymentMethod = "--",

  collectedBy = "--",

  transactionStatus = "--",

}: PaymentSummaryProps) {

  return (

    <SummaryCard title="Payment Summary">

      <span>

        Total Amount :
        <strong> ₹ {totalAmount}</strong>

      </span>

      <span>

        Payment Method :
        <strong> {paymentMethod}</strong>

      </span>

      <span>

        Collected By :
        <strong> {collectedBy}</strong>

      </span>

      <span>

        Transaction Status :
        <strong> {transactionStatus}</strong>

      </span>

    </SummaryCard>

  );

}
