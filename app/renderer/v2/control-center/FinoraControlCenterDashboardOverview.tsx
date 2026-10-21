import { useEffect, useState } from "react";

type Branch = {
  ownerId: string;
  ownerName: string;
  businessName: string;
  branchId: string;
  branchName: string;
  branchStatus: string;
  planCode: string | null;
  validFrom: string | null;
  validUntil: string | null;
  subscriptionState: string;
};

type Dashboard = {
  metrics: {
    totalOwners: number;
    totalBranches: number;
    activePlans: number;
    monthlyIncomeInr: number | null;
    monthlyIncomeStatus: string;
  };
  subscriptionMonitor: {
    page: number;
    size: number;
    branches: Branch[];
  };
};

type DashboardResult =
  | { success: true; data: Dashboard }
  | { success: false; error: string };

type DashboardBridge = {
  getServerDashboard: (query: {
    page: number;
    size: number;
  }) => Promise<DashboardResult>;
};

function getBridge(): DashboardBridge | undefined {
  return (
    window as unknown as {
      finoraControlCenter?: Partial<DashboardBridge>;
    }
  ).finoraControlCenter as DashboardBridge | undefined;
}

const dateText = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN");
};

export default function FinoraControlCenterDashboardOverview() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const bridge = getBridge();
        if (typeof bridge?.getServerDashboard !== "function") {
          throw new Error("Dashboard IPC unavailable in this Electron session");
        }

        // FINORA_P1_595D_REQUEST_TIMEOUT
        // A stalled IPC response must not freeze the dashboard.
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const result = await Promise.race([
          bridge.getServerDashboard({ page: 1, size: 25 }),
          new Promise<DashboardResult>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error("Dashboard request timed out (8 seconds)"));
            }, 8000);
          }),
        ]).finally(() => {
          if (timeoutId !== undefined) clearTimeout(timeoutId);
        });

        if (!active) return;

        // FINORA_P1_595K_IPC_RESULT_NORMALIZATION
        // Accept only an actual successful server payload.
        // Surface nested errors without attempting to render them.
        if (!result || typeof result !== "object") {
          throw new Error("DASHBOARD_IPC_NO_RESPONSE");
        }

        if (!result.success) {
          throw new Error(
            typeof result.error === "string"
              ? result.error
              : "DASHBOARD_IPC_REJECTED"
          );
        }

        const nested = result.data as unknown;
        if (
          nested &&
          typeof nested === "object" &&
          "success" in nested &&
          nested.success === false
        ) {
          throw new Error(
            "error" in nested && typeof nested.error === "string"
              ? nested.error
              : "DASHBOARD_NESTED_IPC_ERROR"
          );
        }

        // FINORA_P1_595I2_RESPONSE_GUARD
        const payload: unknown = result.data;

        if (
          !payload ||
          typeof payload !== "object" ||
          !("metrics" in payload) ||
          !payload.metrics ||
          typeof payload.metrics !== "object" ||
          !("subscriptionMonitor" in payload) ||
          !payload.subscriptionMonitor ||
          typeof payload.subscriptionMonitor !== "object" ||
          !("branches" in payload.subscriptionMonitor) ||
          !Array.isArray(payload.subscriptionMonitor.branches) ||
          !("totalOwners" in payload.metrics) ||
          !Number.isSafeInteger(payload.metrics.totalOwners) ||
          !("totalBranches" in payload.metrics) ||
          !Number.isSafeInteger(payload.metrics.totalBranches) ||
          !("activePlans" in payload.metrics) ||
          !Number.isSafeInteger(payload.metrics.activePlans)
        ) {
          throw new Error("DASHBOARD_RESPONSE_INVALID");
        }

        setData(payload as Dashboard);
      } catch (cause) {
        if (!active) return;
        setData(null);
        setError(
          cause instanceof Error
            ? cause.message
            : "Dashboard unavailable"
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    // FINORA_P1_595F_NON_BLOCKING_MOUNT
    // Allow Branches navigation to paint before starting IPC.
    const start = setTimeout(() => {
      if (active) void load();
    }, 250);

    return () => {
      active = false;
      clearTimeout(start);
    };

  }, [refresh]);

  const metrics = [
    ["Total Owners", data?.metrics.totalOwners],
    ["Total Branches", data?.metrics.totalBranches],
    ["Active Plans", data?.metrics.activePlans],
    ["Monthly Income", data?.metrics.monthlyIncomeInr === null ||
      data?.metrics.monthlyIncomeInr === undefined
        ? undefined
        : `₹${data.metrics.monthlyIncomeInr.toLocaleString("en-IN")}`],
  ] as const;

  return (
    <section aria-label="FINORA Enterprise Overview" style={{
      padding: 22, marginBottom: 20, borderRadius: 18,
      border: "1px solid rgba(212,175,55,.25)",
      background: "var(--finora-theme-surface, #1d212b)",
      color: "var(--finora-theme-text-primary, #f8fafc)"
    }}>
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12, flexWrap: "wrap"
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Enterprise Overview</h2>
          <p style={{ opacity: .7, fontSize: 13 }}>
            Live nationwide owner, branch and subscription monitoring
          </p>
        </div>
        <button type="button" onClick={() => setRefresh(v => v + 1)}
          disabled={loading} style={{
            padding: "9px 16px", borderRadius: 10, cursor: "pointer",
            background: "transparent", color: "inherit",
            border: "1px solid rgba(212,175,55,.5)"
          }}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <p role="alert" style={{
          color: "#fca5a5", fontSize: 13, marginTop: 12
        }}>Live data unavailable: {error}</p>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
        gap: 14, marginTop: 20
      }}>
        {metrics.map(([title, value]) => (
          <article key={title} style={{
            padding: 18, borderRadius: 14,
            border: "1px solid rgba(212,175,55,.2)"
          }}>
            <div style={{ fontSize: 13 }}>{title}</div>
            <div style={{ fontSize: 30, fontWeight: 750, marginTop: 10 }}>
              {value === undefined ? "—" : value}
            </div>
            <div style={{ fontSize: 12, opacity: .65, marginTop: 6 }}>
              {title === "Monthly Income"
                ? "Verified billing only"
                : loading ? "Loading server data" : "PostgreSQL"}
            </div>
          </article>
        ))}
      </div>

      <div style={{
        marginTop: 20, padding: 16, borderRadius: 12,
        border: "1px solid rgba(212,175,55,.2)"
      }}>
        <strong>Branch Subscription Monitor</strong>
        {!data ? (
          <p style={{ fontSize: 13, opacity: .7 }}>
            {loading ? "Loading subscriptions..." : "No verified server data available"}
          </p>
        ) : data.subscriptionMonitor.branches.length === 0 ? (
          <p style={{ fontSize: 13 }}>No branches found.</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["Owner", "Branch", "Plan", "Status", "Expiry"].map(h => (
                    <th key={h} style={{
                      padding: 10, textAlign: "left",
                      borderBottom: "1px solid rgba(212,175,55,.25)"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.subscriptionMonitor.branches.map(branch => (
                  <tr key={branch.branchId}>
                    <td style={{ padding: 10 }}>{branch.ownerName}</td>
                    <td style={{ padding: 10 }}>{branch.branchName}</td>
                    <td style={{ padding: 10 }}>{branch.planCode ?? "—"}</td>
                    <td style={{ padding: 10 }}>{branch.subscriptionState}</td>
                    <td style={{ padding: 10 }}>{dateText(branch.validUntil)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 11, opacity: .65 }}>
              Showing first {data.subscriptionMonitor.branches.length} branches.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}