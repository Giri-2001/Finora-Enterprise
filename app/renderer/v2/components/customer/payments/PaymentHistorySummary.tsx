/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   PAYMENT HISTORY STUDIO
   PAYMENT HISTORY SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface PaymentHistorySummaryProps {

  totalPayments?: number;

  successfulPayments?: number;

  pendingPayments?: number;

  totalPaidAmount?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PaymentHistorySummary({

  totalPayments = 0,

  successfulPayments = 0,

  pendingPayments = 0,

  totalPaidAmount = 0,

}: PaymentHistorySummaryProps) {

  return (

    <SummaryCard title="Payment History Summary">

      <span>

        Total Payments :
        <strong> {totalPayments}</strong>

      </span>

      <span>

        Successful Payments :
        <strong> {successfulPayments}</strong>

      </span>

      <span>

        Pending Payments :
        <strong> {pendingPayments}</strong>

      </span>

      <span>

        Total Paid Amount :
        <strong> ₹ {totalPaidAmount}</strong>

      </span>

    </SummaryCard>

  );

}
