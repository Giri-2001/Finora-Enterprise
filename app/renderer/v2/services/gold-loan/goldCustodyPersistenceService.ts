// ============================================================
// FINORA ENTERPRISE OS™
//
// GOLD LOAN ENGINE™
// GOLD CUSTODY PERSISTENCE SERVICE
//
// RESPONSIBILITY:
//
// - Hydrate authoritative Gold Storage state from persistence.
// - Combine:
//     Gold Storage Settings
//     Gold Custody Allocations
//     Gold Relocation Audits
// - Execute existing Gold Storage domain mutations.
// - Persist successful custody allocation mutations.
// - Persist successful custody release mutations.
// - Keep UI independent from repositories.
// - Keep physical capacity rules inside goldStorageService.
//
// IMPORTANT:
//
// - No React.
// - No UI.
// - No localStorage.
// - No filesystem.
// - No Electron IPC.
// - No duplicated rack-capacity calculations.
// - No duplicated hierarchy validation.
// - Existing goldStorageService remains the domain authority.
// - Repository writes occur only after domain validation succeeds.
// - Relocation persistence is intentionally handled separately
//   because relocation requires multiple coordinated writes.
//
// VERSION : 1.0
// STATUS  : Allocation + Release Persistence Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type {
  GoldCustodyAllocation,
  GoldStorageAllocationRequest,
  GoldStorageReleaseRequest,
  GoldStorageRelocationAudit,
  GoldStorageRelocationRequest,
} from "../../types/gold-loan/goldStorage.types";

import {
  allocateGoldStorage,
  buildGoldStorageRoomViews,
  releaseGoldStorage,
  relocateGoldStorage,
} from "./goldStorageService";

import type { GoldStorageState } from "./goldStorageService";

import {
  createEmptyGoldStorageSettings,
  loadGoldStorageSettings,
} from "./goldStorageSettingsService";

import { goldCustodyAllocationRepository } from "../../repositories/gold-loan/goldCustodyAllocationRepository";

import { goldStorageRelocationAuditRepository } from "../../repositories/gold-loan/goldStorageRelocationAuditRepository";

import { requireBusinessContext } from "../business/businessContextService";

/* ============================================================
   RESULT CONTRACTS
============================================================ */

export interface GoldCustodyStateLoadResult {
  success: boolean;

  state?: GoldStorageState;

  error?: string;
}

export interface GoldCustodyAllocationPersistenceResult {
  success: boolean;

  state?: GoldStorageState;

  allocation?: GoldCustodyAllocation;

  error?: string;
}

export interface GoldCustodyReleasePersistenceResult {
  success: boolean;

  state?: GoldStorageState;

  allocation?: GoldCustodyAllocation;

  error?: string;
}

export interface GoldCustodyRelocationPersistenceResult {
  success: boolean;

  state?: GoldStorageState;

  previousAllocation?: GoldCustodyAllocation;

  activeAllocation?: GoldCustodyAllocation;

  audit?: GoldStorageRelocationAudit;

  error?: string;
}

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeString(value: string): string {
  return String(value ?? "").trim();
}

/* ============================================================
   ACTIVE BUSINESS ID
============================================================ */

function getActiveBusinessId(): string {
  const context = requireBusinessContext();

  const businessId = normalizeString(context.businessId ?? "");

  if (!businessId) {
    throw new Error("Active FINORA Business ID is unavailable.");
  }

  return businessId;
}

/* ============================================================
   EMPTY TRANSIENT STATE

   IMPORTANT:

   This does NOT persist any physical geometry.

   It only provides a safe in-memory state when Gold Storage
   Settings have not yet been configured.
============================================================ */

function createTransientEmptyState(): GoldStorageState {
  return {
    settings: createEmptyGoldStorageSettings("SYSTEM"),

    allocations: [],

    relocationAudits: [],
  };
}

/* ============================================================
   LOAD AUTHORITATIVE PERSISTED STATE
============================================================ */

export async function loadPersistedGoldStorageState(): Promise<GoldCustodyStateLoadResult> {
  let businessId: string;

  try {
    businessId = getActiveBusinessId();
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to resolve active FINORA Business Context.",
    };
  }

  /* ==========================================================
     SETTINGS
  ========================================================== */

  const settingsResult = await loadGoldStorageSettings();

  if (!settingsResult.success) {
    return {
      success: false,

      error: settingsResult.error ?? "Unable to load Gold Storage Settings.",
    };
  }

  /* ==========================================================
     ALLOCATIONS
  ========================================================== */

  const allocationsResult =
    await goldCustodyAllocationRepository.findAllByBusinessId(businessId);

  if (!allocationsResult.success) {
    return {
      success: false,

      error:
        allocationsResult.error ?? "Unable to load Gold custody allocations.",
    };
  }

  /* ==========================================================
     RELOCATION AUDITS
  ========================================================== */

  const relocationAuditsResult =
    await goldStorageRelocationAuditRepository.findAllByBusinessId(businessId);

  if (!relocationAuditsResult.success) {
    return {
      success: false,

      error:
        relocationAuditsResult.error ??
        "Unable to load Gold relocation audits.",
    };
  }

  /* ==========================================================
     NO SETTINGS CONFIGURED

     Existing custody records should never normally exist
     without settings. However, do not invent geometry here.
  ========================================================== */

  if (!settingsResult.data) {
    const emptyState = createTransientEmptyState();

    return {
      success: true,

      state: {
        ...emptyState,

        allocations: allocationsResult.data ?? [],

        relocationAudits: relocationAuditsResult.data ?? [],
      },
    };
  }

  /* ==========================================================
     AUTHORITATIVE STATE
  ========================================================== */

  return {
    success: true,

    state: {
      settings: settingsResult.data,

      allocations: allocationsResult.data ?? [],

      relocationAudits: relocationAuditsResult.data ?? [],
    },
  };
}

/* ============================================================
   ALLOCATE + PERSIST
============================================================ */

export async function allocatePersistedGoldStorage(
  request: GoldStorageAllocationRequest,
): Promise<GoldCustodyAllocationPersistenceResult> {
  let businessId: string;

  try {
    businessId = getActiveBusinessId();
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to resolve active FINORA Business Context.",
    };
  }

  /* ==========================================================
     LOAD FRESH STATE

     This is intentional.

     Capacity and active-allocation validation must execute
     against the latest persisted state immediately before save.
  ========================================================== */

  const loadResult = await loadPersistedGoldStorageState();

  if (!loadResult.success || !loadResult.state) {
    return {
      success: false,

      error:
        loadResult.error ?? "Unable to load Gold Storage before allocation.",
    };
  }

  const currentState = loadResult.state;

  /* ==========================================================
     DOMAIN MUTATION
  ========================================================== */

  const mutation = allocateGoldStorage(
    currentState,

    request,
  );

  if (!mutation.success || !mutation.allocation) {
    return {
      success: false,

      state: currentState,

      error: mutation.error ?? "Unable to allocate Gold custody.",
    };
  }

  /* ==========================================================
     PERSIST NEW ALLOCATION
  ========================================================== */

  const saveResult = await goldCustodyAllocationRepository.save(
    businessId,

    mutation.allocation,
  );

  if (!saveResult.success) {
    /*
     * Domain mutation was pure and in-memory only.
     *
     * Persistence failed, therefore return the original
     * persisted state rather than the hypothetical next state.
     */
    return {
      success: false,

      state: currentState,

      error: saveResult.error ?? "Unable to persist Gold custody allocation.",
    };
  }

  return {
    success: true,

    state: mutation.state,

    allocation: mutation.allocation,
  };
}

/* ============================================================
   RELEASE + PERSIST
============================================================ */

export async function releasePersistedGoldStorage(
  request: GoldStorageReleaseRequest,
): Promise<GoldCustodyReleasePersistenceResult> {
  let businessId: string;

  try {
    businessId = getActiveBusinessId();
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to resolve active FINORA Business Context.",
    };
  }

  /* ==========================================================
     LOAD FRESH STATE
  ========================================================== */

  const loadResult = await loadPersistedGoldStorageState();

  if (!loadResult.success || !loadResult.state) {
    return {
      success: false,

      error: loadResult.error ?? "Unable to load Gold Storage before release.",
    };
  }

  const currentState = loadResult.state;

  /* ==========================================================
     DOMAIN MUTATION
  ========================================================== */

  const mutation = releaseGoldStorage(
    currentState,

    request,
  );

  if (!mutation.success || !mutation.allocation) {
    return {
      success: false,

      state: currentState,

      error: mutation.error ?? "Unable to release Gold custody.",
    };
  }

  /* ==========================================================
     PERSIST STATUS TRANSITION

     OCCUPIED
        ↓
     RELEASED

     Same allocation ID is preserved.
  ========================================================== */

  const updateResult = await goldCustodyAllocationRepository.update(
    businessId,

    mutation.allocation,
  );

  if (!updateResult.success) {
    return {
      success: false,

      state: currentState,

      error: updateResult.error ?? "Unable to persist Gold custody release.",
    };
  }

  return {
    success: true,

    state: mutation.state,

    allocation: mutation.allocation,
  };
}

/* ============================================================
   RELOCATE + PERSIST

   PERSISTENCE STRATEGY:

   1. Load latest authoritative persisted state.
   2. Execute pure domain relocation.
   3. Replace allocation snapshot in one entity-level write:
        old allocation → RELOCATED
        new allocation → OCCUPIED
   4. Append immutable relocation audit.
   5. If audit persistence fails:
        restore previous allocation snapshot.

   IMPORTANT:

   StorageManager currently has no true multi-entity
   transaction.

   Therefore allocation replacement + audit append cannot be
   guaranteed as one physical atomic transaction.

   Compensation rollback restores the allocation snapshot if
   the audit append fails.
============================================================ */

export async function relocatePersistedGoldStorage(
  request: GoldStorageRelocationRequest,
): Promise<GoldCustodyRelocationPersistenceResult> {
  let businessId: string;

  try {
    businessId = getActiveBusinessId();
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to resolve active FINORA Business Context.",
    };
  }

  /* ==========================================================
     LOAD FRESH AUTHORITATIVE STATE
  ========================================================== */

  const loadResult = await loadPersistedGoldStorageState();

  if (!loadResult.success || !loadResult.state) {
    return {
      success: false,

      error:
        loadResult.error ?? "Unable to load Gold Storage before relocation.",
    };
  }

  const currentState = loadResult.state;

  /* ==========================================================
     DOMAIN MUTATION

     Existing goldStorageService remains authoritative for:

     - source allocation validation
     - current-location validation
     - target hierarchy validation
     - target capacity validation
     - bag allocation
     - RELOCATED transition
     - OCCUPIED replacement allocation
     - relocation audit generation
  ========================================================== */

  const mutation = relocateGoldStorage(
    currentState,

    request,
  );

  if (
    !mutation.success ||
    !mutation.previousAllocation ||
    !mutation.activeAllocation ||
    !mutation.audit
  ) {
    return {
      success: false,

      state: currentState,

      error: mutation.error ?? "Unable to relocate Gold custody.",
    };
  }

  /* ==========================================================
     PERSIST ALLOCATION SNAPSHOT

     Both allocation transitions are persisted together:

     source:
       OCCUPIED → RELOCATED

     target:
       new allocation → OCCUPIED
  ========================================================== */

  const allocationReplaceResult =
    await goldCustodyAllocationRepository.replaceBusinessSnapshot(
      businessId,

      mutation.state.allocations,
    );

  if (!allocationReplaceResult.success) {
    return {
      success: false,

      state: currentState,

      error:
        allocationReplaceResult.error ??
        "Unable to persist Gold custody relocation.",
    };
  }

  /* ==========================================================
     PERSIST IMMUTABLE RELOCATION AUDIT
  ========================================================== */

  const auditSaveResult = await goldStorageRelocationAuditRepository.save(
    businessId,

    mutation.audit,
  );

  if (!auditSaveResult.success) {
    /* ========================================================
       COMPENSATION ROLLBACK

       Allocation replacement succeeded but audit append failed.

       Restore the exact allocation snapshot loaded before the
       relocation mutation.

       No relocation audit was persisted, therefore returning
       to currentState restores the logical pre-relocation state.
    ======================================================== */

    const rollbackResult =
      await goldCustodyAllocationRepository.replaceBusinessSnapshot(
        businessId,

        currentState.allocations,
      );

    if (!rollbackResult.success) {
      /*
       * CRITICAL:
       *
       * Allocation relocation was persisted.
       * Audit persistence failed.
       * Allocation rollback also failed.
       *
       * We cannot claim that persistence returned to the old
       * state. Surface a hard consistency error instead.
       */
      return {
        success: false,

        state: mutation.state,

        previousAllocation: mutation.previousAllocation,

        activeAllocation: mutation.activeAllocation,

        error:
          "CRITICAL GOLD CUSTODY CONSISTENCY ERROR: relocation allocations were persisted, relocation audit failed, and automatic allocation rollback also failed. Reload custody data before performing another Gold Storage operation.",
      };
    }

    return {
      success: false,

      state: currentState,

      error:
        auditSaveResult.error ??
        "Unable to persist Gold relocation audit. Custody allocation changes were rolled back.",
    };
  }

  /* ==========================================================
     SUCCESS
  ========================================================== */

  return {
    success: true,

    state: mutation.state,

    previousAllocation: mutation.previousAllocation,

    activeAllocation: mutation.activeAllocation,

    audit: mutation.audit,
  };
}

/* ============================================================
   DERIVED ROOM VIEW HELPER
============================================================ */

export function buildPersistedGoldStorageRoomViews(state: GoldStorageState) {
  return buildGoldStorageRoomViews(
    state.settings,

    state.allocations,
  );
}

/* ============================================================
   SERVICE API
============================================================ */

export const goldCustodyPersistenceService = {
  load: loadPersistedGoldStorageState,

  allocate: allocatePersistedGoldStorage,

  release: releasePersistedGoldStorage,

  relocate: relocatePersistedGoldStorage,

  buildRoomViews: buildPersistedGoldStorageRoomViews,
};

/* ============================================================
   END
============================================================ */
