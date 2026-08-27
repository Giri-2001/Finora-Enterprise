// FINORA ENTERPRISE OS™
//
// COLLECTIONS ENGINE™
//
// COLLECTION SERVICE
//
// RESPONSIBILITY
//
// - Provide application-level Collection service boundary
// - Build and persist collection records
// - Load persisted collection records
// - Keep Collection UI independent from repositories
// - Keep StorageManager details outside UI code
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CollectionReviewData } from "../../components/collections/CollectionReviewData";

import { buildCollection } from "./collectionBuilder";

import { collectionRepository } from "../../repositories/collection/collectionRepository";

// ============================================================
// APPROVE COLLECTION
// ============================================================

export async function approveCollection(
  reviewData: CollectionReviewData,
): Promise<CollectionReviewData> {
  const collection = buildCollection(reviewData);

  return collectionRepository.save(collection);
}

// ============================================================
// UPDATE COLLECTION
// ============================================================

export async function updateCollection(
  reviewData: CollectionReviewData,
): Promise<CollectionReviewData> {
  const collection = buildCollection(reviewData);

  return collectionRepository.update(collection);
}

// ============================================================
// LOAD ALL COLLECTIONS
// ============================================================
//
// Collection History uses this service boundary and then
// selects records belonging to the currently selected loan.
//
// No UI or persistence logic is exposed to the component.
// ============================================================

export async function loadCollections(): Promise<CollectionReviewData[]> {
  return collectionRepository.getAll();
}

// ============================================================
// LOAD SINGLE COLLECTION
// ============================================================

export async function loadCollection(
  id: string,
): Promise<CollectionReviewData | null> {
  return collectionRepository.findById(id);
}

// ============================================================
// END
// ============================================================
