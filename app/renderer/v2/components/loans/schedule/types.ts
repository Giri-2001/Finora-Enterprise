/* ===========================================================
   FINORA ENTERPRISE OS™
   PAYMENT SCHEDULE ENGINE™

   TYPES
=========================================================== */

/* ===========================================================
   INSTALLMENT STATUS
=========================================================== */

export type InstallmentStatus =

  | "Pending"

  | "Paid"

  | "Partial"

  | "Overdue";

/* ===========================================================
   LOAN INSTALLMENT
=========================================================== */

export interface LoanInstallment {

  installmentNumber: number;

  dueDate: string;

  installmentAmount: number;

  principalAmount: number;

  interestAmount: number;

  outstandingBalance: number;

  paidAmount: number;

  penaltyAmount: number;

  receiptNumber?: string;

  paidDate?: string;

  status: InstallmentStatus;

}
