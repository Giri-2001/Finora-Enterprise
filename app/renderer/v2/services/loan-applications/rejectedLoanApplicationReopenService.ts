// ============================================================
// FINORA ENTERPRISE OS™
//
// REJECTED LOAN APPLICATION REOPEN SERVICE
//
// RESPONSIBILITY:
//
// - Restore a rejected Loan Application into Loan Studio draft.
// - Restore archived document binaries into active draft storage.
// - Prevent silent replacement of an existing active draft.
// - Reset terminal disbursement values before revalidation.
// - Mark the rejected application as reopened only after restore.
//
// IMPORTANT:
//
// - Reopened applications always return to Step 1.
// - No finalized Loan number is reused.
// - No disbursement is performed here.
// - Existing validation and approval workflow remains authoritative.
// ============================================================

import type {
  RejectedLoanApplication,
} from "../../types/loan-applications/rejectedLoanApplication.types";

import type {
  StorageResult,
} from "../../storage/storage.types";

import {
  fetchRejectedLoanApplication,
  markRejectedLoanApplicationReopened,
} from "./rejectedLoanApplicationService";

import {
  restoreRejectedLoanDocuments,
  type ArchivableLoanDocument,
} from "./rejectedLoanDocumentService";

import {
  clearLoanWorkspaceDraft,
  loadActiveLoanWorkspaceDraft,
  saveLoanWorkspaceDraft,
} from "../../components/customers/office/CustomerOffice/components/loanWorkspaceDraft";

import {
  clearLoanDocumentDrafts,
} from "../../components/customers/office/CustomerOffice/components/loanDocumentDraftStore";

// ============================================================
// DOCUMENT METADATA
// ============================================================

function getSnapshotDocuments(
  application: RejectedLoanApplication,
): ArchivableLoanDocument[] {
  const value =
    application.snapshot.payload.documents;

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" &&
        item !== null &&
        !Array.isArray(item),
    )
    .map((item) => ({
      id:
        String(item.id ?? "").trim(),

      url:
        typeof item.url === "string"
          ? item.url
          : undefined,
    }))
    .filter(
      (item) =>
        Boolean(item.id),
    );
}

// ============================================================
// REOPEN
// ============================================================

export async function reopenRejectedLoanApplication(
  applicationId: string,
): Promise<StorageResult<RejectedLoanApplication>> {
  const normalizedApplicationId =
    String(applicationId ?? "").trim();

  if (!normalizedApplicationId) {
    return {
      success: false,

      error:
        "Rejected Loan Application ID is required.",
    };
  }

  /*
   * Never silently overwrite unfinished work.
   *
   * User must first Save Draft, Reject, Approve or explicitly
   * clear the currently active Loan Studio workspace.
   */
  const activeDraft =
    loadActiveLoanWorkspaceDraft();

  if (activeDraft) {
    return {
      success: false,

      error:
        "Another Loan Studio draft is already active. Complete or clear it before reopening this application.",
    };
  }

  const applicationResult =
    await fetchRejectedLoanApplication(
      normalizedApplicationId,
    );

  if (!applicationResult.success) {
    return {
      success: false,

      error:
        applicationResult.error ??
        "Unable to load the rejected Loan Application.",
    };
  }

  const application =
    applicationResult.data;

  if (!application) {
    return {
      success: false,

      error:
        "Rejected Loan Application was not found.",
    };
  }

  if (application.status !== "REJECTED") {
    return {
      success: false,

      error:
        "This rejected Loan Application has already been reopened.",
    };
  }

  const documents =
    getSnapshotDocuments(application);

  /*
   * Restore document content before publishing the active draft.
   * If this fails, no active workspace snapshot is created.
   */
  const documentRestoreResult =
    await restoreRejectedLoanDocuments(
      application.id,
      application.mode,
      documents,
    );

  if (!documentRestoreResult.success) {
    await clearLoanDocumentDrafts(
      application.mode,
    );

    return {
      success: false,

      error:
        documentRestoreResult.error ??
        "Unable to restore rejected Loan documents.",
    };
  }

  const timestamp =
    new Date().toISOString();

  const draftSaved =
    saveLoanWorkspaceDraft({
      ...application.snapshot,

      mode:
        application.mode,

      step:
        1,

      savedAt:
        timestamp,

      payload: {
        ...application.snapshot.payload,

        /*
         * A reopened application must pass through the complete
         * review and disbursement workflow again.
         */
        transactionStatus:
          "pending",

        disbursementSavedAt:
          "Not Saved",

        disbursementDraftStatus:
          "Draft",

        disbursementReceiptNumber:
          `DIS-${Date.now()}`,
      },
    });

  if (!draftSaved) {
    await clearLoanDocumentDrafts(
      application.mode,
    );

    return {
      success: false,

      error:
        "Unable to restore the rejected application into Loan Studio.",
    };
  }

  const reopenedResult =
    await markRejectedLoanApplicationReopened(
      application.id,
    );

  if (!reopenedResult.success || !reopenedResult.data) {
    clearLoanWorkspaceDraft(
      application.mode,
    );

    await clearLoanDocumentDrafts(
      application.mode,
    );

    return {
      success: false,

      error:
        reopenedResult.error ??
        "Unable to finalize the rejected application reopen audit.",
    };
  }

  return {
    success: true,

    data:
      reopenedResult.data,
  };
}

// ============================================================
// END
// ============================================================
