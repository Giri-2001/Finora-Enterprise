/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER OFFICE™

   TYPES
=========================================================== */

import type {
  LoanInstallment,
} from "../../../loans/schedule/types";

/* ===========================================================
   LOAN
=========================================================== */

export interface Loan {

  id: string;

  title: string;

  loanNumber: string;

  amount: number;

  outstanding: number;

  interest: number;

  processingFee: number;

  lateFee: number;

  loanDate: string;

  dueDate: string;

guarantor: string;

/* ==========================================
   CUSTOMER
========================================== */

customerId?: string;

customerName?: string;

phoneNumber?: string;

/* ==========================================
   LOAN
========================================== */

loanType?: string;

repaymentType?: string;

duration?: number;

durationType?: string;

/* ==========================================
   FINANCE
========================================== */

advanceDeduction?: number;

netDisbursement?: number;

/* ==========================================
   NOTES
========================================== */

purpose?: string;

remarks?: string;

/* ==========================================
   STATUS
========================================== */

status: "ACTIVE" | "RUNNING" | "CLOSED";

schedule?: LoanInstallment[];

}

/* ===========================================================
   COLLECTION
=========================================================== */

export interface Collection {

  id: string;

  amount: number;

  paymentDate: string;

  receiptNumber: string;

}

/* ===========================================================
   CUSTOMER
=========================================================== */

export interface OfficeCustomer {

  id: string;

  name: string;

  phone: string;

  photo?: string;

  branch: string;

  active: boolean;

  kycVerified: boolean;

  outstandingAmount: number;

  nextCollectionDate: string;

  loans?: Loan[];

  collections?: Collection[];

}

/* ===========================================================
   COMPONENT PROPS
=========================================================== */

export interface CustomerOfficeProps {

  /* Current customer on desk */

  selectedCustomer?: OfficeCustomer;

  /* Future ready */

  customers?: OfficeCustomer[];

  onCustomerSelect?: (

    customer: OfficeCustomer,

  ) => void;

}
