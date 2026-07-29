import type { Customer } from "../../components/customers/types";

type CustomerProfileProps = {
  customer: Customer;
  onBack: () => void;
};

export default function CustomerProfile({
  customer,
  onBack,
}: CustomerProfileProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        style={{
          marginBottom: "20px",
          padding: "8px 14px",
          cursor: "pointer",
        }}
      >
        Back
      </button>

      <h1>Customer Profile</h1>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          background: "#1e293b",
          borderRadius: "12px",
          maxWidth: "500px",
        }}
      >
        <p>
          <strong>Customer Number:</strong> {customer.customerId}
        </p>

        <p>
          <strong>Name:</strong> {customer.name}
        </p>

        <p>
          <strong>Phone:</strong> {customer.phone}
        </p>

        <p>
          <strong>Email:</strong> {customer.email}
        </p>

        <p>
          <strong>Address:</strong> {customer.address}
        </p>

        <p>
          <strong>Status:</strong> {customer.status}
        </p>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          background: "#1e293b",
          borderRadius: "12px",
        }}
      >
        <h2>Loan History</h2>

        <p style={{ opacity: 0.7 }}>No loans available</p>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          background: "#1e293b",
          borderRadius: "12px",
        }}
      >
        <h2>Payment History</h2>

        <p style={{ opacity: 0.7 }}>No payments available</p>
      </div>
    </div>
  );
}
