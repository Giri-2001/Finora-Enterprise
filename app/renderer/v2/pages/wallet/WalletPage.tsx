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
  cancelPendingSignedWalletRecharge,
  resumeSignedWalletRecharge,
  startWalletRecharge,
} from "../../services/wallet/walletRechargeOrchestrationService";
import {
  getPendingWalletRechargeIntentsForScope,
} from "../../services/wallet/walletPaymentIntentService";

import {
  convertWalletMoneyToMinorUnits,
} from "../../services/wallet/walletBalanceService";

import {
  getFinoraWalletRechargeRequestBridge,
} from "../../services/wallet/finoraWalletRechargeRequestBridge";

import {
  getSession,
} from "../../store/authStore";

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
  startFinoraProcessing,
  stopFinoraProcessing,
} from "../../components/common/feedback/finoraProcessing.service";

import {
  getWalletPageStyles,
} from "./WalletPage.styles";

/* ============================================================
   PROPS
============================================================ */

export interface WalletPageProps {
  scope:
    WalletScope;

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

    case "OTHER":
      return "MANUAL" as const;

    default:
      return "UPI" as const;
  }
}
/* ============================================================
   COMPONENT
============================================================ */

export default function WalletPage({
  scope,
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

  const [
    cancellingRecharge,
    setCancellingRecharge,
  ] = useState(
    false,
  );
  const [
    importingControlBundle,
    setImportingControlBundle,
  ] = useState(
    false,
  );

  const [
    downloadingRechargeRequest,
    setDownloadingRechargeRequest,
  ] = useState(
    false,
  );

  const [
    pendingRechargeReference,
    setPendingRechargeReference,
  ] = useState<string | null>(
    null,
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

          setPendingRechargeReference(
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

        let workspaceResult =
          result;

        const resumeResult =
          await resumeSignedWalletRecharge({
            walletId:
              workspaceResult.data.wallet.walletId,

            ownerId:
              scope.ownerId,

            businessId:
              scope.businessId,

            branchId:
              scope.branchId,
          });

        if (!resumeResult.success) {
          setSnapshot(
            null,
          );

          setPendingRechargeReference(
            null,
          );

          setError(
            resumeResult.error,
          );

          setLoading(
            false,
          );

          return;
        }

        if (resumeResult.completed) {
          const refreshedResult =
            await loadWalletWorkspace(
              scope,
            );

          if (!refreshedResult.success) {
            setSnapshot(
              null,
            );

            setPendingRechargeReference(
              null,
            );

            setError(
              refreshedResult.error,
            );

            setLoading(
              false,
            );

            return;
          }

          workspaceResult =
            refreshedResult;
        }
        const pendingResult =
          await getPendingWalletRechargeIntentsForScope({
            walletId:
              workspaceResult.data.wallet.walletId,

            ownerId:
              scope.ownerId,

            businessId:
              scope.businessId,

            branchId:
              scope.branchId,
          });

        if (!pendingResult.success) {
          setSnapshot(
            null,
          );

          setPendingRechargeReference(
            null,
          );

          setError(
            pendingResult.error,
          );

          setLoading(
            false,
          );

          return;
        }

        if (pendingResult.data.length > 1) {
          setSnapshot(
            null,
          );

          setPendingRechargeReference(
            null,
          );

          setError(
            "Multiple pending Wallet Recharge requests exist for this Wallet. Automatic selection is blocked.",
          );

          setLoading(
            false,
          );

          return;
        }

        const pendingIntent =
          pendingResult.data[0];

        const pendingPaymentReference =
          pendingIntent
            ? String(
                pendingIntent.paymentReference ?? "",
              ).trim()
            : "";

        if (pendingIntent && !pendingPaymentReference) {
          setSnapshot(
            null,
          );

          setPendingRechargeReference(
            null,
          );

          setError(
            "Pending Wallet Recharge request is missing its canonical payment reference.",
          );

          setLoading(
            false,
          );

          return;
        }

        setPendingRechargeReference(
          pendingPaymentReference || null,
        );

        setSnapshot(
          workspaceResult.data,
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

    setRecharging(
      true,
    );

    const processingId =
      startFinoraProcessing(
        "Processing Wallet Recharge...",
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

      setPendingRechargeReference(
        startResult.paymentReference,
      );
      await loadWorkspace();
    } finally {
      stopFinoraProcessing(
        processingId,
      );

      setRecharging(
        false,
      );
    }
  }

  /* ==========================================================
     DOWNLOAD SIGNED WALLET RECHARGE REQUEST
  ========================================================== */

  async function handleDownloadRechargeRequest():
    Promise<void> {

    if (
      !snapshot ||
      !pendingRechargeReference ||
      downloadingRechargeRequest
    ) {
      return;
    }

    setDownloadingRechargeRequest(
      true,
    );

    setError(
      null,
    );

    const processingId =
      startFinoraProcessing(
        "Preparing Wallet Recharge Request...",
      );

    try {

      /*
       * finora_session is only the renderer-held opaque bearer.
       *
       * The native request service independently validates this
       * sessionId against main-process session authority before
       * deriving any owner/business/branch/install identity.
       */
      const session =
        getSession();

      const sessionId =
        String(
          session?.sessionId ?? "",
        ).trim();

      if (!sessionId) {
        setError(
          "An active FINORA login session is required to download the Wallet Recharge Request.",
        );

        return;
      }

      /*
       * Re-read the durable pending intent at click time.
       *
       * Do not reconstruct amount/method/source from UI state.
       */
      const pendingResult =
        await getPendingWalletRechargeIntentsForScope({
          walletId:
            snapshot.wallet.walletId,

          ownerId:
            scope.ownerId,

          businessId:
            scope.businessId,

          branchId:
            scope.branchId,
        });

      if (!pendingResult.success) {
        setError(
          pendingResult.error,
        );

        return;
      }

      if (
        pendingResult.data.length !==
          1
      ) {
        setError(
          pendingResult.data.length === 0
            ? "No pending Wallet Recharge request is available to download."
            : "Multiple pending Wallet Recharge requests exist. Request export is blocked.",
        );

        return;
      }

      const pendingIntent =
        pendingResult.data[0];

      const paymentReference =
        String(
          pendingIntent.paymentReference ?? "",
        ).trim();

      if (
        !paymentReference ||
        paymentReference !==
          pendingRechargeReference
      ) {
        setError(
          "The durable Wallet Recharge request no longer matches the active pending payment reference.",
        );

        return;
      }

      const amountMinor =
        convertWalletMoneyToMinorUnits(
          pendingIntent.amount,
        );

      if (
        !Number.isSafeInteger(
          amountMinor,
        ) ||
        amountMinor <=
          0
      ) {
        setError(
          "The pending Wallet Recharge amount cannot be represented as canonical INR minor units.",
        );

        return;
      }

      const bridge =
        getFinoraWalletRechargeRequestBridge();

      if (!bridge) {
        setError(
          "Wallet Recharge Request download is not available in this runtime.",
        );

        return;
      }

      const exportResult =
        await bridge.exportWalletRechargeRequest({
          sessionId,

          paymentReference,

          amountMinor,

          paymentMethod:
            pendingIntent.paymentMethod,

          paymentSource:
            pendingIntent.paymentSource,
        });

      if (!exportResult.success) {
        setError(
          exportResult.error,
        );

        return;
      }

      if (exportResult.cancelled) {
        return;
      }

      if (
        exportResult.paymentReference !==
          paymentReference
      ) {
        setError(
          "The exported Wallet Recharge Request returned an unexpected payment reference.",
        );

        return;
      }

    } catch (error) {

      setError(
        error instanceof Error
          ? error.message
          : "Unable to download the Wallet Recharge Request.",
      );

    } finally {

      stopFinoraProcessing(
        processingId,
      );

      setDownloadingRechargeRequest(
        false,
      );
    }
  }

  /* ==========================================================
     IMPORT SIGNED RECHARGE AUTHORIZATION

     SECURITY:

     - Renderer never receives or supplies a filesystem path.
     - Native Control Bundle transport owns file selection.
     - Main process owns recipient trust + signature verification.
     - Wallet credit still occurs only through the existing
       signed Recharge resume / verification pipeline.
  ========================================================== */

  async function handleImportSignedRecharge():
    Promise<void> {

    if (
      importingControlBundle ||
      loading ||
      recharging ||
      cancellingRecharge
    ) {
      return;
    }

    setImportingControlBundle(
      true,
    );

    setError(
      null,
    );

    const processingId =
      startFinoraProcessing(
        "Importing Signed Wallet Recharge...",
      );

    try {

      const importControlBundle =
        window.finora?.control
          ?.importControlBundle;

      if (
        typeof importControlBundle !==
          "function"
      ) {
        setError(
          "FINORA signed Recharge import is unavailable in this application build.",
        );

        return;
      }

      const result =
        await importControlBundle();

      if (!result.success) {
        setError(
          result.error ??
            "Unable to import the signed FINORA Recharge package.",
        );

        return;
      }

      if (result.cancelled) {
        return;
      }

      /*
       * Import only establishes native-verified Control authority.
       *
       * loadWorkspace() then executes the existing
       * resumeSignedWalletRecharge() path, which requires the
       * exact pending payment intent / signed authorization match
       * before any Wallet financial mutation can occur.
       */
      await loadWorkspace();

    } catch (error) {

      setError(
        error instanceof Error
          ? error.message
          : "Unable to import the signed FINORA Recharge package.",
      );

    } finally {

      stopFinoraProcessing(
        processingId,
      );

      setImportingControlBundle(
        false,
      );
    }
  }

  /* ==========================================================
     CANCEL PENDING RECHARGE REQUEST
  ========================================================== */

  async function handleCancelPendingRecharge(): Promise<void> {
    if (
      !snapshot ||
      !pendingRechargeReference
    ) {
      return;
    }

    setCancellingRecharge(
      true,
    );

    setError(
      null,
    );

    const processingId =
      startFinoraProcessing(
        "Cancelling Wallet Recharge Request...",
      );

    try {
      const cancelResult =
        await cancelPendingSignedWalletRecharge({
          walletId:
            snapshot.wallet.walletId,

          ownerId:
            scope.ownerId,

          businessId:
            scope.businessId,

          branchId:
            scope.branchId,

          paymentReference:
            pendingRechargeReference,
        });

      if (!cancelResult.success) {
        setError(
          cancelResult.error,
        );

        return;
      }

      setPendingRechargeReference(
        null,
      );

      await loadWorkspace();
    } finally {
      stopFinoraProcessing(
        processingId,
      );

      setCancellingRecharge(
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
            disabled={
              loading ||
              recharging ||
              cancellingRecharge ||
              importingControlBundle
            }
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
                  Boolean(pendingRechargeReference)
                }
                submitting={recharging}
                onSubmit={handleRechargeRequest}
              />

              {pendingRechargeReference ? (
                <section style={styles.stateCard}>
                  <p style={styles.stateText}>
                    Wallet Recharge request is pending signed verification.
                  </p>

                  <p style={styles.stateText}>
                    Payment Reference:{" "}
                    <strong>
                      {pendingRechargeReference}
                    </strong>
                  </p>

                  <p style={styles.stateText}>
                    Apply the matching signed FINORA Recharge package, then refresh this Wallet.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void handleDownloadRechargeRequest();
                    }}
                    disabled={
                      downloadingRechargeRequest ||
                      importingControlBundle ||
                      cancellingRecharge ||
                      recharging ||
                      loading
                    }
                    style={styles.retryButton}
                  >
                    {downloadingRechargeRequest
                      ? "Downloading..."
                      : "Download Request File"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      void handleImportSignedRecharge();
                    }}
                    disabled={
                      downloadingRechargeRequest ||
                      importingControlBundle ||
                      cancellingRecharge ||
                      recharging ||
                      loading
                    }
                    style={styles.retryButton}
                  >
                    {importingControlBundle
                      ? "Importing..."
                      : "Import Signed Recharge"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      void handleCancelPendingRecharge();
                    }}
                    disabled={
                      downloadingRechargeRequest ||
                      cancellingRecharge ||
                      recharging ||
                      loading ||
                      importingControlBundle
                    }
                    style={styles.retryButton}
                  >
                    {cancellingRecharge
                      ? "Cancelling..."
                      : "Cancel Recharge Request"}
                  </button>
                </section>
              ) : null}
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


