import type { Collection } from "../collections/types";

type ReceiptViewProps = {
  collection: Collection;

  customerName: string;

  loanNumber: string;

  onClose: () => void;
};

export default function ReceiptView({
  collection,
  customerName,
  loanNumber,
  onClose,
}: ReceiptViewProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        color: "#000000",
        padding: 30,
        borderRadius: 12,
        maxWidth: 500,
      }}
    >
      <h1
        style={{
          textAlign: "center",
        }}
      >
        FINORA ENTERPRISE
      </h1>

      <h3
        style={{
          textAlign: "center",
        }}
      >
        Collection Receipt
      </h3>

      <hr />

      <p>
        <strong>Receipt No:</strong> {collection.receiptNumber}
      </p>

      <p>
        <strong>Date:</strong> {collection.collectionDate}
      </p>

      <p>
        <strong>Customer:</strong> {customerName}
      </p>

      <p>
        <strong>Loan ID:</strong> {loanNumber}
      </p>

      <hr />

      <p>
        <strong>Payment Type:</strong> {collection.collectionType}
      </p>

      <p>
        <strong>Payment Mode:</strong> {collection.paymentMode}
      </p>

      <p>
        <strong>Amount Paid:</strong> ₹
        {collection.totalAmount.toLocaleString("en-IN")}
      </p>

      <p>
        <strong>Collected By:</strong> {collection.collectedBy}
      </p>

      <br />

      <div
        style={{
          marginTop: 40,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>Customer Signature</div>

        <div>Authorized Signature</div>
      </div>

      <button
        type="button"
        onClick={onClose}
        style={{
          marginTop: 30,
          padding: "10px 18px",
          cursor: "pointer",
        }}
      >
        Close
      </button>
    </div>
  );
}
