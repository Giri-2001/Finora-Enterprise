// ============================================================
// FINORA ENTERPRISE OS™
//
// IDENTITY & NUMBERING ENGINE
// CUSTOMER SERIES REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist Customer Series configuration through StorageManager
// - Use explicit NUMBERING_SERIES entity routing
// - Scope one Customer Series record per Business + Branch
// - Keep storage-only id/entity fields outside the domain model
// - Support FINORA LOCAL / USB storage
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No direct filesystem access.
// - No Electron IPC.
// - No UI logic.
// - No sequence allocation logic.
// - No Customer ID generation logic.
// - No Customer Series lock business logic.
// - Storage access goes only through StorageManager.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  CustomerSeriesConfiguration,
} from "../../types/numbering/numbering.types";

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

export const NUMBERING_SERIES_ENTITY =
  "NUMBERING_SERIES";

// ============================================================
// STORAGE RECORD
// ============================================================

interface NumberingSeriesStorageRecord
  extends CustomerSeriesConfiguration {

  id: string;

  entity:
    typeof NUMBERING_SERIES_ENTITY;
}

// ============================================================
// STORAGE ID
//
// One Customer Series configuration exists per:
//
// Business + Branch
//
// Owner isolation remains enforced independently by the
// StorageManager storage context.
// ============================================================

function buildNumberingSeriesId(
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
  configuration:
    CustomerSeriesConfiguration,
): NumberingSeriesStorageRecord {

  return {
    ...configuration,

    id:
      buildNumberingSeriesId(
        configuration.businessId,
        configuration.branchId,
      ),

    entity:
      NUMBERING_SERIES_ENTITY,
  };
}

// ============================================================
// DOMAIN MAPPER
// ============================================================

function fromStorageRecord(
  record:
    NumberingSeriesStorageRecord,
): CustomerSeriesConfiguration {

  const {
    id: _storageId,

    entity: _storageEntity,

    ...configuration
  } = record;

  return configuration;
}

// ============================================================
// QUERY BUILDER
// ============================================================

function buildNumberingSeriesQuery(
  businessId: string,
  branchId: string,
): StorageQuery {

  return {
    entity:
      NUMBERING_SERIES_ENTITY,

    id:
      buildNumberingSeriesId(
        businessId,
        branchId,
      ),
  };
}

// ============================================================
// IDENTITY VALIDATION
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

export class NumberingSeriesRepository {

  // ==========================================================
  // FIND
  // ==========================================================

  async findByBranch(
    businessId: string,
    branchId: string,
  ): Promise<
    StorageResult<
      CustomerSeriesConfiguration | undefined
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
        NumberingSeriesStorageRecord
      >(
        buildNumberingSeriesQuery(
          businessId,
          branchId,
        ),
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to load Customer Series configuration.",
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
    configuration:
      CustomerSeriesConfiguration,
    options?:
      RepositoryWriteOptions,
  ): Promise<
    StorageResult<
      CustomerSeriesConfiguration
    >
  > {

    const validationError =
      validateIdentity(
        configuration.businessId,
        configuration.branchId,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const existing =
      await this.findByBranch(
        configuration.businessId,
        configuration.branchId,
      );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ??
          "Unable to verify existing Customer Series configuration.",
      };
    }

    if (existing.data) {
      return {
        success: false,

        error:
          "Customer Series configuration already exists for this branch.",
      };
    }

    const result =
      await storageManager.save<
        NumberingSeriesStorageRecord
      >(
        toStorageRecord(
          configuration,
        ),
        options,
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to save Customer Series configuration.",
      };
    }

    return {
      success: true,
      data: configuration,
    };
  }

  // ==========================================================
  // UPDATE
  //
  // IMPORTANT:
  //
  // Repository update is required for system-owned mutable
  // state such as lastIssuedCustomerNumber.
  //
  // Immutability of owner-controlled setup fields is enforced
  // by the Numbering Service, not by the storage repository.
  // ==========================================================

  async update(
    configuration:
      CustomerSeriesConfiguration,
    options?:
      RepositoryWriteOptions,
  ): Promise<
    StorageResult<
      CustomerSeriesConfiguration
    >
  > {

    const validationError =
      validateIdentity(
        configuration.businessId,
        configuration.branchId,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const result =
      await storageManager.update<
        NumberingSeriesStorageRecord
      >(
        toStorageRecord(
          configuration,
        ),
        options,
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to update Customer Series configuration.",
      };
    }

    return {
      success: true,
      data: configuration,
    };
  }
}

// ============================================================
// SINGLETON
// ============================================================

export const numberingSeriesRepository =
  new NumberingSeriesRepository();

// ============================================================
// END
// ============================================================
