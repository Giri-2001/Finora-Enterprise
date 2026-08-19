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

  /* ==========================================
     CUSTOMER IDENTITY
  ========================================== */

  id: string;

  name: string;

  phone: string;

    /*
   * Aadhaar search values.
   *
   * IMPORTANT:
   *
   * Only the first 6 digits and final 6 digits are exposed
   * to the Customer Office search layer.
   *
   * The complete Aadhaar number must never be exposed here.
   *
   * SEARCH CONTRACT:
   *
   * First 6 → exact 6-digit match
   * Last 6  → exact 6-digit match
   */

  aadhaarFirst6: string;

  aadhaarLast6: string;
  /*
   * ID CARD search value.
   *
   * IMPORTANT:
   *
   * Only the final 6 digits are exposed to the
   * Customer Office search layer.
   *
   * The full ID card number must never be required
   * by the search selector.
   */

  idCardLast6: string;

  /* ==========================================
     PROFILE
  ========================================== */

  photo?: string;

  branch: string;

  active: boolean;

  kycVerified: boolean;

  /* ==========================================
     CUSTOMER FINANCE
  ========================================== */

  outstandingAmount: number;

  nextCollectionDate: string;

  /* ==========================================
     RELATED DATA
  ========================================== */

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