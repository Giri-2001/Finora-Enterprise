// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 BUSINESS DOMAIN
// BRANCH SETTINGS REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist BranchSettings through StorageManager
// - Use explicit BRANCH_SETTINGS entity routing
// - Scope records by businessId + branchId
// - Keep storage-only id/entity fields outside the domain model
// - Support FINORA LOCAL / USB storage
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No direct filesystem access.
// - No Electron IPC.
// - No UI logic.
// - No authentication logic.
// - Storage access goes only through StorageManager.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  BranchSettings,
} from "../../types/business/branch.settings.types";

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
// ENTITY
// ============================================================

export const BRANCH_SETTINGS_ENTITY =
  "BRANCH_SETTINGS";

// ============================================================
// STORAGE RECORD
// ============================================================

interface BranchSettingsStorageRecord
  extends BranchSettings {

  id: string;

  entity:
    typeof BRANCH_SETTINGS_ENTITY;
}

// ============================================================
// STORAGE ID
// ============================================================

function buildBranchSettingsId(
  businessId: string,
  branchId: string,
): string {

  return [
    businessId.trim(),
    branchId.trim(),
  ].join("::");
}

// ============================================================
// STORAGE RECORD BUILDER
// ============================================================

function toStorageRecord(
  settings: BranchSettings,
): BranchSettingsStorageRecord {

  return {
    ...settings,

    id:
      buildBranchSettingsId(
        settings.businessId,
        settings.branchId,
      ),

    entity:
      BRANCH_SETTINGS_ENTITY,
  };
}

// ============================================================
// DOMAIN MAPPER
// ============================================================

function fromStorageRecord(
  record: BranchSettingsStorageRecord,
): BranchSettings {

  const {
    id: _storageId,

    entity: _storageEntity,

    ...settings
  } = record;

  return settings;
}

// ============================================================
// QUERY BUILDER
// ============================================================

function buildBranchSettingsQuery(
  businessId: string,
  branchId: string,
): StorageQuery {

  return {
    entity:
      BRANCH_SETTINGS_ENTITY,

    id:
      buildBranchSettingsId(
        businessId,
        branchId,
      ),
  };
}

// ============================================================
// VALIDATION
// ============================================================

function validateIdentity(
  businessId: string,
  branchId: string,
): string | null {

  if (!businessId?.trim()) {
    return "Business ID is required.";
  }

  if (!branchId?.trim()) {
    return "Branch ID is required.";
  }

  return null;
}

// ============================================================
// REPOSITORY
// ============================================================

export class BranchSettingsRepository {

  // ==========================================================
  // FIND
  // ==========================================================

  async findByBranch(
    businessId: string,
    branchId: string,
  ): Promise<
    StorageResult<
      BranchSettings | undefined
    >
  > {

    const validationError =
      validateIdentity(
        businessId,
        branchId,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const result =
      await storageManager.get<
        BranchSettingsStorageRecord
      >(
        buildBranchSettingsQuery(
          businessId,
          branchId,
        ),
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to load branch settings.",
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

      data:
        fromStorageRecord(
          result.data,
        ),
    };
  }

  // ==========================================================
  // SAVE
  // ==========================================================

  async save(
    settings: BranchSettings,
    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<BranchSettings>
  > {

    const validationError =
      validateIdentity(
        settings.businessId,
        settings.branchId,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const existing =
      await this.findByBranch(
        settings.businessId,
        settings.branchId,
      );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ??
          "Unable to verify existing branch settings.",
      };
    }

    if (existing.data) {
      return {
        success: false,
        error:
          "Branch settings already exist for this branch.",
      };
    }

    const result =
      await storageManager.save<
        BranchSettingsStorageRecord
      >(
        toStorageRecord(
          settings,
        ),
        options,
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to save branch settings.",
      };
    }

    return {
      success: true,
      data: settings,
    };
  }

  // ==========================================================
  // UPDATE
  // ==========================================================

  async update(
    settings: BranchSettings,
    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<BranchSettings>
  > {

    const validationError =
      validateIdentity(
        settings.businessId,
        settings.branchId,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const result =
      await storageManager.update<
        BranchSettingsStorageRecord
      >(
        toStorageRecord(
          settings,
        ),
        options,
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to update branch settings.",
      };
    }

    return {
      success: true,
      data: settings,
    };
  }

  // ==========================================================
  // SAVE OR UPDATE
  // ==========================================================

  async saveOrUpdate(
    settings: BranchSettings,
    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<BranchSettings>
  > {

    const existing =
      await this.findByBranch(
        settings.businessId,
        settings.branchId,
      );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ??
          "Unable to verify branch settings.",
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
  // DELETE
  // ==========================================================

  async delete(
    businessId: string,
    branchId: string,
  ): Promise<
    StorageResult<void>
  > {

    const validationError =
      validateIdentity(
        businessId,
        branchId,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const result =
      await storageManager.delete(
        buildBranchSettingsQuery(
          businessId,
          branchId,
        ),
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to delete branch settings.",
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

export const branchSettingsRepository =
  new BranchSettingsRepository();

// ============================================================
// END
// ============================================================
