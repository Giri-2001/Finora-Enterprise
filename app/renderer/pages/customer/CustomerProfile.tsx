import type { Customer } from "../../components/customers/types";

import type { Loan } from "../../components/loans/types";

import type { Collection } from "../../components/collections/types";

import { getCustomerLoans } from "../../store/loanStore";

import { getCustomerCollections } from "../../store/collectionStore";

type CustomerProfileProps = {
  customer: Customer;

  onBack: () => void;
};

export default function CustomerProfile({
  customer,
  onBack,
}: CustomerProfileProps) {
  const loans: Loan[] = getCustomerLoans(customer.customerId);

  const collections: Collection[] = getCustomerCollections(customer.customerId);

  const totalBorrowed = loans.reduce(
    (sum, loan) => sum + loan.approvedLoanAmount,
    0,
  );

  const totalCollected = collections.reduce(
    (sum, collection) => sum + collection.totalAmount,
    0,
  );

  const outstanding = loans.reduce(
    (sum, loan) => sum + loan.outstandingAmount,
    0,
  );

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        style={{
          marginBottom: 20,
          padding: "8px 14px",
          cursor: "pointer",
        }}
      >
        Back
      </button>

      <h1>Customer Profile</h1>

      <div style={cardStyle}>
        <h2>Personal Details</h2>

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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          gap: 16,
          marginTop: 20,
        }}
      >
        <div style={cardStyle}>
          <h3>Total Borrowed</h3>

          <h2>₹{totalBorrowed.toLocaleString("en-IN")}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Total Paid</h3>

          <h2>₹{totalCollected.toLocaleString("en-IN")}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Outstanding</h3>

          <h2>₹{outstanding.toLocaleString("en-IN")}</h2>
        </div>
      </div>

      <div style={cardStyle}>
        <h2>Loan History</h2>

        {loans.length === 0 ? (
          <p>No loans available</p>
        ) : (
          loans.map((loan) => (
            <div
              key={loan.id}
              style={{
                padding: 12,
                borderBottom: "1px solid #334155",
              }}
            >
              <p>Loan ID: {loan.finoraLoanId}</p>

              <p>Amount: ₹{loan.approvedLoanAmount.toLocaleString("en-IN")}</p>

              <p>Balance: ₹{loan.outstandingAmount.toLocaleString("en-IN")}</p>

              <p>Status: {loan.status}</p>
            </div>
          ))
        )}
      </div>

      <div style={cardStyle}>
        <h2>Payment History</h2>

        {collections.length === 0 ? (
          <p>No payments available</p>
        ) : (
          collections.map((collection) => (
            <div
              key={collection.id}
              style={{
                padding: 12,
                borderBottom: "1px solid #334155",
              }}
            >
              <p>Receipt: {collection.receiptNumber}</p>

              <p>Amount: ₹{collection.totalAmount.toLocaleString("en-IN")}</p>

              <p>Date: {collection.collectionDate}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  marginTop: 20,

  padding: 20,

  background: "#1e293b",

  borderRadius: 12,
};
