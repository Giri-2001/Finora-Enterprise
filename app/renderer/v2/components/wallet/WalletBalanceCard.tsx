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
  formatRupee,
} from "../../utils/currency/formatCurrency";

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
              size={tokens.icon.md + 2}
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
        <p style={styles.balance}>
          {formatRupee(balance)}
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
