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

export type FinoraWalletHistoryCategory =
  | "SUBSCRIPTIONS"
  | "RECHARGES"
  | "TRANSACTIONS";

type Item = {
  category: FinoraWalletHistoryCategory;
  key: string;
  when: string;
  title: string;
  reference: string;
  amount: string;
  status: string;
  declineReason?: string | null;
  decidedAt?: string | null;
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

  // FINORA_P1_747P_SERVER_LEDGER_CLASSIFICATION
  const category: FinoraWalletHistoryCategory =
    kind.includes("SUBSCRIPTION")
      ? "SUBSCRIPTIONS"
      : kind.includes("RECHARGE") ||
        kind.includes("CREDIT") ||
        t.reference === "MANUAL_RECHARGE"
        ? "RECHARGES"
        : "TRANSACTIONS";
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
    category,
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
    category: "RECHARGES",
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
    declineReason: r.status === "DECLINED" ? r.declineReason : null,
    decidedAt: r.status === "DECLINED" ? r.decidedAt : null,
  };
}

function readableWalletReference(item: Item): string {
  const reference = item.reference.trim();

  if (item.key.startsWith("req:")) {
    return `Recharge Request #${reference.slice(0, 8).toUpperCase()}`;
  }

  if (reference.startsWith("SUBSCRIPTION:")) {
    return "Subscription Payment";
  }

  if (reference === "MANUAL_RECHARGE") {
    return "Wallet Recharge Credit";
  }

  if (reference === "INITIAL_PROVISIONING") {
    return "Opening Wallet Balance";
  }

  if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(reference)) {
    return `Transaction #${reference.slice(0, 8).toUpperCase()}`;
  }

  return reference.length > 25
    ? `${reference.slice(0, 22)}...`
    : reference;
}

export default function ServerWalletLiveHistory({
  walletId,
}: { walletId: string | null }) {
  const [items, setItems] = useState<Item[]>([]);

  // FINORA_P1_747R_PAGINATION
  const [page, setPage] = useState(1);
  const [pageDraft, setPageDraft] = useState("1");

  // FINORA_P1_747Q_FILTER_STATE
  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | FinoraWalletHistoryCategory
  >("ALL");

  const [dateFilter, setDateFilter] = useState<
    "ALL" | "TODAY" | "YESTERDAY" | "MONTH" | "YEAR"
  >("ALL");
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

  // FINORA_P1_747Q_HISTORY_FILTER_EVENTS
  useEffect(() => {
    const updateCategory = (event: Event) => {
      const value = (event as CustomEvent<unknown>).detail;

      if (
        value === "ALL" ||
        value === "SUBSCRIPTIONS" ||
        value === "RECHARGES" ||
        value === "TRANSACTIONS"
      ) {
        setCategoryFilter(value);
      }
    };

    const updateDate = (event: Event) => {
      const value = (event as CustomEvent<unknown>).detail;

      if (
        value === "ALL" ||
        value === "TODAY" ||
        value === "YESTERDAY" ||
        value === "MONTH" ||
        value === "YEAR"
      ) {
        setDateFilter(value);
      }
    };

    window.addEventListener(
      "finora:wallet-history-category-filter",
      updateCategory
    );
    window.addEventListener(
      "finora:wallet-history-date-filter",
      updateDate
    );

    return () => {
      window.removeEventListener(
        "finora:wallet-history-category-filter",
        updateCategory
      );
      window.removeEventListener(
        "finora:wallet-history-date-filter",
        updateDate
      );
    };
  }, []);

  const now = new Date();

  const startToday = new Date(
    now.getFullYear(), now.getMonth(), now.getDate()
  ).getTime();

  const startYesterday = new Date(
    now.getFullYear(), now.getMonth(), now.getDate() - 1
  ).getTime();

  const startMonth = new Date(
    now.getFullYear(), now.getMonth(), 1
  ).getTime();

  const startYear = new Date(
    now.getFullYear(), 0, 1
  ).getTime();

  const filteredItems = items.filter((item) => {
    if (
      categoryFilter !== "ALL" &&
      item.category !== categoryFilter
    ) {
      return false;
    }

    const time = Date.parse(item.when);
    if (!Number.isFinite(time)) return false;

    switch (dateFilter) {
      case "TODAY":
        return time >= startToday;
      case "YESTERDAY":
        return time >= startYesterday && time < startToday;
      case "MONTH":
        return time >= startMonth;
      case "YEAR":
        return time >= startYear;
      default:
        return true;
    }
  });
  // FINORA_P1_747R_LOADED_RECORD_PAGES
  // FINORA_P1_747T2_COMPACT
  const rowsPerPage = 6; // FINORA_P1_752X_SEVEN_ROWS
  const totalPages = Math.max(
    1, Math.ceil(filteredItems.length / rowsPerPage)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleItems = filteredItems.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Reset on filter changes or wallet identity changes.
  useEffect(() => {
    setPage(1);
    setPageDraft("1");
  }, [categoryFilter, dateFilter, walletId]);

  // Keep entered page in sync with navigation.
  useEffect(() => {
    setPageDraft(String(currentPage));
  }, [currentPage]);

  const navigatePage = (requested: number) => {
    if (
      !Number.isSafeInteger(requested) ||
      requested < 1 ||
      requested > totalPages
    ) {
      setPageDraft(String(currentPage));
      return;
    }

    setPage(requested);
    setPageDraft(String(requested));
  };

  const pageButton = {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "1px solid #daa520",
    background: "transparent",
    color: "inherit",
    fontSize: 28,
    fontWeight: 600,
    cursor: "pointer",
  };
  const cell = {
    padding: "10px 8px",
    borderBottom: "1px solid rgba(148,163,184,.18)",
    fontSize: 13,
  };

  return (
    <tbody>


      {state !== "READY" || filteredItems.length === 0 ? (
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
                  : "No matching records in the currently loaded history."}
          </td>
        </tr>
      ) : visibleItems.map(item => (
        <tr key={item.key}>
          <td style={{ ...cell, whiteSpace: "nowrap" }}>
            {displayDate(item.when)}
          </td>
          <td style={cell}>{item.title}</td>
          <td style={{
            ...cell,
            overflowWrap: "anywhere",
            minWidth: 155,
          }}>
            <div title={item.reference} style={{
              fontWeight: 650,
              color: "var(--finora-theme-text-primary, #172033)",
            }}>
              {readableWalletReference(item)}
            </div>
          </td>
          <td style={{ ...cell, whiteSpace: "nowrap" }}>
            {item.amount}
          </td>
          <td style={{
            ...cell,
            whiteSpace: "normal",
            minWidth: 130,
            overflowWrap: "anywhere",
          }}>
            <strong style={{
              fontWeight: 750,
              fontSize: 14,
              opacity: 1,
              color: item.status === "Declined"
                ? "#dc2626"
                : item.status === "Approved request"
                  ? "#22c55e"
                  : "inherit",
            }}>
              {item.status}
            </strong>

            {/* FINORA_P1_744H2_OWNER_REASON */}
            {item.status === "Declined" && (
              <div style={{
                display: "grid",
                gap: 3,
                marginTop: 3,
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.3,
              }}>
                <div style={{
                  color: "#b91c1c",
                  opacity: 1,
                  fontWeight: 650,
                }}>
                  <strong>Reason: </strong>
                  {item.declineReason?.trim() ||
                    "Reason unavailable from server"}
                </div>

                {item.decidedAt && (
                  <div style={{
                    color: "var(--finora-theme-text-primary, #475569)",
                    opacity: 1,
                    fontWeight: 600,
                  }}>
                    <strong>Decision (IST): </strong>
                    {new Date(item.decidedAt).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            )}
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
      {/* FINORA_P1_747R_PREMIUM_PAGE_CONTROLS */}
      {state === "READY" && (
        <tr>
          <td colSpan={5} style={{
            padding: "20px 8px 12px",
            border: 0,
          }}>
            {/* FINORA_P1_749H_CENTER_PAGINATION_RIGHT_INFO */}
            <div className="finora-history-pagination-grid" style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
              alignItems: "center",
              width: "100%",
            }}>
              <div />
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
              }}>
              <button
                type="button"
                aria-label="Previous history page"
                disabled={currentPage <= 1}
                onClick={() => navigatePage(currentPage - 1)}
                style={{
                  ...pageButton,
                  opacity: currentPage <= 1 ? .8 : 1,
                  cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                }}
              >
                {"←"}
              </button>

              <input
                aria-label="History page number"
                type="text"
                inputMode="numeric"
                value={pageDraft}
                onChange={(event) => {
                  const value = event.target.value;
                  if (/^\d{0,6}$/.test(value)) {
                    setPageDraft(value);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    navigatePage(Number(pageDraft));
                  }
                  if (event.key === "Escape") {
                    setPageDraft(String(currentPage));
                  }
                }}
                onBlur={() => setPageDraft(String(currentPage))}
                style={{
                  width: 56,
                  height: 40,
                  boxSizing: "border-box",
                  textAlign: "center",
                  borderRadius: 11,
                  border: "1px solid #daa520",
                  background: "transparent",
                  color: "inherit",
                  font: "inherit",
                  fontSize: 15,
                  fontWeight: 700,
                  outlineOffset: 3,
                }}
              />

              <button
                type="button"
                aria-label="Next history page"
                disabled={currentPage >= totalPages}
                onClick={() => navigatePage(currentPage + 1)}
                style={{
                  ...pageButton,
                  opacity: currentPage >= totalPages ? .8 : 1,
                  cursor: currentPage >= totalPages
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {"→"}              </button>
              </div>
              <div style={{
                textAlign: "right",
                fontSize: 13,
                fontWeight: 500,
                color: "inherit",
                opacity: 0.9,
                minWidth: 0,
                paddingLeft: 12,
                whiteSpace: "nowrap",
              }}>
              {/* FINORA_P1_754P_FINAL_HISTORY */}
              Showing {visibleItems.length} of {filteredItems.length} records
            </div>
            </div>

            {more && (
              <div style={{
                textAlign: "center",
                marginTop: 7,
                color: "#b45309",
                fontSize: 11,
              }}>
                More server history exists. Older records are not
                included in these pages yet.
              </div>
            )}
          </td>
        </tr>
      )}
    </tbody>
  );
}
