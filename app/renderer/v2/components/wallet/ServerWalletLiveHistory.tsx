import {
  isFinoraAndroidWallet,
} from "../../services/wallet/finoraAndroidWalletBridge";
import {
  getFinoraAndroidTransactions,
  getFinoraAndroidRecharges,
} from "../../services/wallet/finoraAndroidWalletReads";
/* FINORA_P1_580R_LIVE_HISTORY
 * Read-only, verified PostgreSQL Wallet history.
 */
import { useEffect, useState } from "react";
import {
  getFinoraServerWalletBridge,
  type ServerWalletTransactionRow,
  type ServerWalletRechargeRow,
} from "../../services/wallet/finoraServerWalletBridge";

type Item = {
  key: string;
  when: string;
  title: string;
  reference: string;
  amount: string;
  status: string;
};

const currency = (v: string) =>
  `₹${Number(v).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const displayDate = (v: string) =>
  new Date(v).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function fromTransaction(t: ServerWalletTransactionRow): Item {
  const kind = t.transactionType.toUpperCase();
  const credit = kind.includes("RECHARGE") ||
    kind.includes("CREDIT");

  const title = kind.includes("CUSTOMER")
    ? "Customer creation"
    : kind.includes("LOAN")
      ? "Loan transaction"
      : kind.includes("COLLECTION")
        ? "Collection processing"
        : credit
          ? "Wallet credit"
          : t.transactionType.replace(/_/g, " ");

  const debit = kind.includes("CUSTOMER") ||
    kind.includes("LOAN") || kind.includes("COLLECTION") ||
    kind.includes("DEBIT") || kind.includes("FEE");

  return {
    key: "tx:" + t.transactionId,
    when: t.createdAt,
    title,
    reference: t.reference || t.rechargeRequestId ||
      t.transactionId,
    amount: `${Number(t.amountInr) < 0 ? "−" : credit ? "+" : debit ? "−" : ""}${currency(Math.abs(Number(t.amountInr)).toFixed(2))}`,
    status: "Recorded",
  };
}

function fromRequest(r: ServerWalletRechargeRow): Item {
  return {
    key: "req:" + r.requestId,
    when: r.createdAt,
    title: "Recharge request",
    reference: r.requestId,
    // This is a REQUESTED amount, not a confirmed credit.
    amount: currency(r.amountInr),
    status: r.status === "APPROVED"
      ? "Approved request"
      : r.status === "DECLINED"
        ? "Declined"
        : "Pending",
  };
}

export default function ServerWalletLiveHistory({
  walletId,
}: { walletId: string | null }) {
  const [items, setItems] = useState<Item[]>([]);
  const [state, setState] = useState<
    "WAITING" | "LOADING" | "READY" | "ERROR"
  >("WAITING");
  const [error, setError] = useState("");
  // FINORA_P1_583L_PARTIAL_HISTORY
  const [rechargeWarning, setRechargeWarning] = useState("");
  const [more, setMore] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const refreshHistory = () => setRefresh(n => n + 1);
    window.addEventListener(
      "finora:wallet-history-refresh",
      refreshHistory
    );
    return () => window.removeEventListener(
      "finora:wallet-history-refresh",
      refreshHistory
    );
  }, []);
  useEffect(() => {
    let active = true;
    setItems([]);
    setRechargeWarning("");
    setMore(false);

    if (!walletId) {
      setState("WAITING");
      return () => { active = false; };
    }

    // FINORA_P1_723K_HISTORY
    const android = isFinoraAndroidWallet();
    const bridge = android ? null : getFinoraServerWalletBridge();

    if (!android && !bridge) {
      setState("ERROR");
      setError("History service unavailable.");
      return () => { active = false; };
    }

    setState("LOADING");

    void (async () => {
      try {
        const [tx, req] = await Promise.all([
          android
            ? getFinoraAndroidTransactions(walletId)
            : bridge!.transactions(),
          android
            ? getFinoraAndroidRecharges(walletId)
            : bridge!.recharges(),
        ]);

        if (!active) return;

        if (!tx.success) {
          setState("ERROR");
          setError(
            "Transaction history unavailable: " + tx.errorCode
          );
          return;
        }

        if (!req.success) {
          setRechargeWarning(
            "Recharge history temporarily unavailable (" +
            req.errorCode +
            "). Verified ledger transactions are displayed."
          );
        }

        if (
          tx.data.walletId !== walletId ||
          tx.data.currency !== "INR" ||
          (req.success && (
            req.data.walletId !== walletId ||
            req.data.currency !== "INR"
          ))
        ) {
          setState("ERROR");
          setError("Wallet scope mismatch. History not displayed.");
          return;
        }

        setItems([
          ...tx.data.entries.map(fromTransaction),
          ...(req.success ? req.data.entries.map(fromRequest) : []),
        ].sort((a, b) =>
          Date.parse(b.when) - Date.parse(a.when)
        ));

        setMore(tx.data.hasMore || (req.success && req.data.hasMore));
        setState("READY");
      } catch {
        if (active) {
          setState("ERROR");
          setError("Unable to load Wallet history.");
        }
      }
    })();

    return () => { active = false; };
  }, [walletId, refresh]);

  const cell = {
    padding: "10px 8px",
    borderBottom: "1px solid rgba(148,163,184,.18)",
    fontSize: 12,
  };

  return (
    <tbody>


      {state !== "READY" || items.length === 0 ? (
        <tr>
          <td colSpan={5} style={{
            ...cell, padding: 22, textAlign: "center",
          }}>
            {state === "LOADING"
              ? "Loading verified PostgreSQL history..."
              : state === "ERROR"
                ? error
                : state === "WAITING"
                  ? "Waiting for verified Wallet."
                  : "No server history records found."}
          </td>
        </tr>
      ) : items.map(item => (
        <tr key={item.key}>
          <td style={{ ...cell, whiteSpace: "nowrap" }}>
            {displayDate(item.when)}
          </td>
          <td style={cell}>{item.title}</td>
          <td style={{
            ...cell, overflowWrap: "anywhere",
          }}>{item.reference}</td>
          <td style={{ ...cell, whiteSpace: "nowrap" }}>
            {item.amount}
          </td>
          <td style={{ ...cell, whiteSpace: "nowrap" }}>
            {item.status}
          </td>
        </tr>
      ))}

      {state === "READY" && rechargeWarning && (
        <tr>
          <td colSpan={5} role="status" style={{
            ...cell,
            padding: 12,
            color: "#b45309",
            overflowWrap: "anywhere"
          }}>
            {rechargeWarning}
          </td>
        </tr>
      )}

      {state === "READY" && more && (
        <tr>
          <td colSpan={5} style={cell}>
            Latest 50 records per category displayed.
            Older pages are not loaded yet.
          </td>
        </tr>
      )}
    </tbody>
  );
}
