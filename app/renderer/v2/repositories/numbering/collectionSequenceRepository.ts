// ============================================================
// FINORA ENTERPRISE OS™
//
// IDENTITY & NUMBERING ENGINE
// COLLECTION SEQUENCE REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist system-owned per-Loan Collection sequence state
// - Use explicit COLLECTION_NUMBER_SEQUENCE entity routing
// - Scope one Collection sequence record per Business +
//   Branch + canonical Loan Number
// - Keep storage-only id/entity fields outside the domain model
// - Support FINORA LOCAL / USB storage
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No direct filesystem access.
// - No Electron IPC.
// - No UI logic.
// - No Collection / Receipt formatting logic.
// - No sequence reservation logic.
// - No owner-editable starting sequence.
// - Receipt owns no separate sequence.
// - Storage access goes only through StorageManager.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  CollectionSequenceState,
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

export const COLLECTION_NUMBER_SEQUENCE_ENTITY =
  "COLLECTION_NUMBER_SEQUENCE";

// ============================================================
// STORAGE RECORD
// ============================================================

interface CollectionSequenceStorageRecord
  extends CollectionSequenceState {

  id: string;

  entity:
    typeof COLLECTION_NUMBER_SEQUENCE_ENTITY;
}

// ============================================================
// STORAGE ID
//
// One system-owned Collection sequence state exists per:
//
// Business + Branch + canonical Loan Number
//
// Historical visible Loan Numbers are not used as the
// Collection sequence root after a canonical binding exists.
// ============================================================

function buildCollectionSequenceId(
  businessId: string,
  branchId: string,
  canonicalLoanNumber: string,
): string {

  return [
    businessId.trim(),
    branchId.trim(),
    canonicalLoanNumber.trim(),
  ].join("::");
}

// ============================================================
// STORAGE RECORD BUILDER
// ============================================================

function toStorageRecord(
  state:
    CollectionSequenceState,
): CollectionSequenceStorageRecord {

  return {
    ...state,

    id:
      buildCollectionSequenceId(
        state.businessId,
        state.branchId,
        state.canonicalLoanNumber,
      ),

    entity:
      COLLECTION_NUMBER_SEQUENCE_ENTITY,
  };
}

// ============================================================
// DOMAIN MAPPER
// ============================================================

function fromStorageRecord(
  record:
    CollectionSequenceStorageRecord,
): CollectionSequenceState {

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

function buildCollectionSequenceQuery(
  businessId: string,
  branchId: string,
  canonicalLoanNumber: string,
): StorageQuery {

  return {
    entity:
      COLLECTION_NUMBER_SEQUENCE_ENTITY,

    id:
      buildCollectionSequenceId(
        businessId,
        branchId,
        canonicalLoanNumber,
      ),
  };
}

// ============================================================
// IDENTITY VALIDATION
// ============================================================

function validateIdentity(
  businessId: string,
  branchId: string,
  canonicalLoanNumber: string,
): string | null {

  if (!businessId?.trim()) {
    return "Business ID is required.";
  }

  if (!branchId?.trim()) {
    return "Branch ID is required.";
  }

  if (!canonicalLoanNumber?.trim()) {
    return "Canonical Loan Number is required.";
  }

  return null;
}

// ============================================================
// REPOSITORY
// ============================================================

export class CollectionSequenceRepository {

  // ==========================================================
  // FIND BY LOAN
  // ==========================================================

  async findByLoan(
    businessId: string,
    branchId: string,
    canonicalLoanNumber: string,
  ): Promise<
    StorageResult<
      CollectionSequenceState | undefined
    >
  > {

    const validationError =
      validateIdentity(
        businessId,
        branchId,
        canonicalLoanNumber,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const result =
      await storageManager.get<
        CollectionSequenceStorageRecord
      >(
        buildCollectionSequenceQuery(
          businessId,
          branchId,
          canonicalLoanNumber,
        ),
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to load Collection sequence state.",
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
  // Used only when a Loan receives its first permanent
  // Collection sequence reservation.
  // ==========================================================

  async save(
    state:
      CollectionSequenceState,
    options?:
      RepositoryWriteOptions,
  ): Promise<
    StorageResult<
      CollectionSequenceState
    >
  > {

    const validationError =
      validateIdentity(
        state.businessId,
        state.branchId,
        state.canonicalLoanNumber,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const existing =
      await this.findByLoan(
        state.businessId,
        state.branchId,
        state.canonicalLoanNumber,
      );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ??
          "Unable to verify existing Collection sequence state.",
      };
    }

    if (existing.data) {
      return {
        success: false,

        error:
          "Collection sequence state already exists for this Loan.",
      };
    }

    const result =
      await storageManager.save<
        CollectionSequenceStorageRecord
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
          "Unable to save Collection sequence state.",
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
  // lastIssuedCollectionSequence is system-owned mutable state.
  //
  // Sequence rules and immutability are enforced by the
  // Numbering Service, not by this storage repository.
  // ==========================================================

  async update(
    state:
      CollectionSequenceState,
    options?:
      RepositoryWriteOptions,
  ): Promise<
    StorageResult<
      CollectionSequenceState
    >
  > {

    const validationError =
      validateIdentity(
        state.businessId,
        state.branchId,
        state.canonicalLoanNumber,
      );

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const result =
      await storageManager.update<
        CollectionSequenceStorageRecord
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
          "Unable to update Collection sequence state.",
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

export const collectionSequenceRepository =
  new CollectionSequenceRepository();

// ============================================================
// END
// ============================================================
