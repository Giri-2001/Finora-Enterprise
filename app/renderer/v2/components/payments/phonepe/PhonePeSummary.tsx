/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   PHONEPE INTEGRATION STUDIO
   PHONEPE SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface PhonePeSummaryProps {

  totalTransactions?: number;

  successfulTransactions?: number;

  failedTransactions?: number;

  totalAmount?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PhonePeSummary({

  totalTransactions = 0,

  successfulTransactions = 0,

  failedTransactions = 0,

  totalAmount = 0,

}: PhonePeSummaryProps) {

  return (

    <SummaryCard title="PhonePe Summary">

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
