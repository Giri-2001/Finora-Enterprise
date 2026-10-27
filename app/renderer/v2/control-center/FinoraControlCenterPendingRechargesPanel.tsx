import "./FinoraPremiumRechargePagination.css";
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
      <div className="finora-cc-polish-pending-header" style={{
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
        <div className="finora-cc-polish-pending-grid" style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill,minmax(min(100%,350px),1fr))",
          gap: 16,
          marginTop: 14,
        }}>
          {rows.map(row => (
            <article
              key={row.requestId}
              style={{
                display: "grid",
                gap: 12,
                padding: 18,
                minWidth: 0,
                alignContent: "start",
                borderRadius: 20,
                border: "1px solid rgba(96,165,250,.32)",
                background:
                  "radial-gradient(circle at top left,rgba(37,99,235,.19),transparent 60%),linear-gradient(145deg,#182947,#0c172a)",
                boxShadow: "0 14px 34px rgba(0,0,0,.24)",
                overflowWrap: "anywhere",
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
              }}>
                <div>
                  <div style={{
                    color: "#93c5fd",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: ".12em",
                  }}>
                    FINORA / WALLET RECHARGE
                  </div>
                  <h3 style={{
                    fontSize: 20,
                    margin: "7px 0 4px",
                    color: "#f8fafc",
                  }}>
                    {row.branchName}
                  </h3>
                  <div style={{
                    fontSize: 12,
                    color: "#cbd5e1",
                  }}>
                    {row.ownerName} / {row.businessName}
                  </div>
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#fcd34d",
                  background: "rgba(245,158,11,.13)",
                  border: "1px solid rgba(245,158,11,.35)",
                  borderRadius: 999,
                  padding: "6px 10px",
                }}>
                  {row.status}
                </span>
              </div>

              <div style={{
                padding: 16,
                background: "rgba(37,99,235,.12)",
                border: "1px solid rgba(96,165,250,.22)",
                borderRadius: 14,
              }}>
                <div style={{
                  color: "#93c5fd",
                  fontSize: 11,
                  fontWeight: 750,
                }}>
                  REQUESTED RECHARGE
                </div>
                <div style={{
                  fontSize: 27,
                  fontWeight: 850,
                  color: "#f8fafc",
                  marginTop: 7,
                }}>
                  {money(row.amountInr)}
                </div>
                <div style={{
                  color: "#cbd5e1",
                  fontSize: 12,
                  marginTop: 6,
                }}>
                  Payment: {row.paymentMethod}
                </div>
              </div>

              <details style={{
                color: "#94a3b8",
                fontSize: 11,
              }}>
                <summary style={{ cursor: "pointer" }}>
                  Request identifiers
                </summary>
                <div style={{ marginTop: 8 }}>
                  Request: {row.requestId}
                </div>
                <div>Wallet: {row.walletId}</div>
              </details>

              <FinoraRechargePaymentReview
                request={row}
                onCompleted={() => setRefresh(x => x + 1)}
              />
            </article>
          ))}
        </div>
      )}

      <div className="finora-recharge-pagination" style={{
        display: "flex",
        gap: 12,
        justifyContent: "flex-end",
        marginTop: 14,
      }}>
        <button type="button"
          disabled={status === "LOADING" || offset === 0}
          onClick={() => setOffset(x => Math.max(0, x - SIZE))}
        >Previous</button>
        <span className="finora-recharge-page-badge">Page {Math.floor(offset / SIZE) + 1}</span>
        <button type="button"
          disabled={status === "LOADING" || !hasMore}
          onClick={() => setOffset(x => x + SIZE)}
        >Next</button>
      </div>
    </section>
  );
}