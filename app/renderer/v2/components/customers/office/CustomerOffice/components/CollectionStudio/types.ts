/* ===========================================================
   FINORA ENTERPRISE OS™
   COLLECTION STUDIO™

   TYPES
=========================================================== */

import type {
  Loan,
} from "../../types";

/* ===========================================================
   PROPS
=========================================================== */

export interface CollectionStudioProps {
  customerName?: string;
  customerId?: string;
  phoneNumber?: string;
  loans?: Loan[];
}

/* ===========================================================
   REVIEW DATA
=========================================================== */

export interface CollectionReviewData {
  customerId: string;
  customerName: string;
  customerPhone: string;

  loanId: string;
  loanNumber: string;
  loanAmount: number;

  outstandingBalance: number;
  todayDue: number;
  previousDue: number;

  paymentAmount: number;
  paymentMethod: string;
  paymentReference: string;

  penaltyAmount: number;
  discountAmount: number;
  advanceAdjustment: number;

  remarks: string;

  receiptNumber: string;
  receiptDate: string;

  status: "Draft" | "Approved";

  createdAt: string;
  updatedAt: string;
}
