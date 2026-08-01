import Card from "../components/ui/Card";

import "../styles/dashboard.css";

import { getTodayCollections } from "../store/collectionStore";

import { getCustomers } from "../store/customerStore";

import { getLoans } from "../store/loanStore";

import { getAuditLogs } from "../store/auditStore";

import { getLockers } from "../store/goldLockerStore";

import { getBags } from "../store/goldBagStore";

import { getOrnaments } from "../store/goldOrnamentStore";

import DashboardCard from "../components/ui/DashboardCard";

import {
  CustomersIcon,
  LoansIcon,
  CollectionsIcon,
  PaymentsIcon,
  GoldLoanIcon,
  ReportsIcon,
  UsersIcon,
  AuditLogsIcon,
  DashboardIcon,
} from "../assets/icons";

const metricIcons: Record<string, string> = {
  "Total Customers": CustomersIcon,
  "Total Loans": LoansIcon,
  "Active Loans": LoansIcon,
  "Closed Loans": ReportsIcon,
  "Approved Amount": PaymentsIcon,
  "Outstanding Amount": CollectionsIcon,
  "Today's Collection": PaymentsIcon,
  "Collection Count": CollectionsIcon,
  "Gold Lockers": LoansIcon,
  "Occupied Lockers": LoansIcon,
  "Available Lockers": LoansIcon,
  "Gold Bags": GoldLoanIcon,
  "Released Bags": GoldLoanIcon,
  "Gold Ornaments": GoldLoanIcon,
  "Audit Actions": AuditLogsIcon,
  "Today's Activities": DashboardIcon,
  "Login Count": UsersIcon,
};

function safeNumber(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatCurrency(value?: number) {
  return `₹${safeNumber(value).toLocaleString("en-IN")}`;
}

/* ==========================================================
   FUTURE ENTERPRISE KPIs

   Enable these cards when Gold Loan,
   Audit & Security Dashboard are introduced.

   - Approved Amount
   - Gold Ornaments
   - Audit Actions
   - Today's Activities
   - Login Count

==========================================================

{
      title: "Approved Amount",

      value: formatCurrency(approvedAmount),

      description: "Total approved loans",
    },


    {
      title: "Audit Actions",

      value: auditLogs.length,

      description: "Tracked activities",
    },

    {
      title: "Today's Activities",

      value: todaysActivities,

      description: "Today's operations",
    },

    {
      title: "Login Count",

      value: loginCount,

      description: "User login activity",
    },

    {
      title: "Gold Bags",

      value: bags.length,

      description: "Registered bags",
    },

    {
      title: "Released Bags",

      value: releasedBags,

      description: "Released storage bags",
    },

    {
      title: "Gold Ornaments",

      value: ornaments.length,

      description: "Stored ornaments",
    },

========================================================= */

export default function Dashboard() {
  const customers = getCustomers();

  const loans = getLoans();

  const lockers = getLockers();

  const bags = getBags();

  const ornaments = getOrnaments();

  const today = new Date().toISOString().split("T")[0];

  const todaysCollections = getTodayCollections(today);

  const auditLogs = getAuditLogs();

  const activeLoans = loans.filter((loan) => loan.status === "Active");

  const closedLoans = loans.filter((loan) => loan.status === "Closed");

  const outstandingAmount = loans.reduce(
    (total, loan) => total + safeNumber(loan.outstandingAmount),
    0,
  );

  const approvedAmount = loans.reduce(
    (total, loan) => total + safeNumber(loan.approvedLoanAmount),
    0,
  );

  const todaysCollectionAmount = todaysCollections.reduce(
    (total, collection) => total + safeNumber(collection.totalAmount),
    0,
  );

  const occupiedLockers = lockers.filter(
    (locker) => locker.status === "OCCUPIED",
  ).length;

  const availableLockers = Math.max(lockers.length - occupiedLockers, 0);

  const releasedBags = bags.filter((bag) => bag.status === "RELEASED").length;

  const todaysActivities = auditLogs.filter((log) =>
    log.createdAt?.startsWith(today),
  ).length;

  const loginCount = auditLogs.filter((log) => log.action === "LOGIN").length;

  const metrics = [
    {
      title: "Total Customers",

      value: customers.length,

      description: "Registered customers",
    },

    {
      title: "Total Loans",

      value: loans.length,

      description: "Created loans",
    },

    {
      title: "Active Loans",

      value: activeLoans.length,

      description: "Running loans",
    },

    {
      title: "Closed Loans",

      value: closedLoans.length,

      description: "Completed loans",
    },



    {
      title: "Outstanding Amount",

      value: formatCurrency(outstandingAmount),

      description: "Receivable balance",
    },

    {
      title: "Today's Collection",

      value: formatCurrency(todaysCollectionAmount),

      description: "Today's received amount",
    },

    {
      title: "Collection Count",

      value: todaysCollections.length,

      description: "Today's entries",
    },

    {
      title: "Gold Lockers",

      value: lockers.length,

      description: "Total lockers",
    },

    {
      title: "Occupied Lockers",

      value: occupiedLockers,

      description: "Active gold storage",
    },

    {
      title: "Available Lockers",

      value: availableLockers,

      description: "Empty lockers",
    },

  ];

  return (
    <div className="dashboard">

      <div className="dashboard-grid">
        {metrics.map((metric) => (
          <DashboardCard
  key={metric.title}
  icon={metricIcons[metric.title] ?? DashboardIcon}
  title={metric.title}
  value={
    typeof metric.value === "number"
      ? metric.value.toLocaleString("en-IN")
      : metric.value
  }
  description={metric.description}
/>
        ))}
      </div>
    </div>
  );
}
