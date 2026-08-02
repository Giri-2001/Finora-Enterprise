/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   FINANCIAL CLOSING STUDIO
   DAILY CLOSING
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface DailyClosingProps {

  openingBalance?: number;

  totalReceipts?: number;

  totalPayments?: number;

  closingBalance?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function DailyClosing({

  openingBalance = 0,

  totalReceipts = 0,

  totalPayments = 0,

  closingBalance = 0,

}: DailyClosingProps) {

  return (

    <SummaryCard title="Daily Closing">

      <span>

        Opening Balance :
        <strong> ₹ {openingBalance}</strong>

      </span>

      <span>

        Total Receipts :
        <strong> ₹ {totalReceipts}</strong>

      </span>

      <span>

        Total Payments :
        <strong> ₹ {totalPayments}</strong>

      </span>

      <span>

        Closing Balance :
        <strong> ₹ {closingBalance}</strong>

      </span>

    </SummaryCard>

  );

}
