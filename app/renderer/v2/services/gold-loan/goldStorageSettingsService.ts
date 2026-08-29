// ============================================================
// FINORA ENTERPRISE OS™
//
// GOLD LOAN ENGINE™
// GOLD STORAGE SETTINGS SERVICE
//
// RESPONSIBILITY:
//
// - Resolve the active FINORA Business Context.
// - Load Gold Storage Settings for the active business.
// - Save / update Gold Storage Settings.
// - Keep repository identity resolution outside UI.
// - Stamp authoritative update metadata.
// - Validate structural Gold Storage configuration.
// - Keep physical occupancy/allocation logic separate.
//
// IMPORTANT:
//
// - No React.
// - No UI.
// - No localStorage.
// - No filesystem.
// - No Electron IPC.
// - No hardcoded Room / Locker / Rack counts.
// - No hardcoded Rack capacity.
// - No Gold custody allocation.
// - No occupancy calculations.
// - Business Context is the authoritative businessId source.
// - StorageManager already owns REAL / DEMO owner isolation.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import { goldStorageRepository } from "../../repositories/gold-loan/goldStorageRepository";

import { goldCustodyAllocationRepository } from "../../repositories/gold-loan/goldCustodyAllocationRepository";

import { requireBusinessContext } from "../business/businessContextService";

import type { StorageResult } from "../../storage/storage.types";

import type {
  GoldCustodyAllocation,
  GoldStorageSettings,
} from "../../types/gold-loan/goldStorage.types";

/* ============================================================
   VALIDATION RESULT
============================================================ */

export interface GoldStorageSettingsValidationError {
  field: string;

  message: string;
}

export interface GoldStorageSettingsValidationResult {
  valid: boolean;

  errors: GoldStorageSettingsValidationError[];
}

/* ============================================================
   NORMALIZE STRING
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
   VALIDATE ACTIVE CUSTODY AGAINST SETTINGS

   IMPORTANT:

   Historical RELEASED / RELOCATED allocations do not block
   Settings changes because their physical location snapshot is
   preserved inside the custody history itself.

   OCCUPIED allocations are authoritative live custody and their
   Room → Locker → Rack hierarchy must continue to exist.
============================================================ */

function validateActiveCustodyAgainstSettings(
  settings: GoldStorageSettings,
  allocations: GoldCustodyAllocation[],
): string | undefined {
  const roomsById = new Map(
    settings.rooms.map((room) => [normalizeString(room.id), room]),
  );

  const lockersById = new Map(
    settings.lockers.map((locker) => [normalizeString(locker.id), locker]),
  );

  const racksById = new Map(
    settings.racks.map((rack) => [normalizeString(rack.id), rack]),
  );

  const activeAllocations = allocations.filter(
    (allocation) => allocation.status === "OCCUPIED",
  );

  for (const allocation of activeAllocations) {
    const roomId = normalizeString(allocation.location.roomId);

    const lockerId = normalizeString(allocation.location.lockerId);

    const rackId = normalizeString(allocation.location.rackId);

    const loanNumber =
      normalizeString(allocation.loanNumber) ||
      normalizeString(allocation.loanId);

    /* --------------------------------------------------------
       ROOM MUST STILL EXIST
    -------------------------------------------------------- */

    if (!roomId || !roomsById.has(roomId)) {
      return `Cannot remove Gold Locker Room while active custody exists for Loan ${loanNumber}. Release or relocate the Gold bag first.`;
    }

    /* --------------------------------------------------------
       LOCKER MUST STILL EXIST IN SAME ROOM
    -------------------------------------------------------- */

    const locker = lockersById.get(lockerId);

    if (!locker || normalizeString(locker.roomId) !== roomId) {
      return `Cannot remove or move Gold Locker while active custody exists for Loan ${loanNumber}. Release or relocate the Gold bag first.`;
    }

    /* --------------------------------------------------------
       RACK MUST STILL EXIST IN SAME LOCKER
    -------------------------------------------------------- */

    const rack = racksById.get(rackId);

    if (!rack || normalizeString(rack.lockerId) !== lockerId) {
      return `Cannot remove or move Gold Rack while active custody exists for Loan ${loanNumber}. Release or relocate the Gold bag first.`;
    }
  }

  return undefined;
}

/* ============================================================
   VALIDATE SETTINGS AGAINST ACTIVE CUSTODY

   PURPOSE:

   UI may use this as a preflight before removing or re-parenting
   Room / Locker / Rack configuration.

   IMPORTANT:

   - This does NOT save Settings.
   - This does NOT mutate custody.
   - OCCUPIED allocations are authoritative.
   - RELEASED / RELOCATED history does not block changes.
============================================================ */

export async function validateGoldStorageSettingsCustodyIntegrity(
  settings: GoldStorageSettings,
): Promise<StorageResult<void>> {
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

  const allocationsResult =
    await goldCustodyAllocationRepository.findAllByBusinessId(businessId);

  if (!allocationsResult.success) {
    return {
      success: false,

      error:
        allocationsResult.error ??
        "Unable to verify active Gold custody against Storage Settings.",
    };
  }

  const custodyIntegrityError = validateActiveCustodyAgainstSettings(
    settings,

    allocationsResult.data ?? [],
  );

  if (custodyIntegrityError) {
    return {
      success: false,

      error: custodyIntegrityError,
    };
  }

  return {
    success: true,
  };
}

/* ============================================================
   VALIDATE SETTINGS
============================================================ */

export function validateGoldStorageSettings(
  settings: GoldStorageSettings,
): GoldStorageSettingsValidationResult {
  const errors: GoldStorageSettingsValidationError[] = [];

  /* ==========================================================
     UNIQUE ROOM IDS
  ========================================================== */

  const roomIds = new Set<string>();

  for (const room of settings.rooms) {
    const roomId = normalizeString(room.id);

    if (!roomId) {
      errors.push({
        field: "rooms.id",

        message: "Every Gold Locker Room requires a valid ID.",
      });

      continue;
    }

    if (roomIds.has(roomId)) {
      errors.push({
        field: `rooms.${roomId}`,

        message: "Gold Locker Room IDs must be unique.",
      });
    }

    roomIds.add(roomId);
  }

  /* ==========================================================
     UNIQUE LOCKER IDS + ROOM RELATIONSHIP
  ========================================================== */

  const lockerIds = new Set<string>();

  for (const locker of settings.lockers) {
    const lockerId = normalizeString(locker.id);

    const roomId = normalizeString(locker.roomId);

    if (!lockerId) {
      errors.push({
        field: "lockers.id",

        message: "Every Gold Locker requires a valid ID.",
      });

      continue;
    }

    if (lockerIds.has(lockerId)) {
      errors.push({
        field: `lockers.${lockerId}`,

        message: "Gold Locker IDs must be unique.",
      });
    }

    lockerIds.add(lockerId);

    if (!roomId || !roomIds.has(roomId)) {
      errors.push({
        field: `lockers.${lockerId}.roomId`,

        message: "Every Gold Locker must belong to a configured Locker Room.",
      });
    }

    if (
      !Number.isFinite(locker.defaultRackCapacity) ||
      locker.defaultRackCapacity <= 0
    ) {
      errors.push({
        field: `lockers.${lockerId}.defaultRackCapacity`,

        message: "Default Rack capacity must be greater than zero.",
      });
    }
  }

  /* ==========================================================
     UNIQUE RACK IDS + LOCKER RELATIONSHIP + CAPACITY
  ========================================================== */

  const rackIds = new Set<string>();

  for (const rack of settings.racks) {
    const rackId = normalizeString(rack.id);

    const lockerId = normalizeString(rack.lockerId);

    if (!rackId) {
      errors.push({
        field: "racks.id",

        message: "Every Gold Rack requires a valid ID.",
      });

      continue;
    }

    if (rackIds.has(rackId)) {
      errors.push({
        field: `racks.${rackId}`,

        message: "Gold Rack IDs must be unique.",
      });
    }

    rackIds.add(rackId);

    if (!lockerId || !lockerIds.has(lockerId)) {
      errors.push({
        field: `racks.${rackId}.lockerId`,

        message: "Every Gold Rack must belong to a configured Locker.",
      });
    }

    if (!Number.isFinite(rack.capacity) || rack.capacity <= 0) {
      errors.push({
        field: `racks.${rackId}.capacity`,

        message: "Gold Rack capacity must be greater than zero.",
      });
    }
  }

  return {
    valid: errors.length === 0,

    errors,
  };
}

/* ============================================================
   LOAD ACTIVE BUSINESS SETTINGS
============================================================ */

export async function loadGoldStorageSettings(): Promise<
  StorageResult<GoldStorageSettings | undefined>
> {
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

  return goldStorageRepository.findByBusinessId(businessId);
}

/* ============================================================
   SAVE OR UPDATE ACTIVE BUSINESS SETTINGS
============================================================ */

export async function saveGoldStorageSettings(
  settings: GoldStorageSettings,

  updatedBy: string,
): Promise<StorageResult<GoldStorageSettings>> {
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
     STRUCTURAL VALIDATION
  ========================================================== */

  const validation = validateGoldStorageSettings(settings);

  if (!validation.valid) {
    return {
      success: false,

      error:
        validation.errors[0]?.message ??
        "Gold Storage Settings validation failed.",
    };
  }

  /* ==========================================================
   ACTIVE PHYSICAL CUSTODY INTEGRITY

   Settings may not remove or re-parent Room / Locker / Rack
   geometry currently holding an OCCUPIED Gold bag.
========================================================== */

  const allocationsResult =
    await goldCustodyAllocationRepository.findAllByBusinessId(businessId);

  if (!allocationsResult.success) {
    return {
      success: false,

      error:
        allocationsResult.error ??
        "Unable to verify active Gold custody before saving Storage Settings.",
    };
  }

  const custodyIntegrityError = validateActiveCustodyAgainstSettings(
    settings,
    allocationsResult.data ?? [],
  );

  if (custodyIntegrityError) {
    return {
      success: false,

      error: custodyIntegrityError,
    };
  }

  /* ==========================================================
     AUDIT METADATA
  ========================================================== */

  const normalizedUpdatedBy = normalizeString(updatedBy);

  if (!normalizedUpdatedBy) {
    return {
      success: false,

      error: "Updated By is required before saving Gold Storage Settings.",
    };
  }

  const preparedSettings: GoldStorageSettings = {
    ...settings,

    updatedAt: new Date().toISOString(),

    updatedBy: normalizedUpdatedBy,
  };

  return goldStorageRepository.saveOrUpdate(
    businessId,

    preparedSettings,
  );
}

/* ============================================================
   DELETE ACTIVE BUSINESS SETTINGS
============================================================ */

export async function deleteGoldStorageSettings(): Promise<
  StorageResult<void>
> {
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
   BLOCK DELETE WHILE ACTIVE GOLD CUSTODY EXISTS
========================================================== */

  const allocationsResult =
    await goldCustodyAllocationRepository.findAllByBusinessId(businessId);

  if (!allocationsResult.success) {
    return {
      success: false,

      error:
        allocationsResult.error ??
        "Unable to verify active Gold custody before deleting Storage Settings.",
    };
  }

  const activeAllocation = (allocationsResult.data ?? []).find(
    (allocation) => allocation.status === "OCCUPIED",
  );

  if (activeAllocation) {
    const loanNumber =
      normalizeString(activeAllocation.loanNumber) ||
      normalizeString(activeAllocation.loanId);

    return {
      success: false,

      error: `Gold Storage Settings cannot be deleted while active custody exists for Loan ${loanNumber}. Release or relocate all occupied Gold bags first.`,
    };
  }

  return goldStorageRepository.delete(businessId);
}

/* ============================================================
   EMPTY SETTINGS FACTORY

   IMPORTANT:

   This creates an EMPTY configuration only.

   It does NOT invent:
   - rooms
   - lockers
   - racks
   - capacities
============================================================ */

export function createEmptyGoldStorageSettings(
  updatedBy: string,
): GoldStorageSettings {
  return {
    rooms: [],

    lockers: [],

    racks: [],

    updatedAt: new Date().toISOString(),

    updatedBy: normalizeString(updatedBy),
  };
}

/* ============================================================
   SINGLETON-LIKE API
============================================================ */

export const goldStorageSettingsService = {
  load: loadGoldStorageSettings,

  save: saveGoldStorageSettings,

  delete: deleteGoldStorageSettings,

  validate: validateGoldStorageSettings,

  validateCustodyIntegrity: validateGoldStorageSettingsCustodyIntegrity,

  createEmpty: createEmptyGoldStorageSettings,
};

/* ============================================================
   END
============================================================ */
