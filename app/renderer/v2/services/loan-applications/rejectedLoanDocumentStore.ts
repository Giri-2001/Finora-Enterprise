// ============================================================
// FINORA ENTERPRISE OS™
//
// REJECTED LOAN DOCUMENT STORE
//
// RESPONSIBILITY:
//
// - Persist rejected application document binary/data URL content.
// - Isolate documents by authenticated FINORA scope.
// - Isolate every rejected application by application ID.
// - Restore exact document content when an application is reopened.
//
// IMPORTANT:
//
// - Metadata remains inside RejectedLoanApplication.snapshot.
// - Large binary/data URL content must never enter localStorage.
// - No Loan business logic.
// - No Loan master persistence.
// - No direct relationship with approved Loan documents.
// ============================================================

import { getSession } from "../../store/authStore";

// ============================================================
// DATABASE
// ============================================================

const DATABASE_NAME =
  "finora_rejected_loan_documents";

const DATABASE_VERSION =
  1;

const STORE_NAME =
  "documents";

// ============================================================
// RECORD
// ============================================================

interface RejectedLoanDocumentRecord {
  key: string;

  scopeKey: string;

  applicationId: string;

  documentId: string;

  dataUrl: string;

  createdAt: string;

  updatedAt: string;
}

// ============================================================
// ENVIRONMENT
// ============================================================

function canUseIndexedDb(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.indexedDB !== "undefined"
  );
}

// ============================================================
// AUTHENTICATED SCOPE
// ============================================================

function getRejectedDocumentScopeKey():
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

  if (!ownerId || !businessId || !branchId) {
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

// ============================================================
// KEY
// ============================================================

function buildRejectedDocumentKey(
  scopeKey: string,
  applicationId: string,
  documentId: string,
): string {
  return [
    scopeKey,

    encodeURIComponent(applicationId),

    encodeURIComponent(documentId),
  ].join(":");
}

// ============================================================
// OPEN DATABASE
// ============================================================

function openDatabase():
  Promise<IDBDatabase | null> {
  if (!canUseIndexedDb()) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
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
                keyPath:
                  "key",
              },
            );

          store.createIndex(
            "scopeKey",
            "scopeKey",
            {
              unique:
                false,
            },
          );

          store.createIndex(
            "applicationId",
            "applicationId",
            {
              unique:
                false,
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
        resolve(null);
      };

      request.onblocked = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

// ============================================================
// SAVE
// ============================================================

export async function saveRejectedLoanDocument(
  applicationId: string,
  documentId: string,
  dataUrl: string,
): Promise<boolean> {
  const normalizedApplicationId =
    String(applicationId ?? "").trim();

  const normalizedDocumentId =
    String(documentId ?? "").trim();

  const normalizedDataUrl =
    String(dataUrl ?? "").trim();

  const scopeKey =
    getRejectedDocumentScopeKey();

  if (
    !scopeKey ||
    !normalizedApplicationId ||
    !normalizedDocumentId ||
    !normalizedDataUrl
  ) {
    return false;
  }

  const database =
    await openDatabase();

  if (!database) {
    return false;
  }

  const key =
    buildRejectedDocumentKey(
      scopeKey,
      normalizedApplicationId,
      normalizedDocumentId,
    );

  return new Promise((resolve) => {
    let settled =
      false;

    const settle = (
      result: boolean,
    ) => {
      if (settled) {
        return;
      }

      settled =
        true;

      database.close();

      resolve(result);
    };

    try {
      const transaction =
        database.transaction(
          STORE_NAME,
          "readwrite",
        );

      const store =
        transaction.objectStore(
          STORE_NAME,
        );

      const getRequest =
        store.get(key);

      getRequest.onsuccess = () => {
        const existing =
          getRequest.result as
            RejectedLoanDocumentRecord | undefined;

        const timestamp =
          new Date().toISOString();

        const record:
          RejectedLoanDocumentRecord = {
          key,

          scopeKey,

          applicationId:
            normalizedApplicationId,

          documentId:
            normalizedDocumentId,

          dataUrl:
            normalizedDataUrl,

          createdAt:
            existing?.createdAt ??
            timestamp,

          updatedAt:
            timestamp,
        };

        store.put(record);
      };

      getRequest.onerror = () => {
        transaction.abort();
      };

      transaction.oncomplete = () => {
        settle(true);
      };

      transaction.onerror = () => {
        settle(false);
      };

      transaction.onabort = () => {
        settle(false);
      };
    } catch {
      settle(false);
    }
  });
}

// ============================================================
// LOAD
// ============================================================

export async function loadRejectedLoanDocument(
  applicationId: string,
  documentId: string,
): Promise<string | null> {
  const normalizedApplicationId =
    String(applicationId ?? "").trim();

  const normalizedDocumentId =
    String(documentId ?? "").trim();

  const scopeKey =
    getRejectedDocumentScopeKey();

  if (
    !scopeKey ||
    !normalizedApplicationId ||
    !normalizedDocumentId
  ) {
    return null;
  }

  const database =
    await openDatabase();

  if (!database) {
    return null;
  }

  const key =
    buildRejectedDocumentKey(
      scopeKey,
      normalizedApplicationId,
      normalizedDocumentId,
    );

  return new Promise((resolve) => {
    let settled =
      false;

    let loadedDataUrl:
      string | null = null;

    const settle = (
      result: string | null,
    ) => {
      if (settled) {
        return;
      }

      settled =
        true;

      database.close();

      resolve(result);
    };

    try {
      const transaction =
        database.transaction(
          STORE_NAME,
          "readonly",
        );

      const store =
        transaction.objectStore(
          STORE_NAME,
        );

      const request =
        store.get(key);

      request.onsuccess = () => {
        const record =
          request.result as
            RejectedLoanDocumentRecord | undefined;

        loadedDataUrl =
          typeof record?.dataUrl === "string" &&
          record.dataUrl.trim()
            ? record.dataUrl
            : null;
      };

      request.onerror = () => {
        settle(null);
      };

      transaction.oncomplete = () => {
        settle(
          loadedDataUrl,
        );
      };

      transaction.onerror = () => {
        settle(null);
      };

      transaction.onabort = () => {
        settle(null);
      };
    } catch {
      settle(null);
    }
  });
}

// ============================================================
// END
// ============================================================
