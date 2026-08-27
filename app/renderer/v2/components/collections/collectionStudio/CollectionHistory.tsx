// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// COLLECTION HISTORY
//
// RESPONSIBILITY
//
// - Display previous collections for the selected loan
// - Show collection date
// - Show receipt number
// - Show payment mode
// - Show collected amount
// - Show remaining balance
// - Presentation only
//
// IMPORTANT
//
// - No local theme system
// - No local responsive system
// - No business persistence
// - No filesystem access
// - No Electron IPC
// - No inline colour definitions
// - Visual styles remain inside dedicated style file
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

import { collectionHistoryStyles } from "./CollectionHistory.styles";

// ============================================================
// TYPES
// ============================================================

interface CollectionHistoryRecord {
  id: string;

  receiptNumber: string;

  collectionDate: string;

  paymentMode: string;

  amount: number;

  remainingBalance: number;
}

// ============================================================
// DEMO HISTORY
//
// This is an isolated presentation fallback.
//
// Real collection repository/controller integration can
// replace this source without changing the UI contract.
// ============================================================

const COLLECTION_HISTORY: CollectionHistoryRecord[] = [
  {
    id: "collection-001",
    receiptNumber: "REC-001",
    collectionDate: "20 Aug 2026",
    paymentMode: "Cash",
    amount: 1500,
    remainingBalance: 8930,
  },

  {
    id: "collection-002",
    receiptNumber: "REC-002",
    collectionDate: "15 Aug 2026",
    paymentMode: "UPI",
    amount: 1500,
    remainingBalance: 10430,
  },

  {
    id: "collection-003",
    receiptNumber: "REC-003",
    collectionDate: "10 Aug 2026",
    paymentMode: "Cash",
    amount: 1000,
    remainingBalance: 11930,
  },
];

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(value: number): string {
  return `₹ ${value.toLocaleString("en-IN")}`;
}

// ============================================================
// COMPONENT
// ============================================================

export default function CollectionHistory() {
  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (COLLECTION_HISTORY.length === 0) {
    return (
      <section
        aria-label="Collection History"
        style={collectionHistoryStyles.section}
      >
        <div style={collectionHistoryStyles.header}>
          <div style={collectionHistoryStyles.headerTitle}>
            <span style={collectionHistoryStyles.step}>8</span>

            <div>
              <h2 style={collectionHistoryStyles.title}>COLLECTION HISTORY</h2>

              <p style={collectionHistoryStyles.subtitle}>
                Previous collections recorded against this loan.
              </p>
            </div>
          </div>
        </div>

        <div style={collectionHistoryStyles.emptyState}>
          <strong style={collectionHistoryStyles.emptyTitle}>
            No collection history
          </strong>

          <span style={collectionHistoryStyles.emptyMessage}>
            No previous collections have been recorded for this loan.
          </span>
        </div>
      </section>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section
      aria-label="Collection History"
      style={collectionHistoryStyles.section}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div style={collectionHistoryStyles.header}>
        <div style={collectionHistoryStyles.headerTitle}>
          <span style={collectionHistoryStyles.step}>8</span>

          <div>
            <h2 style={collectionHistoryStyles.title}>COLLECTION HISTORY</h2>

            <p style={collectionHistoryStyles.subtitle}>
              Previous collections recorded against this loan.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          HISTORY TABLE
      ====================================================== */}

      <div style={collectionHistoryStyles.tableWrapper}>
        <table style={collectionHistoryStyles.table}>
          <thead>
            <tr>
              <th style={collectionHistoryStyles.tableHeader}>DATE</th>

              <th style={collectionHistoryStyles.tableHeader}>RECEIPT</th>

              <th style={collectionHistoryStyles.tableHeader}>PAYMENT MODE</th>

              <th
                style={{
                  ...collectionHistoryStyles.tableHeader,
                  ...collectionHistoryStyles.amountHeader,
                }}
              >
                COLLECTED
              </th>

              <th
                style={{
                  ...collectionHistoryStyles.tableHeader,
                  ...collectionHistoryStyles.amountHeader,
                }}
              >
                BALANCE
              </th>
            </tr>
          </thead>

          <tbody>
            {COLLECTION_HISTORY.map((record) => (
              <tr key={record.id}>
                <td style={collectionHistoryStyles.tableCell}>
                  {record.collectionDate}
                </td>

                <td style={collectionHistoryStyles.tableCell}>
                  <span style={collectionHistoryStyles.receiptNumber}>
                    {record.receiptNumber}
                  </span>
                </td>

                <td style={collectionHistoryStyles.tableCell}>
                  <span style={collectionHistoryStyles.paymentMode}>
                    {record.paymentMode}
                  </span>
                </td>

                <td
                  style={{
                    ...collectionHistoryStyles.tableCell,
                    ...collectionHistoryStyles.amountCell,
                  }}
                >
                  {formatCurrency(record.amount)}
                </td>

                <td
                  style={{
                    ...collectionHistoryStyles.tableCell,
                    ...collectionHistoryStyles.balanceCell,
                  }}
                >
                  {formatCurrency(record.remainingBalance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ============================================================
// END
// ============================================================
