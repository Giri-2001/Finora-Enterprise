/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   COLLECTION CONTROLLER
=========================================================== */

import {
  useCollection,
} from "../context/CollectionContext";

/* ===========================================================
   COLLECTION CONTROLLER
=========================================================== */

export function useCollectionController() {
  const {
    reviewData,
    onReviewDataChange,
  } = useCollection();

  /* ===========================================================
     GENERIC UPDATE
  =========================================================== */

  function updateReviewData(
    updates: Partial<typeof reviewData>,
  ) {
    onReviewDataChange({
      ...reviewData,
      ...updates,
    });
  }

  /* ===========================================================
     FIELD UPDATE
  =========================================================== */

  function updateField<
    K extends keyof typeof reviewData,
  >(
    field: K,
    value: typeof reviewData[K],
  ) {
    updateReviewData({
      [field]: value,
    } as Partial<typeof reviewData>);
  }

  return {
  /* ===========================================================
     DATA
  =========================================================== */

  reviewData,

  /* ===========================================================
     UPDATE
  =========================================================== */

  updateReviewData,

  updateField,

  /* ===========================================================
     DETAILS
  =========================================================== */

  updateCollectionDate(
    value: string,
  ) {
    updateField("receiptDate", value);
  },

  updateCollectionAmount(
    value: number,
  ) {
    updateField("paymentAmount", value);
  },

  updatePaymentMethod(
    value: string,
  ) {
    updateField("paymentMethod", value);
  },

  updateRemarks(
    value: string,
  ) {
    updateField("remarks", value);
  },
};
}
