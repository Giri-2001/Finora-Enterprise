import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import FinoraRechargePaymentReview from "./FinoraRechargePaymentReview";
import type {
  FinoraServerPendingRechargeRecordView,
} from "../../../../electron/control-center/finoraControlCenterPreload";

type Status = "IDLE" | "LOADING" | "READY" | "ERROR";

const SIZE = 10;

function money(value: string): string {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount)
    : "Unavailable";
}

export default function FinoraControlCenterPendingRechargesPanel() {
  const [rows, setRows] = useState<
    FinoraServerPendingRechargeRecordView[]
  >([]);
  const [status, setStatus] = useState<Status>("IDLE");
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // P1-630F: Refresh Pending Requests after secure connection changes.
  useEffect(() => {
    const changed = () => {
      setOffset(0);
      setRefresh(value => value + 1);
    };
    window.addEventListener(
      "finora:control-center-server-connection-changed", changed
    );
    return () => window.removeEventListener(
      "finora:control-center-server-connection-changed", changed
    );
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setStatus("LOADING");
      setError("");
      setRows([]);
      setHasMore(false);

      const bridge = window.finoraControlCenter;
      if (!bridge ||
          typeof bridge.getServerPendingRecharges !== "function") {
        if (active) {
          setStatus("ERROR");
          setError("Pending Recharge bridge unavailable.");
        }
        return;
      }

      try {
        const result = await bridge.getServerPendingRecharges({
          limit: SIZE,
          offset,
        });

        if (!active) return;

        if (!result.success) {
          setStatus("ERROR");
          setError(result.error);
          return;
        }

        const page = result.data;
        if (page.source !== "POSTGRESQL_RECHARGE_REQUESTS" ||
            page.limit !== SIZE ||
            page.offset !== offset ||
            !Array.isArray(page.requests)) {
          setStatus("ERROR");
          setError("Invalid server Pending Recharge response.");
          return;
        }

        setRows(page.requests);
        setHasMore(page.hasMore);
        setStatus("READY");
      } catch {
        if (active) {
          setStatus("ERROR");
          setError("Unable to load Pending Recharge requests.");
        }
      }
    }

    void load();
    return () => { active = false; };
  }, [offset, refresh]);

  return (
    <section
      aria-label="PostgreSQL Pending Recharge Requests"
      style={{
        padding: 20,
        marginBottom: 20,
        border: "1px solid rgba(148,163,184,.25)",
        borderRadius: 18,
        minWidth: 0,
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 750, margin: 0 }}>
            Pending Wallet Recharges
          </h2>
          <p style={{ opacity: .7, fontSize: 13, marginTop: 6 }}>
            Server pending recharge requests. Approval requires independent payment verification and administrator confirmation; it may credit the selected Wallet.
          </p>
        </div>
        <button
          type="button"
          disabled={status === "LOADING"}
          onClick={() => setRefresh(x => x + 1)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {status === "LOADING" && (
        <p role="status">Loading pending requests...</p>
      )}

      {status === "ERROR" && (
        <p role="alert">Pending requests unavailable: {error}</p>
      )}

      {status === "READY" && rows.length === 0 && (
        <p>No pending requests on this page.</p>
      )}

      {status === "READY" && rows.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))",
          gap: 12,
        }}>
          {rows.map(row => (
            <article key={row.requestId} style={{
              border: "1px solid rgba(148,163,184,.25)",
              padding: 15,
              borderRadius: 14,
              overflowWrap: "anywhere",
            }}>
              <strong>{row.ownerName}</strong>
              <div>{row.businessName} / {row.branchName}</div>
              <div>Wallet: {row.walletId}</div>
              <div>Amount: <strong>{money(row.amountInr)}</strong></div>
              <div>Payment: {row.paymentMethod}</div>
              <div>Request: {row.requestId}</div>
              <div>Status: {row.status}</div>
              <FinoraRechargePaymentReview
                request={row}
                onCompleted={() => setRefresh(x => x + 1)}
              />
              <small>
                Awaiting independently verified payment.
                No approval action available here.
              </small>
            </article>
          ))}
        </div>
      )}

      <div style={{
        display: "flex",
        gap: 12,
        justifyContent: "flex-end",
        marginTop: 14,
      }}>
        <button type="button"
          disabled={status === "LOADING" || offset === 0}
          onClick={() => setOffset(x => Math.max(0, x - SIZE))}
        >Previous</button>
        <span>Page {Math.floor(offset / SIZE) + 1}</span>
        <button type="button"
          disabled={status === "LOADING" || !hasMore}
          onClick={() => setOffset(x => x + SIZE)}
        >Next</button>
      </div>
    </section>
  );
}