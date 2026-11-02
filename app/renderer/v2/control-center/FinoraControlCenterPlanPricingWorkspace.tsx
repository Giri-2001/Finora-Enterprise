import { History as PricingHistoryIcon } from "lucide-react";
import { showFinoraDialog } from "../components/common/dialog/finoraDialog.service";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type Props = {
  onClose: () => void;
};

type Branch = {
  owner_id: string;
  business_id: string;
  branch_id: string;
  branch_name: string;
  owner_name: string;
  branch_status: string;
};

type DirectoryResponse = {
  success: boolean;
  data?: {
    source: "POSTGRESQL_BRANCH_DIRECTORY";
    branches: Branch[];
    hasMore: boolean;
  };
};

type Bridge = {
  getServerBranchDirectory?: (query: {
    search: string;
    limit: number;
    offset: number;
  }) => Promise<DirectoryResponse>;

  getServerFourPlanPricing?: (request: {
    scope: "GLOBAL" | "BRANCH";
    branchId: string | null;
  }) => Promise<PricingResult>;
  saveServerFourPlanPricing?: (payload: {
    scope: { kind: "GLOBAL" | "BRANCH"; branchId: string | null };
    plans: Array<{
      months: 1 | 3 | 6 | 12;
      subscriptionPriceInr: string;
      fees: {
        CUSTOMER_CREATE: string;
        LOAN_DISBURSEMENT: string;
        COLLECTION: string;
      };
    }>;
  }) => Promise<{
    success: boolean;
    data?: {
      ok: true;
      revisionId: string;
      pricesWritten: 16;
    };
    error?: string;
  }>;
};

type PricingPrice = {
  amountInr: string;
  source: "GLOBAL" | "BRANCH";
  revisionId: string;
};

type PricingPlan = {
  months: 1 | 3 | 6 | 12;
  subscription: PricingPrice;
  fees: {
    CUSTOMER_CREATE: PricingPrice;
    LOAN_DISBURSEMENT: PricingPrice;
    COLLECTION: PricingPrice;
  };
};

type PricingView = {
  ok: true;
  scope: "GLOBAL" | "BRANCH";
  branchId: string | null;
  plans: PricingPlan[];
};

type PricingResult = {
  success: boolean;
  data?: PricingView;
  error?: string;
};

// FINORA_C8V3_READ_ONLY_PRICING
function validPricing(
  view: PricingView | undefined,
  expectedScope: "GLOBAL" | "BRANCH",
  branchId: string | null,
): view is PricingView {
  if (
    !view ||
    view.ok !== true ||
    view.scope !== expectedScope ||
    view.branchId !== branchId ||
    !Array.isArray(view.plans) ||
    view.plans.length !== 4
  ) {
    return false;
  }

  const seen = new Set<number>();

  for (const plan of view.plans) {
    if (
      ![1, 3, 6, 12].includes(plan.months) ||
      seen.has(plan.months)
    ) {
      return false;
    }

    seen.add(plan.months);

    const prices = [
      plan.subscription,
      plan.fees?.CUSTOMER_CREATE,
      plan.fees?.LOAN_DISBURSEMENT,
      plan.fees?.COLLECTION,
    ];

    if (prices.length !== 4) return false;

    for (const price of prices) {
      if (
        !price ||
        typeof price.amountInr !== "string" ||
        !/^(0|[1-9]\d*)(?:\.\d{1,2})?$/.test(price.amountInr) ||
        !Number.isFinite(Number(price.amountInr)) ||
        typeof price.revisionId !== "string" ||
        price.revisionId.length === 0 ||
        !["GLOBAL", "BRANCH"].includes(price.source) ||
        (expectedScope === "GLOBAL" && price.source !== "GLOBAL")
      ) {
        return false;
      }
    }
  }

  return seen.size === 4;
}
const MONTHS = [1, 3, 6, 12] as const;

const FIELDS = [{ key: "subscription", label: "Subscription Price" }] as const;

const font = "Inter, ui-sans-serif, system-ui, sans-serif";

const panelStyle: CSSProperties = {
  display: "grid",
  gap: 14,
  minWidth: 0,
  padding: 18,
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,.23)",
  background: "linear-gradient(145deg,#13243c,#0c1729)",
};

const fieldStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #354561",
  borderRadius: 9,
  padding: "10px 12px",
  background: "#080f20",
  color: "#f8fafc",
  fontFamily: font,
  fontSize: 14,
  fontWeight: 600,
};

export default function FinoraControlCenterPlanPricingWorkspace({
  onClose,
}: Props) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [scope, setScope] = useState("GLOBAL");
  const [pricing, setPricing] = useState<PricingView | null>(null);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FINORA_C8_X42_O_EDITABLE_DRAFTS
  // Local input drafts only. Never treated as server pricing.
  // FINORA_C8_X42_AM_R1_SERVER_ONLY
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [savingPricing, setSavingPricing] = useState(false);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);

  async function savePricingToServer() {
    if (savingPricing || !selectedValid) return;

    const bridge = (
      window as unknown as { finoraControlCenter?: Bridge }
    ).finoraControlCenter;

    if (typeof bridge?.saveServerFourPlanPricing !== "function") {
      setDraftMessage("Server Save unavailable. No prices saved.");
      return;
    }

    const money = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

    const amounts = MONTHS.map((months) => {
      const plan = pricing?.plans.find((item) => item.months === months);

      function getAmount(field: string, fallback?: string) {
        return priceDrafts[`${scope}:${months}:${field}`] ?? fallback ?? "";
      }

      return {
        months,
        subscriptionPriceInr: getAmount(
          "subscription", plan?.subscription.amountInr,
        ),
        fees: { CUSTOMER_CREATE: "0", LOAN_DISBURSEMENT: "0", COLLECTION: "0" },
      };
    });

    const values = amounts.flatMap((item) => [
      item.subscriptionPriceInr,
      item.fees.CUSTOMER_CREATE,
      item.fees.LOAN_DISBURSEMENT,
      item.fees.COLLECTION,
    ]);

    if (
      values.length !== 16 ||
      !values.every(
        (value) =>
          money.test(value) &&
          Number.isFinite(Number(value)) &&
          Number(value) <= 25000,
      )
    ) {
      setDraftMessage("Enter all four valid subscription prices before saving.");
      return;
    }

    const branchId = scope === "GLOBAL" ? null : scope;
    const scopeKind = scope === "GLOBAL" ? "GLOBAL" as const : "BRANCH" as const;

    setSavingPricing(true);
    setDraftMessage(null);

    try {
      const result = await bridge.saveServerFourPlanPricing({
        scope: {
          kind: scopeKind,
          branchId,
        },
        plans: amounts.map((item) => ({
          months: item.months as 1 | 3 | 6 | 12,
          subscriptionPriceInr: item.subscriptionPriceInr,
          fees: item.fees,
        })),
      });

      if (
        result.success !== true ||
        result.data?.ok !== true ||
        result.data.pricesWritten !== 16
      ) {
        throw new Error("SERVER_SAVE_UNCONFIRMED");
      }

      if (typeof bridge.getServerFourPlanPricing !== "function") {
        throw new Error("SERVER_READBACK_UNAVAILABLE");
      }

      const verification = await bridge.getServerFourPlanPricing({
        scope: scopeKind,
        branchId,
      });

      if (
        verification.success !== true ||
        !verification.data ||
        verification.data.ok !== true ||
        !Array.isArray(verification.data.plans) ||
        verification.data.plans.length !== 4
      ) {
        throw new Error("SERVER_READBACK_FAILED");
      }

      const matches = amounts.every((expected) => {
        const received = verification.data!.plans.find(
          (item) => item.months === expected.months,
        );

        if (!received) return false;

        return (
          Number(received.subscription.amountInr) ===
            Number(expected.subscriptionPriceInr) &&
          Number(received.fees.CUSTOMER_CREATE.amountInr) ===
            Number(expected.fees.CUSTOMER_CREATE) &&
          Number(received.fees.LOAN_DISBURSEMENT.amountInr) ===
            Number(expected.fees.LOAN_DISBURSEMENT) &&
          Number(received.fees.COLLECTION.amountInr) ===
            Number(expected.fees.COLLECTION)
        );
      });

      if (!matches) {
        throw new Error("SERVER_PRICE_READBACK_MISMATCH");
      }

      const changes: string[] = [];
      const previousPlans = pricing?.plans;

      const fields = [
        {
          label: "Subscription Price",
          oldValue: (plan: NonNullable<typeof previousPlans>[number]) =>
            plan.subscription.amountInr,
          newValue: (plan: (typeof amounts)[number]) =>
            plan.subscriptionPriceInr,
        },
        {
          label: "Customer Creation",
          oldValue: (plan: NonNullable<typeof previousPlans>[number]) =>
            plan.fees.CUSTOMER_CREATE.amountInr,
          newValue: (plan: (typeof amounts)[number]) =>
            plan.fees.CUSTOMER_CREATE,
        },
        {
          label: "Loan Disbursement",
          oldValue: (plan: NonNullable<typeof previousPlans>[number]) =>
            plan.fees.LOAN_DISBURSEMENT.amountInr,
          newValue: (plan: (typeof amounts)[number]) =>
            plan.fees.LOAN_DISBURSEMENT,
        },
        {
          label: "Collection",
          oldValue: (plan: NonNullable<typeof previousPlans>[number]) =>
            plan.fees.COLLECTION.amountInr,
          newValue: (plan: (typeof amounts)[number]) =>
            plan.fees.COLLECTION,
        },
      ];

      if (previousPlans?.length === 4) {
        for (const next of amounts) {
          const previous = previousPlans.find(
            (plan) => plan.months === next.months,
          );

          if (!previous) continue;

          for (const field of fields) {
            const oldValue = Number(field.oldValue(previous));
            const newValue = Number(field.newValue(next));

            if (oldValue !== newValue) {
              const format = (amount: number) =>
                `₹${amount.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}`;

              changes.push(
                `${next.months} ${next.months === 1 ? "Month" : "Months"} Plan — ${field.label}\n` +
                `Old: ${format(oldValue)}  →  New: ${format(newValue)}`,
              );
            }
          }
        }
      }

      setPricing(verification.data);
      setPricingError(null);

      setDraftMessage(
        `PostgreSQL Save verified: 16 prices. Revision ${result.data.revisionId}.`,
      );

      const scopeLabel =
        scopeKind === "GLOBAL" ? "Global" : "Branch";

      const changeSummary =
        !previousPlans || previousPlans.length !== 4
          ? "Previous authoritative prices were unavailable, so an Old/New comparison cannot be verified."
          : changes.length === 0
            ? "All 16 prices match the previously loaded server prices."
            : `${changes.length} price change${changes.length === 1 ? "" : "s"}:\n\n${changes.join("\n\n")}`;

      void showFinoraDialog({
        kind: "success",
        heading: "FINORA Control Center",
        message:
          `${scopeLabel} Pricing Saved Successfully\n\n` +
          `${changeSummary}\n\n` +
          `16 prices verified in PostgreSQL.\n` +
          `Revision: ${result.data.revisionId}`,
        confirmLabel: "OK",
      });
    } catch {
      setDraftMessage(
        "Server Save/readback not confirmed. Verify server prices before retrying.",
      );

      void showFinoraDialog({
        kind: "error",
        heading: "FINORA Control Center",
        message:
          "Pricing Save Could Not Be Verified.\n\n" +
          "Server persistence or PostgreSQL readback was not confirmed.\n" +
          "Check current server prices before trying again.",
        confirmLabel: "OK",
      });
    } finally {
      setSavingPricing(false);
    }
  }
  // HF28_CB1_R2_HISTORY
  const [pricingHistoryOpen, setPricingHistoryOpen] = useState(false);
  // HF28_CB3_HISTORY_FILTERS
  const [historyScope, setHistoryScope] = useState("ALL");
  const [historyPeriod, setHistoryPeriod] = useState("ALL");
  const [historyDate, setHistoryDate] = useState("");
  const [historyMonth, setHistoryMonth] = useState("");
  const [historyYear, setHistoryYear] = useState(
    String(new Date().getFullYear())
  );
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  function updatePriceDraft(key: string, value: string) {
    setPriceDrafts((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const bridge = (
          window as unknown as { finoraControlCenter?: Bridge }
        ).finoraControlCenter;

        if (typeof bridge?.getServerBranchDirectory !== "function") {
          throw new Error("Live Branch Directory unavailable");
        }

        const records: Branch[] = [];
        let offset = 0;
        let completed = false;

        for (let page = 0; page < 100; page++) {
          const result = await bridge.getServerBranchDirectory({
            search: "",
            limit: 10,
            offset,
          });

          if (
            result.success !== true ||
            result.data?.source !== "POSTGRESQL_BRANCH_DIRECTORY" ||
            !Array.isArray(result.data.branches) ||
            typeof result.data.hasMore !== "boolean"
          ) {
            throw new Error("Branch Directory response invalid");
          }

          records.push(...result.data.branches);

          if (!result.data.hasMore) {
            completed = true;
            break;
          }

          if (result.data.branches.length === 0) {
            throw new Error("Branch Directory pagination incomplete");
          }

          offset += result.data.branches.length;
        }

        if (!completed) {
          throw new Error("Branch Directory page limit exceeded");
        }

        const seen = new Set<string>();

        for (const branch of records) {
          if (!branch.branch_id || seen.has(branch.branch_id)) {
            throw new Error("Duplicate or invalid branch identity");
          }
          seen.add(branch.branch_id);
        }

        if (active) {
          setBranches(records);
          setError(null);
        }
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load Live Branch Directory",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const global = scope === "GLOBAL";
  const selected = branches.find((b) => b.branch_id === scope);
  const selectedValid = global || selected !== undefined;

  function changeScope(next: string) {
    setPricing(null);
    setPricingError(null);
    setPricingLoading(true);
    setScope(next);
  }

  // FINORA_C8V3_READ_ONLY_PRICING
  useEffect(() => {
    let active = true;

    setPricing(null);
    setPricingError(null);
    setPricingLoading(true);

    async function loadPricing() {
      try {
        const bridge = (
          window as unknown as { finoraControlCenter?: Bridge }
        ).finoraControlCenter;

        if (typeof bridge?.getServerFourPlanPricing !== "function") {
          throw new Error("Secure Pricing GET bridge unavailable");
        }

        const requestScope = scope === "GLOBAL" ? "GLOBAL" : "BRANCH";
        const branchId = requestScope === "GLOBAL" ? null : scope;

        if (requestScope === "BRANCH" && !selectedValid) {
          throw new Error("Selected pricing branch is unavailable");
        }

        const response = await bridge.getServerFourPlanPricing({
          scope: requestScope,
          branchId,
        });

        if (
          response.success !== true ||
          !validPricing(response.data, requestScope, branchId)
        ) {
          throw new Error("Authoritative 16-price response unavailable");
        }

        if (active) {
          setPricing(response.data);
          setPricingError(null);
        }
      } catch (cause) {
        if (active) {
          setPricing(null);
          setPricingError(
            cause instanceof Error
              ? cause.message
              : "Unable to load authoritative pricing",
          );
        }
      } finally {
        if (active) setPricingLoading(false);
      }
    }

    void loadPricing();

    return () => {
      active = false;
    };
  }, [scope, selectedValid]);

  return (
    <section
      data-finora-plan-pricing-workspace="true"
      style={{
        display: "grid",
        gap: 18,
        fontFamily: font,
        color: "#f8fafc",
      }}
    >
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 15,
        flexWrap: "wrap",
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
          }}>
            FINORA Prices
          </h1>
          <p style={{
            margin: "7px 0 0",
            color: "#9eb4d1",
            fontSize: 13,
          }}>
            Four subscription plans. Independent branch pricing.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            ...fieldStyle,
            width: "auto",
            cursor: "pointer",
          }}
        >
          Back to Branches
        </button>
      </header>

      <div style={panelStyle}>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 650 }}>
            Pricing Scope
          </span>

          <select
            value={scope}
            disabled={loading || error !== null}
            onChange={(event) => changeScope(event.target.value)}
            style={fieldStyle}
          >
            <option value="GLOBAL">
              All Branches — Global Defaults
            </option>

            {branches.map((branch) => (
              <option
                key={branch.branch_id}
                value={branch.branch_id}
              >
                {branch.branch_name} · {branch.branch_id}
                {" · "}{branch.owner_name}
              </option>
            ))}
          </select>
        </label>

        <div style={{
          color: "#a8bfdb",
          fontSize: 12,
          lineHeight: 1.6,
        }}>
          {global
            ? "Global prices are defaults for branches without an individual override."
            : `Individual pricing for ${selected?.branch_name ?? "selected branch"} only.`}
        </div>

        {loading && (
          <div>Loading Live Branch Directory...</div>
        )}

        {pricingLoading && (
          <div>Loading authoritative 16 prices...</div>
        )}

        {pricingError && (
          <div role="alert" style={{ color: "#fca5a5" }}>
            {pricingError}
          </div>
        )}

        {error && (
          <div role="alert" style={{ color: "#fca5a5" }}>
            {error}
          </div>
        )}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))",
        gap: 14,
      }}>
        {MONTHS.map((months) => (
          <article key={months} style={panelStyle}>
            <div>
              <h2 style={{
                fontSize: 18,
                fontWeight: 650,
                margin: 0,
              }}>
                {months} {months === 1 ? "Month" : "Months"} Plan
              </h2>
              <div style={{
                marginTop: 5,
                color: "#94a3b8",
                fontSize: 12,
              }}>
                Subscription-only plan
              </div>
            </div>

            {FIELDS.map((field) => {
              const draftKey = `${scope}:${months}:${field.key}`;
              const plan = pricing?.plans.find(
                (entry) => entry.months === months
              );

              const price = plan?.subscription;

              return (
                <label
                  key={field.key}
                  style={{ display: "grid", gap: 7 }}
                >
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#cbd5e1",
                  }}>
                    {field.label}
                  </span>

                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute",
                      left: 12,
                      top: 10,
                      color: "#94a3b8",
                    }}>
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      max="25000"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="Enter amount"
                      value={
                        priceDrafts[draftKey] ??
                        price?.amountInr ??
                        ""
                      }
                      onChange={(event) =>
                        updatePriceDraft(
                          draftKey,
                          event.target.value,
                        )
                      }
                      disabled={!selectedValid}
                      style={{
                        ...fieldStyle,
                        paddingLeft: 32,
                      }}
                    />
                  </div>
                </label>
              );
            })}
          </article>
        ))}
      </div>

      <div style={{
        ...panelStyle,
        borderColor: "rgba(251,191,36,.35)",
        background: "rgba(30,41,59,.55)",
      }}>
        <p style={{
          fontSize: 13,
          color: "#fde68a",
          margin: 0,
        }}>
          Before Save: Changes are not applied until you save.
          Save sends all 16 plan prices to the authenticated FINORA server.
          Success means all 16 prices were saved and verified in PostgreSQL.
          Saved prices become available to the Owner App; Owner App display is verified separately.
        </p>

        {draftMessage && (
          <p role="status" style={{ fontSize: 12, color: "#fde68a" }}>
            {draftMessage}
          </p>
        )}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
        }}>
          <button
              type="button"
              aria-label="Open Pricing Change History"
              onClick={() => setPricingHistoryOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                minHeight: 42,
                padding: "10px 17px",
                marginRight: 10,
                border: "1px solid rgba(148,163,184,.4)",
                borderRadius: 11,
                background: "#20364e",
                color: "#f8fafc",
                fontSize: 13,
                fontWeight: 650,
                cursor: "pointer",
              }}
            >
              <PricingHistoryIcon
                size={17}
                strokeWidth={2}
                aria-hidden="true"
              />
              History
            </button>
<button
            type="button"
            disabled={!selectedValid || pricingLoading || savingPricing}
            onClick={savePricingToServer}
            title="Save all 16 prices through authenticated server API"
            style={{
              ...fieldStyle,
              width: "auto",
              padding: "11px 18px",
              background: "#14504e",
              opacity: 1,
              cursor: "pointer",
            }}
          >
            {global
              ? "Save Global Pricing"
              : "Save Branch Pricing"}
          </button>
        </div>
      </div>
      {/* HF28_CB1_R2_HISTORY_PANEL */}
      {pricingHistoryOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(2,6,23,.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            boxSizing: "border-box",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Pricing Change History"
            style={{
              width: "100%",
              maxWidth: 1150,
              maxHeight: "92vh",
              overflowY: "auto",
              background: "#102238",
              color: "#f8fafc",
              border: "1px solid rgba(52,211,153,.35)",
              borderRadius: 18,
              padding: 22,
              boxSizing: "border-box",
              boxShadow: "0 24px 70px rgba(0,0,0,.4)",
            }}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 22,
            }}>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: 23,
                  fontWeight: 700,
                }}>
                  Pricing Change History
                </h2>
                <p style={{
                  margin: "7px 0 0",
                  fontSize: 13,
                  color: "#a7bbce",
                }}>
                  PostgreSQL pricing revisions · Times in IST
                </p>
              </div>

              <div style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}>
                <button
                  type="button"
                  onClick={() => setPricingHistoryOpen(false)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 10,
                    border: "1px solid #48627c",
                    background: "#20364e",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* HF28_CB3_HISTORY_FILTER_CONTROLS */}
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              marginBottom: 18,
            }}>
              <select
                aria-label="Pricing history scope"
                value={historyScope}
                onChange={(event) => setHistoryScope(event.target.value)}
                style={{
                  padding: "11px 12px",
                  borderRadius: 10,
                  border: "1px solid #48627c",
                  background: "#20364e",
                  color: "#fff",
                }}
              >
                <option value="ALL">All Scopes</option>
                <option value="GLOBAL">Global</option>
                <option value="BRANCH">Branch</option>
              </select>

              <select
                aria-label="Pricing history date filter"
                value={historyPeriod}
                onChange={(event) => setHistoryPeriod(event.target.value)}
                style={{
                  padding: "11px 12px",
                  borderRadius: 10,
                  border: "1px solid #48627c",
                  background: "#20364e",
                  color: "#fff",
                }}
              >
                <option value="ALL">All Dates</option>
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="DATE">Select Date</option>
                <option value="MONTH">Select Month</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="YEAR">Select Year</option>
                <option value="THIS_YEAR">This Year</option>
                <option value="CUSTOM">Custom Range</option>
              </select>

              {historyPeriod === "DATE" && (
                <input
                  aria-label="History selected date"
                  type="date"
                  value={historyDate}
                  onChange={(event) => setHistoryDate(event.target.value)}
                />
              )}

              {historyPeriod === "MONTH" && (
                <input
                  aria-label="History selected month"
                  type="month"
                  value={historyMonth}
                  onChange={(event) => setHistoryMonth(event.target.value)}
                />
              )}

              {historyPeriod === "YEAR" && (
                <input
                  aria-label="History selected year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={historyYear}
                  onChange={(event) => setHistoryYear(event.target.value)}
                  style={{ width: 100 }}
                />
              )}

              {historyPeriod === "CUSTOM" && (
                <>
                  <input
                    aria-label="History start date"
                    type="date"
                    value={historyFrom}
                    onChange={(event) => setHistoryFrom(event.target.value)}
                  />
                  <input
                    aria-label="History end date"
                    type="date"
                    min={historyFrom || undefined}
                    value={historyTo}
                    onChange={(event) => setHistoryTo(event.target.value)}
                  />
                </>
              )}

              <button
                type="button"
                disabled
                title="Available after PostgreSQL audit history API integration"
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "1px solid #48627c",
                  background: "#20364e",
                  color: "#cbd5e1",
                  opacity: 0.55,
                  cursor: "not-allowed",
                }}
              >
                Refresh
              </button>
            </div>
            <div style={{
              overflowX: "auto",
              borderRadius: 12,
            }}>
              <table style={{
                width: "100%",
                minWidth: 780,
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: 13,
              }}>
                <thead>
                  <tr>
                    {[
                      "Changed / IST",
                      "Scope",
                      "Plan",
                      "Price Field",
                      "Old Price",
                      "New Price",
                      "Revision",
                    ].map((heading) => (
                      <th key={heading} style={{
                        padding: 12,
                        borderBottom: "1px solid #48627c",
                        fontWeight: 650,
                      }}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
              </table>
            </div>

            <div role="status" style={{
              marginTop: 16,
              padding: 22,
              borderRadius: 12,
              borderLeft: "3px solid #94a3b8",
              background: "rgba(100,116,139,.15)",
              color: "#cbd5e1",
              textAlign: "center",
              lineHeight: 1.6,
            }}>
              Pricing audit records are not connected yet.
              <div style={{ fontSize: 12, marginTop: 5 }}>
                PostgreSQL audit history integration is pending.
                No fabricated financial records are displayed.
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
