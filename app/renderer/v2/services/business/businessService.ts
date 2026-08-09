// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 BUSINESS DOMAIN
// BUSINESS SERVICE
//
// RESPONSIBILITY:
//
// - Provide the application/service boundary for Business Identity
// - Provide the application/service boundary for Business Settings
// - Coordinate Business persistence
// - Keep UI independent from repository/storage details
// - Validate minimum service-level requirements
// - Prepare Business domain for LOCAL / USB / CLOUD
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No direct filesystem access.
// - No Electron IPC.
// - No UI logic.
// - No React state.
// - No authentication logic.
// - No business calculations.
// - Repository access goes through BusinessRepository.
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
  businessRepository,
} from "../../repositories/business/businessRepository";

import type {
  RepositoryWriteOptions,
} from "../../repositories/repository.types";

import type {
  StorageResult,
} from "../../storage/storage.types";

// ============================================================
// BUSINESS IDENTITY
// ============================================================

// ============================================================
// LOAD BUSINESS IDENTITY
// ============================================================

/**
 * Load the persisted Business Identity for a business.
 */
export async function loadBusinessIdentity(
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

  return businessRepository.findIdentityByBusinessId(
    businessId,
  );
}

// ============================================================
// SAVE BUSINESS IDENTITY
// ============================================================

/**
 * Create Business Identity for a business.
 *
 * Existing identity is not overwritten by this operation.
 */
export async function saveBusinessIdentity(
  identity: BusinessIdentity,
  options?: RepositoryWriteOptions,
): Promise<
  StorageResult<BusinessIdentity>
> {

  if (!identity.businessId) {

    return {

      success: false,

      error:
        "Business ID is required.",
    };
  }

  return businessRepository.saveIdentity(
    identity,
    options,
  );
}

// ============================================================
// UPDATE BUSINESS IDENTITY
// ============================================================

/**
 * Update an existing Business Identity record.
 */
export async function updateBusinessIdentity(
  identity: BusinessIdentity,
  options?: RepositoryWriteOptions,
): Promise<
  StorageResult<BusinessIdentity>
> {

  if (!identity.businessId) {

    return {

      success: false,

      error:
        "Business ID is required.",
    };
  }

  return businessRepository.updateIdentity(
    identity,
    options,
  );
}

// ============================================================
// SAVE OR UPDATE BUSINESS IDENTITY
// ============================================================

/**
 * Persist Business Identity using the business-level
 * single-record model.
 *
 * Existing record:
 * UPDATE
 *
 * Missing record:
 * SAVE
 */
export async function saveOrUpdateBusinessIdentity(
  identity: BusinessIdentity,
  options?: RepositoryWriteOptions,
): Promise<
  StorageResult<BusinessIdentity>
> {

  if (!identity.businessId) {

    return {

      success: false,

      error:
        "Business ID is required.",
    };
  }

  return businessRepository.saveOrUpdateIdentity(
    identity,
    options,
  );
}

// ============================================================
// DELETE BUSINESS IDENTITY
// ============================================================

/**
 * Delete the Business Identity record belonging to
 * the supplied business.
 */
export async function deleteBusinessIdentity(
  businessId: string,
): Promise<
  StorageResult<void>
> {

  if (!businessId) {

    return {

      success: false,

      error:
        "Business ID is required.",
    };
  }

  return businessRepository.deleteIdentity(
    businessId,
  );
}

// ============================================================
// BUSINESS SETTINGS
// ============================================================

// ============================================================
// LOAD BUSINESS SETTINGS
// ============================================================

/**
 * Load the persisted settings for a business.
 */
export async function loadBusinessSettings(
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

  return businessRepository.findByBusinessId(
    businessId,
  );
}

// ============================================================
// SAVE BUSINESS SETTINGS
// ============================================================

/**
 * Create Business Settings for a business.
 *
 * Existing settings are not overwritten by this operation.
 */
export async function saveBusinessSettings(
  settings: BusinessSettings,
  options?: RepositoryWriteOptions,
): Promise<
  StorageResult<BusinessSettings>
> {

  if (!settings.businessId) {

    return {

      success: false,

      error:
        "Business ID is required.",
    };
  }

  return businessRepository.save(
    settings,
    options,
  );
}

// ============================================================
// UPDATE BUSINESS SETTINGS
// ============================================================

/**
 * Update an existing Business Settings record.
 */
export async function updateBusinessSettings(
  settings: BusinessSettings,
  options?: RepositoryWriteOptions,
): Promise<
  StorageResult<BusinessSettings>
> {

  if (!settings.businessId) {

    return {

      success: false,

      error:
        "Business ID is required.",
    };
  }

  return businessRepository.update(
    settings,
    options,
  );
}

// ============================================================
// SAVE OR UPDATE BUSINESS SETTINGS
// ============================================================

/**
 * Persist Business Settings using the business-level
 * single-record model.
 *
 * Existing record:
 * UPDATE
 *
 * Missing record:
 * SAVE
 */
export async function saveOrUpdateBusinessSettings(
  settings: BusinessSettings,
  options?: RepositoryWriteOptions,
): Promise<
  StorageResult<BusinessSettings>
> {

  if (!settings.businessId) {

    return {

      success: false,

      error:
        "Business ID is required.",
    };
  }

  return businessRepository.saveOrUpdate(
    settings,
    options,
  );
}

// ============================================================
// DELETE BUSINESS SETTINGS
// ============================================================

/**
 * Delete the Business Settings record belonging to
 * the supplied business.
 */
export async function deleteBusinessSettings(
  businessId: string,
): Promise<
  StorageResult<void>
> {

  if (!businessId) {

    return {

      success: false,

      error:
        "Business ID is required.",
    };
  }

  return businessRepository.delete(
    businessId,
  );
}

// ============================================================
// END
// ============================================================
