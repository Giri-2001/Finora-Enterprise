// Main-process only. Never accept a renderer-selected vault or scope resolver.
// Enrollment is explicit; failed login must not silently create another key.
import {
  createFinoraServerWalletCoordinator,
} from "./finoraServerWalletCoordinator.js";
import {
  createFinoraServerWalletEnrollmentClient,
} from "./finoraServerWalletEnrollmentClient.js";
import {
  createFinoraServerWalletTrustedScopeResolver,
} from "./finoraServerWalletTrustedScope.js";
import type {
  createFinoraServerWalletKeyVaultCore,
} from "./finoraServerWalletKeyVaultCore.js";

type Vault = ReturnType<typeof createFinoraServerWalletKeyVaultCore>;
type Coordinator = ReturnType<typeof createFinoraServerWalletCoordinator>;
type Enroll = ReturnType<typeof createFinoraServerWalletEnrollmentClient>;
type Resolver = ReturnType<typeof createFinoraServerWalletTrustedScopeResolver>;
type Credentials = Parameters<Enroll>[0];
type Failure = { success: false; errorCode: string };

function fail(errorCode: string): Failure {
  return { success: false, errorCode };
}

const allowed = new Set([
  "INVALID_REQUEST", "SERVER_REJECTED", "RATE_LIMITED",
  "KEY_CONFLICT", "SERVER_UNAVAILABLE", "INVALID_SERVER_RESPONSE",
  "WALLET_IDENTITY_UNVERIFIED", "UNAUTHORIZED", "STALE_OPERATION",
]);

function safeFailure(code: unknown): Failure {
  return fail(typeof code === "string" && allowed.has(code)
    ? code : "SERVER_UNAVAILABLE");
}

export function createFinoraServerWalletAccessService(options: {
  vault: Vault;
  coordinator?: Coordinator;
  enroll?: Enroll;
  resolveScope?: Resolver;
}) {
  if (
    !options?.vault ||
    typeof options.vault.read !== "function" ||
    typeof options.vault.getOrCreate !== "function"
  ) throw new Error("WALLET_ACCESS_VAULT_INVALID");

  const vault = options.vault;
  const resolveScope =
    options.resolveScope ?? createFinoraServerWalletTrustedScopeResolver();
  const coordinator = options.coordinator ??
    createFinoraServerWalletCoordinator({ resolveScope });
  const enrollClient = options.enroll ?? createFinoraServerWalletEnrollmentClient();

  if (
    typeof resolveScope !== "function" ||
    typeof enrollClient !== "function" ||
    !coordinator ||
    ["signIn", "balance", "clearLocal", "logout"].some(
      name => typeof coordinator[name as keyof Coordinator] !== "function",
    )
  ) throw new Error("WALLET_ACCESS_DEPENDENCY_INVALID");

  let operation = Symbol("initial");

  function clearLocal(): void {
    operation = Symbol("cleared");
    coordinator.clearLocal();
  }

  function identity(signed: unknown, username: string) {
    const result = resolveScope(signed);
    if (!result.success) return null;
    if (
      typeof username !== "string" ||
      username.trim().normalize("NFKC").toLowerCase() !==
        result.data.canonicalUsername
    ) return null;
    return result.data;
  }

  async function enroll(
    signedBootstrap: unknown,
    credentials: Credentials,
  ) {
    clearLocal();
    const current = operation;
    try {
      const signed = structuredClone(signedBootstrap);
      const supplied = {
        username: credentials.username,
        password: credentials.password,
        securityCode: credentials.securityCode,
      };
      const verified = identity(signed, supplied.username);
      if (!verified) return fail("WALLET_IDENTITY_UNVERIFIED");

      // Persist before enrollment so retries reuse the same local key.
      const key = await vault.getOrCreate(verified.scope);
      if (current !== operation) return fail("STALE_OPERATION");

      const result = await enrollClient(supplied, verified.scope, key);
      if (current !== operation) return fail("STALE_OPERATION");
      if (!result.success) return safeFailure(result.errorCode);

      if (result.data.keyId !== key.keyId.toLowerCase()) {
        return fail("INVALID_SERVER_RESPONSE");
      }
      return {
        success: true as const,
        data: {
          keyId: result.data.keyId,
          enrolledAt: result.data.enrolledAt,
        },
      };
    } catch {
      return fail(current !== operation
        ? "STALE_OPERATION" : "WALLET_ACCESS_UNAVAILABLE");
    }
  }

  async function signIn(
    signedBootstrap: unknown,
    credentials: { username: string; password: string },
  ) {
    clearLocal();
    const current = operation;
    try {
      const signed = structuredClone(signedBootstrap);
      const supplied = {
        username: credentials.username,
        password: credentials.password,
      };
      const verified = identity(signed, supplied.username);
      if (!verified) return fail("WALLET_IDENTITY_UNVERIFIED");

      // Read-only: a login attempt cannot generate or enroll a key.
      const key = await vault.read(verified.scope);
      if (current !== operation) return fail("STALE_OPERATION");
      if (!key) return fail("KEY_ENROLLMENT_REQUIRED");

      const result = await coordinator.signIn(signed, supplied, key);
      if (current !== operation) return fail("STALE_OPERATION");
      if (!result.success) return safeFailure(result.errorCode);

      return {
        success: true as const,
        data: { expiresAt: result.data.expiresAt },
      };
    } catch {
      if (current !== operation) return fail("STALE_OPERATION");
      coordinator.clearLocal();
      return fail("WALLET_ACCESS_UNAVAILABLE");
    }
  }

  function logout() {
    operation = Symbol("logout");
    return coordinator.logout();
  }

  return Object.freeze({
    enroll, signIn, logout, clearLocal,
    // FINORA_P565J_PRICING
    pricing: () => coordinator.pricing(),
    balance: () => coordinator.balance(),
    recharge: (input: unknown) => coordinator.recharge(input),
  });
}