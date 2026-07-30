import type { Customer } from "./types";

type CustomerStatsProps = {
  customers: Customer[];
};

export default function CustomerStats({ customers }: CustomerStatsProps) {
  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    (customer) => customer.status === "Active",
  ).length;

  const inactiveCustomers = customers.filter(
    (customer) => customer.status === "Inactive",
  ).length;

  const activePercentage =
    totalCustomers === 0
      ? 0
      : Math.round((activeCustomers / totalCustomers) * 100);

  const inactivePercentage =
    totalCustomers === 0
      ? 0
      : Math.round((inactiveCustomers / totalCustomers) * 100);

  const cardStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 220,
    background: "var(--surface)",
    border: "1px solid var(--surface-border)",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 30,
    fontWeight: 700,
    marginTop: 12,
    color: "var(--text)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    color: "var(--text-muted)",
    fontWeight: 600,
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 20,
        marginBottom: 24,
      }}
    >
      <div style={cardStyle}>
        <div style={labelStyle}>Total Customers</div>

        <div style={valueStyle}>{totalCustomers}</div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Active Customers</div>

        <div
          style={{
            ...valueStyle,
            color: "var(--success)",
          }}
        >
          {activeCustomers}
        </div>

        <div
          style={{
            marginTop: 8,
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          {activePercentage}% of total
        </div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Inactive Customers</div>

        <div
          style={{
            ...valueStyle,
            color: "var(--danger)",
          }}
        >
          {inactiveCustomers}
        </div>

        <div
          style={{
            marginTop: 8,
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          {inactivePercentage}% of total
        </div>
      </div>
    </div>
  );
}
