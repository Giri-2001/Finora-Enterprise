import "./FinoraControlCenterIncomeEmerald.css";
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
    selectedMonth?: string;
    monthlyReceiptCount?: number;
    totalCashCollectedInr?: number;
    totalCashReceiptCount?: number;
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
    month?: string;
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

/* FINORA_P1_739Q2_MONTHLY_INCOME_UI */
function currentIndiaMonth(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find(part => part.type === "year")?.value;
  const month = parts.find(part => part.type === "month")?.value;

  return `${year}-${month}`;
}

function incomeText(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? `₹${value.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "—";
}
export default function FinoraControlCenterDashboardOverview() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(currentIndiaMonth);

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
          bridge.getServerDashboard({ page: 1, size: 25, month: selectedMonth }),
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

  }, [refresh, selectedMonth]);

  const metrics = [
    ["Total Owners", data?.metrics.totalOwners],
    ["Total Branches", data?.metrics.totalBranches],
    ["Active Plans", data?.metrics.activePlans],
    ["Monthly Income", incomeText(data?.metrics.monthlyIncomeInr)],
    ["Total Cash Collected", incomeText(data?.metrics.totalCashCollectedInr)],
    ["Monthly Recharge Count", data?.metrics.monthlyReceiptCount],
  ] as const;

  return (
    <section className="finora-cc-polish-dashboard" aria-label="FINORA Enterprise Overview" style={{
      padding: 22, marginBottom: 20, borderRadius: 18,
      border: "1px solid rgba(34,197,94,.48)",
      background: "linear-gradient(145deg, rgba(16,185,129,.10) 0%, rgba(13,30,29,.96) 48%, rgba(17,24,39,.98) 100%)",
      boxShadow: "0 12px 32px rgba(0,0,0,.14), inset 0 0 0 1px rgba(34,197,94,.06)",
      color: "var(--finora-theme-text-primary, #f8fafc)"
    }}>
      <div className="finora-cc-polish-overview-header" style={{
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
            border: "1px solid rgba(34,197,94,.5)"
          }}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <p role="alert" style={{
          color: "#fca5a5", fontSize: 13, marginTop: 12
        }}>Live data unavailable: {error}</p>
      )}

      {/* FINORA_P1_739Q2_MONTH_FILTER */}
      <div className="finora-cc-polish-overview-filters" style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        marginTop: 18,
      }}>
        <label
          htmlFor="finora-dashboard-income-month"
          style={{ fontWeight: 650, fontSize: 13 }}
        >
          Income Month / Year
        </label>

        <input
          id="finora-dashboard-income-month"
          type="month"
          min="2020-01"
          max="9999-12"
          value={selectedMonth}
          onChange={event => {
            const value = event.currentTarget.value;
            if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
              setSelectedMonth(value);
            }
          }}
          style={{
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid rgba(34,197,94,.5)",
            background: "var(--finora-theme-surface, #1d212b)",
            color: "var(--finora-theme-text-primary, #f8fafc)",
            colorScheme: "dark",
          }}
        />

        <button
          type="button"
          onClick={() => setSelectedMonth(currentIndiaMonth())}
          style={{
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid rgba(34,197,94,.5)",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          Current Month
        </button>

        <span style={{ opacity: .7, fontSize: 12 }}>
          Verified recharge cash collections
        </span>
      </div>
      <div className="finora-cc-polish-stats" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
        gap: 14, marginTop: 20
      }}>
        {metrics.map(([title, value]) => (
          <article key={title} style={{
            // FINORA_P1_740C_METRIC_GREEN
            background: "linear-gradient(150deg, rgba(6,78,59,.32), rgba(8,31,36,.90))",
            boxShadow: "inset 0 1px 0 rgba(74,222,128,.06)",
            padding: 18, borderRadius: 14,
            border: "1px solid rgba(34,197,94,.2)"
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
</section>
  );
}
