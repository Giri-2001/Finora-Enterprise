/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   FINANCIAL CLOSING STUDIO
   MONTHLY CLOSING
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface MonthlyClosingProps {

  totalRevenue?: number;

  totalExpenses?: number;

  netProfit?: number;

  closingStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function MonthlyClosing({

  totalRevenue = 0,

  totalExpenses = 0,

  netProfit = 0,

  closingStatus = "Open",

}: MonthlyClosingProps) {

  return (

    <SummaryCard title="Monthly Closing">

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
        <strong> {closingStatus}</strong>

      </span>

    </SummaryCard>

  );

}
