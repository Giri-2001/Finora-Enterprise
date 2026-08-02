/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   PAYMENT HISTORY STUDIO
   TRANSACTION STATUS CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface TransactionStatusCardProps {

  transactionId?: string;

  paymentStatus?: string;

  gateway?: string;

  processedAt?: string;

  settlementStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function TransactionStatusCard({

  transactionId = "--",

  paymentStatus = "Pending",

  gateway = "--",

  processedAt = "--",

  settlementStatus = "Pending",

}: TransactionStatusCardProps) {

  return (

    <SummaryCard title="Transaction Status">

      <span>

        Transaction ID :
        <strong> {transactionId}</strong>

      </span>

      <span>

        Payment Status :
        <strong> {paymentStatus}</strong>

      </span>

      <span>

        Gateway :
        <strong> {gateway}</strong>

      </span>

      <span>

        Processed At :
        <strong> {processedAt}</strong>

      </span>

      <span>

        Settlement :
        <strong> {settlementStatus}</strong>

      </span>

    </SummaryCard>

  );

}
