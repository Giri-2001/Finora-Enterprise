/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   FINANCIAL CLOSING STUDIO
   CLOSING PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  formatCurrency,
} from "../../../utils/currency/formatCurrency";
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
        <strong> {status}</strong>
      </span>

    </SummaryCard>

  );

}
