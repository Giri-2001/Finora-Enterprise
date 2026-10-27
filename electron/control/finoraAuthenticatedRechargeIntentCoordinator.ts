/*
 * FINORA_P1_612A_AUTHENTICATED_RECHARGE_INTENTS
 * Electron main-process only.
 * Stores/retrieves encrypted retry identity for verified Wallet scope.
 * Never authorizes a payment, creates a server recharge, or credits Wallet.
 */

import type {
  RechargeIntent,
  RechargeIntentScope,
} from "./finoraServerRechargeIntentCore.js";

type Result<T> =
  | { success: true; data: T }
  | { success: false; errorCode: string };

type IntentStore = {
  save(
    scope: RechargeIntentScope,
    intent: RechargeIntent,
  ): Promise<void>;
  load(
    scope: RechargeIntentScope,
  ): Promise<RechargeIntent | null>;
  clearIfMatches(
    scope: RechargeIntentScope,
    idempotencyKey: string,
  ): Promise<boolean>;
};

type VerifiedIntentAuthority = RechargeIntentScope & {
  sessionRevision: number;
};

type Resolver = {
  // Must originate from the validated Proof Gateway session.
  resolve(): Promise<Result<VerifiedIntentAuthority>>;
};

function persistentScope(
  value: VerifiedIntentAuthority,
): RechargeIntentScope {
  return {
    ownerId: value.ownerId,
    businessId: value.businessId,
    branchId: value.branchId,
    walletId: value.walletId,
  };
}

function sameScope(
  left: VerifiedIntentAuthority,
  right: VerifiedIntentAuthority,
): boolean {
  return (
    left.ownerId === right.ownerId &&
    left.businessId === right.businessId &&
    left.branchId === right.branchId &&
    left.walletId === right.walletId &&
    left.sessionRevision === right.sessionRevision
  );
}

function validScope(
  scope: RechargeIntentScope | null | undefined,
): scope is RechargeIntentScope {
  if (!scope) return false;

  for (const field of [
    "ownerId",
    "businessId",
    "branchId",
  ] as const) {
    const value = scope[field];
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.length > 128 ||
      value.trim() !== value ||
      /[\u0000-\u001f\u007f]/.test(value)
    ) return false;
  }

  return (
    typeof scope.walletId === "string" &&
    /^[0-9]{8,12}$/.test(scope.walletId)
  );
}

export function createFinoraAuthenticatedRechargeIntentCoordinator(
  dependencies: {
    scopeResolver: Resolver;
    store: IntentStore;
  },
) {
  if (
    typeof dependencies?.scopeResolver?.resolve !== "function" ||
    typeof dependencies?.store?.save !== "function" ||
    typeof dependencies?.store?.load !== "function" ||
    typeof dependencies?.store?.clearIfMatches !== "function"
  ) {
    throw new Error("RECHARGE_INTENT_COORDINATOR_DEPENDENCIES_INVALID");
  }

  async function resolveScope(): Promise<Result<VerifiedIntentAuthority>> {
    try {
      const result = await dependencies.scopeResolver.resolve();

      if (result.success !== true) {
        return {
          success: false,
          errorCode: result.errorCode === "STALE_OPERATION"
            ? "STALE_OPERATION"
            : "UNAUTHORIZED",
        };
      }

      if (
        !validScope(result.data) ||
        !Number.isSafeInteger(result.data.sessionRevision) ||
        result.data.sessionRevision < 0
      ) {
        return { success: false, errorCode: "UNAUTHORIZED" };
      }

      return { success: true, data: { ...result.data } };
    } catch {
      return { success: false, errorCode: "UNAUTHORIZED" };
    }
  }

  async function verifiedSave(
    intent: RechargeIntent,
  ): Promise<Result<{ walletId: string }>> {
    const before = await resolveScope();
    if (!before.success) return before;

    try {
      // The encrypted store rejects an existing pending intent.
      // Never overwrite or silently generate a replacement UUID.
      await dependencies.store.save(persistentScope(before.data), intent);
    } catch {
      return {
        success: false,
        errorCode: "RECHARGE_INTENT_SAVE_FAILED",
      };
    }

    const after = await resolveScope();

    if (!after.success || !sameScope(before.data, after.data)) {
      // Preserve the existing encrypted intent for future reconciliation.
      // Do not delete an intent because authentication changed.
      return { success: false, errorCode: "STALE_OPERATION" };
    }

    return {
      success: true,
      data: { walletId: before.data.walletId },
    };
  }

  async function verifiedLoad(): Promise<
    Result<{
      walletId: string;
      intent: RechargeIntent | null;
    }>
  > {
    const before = await resolveScope();
    if (!before.success) return before;

    let intent: RechargeIntent | null;

    try {
      intent = await dependencies.store.load(persistentScope(before.data));
    } catch {
      return {
        success: false,
        errorCode: "RECHARGE_INTENT_LOAD_FAILED",
      };
    }

    const after = await resolveScope();

    if (!after.success || !sameScope(before.data, after.data)) {
      return { success: false, errorCode: "STALE_OPERATION" };
    }

    return {
      success: true,
      data: {
        walletId: before.data.walletId,
        intent,
      },
    };
  }

  // FINORA_P1_753I_VERIFIED_CLEAR
  // Only a server-confirmed receipt can authorize this caller to
  // settle the exact encrypted retry identity.
  async function verifiedClearIfMatches(
    idempotencyKey: string,
  ): Promise<Result<{ cleared: boolean }>> {
    const before = await resolveScope();
    if (!before.success) return before;

    if (
      typeof idempotencyKey !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idempotencyKey)
    ) {
      return { success: false, errorCode: "INVALID_REQUEST" };
    }

    let existing: RechargeIntent | null;
    try {
      existing = await dependencies.store.load(persistentScope(before.data));
    } catch {
      return { success: false, errorCode: "RECHARGE_INTENT_LOAD_FAILED" };
    }

    if (
      !existing ||
      existing.idempotencyKey.toLowerCase() !== idempotencyKey.toLowerCase()
    ) {
      return { success: false, errorCode: "RECHARGE_INTENT_MISMATCH" };
    }

    const after = await resolveScope();
    if (!after.success || !sameScope(before.data, after.data)) {
      return { success: false, errorCode: "STALE_OPERATION" };
    }

    try {
      const cleared = await dependencies.store.clearIfMatches(
        persistentScope(before.data),
        idempotencyKey.toLowerCase(),
      );
      return { success: true, data: { cleared } };
    } catch {
      return { success: false, errorCode: "RECHARGE_INTENT_CLEAR_FAILED" };
    }
  }

  return Object.freeze({
    verifiedSave,
    verifiedLoad,
    verifiedClearIfMatches,
  });
}