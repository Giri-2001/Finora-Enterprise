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
// - Load persisted collection data through CollectionService
// - Show collection date
// - Show receipt number
// - Show payment mode
// - Show collected amount
// - Show remaining balance
// - Refresh when the selected loan changes
// - Refresh after FINORA collection/loan updates
// - Presentation only
//
// IMPORTANT
//
// - No hardcoded / demo collection history
// - No direct CollectionRepository access
// - No direct StorageManager access
// - No localStorage access
// - No filesystem access
// - No Electron IPC
// - No business calculations
// - No inline colour definitions
// - Visual styles remain inside dedicated style file
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { useEffect, useState } from "react";

import { useCollectionController } from "../controller";

import { loadCollections } from "../../../services/collection/collectionService";

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
// HELPERS
// ============================================================

function formatCurrency(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;

  return `₹ ${safeValue.toLocaleString("en-IN")}`;
}

// ============================================================
// DATE FORMATTER
// ============================================================
//
// Persisted CollectionReviewData stores receiptDate as an
// ISO/date string.
//
// The history UI presents it in the existing FINORA format.
// ============================================================

function formatCollectionDate(value: string): string {
  if (!value) {
    return "--";
  }

  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ============================================================
// COLLECTION → HISTORY RECORD
// ============================================================
//
// This is a presentation mapping boundary.
//
// No amount / balance calculation is performed here.
// ============================================================

function mapCollectionToHistoryRecord(
  collection: {
    loanId: string;
    receiptNumber: string;
    receiptDate: string;
    paymentMethod: string;
    paymentAmount: number;
    outstandingBalance: number;
    createdAt: string;
    updatedAt: string;
  },
  index: number,
): CollectionHistoryRecord {
  return {
    id: `${collection.receiptNumber || collection.loanId}-${collection.createdAt || collection.updatedAt || index}`,

    receiptNumber: collection.receiptNumber || "--",

    collectionDate: collection.receiptDate || collection.createdAt || "",

    paymentMode: String(collection.paymentMethod || ""),

    amount: Number.isFinite(collection.paymentAmount)
      ? collection.paymentAmount
      : 0,

    remainingBalance: Number.isFinite(collection.outstandingBalance)
      ? collection.outstandingBalance
      : 0,
  };
}

// ============================================================
// COMPONENT
// ============================================================

export default function CollectionHistory() {
  // ==========================================================
  // COLLECTION CONTEXT
  // ==========================================================

  const { reviewData } = useCollectionController();

  // ==========================================================
  // STATE
  // ==========================================================

  const [history, setHistory] = useState<CollectionHistoryRecord[]>([]);

  const [loading, setLoading] = useState(true);

  // ==========================================================
  // LOAD LIVE HISTORY
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadHistory(): Promise<void> {
      const loanId = reviewData.loanId;

      if (!loanId) {
        if (!cancelled) {
          setHistory([]);

          setLoading(false);
        }

        return;
      }

      setLoading(true);

      try {
        // ----------------------------------------------------
        // AUTHORITATIVE COLLECTION DATA
        //
        // CollectionHistory does not access the repository
        // directly. CollectionService owns that boundary.
        // ----------------------------------------------------

        const collections = await loadCollections();

        if (cancelled) {
          return;
        }

        // ----------------------------------------------------
        // SELECTED LOAN ONLY
        // ----------------------------------------------------

        const loanCollections = collections

          .filter((collection) => collection.loanId === loanId)

          // ----------------------------------------------
          // NEWEST COLLECTION FIRST
          // ----------------------------------------------

          .sort((a, b) => {
            const aDate = new Date(
              a.receiptDate || a.createdAt || "",
            ).getTime();

            const bDate = new Date(
              b.receiptDate || b.createdAt || "",
            ).getTime();

            return bDate - aDate;
          })

          .map((collection, index) =>
            mapCollectionToHistoryRecord(collection, index),
          );

        setHistory(loanCollections);
      } catch (error) {
        console.error("FINORA COLLECTION HISTORY LOAD ERROR:", error);

        if (!cancelled) {
          setHistory([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHistory();

    // --------------------------------------------------------
    // LIVE REFRESH EVENT
    //
    // ReviewActions dispatches FINORA_LOAN_UPDATED after a
    // collection is completed and persisted.
    // --------------------------------------------------------

    function handleCollectionRefresh(): void {
      void loadHistory();
    }

    window.addEventListener("FINORA_LOAN_UPDATED", handleCollectionRefresh);

    window.addEventListener(
      "FINORA_COLLECTION_UPDATED",
      handleCollectionRefresh,
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        "FINORA_LOAN_UPDATED",
        handleCollectionRefresh,
      );

      window.removeEventListener(
        "FINORA_COLLECTION_UPDATED",
        handleCollectionRefresh,
      );
    };
  }, [reviewData.loanId]);

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (loading) {
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
            Loading collection history
          </strong>

          <span style={collectionHistoryStyles.emptyMessage}>
            Loading persisted collections for the selected loan.
          </span>
        </div>
      </section>
    );
  }

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (history.length === 0) {
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
            {history.map((record) => (
              <tr key={record.id}>
                <td style={collectionHistoryStyles.tableCell}>
                  {formatCollectionDate(record.collectionDate)}
                </td>

                <td style={collectionHistoryStyles.tableCell}>
                  <span style={collectionHistoryStyles.receiptNumber}>
                    {record.receiptNumber}
                  </span>
                </td>

                <td style={collectionHistoryStyles.tableCell}>
                  <span style={collectionHistoryStyles.paymentMode}>
                    {record.paymentMode || "--"}
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
