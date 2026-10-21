/*
 * FINORA_P1_589D_JOURNAL_STORAGE_FACTORY
 *
 * Uses the active StorageManager mode (LOCAL/USB/CLOUD).
 * No direct localStorage and no fallback when USB fails.
 * This is local recovery evidence, never settlement proof.
 *
 * NOT YET CALLED BY BUSINESS SAVE FLOWS.
 */

import { storageManager } from "../../storage/storageManager";

import {
  createFinoraWalletUsageOperationJournal,
} from "./finoraWalletUsageOperationJournal";

import {
  createFinoraWalletUsageJournalStorageAdapter,
  type WalletUsageScopedStorage,
} from "./finoraWalletUsageJournalStorageAdapter";

export function createFinoraWalletUsageJournal(
  storage: WalletUsageScopedStorage =
    storageManager as unknown as WalletUsageScopedStorage,
) {
  if (
    !storage ||
    typeof storage.get !== "function" ||
    typeof storage.save !== "function"
  ) {
    throw new Error("STORAGE_MANAGER_UNAVAILABLE");
  }

  const scopedStore =
    createFinoraWalletUsageJournalStorageAdapter(storage);

  return createFinoraWalletUsageOperationJournal(scopedStore);
}