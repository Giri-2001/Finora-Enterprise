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

function formatWalletAmount(
  value: number,
): string {
  const safeValue =
    Number.isFinite(value)
      ? Math.abs(value)
      : 0;

  return `₹${safeValue.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatWalletBalance(
  value: number,
): string {
  const safeValue =
    Number.isFinite(value)
      ? value
      : 0;

  return `₹${safeValue.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

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
    `${isCredit ? "+" : "-"}${formatWalletAmount(transaction.amount)}`;

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
            Avl. Bal {formatWalletBalance(transaction.availableBalance)}
          </p>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   END
============================================================ */
