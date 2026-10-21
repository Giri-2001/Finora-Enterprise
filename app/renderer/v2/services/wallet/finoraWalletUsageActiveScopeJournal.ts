/*
 * FINORA_P1_589M_ACTIVE_SCOPE_GUARD
 *
 * Re-check selected StorageManager scope on EVERY operation.
 * Not server authentication or settlement authority.
 * No Wallet debit.
 */

import { storageManager } from "../../storage/storageManager";

import {
  createFinoraWalletUsageJournal,
} from "./finoraWalletUsageJournalFactory";

type Scope = {
  ownerId: string;
  businessId: string;
  branchId: string;
};

type ActiveConfiguration = Partial<Scope> & {
  storageMode?: string;
  dataContext?: string;
};

type Journal = ReturnType<typeof createFinoraWalletUsageJournal>;

export function createFinoraWalletUsageActiveScopeJournal(
  dependencies: {
    journal?: Journal;
    getConfiguration?: () => ActiveConfiguration;
    getLifecycleRevision?: () => number;
  } = {},
) {
  const journal =
    dependencies.journal ?? createFinoraWalletUsageJournal();

  const getConfiguration =
    dependencies.getConfiguration ??
    (() => storageManager.getConfiguration());

  // FINORA_P1_589S_REVISION_GUARD
  const getLifecycleRevision =
    dependencies.getLifecycleRevision ??
    (() => storageManager.getLifecycleRevision());

  function safeRevision(): number | null {
    try {
      const revision = getLifecycleRevision();
      return Number.isSafeInteger(revision) && revision >= 0
        ? revision : null;
    } catch {
      return null;
    }
  }

  function safeCurrentMode(): string | null {
    try {
      const value = getConfiguration()?.storageMode;
      return typeof value === "string" ? value : null;
    } catch {
      return null;
    }
  }

  function authorized(scope: Scope): boolean {
    try {
      if (!scope || typeof scope !== "object") return false;

      const active = getConfiguration();

      if (!active || active.dataContext !== "REAL") return false;

      if (!["LOCAL", "USB", "CLOUD"].includes(
        String(active.storageMode ?? ""),
      )) return false;

      return (
        [scope.ownerId,scope.businessId,scope.branchId].every(
          value => typeof value === "string" &&
            value.length > 0 &&
            value.length <= 128 &&
            value === value.trim(),
        ) &&
        scope.ownerId === active.ownerId &&
        scope.businessId === active.businessId &&
        scope.branchId === active.branchId
      );
    } catch {
      return false;
    }
  }

  return Object.freeze({
    async prepare(
      input: Parameters<Journal["prepare"]>[0],
    ) {
      if (!input || !authorized(input.scope)) {
        return {
          success: false as const,
          errorCode: "ACTIVE_SCOPE_MISMATCH",
        };
      }

      // FINORA_P1_589N_POST_AWAIT_GUARD
      // A completed write cannot be assumed rolled back.
      // FINORA_P1_589P_MODE_GUARD
      const initialRevision = safeRevision();
      if (initialRevision === null) {
        return {
          success: false as const,
          errorCode: "STORAGE_LIFECYCLE_UNAVAILABLE",
        };
      }
      const initialMode = safeCurrentMode();
      const result = await journal.prepare(input);
      if (safeRevision() !== initialRevision) {
        return {
          success: false as const,
          errorCode: "STORAGE_LIFECYCLE_CHANGED_RECONCILIATION_REQUIRED",
        };
      }
      if (initialMode !== safeCurrentMode()) {
        return {
          success: false as const,
          errorCode: "STORAGE_MODE_CHANGED_RECONCILIATION_REQUIRED",
        };
      }
      if (!authorized(input.scope)) {
        return {
          success: false as const,
          errorCode: "ACTIVE_SCOPE_CHANGED_RECONCILIATION_REQUIRED",
        };
      }
      return result;
    },

    async recover(
      operationId: string,
      scope: Scope,
    ) {
      if (!authorized(scope)) {
        return {
          success: false as const,
          errorCode: "ACTIVE_SCOPE_MISMATCH",
        };
      }

      const initialRevision = safeRevision();
      if (initialRevision === null) {
        return {
          success: false as const,
          errorCode: "STORAGE_LIFECYCLE_UNAVAILABLE",
        };
      }
      const initialMode = safeCurrentMode();
      const result = await journal.recover(operationId,scope);
      if (safeRevision() !== initialRevision) {
        return {
          success: false as const,
          errorCode: "STORAGE_LIFECYCLE_CHANGED_RECONCILIATION_REQUIRED",
        };
      }
      if (initialMode !== safeCurrentMode()) {
        return {
          success: false as const,
          errorCode: "STORAGE_MODE_CHANGED_RECONCILIATION_REQUIRED",
        };
      }
      if (!authorized(scope)) {
        return {
          success: false as const,
          errorCode: "ACTIVE_SCOPE_CHANGED_RECONCILIATION_REQUIRED",
        };
      }
      return result;
    },
  });
}