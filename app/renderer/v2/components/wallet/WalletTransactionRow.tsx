/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA WALLET™

   WALLET TRANSACTION ROW

   RESPONSIBILITY:
   - Render one Wallet transaction
   - Show CREDIT / DEBIT amount semantics
   - Show transaction title / remarks / balance
   - Presentation only

   IMPORTANT:
   - No persistence.
   - No balance calculations.
   - No transaction mutation.
============================================================ */

import {
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

import type {
  WalletTransaction,
} from "../../types/wallet/wallet.types";

import {
  useResponsive,
} from "../../utils/responsive";

import {
  formatRupee,
} from "../../utils/currency/formatCurrency";

import {
  createWalletTransactionRowStyles,
} from "./WalletTransactionRow.styles";

/* ============================================================
   TYPES
============================================================ */

export interface WalletTransactionRowProps {
  transaction:
    WalletTransaction;
}

/* ============================================================
   HELPERS
============================================================ */

function formatWalletOccurredAt(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/* ============================================================
   COMPONENT
============================================================ */

export default function WalletTransactionRow({
  transaction,
}: WalletTransactionRowProps) {
  const {
    tokens,
  } = useResponsive();

  const styles =
    createWalletTransactionRowStyles(tokens);

  const isCredit =
    transaction.direction === "CREDIT";

  const amount =
    `${isCredit ? "+" : "-"}${formatRupee(Math.abs(transaction.amount))}`;

  const subtitleParts = [
    transaction.referenceId,
    formatWalletOccurredAt(transaction.occurredAt),
  ].filter(Boolean);

  const subtitle =
    subtitleParts.join(" • ");

  return (
    <article style={styles.row}>
      <div style={styles.main}>
        <div style={styles.identity}>
          <p style={styles.title}>
            {isCredit ? (
              <ArrowDownLeft
                size={tokens.icon.sm}
                strokeWidth={2}
                aria-hidden="true"
              />
            ) : (
              <ArrowUpRight
                size={tokens.icon.sm}
                strokeWidth={2}
                aria-hidden="true"
              />
            )}

            {transaction.title}
          </p>

          {subtitle && (
            <p style={styles.subtitle}>
              {subtitle}
            </p>
          )}

          <p style={styles.status}>
            {transaction.status.toLowerCase()}
          </p>
        </div>

        <div style={styles.amountGroup}>
          <p
            style={
              isCredit
                ? styles.creditAmount
                : styles.debitAmount
            }
          >
            {amount}
          </p>

          <p style={styles.balance}>
            Avl. Bal {formatRupee(transaction.availableBalance)}
          </p>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   END
============================================================ */
