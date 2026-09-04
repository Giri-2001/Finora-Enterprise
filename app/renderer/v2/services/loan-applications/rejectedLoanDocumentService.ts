// ============================================================
// FINORA ENTERPRISE OS™
//
// REJECTED LOAN DOCUMENT SERVICE
//
// RESPONSIBILITY:
//
// - Copy active Loan draft documents into rejected archive storage.
// - Restore rejected document content into an active Loan draft.
// - Preserve external durable document URLs without duplication.
// - Fail closed when required document content cannot be preserved.
//
// IMPORTANT:
//
// - Source active draft content is stored in Loan draft IndexedDB.
// - Rejected content is stored in a separate durable IndexedDB.
// - Metadata stays inside the application snapshot.
// - No UI logic.
// ============================================================

import type {
  LoanApplicationMode,
} from "../../types/loan-applications/rejectedLoanApplication.types";

import {
  loadLoanDocumentDraft,
  saveLoanDocumentDraft,
} from "../../components/customers/office/CustomerOffice/components/loanDocumentDraftStore";

import {
  loadRejectedLoanDocument,
  saveRejectedLoanDocument,
} from "./rejectedLoanDocumentStore";

import type {
  StorageResult,
} from "../../storage/storage.types";

// ============================================================
// DOCUMENT CONTRACT
// ============================================================

export interface ArchivableLoanDocument {
  id: string;

  dataUrl?: string;

  url?: string;
}

export interface RejectedLoanDocumentTransferResult {
  archivedOrRestoredDocumentIds: string[];
}

// ============================================================
// HELPERS
// ============================================================

function normalizeDocuments(
  documents: ArchivableLoanDocument[],
): ArchivableLoanDocument[] {
  const uniqueDocuments =
    new Map<string, ArchivableLoanDocument>();

  for (const document of documents ?? []) {
    const id =
      String(document?.id ?? "").trim();

    if (!id) {
      continue;
    }

    uniqueDocuments.set(
      id,
      {
        ...document,

        id,
      },
    );
  }

  return Array.from(
    uniqueDocuments.values(),
  );
}

function hasDurableExternalUrl(
  document: ArchivableLoanDocument,
): boolean {
  const url =
    String(document.url ?? "").trim();

  return Boolean(
    url &&
    !url.startsWith("blob:") &&
    !url.startsWith("data:"),
  );
}

// ============================================================
// ARCHIVE ACTIVE DRAFT DOCUMENTS
// ============================================================

export async function archiveRejectedLoanDocuments(
  applicationId: string,
  mode: LoanApplicationMode,
  documents: ArchivableLoanDocument[],
): Promise<StorageResult<RejectedLoanDocumentTransferResult>> {
  const normalizedApplicationId =
    String(applicationId ?? "").trim();

  if (!normalizedApplicationId) {
    return {
      success: false,

      error:
        "Rejected Loan Application ID is required for document archival.",
    };
  }

  const normalizedDocuments =
    normalizeDocuments(documents);

  const archivedDocumentIds:
    string[] = [];

  const failedDocumentIds:
    string[] = [];

  for (const document of normalizedDocuments) {
    const directDataUrl =
      String(document.dataUrl ?? "").trim();

    const sourceDataUrl =
      directDataUrl ||
      await loadLoanDocumentDraft(
        mode,
        document.id,
      ) ||
      "";

    if (!sourceDataUrl) {
      if (hasDurableExternalUrl(document)) {
        archivedDocumentIds.push(
          document.id,
        );

        continue;
      }

      failedDocumentIds.push(
        document.id,
      );

      continue;
    }

    const saved =
      await saveRejectedLoanDocument(
        normalizedApplicationId,
        document.id,
        sourceDataUrl,
      );

    if (!saved) {
      failedDocumentIds.push(
        document.id,
      );

      continue;
    }

    archivedDocumentIds.push(
      document.id,
    );
  }

  if (failedDocumentIds.length > 0) {
    return {
      success: false,

      error:
        `Unable to preserve rejected documents: ${failedDocumentIds.join(", ")}.`,
    };
  }

  return {
    success: true,

    data: {
      archivedOrRestoredDocumentIds:
        archivedDocumentIds,
    },
  };
}

// ============================================================
// RESTORE REJECTED DOCUMENTS INTO ACTIVE DRAFT
// ============================================================

export async function restoreRejectedLoanDocuments(
  applicationId: string,
  mode: LoanApplicationMode,
  documents: ArchivableLoanDocument[],
): Promise<StorageResult<RejectedLoanDocumentTransferResult>> {
  const normalizedApplicationId =
    String(applicationId ?? "").trim();

  if (!normalizedApplicationId) {
    return {
      success: false,

      error:
        "Rejected Loan Application ID is required for document restoration.",
    };
  }

  const normalizedDocuments =
    normalizeDocuments(documents);

  const restoredDocumentIds:
    string[] = [];

  const failedDocumentIds:
    string[] = [];

  for (const document of normalizedDocuments) {
    const archivedDataUrl =
      await loadRejectedLoanDocument(
        normalizedApplicationId,
        document.id,
      );

    if (!archivedDataUrl) {
      if (hasDurableExternalUrl(document)) {
        restoredDocumentIds.push(
          document.id,
        );

        continue;
      }

      failedDocumentIds.push(
        document.id,
      );

      continue;
    }

    const saved =
      await saveLoanDocumentDraft(
        mode,
        document.id,
        archivedDataUrl,
      );

    if (!saved) {
      failedDocumentIds.push(
        document.id,
      );

      continue;
    }

    restoredDocumentIds.push(
      document.id,
    );
  }

  if (failedDocumentIds.length > 0) {
    return {
      success: false,

      error:
        `Unable to restore rejected documents: ${failedDocumentIds.join(", ")}.`,
    };
  }

  return {
    success: true,

    data: {
      archivedOrRestoredDocumentIds:
        restoredDocumentIds,
    },
  };
}

// ============================================================
// END
// ============================================================
