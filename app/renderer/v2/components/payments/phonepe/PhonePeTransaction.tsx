/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   PHONEPE INTEGRATION STUDIO
   PHONEPE TRANSACTION
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface PhonePeTransactionProps {

  transactionId?: string;

  amount?: number;

  paymentStatus?: string;

  completedAt?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PhonePeTransaction({

  transactionId = "--",

  amount = 0,

  paymentStatus = "Pending",

  completedAt = "--",

}: PhonePeTransactionProps) {

  return (

    <SummaryCard title="PhonePe Transaction">

      <span>

        Transaction ID :
        <strong> {transactionId}</strong>

      </span>

      <span>

        Amount :
        <strong> ₹ {amount}</strong>

      </span>

      <span>

        Status :
        <strong> {paymentStatus}</strong>

      </span>

      <span>

        Completed :
        <strong> {completedAt}</strong>

      </span>

    </SummaryCard>

  );

}
