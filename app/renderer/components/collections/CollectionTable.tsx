import type { Collection } from "./types";

import ReceiptButton from "../receipt/ReceiptButton";

import { printReceipt } from "../../utils/receiptGenerator";

type CollectionTableProps = {
  collections: Collection[];

  onDelete?: (id: string) => void;
};

export default function CollectionTable({
  collections,
  onDelete,
}: CollectionTableProps) {
  if (collections.length === 0) {
    return (
      <div
        style={{
          marginTop: 20,
          padding: 20,
          background: "#1e293b",
          borderRadius: 12,
        }}
      >
        No collections available
      </div>
    );
  }

  return (
    <table
      style={{
        width: "100%",
        marginTop: 20,
        borderCollapse: "collapse",
      }}
    >
      <thead>
        <tr>
          <th style={cellStyle}>Receipt</th>

          <th style={cellStyle}>Loan ID</th>

          <th style={cellStyle}>Customer ID</th>

          <th style={cellStyle}>Date</th>

          <th style={cellStyle}>Type</th>

          <th style={cellStyle}>Amount</th>

          <th style={cellStyle}>Payment</th>

          <th style={cellStyle}>Status</th>

          <th style={cellStyle}>Action</th>
        </tr>
      </thead>

      <tbody>
        {collections.map((collection) => (
          <tr key={collection.id}>
            <td style={cellStyle}>{collection.receiptNumber}</td>

            <td style={cellStyle}>{collection.loanId}</td>

            <td style={cellStyle}>{collection.customerId}</td>

            <td style={cellStyle}>{collection.collectionDate}</td>

            <td style={cellStyle}>{collection.collectionType}</td>

            <td style={cellStyle}>
              ₹{collection.totalAmount.toLocaleString("en-IN")}
            </td>

            <td style={cellStyle}>{collection.paymentMode}</td>

            <td style={cellStyle}>{collection.status}</td>

            <td style={cellStyle}>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                }}
              >
                <ReceiptButton
                  onClick={() =>
                    printReceipt(
                      collection,
                      collection.customerId,
                      collection.loanId,
                    )
                  }
                />

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(collection.id)}
                    style={{
                      padding: "6px 12px",

                      borderRadius: 6,

                      border: "none",

                      background: "#dc2626",

                      color: "#ffffff",

                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const cellStyle = {
  borderBottom: "1px solid #334155",

  padding: "12px",

  textAlign: "left" as const,
};
