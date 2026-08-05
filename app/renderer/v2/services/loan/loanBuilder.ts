/* ===========================================================
   FINORA ENTERPRISE OS™
   LOAN BUILDER™

   BUILDER
=========================================================== */

import type {
  Loan,
} from "../../components/customers/office/CustomerOffice/types";

import type {
  LoanInstallment,
} from "../../components/loans/schedule/types";

/* ===========================================================
   TYPES
=========================================================== */

export interface BuildLoanOptions {

  id: string;

  title: string;

  amount: number;

  interest: number;

  processingFee: number;

  lateFee: number;

  loanDate: string;

  dueDate: string;

  guarantor: string;

  customerId?: string;

customerName?: string;

phoneNumber?: string;

loanType?: string;

repaymentType?: string;

duration?: number;

durationType?: string;

advanceDeduction?: number;

netDisbursement?: number;

purpose?: string;

remarks?: string;

  outstanding: number;

  schedule: LoanInstallment[];

}

/* ===========================================================
   BUILD LOAN
=========================================================== */

export function buildLoan(

  options: BuildLoanOptions,

): Loan {

  return {

    id: options.id,

    title: options.title,

    amount: options.amount,

    outstanding: options.outstanding,

    interest: options.interest,

    processingFee: options.processingFee,

    lateFee: options.lateFee,

    loanDate: options.loanDate,

    dueDate: options.dueDate,

    guarantor: options.guarantor,

    customerId: options.customerId,

customerName: options.customerName,

phoneNumber: options.phoneNumber,

loanType: options.loanType,

repaymentType: options.repaymentType,

duration: options.duration,

durationType: options.durationType,

advanceDeduction: options.advanceDeduction,

netDisbursement: options.netDisbursement,

purpose: options.purpose,

remarks: options.remarks,

    status: "ACTIVE",

    schedule: options.schedule,

  };

}
