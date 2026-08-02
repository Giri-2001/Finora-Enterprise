/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   RAZORPAY GATEWAY STUDIO
   RAZORPAY ORDERS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface RazorpayOrdersProps {

  orderId?: string;

  amount?: number;

  currency?: string;

  orderStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function RazorpayOrders({

  orderId = "--",

  amount = 0,

  currency = "INR",

  orderStatus = "Created",

}: RazorpayOrdersProps) {

  return (

    <SummaryCard title="Razorpay Orders">

      <span>

        Order ID :
        <strong> {orderId}</strong>

      </span>

      <span>

        Amount :
        <strong> ₹ {amount}</strong>

      </span>

      <span>

        Currency :
        <strong> {currency}</strong>

      </span>

      <span>

        Status :
        <strong> {orderStatus}</strong>

      </span>

    </SummaryCard>

  );

}
