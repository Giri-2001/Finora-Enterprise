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
      <div
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

      <form
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 290px), 1fr))",
                gap: 12,
                marginTop: 12,
              }}
            >
              {page.branches.map((branch) => (
                <article
                  key={`${branch.owner_id}:${branch.business_id}:${branch.branch_id}`}
                  style={{
                    border: "1px solid #293b59",
                    borderRadius: 12,
                    padding: 16,
                    background: "#121e36",
                    overflowWrap: "anywhere",
                  }}
                >
                  <strong style={{ fontSize: 16 }}>
                    {display(branch.branch_name)}
                  </strong>

                  <div style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      disabled={branch.branch_status !== "ACTIVE"}
                        aria-pressed={
                        selectedServerIdentity?.ownerId === branch.owner_id &&
                        selectedServerIdentity?.businessId === branch.business_id &&
                        selectedServerIdentity?.branchId === branch.branch_id
                      }
                      onClick={() =>
                        setSelectedServerIdentity({
                          ownerId: branch.owner_id,
                          businessId: branch.business_id,
                          branchId: branch.branch_id,
                        })
                      }
                    >
                      {selectedServerIdentity?.ownerId === branch.owner_id &&
                      selectedServerIdentity?.businessId === branch.business_id &&
                      selectedServerIdentity?.branchId === branch.branch_id
                        ? "Selected (Read Only)"
                        : "Select Branch"}
                    </button>
                  </div>

                  {selectedServerIdentity?.ownerId === branch.owner_id &&
                    selectedServerIdentity?.businessId === branch.business_id &&
                    selectedServerIdentity?.branchId === branch.branch_id && (
                      <div
                        role="status"
                        style={{
                          padding: 12,
                          marginTop: 12,
                          background: "#17304a",
                          border: "1px solid #39617e",
                          borderRadius: 9,
                          fontSize: 12,
                          lineHeight: 1.8,
                        }}
                      >
                        <strong>Selected server identity</strong>
                        <div>Owner ID: {branch.owner_id}</div>
                        <div>Business ID: {branch.business_id}</div>
                        <div>Branch ID: {branch.branch_id}</div>
                        <div>
                          Read-only selection. No wallet, subscription,
                          provisioning or financial authority granted.
                        </div>
                      </div>
                    )}
                  <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.9 }}>
                    <div>Owner: {display(branch.owner_name)}</div>
                    <div>Business: {display(branch.business_name)}</div>
                    <div>Branch ID: {display(branch.branch_id)}</div>
                    <div>Branch status: {display(branch.branch_status)}</div>
                    <div>Storage: {display(branch.storage_mode)}</div>
                    <div>Wallet ID: {display(branch.wallet_id)}</div>
                    <div>
                      Wallet balance:{" "}
                      {branch.balance_inr === null
                        ? "—"
                        : `₹${display(branch.balance_inr)}`}
                    </div>
                    <div>Wallet status: {display(branch.wallet_status)}</div>
                    <div>Subscription: {display(branch.plan_code)}</div>
                    <div>
                      Subscription status: {display(branch.subscription_status)}
                    </div>
                    <div>Expiry: {formatFinoraDateTime(branch.subscription_expiry)}</div>
                  </div>
                </article>
              ))}
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
            <span style={{ fontSize: 13 }}>
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