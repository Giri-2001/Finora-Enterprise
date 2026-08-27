/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   COLLECTION REVIEW DATA
=========================================================== */

/* ===========================================================
   COLLECTION REVIEW DATA
=========================================================== */

export interface CollectionReviewData {
  /* ===========================================================
     CUSTOMER
  =========================================================== */

  customerId: string;

  customerName: string;

  customerPhone: string;

  /* ===========================================================
     LOAN
  =========================================================== */

  loanId: string;

  loanNumber: string;

  loanAmount: number;

  outstandingBalance: number;

  todayDue: number;

  previousDue: number;

  /* ===========================================================
     PAYMENT
  =========================================================== */

  paymentAmount: number;

  paymentMethod: string;

  paymentReference: string;

  /* ===========================================================
     SETTLEMENT
  =========================================================== */

  penaltyAmount: number;

  discountAmount: number;

  advanceAdjustment: number;

  remarks: string;

  /* ===========================================================
     RECEIPT
  =========================================================== */

  receiptNumber: string;

  receiptDate: string;

  /* ===========================================================
     REVIEW
  =========================================================== */

  status: "Draft" | "Approved";

  createdAt: string;

  updatedAt: string;

  collectionType?: "emi" | "manual";
}
