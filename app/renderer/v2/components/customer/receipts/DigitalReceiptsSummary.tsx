/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   DIGITAL RECEIPTS STUDIO
   DIGITAL RECEIPTS SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface DigitalReceiptsSummaryProps {

  totalReceipts?: number;

  downloadedReceipts?: number;

  sharedReceipts?: number;

  verifiedReceipts?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function DigitalReceiptsSummary({

  totalReceipts = 0,

  downloadedReceipts = 0,

  sharedReceipts = 0,

  verifiedReceipts = 0,

}: DigitalReceiptsSummaryProps) {

  return (

    <SummaryCard title="Digital Receipts Summary">

      <span>

        Total Receipts :
        <strong> {totalReceipts}</strong>

      </span>

      <span>

        Downloaded :
        <strong> {downloadedReceipts}</strong>

      </span>

      <span>

        Shared :
        <strong> {sharedReceipts}</strong>

      </span>

      <span>

        Verified :
        <strong> {verifiedReceipts}</strong>

      </span>

    </SummaryCard>

  );

}
