/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   FINANCIAL CLOSING STUDIO
   CLOSING PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ClosingPreviewCardProps {

  closingDate?: string;

  totalRevenue?: number;

  totalExpenses?: number;

  netProfit?: number;

  status?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ClosingPreviewCard({

  closingDate = "--",

  totalRevenue = 0,

  totalExpenses = 0,

  netProfit = 0,

  status = "--",

}: ClosingPreviewCardProps) {

  return (

    <SummaryCard title="Financial Closing Preview">

      <span>
        Closing Date :
        <strong> {closingDate}</strong>
      </span>

      <span>
        Total Revenue :
        <strong> ₹ {totalRevenue}</strong>
      </span>

      <span>
        Total Expenses :
        <strong> ₹ {totalExpenses}</strong>
      </span>

      <span>
        Net Profit :
        <strong> ₹ {netProfit}</strong>
      </span>

      <span>
        Status :
        <strong> {status}</strong>
      </span>

    </SummaryCard>

  );

}
