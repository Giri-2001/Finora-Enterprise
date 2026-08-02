/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   DIGITAL RECEIPTS STUDIO
   RECEIPT DETAILS CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ReceiptDetailsCardProps {

  receiptNumber?: string;

  customerName?: string;

  loanNumber?: string;

  paymentReference?: string;

  generatedOn?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReceiptDetailsCard({

  receiptNumber = "--",

  customerName = "--",

  loanNumber = "--",

  paymentReference = "--",

  generatedOn = "--",

}: ReceiptDetailsCardProps) {

  return (

    <SummaryCard title="Receipt Details">

      <span>

        Receipt No :
        <strong> {receiptNumber}</strong>

      </span>

      <span>

        Customer :
        <strong> {customerName}</strong>

      </span>

      <span>

        Loan Number :
        <strong> {loanNumber}</strong>

      </span>

      <span>

        Payment Reference :
        <strong> {paymentReference}</strong>

      </span>

      <span>

        Generated On :
        <strong> {generatedOn}</strong>

      </span>

    </SummaryCard>

  );

}
