/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA WALLET™

   WALLET TRANSACTION HISTORY

   RESPONSIBILITY:
   - Render Wallet transaction history
   - Render transaction count
   - Render empty state
   - Presentation only

   IMPORTANT:
   - No persistence.
   - No sorting.
   - No filtering.
   - No financial calculations.
============================================================ */

import {
  History,
} from "lucide-react";

import type {
  WalletTransaction,
} from "../../types/wallet/wallet.types";

import {
  useResponsive,
} from "../../utils/responsive";

import WalletTransactionRow from "./WalletTransactionRow";

import {
  createWalletTransactionHistoryStyles,
} from "./WalletTransactionHistory.styles";

/* ============================================================
   TYPES
============================================================ */

export interface WalletTransactionHistoryProps {
  transactions:
    WalletTransaction[];
}

/* ============================================================
   COMPONENT
============================================================ */

export default function WalletTransactionHistory({
  transactions,
}: WalletTransactionHistoryProps) {
  const {
    tokens,
  } = useResponsive();

  const styles =
    createWalletTransactionHistoryStyles(tokens);

  const transactionCount =
    transactions.length;

  return (
    <section style={styles.section}>
      <header style={styles.header}>
        <div style={styles.headingGroup}>
          <h2 style={styles.title}>
            <History
              size={tokens.icon.md}
              strokeWidth={2}
              aria-hidden="true"
            />

            Wallet Transactions
          </h2>

          <p style={styles.subtitle}>
            Recharge and FINORA platform charge history
          </p>
        </div>

        <span style={styles.count}>
          {transactionCount}
        </span>
      </header>

      {transactionCount > 0 ? (
        <div style={styles.list}>
          {transactions.map((transaction) => (
            <WalletTransactionRow
              key={transaction.id}
              transaction={transaction}
            />
          ))}
        </div>
      ) : (
        <div style={styles.empty}>
          <History
            size={tokens.icon.lg}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <p style={styles.emptyTitle}>
            No wallet transactions yet
          </p>

          <p style={styles.emptyText}>
            Wallet recharges and FINORA platform charges
            will appear here.
          </p>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   END
============================================================ */
