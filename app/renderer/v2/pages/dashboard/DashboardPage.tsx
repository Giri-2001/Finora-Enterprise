/* ===========================================================
   FINORA OS V2
   ENTERPRISE DASHBOARD
=========================================================== */

import StudioLayout from "../../components/common/layout/StudioLayout";
import StudioHeader from "../../components/common/studio/StudioHeader";
import SummaryCard from "../../components/common/cards/SummaryCard";

/* ===========================================================
   STYLES
=========================================================== */

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "20px",
  marginTop: "24px",
};

const sectionStyle = {
  marginTop: "24px",
};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function DashboardPage() {
  return (
    <StudioLayout>
      <StudioHeader
        title="FINORA OS™"
        subtitle="Enterprise Finance Operating System Dashboard"
      />

      <div style={summaryGridStyle}>
        <SummaryCard title="Customers">
          <strong style={{ fontSize: 28 }}>0</strong>
          <span>Total Customers</span>
        </SummaryCard>

        <SummaryCard title="Loans">
          <strong style={{ fontSize: 28 }}>0</strong>
          <span>Active Loans</span>
        </SummaryCard>

        <SummaryCard title="Collections">
          <strong style={{ fontSize: 28 }}>₹0</strong>
          <span>Today's Collection</span>
        </SummaryCard>

        <SummaryCard title="Reports">
          <strong style={{ fontSize: 28 }}>0</strong>
          <span>Generated Reports</span>
        </SummaryCard>
      </div>

      <div style={sectionStyle}>
        <SummaryCard title="Quick Actions">
          <span>• Add Customer</span>
          <span>• Create Loan</span>
          <span>• New Collection</span>
          <span>• View Reports</span>
        </SummaryCard>
      </div>

      <div style={sectionStyle}>
        <SummaryCard title="Recent Activity">
          <span>No activity available.</span>
        </SummaryCard>
      </div>
    </StudioLayout>
  );
}
