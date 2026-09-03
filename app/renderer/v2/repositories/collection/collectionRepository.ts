// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 COLLECTION REPOSITORY
//
// COLLECTION REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist CollectionReviewData through StorageManager
// - Preserve multiple collection transactions per Loan
// - Give every Collection transaction its own storage identity
// - Preserve loanId as the business relationship
// - Load persisted collection records
// - Keep collection business logic outside the repository
// - Prepare Collection persistence for LOCAL / USB / CLOUD
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No direct filesystem access.
// - No Electron IPC.
// - No Collection UI logic.
// - No payment calculations.
// - No loan calculations.
// - Storage access goes only through StorageManager.
//
// COLLECTION IDENTITY:
//
// - loanId identifies the related Loan.
// - A unique internal collection storage ID identifies the
//   individual Collection transaction.
//
// This is required because one Loan can have many collections:
//
//   Loan A
//      ├── Collection 1
//      ├── Collection 2
//      ├── Collection 3
//      └── ...
//
// IMPORTANT:
//
// The public CollectionReviewData contract remains unchanged.
// The internal storage ID is carried as an additional persisted
// property so existing Collection UI contracts do not need to
// be rewritten.
//
// VERSION : 2.1
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CollectionReviewData } from "../../components/collections/CollectionReviewData";

import { storageManager } from "../../storage/storageManager";

import type { StorageQuery } from "../../storage/storage.types";

// ============================================================
// CONSTANTS
// ============================================================

const COLLECTION_ENTITY = "COLLECTION";

// ============================================================
// TYPES
// ============================================================
//
// The CollectionReviewData interface intentionally remains the
// public application contract.
//
// Storage identity and entity are repository-level metadata only.
//
// ============================================================

type CollectionStorageRecord = CollectionReviewData & {
  id: string;

  entity: typeof COLLECTION_ENTITY;
};

// ============================================================
// COLLECTION STORAGE ID
// ============================================================
//
// IMPORTANT:
//
// loanId is NOT a storage record ID.
//
// loanId identifies the Loan to which the Collection belongs.
//
// Every individual Collection transaction requires its own
// persistent storage identity.
//
// ============================================================

function createCollectionId(collection: CollectionReviewData): string {
  // ----------------------------------------------------------
  // Prefer the persisted receipt number when available.
  //
  // Receipt numbers are generated per collection transaction
  // by PaymentDetails.
  //
  // A timestamp suffix guarantees uniqueness even if an
  // externally supplied receipt number is reused.
  // ----------------------------------------------------------

  const receiptNumber = String(collection.receiptNumber ?? "").trim();

  const timestamp = Date.now().toString(36);

  const randomPart = Math.random().toString(36).slice(2, 10);

  if (receiptNumber) {
    return ["COL", receiptNumber, timestamp, randomPart].join("-");
  }

  // ----------------------------------------------------------
  // Defensive fallback.
  // ----------------------------------------------------------

  const loanId = String(collection.loanId ?? "").trim();

  return ["COL", loanId || "UNKNOWN-LOAN", timestamp, randomPart].join("-");
}

// ============================================================
// RECORD → STORAGE RECORD
// ============================================================
//
// Converts the application collection into a storage record
// carrying its own unique identity and storage entity.
//
// ============================================================

function buildStorageRecord(
  collection: CollectionReviewData,
  id?: string,
): CollectionStorageRecord {
  return {
    ...collection,

    id: id || createCollectionId(collection),

    entity: COLLECTION_ENTITY,
  };
}

// ============================================================
// STORAGE RECORD → APPLICATION RECORD
// ============================================================
//
// The internal storage ID is intentionally not required by the
// public CollectionReviewData interface.
//
// The additional properties are preserved at runtime so future
// update operations can still identify the exact record.
//
// ============================================================

function toCollectionReviewData(
  record: CollectionStorageRecord,
): CollectionReviewData {
  return {
    ...record,
  };
}

// ============================================================
// COLLECTION QUERY
// ============================================================
//
// Query by the internal Collection storage ID.
//
// IMPORTANT:
//
// This is deliberately NOT loanId.
//
// Multiple Collection records may belong to the same Loan.
//
// ============================================================

function buildCollectionQuery(id?: string): StorageQuery {
  return {
    entity: COLLECTION_ENTITY,

    id,
  };
}

// ============================================================
// LEGACY COLLECTION LOOKUP
// ============================================================
//
// Older FINORA V2 collection records may have used loanId as
// their storage identity.
//
// We do not delete or rewrite those records here.
//
// They remain readable through getAll().
//
// For findById(), direct storage ID is preferred first.
// If a legacy record is requested by loanId, a compatible
// fallback is attempted.
//
// IMPORTANT:
//
// New records are ALWAYS stored with unique Collection IDs.
// ============================================================

async function findLegacyCollectionByLoanId(
  loanId: string,
): Promise<CollectionReviewData | null> {
  if (!loanId) {
    return null;
  }

  const result = await storageManager.getAll<CollectionStorageRecord>(
    buildCollectionQuery(),
  );

  if (!result.success || !result.data) {
    return null;
  }

  // ----------------------------------------------------------
  // Find records whose business relationship is the requested
  // loan.
  //
  // If multiple records exist, return the newest one.
  // ----------------------------------------------------------

  const matchingRecords = result.data
    .filter((record) => String(record.loanId ?? "") === loanId)
    .sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt || "").getTime();

      const bTime = new Date(b.updatedAt || b.createdAt || "").getTime();

      return bTime - aTime;
    });

  const latest = matchingRecords[0];

  return latest ? toCollectionReviewData(latest) : null;
}

// ============================================================
// COLLECTION REPOSITORY
// ============================================================

export class CollectionRepository {
  // ==========================================================
  // GET ALL
  // ==========================================================

  async getAll(): Promise<CollectionReviewData[]> {
    try {
      const result = await storageManager.getAll<CollectionStorageRecord>(
        buildCollectionQuery(),
      );

      if (!result.success || !result.data) {
        return [];
      }

      return result.data.map(toCollectionReviewData);
    } catch {
      return [];
    }
  }

  // ==========================================================
  // SAVE
  // ==========================================================
  //
  // IMPORTANT:
  //
  // A Loan may have unlimited Collection transactions.
  //
  // Therefore:
  //
  // - DO NOT check loanId for duplicate records.
  // - DO NOT use loanId as the storage ID.
  // - Generate a unique Collection storage ID.
  //
  // Existing Collection behavior:
  //
  // - Collection is automatically Approved.
  // - createdAt is always generated from the system clock.
  // - updatedAt is always refreshed.
  //
  // Storage requirement:
  //
  // - Every persisted record carries entity = COLLECTION.
  //
  // ==========================================================

  async save(collection: CollectionReviewData): Promise<CollectionReviewData> {
    if (!collection.loanId) {
      throw new Error(
        "Collection loan ID is required before saving a collection.",
      );
    }

    const now = new Date().toISOString();

    const newCollection: CollectionStorageRecord = {
      ...collection,

      // ------------------------------------------------------
      // Every collection transaction gets a unique ID.
      // ------------------------------------------------------

      id: createCollectionId(collection),

      // ------------------------------------------------------
      // STORAGE ENTITY
      //
      // Required by LOCAL / USB / future CLOUD persistence.
      // ------------------------------------------------------

      entity: COLLECTION_ENTITY,

      status: "Approved",

      // ------------------------------------------------------
      // AUTHORITATIVE SYSTEM AUDIT TIMESTAMPS
      //
      // receiptDate is the operational ERP Business Date.
      //
      // createdAt / updatedAt record when FINORA actually
      // persisted this Collection transaction.
      //
      // Caller-provided timestamps are intentionally ignored.
      // ------------------------------------------------------

      createdAt: now,

      updatedAt: now,
    };

    const result =
      await storageManager.save<CollectionStorageRecord>(newCollection);

    if (!result.success) {
      throw new Error(result.error ?? "Unable to save collection.");
    }

    // --------------------------------------------------------
    // Return the application record.
    //
    // The runtime object retains the internal id so an exact
    // transaction can be identified later without changing
    // the public TypeScript contract.
    // --------------------------------------------------------

    return toCollectionReviewData(newCollection);
  }

  // ==========================================================
  // UPDATE
  // ==========================================================
  //
  // IMPORTANT:
  //
  // Updates must target the exact Collection transaction.
  //
  // If the supplied record already contains an internal id,
  // use that exact ID.
  //
  // If it is an older record without an internal ID, attempt
  // to locate the matching persisted record using receipt
  // number first and loanId as a final compatibility fallback.
  //
  // Every updated storage record must also carry the
  // COLLECTION entity because USB persistence validates the
  // record itself rather than only the query.
  //
  // ==========================================================

  async update(
    collection: CollectionReviewData,
  ): Promise<CollectionReviewData> {
    if (!collection.loanId) {
      throw new Error(
        "Collection loan ID is required before updating a collection.",
      );
    }

    const runtimeCollection = collection as CollectionReviewData & {
      id?: string;
    };

    let collectionId = String(runtimeCollection.id ?? "").trim();

    // --------------------------------------------------------
    // Resolve an exact existing record when the application
    // object does not carry its repository ID.
    // --------------------------------------------------------

    if (!collectionId) {
      const allResult = await storageManager.getAll<CollectionStorageRecord>(
        buildCollectionQuery(),
      );

      if (allResult.success && allResult.data) {
        // ----------------------------------------------------
        // Receipt number is the strongest application-level
        // identifier available in the current contract.
        // ----------------------------------------------------

        const receiptNumber = String(collection.receiptNumber ?? "").trim();

        if (receiptNumber) {
          const receiptMatch = allResult.data.find(
            (record) =>
              String(record.receiptNumber ?? "").trim() === receiptNumber &&
              String(record.loanId ?? "") === String(collection.loanId),
          );

          if (receiptMatch) {
            collectionId = String(receiptMatch.id ?? "").trim();
          }
        }

        // ----------------------------------------------------
        // Legacy fallback:
        //
        // Match loanId + createdAt when no receipt match is
        // available.
        // ----------------------------------------------------

        if (!collectionId) {
          const createdAt = String(collection.createdAt ?? "").trim();

          const legacyMatch = allResult.data.find(
            (record) =>
              String(record.loanId ?? "") === String(collection.loanId) &&
              (!createdAt || String(record.createdAt ?? "") === createdAt),
          );

          if (legacyMatch) {
            collectionId = String(legacyMatch.id ?? "").trim();
          }
        }
      }
    }

    // --------------------------------------------------------
    // An old record may have used loanId itself as its storage
    // ID. Preserve compatibility for that case.
    // --------------------------------------------------------

    if (!collectionId) {
      collectionId = String(collection.loanId).trim();
    }

    if (!collectionId) {
      throw new Error("Collection storage ID could not be resolved.");
    }

    const updatedCollection: CollectionStorageRecord = {
      ...collection,

      id: collectionId,

      // ------------------------------------------------------
      // STORAGE ENTITY
      //
      // Required by USB update validation.
      // ------------------------------------------------------

      entity: COLLECTION_ENTITY,

      updatedAt: new Date().toISOString(),
    };

    const result =
      await storageManager.update<CollectionStorageRecord>(updatedCollection);

    if (!result.success) {
      throw new Error(result.error ?? "Unable to update collection.");
    }

    return toCollectionReviewData(updatedCollection);
  }

  // ==========================================================
  // FIND BY ID
  // ==========================================================
  //
  // Primary behavior:
  //
  // - Find the exact Collection transaction by storage ID.
  //
  // Compatibility behavior:
  //
  // - If no exact storage record exists, search by loanId.
  //
  // This keeps older callers functional while new records use
  // unique Collection identities.
  //
  // ==========================================================

  async findById(id: string): Promise<CollectionReviewData | null> {
    if (!id) {
      return null;
    }

    // --------------------------------------------------------
    // PRIMARY LOOKUP — EXACT COLLECTION STORAGE ID
    // --------------------------------------------------------

    const result = await storageManager.get<CollectionStorageRecord>(
      buildCollectionQuery(id),
    );

    if (result.success && result.data) {
      return toCollectionReviewData(result.data);
    }

    // --------------------------------------------------------
    // LEGACY COMPATIBILITY — LOAN ID
    // --------------------------------------------------------

    return findLegacyCollectionByLoanId(id);
  }

  // ==========================================================
  // DELETE
  // ==========================================================
  //
  // IMPORTANT:
  //
  // Delete an exact Collection transaction whenever a unique
  // Collection ID is supplied.
  //
  // If an old caller supplies a loanId, delete remains
  // compatible with the legacy repository behavior.
  //
  // New Collection workflows should use the exact Collection
  // ID whenever deletion is introduced.
  //
  // ==========================================================

  async delete(id: string): Promise<void> {
    if (!id) {
      return;
    }

    const result = await storageManager.delete(buildCollectionQuery(id));

    if (!result.success) {
      throw new Error(result.error ?? "Unable to delete collection.");
    }
  }
}

// ============================================================
// SINGLETON
// ============================================================

export const collectionRepository = new CollectionRepository();

// ============================================================
// END
// ============================================================
