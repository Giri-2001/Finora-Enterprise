// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 STORAGE FOUNDATION
// STORAGE BOOTSTRAP
//
// RESPONSIBILITY:
//
// - Initialize FINORA V2 storage during application startup
// - Restore the authenticated storage mode
// - Support LOCAL / USB / CLOUD storage
// - Keep StorageManager as the single storage entry point
// - Prevent accidental default-USB activation on page refresh
// - Provide a safe startup result
//
// STORAGE RULE:
//
//   Authenticated LOCAL
//      → LOCAL
//
//   Authenticated USB
//      → USB
//
//   Authenticated CLOUD
//      → CLOUD
//
//   No authenticated mode
//      → LOCAL
//
// IMPORTANT:
//
// - LOCAL and USB are both first-class storage modes.
// - USB is selected only when the authenticated session says USB.
// - LOCAL is the safe default when no session mode exists.
// - USB is NEVER silently replaced by LOCAL after USB is selected.
// - No Customer logic.
// - No Loan logic.
// - No Collection logic.
// - No Payment logic.
// - No Report logic.
// - No filesystem access.
// - No Electron IPC.
//
// VERSION : 2.1
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { storageManager } from "./storageManager";

import { StorageMode } from "./storage.types";

import type { StorageResult } from "./storage.types";

// ============================================================
// SESSION STORAGE KEY
// ============================================================

const STORAGE_MODE_SESSION_KEY = "FINORA_STORAGE_MODE";

// ============================================================
// RESOLVE AUTHENTICATED STORAGE MODE
// ============================================================
//
// Login writes the authenticated physical storage mode into:
//
//   FINORA_STORAGE_MODE
//
// Application startup must restore that same mode.
//
// We must NOT allow StorageManager's constructor default to
// decide the active authenticated business storage.
//
// ============================================================

function getAuthenticatedStorageMode(): StorageMode {
  try {
    // ==========================================================
    // NON-BROWSER / SAFETY FALLBACK
    // ==========================================================

    if (typeof window === "undefined") {
      return StorageMode.LOCAL;
    }

    // ==========================================================
    // READ AUTHENTICATED MODE
    // ==========================================================

    const storedMode = window.sessionStorage.getItem(STORAGE_MODE_SESSION_KEY);

    // ==========================================================
    // USB
    // ==========================================================

    if (storedMode === StorageMode.USB) {
      return StorageMode.USB;
    }

    // ==========================================================
    // CLOUD
    // ==========================================================

    if (storedMode === StorageMode.CLOUD) {
      return StorageMode.CLOUD;
    }

    // ==========================================================
    // LOCAL
    // ==========================================================
    //
    // Includes:
    //
    // - Explicit LOCAL
    // - Missing session value
    // - Unknown / legacy value
    //
    // ==========================================================

    return StorageMode.LOCAL;
  } catch {
    // ==========================================================
    // SAFE STARTUP DEFAULT
    // ==========================================================

    return StorageMode.LOCAL;
  }
}

// ============================================================
// BOOTSTRAP
// ============================================================

export async function initializeV2Storage(): Promise<StorageResult<void>> {
  try {
    // ==========================================================
    // RESTORE AUTHENTICATED STORAGE MODE
    // ==========================================================

    const storageMode = getAuthenticatedStorageMode();

    // ==========================================================
    // ACTIVATE STORAGE
    // ==========================================================
    //
    // selectStorageMode() owns:
    //
    // - Adapter initialization
    // - USB readiness validation
    // - Configuration update
    // - initialized state
    //
    // ==========================================================

    const result = await storageManager.selectStorageMode(storageMode);

    // ==========================================================
    // FAILURE
    // ==========================================================

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ?? `Unable to initialize FINORA ${storageMode} storage.`,
      };
    }

    // ==========================================================
    // SUCCESS
    // ==========================================================

    return {
      success: true,
    };
  } catch (error) {
    console.error("FINORA STORAGE BOOTSTRAP ERROR:", error);

    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to initialize FINORA storage.",
    };
  }
}

// ============================================================
// STORAGE READY CHECK
// ============================================================

export function isV2StorageInitialized(): boolean {
  return storageManager.isInitialized();
}

// ============================================================
// ACTIVE AUTHENTICATED STORAGE MODE
// ============================================================
//
// Useful for application-level diagnostics.
//
// This does not change storage.
// It only reports the mode resolved from the authenticated
// session.
//
// ============================================================

export function getV2AuthenticatedStorageMode(): StorageMode {
  return getAuthenticatedStorageMode();
}

// ============================================================
// END
// ============================================================
