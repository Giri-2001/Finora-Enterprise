/**
 * FINORA_P1_634B_VERIFIED_DURABLE_PURCHASE
 * Main-process-only authenticated purchase intent coordinator.
 * No network, wallet debit, receipt fabrication or renderer storage.
 */

import type {
  FinoraPurchaseIntent,
  FinoraPurchaseIntentScope,
} from "./finoraServerSubscriptionPurchaseIntentStore.js";

type VerifiedAuthority = FinoraPurchaseIntentScope & {
  sessionRevision: number;
};

type AuthorityResult =
  | { success: true; data: VerifiedAuthority }
  | { success: false; errorCode: string };

type Result<T> =
  | { success: true; data: T }
  | { success: false; errorCode: string };

type Store = {
  load(scope: FinoraPurchaseIntentScope):
    Promise<FinoraPurchaseIntent | null>;
  save(scope: FinoraPurchaseIntentScope, intent: FinoraPurchaseIntent):
    Promise<FinoraPurchaseIntent>;
  clearIfMatches(
    scope: FinoraPurchaseIntentScope,
    intent: FinoraPurchaseIntent,
  ): Promise<boolean>;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validAuthority(value: unknown): value is VerifiedAuthority {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return ["ownerId", "businessId", "branchId", "walletId"]
    .every(key =>
      typeof data[key] === "string" &&
      (data[key] as string).length > 0 &&
      (data[key] as string).length <= 128
    ) &&
    typeof data.sessionRevision === "number" &&
    Number.isSafeInteger(data.sessionRevision) &&
    data.sessionRevision >= 0;
}

function sameAuthority(
  first: VerifiedAuthority,
  second: VerifiedAuthority,
): boolean {
  return first.ownerId === second.ownerId &&
    first.businessId === second.businessId &&
    first.branchId === second.branchId &&
    first.walletId === second.walletId &&
    first.sessionRevision === second.sessionRevision;
}

function asScope(value: VerifiedAuthority): FinoraPurchaseIntentScope {
  return {
    ownerId: value.ownerId,
    businessId: value.businessId,
    branchId: value.branchId,
    walletId: value.walletId,
  };
}

function validIntent(value: unknown): value is FinoraPurchaseIntent {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return Object.getPrototypeOf(value) === Object.prototype &&
    Object.keys(data).length === 2 &&
    [1, 3, 6, 12].includes(data.planMonths as number) &&
    typeof data.idempotencyKey === "string" &&
    UUID.test(data.idempotencyKey);
}

export function createFinoraAuthenticatedSubscriptionPurchaseCoordinator(
  dependencies: {
    scopeResolver: {
      resolve(): Promise<AuthorityResult>;
    };
    store: Store;
  },
) {
  if (
    typeof dependencies?.scopeResolver?.resolve !== "function" ||
    typeof dependencies?.store?.load !== "function" ||
    typeof dependencies?.store?.save !== "function" ||
    typeof dependencies?.store?.clearIfMatches !== "function"
  ) {
    throw new Error("PURCHASE_COORDINATOR_DEPENDENCIES_INVALID");
  }

  async function authority(): Promise<Result<VerifiedAuthority>> {
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

      if (!validAuthority(result.data)) {
        return { success: false, errorCode: "UNAUTHORIZED" };
      }

      return { success: true, data: result.data };
    } catch {
      return { success: false, errorCode: "UNAUTHORIZED" };
    }
  }

  async function verifiedLoad(): Promise<Result<{
    walletId: string;
    intent: FinoraPurchaseIntent | null;
  }>> {
    const before = await authority();
    if (!before.success) return before;

    let intent: FinoraPurchaseIntent | null;

    try {
      intent = await dependencies.store.load(asScope(before.data));
    } catch {
      return {
        success: false,
        errorCode: "PURCHASE_INTENT_LOAD_FAILED",
      };
    }

    const after = await authority();

    if (!after.success ||
        !sameAuthority(before.data, after.data)) {
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

  async function verifiedSave(
    requested: FinoraPurchaseIntent,
  ): Promise<Result<{
    walletId: string;
    intent: FinoraPurchaseIntent;
  }>> {
    if (!validIntent(requested)) {
      return { success: false, errorCode: "INVALID_REQUEST" };
    }

    const before = await authority();
    if (!before.success) return before;

    let stored: FinoraPurchaseIntent;

    try {
      stored = await dependencies.store.save(
        asScope(before.data),
        requested,
      );
    } catch (error) {
      const code = error instanceof Error ? error.message : "";

      return {
        success: false,
        errorCode: code === "PURCHASE_INTENT_CONFLICT"
          ? "IDEMPOTENCY_CONFLICT"
          : "PURCHASE_INTENT_SAVE_FAILED",
      };
    }

    const after = await authority();

    if (!after.success ||
        !sameAuthority(before.data, after.data)) {
      // Do not delete: an uncertain purchase may need reconciliation.
      return { success: false, errorCode: "STALE_OPERATION" };
    }

    return {
      success: true,
      data: {
        walletId: before.data.walletId,
        intent: stored,
      },
    };
  }

  async function verifiedClearAfterSuccess(
    intent: FinoraPurchaseIntent,
    receiptConfirmed: boolean,
  ): Promise<Result<{ cleared: boolean }>> {
    if (!validIntent(intent) || receiptConfirmed !== true) {
      return { success: false, errorCode: "INVALID_REQUEST" };
    }

    // Only the Main-process purchase orchestration may assert a
    // validated success receipt, never the renderer.
    const before = await authority();
    if (!before.success) return before;

    const after = await authority();

    if (!after.success ||
        !sameAuthority(before.data, after.data)) {
      return { success: false, errorCode: "STALE_OPERATION" };
    }

    try {
      const cleared = await dependencies.store.clearIfMatches(
        asScope(after.data),
        intent,
      );

      return { success: true, data: { cleared } };
    } catch {
      return {
        success: false,
        errorCode: "PURCHASE_INTENT_CLEAR_FAILED",
      };
    }
  }

  return Object.freeze({
    verifiedLoad,
    verifiedSave,
    verifiedClearAfterSuccess,
  });
}