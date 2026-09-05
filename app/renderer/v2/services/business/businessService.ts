// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 BUSINESS DOMAIN
// BUSINESS SERVICE
//
// RESPONSIBILITY:
//
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

import {
  DEFAULT_BUSINESS_CURRENCY,
  isSupportedBusinessCurrency,
} from "../../constants/business/businessCurrency.constants";

import {
  getDeviceBusinessTimeZone,
  isSupportedBusinessTimeZone,
} from "../../constants/business/businessTimeZone.constants";

// ============================================================
// BUSINESS SETTINGS
// ============================================================

// ============================================================
// BUSINESS SETTINGS VALIDATION
// ============================================================

export interface BusinessSettingsValidationResult {
  valid: boolean;

  errors: string[];
}

export function validateBusinessSettings(
  settings: BusinessSettings,
): BusinessSettingsValidationResult {

  const errors: string[] = [];

  if (!settings.businessId?.trim()) {
    errors.push(
      "Business ID is required.",
    );
  }

  if (!settings.address?.trim()) {
    errors.push(
      "Business address is required.",
    );
  }

  if (!settings.phone?.trim()) {
    errors.push(
      "Business phone number is required.",
    );
  }

  if (!settings.email?.trim()) {
    errors.push(
      "Business email address is required.",
    );
  }

  if (!settings.currency?.trim()) {
    errors.push(
      "Business currency is required.",
    );
  } else if (
    !isSupportedBusinessCurrency(
      settings.currency.trim().toUpperCase(),
    )
  ) {
    errors.push(
      "Unsupported Business currency.",
    );
  }

  if (
    settings.timeZone?.trim() &&
    !isSupportedBusinessTimeZone(
      settings.timeZone.trim(),
    )
  ) {
    errors.push(
      "Unsupported Business time zone.",
    );
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}

// ============================================================
// BUSINESS SETTINGS NORMALIZATION
// ============================================================

function normalizeBusinessSettings(
  settings: BusinessSettings,
): BusinessSettings {

  return {
    ...settings,

    businessId:
      settings.businessId.trim(),

    address:
      settings.address.trim(),

    phone:
      settings.phone.trim(),

    email:
      settings.email.trim(),

    gst:
      settings.gst?.trim() || undefined,

    currency:
      settings.currency.trim().toUpperCase(),

    timeZone:
      settings.timeZone?.trim() || undefined,
  };
}

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

  const normalized =
    normalizeBusinessSettings(
      settings,
    );

  const validation =
    validateBusinessSettings(
      normalized,
    );

  if (!validation.valid) {
    return {
      success: false,

      error:
        validation.errors.join(" "),
    };
  }

  const now =
    new Date().toISOString();

  const prepared:
    BusinessSettings = {

    ...normalized,

    createdAt:
      normalized.createdAt ||
      now,

    updatedAt:
      now,
  };

  return businessRepository.save(
    prepared,
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

  const normalized =
    normalizeBusinessSettings(
      settings,
    );

  const validation =
    validateBusinessSettings(
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
    await businessRepository
      .findByBusinessId(
        normalized.businessId,
      );

  if (!existing.success) {
    return {
      success: false,

      error:
        existing.error ??
        "Unable to verify Business Settings.",
    };
  }

  const now =
    new Date().toISOString();

  const prepared:
    BusinessSettings = {

    ...normalized,

    createdAt:
      existing.data?.createdAt ??
      normalized.createdAt ??
      now,

    updatedAt:
      now,
  };

  return businessRepository.update(
    prepared,
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

  const normalized =
    normalizeBusinessSettings(
      settings,
    );

  const validation =
    validateBusinessSettings(
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
    await businessRepository
      .findByBusinessId(
        normalized.businessId,
      );

  if (!existing.success) {
    return {
      success: false,

      error:
        existing.error ??
        "Unable to verify Business Settings.",
    };
  }

  const now =
    new Date().toISOString();

  const prepared:
    BusinessSettings = {

    ...normalized,

    createdAt:
      existing.data?.createdAt ??
      normalized.createdAt ??
      now,

    updatedAt:
      now,
  };

  return businessRepository.saveOrUpdate(
    prepared,
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
// EMPTY BUSINESS SETTINGS FACTORY
// ============================================================

export function createEmptyBusinessSettings(
  businessId: string,
): BusinessSettings {

  const now =
    new Date().toISOString();

  return {
    businessId:
      businessId.trim(),

    address:
      "",

    phone:
      "",

    email:
      "",

    gst:
      undefined,

    currency:
      DEFAULT_BUSINESS_CURRENCY,

    timeZone:
      getDeviceBusinessTimeZone() ??
      undefined,

    createdAt:
      now,

    updatedAt:
      now,
  };
}

// ============================================================
// BUSINESS SETTINGS SERVICE
// ============================================================

export const businessSettingsService = {
  load:
    loadBusinessSettings,

  save:
    saveOrUpdateBusinessSettings,

  delete:
    deleteBusinessSettings,

  validate:
    validateBusinessSettings,

  createEmpty:
    createEmptyBusinessSettings,
};

// ============================================================
// END
// ============================================================
