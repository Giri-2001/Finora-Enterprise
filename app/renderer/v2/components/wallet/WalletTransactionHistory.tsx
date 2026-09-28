/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA WALLET™

   WALLET TRANSACTION HISTORY

   RESPONSIBILITY:
   - Render Wallet transaction history
   - Render transaction count
   - Render transaction category filter
   - Render empty state
   - Presentation only

   IMPORTANT:
   - No persistence.
   - No sorting.
   - No financial calculations.
============================================================ */

import {
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

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

type WalletTransactionFilter =
  | "ALL"
  | "CUSTOMERS"
  | "LOANS"
  | "COLLECTIONS"
  | "RECHARGE";

export interface WalletTransactionHistoryProps {
  transactions:
    WalletTransaction[];

  headerAction?:
    ReactNode;
}

/* ============================================================
   FILTER
============================================================ */

function matchesTransactionFilter(
  transaction: WalletTransaction,
  filter: WalletTransactionFilter,
): boolean {
  if (filter === "ALL") {
    return true;
  }

  if (filter === "RECHARGE") {
    return (
      transaction.type ===
      "WALLET_RECHARGE"
    );
  }

  if (filter === "CUSTOMERS") {
    return (
      transaction.type ===
        "CUSTOMER_NUMBER_GENERATION_FEE" ||
      transaction.type ===
        "CUSTOMER_ID_CARD_GENERATION_FEE"
    );
  }

  if (filter === "LOANS") {
    return (
      transaction.type ===
        "LOAN_DISBURSEMENT_PLATFORM_FEE" ||
      transaction.type ===
        "LOAN_NUMBER_GENERATION_FEE"
    );
  }

  return (
    transaction.type ===
      "COLLECTION_PROCESSING_FEE" ||
    transaction.type ===
      "RECEIPT_PROCESSING_FEE"
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function WalletTransactionHistory({
  transactions,
  headerAction,
}: WalletTransactionHistoryProps) {
  const {
    tokens,
  } = useResponsive();

  const styles =
    createWalletTransactionHistoryStyles(tokens);

  const [
    transactionFilter,
    setTransactionFilter,
  ] = useState<WalletTransactionFilter>(
    "ALL",
  );

  const filteredTransactions =
    useMemo(
      () =>
        transactions.filter(
          (transaction) =>
            matchesTransactionFilter(
              transaction,
              transactionFilter,
            ),
        ),
      [
        transactions,
        transactionFilter,
      ],
    );

  const transactionCount =
    filteredTransactions.length;

  const isMobile =
    tokens.meta.viewport === "mobile";

  const filterStyle = {
    width:
      isMobile
        ? "100%"
        : "auto",

    minWidth:
      isMobile
        ? 0
        : 132,

    minHeight:
      tokens.button.height,

    padding:
      `0 ${tokens.button.paddingX}px`,

    border:
      "1px solid var(--finora-theme-border-default)",

    borderRadius:
      tokens.button.radius,

    outline:
      "none",

    background:
      "var(--finora-theme-background-surface-muted)",

    color:
      "var(--finora-theme-text-primary)",

    fontSize:
      tokens.button.fontSize,

    fontWeight:
      650,

    lineHeight:
      1,

    cursor:
      "pointer",

    boxSizing:
      "border-box" as const,
  };

  const mobileActionWrapperStyle = {
    width:
      isMobile
        ? "100%"
        : "auto",

    minWidth:
      0,

    display:
      "flex",
  };

  return (
    <section style={styles.section}>
      <header
        style={{
          ...styles.header,

          ...(isMobile
            ? {
                alignItems:
                  "stretch",

                flexDirection:
                  "column" as const,
              }
            : {}),
        }}
      >
        <div style={styles.headingGroup}>
          <h2 style={styles.title}>
            <History
              size={tokens.icon.md + 2}
              strokeWidth={2}
              aria-hidden="true"
            />

            Wallet Transactions
          </h2>

          <p style={styles.subtitle}>
            Recharge and FINORA platform charge history
          </p>
        </div>

        <div
          style={{
            ...styles.headerActions,

            ...(isMobile
              ? {
                  width:
                    "100%",

                  flexDirection:
                    "column" as const,

                  alignItems:
                    "stretch",
                }
              : {}),
          }}
        >
          <select
            aria-label="Filter Wallet transactions"
            value={transactionFilter}
            onChange={(event) => {
              setTransactionFilter(
                event.target
                  .value as WalletTransactionFilter,
              );
            }}
            style={filterStyle}
          >
            <option value="ALL">
              All
            </option>

            <option value="CUSTOMERS">
              Customers
            </option>

            <option value="LOANS">
              Loans
            </option>

            <option value="COLLECTIONS">
              Collections
            </option>

            <option value="RECHARGE">
              Recharge
            </option>
          </select>

          <div
            style={
              mobileActionWrapperStyle
            }
          >
            {headerAction}
          </div>

          <span
            style={{
              ...styles.count,

              ...(isMobile
                ? {
                    width:
                      "100%",

                    boxSizing:
                      "border-box" as const,
                  }
                : {}),
            }}
          >
            {transactionCount}
          </span>
        </div>
      </header>

      {transactionCount > 0 ? (
        <div style={styles.list}>
          {filteredTransactions.map(
            (transaction) => (
              <WalletTransactionRow
                key={transaction.id}
                transaction={transaction}
              />
            ),
          )}
        </div>
      ) : (
        <div style={styles.empty}>
          <History
            size={tokens.icon.lg}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <p style={styles.emptyTitle}>
            {transactionFilter === "ALL"
              ? "No wallet transactions yet"
              : "No matching wallet transactions"}
          </p>

          <p style={styles.emptyText}>
            {transactionFilter === "ALL"
              ? "Wallet recharges and FINORA platform charges will appear here."
              : "No transactions are available for the selected filter."}
          </p>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   END
============================================================ */