/* ===========================================================
   FINORA ENTERPRISE V2
   RECEIPT STUDIO
   RECEIPT CUSTOMER CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ReceiptCustomerCardProps {

  customerName?: string;

  loanNumber?: string;

  collectionAmount?: number;

  outstandingBalance?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReceiptCustomerCard({

  customerName = "--",

  loanNumber = "--",

  collectionAmount = 0,

  outstandingBalance = 0,

}: ReceiptCustomerCardProps) {

  return (

    <SummaryCard title="Customer Information">

      <span>

        Customer :
        <strong> {customerName}</strong>

      </span>

      <span>

        Loan Number :
        <strong> {loanNumber}</strong>

      </span>

      <span>

        Collection :
        <strong> ₹ {collectionAmount}</strong>

      </span>

      <span>

        Outstanding :
        <strong> ₹ {outstandingBalance}</strong>

      </span>

    </SummaryCard>

  );

}
