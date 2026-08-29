// ============================================================
// FINORA ENTERPRISE OS™
//
// GOLD LOAN ENGINE™
// GOLD STORAGE REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist Gold Storage Settings through StorageManager.
// - Keep Gold Storage domain contracts storage-independent.
// - Use businessId as the stable persisted record identity.
// - Use a dedicated GOLD_STORAGE_SETTINGS entity namespace.
// - Support the active FINORA LOCAL / USB / future CLOUD mode.
// - Preserve REAL / DEMO owner isolation through StorageManager.
//
// IMPORTANT:
//
// - No localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - No React.
// - No UI logic.
// - No Gold occupancy calculations.
// - No allocation logic.
// - No hardcoded Locker Room geometry.
// - Storage access goes only through StorageManager.
//
// STORAGE BOUNDARY:
//
// GoldStorageSettings
//        ↓
// GoldStorageSettingsStorageRecord
//        ↓
// StorageManager
//        ↓
// LOCAL / USB / CLOUD
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type { GoldStorageSettings } from "../../types/gold-loan/goldStorage.types";

import { storageManager } from "../../storage/storageManager";

import type { StorageQuery, StorageResult } from "../../storage/storage.types";

import type { RepositoryWriteOptions } from "../repository.types";

/* ============================================================
   ENTITY
============================================================ */

export const GOLD_STORAGE_SETTINGS_ENTITY = "GOLD_STORAGE_SETTINGS";

/* ============================================================
   STORAGE RECORD

   GoldStorageSettings deliberately does not contain:

   - id
   - entity
   - businessId

   Those values belong only to the persistence boundary.

   `entity` is explicit because:

   LOCAL:
     localStorage.adapter.ts resolves this marker.

   USB:
     Electron main process requires record.entity.

   CLOUD:
     Future backend can use the same stable entity name.
============================================================ */

interface GoldStorageSettingsStorageRecord extends GoldStorageSettings {
  id: string;

  entity: typeof GOLD_STORAGE_SETTINGS_ENTITY;

  businessId: string;
}

/* ============================================================
   STORAGE RECORD BUILDER
============================================================ */

function toGoldStorageSettingsStorageRecord(
  businessId: string,
  settings: GoldStorageSettings,
): GoldStorageSettingsStorageRecord {
  return {
    ...settings,

    id: businessId,

    entity: GOLD_STORAGE_SETTINGS_ENTITY,

    businessId,
  };
}

/* ============================================================
   DOMAIN MAPPER
============================================================ */

function fromGoldStorageSettingsStorageRecord(
  record: GoldStorageSettingsStorageRecord,
): GoldStorageSettings {
  const {
    id: _storageId,

    entity: _storageEntity,

    businessId: _businessId,

    ...settings
  } = record;

  return settings;
}

/* ============================================================
   QUERY BUILDER
============================================================ */

function buildGoldStorageSettingsQuery(businessId?: string): StorageQuery {
  return {
    entity: GOLD_STORAGE_SETTINGS_ENTITY,

    id: businessId,
  };
}

/* ============================================================
   BUSINESS ID NORMALIZATION
============================================================ */

function normalizeBusinessId(businessId: string): string {
  return String(businessId ?? "").trim();
}

/* ============================================================
   GOLD STORAGE REPOSITORY
============================================================ */

export class GoldStorageRepository {
  /* ==========================================================
     FIND SETTINGS BY BUSINESS ID
  ========================================================== */

  async findByBusinessId(
    businessId: string,
  ): Promise<StorageResult<GoldStorageSettings | undefined>> {
    const normalizedBusinessId = normalizeBusinessId(businessId);

    if (!normalizedBusinessId) {
      return {
        success: false,

        error: "Business ID is required to load Gold Storage settings.",
      };
    }

    const result = await storageManager.get<GoldStorageSettingsStorageRecord>(
      buildGoldStorageSettingsQuery(normalizedBusinessId),
    );

    if (!result.success) {
      return {
        success: false,

        error: result.error ?? "Unable to load Gold Storage settings.",
      };
    }

    if (!result.data) {
      return {
        success: true,

        data: undefined,
      };
    }

    return {
      success: true,

      data: fromGoldStorageSettingsStorageRecord(result.data),
    };
  }

  /* ==========================================================
     SAVE SETTINGS
  ========================================================== */

  async save(
    businessId: string,
    settings: GoldStorageSettings,
    options?: RepositoryWriteOptions,
  ): Promise<StorageResult<GoldStorageSettings>> {
    const normalizedBusinessId = normalizeBusinessId(businessId);

    if (!normalizedBusinessId) {
      return {
        success: false,

        error: "Business ID is required before saving Gold Storage settings.",
      };
    }

    const existing = await this.findByBusinessId(normalizedBusinessId);

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ?? "Unable to verify existing Gold Storage settings.",
      };
    }

    if (existing.data) {
      return {
        success: false,

        error: "Gold Storage settings already exist for this business.",
      };
    }

    const storageRecord = toGoldStorageSettingsStorageRecord(
      normalizedBusinessId,

      settings,
    );

    const result = await storageManager.save<GoldStorageSettingsStorageRecord>(
      storageRecord,

      options,
    );

    if (!result.success) {
      return {
        success: false,

        error: result.error ?? "Unable to save Gold Storage settings.",
      };
    }

    return {
      success: true,

      data: settings,
    };
  }

  /* ==========================================================
     UPDATE SETTINGS
  ========================================================== */

  async update(
    businessId: string,
    settings: GoldStorageSettings,
    options?: RepositoryWriteOptions,
  ): Promise<StorageResult<GoldStorageSettings>> {
    const normalizedBusinessId = normalizeBusinessId(businessId);

    if (!normalizedBusinessId) {
      return {
        success: false,

        error: "Business ID is required before updating Gold Storage settings.",
      };
    }

    const storageRecord = toGoldStorageSettingsStorageRecord(
      normalizedBusinessId,

      settings,
    );

    const result =
      await storageManager.update<GoldStorageSettingsStorageRecord>(
        storageRecord,

        options,
      );

    if (!result.success) {
      return {
        success: false,

        error: result.error ?? "Unable to update Gold Storage settings.",
      };
    }

    return {
      success: true,

      data: settings,
    };
  }

  /* ==========================================================
     SAVE OR UPDATE SETTINGS
  ========================================================== */

  async saveOrUpdate(
    businessId: string,
    settings: GoldStorageSettings,
    options?: RepositoryWriteOptions,
  ): Promise<StorageResult<GoldStorageSettings>> {
    const normalizedBusinessId = normalizeBusinessId(businessId);

    if (!normalizedBusinessId) {
      return {
        success: false,

        error: "Business ID is required before saving Gold Storage settings.",
      };
    }

    const existing = await this.findByBusinessId(normalizedBusinessId);

    if (!existing.success) {
      return {
        success: false,

        error: existing.error ?? "Unable to verify Gold Storage settings.",
      };
    }

    if (existing.data) {
      return this.update(
        normalizedBusinessId,

        settings,

        options,
      );
    }

    return this.save(
      normalizedBusinessId,

      settings,

      options,
    );
  }

  /* ==========================================================
     DELETE SETTINGS
  ========================================================== */

  async delete(businessId: string): Promise<StorageResult<void>> {
    const normalizedBusinessId = normalizeBusinessId(businessId);

    if (!normalizedBusinessId) {
      return {
        success: false,

        error: "Business ID is required before deleting Gold Storage settings.",
      };
    }

    const result = await storageManager.delete(
      buildGoldStorageSettingsQuery(normalizedBusinessId),
    );

    if (!result.success) {
      return {
        success: false,

        error: result.error ?? "Unable to delete Gold Storage settings.",
      };
    }

    return {
      success: true,
    };
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const goldStorageRepository = new GoldStorageRepository();

/* ============================================================
   END
============================================================ */
