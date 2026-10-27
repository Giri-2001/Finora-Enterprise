import { formatFinoraDateTime } from "../../shared/finoraDateTimeDisplay";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { FormEvent } from "react";


// FINORA_P566EW: Informational context only, not an access grant.
export type FinoraSelectedServerBranchIdentity = {
  ownerId: string;
  businessId: string;
  branchId: string;
};

type DirectoryProps = {
  onSelectionChange?: (
    identity: FinoraSelectedServerBranchIdentity | null
  ) => void;
};

type Branch = {
  owner_id: string;
  owner_name: string;
  business_id: string;
  business_name: string;
  branch_id: string;
  branch_name: string;
  branch_status: string;
  storage_mode: string;
  wallet_id: string | null;
  balance_inr: string | number | null;
  wallet_status: string | null;
  plan_code: string | null;
  subscription_status: string | null;
  subscription_expiry: string | null;
};

type DirectoryPage = {
  source: "POSTGRESQL_BRANCH_DIRECTORY";
  branches: Branch[];
  limit: number;
  offset: number;
  hasMore: boolean;
};

type DirectoryResponse = {
  success: boolean;
  data?: DirectoryPage;
  error?: string;
};

type DirectoryBridge = {
  getServerBranchDirectory?: (
    query: {
      search: string;
      limit: number;
      offset: number;
    },
  ) => Promise<DirectoryResponse>;
};

const PAGE_SIZE = 10;
const REFRESH_MS = 30000;

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  return String(value);
}

function getBridge(): DirectoryBridge | undefined {
  const host = window as unknown as {
    finoraControlCenter?: DirectoryBridge;
  };
  return host.finoraControlCenter;
}

export function FinoraControlCenterServerBranchDirectoryPanel({
  onSelectionChange,
}: DirectoryProps = {}) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [selectedServerIdentity, setSelectedServerIdentity] = useState<FinoraSelectedServerBranchIdentity | null>(null);
  const [flippedBranchKey, setFlippedBranchKey] = useState<string | null>(null);
  const [page, setPage] = useState<DirectoryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const currentQuery = useRef({ search: "", offset: 0 });

  // FINORA_P566EW: UI selection is never server authorization.
  useEffect(() => {
    onSelectionChange?.(selectedServerIdentity);
  }, [selectedServerIdentity, onSelectionChange]);

  useEffect(() => {
    return () => {
      onSelectionChange?.(null);
    };
  }, [onSelectionChange]);

  const load = useCallback(
    async (nextSearch: string, nextOffset: number, silent = false) => {
      const id = ++requestId.current;
      currentQuery.current = {
        search: nextSearch,
        offset: nextOffset,
      };

      // Initial/manual reads show loading. Background reads keep
      // verified cards visible until a fresh server response arrives.
      if (!silent) {
        setLoading(true);
        setError(null);
        setPage(null);
      }

      try {
        const bridge = getBridge();

        if (typeof bridge?.getServerBranchDirectory !== "function") {
          throw new Error("Live directory bridge unavailable");
        }

        const response = await bridge.getServerBranchDirectory({
          search: nextSearch,
          limit: PAGE_SIZE,
          offset: nextOffset,
        });

        if (id !== requestId.current) return;

        if (
          response?.success !== true ||
          !response.data ||
          response.data.source !== "POSTGRESQL_BRANCH_DIRECTORY" ||
          !Array.isArray(response.data.branches) ||
          typeof response.data.hasMore !== "boolean"
        ) {
          const safeCode =
            typeof response?.error === "string" &&
            /^(DIRECTORY|FINORA|CONTROL_CENTER|DEVELOPER|PRICING)_[A-Z0-9_]{1,100}$/.test(response.error)
              ? response.error
              : response?.success === true
                ? "DIRECTORY_RESPONSE_SHAPE_INVALID"
                : "DIRECTORY_IPC_FAILURE_UNKNOWN";

          throw new Error(safeCode);
        }

        // P1-566DR: Keep a read-only selection only when the
        // same identity still exists and remains ACTIVE.
        const verifiedBranches = response.data.branches;
        setSelectedServerIdentity((selected) => {
          if (!selected) return null;

          const stillActive = verifiedBranches.some(
            (branch) =>
              branch.owner_id === selected.ownerId &&
              branch.business_id === selected.businessId &&
              branch.branch_id === selected.branchId &&
              branch.branch_status === "ACTIVE",
          );

          return stillActive ? selected : null;
        });

        setError(null);
        setPage(response.data);
      } catch (error) {
        if (id !== requestId.current) return;
        setPage(null);
        setSelectedServerIdentity(null);

        const message =
          error instanceof Error ? error.message : "";

        const safeCode =
          /^(DIRECTORY|FINORA|CONTROL_CENTER|DEVELOPER|PRICING)_[A-Z0-9_]{1,100}$/.test(message)
            ? message
            : message === "Live directory bridge unavailable"
              ? "DIRECTORY_BRIDGE_UNAVAILABLE"
              : "DIRECTORY_UNEXPECTED_FAILURE";

        setError(
          `Live server directory unavailable. Diagnostic: ${safeCode}`,
        );
      } finally {
        if (id === requestId.current && !silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void load("", 0);

    const timer = setInterval(() => {
      const query = currentQuery.current;
      void load(query.search, query.offset, true);
    }, REFRESH_MS);

    return () => {
      requestId.current++;
      clearInterval(timer);
    };
  }, [load]);

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextSearch = searchInput.trim();
    setSelectedServerIdentity(null);
    setSearch(nextSearch);
    setOffset(0);
    void load(nextSearch, 0);
  };

  const navigate = (nextOffset: number) => {
    setSelectedServerIdentity(null);
    setOffset(nextOffset);
    void load(search, nextOffset);
  };

  return (
    <>
<style>{`
  .finora-live-directory button {
    color: #e8f0ff;
    background: #192846;
    border: 1px solid #344767;
    border-radius: 9px;
    padding: 9px 14px;
  }
  .finora-live-directory button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .finora-live-directory input::placeholder {
    color: #8294b1;
  }
`}</style>
    <section className="finora-live-directory"
      style={{
        border: "1px solid #2a3c5b",
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
        background: "#0f172a",
        color: "#e8f0ff",
      }}
    >
      <div className="finora-cc-polish-branches-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 19 }}>
            Live Owners &amp; Branches
          </h2>
          <p style={{ marginTop: 6, color: "#9fb0ca", fontSize: 13 }}>
            PostgreSQL server directory · Read only · 30-second refresh
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void load(search, offset)}
          style={{
            padding: "9px 15px",
            borderRadius: 9,
            border: "1px solid #344767",
            cursor: loading ? "wait" : "pointer",
            background: "#192846",
          }}
        >
          Refresh
        </button>
      </div>

      <form className="finora-cc-polish-branches-search"
        onSubmit={onSearch}
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 15,
        }}
      >
        <input
          aria-label="Search owners businesses or branches"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          maxLength={100}
          placeholder="Search owner, business or branch"
          style={{
            flex: "1 1 220px",
            minWidth: 0,
            color: "#e8f0ff",
            background: "#121e36",
            padding: "10px 12px",
            border: "1px solid #344767",
            borderRadius: 9,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 18px",
            borderRadius: 9,
            border: "none",
            color: "#fff",
            background: "#17346e",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      {loading && (
        <p role="status" style={{ marginTop: 16 }}>
          Reading live server directory…
        </p>
      )}

      {error && (
        <p role="alert" style={{ marginTop: 16, color: "#ac2633" }}>
          {error}
        </p>
      )}

      {!loading && !error && page && (
        <>
          <p style={{ fontSize: 13, color: "#9fb0ca", marginTop: 16 }}>
            Showing {page.branches.length} server records
            {page.hasMore ? " · More records available" : ""}
          </p>

          {page.branches.length === 0 ? (
            <p>No matching server branches.</p>
          ) : (
            <div className="finora-cc-polish-branches-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
                gap: 12,
                marginTop: 12,
              }}
            >
              {/* FINORA_P1_743F4_FLIP_CARD */}
{page.branches.map((branch) => {
  const key = `${branch.owner_id}:${branch.business_id}:${branch.branch_id}`;
  const flipped = flippedBranchKey === key;
  // FINORA_P1_745D2_LIFECYCLE
  const nowMs = Date.now();
  const expiryMs = branch.subscription_expiry
    ? Date.parse(branch.subscription_expiry)
    : NaN;
  const validExpiry = Number.isFinite(expiryMs);
  const remainingDays = validExpiry
    ? Math.max(0, Math.ceil((expiryMs - nowMs) / 86400000))
    : null;

  const serverStatus = (branch.subscription_status ?? "")
    .trim().toUpperCase();

  const lifecycle =
    serverStatus === "EXPIRED" ||
    (validExpiry && expiryMs <= nowMs)
      ? "EXPIRED"
      : !validExpiry ||
        !["ACTIVE", "EXPIRING_SOON", "EXPIRING SOON"]
          .includes(serverStatus)
        ? "UNKNOWN"
        : remainingDays !== null && remainingDays <= 7
          ? "EXPIRING SOON"
          : "ACTIVE";

  const remainingLabel =
    remainingDays === null
      ? "Unavailable"
      : lifecycle === "EXPIRED"
        ? "0 days"
        : `${remainingDays} day${remainingDays === 1 ? "" : "s"}`;

  const lifecycleColors = {
    ACTIVE: {
      text: "#4ade80",
      border: "rgba(34,197,94,.65)",
      glow: "rgba(22,163,74,.28)",
    },
    "EXPIRING SOON": {
      text: "#fdba74",
      border: "rgba(249,115,22,.75)",
      glow: "rgba(234,88,12,.30)",
    },
    EXPIRED: {
      text: "#fca5a5",
      border: "rgba(239,68,68,.75)",
      glow: "rgba(185,28,28,.30)",
    },
    UNKNOWN: {
      text: "#cbd5e1",
      border: "rgba(148,163,184,.55)",
      glow: "rgba(100,116,139,.22)",
    },
  }[lifecycle];

  const selected =
    selectedServerIdentity?.ownerId === branch.owner_id &&
    selectedServerIdentity?.businessId === branch.business_id &&
    selectedServerIdentity?.branchId === branch.branch_id;

  const face = {
    position: "absolute" as const,
    inset: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
    padding: 18,
    borderRadius: 20,
    border: `1px solid ${lifecycleColors.border}`,
    background: `radial-gradient(circle at top left,${lifecycleColors.glow},transparent 60%),linear-gradient(145deg,#182947,#0c172a)`,
    boxShadow: "0 14px 32px rgba(0,0,0,.22)",
    boxSizing: "border-box" as const,
    backfaceVisibility: "hidden" as const,
    WebkitBackfaceVisibility: "hidden" as const,
    overflow: "hidden" as const,
  };

  const buttonStyle = {
    minHeight: 40,
    padding: "9px 12px",
    borderRadius: 11,
    border: "1px solid rgba(96,165,250,.40)",
    background: "rgba(37,99,235,.23)",
    color: "#eff6ff",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontSize: 12,
    fontWeight: 750,
    cursor: "pointer",
  };

  const balance =
    branch.balance_inr === null
      ? "—"
      : Number.isFinite(Number(branch.balance_inr))
        ? `₹${Number(branch.balance_inr).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : display(branch.balance_inr);

  return (
    <article
      key={key}
      aria-label={`Live branch ${branch.branch_name}`}
      style={{
        width: "100%",
        maxWidth: 340, minWidth: 0, height: 500,
        perspective: 1200,
      }}
    >
      <div style={{
        position: "relative",
        width: "100%",
        height: "100%",
        transformStyle: "preserve-3d",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        transition: "transform 500ms ease",
      }}>
        {/* FRONT SUMMARY */}
        <div
          style={{
            ...face,
            visibility: flipped ? "hidden" : "visible",
            pointerEvents: flipped ? "none" : "auto",
          }}
          onClick={() => setFlippedBranchKey(key)} aria-hidden={flipped}
        >
          <div style={{
            color: "#93c5fd",
            fontSize: 10,
            letterSpacing: ".12em",
            fontWeight: 800,
          }}>
            FINORA • LIVE BRANCH
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{
                margin: 0,
                fontSize: 22,
                color: "#f8fafc",
                overflowWrap: "anywhere",
              }}>
                {display(branch.branch_name)}
              </h3>
              <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 5 }}>
                {display(branch.owner_name)}
              </div>
            </div>
            <span style={{
              padding: "6px 9px",
              borderRadius: 20,
              background: lifecycleColors.glow,
              color: lifecycleColors.text,
              fontSize: 10,
              fontWeight: 800,
            }}>
              {lifecycle}
            </span>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr)", gap: 9,
          }}>
            <div style={{
              padding: 12,
              borderRadius: 13,
              background: "rgba(16,185,129,.10)",
              border: "1px solid rgba(52,211,153,.18)",
              minWidth: 0,
            }}>
              <div style={{ color: "#94a3b8", fontSize: 10 }}>
                WALLET
              </div>
              <strong style={{
                display: "block",
                marginTop: 5, fontSize: 18, color: "#6ee7b7",
              }}>
                {balance}
              </strong>
            </div>

            <div style={{
              padding: 12,
              borderRadius: 13,
              background: "rgba(59,130,246,.10)",
              border: "1px solid rgba(96,165,250,.18)",
              minWidth: 0,
            }}>
              <div style={{ color: "#94a3b8", fontSize: 10 }}>
                PLAN
              </div>
              <strong style={{
                display: "block",
                marginTop: 8,
                fontSize: 12,
                color: "#dbeafe",
                overflowWrap: "anywhere",
              }}>
                {display(branch.plan_code)}
              </strong>
            </div>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            gap: 8,
          }}>
            <span style={{ color: "#94a3b8" }}>Expiry</span>
            <strong style={{ color: "#e2e8f0", textAlign: "right" }}>
              {formatFinoraDateTime(branch.subscription_expiry)}
            </strong>
          </div>

                    <div style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            fontSize: 12,
          }}>
            <span style={{ color: "#94a3b8" }}>
              Remaining Days
            </span>
            <strong style={{
              color: lifecycleColors.text,
              textAlign: "right",
            }}>
              {remainingLabel}
            </strong>
          </div>
<div style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
          }}>
            <span style={{ color: "#94a3b8" }}>Subscription</span>
            <strong style={{ color: lifecycleColors.text }}>{lifecycle}</strong>
          </div>

          <div style={{
  marginTop: "auto",
  textAlign: "center",
  color: "#93c5fd",
  fontSize: 12,
  fontWeight: 700,
}}>
  Click to view details
</div>
        </div>

        {/* BACK DETAILS */}
        <div
          style={{
            ...face,
            transform: "rotateY(180deg)",
            visibility: flipped ? "visible" : "hidden",
            pointerEvents: flipped ? "auto" : "none",
          }}
          onClick={() => setFlippedBranchKey(null)} aria-hidden={!flipped}
        >
          <div style={{
            color: "#93c5fd",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: ".12em",
          }}>
            FINORA • BRANCH DETAILS
          </div>

          <h3 style={{
            margin: 0,
            fontSize: 20,
            color: "#f8fafc",
          }}>
            {display(branch.branch_name)}
          </h3>

          <div style={{
            display: "grid",
            gap: 9,
            overflow: "hidden", minHeight: 0, flex: 1,
          }}>
            {[
              ["Owner", branch.owner_name],
              ["Business", branch.business_name],
              ["Branch ID", branch.branch_id],
              ["Wallet ID", branch.wallet_id],
              ["Storage", branch.storage_mode],
              ["Wallet Status", branch.wallet_status],
              ["Branch Status", branch.branch_status],
              ["Plan Status", branch.subscription_status], ["Lifecycle", lifecycle], ["Remaining Days", remainingLabel],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  paddingBottom: 8,
                  borderBottom: "1px solid rgba(148,163,184,.14)",
                  fontSize: 12,
                }}
              >
                <span style={{
                  color: "#94a3b8",
                  flexShrink: 0,
                }}>
                  {label}
                </span>
                <strong style={{
                  color: "#e2e8f0",
                  textAlign: "right",
                  overflowWrap: "anywhere",
                }}>
                  {display(value)}
                </strong>
              </div>
            ))}
            {selected && (
              <div role="status" style={{
                color: "#6ee7b7",
                fontSize: 11,
              }}>
                Selected identity is read-only.
                No financial authority granted.
              </div>
            )}
          </div>

          <div style={{
  textAlign: "center",
  color: "#93c5fd",
  fontSize: 12,
  fontWeight: 700,
}}>
  Click to return
</div>
        </div>
      </div>
    </article>
  );
})}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 18,
            }}
          >
            <span className="finora-cc-branch-page-label" style={{ fontSize: 13 }}>
              Page {Math.floor(offset / PAGE_SIZE) + 1}
            </span>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                disabled={offset === 0 || loading}
                onClick={() => navigate(Math.max(0, offset - PAGE_SIZE))}
              >
                Previous
              </button>

              <button
                type="button"
                disabled={!page.hasMore || loading}
                onClick={() => navigate(offset + PAGE_SIZE)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
    </>
  );
}