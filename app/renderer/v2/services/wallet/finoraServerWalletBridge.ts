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

/* FINORA_P1_634I_PURCHASE_BRIDGE */
export interface ServerWalletSubscriptionPurchaseInput {
  planMonths: 1 | 3 | 6 | 12;
  idempotencyKey: string;
}

export interface ServerWalletSubscriptionPurchaseReceipt {
  source: "POSTGRESQL_SUBSCRIPTION_PURCHASE";
  replayed: boolean;
  purchaseId: string;
  subscriptionId: string;
  transactionId: string;
  amountInr: string;
  balanceInr: string | null;
  startsAt: string;
  expiresAt: string;
  status: "ACTIVE";
}
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

/* FINORA_P1_580P_HISTORY_BRIDGE */
export interface ServerWalletTransactionRow {
  transactionId: string;
  transactionType: string;
  amountInr: string;
  reference: string | null;
  rechargeRequestId: string | null;
  createdAt: string;
}

export interface ServerWalletRechargeRow {
  requestId: string;
  amountInr: string;
  paymentMethod: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  createdAt: string;
  decidedAt: string | null;
  declineReason: string | null;
}

export interface ServerWalletHistoryPage<T> {
  walletId: string;
  currency: "INR";
  entries: T[];
  hasMore: boolean;
}
/* FINORA_P1_587I_READ_ONLY_RECOVERY_CONTRACT */
export interface ServerWalletUsageRecovery {
  operationId: string;
  sourceType: string;
  sourceReference: string;
  chargeCode: string;
  feeInr: string;
  reservationStatus: "RESERVED" | "SETTLED" | "RELEASED" | "EXPIRED";
  recoveryStatus: "AWAITING_RECONCILIATION" | "MANUAL_REVIEW" | "RECONCILED";
  reportedSaveStatus: "UNKNOWN" | "NOT_STARTED" | "IN_PROGRESS" | "SAVED" | "FAILED";
  transactionId: string | null;
  allowNewBusinessSave: false;
  allowAutomaticSettlement: false;
  requiresReconciliation: true;
}
/* FINORA_P1_747O_HISTORY_PAGE */
export interface FinoraWalletHistoryPageRequest {
  limit: number;
  offset: number;
}
export interface ServerWalletBridge {
  // FINORA_P1_588J_RENDERER_RECOVERY
  // Read-only recovery; never authorizes another save or a debit.
  recovery(operationId: string): Promise<ServerWalletResult<ServerWalletUsageRecovery>>;
  transactions(page?: FinoraWalletHistoryPageRequest): Promise<ServerWalletResult<ServerWalletHistoryPage<ServerWalletTransactionRow>>>;
  recharges(page?: FinoraWalletHistoryPageRequest): Promise<ServerWalletResult<ServerWalletHistoryPage<ServerWalletRechargeRow>>>;
  pricing(): Promise<ServerWalletResult<ServerWalletLivePricing>>;
  // FINORA_P1_648C_PENDING_BRIDGE
  subscriptionPending(): Promise<ServerWalletResult<{
    pending: boolean;
    planMonths: 1 | 3 | 6 | 12 | null;
  }>>;  // FINORA_P1_648F2_RESUME_BRIDGE
  // Explicit invocation only. UUID never enters the renderer.
  subscriptionResume(): Promise<
    ServerWalletResult<ServerWalletSubscriptionPurchaseReceipt>
  >;
  subscriptionPurchase(
    input: ServerWalletSubscriptionPurchaseInput,
  ): Promise<ServerWalletResult<ServerWalletSubscriptionPurchaseReceipt>>;
  // FINORA_P1_753Y2_RECOVERY_INTERFACE
  // Explicit server reconciliation; original UUID stays in Main.
  rechargeResume(): Promise<
    ServerWalletResult<ServerWalletRechargeReceipt>
  >;
  // FINORA_P1_753M_PENDING_BRIDGE
  // Read-only local encrypted retry metadata; not server request status.
  rechargePending(): Promise<ServerWalletResult<{
    pending: boolean;
    amountInr: number | null;
    paymentMethod: "PHONEPE" | "GOOGLE_PAY" | null;
  }>>;
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
    // P1-712F: Account Wallet reads use server-authenticated sender IPC.
    // Other operations preserve their existing independent security gates.
    const accountWallet = record(host.finoraAccountWallet)
      ? host.finoraAccountWallet : null;
    const accountPricing = record(host.finoraAccountPricing)
      ? host.finoraAccountPricing : null;

    const readAccountBalance = async (): Promise<ServerWalletResult<ServerWalletBalance>> => {
      if (!accountWallet || typeof accountWallet.balance !== "function") {
        return { success: false, errorCode: "ACCOUNT_SESSION_REQUIRED" };
      }
      try {
        const response: unknown = await accountWallet.balance();
        if (!record(response)) {
          return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
        }
        if (response.success !== true) {
          return {
            success: false,
            errorCode: typeof response.errorCode === "string"
              ? response.errorCode : "UNAUTHORIZED",
          };
        }
        const w = response.wallet;
        if (
          !record(w) || w.ok !== true ||
          w.source !== "POSTGRESQL_WALLETS" ||
          w.currency !== "INR" ||
          typeof w.walletId !== "string" ||
          !/^[0-9]{8,12}$/.test(w.walletId) ||
          typeof w.balanceInr !== "string" ||
          !/^(0|[1-9][0-9]{0,9})\.[0-9]{2}$/.test(w.balanceInr) ||
          typeof w.updatedAt !== "string" ||
          !Number.isFinite(Date.parse(w.updatedAt))
        ) {
          return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
        }
        return {
          success: true,
          data: {
            source: "POSTGRESQL_WALLETS",
            currency: "INR",
            walletId: w.walletId,
            balanceInr: w.balanceInr,
            updatedAt: w.updatedAt,
          },
        };
      } catch {
        return { success: false, errorCode: "SERVER_UNAVAILABLE" };
      }
    };

    const readAccountPricing = async (): Promise<ServerWalletResult<ServerWalletLivePricing>> => {
      if (!accountPricing || typeof accountPricing.get !== "function") {
        return { success: false, errorCode: "ACCOUNT_SESSION_REQUIRED" };
      }
      try {
        const response: unknown = await accountPricing.get();
        if (!record(response)) {
          return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
        }
        if (response.success !== true) {
          return {
            success: false,
            errorCode: typeof response.errorCode === "string"
              ? response.errorCode : "UNAUTHORIZED",
          };
        }
        const p = response.pricing;
        if (
          !record(p) ||
          p.ok !== true ||
          p.source !== "FINORA_POSTGRESQL_PRICING" ||
          typeof p.branchId !== "string" ||
          p.branchId.length === 0 ||
          !Array.isArray(p.plans) ||
          p.plans.length !== 4 ||
          !p.plans.every((plan: unknown) =>
            record(plan) &&
            [1, 3, 6, 12].includes(plan.months as number) &&
            typeof plan.regularPriceInr === "string" &&
            /^(0|[1-9][0-9]{0,9})\.[0-9]{2}$/.test(plan.regularPriceInr) &&
            typeof plan.offerPriceInr === "string" &&
            /^(0|[1-9][0-9]{0,9})\.[0-9]{2}$/.test(plan.offerPriceInr) &&
            record(plan.fees)
          ) ||
          !Object.prototype.hasOwnProperty.call(p, "currentSubscription")
        ) {
          return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
        }
        return {
          success: true,
          data: {
            source: "FINORA_POSTGRESQL_PRICING",
            branchId: p.branchId,
            plans: p.plans as ServerWalletLivePlan[],
            currentSubscription: p.currentSubscription as ServerWalletLiveSubscription | null,
          },
        };
      } catch {
        return { success: false, errorCode: "SERVER_UNAVAILABLE" };
      }
    };
    const candidate = host.finora.serverWallet;
    if (!record(candidate)) return null;

    const { enroll, signIn, balance, logout, recharge, subscriptionPurchase, subscriptionPending, subscriptionResume, pricing, transactions, recharges, recovery } = candidate;
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
      balance: () => readAccountBalance(),
      recovery: (operationId: string): Promise<ServerWalletResult<ServerWalletUsageRecovery>> => {
        if (
          typeof operationId !== "string" ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(operationId)
        ) {
          return Promise.resolve({
            success: false as const,
            errorCode: "INVALID_REQUEST",
          });
        }
        return typeof recovery === "function"
          ? recovery.call(candidate, operationId)
          : Promise.resolve({
              success: false as const,
              errorCode: "UNAUTHORIZED",
            });
      },
      pricing: () => readAccountPricing(),
      transactions: (page?: FinoraWalletHistoryPageRequest): Promise<ServerWalletResult<ServerWalletHistoryPage<ServerWalletTransactionRow>>> =>
        typeof transactions === "function"
          ? transactions.call(candidate, ...(page === undefined ? [] : [page]))
          : Promise.resolve({ success: false as const, errorCode: "UNAUTHORIZED" }),
      recharges: (page?: FinoraWalletHistoryPageRequest): Promise<ServerWalletResult<ServerWalletHistoryPage<ServerWalletRechargeRow>>> =>
        typeof recharges === "function"
          ? recharges.call(candidate, ...(page === undefined ? [] : [page]))
          : Promise.resolve({ success: false as const, errorCode: "UNAUTHORIZED" }),
      // FINORA_P1_648C_PENDING_BRIDGE
      subscriptionPending: async (): Promise<ServerWalletResult<{
        pending: boolean;
        planMonths: 1 | 3 | 6 | 12 | null;
      }>> => {
        if (typeof subscriptionPending !== "function") {
          return { success: false, errorCode: "UNAUTHORIZED" };
        }

        try {
          const response: unknown = await subscriptionPending.call(candidate);

          if (!record(response)) {
            return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
          }

          if (response.success !== true) {
            return {
              success: false,
              errorCode: typeof response.errorCode === "string"
                ? response.errorCode : "SERVER_UNAVAILABLE",
            };
          }

          if (!record(response.data)) {
            return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
          }

          const pending = response.data.pending;
          const months = response.data.planMonths;

          if (typeof pending !== "boolean" ||
              !(months === null || months === 1 || months === 3 ||
                months === 6 || months === 12) ||
              (pending && months === null) ||
              (!pending && months !== null)) {
            return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
          }

          return {
            success: true,
            data: { pending, planMonths: months as 1 | 3 | 6 | 12 | null },
          };
        } catch {
          return { success: false, errorCode: "SERVER_UNAVAILABLE" };
        }
      },      // FINORA_P1_648F2_RESUME_BRIDGE
      subscriptionResume: async (): Promise<
        ServerWalletResult<ServerWalletSubscriptionPurchaseReceipt>
      > => {
        if (typeof subscriptionResume !== "function") {
          return {
            success: false,
            errorCode: "UNAUTHORIZED",
          };
        }

        try {
          const result: unknown =
            await subscriptionResume.call(candidate);

          if (!record(result)) {
            return {
              success: false,
              errorCode: "PURCHASE_RECONCILIATION_REQUIRED",
            };
          }

          if (result.success === false &&
              typeof result.errorCode === "string") {
            return {
              success: false,
              errorCode: result.errorCode,
            };
          }

          if (result.success === true && record(result.data)) {
            return result as unknown as
              ServerWalletResult<ServerWalletSubscriptionPurchaseReceipt>;
          }

          return {
            success: false,
            errorCode: "PURCHASE_RECONCILIATION_REQUIRED",
          };
        } catch {
          return {
            success: false,
            errorCode: "PURCHASE_RECONCILIATION_REQUIRED",
          };
        }
      },
      subscriptionPurchase: (
        input: ServerWalletSubscriptionPurchaseInput,
      ): Promise<ServerWalletResult<ServerWalletSubscriptionPurchaseReceipt>> => {
        if (
          typeof subscriptionPurchase !== "function" ||
          ![1, 3, 6, 12].includes(input.planMonths) ||
          typeof input.idempotencyKey !== "string" ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            input.idempotencyKey,
          )
        ) {
          return Promise.resolve({
            success: false as const,
            errorCode: "INVALID_REQUEST",
          });
        }

        return subscriptionPurchase.call(candidate, {
          planMonths: input.planMonths,
          idempotencyKey: input.idempotencyKey,
        });
      },
      // FINORA_P1_753Y2_RECOVERY_BRIDGE
      rechargeResume: async () => {
        const method = candidate.rechargeResume;

        if (typeof method !== "function") {
          return {
            success: false as const,
            errorCode: "BRIDGE_UNAVAILABLE",
          };
        }

        try {
          const result: unknown = await method.call(candidate);

          if (!record(result)) {
            return {
              success: false as const,
              errorCode: "INVALID_SERVER_RESPONSE",
            };
          }

          if (result.success === false) {
            return {
              success: false as const,
              errorCode:
                typeof result.errorCode === "string"
                  ? result.errorCode
                  : "RECHARGE_RECONCILIATION_REQUIRED",
            };
          }

          if (
            result.success !== true ||
            !record(result.data) ||
            !record(result.data.request)
          ) {
            return {
              success: false as const,
              errorCode: "INVALID_SERVER_RESPONSE",
            };
          }

          return result as unknown as
            ServerWalletResult<ServerWalletRechargeReceipt>;
        } catch {
          return {
            success: false as const,
            errorCode: "RECHARGE_RECONCILIATION_REQUIRED",
          };
        }
      },
      rechargePending: async () => {
        // FINORA_P1_753M_PENDING_BRIDGE
        // No UUID, wallet scope or bearer token supplied by renderer.
        const method = candidate.rechargePending;
        if (typeof method !== "function") {
          return { success: false as const, errorCode: "BRIDGE_UNAVAILABLE" };
        }
        try {
          const response: unknown = await method.call(candidate);
          if (!record(response)) {
            return { success: false as const, errorCode: "INVALID_SERVER_RESPONSE" };
          }
          if (response.success !== true) {
            return {
              success: false as const,
              errorCode: typeof response.errorCode === "string"
                ? response.errorCode : "SERVER_UNAVAILABLE",
            };
          }
          const data = response.data;
          if (!record(data) ||
              typeof data.pending !== "boolean" ||
              !(data.amountInr === null ||
                (typeof data.amountInr === "number" &&
                 Number.isSafeInteger(data.amountInr) &&
                 data.amountInr >= 50 && data.amountInr <= 2000)) ||
              !(data.paymentMethod === null ||
                data.paymentMethod === "PHONEPE" ||
                data.paymentMethod === "GOOGLE_PAY") ||
              (data.pending && (data.amountInr === null ||
                data.paymentMethod === null)) ||
              (!data.pending && (data.amountInr !== null ||
                data.paymentMethod !== null))) {
            return { success: false as const, errorCode: "INVALID_SERVER_RESPONSE" };
          }
          return {
            success: true as const,
            data: {
              pending: data.pending,
              amountInr: data.amountInr as number | null,
              paymentMethod: data.paymentMethod as
                "PHONEPE" | "GOOGLE_PAY" | null,
            },
          };
        } catch {
          return { success: false as const, errorCode: "SERVER_UNAVAILABLE" };
        }
      },
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
