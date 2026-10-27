import { useEffect, useState } from "react";
import type {
  FinoraServerRechargeHistoryRecordView,
  FinoraServerRechargeHistoryStatusView,
} from "../../../../electron/control-center/finoraControlCenterPreload";

const PAGE_SIZE = 10;

function inr(value: string): string {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount)
    : "Unavailable";
}

function ist(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(date)
    : "Unavailable";
}

function HistoryContents() {
  const [filter, setFilter] =
    useState<FinoraServerRechargeHistoryStatusView>("ALL");
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [rows, setRows] =
    useState<FinoraServerRechargeHistoryRecordView[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [state, setState] =
    useState<"LOADING" | "READY" | "ERROR">("LOADING");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setState("LOADING");
    setError("");
    setRows([]);
    setHasMore(false);

    const load = async () => {
      const bridge = window.finoraControlCenter;
      if (!bridge ||
          typeof bridge.getServerRechargeHistory !== "function") {
        if (active) {
          setError("Secure Wallet History bridge unavailable.");
          setState("ERROR");
        }
        return;
      }

      try {
        const result = await bridge.getServerRechargeHistory({
          limit: PAGE_SIZE,
          offset,
          status: filter,
        });

        if (!active) return;

        if (!result.success) {
          setError(result.error);
          setState("ERROR");
          return;
        }

        const page = result.data;
        if (
          page.source !== "POSTGRESQL_RECHARGE_REQUESTS" ||
          page.status !== filter ||
          page.limit !== PAGE_SIZE ||
          page.offset !== offset ||
          !Array.isArray(page.requests) ||
          typeof page.hasMore !== "boolean"
        ) {
          setError("Invalid PostgreSQL Wallet History response.");
          setState("ERROR");
          return;
        }

        setRows(page.requests);
        setHasMore(page.hasMore);
        setState("READY");
      } catch {
        if (active) {
          setError("Unable to reach authenticated Wallet History service.");
          setState("ERROR");
        }
      }
    };

    void load();
    return () => { active = false; };
  }, [filter, offset, revision]);

  const buttonStyle = {
    minHeight: 36,
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid rgba(96,165,250,.40)",
    background: "#172b4b",
    color: "#eff6ff",
    fontWeight: 700,
    cursor: "pointer",
  } as const;

  return (
    <section
      aria-label="Server Wallet Recharge History"
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 22,
        borderRadius: 18,
        border: "1px solid rgba(52,211,153,.3)",
        background: "#12243a",
        color: "#f1f5f9",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 18,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>
            Wallet Recharge History
          </h2>
          <p style={{ margin: "6px 0 0", color: "#a7bbce" }}>
            PostgreSQL finalized recharge decisions · Times in IST
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select
            aria-label="Wallet history status"
            value={filter}
            onChange={event => {
              setFilter(
                event.target.value as FinoraServerRechargeHistoryStatusView
              );
              setOffset(0);
            }}
            style={{
              ...buttonStyle,
              background: "#20364e",
            }}
          >
            <option value="ALL">All decisions</option>
            <option value="APPROVED">Approved</option>
            <option value="DECLINED">Declined</option>
          </select>
          <button
            type="button"
            style={buttonStyle}
            onClick={() => setRevision(value => value + 1)}
          >
            Refresh
          </button>
        </div>
      </div>

      {state === "LOADING" && (
        <p role="status">Loading server recharge history...</p>
      )}

      {state === "ERROR" && (
        <div role="alert" style={{
          padding: 15,
          border: "1px solid #b45353",
          borderRadius: 10,
          color: "#fecaca",
        }}>
          History unavailable: {error}
        </div>
      )}

      {state === "READY" && (
        <>
          {rows.length === 0 ? (
            <p>No finalized recharge records on this page.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
                textAlign: "left",
              }}>
                <thead>
                  <tr>
                    {[
                      "Decision / IST",
                      "Status",
                      "Amount",
                      "Owner / Business",
                      "Branch",
                      "Payment",
                      "Approved / Decided By",
                    ].map(name => (
                      <th key={name} style={{
                        padding: 11,
                        borderBottom: "1px solid #48627c",
                      }}>
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.requestId}>
                      <td style={{ padding: 11, borderBottom: "1px solid #30445b" }}>
                        {ist(row.decidedAt)}
                      </td>
                      <td style={{ padding: 11, borderBottom: "1px solid #30445b" }}>
                        {row.status}
                      </td>
                      <td style={{ padding: 11, borderBottom: "1px solid #30445b" }}>
                        {inr(row.amountInr)}
                      </td>
                      <td style={{ padding: 11, borderBottom: "1px solid #30445b" }}>
                        {row.ownerName}
                        <div style={{ opacity: .7 }}>{row.businessName}</div>
                      </td>
                      <td style={{ padding: 11, borderBottom: "1px solid #30445b" }}>
                        {row.branchName}
                      </td>
                      <td style={{ padding: 11, borderBottom: "1px solid #30445b" }}>
                        {row.paymentMethod}
                      </td>
                      <td style={{ padding: 11, borderBottom: "1px solid #30445b" }}>
                        {row.decidedByActor || "Not supplied"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 10,
            marginTop: 18,
          }}>
            <button
              type="button"
              style={buttonStyle}
              disabled={offset === 0}
              onClick={() => setOffset(value => Math.max(0, value - PAGE_SIZE))}
            >
              Previous
            </button>
            <span>Page {Math.floor(offset / PAGE_SIZE) + 1}</span>
            <button
              type="button"
              style={buttonStyle}
              disabled={!hasMore}
              onClick={() => setOffset(value => value + PAGE_SIZE)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default function FinoraControlCenterHeaderWalletHistory() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        data-finora-header-action="wallet-history"
        onClick={() => setOpen(true)}
        style={{
          minHeight: 40,
          padding: "8px 12px",
          borderRadius: 10,
          border: "1px solid rgba(96,165,250,.5)",
          background: "rgba(30,64,175,.24)",
          color: "#dbeafe",
          fontSize: 13,
          fontWeight: 700,
          whiteSpace: "nowrap",
          cursor: "pointer",
        }}
      >
        Wallet History
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Wallet Recharge History"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10001,
            background: "#0f172a",
            padding: 20,
            overflowY: "auto",
            boxSizing: "border-box",
          }}
        >
          <div style={{
            maxWidth: 1100,
            margin: "0 auto 14px",
            textAlign: "right",
          }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                minHeight: 40,
                padding: "8px 18px",
                background: "#1e3a5f",
                color: "#fff",
                border: "1px solid #52749b",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
          <HistoryContents />
        </div>
      )}
    </>
  );
}