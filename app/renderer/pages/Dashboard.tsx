import Card from "../components/ui/Card";
import "../styles/dashboard.css";

import { getTodayCollections } from "../store/collectionStore";
import { getCustomers } from "../store/customerStore";
import { getLoans } from "../store/loanStore";

import { getAuditLogs } from "../store/auditStore";

export default function Dashboard() {
  const customers = getCustomers();

  const loans = getLoans();

  const today = new Date().toISOString().split("T")[0];

  const todaysCollections = getTodayCollections(today);

  const auditLogs = getAuditLogs();

  const activeLoans = loans.filter((loan) => loan.status === "Active");

  const outstandingAmount = loans.reduce(
    (total, loan) => total + loan.outstandingAmount,
    0,
  );

  const todaysCollectionAmount = todaysCollections.reduce(
    (total, collection) => total + collection.totalAmount,
    0,
  );

  const todaysActivities = auditLogs.filter((log) =>
    log.createdAt.startsWith(today),
  ).length;

  const loginCount = auditLogs.filter((log) => log.action === "LOGIN").length;

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

      value: `₹${todaysCollectionAmount.toLocaleString("en-IN")}`,

      description: "Collections received today",
    },

    {
      title: "Audit Actions",

      value: auditLogs.length.toString(),

      description: "Total tracked activities",
    },

    {
      title: "Today's Activities",

      value: todaysActivities.toString(),

      description: "Actions performed today",
    },

    {
      title: "Login Count",

      value: loginCount.toString(),

      description: "Total user logins",
    },

    {
      title: "Active Users",

      value: new Set(auditLogs.map((log) => log.performedBy)).size.toString(),

      description: "Users performing actions",
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
