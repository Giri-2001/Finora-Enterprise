import { useEffect, useState } from "react";
import type {
  FinoraServerRechargeHistoryRecordView,
  FinoraServerRechargeHistoryStatusView,
} from "../../../../electron/control-center/finoraControlCenterPreload";

const PAGE_SIZE = 7;

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
  const [dateFilter, setDateFilter] =
    useState<"ALL_DATES" | "TODAY" | "YESTERDAY" | "THIS_MONTH" | "CUSTOM">("ALL_DATES");
  const [customDate, setCustomDate] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [rows, setRows] =
    useState<FinoraServerRechargeHistoryRecordView[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [state, setState] =
    useState<"LOADING" | "READY" | "ERROR">("LOADING");
  const [error, setError] = useState("");
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 760;
  });

  function ymdInIst(value: string): string {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "";

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const year = parts.find(part => part.type === "year")?.value ?? "";
    const month = parts.find(part => part.type === "month")?.value ?? "";
    const day = parts.find(part => part.type === "day")?.value ?? "";

    return year && month && day ? year + "-" + month + "-" + day : "";
  }

  function ownerMobileOf(
    row: FinoraServerRechargeHistoryRecordView,
  ): string | null {
    const value = row.ownerMobile;
    return typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : null;
  }

  const todayYmd = ymdInIst(new Date().toISOString());
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdayYmd = ymdInIst(yesterday.toISOString());
  const currentMonthYmd = todayYmd.slice(0, 7);

  const pageNumber = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = totalCount === null
    ? null
    : Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const showingStart = rows.length === 0 ? 0 : offset + 1;
  const showingEnd = offset + rows.length;

  const visibleRows = rows.filter(row => {
    if (dateFilter === "ALL_DATES") return true;

    const rowYmd = ymdInIst(row.decidedAt);
    if (!rowYmd) return false;

    if (dateFilter === "TODAY") {
      return rowYmd === todayYmd;
    }

    if (dateFilter === "YESTERDAY") {
      return rowYmd === yesterdayYmd;
    }

    if (dateFilter === "THIS_MONTH") {
      return rowYmd.slice(0, 7) === currentMonthYmd;
    }

    if (dateFilter === "CUSTOM") {
      if (!customDate) return true;
      return rowYmd === customDate;
    }

    return true;
  });

  const buttonStyle = {
    minHeight: 40,
    padding: "8px 14px",
    borderRadius: 12,
    border: "1px solid rgba(96,165,250,.40)",
    background: "#1d3a58",
    color: "#eff6ff",
    fontWeight: 650,
    cursor: "pointer",
    whiteSpace: "nowrap",
  } as const;

  const selectStyle = {
    ...buttonStyle,
    background: "#20364e",
    minWidth: isCompact ? "100%" : 150,
    width: isCompact ? "100%" : "auto",
    boxSizing: "border-box",
  } as const;

  const inputStyle = {
    minHeight: 40,
    width: "100%",
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid rgba(96,165,250,.40)",
    background: "#20364e",
    color: "#eff6ff",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  useEffect(() => {
    const onResize = () => {
      setIsCompact(window.innerWidth <= 760);
    };

    if (typeof window !== "undefined") {
      onResize();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  }, []);

  useEffect(() => {
    const refreshConfirmedRecharge = () => {
      setRevision(value => value + 1);
    };

    window.addEventListener(
      "finora:control-center-recharge-decision-confirmed",
      refreshConfirmedRecharge
    );

    return () => window.removeEventListener(
      "finora:control-center-recharge-decision-confirmed",
      refreshConfirmedRecharge
    );
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const normalized = searchInput.trim();
      setOffset(0);
      setSearch(previous => previous === normalized ? previous : normalized);
    }, 250);

    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    setState("LOADING");
    setError("");
    setRows([]);
    setHasMore(false);
    setTotalCount(null);

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
          search,
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
        setTotalCount(
          typeof page.totalCount === "number" &&
          Number.isSafeInteger(page.totalCount) &&
          page.totalCount >= 0
            ? page.totalCount
            : null
        );
        setState("READY");
      } catch {
        if (active) {
          setError("Unable to reach authenticated Wallet History service.");
          setState("ERROR");
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [filter, offset, revision, search]);

  return (
    <section
      aria-label="Server Wallet Recharge History"
      style={{
        width: "100%",
        maxWidth: 1560,
        margin: "0 auto",
        padding: isCompact ? 16 : 22,
        borderRadius: 18,
        border: "1px solid rgba(52,211,153,.3)",
        background: "#12243a",
        color: "#f1f5f9",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: isCompact ? "stretch" : "center",
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>
            Wallet Recharge History
          </h2>
          <p style={{ margin: "6px 0 0", color: "#a7bbce" }}>
            PostgreSQL finalized recharge decisions
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: isCompact ? "column" : "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            width: isCompact ? "100%" : "auto",
            marginLeft: isCompact ? 0 : "auto",
          }}
        >

          <select
            aria-label="Wallet history date filter"
            value={dateFilter}
            onChange={event => {
              const next = event.target.value as
                | "ALL_DATES"
                | "TODAY"
                | "YESTERDAY"
                | "THIS_MONTH"
                | "CUSTOM";
              setDateFilter(next);
              setOffset(0);
              if (next !== "CUSTOM") {
                setCustomDate("");
              }
            }}
            style={selectStyle}
          >
            <option value="ALL_DATES">All dates</option>
            <option value="TODAY">Today</option>
            <option value="YESTERDAY">Yesterday</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="CUSTOM">Calendar date</option>
          </select>

          <select
            aria-label="Wallet history status"
            value={filter}
            onChange={event => {
              setFilter(
                event.target.value as FinoraServerRechargeHistoryStatusView
              );
              setOffset(0);
            }}
            style={selectStyle}
          >
            <option value="ALL">All decisions</option>
            <option value="APPROVED">Approved</option>
            <option value="DECLINED">Declined</option>
          </select>

          <button
            type="button"
            style={{
              ...buttonStyle,
              width: isCompact ? "100%" : "auto",
              boxSizing: "border-box",
            }}
            onClick={() => setRevision(value => value + 1)}
          >
            Refresh
          </button>
        </div>
      </div>

      {dateFilter === "CUSTOM" && (
        <div
          style={{
            display: "flex",
            justifyContent: isCompact ? "stretch" : "center",
            marginBottom: 16,
          }}
        >
          <div style={{ width: isCompact ? "100%" : 220 }}>
            <input
              aria-label="Wallet history calendar date"
              type="date"
              value={customDate}
              onChange={event => setCustomDate(event.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {state === "LOADING" && (
        <p role="status">Loading server recharge history...</p>
      )}

      {state === "ERROR" && (
        <div
          role="alert"
          style={{
            padding: 15,
            border: "1px solid #b45353",
            borderRadius: 10,
            color: "#fecaca",
          }}
        >
          History unavailable: {error}
        </div>
      )}

      {state === "READY" && (
        <>
          {visibleRows.length === 0 ? (
            <p>
              {rows.length === 0
                ? "No finalized recharge records on this page."
                : "No finalized recharge records match the selected date filter on this page."}
            </p>
          ) : isCompact ? (
            <div style={{ display: "grid", gap: 14 }}>
              {visibleRows.map(row => {
                const infoTitle =
                  row.status === "APPROVED"
                    ? "UPI Reference"
                    : "Decline Reason";
                const infoValue =
                  row.status === "APPROVED"
                    ? (row.verifiedPaymentReference || "Not recorded")
                    : (row.declineReason || "Not supplied");
                const ownerMobile = ownerMobileOf(row);

                return (
                  <article
                    key={row.requestId}
                    style={{
                      borderRadius: 18,
                      border:
                        row.status === "APPROVED"
                          ? "1px solid rgba(52,211,153,.45)"
                          : "1px solid rgba(248,113,113,.45)",
                      background:
                        row.status === "APPROVED"
                          ? "rgba(16,185,129,0.12)"
                          : "rgba(239,68,68,0.12)",
                      padding: 16,
                    }}
                  >
                    {[
                      ["Decision / IST", ist(row.decidedAt)],
                      ["Status", row.status],
                      ["Amount", inr(row.amountInr)],
                      ["Owner / Business", row.ownerName],
                      ["Branch", row.branchName],
                      ["Payment", row.paymentMethod],
                      ["Decided By", row.decidedByActor || "Not supplied"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: "10px 0",
                          borderBottom: "1px solid #30445b",
                        }}
                      >
                        <div
                          style={{
                            color: "#a7bbce",
                            fontWeight: 650,
                            flex: "0 0 44%",
                          }}
                        >
                          {label}
                        </div>
                        <div
                          style={{
                            textAlign: "right",
                            flex: 1,
                            fontWeight:
                              label === "Amount" || label === "Status"
                                ? 700
                                : 500,
                            color:
                              label === "Status"
                                ? row.status === "APPROVED"
                                  ? "#6ee7b7"
                                  : "#fca5a5"
                                : "#f8fafc",
                            wordBreak: "break-word",
                          }}
                        >
                          {value}
                          {label === "Owner / Business" && (
                            <div
                              style={{
                                marginTop: 2,
                                opacity: .75,
                                fontWeight: 500,
                              }}
                            >
                              {row.businessName}
                            </div>
                          )}
                          {label === "Payment" && ownerMobile && (
                            <div
                              style={{
                                marginTop: 2,
                                opacity: .75,
                                fontWeight: 500,
                                fontSize: 12,
                              }}
                            >
                              {ownerMobile}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <div
                      style={{
                        marginTop: 12,
                        border: "1px solid rgba(96,165,250,.22)",
                        borderRadius: 12,
                        padding: 12,
                        background: "rgba(15,23,42,.18)",
                      }}
                    >
                      <div
                        style={{
                          color: "#a7bbce",
                          fontSize: 12,
                          marginBottom: 6,
                        }}
                      >
                        {infoTitle}
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#f8fafc",
                          wordBreak: "break-word",
                        }}
                      >
                        {infoValue}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                  textAlign: "left",
                }}
              >
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
                      "UPI Reference / Decline Reason",
                    ].map(name => (
                      <th
                        key={name}
                        style={{
                          padding: 11,
                          borderBottom: "1px solid #48627c",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map(row => {
                    const ownerMobile = ownerMobileOf(row);
                    return (
                      <tr
                        key={row.requestId}
                        style={{
                          background:
                            row.status === "APPROVED"
                              ? "rgba(16,185,129,0.12)"
                              : "rgba(239,68,68,0.12)",
                          color: "#f1f5f9",
                          borderLeft:
                            row.status === "APPROVED"
                              ? "3px solid #34d399"
                              : "3px solid #f87171",
                        }}
                      >
                        <td style={{ padding: 11, borderBottom: "1px solid #30445b" }}>
                          {ist(row.decidedAt)}
                        </td>
                        <td style={{ padding: 11, borderBottom: "1px solid #30445b" }}>
                          <span
                            style={{
                              color:
                                row.status === "APPROVED"
                                  ? "#6ee7b7"
                                  : "#fca5a5",
                              fontWeight: 650,
                            }}
                          >
                            {row.status}
                          </span>
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
                          {ownerMobile && (
                            <div style={{ opacity: .7, fontSize: 12 }}>
                              {ownerMobile}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: 11, borderBottom: "1px solid #30445b" }}>
                          {row.decidedByActor || "Not supplied"}
                        </td>
                        <td style={{ padding: 11, borderBottom: "1px solid #30445b" }}>
                          <div style={{ opacity: .7, fontSize: 12, marginBottom: 4 }}>
                            {row.status === "APPROVED"
                              ? "UPI Reference"
                              : "Decline Reason"}
                          </div>
                          <div style={{ fontWeight: 700 }}>
                            {row.status === "APPROVED"
                              ? (row.verifiedPaymentReference || "Not recorded")
                              : (row.declineReason || "Not supplied")}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div
            aria-label="Wallet history pagination"
            style={{
              display: "grid",
              gridTemplateColumns: isCompact
                ? "minmax(0, 1fr) minmax(0, 1.3fr) minmax(0, 1fr)"
                : "auto auto auto",
              justifyContent: isCompact ? "stretch" : "end",
              alignItems: "center",
              gap: isCompact ? 5 : 12,
              width: "100%",
              marginTop: 18,
            }}
          >
            <button
              type="button"
              style={{
                ...buttonStyle,
                padding: isCompact ? "9px 5px" : "8px 14px",
                minWidth: 0,
                width: "100%",
                fontSize: isCompact ? 12 : 13,
              }}
              disabled={offset === 0}
              onClick={() => setOffset(value => Math.max(0, value - PAGE_SIZE))}
            >
              Previous
            </button>

            <div
              style={{
                textAlign: "center",
                minWidth: 0,
                fontSize: isCompact ? 11 : 13,
                lineHeight: 1.45,
              }}
            >
              <div style={{
                fontWeight: 700,
                whiteSpace: "nowrap",
                fontSize: isCompact ? 12 : 13,
              }}>
                Page {pageNumber}{totalPages === null ? "" : ` of ${totalPages}`}
              </div>
            </div>

            <button
              type="button"
              style={{
                ...buttonStyle,
                padding: isCompact ? "9px 5px" : "8px 14px",
                minWidth: 0,
                width: "100%",
                fontSize: isCompact ? 12 : 13,
              }}
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
            width: "100%",
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