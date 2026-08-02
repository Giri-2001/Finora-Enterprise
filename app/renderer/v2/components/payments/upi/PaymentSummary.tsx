/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   UPI PAYMENT STUDIO
   PAYMENT SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface PaymentSummaryProps {

  totalTransactions?: number;

  successfulTransactions?: number;

  failedTransactions?: number;

  totalAmount?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PaymentSummary({

  totalTransactions = 0,

  successfulTransactions = 0,

  failedTransactions = 0,

  totalAmount = 0,

}: PaymentSummaryProps) {

  return (

    <SummaryCard title="Payment Summary">

      <span>

        Total Transactions :
        <strong> {totalTransactions}</strong>

      </span>

      <span>

        Successful :
        <strong> {successfulTransactions}</strong>

      </span>

      <span>

        Failed :
        <strong> {failedTransactions}</strong>

      </span>

      <span>

        Total Amount :
        <strong> ₹ {totalAmount}</strong>

      </span>

    </SummaryCard>

  );

}
