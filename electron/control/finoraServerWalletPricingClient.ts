/**
 * FINORA P1-565H
 * Main-process-only authenticated live pricing client.
 *
 * Never accepts a renderer-selected server URL or branch ID.
 * Server derives branch scope from the verified Wallet session.
 * This module does not issue sessions, authorize billing, or debit money.
 */

const FINORA_WALLET_API_BASE =
  process.env.FINORA_LOCAL_WALLET_TEST === "1"
    ? "http://127.0.0.1:3000"
    : "https://api.finoraenterprise.com";

const PRICING_URL =
  `${FINORA_WALLET_API_BASE}/owner/wallet/pricing`;

const MONTHS = [1, 3, 6, 12] as const;

const SERVICE_CODES = [
  "CUSTOMER_CREATE",
  "LOAN_DISBURSEMENT",
  "COLLECTION_BELOW_25000",
  "COLLECTION_25000_TO_50000",
  "COLLECTION_ABOVE_50000",
] as const;

type ServiceCode = typeof SERVICE_CODES[number];

export type FinoraLivePricingPlan = {
  months: 1 | 3 | 6 | 12;
  regularPriceInr: string;
  offerPriceInr: string;
  fees: Record<ServiceCode, string>;
};

export type FinoraLiveSubscription = {
  planCode: string;
  amountInr: string;
  startsAt: string;
  expiresAt: string;
  databaseStatus: string;
  status: string;
  expiredDaysAgo: number;
  daysRemaining: number;
  autoRenew: boolean;
  selectedPlanMonths: number | null;
  serverNow: string;
};

export type FinoraLivePricing = {
  source: "FINORA_POSTGRESQL_PRICING";
  branchId: string;
  plans: FinoraLivePricingPlan[];
  currentSubscription: FinoraLiveSubscription | null;
};

export type FinoraLivePricingResult =
  | { success: true; data: FinoraLivePricing }
  | {
      success: false;
      errorCode:
        | "UNAUTHORIZED"
        | "SERVER_UNAVAILABLE"
        | "INVALID_SERVER_RESPONSE";
    };

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" &&
    !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
}

function validMoney(value: unknown): value is string {
  return typeof value === "string" &&
    /^(0|[1-9][0-9]{0,9})\.[0-9]{2}$/.test(value);
}

function validDate(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= 40 &&
    Number.isFinite(Date.parse(value));
}

function validInteger(value: unknown): value is number {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0;
}

function parseSubscription(
  raw: unknown,
): FinoraLiveSubscription | null | undefined {
  if (raw === null) return null;

  const row = object(raw);
  if (!row) return undefined;

  if (
    typeof row.planCode !== "string" ||
    row.planCode.length === 0 ||
    row.planCode.length > 128 ||
    !validMoney(row.amountInr) ||
    !validDate(row.startsAt) ||
    !validDate(row.expiresAt) ||
    typeof row.databaseStatus !== "string" ||
    typeof row.status !== "string" ||
    row.databaseStatus.length > 64 ||
    row.status.length > 64 ||
    !validInteger(row.expiredDaysAgo) ||
    !validInteger(row.daysRemaining) ||
    typeof row.autoRenew !== "boolean" ||
    !validDate(row.serverNow) ||
    (
      row.selectedPlanMonths !== null &&
      row.selectedPlanMonths !== undefined &&
      !MONTHS.some(months => months === row.selectedPlanMonths)
    )
  ) {
    return undefined;
  }

  return {
    planCode: row.planCode as string,
    amountInr: row.amountInr as string,
    startsAt: row.startsAt as string,
    expiresAt: row.expiresAt as string,
    databaseStatus: row.databaseStatus as string,
    status: row.status as string,
    expiredDaysAgo: row.expiredDaysAgo as number,
    daysRemaining: row.daysRemaining as number,
    autoRenew: row.autoRenew as boolean,
    selectedPlanMonths: (row.selectedPlanMonths ?? null) as number | null,
    serverNow: row.serverNow as string,
  };
}

function parsePricing(raw: unknown): FinoraLivePricing | null {
  const body = object(raw);

  if (
    !body ||
    body.ok !== true ||
    body.source !== "FINORA_POSTGRESQL_PRICING" ||
    typeof body.branchId !== "string" ||
    body.branchId.length === 0 ||
    body.branchId.length > 128 ||
    !Array.isArray(body.plans) ||
    body.plans.length !== 4
  ) {
    return null;
  }

  const plans: FinoraLivePricingPlan[] = [];

  for (const months of MONTHS) {
    const matches = body.plans.filter(
      item => object(item)?.months === months,
    );

    if (matches.length !== 1) return null;

    const row = object(matches[0]);
    if (!row) return null;

    const fees = object(row.fees);

    if (
      !validMoney(row.regularPriceInr) ||
      !validMoney(row.offerPriceInr) ||
      !fees ||
      Object.keys(fees).length !== SERVICE_CODES.length
    ) {
      return null;
    }

    const normalizedFees = {} as Record<ServiceCode, string>;

    for (const code of SERVICE_CODES) {
      if (!validMoney(fees[code])) return null;
      normalizedFees[code] = fees[code];
    }

    plans.push({
      months,
      regularPriceInr: row.regularPriceInr,
      offerPriceInr: row.offerPriceInr,
      fees: normalizedFees,
    });
  }

  const subscription = parseSubscription(body.currentSubscription);

  if (subscription === undefined) return null;

  return {
    source: "FINORA_POSTGRESQL_PRICING",
    branchId: body.branchId,
    plans,
    currentSubscription: subscription,
  };
}

export function createFinoraServerWalletPricingClient(
  transport: typeof fetch = globalThis.fetch,
) {
  if (typeof transport !== "function") {
    throw new Error("WALLET_PRICING_TRANSPORT_INVALID");
  }

  return async function readLiveWalletPricing(
    accessToken: string,
  ): Promise<FinoraLivePricingResult> {
    if (
      typeof accessToken !== "string" ||
      !/^[a-f0-9]{64}$/.test(accessToken)
    ) {
      return { success: false, errorCode: "UNAUTHORIZED" };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await transport(PRICING_URL, {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${accessToken}`,
        },
        redirect: "error",
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
      });

      if (response.status === 401) {
        return { success: false, errorCode: "UNAUTHORIZED" };
      }

      if (response.status !== 200) {
        return { success: false, errorCode: "SERVER_UNAVAILABLE" };
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (
        contentType.split(";")[0].trim().toLowerCase() !==
        "application/json"
      ) {
        return {
          success: false,
          errorCode: "INVALID_SERVER_RESPONSE",
        };
      }

      const raw = await response.json();
      const data = parsePricing(raw);

      if (!data) {
        return {
          success: false,
          errorCode: "INVALID_SERVER_RESPONSE",
        };
      }

      return { success: true, data };
    } catch {
      return {
        success: false,
        errorCode: "SERVER_UNAVAILABLE",
      };
    } finally {
      clearTimeout(timeout);
    }
  };
}