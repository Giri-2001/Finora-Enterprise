import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../themes/provider";
import type { CSSProperties, FormEvent } from "react";
import { Wallet, RefreshCw, LogOut, ShieldCheck, KeyRound, Eye, EyeOff } from "lucide-react";
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
export default function ServerWalletPage({
  username,
  subscription,
}: {
  username: string;
  subscription?: FinoraSubscriptionView | null;
}) {
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [previewPlan, setPreviewPlan] = useState(12);
  // FINORA_P565N3B_PRICING
  const [livePricing, setLivePricing] = useState<{
    plans: Array<{
      months: number;
      regularPriceInr: string;
      offerPriceInr: string;
      fees: Record<string, string>;
    }>;
  } | null>(null);
  const [pricingUnavailable, setPricingUnavailable] = useState(true);
  const [previewAutoRenew, setPreviewAutoRenew] = useState(false);
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

    // Server pricing only; never use fallback fee amounts.
    void (async () => {
      try {
        const bridge = getFinoraServerWalletBridge();
        if (!bridge) return;

        const response = await bridge.pricing();

        if (!mounted.current) return;

        if (
          response.success &&
          response.data.source === "FINORA_POSTGRESQL_PRICING" &&
          response.data.plans.length === 4
        ) {
          setLivePricing({
            plans: response.data.plans,
          });
          setPricingUnavailable(false);
        }
      } catch {
        if (mounted.current) {
          setLivePricing(null);
          setPricingUnavailable(true);
        }
      }
    })();
    return () => {
      mounted.current = false;
      operation.current++;
      // Cancel access and pending login when leaving this wallet screen.
      void endFinoraServerWalletAccess();
    };
  }, []);

  async function run(kind: "signIn" | "enroll" | "balance" | "logout") {
    if (running.current) return;
    running.current = true;
    const ticket = ++operation.current;
    const current = () => mounted.current && operation.current === ticket;
    setBusy(true);
    setBalance(null);
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
    } catch {
      if (current()) {
        setBalance(null);
        setFailed(true);
        setMessage("Server wallet is unavailable. Please try again.");
      }
    } finally {
      running.current = false;
      if (current()) setBusy(false);
    }
  }

  async function submitRecharge(event: FormEvent<HTMLFormElement>) {
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
      // Read a fresh balance only through Refresh; never add the request amount.
      setBalance(null);
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
        <div style={{ color: theme.colors.text.secondary }}>Available balance</div>
        <div style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 700, margin: "12px 0" }}>
          {busy ? "Checking..." : balance ? "\u20B9" + balance.balanceInr : "Unavailable"}
        </div>
        {balance && (
          <p style={{ color: theme.colors.text.secondary, overflowWrap: "anywhere" }}>
            Wallet {balance.walletId} ? Updated {new Date(balance.updatedAt).toLocaleString()}
          </p>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" style={button} disabled={!available || busy}
            onClick={() => void run("balance")}>
            <RefreshCw size={17} aria-hidden="true" /> Refresh
          </button>
          <button type="button" style={button} disabled={!available || busy}
            onClick={() => void run("logout")}>
            <LogOut size={17} aria-hidden="true" /> Sign out of wallet
          </button>
        </div>
      </section>

      <div className="finora-wallet-status" role={failed ? "alert" : "status"} aria-live="polite"
        style={{ ...panel, padding: 16, color: failed ? "#9f1239" : "#334155" }}>
        {!available
          ? "Server wallet access is unavailable in this application environment."
          : message}
      </div>

      <section className="finora-wallet-access" style={panel} aria-label="Wallet sign in">
        <h2 style={{ marginTop: 0, display: "flex", gap: 10, alignItems: "center" }}>
          <ShieldCheck size={22} aria-hidden="true" /> Secure wallet access
        </h2>
        <form onSubmit={submit}>
          <fieldset disabled={!available || busy}
            style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 16 }}>
            <label>Username
              <input name="walletUsername" value={username} readOnly
                autoComplete="username" style={field} />
            </label>
            <div>
              <label htmlFor="finora-wallet-password">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="finora-wallet-password"
                  name="walletPassword"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  autoComplete="off"
                  required
                  maxLength={72}
                  style={{ ...field, paddingRight: 56 }}
                />
                <button
                  type="button"
                  style={eyeButton}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  title={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(value => !value)}
                >
                  {showPassword
                    ? <EyeOff size={19} aria-hidden="true" />
                    : <Eye size={19} aria-hidden="true" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="finora-wallet-security-code">Security code</label>
              <div style={{ position: "relative" }}>
                <input
                  id="finora-wallet-security-code"
                  name="walletSecurityCode"
                  type={showSecurityCode ? "text" : "password"}
                  value={securityCode}
                  onChange={event => setSecurityCode(event.target.value)}
                  autoComplete="off"
                  required
                  maxLength={72}
                  style={{ ...field, paddingRight: 56 }}
                />
                <button
                  type="button"
                  style={eyeButton}
                  aria-label={showSecurityCode ? "Hide security code" : "Show security code"}
                  aria-pressed={showSecurityCode}
                  title={showSecurityCode ? "Hide security code" : "Show security code"}
                  onClick={() => setShowSecurityCode(value => !value)}
                >
                  {showSecurityCode
                    ? <EyeOff size={19} aria-hidden="true" />
                    : <Eye size={19} aria-hidden="true" />}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="submit" disabled={!canAuthenticate}
                style={{ ...button, background: theme.components.button.primaryBackground, color: theme.components.button.primaryText }}>
                <ShieldCheck size={17} aria-hidden="true" /> Sign in
              </button>
              <button type="button" disabled={!canAuthenticate} style={button}
                onClick={() => void run("enroll")}>
                <KeyRound size={17} aria-hidden="true" /> Enable wallet access on this device
              </button>
            </div>
          </fieldset>
        </form>
        <p style={{ color: theme.colors.text.secondary, fontSize: 13 }}>
          First time on this device? Enable wallet access, then sign in.
        </p>
      </section>

      <section className="finora-wallet-recharge" style={panel} aria-label="Server wallet recharge" aria-busy={busy}>
        <h2 style={{ marginTop: 0 }}>Request a recharge</h2>
        <p style={{ color: theme.colors.text.secondary }}>
          INR 50 to INR 2000, in whole rupees. Submitting a request does not
          transfer money or increase your balance. Credit requires verified
          payment and administrator approval.
        </p>

        <form onSubmit={submitRecharge}>
          <fieldset disabled={!available || busy || !balance || hasIntent}
            style={{ border: 0, padding: 0, margin: 0,
              display: "grid", gap: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}>
            <label>Recharge amount (INR)
              <input name="rechargeAmount" type="text" inputMode="numeric"
                value={amount} onChange={event => setAmount(event.target.value)}
                autoComplete="off" maxLength={4} required
                pattern="[0-9]{2,4}" style={field} />
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
            const selected = previewPlan === plan.months;
            return (
              <button
                key={plan.months}
                type="button"
                aria-pressed={selected}
                onClick={() => setPreviewPlan(plan.months)}
                style={{
                  minHeight: 220,
                  textAlign: "left",
                  cursor: "pointer",
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
                  <strong>{plan.months} {plan.months === 1 ? "Month" : "Months"}</strong>
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
                  <div style={{
                    textDecoration: "line-through",
                    color: theme.colors.text.secondary, fontSize: 13
                  }}>
                    {plan.original === null ? "—" : `₹${plan.original.toLocaleString("en-IN")}`}
                  </div>
                  <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-.04em" }}>
                    {plan.price === null ? "Price unavailable" : `₹${plan.price.toLocaleString("en-IN")}`}
                  </div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: 13 }}>
                    {plan.original === null || plan.price === null ? "Awaiting server pricing" : `Save ₹${Math.max(0, plan.original - plan.price).toLocaleString("en-IN")}`}
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
{/* FINORA_P564L_PLAN_FEES - Display-only preview; billing uses server prices */}
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
                  {selected ? "✓ Selected" : "Select plan"}
                </div>
              </button>
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
              Preview only — server billing is not yet connected.
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              role="switch"
              checked={previewAutoRenew}
              onChange={event => setPreviewAutoRenew(event.target.checked)}
              style={{ width: 20, height: 20, accentColor: theme.components.button.primaryBackground }}
            />
            <strong>{previewAutoRenew ? "ON (Preview)" : "OFF"}</strong>
          </label>
        </div>
        <p style={{ fontSize: 12, color: theme.colors.text.secondary, marginBottom: 0 }}>
          Prices shown for design review. Final amount and renewal authorization
          must come from FINORA server. No money is deducted by these controls.
        </p>
      </section>
    </main>
  );
}
