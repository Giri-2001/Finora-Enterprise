/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   FINANCIAL REPORTS STUDIO
   PROFIT ANALYSIS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ProfitAnalysisProps {

  totalRevenue?: number;

  totalExpenses?: number;

  netProfit?: number;

  profitMargin?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ProfitAnalysis({

  totalRevenue = 0,

  totalExpenses = 0,

  netProfit = 0,

  profitMargin = 0,

}: ProfitAnalysisProps) {

  return (

    <SummaryCard title="Profit Analysis">

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

        Profit Margin :
        <strong> {profitMargin}%</strong>

      </span>

    </SummaryCard>

  );

}
