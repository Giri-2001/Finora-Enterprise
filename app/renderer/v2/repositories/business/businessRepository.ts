// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 BUSINESS DOMAIN
// BUSINESS REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist BusinessSettings through StorageManager
// - Keep Business domain models unchanged
// - Use businessId as the persistent identity for BusinessSettings records
// - Keep physical storage implementation outside Business domain
// - Prepare Business domain persistence for LOCAL / USB / CLOUD
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No direct filesystem access.
// - No Electron IPC.
// - No UI logic.
// - No authentication logic.
// - No business calculations.
// - Storage access goes only through StorageManager.
//
// VERSION : 2.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================


import type {
  BusinessSettings,
} from "../../types/business/business.settings.types";

import {
  storageManager,
} from "../../storage/storageManager";

import type {
  StorageQuery,
  StorageResult,
} from "../../storage/storage.types";

import type {
  RepositoryWriteOptions,
} from "../repository.types";

// ============================================================
// CONSTANTS
// ============================================================


const BUSINESS_SETTINGS_ENTITY =
  "BUSINESS_SETTINGS";

// ============================================================
// BUSINESS SETTINGS STORAGE RECORD
//
// StorageManager requires a stable top-level string ID.
//
// Business Settings domain code continues using:
//
// businessSettings.businessId
//
// The top-level `id` exists only at the storage boundary.
// ============================================================

interface BusinessSettingsStorageRecord
  extends BusinessSettings {

  id: string;

  entity: typeof BUSINESS_SETTINGS_ENTITY;
}

// ============================================================
// BUSINESS SETTINGS STORAGE RECORD BUILDER
// ============================================================

function toSettingsStorageRecord(
  settings: BusinessSettings,
): BusinessSettingsStorageRecord {

  return {

    ...settings,

    id:
      settings.businessId,

    entity:
      BUSINESS_SETTINGS_ENTITY,
  };
}

// ============================================================
// BUSINESS SETTINGS MAPPER
// ============================================================

function fromSettingsStorageRecord(
  record: BusinessSettingsStorageRecord,
): BusinessSettings {

  const {
    id: _storageId,

    entity: _storageEntity,

    ...settings
  } = record;

  return settings;
}

// ============================================================
// BUSINESS SETTINGS QUERY BUILDER
// ============================================================

function buildBusinessSettingsQuery(
  businessId?: string,
): StorageQuery {

  return {

    entity:
      BUSINESS_SETTINGS_ENTITY,

    id:
      businessId,
  };
}

// ============================================================
// BUSINESS REPOSITORY
// ============================================================

export class BusinessRepository {

  // ==========================================================
  // BUSINESS SETTINGS
  // ==========================================================

  // ==========================================================
  // FIND BY BUSINESS ID
  // ==========================================================

  async findByBusinessId(
    businessId: string,
  ): Promise<
    StorageResult<
      BusinessSettings | undefined
    >
  > {

    if (!businessId) {

      return {

        success: false,

        error:
          "Business ID is required.",
      };
    }

    const result =
      await storageManager.get<
        BusinessSettingsStorageRecord
      >(
        buildBusinessSettingsQuery(
          businessId,
        ),
      );

    if (!result.success) {

      return {

        success: false,

        error:
          result.error ??
          "Unable to load business settings.",
      };
    }

    if (!result.data) {

      return {

        success: true,

        data:
          undefined,
      };
    }

    return {

      success: true,

      data:
        fromSettingsStorageRecord(
          result.data,
        ),
    };
  }

  // ==========================================================
  // SAVE BUSINESS SETTINGS
  // ==========================================================

  async save(
    settings: BusinessSettings,
    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<BusinessSettings>
  > {

    const businessId =
      settings.businessId;

    if (!businessId) {

      return {

        success: false,

        error:
          "Business ID is required before saving business settings.",
      };
    }

    const existing =
      await this.findByBusinessId(
        businessId,
      );

    if (
      existing.success &&
      existing.data
    ) {

      return {

        success: false,

        error:
          "Business settings already exist for this business.",
      };
    }

    if (!existing.success) {

      return {

        success: false,

        error:
          existing.error ??
          "Unable to verify existing business settings.",
      };
    }

    const storageRecord =
      toSettingsStorageRecord(
        settings,
      );

    const result =
      await storageManager.save<
        BusinessSettingsStorageRecord
      >(
        storageRecord,
        options,
      );

    if (!result.success) {

      return {

        success: false,

        error:
          result.error ??
          "Unable to save business settings.",
      };
    }

    return {

      success: true,

      data:
        settings,
    };
  }

  // ==========================================================
  // UPDATE BUSINESS SETTINGS
  // ==========================================================

  async update(
    settings: BusinessSettings,
    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<BusinessSettings>
  > {

    const businessId =
      settings.businessId;

    if (!businessId) {

      return {

        success: false,

        error:
          "Business ID is required before updating business settings.",
      };
    }

    const storageRecord =
      toSettingsStorageRecord(
        settings,
      );

    const result =
      await storageManager.update<
        BusinessSettingsStorageRecord
      >(
        storageRecord,
        options,
      );

    if (!result.success) {

      return {

        success: false,

        error:
          result.error ??
          "Unable to update business settings.",
      };
    }

    return {

      success: true,

      data:
        settings,
    };
  }

  // ==========================================================
  // SAVE OR UPDATE BUSINESS SETTINGS
  //
  // Existing record:
  // UPDATE
  //
  // Missing record:
  // SAVE
  // ==========================================================

  async saveOrUpdate(
    settings: BusinessSettings,
    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<BusinessSettings>
  > {

    const businessId =
      settings.businessId;

    if (!businessId) {

      return {

        success: false,

        error:
          "Business ID is required before saving business settings.",
      };
    }

    const existing =
      await this.findByBusinessId(
        businessId,
      );

    if (!existing.success) {

      return {

        success: false,

        error:
          existing.error ??
          "Unable to verify business settings.",
      };
    }

    if (existing.data) {

      return this.update(
        settings,
        options,
      );
    }

    return this.save(
      settings,
      options,
    );
  }

  // ==========================================================
  // DELETE BUSINESS SETTINGS
  // ==========================================================

  async delete(
    businessId: string,
  ): Promise<
    StorageResult<void>
  > {

    if (!businessId) {

      return {

        success: false,

        error:
          "Business ID is required before deleting business settings.",
      };
    }

    const result =
      await storageManager.delete(
        buildBusinessSettingsQuery(
          businessId,
        ),
      );

    if (!result.success) {

      return {

        success: false,

        error:
          result.error ??
          "Unable to delete business settings.",
      };
    }

    return {

      success: true,
    };
  }
}

// ============================================================
// SINGLETON
// ============================================================

export const businessRepository =
  new BusinessRepository();

// ============================================================
// END
// ============================================================
