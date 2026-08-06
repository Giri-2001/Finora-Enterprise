/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   COLLECTION SERVICE
=========================================================== */

import type { CollectionReviewData } from "../../components/collections/CollectionReviewData";

import { buildCollection } from "./collectionBuilder";

import {
  collectionRepository,
} from "../../repositories/collection/collectionRepository";

/* ===========================================================
   COLLECTION SERVICE
=========================================================== */

export async function approveCollection(
  reviewData: CollectionReviewData,
): Promise<CollectionReviewData> {
  const collection = buildCollection(
    reviewData,
  );

  return collectionRepository.save(
    collection,
  );
}

export async function updateCollection(
  reviewData: CollectionReviewData,
): Promise<CollectionReviewData> {
  const collection = buildCollection(
    reviewData,
  );

  return collectionRepository.update(
    collection,
  );
}

export async function loadCollection(
  id: string,
) {
  return collectionRepository.findById(
    id,
  );
}
