/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   RAZORPAY GATEWAY STUDIO
   RAZORPAY PAYMENT CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface RazorpayPaymentCardProps {

  paymentId?: string;

  orderId?: string;

  amount?: number;

  paymentStatus?: string;

  capturedAt?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function RazorpayPaymentCard({

  paymentId = "--",

  orderId = "--",

  amount = 0,

  paymentStatus = "Authorized",

  capturedAt = "--",

}: RazorpayPaymentCardProps) {

  return (

    <SummaryCard title="Razorpay Payment">

      <span>

        Payment ID :
        <strong> {paymentId}</strong>

      </span>

      <span>

        Order ID :
        <strong> {orderId}</strong>

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

        Captured :
        <strong> {capturedAt}</strong>

      </span>

    </SummaryCard>

  );

}
