import Card from "../components/ui/Card";
import "../styles/dashboard.css";

import { getCustomers } from "../store/customerStore";
import { getLoans } from "../store/loanStore";

export default function Dashboard() {
  const customers = getCustomers();
  const loans = getLoans();

  const activeLoans = loans.filter((loan) => loan.status === "Active");

  const outstandingAmount = activeLoans.reduce(
    (total, loan) => total + loan.receivedAmount,
    0,
  );

  const todaysCollections = 0;

  const metrics = [
    {
      title: "Total Customers",
      value: customers.length.toString(),
      description: "Registered customers",
    },
    {
      title: "Active Loans",
      value: activeLoans.length.toString(),
      description: "Currently active loans",
    },
    {
      title: "Outstanding Amount",
      value: `₹${outstandingAmount.toLocaleString("en-IN")}`,
      description: "Total amount receivable",
    },
    {
      title: "Today's Collections",
      value: `₹${todaysCollections.toLocaleString("en-IN")}`,
      description: "Collections received today",
    },
  ];

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>

      <p
        style={{
          marginBottom: 24,
          color: "#64748b",
        }}
      >
        Welcome to FINORA Enterprise.
      </p>

      <div className="dashboard-grid">
        {metrics.map((metric) => (
          <Card key={metric.title} title={metric.title}>
            <h2 className="kpi-value">{metric.value}</h2>

            <p className="kpi-description">{metric.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
