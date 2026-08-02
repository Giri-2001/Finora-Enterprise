/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   DIGITAL RECEIPTS STUDIO
   RECEIPT ACTIONS CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ReceiptActionsCardProps {

  canDownload?: boolean;

  canPrint?: boolean;

  canShare?: boolean;

  canVerify?: boolean;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReceiptActionsCard({

  canDownload = true,

  canPrint = true,

  canShare = true,

  canVerify = true,

}: ReceiptActionsCardProps) {

  return (

    <SummaryCard title="Receipt Actions">

      <span>

        Download :
        <strong> {canDownload ? "Available" : "Unavailable"}</strong>

      </span>

      <span>

        Print :
        <strong> {canPrint ? "Available" : "Unavailable"}</strong>

      </span>

      <span>

        Share :
        <strong> {canShare ? "Available" : "Unavailable"}</strong>

      </span>

      <span>

        Verify :
        <strong> {canVerify ? "Available" : "Unavailable"}</strong>

      </span>

    </SummaryCard>

  );

}
