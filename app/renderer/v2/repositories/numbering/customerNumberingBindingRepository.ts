// ============================================================
// FINORA ENTERPRISE OS™
//
// IDENTITY & NUMBERING ENGINE
// CUSTOMER NUMBERING BINDING REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist historical Customer ? canonical numbering-root bindings
// - Keep historical visible Customer IDs unchanged
// - Scope one immutable binding per Business + Branch + Customer
// - Use explicit CUSTOMER_NUMBERING_BINDING entity routing
// - Support FINORA LOCAL / USB storage
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No direct filesystem access.
// - No Electron IPC.
// - No UI logic.
// - No Customer master-series reservation logic.
// - No Customer record mutation.
// - No timestamp / suffix guessing.
// - Storage access goes only through StorageManager.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  CustomerNumberingBinding,
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

export const CUSTOMER_NUMBERING_BINDING_ENTITY =
  "CUSTOMER_NUMBERING_BINDING";

// ============================================================
// STORAGE RECORD
// ============================================================

interface CustomerNumberingBindingStorageRecord
  extends CustomerNumberingBinding {

  id: string;

  entity:
    typeof CUSTOMER_NUMBERING_BINDING_ENTITY;
}

// ============================================================
// STORAGE ID
//
// One immutable binding exists per:
//
// Business + Branch + historical Customer ID
// ============================================================

function buildCustomerNumberingBindingId(
  businessId: string,
  branchId: string,
  legacyCustomerId: string,
): string {

  return [
    businessId.trim(),
    branchId.trim(),
    legacyCustomerId.trim(),
  ].join("::");
}

// ============================================================
// STORAGE RECORD BUILDER
// ============================================================

function toStorageRecord(
  binding:
    CustomerNumberingBinding,
): CustomerNumberingBindingStorageRecord {

  return {
    ...binding,

    id:
      buildCustomerNumberingBindingId(
        binding.businessId,
        binding.branchId,
        binding.legacyCustomerId,
      ),

    entity:
      CUSTOMER_NUMBERING_BINDING_ENTITY,
  };
}

// ============================================================
// DOMAIN MAPPER
// ============================================================

function fromStorageRecord(
  record:
    CustomerNumberingBindingStorageRecord,
): CustomerNumberingBinding {

  const {
    id: _storageId,

    entity: _storageEntity,

    ...binding
  } = record;

  return binding;
}

// ============================================================
// QUERY BUILDER
// ============================================================

function buildCustomerNumberingBindingQuery(
  businessId: string,
  branchId: string,
  legacyCustomerId: string,
): StorageQuery {

  return {
    entity:
      CUSTOMER_NUMBERING_BINDING_ENTITY,

    id:
      buildCustomerNumberingBindingId(
        businessId,
        branchId,
        legacyCustomerId,
      ),
  };
}

// ============================================================
// IDENTITY VALIDATION
// ============================================================

function validateIdentity(
  businessId: string,
  branchId: string,
  legacyCustomerId: string,
): string | null {

  if (!businessId?.trim()) {
    return "Business ID is required.";
  }

  if (!branchId?.trim()) {
    return "Branch ID is required.";
  }

  if (!legacyCustomerId?.trim()) {
    return "Historical Customer ID is required.";
  }

  return null;
}

// ============================================================
// REPOSITORY
// ============================================================

export class CustomerNumberingBindingRepository {

  // ==========================================================
  // FIND BY HISTORICAL CUSTOMER
  // ==========================================================

  async findByLegacyCustomer(
    businessId: string,
    branchId: string,
    legacyCustomerId: string,
  ): Promise<
    StorageResult<
      CustomerNumberingBinding | undefined
    >
  > {

    const validationError =
      validateIdentity(
        businessId,
        branchId,
        legacyCustomerId,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const result =
      await storageManager.get<
        CustomerNumberingBindingStorageRecord
      >(
        buildCustomerNumberingBindingQuery(
          businessId,
          branchId,
          legacyCustomerId,
        ),
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to load Customer numbering binding.",
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
  //
  // Binding is immutable after creation.
  //
  // No update API is intentionally exposed.
  // ==========================================================

  async save(
    binding:
      CustomerNumberingBinding,
    options?:
      RepositoryWriteOptions,
  ): Promise<
    StorageResult<
      CustomerNumberingBinding
    >
  > {

    const validationError =
      validateIdentity(
        binding.businessId,
        binding.branchId,
        binding.legacyCustomerId,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const existing =
      await this.findByLegacyCustomer(
        binding.businessId,
        binding.branchId,
        binding.legacyCustomerId,
      );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ??
          "Unable to verify existing Customer numbering binding.",
      };
    }

    if (existing.data) {
      return {
        success: false,

        error:
          "Customer numbering binding already exists.",
      };
    }

    const result =
      await storageManager.save<
        CustomerNumberingBindingStorageRecord
      >(
        toStorageRecord(
          binding,
        ),
        options,
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to save Customer numbering binding.",
      };
    }

    return {
      success: true,
      data: binding,
    };
  }
}

// ============================================================
// SINGLETON
// ============================================================

export const customerNumberingBindingRepository =
  new CustomerNumberingBindingRepository();

// ============================================================
// END
// ============================================================
