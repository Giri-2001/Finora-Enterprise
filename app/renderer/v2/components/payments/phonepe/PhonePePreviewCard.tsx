/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   PHONEPE INTEGRATION STUDIO
   PHONEPE PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface PhonePePreviewCardProps {

  merchantName?: string;

  transactionId?: string;

  amount?: number;

  paymentStatus?: string;

  paymentTime?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PhonePePreviewCard({

  merchantName = "--",

  transactionId = "--",

  amount = 0,

  paymentStatus = "Pending",

  paymentTime = "--",

}: PhonePePreviewCardProps) {

  return (

    <SummaryCard title="PhonePe Preview">

      <span>

        Merchant :
        <strong> {merchantName}</strong>

      </span>

      <span>

        Transaction :
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

        Time :
        <strong> {paymentTime}</strong>

      </span>

    </SummaryCard>

  );

}
