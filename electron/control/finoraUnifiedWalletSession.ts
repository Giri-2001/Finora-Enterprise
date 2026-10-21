// FINORA P1-572T
// Electron-main-only Wallet session established after verified Main Login.
// No renderer-selected scope, persistent token, device binding or fallback.

import {
  createFinoraMainLoginWalletSessionClient,
} from "./finoraMainLoginWalletSessionClient.js";

import {
  createFinoraServerWalletBalanceClient,
} from "./finoraServerWalletBalanceClient.js";

import {
  createFinoraServerWalletPricingClient,
} from "./finoraServerWalletPricingClient.js";

import {
  createFinoraServerWalletRechargeClient,
} from "./finoraServerWalletRechargeClient.js";


/* FINORA_P572W_MAIN_SESSION_AUTHORITY */
import {
  validateFinoraBranchLoginSession,
} from "./finoraBranchLoginSessionAuthority.js";
type Authorize = ReturnType<
  typeof createFinoraMainLoginWalletSessionClient
>;

type Scope = Parameters<Authorize>[1];
type Credentials = Parameters<Authorize>[0];

type Failure = {
  success: false;
  errorCode: string;
};

const deny = (errorCode: string): Failure => ({
  success: false,
  errorCode,
});

function validScope(scope: Scope): boolean {
  if (!scope || typeof scope !== "object") return false;

  return (
    ["userId", "ownerId", "businessId", "branchId"]
      .every((field) => {
        const value = scope[field as keyof Scope];

        return (
          typeof value === "string" &&
          value.length > 0 &&
          value.length <= 128 &&
          value.trim() === value &&
          !/[\u0000-\u001f\u007f]/.test(value)
        );
      })
  );
}

function sameScope(a: Scope, b: Scope): boolean {
  return (
    a.userId === b.userId &&
    a.ownerId === b.ownerId &&
    a.businessId === b.businessId &&
    a.branchId === b.branchId
  );
}

export function createFinoraUnifiedWalletSession(options: {
  authorize?: Authorize;
  clock?: () => number;
  validateMainSession: (
    sessionId: string,
    expectedScope: Scope,
  ) => Promise<boolean>;
}) {
  const authorize =
    options.authorize ??
    createFinoraMainLoginWalletSessionClient();

  const balanceClient = createFinoraServerWalletBalanceClient();
  const pricingClient = createFinoraServerWalletPricingClient();
  const rechargeClient = createFinoraServerWalletRechargeClient();

  const clock = options.clock ?? Date.now;

  if (
    !options ||
    typeof options.validateMainSession !== "function"
  ) {
    throw new Error("MAIN_SESSION_VALIDATOR_REQUIRED");
  }

  const validateMainSession = options.validateMainSession;

  let revision = 0;

  let current: {
    mainSessionId: string;
    scope: Scope;
    accessToken: string;
    expires: number;
  } | null = null;

  function clearLocal(): void {
    revision++;
    current = null;
  }

  function acquire() {
    const session = current;

    if (!session) return null;

    const now = clock();

    if (
      !Number.isFinite(now) ||
      now >= session.expires
    ) {
      clearLocal();
      return null;
    }

    return session;
  }

  async function establish(input: {
    mainSessionId: string;
    credentials: Credentials;
    scope: Scope;
  }) {
    clearLocal();

    const ticket = revision;

    if (
      typeof input?.mainSessionId !== "string" ||
      !input.mainSessionId.startsWith("FINORA-SESSION-") ||
      !validScope(input.scope)
    ) {
      return deny("INVALID_REQUEST");
    }

    let mainAuthorized = false;

    try {
      mainAuthorized = await validateMainSession(
        input.mainSessionId,
        input.scope,
      );
    } catch {
      mainAuthorized = false;
    }

    if (ticket !== revision) {
      return deny("STALE_OPERATION");
    }

    if (!mainAuthorized) {
      return deny("UNAUTHORIZED");
    }

    const result = await authorize(
      input.credentials,
      input.scope,
    );

    if (ticket !== revision) {
      return deny("STALE_OPERATION");
    }

    if (!result.success) {
      return deny(result.errorCode);
    }

    const expires = Date.parse(result.data.expiresAt);
    const now = clock();

    if (
      !sameScope(result.data.scope, input.scope) ||
      !/^[a-f0-9]{64}$/i.test(result.data.accessToken) ||
      !Number.isFinite(now) ||
      !Number.isFinite(expires) ||
      expires <= now ||
      expires - now > 1805000
    ) {
      return deny("INVALID_SERVER_RESPONSE");
    }

    let stillAuthorized = false;

    try {
      stillAuthorized = await validateMainSession(
        input.mainSessionId,
        input.scope,
      );
    } catch {
      stillAuthorized = false;
    }

    if (ticket !== revision) {
      return deny("STALE_OPERATION");
    }

    if (!stillAuthorized) {
      return deny("UNAUTHORIZED");
    }

    current = {
      mainSessionId: input.mainSessionId,
      scope: { ...result.data.scope },
      accessToken: result.data.accessToken,
      expires,
    };

    return {
      success: true as const,
      data: { expiresAt: result.data.expiresAt },
    };
  }

  async function execute<T>(
    action: (token: string) => Promise<T>,
  ): Promise<T | Failure> {
    const session = acquire();

    if (!session) return deny("UNAUTHORIZED");

    const ticket = revision;

    try {
      const authorized = await validateMainSession(
        session.mainSessionId,
        session.scope,
      );

      if (ticket !== revision || acquire() !== session) {
        return deny("STALE_OPERATION");
      }

      if (authorized !== true) {
        clearLocal();
        return deny("UNAUTHORIZED");
      }

      const result = await action(session.accessToken);

      if (ticket !== revision || acquire() !== session) {
        return deny("STALE_OPERATION");
      }

      const stillAuthorized = await validateMainSession(
        session.mainSessionId,
        session.scope,
      );

      if (ticket !== revision || acquire() !== session) {
        return deny("STALE_OPERATION");
      }

      if (stillAuthorized !== true) {
        clearLocal();
        return deny("UNAUTHORIZED");
      }

      if (
        result &&
        typeof result === "object" &&
        "success" in result &&
        result.success === false &&
        "errorCode" in result &&
        result.errorCode === "UNAUTHORIZED"
      ) {
        clearLocal();
      }

      return result;
    } catch {
      if (ticket === revision) clearLocal();
      return deny("SERVER_UNAVAILABLE");
    }
  }

  return Object.freeze({
    establish,
    clearLocal,
    balance: () =>
      execute((token) => balanceClient(token)),
    pricing: () =>
      execute((token) => pricingClient(token)),
    recharge: (
      input: Parameters<typeof rechargeClient>[1],
    ) =>
      execute((token) => rechargeClient(token, input)),
  });
}

/**
 * Main-process-only authorization.
 * Never accepts renderer-selected branch authority.
 * Independently revalidates the authoritative Main Login session.
 */
export async function validateFinoraUnifiedWalletMainSession(
  sessionId: string,
  expectedScope: {
    userId: string;
    ownerId: string;
    businessId: string;
    branchId: string;
  },
): Promise<boolean> {
  try {
    if (
      typeof sessionId !== "string" ||
      !sessionId.startsWith("FINORA-SESSION-") ||
      !expectedScope
    ) {
      return false;
    }

    const result = await validateFinoraBranchLoginSession({
      sessionId,
    });

    // FINORA_P1_579RK_MAIN_VALIDATION
    if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
      console.info("[FINORA MAIN SESSION VALIDATION]", JSON.stringify({
        validationSuccess: result.success,
        errorCode: result.success ? "NONE" : result.errorCode,
        sessionIdMatch: result.success
          ? result.data.sessionId === sessionId : false,
        ownerRole: result.success
          ? result.data.role === "OWNER" : false,
        accessAllowed: result.success
          ? ["ACTIVE", "REGISTERED_EXPIRED_READ_ONLY"].includes(
              result.data.accessMode
            ) : false,
        realContext: result.success
          ? result.data.dataContext === "REAL" : false,
        userMatch: result.success
          ? result.data.userId === expectedScope.userId : false,
        ownerMatch: result.success
          ? result.data.ownerId === expectedScope.ownerId : false,
        businessMatch: result.success
          ? result.data.businessId === expectedScope.businessId : false,
        branchMatch: result.success
          ? result.data.branchId === expectedScope.branchId : false,
      }));
    }

    if (!result.success) return false;

    const verified = result.data;

    return (
      verified.sessionId === sessionId &&
      verified.role === "OWNER" &&
      (
        verified.accessMode === "ACTIVE" ||
        verified.accessMode === "REGISTERED_EXPIRED_READ_ONLY"
      ) &&
      verified.dataContext === "REAL" &&
      verified.userId === expectedScope.userId &&
      verified.ownerId === expectedScope.ownerId &&
      verified.businessId === expectedScope.businessId &&
      verified.branchId === expectedScope.branchId
    );
  } catch {
    return false;
  }
}
