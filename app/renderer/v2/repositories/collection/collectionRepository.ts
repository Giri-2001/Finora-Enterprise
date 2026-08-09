// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTIONS ENGINE
//
// V2 COLLECTION REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist CollectionReviewData through StorageManager
// - Preserve existing Collection business behavior
// - Keep Collection identity behavior based on loanId
// - Keep physical storage implementation outside Collections
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - No Collection UI logic.
// - No Loan business calculations.
// - No Payment business logic.
// - Storage access goes through StorageManager.
//
// NOTE:
//
// Existing Collection records currently use loanId for
// find/update/delete behavior. This migration intentionally
// preserves that behavior.
//
// A storage-only `id` is added so the common StorageManager
// has a stable persistence identity without changing the
// public CollectionReviewData model.
//
// VERSION : 2.0
// STATUS  : Production
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
  StorageResult,
} from "../../storage/storage.types";


// ============================================================
// CONSTANTS
// ============================================================

const COLLECTION_ENTITY =
  "COLLECTION";


// ============================================================
// STORAGE RECORD
// ============================================================
//
// Storage-only representation.
//
// `id` is intentionally NOT exposed to Collection UI logic.
// `loanId` remains the existing Collection business identity.
//
// ============================================================

interface CollectionStorageRecord
  extends CollectionReviewData {

  id: string;

}


// ============================================================
// STORAGE ID BUILDER
// ============================================================
//
// Each Collection persistence record needs a unique physical
// storage identity.
//
// Existing Collection behavior still uses loanId for public
// lookup/update/delete operations.
//
// ============================================================

function buildStorageId(
  collection: CollectionReviewData,
):
  string {

  const receiptNumber =
    collection.receiptNumber;


  if (
    receiptNumber
  ) {

    return receiptNumber;

  }


  return [
    collection.loanId,
    collection.createdAt ??
      new Date().toISOString(),
  ].join("_");

}


// ============================================================
// TO STORAGE RECORD
// ============================================================

function toStorageRecord(
  collection: CollectionReviewData,
):
  CollectionStorageRecord {

  return {

    ...collection,

    id:
      buildStorageId(
        collection,
      ),

  };

}


// ============================================================
// FROM STORAGE RECORD
// ============================================================

function fromStorageRecord(
  record: CollectionStorageRecord,
):
  CollectionReviewData {

  const {
    id: _storageId,
    ...collection
  } = record;


  return collection;

}


// ============================================================
// GET ALL
// ============================================================

export class CollectionRepository {

  // ==========================================================
  // GET ALL
  // ==========================================================

  async getAll():
    Promise<CollectionReviewData[]> {

    try {

      const result =
        await storageManager.getAll<CollectionStorageRecord>({
          entity:
            COLLECTION_ENTITY,
        });


      if (
        !result.success ||
        !result.data
      ) {

        return [];

      }


      return result.data.map(
        fromStorageRecord,
      );

    } catch {

      return [];

    }

  }


  // ==========================================================
  // SAVE
  // ==========================================================

  async save(
    collection: CollectionReviewData,
  ):
    Promise<CollectionReviewData> {

    const newCollection:
      CollectionReviewData = {

      ...collection,

      status:
        "Approved",

      createdAt:
        collection.createdAt ||
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),

    };


    const storageRecord =
      toStorageRecord(
        newCollection,
      );


    const result =
      await storageManager.save<CollectionStorageRecord>(
        storageRecord,
      );


    if (
      !result.success
    ) {

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
  //
  // Existing behavior:
  //
  // item.loanId === collection.loanId
  //
  // We preserve that behavior instead of changing the
  // Collection business identity during this migration.
  //
  // ==========================================================

  async update(
    collection: CollectionReviewData,
  ):
    Promise<CollectionReviewData> {

    const collections =
      await this.getAll();


    const existing =
      collections.find(
        (item) =>
          item.loanId ===
          collection.loanId,
      );


    if (
      !existing
    ) {

      throw new Error(
        "Collection record was not found.",
      );

    }


    const updatedCollection:
      CollectionReviewData = {

      ...collection,

      createdAt:
        collection.createdAt ||
        existing.createdAt,

      updatedAt:
        new Date().toISOString(),

    };


    const updatedStorageRecord =
      toStorageRecord(
        updatedCollection,
      );


    const storageRecords =
      collections.map(
        (item) => {

          if (
            item.loanId !==
            collection.loanId
          ) {

            return toStorageRecord(
              item,
            );

          }


          return updatedStorageRecord;

        },
      );


    const result =
      await storageManager.replaceAll(
        storageRecords,
      );


    if (
      !result.success
    ) {

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
  // Public lookup remains based on loanId.
  //
  // This intentionally preserves the existing Collection
  // engine behavior.
  //
  // ==========================================================

  async findById(
    id: string,
  ):
    Promise<CollectionReviewData | null> {

    if (
      !id
    ) {

      return null;

    }


    const collections =
      await this.getAll();


    return (
      collections.find(
        (item) =>
          item.loanId ===
          id,
      )
      ??
      null
    );

  }


  // ==========================================================
  // DELETE
  // ==========================================================
  //
  // Existing behavior deletes by loanId.
  //
  // Preserve that behavior for this migration.
  //
  // ==========================================================

  async delete(
    id: string,
  ):
    Promise<void> {

    if (
      !id
    ) {

      return;

    }


    const collections =
      await this.getAll();


    const filtered =
      collections.filter(
        (item) =>
          item.loanId !==
          id,
      );


    const storageRecords =
      filtered.map(
        toStorageRecord,
      );


    const result =
      await storageManager.replaceAll(
        storageRecords,
      );


    if (
      !result.success
    ) {

      throw new Error(
        result.error ??
        "Unable to delete collection.",
      );

    }

  }


  // ==========================================================
  // REPLACE ALL
  // ==========================================================
  //
  // Used by future Collection migration/import workflows.
  //
  // ==========================================================

  async replaceAll(
    collections: CollectionReviewData[],
  ):
    Promise<StorageResult> {

    if (
      !collections.length
    ) {

      return {
        success: true,
      };

    }


    const storageRecords =
      collections.map(
        toStorageRecord,
      );


    return storageManager.replaceAll(
      storageRecords,
    );

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
