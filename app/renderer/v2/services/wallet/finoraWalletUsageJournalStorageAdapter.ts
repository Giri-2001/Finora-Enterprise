/*
 * FINORA_P1_589C_SCOPED_JOURNAL_ADAPTER
 *
 * No localStorage fallback.
 * No authority to settle Wallet usage.
 * Only accepts an explicitly supplied storage implementation.
 */

import type {
  WalletUsageJournalScope,
  WalletUsageJournalStore,
  WalletUsageOperationRecord,
} from "./finoraWalletUsageOperationJournal";

type StorageResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type JournalStoredEnvelope = {
  id: string;
  entity: "WALLET_USAGE_OPERATION";
  data: WalletUsageOperationRecord;
  createdAt: string;
  updatedAt: string;
};

export interface WalletUsageScopedStorage {
  get(
    query: {
      entity: string;
      id: string;
      ownerId: string;
      businessId: string;
      branchId: string;
    },
  ): Promise<StorageResponse<unknown>>;

  save(
    record: JournalStoredEnvelope,
    options: {
      ownerId: string;
      businessId: string;
      branchId: string;
    },
  ): Promise<StorageResponse<unknown>>;
}

function exactScope(
  record: WalletUsageOperationRecord,
  scope: WalletUsageJournalScope,
): boolean {
  return (
    record.ownerId === scope.ownerId &&
    record.businessId === scope.businessId &&
    record.branchId === scope.branchId
  );
}

function unwrapRecord(
  value: unknown,
): WalletUsageOperationRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const outer = value as Record<string, unknown>;

  // Some storage adapters return the envelope, others return its data.
  const candidate =
    outer.entity === "WALLET_USAGE_OPERATION" &&
    outer.data &&
    typeof outer.data === "object" &&
    !Array.isArray(outer.data)
      ? outer.data
      : value;

  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  return candidate as WalletUsageOperationRecord;
}

export function createFinoraWalletUsageJournalStorageAdapter(
  storage: WalletUsageScopedStorage,
): WalletUsageJournalStore {
  if (
    !storage ||
    typeof storage.get !== "function" ||
    typeof storage.save !== "function"
  ) {
    throw new Error("SCOPED_STORAGE_REQUIRED");
  }

  return Object.freeze({
    async get(
      id: string,
      scope: WalletUsageJournalScope,
    ): Promise<WalletUsageOperationRecord | null> {
      const response = await storage.get({
        entity: "WALLET_USAGE_OPERATION",
        id,
        ownerId: scope.ownerId,
        businessId: scope.businessId,
        branchId: scope.branchId,
      });

      if (!response || response.success !== true) {
        throw new Error("JOURNAL_READ_UNAVAILABLE");
      }

      if (response.data === undefined || response.data === null) {
        return null;
      }

      const record = unwrapRecord(response.data);

      // A storage adapter returning another tenant's data is a hard error,
      // not "not found". Never perform an unscoped fallback query.
      if (
        !record ||
        record.id !== id ||
        record.entity !== "WALLET_USAGE_OPERATION" ||
        !exactScope(record, scope)
      ) {
        throw new Error("JOURNAL_SCOPE_VIOLATION");
      }

      return record;
    },

    async insert(
      record: WalletUsageOperationRecord,
    ): Promise<boolean> {
      if (
        !record ||
        record.entity !== "WALLET_USAGE_OPERATION" ||
        !record.ownerId ||
        !record.businessId ||
        !record.branchId ||
        record.allowAutomaticSettlement !== false
      ) {
        return false;
      }

      const response = await storage.save(
        {
          id: record.id,
          entity: "WALLET_USAGE_OPERATION",
          data: record,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        },
        {
          ownerId: record.ownerId,
          businessId: record.businessId,
          branchId: record.branchId,
        },
      );

      return response?.success === true;
    },
  });
}