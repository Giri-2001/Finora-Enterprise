/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA WALLET™

   WALLET PAGE

   RESPONSIBILITY:
   - Load FINORA Wallet workspace snapshot
   - Render Wallet balance
   - Render recharge panel
   - Render Wallet transaction history
   - Refresh Wallet workspace
   - Keep persistence behind Wallet services

   IMPORTANT:
   - No direct repository access.
   - No direct StorageManager access.
   - No payment gateway execution.
   - No direct Wallet balance mutation.
   - Recharge verification wiring is handled by payment flow.
============================================================ */

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  RefreshCw,
  WalletCards,
} from "lucide-react";

import type {
  WalletScope,
} from "../../types/wallet/wallet.types";

import type {
  WalletWorkspaceSnapshot,
} from "../../services/wallet/walletWorkspaceService";

import {
  loadWalletWorkspace,
} from "../../services/wallet/walletWorkspaceService";

import {
  startWalletRecharge,
} from "../../services/wallet/walletRechargeOrchestrationService";

import {
  buildWalletPaymentReference,
} from "../../services/wallet/walletPaymentReference";

import {
  useResponsive,
} from "../../utils/responsive";

import WalletBalanceCard from "../../components/wallet/WalletBalanceCard";

import WalletRechargePanel from "../../components/wallet/WalletRechargePanel";

import type {
  WalletRechargePanelSubmitInput,
} from "../../components/wallet/WalletRechargePanel";

import WalletTransactionHistory from "../../components/wallet/WalletTransactionHistory";

import {
  getWalletPageStyles,
} from "./WalletPage.styles";

/* ============================================================
   PROPS
============================================================ */

export interface WalletPageProps {
  scope:
    WalletScope;

  onRechargeRequest?:
    (
      input: WalletRechargePanelSubmitInput,
    ) => void | Promise<void>;
}

/* ============================================================
   PAYMENT SOURCE
============================================================ */

function resolvePaymentSource(
  paymentMethod: WalletRechargePanelSubmitInput["paymentMethod"],
) {
  switch (paymentMethod) {
    case "PHONEPE":
      return "PHONEPE" as const;

    case "GOOGLE_PAY":
      return "GOOGLE_PAY" as const;

    case "PAYTM":
      return "PAYTM" as const;

    default:
      return "UPI" as const;
  }
}
/* ============================================================
   COMPONENT
============================================================ */

export default function WalletPage({
  scope,
  onRechargeRequest,
}: WalletPageProps) {
  const {
    tokens,
    isMobile,
    isTablet,
    isLaptop,
    isDesktop,
  } = useResponsive();

  const styles =
    getWalletPageStyles({
      tokens,
      isMobile,
      isTablet,
      isLaptop,
      isDesktop,
    });

  const [
    snapshot,
    setSnapshot,
  ] = useState<WalletWorkspaceSnapshot | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    recharging,
    setRecharging,
  ] = useState(
    false,
  );

  /* ==========================================================
     LOAD
  ========================================================== */

  const loadWorkspace =
    useCallback(
      async (): Promise<void> => {
        setLoading(
          true,
        );

        setError(
          null,
        );

        const result =
          await loadWalletWorkspace(
            scope,
          );

        if (!result.success) {
          setSnapshot(
            null,
          );

          setError(
            result.error,
          );

          setLoading(
            false,
          );

          return;
        }

        setSnapshot(
          result.data,
        );

        setLoading(
          false,
        );
      },
      [
        scope.ownerId,
        scope.businessId,
        scope.branchId,
      ],
    );

  useEffect(
    () => {
      void loadWorkspace();
    },
    [
      loadWorkspace,
    ],
  );

  /* ==========================================================
     RECHARGE REQUEST
  ========================================================== */

  async function handleRechargeRequest(
    input: WalletRechargePanelSubmitInput,
  ): Promise<void> {
    if (!snapshot) {
      return;
    }

    if (!onRechargeRequest) {
      setError(
        "Online Wallet recharge is unavailable until a verified payment provider is configured.",
      );

      return;
    }

    setRecharging(
      true,
    );

    setError(
      null,
    );

    try {
      const paymentReference =
        buildWalletPaymentReference({
          walletId:
            snapshot.wallet.walletId,

          paymentMethod:
            input.paymentMethod,
        });

      const startResult =
        await startWalletRecharge({
          walletId:
            snapshot.wallet.walletId,

          ownerId:
            scope.ownerId,

          businessId:
            scope.businessId,

          branchId:
            scope.branchId,

          amount:
            input.amount,

          paymentMethod:
            input.paymentMethod,

          paymentSource:
            resolvePaymentSource(
              input.paymentMethod,
            ),

          paymentReference,
        });

      if (!startResult.success) {
        setError(
          startResult.error,
        );

        return;
      }

      if (onRechargeRequest) {
        await onRechargeRequest(
          input,
        );
      }

      await loadWorkspace();
    } finally {
      setRecharging(
        false,
      );
    }
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main style={styles.page}>
      <div style={styles.pageInner}>
        <header style={styles.header}>
          <div style={styles.headingGroup}>
            <p style={styles.eyebrow}>
              FINORA Wallet
            </p>

            <h1 style={styles.title}>
              <WalletCards
                size={tokens.icon.lg}
                strokeWidth={2}
                aria-hidden="true"
              />

              Wallet
            </h1>

            <p style={styles.subtitle}>
              Recharge when required and let FINORA
              automatically deduct applicable platform charges
              from the available balance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadWorkspace();
            }}
            disabled={loading}
            aria-label="Refresh FINORA Wallet"
            style={styles.refreshButton}
          >
            <RefreshCw
              size={tokens.icon.sm}
              strokeWidth={2}
              aria-hidden="true"
            />

            Refresh
          </button>
        </header>

        {error ? (
          <section style={styles.stateCard}>
            <p style={styles.stateText}>
              {error}
            </p>

            <button
              type="button"
              onClick={() => {
                void loadWorkspace();
              }}
              style={styles.retryButton}
            >
              Try Again
            </button>
          </section>
        ) : loading && !snapshot ? (
          <section style={styles.stateCard}>
            <p style={styles.stateText}>
              Loading FINORA Wallet...
            </p>
          </section>
        ) : snapshot ? (
          <div style={styles.workspace}>
            <div style={styles.primaryColumn}>
              <WalletBalanceCard
                balance={snapshot.wallet.balance}
                status={snapshot.wallet.status}
                walletId={snapshot.wallet.walletId}
              />

              <WalletRechargePanel
                disabled={
                  snapshot.wallet.status !== "ACTIVE" ||
                  !onRechargeRequest
                }
                submitting={recharging}
                onSubmit={handleRechargeRequest}
              />
            </div>

            <div style={styles.secondaryColumn}>
              <WalletTransactionHistory
                transactions={snapshot.transactions}
              />
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

/* ============================================================
   END
============================================================ */


