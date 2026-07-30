import ActionButton from "../ui/ActionButton";
import EmptyState from "../ui/EmptyState";
import type { Customer } from "./types";

type CustomerTableProps = {
  customers: Customer[];
  onDelete: (id: number) => void;
  onEdit: (customer: Customer) => void;
  onView: (customer: Customer) => void;
};

function getStatusColor(status: Customer["status"]) {
  return status === "Active" ? "var(--success)" : "var(--danger)";
}

export default function CustomerTable({
  customers,
  onDelete,
  onEdit,
  onView,
}: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <EmptyState
        title="No Customers Found"
        description="Start by adding your first customer."
      />
    );
  }

  return (
    <div
      style={{
        marginTop: 20,
        overflowX: "auto",
        border: "1px solid var(--surface-border)",
        borderRadius: 12,
        background: "var(--surface)",
      }}
    >
      <table
        style={{
          width: "100%",
          minWidth: 900,
          borderCollapse: "collapse",
        }}
      >
        <thead
          style={{
            background: "var(--surface-border)",
            color: "var(--text)",
          }}
        >
          <tr>
            <th style={headerStyle}>Customer No</th>

            <th style={headerStyle}>Name</th>

            <th style={headerStyle}>Phone</th>

            <th style={headerStyle}>Email</th>

            <th style={headerStyle}>Address</th>

            <th style={headerStyle}>Status</th>

            <th style={headerStyle}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((customer, index) => (
            <tr
              key={customer.id}
              style={{
                background: index % 2 === 0 ? "var(--surface)" : "var(--bg)",

                borderBottom: "1px solid var(--surface-border)",
              }}
            >
              <td style={cellStyle}>{customer.customerId}</td>

              <td style={cellStyle}>{customer.name}</td>

              <td style={cellStyle}>{customer.phone}</td>

              <td style={cellStyle}>{customer.email || "-"}</td>

              <td style={cellStyle}>{customer.address || "-"}</td>

              <td style={cellStyle}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: 20,
                    background: getStatusColor(customer.status),
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {customer.status}
                </span>
              </td>

              <td style={cellStyle}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <ActionButton
                    variant="primary"
                    onClick={() => onView(customer)}
                  >
                    View
                  </ActionButton>

                  <ActionButton
                    variant="warning"
                    onClick={() => onEdit(customer)}
                  >
                    Edit
                  </ActionButton>

                  <ActionButton
                    variant="danger"
                    onClick={() => onDelete(customer.id)}
                  >
                    Delete
                  </ActionButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  padding: "14px",
  textAlign: "left",
  fontWeight: 700,
  fontSize: 14,
  whiteSpace: "nowrap",
  borderBottom: "1px solid var(--surface-border)",
};

const cellStyle: React.CSSProperties = {
  padding: "12px 14px",
  textAlign: "left",
  fontSize: 14,
  color: "var(--text)",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};
