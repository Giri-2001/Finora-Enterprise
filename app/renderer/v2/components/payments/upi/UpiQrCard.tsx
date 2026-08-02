/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   UPI PAYMENT STUDIO
   UPI QR CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface UpiQrCardProps {

  upiId?: string;

  amount?: number;

  qrStatus?: string;

  expiryTime?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function UpiQrCard({

  upiId = "merchant@upi",

  amount = 0,

  qrStatus = "Ready",

  expiryTime = "--",

}: UpiQrCardProps) {

  return (

    <SummaryCard title="UPI QR Payment">

      <span>

        UPI ID :
        <strong> {upiId}</strong>

      </span>

      <span>

        Amount :
        <strong> ₹ {amount}</strong>

      </span>

      <span>

        QR Status :
        <strong> {qrStatus}</strong>

      </span>

      <span>

        Expires :
        <strong> {expiryTime}</strong>

      </span>

    </SummaryCard>

  );

}
