import type { CSSProperties } from "react";

import ReceiptButton from "../receipt/ReceiptButton";

import { printReceipt } from "../../utils/receiptGenerator";

import { getCustomers } from "../../store/customerStore";
import { getLoanById } from "../../store/loanStore";

import type { Collection } from "./types";

type CollectionTableProps = {
  collections: Collection[];
  onDelete?: (id: string) => void;
};

function safeNumber(value?: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatCurrency(value?: number): string {
  return `₹${safeNumber(value).toLocaleString("en-IN")}`;
}

function getStatusStyle(status: string): CSSProperties {
  switch (status) {
    case "COMPLETED":
    case "Paid":
      return {
        background: "var(--success)",
        color: "#fff",
      };

    case "PENDING":
      return {
        background: "var(--warning)",
        color: "#fff",
      };

    default:
      return {
        background: "var(--danger)",
        color: "#fff",
      };
  }
}

export default function CollectionTable({
  collections,
  onDelete,
}: CollectionTableProps) {
  const customers = getCustomers();

  if (collections.length === 0) {
    return (
      <div
        style={{
          marginTop: 20,
          padding: 50,
          borderRadius: 18,
          border: "1px dashed var(--surface-border)",
          background: "var(--surface)",
          color: "var(--text-muted)",
          textAlign: "center",
          fontWeight: 700,
          boxShadow: "var(--card-shadow)",
        }}
      >
        No collections available.
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 20,
        overflowX: "auto",
        borderRadius: 18,
        border: "1px solid var(--surface-border)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <table
        style={{
          width: "100%",
          minWidth: 1200,
          borderCollapse: "collapse",
          background: "var(--surface)",
        }}
      >
        <thead>
          <tr
            style={{
              background: "var(--surface-hover)",
            }}
          >
            <th style={headerStyle}>Receipt</th>
            <th style={headerStyle}>Loan</th>
            <th style={headerStyle}>Customer</th>
            <th style={headerStyle}>Date</th>
            <th style={headerStyle}>Type</th>
            <th style={headerStyle}>Amount</th>
            <th style={headerStyle}>Payment</th>
            <th style={headerStyle}>Status</th>
            <th style={headerStyle}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {collections.map((collection, index) => {
            const customer = customers.find(
              (item) => item.customerId === collection.customerId,
            );

            const loan = getLoanById(Number(collection.loanId));

            return (
              <tr
                key={collection.id}
                style={{
                  background:
                    index % 2 === 0 ? "var(--surface)" : "var(--surface-hover)",
                  borderBottom: "1px solid var(--surface-border)",
                  transition: "background .2s ease",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "var(--surface-hover)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background =
                    index % 2 === 0 ? "var(--surface)" : "var(--surface-hover)";
                }}
              >
                <td style={cellStyle}>{collection.receiptNumber}</td>

                <td style={cellStyle}>
                  {loan?.finoraLoanId ?? collection.loanId}
                </td>

                <td style={cellStyle}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <strong>{customer?.name ?? "Unknown"}</strong>

                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: 12,
                      }}
                    >
                      {collection.customerId}
                    </span>
                  </div>
                </td>

                <td style={cellStyle}>{collection.collectionDate}</td>

                <td style={cellStyle}>{collection.collectionType}</td>

                <td
                  style={{
                    ...cellStyle,
                    fontWeight: 800,
                    color: "var(--finora-accent)",
                  }}
                >
                  {formatCurrency(collection.totalAmount)}
                </td>

                <td style={cellStyle}>{collection.paymentMode}</td>

                <td style={cellStyle}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 95,
                      padding: "6px 14px",
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: 12,
                      ...getStatusStyle(collection.status),
                    }}
                  >
                    {collection.status}
                  </span>
                </td>

                <td style={cellStyle}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <ReceiptButton
                      onClick={() =>
                        printReceipt(
                          collection,
                          {
                            name: customer?.name ?? collection.customerId,
                            phone: customer?.phone,
                          },
                          loan?.finoraLoanId ?? collection.loanId,
                          {
                            approvedAmount: loan?.approvedLoanAmount ?? 0,
                            outstandingAmount: loan?.outstandingAmount ?? 0,
                            totalPaid: loan?.totalCollectedAmount ?? 0,
                          },
                        )
                      }
                    />

                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(collection.id)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: "none",
                          background: "var(--danger)",
                          color: "#fff",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const headerStyle: CSSProperties = {
  padding: "15px",
  textAlign: "left",
  fontWeight: 800,
  fontSize: 13,
  color: "var(--text)",
  whiteSpace: "nowrap",
};

const cellStyle: CSSProperties = {
  padding: "15px",
  fontSize: 14,
  color: "var(--text)",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};
