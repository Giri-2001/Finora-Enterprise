/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   COLLECTION CONTEXT
=========================================================== */

import { createContext, useContext } from "react";

import type { CollectionReviewData } from "../CollectionReviewData";

/* ===========================================================
   TYPES
=========================================================== */

export interface CollectionContextValue {
  reviewData: CollectionReviewData;

  onReviewDataChange(reviewData: CollectionReviewData): void;
}

/* ===========================================================
   CONTEXT
=========================================================== */

export const CollectionContext = createContext<CollectionContextValue | null>(
  null,
);

/* ===========================================================
   HOOK
=========================================================== */

export function useCollection() {
  const context = useContext(CollectionContext);

  if (!context) {
    throw new Error(
      "useCollection must be used inside CollectionContext.Provider",
    );
  }

  return context;
}
