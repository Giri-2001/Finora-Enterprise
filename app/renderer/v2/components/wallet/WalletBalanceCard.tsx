/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA WALLET™

   WALLET BALANCE CARD

   RESPONSIBILITY:
   - Display current FINORA Wallet balance
   - Display wallet status
   - Display wallet identity context
   - Presentation only

   IMPORTANT:
   - No persistence.
   - No balance calculations.
   - No recharge logic.
   - No debit logic.
============================================================ */

import {
  WalletCards,
} from "lucide-react";

import {
  useResponsive,
} from "../../utils/responsive";

import {
  createWalletBalanceCardStyles,
} from "./WalletBalanceCard.styles";

/* ============================================================
   TYPES
============================================================ */

export interface WalletBalanceCardProps {
  balance:
    number;

  status:
    string;

  walletId?:
    string;
}

/* ============================================================
   HELPERS
============================================================ */

function formatWalletCurrency(
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

/* ============================================================
   COMPONENT
============================================================ */

export default function WalletBalanceCard({
  balance,
  status,
  walletId,
}: WalletBalanceCardProps) {
  const {
    tokens,
  } = useResponsive();

  const styles =
    createWalletBalanceCardStyles(tokens);

  const normalizedStatus =
    String(status || "ACTIVE")
      .trim()
      .toUpperCase();

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div style={styles.identity}>
          <p style={styles.eyebrow}>
            FINORA Wallet
          </p>

          <h2 style={styles.title}>
            <WalletCards
              size={tokens.icon.md}
              strokeWidth={2}
              aria-hidden="true"
            />

            Available Balance
          </h2>
        </div>

        <span style={styles.status}>
          {normalizedStatus}
        </span>
      </div>

      <div style={styles.balanceGroup}>
        <p style={styles.balanceLabel}>
          Available Balance
        </p>

        <p style={styles.balance}>
          {formatWalletCurrency(balance)}
        </p>
      </div>

      {walletId && (
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Wallet ID: {walletId}
          </p>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   END
============================================================ */
