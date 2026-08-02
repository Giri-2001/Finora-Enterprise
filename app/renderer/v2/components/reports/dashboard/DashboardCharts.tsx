/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   DASHBOARD CHARTS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface DashboardChartsProps {

  chartTitle?: string;

  period?: string;

  totalValue?: number;

  trend?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function DashboardCharts({

  chartTitle = "Collection Trend",

  period = "Current Month",

  totalValue = 0,

  trend = "Stable",

}: DashboardChartsProps) {

  return (

    <SummaryCard title="Dashboard Charts">

      <span>

        Chart :
        <strong> {chartTitle}</strong>

      </span>

      <span>

        Period :
        <strong> {period}</strong>

      </span>

      <span>

        Total :
        <strong> ₹ {totalValue}</strong>

      </span>

      <span>

        Trend :
        <strong> {trend}</strong>

      </span>

    </SummaryCard>

  );

}
