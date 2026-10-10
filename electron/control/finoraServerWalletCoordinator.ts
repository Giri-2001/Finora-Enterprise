// Main-process only. IPC registration and sender validation are separate.
// clearLocal() forgets local access; it does not revoke the server session.
import {
  createFinoraServerWalletTrustedScopeResolver,
} from "./finoraServerWalletTrustedScope.js";
import {
  createFinoraServerWalletSessionMemory,
} from "./finoraServerWalletSessionMemory.js";
import {
  createFinoraServerWalletSessionClient,
} from "./finoraServerWalletSessionClient.js";
import {
  createFinoraServerWalletBalanceClient,
} from "./finoraServerWalletBalanceClient.js";

import {
  createFinoraServerWalletLogoutClient,
} from "./finoraServerWalletLogoutClient.js";

import {
  createFinoraServerWalletRechargeClient,
} from "./finoraServerWalletRechargeClient.js";

/* FINORA_P565I_PRICING */
import {
  createFinoraServerWalletPricingClient,
} from "./finoraServerWalletPricingClient.js";

type ReadPricing =
  ReturnType<typeof createFinoraServerWalletPricingClient>;
type SubmitRecharge = ReturnType<typeof createFinoraServerWalletRechargeClient>;
type Revoke = ReturnType<typeof createFinoraServerWalletLogoutClient>;
type Login = ReturnType<typeof createFinoraServerWalletSessionClient>;
type ReadBalance = ReturnType<typeof createFinoraServerWalletBalanceClient>;
type ResolveScope = ReturnType<typeof createFinoraServerWalletTrustedScopeResolver>;
type Scope = Parameters<Login>[1];
type Failure = { success: false; errorCode: string };

const allowedErrors = new Set([
  "INVALID_REQUEST", "SERVER_REJECTED", "RATE_LIMITED",
  "SERVER_UNAVAILABLE", "INVALID_SERVER_RESPONSE",
  "UNAUTHORIZED", "WALLET_NOT_FOUND", "WALLET_NOT_AVAILABLE", "IDEMPOTENCY_CONFLICT",
]);

function failed(errorCode: string): Failure {
  return { success: false, errorCode };
}

function safeFailure(errorCode: unknown): Failure {
  return failed(
    typeof errorCode === "string" && allowedErrors.has(errorCode)
      ? errorCode : "SERVER_UNAVAILABLE",
  );
}

export function createFinoraServerWalletCoordinator(
  options: {
    login?: Login;
    revoke?: Revoke;
    readBalance?: ReadBalance;
    readPricing?: ReadPricing;
    submitRecharge?: SubmitRecharge;
    resolveScope?: ResolveScope;
    clock?: () => number;
  } = {},
) {
  const submitRecharge =
    options.submitRecharge ?? createFinoraServerWalletRechargeClient();
  const revoke = options.revoke ?? createFinoraServerWalletLogoutClient();
  const login = options.login ?? createFinoraServerWalletSessionClient();
  const readBalance =
    options.readBalance ?? createFinoraServerWalletBalanceClient();
  const readPricing =
    options.readPricing ?? createFinoraServerWalletPricingClient();
  const resolveScope =
    options.resolveScope ?? createFinoraServerWalletTrustedScopeResolver();

  if (
    typeof submitRecharge !== "function" ||
    typeof revoke !== "function" ||
    typeof login !== "function" ||
    typeof readBalance !== "function" ||
    typeof readPricing !== "function" ||
    typeof resolveScope !== "function"
  ) throw new Error("WALLET_COORDINATOR_DEPENDENCY_INVALID");

  const memory = createFinoraServerWalletSessionMemory(options.clock);
  let activeScope: Scope | null = null;
  let operation = Symbol("initial");

  function clearLocal(): void {
    operation = Symbol("cleared");
    activeScope = null;
    memory.clear();
  }

  async function signIn(
    signedBootstrap: unknown,
    credentials: Parameters<Login>[0],
    material: Parameters<Login>[2],
  ): Promise<
    { success: true; data: { expiresAt: string } } | Failure
  > {
    clearLocal();
    const current = operation;

    try {
      const identity = resolveScope(signedBootstrap);
      if (!identity.success) return failed("WALLET_IDENTITY_UNVERIFIED");

      if (
        !credentials ||
        typeof credentials.username !== "string" ||
        credentials.username.trim().normalize("NFKC").toLowerCase() !==
          identity.data.canonicalUsername
      ) return failed("INVALID_REQUEST");

      const scope = { ...identity.data.scope };
      const key = structuredClone(material);
      const ticket = memory.beginLogin(scope, key.keyId);
      if (!ticket) return failed("INVALID_REQUEST");

      const result = await login({
        username: credentials.username,
        password: credentials.password,
      }, scope, key);

      if (current !== operation) return failed("STALE_OPERATION");

      if (!memory.completeLogin(ticket, result)) {
        return result.success
          ? failed("INVALID_SERVER_RESPONSE")
          : safeFailure(result.errorCode);
      }

      const lease = memory.acquire(scope);
      if (!lease) return failed("UNAUTHORIZED");

      activeScope = scope;
      // Token, key material and identity are deliberately not returned.
      return { success: true, data: { expiresAt: lease.expiresAt } };
    } catch {
      if (current !== operation) return failed("STALE_OPERATION");
      clearLocal();
      return failed("SERVER_UNAVAILABLE");
    }
  }

  async function balance() {
    const scope = activeScope;
    if (!scope) return failed("UNAUTHORIZED");

    const lease = memory.acquire(scope);
    if (!lease) return failed("UNAUTHORIZED");
    const current = operation;

    try {
      const result = await readBalance(lease.accessToken);
      const latest = memory.acquire(scope);

      // Suppress responses belonging to cleared, expired or replaced sessions.
      if (
        current !== operation ||
        !latest || latest.leaseId !== lease.leaseId
      ) return failed("STALE_OPERATION");

      if (!result.success) {
        if (result.errorCode === "UNAUTHORIZED") {
          memory.invalidate(lease.leaseId);
        }
        return safeFailure(result.errorCode);
      }

      const data = result.data;
      return {
        success: true as const,
        data: {
          source: data.source,
          walletId: data.walletId,
          balanceInr: data.balanceInr,
          currency: data.currency,
          updatedAt: data.updatedAt,
        },
      };
    } catch {
      const latest = memory.acquire(scope);
      if (
        current !== operation ||
        !latest || latest.leaseId !== lease.leaseId
      ) return failed("STALE_OPERATION");
      return failed("SERVER_UNAVAILABLE");
    }
  }

  /**
   * FINORA_P565I_PRICING
   *
   * Main-process-only pricing read.
   * Branch scope comes from the existing verified wallet session.
   * Never accepts a renderer-supplied branch or access token.
   */
  async function pricing() {
    const scope = activeScope;
    if (!scope) return failed("UNAUTHORIZED");

    const lease = memory.acquire(scope);
    if (!lease) return failed("UNAUTHORIZED");

    const current = operation;

    const stillCurrent = () => {
      const latest = memory.acquire(scope);
      return current === operation &&
        !!latest &&
        latest.leaseId === lease.leaseId;
    };

    try {
      const result = await readPricing(lease.accessToken);

      if (!stillCurrent()) {
        return failed("STALE_OPERATION");
      }

      if (!result.success) {
        if (result.errorCode === "UNAUTHORIZED") {
          memory.invalidate(lease.leaseId);
        }

        return safeFailure(result.errorCode);
      }

      // Fail closed if the server returns another branch's pricing.
      if (
        result.data.branchId !== scope.branchId
      ) {
        return failed("INVALID_SERVER_RESPONSE");
      }

      return {
        success: true as const,
        data: structuredClone(result.data),
      };
    } catch {
      if (!stillCurrent()) {
        return failed("STALE_OPERATION");
      }

      return failed("SERVER_UNAVAILABLE");
    }
  }
  // This operation creates a request only. A stale response does not mean
  // the server rolled back a request already sent. Preserve retry identity.
  async function recharge(input: unknown) {
    const scope = activeScope;
    if (!scope) return failed("UNAUTHORIZED");
    const lease = memory.acquire(scope);
    if (!lease) return failed("UNAUTHORIZED");
    const current = operation;

    const stillCurrent = () => {
      const latest = memory.acquire(scope);
      return current === operation &&
        !!latest && latest.leaseId === lease.leaseId;
    };

    try {
      // Preserve extra fields for client validation; do not silently strip them.
      const snapshot = structuredClone(input);
      const result = await submitRecharge(lease.accessToken, snapshot);
      if (!stillCurrent()) return failed("STALE_OPERATION");

      if (!result.success) {
        if (result.errorCode === "UNAUTHORIZED") {
          memory.invalidate(lease.leaseId);
        }
        return safeFailure(result.errorCode);
      }

      const data = result.data;
      return {
        success: true as const,
        data: {
          source: data.source,
          request: {
            requestId: data.request.requestId,
            walletId: data.request.walletId,
            amountInr: data.request.amountInr,
            paymentMethod: data.request.paymentMethod,
            status: data.request.status,
            createdAt: data.request.createdAt,
          },
          replayed: data.replayed,
        },
      };
    } catch {
      if (!stillCurrent()) return failed("STALE_OPERATION");
      return failed("SERVER_UNAVAILABLE");
    }
  }

  async function logout(): Promise<{
    localCleared: true;
    serverStatus: string;
  }> {
    const lease = activeScope ? memory.acquire(activeScope) : null;
    clearLocal();

    if (!lease) {
      return { localCleared: true, serverStatus: "NO_LOCAL_SESSION" };
    }

    // Never change local state after awaiting revocation:
    // another login may have completed in the meantime.
    try {
      const result = await revoke(lease.accessToken);
      return {
        localCleared: true,
        serverStatus: result.success
          ? (result.data.revoked ? "REVOKED" : "NOT_REVOKED")
          : safeFailure(result.errorCode).errorCode,
      };
    } catch {
      return { localCleared: true, serverStatus: "SERVER_UNAVAILABLE" };
    }
  }

  return Object.freeze({ signIn, balance, pricing, recharge, clearLocal, logout });
}