// FINORA_P1_730V_DURABLE_USB_JOURNAL
// USB-only reservation retry identity. Never use LOCAL fallback.
// No customer personal data, credentials or wallet tokens.

import { storageManager } from "../../storage/storageManager";
import { StorageMode, StorageAvailability, DataContext } from "../../storage/storage.types";
import type { StorageResult } from "../../storage/storage.types";

export const FINORA_CUSTOMER_RETRY_ENTITY = "CUSTOMER_RESERVATION_RETRY";

export interface FinoraRetryScope {
  ownerId: string;
  businessId: string;
  branchId: string;
}

export type FinoraRetryStatus =
  | "PREPARED"
  | "RESERVED"
  | "CUSTOMER_SAVED"
  | "CHARGED";

export interface FinoraCustomerRetryJournal extends FinoraRetryScope {
  id: string;
  entity: typeof FINORA_CUSTOMER_RETRY_ENTITY;
  requestKey: string;
  status: FinoraRetryStatus;
  customerNumber: number | null;
  customerId: string | null;
  createdAt: string;
  updatedAt: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validScope(scope: FinoraRetryScope): boolean {
  return Boolean(scope) &&
    [scope.ownerId, scope.businessId, scope.branchId].every(
      value => typeof value === "string" && value.trim().length > 0
    );
}

function journalId(scope: FinoraRetryScope): string {
  return `${scope.businessId}::${scope.branchId}::CUSTOMER_CREATE_PENDING`;
}

async function requireUsb(scope: FinoraRetryScope): Promise<string | null> {
  if (!validScope(scope)) return "INVALID_RETRY_SCOPE";
  if (!storageManager.isInitialized()) return "STORAGE_NOT_INITIALIZED";
  if (storageManager.getStorageMode() !== StorageMode.USB) {
    return "USB_STORAGE_REQUIRED";
  }
  const config = storageManager.getConfiguration();
  if (config.dataContext !== DataContext.REAL ||
      config.ownerId !== scope.ownerId) {
    return "USB_OWNER_CONTEXT_MISMATCH";
  }
  const status = await storageManager.getStatus();
  if (status.mode !== StorageMode.USB ||
      status.availability !== StorageAvailability.READY) {
    return "USB_NOT_READY";
  }
  return null;
}

function validJournal(
  value: unknown, scope: FinoraRetryScope
): value is FinoraCustomerRetryJournal {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return row.entity === FINORA_CUSTOMER_RETRY_ENTITY &&
    row.id === journalId(scope) &&
    row.ownerId === scope.ownerId &&
    row.businessId === scope.businessId &&
    row.branchId === scope.branchId &&
    typeof row.requestKey === "string" && UUID.test(row.requestKey) &&
    ["PREPARED", "RESERVED", "CUSTOMER_SAVED", "CHARGED"].includes(String(row.status)) &&
    (row.customerNumber === null ||
      (typeof row.customerNumber === "number" &&
       Number.isSafeInteger(row.customerNumber) &&
       row.customerNumber >= 1 && row.customerNumber <= 999999)) &&
    (row.customerId === null ||
      (typeof row.customerId === "string" && row.customerId.length > 0));
}

export async function readFinoraCustomerRetryJournal(
  scope: FinoraRetryScope
): Promise<StorageResult<FinoraCustomerRetryJournal | undefined>> {
  const guard = await requireUsb(scope);
  if (guard) return { success: false, error: guard };
  const result = await storageManager.get<FinoraCustomerRetryJournal>({
    entity: FINORA_CUSTOMER_RETRY_ENTITY,
    id: journalId(scope),
    ownerId: scope.ownerId,
    businessId: scope.businessId,
    branchId: scope.branchId,
  });
  if (!result.success) return { success: false, error: result.error };
  if (result.data === undefined) return { success: true, data: undefined };
  if (!validJournal(result.data, scope)) {
    return { success: false, error: "USB_RETRY_JOURNAL_INVALID" };
  }
  return { success: true, data: result.data };
}

export async function prepareFinoraCustomerRetryJournal(
  scope: FinoraRetryScope,
  requestKey: string,
): Promise<StorageResult<FinoraCustomerRetryJournal>> {
  if (typeof requestKey !== "string" || !UUID.test(requestKey)) {
    return { success: false, error: "INVALID_RETRY_KEY" };
  }
  const existing = await readFinoraCustomerRetryJournal(scope);
  if (!existing.success) return { success: false, error: existing.error };
  // FINORA_P1_731D_RETRY_IDENTITY_GUARD
  // A different Customer attempt must never inherit an old UUID.
  if (existing.data) {
    if (existing.data.requestKey !== requestKey) {
      return {
        success: false,
        error: "EXISTING_CUSTOMER_RETRY_REQUIRES_RECOVERY",
      };
    }
    if (existing.data.status === "CHARGED") {
      return {
        success: false,
        error: "COMPLETED_JOURNAL_REQUIRES_SAFE_ROTATION",
      };
    }
    return { success: true, data: existing.data };
  }
  const guard = await requireUsb(scope);
  if (guard) return { success: false, error: guard };
  const now = new Date().toISOString();
  const record: FinoraCustomerRetryJournal = {
    ...scope,
    id: journalId(scope),
    entity: FINORA_CUSTOMER_RETRY_ENTITY,
    requestKey,
    status: "PREPARED",
    customerNumber: null,
    customerId: null,
    createdAt: now,
    updatedAt: now,
  };
  const saved = await storageManager.save(record, {
    ownerId: scope.ownerId,
    businessId: scope.businessId,
    branchId: scope.branchId,
  });
  if (!saved.success) return { success: false, error: saved.error };
  const verified = await readFinoraCustomerRetryJournal(scope);
  if (!verified.success || !verified.data ||
      verified.data.requestKey !== requestKey ||
      verified.data.status !== "PREPARED") {
    return { success: false, error: "USB_JOURNAL_READBACK_FAILED" };
  }
  return { success: true, data: verified.data };
}

// FINORA_P1_730W_JOURNAL_LIFECYCLE
// Persist every step and confirm it by a second USB read.
// This is NOT a cross-process compare-and-swap lock.

export interface FinoraRetryTransition {
  expectedStatus: FinoraRetryStatus;
  nextStatus: FinoraRetryStatus;
  requestKey: string;
  customerNumber?: number;
  customerId?: string;
}

const NEXT_STATUS: Record<FinoraRetryStatus, FinoraRetryStatus | null> = {
  PREPARED: "RESERVED",
  RESERVED: "CUSTOMER_SAVED",
  CUSTOMER_SAVED: "CHARGED",
  CHARGED: null,
};

export async function advanceFinoraCustomerRetryJournal(
  scope: FinoraRetryScope,
  transition: FinoraRetryTransition,
): Promise<StorageResult<FinoraCustomerRetryJournal>> {
  const guard = await requireUsb(scope);
  if (guard) return { success: false, error: guard };

  if (!transition ||
      typeof transition.requestKey !== "string" ||
      !UUID.test(transition.requestKey) ||
      NEXT_STATUS[transition.expectedStatus] !== transition.nextStatus) {
    return { success: false, error: "INVALID_JOURNAL_TRANSITION" };
  }

  const current = await readFinoraCustomerRetryJournal(scope);
  if (!current.success || !current.data) {
    return { success: false, error: "RETRY_JOURNAL_MISSING" };
  }

  const previous = current.data;
  if (previous.requestKey !== transition.requestKey ||
      previous.status !== transition.expectedStatus) {
    return { success: false, error: "RETRY_JOURNAL_STATE_CONFLICT" };
  }

  const number = transition.customerNumber ?? previous.customerNumber;
  const customerId = transition.customerId ?? previous.customerId;

  if (transition.nextStatus === "RESERVED") {
    if (typeof number !== "number" ||
        !Number.isSafeInteger(number) || number < 1 || number > 999999 ||
        typeof customerId !== "string" || !customerId.trim()) {
      return { success: false, error: "RESERVATION_DETAILS_REQUIRED" };
    }
  } else {
    if (number !== previous.customerNumber ||
        customerId !== previous.customerId ||
        number === null || customerId === null) {
      return { success: false, error: "IMMUTABLE_RESERVATION_MISMATCH" };
    }
  }

  const updated: FinoraCustomerRetryJournal = {
    ...previous,
    status: transition.nextStatus,
    customerNumber: number,
    customerId,
    updatedAt: new Date().toISOString(),
  };

  const writeGuard = await requireUsb(scope);
  if (writeGuard) return { success: false, error: writeGuard };

  const written = await storageManager.update(updated, {
    ownerId: scope.ownerId,
    businessId: scope.businessId,
    branchId: scope.branchId,
  });
  if (!written.success) {
    return { success: false, error: written.error ?? "JOURNAL_UPDATE_FAILED" };
  }

  const verified = await readFinoraCustomerRetryJournal(scope);
  if (!verified.success || !verified.data ||
      verified.data.requestKey !== transition.requestKey ||
      verified.data.status !== transition.nextStatus ||
      verified.data.customerNumber !== number ||
      verified.data.customerId !== customerId ||
      verified.data.updatedAt !== updated.updatedAt) {
    return { success: false, error: "JOURNAL_UPDATE_READBACK_FAILED" };
  }

  return { success: true, data: verified.data };
}

// FINORA_P1_731E_RESTART_RECOVERY
// Read-only recovery decision. Never allocates a new number.
export type FinoraCustomerRecoveryAction =
  | "CREATE_NEW_JOURNAL"
  | "RETRY_SAME_RESERVATION_KEY"
  | "RECONCILE_CUSTOMER_RECORD"
  | "RECONCILE_WALLET_CHARGE"
  | "COMPLETED_ROTATION_REQUIRED"
  | "RECOVERY_BLOCKED";

export interface FinoraCustomerRecoveryDecision {
  action: FinoraCustomerRecoveryAction;
  requestKey?: string;
  customerNumber?: number;
  customerId?: string;
  errorCode?: string;
}

export async function inspectFinoraCustomerRecovery(
  scope: FinoraRetryScope,
): Promise<FinoraCustomerRecoveryDecision> {
  const result = await readFinoraCustomerRetryJournal(scope);
  if (!result.success) {
    return {
      action: "RECOVERY_BLOCKED",
      errorCode: result.error ?? "USB_JOURNAL_UNAVAILABLE",
    };
  }

  const journal = result.data;
  if (!journal) {
    return { action: "CREATE_NEW_JOURNAL" };
  }

  if (journal.status === "PREPARED") {
    if (journal.customerNumber !== null || journal.customerId !== null) {
      return { action: "RECOVERY_BLOCKED", errorCode: "PREPARED_STATE_INVALID" };
    }
    return {
      action: "RETRY_SAME_RESERVATION_KEY",
      requestKey: journal.requestKey,
    };
  }

  if (journal.customerNumber === null || journal.customerId === null) {
    return {
      action: "RECOVERY_BLOCKED",
      errorCode: "RESERVATION_DETAILS_MISSING",
    };
  }

  const details = {
    requestKey: journal.requestKey,
    customerNumber: journal.customerNumber,
    customerId: journal.customerId,
  };

  switch (journal.status) {
    case "RESERVED":
      return { action: "RECONCILE_CUSTOMER_RECORD", ...details };
    case "CUSTOMER_SAVED":
      return { action: "RECONCILE_WALLET_CHARGE", ...details };
    case "CHARGED":
      return { action: "COMPLETED_ROTATION_REQUIRED", ...details };
    default:
      return { action: "RECOVERY_BLOCKED", errorCode: "UNKNOWN_JOURNAL_STATUS" };
  }
}

// No cleanup/overwrite API until crash recovery is verified.
// Multi-wizard concurrency and USB replacement require separate tests.
