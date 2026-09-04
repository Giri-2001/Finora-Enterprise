/* ===========================================================
   FINORA ENTERPRISE OS™

   LOAN DOCUMENT DRAFT STORE

   MODULE  : Loans
   LAYER   : Temporary Draft Binary Persistence
   VERSION : 1.0

   RESPONSIBILITY:

   - Persist in-progress Loan document binary data
   - Keep large data URLs out of localStorage draft JSON
   - Scope document drafts to authenticated FINORA context
   - Restore document evidence after reload / app restart
   - Clear temporary document evidence after Reject / Create

   IMPORTANT:

   - IndexedDB is used only for temporary Loan draft evidence.
   - Final Loan document persistence remains owned by the
     existing Loan document persistence workflow.
   - No Loan business logic belongs here.
=========================================================== */

import { getSession } from "../../../../../store/authStore";

import type {
  LoanWorkspaceDraftMode,
} from "./loanWorkspaceDraft";

/* ============================================================
   CONSTANTS
============================================================ */

const DATABASE_NAME =
  "finora_loan_document_drafts";

const DATABASE_VERSION =
  1;

const STORE_NAME =
  "documents";

/* ============================================================
   TYPES
============================================================ */

interface LoanDocumentDraftRecord {
  key: string;

  scopeKey: string;

  mode: LoanWorkspaceDraftMode;

  documentId: string;

  dataUrl: string;

  updatedAt: string;
}

/* ============================================================
   ENVIRONMENT
============================================================ */

function canUseIndexedDb(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.indexedDB !== "undefined"
  );
}

/* ============================================================
   AUTHENTICATED SCOPE
============================================================ */

function getDocumentDraftScopeKey():
  string | null {
  const session =
    getSession();

  if (!session) {
    return null;
  }

  const ownerId =
    String(session.ownerId ?? "").trim();

  const businessId =
    String(session.businessId ?? "").trim();

  const branchId =
    String(session.branchId ?? "").trim();

  const dataContext =
    String(session.dataContext ?? "REAL")
      .trim()
      .toUpperCase();

  const demoId =
    String(session.demoId ?? "").trim();

  if (
    !ownerId ||
    !businessId ||
    !branchId
  ) {
    return null;
  }

  return [
    dataContext,
    demoId || "NO_DEMO",
    ownerId,
    businessId,
    branchId,
  ]
    .map((value) =>
      encodeURIComponent(value),
    )
    .join(":");
}

/* ============================================================
   KEYS
============================================================ */

function buildDocumentDraftKey(
  scopeKey: string,
  mode: LoanWorkspaceDraftMode,
  documentId: string,
): string {
  return [
    scopeKey,
    mode,
    encodeURIComponent(documentId),
  ].join(":");
}

/* ============================================================
   DATABASE
============================================================ */

function openDatabase():
  Promise<IDBDatabase> {
  return new Promise(
    (resolve, reject) => {
      if (!canUseIndexedDb()) {
        reject(
          new Error(
            "IndexedDB is not available.",
          ),
        );

        return;
      }

      const request =
        window.indexedDB.open(
          DATABASE_NAME,
          DATABASE_VERSION,
        );

      request.onupgradeneeded = () => {
        const database =
          request.result;

        if (
          !database.objectStoreNames.contains(
            STORE_NAME,
          )
        ) {
          const store =
            database.createObjectStore(
              STORE_NAME,
              {
                keyPath: "key",
              },
            );

          store.createIndex(
            "scopeMode",
            [
              "scopeKey",
              "mode",
            ],
            {
              unique: false,
            },
          );
        }
      };

      request.onsuccess = () => {
        resolve(
          request.result,
        );
      };

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              "Unable to open Loan document draft database.",
            ),
        );
      };

      request.onblocked = () => {
        reject(
          new Error(
            "Loan document draft database upgrade is blocked.",
          ),
        );
      };
    },
  );
}

/* ============================================================
   REQUEST HELPER
============================================================ */

function requestToPromise<T>(
  request: IDBRequest<T>,
): Promise<T> {
  return new Promise(
    (resolve, reject) => {
      request.onsuccess = () => {
        resolve(
          request.result,
        );
      };

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              "IndexedDB request failed.",
            ),
        );
      };
    },
  );
}

/* ============================================================
   TRANSACTION HELPER
============================================================ */

function waitForTransaction(
  transaction: IDBTransaction,
): Promise<void> {
  return new Promise(
    (resolve, reject) => {
      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(
          transaction.error ??
            new Error(
              "IndexedDB transaction failed.",
            ),
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ??
            new Error(
              "IndexedDB transaction aborted.",
            ),
        );
      };
    },
  );
}

/* ============================================================
   SAVE DOCUMENT
============================================================ */

export async function saveLoanDocumentDraft(
  mode: LoanWorkspaceDraftMode,
  documentId: string,
  dataUrl: string,
): Promise<boolean> {
  const normalizedDocumentId =
    String(documentId ?? "").trim();

  const normalizedDataUrl =
    String(dataUrl ?? "").trim();

  const scopeKey =
    getDocumentDraftScopeKey();

  if (
    !scopeKey ||
    !normalizedDocumentId ||
    !normalizedDataUrl ||
    !canUseIndexedDb()
  ) {
    return false;
  }

  let database:
    IDBDatabase | null = null;

  try {
    database =
      await openDatabase();

    const transaction =
      database.transaction(
        STORE_NAME,
        "readwrite",
      );

    const store =
      transaction.objectStore(
        STORE_NAME,
      );

    const record:
      LoanDocumentDraftRecord = {
        key:
          buildDocumentDraftKey(
            scopeKey,
            mode,
            normalizedDocumentId,
          ),

        scopeKey,

        mode,

        documentId:
          normalizedDocumentId,

        dataUrl:
          normalizedDataUrl,

        updatedAt:
          new Date().toISOString(),
      };

    store.put(
      record,
    );

    await waitForTransaction(
      transaction,
    );

    return true;
  } catch (error) {
    console.error(
      "FINORA LOAN DOCUMENT DRAFT SAVE ERROR:",
      error,
    );

    return false;
  } finally {
    database?.close();
  }
}

/* ============================================================
   LOAD DOCUMENT
============================================================ */

export async function loadLoanDocumentDraft(
  mode: LoanWorkspaceDraftMode,
  documentId: string,
): Promise<string | null> {
  const normalizedDocumentId =
    String(documentId ?? "").trim();

  const scopeKey =
    getDocumentDraftScopeKey();

  if (
    !scopeKey ||
    !normalizedDocumentId ||
    !canUseIndexedDb()
  ) {
    return null;
  }

  let database:
    IDBDatabase | null = null;

  try {
    database =
      await openDatabase();

    const transaction =
      database.transaction(
        STORE_NAME,
        "readonly",
      );

    const store =
      transaction.objectStore(
        STORE_NAME,
      );

    const key =
      buildDocumentDraftKey(
        scopeKey,
        mode,
        normalizedDocumentId,
      );

    const record =
      await requestToPromise(
        store.get(key),
      ) as
        | LoanDocumentDraftRecord
        | undefined;

    await waitForTransaction(
      transaction,
    );

    if (
      !record ||
      typeof record.dataUrl !== "string" ||
      !record.dataUrl
    ) {
      return null;
    }

    return record.dataUrl;
  } catch (error) {
    console.error(
      "FINORA LOAN DOCUMENT DRAFT LOAD ERROR:",
      error,
    );

    return null;
  } finally {
    database?.close();
  }
}

/* ============================================================
   DELETE DOCUMENT
============================================================ */

export async function deleteLoanDocumentDraft(
  mode: LoanWorkspaceDraftMode,
  documentId: string,
): Promise<void> {
  const normalizedDocumentId =
    String(documentId ?? "").trim();

  const scopeKey =
    getDocumentDraftScopeKey();

  if (
    !scopeKey ||
    !normalizedDocumentId ||
    !canUseIndexedDb()
  ) {
    return;
  }

  let database:
    IDBDatabase | null = null;

  try {
    database =
      await openDatabase();

    const transaction =
      database.transaction(
        STORE_NAME,
        "readwrite",
      );

    transaction
      .objectStore(STORE_NAME)
      .delete(
        buildDocumentDraftKey(
          scopeKey,
          mode,
          normalizedDocumentId,
        ),
      );

    await waitForTransaction(
      transaction,
    );
  } catch (error) {
    console.error(
      "FINORA LOAN DOCUMENT DRAFT DELETE ERROR:",
      error,
    );
  } finally {
    database?.close();
  }
}

/* ============================================================
   CLEAR WORKSPACE DOCUMENTS
============================================================ */

export async function clearLoanDocumentDrafts(
  mode: LoanWorkspaceDraftMode,
): Promise<void> {
  const scopeKey =
    getDocumentDraftScopeKey();

  if (
    !scopeKey ||
    !canUseIndexedDb()
  ) {
    return;
  }

  let database:
    IDBDatabase | null = null;

  try {
    database =
      await openDatabase();

    const transaction =
      database.transaction(
        STORE_NAME,
        "readwrite",
      );

    const store =
      transaction.objectStore(
        STORE_NAME,
      );

    const index =
      store.index(
        "scopeMode",
      );

    const range =
      IDBKeyRange.only(
        [
          scopeKey,
          mode,
        ],
      );

    const cursorRequest =
      index.openKeyCursor(
        range,
      );

    await new Promise<void>(
      (resolve, reject) => {
        cursorRequest.onsuccess = () => {
          const cursor =
            cursorRequest.result;

          if (!cursor) {
            resolve();
            return;
          }

          store.delete(
            cursor.primaryKey,
          );

          cursor.continue();
        };

        cursorRequest.onerror = () => {
          reject(
            cursorRequest.error ??
              new Error(
                "Unable to clear Loan document drafts.",
              ),
          );
        };
      },
    );

    await waitForTransaction(
      transaction,
    );
  } catch (error) {
    console.error(
      "FINORA LOAN DOCUMENT DRAFT CLEAR ERROR:",
      error,
    );
  } finally {
    database?.close();
  }
}

/* ============================================================
   END
============================================================ */