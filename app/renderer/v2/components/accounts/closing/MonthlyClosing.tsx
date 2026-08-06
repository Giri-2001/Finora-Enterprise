/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   FINANCIAL CLOSING STUDIO
   MONTHLY CLOSING
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  formatCurrency,
} from "../../../utils/currency/formatCurrency";
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
        <strong> ₹ {formatCurrency(totalRevenue)}</strong>

      </span>

      <span>

        Total Expenses :
        <strong> ₹ {formatCurrency(totalExpenses)}</strong>
      </span>

      <span>

        Net Profit :
        <strong> ₹ {formatCurrency(netProfit)}</strong>

      </span>

      <span>

        Status :
        <strong> {closingStatus}</strong>

      </span>

    </SummaryCard>

  );

}
