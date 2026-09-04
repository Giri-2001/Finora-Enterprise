// ============================================================
// FINORA ENTERPRISE OS™
//
// REJECTED LOAN APPLICATION SERVICE
//
// RESPONSIBILITY:
//
// - Build permanent rejected Loan Application records.
// - Validate authenticated owner/business/branch scope.
// - Preserve rejection actor and system audit time.
// - Load branch-scoped rejected applications.
// - Mark an application as reopened without deleting history.
//
// IMPORTANT:
//
// - No UI logic.
// - No direct storage access.
// - No Loan master creation.
// - No Loan number reservation.
// - Document binary archival belongs to its dedicated service.
// ============================================================

import { getSession } from "../../store/authStore";

import type {
  LoanApplicationSnapshot,
  RejectedLoanApplication,
} from "../../types/loan-applications/rejectedLoanApplication.types";

import {
  createRejectedLoanApplicationRecord,
  getRejectedLoanApplicationRecordById,
  getRejectedLoanApplicationRecords,
  updateRejectedLoanApplicationRecord,
} from "../../repositories/loan-applications/rejectedLoanApplicationRepository";

import type {
  StorageResult,
} from "../../storage/storage.types";

// ============================================================
// INPUT
// ============================================================

export interface RejectedLoanApplicationIdentity {
  id: string;

  applicationReference: string;
}

export interface CreateRejectedLoanApplicationInput {
  identity: RejectedLoanApplicationIdentity;
  snapshot: LoanApplicationSnapshot;

  rejectionReason: string;

  customerId: string;

  customerName: string;

  customerPhone: string;

  requestedAmount: number;

  documentIds: string[];
}

// ============================================================
// SESSION SCOPE
// ============================================================

interface RejectedLoanApplicationSessionScope {
  ownerId: string;

  businessId: string;

  branchId: string;

  dataContext: string;

  demoId?: string;

  actor: string;
}

function getRequiredSessionScope():
  StorageResult<RejectedLoanApplicationSessionScope> {
  const session =
    getSession();

  if (!session) {
    return {
      success: false,

      error:
        "An authenticated FINORA session is required.",
    };
  }

  const ownerId =
    String(session.ownerId ?? "").trim();

  const businessId =
    String(session.businessId ?? "").trim();

  const branchId =
    String(session.branchId ?? "").trim();

  if (!ownerId || !businessId || !branchId) {
    return {
      success: false,

      error:
        "The active FINORA business access scope is incomplete.",
    };
  }

  const actor =
    String(
      session.fullName ||
      session.username ||
      session.userId ||
      "",
    ).trim();

  if (!actor) {
    return {
      success: false,

      error:
        "The authenticated FINORA user identity is incomplete.",
    };
  }

  return {
    success: true,

    data: {
      ownerId,

      businessId,

      branchId,

      dataContext:
        String(session.dataContext ?? "REAL")
          .trim()
          .toUpperCase(),

      demoId:
        String(session.demoId ?? "").trim() ||
        undefined,

      actor,
    },
  };
}

// ============================================================
// IDENTITY
// ============================================================

export function createRejectedLoanApplicationIdentity(): {
  id: string;
  applicationReference: string;
} {
  const randomPart =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now()}${Math.random().toString(36).slice(2)}`;

  const timestamp =
    Date.now();

  return {
    id:
      `REJECTED-LOAN-APPLICATION-${timestamp}-${randomPart}`,

    applicationReference:
      `RLA-${timestamp}-${randomPart.slice(0, 8).toUpperCase()}`,
  };
}

// ============================================================
// CREATE REJECTED APPLICATION
// ============================================================

export async function createRejectedLoanApplication(
  input: CreateRejectedLoanApplicationInput,
): Promise<StorageResult<RejectedLoanApplication>> {
  const scopeResult =
    getRequiredSessionScope();

  if (!scopeResult.success || !scopeResult.data) {
    return {
      success: false,

      error:
        scopeResult.error ??
        "Unable to resolve the active FINORA scope.",
    };
  }

  const rejectionReason =
    String(input.rejectionReason ?? "").trim();

  if (!rejectionReason) {
    return {
      success: false,

      error:
        "A rejection reason is required.",
    };
  }

  if (
    input.snapshot.version !== 1 ||
    (
      input.snapshot.mode !== "STANDARD" &&
      input.snapshot.mode !== "GOLD"
    )
  ) {
    return {
      success: false,

      error:
        "The Loan Application snapshot is invalid.",
    };
  }

  const identity =
    input.identity;

  if (
    !String(identity?.id ?? "").trim() ||
    !String(identity?.applicationReference ?? "").trim()
  ) {
    return {
      success: false,

      error:
        "Rejected Loan Application identity is required.",
    };
  }

  const timestamp =
    new Date().toISOString();

  const requestedAmountValue =
    Number(input.requestedAmount);

  const documentIds =
    Array.from(
      new Set(
        (input.documentIds ?? [])
          .map((value) =>
            String(value ?? "").trim(),
          )
          .filter(Boolean),
      ),
    );

  const application:
    RejectedLoanApplication = {
      version: 1,

      id:
        identity.id,

      applicationReference:
        identity.applicationReference,

      status:
        "REJECTED",

      mode:
        input.snapshot.mode,

      ownerId:
        scopeResult.data.ownerId,

      businessId:
        scopeResult.data.businessId,

      branchId:
        scopeResult.data.branchId,

      dataContext:
        scopeResult.data.dataContext,

      demoId:
        scopeResult.data.demoId,

      customerId:
        String(input.customerId ?? "").trim(),

      customerName:
        String(input.customerName ?? "").trim() || "--",

      customerPhone:
        String(input.customerPhone ?? "").trim(),

      requestedAmount:
        Number.isFinite(requestedAmountValue)
          ? Math.max(0, requestedAmountValue)
          : 0,

      rejectionReason,

      rejectedAt:
        timestamp,

      rejectedBy:
        scopeResult.data.actor,

      snapshot:
        input.snapshot,

      documentIds,

      reopenCount:
        0,

      createdAt:
        timestamp,

      updatedAt:
        timestamp,
    };

  return createRejectedLoanApplicationRecord(
    application,
  );
}

// ============================================================
// LIST
// ============================================================

export async function fetchRejectedLoanApplications():
  Promise<StorageResult<RejectedLoanApplication[]>> {
  const scopeResult =
    getRequiredSessionScope();

  if (!scopeResult.success || !scopeResult.data) {
    return {
      success: false,

      error:
        scopeResult.error ??
        "Unable to resolve the active FINORA scope.",
    };
  }

  return getRejectedLoanApplicationRecords(
    scopeResult.data.businessId,
    scopeResult.data.branchId,
  );
}

// ============================================================
// GET ONE
// ============================================================

export async function fetchRejectedLoanApplication(
  applicationId: string,
): Promise<StorageResult<RejectedLoanApplication | undefined>> {
  const scopeResult =
    getRequiredSessionScope();

  if (!scopeResult.success || !scopeResult.data) {
    return {
      success: false,

      error:
        scopeResult.error ??
        "Unable to resolve the active FINORA scope.",
    };
  }

  return getRejectedLoanApplicationRecordById(
    applicationId,
    scopeResult.data.businessId,
    scopeResult.data.branchId,
  );
}

// ============================================================
// MARK REOPENED
// ============================================================

export async function markRejectedLoanApplicationReopened(
  applicationId: string,
): Promise<StorageResult<RejectedLoanApplication>> {
  const scopeResult =
    getRequiredSessionScope();

  if (!scopeResult.success || !scopeResult.data) {
    return {
      success: false,

      error:
        scopeResult.error ??
        "Unable to resolve the active FINORA scope.",
    };
  }

  const existingResult =
    await getRejectedLoanApplicationRecordById(
      applicationId,
      scopeResult.data.businessId,
      scopeResult.data.branchId,
    );

  if (!existingResult.success) {
    return {
      success: false,

      error:
        existingResult.error ??
        "Unable to load the rejected Loan Application.",
    };
  }

  if (!existingResult.data) {
    return {
      success: false,

      error:
        "Rejected Loan Application was not found.",
    };
  }

  const updatedApplication:
    RejectedLoanApplication = {
      ...existingResult.data,

      status:
        "REOPENED",

      reopenCount:
        Math.max(
          0,
          Number(existingResult.data.reopenCount) || 0,
        ) + 1,

      reopenedAt:
        new Date().toISOString(),

      reopenedBy:
        scopeResult.data.actor,

      updatedAt:
        new Date().toISOString(),
    };

  return updateRejectedLoanApplicationRecord(
    updatedApplication,
  );
}

// ============================================================
// END
// ============================================================
