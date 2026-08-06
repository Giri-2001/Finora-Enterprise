/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   COLLECTION BUILDER
=========================================================== */

import type { CollectionReviewData } from "../../components/collections/CollectionReviewData";

/* ===========================================================
   COLLECTION BUILDER
=========================================================== */

export function buildCollection(
  reviewData: CollectionReviewData,
): CollectionReviewData {
  return {
    ...reviewData,
  };
}
