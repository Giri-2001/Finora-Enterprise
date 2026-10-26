import ServerWalletLiveHistory from "../../components/wallet/ServerWalletLiveHistory";
import { getFinoraAndroidPricing } from "../../services/wallet/finoraAndroidWalletReads";
import {
  isFinoraAndroidWallet,
  getFinoraAndroidWalletBalance,
} from "../../services/wallet/finoraAndroidWalletBridge";
import { formatFinoraDateTime } from "../../../shared/finoraDateTimeDisplay";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../themes/provider";
import type { CSSProperties, FormEvent } from "react";
import { Wallet, RefreshCw, LogOut, ShieldCheck, KeyRound, Eye, EyeOff, Sparkles, Crown, CalendarDays, Clock3, Repeat2, BadgeCheck } from "lucide-react";
import {
  getFinoraServerWalletBridge,
} from "../../services/wallet/finoraServerWalletBridge";
import type {
  ServerWalletBalance,
  ServerWalletRechargeInput,
  ServerWalletRechargeReceipt,
} from "../../services/wallet/finoraServerWalletBridge";
import {
  endFinoraServerWalletAccess,
} from "../../services/wallet/finoraServerWalletExit";


const messages: Record<string, string> = {
  UNAUTHORIZED: "Sign in to access your server wallet.",
  KEY_ENROLLMENT_REQUIRED: "Enable wallet access on this device, then sign in.",
  RATE_LIMITED: "Too many attempts. Please wait before trying again.",
  INVALID_REQUEST: "Check your credentials and try again.",
  SERVER_REJECTED: "Wallet authentication was rejected. Check your credentials.",
  WALLET_IDENTITY_AUTHENTICATION_FAILED: "Check your username, password and security code.",
  WALLET_NOT_FOUND: "Your server wallet is not available. Contact support.",
  STALE_OPERATION: "Wallet access changed. Please sign in again.",
};
function explain(code: string): string {
  return messages[code] ?? (
    import.meta.env.DEV
      ? `Server wallet unavailable [${code}].`
      : "Server wallet is unavailable. Please try again."
  );
}
function validBalance(value: ServerWalletBalance): boolean {
  return !!value &&
    value.source === "POSTGRESQL_WALLETS" &&
    value.currency === "INR" &&
    typeof value.balanceInr === "string" &&
    /^(0|[1-9][0-9]{0,9})\.[0-9]{2}$/.test(value.balanceInr) &&
    typeof value.walletId === "string" &&
    /^[0-9]{8,12}$/.test(value.walletId) &&
    typeof value.updatedAt === "string" &&
    Number.isFinite(Date.parse(value.updatedAt));
}

function validReceipt(
  value: ServerWalletRechargeReceipt,
  expected: { walletId: string; input: ServerWalletRechargeInput },
): boolean {
  const request = value?.request;
  return !!request &&
    value.source === "POSTGRESQL_RECHARGE_REQUESTS" &&
    typeof value.replayed === "boolean" &&
    typeof request.requestId === "string" &&
    request.requestId.length === 36 &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request.requestId) &&
    request.walletId === expected.walletId &&
    request.amountInr === expected.input.amountInr.toFixed(2) &&
    request.paymentMethod === expected.input.paymentMethod &&
    ["PENDING", "APPROVED", "DECLINED"].includes(request.status) &&
    (value.replayed || request.status === "PENDING") &&
    typeof request.createdAt === "string" &&
    request.createdAt.length <= 40 &&
    Number.isFinite(Date.parse(request.createdAt));
}

/* FINORA_P565B_STATUS - server-sourced subscription state only */

type FinoraSubscriptionView = {
  planMonths: number;
  status: string;
  expiresAt: string | null;
  startsAt?: string | null;
};

function finoraSubscriptionBadge(
  subscription: FinoraSubscriptionView,
): { label: string; tone: "success" | "warning" | "danger" | "neutral" } {
  const expiry = subscription.expiresAt
    ? new Date(subscription.expiresAt)
    : null;

  if (!expiry || !Number.isFinite(expiry.getTime())) {
    return { label: "STATUS UNAVAILABLE", tone: "neutral" };
  }

  const now = Date.now();
  const remaining = expiry.getTime() - now;
  const dayMs = 86400000;

  if (remaining <= 0) {
    const daysAgo = Math.floor(Math.abs(remaining) / dayMs);

    return {
      label: daysAgo < 1
        ? "EXPIRED TODAY"
        : `EXPIRED ${daysAgo} DAY${daysAgo === 1 ? "" : "S"} AGO`,
      tone: "danger",
    };
  }

  const daysLeft = Math.ceil(remaining / dayMs);

  if (daysLeft <= 1) {
    return { label: "EXPIRING TODAY", tone: "warning" };
  }

  if (daysLeft <= 7) {
    return {
      label: `EXPIRING IN ${daysLeft} DAYS`,
      tone: "warning",
    };
  }

  return { label: "ACTIVE", tone: "success" };
}

function finoraSubscriptionBadgeColors(
  tone: "success" | "warning" | "danger" | "neutral",
): { background: string; color: string } {
  switch (tone) {
    case "success":
      return { background: "#065F46", color: "#FFFFFF" };
    case "warning":
      return { background: "#92400E", color: "#FFFFFF" };
    case "danger":
      return { background: "#991B1B", color: "#FFFFFF" };
    default:
      return { background: "#334155", color: "#FFFFFF" };
  }
}
function finoraPlanCountdown(
  expiryValue: string | null,
  now: number,
): string {
  if (!expiryValue) return "Expiry unavailable";

  const expiry = Date.parse(expiryValue);
  if (!Number.isFinite(expiry)) return "Expiry unavailable";

  const difference = expiry - now;
  const absolute = Math.abs(difference);

  if (absolute < 60_000) {
    return difference > 0
      ? "Less than 1 minute remaining"
      : "Expired less than 1 minute ago";
  }

  if (absolute < 86_400_000) {
    const totalMinutes = Math.floor(absolute / 60_000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const clock = `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;

    return difference > 0
      ? `${clock} remaining`
      : `Expired ${clock} ago`;
  }

  const days = difference > 0
    ? Math.ceil(absolute / 86_400_000)
    : Math.floor(absolute / 86_400_000);

  return difference > 0
    ? `Expires in ${days} days`
    : `Expired ${days} day${days === 1 ? "" : "s"} ago`;
}
export default function ServerWalletPage({
  username,
}: {
  username: string;
}) {
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [previewPlan, setPreviewPlan] = useState(1);
  // FINORA_P1_634J_PURCHASE_REVIEW
  const [purchaseReviewOpen, setPurchaseReviewOpen] = useState(false);
  // FINORA_P1_647C_PURCHASE_UI_GATE
  // Never activate real money movement before release verification.
  const purchaseUiEnabled = true;
  // FINORA_P1_647J_SUCCESS_LOCK
  const purchaseSettled = useRef(false);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState("");
  // FINORA_P1_648D_PENDING_UI
  // Fail closed until Main Process verifies pending purchase state.
  const [pendingPurchase, setPendingPurchase] = useState<{
    state: "CHECKING" | "CLEAR" | "PENDING" | "UNAVAILABLE";
    planMonths: 1 | 3 | 6 | 12 | null;
  }>({ state: "CHECKING", planMonths: null });
  const purchaseIntent = useRef<{
    walletId: string;
    planMonths: 1 | 3 | 6 | 12;
    idempotencyKey: string;
  } | null>(null);
  const [planClock, setPlanClock] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(
      () => setPlanClock(Date.now()),
      60_000,
    );
    return () => window.clearInterval(timer);
  }, []);
  // FINORA_P565N3B_PRICING
  const [livePricing, setLivePricing] = useState<{
    plans: Array<{
      months: number;
      regularPriceInr: string;
      offerPriceInr: string;
      fees: Record<string, string>;
    }>;
  } | null>(null);
  const [subscription, setSubscription] =
    useState<FinoraSubscriptionView | null>(null);
  const [pricingUnavailable, setPricingUnavailable] = useState(true);
  const [previewRenewMonths, setPreviewRenewMonths] = useState<number | null>(null);
  const [showSecurityCode, setShowSecurityCode] = useState(false);

  const panel: CSSProperties = {
    padding: "clamp(16px, 2vw, 28px)",
    border: `1px solid ${theme.components.card.border}`,
    borderRadius: 18,
    background: theme.components.card.background,
    color: theme.colors.text.primary,
    boxShadow: theme.components.card.shadow,
  };

  const button: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    padding: "10px 16px",
    borderRadius: 10,
    border: `1px solid ${theme.components.card.border}`,
    background: theme.components.card.background,
    color: theme.colors.text.primary,
    font: "inherit",
    cursor: "pointer",
  };

  const field: CSSProperties = {
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0,
    minHeight: 44,
    padding: "10px 12px",
    marginTop: 6,
    borderRadius: 9,
    border: `1px solid ${theme.components.card.border}`,
    background: theme.colors.background.page,
    color: theme.colors.text.primary,
    font: "inherit",
  };

  const eyeButton: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 7,
    top: "calc(50% + 3px)",
    transform: "translateY(-50%)",
    width: 38,
    height: 36,
    padding: 0,
    borderRadius: 8,
    border: `1px solid ${theme.components.card.border}`,
    background: theme.components.card.background,
    color: theme.colors.text.primary,
    cursor: "pointer",
  };
  const [password, setPassword] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [balance, setBalance] = useState<ServerWalletBalance | null>(null);

  // FINORA_P1_582F_VERIFIED_HEADER: notification only; no trusted amount in event.
  useEffect(() => {
    if (!balance || !validBalance(balance)) return;
    window.dispatchEvent(
      new Event("finora:verified-wallet-balance-refresh"),
    );
  }, [balance?.walletId, balance?.balanceInr]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Sign in to view your server wallet.");
  const [failed, setFailed] = useState(false);
  const [available, setAvailable] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<ServerWalletRechargeInput["paymentMethod"]>("PHONEPE");
  const [rechargeMessage, setRechargeMessage] = useState("");
  const [rechargeFailed, setRechargeFailed] = useState(false);
  const [receipt, setReceipt] = useState<ServerWalletRechargeReceipt | null>(null);
  const [hasIntent, setHasIntent] = useState(false);
  // FINORA_P1_722L_ANDROID_SAFETY
  const androidBalanceOnly = isFinoraAndroidWallet();
  const rechargeIntent = useRef<{
    walletId: string;
    input: ServerWalletRechargeInput;
  } | null>(null);
  const operation = useRef(0);
  const running = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    setAvailable(getFinoraServerWalletBridge() !== null);

    // FINORA_P573B_AUTO_WALLET
    // The Main Login has already attempted a server-scoped handoff.
    // No Wallet credentials, local balance or fallback pricing.
    const ticket = ++operation.current;

    void (async () => {
      // FINORA_P1_722J_ANDROID_BALANCE_UI
      // Read-only native balance. No purchase or recharge authority.
      if (isFinoraAndroidWallet()) {
        setAvailable(true);
        setBusy(true);
        setMessage("Verifying Android Wallet with FINORA server...");

        try {
          const result = await getFinoraAndroidWalletBalance();

          if (!mounted.current || operation.current !== ticket) return;

          setSubscription(null);
          setLivePricing(null);
          setPricingUnavailable(true);
          setPendingPurchase({
            state: "UNAVAILABLE",
            planMonths: null,
          });

          if (result.success && validBalance(result.data)) {
            setBalance(result.data);
            setFailed(false);
            // FINORA_P1_723K_PRICING
            // Server-authenticated branch subscription only.
            setMessage("Verified PostgreSQL Wallet balance loaded.");

            const pricing = await getFinoraAndroidPricing();

            if (!mounted.current || operation.current !== ticket) return;

            if (pricing.success) {
              setLivePricing({ plans: pricing.data.plans });

              const current = pricing.data.currentSubscription;
              const planMatch = current?.planCode.match(
                /^SUBSCRIPTION_(1|3|6|12)_MONTHS?$/
              );

              const months = current?.selectedPlanMonths ??
                (planMatch ? Number(planMatch[1]) : null);

              const validCurrent = !!current &&
                current.status === "ACTIVE" &&
                [1, 3, 6, 12].includes(months ?? 0) &&
                pricing.data.plans.some(p => p.months === months) &&
                Number.isFinite(Date.parse(current.startsAt)) &&
                Number.isFinite(Date.parse(current.expiresAt)) &&
                Number.isFinite(Date.parse(current.serverNow)) &&
                Date.parse(current.startsAt) <= Date.parse(current.serverNow) &&
                Date.parse(current.expiresAt) > Date.parse(current.serverNow);

              setSubscription(validCurrent ? {
                planMonths: months as number,
                status: current!.status,
                startsAt: current!.startsAt,
                expiresAt: current!.expiresAt,
              } : null);

              setPricingUnavailable(false);
              setMessage("Wallet and subscription verified by FINORA server.");
            } else {
              setSubscription(null);
              setLivePricing(null);
              setPricingUnavailable(true);
              setMessage(
                "Wallet verified. Subscription verification unavailable."
              );
            }
          } else {
            setBalance(null);
            setFailed(true);
            setMessage("Android Wallet verification unavailable.");
          }
        } catch {
          if (mounted.current && operation.current === ticket) {
            setBalance(null);
            setFailed(true);
            setMessage("Android Wallet server unavailable.");
          }
        } finally {
          if (mounted.current && operation.current === ticket) {
            setBusy(false);
          }
        }
        return;
      }

      const bridge = getFinoraServerWalletBridge();

      if (!bridge) {
        if (mounted.current && operation.current === ticket) {
          setFailed(true);
          setMessage("Server Wallet is unavailable in this build.");
        }
        return;
      }

      setBusy(true);
      setMessage("Verifying your branch wallet with FINORA server...");

      try {
        const result = await bridge.balance();

        if (!mounted.current || operation.current !== ticket) return;

        if (!result.success || !validBalance(result.data)) {
          setBalance(null);
          setLivePricing(null);
          setPricingUnavailable(true);
          setFailed(true);
          setMessage(
            !result.success
              ? explain(result.errorCode)
              : "Server returned an invalid Wallet balance."
          );
          return;
        }

        setBalance({
          source: result.data.source,
          walletId: result.data.walletId,
          balanceInr: result.data.balanceInr,
          currency: result.data.currency,
          updatedAt: result.data.updatedAt,
        });

        setFailed(false);
        setMessage("Verified branch Wallet loaded from FINORA server.");

        const prices = await bridge.pricing();

        if (!mounted.current || operation.current !== ticket) return;

        if (
          prices.success &&
          prices.data.source === "FINORA_POSTGRESQL_PRICING" &&
          Array.isArray(prices.data.plans) &&
          prices.data.plans.length === 4
        ) {
          setLivePricing({ plans: prices.data.plans });

          // P1-665T: Current plan comes only from authenticated
          // server pricing, never a local guessed subscription.
          const current = prices.data.currentSubscription;

          // P1-665U: Recognize verified planCode when
          // selectedPlanMonths is absent in the server response.
          const planCodeMonths = current?.planCode.match(
            /^SUBSCRIPTION_(1|3|6|12)_MONTHS?$/
          );

          const months = current?.selectedPlanMonths ??
            (planCodeMonths ? Number(planCodeMonths[1]) : null);

          const validCurrent = !!current &&
            current.status === "ACTIVE" &&
            [1, 3, 6, 12].includes(months ?? 0) &&
            prices.data.plans.some(plan => plan.months === months) &&
            Number.isFinite(Date.parse(current.startsAt)) &&
            Number.isFinite(Date.parse(current.expiresAt)) &&
            Number.isFinite(Date.parse(current.serverNow)) &&
            Date.parse(current.startsAt) <= Date.parse(current.serverNow) &&
            Date.parse(current.expiresAt) > Date.parse(current.serverNow);

          setSubscription(validCurrent ? {
            planMonths: months as number,
            status: current!.status,
            startsAt: current!.startsAt,
            expiresAt: current!.expiresAt,
          } : null);

          setPricingUnavailable(false);
        } else {
          setLivePricing(null);
          setPricingUnavailable(true);
          setMessage(
            "Server Wallet verified. Subscription pricing is unavailable."
          );
        }

        // FINORA_P1_648D_PENDING_UI
        // Read-only IPC; UUID and Wallet identity remain in Main.
        const pendingResult = await bridge.subscriptionPending();
        if (!mounted.current || operation.current !== ticket) return;

        if (pendingResult.success) {
          setPendingPurchase({
            state: pendingResult.data.pending ? "PENDING" : "CLEAR",
            planMonths: pendingResult.data.planMonths,
          });
        } else {
          setPendingPurchase({
            state: "UNAVAILABLE",
            planMonths: null,
          });
        }
      } catch {
        if (mounted.current && operation.current === ticket) {
          setPendingPurchase({
            state: "UNAVAILABLE",
            planMonths: null,
          });
          setBalance(null);
          setLivePricing(null);
          setPricingUnavailable(true);
          setFailed(true);
          setMessage("Unable to verify the server Wallet. Please retry.");
        }
      } finally {
        if (mounted.current && operation.current === ticket) {
          setBusy(false);
        }
      }
    })();

    // FINORA P1-571M:
    // Pricing requires an authenticated server Wallet session.
    // Fetch after successful balance verification, not on mount.
    return () => {
      mounted.current = false;
      operation.current++;
// FINORA_P1_579RV_NO_UNMOUNT_LOGOUT
      // Cancel screen-local requests only (operation.current above).
      // Unmount/StrictMode cleanup must not revoke an authenticated
      // Main-Login Wallet Proof session.
      // Explicit Wallet logout and business transitions remain authoritative.
    };
  }, []);

  async function run(kind: "signIn" | "enroll" | "balance" | "logout") {
    if (running.current) return;
    running.current = true;
    const ticket = ++operation.current;
    const current = () => mounted.current && operation.current === ticket;
    setBusy(true);
    setBalance(null);

    // FINORA_P1_648L_LIFECYCLE
    // Never retain another session's purchase state during verification.
    // Keep Main's encrypted pending intent untouched.
    setPendingPurchase({ state: "CHECKING", planMonths: null });
    setPurchaseReviewOpen(false);
    setPurchaseMessage("");

    if (kind === "signIn" || kind === "enroll" || kind === "logout") {
      purchaseIntent.current = null;
    }

    if (kind === "signIn" || kind === "enroll" || kind === "logout") {
      setLivePricing(null);
      setPricingUnavailable(true);
    }

    setFailed(false);
    setMessage("Please wait...");

    const credentials = { username, password, securityCode };
    if (kind === "signIn" || kind === "enroll" || kind === "logout") {
      setReceipt(null);
      setRechargeMessage("");
      setPassword("");
      setSecurityCode("");
      setShowPassword(false);
      setShowSecurityCode(false);
    }

    try {
      // FINORA_P1_722N_ANDROID_REFRESH
      if (androidBalanceOnly) {
        if (kind !== "balance") {
          if (current()) {
            setFailed(true);
            setMessage("Android Wallet action unavailable.");
          }
          return;
        }

        const result = await getFinoraAndroidWalletBalance();

        if (!current()) return;

        setSubscription(null);
        setLivePricing(null);
        setPricingUnavailable(true);
        setPendingPurchase({
          state: "UNAVAILABLE",
          planMonths: null,
        });

        if (!result.success || !validBalance(result.data)) {
          setBalance(null);
          setFailed(true);
          setMessage("Android Wallet verification failed.");
          return;
        }

        setAvailable(true);
        setBalance(result.data);
        setFailed(false);
        setMessage("Verified PostgreSQL Wallet balance refreshed.");
        return;
      }

      const bridge = getFinoraServerWalletBridge();
      if (!bridge) {
        setAvailable(false);
        throw new Error("BRIDGE_UNAVAILABLE");
      }

      if (kind === "logout") {
        const result = await endFinoraServerWalletAccess();
        if (!current()) return;
        setFailed(!result.localCleared);
        setMessage(
          !result.localCleared
            ? "Unable to confirm local sign-out. Please try again."
            : result.serverStatus === "REVOKED"
              ? "Wallet signed out."
              : result.serverStatus === "NO_LOCAL_SESSION"
                ? "No active local wallet session."
                : "Wallet access cleared on this device. Server sign-out could not be confirmed.",
        );
        return;
      }

      if (kind === "enroll") {
        const result = await bridge.enroll(credentials);
        if (!current()) return;
        setFailed(!result.success);
        setMessage(result.success
          ? "Wallet access enabled. Enter your credentials again to sign in."
          : explain(result.errorCode));
        return;
      }

      if (kind === "signIn") {
        const result = await bridge.signIn(credentials);
        if (!current()) return;
        if (!result.success) {
          setFailed(true);
          setMessage(explain(result.errorCode));
          return;
        }
      }

      const result = await bridge.balance();
      if (!current()) return;
      if (!result.success) {
        setFailed(true);
        setMessage(explain(result.errorCode));
        return;
      }
      if (!validBalance(result.data)) throw new Error("INVALID_SERVER_RESPONSE");

      setBalance({
        source: result.data.source, walletId: result.data.walletId,
        balanceInr: result.data.balanceInr, currency: result.data.currency,
        updatedAt: result.data.updatedAt,
      });
      setMessage("Balance received from the FINORA server.");

      // FINORA P1-571M:
      // Read pricing using the existing authenticated Wallet
      // session. Never use local fallback prices.
      try {
        const pricingResult = await bridge.pricing();

        if (!current()) return;

        if (
          pricingResult.success &&
          pricingResult.data.source === "FINORA_POSTGRESQL_PRICING" &&
          Array.isArray(pricingResult.data.plans) &&
          pricingResult.data.plans.length === 4
        ) {
          setLivePricing({
            plans: pricingResult.data.plans,
          });
          setPricingUnavailable(false);
        } else {
          setLivePricing(null);
          setPricingUnavailable(true);
        }
      } catch {
        if (current()) {
          setLivePricing(null);
          setPricingUnavailable(true);
        }
      }
      // FINORA_P1_648L_LIFECYCLE
      // Only trusted Main Process decides current branch pending status.
      // Status failure always blocks starting or resuming a purchase.
      const pendingResult = await bridge.subscriptionPending();
      if (!current()) return;

      if (pendingResult.success) {
        setPendingPurchase({
          state: pendingResult.data.pending ? "PENDING" : "CLEAR",
          planMonths: pendingResult.data.planMonths,
        });
      } else {
        setPendingPurchase({
          state: "UNAVAILABLE",
          planMonths: null,
        });
      }
    } catch {
      if (current()) {
        setPendingPurchase({
          state: "UNAVAILABLE",
          planMonths: null,
        });
        setBalance(null);
        setFailed(true);
        setMessage("Server wallet is unavailable. Please try again.");
      }
    } finally {
      running.current = false;
      if (current()) setBusy(false);
    }
  }

  // FINORA_P1_648H_RESUME_UI
  // Explicit confirmation only. Original UUID stays in Main Process.
  async function resumePendingSubscriptionPurchase() {
    if (androidBalanceOnly) return;
    if (!purchaseUiEnabled ||
        pendingPurchase.state !== "PENDING" ||
        !purchaseReviewOpen || purchaseSettled.current ||
        running.current || purchaseBusy || busy || !available ||
        !balance || !validBalance(balance) ||
        pricingUnavailable ||
        pendingPurchase.planMonths !== previewPlan) return;

    const selectedPlan = livePricing?.plans.find(
      plan => plan.months === pendingPurchase.planMonths
    );
    const price = selectedPlan
      ? Number(selectedPlan.offerPriceInr) : NaN;
    if (!Number.isFinite(price) || price <= 0) return;

    running.current = true;
    setPurchaseBusy(true);
    setBusy(true);
    setPurchaseMessage("Resuming original pending purchase...");

    const walletId = balance.walletId;
    const ticket = ++operation.current;
    const current = () =>
      mounted.current && operation.current === ticket;

    try {
      const bridge = getFinoraServerWalletBridge();
      if (!bridge) throw new Error("BRIDGE_UNAVAILABLE");

      const pending = await bridge.subscriptionPending();
      if (!current()) return;

      if (!pending.success || !pending.data.pending ||
          pending.data.planMonths !== previewPlan) {
        setPendingPurchase({
          state: "UNAVAILABLE",
          planMonths: null,
        });
        setPurchaseMessage(
          "Pending purchase not verified. No payment was sent."
        );
        return;
      }

      const result = await bridge.subscriptionResume();
      if (!current()) return;

      if (!result.success) {
        setPurchaseMessage(
          "Purchase outcome not confirmed (" + result.errorCode +
          "). Do not start another payment."
        );
        return;
      }

      purchaseSettled.current = true;
      const receipt = result.data;
      if (!receipt ||
          receipt.source !== "POSTGRESQL_SUBSCRIPTION_PURCHASE" ||
          receipt.status !== "ACTIVE" ||
          !receipt.purchaseId ||
          !receipt.subscriptionId ||
          !receipt.transactionId ||
          !/^[0-9]+[.][0-9]{2}$/.test(receipt.amountInr) ||
          !Number.isFinite(Date.parse(receipt.startsAt)) ||
          !Number.isFinite(Date.parse(receipt.expiresAt))) {
        setPurchaseMessage(
          "Server receipt requires reconciliation. Do not retry."
        );
        return;
      }

      setPurchaseMessage(
        "Server confirmed purchase. Verifying Wallet balance..."
      );
      const refreshed = await bridge.balance();
      if (!current()) return;

      if (refreshed.success &&
          validBalance(refreshed.data) &&
          refreshed.data.walletId === walletId) {
        setBalance(refreshed.data);
        window.dispatchEvent(
          new Event("finora:wallet-history-refresh")
        );
        setPurchaseMessage(
          "Subscription activated. Verified Wallet balance refreshed."
        );
      } else {
        setBalance(null);
        setPurchaseMessage(
          "Subscription confirmed. Balance reconciliation required."
        );
      }

      const status = await bridge.subscriptionPending();
      if (!current()) return;

      setPendingPurchase(
        status.success
          ? {
              state: status.data.pending ? "PENDING" : "CLEAR",
              planMonths: status.data.planMonths,
            }
          : { state: "UNAVAILABLE", planMonths: null }
      );
      setPurchaseReviewOpen(false);
    } catch {
      if (current()) {
        setPurchaseMessage(
          "Resume outcome unknown. Do not initiate another payment."
        );
      }
    } finally {
      running.current = false;
      if (current()) {
        setPurchaseBusy(false);
        setBusy(false);
      }
    }
  }
  // FINORA_P1_647C_PURCHASE_HANDLER
  async function confirmSubscriptionPurchase() {
    if (androidBalanceOnly) return;
    if (!purchaseUiEnabled || pendingPurchase.state !== "CLEAR" || purchaseSettled.current || running.current || purchaseBusy ||
        !available || busy || !purchaseReviewOpen ||
        pricingUnavailable || !balance || !validBalance(balance)) return;

    if (![1, 3, 6, 12].includes(previewPlan)) return;
    const planMonths = previewPlan as 1 | 3 | 6 | 12;
    const selectedPlan = livePricing?.plans.find(
      plan => plan.months === planMonths
    );
    const price = selectedPlan ? Number(selectedPlan.offerPriceInr) : NaN;
    if (!Number.isFinite(price) || price <= 0 ||
        Number(balance.balanceInr) < price) return;

    let intent = purchaseIntent.current;
    if (intent && (intent.walletId !== balance.walletId ||
        intent.planMonths !== planMonths)) {
      setPurchaseMessage(
        "An earlier purchase requires reconciliation. Do not create another purchase."
      );
      return;
    }

    if (!intent) {
      try {
        intent = {
          walletId: balance.walletId,
          planMonths,
          idempotencyKey: crypto.randomUUID(),
        };
      } catch {
        setPurchaseMessage("Cannot prepare secure purchase. Nothing was sent.");
        return;
      }
      purchaseIntent.current = intent;
    }

    running.current = true;
    setPurchaseBusy(true);
    setBusy(true);
    setPurchaseMessage("Submitting confirmed purchase to FINORA server...");

    const ticket = ++operation.current;
    const current = () => mounted.current && operation.current === ticket;

    try {
      const bridge = getFinoraServerWalletBridge();
      if (!bridge) throw new Error("BRIDGE_UNAVAILABLE");

      const result = await bridge.subscriptionPurchase({
        planMonths: intent.planMonths,
        idempotencyKey: intent.idempotencyKey,
      });

      if (!current()) return;
      if (!result.success) {
        setPurchaseMessage(
          "Purchase not confirmed (" + result.errorCode +
          "). Original request is retained. Do not start a new purchase."
        );
        return;
      }

      // A successful server reply may already represent a committed debit.
      // Lock immediately, even when receipt parsing or refresh later fails.
      purchaseSettled.current = true;
      const receipt = result.data;
      if (!receipt ||
          receipt.source !== "POSTGRESQL_SUBSCRIPTION_PURCHASE" ||
          receipt.status !== "ACTIVE" ||
          !receipt.purchaseId || !receipt.subscriptionId ||
          !receipt.transactionId ||
          !/^[0-9]+[.][0-9]{2}$/.test(receipt.amountInr) ||
          !Number.isFinite(Date.parse(receipt.startsAt)) ||
          !Number.isFinite(Date.parse(receipt.expiresAt))) {
        setPurchaseMessage(
          "Server returned an unverified purchase receipt. Reconciliation required."
        );
        return;
      }

      setPurchaseMessage(
        "Server confirmed subscription purchase. Refreshing Wallet balance..."
      );
      const refreshed = await bridge.balance();
      if (!current()) return;

      if (refreshed.success && validBalance(refreshed.data) &&
          refreshed.data.walletId === intent.walletId) {
        setBalance(refreshed.data);
        window.dispatchEvent(new Event("finora:wallet-history-refresh"));
        setPurchaseMessage(
          "Subscription activated on server. Verified Wallet balance refreshed."
        );
      } else {
        setBalance(null);
        setPurchaseMessage(
          "Subscription confirmed, but Wallet refresh needs verification. Do not retry payment."
        );
      }

      // No second purchase while this screen remains mounted.
      setPurchaseReviewOpen(false);
    } catch {
      if (current()) {
        setPurchaseMessage(
          "Purchase outcome unknown. Original request retained for reconciliation."
        );
      }
    } finally {
      running.current = false;
      if (current()) {
        setPurchaseBusy(false);
        setBusy(false);
      }
    }
  }
  async function submitRecharge(event: FormEvent<HTMLFormElement>) {
    if (androidBalanceOnly) return;
    event.preventDefault();
    if (running.current || !available || !balance || receipt) return;

    const walletId = balance.walletId;
    let intent = rechargeIntent.current;
    if (intent && intent.walletId !== walletId) {
      setRechargeFailed(true);
      setRechargeMessage("This retry belongs to another wallet. Return to that wallet to check the request.");
      return;
    }

    if (!intent) {
      if (!/^[0-9]{2,4}$/.test(amount) ||
          !Number.isSafeInteger(Number(amount)) ||
          Number(amount) < 50 || Number(amount) > 2000) {
        setRechargeFailed(true);
        setRechargeMessage("Enter a whole-rupee amount from INR 50 to INR 2000.");
        return;
      }
      try {
        intent = {
          walletId,
          input: {
            amountInr: Number(amount),
            paymentMethod,
            idempotencyKey: crypto.randomUUID(),
          },
        };
      } catch {
        setRechargeFailed(true);
        setRechargeMessage("Unable to prepare the request. No request was sent.");
        return;
      }
      // Keep this exact payload for every retry. Never infer a failed commit
      // from a transport error, malformed response or local cancellation.
      rechargeIntent.current = intent;
      setHasIntent(true);
    }

    running.current = true;
    const ticket = ++operation.current;
    const current = () => mounted.current && operation.current === ticket;
    setBusy(true);
    setRechargeFailed(false);
    setRechargeMessage("Submitting recharge request...");

    try {
      const bridge = getFinoraServerWalletBridge();
      if (!bridge) throw new Error("BRIDGE_UNAVAILABLE");
      const result = await bridge.recharge({ ...intent.input });
      if (!current()) return;

      if (!result.success) {
        setRechargeFailed(true);
        setBalance(null);
        setRechargeMessage(
          result.errorCode === "UNAUTHORIZED"
            ? "Sign in again, then retry this same request."
            : result.errorCode === "IDEMPOTENCY_CONFLICT"
              ? "This request conflicts with an existing submission. Contact support before submitting another."
              : result.errorCode === "WALLET_NOT_AVAILABLE"
                ? "Your wallet is unavailable. The request details are retained on this screen."
                : result.errorCode === "RATE_LIMITED"
                  ? "Too many attempts. Wait, refresh your wallet, then retry this same request."
                  : "Request outcome is unconfirmed. Refresh your wallet, then retry this same request.",
        );
        return;
      }

      if (!validReceipt(result.data, intent)) {
        throw new Error("INVALID_SERVER_RESPONSE");
      }

      const request = result.data.request;
      setReceipt({
        source: "POSTGRESQL_RECHARGE_REQUESTS",
        request: {
          requestId: request.requestId,
          walletId: request.walletId,
          amountInr: request.amountInr,
          paymentMethod: request.paymentMethod,
          status: request.status,
          createdAt: request.createdAt,
        },
        replayed: result.data.replayed,
      });
      // FINORA_P1_629B_KEEP_VERIFIED_BALANCE
      // A PENDING request never changes the Wallet balance.
      // Keep the last server-verified balance; do not add credit locally.
      window.dispatchEvent(
        new Event("finora:wallet-history-refresh")
      );
      setRechargeMessage(
        request.status === "PENDING"
          ? "Recharge request received. Payment verification and approval are pending."
          : request.status === "APPROVED"
            ? "This existing request is approved. Refresh to read your current server balance."
            : "This existing request was declined. No new credit is claimed.",
      );
    } catch {
      if (current()) {
        setBalance(null);
        setRechargeFailed(true);
        setRechargeMessage("Request outcome is unconfirmed. Refresh your wallet, then retry this same request.");
      }
    } finally {
      running.current = false;
      if (current()) setBusy(false);
    }
  }

  function prepareAnotherRecharge() {
    if (running.current || !receipt || !balance ||
        receipt.request.walletId !== balance.walletId) return;
    rechargeIntent.current = null;
    setHasIntent(false);
    setReceipt(null);
    setAmount("");
    setRechargeFailed(false);
    setRechargeMessage("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run("signIn");
  }

  const canAuthenticate = available && !busy &&
    username.trim().length > 0 && password.length > 0 && securityCode.length > 0;

  return (
    <main
      className="finora-server-wallet-dashboard"
      style={{
        width: "100%",
        maxWidth: "none",
        margin: 0,
        padding: "clamp(12px, 2vw, 28px)",
        boxSizing: "border-box",
        fontFamily: "Inter, sans-serif",
        background: theme.colors.background.page,
        color: theme.colors.text.primary,
        minHeight: "100%",
      }}
    >
      <style>{`
        .finora-server-wallet-dashboard {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          grid-template-areas:
            "header header"
            "balance access"
            "message access"
            "recharge access"
            "subscription subscription";
          grid-template-rows: auto auto auto auto auto;
          gap: 16px;
          align-items: start;
        }

        .finora-server-wallet-dashboard > * {
          min-width: 0;
        }

        /* FINORA P1-571H2 - PREMIUM PLAN TYPOGRAPHY */
        .finora-premium-plan-card {
          position: relative;
          min-height: 515px;
          height: 100%;
          font-family: Inter, sans-serif !important;
          font-weight: 400;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .finora-premium-plan-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.10) !important;
        }

        .finora-premium-plan-card:focus-visible {
          outline: 3px solid currentColor;
          outline-offset: 3px;
        }

        .finora-premium-heading {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .finora-premium-plan-name {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 17px;
          line-height: 1.35;
        }

        .finora-premium-plan-name strong {
          font-weight: 700;
        }

        .finora-premium-subtitle {
          display: block;
          min-height: 36px;
          font-size: 12px;
          font-weight: 450;
          line-height: 1.5;
          opacity: 0.78;
        }

        .finora-premium-benefits-heading {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          font-weight: 650;
          letter-spacing: 0.04em;
          opacity: 0.8;
        }

        @media (max-width: 900px) {
          .finora-premium-plan-card {
            min-height: 475px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .finora-premium-plan-card {
            transition: none;
          }

          .finora-premium-plan-card:hover {
            transform: none;
          }
        }
        .finora-wallet-header {
          grid-area: header;
        }

        .finora-wallet-balance {
          grid-area: balance;
        }

        .finora-wallet-status {
          grid-area: message;
        }

        .finora-wallet-access {
          grid-area: access;
        }

        .finora-wallet-recharge {
          grid-area: recharge;
        }

        .finora-premium-subscriptions {
          grid-area: subscription;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          margin-top: 8px;
        }

        .finora-wallet-balance,
        .finora-wallet-access,
        .finora-wallet-recharge {
          width: 100%;
          box-sizing: border-box;
        }

        .finora-wallet-access {
          align-self: stretch;
        }

        .finora-wallet-dashboard fieldset,
        .finora-server-wallet-dashboard input,
        .finora-server-wallet-dashboard select {
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }

        /* FINORA_P1_582D_RESPONSIVE */
        .finora-wallet-balance,
        .finora-wallet-recharge,
        .finora-wallet-access {
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }

        .finora-wallet-access {
          overflow: hidden;
        }

        .finora-wallet-access table {
          min-width: 600px;
        }

        @media (min-width: 901px) {
          .finora-server-wallet-dashboard {
            grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
          }
        }
        @media (max-width: 900px) {
          .finora-server-wallet-dashboard {
            grid-template-columns: minmax(0, 1fr);
            grid-template-areas:
              "header"
              "balance"
              "message"
              "access"
              "recharge"
              "subscription";
            grid-template-rows: auto;
            gap: 14px;
          }
        }
      `}</style>
      <header className="finora-wallet-header">
        <h1 style={{ display: "flex", alignItems: "center", gap: 12, margin: 0 }}>
          <Wallet aria-hidden="true" size={28} /> FINORA Wallet
        </h1>
        <p style={{ color: theme.colors.text.secondary }}>Your wallet balance is maintained on the FINORA server.</p>
      </header>

      <section className="finora-wallet-balance" style={panel} aria-label="Server wallet balance" aria-busy={busy}>
        {/* FINORA_P1_580U_BALANCE_REFRESH_TOP_RIGHT */}
<div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap"
}}>
  <div style={{ color: theme.colors.text.secondary }}>
    Available balance
  </div>
  <button type="button" style={button} disabled={!available || busy}
            onClick={() => void run("balance")}>
            <RefreshCw size={17} aria-hidden="true" /> Refresh
          </button>
</div>
        <div style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 700, margin: "12px 0" }}>
          {busy ? "Checking..." : balance ? "\u20B9" + balance.balanceInr : "Unavailable"}
        </div>
        {balance && (
          <p style={{ color: theme.colors.text.secondary, overflowWrap: "anywhere" }}>
            Wallet {balance.walletId} ? Updated {formatFinoraDateTime(balance.updatedAt)}
          </p>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>

        </div>

<div className="finora-wallet-status" role={failed ? "alert" : "status"} aria-live="polite"
        style={{ ...panel, padding: 16, color: theme.colors.text.primary }}>
        {!available
          ? "Server wallet access is unavailable in this application environment."
          : message}
      </div>
</section>

      {/* FINORA_P1_580J_HISTORY_LAYOUT */}
      <section className="finora-wallet-access" style={panel}
        aria-label="FINORA Wallet Transaction History">
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 10
        }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>
            FINORA Wallet Transaction History
          </h2>
          <div style={{
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 8
}}>

  {/* FINORA_P1_580S_REFRESH_POSITION */}
  <button
    type="button"
    onClick={() => window.dispatchEvent(
      new Event("finora:wallet-history-refresh")
    )}
    style={{
      padding: "7px 12px",
      borderRadius: 8,
      border: `1px solid ${theme.components.card.border}`,
      background: "transparent",
      color: theme.colors.text.primary,
      font: "inherit",
      fontSize: 12,
      cursor: "pointer"
    }}
  >
    Refresh history
  </button>
</div>
        </div>
        <p style={{
          fontSize: 12, color: theme.colors.text.secondary
        }}>
          Customer, loan, collection and recharge transactions
          for this verified branch.
        </p>
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table style={{
            width: "100%", borderCollapse: "collapse",
            fontSize: 12, textAlign: "left"
          }}>
            <thead>
              <tr>
                {["Date / Time", "Transaction", "Reference / Customer ID",
                  "Amount", "Status"].map(heading => (
                  <th key={heading} scope="col" style={{
                    padding: "10px 8px",
                    borderBottom: `1px solid ${theme.components.card.border}`,
                    whiteSpace: "nowrap"
                  }}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <ServerWalletLiveHistory walletId={balance?.walletId ?? null} />
          </table>
        </div>
      </section>
{/* FINORA_P1_580Y_RECHARGE_UI */}
<section className="finora-wallet-recharge" style={panel} aria-label="Server wallet recharge" aria-busy={busy}>
        <h2 style={{ marginTop: 0 }}>Request a recharge</h2>

        <form onSubmit={submitRecharge}>
          <fieldset disabled={androidBalanceOnly || !available || busy || !balance || hasIntent}
            style={{ border: 0, padding: 0, margin: 0,
              display: "grid", gap: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}>
            <label>Recharge amount (INR)
              <input name="rechargeAmount" type="text" inputMode="numeric"
                value={amount} onChange={event => setAmount(event.target.value.replace(/\D/g, ""))}
                autoComplete="off" maxLength={4} required
                pattern="[0-9]{2,4}"
                aria-invalid={amount !== "" && (Number(amount) < 50 || Number(amount) > 2000)}
                style={{
                  ...field,
                  borderColor: amount !== "" &&
                    (Number(amount) < 50 || Number(amount) > 2000)
                    ? "#e11d48"
                    : theme.components.card.border
                }}
                placeholder="MIN 50 - MAX 2000" />
              {/* FINORA_P1_582I_AMOUNT_VALIDATION */}
              {amount !== "" && Number(amount) < 50 && (
                <div role="alert" style={{
                  color: "#e11d48",
                  fontSize: 12,
                  marginTop: 6,
                  fontWeight: 600
                }}>
                  Minimum recharge amount is ₹50.
                </div>
              )}
              {amount !== "" && Number(amount) > 2000 && (
                <div role="alert" style={{
                  color: "#e11d48",
                  fontSize: 12,
                  marginTop: 6,
                  fontWeight: 600
                }}>
                  Maximum recharge amount is ₹2,000.
                </div>
              )}
            </label>
            <label>Payment method
              <select name="rechargePaymentMethod" value={paymentMethod}
                onChange={event => {
                  const value = event.target.value;
                  if (value === "PHONEPE" || value === "GOOGLE_PAY") {
                    setPaymentMethod(value);
                  }
                }} style={field}>
                <option value="PHONEPE">PhonePe</option>
                <option value="GOOGLE_PAY">Google Pay</option>
              </select>
            </label>
          </fieldset>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <button type="submit" style={{ ...button, background: theme.components.button.primaryBackground, color: theme.components.button.primaryText }}
              disabled={!available || busy || !balance || !!receipt ||
                !/^[0-9]{2,4}$/.test(amount) ||
                Number(amount) < 50 ||
                Number(amount) > 2000 ||
                (!!rechargeIntent.current &&
                  rechargeIntent.current.walletId !== balance.walletId)}>
              {hasIntent ? "Retry same request" : "Submit recharge request"}
            </button>
            {receipt && (
              <button type="button" style={button}
                disabled={busy || !balance || receipt.request.walletId !== balance.walletId}
                onClick={prepareAnotherRecharge}>
                Prepare another recharge
              </button>
            )}
          </div>
        </form>

        {!balance && (
          <p style={{ color: theme.colors.text.secondary }}>
            Sign in or refresh your wallet before submitting or retrying.
          </p>
        )}
        {hasIntent && !receipt && (
          <p style={{ color: "var(--finora-theme-danger, #C24141)" }}>
            Keep this screen open until the request is confirmed. Retries here
            reuse the same request details. Leaving or reloading loses these
            local retry details; it does not cancel a server request.
          </p>
        )}
        {rechargeMessage && (
          <p role={rechargeFailed ? "alert" : "status"} aria-live="polite"
            style={{ color: rechargeFailed ? "#9f1239" : "#334155" }}>
            {rechargeMessage}
          </p>
        )}
        {receipt && (
          <div style={{ background: theme.colors.background.page, padding: 16, borderRadius: 10,
            overflowWrap: "anywhere" }}>
            <strong>Request status: {receipt.request.status}</strong>
            <p>Amount: INR {receipt.request.amountInr}</p>
            <p>Request ID: {receipt.request.requestId}</p>
            <p>{receipt.replayed ? "Existing request returned." : "New request received."}</p>
          </div>
        )}
      </section>

      <section
        className="finora-premium-subscriptions"
        style={panel}
        aria-label="FINORA subscription plans"
      >
        {/* FINORA_P1_634J_PURCHASE_REVIEW_UI */}
        {(() => {
          const selectedPlan = livePricing?.plans.find(
            plan => plan.months === previewPlan
          );
          const price = selectedPlan
            ? Number(selectedPlan.offerPriceInr)
            : NaN;
          const walletAmount = balance
            ? Number(balance.balanceInr)
            : NaN;
          const available =
            !pricingUnavailable &&
            selectedPlan !== undefined &&
            Number.isFinite(price) &&
            price > 0 &&
            Number.isFinite(walletAmount) &&
            walletAmount >= price;
          const remaining = available ? walletAmount - price : null;

          return (
            <div
              style={{
                border: `1px solid ${theme.components.card.border}`,
                borderRadius: 14,
                padding: 16,
                marginBottom: 20,
                display: "grid",
                gap: 12,
              }}
            >
              <div>
                <strong>Subscription Purchase</strong>
                {/* FINORA_P1_648H_RESUME_UI */}
                {purchaseMessage && (
                  <p role="status" aria-live="polite">
                    {purchaseMessage}
                  </p>
                )}
                <p
                  style={{
                    margin: "5px 0 0",
                    color: theme.colors.text.secondary,
                    fontSize: 13,
                  }}
                >
                  Review the server price before confirming a Wallet debit.
                </p>
              </div>

              <button
                type="button"
                disabled={androidBalanceOnly || !available}
                onClick={() => setPurchaseReviewOpen(true)}
                style={{
                  padding: "11px 16px",
                  borderRadius: 10,
                  border: `1px solid ${theme.components.card.border}`,
                  cursor: available ? "pointer" : "not-allowed",
                  opacity: available ? 1 : 0.55,
                  fontWeight: 700,
                }}
              >
                {available
                  ? `Review ${previewPlan}-Month Purchase`
                  : "Purchase Review Unavailable"}
              </button>

              {purchaseReviewOpen && (
                <div
                  role="group"
                  aria-label="Subscription purchase confirmation"
                  style={{
                    display: "grid",
                    gap: 10,
                    padding: 16,
                    borderRadius: 12,
                    border: `1px solid ${theme.components.card.border}`,
                  }}
                >
                  <strong>Confirm Subscription Purchase</strong>
                  {/* FINORA_P1_648D_PENDING_UI */}
                  <p role="status" aria-live="polite">
                    {pendingPurchase.state === "PENDING"
                      ? `A previous ${pendingPurchase.planMonths}-month purchase requires reconciliation. No new payment is allowed.`
                      : pendingPurchase.state === "CLEAR"
                        ? "No pending purchase found on this device."
                        : pendingPurchase.state === "CHECKING"
                          ? "Checking previous purchases securely..."
                          : "Purchase recovery status unavailable. New payment blocked."}
                  </p>
                  <div>Selected Plan: {previewPlan} Month(s)</div>
                  <div>
                    Server Price: {available
                      ? `₹${price.toLocaleString("en-IN")}`
                      : "Unavailable"}
                  </div>
                  <div>
                    Current Wallet Balance: {Number.isFinite(walletAmount)
                      ? `₹${walletAmount.toLocaleString("en-IN")}`
                      : "Unavailable"}
                  </div>
                  <div>
                    Expected Remaining Balance: {remaining !== null
                      ? `₹${remaining.toLocaleString("en-IN")}`
                      : "Unavailable"}
                  </div>

                  <p
                    role="status"
                    style={{
                      margin: 0,
                      color: theme.colors.text.secondary,
                      fontSize: 13,
                    }}
                  >
                    Confirming will request a Wallet debit at the verified server price. Do not submit a second purchase while the first is pending.
                  </p>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      disabled={!purchaseUiEnabled || pendingPurchase.state !== "CLEAR" || purchaseSettled.current || purchaseBusy || busy || !available}
                      onClick={() => void confirmSubscriptionPurchase()}
                      title={purchaseUiEnabled ? "Confirm Wallet debit" : "Live purchase verification pending"}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 10,
                        opacity: purchaseBusy || busy ? 0.6 : 1, cursor: purchaseBusy || busy ? "wait" : "pointer",
                      }}
                    >
                      Confirm & Pay
                    </button>

                    {/* FINORA_P1_648H_RESUME_UI */}
                    {pendingPurchase.state === "PENDING" && (
                      <button
                        type="button"
                        disabled={
                          !purchaseUiEnabled ||
                          pendingPurchase.planMonths !== previewPlan ||
                          purchaseSettled.current ||
                          purchaseBusy || busy || !available
                        }
                        onClick={() =>
                          void resumePendingSubscriptionPurchase()
                        }
                        title="Resume original pending request only after verification"
                      >
                        Resume Original Pending Purchase — Verification Pending
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPurchaseReviewOpen(false)}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 10,
                      }}
                    >
                      Close Review
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "clamp(20px, 2.5vw, 28px)" }}>
              FINORA Premium Plans
            </h2>
            <p style={{ color: theme.colors.text.secondary, marginBottom: 0 }}>
              Simple subscriptions. One branch wallet.
            </p>
          </div>
          <span style={{
            border: `1px solid ${theme.components.card.border}`,
            borderRadius: 999, padding: "7px 12px",
            color: theme.colors.text.secondary, fontSize: 12
          }}>
            {pricingUnavailable ? "Prices unavailable" : "Live server pricing"}
          </span>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 205px), 1fr))",
          gap: 14, marginTop: 22
        }}>
          {[
            ...([1, 3, 6, 12] as const).map(months => {
              const live = livePricing?.plans.find(p => p.months === months);
              return {
                months,
                original: live ? Number(live.regularPriceInr) : null,
                price: live ? Number(live.offerPriceInr) : null,
                fees: live?.fees ?? null,
                label: months === 6 ? "POPULAR" :
                  months === 12 ? "BEST VALUE" : "",
              };
            }),
          ].map(plan => {
            // FINORA_P1_632N5_BALANCE_ELIGIBILITY
            // Selection preview only. Server must recheck at purchase.
            const walletAmount =
              balance && validBalance(balance)
                ? Number(balance.balanceInr)
                : null;
            const priceValid =
              plan.price !== null &&
              Number.isFinite(plan.price) &&
              plan.price > 0;
            const affordable =
              walletAmount !== null &&
              priceValid &&
              walletAmount >= (plan.price ?? Infinity);
            const shortfall =
              walletAmount !== null && priceValid
                ? Math.max(0, (plan.price ?? 0) - walletAmount)
                : null;
            const eligibilityMessage =
              walletAmount === null
                ? "Verified Wallet balance unavailable"
                : !priceValid
                  ? "Live subscription price unavailable"
                  : !affordable
                    ? `Insufficient Wallet Balance. Recharge ₹${shortfall!.toLocaleString("en-IN")} more.`
                    : "Sufficient Wallet Balance";
            const selected = affordable && previewPlan === plan.months;
            return (
              <div
                key={plan.months} className="finora-premium-plan-card"
                role="button"
                tabIndex={affordable ? 0 : -1}
                aria-pressed={selected}
                aria-disabled={!affordable}
                title={eligibilityMessage}
                onClick={() => {
                  if (!affordable) return;
                  if (
                    previewRenewMonths === null ||
                    previewRenewMonths === plan.months
                  ) {
                    setPreviewPlan(plan.months);
                  }
                }}
                onKeyDown={event => {
                  if (
                    event.target === event.currentTarget &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    if (!affordable) return;
                    if (
                      previewRenewMonths === null ||
                      previewRenewMonths === plan.months
                    ) {
                      setPreviewPlan(plan.months);
                    }
                  }
                }}
                style={{
                  minHeight: 220,
                  textAlign: "left",
                  cursor: affordable ? "pointer" : "not-allowed",
                  opacity: affordable ? 1 : 0.65,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  borderRadius: 18,
                  padding: 18,
                  border: selected
                    ? `2px solid ${theme.components.button.primaryBackground}`
                    : `1px solid ${theme.components.card.border}`,
                  background: selected
                    ? theme.colors.background.page
                    : theme.components.card.background,
                  color: theme.colors.text.primary,
                  boxShadow: selected ? theme.components.card.shadow : "none",
                  font: "inherit",
                }}
              >
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", minHeight: 23, gap: 8
                }}>
                  <div className="finora-premium-heading">
  <div className="finora-premium-plan-name">
    {plan.months === 12
      ? <Crown size={18} aria-hidden="true" />
      : <Sparkles size={17} aria-hidden="true" />}
    <strong>
      {plan.months} {plan.months === 1 ? "Month" : "Months"}
    </strong>
  </div>
  <span className="finora-premium-subtitle">
    {plan.months === 1
      ? "Flexible access, every month."
      : plan.months === 3
        ? "More continuity, less renewal hassle."
        : plan.months === 6
          ? "Built for growing businesses."
          : "A full year of business confidence."}
  </span>
</div>
                  {plan.label && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: ".05em",
                      color: theme.components.button.primaryText,
                      background: theme.components.button.primaryBackground,
                      borderRadius: 999, padding: "5px 8px"
                    }}>
                      {plan.label}
                    </span>
                  )}
                </div>
                <div>
                  {/* FINORA_P1_580C_SINGLE_PRICE */}
                  <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-.04em", marginTop: -14 /* FINORA_P1_580D_PRICE_GAP */ }}>
                    {plan.price === null
                      ? "Price unavailable"
                      : `₹${plan.price.toLocaleString("en-IN")}`}
                  </div>
                </div>
                {/* FINORA_P565B_STATUS: Actual subscribed plan only */}
{subscription &&
  subscription.planMonths === plan.months && (() => {
    const state = finoraSubscriptionBadge(subscription);
    const badgeColors = finoraSubscriptionBadgeColors(state.tone);

    return (
      <div style={{ marginTop: 10, marginBottom: 10 }}>
        <span
          aria-label={`Subscription ${state.label}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            borderRadius: 999,
            padding: "7px 12px",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.3,
            background: badgeColors.background,
            color: badgeColors.color,
            lineHeight: 1.3,
            maxWidth: "100%",
          }}
        >
          {state.label}
        </span>
      </div>
    );
  })()}
<div style={{
  padding: 12,
  borderRadius: 12,
  background: theme.colors.background.page,
  border: `1px solid ${theme.components.card.border}`,
  display: "grid",
  gap: 9,
}}>
  <div style={{
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: ".06em",
    color: theme.colors.text.secondary,
  }}>
    <CalendarDays size={14} aria-hidden="true" style={{ verticalAlign: "middle", marginRight: 6 }} /> SUBSCRIPTION PERIOD
  </div>

  {subscription?.planMonths === plan.months ? (
    <>
      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 12, color: theme.colors.text.secondary }}>
          Plan started
        </span>
        <strong style={{ fontSize: 13 }}>
          {subscription.startsAt &&
           Number.isFinite(Date.parse(subscription.startsAt))
            ? formatFinoraDateTime(subscription.startsAt)
            : "Awaiting server start date"}
        </strong>
      </div>

      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 12, color: theme.colors.text.secondary }}>
          Plan expires
        </span>
        <strong style={{ fontSize: 13 }}>
          {subscription.expiresAt &&
           Number.isFinite(Date.parse(subscription.expiresAt))
            ? formatFinoraDateTime(subscription.expiresAt)
            : "Expiry unavailable"}
        </strong>
      </div>

      <div
        aria-live="off"
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: subscription.expiresAt &&
            Date.parse(subscription.expiresAt) <= planClock
              ? "#ef4444"
              : theme.colors.text.primary,
        }}
      >
        <Clock3 size={15} aria-hidden="true" style={{ verticalAlign: "middle", marginRight: 6 }} />{finoraPlanCountdown(subscription.expiresAt, planClock)}
      </div>
    </>
  ) : (
    <span style={{
      color: theme.colors.text.secondary,
      fontSize: 13,
    }}>
      No verified subscription dates for this plan
    </span>
  )}
</div>

<div
  onClick={event => event.stopPropagation()}
  onKeyDown={event => event.stopPropagation()}
  style={{
    padding: "12px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  }}
>
  <div>
    <strong style={{ fontSize: 13, fontWeight: 650, display: "inline-flex", gap: 7, alignItems: "center" }}><Repeat2 size={16} aria-hidden="true" />Auto-Renew</strong>
    <div style={{
      fontSize: 11,
      color: theme.colors.text.secondary,
    }}>
      {previewRenewMonths === plan.months
        ? "ON · Renewal preview"
        : "OFF · Manual renewal"}
    </div>
  </div>

  <label style={{
    display: "inline-flex",
    alignItems: "center",
    cursor: "pointer",
    gap: 8,
  }}>
    <input
      type="checkbox"
      role="switch"
      aria-label={`Auto-renew ${plan.months} month plan (preview only)`}
      checked={previewRenewMonths === plan.months}
      disabled={
        !affordable ||
        (previewRenewMonths !== null &&
         previewRenewMonths !== plan.months)
      }
      onChange={event => {
        if (!affordable) return;
        const next = event.target.checked;
        setPreviewRenewMonths(next ? plan.months : null);
        if (next) setPreviewPlan(plan.months);
      }}
      style={{
        width: 20,
        height: 20,
        accentColor: theme.components.button.primaryBackground,
      }}
    />
  </label>
</div>
<div className="finora-premium-benefits-heading">
  <BadgeCheck size={15} aria-hidden="true" />
  <span>USAGE CHARGES</span>
</div>{/* FINORA_P564L_PLAN_FEES - Display-only preview; billing uses server prices */}
<div style={{
  display: "grid",
  gap: 7,
  padding: "12px 0",
  borderTop: `1px solid ${theme.components.card.border}`,
  fontSize: 15,
}}>
  {[
    ["Customer creation", plan.fees?.CUSTOMER_CREATE ?? null],
    ["Loan creation", plan.fees?.LOAN_DISBURSEMENT ?? null],
    ["Collection below ₹25k", plan.fees?.COLLECTION_BELOW_25000 ?? null],
    ["Collection ₹25k–₹50k", plan.fees?.COLLECTION_25000_TO_50000 ?? null],
    ["Collection above ₹50k", plan.fees?.COLLECTION_ABOVE_50000 ?? null],
  ].map(([label, amount]) => (
    <div
      key={String(label)}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span style={{ color: theme.colors.text.secondary }}>
        {label}
      </span>
      <strong style={{
        color: theme.colors.text.primary,
        whiteSpace: "nowrap",
      }}>
        {amount === null ? "Unavailable" : `₹${Number(amount).toLocaleString("en-IN")}`}
      </strong>
    </div>
  ))}
</div>
                <div style={{
                  marginTop: "auto", borderRadius: 10,
                  padding: "10px 12px", textAlign: "center",
                  background: selected
                    ? theme.components.button.primaryBackground
                    : theme.colors.background.page,
                  color: selected
                    ? theme.components.button.primaryText
                    : theme.colors.text.primary,
                  fontWeight: 700, fontSize: 13
                }}>
                  {!affordable ? "Unavailable" : selected ? "✓ Selected" : "Select plan"}
                  {!affordable && (
                    <span
                      role="status"
                      style={{
                        display: "block",
                        marginTop: 8,
                        fontSize: 12,
                        lineHeight: 1.4,
                        color: "#b45309",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {eligibilityMessage}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: 18, borderRadius: 14,
          background: theme.colors.background.page,
          padding: 16, display: "flex",
          justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 16
        }}>
          <div>
            <strong>Automatic renewal</strong>
            <div style={{ fontSize: 12, color: theme.colors.text.secondary, marginTop: 4 }}>
              Only one plan can be selected for automatic renewal. Turn it OFF before switching plans. Automatic renewal is not enabled. Subscription purchases require separate server confirmation.
            </div>
          </div>
          <strong>{previewRenewMonths === null ? "OFF" : `${previewRenewMonths} Month${previewRenewMonths === 1 ? "" : "s"} · ON (Preview)`}</strong>
        </div>
        <p style={{ fontSize: 12, color: theme.colors.text.secondary, marginBottom: 0 }}>
          Prices shown for design review. Final amount and renewal authorization
          must come from FINORA server. No money is deducted by these controls.
        </p>
      </section>
    </main>
  );
}
