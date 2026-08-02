/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   RAZORPAY GATEWAY STUDIO
   RAZORPAY PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface RazorpayPreviewCardProps {

  orderId?: string;

  paymentId?: string;

  customerName?: string;

  amount?: number;

  paymentStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function RazorpayPreviewCard({

  orderId = "--",

  paymentId = "--",

  customerName = "--",

  amount = 0,

  paymentStatus = "Pending",

}: RazorpayPreviewCardProps) {

  return (

    <SummaryCard title="Razorpay Preview">

      <span>

        Order ID :
        <strong> {orderId}</strong>

      </span>

      <span>

        Payment ID :
        <strong> {paymentId}</strong>

      </span>

      <span>

        Customer :
        <strong> {customerName}</strong>

      </span>

      <span>

        Amount :
        <strong> ₹ {amount}</strong>

      </span>

      <span>

        Status :
        <strong> {paymentStatus}</strong>

      </span>

    </SummaryCard>

  );

}
