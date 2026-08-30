// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 BUSINESS DOMAIN
// BRANCH SETTINGS SERVICE
//
// RESPONSIBILITY:
//
// - Provide the application boundary for Branch Settings
// - Validate branch-specific operational settings
// - Enforce the maximum Branch / Shop photo count
// - Normalize persisted branch contact information
// - Coordinate Branch Settings repository persistence
// - Support FINORA LOCAL / USB storage
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No direct filesystem access.
// - No Electron IPC.
// - No React state.
// - No UI logic.
// - No authentication logic.
// - Repository access goes through BranchSettingsRepository.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  BranchSettings,
} from "../../types/business/branch.settings.types";

import {
  branchSettingsRepository,
} from "../../repositories/business/branchSettingsRepository";

import type {
  RepositoryWriteOptions,
} from "../../repositories/repository.types";

import type {
  StorageResult,
} from "../../storage/storage.types";

// ============================================================
// CONSTANTS
// ============================================================

export const MAX_BRANCH_OFFICE_PHOTOS =
  3;

// ============================================================
// VALIDATION
// ============================================================

export interface BranchSettingsValidationResult {
  valid: boolean;

  errors: string[];
}

export function validateBranchSettings(
  settings: BranchSettings,
): BranchSettingsValidationResult {

  const errors: string[] = [];

  if (!settings.businessId?.trim()) {
    errors.push(
      "Business ID is required.",
    );
  }

  if (!settings.branchId?.trim()) {
    errors.push(
      "Branch ID is required.",
    );
  }

  if (!settings.address?.trim()) {
    errors.push(
      "Branch address is required.",
    );
  }

  if (!settings.phone?.trim()) {
    errors.push(
      "Branch phone number is required.",
    );
  }

  if (!settings.email?.trim()) {
    errors.push(
      "Branch email address is required.",
    );
  }

  if (
    !Array.isArray(
      settings.officePhotos,
    )
  ) {
    errors.push(
      "Branch office photos are invalid.",
    );
  } else if (
    settings.officePhotos.length >
    MAX_BRANCH_OFFICE_PHOTOS
  ) {
    errors.push(
      `A maximum of ${MAX_BRANCH_OFFICE_PHOTOS} Branch / Shop photos is allowed.`,
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

function normalizeBranchSettings(
  settings: BranchSettings,
): BranchSettings {

  return {
    ...settings,

    businessId:
      settings.businessId.trim(),

    branchId:
      settings.branchId.trim(),

    address:
      settings.address.trim(),

    phone:
      settings.phone.trim(),

    email:
      settings.email.trim(),

    officePhotos:
      Array.isArray(settings.officePhotos)
        ? settings.officePhotos.map(
            (photo) =>
              String(photo).trim(),
          )
        : [],
  };
}

// ============================================================
// LOAD
// ============================================================

export async function loadBranchSettings(
  businessId: string,
  branchId: string,
): Promise<
  StorageResult<
    BranchSettings | undefined
  >
> {

  return branchSettingsRepository
    .findByBranch(
      businessId,
      branchId,
    );
}

// ============================================================
// SAVE OR UPDATE
// ============================================================

export async function saveBranchSettings(
  settings: BranchSettings,
  options?: RepositoryWriteOptions,
): Promise<
  StorageResult<BranchSettings>
> {

  const normalized =
    normalizeBranchSettings(
      settings,
    );

  const validation =
    validateBranchSettings(
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
    await branchSettingsRepository
      .findByBranch(
        normalized.businessId,
        normalized.branchId,
      );

  if (!existing.success) {
    return {
      success: false,

      error:
        existing.error ??
        "Unable to verify Branch Settings.",
    };
  }

  const now =
    new Date().toISOString();

  const prepared:
    BranchSettings = {

    ...normalized,

    createdAt:
      existing.data?.createdAt ??
      normalized.createdAt ??
      now,

    updatedAt:
      now,
  };

  return branchSettingsRepository
    .saveOrUpdate(
      prepared,
      options,
    );
}

// ============================================================
// DELETE
// ============================================================

export async function deleteBranchSettings(
  businessId: string,
  branchId: string,
): Promise<
  StorageResult<void>
> {

  return branchSettingsRepository
    .delete(
      businessId,
      branchId,
    );
}

// ============================================================
// EMPTY FACTORY
// ============================================================

export function createEmptyBranchSettings(
  businessId: string,
  branchId: string,
): BranchSettings {

  const now =
    new Date().toISOString();

  return {
    businessId:
      businessId.trim(),

    branchId:
      branchId.trim(),

    address:
      "",

    phone:
      "",

    email:
      "",

    officePhotos:
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

export const branchSettingsService = {
  load:
    loadBranchSettings,

  save:
    saveBranchSettings,

  delete:
    deleteBranchSettings,

  validate:
    validateBranchSettings,

  createEmpty:
    createEmptyBranchSettings,
};

// ============================================================
// END
// ============================================================
