/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER OFFICE™

   TYPES
=========================================================== */

import type { LoanInstallment } from "../../../loans/schedule/types";

import type { DocumentsStudioItem } from "../../../loans/documents/DocumentsStudio";

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

  /**
   * Authoritative repayment calculation method.
   *
   * This is separate from repaymentType, which represents
   * collection frequency such as MONTHLY / YEARLY.
   */
  interestType?: "fixed" | "reducing" | "interestOnly";

  processingFee: number;

  lateFee: number;

  /**
   * ERP operational date selected for the authenticated session.
   *
   * This may represent a historical Business Date.
   */
  loanDate: string;

  dueDate: string;

  /* ==========================================
     SYSTEM AUDIT TIMESTAMPS

     These timestamps represent when FINORA actually created
     or last updated the persisted Loan record.

     They must always come from the device system clock and
     must never be derived from loanDate or Login Business Date.

     Optional fields preserve compatibility with legacy Loans
     created before system audit timestamp support.
  ========================================== */

  createdAt?: string;

  updatedAt?: string;

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

  /**
   * Principal reductions collected outside normal EMI allocation.
   *
   * Each entry is part of the same Collection cash transaction;
   * it is not additional cash.
   */
  principalCurtailments?: Array<{
    amount: number;
    effectiveDate: string;
    receiptNumber?: string;
  }>;

  netDisbursement?: number;

  /* ==========================================
     NOTES
  ========================================== */

  purpose?: string;

  remarks?: string;

  /* ==========================================
     DOCUMENTS / EVIDENCE

     Documents uploaded inside the Loan Studio
     Documents Studio belong to this specific loan.

     IMPORTANT:

     - Customer documents are NOT mixed here.
     - These are loan-workspace documents.
     - Step 3 uploads are carried into the
       persisted Loan record.
     - Loan Details can read the same collection
       from this field.
  ========================================== */

  documents?: DocumentsStudioItem[];

  /*
   * Number of documents persisted with this loan.
   *
   * This is stored as lightweight metadata so consumers
   * such as Loan Details, reports and summaries can know
   * the document count without calculating it separately.
   */

  documentCount?: number;

  /*
   * Customer ownership metadata for the persisted
   * loan-document relationship.
   *
   * This must match the customerId associated with
   * the loan at the time the documents are persisted.
   */

  documentsCustomerId?: string;

  /*
   * Timestamp indicating when the loan documents were
   * linked to the persisted Loan record.
   */

  documentsLinkedAt?: string;

  /* ==========================================
     STATUS
  ========================================== */

  status: "ACTIVE" | "RUNNING" | "CLOSED";

  /* ==========================================
     REPAYMENT SCHEDULE
  ========================================== */

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

  onCustomerSelect?: (customer: OfficeCustomer) => void;
}

/* ===========================================================
   END
=========================================================== */
