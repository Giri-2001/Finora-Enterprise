/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   CASH BOOK STUDIO
   CASH BOOK PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface CashBookPreviewCardProps {

  reportDate?: string;

  openingBalance?: number;

  closingBalance?: number;

  totalTransactions?: number;

  status?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CashBookPreviewCard({

  reportDate = "--",

  openingBalance = 0,

  closingBalance = 0,

  totalTransactions = 0,

  status = "--",

}: CashBookPreviewCardProps) {

  return (

    <SummaryCard title="Cash Book Preview">

      <span>

        Report Date :
        <strong> {reportDate}</strong>

      </span>

      <span>

        Opening Balance :
        <strong> ₹ {openingBalance}</strong>

      </span>

      <span>

        Closing Balance :
        <strong> ₹ {closingBalance}</strong>

      </span>

      <span>

        Transactions :
        <strong> {totalTransactions}</strong>

      </span>

      <span>

        Status :
        <strong> {status}</strong>

      </span>

    </SummaryCard>

  );

}
