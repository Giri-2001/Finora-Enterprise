/* ===========================================================
   FINORA ENTERPRISE OS™
   COLLECTION STUDIO™

   CONSTANTS
=========================================================== */

import type { CollectionReviewData } from "./types";

/* ===========================================================
   LABELS
=========================================================== */

export const COLLECTION_STUDIO_LABELS = {
  SELECT_LOAN: "Select Loan",
} as const;

/* ===========================================================
   STATUS
=========================================================== */

export const COLLECTION_STATUS = {
  DRAFT: "Draft",
  APPROVED: "Approved",
} as const;

/* ===========================================================
   DEFAULT REVIEW DATA
=========================================================== */

export const DEFAULT_REVIEW_DATA: CollectionReviewData = {
  customerId: "",
  customerName: "",
  customerPhone: "",

  loanId: "",
  loanNumber: "",
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

  receiptNumber: "",
  receiptDate: "",

  status: COLLECTION_STATUS.DRAFT,

  createdAt: "",
  updatedAt: "",
};
