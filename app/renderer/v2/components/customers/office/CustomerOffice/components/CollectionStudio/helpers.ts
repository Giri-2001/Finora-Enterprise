/* ===========================================================
   FINORA ENTERPRISE OS™
   COLLECTION STUDIO™

   HELPERS
=========================================================== */

import type { Loan } from "../../types";

import {
  DEFAULT_REVIEW_DATA,
  COLLECTION_STATUS,
} from "./constants";

import type {
  CollectionReviewData,
} from "./types";

/* ===========================================================
   GET INITIAL REVIEW DATA
=========================================================== */

export function getInitialReviewData(
  customerId?: string,
  customerName?: string,
  phoneNumber?: string,
): CollectionReviewData {
  return {
    ...DEFAULT_REVIEW_DATA,

    customerId: customerId ?? "",
    customerName: customerName ?? "",
    customerPhone: phoneNumber ?? "",
  };
}

/* ===========================================================
   BUILD REVIEW DATA FROM LOAN
=========================================================== */

export function buildReviewDataFromLoan(
  previous: CollectionReviewData,
  loan?: Loan,
): CollectionReviewData {
  return {
    ...previous,

    loanId: loan?.id ?? "",
    loanNumber: loan?.loanNumber ?? loan?.title ?? "",
    loanAmount: loan?.amount ?? 0,

    outstandingBalance: loan?.outstanding ?? 0,
  };
}

/* ===========================================================
   RESET COLLECTION FORM
=========================================================== */

export function resetCollectionForm(
  previous: CollectionReviewData,
): CollectionReviewData {
  return {
    ...previous,

    paymentAmount: 0,
    paymentMethod: "",
    paymentReference: "",

    remarks: "",

    receiptNumber: "",

    status: COLLECTION_STATUS.DRAFT,
  };
}
