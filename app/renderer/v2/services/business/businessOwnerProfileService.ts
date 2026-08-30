// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 BUSINESS DOMAIN
// BUSINESS OWNER PROFILE SERVICE
//
// RESPONSIBILITY:
//
// - Provide the application boundary for Business Owner profiles
// - Validate Business Owner profile information
// - Enforce the maximum Business Owner photo count
// - Normalize owner contact information
// - Coordinate Business Owner Profile repository persistence
// - Support FINORA LOCAL / USB storage
//
// IMPORTANT:
//
// - No password handling.
// - No username duplication.
// - No direct localStorage access.
// - No direct filesystem access.
// - No Electron IPC.
// - No React state.
// - No UI logic.
// - Repository access goes through BusinessOwnerProfileRepository.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  BusinessOwnerProfile,
} from "../../types/business/business.owner.profile.types";

import {
  businessOwnerProfileRepository,
} from "../../repositories/business/businessOwnerProfileRepository";

import type {
  RepositoryWriteOptions,
} from "../../repositories/repository.types";

import type {
  StorageResult,
} from "../../storage/storage.types";

// ============================================================
// CONSTANTS
// ============================================================

export const MAX_BUSINESS_OWNER_PHOTOS =
  2;

// ============================================================
// VALIDATION
// ============================================================

export interface BusinessOwnerProfileValidationResult {
  valid: boolean;

  errors: string[];
}

export function validateBusinessOwnerProfile(
  profile: BusinessOwnerProfile,
): BusinessOwnerProfileValidationResult {

  const errors: string[] = [];

  if (!profile.userId?.trim()) {
    errors.push(
      "User ID is required.",
    );
  }

  if (!profile.ownerId?.trim()) {
    errors.push(
      "Owner ID is required.",
    );
  }

  if (!profile.businessId?.trim()) {
    errors.push(
      "Business ID is required.",
    );
  }

  if (!profile.branchId?.trim()) {
    errors.push(
      "Branch ID is required.",
    );
  }

  if (!profile.phone?.trim()) {
    errors.push(
      "Business Owner phone number is required.",
    );
  }

  if (!profile.email?.trim()) {
    errors.push(
      "Business Owner email address is required.",
    );
  }

  if (
    !Array.isArray(
      profile.ownerPhotos,
    )
  ) {
    errors.push(
      "Business Owner photos are invalid.",
    );
  } else if (
    profile.ownerPhotos.length >
    MAX_BUSINESS_OWNER_PHOTOS
  ) {
    errors.push(
      `A maximum of ${MAX_BUSINESS_OWNER_PHOTOS} Business Owner photos is allowed.`,
    );
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}

// ============================================================
// NORMALIZATION
// ============================================================

function normalizeBusinessOwnerProfile(
  profile: BusinessOwnerProfile,
): BusinessOwnerProfile {

  return {
    ...profile,

    userId:
      profile.userId.trim(),

    ownerId:
      profile.ownerId.trim(),

    businessId:
      profile.businessId.trim(),

    branchId:
      profile.branchId.trim(),

    phone:
      profile.phone.trim(),

    email:
      profile.email.trim(),

    ownerPhotos:
      Array.isArray(profile.ownerPhotos)
        ? profile.ownerPhotos.map(
            (photo) =>
              String(photo).trim(),
          )
        : [],
  };
}

// ============================================================
// LOAD
// ============================================================

export async function loadBusinessOwnerProfile(
  ownerId: string,
  businessId: string,
  branchId: string,
  userId: string,
): Promise<
  StorageResult<
    BusinessOwnerProfile | undefined
  >
> {

  return businessOwnerProfileRepository
    .findByUser(
      ownerId,
      businessId,
      branchId,
      userId,
    );
}

// ============================================================
// SAVE OR UPDATE
// ============================================================

export async function saveBusinessOwnerProfile(
  profile: BusinessOwnerProfile,
  options?: RepositoryWriteOptions,
): Promise<
  StorageResult<BusinessOwnerProfile>
> {

  const normalized =
    normalizeBusinessOwnerProfile(
      profile,
    );

  const validation =
    validateBusinessOwnerProfile(
      normalized,
    );

  if (!validation.valid) {
    return {
      success: false,

      error:
        validation.errors.join(" "),
    };
  }

  const existing =
    await businessOwnerProfileRepository
      .findByUser(
        normalized.ownerId,
        normalized.businessId,
        normalized.branchId,
        normalized.userId,
      );

  if (!existing.success) {
    return {
      success: false,

      error:
        existing.error ??
        "Unable to verify Business Owner profile.",
    };
  }

  const now =
    new Date().toISOString();

  const prepared:
    BusinessOwnerProfile = {

    ...normalized,

    createdAt:
      existing.data?.createdAt ??
      normalized.createdAt ??
      now,

    updatedAt:
      now,
  };

  return businessOwnerProfileRepository
    .saveOrUpdate(
      prepared,
      options,
    );
}

// ============================================================
// DELETE
// ============================================================

export async function deleteBusinessOwnerProfile(
  ownerId: string,
  businessId: string,
  branchId: string,
  userId: string,
): Promise<
  StorageResult<void>
> {

  return businessOwnerProfileRepository
    .delete(
      ownerId,
      businessId,
      branchId,
      userId,
    );
}

// ============================================================
// EMPTY FACTORY
// ============================================================

export function createEmptyBusinessOwnerProfile(
  ownerId: string,
  businessId: string,
  branchId: string,
  userId: string,
): BusinessOwnerProfile {

  const now =
    new Date().toISOString();

  return {
    userId:
      userId.trim(),

    ownerId:
      ownerId.trim(),

    businessId:
      businessId.trim(),

    branchId:
      branchId.trim(),

    phone:
      "",

    email:
      "",

    ownerPhotos:
      [],

    createdAt:
      now,

    updatedAt:
      now,
  };
}

// ============================================================
// SERVICE
// ============================================================

export const businessOwnerProfileService = {
  load:
    loadBusinessOwnerProfile,

  save:
    saveBusinessOwnerProfile,

  delete:
    deleteBusinessOwnerProfile,

  validate:
    validateBusinessOwnerProfile,

  createEmpty:
    createEmptyBusinessOwnerProfile,
};

// ============================================================
// END
// ============================================================
