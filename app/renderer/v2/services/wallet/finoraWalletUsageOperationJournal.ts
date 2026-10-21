/*
 * FINORA_P1_589B_DURABLE_OPERATION_JOURNAL
 *
 * Storage-independent repository foundation.
 * Persistence is supplied by an adapter, NEVER by memory fallback.
 * This journal is client evidence, NOT server settlement authority.
 * No Wallet debit, reservation, settlement or USB mutation here.
 */

export type WalletUsageOperationKind =
  "CUSTOMER" | "LOAN" | "COLLECTION";

export type WalletUsageClientState =
  "PREPARED" | "SAVE_STARTED" | "SAVE_UNKNOWN" |
  "SAVED_REPORTED" | "RECONCILIATION_REQUIRED";

export interface WalletUsageOperationRecord {
  id: string;
  entity: "WALLET_USAGE_OPERATION";
  ownerId: string;
  businessId: string;
  branchId: string;
  sourceType: WalletUsageOperationKind;
  sourceReference: string;
  state: WalletUsageClientState;
  createdAt: string;
  updatedAt: string;
  allowAutomaticSettlement: false;
}

export interface WalletUsageJournalScope {
  ownerId: string;
  businessId: string;
  branchId: string;
}

export interface WalletUsageJournalStore {
  get(
    id: string,
    scope: WalletUsageJournalScope,
  ): Promise<WalletUsageOperationRecord | null>;

  insert(
    record: WalletUsageOperationRecord,
  ): Promise<boolean>;
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validScope(scope: WalletUsageJournalScope): boolean {
  return !!scope &&
    [scope.ownerId, scope.businessId, scope.branchId].every(
      x => typeof x === "string" &&
        x.trim() === x &&
        x.length > 0 &&
        x.length <= 128,
    );
}

function sameScope(
  record: WalletUsageOperationRecord,
  scope: WalletUsageJournalScope,
): boolean {
  return record.ownerId === scope.ownerId &&
    record.businessId === scope.businessId &&
    record.branchId === scope.branchId;
}

function validRecord(record: WalletUsageOperationRecord): boolean {
  return UUID.test(record.id) &&
    record.entity === "WALLET_USAGE_OPERATION" &&
    validScope(record) &&
    ["CUSTOMER", "LOAN", "COLLECTION"].includes(record.sourceType) &&
    typeof record.sourceReference === "string" &&
    record.sourceReference.trim().length > 0 &&
    record.sourceReference.length <= 256 &&
    [
      "PREPARED",
      "SAVE_STARTED",
      "SAVE_UNKNOWN",
      "SAVED_REPORTED",
      "RECONCILIATION_REQUIRED",
    ].includes(record.state) &&
    Number.isFinite(Date.parse(record.createdAt)) &&
    Number.isFinite(Date.parse(record.updatedAt)) &&
    record.allowAutomaticSettlement === false;
}

export function createFinoraWalletUsageOperationJournal(
  store: WalletUsageJournalStore,
) {
  if (
    !store ||
    typeof store.get !== "function" ||
    typeof store.insert !== "function"
  ) throw new Error("DURABLE_JOURNAL_STORE_REQUIRED");

  async function prepare(
    input: {
      operationId: string;
      scope: WalletUsageJournalScope;
      sourceType: WalletUsageOperationKind;
      sourceReference: string;
    },
  ) {
    const fail = (errorCode: string) =>
      ({ success: false as const, errorCode });

    if (
      !input ||
      !UUID.test(input.operationId ?? "") ||
      !validScope(input.scope)
    ) return fail("INVALID_REQUEST");

    const now = new Date().toISOString();

    const record: WalletUsageOperationRecord = {
      id: input.operationId,
      entity: "WALLET_USAGE_OPERATION",
      ...input.scope,
      sourceType: input.sourceType,
      sourceReference: input.sourceReference,
      state: "PREPARED",
      createdAt: now,
      updatedAt: now,
      allowAutomaticSettlement: false,
    };

    if (!validRecord(record)) return fail("INVALID_REQUEST");

    try {
      const existing = await store.get(record.id, input.scope);

      // Never silently reuse an ID. An unknown storage failure
      // must not be interpreted as a missing operation.
      if (existing !== null) {
        return fail("OPERATION_ALREADY_EXISTS");
      }

      const written = await store.insert(record);
      if (written !== true) return fail("STORAGE_UNAVAILABLE");

      const reread = await store.get(record.id, input.scope);

      if (
        !reread ||
        !validRecord(reread) ||
        !sameScope(reread, input.scope) ||
        reread.id !== record.id ||
        reread.sourceType !== record.sourceType ||
        reread.sourceReference !== record.sourceReference ||
        reread.state !== "PREPARED"
      ) return fail("PERSISTENCE_UNVERIFIED");

      return {
        success: true as const,
        data: { ...reread, allowAutomaticSettlement: false as const },
      };
    } catch {
      return fail("STORAGE_UNAVAILABLE");
    }
  }

  async function recover(
    operationId: string,
    scope: WalletUsageJournalScope,
  ) {
    const fail = (errorCode: string) =>
      ({ success: false as const, errorCode });

    if (!UUID.test(operationId ?? "") || !validScope(scope)) {
      return fail("INVALID_REQUEST");
    }

    try {
      const record = await store.get(operationId, scope);

      if (!record) return fail("OPERATION_NOT_FOUND");

      if (
        !validRecord(record) ||
        !sameScope(record, scope) ||
        record.id !== operationId
      ) return fail("STORAGE_SCOPE_MISMATCH");

      return {
        success: true as const,
        data: { ...record, allowAutomaticSettlement: false as const },
      };
    } catch {
      return fail("STORAGE_UNAVAILABLE");
    }
  }

  return Object.freeze({ prepare, recover });
}