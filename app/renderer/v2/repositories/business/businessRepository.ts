// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 BUSINESS DOMAIN
// BUSINESS REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist BusinessIdentity through StorageManager
// - Persist BusinessSettings through StorageManager
// - Keep Business domain models unchanged
// - Use businessId as the persistent identity for both
//   BusinessIdentity and BusinessSettings records
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
  BusinessIdentity,
} from "../../types/business/business.identity.types";

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

const BUSINESS_IDENTITY_ENTITY =
  "BUSINESS_IDENTITY";

const BUSINESS_SETTINGS_ENTITY =
  "BUSINESS_SETTINGS";

// ============================================================
// BUSINESS IDENTITY STORAGE RECORD
//
// StorageManager requires a stable top-level string ID.
//
// Business Identity domain code continues using:
//
// businessIdentity.businessId
//
// The top-level `id` exists only at the storage boundary.
// ============================================================

interface BusinessIdentityStorageRecord
  extends BusinessIdentity {

  id: string;
}

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
}

// ============================================================
// BUSINESS IDENTITY STORAGE RECORD BUILDER
// ============================================================

function toIdentityStorageRecord(
  identity: BusinessIdentity,
): BusinessIdentityStorageRecord {

  return {

    ...identity,

    id:
      identity.businessId,
  };
}

// ============================================================
// BUSINESS IDENTITY MAPPER
// ============================================================

function fromIdentityStorageRecord(
  record: BusinessIdentityStorageRecord,
): BusinessIdentity {

  const {
    id: _storageId,
    ...identity
  } = record;

  return identity;
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
    ...settings
  } = record;

  return settings;
}

// ============================================================
// BUSINESS IDENTITY QUERY BUILDER
// ============================================================

function buildBusinessIdentityQuery(
  businessId?: string,
): StorageQuery {

  return {

    entity:
      BUSINESS_IDENTITY_ENTITY,

    id:
      businessId,
  };
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
  // BUSINESS IDENTITY
  // ==========================================================

  // ==========================================================
  // FIND BUSINESS IDENTITY
  // ==========================================================

  async findIdentityByBusinessId(
    businessId: string,
  ): Promise<
    StorageResult<
      BusinessIdentity | undefined
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
        BusinessIdentityStorageRecord
      >(
        buildBusinessIdentityQuery(
          businessId,
        ),
      );

    if (!result.success) {

      return {

        success: false,

        error:
          result.error ??
          "Unable to load business identity.",
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
        fromIdentityStorageRecord(
          result.data,
        ),
    };
  }

  // ==========================================================
  // SAVE BUSINESS IDENTITY
  // ==========================================================

  async saveIdentity(
    identity: BusinessIdentity,
    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<BusinessIdentity>
  > {

    const businessId =
      identity.businessId;

    if (!businessId) {

      return {

        success: false,

        error:
          "Business ID is required before saving business identity.",
      };
    }

    const existing =
      await this.findIdentityByBusinessId(
        businessId,
      );

    if (
      existing.success &&
      existing.data
    ) {

      return {

        success: false,

        error:
          "Business identity already exists for this business.",
      };
    }

    if (!existing.success) {

      return {

        success: false,

        error:
          existing.error ??
          "Unable to verify existing business identity.",
      };
    }

    const storageRecord =
      toIdentityStorageRecord(
        identity,
      );

    const result =
      await storageManager.save<
        BusinessIdentityStorageRecord
      >(
        storageRecord,
        options,
      );

    if (!result.success) {

      return {

        success: false,

        error:
          result.error ??
          "Unable to save business identity.",
      };
    }

    return {

      success: true,

      data:
        identity,
    };
  }

  // ==========================================================
  // UPDATE BUSINESS IDENTITY
  // ==========================================================

  async updateIdentity(
    identity: BusinessIdentity,
    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<BusinessIdentity>
  > {

    const businessId =
      identity.businessId;

    if (!businessId) {

      return {

        success: false,

        error:
          "Business ID is required before updating business identity.",
      };
    }

    const storageRecord =
      toIdentityStorageRecord(
        identity,
      );

    const result =
      await storageManager.update<
        BusinessIdentityStorageRecord
      >(
        storageRecord,
        options,
      );

    if (!result.success) {

      return {

        success: false,

        error:
          result.error ??
          "Unable to update business identity.",
      };
    }

    return {

      success: true,

      data:
        identity,
    };
  }

  // ==========================================================
  // SAVE OR UPDATE BUSINESS IDENTITY
  //
  // Existing record:
  // UPDATE
  //
  // Missing record:
  // SAVE
  // ==========================================================

  async saveOrUpdateIdentity(
    identity: BusinessIdentity,
    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<BusinessIdentity>
  > {

    const businessId =
      identity.businessId;

    if (!businessId) {

      return {

        success: false,

        error:
          "Business ID is required before saving business identity.",
      };
    }

    const existing =
      await this.findIdentityByBusinessId(
        businessId,
      );

    if (!existing.success) {

      return {

        success: false,

        error:
          existing.error ??
          "Unable to verify business identity.",
      };
    }

    if (existing.data) {

      return this.updateIdentity(
        identity,
        options,
      );
    }

    return this.saveIdentity(
      identity,
      options,
    );
  }

  // ==========================================================
  // DELETE BUSINESS IDENTITY
  // ==========================================================

  async deleteIdentity(
    businessId: string,
  ): Promise<
    StorageResult<void>
  > {

    if (!businessId) {

      return {

        success: false,

        error:
          "Business ID is required before deleting business identity.",
      };
    }

    const result =
      await storageManager.delete(
        buildBusinessIdentityQuery(
          businessId,
        ),
      );

    if (!result.success) {

      return {

        success: false,

        error:
          result.error ??
          "Unable to delete business identity.",
      };
    }

    return {

      success: true,
    };
  }

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
