/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   RAZORPAY GATEWAY STUDIO
   RAZORPAY SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface RazorpaySummaryProps {

  totalOrders?: number;

  successfulPayments?: number;

  failedPayments?: number;

  totalAmount?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function RazorpaySummary({

  totalOrders = 0,

  successfulPayments = 0,

  failedPayments = 0,

  totalAmount = 0,

}: RazorpaySummaryProps) {

  return (

    <SummaryCard title="Razorpay Summary">

      <span>

        Total Orders :
        <strong> {totalOrders}</strong>

      </span>

      <span>

        Successful Payments :
        <strong> {successfulPayments}</strong>

      </span>

      <span>

        Failed Payments :
        <strong> {failedPayments}</strong>

      </span>

      <span>

        Total Amount :
        <strong> ₹ {totalAmount}</strong>

      </span>

    </SummaryCard>

  );

}
