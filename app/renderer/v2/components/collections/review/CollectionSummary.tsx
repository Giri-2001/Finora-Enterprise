/* ===========================================================
   FINORA ENTERPRISE V2
   COLLECTION REVIEW STUDIO
   COLLECTION SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface CollectionSummaryProps {

  customerName?: string;

  loanNumber?: string;

  totalCollected?: number;

  outstandingBalance?: number;

  settlementStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CollectionSummary({

  customerName = "--",

  loanNumber = "--",

  totalCollected = 0,

  outstandingBalance = 0,

  settlementStatus = "--",

}: CollectionSummaryProps) {

  return (

    <SummaryCard title="Collection Summary">

      <span>

        Customer :
        <strong> {customerName}</strong>

      </span>

      <span>

        Loan Number :
        <strong> {loanNumber}</strong>

      </span>

      <span>

        Total Collected :
        <strong> ₹ {totalCollected}</strong>

      </span>

      <span>

        Outstanding Balance :
        <strong> ₹ {outstandingBalance}</strong>

      </span>

      <span>

        Settlement Status :
        <strong> {settlementStatus}</strong>

      </span>

    </SummaryCard>

  );

}
