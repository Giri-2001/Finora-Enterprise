/* ===========================================================
   FINORA ENTERPRISE OS™
   REVIEW STUDIO™

   TYPES
=========================================================== */

export interface LoanReviewData {

  /* ==========================================
     CUSTOMER
  ========================================== */

  customerId?: string;

  customerName: string;

  phoneNumber?: string;

  /* ==========================================
     LOAN
  ========================================== */

  loanAmount: number;

  loanType: string;

  interestType: string;

  interestRate: number;

  repaymentType: string;

  duration: string;

  /* ==========================================
     FINANCE
  ========================================== */

  processingFee: number;

  advanceDeduction: number;

  netDisbursement: number;

  penaltyType: string;

  penaltyValue: number;

  /* ==========================================
     GUARANTOR
  ========================================== */

  guarantorName: string;

  guarantorPhone?: string;

  guarantorOccupation?: string;

  /* ==========================================
     SCHEDULE
  ========================================== */

  totalInstallments: number;

  /* ==========================================
     STATUS
  ========================================== */

  loanStatus: string;

}
