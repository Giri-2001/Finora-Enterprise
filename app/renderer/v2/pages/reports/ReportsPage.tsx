/* ===========================================================
   FINORA OS V2
   REPORTS PAGE
=========================================================== */

import StudioLayout from "../../components/common/layout/StudioLayout";

import DashboardHeader from "../../components/reports/dashboard/DashboardHeader";
import DashboardSummary from "../../components/reports/dashboard/DashboardSummary";
import DashboardCharts from "../../components/reports/dashboard/DashboardCharts";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReportsPage() {
  return (
    <StudioLayout>
      <DashboardHeader />

      <DashboardSummary
        totalCustomers={0}
        activeLoans={0}
        totalCollections={0}
        outstandingAmount={0}
      />

      <div
        style={{
          marginTop: 24,
        }}
      >
        <DashboardCharts
          chartTitle="Collection Trend"
          period="Current Month"
          totalValue={0}
          trend="Stable"
        />
      </div>
    </StudioLayout>
  );
}
