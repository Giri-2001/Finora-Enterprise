import Card from "../../components/ui/Card";

import {
  getCollectionReport,
  getCustomerReport,
  getLoanReport,
} from "../../store/reportStore";

export default function Reports() {
  const loanReports = getLoanReport();

  const collectionReports = getCollectionReport();

  const customerReports = getCustomerReport();

  const totalOutstanding = loanReports.reduce(
    (sum, loan) => sum + loan.outstandingAmount,
    0,
  );

  const totalCollected = collectionReports.reduce(
    (sum, collection) => sum + collection.amount,
    0,
  );

  return (
    <div>
      <h1>Reports</h1>

      <p>Analyze loans, collections and customer performance.</p>

      <div
        style={{
          display: "grid",

          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",

          gap: 20,

          marginTop: 20,
        }}
      >
        <Card title="Loan Records">
          <h2>{loanReports.length}</h2>
        </Card>

        <Card title="Collection Records">
          <h2>{collectionReports.length}</h2>
        </Card>

        <Card title="Outstanding Amount">
          <h2>₹{totalOutstanding.toLocaleString("en-IN")}</h2>
        </Card>

        <Card title="Total Collected">
          <h2>₹{totalCollected.toLocaleString("en-IN")}</h2>
        </Card>
      </div>

      <Card title="Loan Report">
        {loanReports.map((loan) => (
          <div
            key={loan.loanId}
            style={{
              padding: 12,
              borderBottom: "1px solid #334155",
            }}
          >
            <p>Loan: {loan.loanId}</p>

            <p>Customer: {loan.customerName}</p>

            <p>
              Outstanding: ₹{loan.outstandingAmount.toLocaleString("en-IN")}
            </p>

            <p>Status: {loan.status}</p>
          </div>
        ))}
      </Card>

      <Card title="Collection Report">
        {collectionReports.map((collection) => (
          <div
            key={collection.receiptNumber}
            style={{
              padding: 12,
              borderBottom: "1px solid #334155",
            }}
          >
            <p>Receipt: {collection.receiptNumber}</p>

            <p>Customer: {collection.customerName}</p>

            <p>Amount: ₹{collection.amount.toLocaleString("en-IN")}</p>
          </div>
        ))}
      </Card>

      <Card title="Customer Report">
        {customerReports.map((customer) => (
          <div
            key={customer.customerId}
            style={{
              padding: 12,
              borderBottom: "1px solid #334155",
            }}
          >
            <p>Customer: {customer.customerName}</p>

            <p>Loans: {customer.totalLoans}</p>

            <p>Paid: ₹{customer.totalPaid.toLocaleString("en-IN")}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
