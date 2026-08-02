/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   UPI PAYMENT STUDIO
   PAYMENT STATUS CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface PaymentStatusCardProps {

  transactionId?: string;

  paymentStatus?: string;

  paidAmount?: number;

  completedAt?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PaymentStatusCard({

  transactionId = "--",

  paymentStatus = "Pending",

  paidAmount = 0,

  completedAt = "--",

}: PaymentStatusCardProps) {

  return (

    <SummaryCard title="Payment Status">

      <span>

        Transaction ID :
        <strong> {transactionId}</strong>

      </span>

      <span>

        Status :
        <strong> {paymentStatus}</strong>

      </span>

      <span>

        Amount :
        <strong> ₹ {paidAmount}</strong>

      </span>

      <span>

        Completed :
        <strong> {completedAt}</strong>

      </span>

    </SummaryCard>

  );

}
