/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   COLLECTION STUDIO
=========================================================== */

import { useState } from "react";

import type { CollectionReviewData } from "./CollectionReviewData";

import CollectionWizard from "./CollectionWizard";

import { CollectionContext } from "./context/CollectionContext";

/* ===========================================================
   COLLECTION STUDIO
=========================================================== */

export default function CollectionStudio() {
  const [reviewData, setReviewData] = useState<CollectionReviewData>({
    customerId: "",

    customerName: "",

    customerPhone: "",

    loanId: "",

    loanNumber: "",

    loanInterestRate: 0,

    loanDate: "",

    loanAmount: 0,

    outstandingBalance: 0,

    todayDue: 0,

    previousDue: 0,

    paymentAmount: 0,

    paymentMethod: "",

    paymentReference: "",

    penaltyAmount: 0,

    discountAmount: 0,

    advanceAdjustment: 0,

    remarks: "",

    collectionNumber: "",

    receiptNumber: "",

    receiptDate: "",

    status: "Draft",

    createdAt: "",

    updatedAt: "",
  });

  void reviewData;

  return (
    <CollectionContext.Provider
      value={{
        reviewData,
        onReviewDataChange: setReviewData,
      }}
    >
      <CollectionWizard />
    </CollectionContext.Provider>
  );
}
