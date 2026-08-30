// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 BUSINESS DOMAIN
// BUSINESS OWNER PROFILE REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist BusinessOwnerProfile through StorageManager
// - Use explicit BUSINESS_OWNER_PROFILE entity routing
// - Link profile persistence to the existing auth userId
// - Scope profiles by owner / business / branch / user
// - Keep storage-only id/entity fields outside the domain model
// - Support FINORA LOCAL / USB storage
//
// IMPORTANT:
//
// - No password persistence.
// - No username duplication.
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
  BusinessOwnerProfile,
} from "../../types/business/business.owner.profile.types";

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

export const BUSINESS_OWNER_PROFILE_ENTITY =
  "BUSINESS_OWNER_PROFILE";

// ============================================================
// STORAGE RECORD
// ============================================================

interface BusinessOwnerProfileStorageRecord
  extends BusinessOwnerProfile {

  id: string;

  entity:
    typeof BUSINESS_OWNER_PROFILE_ENTITY;
}

// ============================================================
// STORAGE ID
// ============================================================

function buildBusinessOwnerProfileId(
  ownerId: string,
  businessId: string,
  branchId: string,
  userId: string,
): string {

  return [
    ownerId.trim(),
    businessId.trim(),
    branchId.trim(),
    userId.trim(),
  ].join("::");
}

// ============================================================
// STORAGE RECORD BUILDER
// ============================================================

function toStorageRecord(
  profile: BusinessOwnerProfile,
): BusinessOwnerProfileStorageRecord {

  return {
    ...profile,

    id:
      buildBusinessOwnerProfileId(
        profile.ownerId,
        profile.businessId,
        profile.branchId,
        profile.userId,
      ),

    entity:
      BUSINESS_OWNER_PROFILE_ENTITY,
  };
}

// ============================================================
// DOMAIN MAPPER
// ============================================================

function fromStorageRecord(
  record: BusinessOwnerProfileStorageRecord,
): BusinessOwnerProfile {

  const {
    id: _storageId,

    entity: _storageEntity,

    ...profile
  } = record;

  return profile;
}

// ============================================================
// QUERY BUILDER
// ============================================================

function buildBusinessOwnerProfileQuery(
  ownerId: string,
  businessId: string,
  branchId: string,
  userId: string,
): StorageQuery {

  return {
    entity:
      BUSINESS_OWNER_PROFILE_ENTITY,

    id:
      buildBusinessOwnerProfileId(
        ownerId,
        businessId,
        branchId,
        userId,
      ),
  };
}

// ============================================================
// VALIDATION
// ============================================================

function validateIdentity(
  ownerId: string,
  businessId: string,
  branchId: string,
  userId: string,
): string | null {

  if (!ownerId?.trim()) {
    return "Owner ID is required.";
  }

  if (!businessId?.trim()) {
    return "Business ID is required.";
  }

  if (!branchId?.trim()) {
    return "Branch ID is required.";
  }

  if (!userId?.trim()) {
    return "User ID is required.";
  }

  return null;
}

// ============================================================
// REPOSITORY
// ============================================================

export class BusinessOwnerProfileRepository {

  // ==========================================================
  // FIND
  // ==========================================================

  async findByUser(
    ownerId: string,
    businessId: string,
    branchId: string,
    userId: string,
  ): Promise<
    StorageResult<
      BusinessOwnerProfile | undefined
    >
  > {

    const validationError =
      validateIdentity(
        ownerId,
        businessId,
        branchId,
        userId,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const result =
      await storageManager.get<
        BusinessOwnerProfileStorageRecord
      >(
        buildBusinessOwnerProfileQuery(
          ownerId,
          businessId,
          branchId,
          userId,
        ),
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to load Business Owner profile.",
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
    profile: BusinessOwnerProfile,
    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<BusinessOwnerProfile>
  > {

    const validationError =
      validateIdentity(
        profile.ownerId,
        profile.businessId,
        profile.branchId,
        profile.userId,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const existing =
      await this.findByUser(
        profile.ownerId,
        profile.businessId,
        profile.branchId,
        profile.userId,
      );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ??
          "Unable to verify existing Business Owner profile.",
      };
    }

    if (existing.data) {
      return {
        success: false,

        error:
          "Business Owner profile already exists for this user.",
      };
    }

    const result =
      await storageManager.save<
        BusinessOwnerProfileStorageRecord
      >(
        toStorageRecord(
          profile,
        ),
        options,
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to save Business Owner profile.",
      };
    }

    return {
      success: true,
      data: profile,
    };
  }

  // ==========================================================
  // UPDATE
  // ==========================================================

  async update(
    profile: BusinessOwnerProfile,
    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<BusinessOwnerProfile>
  > {

    const validationError =
      validateIdentity(
        profile.ownerId,
        profile.businessId,
        profile.branchId,
        profile.userId,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const result =
      await storageManager.update<
        BusinessOwnerProfileStorageRecord
      >(
        toStorageRecord(
          profile,
        ),
        options,
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to update Business Owner profile.",
      };
    }

    return {
      success: true,
      data: profile,
    };
  }

  // ==========================================================
  // SAVE OR UPDATE
  // ==========================================================

  async saveOrUpdate(
    profile: BusinessOwnerProfile,
    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<BusinessOwnerProfile>
  > {

    const existing =
      await this.findByUser(
        profile.ownerId,
        profile.businessId,
        profile.branchId,
        profile.userId,
      );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ??
          "Unable to verify Business Owner profile.",
      };
    }

    if (existing.data) {
      return this.update(
        profile,
        options,
      );
    }

    return this.save(
      profile,
      options,
    );
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  async delete(
    ownerId: string,
    businessId: string,
    branchId: string,
    userId: string,
  ): Promise<
    StorageResult<void>
  > {

    const validationError =
      validateIdentity(
        ownerId,
        businessId,
        branchId,
        userId,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const result =
      await storageManager.delete(
        buildBusinessOwnerProfileQuery(
          ownerId,
          businessId,
          branchId,
          userId,
        ),
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to delete Business Owner profile.",
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

export const businessOwnerProfileRepository =
  new BusinessOwnerProfileRepository();

// ============================================================
// END
// ============================================================
