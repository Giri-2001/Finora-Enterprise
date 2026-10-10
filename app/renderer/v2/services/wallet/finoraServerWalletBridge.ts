/* FINORA_P565L_PRICING - Authenticated server pricing */

export type ServerWalletServiceCode =
  | "CUSTOMER_CREATE"
  | "LOAN_DISBURSEMENT"
  | "COLLECTION_BELOW_25000"
  | "COLLECTION_25000_TO_50000"
  | "COLLECTION_ABOVE_50000";

export interface ServerWalletLivePlan {
  months: 1 | 3 | 6 | 12;
  regularPriceInr: string;
  offerPriceInr: string;
  fees: Record<ServerWalletServiceCode, string>;
}

export interface ServerWalletLiveSubscription {
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
}

export interface ServerWalletLivePricing {
  source: "FINORA_POSTGRESQL_PRICING";
  branchId: string;
  plans: ServerWalletLivePlan[];
  currentSubscription: ServerWalletLiveSubscription | null;
}
export interface ServerWalletCredentials {
  username: string;
  password: string;
  securityCode: string;
}

export type ServerWalletResult<T> =
  | { success: true; data: T }
  | { success: false; errorCode: string };

export interface ServerWalletBalance {
  source: "POSTGRESQL_WALLETS";
  walletId: string;
  balanceInr: string;
  currency: "INR";
  updatedAt: string;
}

export type ServerWalletLogoutStatus =
  | "REVOKED"
  | "NOT_REVOKED"
  | "NO_LOCAL_SESSION"
  | "UNAUTHORIZED"
  | "SERVER_UNAVAILABLE"
  | "INVALID_SERVER_RESPONSE";

export interface ServerWalletRechargeInput {
  amountInr: number;
  paymentMethod: "PHONEPE" | "GOOGLE_PAY";
  idempotencyKey: string;
}

export interface ServerWalletRechargeReceipt {
  source: "POSTGRESQL_RECHARGE_REQUESTS";
  request: {
    requestId: string;
    walletId: string;
    amountInr: string;
    paymentMethod: "PHONEPE" | "GOOGLE_PAY";
    status: "PENDING" | "APPROVED" | "DECLINED";
    createdAt: string;
  };
  replayed: boolean;
}

export interface ServerWalletBridge {
  pricing(): Promise<ServerWalletResult<ServerWalletLivePricing>>;
  recharge(input: ServerWalletRechargeInput): Promise<
    ServerWalletResult<ServerWalletRechargeReceipt>
  >;
  enroll(input: ServerWalletCredentials): Promise<
    ServerWalletResult<{ keyId: string; enrolledAt: string }>
  >;
  signIn(input: ServerWalletCredentials): Promise<
    ServerWalletResult<{ expiresAt: string }>
  >;
  balance(): Promise<ServerWalletResult<ServerWalletBalance>>;
  logout(): Promise<{
    localCleared: boolean;
    serverStatus: ServerWalletLogoutStatus;
  }>;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/*
 * Renderer facade for the existing narrow preload contract.
 * No HTTP, filesystem, token persistence or local-balance fallback.
 * Runtime response filtering remains enforced by the main IPC boundary.
 */
export function resolveFinoraServerWalletBridge(
  host: unknown,
): ServerWalletBridge | null {
  try {
    if (!record(host) || !record(host.finora)) return null;
    const candidate = host.finora.serverWallet;
    if (!record(candidate)) return null;

    const { enroll, signIn, balance, logout, recharge, pricing } = candidate;
    if (
      typeof enroll !== "function" ||
      typeof signIn !== "function" ||
      typeof balance !== "function" ||
      typeof logout !== "function" ||
      typeof recharge !== "function"
    ) return null;

    // Snapshot method references; expose no other preload properties.
    return Object.freeze({
      enroll: (input: ServerWalletCredentials) =>
        enroll.call(candidate, input),
      signIn: (input: ServerWalletCredentials) =>
        signIn.call(candidate, input),
      balance: () => balance.call(candidate),
      pricing: (): Promise<ServerWalletResult<ServerWalletLivePricing>> =>
        typeof pricing === "function"
          ? pricing.call(candidate)
          : Promise.resolve({
              success: false as const,
              errorCode: "UNAUTHORIZED",
            }),
      recharge: (input: ServerWalletRechargeInput) =>
        recharge.call(candidate, input),
      logout: () => logout.call(candidate),
    });
  } catch {
    return null;
  }
}

export function getFinoraServerWalletBridge(): ServerWalletBridge | null {
  return resolveFinoraServerWalletBridge(
    typeof window === "undefined" ? undefined : window,
  );
}
