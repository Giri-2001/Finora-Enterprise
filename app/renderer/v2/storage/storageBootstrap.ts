// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 STORAGE FOUNDATION
// STORAGE BOOTSTRAP
//
// RESPONSIBILITY:
//
// - Initialize FINORA V2 storage during application startup
// - Use StorageManager as the single storage entry point
// - Keep application startup independent from storage adapters
// - Provide a safe startup result
//
// IMPORTANT:
//
// - No Customer logic
// - No Loan logic
// - No Collection logic
// - No Payment logic
// - No Report logic
// - No direct localStorage access
// - No direct filesystem access
// - No Electron IPC
//
// VERSION : 2.0
// STATUS  : Production Foundation
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import {
  storageManager,
} from "./storageManager";

import type {
  StorageResult,
} from "./storage.types";


// ============================================================
// BOOTSTRAP
// ============================================================

export async function initializeV2Storage():
  Promise<StorageResult<void>> {

  try {

    return await storageManager.initialize();

  } catch {

    return {
      success: false,

      error:
        "Unable to initialize FINORA storage.",
    };

  }
}


// ============================================================
// STORAGE READY CHECK
// ============================================================

export function isV2StorageInitialized():
  boolean {

  return storageManager.isInitialized();
}
