import { randomUUID } from "node:crypto";
// Main-process only.
// Identity comes from the fixed server identity client, never renderer scope.
// An internal object handle binds the resolved identity to this operation.
// This does not manufacture or bypass a signed-bootstrap verification result.
import {
  createFinoraServerWalletIdentityClient,
} from "./finoraServerWalletIdentityClient.js";
import type {
  FinoraServerWalletIdentity,
} from "./finoraServerWalletIdentityClient.js";
import {
  createFinoraServerWalletAccessService,
} from "./finoraServerWalletAccessService.js";

type AccessOptions = Parameters<typeof createFinoraServerWalletAccessService>[0];
type Resolver = NonNullable<AccessOptions["resolveScope"]>;
type Identify = ReturnType<typeof createFinoraServerWalletIdentityClient>;
type Credentials = Parameters<Identify>[0];

function fail(errorCode: string) {
  return { success: false as const, errorCode };
}

const identityErrors = new Set([
  "INVALID_REQUEST", "SERVER_REJECTED", "RATE_LIMITED",
  "SERVER_UNAVAILABLE", "INVALID_SERVER_RESPONSE",
]);

function validId(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 && value.length <= 128 &&
    value.trim() === value &&
    !/[\u0000-\u001f\u007f]/.test(value);
}

export function createFinoraServerWalletOnlineAccess(options: {
  vault: AccessOptions["vault"];
  // Internal test dependencies. Never configurable through IPC.
  identify?: Identify;
  accessFactory?: typeof createFinoraServerWalletAccessService;
}) {
  const identify = options?.identify ?? createFinoraServerWalletIdentityClient();
  const factory = options?.accessFactory ?? createFinoraServerWalletAccessService;
  if (typeof identify !== "function" || typeof factory !== "function") {
    throw new Error("WALLET_ONLINE_ACCESS_DEPENDENCIES_INVALID");
  }

  let operation = Symbol("initial");
  let trusted: {
    handle: object;
    identity: FinoraServerWalletIdentity;
  } | null = null;

  const resolveScope: Resolver = (handle: unknown) => {
    if (!trusted || handle !== trusted.handle) {
      return { success: false, errorCode: "WALLET_IDENTITY_UNVERIFIED" };
    }
    return {
      success: true,
      data: structuredClone(trusted.identity),
    };
  };

  /*
   * Existing access/coordinator code clones its input before resolving it.
   * Therefore the handle must not pass through that cloning path.
   * The resolver below also recognizes a per-operation unpredictable nonce,
   * carried only between these internal main-process modules.
   */
  let internalNonce: string | null = null;
  const internalResolver: Resolver = (value: unknown) => {
    if (
      !trusted || !internalNonce ||
      !value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).length !== 1 ||
      !Object.hasOwn(value, "walletOperationNonce") ||
      (value as { walletOperationNonce?: unknown }).walletOperationNonce !== internalNonce
    ) {
      return { success: false, errorCode: "WALLET_IDENTITY_UNVERIFIED" };
    }
    return resolveScope(trusted.handle);
  };

  const access = factory({
    vault: options.vault,
    resolveScope: internalResolver,
  });

  function clearLocal(): void {
    operation = Symbol("cleared");
    trusted = null;
    internalNonce = null;
    access.clearLocal();
  }

  async function run(mode: "enroll" | "login", credentials: Credentials) {
    clearLocal();
    const current = operation;

    try {
      const supplied = structuredClone(credentials);
      const result = await identify(supplied);
      if (current !== operation) return fail("STALE_OPERATION");

      if (result?.success !== true) {
        return fail(
          result && identityErrors.has(result.errorCode)
            ? result.errorCode : "SERVER_UNAVAILABLE",
        );
      }

      const data = result.data;
      const scope = data?.scope;
      if (
        !scope ||
        !["userId", "ownerId", "businessId", "branchId", "credentialId"]
          .every(field => validId(scope[field as keyof typeof scope])) ||
        !Number.isSafeInteger(scope.authGeneration) ||
        scope.authGeneration < 1 ||
        !validId(data.canonicalUsername) ||
        typeof supplied?.username !== "string" ||
        data.canonicalUsername !==
          supplied.username.trim().normalize("NFKC").toLowerCase()
      ) return fail("INVALID_SERVER_RESPONSE");

      trusted = {
        handle: Object.freeze({}),
        identity: {
          scope: {
            userId: scope.userId,
            ownerId: scope.ownerId,
            businessId: scope.businessId,
            branchId: scope.branchId,
            credentialId: scope.credentialId,
            authGeneration: scope.authGeneration,
          },
          canonicalUsername: data.canonicalUsername,
        },
      };
      internalNonce = randomUUID();
      const context = Object.freeze({ walletOperationNonce: internalNonce });

      const response = mode === "enroll"
        ? await access.enroll(context, supplied)
        : await access.signIn(context, {
            username: supplied.username,
            password: supplied.password,
          });

      if (current !== operation) return fail("STALE_OPERATION");
      return response;
    } catch {
      if (current !== operation) return fail("STALE_OPERATION");
      clearLocal();
      return fail("SERVER_UNAVAILABLE");
    }
  }

  function logout() {
    operation = Symbol("logout");
    trusted = null;
    internalNonce = null;
    return access.logout();
  }

  return Object.freeze({
    enroll: (credentials: Credentials) => run("enroll", credentials),
    signIn: (credentials: Credentials) => run("login", credentials),
    // FINORA_P565J_PRICING
    pricing: () => access.pricing(),
    balance: () => access.balance(),
    recharge: (input: unknown) => access.recharge(input),
    clearLocal,
    logout,
  });
}