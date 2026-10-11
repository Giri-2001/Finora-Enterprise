
import { useEffect, useState } from "react";
import type { FinoraSelectedServerBranchIdentity } from "./FinoraControlCenterServerBranchDirectoryPanel";

// FINORA_P567S - Reuse Directory bridge accessor.
function getBridge(): DirectoryBridge | undefined {
  const host = window as unknown as {
    finoraControlCenter?: DirectoryBridge;
  };
  return host.finoraControlCenter;
}


type Price = {
  chargeCode: string;
  priceKind: string;
  amount: number;
  source: "GLOBAL" | "BRANCH_OVERRIDE";
};
type PricingView = {
  branch: FinoraSelectedServerBranchIdentity & { status: string; branchName: string };
  pricing: Record<string, Price>;
  complete: boolean;
  missingChargeCodes: string[];
};
type State = {
  key: string;
  status: "loading" | "ready" | "error";
  data?: PricingView;
  error?: string;
};
const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

const makeKey = (x: FinoraSelectedServerBranchIdentity): string =>
  JSON.stringify([x.ownerId, x.businessId, x.branchId]);

function checkResponse(
  x: unknown,
  selected: FinoraSelectedServerBranchIdentity,
): PricingView {
  if (!isRecord(x) || !isRecord(x.branch) || !isRecord(x.pricing) ||
      typeof x.complete !== "boolean" || !Array.isArray(x.missingChargeCodes))
    throw Error("PRICING_RESPONSE_INVALID");

  const b = x.branch;
  if (b.ownerId !== selected.ownerId ||
      b.businessId !== selected.businessId ||
      b.branchId !== selected.branchId ||
      typeof b.status !== "string" ||
      typeof b.branchName !== "string")
    throw Error("PRICING_IDENTITY_MISMATCH");

  const prices: Record<string,Price> = Object.create(null);
  for (const [code,value] of Object.entries(x.pricing)) {
    if (!isRecord(value) || value.chargeCode !== code ||
        typeof value.priceKind !== "string" ||
        typeof value.amount !== "number" ||
        !Number.isFinite(value.amount) || value.amount < 0 ||
        (value.source !== "GLOBAL" && value.source !== "BRANCH_OVERRIDE"))
      throw Error("PRICING_CHARGE_INVALID");
    prices[code] = {
      chargeCode: code, priceKind: value.priceKind,
      amount: value.amount, source: value.source,
    };
  }

  if (!x.missingChargeCodes.every((v: unknown) => typeof v === "string") ||
      x.complete !== (x.missingChargeCodes.length === 0))
    throw Error("PRICING_COMPLETENESS_INVALID");

  return {
    branch: {
      ...selected,
      status: b.status,
      branchName: b.branchName,
    },
    pricing: prices,
    complete: x.complete,
    missingChargeCodes: x.missingChargeCodes as string[],
  };
}

export function FinoraControlCenterServerEffectivePricingPanel({
  selected,
}: {
  selected: FinoraSelectedServerBranchIdentity | null;
}) {
  const [state,setState] = useState<State | null>(null);
  const key = selected ? makeKey(selected) : "";

  useEffect(() => {
    if (!selected) { setState(null); return; }
    const identity = { ...selected };
    const requestedKey = makeKey(identity);
    let cancelled = false;
    setState({ key: requestedKey, status: "loading" });

    void (async () => {
      try {
        const api = getBridge() as unknown as {
          getServerEffectivePricing?: (
            identity: FinoraSelectedServerBranchIdentity
          ) => Promise<unknown>;
        } | undefined;

        if (typeof api?.getServerEffectivePricing !== "function")
          throw Error("PRICING_BRIDGE_UNAVAILABLE");

        const response = await api.getServerEffectivePricing(identity);
        if (!isRecord(response) || response.success !== true)
          throw Error(isRecord(response) && typeof response.error === "string"
            ? response.error : "PRICING_REQUEST_FAILED");

        const data = checkResponse(response.data,identity);
        if (!cancelled) setState({key:requestedKey,status:"ready",data});
      } catch (e) {
        if (!cancelled) setState({
          key:requestedKey,status:"error",
          error:e instanceof Error ? e.message : "PRICING_REQUEST_FAILED",
        });
      }
    })();

    return () => { cancelled = true; };
  }, [selected?.ownerId,selected?.businessId,selected?.branchId]);

  if (!selected) return null;
  const visible = state?.key === key ? state : null;

  return (
    <section aria-label="Server effective pricing" style={{
      marginTop:16,padding:16,borderRadius:12,
      background:"#142238",border:"1px solid #39617e",color:"#f1f5ff",
    }}>
      <h3 style={{marginTop:0}}>Server Effective Pricing (Read Only)</h3>
      <p>Selected branch: {selected.branchId}</p>
      {!visible || visible.status === "loading" ? (
        <p role="status">Loading verified server pricing...</p>
      ) : visible.status === "error" ? (
        <p role="alert">Pricing unavailable: {visible.error}</p>
      ) : visible.data ? (
        <>
          {visible.data.branch.status !== "ACTIVE" && (
            <p role="alert">Branch is not ACTIVE. Inspection only.</p>
          )}
          {!visible.data.complete && (
            <p role="alert">
              Pricing incomplete: {visible.data.missingChargeCodes.join(", ")}
            </p>
          )}
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",textAlign:"left"}}>
              <thead><tr>
                <th style={{padding:8}}>Charge code</th>
                <th style={{padding:8}}>Kind</th>
                <th style={{padding:8}}>Amount (INR)</th>
                <th style={{padding:8}}>Source</th>
              </tr></thead>
              <tbody>
                {Object.entries(visible.data.pricing).sort(([a],[b]) =>
                  a.localeCompare(b)).map(([code,p]) => (
                    <tr key={code}>
                      <td style={{padding:8}}>{code}</td>
                      <td style={{padding:8}}>{p.priceKind}</td>
                      <td style={{padding:8}}>{p.amount.toLocaleString("en-IN",{
                        minimumFractionDigits:2,maximumFractionDigits:2
                      })}</td>
                      <td style={{padding:8}}>{p.source}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
