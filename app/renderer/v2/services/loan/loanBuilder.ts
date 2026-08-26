/* ===========================================================
   FINORA ENTERPRISE OS™

   LOAN BUILDER™

   BUILDER
=========================================================== */

import type { Loan } from "../../components/customers/office/CustomerOffice/types";

import type { LoanInstallment } from "../../components/loans/schedule/types";

import type { DocumentsStudioItem } from "../../components/loans/documents/DocumentsStudio";

/* ===========================================================
   TYPES
=========================================================== */

export interface BuildLoanOptions {
  id: string;

  title: string;

  loanNumber?: string;

  amount: number;

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
     LOAN DETAILS
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
     DOCUMENTS / EVIDENCE
     
     Documents uploaded in Loan Studio
     Step 3 → Documents Studio belong to
     this specific Loan.
  ========================================== */

  documents?: DocumentsStudioItem[];

  /* ==========================================
     STATUS
  ========================================== */

  outstanding: number;

  schedule: LoanInstallment[];
}

/* ===========================================================
   BUILD LOAN
=========================================================== */

export function buildLoan(options: BuildLoanOptions): Loan {
  return {
    id: options.id,

    title: options.title,

    loanNumber: options.loanNumber ?? `FIN-LOAN-${Date.now()}`,

    amount: options.amount,

    outstanding: options.outstanding,

    interest: options.interest,

    processingFee: options.processingFee,

    lateFee: options.lateFee,

    loanDate: options.loanDate,

    dueDate: options.dueDate,

    guarantor: options.guarantor,

    /* ==========================================
       CUSTOMER
    ========================================== */

    customerId: options.customerId,

    customerName: options.customerName,

    phoneNumber: options.phoneNumber,

    /* ==========================================
       LOAN DETAILS
    ========================================== */

    loanType: options.loanType,

    repaymentType: options.repaymentType,

    duration: options.duration,

    durationType: options.durationType,

    /* ==========================================
       FINANCE
    ========================================== */

    advanceDeduction: options.advanceDeduction,

    netDisbursement: options.netDisbursement,

    /* ==========================================
       NOTES
    ========================================== */

    purpose: options.purpose,

    remarks: options.remarks,

    /* ==========================================
       DOCUMENTS / EVIDENCE

       Keep the exact documents uploaded for
       this Loan Studio workspace.
    ========================================== */

    documents: options.documents ?? [],

    /* ==========================================
       STATUS
    ========================================== */

    status: "ACTIVE",

    schedule: options.schedule,
  };
}

/* ===========================================================
   END
=========================================================== */
