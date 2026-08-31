// ============================================================
// FINORA ENTERPRISE OS™
//
// IDENTITY & NUMBERING ENGINE
// LOAN SEQUENCE REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist system-owned per-Customer Loan sequence state
// - Use explicit LOAN_NUMBER_SEQUENCE entity routing
// - Scope one Loan sequence record per Business + Branch + Customer
// - Keep storage-only id/entity fields outside the domain model
// - Support FINORA LOCAL / USB storage
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No direct filesystem access.
// - No Electron IPC.
// - No UI logic.
// - No Loan number formatting logic.
// - No sequence reservation logic.
// - No owner-editable starting sequence.
// - Storage access goes only through StorageManager.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  LoanSequenceState,
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

export const LOAN_NUMBER_SEQUENCE_ENTITY =
  "LOAN_NUMBER_SEQUENCE";

// ============================================================
// STORAGE RECORD
// ============================================================

interface LoanSequenceStorageRecord
  extends LoanSequenceState {

  id: string;

  entity:
    typeof LOAN_NUMBER_SEQUENCE_ENTITY;
}

// ============================================================
// STORAGE ID
//
// One system-owned Loan sequence state exists per:
//
// Business + Branch + Customer
//
// Owner isolation remains enforced independently by the
// StorageManager storage context.
// ============================================================

function buildLoanSequenceId(
  businessId: string,
  branchId: string,
  customerId: string,
): string {

  return [
    businessId.trim(),
    branchId.trim(),
    customerId.trim(),
  ].join("::");
}

// ============================================================
// STORAGE RECORD BUILDER
// ============================================================

function toStorageRecord(
  state:
    LoanSequenceState,
): LoanSequenceStorageRecord {

  return {
    ...state,

    id:
      buildLoanSequenceId(
        state.businessId,
        state.branchId,
        state.customerId,
      ),

    entity:
      LOAN_NUMBER_SEQUENCE_ENTITY,
  };
}

// ============================================================
// DOMAIN MAPPER
// ============================================================

function fromStorageRecord(
  record:
    LoanSequenceStorageRecord,
): LoanSequenceState {

  const {
    id: _storageId,

    entity: _storageEntity,

    ...state
  } = record;

  return state;
}

// ============================================================
// QUERY BUILDER
// ============================================================

function buildLoanSequenceQuery(
  businessId: string,
  branchId: string,
  customerId: string,
): StorageQuery {

  return {
    entity:
      LOAN_NUMBER_SEQUENCE_ENTITY,

    id:
      buildLoanSequenceId(
        businessId,
        branchId,
        customerId,
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

  return null;
}

// ============================================================
// REPOSITORY
// ============================================================

export class LoanSequenceRepository {

  // ==========================================================
  // FIND BY CUSTOMER
  // ==========================================================

  async findByCustomer(
    businessId: string,
    branchId: string,
    customerId: string,
  ): Promise<
    StorageResult<
      LoanSequenceState | undefined
    >
  > {

    const validationError =
      validateIdentity(
        businessId,
        branchId,
        customerId,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const result =
      await storageManager.get<
        LoanSequenceStorageRecord
      >(
        buildLoanSequenceQuery(
          businessId,
          branchId,
          customerId,
        ),
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to load Loan sequence state.",
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
  // Used only when a Customer receives its first permanent
  // Loan sequence reservation.
  // ==========================================================

  async save(
    state:
      LoanSequenceState,
    options?:
      RepositoryWriteOptions,
  ): Promise<
    StorageResult<
      LoanSequenceState
    >
  > {

    const validationError =
      validateIdentity(
        state.businessId,
        state.branchId,
        state.customerId,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const existing =
      await this.findByCustomer(
        state.businessId,
        state.branchId,
        state.customerId,
      );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ??
          "Unable to verify existing Loan sequence state.",
      };
    }

    if (existing.data) {
      return {
        success: false,

        error:
          "Loan sequence state already exists for this Customer.",
      };
    }

    const result =
      await storageManager.save<
        LoanSequenceStorageRecord
      >(
        toStorageRecord(
          state,
        ),
        options,
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to save Loan sequence state.",
      };
    }

    return {
      success: true,
      data: state,
    };
  }

  // ==========================================================
  // UPDATE
  //
  // lastIssuedLoanSequence is system-owned mutable state.
  //
  // Sequence rules and immutability are enforced by the
  // Numbering Service, not by this storage repository.
  // ==========================================================

  async update(
    state:
      LoanSequenceState,
    options?:
      RepositoryWriteOptions,
  ): Promise<
    StorageResult<
      LoanSequenceState
    >
  > {

    const validationError =
      validateIdentity(
        state.businessId,
        state.branchId,
        state.customerId,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const result =
      await storageManager.update<
        LoanSequenceStorageRecord
      >(
        toStorageRecord(
          state,
        ),
        options,
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to update Loan sequence state.",
      };
    }

    return {
      success: true,
      data: state,
    };
  }
}

// ============================================================
// SINGLETON
// ============================================================

export const loanSequenceRepository =
  new LoanSequenceRepository();

// ============================================================
// END
// ============================================================
