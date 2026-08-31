// ============================================================
// FINORA ENTERPRISE OS™
//
// IDENTITY & NUMBERING ENGINE
// LOAN NUMBERING BINDING REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist historical Loan -> canonical numbering-root bindings
// - Keep historical visible Loan Numbers unchanged
// - Scope one immutable binding per Business + Branch +
//   Customer + historical Loan Number
// - Use explicit LOAN_NUMBERING_BINDING entity routing
// - Support FINORA LOCAL / USB storage
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No direct filesystem access.
// - No Electron IPC.
// - No UI logic.
// - No Loan sequence reservation logic.
// - No Loan record mutation.
// - No timestamp / suffix guessing.
// - Storage access goes only through StorageManager.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  LoanNumberingBinding,
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

export const LOAN_NUMBERING_BINDING_ENTITY =
  "LOAN_NUMBERING_BINDING";

// ============================================================
// STORAGE RECORD
// ============================================================

interface LoanNumberingBindingStorageRecord
  extends LoanNumberingBinding {

  id: string;

  entity:
    typeof LOAN_NUMBERING_BINDING_ENTITY;
}

// ============================================================
// STORAGE ID
//
// One immutable binding exists per:
//
// Business + Branch + Customer + historical Loan Number
//
// Customer is included intentionally so historical Loan
// identity remains scoped to its authoritative Customer.
// ============================================================

function buildLoanNumberingBindingId(
  businessId: string,
  branchId: string,
  customerId: string,
  legacyLoanNumber: string,
): string {

  return [
    businessId.trim(),
    branchId.trim(),
    customerId.trim(),
    legacyLoanNumber.trim(),
  ].join("::");
}

// ============================================================
// STORAGE RECORD BUILDER
// ============================================================

function toStorageRecord(
  binding:
    LoanNumberingBinding,
): LoanNumberingBindingStorageRecord {

  return {
    ...binding,

    id:
      buildLoanNumberingBindingId(
        binding.businessId,
        binding.branchId,
        binding.customerId,
        binding.legacyLoanNumber,
      ),

    entity:
      LOAN_NUMBERING_BINDING_ENTITY,
  };
}

// ============================================================
// DOMAIN MAPPER
// ============================================================

function fromStorageRecord(
  record:
    LoanNumberingBindingStorageRecord,
): LoanNumberingBinding {

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

function buildLoanNumberingBindingQuery(
  businessId: string,
  branchId: string,
  customerId: string,
  legacyLoanNumber: string,
): StorageQuery {

  return {
    entity:
      LOAN_NUMBERING_BINDING_ENTITY,

    id:
      buildLoanNumberingBindingId(
        businessId,
        branchId,
        customerId,
        legacyLoanNumber,
      ),
  };
}

// ============================================================
// IDENTITY VALIDATION
// ============================================================

function validateIdentity(
  businessId: string,
  branchId: string,
  customerId: string,
  legacyLoanNumber: string,
): string | null {

  if (!businessId?.trim()) {
    return "Business ID is required.";
  }

  if (!branchId?.trim()) {
    return "Branch ID is required.";
  }

  if (!customerId?.trim()) {
    return "Customer ID is required.";
  }

  if (!legacyLoanNumber?.trim()) {
    return "Historical Loan Number is required.";
  }

  return null;
}

// ============================================================
// REPOSITORY
// ============================================================

export class LoanNumberingBindingRepository {

  // ==========================================================
  // FIND BY HISTORICAL LOAN
  // ==========================================================

  async findByLegacyLoan(
    businessId: string,
    branchId: string,
    customerId: string,
    legacyLoanNumber: string,
  ): Promise<
    StorageResult<
      LoanNumberingBinding | undefined
    >
  > {

    const validationError =
      validateIdentity(
        businessId,
        branchId,
        customerId,
        legacyLoanNumber,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const result =
      await storageManager.get<
        LoanNumberingBindingStorageRecord
      >(
        buildLoanNumberingBindingQuery(
          businessId,
          branchId,
          customerId,
          legacyLoanNumber,
        ),
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to load Loan numbering binding.",
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
      LoanNumberingBinding,
    options?:
      RepositoryWriteOptions,
  ): Promise<
    StorageResult<
      LoanNumberingBinding
    >
  > {

    const validationError =
      validateIdentity(
        binding.businessId,
        binding.branchId,
        binding.customerId,
        binding.legacyLoanNumber,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const existing =
      await this.findByLegacyLoan(
        binding.businessId,
        binding.branchId,
        binding.customerId,
        binding.legacyLoanNumber,
      );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ??
          "Unable to verify existing Loan numbering binding.",
      };
    }

    if (existing.data) {
      return {
        success: false,

        error:
          "Loan numbering binding already exists.",
      };
    }

    const result =
      await storageManager.save<
        LoanNumberingBindingStorageRecord
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
          "Unable to save Loan numbering binding.",
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

export const loanNumberingBindingRepository =
  new LoanNumberingBindingRepository();

// ============================================================
// END
// ============================================================
