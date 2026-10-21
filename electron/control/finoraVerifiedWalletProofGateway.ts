// FINORA P1-573Q2
// Electron main-process-only proof authentication core.
// No credential bypass, no automatic enrollment and no renderer scope.

import {
  createFinoraServerWalletSessionClient,
} from "./finoraServerWalletSessionClient.js";

import {
  createFinoraServerWalletBalanceClient,
} from "./finoraServerWalletBalanceClient.js";

import {
  createFinoraServerWalletPricingClient,
} from "./finoraServerWalletPricingClient.js";

import {
  createFinoraServerWalletHistoryClient,
} from "./finoraServerWalletHistoryClient.js";
import { createFinoraServerWalletRechargeClient } from "./finoraServerWalletRechargeClient.js";
import {
  createFinoraServerWalletSubscriptionPurchaseClient,
} from "./finoraServerWalletSubscriptionPurchaseClient.js"; // FINORA_P1_614N2_RECHARGE
import {
  createFinoraServerWalletRecoveryClient,
} from "./finoraServerWalletRecoveryClient.js";
// FINORA_P1_580N_HISTORY_GATE
import {
  validateFinoraUnifiedWalletMainSession,
} from "./finoraUnifiedWalletSession.js";

type ProofLogin = ReturnType<
  typeof createFinoraServerWalletSessionClient
>;

type FullScope = Parameters<ProofLogin>[1];
type ProofMaterial = Parameters<ProofLogin>[2];

type Credentials = {
  username: string;
  password: string;
};

type MainScope = {
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
};

type Failure = {
  success: false;
  errorCode: string;
};

const deny = (errorCode: string): Failure => ({
  success: false,
  errorCode,
});

const fields = [
  "userId", "ownerId", "businessId", "branchId",
] as const;

function matchingScope(
  full: FullScope,
  main: MainScope,
): boolean {
  return fields.every(
    field =>
      typeof main[field] === "string" &&
      main[field].length > 0 &&
      full[field] === main[field],
  );
}

function validFullScope(
  scope: FullScope | null,
): scope is FullScope {
  return !!scope &&
    fields.every(field =>
      typeof scope[field] === "string" &&
      scope[field].length > 0 &&
      scope[field].length <= 128
    ) &&
    typeof scope.credentialId === "string" &&
    scope.credentialId.length > 0 &&
    Number.isSafeInteger(scope.authGeneration) &&
    scope.authGeneration >= 1;
}

export function createFinoraVerifiedWalletProofGateway(
  options: {
    // Must resolve an independently server-authenticated principal.
    // Never supply IDs directly from the renderer or local login.
    resolveServerVerifiedScope: (
      credentials: Credentials,
    ) => Promise<FullScope | null>;

    // Read an ALREADY enrolled proof key; never create one.
    readEnrolledProofKey: (
      scope: FullScope,
    ) => Promise<ProofMaterial | null>;

    validateMainSession?: (
      sessionId: string,
      scope: MainScope,
    ) => Promise<boolean>;

    proofLogin?: ProofLogin;

    // FINORA_P577K_VERIFIED_ASSOCIATION
    // Must be backed by independently trusted server authorization.
    // Never accept a renderer flag or self-declared association.
    verifyAssociatedScope?: (
      local: MainScope,
      server: FullScope,
    ) => Promise<boolean>;
  },
) {
  if (
    typeof options?.resolveServerVerifiedScope !== "function" ||
    typeof options?.readEnrolledProofKey !== "function"
  ) {
    throw new Error("TRUSTED_PROOF_DEPENDENCIES_REQUIRED");
  }

  const proofLogin =
    options.proofLogin ??
    createFinoraServerWalletSessionClient();

  const validateMain =
    options.validateMainSession ??
    validateFinoraUnifiedWalletMainSession;

  const balanceClient =
    createFinoraServerWalletBalanceClient();

  const pricingClient =
    createFinoraServerWalletPricingClient();

  const historyClient = createFinoraServerWalletHistoryClient();
  const rechargeClient = createFinoraServerWalletRechargeClient();

  // FINORA_P1_633V_VERIFIED_PURCHASE
  // Main-process only; token stays inside the verified session.
  const subscriptionPurchaseClient =
    createFinoraServerWalletSubscriptionPurchaseClient();
  // FINORA_P1_588E_RECOVERY_GATEWAY
  const recoveryClient = createFinoraServerWalletRecoveryClient();

  let revision = 0;

  let active: {
    sessionId: string;
    scope: MainScope;
    serverScope: FullScope;
    associationRequired: boolean;
    token: string;
    expires: number;
  } | null = null;

    // FINORA_P1_579RS_CLEAR_ORIGIN
  function clearLocal(): void {
    if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
      const frames = (new Error().stack ?? "").split("\n").slice(2, 6);
      const names = frames.map(line => {
        const match = line.match(/at\s+(?:async\s+)?([A-Za-z_$][\w$.]*)/);
        return match?.[1] ?? "UNKNOWN";
      });

      console.warn("[FINORA PROOF CLEAR CHAIN]", JSON.stringify({
        sessionPresent: active !== null,
        frames: names,
      }));
    }

    revision++;
    active = null;
  }

  async function establish(input: {
    mainSessionId: string;
    mainScope: MainScope;
    credentials: Credentials;
  }) {
    clearLocal();
    const ticket = revision;

    if (
      typeof input?.mainSessionId !== "string" ||
      !input.mainSessionId.startsWith("FINORA-SESSION-") ||
      !input.credentials ||
      typeof input.credentials.username !== "string" ||
      !input.credentials.username.trim() ||
      typeof input.credentials.password !== "string" ||
      !input.credentials.password
    ) {
      return deny("INVALID_REQUEST");
    }

    try {
      if (
        !await validateMain(
          input.mainSessionId,
          input.mainScope,
        )
      ) return deny("UNAUTHORIZED");

      const serverScope =
        await options.resolveServerVerifiedScope(
          input.credentials,
        );

      if (ticket !== revision) return deny("STALE_OPERATION");

      // FINORA_P574Y_SCOPE_CLASSIFICATION
      // Diagnostic stages only. Never log identifiers or credentials.
      if (!validFullScope(serverScope)) {
        if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
          console.warn(
            "[FINORA WALLET PROOF STAGE]",
            JSON.stringify({ stage: "SERVER_SCOPE_MISSING_OR_INVALID" }),
          );
        }
        return deny("SERVER_IDENTITY_UNVERIFIED");
      }

      const exactScopeMatch =
        matchingScope(serverScope, input.mainScope);

      let associationVerified = false;

      if (!exactScopeMatch && options.verifyAssociatedScope) {
        associationVerified =
          await options.verifyAssociatedScope(
            input.mainScope,
            serverScope,
          );

        if (ticket !== revision) {
          return deny("STALE_OPERATION");
        }
      }

      if (!exactScopeMatch && !associationVerified) {
        if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
          console.warn(
            "[FINORA WALLET PROOF STAGE]",
            JSON.stringify({
              stage: "MAIN_SERVER_SCOPE_MISMATCH",
              // P1-576B SCOPE MATCH DIAGNOSTIC
              fields: {
                userIdMatch:
                  serverScope.userId === input.mainScope.userId,
                ownerIdMatch:
                  serverScope.ownerId === input.mainScope.ownerId,
                businessIdMatch:
                  serverScope.businessId === input.mainScope.businessId,
                branchIdMatch:
                  serverScope.branchId === input.mainScope.branchId,
              },
            }),
          );
        }
        return deny("SERVER_IDENTITY_UNVERIFIED");
      }

      const key =
        await options.readEnrolledProofKey(serverScope);

      if (ticket !== revision) return deny("STALE_OPERATION");

      if (!key) return deny("KEY_ENROLLMENT_REQUIRED");

      const result = await proofLogin(
        input.credentials,
        serverScope,
        key,
      );

      if (ticket !== revision) return deny("STALE_OPERATION");

      if (!result.success) {
        return deny(result.errorCode);
      }

      if (
        !matchingScope(result.data.scope, serverScope) ||
        result.data.keyId.toLowerCase() !==
          key.keyId.toLowerCase()
      ) return deny("INVALID_SERVER_RESPONSE");

      const expires = Date.parse(result.data.expiresAt);
      const now = Date.now();

      if (
        !Number.isFinite(expires) ||
        expires <= now ||
        expires - now > 1805000
      ) return deny("INVALID_SERVER_RESPONSE");

      if (
        !await validateMain(
          input.mainSessionId,
          input.mainScope,
        )
      ) return deny("UNAUTHORIZED");

      if (ticket !== revision) return deny("STALE_OPERATION");

      if (
        !exactScopeMatch &&
        (
          !options.verifyAssociatedScope ||
          !await options.verifyAssociatedScope(
            input.mainScope,
            serverScope,
          )
        )
      ) {
        return deny("SERVER_IDENTITY_UNVERIFIED");
      }

      if (ticket !== revision) {
        return deny("STALE_OPERATION");
      }

      active = {
        sessionId: input.mainSessionId,
        scope: { ...input.mainScope },
        serverScope: { ...serverScope },
        associationRequired: !exactScopeMatch,
        token: result.data.accessToken,
        expires,
      };

      return {
        success: true as const,
        data: { expiresAt: result.data.expiresAt },
      };
    } catch {
      if (ticket === revision) clearLocal();
      return deny("SERVER_UNAVAILABLE");
    }
  }

  async function read<T>(
    action: (token: string) => Promise<T>,
  ): Promise<T | Failure> {
    const session = active;
    const ticket = revision;

    // FINORA_P1_579RB_PROOF_READ_TRACE
    if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
      console.info("[FINORA PROOF READ STAGE]", JSON.stringify({
        stage: "ENTRY",
        sessionPresent: !!session,
        expired: !!session && Date.now() >= session.expires,
      }));
    }

    if (!session) return deny("UNAUTHORIZED");

    if (Date.now() >= session.expires) {
      clearLocal();
      return deny("UNAUTHORIZED");
    }

    try {
      // FINORA_P1_579RQ_READ_FAILURE
      if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
        console.info("[FINORA PROOF VALIDATION TRACE]", JSON.stringify({
          stage: "BEFORE_MAIN_VALIDATION",
        }));
      }

      const authorized = await validateMain(
        session.sessionId,
        session.scope,
      );

      if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
        console.info("[FINORA PROOF VALIDATION TRACE]", JSON.stringify({
          stage: "AFTER_MAIN_VALIDATION",
          authorized,
          sessionStillCurrent: ticket === revision && active === session,
        }));
      }

      if (ticket !== revision || active !== session) {
        return deny("STALE_OPERATION");
      }

      if (!authorized) {
        clearLocal();
        return deny("UNAUTHORIZED");
      }

      // FINORA_P577M_ASSOCIATION_REVALIDATION
      // A previously verified association is not permanent authority.
      // Fail closed if verification becomes unavailable or revoked.
      if (session.associationRequired) {
        if (
          !options.verifyAssociatedScope ||
          !await options.verifyAssociatedScope(
            session.scope,
            session.serverScope,
          )
        ) {
          if (ticket === revision) clearLocal();
          return deny("SERVER_IDENTITY_UNVERIFIED");
        }

        if (ticket !== revision || active !== session) {
          return deny("STALE_OPERATION");
        }
      }

      if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
        console.info("[FINORA PROOF READ STAGE]", JSON.stringify({
          stage: "BEFORE_SERVER_REQUEST",
          mainSessionValid: authorized,
        }));
      }

      const result = await action(session.token);

      if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
        const outcome = result as {
          success?: boolean;
          errorCode?: string;
        };
        console.info("[FINORA PROOF READ STAGE]", JSON.stringify({
          stage: "AFTER_SERVER_REQUEST",
          success: outcome?.success === true,
          errorCode: outcome?.success === false
            ? outcome.errorCode
            : "NONE",
          sessionStillCurrent:
            ticket === revision && active === session,
        }));
      }

      if (ticket !== revision || active !== session) {
        return deny("STALE_OPERATION");
      }

      const stillAuthorized = await validateMain(
        session.sessionId,
        session.scope,
      );

      if (ticket !== revision || active !== session) {
        return deny("STALE_OPERATION");
      }

      if (!stillAuthorized || Date.now() >= session.expires) {
        clearLocal();
        return deny("UNAUTHORIZED");
      }

      if (session.associationRequired) {
        if (
          !options.verifyAssociatedScope ||
          !await options.verifyAssociatedScope(
            session.scope,
            session.serverScope,
          )
        ) {
          if (ticket === revision) clearLocal();
          return deny("SERVER_IDENTITY_UNVERIFIED");
        }

        if (ticket !== revision || active !== session) {
          return deny("STALE_OPERATION");
        }
      }

      return result;
    } catch (error) {
      // FINORA_P1_579RQ_READ_FAILURE
      if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
        console.warn("[FINORA PROOF VALIDATION TRACE]", JSON.stringify({
          stage: "READ_EXCEPTION",
          errorType: error instanceof Error ? error.name : "UNKNOWN",
          sessionStillCurrent: ticket === revision && active === session,
        }));
      }
      if (ticket === revision) clearLocal();
      return deny("SERVER_UNAVAILABLE");
    }
  }

  // FINORA_P1_611M_VERIFIED_SCOPE
  // Main-process only. No Wallet token or renderer-supplied IDs.
  // Reuse read() for session, expiry, association and revision checks.
  async function verifiedScope() {
    return read(async () => {
      const session = active;

      if (!session) {
        return deny("UNAUTHORIZED");
      }

      return {
        success: true as const,
        data: {
          ownerId: session.serverScope.ownerId,
          businessId: session.serverScope.businessId,
          branchId: session.serverScope.branchId,
          // Main-process-only revision; changes on clear/re-establish.
          // Existing read() rejects stale asynchronous results.
          sessionRevision: revision,
        },
      };
    });
  }

  return Object.freeze({
    establish,
    verifiedScope,
    balance: () => read(token => balanceClient(token)),
    pricing: () => read(token => pricingClient(token)),
    transactions: () => read(token => historyClient.transactions(token)),
    recharges: () => read(token => historyClient.recharges(token)),
    recharge: (input: unknown) => read(token => rechargeClient(token, input)),
    subscriptionPurchase: (input: unknown) =>
      read(token => subscriptionPurchaseClient(token, input)),
    recovery: (operationId: string) =>
      read(token => recoveryClient(token, operationId)),
    clearLocal,
  });
}