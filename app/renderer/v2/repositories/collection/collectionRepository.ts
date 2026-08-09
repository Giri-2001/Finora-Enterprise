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
// - Preserve existing Collection behavior
// - Preserve loanId-based collection identity
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
// VERSION : 2.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  CollectionReviewData,
} from "../../components/collections/CollectionReviewData";

import {
  storageManager,
} from "../../storage/storageManager";

import type {
  StorageQuery,
  StorageResult,
} from "../../storage/storage.types";

// ============================================================
// CONSTANTS
// ============================================================

const COLLECTION_ENTITY =
  "COLLECTION";

// ============================================================
// COLLECTION STORAGE IDENTITY
// ============================================================
//
// IMPORTANT:
//
// Existing FINORA Collection behavior identifies records
// using loanId.
//
// We deliberately preserve that behavior in this migration.
//
// A separate collectionId is NOT introduced in this step.
//
// This avoids changing existing Collection workflows while
// the storage backbone is being migrated.
//
// ============================================================

function getCollectionId(
  collection: CollectionReviewData,
): string {

  return collection.loanId;
}

// ============================================================
// COLLECTION QUERY
// ============================================================

function buildCollectionQuery(
  id?: string,
): StorageQuery {

  return {
    entity:
      COLLECTION_ENTITY,

    id,
  };
}

// ============================================================
// COLLECTION REPOSITORY
// ============================================================

export class CollectionRepository {

  // ==========================================================
  // GET ALL
  // ==========================================================

  async getAll():
    Promise<CollectionReviewData[]> {

    try {

      const result =
        await storageManager.getAll<CollectionReviewData>(
          buildCollectionQuery(),
        );

      if (
        !result.success ||
        !result.data
      ) {

        return [];

      }

      return result.data;

    } catch {

      return [];

    }
  }

  // ==========================================================
  // SAVE
  // ==========================================================
  //
  // Existing behavior preserved:
  //
  // - Collection is automatically Approved.
  // - createdAt is preserved when supplied.
  // - updatedAt is always refreshed.
  //
  // ==========================================================

  async save(
    collection: CollectionReviewData,
  ): Promise<CollectionReviewData> {

    const collectionId =
      getCollectionId(
        collection,
      );

    if (!collectionId) {

      throw new Error(
        "Collection loan ID is required before saving a collection.",
      );

    }

    const existing =
      await storageManager.get<CollectionReviewData>(
        buildCollectionQuery(
          collectionId,
        ),
      );

    if (
      existing.success &&
      existing.data
    ) {

      throw new Error(
        "A collection with this loan ID already exists.",
      );

    }

    const now =
      new Date().toISOString();

    const newCollection:
      CollectionReviewData = {

      ...collection,

      status:
        "Approved",

      createdAt:
        collection.createdAt ||
        now,

      updatedAt:
        now,
    };

    const result =
      await storageManager.save<CollectionReviewData>(
        newCollection,
      );

    if (!result.success) {

      throw new Error(
        result.error ??
        "Unable to save collection.",
      );

    }

    return newCollection;
  }

  // ==========================================================
  // UPDATE
  // ==========================================================

  async update(
    collection: CollectionReviewData,
  ): Promise<CollectionReviewData> {

    const collectionId =
      getCollectionId(
        collection,
      );

    if (!collectionId) {

      throw new Error(
        "Collection loan ID is required before updating a collection.",
      );

    }

    const updatedCollection:
      CollectionReviewData = {

      ...collection,

      updatedAt:
        new Date().toISOString(),
    };

    const result =
      await storageManager.update<CollectionReviewData>(
        updatedCollection,
      );

    if (!result.success) {

      throw new Error(
        result.error ??
        "Unable to update collection.",
      );

    }

    return updatedCollection;
  }

  // ==========================================================
  // FIND BY ID
  // ==========================================================
  //
  // Existing repository behavior uses loanId as the lookup
  // identifier.
  //
  // ==========================================================

  async findById(
    id: string,
  ): Promise<CollectionReviewData | null> {

    if (!id) {

      return null;

    }

    const result =
      await storageManager.get<CollectionReviewData>(
        buildCollectionQuery(
          id,
        ),
      );

    if (
      !result.success
    ) {

      return null;

    }

    return (
      result.data ??
      null
    );
  }

  // ==========================================================
  // DELETE
  // ==========================================================
  //
  // Existing behavior:
  //
  // Delete the collection identified by loanId.
  //
  // ==========================================================

  async delete(
    id: string,
  ): Promise<void> {

    if (!id) {

      return;

    }

    const result =
      await storageManager.delete(
        buildCollectionQuery(
          id,
        ),
      );

    if (!result.success) {

      throw new Error(
        result.error ??
        "Unable to delete collection.",
      );

    }
  }
}

// ============================================================
// SINGLETON
// ============================================================

export const collectionRepository =
  new CollectionRepository();

// ============================================================
// END
// ============================================================
