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

  /*
   * Original principal amount actually disbursed.
   *
   * IMPORTANT:
   *
   * This is the principal basis for System Generated
   * collection interest.
   *
   * EMI / installment amount is NOT used here.
   */

  loanAmount: number;

  /*
   * Current persisted loan outstanding value.
   *
   * Kept for the existing collection workflow.
   */

  outstandingBalance: number;

  /*
   * Monthly flat interest percentage attached to
   * the selected loan.
   */

  loanInterestRate: number;

  /*
   * Original loan date.
   *
   * Accrued interest is calculated from this date
   * through the current collection date.
   */

  loanDate: string;

  /*
   * Existing collection fields.
   *
   * These are intentionally retained for the
   * Collection Entry / EMI workflow.
   *
   * System Generated Step 3 does NOT use todayDue
   * as accrued interest.
   */

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

  /* ===========================================================
     COLLECTION TYPE
  =========================================================== */

  collectionType?: "emi" | "manual";
}

/* ===========================================================
   END
=========================================================== */
