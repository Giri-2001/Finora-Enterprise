// ============================================================
// FINORA ENTERPRISE OS™
//
// REJECTED LOAN APPLICATION REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist rejected Loan Application records through StorageManager.
// - Keep rejected applications separate from Loan master records.
// - Enforce active business and branch filtering.
// - Preserve immutable creation audit timestamps.
// - Support controlled reopen-status updates.
//
// IMPORTANT:
//
// - No UI logic.
// - No direct localStorage access.
// - No document binary persistence.
// - No Loan number reservation.
// - StorageManager owns physical persistence and owner/demo scope.
// ============================================================

import type {
  RejectedLoanApplication,
} from "../../types/loan-applications/rejectedLoanApplication.types";

import { storageManager } from "../../storage/storageManager";

import type {
  StorageResult,
} from "../../storage/storage.types";

// ============================================================
// ENTITY
// ============================================================

const REJECTED_LOAN_APPLICATION_ENTITY =
  "REJECTED_LOAN_APPLICATION";

interface RejectedLoanApplicationStorageRecord
  extends RejectedLoanApplication {
  entity: typeof REJECTED_LOAN_APPLICATION_ENTITY;
}

// ============================================================
// MAPPERS
// ============================================================

function toStorageRecord(
  application: RejectedLoanApplication,
): RejectedLoanApplicationStorageRecord {
  return {
    ...application,

    entity:
      REJECTED_LOAN_APPLICATION_ENTITY,
  };
}

function fromStorageRecord(
  record: RejectedLoanApplicationStorageRecord,
): RejectedLoanApplication {
  const {
    entity: _entity,
    ...application
  } = record;

  void _entity;

  return application;
}

// ============================================================
// VALIDATION
// ============================================================

function validateApplicationIdentity(
  application: RejectedLoanApplication,
): string | undefined {
  if (!String(application.id ?? "").trim()) {
    return "Rejected Loan Application ID is required.";
  }

  if (!String(application.applicationReference ?? "").trim()) {
    return "Rejected Loan Application reference is required.";
  }

  if (!String(application.ownerId ?? "").trim()) {
    return "Rejected Loan Application owner ID is required.";
  }

  if (!String(application.businessId ?? "").trim()) {
    return "Rejected Loan Application business ID is required.";
  }

  if (!String(application.branchId ?? "").trim()) {
    return "Rejected Loan Application branch ID is required.";
  }

  return undefined;
}

// ============================================================
// CREATE
// ============================================================

export async function createRejectedLoanApplicationRecord(
  application: RejectedLoanApplication,
): Promise<StorageResult<RejectedLoanApplication>> {
  const validationError =
    validateApplicationIdentity(application);

  if (validationError) {
    return {
      success: false,

      error: validationError,
    };
  }

  const existing =
    await storageManager.get<RejectedLoanApplicationStorageRecord>({
      entity:
        REJECTED_LOAN_APPLICATION_ENTITY,

      id:
        application.id,
    });

  if (!existing.success) {
    return {
      success: false,

      error:
        existing.error ??
        "Unable to verify the rejected Loan Application.",
    };
  }

  if (existing.data) {
    return {
      success: false,

      error:
        "Rejected Loan Application with this ID already exists.",
    };
  }

  const systemTimestamp =
    new Date().toISOString();

  const normalizedApplication:
    RejectedLoanApplication = {
      ...application,

      createdAt:
        systemTimestamp,

      updatedAt:
        systemTimestamp,
    };

  const result =
    await storageManager.save<RejectedLoanApplicationStorageRecord>(
      toStorageRecord(normalizedApplication),
    );

  if (!result.success) {
    return {
      success: false,

      error:
        result.error ??
        "Unable to save the rejected Loan Application.",
    };
  }

  return {
    success: true,

    data:
      normalizedApplication,
  };
}

// ============================================================
// GET ALL FOR ACTIVE BUSINESS + BRANCH
// ============================================================

export async function getRejectedLoanApplicationRecords(
  businessId: string,
  branchId: string,
): Promise<StorageResult<RejectedLoanApplication[]>> {
  const normalizedBusinessId =
    String(businessId ?? "").trim();

  const normalizedBranchId =
    String(branchId ?? "").trim();

  if (!normalizedBusinessId || !normalizedBranchId) {
    return {
      success: false,

      error:
        "Business ID and Branch ID are required to load rejected applications.",
    };
  }

  const result =
    await storageManager.getAll<RejectedLoanApplicationStorageRecord>({
      entity:
        REJECTED_LOAN_APPLICATION_ENTITY,
    });

  if (!result.success) {
    return {
      success: false,

      error:
        result.error ??
        "Unable to load rejected Loan Applications.",
    };
  }

  const applications =
    (result.data ?? [])
      .map(fromStorageRecord)
      .filter(
        (application) =>
          application.businessId === normalizedBusinessId &&
          application.branchId === normalizedBranchId,
      )
      .sort(
        (left, right) =>
          Date.parse(right.rejectedAt) -
          Date.parse(left.rejectedAt),
      );

  return {
    success: true,

    data:
      applications,
  };
}

// ============================================================
// GET ONE
// ============================================================

export async function getRejectedLoanApplicationRecordById(
  applicationId: string,
  businessId: string,
  branchId: string,
): Promise<StorageResult<RejectedLoanApplication | undefined>> {
  const normalizedApplicationId =
    String(applicationId ?? "").trim();

  if (!normalizedApplicationId) {
    return {
      success: false,

      error:
        "Rejected Loan Application ID is required.",
    };
  }

  const result =
    await storageManager.get<RejectedLoanApplicationStorageRecord>({
      entity:
        REJECTED_LOAN_APPLICATION_ENTITY,

      id:
        normalizedApplicationId,
    });

  if (!result.success) {
    return {
      success: false,

      error:
        result.error ??
        "Unable to load the rejected Loan Application.",
    };
  }

  if (!result.data) {
    return {
      success: true,

      data:
        undefined,
    };
  }

  const application =
    fromStorageRecord(result.data);

  if (
    application.businessId !== String(businessId ?? "").trim() ||
    application.branchId !== String(branchId ?? "").trim()
  ) {
    return {
      success: true,

      data:
        undefined,
    };
  }

  return {
    success: true,

    data:
      application,
  };
}

// ============================================================
// UPDATE
// ============================================================

export async function updateRejectedLoanApplicationRecord(
  application: RejectedLoanApplication,
): Promise<StorageResult<RejectedLoanApplication>> {
  const validationError =
    validateApplicationIdentity(application);

  if (validationError) {
    return {
      success: false,

      error:
        validationError,
    };
  }

  const existing =
    await storageManager.get<RejectedLoanApplicationStorageRecord>({
      entity:
        REJECTED_LOAN_APPLICATION_ENTITY,

      id:
        application.id,
    });

  if (!existing.success) {
    return {
      success: false,

      error:
        existing.error ??
        "Unable to verify the rejected Loan Application update.",
    };
  }

  if (!existing.data) {
    return {
      success: false,

      error:
        "Rejected Loan Application was not found.",
    };
  }

  const existingApplication =
    fromStorageRecord(existing.data);

  const normalizedApplication:
    RejectedLoanApplication = {
      ...application,

      createdAt:
        existingApplication.createdAt,

      updatedAt:
        new Date().toISOString(),
    };

  const result =
    await storageManager.update<RejectedLoanApplicationStorageRecord>(
      toStorageRecord(normalizedApplication),
    );

  if (!result.success) {
    return {
      success: false,

      error:
        result.error ??
        "Unable to update the rejected Loan Application.",
    };
  }

  return {
    success: true,

    data:
      normalizedApplication,
  };
}

// ============================================================
// END
// ============================================================
