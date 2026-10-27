import { finoraControlShared } from "../finoraControlShared";
import { isFinoraAndroidWallet } from "./finoraAndroidWalletBridge";
import type {
  ServerWalletResult,
  ServerWalletLivePricing,
  ServerWalletHistoryPage,
  ServerWalletTransactionRow,
  ServerWalletRechargeRow,
} from "./finoraServerWalletBridge";

type NativeReply = {
  success?: boolean;
  data?: unknown;
};

type NativeReads = {
  getServerBusinessIdentity(): Promise<NativeReply>;
  getServerWalletPricing(): Promise<NativeReply>;
  getServerWalletTransactions(): Promise<NativeReply>;
  getServerWalletRecharges(): Promise<NativeReply>;
};

function record(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function error<T>(code: string): ServerWalletResult<T> {
  return { success: false, errorCode: code };
}

async function read(
  method: keyof NativeReads,
): Promise<ServerWalletResult<Record<string, unknown>>> {
  if (!isFinoraAndroidWallet()) return error("ANDROID_ONLY");

  try {
    const plugin = finoraControlShared as NativeReads;
    const response = await plugin[method]();

    // FINORA_P1_737S_ANDROID_NATIVE_READ_CONTRACT
    // Native may return the validated server JSON directly or
    // envelope it as { success: true, data: serverJSON }.
    // Neither form is trusted unless the server reports ok=true.
    const raw: unknown = response;

    if (!record(raw)) {
      return error("SERVER_READ_UNAVAILABLE");
    }

    if (raw.success === false) {
      return error("SERVER_READ_UNAVAILABLE");
    }

    const payload: unknown =
      raw.success === true && record(raw.data)
        ? raw.data
        : raw;

    if (!record(payload) || payload.ok !== true) {
      return error("INVALID_SERVER_RESPONSE");
    }

    // Callers independently validate expected server source,
    // fields, and authorized scope. No local fallback is allowed.
    return { success: true, data: payload };
  } catch {
    return error("SERVER_READ_UNAVAILABLE");
  }
}

export async function getFinoraAndroidPricing():
  Promise<ServerWalletResult<ServerWalletLivePricing>> {
  const r = await read("getServerWalletPricing");
  if (!r.success) return r;

  const d = r.data;

  if (
    d.source !== "FINORA_POSTGRESQL_PRICING" ||
    typeof d.branchId !== "string" ||
    !Array.isArray(d.plans) ||
    d.plans.length !== 4 ||
    !Object.prototype.hasOwnProperty.call(d, "currentSubscription")
  ) return error("INVALID_PRICING_RESPONSE");

  const current = d.currentSubscription;
  if (current !== null && (
    !record(current) ||
    typeof current.planCode !== "string" ||
    typeof current.status !== "string" ||
    typeof current.startsAt !== "string" ||
    typeof current.expiresAt !== "string" ||
    typeof current.serverNow !== "string"
  )) return error("INVALID_PRICING_RESPONSE");

  return {
    success: true,
    data: d as unknown as ServerWalletLivePricing,
  };
}

async function history<T>(
  method: "getServerWalletTransactions" | "getServerWalletRecharges",
  source: string,
  key: "transactions" | "requests",
  expectedWalletId: string,
): Promise<ServerWalletResult<ServerWalletHistoryPage<T>>> {
  if (!/^[0-9]{8,12}$/.test(expectedWalletId)) {
    return error("INVALID_WALLET_SCOPE");
  }

  const r = await read(method);
  if (!r.success) return r;

  const d = r.data;

  if (
    d.source !== source ||
    d.walletId !== expectedWalletId ||
    d.currency !== "INR" ||
    !Array.isArray(d[key]) ||
    typeof d.hasMore !== "boolean"
  ) return error("WALLET_SCOPE_MISMATCH");

  return {
    success: true,
    data: {
      walletId: expectedWalletId,
      currency: "INR",
      entries: d[key] as T[],
      hasMore: d.hasMore,
    },
  };
}

export function getFinoraAndroidTransactions(walletId: string):
  Promise<ServerWalletResult<ServerWalletHistoryPage<ServerWalletTransactionRow>>> {
  return history(
    "getServerWalletTransactions",
    "POSTGRESQL_WALLET_TRANSACTIONS",
    "transactions",
    walletId,
  );
}

export function getFinoraAndroidRecharges(walletId: string):
  Promise<ServerWalletResult<ServerWalletHistoryPage<ServerWalletRechargeRow>>> {
  return history(
    "getServerWalletRecharges",
    "POSTGRESQL_RECHARGE_REQUESTS",
    "requests",
    walletId,
  );
}
// FINORA_P1_725N_ANDROID_IDENTITY
// Read-only, authenticated native server identity.
// This must never be converted into a fabricated signed control profile.
export interface FinoraAndroidBusinessIdentity {
  ownerId: string;
  businessId: string;
  branchId: string;
  businessName: string;
  branchName: string;
  storageMode: "USB";
  businessUpdatedAt?: string;
  branchUpdatedAt?: string;
}

export async function getFinoraAndroidBusinessIdentity():
  Promise<ServerWalletResult<FinoraAndroidBusinessIdentity>> {
  const result = await read("getServerBusinessIdentity");
  if (!result.success) return result;

  const response = result.data;
  const identity = response.identity;

  if (
    response.source !== "FINORA_POSTGRESQL_BUSINESS_IDENTITY" ||
    !record(identity) ||
    typeof identity.ownerId !== "string" ||
    !identity.ownerId.trim() ||
    typeof identity.businessId !== "string" ||
    !identity.businessId.trim() ||
    typeof identity.branchId !== "string" ||
    !identity.branchId.trim() ||
    typeof identity.businessName !== "string" ||
    !identity.businessName.trim() ||
    typeof identity.branchName !== "string" ||
    !identity.branchName.trim() ||
    identity.storageMode !== "USB"
  ) {
    return error("INVALID_BUSINESS_IDENTITY");
  }

  return {
    success: true,
    data: {
      ownerId: identity.ownerId,
      businessId: identity.businessId,
      branchId: identity.branchId,
      businessName: identity.businessName,
      branchName: identity.branchName,
      storageMode: "USB",
      ...(typeof identity.businessUpdatedAt === "string"
        ? { businessUpdatedAt: identity.businessUpdatedAt }
        : {}),
      ...(typeof identity.branchUpdatedAt === "string"
        ? { branchUpdatedAt: identity.branchUpdatedAt }
        : {}),
    },
  };
}