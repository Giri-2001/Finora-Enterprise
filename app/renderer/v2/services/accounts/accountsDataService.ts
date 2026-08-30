/* ===========================================================
   FINORA ENTERPRISE OS™
   ACCOUNTS ENGINE™

   ACCOUNTS DATA SERVICE

   RESPONSIBILITY:
   - Read authoritative persisted Loans
   - Read authoritative persisted Collections
   - Convert Loans into Money Out entries
   - Convert Collections into Money In entries
   - Build one Accounts financial activity read model
   - Build customer filter options
   - Defensively prevent duplicate account rows
   - Preserve mapping issues for diagnostics

   IMPORTANT:
   - Accounts does NOT persist a duplicate ledger.
   - LOAN remains authoritative for disbursements.
   - COLLECTION remains authoritative for money received.
   - No React.
   - No styles.
   - No filtering.
   - No totals.
   - No currency formatting.
   - No theme logic.
   - No responsive logic.
   - No mutation of Loan or Collection records.

   READ MODEL:

   LOAN
      ↓
   Loan Account Mapper
      ↓
   MONEY OUT

   COLLECTION
      ↓
   Collection Account Mapper
      ↓
   MONEY IN

          ↓
   ACCOUNTS DATA RESULT

   VERSION : 1.0
=========================================================== */

import { mapCollectionsToAccountEntries } from "../../mappers/accounts/collectionAccount.mapper";

import { mapLoansToAccountEntries } from "../../mappers/accounts/loanAccount.mapper";

import { collectionRepository } from "../../repositories/collection/collectionRepository";

import { getLoans } from "../../repositories/loan/loanRepository";

import { loadPersistedGoldStorageState } from "../gold-loan/goldCustodyPersistenceService";

import { storageManager } from "../../storage/storageManager";

import { StorageAvailability } from "../../storage/storage.types";

import type {
  AccountDataIssue,
  AccountEntry,
  AccountsCustomerOption,
  AccountsDataResult,
} from "../../types/accounts/accounts.types";

/* ===========================================================
   SAFE TEXT
=========================================================== */

function safeText(value: unknown, fallback = ""): string {
  const text = String(value ?? "").trim();

  return text || fallback;
}

/* ===========================================================
   AUTHORITATIVE STORAGE READINESS

   Accounts must never interpret an unavailable storage device
   as an empty financial ledger.

   IMPORTANT:

   - No USB → LOCAL fallback.
   - No fake zero totals.
   - Preserve the active authenticated storage mode.
=========================================================== */

async function assertAccountsStorageReady(): Promise<void> {
  const status = await storageManager.getStatus();

  if (status.availability === StorageAvailability.READY) {
    return;
  }

  throw new Error(
    safeText(
      status.message,
      "FINORA storage is not ready. Please reconnect the configured storage and try again.",
    ),
  );
}

/* ===========================================================
   ENTRY TIME

   Used only for deterministic read-model ordering.

   Screen selectors can still apply their own visible sorting.
=========================================================== */

function getAccountEntryTime(entry: AccountEntry): number {
  const time = new Date(entry.occurredAt).getTime();

  return Number.isFinite(time) ? time : 0;
}

/* ===========================================================
   STABLE ACCOUNT ENTRY SORT

   Latest financial activity first.

   Original mapper arrays are never mutated.
=========================================================== */

function sortAccountEntries(entries: readonly AccountEntry[]): AccountEntry[] {
  return [...entries].sort((left, right) => {
    const timeDifference =
      getAccountEntryTime(right) - getAccountEntryTime(left);

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return right.id.localeCompare(left.id);
  });
}

/* ===========================================================
   DUPLICATE ISSUE
=========================================================== */

function createDuplicateEntryIssue(entry: AccountEntry): AccountDataIssue {
  return {
    sourceType: entry.sourceType,

    sourceId: entry.sourceId,

    message: `Duplicate Accounts entry was ignored: ${entry.id}`,
  };
}

/* ===========================================================
   DEDUPLICATE ACCOUNT ENTRIES

   IMPORTANT:

   Duplicate read-model rows must never inflate:
   - Money Out
   - Money In
   - Net Movement
   - Transaction count

   The first occurrence is preserved.
=========================================================== */

function deduplicateAccountEntries(entries: readonly AccountEntry[]): {
  entries: AccountEntry[];

  issues: AccountDataIssue[];
} {
  const uniqueEntries: AccountEntry[] = [];

  const issues: AccountDataIssue[] = [];

  const seenIds = new Set<string>();

  for (const entry of entries) {
    const entryId = safeText(entry.id);

    if (!entryId) {
      issues.push({
        sourceType: entry.sourceType,

        sourceId: safeText(entry.sourceId, "UNKNOWN"),

        message: "Accounts entry ID is missing.",
      });

      continue;
    }

    if (seenIds.has(entryId)) {
      issues.push(createDuplicateEntryIssue(entry));

      continue;
    }

    seenIds.add(entryId);

    uniqueEntries.push(entry);
  }

  return {
    entries: uniqueEntries,

    issues,
  };
}

/* ===========================================================
   CUSTOMER QUALITY

   Customer options are derived from actual financial activity.

   If multiple entries belong to the same customer:
   - preserve one option
   - prefer a real name over "--"
   - prefer an available phone number
=========================================================== */

function shouldReplaceCustomerName(
  currentName: string,
  nextName: string,
): boolean {
  const normalizedCurrent = safeText(currentName);

  const normalizedNext = safeText(nextName);

  if (!normalizedNext) {
    return false;
  }

  if (!normalizedCurrent || normalizedCurrent === "--") {
    return normalizedNext !== "--";
  }

  return false;
}

/* ===========================================================
   BUILD CUSTOMER OPTIONS
=========================================================== */

function buildAccountsCustomerOptions(
  entries: readonly AccountEntry[],
): AccountsCustomerOption[] {
  const customerMap = new Map<string, AccountsCustomerOption>();

  for (const entry of entries) {
    const customerId = safeText(entry.customerId);

    if (!customerId) {
      continue;
    }

    const customerName = safeText(entry.customerName, "--");

    const customerPhone = safeText(entry.customerPhone);

    const existing = customerMap.get(customerId);

    if (!existing) {
      customerMap.set(customerId, {
        customerId,

        customerName,

        customerPhone: customerPhone || undefined,
      });

      continue;
    }

    const nextCustomer: AccountsCustomerOption = {
      ...existing,
    };

    if (shouldReplaceCustomerName(existing.customerName, customerName)) {
      nextCustomer.customerName = customerName;
    }

    if (!safeText(existing.customerPhone) && customerPhone) {
      nextCustomer.customerPhone = customerPhone;
    }

    customerMap.set(customerId, nextCustomer);
  }

  return Array.from(customerMap.values()).sort((left, right) => {
    const nameCompare = left.customerName.localeCompare(
      right.customerName,
      "en-IN",
      {
        sensitivity: "base",

        numeric: true,
      },
    );

    if (nameCompare !== 0) {
      return nameCompare;
    }

    return left.customerId.localeCompare(right.customerId);
  });
}

/* ===========================================================
   BUILD ACCOUNTS DATA FROM SOURCE RECORDS

   This pure composition function is intentionally exported.

   Benefits:
   - runtime service can use it
   - tests can use it
   - future cloud sync can use the same read-model builder
   - no repository dependency is required for pure verification
=========================================================== */

export function buildAccountsDataResult(
  loanEntries: readonly AccountEntry[],

  collectionEntries: readonly AccountEntry[],

  sourceIssues: readonly AccountDataIssue[] = [],
): AccountsDataResult {
  const combinedEntries = [...loanEntries, ...collectionEntries];

  const deduplicated = deduplicateAccountEntries(combinedEntries);

  const entries = sortAccountEntries(deduplicated.entries);

  const customers = buildAccountsCustomerOptions(entries);

  return {
    entries,

    customers,

    issues: [...sourceIssues, ...deduplicated.issues],
  };
}

/* ===========================================================
   LOAD ACCOUNTS DATA

   AUTHORITATIVE SOURCES:

   getLoans()
     →
   persisted LOAN records

   collectionRepository.getAll()
     →
   persisted COLLECTION records

   No Accounts entity is created or persisted.
=========================================================== */

export async function loadAccountsData(): Promise<AccountsDataResult> {
  /* =========================================================
     STORAGE READINESS PRE-FLIGHT

     Prevent repository read failures from being interpreted
     as an empty Accounts ledger.
  ========================================================= */

  await assertAccountsStorageReady();

  /* =========================================================
     AUTHORITATIVE SOURCE LOAD
  ========================================================= */

  const [loans, collections, goldStorageResult] = await Promise.all([
    getLoans(),

    collectionRepository.getAll(),

    loadPersistedGoldStorageState(),
  ]);

  /* =========================================================
     STORAGE READINESS POST-FLIGHT

     USB may be removed while repository reads are running.

     Re-check after the source reads so a mid-read disconnect
     cannot become a fake empty Accounts result.
  ========================================================= */

  await assertAccountsStorageReady();

  /* =========================================================
     AUTHORITATIVE GOLD LOAN HISTORY

     IMPORTANT:

     A Loan remains a Gold Loan in Accounts history even after
     custody is RELEASED or RELOCATED.

     Therefore every persisted Gold custody allocation is used
     to establish permanent historical Gold identity.
  ========================================================= */

  const goldLoanIds = new Set<string>();

  if (goldStorageResult.success && goldStorageResult.state) {
    for (const allocation of goldStorageResult.state.allocations) {
      const loanId = String(allocation.loanId ?? "").trim();

      if (loanId) {
        goldLoanIds.add(loanId);
      }
    }
  } else {
    console.warn(
      "FINORA ACCOUNTS GOLD HISTORY LOAD WARNING:",
      goldStorageResult.error ?? "Unable to load Gold custody history.",
    );
  }

  /* =========================================================
     LOAN → MONEY OUT
  ========================================================= */

  const loanMapping = mapLoansToAccountEntries(loans, goldLoanIds);

  /* =========================================================
     COLLECTION → MONEY IN
  ========================================================= */

  const collectionMapping = mapCollectionsToAccountEntries(
    collections,
    loans,
    goldLoanIds,
  );

  /* =========================================================
     ACCOUNTS READ MODEL
  ========================================================= */

  return buildAccountsDataResult(
    loanMapping.entries,

    collectionMapping.entries,

    [...loanMapping.issues, ...collectionMapping.issues],
  );
}
/* ===========================================================
   COMPATIBILITY / SEMANTIC ALIAS

   Useful for callers that prefer "fetch" terminology.
=========================================================== */

export const fetchAccountsData = loadAccountsData;

/* ===========================================================
   END
=========================================================== */
